import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PagamentoEntity, statusPagamento } from "../pagamento.entity";

import { Like, Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CriarPedidoDTO } from "../DTO/criarPedido.dto";
import * as moment from 'moment';
import * as querystring from 'querystring';
import GerarQrcodePixUtils from "src/shared/utils/gerarQrCodePix.utils";
import { PagamentoInterTokenEntity } from "./pagamentoInterToken.entity";
import * as fs from 'fs';
import axios from "axios";
import { ConfiguracaoService } from "src/modulos/configuracao/configuracao.service";

@Injectable()
export class PagamentoInterService {
    private lastPagamento: boolean = false;
    constructor(
        @InjectRepository(PagamentoEntity) private pagamentoRepository: Repository<PagamentoEntity>,
        @InjectRepository(PagamentoInterTokenEntity) private pagamentoInterTokenRepository: Repository<PagamentoInterTokenEntity>,
        private readonly configuracaoService: ConfiguracaoService,
        private eventEmitter: EventEmitter2

    ) {
        this.iniciarVerificacaoPagamentos();
    }

    private iniciarVerificacaoPagamentos() {
        const loopVerificacao = async () => {
            try {
                await this.verificarPagamentos();
            } catch (error) {
               // console.error('Erro na verificação de pagamentos:', error);
                error.message = "Erro ao tentar verificar o extrato.";
                this.eventEmitter.emit('app.error',error.message)
            } finally {
                setTimeout(loopVerificacao, 7000); // Executa a função a cada 7 segundos
            }
        };
        loopVerificacao(); // Inicia o loop
    }

    private async verificarPagamentos() {
        if (this.lastPagamento) {
            const pagamentosPendentes = await this.pagamentoRepository.find({
                where: { status: "PENDENTE" as statusPagamento, transactionId: Like(`PG%`) },
                order: { id: "DESC" }
            });
            // Verificar se não existem pagamentos pendentes
            if (!pagamentosPendentes.length) {
                this.lastPagamento = false;
                console.log('Não existem pagamentos pendentes.');
                return;
            }
            // Verificar se os pagamentos pendentes têm mais de 30 minutos de criação
            const agora = moment();
            const pagamentosExpirados = pagamentosPendentes.filter(pendente =>
                agora.diff(moment(pendente.created_at), 'minutes') >= 30
            );
            if (pagamentosExpirados.length === pagamentosPendentes.length) {
                this.lastPagamento = false;
                console.log('Todos os pagamentos pendentes expiraram (mais de 30 minutos).');
                return;
            }
            const token = await this.gerarNovoTokenInter('extrato.read');

            let config = {
                method: 'get',
                url: `${process.env.INTER_URL_API}/banking/v2/extrato/completo?dataInicio=${moment().format("YYYY-MM-DD")}&dataFim=${moment().add(1, 'days').format("YYYY-MM-DD")}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                httpsAgent: new (require('https').Agent)({
                    key: fs.readFileSync(process.env.INTER_CERTIFICADO_KEY),
                    cert: fs.readFileSync(process.env.INTER_CERTIFICADO)
                })
            };

            console.log(config)
            const response = await axios.request(config);
            const pagamentosEfetuados = response.data.transacoes;
            const pagamentosLiberar = pagamentosPendentes.filter(pendente =>
                pagamentosEfetuados.some(efetuado => efetuado.detalhes.txId === pendente.transactionId)
            );
            // Atualizar status dos pagamentos que coincidem
            for (const pagamento of pagamentosLiberar) {
                pagamento.status = "APROVADO" as statusPagamento; // Altere para o status desejado
                pagamento.updated_at = new Date();
                await this.pagamentoRepository.save(pagamento);
                this.eventEmitter.emit('pagamento.aprovado', pagamento);
            }
            return;
        }
    }

    private async gerarNovoTokenInter(scope: string) {
        let interToken = await this.pagamentoInterTokenRepository.findOne({ where: { scope: scope } });
        if (interToken) {
            let dataUpdate = moment(interToken.updated_at);
            let dataAgora = moment();
            console.log(dataUpdate,dataAgora,dataAgora.diff(dataUpdate, 'minutes'))
            if (dataAgora.diff(dataUpdate, 'minutes') < 15) return interToken.token;
        }
        const postData = querystring.stringify({
            client_id: process.env.INTER_CLIENT_ID,
            client_secret: process.env.INTER_CLIENT_SECRET,
            scope: scope,
            grant_type: 'client_credentials'
        });
        const response = await axios.post(`${process.env.INTER_URL_API}/oauth/v2/token`, postData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            httpsAgent: new (require('https').Agent)({
                key: fs.readFileSync(process.env.INTER_CERTIFICADO_KEY),
                cert: fs.readFileSync(process.env.INTER_CERTIFICADO)
            })
        });
        const newToken = response.data;
        if (newToken) {
            if (!interToken) {
                await this.pagamentoInterTokenRepository.save({ scope: scope, token: newToken.access_token })
            } else {
                interToken.token = newToken.access_token;
                await this.pagamentoInterTokenRepository.save(interToken)
            }
            return newToken.access_token;
        }
    }



    async criarPedido(dto: CriarPedidoDTO) {
        const precoConfig = await this.configuracaoService.getConfig({ chave: 'valor', isAdmin: true }).catch(() => null);
        if (!precoConfig || !precoConfig.valor) { throw new BadRequestException('Valor do item não configurado.'); }
        const unitPrice = parseFloat(precoConfig.valor);
        dto.itens[0].unit_price = unitPrice;
        const gerarQrcodePixUtils = new GerarQrcodePixUtils();
        let pagamento = new PagamentoEntity();
        pagamento.referenciaId = dto.external_reference
        let transactionId = `PG${moment().format('YYYYMMDD')}`;
        pagamento.taxa = 0;
        pagamento.valor = dto.itens[0].unit_price
        pagamento.transactionId = transactionId;
        pagamento = await this.pagamentoRepository.save(pagamento)
        pagamento.transactionId = `${pagamento.transactionId}${pagamento.id.toString()}`
        let metadados: any = {};
        let qrcodeThis = await gerarQrcodePixUtils.criarPedido(dto.itens[0].unit_price.toFixed(2), pagamento.transactionId, process.env.INTER_PIX_CHAVEPIX);
        metadados.pixCopiaECola = qrcodeThis == null ? '' : qrcodeThis;
        metadados.key = process.env.INTER_PIX_CHAVEPIX
        pagamento.metadados = JSON.stringify(metadados)
        await this.pagamentoRepository.save(pagamento);
        this.lastPagamento = true;
        this.eventEmitter.emit('pagamento.change', pagamento);
        await this.pagamentoRepository.save(pagamento);
        return metadados.pixCopiaECola;
    }

}