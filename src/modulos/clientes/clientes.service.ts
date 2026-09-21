import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  Usuario,
  Endereco,
  Cupom,
  Configuracao,
  Auditoria,
  Premio,
  BeneficioMovimento,
} from '../../database/entities';
import { centavos, dataLoja } from '../../common/money';
import {
  PerfilDto,
  EnderecoDto,
  ListaDto,
  CupomDto,
  ConfigDto,
  ClienteAdminDto,
  CriarClienteDto,
} from './clientes.dto';
import { randomUUID } from 'crypto';
@Injectable()
export class ClientesService {
  constructor(private db: DataSource) {}
  async perfil(id: number) {
    const u = await this.db.getRepository(Usuario).findOneBy({ id });
    if (!u) throw new NotFoundException();
    return u;
  }
  validarPerfil(d: PerfilDto) {
    if (d.cpf) {
      const n = d.cpf.split('').map(Number);
      if (
        /^(\d)\1{10}$/.test(d.cpf) ||
        n.length !== 11 ||
        [9, 10].some((k) => {
          const sum = n.slice(0, k).reduce((a, v, i) => a + v * (k + 1 - i), 0);
          const digit = (sum * 10) % 11;
          return (digit === 10 ? 0 : digit) !== n[k];
        })
      )
        throw new BadRequestException('CPF inválido.');
    }
    if (d.dataDeNascimento && d.dataDeNascimento.slice(0, 10) > dataLoja())
      throw new BadRequestException(
        'Data de nascimento deve estar no passado.',
      );
  }
  async editarPerfil(id: number, d: PerfilDto) {
    this.validarPerfil(d);
    await this.db.getRepository(Usuario).update(id, d);
    return this.perfil(id);
  }
  async enderecos(usuarioId: number) {
    return this.db
      .getRepository(Endereco)
      .find({ where: { usuarioId }, order: { favorite: 'DESC', id: 'DESC' } });
  }
  async endereco(usuarioId: number, id: number) {
    const e = await this.db
      .getRepository(Endereco)
      .findOneBy({ id, usuarioId });
    if (!e) throw new NotFoundException('Endereço não encontrado.');
    return e;
  }
  async salvarEndereco(usuarioId: number, d: EnderecoDto, novo = false) {
    if (!novo && !d.id)
      throw new BadRequestException('Informe o endereço que deseja editar.');
    return this.db.transaction(async (m) => {
      await m
        .getRepository(Usuario)
        .createQueryBuilder('u')
        .where('u.id=:id', { id: usuarioId })
        .setLock('pessimistic_write')
        .getOneOrFail();
      let e = novo
        ? m.create(Endereco, { usuarioId })
        : await m.findOneBy(Endereco, { id: d.id, usuarioId });
      if (!e) throw new NotFoundException('Endereço não encontrado.');
      if (
        novo &&
        ['apelido', 'rua', 'bairro', 'cep', 'numero'].some((k) => !d[k])
      )
        throw new BadRequestException('Preencha o endereço completo.');
      if (d.favorite)
        await m.update(Endereco, { usuarioId }, { favorite: false });
      const values = { ...d };
      delete values.id;
      e = Object.assign(e, values);
      return m.save(e);
    });
  }
  async excluirEndereco(usuarioId: number, id: number) {
    await this.endereco(usuarioId, id);
    await this.db.getRepository(Endereco).delete({ id, usuarioId });
    return { message: 'Endereço removido.' };
  }
  async beneficios(usuarioId: number) {
    const u = await this.perfil(usuarioId);
    const movimentos = await this.db
      .getRepository(BeneficioMovimento)
      .find({ where: { usuarioId }, order: { id: 'DESC' }, take: 50 });
    const premios = await this.db
      .getRepository(Premio)
      .find({ where: { usuarioId, valido: true }, order: { id: 'DESC' } });
    return {
      cashbackBalance: u.cashbackCentavos / 100,
      cashbackExpiration: null,
      loyaltyCurrentOrders: u.pontos % 6,
      loyaltyGoalOrders: 6,
      loyaltyRemainingOrders: 6 - (u.pontos % 6),
      loyaltyProgress: Math.round(((u.pontos % 6) / 6) * 100),
      promoNotificationCount:
        Number(u.cashbackCentavos > 0) +
        premios.filter((p) => !p.resgatadoEm).length,
      premios,
      movimentos,
    };
  }
  async criarCliente(d: CriarClienteDto, adminId: number) {
    const found = await this.db
      .getRepository(Usuario)
      .findOneBy({ tel: d.tel });
    if (found) {
      if (found.isAdmin)
        throw new BadRequestException(
          'Este telefone pertence a um administrador.',
        );
      return found;
    }
    const saved = await this.db
      .getRepository(Usuario)
      .save({ nome: d.nome, tel: d.tel, isAdmin: false });
    await this.db.getRepository(Auditoria).save({
      usuarioId: adminId,
      acao: 'cliente.criado',
      recurso: String(saved.id),
      dados: {},
    });
    return saved;
  }
  async resgatar(usuarioId: number, id: number, adminId: number) {
    return this.db.transaction(async (m) => {
      await m
        .getRepository(Usuario)
        .createQueryBuilder('u')
        .where('u.id=:usuarioId', { usuarioId })
        .setLock('pessimistic_write')
        .getOneOrFail();
      const premio = await m.findOneBy(Premio, { id, usuarioId });
      if (!premio || !premio.valido)
        throw new NotFoundException('Prêmio não encontrado.');
      if (!premio.resgatadoEm) {
        premio.resgatadoEm = new Date();
        await m.save(premio);
        await m.save(Auditoria, {
          usuarioId: adminId,
          acao: 'fidelidade.resgatado',
          recurso: String(id),
          dados: { clienteId: usuarioId },
        });
      }
      return premio;
    });
  }
  async clientes(q: ListaDto) {
    const builder = this.db
      .getRepository(Usuario)
      .createQueryBuilder('u')
      .where('u.isAdmin=false AND u.ativo=true');
    const search = q.search?.trim();
    if (search) {
      const telefone = /^[+\d\s().-]+$/.test(search)
        ? search.replace(/\D/g, '')
        : '';
      builder.andWhere(
        '(u.nome LIKE :s OR u.tel LIKE :tel OR u.email LIKE :s)',
        {
          s: `%${search}%`,
          tel: `%${telefone || search}%`,
        },
      );
    }
    const [items, total] = await builder
      .orderBy('u.id', q.order)
      .skip((q.page - 1) * q.limit)
      .take(q.limit)
      .getManyAndCount();
    return { items, total, page: q.page, limit: q.limit };
  }
  async clienteDetalhe(id: number) {
    const cliente = await this.perfil(id);
    if (cliente.isAdmin || !cliente.ativo)
      throw new NotFoundException('Cliente não encontrado.');
    return {
      id: cliente.id,
      nome: cliente.nome,
      tel: cliente.tel,
      email: cliente.email,
    };
  }
  async enderecosCliente(id: number) {
    await this.clienteDetalhe(id);
    return this.enderecos(id);
  }
  async editarCliente(id: number, d: ClienteAdminDto, adminId: number) {
    this.validarPerfil(d);
    const u = await this.perfil(id);
    if (u.isAdmin)
      throw new BadRequestException(
        'Use a gestão de acesso para alterar administradores.',
      );
    await this.db.getRepository(Usuario).update(id, d);
    await this.db.getRepository(Auditoria).save({
      usuarioId: adminId,
      acao: 'cliente.atualizado',
      recurso: String(id),
      dados: { campos: Object.keys(d) },
    });
    return this.perfil(id);
  }
  cupomPublico(c: Cupom) {
    return {
      ...c,
      valor: Number(c.valor),
      valorMinimoGasto: c.valorMinimoCentavos / 100,
      quantidade: Math.max(0, c.quantidade - c.utilizados),
    };
  }
  async cupons(admin = false) {
    const all = await this.db
      .getRepository(Cupom)
      .find({ where: { arquivado: false } });
    return all
      .filter(
        (c) =>
          admin ||
          (c.listaPublica &&
            c.status &&
            c.validade >= dataLoja() &&
            c.quantidade > c.utilizados),
      )
      .map((c) => this.cupomPublico(c));
  }
  async salvarCupom(d: CupomDto, adminId: number) {
    if (d.tipo === 'porcentagem' && d.valor > 99)
      throw new BadRequestException('O desconto percentual máximo é 99%.');
    if (
      !Number.isFinite(new Date(d.validade).getTime()) ||
      new Date(d.validade).toISOString().slice(0, 10) !== d.validade ||
      d.validade < dataLoja()
    )
      throw new BadRequestException('Informe uma validade atual ou futura.');
    return this.db.transaction(async (m) => {
      const c = d.id
        ? await m
            .getRepository(Cupom)
            .createQueryBuilder('c')
            .where('c.id=:id', { id: d.id })
            .setLock('pessimistic_write')
            .getOne()
        : null;
      const saved = await m.save(Cupom, {
        ...c,
        id: c?.id ?? d.id ?? randomUUID(),
        nome: d.nome,
        descricao: d.descricao,
        tipo: d.tipo,
        valor: d.valor,
        valorMinimoCentavos: centavos(d.valorMinimoGasto),
        quantidade: d.quantidade + (c?.utilizados ?? 0),
        validade: d.validade,
        status: d.status,
        listaPublica: d.listaPublica,
        unicoUso: d.unicoUso,
      });
      await m.save(Auditoria, {
        usuarioId: adminId,
        acao: 'cupom.salvo',
        recurso: saved.id,
        dados: { nome: saved.nome },
      });
      return this.cupomPublico(saved);
    });
  }
  async excluirCupom(id: string, adminId: number) {
    await this.db
      .getRepository(Cupom)
      .update(id, { status: false, listaPublica: false, arquivado: true });
    await this.db.getRepository(Auditoria).save({
      usuarioId: adminId,
      acao: 'cupom.desativado',
      recurso: id,
      dados: {},
    });
    return { message: 'Cupom desativado. O histórico foi preservado.' };
  }
  async config() {
    return this.db
      .getRepository(Configuracao)
      .find({ where: { privado: false } });
  }
  async valor(chave: string, fallback: string) {
    return (
      (
        await this.db
          .getRepository(Configuracao)
          .findOneBy({ chave: chave.toUpperCase() })
      )?.valor ?? fallback
    );
  }
  private validarConfiguracao(d: ConfigDto) {
    const chave = d.chave.toUpperCase();
    const permitidas = [
      'CASHBACK',
      'TELEFONE',
      'REDESSOCIAIS',
      'ENDERECO',
      'INTERVALODEENTREGA',
      'TAXADEENTREGA',
      'HORARIOATENDIMENTO',
      'PEDIDOMINIMO',
      'AUTOACEITAR',
      'ENTREGA',
    ];
    if (!permitidas.includes(chave) || d.privado)
      throw new BadRequestException(
        'Configuração não permitida. Credenciais são configuradas no ambiente do servidor.',
      );
    if (
      ['CASHBACK', 'TAXADEENTREGA', 'PEDIDOMINIMO'].includes(chave) &&
      (!Number.isFinite(Number(d.valor)) ||
        Number(d.valor) < 0 ||
        Number(d.valor) > (chave === 'CASHBACK' ? 100 : 100000))
    )
      throw new BadRequestException('Valor de configuração inválido.');
    if (chave === 'ENDERECO') {
      try {
        const value = JSON.parse(d.valor);
        if (
          ['rua', 'numero', 'bairro'].some(
            (k) => typeof value[k] !== 'string' || !value[k].trim(),
          )
        )
          throw new Error();
      } catch {
        throw new BadRequestException(
          'Endereço de retirada deve informar rua, número e bairro.',
        );
      }
    }
    if (chave === 'HORARIOATENDIMENTO') {
      try {
        const value = JSON.parse(d.valor);
        if (
          Array.isArray(value) ||
          Object.keys(value).some(
            (k) =>
              !['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].includes(k),
          )
        )
          throw new Error();
        for (const rule of Object.values(value) as any[]) {
          if (!rule || typeof rule !== 'object') throw new Error();
          if (!rule.abertura && !rule.fechamento) continue;
          for (const key of ['abertura', 'fechamento'])
            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(rule[key])) throw new Error();
          if (rule.abertura >= rule.fechamento) throw new Error();
          if (Boolean(rule.inicio_intervalo) !== Boolean(rule.fim_intervalo))
            throw new Error();
          if (
            rule.inicio_intervalo &&
            (!/^([01]\d|2[0-3]):[0-5]\d$/.test(rule.inicio_intervalo) ||
              !/^([01]\d|2[0-3]):[0-5]\d$/.test(rule.fim_intervalo) ||
              rule.inicio_intervalo >= rule.fim_intervalo ||
              rule.inicio_intervalo < rule.abertura ||
              rule.fim_intervalo > rule.fechamento)
          )
            throw new Error();
        }
      } catch {
        throw new BadRequestException(
          'Horários inválidos. Use dias dom a sab e horários HH:mm.',
        );
      }
    }
    if (chave === 'ENTREGA') {
      try {
        const v = JSON.parse(d.valor);
        if (
          typeof v.habilitada !== 'boolean' ||
          typeof v.taxa !== 'number' ||
          v.taxa < 0 ||
          v.taxa > 100000 ||
          !Array.isArray(v.bairros) ||
          !Array.isArray(v.faixasCep) ||
          v.bairros.some((b) => typeof b !== 'string' || b.length > 150) ||
          v.faixasCep.some(
            (f) =>
              !/^\d{8}$/.test(f.inicio) ||
              !/^\d{8}$/.test(f.fim) ||
              f.inicio > f.fim,
          ) ||
          (v.habilitada && !v.bairros.length && !v.faixasCep.length)
        )
          throw new Error();
      } catch {
        throw new BadRequestException(
          'Informe taxa, bairros ou faixas de CEP da entrega.',
        );
      }
    }
    if (chave === 'REDESSOCIAIS') {
      try {
        const redes = JSON.parse(d.valor);
        if (!redes || Array.isArray(redes) || typeof redes !== 'object')
          throw new Error();
        for (const value of Object.values(redes)) {
          if (typeof value !== 'string' || value.length > 2048)
            throw new Error();
          if (value && !['http:', 'https:'].includes(new URL(value).protocol))
            throw new Error();
        }
      } catch {
        throw new BadRequestException(
          'Redes sociais devem informar URLs http ou https.',
        );
      }
    }
    if (
      chave === 'TELEFONE' &&
      d.valor &&
      !/^\d{10,13}$/.test(d.valor.replace(/\D/g, ''))
    )
      throw new BadRequestException('Informe um telefone com DDD.');
    if (chave === 'AUTOACEITAR' && !['true', 'false'].includes(d.valor))
      throw new BadRequestException('Valor booleano inválido.');
    if (
      chave === 'INTERVALODEENTREGA' &&
      (!Number.isInteger(Number(d.valor)) ||
        Number(d.valor) < 10 ||
        Number(d.valor) > 120)
    )
      throw new BadRequestException(
        'Intervalo deve ficar entre 10 e 120 minutos.',
      );
    if (['REDESSOCIAIS', 'ENDERECO', 'HORARIOATENDIMENTO'].includes(chave)) {
      try {
        const v = JSON.parse(d.valor);
        if (!v || typeof v !== 'object') throw new Error();
      } catch {
        throw new BadRequestException('Configuração JSON inválida.');
      }
    }
    return { chave, valor: d.valor, privado: false };
  }
  async configurar(d: ConfigDto, usuarioId: number) {
    return (await this.configurarLote([d], usuarioId))[0];
  }
  async configurarLote(configuracoes: ConfigDto[], usuarioId: number) {
    const values = configuracoes.map((d) => this.validarConfiguracao(d));
    if (new Set(values.map((v) => v.chave)).size !== values.length)
      throw new BadRequestException('Configurações repetidas no mesmo envio.');
    // Valida o lote inteiro antes de gravar e inclui a auditoria na mesma transação.
    return this.db.transaction(async (m) => {
      const result = await m.getRepository(Configuracao).save(values);
      await m.getRepository(Auditoria).save(
        values.map(({ chave }) => ({
          usuarioId,
          acao: 'configuracao.atualizada',
          recurso: chave,
          dados: {},
        })),
      );
      return result;
    });
  }
}
