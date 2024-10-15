import { Module } from "@nestjs/common";
import { PedidoController } from "./pedido.controller";
import { PedidoService } from "./pedido.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PedidoEntity } from "./pedido.entity";
import { ProdutoEntity } from "../produto/produtos.entity";
import { IngredientesEntity } from "../ingrediente/ingredientes.entity";
import { PedidoItensEntity } from "./pedidoItens.entity";
import { EnderecoModule } from "../endereco/endereco.module";
import { EnderecoEntity } from "../endereco/endereco.entity";
import { CupomEntity } from "../cupom/cupom.entity";

@Module({
    imports:[EnderecoModule,TypeOrmModule.forFeature([PedidoEntity,ProdutoEntity,IngredientesEntity,PedidoItensEntity,EnderecoEntity,CupomEntity])],
    controllers:[PedidoController],
    providers:[PedidoService],
})
export class PedidoModule{

}