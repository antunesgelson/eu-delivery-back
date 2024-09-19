import { Body, Controller, Get, Post, Put } from "@nestjs/common";
import { PedidoService } from "./pedido.service";

@Controller('pedido')
export class PedidoController{

    constructor(private pedidoService:PedidoService){}

    @Post('/carrinho')
    async adicionarItemAoCarrinho(@Body() pedidoDTO){
        return this.pedidoService.adicionarItemAoCarrinho(pedidoDTO)
    }

    @Get('/carrinho')
    async itensDoCarrinho(){}

    @Put('/carrinho')
    async editarQuantidadeDeItensNoCarrinho(){}

    @Get()
    async buscarUltimosPedidos(){}

    @Get(':pedidoId')
    async buscarPedidoPorId(){}

}