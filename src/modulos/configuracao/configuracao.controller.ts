import { Body, Controller, Get, Param, Post, Put, Req, SetMetadata } from "@nestjs/common";
import { ConfiguracaoService } from "./configuracao.service";
import { ConfiguracaoDTO } from "./dto/configuracao.dto";
import { IsPublic } from "../auth/decorators/isPublic.decorator";

@Controller('configuracao')
export class ConfiguracaoController{

    constructor(private configService:ConfiguracaoService){
    }
    
    @Post()
    @SetMetadata('isAdmin',true)
    async setConfig(@Body() dto:ConfiguracaoDTO){
        return this.configService.setConfig(dto)
    }

    @Post('editaroucriar')
    @SetMetadata('isAdmin',true)
    async editarOuCriarConfig(@Body() dto:ConfiguracaoDTO){
        return this.configService.setConfig(dto)
    }

    @Put()
    @SetMetadata('isAdmin',true)
    async editConfig(@Body() dto:ConfiguracaoDTO){
        return this.configService.editConfig(dto)
    }

    @IsPublic()
    @Get()
    async getAllConfig(@Param() dto,@Req() req){
        const usuario = req.user;
        let isAdmin = false
        if(usuario) isAdmin = usuario.isAdmin
        return this.configService.getAllConfig({isAdmin:isAdmin}) 
    }

    @IsPublic()
    @Get('/:chave')
    async getConfig(@Param() dto,@Req() req){
        const usuario = req.user;
        let isAdmin = false
        if(usuario) isAdmin = usuario.isAdmin
        return this.configService.getConfig({chave:dto.chave,isAdmin:isAdmin})
    }




    
}