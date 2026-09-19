import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { createHash } from 'crypto';
import {
  Usuario,
  Pedido,
  PedidoItem,
  Produto,
  Cupom,
  CupomUso,
  Estoque,
  BeneficioMovimento,
  Auditoria,
  Premio,
  PdvRascunho,
  Endereco,
  Conciliacao,
} from '../../database/entities';
import { CatalogoService } from '../catalogo/catalogo.service';
import { ClientesService } from '../clientes/clientes.service';
import { centavos, dataLoja } from '../../common/money';
import { CarrinhoDto, ItemDto, PdvDto, EditarPedidoDto } from './pedidos.dto';
import { FalhaConciliacao } from '../../common/conciliacao';
import { ListaDto } from '../clientes/clientes.dto';

import { PagamentosService } from '../pagamentos/pagamentos.service';

const ENDERECO = {
  id: 1,
  favorite: true,
  apelido: 'Retirada no local',
  rua: 'Rua Hélio Laudelino da Silva',
  numero: '41',
  bairro: 'Bom Viver - Biguaçu',
  cep: '',
  complemento: '',
  referencia: 'Assados Zanini',
};
@Injectable()
export class PedidosService {
  constructor(
    private db: DataSource,
    private catalogo: CatalogoService,
    private clientes: ClientesService,
    private pagamentos: PagamentosService,
  ) {}
  async usuarioLock(m: EntityManager, id: number) {
    const user = await m
      .getRepository(Usuario)
      .createQueryBuilder('u')
      .where('u.id=:id', { id })
      .setLock('pessimistic_write')
      .getOne();
    if (!user || !user.ativo)
      throw new NotFoundException('Cliente não encontrado.');
    return user;
  }
  async rascunho(m: EntityManager, usuarioId: number) {
    let p = await m.findOneBy(Pedido, { usuarioId, status: 'carrinho' });
    if (!p)
      p = await m.save(
        Pedido,
        m.create(Pedido, {
          usuarioId,
          status: 'carrinho',
          endereco: {},
          reserva: [],
        }),
      );
    return p;
  }
  async carrinho(id: number) {
    return this.db.transaction(async (m) => {
      await this.usuarioLock(m, id);
      return this.formatar(m, await this.rascunho(m, id));
    });
  }
  async formatar(m: EntityManager, p: Pedido) {
    const items = await m.find(PedidoItem, {
      where: { pedidoId: p.id },
      order: { id: 'ASC' },
    });
    const coupon = p.cupomId
      ? await m.findOneBy(Cupom, { id: p.cupomId })
      : null;
    const safe = { ...p };
    delete safe.usuario;
    return {
      ...safe,
      cashBack: p.cashbackCentavos / 100,
      valorTotalPedido: p.subtotalCentavos / 100,
      valorFinal: p.totalCentavos / 100,
      descontoCupom: p.descontoCentavos / 100,
      taxaEntrega: p.taxaEntregaCentavos / 100,
      tipoRecebimento: p.canal === 'entrega' ? 'delivery' : 'pickup',
      cupom: coupon ? this.clientes.cupomPublico(coupon) : null,
      itens: items.map((i) => ({
        id: i.id,
        quantidade: i.quantidade,
        obs: i.obs,
        valor: (i.precoUnitarioCentavos * i.quantidade) / 100,
        valorAdicionais: 0,
        produto: i.snapshot,
        ingredientes: i.snapshot.ingredientes ?? [],
        adicionais: i.snapshot.adicionais ?? [],
      })),
    };
  }
  async montarItem(m: EntityManager, pedidoId: number, d: ItemDto) {
    const p = await m.findOne(Produto, {
      where: { id: d.produtoId, ativo: true, esgotado: false },
      relations: { categoria: true },
    });
    if (!p || !p.categoria.ativa)
      throw new BadRequestException('Produto indisponível.');
    if (d.quantidade > p.limite)
      throw new BadRequestException(
        `Limite de ${p.limite} unidades para ${p.titulo}.`,
      );
    const adicionalIds = new Set(d.adicionais ?? []);
    if (adicionalIds.size !== (d.adicionais ?? []).length)
      throw new BadRequestException('Adicionais repetidos.');
    const adicionais = (p.adicionais ?? []).filter((a) =>
      adicionalIds.has(a.id),
    );
    if (adicionais.length !== adicionalIds.size)
      throw new BadRequestException('Adicional não permitido para o produto.');
    const ingredientes =
      d.ingredientes === undefined
        ? p.ingredientes
        : p.ingredientes.filter((i) => d.ingredientes.includes(i.id));
    if (
      d.ingredientes?.some((id) => !p.ingredientes.some((i) => i.id === id)) ||
      p.ingredientes.some(
        (i) => !i.removivel && !ingredientes.some((s) => s.id === i.id),
      )
    )
      throw new BadRequestException('Ingredientes inválidos.');
    const substituicoes = (d.substituicoes ?? []).map((s) => {
      const remover = p.ingredientes.find((i) => i.id === s.removerId),
        adicionar = p.ingredientes.find((i) => i.id === s.adicionarId);
      if (
        !remover?.removivel ||
        !adicionar ||
        ingredientes.some((i) => i.id === s.removerId) ||
        adicionar.valor > remover.valor
      )
        throw new BadRequestException(
          'Substituição de ingrediente não permitida.',
        );
      return { ...s, remover: remover.nome, adicionar: adicionar.nome };
    });
    if (
      new Set(substituicoes.map((s) => s.removerId)).size !==
      substituicoes.length
    )
      throw new BadRequestException('Substituições repetidas.');
    const unit =
      p.precoCentavos +
      adicionais.reduce((sum, a) => sum + centavos(a.valor), 0);
    return m.create(PedidoItem, {
      pedidoId,
      produtoId: p.id,
      quantidade: d.quantidade,
      obs: d.obs ?? '',
      precoUnitarioCentavos: unit,
      snapshot: {
        ...this.catalogo.publico(p),
        ingredientes,
        adicionais,
        substituicoes,
      },
    });
  }
  async recalcular(m: EntityManager, p: Pedido, u: Usuario, finalizar = false) {
    const items = await m.find(PedidoItem, { where: { pedidoId: p.id } });
    if (finalizar) {
      for (const item of items) {
        const fresh = await this.montarItem(m, p.id, {
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          obs: item.obs,
          adicionais: (item.snapshot.adicionais ?? []).map((a) => a.id),
          ingredientes: (item.snapshot.ingredientes ?? []).map((a) => a.id),
          substituicoes: (item.snapshot.substituicoes ?? []).map(
            ({ removerId, adicionarId }) => ({ removerId, adicionarId }),
          ),
        });
        Object.assign(item, {
          precoUnitarioCentavos: fresh.precoUnitarioCentavos,
          snapshot: fresh.snapshot,
        });
        await m.save(item);
      }
    }
    p.subtotalCentavos = items.reduce(
      (s, i) => s + i.precoUnitarioCentavos * i.quantidade,
      0,
    );
    p.descontoCentavos = 0;
    if (p.cupomId) {
      const c = await m
        .getRepository(Cupom)
        .createQueryBuilder('c')
        .where('c.id=:id', { id: p.cupomId })
        .setLock('pessimistic_write')
        .getOne();
      if (
        !c ||
        c.arquivado ||
        !c.status ||
        c.validade < dataLoja() ||
        c.utilizados >= c.quantidade ||
        p.subtotalCentavos < c.valorMinimoCentavos
      )
        throw new ConflictException(
          'Cupom indisponível ou valor mínimo não atingido.',
        );
      if (
        c.unicoUso &&
        (await m.exists(CupomUso, {
          where: { cupomId: c.id, usuarioId: u.id, cancelado: false },
        }))
      )
        throw new ConflictException('Este cupom já foi utilizado.');
      if (p.cashbackCentavos)
        throw new BadRequestException(
          'Cashback não pode ser combinado com cupom.',
        );
      p.descontoCentavos = Math.min(
        p.subtotalCentavos,
        c.tipo === 'porcentagem'
          ? Math.round((p.subtotalCentavos * Number(c.valor)) / 100)
          : centavos(Number(c.valor)),
      );
    }
    if (
      p.cashbackCentavos > Math.max(0, u.cashbackCentavos) ||
      p.cashbackCentavos > p.subtotalCentavos - p.descontoCentavos
    )
      throw new ConflictException(
        'Saldo de cashback insuficiente para esta seleção.',
      );
    p.totalCentavos = Math.max(
      0,
      p.subtotalCentavos -
        p.descontoCentavos -
        p.cashbackCentavos +
        (p.ajusteCentavos ?? 0) +
        (p.taxaEntregaCentavos ?? 0),
    );
    await m.save(p);
    return p;
  }
  async adicionar(id: number, d: ItemDto) {
    return this.db.transaction(async (m) => {
      const u = await this.usuarioLock(m, id),
        p = await this.rascunho(m, id);
      if ((await m.count(PedidoItem, { where: { pedidoId: p.id } })) >= 100)
        throw new BadRequestException('Limite de itens do carrinho atingido.');
      await m.save(await this.montarItem(m, p.id, d));
      await this.recalcular(m, p, u);
      return this.formatar(m, p);
    });
  }
  async repetir(usuarioId: number, pedidoId: number, key: string) {
    if (!key || !/^[A-Za-z0-9_-]{8,100}$/.test(key))
      throw new BadRequestException(
        'Informe uma chave de idempotência válida.',
      );
    return this.db.transaction(async (m) => {
      // Mesma ordem de bloqueios do checkout: catálogo, cliente e cupom.
      await this.catalogo.bloquear(m);
      const usuario = await this.usuarioLock(m, usuarioId);
      const origem = await m.findOneBy(Pedido, { id: pedidoId, usuarioId });
      if (!origem || origem.status === 'carrinho')
        throw new NotFoundException('Pedido não encontrado no seu histórico.');
      const anterior = await m.findOneBy(Auditoria, {
        usuarioId,
        acao: 'carrinho.repetido',
        recurso: key,
      });
      const carrinho = await this.rascunho(m, usuarioId);
      if (anterior) {
        if (anterior.dados.pedidoOrigemId !== pedidoId)
          throw new ConflictException('Chave já utilizada para outro pedido.');
        return this.formatar(m, carrinho);
      }
      const itens = await m.find(PedidoItem, {
        where: { pedidoId },
        order: { id: 'ASC' },
      });
      const existentes = await m.find(PedidoItem, {
        where: { pedidoId: carrinho.id },
      });
      if (!itens.length)
        throw new BadRequestException(
          'Este pedido não possui itens para repetir.',
        );
      if (existentes.length + itens.length > 100)
        throw new BadRequestException('Limite de itens do carrinho atingido.');
      const quantidades = new Map<number, number>();
      for (const item of existentes)
        quantidades.set(
          item.produtoId,
          (quantidades.get(item.produtoId) ?? 0) + item.quantidade,
        );
      for (const item of itens) {
        const novo = await this.montarItem(m, carrinho.id, {
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          obs: item.obs,
          adicionais: (item.snapshot.adicionais ?? []).map((a) => a.id),
          ingredientes: (item.snapshot.ingredientes ?? []).map((i) => i.id),
          substituicoes: (item.snapshot.substituicoes ?? []).map(
            ({ removerId, adicionarId }) => ({ removerId, adicionarId }),
          ),
        });
        const quantidade =
          (quantidades.get(item.produtoId) ?? 0) + item.quantidade;
        if (quantidade > novo.snapshot.limitItens)
          throw new BadRequestException(
            `Limite total de ${novo.snapshot.limitItens} unidades para ${novo.snapshot.titulo}.`,
          );
        quantidades.set(item.produtoId, quantidade);
        await m.save(novo);
      }
      // Somente os itens são copiados; checkout e benefícios do pedido antigo não são reutilizados.
      await this.recalcular(m, carrinho, usuario);
      await m.save(Auditoria, {
        usuarioId,
        acao: 'carrinho.repetido',
        recurso: key,
        dados: { pedidoOrigemId: pedidoId, carrinhoId: carrinho.id },
      });
      return this.formatar(m, carrinho);
    });
  }
  async quantidade(id: number, itemId: number, quantidade: number) {
    return this.db.transaction(async (m) => {
      const u = await this.usuarioLock(m, id),
        p = await this.rascunho(m, id),
        i = await m.findOneBy(PedidoItem, { id: itemId, pedidoId: p.id });
      if (!i) throw new NotFoundException('Item não encontrado.');
      const product = await m.findOneByOrFail(Produto, { id: i.produtoId });
      if (quantidade > product.limite)
        throw new BadRequestException('Limite do produto excedido.');
      i.quantidade = quantidade;
      await m.save(i);
      p.cashbackCentavos = 0;
      await this.recalcular(m, p, u);
      return this.formatar(m, p);
    });
  }
  async remover(id: number, itemId?: number) {
    return this.db.transaction(async (m) => {
      const u = await this.usuarioLock(m, id),
        p = await this.rascunho(m, id);
      if (itemId) {
        const i = await m.findOneBy(PedidoItem, { id: itemId, pedidoId: p.id });
        if (!i) throw new NotFoundException('Item não encontrado.');
        await m.remove(i);
      } else await m.delete(PedidoItem, { pedidoId: p.id });
      p.cashbackCentavos = 0;
      p.cupomId = null;
      await this.recalcular(m, p, u);
      return this.formatar(m, p);
    });
  }
  async alterar(id: number, d: CarrinhoDto) {
    return this.db.transaction(async (m) => {
      const u = await this.usuarioLock(m, id),
        p = await this.rascunho(m, id);
      if (d.dataEntrega) {
        await this.validarHorario(d.dataEntrega);
        p.dataEntrega = new Date(d.dataEntrega);
      }
      if (d.tipoRecebimento === 'pickup') {
        p.endereco = await this.enderecoRetirada();
        p.canal = 'retirada';
        p.taxaEntregaCentavos = 0;
      }
      if (d.tipoRecebimento === 'delivery' || d.enderecoId) {
        const endereco = await m.findOneBy(Endereco, {
          id: d.enderecoId ?? 0,
          usuarioId: id,
        });
        if (!endereco) throw new NotFoundException('Endereço não encontrado.');
        p.endereco = { ...endereco };
        p.taxaEntregaCentavos = await this.taxaEntrega(endereco);
        p.canal = 'entrega';
      }
      if (d.formaPagamento) p.formaPagamento = d.formaPagamento;
      if (d.obs !== undefined) p.obs = d.obs;
      if (d.cupom !== undefined) {
        const c = d.cupom
          ? await m.findOneBy(Cupom, { nome: d.cupom.toUpperCase() })
          : null;
        if (d.cupom && !c) throw new NotFoundException('Cupom não encontrado.');
        p.cupomId = c?.id ?? null;
        if (c) p.cashbackCentavos = 0;
      }
      if (d.cashBack !== undefined) p.cashbackCentavos = centavos(d.cashBack);
      await this.recalcular(m, p, u);
      return this.formatar(m, p);
    });
  }
  async taxaEntrega(endereco: any) {
    let config: any;
    try {
      config = JSON.parse(await this.clientes.valor('ENTREGA', '{}'));
    } catch {
      throw new BadRequestException('Entrega não configurada.');
    }
    if (!config.habilitada)
      throw new BadRequestException('Entrega ainda não habilitada.');
    if (
      !endereco ||
      ['rua', 'numero', 'bairro', 'cep'].some((k) => !endereco[k])
    )
      throw new BadRequestException('Informe endereço completo.');
    const normalize = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
    const accepted =
      (config.bairros ?? []).some(
        (b) => normalize(b) === normalize(endereco.bairro),
      ) ||
      (config.faixasCep ?? []).some(
        (f) => endereco.cep >= f.inicio && endereco.cep <= f.fim,
      );
    if (!accepted)
      throw new BadRequestException('Endereço fora da área atendida.');
    return centavos(config.taxa);
  }
  async enderecoRetirada() {
    try {
      return JSON.parse(
        await this.clientes.valor('ENDERECO', JSON.stringify(ENDERECO)),
      );
    } catch {
      return ENDERECO;
    }
  }
  async horarios(data: string) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !Number.isFinite(new Date(data + 'T12:00:00Z').getTime()) ||
      new Date(data + 'T12:00:00Z').toISOString().slice(0, 10) !== data
    )
      throw new BadRequestException('Data inválida.');
    const date = new Date(data + 'T12:00:00Z');
    if (data < dataLoja() || date.getTime() > Date.now() + 90 * 86400000)
      return [];
    let schedule: any;
    try {
      schedule = JSON.parse(
        await this.clientes.valor('HORARIOATENDIMENTO', '{}'),
      );
    } catch {
      schedule = {};
    }
    const weekday = date.getUTCDay();
    const regra =
      schedule[['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][weekday]] ??
      ([0, 6].includes(weekday)
        ? { abertura: '11:30', fechamento: '14:00' }
        : null);
    if (!regra?.abertura || !regra?.fechamento) return [];
    const minutes = (s: string) => {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))
        throw new BadRequestException('Horário da loja inválido.');
      const [h, m] = s.split(':').map(Number);
      return h * 60 + m;
    };
    const start = minutes(regra.abertura),
      end = minutes(regra.fechamento),
      step = Number(await this.clientes.valor('INTERVALODEENTREGA', '30'));
    const result = [];
    for (let n = start; n + step <= end; n += step) {
      if (
        regra.inicio_intervalo &&
        regra.fim_intervalo &&
        n >= minutes(regra.inicio_intervalo) &&
        n < minutes(regra.fim_intervalo)
      )
        continue;
      const horario = `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
      const instant = new Date(`${data}T${horario}:00-03:00`);
      result.push({
        horario,
        fim: `${String(Math.floor((n + step) / 60)).padStart(2, '0')}:${String((n + step) % 60).padStart(2, '0')}`,
        data: instant.toISOString(),
        disponivel: instant > new Date(),
      });
    }
    return result;
  }
  async validarHorario(value: string) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()))
      throw new BadRequestException('Horário inválido.');
    const slots = await this.horarios(dataLoja(date));
    if (!slots.some((s) => s.disponivel && s.data === date.toISOString()))
      throw new ConflictException('Escolha um horário de retirada disponível.');
  }
  async reservar(m: EntityManager, p: Pedido) {
    const date = dataLoja(p.dataEntrega),
      day = new Date(date + 'T12:00:00Z').getUTCDay();
    const products = await m.find(Produto, { relations: { categoria: true } }),
      map = new Map(products.map((i) => [i.id, i]));
    const required = new Map<number, number>();
    const visited = new Set<number>();
    const visit = (id: number, q: number, path: number[]) => {
      visited.add(id);
      const item = map.get(id);
      if (!item || !item.ativo || item.esgotado || !item.categoria.ativa)
        throw new ConflictException('Um item do pedido está indisponível.');
      if (path.includes(id) || path.length >= 8)
        throw new BadRequestException('Composição inválida.');
      if (item.tipo === 'compound') {
        if (!item.componentes.length)
          throw new BadRequestException('Composição vazia.');
        for (const c of item.componentes)
          visit(c.productId, q * c.quantity, [...path, id]);
      } else required.set(id, (required.get(id) ?? 0) + q);
    };
    const items = await m.find(PedidoItem, { where: { pedidoId: p.id } });
    for (const i of items) visit(i.produtoId, i.quantidade, []);
    for (const id of new Set(items.map((i) => i.produtoId))) {
      if (
        items
          .filter((i) => i.produtoId === id)
          .reduce((n, i) => n + i.quantidade, 0) > map.get(id).limite
      )
        throw new BadRequestException('Limite total do produto excedido.');
    }
    // O bloqueio do catálogo serializa reservas e edições; cada data possui capacidade própria.
    p.reserva = [];
    for (const [id, quantidade] of [...required.entries()].sort(
      (a, b) => a[0] - b[0],
    )) {
      const item = map.get(id);
      let stock = await m.findOneBy(Estoque, { produtoId: id, data: date });
      if (!stock)
        stock = m.create(Estoque, {
          produtoId: id,
          data: date,
          capacidade: Number(
            day === 6
              ? item.estoqueSabado
              : day === 0
                ? item.estoqueDomingo
                : 0,
          ),
          reservado: 0,
          esgotado: false,
        });
      if (
        stock.esgotado ||
        Number(stock.capacidade) - Number(stock.reservado) + 0.00001 <
          quantidade
      )
        throw new ConflictException(
          `Estoque insuficiente de ${item.titulo} para ${date}.`,
        );
      stock.reservado =
        Math.round((Number(stock.reservado) + quantidade) * 1000) / 1000;
      await m.save(stock);
      p.reserva.push({ produtoId: id, data: date, quantidade });
    }
    // Bloqueios por data também valem para os produtos compostos, sem estoque próprio.
    for (const productId of visited) {
      const stock = await m.findOneBy(Estoque, {
        produtoId: productId,
        data: date,
      });
      if (stock?.esgotado)
        throw new ConflictException('Produto esgotado nesta data.');
    }
  }
  async finalizar(
    usuarioId: number,
    key: string,
    pdv?: PdvDto,
    adminId?: number,
  ) {
    if (!key || !/^[A-Za-z0-9_-]{8,100}$/.test(key))
      throw new BadRequestException(
        'Informe uma chave de idempotência válida.',
      );
    const requestHash = createHash('sha256')
      .update(JSON.stringify(pdv ?? { usuarioId }))
      .digest('hex');
    return this.db.transaction(async (m) => {
      const version = await this.catalogo.bloquear(m),
        u = await this.usuarioLock(m, usuarioId);
      const anterior = await m.findOneBy(Pedido, {
        usuarioId,
        idempotencia: key,
      });
      if (anterior) {
        if (anterior.requisicaoHash !== requestHash)
          throw new ConflictException(
            'Chave de idempotência já utilizada para outro pedido.',
          );
        return this.formatar(m, anterior);
      }
      let p: Pedido;
      if (pdv) {
        p = await m.save(
          Pedido,
          m.create(Pedido, {
            usuarioId,
            status: 'carrinho',
            endereco: await this.enderecoRetirada(),
            reserva: [],
            canal: pdv.canal,
            dataEntrega: new Date(pdv.dataEntrega),
            formaPagamento: pdv.formaPagamento,
            obs: pdv.obs ?? '',
          }),
        );
        for (const item of pdv.itens)
          await m.save(await this.montarItem(m, p.id, item));
      } else p = await this.rascunho(m, usuarioId);
      if (pdv?.canal === 'entrega') p.endereco = { ...pdv.endereco };
      if (p.canal === 'entrega')
        p.taxaEntregaCentavos = await this.taxaEntrega(p.endereco);
      if (!(await m.count(PedidoItem, { where: { pedidoId: p.id } })))
        throw new BadRequestException('O carrinho está vazio.');
      if (
        !p.dataEntrega ||
        !Object.keys(p.endereco).length ||
        !p.formaPagamento
      )
        throw new BadRequestException('Informe retirada, horário e pagamento.');
      await this.validarHorario(p.dataEntrega.toISOString());
      if (pdv?.cupom) {
        const coupon = await m.findOneBy(Cupom, {
          nome: pdv.cupom.toUpperCase(),
        });
        if (!coupon) throw new BadRequestException('Cupom não encontrado.');
        p.cupomId = coupon.id;
      }
      if (pdv?.cashBack) p.cashbackCentavos = centavos(pdv.cashBack);
      await this.recalcular(m, p, u, true);
      if (pdv?.ajuste) {
        const ajuste = Math.round(pdv.ajuste * 100);
        if (ajuste < -p.totalCentavos)
          throw new BadRequestException('Desconto maior que o total.');
        p.ajusteCentavos = ajuste;
        p.totalCentavos += ajuste;
      }

      const min = centavos(
        Number(await this.clientes.valor('PEDIDOMINIMO', '35')),
      );
      if (p.subtotalCentavos < min)
        throw new BadRequestException(
          `Pedido mínimo: R$ ${(min / 100).toFixed(2)}.`,
        );
      if (
        p.formaPagamento.startsWith('Pagamento online') &&
        ![
          process.env.MERCADO_PAGO_TOKEN,
          process.env.MERCADO_PAGO_WEBHOOK_SECRET,
          process.env.MERCADO_PAGO_COLLECTOR_ID,
          process.env.MERCADO_PAGO_NOTIFICATION_URL,
        ].every(Boolean)
      )
        throw new BadRequestException(
          'Pagamento online ainda não disponível. Escolha pagamento na retirada.',
        );
      if (pdv?.formaPagamento === 'Pagamento na Entrega - Dividido') {
        const parcelas = pdv.pagamentos ?? [];
        if (
          parcelas.length < 2 ||
          new Set(parcelas.map((p) => p.metodo)).size !== parcelas.length ||
          parcelas.reduce((s, p) => s + centavos(p.valor), 0) !==
            p.totalCentavos
        )
          throw new BadRequestException(
            'A soma das formas de pagamento deve ser igual ao total do pedido.',
          );
        p.pagamentosDivididos = parcelas;
      } else if (pdv?.pagamentos?.length)
        throw new BadRequestException(
          'Parcelas só são permitidas no pagamento dividido.',
        );
      await this.reservar(m, p);
      p.idempotencia = key;
      p.requisicaoHash = requestHash;
      const online = p.formaPagamento.startsWith('Pagamento online');
      p.status =
        (!online || p.totalCentavos === 0) &&
        (await this.clientes.valor('AUTOACEITAR', 'false')) === 'true'
          ? 'production'
          : 'analysis';
      p.pagamentoStatus =
        p.totalCentavos === 0 || pdv?.pagamentoStatus === 'paid'
          ? 'paid'
          : 'pending';
      p.pagamentoExpiraEm =
        online && p.pagamentoStatus === 'pending'
          ? new Date(Date.now() + 15 * 60 * 1000)
          : null;
      if (p.cupomId) {
        const c = await m.findOneByOrFail(Cupom, { id: p.cupomId });
        c.utilizados++;
        await m.save(c);
        await m.save(CupomUso, { cupomId: c.id, usuarioId, pedidoId: p.id });
      }
      if (p.cashbackCentavos) {
        u.cashbackCentavos -= p.cashbackCentavos;
        await m.save(u);
        await m.save(BeneficioMovimento, {
          usuarioId,
          pedidoId: p.id,
          tipo: 'uso',
          centavos: -p.cashbackCentavos,
        });
      }
      await m.save(p);
      if (p.pagamentoExpiraEm)
        await m.insert(Conciliacao, {
          pedidoId: p.id,
          proximaTentativaEm: p.pagamentoExpiraEm,
        });
      version.versao++;
      await m.save(version);
      await m.save(Auditoria, {
        usuarioId: adminId ?? usuarioId,
        acao: pdv ? 'pedido.pdv' : 'pedido.criado',
        recurso: String(p.id),
        dados: {
          ajusteCentavos: p.ajusteCentavos,
          pagamentoStatus: p.pagamentoStatus,
        },
      });
      return this.formatar(m, p);
    });
  }
  async obter(id: number, usuarioId: number, admin = false) {
    const p = await this.db
      .getRepository(Pedido)
      .findOneBy(admin ? { id } : { id, usuarioId });
    if (!p) throw new NotFoundException('Pedido não encontrado.');
    return this.formatar(this.db.manager, p);
  }
  async listar(usuarioId: number, q: ListaDto, admin = false) {
    const b = this.db
      .getRepository(Pedido)
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.usuario', 'u')
      .where('p.status != :draft', { draft: 'carrinho' });
    if (!admin) b.andWhere('p.usuarioId=:id', { id: usuarioId });
    if (q.status === 'active')
      b.andWhere('p.status IN (:...statuses)', {
        statuses: ['analysis', 'production', 'ready'],
      });
    else if (q.status === 'refund_pending')
      b.andWhere('p.pagamentoStatus=:status', { status: q.status });
    else if (q.status) b.andWhere('p.status=:status', { status: q.status });
    if (q.date)
      b.andWhere('p.dataEntrega >= :start AND p.dataEntrega < :end', {
        start: new Date(q.date + 'T00:00:00-03:00'),
        end: new Date(
          new Date(q.date + 'T00:00:00-03:00').getTime() + 86400000,
        ),
      });
    if (q.search)
      b.andWhere(
        '(u.nome LIKE :s OR u.tel LIKE :s OR CAST(p.id AS CHAR) LIKE :s)',
        { s: `%${q.search}%` },
      );
    const [rows, total] = await b
      .orderBy('p.created_at', q.order)
      .addOrderBy('p.id', q.order)
      .skip((q.page - 1) * q.limit)
      .take(q.limit)
      .getManyAndCount();
    const items = await Promise.all(
      rows.map(async (p) => ({
        ...(await this.formatar(this.db.manager, p)),
        cliente: {
          id: p.usuario.id,
          nome: p.usuario.nome,
          tel: p.usuario.tel,
          email: p.usuario.email,
        },
      })),
    );
    return { items, total, page: q.page, limit: q.limit };
  }
  async editar(id: number, d: EditarPedidoDto, adminId: number) {
    return this.db.transaction(async (m) => {
      const version = await this.catalogo.bloquear(m);
      const p = await m.findOneBy(Pedido, { id });
      if (!p || !['analysis', 'production', 'ready'].includes(p.status))
        throw new NotFoundException('Pedido não pode ser editado.');
      if (
        d.dataEntrega &&
        new Date(d.dataEntrega).getTime() !== p.dataEntrega.getTime()
      ) {
        if (p.status !== 'analysis')
          throw new ConflictException(
            'O horário só pode ser alterado antes da produção.',
          );
        await this.validarHorario(d.dataEntrega);
        for (const reserve of p.reserva) {
          const stock = await m.findOneByOrFail(Estoque, {
            produtoId: reserve.produtoId,
            data: reserve.data,
          });
          stock.reservado = Number(stock.reservado) - reserve.quantidade;
          await m.save(stock);
        }
        p.dataEntrega = new Date(d.dataEntrega);
        await this.reservar(m, p);
      }
      if (d.obs !== undefined) p.obs = d.obs;
      await m.save(p);
      version.versao++;
      await m.save(version);
      await m.save(Auditoria, {
        usuarioId: adminId,
        acao: 'pedido.editado',
        recurso: String(id),
        dados: { campos: Object.keys(d) },
      });
      return this.formatar(m, p);
    });
  }
  async mudarStatus(id: number, status: string, adminId: number) {
    return this.db.transaction(async (m) => {
      const version = await this.catalogo.bloquear(m),
        p = await m.findOneBy(Pedido, { id });
      if (!p || p.status === 'carrinho')
        throw new NotFoundException('Pedido não encontrado.');
      if (p.status === status) return this.formatar(m, p);
      const allowed = {
        analysis: ['production', 'cancelled'],
        production: ['ready', 'cancelled'],
        ready: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };
      if (!allowed[p.status]?.includes(status))
        throw new ConflictException('Transição de status inválida.');
      if (
        status !== 'cancelled' &&
        p.formaPagamento.startsWith('Pagamento online') &&
        p.pagamentoStatus !== 'paid'
      )
        throw new ConflictException(
          'Aguarde a confirmação do pagamento online antes de produzir.',
        );
      const u = await this.usuarioLock(m, p.usuarioId);
      if (status === 'completed') {
        if (p.pagamentoStatus !== 'paid')
          throw new ConflictException(
            'Confirme o pagamento antes de finalizar.',
          );
        p.finalizadoEm = new Date();
        const percentage = Number(await this.clientes.valor('CASHBACK', '3'));
        p.cashbackGanhoCentavos = p.cupomId
          ? 0
          : Math.floor((p.totalCentavos * percentage) / 100);
        u.cashbackCentavos += p.cashbackGanhoCentavos;
        u.pontos++;
        await m.save(BeneficioMovimento, {
          usuarioId: u.id,
          pedidoId: p.id,
          tipo: 'credito',
          centavos: p.cashbackGanhoCentavos,
        });
        if (u.pontos % 6 === 0) {
          const existing = await m.findOneBy(Premio, {
            usuarioId: u.id,
            ciclo: u.pontos / 6,
          });
          await m.save(Premio, {
            ...existing,
            usuarioId: u.id,
            ciclo: u.pontos / 6,
            valido: true,
          });
        }
      }
      if (status === 'cancelled') {
        if (
          p.pagamentoStatus === 'paid' &&
          p.formaPagamento.startsWith('Pagamento online')
        )
          throw new ConflictException(
            'Estorne o pagamento no provedor antes de cancelar.',
          );
        await this.liberarReserva(m, p, u);
      }
      p.status = status;
      await m.save(u);
      await m.save(p);
      version.versao++;
      await m.save(version);
      await m.save(Auditoria, {
        usuarioId: adminId,
        acao: 'pedido.status',
        recurso: String(id),
        dados: { status },
      });
      return this.formatar(m, p);
    });
  }
  private async liberarReserva(m: EntityManager, p: Pedido, u: Usuario) {
    for (const reserve of p.reserva) {
      const s = await m.findOneByOrFail(Estoque, {
        produtoId: reserve.produtoId,
        data: reserve.data,
      });
      s.reservado = Math.max(0, Number(s.reservado) - reserve.quantidade);
      await m.save(s);
    }
    if (p.cupomId) {
      await m.decrement(Cupom, { id: p.cupomId }, 'utilizados', 1);
      await m.update(CupomUso, { pedidoId: p.id }, { cancelado: true });
    }
    if (p.cashbackCentavos) {
      u.cashbackCentavos += p.cashbackCentavos;
      await m.save(BeneficioMovimento, {
        usuarioId: u.id,
        pedidoId: p.id,
        tipo: 'estorno',
        centavos: p.cashbackCentavos,
      });
    }
  }
  private podeExpirar(p: Pedido | null, agora: Date) {
    return (
      p &&
      p.status === 'analysis' &&
      p.pagamentoStatus === 'pending' &&
      p.formaPagamento.startsWith('Pagamento online') &&
      p.pagamentoExpiraEm &&
      p.pagamentoExpiraEm <= agora
    );
  }
  async expirar(id: number, agora = new Date(), execucaoToken?: string) {
    const antes = await this.db.getRepository(Pedido).findOneBy({ id });
    if (!this.podeExpirar(antes, agora)) return false;
    // Nenhuma transação ou bloqueio do catálogo fica aberto durante a chamada externa.
    const consulta = await this.pagamentos.consultarParaExpiracao(antes);
    return this.db.transaction(async (m) => {
      const version = await this.catalogo.bloquear(m);
      let p = await m
        .getRepository(Pedido)
        .createQueryBuilder('p')
        .where('p.id=:id', { id })
        .setLock('pessimistic_write')
        .getOne();
      if (!this.podeExpirar(p, agora)) return false;
      if (execucaoToken) {
        const fila = await m
          .getRepository(Conciliacao)
          .createQueryBuilder('c')
          .where('c.pedidoId=:id', { id })
          .setLock('pessimistic_write')
          .getOne();
        if (
          !fila ||
          fila.execucaoToken !== execucaoToken ||
          !fila.emExecucaoAte ||
          fila.emExecucaoAte <= new Date()
        )
          throw new FalhaConciliacao('concorrencia');
      }
      if (
        p.totalCentavos !== antes.totalCentavos ||
        p.pagamentoExpiraEm.getTime() !== antes.pagamentoExpiraEm.getTime()
      )
        throw new FalhaConciliacao('concorrencia');
      await this.pagamentos.aplicarConciliacao(m, p, consulta);
      p = await m.findOneByOrFail(Pedido, { id });
      if (p.status !== 'analysis' || p.pagamentoStatus !== 'pending')
        return false;
      const u = await this.usuarioLock(m, p.usuarioId);
      await this.liberarReserva(m, p, u);
      p.status = 'cancelled';
      p.cancelamentoMotivo = 'pagamento_expirado';
      await m.update(
        Conciliacao,
        { pedidoId: id },
        { resolvidoEm: new Date(), ultimoSucessoEm: new Date() },
      );
      await m.save(u);
      await m.save(p);
      version.versao++;
      await m.save(version);
      await m.save(Auditoria, {
        usuarioId: null,
        acao: 'pedido.expirado',
        recurso: String(id),
        dados: { prazoMinutos: 15 },
      });
      return true;
    });
  }
  async pagar(id: number, adminId: number) {
    return this.db.transaction(async (m) => {
      await this.catalogo.bloquear(m);
      const p = await m.findOneBy(Pedido, { id });
      if (!p || ['cancelled', 'carrinho'].includes(p.status))
        throw new NotFoundException('Pedido indisponível.');
      if (p.formaPagamento.startsWith('Pagamento online'))
        throw new ConflictException(
          'O pagamento online deve ser confirmado pelo provedor.',
        );
      p.pagamentoStatus = 'paid';
      await m.save(p);
      await m.save(Auditoria, {
        usuarioId: adminId,
        acao: 'pagamento.confirmado',
        recurso: String(id),
        dados: {},
      });
      return this.formatar(m, p);
    });
  }
  async rascunhosPdv(usuarioId: number) {
    return this.db
      .getRepository(PdvRascunho)
      .find({ where: { usuarioId }, order: { updated_at: 'DESC' }, take: 50 });
  }
  async salvarRascunhoPdv(usuarioId: number, dados: Record<string, unknown>) {
    if (JSON.stringify(dados).length > 50000)
      throw new BadRequestException('Rascunho muito grande.');
    if ((await this.db.getRepository(PdvRascunho).countBy({ usuarioId })) >= 50)
      throw new BadRequestException(
        'Remova rascunhos antigos antes de salvar.',
      );
    return this.db.getRepository(PdvRascunho).save({ usuarioId, dados });
  }
  async excluirRascunhoPdv(usuarioId: number, id: number) {
    const result = await this.db
      .getRepository(PdvRascunho)
      .delete({ id, usuarioId });
    if (!result.affected) throw new NotFoundException();
    return { message: 'Rascunho removido.' };
  }
  async relatorios() {
    const summary = await this.db
      .getRepository(Pedido)
      .createQueryBuilder('p')
      .select('COUNT(*)', 'pedidos')
      .addSelect('COALESCE(SUM(p.totalCentavos),0)', 'totalCentavos')
      .addSelect('COALESCE(SUM(p.descontoCentavos),0)', 'descontos')
      .addSelect('COALESCE(SUM(p.cashbackGanhoCentavos),0)', 'cashback')
      .where('p.status = :status AND p.pagamentoStatus = :paid', {
        status: 'completed',
        paid: 'paid',
      })
      .getRawOne();
    const meses = await this.db.query(
      "SELECT DATE_FORMAT(finalizadoEm, '%Y-%m') mes, COUNT(*) pedidos, SUM(totalCentavos)/100 total FROM pedidos WHERE status='completed' AND pagamentoStatus='paid' GROUP BY mes ORDER BY mes DESC LIMIT 12",
    );
    const itens = await this.db.query(
      "SELECT JSON_UNQUOTE(JSON_EXTRACT(i.snapshot,'$.titulo')) titulo,SUM(i.quantidade) quantidade,SUM(i.quantidade*i.precoUnitarioCentavos)/100 total FROM pedidos_itens i JOIN pedidos p ON p.id=i.pedidoId WHERE p.status='completed' AND p.pagamentoStatus='paid' GROUP BY titulo ORDER BY quantidade DESC LIMIT 50",
    );
    const cupons = await this.db.query(
      "SELECT c.nome,COUNT(p.id) usos,COALESCE(SUM(p.descontoCentavos),0)/100 desconto FROM cupons c LEFT JOIN pedidos p ON p.cupomId=c.id AND p.status='completed' AND p.pagamentoStatus='paid' GROUP BY c.id ORDER BY usos DESC LIMIT 100",
    );
    const clientes = await this.db
      .getRepository(Usuario)
      .countBy({ isAdmin: false });
    return {
      pedidos: Number(summary.pedidos),
      faturamento: Number(summary.totalCentavos) / 100,
      descontos: Number(summary.descontos) / 100,
      cashback: Number(summary.cashback) / 100,
      clientes,
      meses,
      itens,
      cupons,
    };
  }
}
