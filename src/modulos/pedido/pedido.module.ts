import { Module } from "@nestjs/common";
import { PedidoController } from "./pedido.controller";
import { PedidoService } from "./pedido.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PedidoEntity } from "./pedido.entity";
import { ProdutoEntity } from "../produto/produtos.entity";
import { IngredientesEntity } from "../ingrediente/ingredientes.entity";

@Module({
    imports:[TypeOrmModule.forFeature([PedidoEntity,ProdutoEntity,IngredientesEntity])],
    controllers:[PedidoController],
    providers:[PedidoService]
})
export class PedidoModule{

}