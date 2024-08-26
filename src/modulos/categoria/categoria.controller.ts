import { Body, Controller, Get, Post } from "@nestjs/common";
import { CategoriaDTO } from "./dto/categoria.dto";
import { CreateCategoryService } from "./services/createCategory.service";
import { ListCategoryService } from "./services/listCategory.service";


@Controller('categoria')
export class CategoriaController {
    constructor(
        private createCategory: CreateCategoryService,
        private listCategory: ListCategoryService
    ) { }

    @Post('cadastrar')
    async cadastrar(@Body() dadosCategoria: CategoriaDTO) {
        return this.createCategory.exec(dadosCategoria);
    }

    @Get('listar')
    async listar() {
        return this.listCategory.exec();
    }
}