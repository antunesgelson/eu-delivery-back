import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { createConnection, Connection } from 'mysql2/promise';
import { randomBytes, createHmac } from 'crypto';
import {
  Usuario,
  Categoria,
  Produto,
  Pedido,
  Estoque,
  BeneficioMovimento,
  Cupom,
  Configuracao,
  CupomUso,
  Auditoria,
  Conciliacao,
  Pagamento,
} from '../src/database/entities';
import { PedidosService } from '../src/modulos/pedidos/pedidos.service';
import { ExpiracaoService } from '../src/modulos/pedidos/expiracao.service';
import { AuthService, hashSenha } from '../src/modulos/auth/auth.service';
import { CatalogoService } from '../src/modulos/catalogo/catalogo.service';
import {
  PagamentosService,
  MercadoPagoGateway,
} from '../src/modulos/pagamentos/pagamentos.service';

describe('Loja: integração com MySQL e HTTP', () => {
  let app: INestApplication,
    db: DataSource,
    connection: Connection,
    admin: string,
    a: string,
    b: string,
    userA: Usuario,
    userB: Usuario,
    orderId: number,
    onlineId: number,
    resetToken: any;
  const database = `zanini_test_${Date.now()}`;
  const password = randomBytes(20).toString('hex');
  let remote: any;
  const gateway = {
    preference: jest.fn(async () => ({
      id: 'pref-test',
      sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/test',
    })),
    payment: jest.fn<Promise<any>, [string]>(async () => remote),
    buscarAprovados: jest.fn<Promise<any>, [number]>(
      async (): Promise<any> => ({
        results: [],
        paging: { total: 0 },
      }),
    ),
  };
  let slot: string, date: string;
  const auth = (r: any, token = a) => r.set('Authorization', `Bearer ${token}`);
  beforeAll(async () => {
    (await import('dotenv')).config({
      path: process.env.DOTENV_CONFIG_PATH ?? '.env',
    });
    if (
      !['localhost', '127.0.0.1'].includes(
        process.env.MYSQL_HOST ?? '127.0.0.1',
      )
    )
      throw new Error(
        'Testes exigem MySQL local; nenhum banco remoto será alterado.',
      );
    process.env.MYSQL_DB = database;
    process.env.NODE_ENV = 'test';
    process.env.AUTH_DELIVERY_MODE = 'development';
    process.env.JWT_SECRET = randomBytes(32).toString('hex');
    Object.assign(process.env, {
      MERCADO_PAGO_TOKEN: 'test-contract-token',
      MERCADO_PAGO_WEBHOOK_SECRET: 'contract-secret',
      MERCADO_PAGO_COLLECTOR_ID: '1234',
      MERCADO_PAGO_NOTIFICATION_URL: 'https://example.test/webhook',
      MERCADO_PAGO_SANDBOX: 'true',
    });
    connection = await createConnection({
      host: process.env.MYSQL_HOST ?? '127.0.0.1',
      port: Number(process.env.MYSQL_PORT ?? 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
    });
    await connection.query(
      `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4`,
    );
    const { AppModule } = await import('../src/app.module');
    const { configurarApp } = await import('../src/main');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MercadoPagoGateway)
      .useValue(gateway)
      .compile();
    app = module.createNestApplication();
    await configurarApp(app);
    await app.init();
    db = app.get(DataSource);
    await db.runMigrations();
    await db.getRepository(Categoria).save({ id: 'test', titulo: 'Cardápio' });
    for (const p of [
      {
        id: 101,
        titulo: 'Frango',
        precoCentavos: 6000,
        tipo: 'simple',
        componentes: [],
      },
      {
        id: 103,
        titulo: 'Meio frango',
        precoCentavos: 3500,
        tipo: 'compound',
        componentes: [{ productId: 101, quantity: 0.5 }],
      },
    ])
      await db.getRepository(Produto).save({
        ...p,
        categoriaId: 'test',
        descricao: 'Teste',
        imagem: '',
        classificacoes: [],
        ingredientes: [],
        adicionais: [],
        estoqueSabado: 1,
        estoqueDomingo: 1,
      });
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 7);
    while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1);
    date = d.toISOString().slice(0, 10);
    slot = `${date}T11:30:00-03:00`;
    await db.getRepository(Usuario).save({
      nome: 'Admin teste',
      email: 'admin@test.example',
      senhaHash: hashSenha(password),
      isAdmin: true,
    });
  }, 60000);
  afterAll(async () => {
    if (app) await app.close();
    if (connection) {
      await connection.query(`DROP DATABASE \`${database}\``);
      await connection.end();
    }
  }, 30000);
  it('nega JWT forjado e login incorreto; permite senha válida', async () => {
    await auth(
      request(app.getHttpServer()).get('/admin/pedidos'),
      'eyJhbGciOiJub25lIn0.eyJpc0FkbWluIjp0cnVlfQ.',
    ).expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.example', senha: 'senha-incorreta' })
      .expect(401);
    const result = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.example', senha: password })
      .expect(201);
    admin = result.body.token;
    expect(result.body.user.isAdmin).toBe(true);
  });
  it('vincula OTP ao telefone e ao desafio; rejeita reutilização', async () => {
    for (const [index, tel] of ['5548999990101', '5548999990102'].entries()) {
      const code = (
        await request(app.getHttpServer())
          .post('/auth/wp')
          .send({ tel })
          .expect(201)
      ).body;
      expect(code.developmentCode).toMatch(/^\d{6}$/);
      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({
          tel: '5548999990199',
          desafioId: code.desafioId,
          code: code.developmentCode,
        })
        .expect(401);
      const result = (
        await request(app.getHttpServer())
          .post('/auth/verify')
          .send({ tel, desafioId: code.desafioId, code: code.developmentCode })
          .expect(201)
      ).body;
      if (index === 0) {
        a = result.token;
        userA = result.user;
      } else {
        b = result.token;
        userB = result.user;
      }
      await request(app.getHttpServer())
        .post('/auth/verify')
        .send({ tel, desafioId: code.desafioId, code: code.developmentCode })
        .expect(401);
    }
  });
  it('limita tentativas e impede acesso administrativo ou alteração de permissões', async () => {
    const tel = '5548999990110';
    const code = (
      await request(app.getHttpServer()).post('/auth/wp').send({ tel })
    ).body;
    for (let i = 0; i < 5; i++)
      await expect(
        app
          .get(AuthService)
          .verificar({ tel, desafioId: code.desafioId, code: '000000' }),
      ).rejects.toThrow('Código inválido');
    await request(app.getHttpServer())
      .post('/auth/verify')
      .send({ tel, desafioId: code.desafioId, code: code.developmentCode })
      .expect(401);
    await auth(request(app.getHttpServer()).get('/admin/pedidos')).expect(403);
    await auth(request(app.getHttpServer()).put('/usuario'))
      .send({ isAdmin: true })
      .expect(400);
    await auth(request(app.getHttpServer()).put('/usuario'))
      .send({ cpf: '11111111111' })
      .expect(400);
  });
  it('isola endereços e valida CEP atendido e taxa no servidor', async () => {
    const address = (
      await auth(request(app.getHttpServer()).post('/endereco'))
        .send({
          apelido: 'Casa',
          rua: 'Rua teste',
          bairro: 'Bairro teste',
          cep: '88650000',
          numero: '10',
        })
        .expect(201)
    ).body;
    await auth(
      request(app.getHttpServer()).get(`/endereco/${address.id}`),
      b,
    ).expect(404);
    await auth(request(app.getHttpServer()).put('/pedido/carrinho'), b)
      .send({ tipoRecebimento: 'delivery', enderecoId: address.id })
      .expect(404);
    await auth(request(app.getHttpServer()).post('/pedido/carrinho'))
      .send({ produtoId: 101, quantidade: 1, preco: 0.01 })
      .expect(400);
    await auth(request(app.getHttpServer()).post('/pedido/carrinho'))
      .send({ produtoId: 101, quantidade: 1 })
      .expect(201);
    const cart = (
      await auth(request(app.getHttpServer()).put('/pedido/carrinho'))
        .send({
          tipoRecebimento: 'delivery',
          enderecoId: address.id,
          dataEntrega: slot,
          formaPagamento: 'Pagamento na Entrega - Dinheiro',
        })
        .expect(200)
    ).body;
    expect(cart.taxaEntrega).toBe(10);
    expect(cart.valorFinal).toBe(70);
    const other = (
      await auth(request(app.getHttpServer()).post('/endereco')).send({
        apelido: 'Fora',
        rua: 'Rua',
        bairro: 'Outro',
        cep: '88000000',
        numero: '1',
      })
    ).body;
    await auth(request(app.getHttpServer()).put('/pedido/carrinho'))
      .send({ tipoRecebimento: 'delivery', enderecoId: other.id })
      .expect(400);
  });
  it('reserva a última unidade uma só vez e mantém idempotência', async () => {
    await auth(request(app.getHttpServer()).post('/pedido/carrinho'), b)
      .send({ produtoId: 101, quantidade: 1 })
      .expect(201);
    await auth(request(app.getHttpServer()).put('/pedido/carrinho'), b)
      .send({
        tipoRecebimento: 'pickup',
        dataEntrega: slot,
        formaPagamento: 'Pagamento na Entrega - Dinheiro',
      })
      .expect(200);
    const results = await Promise.all(
      [a, b].map((token) =>
        auth(request(app.getHttpServer()).post('/pedido/finalizar'), token)
          .set('Idempotency-Key', 'last-stock-test')
          .send({}),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    const winner = results[0].status === 201 ? a : b;
    orderId = results.find((r) => r.status === 201).body.id;
    const repeat = await auth(
      request(app.getHttpServer()).post('/pedido/finalizar'),
      winner,
    )
      .set('Idempotency-Key', 'last-stock-test')
      .send({})
      .expect(201);
    expect(repeat.body.id).toBe(orderId);
    expect(
      Number(
        (
          await db
            .getRepository(Estoque)
            .findOneByOrFail({ produtoId: 101, data: date })
        ).reservado,
      ),
    ).toBe(1);
    await auth(
      request(app.getHttpServer()).get(`/pedido/${orderId}`),
      winner === a ? b : a,
    ).expect(404);
    await auth(
      request(app.getHttpServer()).patch(`/admin/pedidos/${orderId}/status`),
      admin,
    )
      .send({ status: 'completed' })
      .expect(409);
  });
  it('cancelamento libera estoque; meio frango consome meia unidade', async () => {
    await auth(
      request(app.getHttpServer()).patch(`/admin/pedidos/${orderId}/status`),
      admin,
    )
      .send({ status: 'cancelled' })
      .expect(200);
    await auth(
      request(app.getHttpServer()).patch(`/admin/pedidos/${orderId}/status`),
      admin,
    )
      .send({ status: 'cancelled' })
      .expect(200);
    expect(
      Number(
        (
          await db
            .getRepository(Estoque)
            .findOneByOrFail({ produtoId: 101, data: date })
        ).reservado,
      ),
    ).toBe(0);
    await auth(request(app.getHttpServer()).delete('/pedido/carrinho')).expect(
      200,
    );
    await auth(request(app.getHttpServer()).post('/pedido/carrinho'))
      .send({ produtoId: 103, quantidade: 1 })
      .expect(201);
    await auth(request(app.getHttpServer()).put('/pedido/carrinho'))
      .send({
        tipoRecebimento: 'pickup',
        dataEntrega: slot,
        formaPagamento: 'Pagamento na Entrega - Cartão',
      })
      .expect(200);
    orderId = (
      await auth(request(app.getHttpServer()).post('/pedido/finalizar'))
        .set('Idempotency-Key', 'half-chicken-test')
        .send({})
        .expect(201)
    ).body.id;
    expect(
      Number(
        (
          await db
            .getRepository(Estoque)
            .findOneByOrFail({ produtoId: 101, data: date })
        ).reservado,
      ),
    ).toBe(0.5);
  });
  it('exige pagamento para finalizar e credita cashback apenas uma vez', async () => {
    for (const status of ['production', 'ready'])
      await auth(
        request(app.getHttpServer()).patch(`/admin/pedidos/${orderId}/status`),
        admin,
      )
        .send({ status })
        .expect(200);
    await auth(
      request(app.getHttpServer()).patch(`/admin/pedidos/${orderId}/status`),
      admin,
    )
      .send({ status: 'completed' })
      .expect(409);
    await auth(
      request(app.getHttpServer()).patch(`/admin/pedidos/${orderId}/pagamento`),
      admin,
    )
      .send({ paymentStatus: 'paid' })
      .expect(200);
    for (let i = 0; i < 2; i++)
      await auth(
        request(app.getHttpServer()).patch(`/admin/pedidos/${orderId}/status`),
        admin,
      )
        .send({ status: 'completed' })
        .expect(200);
    const benefits = (
      await auth(request(app.getHttpServer()).get('/usuario/beneficios'))
    ).body;
    expect(benefits.cashbackBalance).toBe(1.05);
    expect(benefits.loyaltyCurrentOrders).toBe(1);
  });
  it('rejeita cupom privado inválido, combinações proibidas e conflitos de catálogo', async () => {
    await auth(request(app.getHttpServer()).post('/cupom'), admin)
      .send({
        id: 'test-coupon',
        nome: 'TESTE10',
        descricao: 'Cupom teste',
        tipo: 'porcentagem',
        valor: 10,
        valorMinimoGasto: 35,
        quantidade: 1,
        validade: date,
        status: true,
        listaPublica: false,
        unicoUso: true,
      })
      .expect(201);
    await auth(request(app.getHttpServer()).post('/pedido/carrinho'))
      .send({ produtoId: 103, quantidade: 1 })
      .expect(201);
    await auth(request(app.getHttpServer()).put('/pedido/carrinho'))
      .send({ cupom: 'TESTE10' })
      .expect(200);
    await auth(request(app.getHttpServer()).put('/pedido/carrinho'))
      .send({ cashBack: 1 })
      .expect(400);
    const catalog = (
      await auth(request(app.getHttpServer()).get('/admin/catalogo'), admin)
    ).body;
    await auth(request(app.getHttpServer()).put('/admin/catalogo'), admin)
      .send(catalog)
      .expect(200);
    await auth(request(app.getHttpServer()).put('/admin/catalogo'), admin)
      .send(catalog)
      .expect(409);
    await auth(request(app.getHttpServer()).put('/pedido/carrinho'))
      .send({
        cupom: '',
        dataEntrega: slot,
        tipoRecebimento: 'pickup',
        formaPagamento: 'Pagamento online - Pix',
      })
      .expect(200);
    onlineId = (
      await auth(request(app.getHttpServer()).post('/pedido/finalizar'))
        .set('Idempotency-Key', 'online-test-id')
        .send({})
        .expect(201)
    ).body.id;
  });
  it('checkout online é do dono; cliente e admin não podem confirmar o pagamento', async () => {
    await auth(
      request(app.getHttpServer()).post(`/pagamento/${onlineId}/checkout`),
      b,
    ).expect(400);
    for (let i = 0; i < 2; i++)
      await auth(
        request(app.getHttpServer()).post(`/pagamento/${onlineId}/checkout`),
      ).expect(201);
    expect(gateway.preference).toHaveBeenCalledTimes(1);
    await auth(
      request(app.getHttpServer()).patch(
        `/admin/pedidos/${onlineId}/pagamento`,
      ),
      admin,
    )
      .send({ paymentStatus: 'paid' })
      .expect(409);
  });
  function webhook(signature?: string) {
    const ts = String(Date.now()),
      rid = 'request-contract';
    const sig =
      signature ??
      `ts=${ts},v1=${createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET).update(`id:987;request-id:${rid};ts:${ts};`).digest('hex')}`;
    return request(app.getHttpServer())
      .post('/pagamento/mercadopago/webhook?data.id=987')
      .set('x-request-id', rid)
      .set('x-signature', sig)
      .send({});
  }
  it('valida assinatura, valor, moeda e recebedor antes de aceitar webhook', async () => {
    remote = {
      id: 987,
      external_reference: String(onlineId),
      currency_id: 'BRL',
      collector_id: 1234,
      transaction_amount: 35,
      date_last_updated: new Date().toISOString(),
      status: 'approved',
    };
    await webhook('invalid').expect(401);
    expect(gateway.payment).toHaveBeenCalledTimes(0);
    for (const [field, value] of [
      ['currency_id', 'USD'],
      ['collector_id', 42],
      ['transaction_amount', 0.01],
    ]) {
      const original = remote[field];
      remote[field] = value;
      await webhook().expect(400);
      remote[field] = original;
    }
    await webhook().expect(201);
    await webhook().expect(201);
    expect(
      (await db.getRepository(Pedido).findOneByOrFail({ id: onlineId }))
        .pagamentoStatus,
    ).toBe('paid');
  });
  it('estorno é idempotente e reverte benefício após conclusão', async () => {
    for (const status of ['production', 'ready', 'completed'])
      await auth(
        request(app.getHttpServer()).patch(`/admin/pedidos/${onlineId}/status`),
        admin,
      )
        .send({ status })
        .expect(200);
    expect(
      (await db.getRepository(Usuario).findOneByOrFail({ id: userA.id }))
        .cashbackCentavos,
    ).toBe(210);
    remote = {
      ...remote,
      status: 'refunded',
      date_last_updated: new Date(Date.now() + 1000).toISOString(),
    };
    await webhook().expect(201);
    await webhook().expect(201);
    const u = await db.getRepository(Usuario).findOneByOrFail({ id: userA.id });
    expect(u.cashbackCentavos).toBe(105);
    expect(u.pontos).toBe(1);
    expect(
      await db
        .getRepository(BeneficioMovimento)
        .countBy({ pedidoId: onlineId, tipo: 'reversao_credito' }),
    ).toBe(1);
    remote = {
      ...remote,
      status: 'approved',
      date_last_updated: new Date(Date.now() - 1000).toISOString(),
    };
    await webhook().expect(201);
    expect(
      (await db.getRepository(Pedido).findOneByOrFail({ id: onlineId }))
        .pagamentoStatus,
    ).toBe('refunded');
  });
  it('PDV persiste rascunhos e valida pagamento dividido, entrega e repetição', async () => {
    const saved = await auth(
      request(app.getHttpServer()).post('/admin/pdv/rascunhos'),
      admin,
    )
      .send({
        dados: {
          clientName: 'Rascunho teste',
          orderItems: [{ productId: 101, quantity: 1 }],
        },
      })
      .expect(201);
    const list = await auth(
      request(app.getHttpServer()).get('/admin/pdv/rascunhos'),
      admin,
    ).expect(200);
    expect(list.body.some((d) => d.id === saved.body.id)).toBe(true);
    await auth(
      request(app.getHttpServer()).get('/admin/pdv/rascunhos'),
      a,
    ).expect(403);
    await auth(
      request(app.getHttpServer()).delete(
        `/admin/pdv/rascunhos/${saved.body.id}`,
      ),
      admin,
    ).expect(200);
    await db
      .getRepository(Estoque)
      .update({ produtoId: 101, data: date }, { capacidade: 10 });
    const payload = {
      clienteId: userB.id,
      itens: [{ produtoId: 101, quantidade: 1 }],
      dataEntrega: slot,
      canal: 'entrega',
      endereco: {
        apelido: 'Entrega',
        rua: 'Rua teste',
        numero: '10',
        bairro: 'Centro',
        cep: '88650000',
      },
      formaPagamento: 'Pagamento na Entrega - Dividido',
      pagamentoStatus: 'paid',
      pagamentos: [
        { metodo: 'cash', valor: 30 },
        { metodo: 'card', valor: 40 },
      ],
    };
    await auth(request(app.getHttpServer()).post('/admin/pdv'), admin)
      .set('Idempotency-Key', 'pdv-split-invalid')
      .send({
        ...payload,
        pagamentos: [
          { metodo: 'cash', valor: 1 },
          { metodo: 'card', valor: 1 },
        ],
      })
      .expect(400);
    const created = await auth(
      request(app.getHttpServer()).post('/admin/pdv'),
      admin,
    )
      .set('Idempotency-Key', 'pdv-split-valid')
      .send(payload)
      .expect(201);
    expect(created.body.valorFinal).toBe(70);
    expect(created.body.taxaEntrega).toBe(10);
    const repeat = await auth(
      request(app.getHttpServer()).post('/admin/pdv'),
      admin,
    )
      .set('Idempotency-Key', 'pdv-split-valid')
      .send(payload)
      .expect(201);
    expect(repeat.body.id).toBe(created.body.id);
    await auth(request(app.getHttpServer()).post('/admin/pdv'), admin)
      .set('Idempotency-Key', 'pdv-split-valid')
      .send({ ...payload, obs: 'Conteúdo diferente' })
      .expect(409);
  });
  it('falha de estoque reverte o pedido PDV e preserva usos do cupom', async () => {
    const stock = await db
      .getRepository(Estoque)
      .findOneByOrFail({ produtoId: 101, data: date });
    await db
      .getRepository(Estoque)
      .update(stock.id, { capacidade: Number(stock.reservado) });
    const before = await db.getRepository(Pedido).count();
    await auth(request(app.getHttpServer()).post('/admin/pdv'), admin)
      .set('Idempotency-Key', 'rollback-coupon-pdv')
      .send({
        clienteId: userB.id,
        itens: [{ produtoId: 101, quantidade: 1 }],
        dataEntrega: slot,
        canal: 'retirada',
        formaPagamento: 'Pagamento na Entrega - Dinheiro',
        cupom: 'TESTE10',
      })
      .expect(409);
    expect(await db.getRepository(Pedido).count()).toBe(before);
    expect(
      (await db.getRepository(Cupom).findOneByOrFail({ id: 'test-coupon' }))
        .utilizados,
    ).toBe(0);
  });
  let chaveExpiracao = 0;
  async function criarOnline(extra: Record<string, unknown> = {}) {
    await db
      .getRepository(Estoque)
      .update({ produtoId: 101, data: date }, { capacidade: 100 });
    await auth(request(app.getHttpServer()).delete('/pedido/carrinho')).expect(
      200,
    );
    await auth(request(app.getHttpServer()).post('/pedido/carrinho'))
      .send({ produtoId: 101, quantidade: 1 })
      .expect(201);
    await auth(request(app.getHttpServer()).put('/pedido/carrinho'))
      .send({
        dataEntrega: slot,
        tipoRecebimento: 'pickup',
        formaPagamento: 'Pagamento online - Pix',
        ...extra,
      })
      .expect(200);
    return (
      await auth(request(app.getHttpServer()).post('/pedido/finalizar'))
        .set('Idempotency-Key', `expiracao-${++chaveExpiracao}`)
        .send({})
        .expect(201)
    ).body;
  }
  const estoqueAtual = async () =>
    Number(
      (
        await db
          .getRepository(Estoque)
          .findOneByOrFail({ produtoId: 101, data: date })
      ).reservado,
    );
  const pedidoAtual = (id: number) =>
    db.getRepository(Pedido).findOneByOrFail({ id });
  const prazoPassado = async (id: number) => {
    const passado = new Date(Date.now() - 60000);
    await db.getRepository(Pedido).update(id, { pagamentoExpiraEm: passado });
    await db
      .getRepository(Conciliacao)
      .update({ pedidoId: id }, { proximaTentativaEm: passado });
  };
  it('reserva online por 15 minutos e impede produção antes do pagamento, inclusive com aceite automático', async () => {
    await db
      .getRepository(Configuracao)
      .save({ chave: 'AUTOACEITAR', valor: 'true' });
    const inicio = Date.now();
    const order = await criarOnline();
    expect(order.status).toBe('analysis');
    expect(
      new Date(order.pagamentoExpiraEm).getTime() - inicio,
    ).toBeGreaterThanOrEqual(899000);
    expect(
      new Date(order.pagamentoExpiraEm).getTime() - Date.now(),
    ).toBeLessThanOrEqual(900000);
    await auth(
      request(app.getHttpServer()).patch(`/admin/pedidos/${order.id}/status`),
      admin,
    )
      .send({ status: 'production' })
      .expect(409);
    expect(await app.get(PedidosService).expirar(order.id)).toBe(false);
    const offline = await db
      .getRepository(Pedido)
      .findOneByOrFail({ id: orderId });
    expect(offline.pagamentoExpiraEm).toBeNull();
    expect(
      await app
        .get(PedidosService)
        .expirar(offline.id, new Date(Date.now() + 86400000)),
    ).toBe(false);
    await db
      .getRepository(Configuracao)
      .save({ chave: 'AUTOACEITAR', valor: 'false' });
    await auth(
      request(app.getHttpServer()).patch(`/admin/pedidos/${order.id}/status`),
      admin,
    )
      .send({ status: 'cancelled' })
      .expect(200);
  });
  it('expiração concorrente libera estoque e cupom exatamente uma vez', async () => {
    const before = await estoqueAtual();
    const order = await criarOnline({ cupom: 'TESTE10' });
    await prazoPassado(order.id);
    const results = await Promise.all([
      app.get(PedidosService).expirar(order.id),
      app.get(PedidosService).expirar(order.id),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await estoqueAtual()).toBe(before);
    expect((await pedidoAtual(order.id)).cancelamentoMotivo).toBe(
      'pagamento_expirado',
    );
    expect(
      (await db.getRepository(Cupom).findOneByOrFail({ id: 'test-coupon' }))
        .utilizados,
    ).toBe(0);
    expect(
      (await db.getRepository(CupomUso).findOneByOrFail({ pedidoId: order.id }))
        .cancelado,
    ).toBe(true);
    expect(
      await db
        .getRepository(Auditoria)
        .countBy({ recurso: String(order.id), acao: 'pedido.expirado' }),
    ).toBe(1);
    await auth(
      request(app.getHttpServer()).post(`/pagamento/${order.id}/checkout`),
    ).expect(400);
  });
  it('rotina automática devolve cashback uma vez e ignora pedido já cancelado', async () => {
    await db
      .getRepository(Usuario)
      .update(userA.id, { cashbackCentavos: 1000 });
    const order = await criarOnline({ cashBack: 5 });
    await prazoPassado(order.id);
    await app.get(ExpiracaoService).executar();
    await app.get(ExpiracaoService).executar();
    expect((await pedidoAtual(order.id)).status).toBe('cancelled');
    expect(
      (await db.getRepository(Usuario).findOneByOrFail({ id: userA.id }))
        .cashbackCentavos,
    ).toBe(1000);
    expect(
      await db
        .getRepository(BeneficioMovimento)
        .countBy({ pedidoId: order.id, tipo: 'estorno' }),
    ).toBe(1);
  });
  it('mantém reserva em falha do provedor e concilia aprovação sem webhook antes de expirar', async () => {
    const order = await criarOnline();
    await auth(
      request(app.getHttpServer()).post(`/pagamento/${order.id}/checkout`),
    ).expect(201);
    await prazoPassado(order.id);
    const stock = await estoqueAtual();
    await auth(
      request(app.getHttpServer()).post(`/pagamento/${order.id}/checkout`),
    ).expect(409);
    gateway.buscarAprovados.mockRejectedValueOnce(
      new Error('Provedor indisponível'),
    );
    await expect(app.get(PedidosService).expirar(order.id)).rejects.toThrow();
    gateway.buscarAprovados.mockResolvedValueOnce({
      results: [],
      paging: { total: 101 },
    });
    await expect(app.get(PedidosService).expirar(order.id)).rejects.toThrow(
      'incompleta',
    );
    expect((await pedidoAtual(order.id)).status).toBe('analysis');
    expect(await estoqueAtual()).toBe(stock);
    remote = {
      id: 998,
      external_reference: String(order.id),
      currency_id: 'BRL',
      collector_id: 1234,
      transaction_amount: 60,
      date_last_updated: new Date().toISOString(),
      status: 'approved',
    };
    gateway.buscarAprovados.mockResolvedValueOnce({
      results: [{ id: 998 }],
      paging: { total: 1 },
    });
    expect(await app.get(PedidosService).expirar(order.id)).toBe(false);
    expect((await pedidoAtual(order.id)).pagamentoStatus).toBe('paid');
    expect(await estoqueAtual()).toBe(stock);
    expect(await app.get(PedidosService).expirar(order.id)).toBe(false);
  });
  it('pagamento após expiração exige estorno e não recria reserva nem duplica cashback', async () => {
    const order = await criarOnline({ cashBack: 5 });
    await auth(
      request(app.getHttpServer()).post(`/pagamento/${order.id}/checkout`),
    ).expect(201);
    await prazoPassado(order.id);
    expect(await app.get(PedidosService).expirar(order.id)).toBe(true);
    const stock = await estoqueAtual();
    const balance = (
      await db.getRepository(Usuario).findOneByOrFail({ id: userA.id })
    ).cashbackCentavos;
    remote = {
      id: 999,
      external_reference: String(order.id),
      currency_id: 'BRL',
      collector_id: 1234,
      transaction_amount: 55,
      date_last_updated: new Date().toISOString(),
      status: 'approved',
    };
    const notify = async () => {
      const ts = String(Date.now()),
        rid = 'expiry-test';
      const sig = createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
        .update(`id:999;request-id:${rid};ts:${ts};`)
        .digest('hex');
      await request(app.getHttpServer())
        .post('/pagamento/mercadopago/webhook?data.id=999')
        .set('x-request-id', rid)
        .set('x-signature', `ts=${ts},v1=${sig}`)
        .send({})
        .expect(201);
    };
    await notify();
    await notify();
    expect((await pedidoAtual(order.id)).status).toBe('cancelled');
    expect((await pedidoAtual(order.id)).pagamentoStatus).toBe(
      'refund_pending',
    );
    const alerts = await auth(
      request(app.getHttpServer()).get('/admin/pedidos?status=refund_pending'),
      admin,
    ).expect(200);
    expect(alerts.body.items.map((p: any) => p.id)).toContain(order.id);
    remote = {
      ...remote,
      status: 'refunded',
      date_last_updated: new Date(Date.now() + 1000).toISOString(),
    };
    await notify();
    await notify();
    expect((await pedidoAtual(order.id)).pagamentoStatus).toBe('refunded');
    expect(await estoqueAtual()).toBe(stock);
    expect(
      (await db.getRepository(Usuario).findOneByOrFail({ id: userA.id }))
        .cashbackCentavos,
    ).toBe(balance);
    expect(
      await db
        .getRepository(BeneficioMovimento)
        .countBy({ pedidoId: order.id, tipo: 'estorno' }),
    ).toBe(1);
  });
  it('envia ao checkout do provedor o mesmo vencimento gravado no pedido', async () => {
    const order = await criarOnline();
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 'pref-contract' }), { status: 201 }),
      );
    try {
      await new MercadoPagoGateway().preference(await pedidoAtual(order.id));
      const payload = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
      expect(payload.expires).toBe(true);
      expect(payload.expiration_date_to).toBe(
        new Date(order.pagamentoExpiraEm).toISOString(),
      );
    } finally {
      fetchMock.mockRestore();
    }
  });
  async function criarPendencia(comCheckout = true) {
    // Dados exclusivos de fila: não consomem estoque nem criam cobranças.
    const passado = new Date(Date.now() - 600000);
    const pedido = await db.getRepository(Pedido).save({
      usuarioId: userA.id,
      status: 'analysis',
      pagamentoStatus: 'pending',
      formaPagamento: 'Pagamento online - Pix',
      pagamentoExpiraEm: passado,
      totalCentavos: 6000,
      endereco: {},
      reserva: [],
    });
    await db
      .getRepository(Conciliacao)
      .insert({ pedidoId: pedido.id, proximaTentativaEm: passado });
    if (comCheckout)
      await db.getRepository(Pagamento).insert({
        pedidoId: pedido.id,
        preferenceId: `pref-${pedido.id}`,
        totalCentavos: 6000,
      });
    return pedido;
  }
  const filaAtual = (id: number) =>
    db.getRepository(Conciliacao).findOneByOrFail({ pedidoId: id });
  const novaRotina = () => new ExpiracaoService(db, app.get(PedidosService));
  const tornarElegivel = (id: number) =>
    db
      .getRepository(Conciliacao)
      .update(
        { pedidoId: id },
        { proximaTentativaEm: new Date(Date.now() - 1) },
      );
  function pendenciaExterna() {
    let iniciar: () => void, liberar: (value: any) => void;
    const iniciou = new Promise<void>((r) => {
      iniciar = r;
    });
    const resposta = new Promise<any>((r) => {
      liberar = r;
    });
    gateway.buscarAprovados.mockImplementationOnce(async () => {
      iniciar();
      return resposta;
    });
    return {
      iniciou,
      liberar: () => liberar({ results: [], paging: { total: 0 } }),
    };
  }
  it('persiste falhas e intervalos progressivos após reinício; limita a tentativa administrativa', async () => {
    const pedido = await criarPendencia();
    for (const [index, intervalo] of [30, 60, 120, 300, 600].entries()) {
      await tornarElegivel(pedido.id);
      gateway.buscarAprovados.mockRejectedValueOnce(
        new Error('token-super-secreto-do-provedor'),
      );
      expect(await novaRotina().processarPedido(pedido.id)).toBe(true);
      const fila = await filaAtual(pedido.id);
      expect(fila.tentativas).toBe(index + 1);
      expect(fila.falhasConsecutivas).toBe(index + 1);
      expect(
        fila.proximaTentativaEm.getTime() - fila.ultimaFalhaEm.getTime(),
      ).toBe(intervalo * 1000);
      expect(fila.ultimaFalhaCategoria).toBe('comunicacao');
      expect(fila.execucaoToken).toBeNull();
      expect(await novaRotina().processarPedido(pedido.id)).toBe(false);
    }
    await request(app.getHttpServer()).get('/admin/conciliacoes').expect(401);
    await auth(request(app.getHttpServer()).get('/admin/conciliacoes')).expect(
      403,
    );
    await auth(
      request(app.getHttpServer()).post(
        `/admin/conciliacoes/${pedido.id}/tentar`,
      ),
    ).expect(403);
    const list = await auth(
      request(app.getHttpServer()).get('/admin/conciliacoes?limit=1'),
      admin,
    ).expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(JSON.stringify(list.body)).not.toContain('token-super-secreto');
    expect(JSON.stringify(list.body)).not.toContain('execucaoToken');
    const attempts = await Promise.all(
      [1, 2].map(() =>
        auth(
          request(app.getHttpServer()).post(
            `/admin/conciliacoes/${pedido.id}/tentar`,
          ),
          admin,
        ).send({}),
      ),
    );
    expect(attempts.map((r) => r.status).sort()).toEqual([202, 409]);
    expect(
      await db.getRepository(Auditoria).countBy({
        acao: 'conciliacao.solicitada',
        recurso: String(pedido.id),
      }),
    ).toBe(1);
    await novaRotina().processarPedido(pedido.id);
    expect((await filaAtual(pedido.id)).ultimoSucessoEm).not.toBeNull();
    expect((await pedidoAtual(pedido.id)).status).toBe('cancelled');
    const resolved = await auth(
      request(app.getHttpServer()).get('/admin/conciliacoes'),
      admin,
    ).expect(200);
    expect(resolved.body.items.map((v: any) => v.pedidoId)).not.toContain(
      pedido.id,
    );
  });
  it('pedidos além do primeiro lote avançam mesmo com 50 falhas persistentes', async () => {
    const pedidos: Pedido[] = [];
    for (let i = 0; i < 55; i++) pedidos.push(await criarPendencia(i < 50));
    const idsFalhos = new Set(pedidos.slice(0, 50).map((p) => p.id));
    gateway.buscarAprovados.mockImplementation(async (id) => {
      if (idsFalhos.has(id)) throw new Error('Provedor indisponível');
      return { results: [], paging: { total: 0 } };
    });
    try {
      await novaRotina().executar();
      expect((await filaAtual(pedidos[0].id)).falhasConsecutivas).toBe(1);
      await novaRotina().executar();
      for (const pedido of pedidos.slice(50))
        expect((await pedidoAtual(pedido.id)).status).toBe('cancelled');
      for (const pedido of pedidos.slice(0, 50))
        expect((await pedidoAtual(pedido.id)).status).toBe('analysis');
    } finally {
      gateway.buscarAprovados.mockImplementation(async () => ({
        results: [],
        paging: { total: 0 },
      }));
      for (const pedido of pedidos.slice(0, 50)) {
        await tornarElegivel(pedido.id);
        await novaRotina().processarPedido(pedido.id);
      }
    }
  }, 30000);
  it('consulta lenta não bloqueia catálogo nem permite dois responsáveis pelo mesmo pedido', async () => {
    const pedido = await criarPendencia();
    const consulta = pendenciaExterna();
    const trabalho = novaRotina().processarPedido(pedido.id);
    await consulta.iniciou;
    let timer: ReturnType<typeof setTimeout>;
    try {
      expect(await novaRotina().processarPedido(pedido.id)).toBe(false);
      await Promise.race([
        db.transaction((m) => app.get(CatalogoService).bloquear(m)),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Catálogo bloqueado por chamada externa')),
            1500,
          );
        }),
      ]);
      await auth(
        request(app.getHttpServer()).post(
          `/admin/conciliacoes/${pedido.id}/tentar`,
        ),
        admin,
      ).expect(409);
    } finally {
      clearTimeout(timer);
      consulta.liberar();
      await trabalho;
    }
    expect((await filaAtual(pedido.id)).tentativas).toBe(1);
  });
  it('retoma uma execução abandonada sem permitir que o responsável antigo sobrescreva o resultado', async () => {
    const pedido = await criarPendencia();
    const consulta = pendenciaExterna();
    const antigo = novaRotina().processarPedido(pedido.id);
    await consulta.iniciou;
    try {
      await db
        .getRepository(Conciliacao)
        .update(
          { pedidoId: pedido.id },
          { emExecucaoAte: new Date(Date.now() - 1) },
        );
      expect(await novaRotina().processarPedido(pedido.id)).toBe(true);
    } finally {
      consulta.liberar();
      await antigo;
    }
    expect((await filaAtual(pedido.id)).tentativas).toBe(2);
    expect((await filaAtual(pedido.id)).falhasConsecutivas).toBe(0);
    expect((await pedidoAtual(pedido.id)).status).toBe('cancelled');
    expect(
      await db
        .getRepository(Auditoria)
        .countBy({ acao: 'pedido.expirado', recurso: String(pedido.id) }),
    ).toBe(1);
  });
  it('webhook aprovado durante consulta impede a expiração e resolve a pendência', async () => {
    const pedido = await criarPendencia();
    const consulta = pendenciaExterna();
    const trabalho = novaRotina().processarPedido(pedido.id);
    await consulta.iniciou;
    try {
      remote = {
        id: 600001,
        external_reference: String(pedido.id),
        currency_id: 'BRL',
        collector_id: 1234,
        transaction_amount: 60,
        date_last_updated: new Date().toISOString(),
        status: 'approved',
      };
      const ts = String(Date.now()),
        rid = 'webhook-concorrente';
      const sig = createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
        .update(`id:600001;request-id:${rid};ts:${ts};`)
        .digest('hex');
      await request(app.getHttpServer())
        .post('/pagamento/mercadopago/webhook?data.id=600001')
        .set('x-request-id', rid)
        .set('x-signature', `ts=${ts},v1=${sig}`)
        .send({})
        .expect(201);
    } finally {
      consulta.liberar();
      await trabalho;
    }
    expect((await pedidoAtual(pedido.id)).pagamentoStatus).toBe('paid');
    expect((await pedidoAtual(pedido.id)).status).toBe('analysis');
    expect((await filaAtual(pedido.id)).resolvidoEm).not.toBeNull();
    expect(
      await db
        .getRepository(Auditoria)
        .countBy({ acao: 'pedido.expirado', recurso: String(pedido.id) }),
    ).toBe(0);
  });
  it('checkout criado durante a consulta exige nova verificação antes de liberar a reserva', async () => {
    const pedido = await criarPendencia(false);
    const pagamentos = app.get(PagamentosService);
    const original = pagamentos.consultarParaExpiracao.bind(pagamentos);
    let iniciar: () => void, liberar: () => void;
    const iniciou = new Promise<void>((r) => {
      iniciar = r;
    });
    const gate = new Promise<void>((r) => {
      liberar = r;
    });
    const spy = jest
      .spyOn(pagamentos, 'consultarParaExpiracao')
      .mockImplementationOnce(async (order) => {
        const result = await original(order);
        iniciar();
        await gate;
        return result;
      });
    const trabalho = novaRotina().processarPedido(pedido.id);
    await iniciou;
    try {
      await db.getRepository(Pagamento).insert({
        pedidoId: pedido.id,
        preferenceId: 'checkout-concorrente',
        totalCentavos: 6000,
      });
    } finally {
      liberar();
      await trabalho;
      spy.mockRestore();
    }
    expect((await pedidoAtual(pedido.id)).status).toBe('analysis');
    expect((await filaAtual(pedido.id)).ultimaFalhaCategoria).toBe(
      'concorrencia',
    );
    await tornarElegivel(pedido.id);
    await novaRotina().processarPedido(pedido.id);
  });
  it('classifica divergências sem liberar reservas ou expor a resposta do provedor', async () => {
    const pedido = await criarPendencia();
    for (const [campo, valor, categoria] of [
      ['transaction_amount', 0.01, 'divergencia_valor'],
      ['currency_id', 'USD', 'divergencia_moeda'],
      ['collector_id', 777, 'divergencia_recebedor'],
      ['external_reference', '1', 'divergencia_referencia'],
    ]) {
      await tornarElegivel(pedido.id);
      remote = {
        id: 600002,
        external_reference: String(pedido.id),
        currency_id: 'BRL',
        collector_id: 1234,
        transaction_amount: 60,
        date_last_updated: new Date().toISOString(),
        status: 'approved',
        segredo: 'nao-expor',
        [campo]: valor,
      };
      gateway.buscarAprovados.mockResolvedValueOnce({
        results: [{ id: 600002 }],
        paging: { total: 1 },
      });
      await novaRotina().processarPedido(pedido.id);
      expect((await filaAtual(pedido.id)).ultimaFalhaCategoria).toBe(categoria);
      expect((await pedidoAtual(pedido.id)).status).toBe('analysis');
    }
    const result = await auth(
      request(app.getHttpServer()).get('/admin/conciliacoes'),
      admin,
    ).expect(200);
    expect(JSON.stringify(result.body)).not.toContain('nao-expor');
    await tornarElegivel(pedido.id);
    await novaRotina().processarPedido(pedido.id);
  });
  it('refresh rotaciona token, logout revoga a sessão e reset consome o link', async () => {
    const original = await db.transaction((m) =>
      app.get(AuthService).criarSessao(m, userB),
    );
    const refreshed = (
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: original.refreshToken })
        .expect(201)
    ).body;
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: original.refreshToken })
      .expect(401);
    await auth(
      request(app.getHttpServer()).post('/auth/logout'),
      refreshed.token,
    ).expect(201);
    await auth(
      request(app.getHttpServer()).get('/auth/me'),
      refreshed.token,
    ).expect(401);
    resetToken = (
      await request(app.getHttpServer())
        .post('/auth/esqueci-senha')
        .send({ email: 'admin@test.example' })
        .expect(201)
    ).body;
    const payload = {
      desafioId: resetToken.desafioId,
      token: resetToken.developmentToken,
      senha: randomBytes(20).toString('hex'),
    };
    await request(app.getHttpServer())
      .post('/auth/redefinir-senha')
      .send(payload)
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/redefinir-senha')
      .send(payload)
      .expect(400);
    await auth(request(app.getHttpServer()).get('/auth/me'), admin).expect(401);
  });
});
