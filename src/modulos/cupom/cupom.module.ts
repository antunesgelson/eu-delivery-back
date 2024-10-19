import { Module } from "@nestjs/common";
import { CupomController } from "./cupom.controller";
import { CupomService } from "./cupom.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CupomEntity } from "./cupom.entity";
import { CupomUtilizadoEntity } from "./cupomUtilizado.entity";
import { PedidoModule } from "../pedido/pedido.module";


@Module({
    imports:[TypeOrmModule.forFeature([CupomEntity,CupomUtilizadoEntity]),PedidoModule],
    controllers:[CupomController],
    providers:[CupomService]
})
export class CupomModule{

}