import { BadRequestException, Injectable } from "@nestjs/common";
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { MpCkPCriarPedidoDTO } from "./DTO/mpCkPCriarPedidoDTO.dto";
import { ConfiguracaoService } from "src/modulos/configuracao/configuracao.service";

@Injectable()
export class MercadoPagoCheckoutProService {
    constructor(
        private readonly configuracaoService: ConfiguracaoService,
    ) {}

    async criarLink(dto: MpCkPCriarPedidoDTO) {

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
}