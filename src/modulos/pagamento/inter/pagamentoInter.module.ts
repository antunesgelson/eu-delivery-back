import { Module } from "@nestjs/common";
import { PagamentoInterController } from "./pagamentoInter.controller";
import { PagamentoInterService } from "./pagamentoInter.service";

import { TypeOrmModule } from "@nestjs/typeorm";
import { PagamentoEntity } from "../pagamento.entity";
import { PagamentoInterTokenEntity } from "./pagamentoInterToken.entity";
import { ConfiguracaoModule } from "src/modulos/configuracao/configuracao.module";

@Module({
    imports: [ConfiguracaoModule, TypeOrmModule.forFeature([PagamentoEntity,PagamentoInterTokenEntity])],
    controllers:[PagamentoInterController],
    providers:[PagamentoInterService]
})
export class PagamentoInterModule{

    constructor() {
        const requiredEnvVars = [
            'INTER_PIX_CHAVEPIX',//INTER_PIX_QRCODEGENERATE
            'INTER_CLIENT_ID',
            'INTER_CLIENT_SECRET',
            'INTER_CERTIFICADO_KEY',//CHAVE .key
            'INTER_CERTIFICADO',//LOCAL AONDE ESTÁ O CERTIFICADO DO BANCO INTER .crt
        ];

        requiredEnvVars.forEach((envVar) => {
            if (!process.env[envVar]) {
                throw new Error(`A variável de ambiente ${envVar} não está definida. A aplicação será encerrada.`);
            }
        });
    }



}