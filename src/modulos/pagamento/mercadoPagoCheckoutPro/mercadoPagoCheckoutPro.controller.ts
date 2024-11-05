import { Body, Controller, Get, Post, Put, Query } from "@nestjs/common";
import { IsPublic } from "src/modulos/auth/decorators/isPublic.decorator";
import { MercadoPagoCheckoutProService } from "./mercadoPagoCheckoutPro.service";
import { MpCkPCriarPedidoDTO } from "./DTO/mpCkPCriarPedidoDTO.dto";

@Controller('pagamento/mercadopagocheckoutpro')
export class MercadoPagoCheckoutProController{

    constructor(private readonly mercadopago:MercadoPagoCheckoutProService){}

    @IsPublic()
    @Post('webhook')
    async webhook(@Body() body,@Query() query){
        console.log('body',body);
        console.log('query',query);
        console.log(query['data.id'])
        return 'ok'
    }

    @IsPublic()
    @Post('link')
    async criarPedido(@Body() dto:MpCkPCriarPedidoDTO){
        return this.mercadopago.criarLink(dto);
    }

}