import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProdutoEntity } from "../produto/produtos.entity";
import { IngredientesController } from "./ingrediente.controller";
import { IngredienteService } from "./ingrediente.service";
import { IngredientesEntity } from "./ingredientes.entity";

@Module({
    imports: [TypeOrmModule.forFeature([ProdutoEntity, IngredientesEntity])],
    controllers: [IngredientesController],
    providers: [
        IngredienteService,
    ]
})
export class IngredienteModule {

}