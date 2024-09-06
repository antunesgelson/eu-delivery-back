import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriaEntity } from "../categoria/categorias.entity";
import { IngredientesEntity } from "../ingrediente/ingredientes.entity";
import { ProdutoController } from "./produto.controller";
import { ProdutoService } from "./produto.service";
import { ProdutosIngredientesEntity } from "./produtoIngrediente.entity";
import { ProdutoEntity } from "./produtos.entity";
import { s3Module } from "../s3/s3.module";

@Module({
    imports: [
        s3Module,
        TypeOrmModule.forFeature([ProdutoEntity, CategoriaEntity, ProdutosIngredientesEntity, IngredientesEntity])],
    controllers: [ProdutoController],
    providers: [
        ProdutoService
    ]
    
})
export class ProdutoModule {

}