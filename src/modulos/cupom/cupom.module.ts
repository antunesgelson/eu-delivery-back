import { Module } from "@nestjs/common";
import { CupomController } from "./cupom.controller";
import { CupomService } from "./cupom.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CupomEntity } from "./cupom.entity";
import { CupomUtilizadoEntity } from "./cupomUtilizado.entity";


@Module({
    imports:[TypeOrmModule.forFeature([CupomEntity,CupomUtilizadoEntity])],
    controllers:[CupomController],
    providers:[CupomService]
})
export class CupomModule{

}