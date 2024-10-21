import { Module } from "@nestjs/common";
import { ConfiguracaoController } from "./configuracao.controller";
import { ConfiguracaoService } from "./configuracao.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfiguracaoEntity } from "./configuracao.entity";

@Module({
    imports:[TypeOrmModule.forFeature([ConfiguracaoEntity])],
    controllers:[ConfiguracaoController],
    providers:[ConfiguracaoService],
})
export class ConfiguracaoModule{

}