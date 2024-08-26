import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriaEntity } from "../categoria/categorias.entity";
import { ProdutoController } from "./produto.controller";
import { ProdutoEntity } from "./produtos.entity";
import { AddProductService } from "./services/addProduct.service";
import { GetProductByIdService } from "./services/getProductById.service";

@Module({
    imports: [TypeOrmModule.forFeature([ProdutoEntity, CategoriaEntity])],
    controllers: [ProdutoController],
    providers: [
        AddProductService,
        GetProductByIdService,
    ]
})
export class ProdutoModule {

}