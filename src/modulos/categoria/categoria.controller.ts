import { Body, Controller, Get, Post } from "@nestjs/common";
import { CategoriaSerivice } from "./categoria.service";
import { CategoriaDTO } from "./dto/categoria.dto";


@Controller('categoria')
export class CategoriaController {
    constructor(
        private categoriaService: CategoriaSerivice,
    ) { }

    @Post('cadastrar')
    async cadastrar(@Body() dadosCategoria: CategoriaDTO) {
        return this.categoriaService.create(dadosCategoria);
    }

    @Get('listar')
    async listar() {
        return this.categoriaService.list();
    }

    @Get('lista/detalhes')
    async listDetails() {
        return this.categoriaService.listDetails();
    }
}