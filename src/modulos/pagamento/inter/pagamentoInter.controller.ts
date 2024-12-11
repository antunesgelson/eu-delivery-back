import { Body, Controller, Get, Post } from "@nestjs/common";
import { CriarPedidoDTO } from "../DTO/criarPedido.dto";
import { PagamentoInterService } from "./pagamentoInter.service";
import { IsPublic } from "src/modulos/auth/decorators/isPublic.decorator";


@Controller('pagamento/inter')
export class PagamentoInterController {
    constructor(private readonly inter: PagamentoInterService) { }
    @Post('qrcode')
    @IsPublic()
    async criarPedido(@Body() dto: { external_reference: string }) {
        const pedido = { ...dto, "itens": [{ "title": "LoveYou", "quantity": 1, "description": "LoveYou", "unit_price": 29.90, "id": "1" }] }
        return this.inter.criarPedido(pedido);
    }
}