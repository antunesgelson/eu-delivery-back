import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { AddProductIngrentDTO } from "./dto/addProductIngredient.dto";
import { ProdutoDTO } from "./dto/produto.dto";
import { ProdutoService } from "./produto.service";

@Controller('produto')
export class ProdutoController {
    constructor(
        private produtoService: ProdutoService,
    ) { }

    @Post('cadastrar')
    async createProduct(@Body() produto: ProdutoDTO) {
        return this.produtoService.create(produto);
    }

    @Get(':id')
    async getById(@Param('id', ParseIntPipe) id: number) {
        return this.produtoService.listById(id);
    }

    @Post('add-ingredient')
    async addProductIngredient(@Body() produto: AddProductIngrentDTO) {
        return this.produtoService.addIngredient(produto);
    }
}