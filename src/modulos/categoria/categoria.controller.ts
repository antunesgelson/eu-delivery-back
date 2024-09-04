import { Body, Controller, Get, Post, SetMetadata } from "@nestjs/common";
import { CategoriaSerivice } from "./categoria.service";
import { CategoriaDTO } from "./dto/categoria.dto";
import { IsPublic } from "../auth/decorators/isPublic.decorator";


@Controller('categoria')
export class CategoriaController {
    constructor(
        private categoriaService: CategoriaSerivice,
    ) { }

    @SetMetadata('isAdmin',true)//deixar rota protegida apenas para uso do admin.. 
    @Post('cadastrar')
    async cadastrar(@Body() dadosCategoria: CategoriaDTO) {
        return this.categoriaService.create(dadosCategoria);
    }

    @IsPublic()
    @Get('listar')
    async listar() {
        return this.categoriaService.list();
    }

    @Get('lista/detalhes')
    async listDetails() {
        return this.categoriaService.listDetails();
    }
}