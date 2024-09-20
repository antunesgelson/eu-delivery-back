import { Body, Controller, Get, Post, Put, Req } from "@nestjs/common";
import { PedidoService } from "./pedido.service";

@Controller('pedido')
export class PedidoController {

    constructor(private pedidoService: PedidoService) { }

    @Post('/carrinho')
    async adicionarItemAoCarrinho(@Body() pedidoDTO, @Req() request) {
        const pedido = {...pedidoDTO, usuarioId:request.user.sub}
        return this.pedidoService.adicionarItemAoCarrinho(pedido)
    }

    @Get('/carrinho')
    async itensDoCarrinho() { }

    @Put('/carrinho')
    async editarQuantidadeDeItensNoCarrinho() { }

    @Get()
    async buscarUltimosPedidos() { }

    @Get(':pedidoId')
    async buscarPedidoPorId() { }

}