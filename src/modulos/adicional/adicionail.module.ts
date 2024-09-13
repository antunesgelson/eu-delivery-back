import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProdutoEntity } from "../produto/produtos.entity";
import { AdicionaisController } from './adicional.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ProdutoEntity])],
    controllers: [AdicionaisController],
    providers: [ ]
})
export class AdicinaisModule {

}