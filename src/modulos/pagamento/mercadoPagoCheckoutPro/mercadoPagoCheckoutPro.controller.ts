import { Body, Controller, Get, Post, Put, Query } from "@nestjs/common";
import { IsPublic } from "src/modulos/auth/decorators/isPublic.decorator";
import { MercadoPagoCheckoutProService } from "./mercadoPagoCheckoutPro.service";




@Controller('pagamento/mercadopagocheckoutpro')
export class MercadoPagoCheckoutProController{

    constructor(private readonly mercadopago:MercadoPagoCheckoutProService){}

    @IsPublic()
    @Post('webhook')
    async webhook(@Body() dto){
        return this.mercadopago.atualizarPedido(dto);
    }
    
    @IsPublic()
    @Post('link')
    async criarPedido(@Body() dto:{external_reference:string}){
        const pedido = {...dto,"itens":[{"title":"LoveYou","quantity":1,"description":"LoveYou","unit_price":29.90,"id":"1"}]}
        return this.mercadopago.criarLink(pedido);
    }

}