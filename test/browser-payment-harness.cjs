// Infraestrutura exclusiva de testes: API real, banco temporário e provedor simulado.
const { randomBytes, createHmac } = require('node:crypto');
const { resolve } = require('node:path');
const { Test } = require('@nestjs/testing');
const { DataSource } = require('typeorm');
const { createConnection } = require('mysql2/promise');

exports.createPaymentHarness = async function createPaymentHarness() {
  const envFile =
    process.env.E2E_BACKEND_ENV || resolve(__dirname, '../.env.codex.local');
  require('dotenv').config({ path: envFile });
  if (
    !['localhost', '127.0.0.1'].includes(process.env.MYSQL_HOST || '127.0.0.1')
  )
    throw new Error('A suíte de pagamentos exige MySQL local.');
  const database = `zanini_browser_${Date.now()}_${randomBytes(4).toString('hex')}`;
  Object.assign(process.env, {
    MYSQL_DB: database,
    DOTENV_CONFIG_PATH: envFile,
    NODE_ENV: 'test',
    AUTH_DELIVERY_MODE: 'development',
    JWT_SECRET: randomBytes(32).toString('hex'),
    MERCADO_PAGO_TOKEN: 'test-contract-token',
    MERCADO_PAGO_WEBHOOK_SECRET: randomBytes(32).toString('hex'),
    MERCADO_PAGO_COLLECTOR_ID: '1234',
    MERCADO_PAGO_NOTIFICATION_URL: 'https://example.test/webhook',
    MERCADO_PAGO_SANDBOX: 'true',
  });
  const connection = await createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  });
  let app,
    created = false;
  async function close() {
    try {
      if (app) await app.close();
    } finally {
      try {
        if (created) await connection.query(`DROP DATABASE \`${database}\``);
      } finally {
        await connection.end();
      }
    }
  }
  try {
    await connection.query(
      `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4`,
    );
    created = true;
    const { AppModule } = require('../dist/app.module');
    const { configurarApp } = require('../dist/main');
    const {
      MercadoPagoGateway,
    } = require('../dist/modulos/pagamentos/pagamentos.service');
    const {
      ExpiracaoService,
    } = require('../dist/modulos/pedidos/expiracao.service');
    const { hashSenha } = require('../dist/modulos/auth/auth.service');
    const {
      Pedido,
      Pagamento,
      Conciliacao,
      Usuario,
      Categoria,
      Produto,
      Estoque,
      Desafio,
    } = require('../dist/database/entities');
    const remote = new Map();
    const faults = { checkout: false, reconciliation: false };
    const gateway = {
      async preference(order) {
        if (faults.checkout)
          throw new (require('@nestjs/common').ServiceUnavailableException)(
            'Provedor temporariamente indisponível.',
          );
        return {
          id: `pref-${order.id}`,
          sandbox_init_point: `https://sandbox.mercadopago.com.br/checkout/test-${order.id}`,
        };
      },
      async buscarAprovados() {
        if (faults.reconciliation) throw new Error('provider offline');
        return { results: [], paging: { total: 0 } };
      },
      async payment(id) {
        return remote.get(id);
      },
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MercadoPagoGateway)
      .useValue(gateway)
      .compile();
    app = module.createNestApplication({ logger: false });
    await configurarApp(app);
    await app.init();
    const db = app.get(DataSource);
    await db.runMigrations();
    await db
      .getRepository(Categoria)
      .save({ id: 'browser', titulo: 'Cardápio teste' });
    await db.getRepository(Produto).save({
      id: 101,
      categoriaId: 'browser',
      titulo: 'Frango teste',
      descricao: 'Teste local',
      precoCentavos: 6500,
      imagem: '',
      classificacoes: [],
      ingredientes: [],
      adicionais: [],
      componentes: [],
      tipo: 'simple',
      estoqueSabado: 100,
      estoqueDomingo: 100,
    });
    await app.listen(0, '127.0.0.1');
    const origin = `http://127.0.0.1:${app.getHttpServer().address().port}`;
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + 14);
    while (date.getUTCDay() !== 6) date.setUTCDate(date.getUTCDate() + 1);
    const slot = `${date.toISOString().slice(0, 10)}T11:30:00-03:00`;
    let customer = 0,
      event = 0;
    return {
      origin,
      slot,
      faults,
      close,
      async configureProduct(options) {
        await db.getRepository(Produto).update(101, options);
      },
      async stockForDate(date) {
        const stock = await db.getRepository(Estoque).findOneBy({ produtoId: 101, data: date });
        return stock ? Number(stock.reservado) : 0;
      },
      async setStockCapacity(date, capacity) {
        const repo = db.getRepository(Estoque);
        const stock = await repo.findOneBy({ produtoId: 101, data: date });
        await repo.save({ ...stock, produtoId: 101, data: date, capacidade: capacity });
      },
      async expireResetLink(id) {
        await db.getRepository(Desafio).update(
          { id, finalidade: 'senha' },
          { expiraEm: new Date(Date.now() - 1000) },
        );
      },
      async customer(isAdmin = false, cashbackCentavos = 0) {
        const email = `payment-${++customer}@test.example`,
          senha = randomBytes(16).toString('hex');
        await db
          .getRepository(Usuario)
          .save({
            nome: 'Cliente pagamento teste',
            email,
            senhaHash: hashSenha(senha),
            isAdmin,
            cashbackCentavos,
          });
        return { email, senha };
      },
      async setDeadline(id, timestamp) {
        const deadline = new Date(timestamp);
        await db
          .getRepository(Pedido)
          .update(id, { pagamentoExpiraEm: deadline });
        await db
          .getRepository(Conciliacao)
          .update({ pedidoId: id }, { proximaTentativaEm: deadline });
      },
      async reconcile(id) {
        return app.get(ExpiracaoService).processarPedido(id);
      },
      async reserved() {
        const rows = await db.getRepository(Estoque).find();
        return rows.reduce((sum, row) => sum + Number(row.reservado), 0);
      },
      async notify(id, status) {
        const order = await db.getRepository(Pedido).findOneByOrFail({ id });
        await db.getRepository(Pagamento).findOneByOrFail({ pedidoId: id });
        const paymentId = String(90000 + id);
        remote.set(paymentId, {
          id: Number(paymentId),
          external_reference: String(id),
          status,
          transaction_amount: order.totalCentavos / 100,
          currency_id: 'BRL',
          collector_id: 1234,
          date_last_updated: new Date(
            Date.now() + ++event * 1000,
          ).toISOString(),
        });
        const ts = String(Date.now()),
          requestId = `browser-event-${event}`;
        const signature = createHmac(
          'sha256',
          process.env.MERCADO_PAGO_WEBHOOK_SECRET,
        )
          .update(`id:${paymentId};request-id:${requestId};ts:${ts};`)
          .digest('hex');
        const result = await fetch(
          `${origin}/pagamento/mercadopago/webhook?data.id=${paymentId}`,
          {
            method: 'POST',
            headers: {
              'x-signature': `ts=${ts},v1=${signature}`,
              'x-request-id': requestId,
            },
          },
        );
        if (!result.ok)
          throw new Error(`Webhook de teste recusado: ${result.status}`);
      },
    };
  } catch (error) {
    await close();
    throw error;
  }
};
