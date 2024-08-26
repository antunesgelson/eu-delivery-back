import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProdutoEntity } from "../produto/produtos.entity";
import { AdicionaisEntity } from './adicionais.entity';
import { AdicionaisController } from './adicional.controller';
import { AddAdicionaisService } from "./services/addAdicionais.service";

@Module({
    imports: [TypeOrmModule.forFeature([ProdutoEntity, AdicionaisEntity])],
    controllers: [AdicionaisController],
    providers: [
        AddAdicionaisService,
    ]
})
export class AdicinaisModule {

}