import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProdutoEntity } from "../produto/produtos.entity";
import { IngredientesController } from "./ingrediente.controller";
import { IngredientesEntity } from "./ingredientes.entity";
import { AddIngredienteService } from './services/addIngrediente.service';

@Module({
    imports: [TypeOrmModule.forFeature([ProdutoEntity, IngredientesEntity])],
    controllers: [IngredientesController],
    providers: [
        AddIngredienteService,
    ]
})
export class IngredienteModule {

}