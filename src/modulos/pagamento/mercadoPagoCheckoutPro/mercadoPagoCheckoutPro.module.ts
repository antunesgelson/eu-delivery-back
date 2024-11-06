import { Module } from "@nestjs/common";
import { MercadoPagoCheckoutProController } from "./mercadoPagoCheckoutPro.controller";
import { MercadoPagoCheckoutProService } from "./mercadoPagoCheckoutPro.service";
import { ConfiguracaoModule } from "src/modulos/configuracao/configuracao.module";

@Module({
    controllers: [MercadoPagoCheckoutProController],
    providers: [MercadoPagoCheckoutProService],
    imports:[ConfiguracaoModule]
})
export class MercadoPagoCheckoutProModule {
    constructor() {
        const requiredEnvVars = [
            'MERCADO_PAGO_ACCESS_TOKEN',
            'MERCADO_PAGO_NOTIFICATION_URL',
            'MERCADO_PAGO_BACK_URL_SUCCESS',
            'MERCADO_PAGO_BACK_URL_FAILURE',
            'MERCADO_PAGO_BACK_URL_PENDING',
        ];

        requiredEnvVars.forEach((envVar) => {
            if (!process.env[envVar]) {
                throw new Error(`A variável de ambiente ${envVar} não está definida. A aplicação será encerrada.`);
            }
        });
    }
}
