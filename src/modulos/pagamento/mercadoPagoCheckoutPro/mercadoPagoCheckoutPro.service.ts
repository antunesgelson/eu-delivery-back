import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { MercadoPagoConfig, Preference } from 'mercadopago'


import { InjectRepository } from "@nestjs/typeorm";
import { PagamentoEntity } from "../pagamento.entity";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import axios from "axios";
import { CriarPedidoDTO } from "../DTO/criarPedido.dto";
import { ConfiguracaoService } from "src/modulos/configuracao/configuracao.service";

@Injectable()
export class MercadoPagoCheckoutProService {
    constructor(
        @InjectRepository(PagamentoEntity) private pagamentoRepository: Repository<PagamentoEntity>,
        private readonly configuracaoService: ConfiguracaoService,
        private eventEmitter: EventEmitter2
    ) { }

    async criarLink(dto: CriarPedidoDTO) {
        const precoConfig = await this.configuracaoService.getConfig({ chave: 'valor', isAdmin: true }).catch(() => null);
        if (!precoConfig || !precoConfig.valor) {throw new BadRequestException('Valor do item não configurado.');}
        const unitPrice = parseFloat(precoConfig.valor);
        dto.itens[0].unit_price = unitPrice;
        
        const token = await this.configuracaoService.getConfig({ chave: 'mercadoPagoAccessToken', isAdmin: true }).catch(() => null);
        if (!token) throw new BadRequestException("É preciso cadastrar o mercadoPagoAccessToken nas configurações para utilizar esse método.")
        const client = new MercadoPagoConfig({ accessToken: token.valor })
        const preference = new Preference(client);
        const response = await preference.create({
            body: {
                items: dto.itens,
                binary_mode: true,
                external_reference: dto.external_reference.toString(),
                notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL,
                back_urls: {
                    success: process.env.MERCADO_PAGO_BACK_URL_SUCCESS,
                    failure: process.env.MERCADO_PAGO_BACK_URL_FAILURE,
                    pending: process.env.MERCADO_PAGO_BACK_URL_PENDING,
                },
                auto_return: 'approved',
                payment_methods: {
                    excluded_payment_types: [
                        { id: 'ticket' },           // Exclui boleto
                        { id: 'atm' },              // Exclui pagamento em lotéricas e caixas eletrônicos
                    ],
                    excluded_payment_methods: [
                        // Exclui transferências bancárias tradicionais, mantendo apenas o PIX
                        { id: 'transf' },
                        { id: 'bolbradesco' },      // Exclui boleto bancário Bradesco
                        // Adicione outros métodos específicos que deseja excluir
                    ],
                    installments: 1,             // Número máximo de parcelas
                    default_installments: 1,
                },
            }
        });
        //criar um registro na tabela de pagamentos e salvar no log o retorno do response...
        return response.init_point
    }

    async atualizarPedido(dto) {
        if (dto.topic == 'payment') {
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `https://api.mercadopago.com/v1/payments/${dto.resource}`,
                headers: {
                    'Authorization': `Bearer ${process.env.MERCADO_PAGO_TOKEN}`
                }
            };

            const response = await axios.request(config).then(response=>response.data).catch((error) => { this.eventEmitter.emit('pagamento.error', {...error,metodo:'atualizarPedido'}); return undefined });
            if (!response) throw new HttpException('Erro ao tentar consultar o pagamento.', HttpStatus.BAD_REQUEST);
            let pagamento;
            const isPagamento = await this.pagamentoRepository.findOne({ where: { referenciaId: response.id.toString() } })
            if (!isPagamento) {
                pagamento = {
                    logs: JSON.stringify([response]),
                    referenciaId: response.external_reference,
                    transactionId: response.id.toString(),
                } as PagamentoEntity
                if (response.status == "approved") {
                    pagamento.valor = response.transaction_details.installment_amount
                    //taxa= valor total - o valor recebido..
                    pagamento.taxa = response.transaction_details.installment_amount - response.transaction_details.net_received_amount
                    pagamento.status = "APROVADO"
                    pagamento.metadados = JSON.stringify({ "email": response.payer.email })
                }
                pagamento = await this.pagamentoRepository.save(pagamento);
                if (response.status == "approved") this.eventEmitter.emit('pagamento.aprovado', pagamento);
            } else {
                pagamento = isPagamento as PagamentoEntity;
                //lança um evento se o status atual for aprovado e o antigo ainda não for aprovado.
                if (response.status == "approved" && pagamento.status != "APROVADO") {
                    this.eventEmitter.emit('pagamento.aprovado', pagamento);
                    pagamento.status = "APROVADO";
                }
                if (pagamento.status != "APROVADO") {
                    if (
                        response.status == 'pending' ||
                        response.status == 'in_process' ||
                        response.status == 'authorized'
                    ) pagamento.status = "PENDENTE"
                    if (
                        response.status == 'rejected' ||
                        response.status == 'cancelled'
                    ) pagamento.status = "CANCELADO"
                }

                const logs = JSON.parse(pagamento.logs);
                logs.push(response)
                pagamento.logs = JSON.stringify(logs)
                await this.pagamentoRepository.save(pagamento);
            }
            this.eventEmitter.emit('pagamento.change', pagamento);
            return response
        }
        this.eventEmitter.emit('pagamento.change', dto);
    }
}