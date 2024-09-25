import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req } from "@nestjs/common";
import { PedidoService } from "./pedido.service";
import { AdicionarItemAoCarrinhoDTO } from "./dto/adicionarItemAoCarrinho.dto";

@Controller('pedido')
export class PedidoController {

    constructor(private pedidoService: PedidoService) { }

    @Post('/carrinho')
    async adicionarItemAoCarrinho(@Body() pedidoDTO:AdicionarItemAoCarrinhoDTO, @Req() request) {
        const pedido = {...pedidoDTO, clienteId:request.user.sub}
        return this.pedidoService.adicionarItemAoCarrinho(pedido)
    }

    //lista todos itens que estão no carrinho.
    @Get('/carrinho')
    async itensDoCarrinho(@Req() request){
        return this.pedidoService.itensDoCarrinho({usuarioId:request.user.sub})
    }



    @Put('/carrinho')
    async editarQuantidadeDeItensNoCarrinho(@Body() dadosDTO, @Req() request) {
        const item ={...dadosDTO, usuarioId:request.user.sub};
        return this.pedidoService.editarQuantidadeDeItensNoCarrinho(item);
    }


    @Delete('/carrinho/item/:itemId')
    async removerItemDoCarrinho(@Param('itemId', ParseIntPipe) itemId: number, @Req() request) {
        const item ={pedidoItemId:itemId, usuarioId:request.user.sub};
        return this.pedidoService.removerItemDoCarrinho(item);
    }

    @Get()
    async buscarUltimosPedidos() { }

    @Get(':pedidoId')
    async buscarPedidoPorId() { }

}