import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ProdutoDTO } from "./dto/produto.dto";
import { AddProductService } from "./services/addProduct.service";
import { GetProductByIdService } from "./services/getProductById.service";

@Controller('produto')
export class ProdutoController {
    constructor(
        private addProduct: AddProductService,
        private getProductById: GetProductByIdService
    ) { }

    @Post('cadastrar')
    async createProduct(@Body() produto: ProdutoDTO) {
        return this.addProduct.exec(produto);
    }

    @Get(':id')
    async getById(@Param('id', ParseIntPipe) id: number) {
        return this.getProductById.exec(id);
    }
}