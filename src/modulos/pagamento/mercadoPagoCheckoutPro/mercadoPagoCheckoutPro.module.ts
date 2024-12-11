import {  Module } from "@nestjs/common";
import { MercadoPagoCheckoutProController } from "./mercadoPagoCheckoutPro.controller";
import { MercadoPagoCheckoutProService } from "./mercadoPagoCheckoutPro.service";

import { TypeOrmModule } from "@nestjs/typeorm";
import { PagamentoEntity } from "../pagamento.entity";
import { ConfiguracaoModule } from "src/modulos/configuracao/configuracao.module";


@Module({
    imports: [ConfiguracaoModule, TypeOrmModule.forFeature([PagamentoEntity])],
    controllers: [MercadoPagoCheckoutProController],
    providers: [MercadoPagoCheckoutProService]
})
export class MercadoPagoCheckoutProModule {
    constructor() {
        const requiredEnvVars = [
            'MERCADO_PAGO_NOTIFICATION_URL',
            'MERCADO_PAGO_BACK_URL_SUCCESS',
            'MERCADO_PAGO_BACK_URL_FAILURE',
            'MERCADO_PAGO_BACK_URL_PENDING',
            'MERCADO_PAGO_TOKEN'
        ];

        requiredEnvVars.forEach((envVar) => {
            if (!process.env[envVar]) {
                throw new Error(`A variável de ambiente ${envVar} não está definida. A aplicação será encerrada.`);
            }
        });
    }
}
