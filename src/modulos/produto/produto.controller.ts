import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Req, UploadedFile, UseInterceptors } from "@nestjs/common";
import { AddProductIngrentDTO } from "./dto/addProductIngredient.dto";
import { ProdutoDTO } from "./dto/produto.dto";
import { ProdutoService } from "./produto.service";
import { IsPublic } from "../auth/decorators/isPublic.decorator";
import { FileInterceptorToBodyInterceptor } from "src/shared/interceptor/fileInterceptorToBody.interceptor";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller('produto')
export class ProdutoController {
    constructor(
        private produtoService: ProdutoService,
    ) { }

    @Post('cadastrar')
    @UseInterceptors(FileInterceptor('img'))  // Lida com o campo de arquivo 'img'
    async cadastrarProduto(
        @Body() produtoDto: ProdutoDTO,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any  // Se você precisar de acesso ao token JWT
    ) {
        if (!file) {throw new BadRequestException('Arquivo de imagem é obrigatório.');}
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('O arquivo deve ser uma imagem.');
        }
        produtoDto.img = file
        return this.produtoService.create(produtoDto);
    }

    @IsPublic()
    @Get(':id')
    async getById(@Param('id', ParseIntPipe) id: number) {
        return this.produtoService.listById(id);
    }

    @Post('add-ingredient')
    async addProductIngredient(@Body() produto: AddProductIngrentDTO) {
        return this.produtoService.addIngredient(produto);
    }
}

/**
 * 
 * 
{
    "titulo": "Produto Exemplo 2",
    "descricao": "Descrição do produto exemplo",
    "valor": "19.99",
    "img": "http://example.com/imagem.jpg",
    "desconto": 10,
    "limitItens": 5,
    "servingSize": 1,
    "categoriaId": 1
}
 * 
 */