import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { FalhaConciliacao } from '../../common/conciliacao';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  Pedido,
  Pagamento,
  Auditoria,
  CatalogoVersao,
  Usuario,
  BeneficioMovimento,
  Premio,
  Estoque,
  Cupom,
  CupomUso,
  Conciliacao,
} from '../../database/entities';
@Injectable()
export class MercadoPagoGateway {
  async request(path: string, options: RequestInit = {}) {
    if (!process.env.MERCADO_PAGO_TOKEN)
      throw new ServiceUnavailableException(
        'Pagamento online não configurado.',
      );
    const response = await fetch(`https://api.mercadopago.com${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MERCADO_PAGO_TOKEN}`,
        ...options.headers,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new ServiceUnavailableException(
        'O provedor de pagamentos não respondeu. Tente novamente.',
      );
    return response.json();
  }
  preference(order: Pedido) {
    return this.request('/checkout/preferences', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': `pedido-${order.id}` },
      body: JSON.stringify({
        items: [
          {
            id: String(order.id),
            title: `Pedido ${order.id} - Assados Zanini`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: order.totalCentavos / 100,
          },
        ],
        external_reference: String(order.id),
        ...(order.pagamentoExpiraEm
          ? {
              expires: true,
              expiration_date_from: new Date().toISOString(),
              expiration_date_to: order.pagamentoExpiraEm.toISOString(),
            }
          : {}),
        notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/orderstatus?id=${order.id}`,
          pending: `${process.env.FRONTEND_URL}/orderstatus?id=${order.id}`,
          failure: `${process.env.FRONTEND_URL}/orderstatus?id=${order.id}`,
        },
      }),
    });
  }
  buscarAprovados(orderId: number) {
    return this.request(
      `/v1/payments/search?external_reference=${orderId}&status=approved&limit=100`,
    );
  }
  payment(id: string) {
    return this.request(`/v1/payments/${encodeURIComponent(id)}`);
  }
}
export function validarAssinatura(
  signature: string,
  requestId: string,
  id: string,
  secret: string,
  now = Date.now(),
) {
  if (!secret || !signature || !requestId || !id)
    throw new UnauthorizedException('Assinatura ausente.');
  const parts = Object.fromEntries(
    signature.split(',').map((s) => s.trim().split('=')),
  );
  const ts = parts.ts;
  if (!/^\d{10,13}$/.test(ts ?? '') || !/^[a-f\d]{64}$/i.test(parts.v1 ?? ''))
    throw new UnauthorizedException('Assinatura inválida.');
  const time = Number(ts) * (ts.length === 10 ? 1000 : 1);
  if (Math.abs(now - time) > 300000)
    throw new UnauthorizedException('Notificação expirada.');
  const expected = createHmac('sha256', secret)
    .update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`)
    .digest();
  if (
    !timingSafeEqual(
      Uint8Array.from(expected),
      Uint8Array.from(Buffer.from(parts.v1, 'hex')),
    )
  )
    throw new UnauthorizedException('Assinatura inválida.');
}
@Injectable()
export class PagamentosService {
  constructor(
    private db: DataSource,
    private gateway: MercadoPagoGateway,
  ) {}
  habilitado() {
    return Boolean(
      process.env.MERCADO_PAGO_TOKEN &&
        process.env.MERCADO_PAGO_WEBHOOK_SECRET &&
        process.env.MERCADO_PAGO_COLLECTOR_ID &&
        process.env.MERCADO_PAGO_NOTIFICATION_URL,
    );
  }
  async criar(id: number, usuarioId: number) {
    if (!this.habilitado())
      throw new ServiceUnavailableException(
        'Pagamento online ainda não disponível.',
      );
    return this.db.transaction(async (m) => {
      const order = await m
        .getRepository(Pedido)
        .createQueryBuilder('p')
        .where('p.id=:id AND p.usuarioId=:usuarioId', { id, usuarioId })
        .setLock('pessimistic_write')
        .getOne();
      if (
        !order ||
        order.status === 'carrinho' ||
        order.status === 'cancelled' ||
        !order.formaPagamento.startsWith('Pagamento online')
      )
        throw new BadRequestException('Pedido inválido para pagamento online.');
      if (order.pagamentoStatus === 'paid') return { paid: true };
      if (order.pagamentoExpiraEm && order.pagamentoExpiraEm <= new Date())
        throw new ConflictException(
          'Prazo de pagamento encerrado. Aguarde a atualização do pedido.',
        );
      let payment = await m.findOneBy(Pagamento, { pedidoId: id });
      if (payment?.checkoutUrl) return { checkoutUrl: payment.checkoutUrl };
      const response = await this.gateway.preference(order);
      const url =
        process.env.MERCADO_PAGO_SANDBOX === 'true'
          ? response.sandbox_init_point
          : response.init_point;
      if (
        typeof url !== 'string' ||
        !/^https:\/\/(www\.)?(sandbox\.)?mercadopago\.(com\.br|com|com\.ar)\//.test(
          url,
        )
      )
        throw new ServiceUnavailableException('Resposta de checkout inválida.');
      payment = await m.save(Pagamento, {
        ...payment,
        pedidoId: id,
        preferenceId: String(response.id),
        checkoutUrl: url,
        totalCentavos: order.totalCentavos,
      });
      return { checkoutUrl: payment.checkoutUrl };
    });
  }
  async webhook(id: string, signature: string, requestId: string) {
    if (!this.habilitado())
      throw new ServiceUnavailableException('Webhook não configurado.');
    if (!/^\d{1,30}$/.test(id ?? ''))
      throw new BadRequestException('Identificador inválido.');
    validarAssinatura(
      signature,
      requestId,
      id,
      process.env.MERCADO_PAGO_WEBHOOK_SECRET,
    );
    const remote = await this.gateway.payment(id);
    await this.db.transaction((m) => this.processar(m, remote, id));
    return { received: true };
  }
  private assinaturaPagamento(payment: Pagamento | null) {
    if (!payment) return 'sem-pagamento';
    return JSON.stringify([
      payment.id,
      payment.preferenceId,
      payment.providerId,
      payment.status,
      payment.eventoEm?.toISOString(),
      payment.totalCentavos,
    ]);
  }
  async consultarParaExpiracao(order: Pedido) {
    const payment = await this.db
      .getRepository(Pagamento)
      .findOneBy({ pedidoId: order.id });
    const consulta = {
      assinatura: this.assinaturaPagamento(payment),
      remotos: [] as any[],
    };
    if (!payment) return consulta;
    if (!this.habilitado()) throw new FalhaConciliacao('configuracao');
    try {
      const result = await this.gateway.buscarAprovados(order.id);
      if (
        !Array.isArray(result?.results) ||
        !Number.isInteger(result.paging?.total) ||
        result.paging.total !== result.results.length
      )
        throw new FalhaConciliacao('resposta_invalida');
      // Mais de uma aprovação para um pedido exige conferência; limita também o tempo de consulta.
      if (result.results.length > 1)
        throw new FalhaConciliacao('divergencia_referencia');
      for (const item of result.results) {
        if (!/^\d{1,30}$/.test(String(item.id)))
          throw new FalhaConciliacao('resposta_invalida');
        const remote = await this.gateway.payment(String(item.id));
        if (
          !remote ||
          String(remote.id) !== String(item.id) ||
          String(remote.external_reference) !== String(order.id)
        )
          throw new FalhaConciliacao('divergencia_referencia');
        if (remote.currency_id !== 'BRL')
          throw new FalhaConciliacao('divergencia_moeda');
        if (
          String(remote.collector_id) !== process.env.MERCADO_PAGO_COLLECTOR_ID
        )
          throw new FalhaConciliacao('divergencia_recebedor');
        if (
          Math.round(Number(remote.transaction_amount) * 100) !==
          order.totalCentavos
        )
          throw new FalhaConciliacao('divergencia_valor');
        if (
          !Number.isFinite(new Date(remote.date_last_updated).getTime()) ||
          !['approved', 'refunded', 'charged_back'].includes(remote.status)
        )
          throw new FalhaConciliacao('resposta_invalida');
        consulta.remotos.push(remote);
      }
      return consulta;
    } catch (error) {
      if (error instanceof FalhaConciliacao) throw error;
      throw new FalhaConciliacao('comunicacao');
    }
  }
  async aplicarConciliacao(
    m: EntityManager,
    order: Pedido,
    consulta: Awaited<ReturnType<PagamentosService['consultarParaExpiracao']>>,
  ) {
    const payment = await m.findOneBy(Pagamento, { pedidoId: order.id });
    if (this.assinaturaPagamento(payment) !== consulta.assinatura)
      throw new FalhaConciliacao('concorrencia');
    for (const remote of consulta.remotos)
      await this.processar(m, remote, String(remote.id), 'conciliacao');
  }
  private async processar(
    m: EntityManager,
    remote: any,
    id: string,
    origem = 'webhook',
  ) {
    if (
      String(remote.id) !== id ||
      remote.currency_id !== 'BRL' ||
      String(remote.collector_id) !== process.env.MERCADO_PAGO_COLLECTOR_ID
    )
      throw new BadRequestException('Pagamento não pertence à integração.');
    const orderId = Number(remote.external_reference);
    if (!Number.isSafeInteger(orderId) || orderId < 1)
      throw new BadRequestException('Referência inválida.');
    const version = await m
      .getRepository(CatalogoVersao)
      .createQueryBuilder('v')
      .where('v.id=1')
      .setLock('pessimistic_write')
      .getOneOrFail();
    const order = await m
      .getRepository(Pedido)
      .createQueryBuilder('p')
      .where('p.id=:id', { id: orderId })
      .setLock('pessimistic_write')
      .getOne();
    const payment = await m.findOneBy(Pagamento, { pedidoId: orderId });
    if (
      !order ||
      !payment ||
      Math.round(Number(remote.transaction_amount) * 100) !==
        order.totalCentavos
    )
      throw new BadRequestException('Valor ou referência divergente.');
    const changedAt = new Date(remote.date_last_updated);
    if (!Number.isFinite(changedAt.getTime()))
      throw new BadRequestException('Data do pagamento inválida.');
    if (payment.eventoEm && payment.eventoEm >= changedAt) return;
    if (
      payment.providerId &&
      payment.providerId !== id &&
      payment.status === 'approved'
    )
      throw new ConflictException('Pedido já pago por outra transação.');
    payment.providerId = id;
    payment.eventoEm = changedAt;
    payment.status = remote.status;
    if (remote.status === 'approved') {
      // Um estorno confirmado nunca é revertido por uma notificação de aprovação atrasada.
      if (order.pagamentoStatus === 'refunded') return;
      order.pagamentoStatus =
        order.status === 'cancelled' ? 'refund_pending' : 'paid';
    } else if (
      ['refunded', 'charged_back'].includes(remote.status) &&
      order.pagamentoStatus !== 'refunded'
    ) {
      const user = await m
        .getRepository(Usuario)
        .createQueryBuilder('u')
        .where('u.id=:id', { id: order.usuarioId })
        .setLock('pessimistic_write')
        .getOneOrFail();
      if (order.finalizadoEm) {
        user.cashbackCentavos -= order.cashbackGanhoCentavos;
        user.pontos = Math.max(0, user.pontos - 1);
        await m.save(BeneficioMovimento, {
          usuarioId: user.id,
          pedidoId: order.id,
          tipo: 'reversao_credito',
          centavos: -order.cashbackGanhoCentavos,
        });
        await m
          .getRepository(Premio)
          .createQueryBuilder()
          .update()
          .set({ valido: false })
          .where('usuarioId=:id AND ciclo>:ciclo', {
            id: user.id,
            ciclo: Math.floor(user.pontos / 6),
          })
          .execute();
      }
      if (order.status !== 'cancelled') {
        if (!order.finalizadoEm) {
          for (const r of order.reserva) {
            const stock = await m.findOneByOrFail(Estoque, {
              produtoId: r.produtoId,
              data: r.data,
            });
            stock.reservado = Math.max(
              0,
              Number(stock.reservado) - r.quantidade,
            );
            await m.save(stock);
          }
          order.status = 'cancelled';
        }
        if (order.cupomId) {
          await m.decrement(Cupom, { id: order.cupomId }, 'utilizados', 1);
          await m.update(CupomUso, { pedidoId: order.id }, { cancelado: true });
        }
        if (order.cashbackCentavos) {
          user.cashbackCentavos += order.cashbackCentavos;
          await m.save(BeneficioMovimento, {
            usuarioId: user.id,
            pedidoId: order.id,
            tipo: 'estorno',
            centavos: order.cashbackCentavos,
          });
        }
      }
      await m.save(user);
      order.pagamentoStatus = 'refunded';
      version.versao++;
      await m.save(version);
    } else if (
      !['paid', 'refunded', 'refund_pending'].includes(order.pagamentoStatus)
    )
      order.pagamentoStatus = 'pending';
    await m.save(order);
    await m.save(payment);
    if (order.status !== 'analysis' || order.pagamentoStatus !== 'pending')
      await m.update(
        Conciliacao,
        { pedidoId: order.id },
        { resolvidoEm: new Date(), ultimoSucessoEm: new Date() },
      );
    await m.save(Auditoria, {
      usuarioId: null,
      acao: `pagamento.${origem}`,
      recurso: String(order.id),
      dados: { status: remote.status, paymentId: id },
    });
  }
}
