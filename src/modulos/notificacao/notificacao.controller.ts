import { Body, Controller, Post, SetMetadata } from "@nestjs/common";

import { NotificacaoService } from "./notificacao.service";
import { EnviarEmailNotificacaoDTO } from "./dto/enviarEmailNotificacao.dto";
import { EnviarTelegramNotificacaoDTO } from "./dto/enviarTelegramNotificacao.dto";
import { IsPublic } from "../auth/decorators/isPublic.decorator";


@Controller('notificacao')
export class NotificacaoController{
    constructor(private notificacaoService:NotificacaoService){}
    
    @Post('email')
    @SetMetadata('isAdmin',true)
    async emailTeste(@Body() dto:EnviarEmailNotificacaoDTO){
        return this.notificacaoService.eventEnviarEmail(dto)
    }


    @Post('email/suporte')
    @IsPublic()
    async emailSuporte(@Body() dto:EnviarEmailNotificacaoDTO){
        return this.notificacaoService.emailSuporte(dto)
    }


    @Post('telegram')
    @SetMetadata('isAdmin',true)
    async telegram(@Body() dto:EnviarTelegramNotificacaoDTO){
        return this.notificacaoService.eventEnviarTelegram(dto)
    }
}