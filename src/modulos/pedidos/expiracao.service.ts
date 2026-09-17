import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { Pedido, Conciliacao, Auditoria } from '../../database/entities';
import {
  CategoriaFalha,
  FalhaConciliacao,
  falhasConciliacao,
  intervaloTentativa,
} from '../../common/conciliacao';
import { ListaDto } from '../clientes/clientes.dto';
import { PedidosService } from './pedidos.service';

@Injectable()
export class ExpiracaoService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private timer?: ReturnType<typeof setInterval>;
  private executando = false;
  private encerrando = false;
  private readonly logger = new Logger(ExpiracaoService.name);
  constructor(
    private db: DataSource,
    private pedidos: PedidosService,
  ) {}
  onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => {
      void this.executar();
    }, 30000);
    this.timer.unref();
    void this.executar();
  }
  onApplicationShutdown() {
    this.encerrando = true;
    if (this.timer) clearInterval(this.timer);
  }
  private pendente(p: Pedido | null, agora: Date) {
    return (
      p &&
      p.status === 'analysis' &&
      p.pagamentoStatus === 'pending' &&
      p.formaPagamento.startsWith('Pagamento online') &&
      p.pagamentoExpiraEm &&
      p.pagamentoExpiraEm <= agora
    );
  }
  private bloquear(m: EntityManager, id: number) {
    return m
      .getRepository(Conciliacao)
      .createQueryBuilder('c')
      .where('c.pedidoId=:id', { id })
      .setLock('pessimistic_write')
      .getOne();
  }
  private async iniciar(id: number, agora: Date) {
    return this.db.transaction(async (m) => {
      const c = await this.bloquear(m, id);
      if (
        !c ||
        c.resolvidoEm ||
        c.proximaTentativaEm > agora ||
        (c.emExecucaoAte && c.emExecucaoAte > agora)
      )
        return null;
      const p = await m.findOneBy(Pedido, { id });
      if (!this.pendente(p, agora)) return null;
      // A reserva temporária da execução persiste após reinícios e expira se um processo cair.
      c.execucaoToken = randomUUID();
      c.emExecucaoAte = new Date(agora.getTime() + 120000);
      c.ultimaTentativaEm = agora;
      c.tentativas++;
      await m.save(c);
      await m.save(Auditoria, {
        usuarioId: null,
        acao: 'conciliacao.iniciada',
        recurso: String(id),
        dados: { tentativa: c.tentativas },
      });
      return c.execucaoToken;
    });
  }
  async processarPedido(id: number, agora = new Date()) {
    const token = await this.iniciar(id, agora);
    if (!token) return false;
    let falha: CategoriaFalha | undefined;
    try {
      await this.pedidos.expirar(id, agora, token);
    } catch (error) {
      falha = error instanceof FalhaConciliacao ? error.categoria : 'interno';
    }
    await this.db.transaction(async (m) => {
      const c = await this.bloquear(m, id);
      // Um processo cujo prazo terminou nunca sobrescreve o resultado do novo responsável.
      if (!c || c.execucaoToken !== token) return;
      const fim = new Date(Math.max(Date.now(), agora.getTime()));
      const p = await m.findOneBy(Pedido, { id });
      const resolvido =
        !p || p.status !== 'analysis' || p.pagamentoStatus !== 'pending';
      if (falha && !resolvido) {
        c.falhasConsecutivas++;
        c.ultimaFalhaCategoria = falha;
        c.ultimaFalhaEm = fim;
        c.proximaTentativaEm = new Date(
          fim.getTime() + intervaloTentativa(c.falhasConsecutivas),
        );
      } else {
        c.falhasConsecutivas = 0;
        c.ultimoSucessoEm = fim;
        c.resolvidoEm = resolvido ? fim : null;
        c.proximaTentativaEm =
          p?.pagamentoExpiraEm && p.pagamentoExpiraEm > fim
            ? p.pagamentoExpiraEm
            : new Date(fim.getTime() + 30000);
      }
      c.execucaoToken = null;
      c.emExecucaoAte = null;
      await m.save(c);
      await m.save(Auditoria, {
        usuarioId: null,
        acao:
          falha && !resolvido ? 'conciliacao.falhou' : 'conciliacao.concluida',
        recurso: String(id),
        dados: {
          tentativa: c.tentativas,
          categoria: falha && !resolvido ? falha : null,
        },
      });
    });
    return true;
  }
  async executar(agora = new Date()) {
    if (this.executando || this.encerrando) return;
    this.executando = true;
    try {
      const fila = await this.db
        .getRepository(Conciliacao)
        .createQueryBuilder('c')
        .innerJoin('c.pedido', 'p')
        .where("p.status='analysis' AND p.pagamentoStatus='pending'")
        .andWhere('p.pagamentoExpiraEm <= :agora', { agora })
        .andWhere('c.resolvidoEm IS NULL AND c.proximaTentativaEm <= :agora', {
          agora,
        })
        .andWhere('(c.emExecucaoAte IS NULL OR c.emExecucaoAte <= :agora)', {
          agora,
        })
        .orderBy('c.proximaTentativaEm', 'ASC')
        .addOrderBy('c.pedidoId', 'ASC')
        .take(50)
        .getMany();
      let index = 0;
      await Promise.all(
        Array.from({ length: Math.min(4, fila.length) }, async () => {
          while (!this.encerrando) {
            const item = fila[index++];
            if (!item) break;
            try {
              await this.processarPedido(
                item.pedidoId,
                new Date(Math.max(Date.now(), agora.getTime())),
              );
            } catch {
              this.logger.warn(
                `Não foi possível registrar a tentativa do pedido ${item.pedidoId}; a reserva foi preservada.`,
              );
            }
          }
        }),
      );
    } catch {
      this.logger.error('Não foi possível verificar a fila de conciliação.');
    } finally {
      this.executando = false;
    }
  }
  async listar(q: ListaDto) {
    const agora = new Date();
    const base = this.db
      .getRepository(Conciliacao)
      .createQueryBuilder('c')
      .innerJoin('c.pedido', 'p')
      .where("p.status='analysis' AND p.pagamentoStatus='pending'")
      .andWhere('p.pagamentoExpiraEm <= :agora', { agora });
    const total = await base.getCount();
    const rows = await base
      .select([
        'c.pedidoId AS pedidoId',
        'c.tentativas AS tentativas',
        'c.falhasConsecutivas AS falhasConsecutivas',
        'c.ultimaFalhaCategoria AS categoria',
        'c.ultimaTentativaEm AS ultimaTentativaEm',
        'c.ultimaFalhaEm AS ultimaFalhaEm',
        'c.ultimoSucessoEm AS ultimoSucessoEm',
        'c.proximaTentativaEm AS proximaTentativaEm',
        'c.emExecucaoAte AS emExecucaoAte',
        'c.ultimaSolicitacaoEm AS ultimaSolicitacaoEm',
        'p.pagamentoExpiraEm AS vencimento',
        'p.totalCentavos AS totalCentavos',
      ])
      .orderBy('p.pagamentoExpiraEm', 'ASC')
      .addOrderBy('c.pedidoId', 'ASC')
      .offset((q.page - 1) * q.limit)
      .limit(q.limit)
      .getRawMany();
    return {
      total,
      page: q.page,
      limit: q.limit,
      items: rows.map((row) => {
        const emExecucao =
          !!row.emExecucaoAte && new Date(row.emExecucaoAte) > agora;
        const podeSolicitarEm = row.ultimaSolicitacaoEm
          ? new Date(new Date(row.ultimaSolicitacaoEm).getTime() + 60000)
          : null;
        return {
          pedidoId: row.pedidoId,
          valor: row.totalCentavos / 100,
          tentativas: row.tentativas,
          falhasConsecutivas: row.falhasConsecutivas,
          categoria: row.categoria,
          mensagem:
            falhasConciliacao[row.categoria] ??
            'Aguardando verificação do pagamento.',
          vencimento: row.vencimento,
          pendenteHaSegundos: Math.max(
            0,
            Math.floor(
              (agora.getTime() - new Date(row.vencimento).getTime()) / 1000,
            ),
          ),
          ultimaTentativaEm: row.ultimaTentativaEm,
          ultimaFalhaEm: row.ultimaFalhaEm,
          ultimoSucessoEm: row.ultimoSucessoEm,
          proximaTentativaEm: row.proximaTentativaEm,
          emExecucao,
          podeSolicitarEm,
          podeTentar:
            !emExecucao && (!podeSolicitarEm || podeSolicitarEm <= agora),
        };
      }),
    };
  }
  async solicitar(id: number, usuarioId: number) {
    return this.db.transaction(async (m) => {
      const c = await this.bloquear(m, id);
      const agora = new Date();
      const p = await m.findOneBy(Pedido, { id });
      if (!c || !this.pendente(p, agora))
        throw new NotFoundException(
          'Não há conciliação pendente para este pedido.',
        );
      if (c.emExecucaoAte && c.emExecucaoAte > agora)
        throw new ConflictException('Este pedido já está sendo verificado.');
      if (
        c.ultimaSolicitacaoEm &&
        agora.getTime() - c.ultimaSolicitacaoEm.getTime() < 60000
      )
        throw new ConflictException(
          'Aguarde um minuto antes de solicitar novamente.',
        );
      c.ultimaSolicitacaoEm = agora;
      c.proximaTentativaEm = agora;
      c.resolvidoEm = null;
      await m.save(c);
      await m.save(Auditoria, {
        usuarioId,
        acao: 'conciliacao.solicitada',
        recurso: String(id),
        dados: {},
      });
      return {
        message: 'Nova verificação agendada.',
        proximaTentativaEm: agora,
      };
    });
  }
}
