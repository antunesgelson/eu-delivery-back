import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Req, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { AddProductIngrentDTO } from "./dto/addProductIngredient.dto";
import { ProdutoDTO } from "./dto/produto.dto";
import { ProdutoService } from "./produto.service";
import { IsPublic } from "../auth/decorators/isPublic.decorator";
import { FileInterceptorToBodyInterceptor } from "src/shared/interceptor/fileInterceptorToBody.interceptor";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";

@Controller('produto')
export class ProdutoController {
    constructor(
        private produtoService: ProdutoService,
    ) { }

    @Post('cadastrar')
    @UseInterceptors(FilesInterceptor('imgs',10,{limits:{fileSize:5*1024*1024}}))  // Lida com o campo de arquivo 'img'
    async cadastrarProduto(
        @Body() produtoDto: ProdutoDTO,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req  // Se você precisar de acesso ao token JWT
    ) {
        const produtos = {usuarioId:req.user.sub,...produtoDto,files:files}
        return this.produtoService.adicionar(produtos);
    }

    @IsPublic()
    @Get('/categoria/:categoria')
    async getByCategoria(@Param('categoria') categoria: string) {
        return this.produtoService.buscarPorCategoria(categoria);
    }

    @IsPublic()
    @Get(':id')
    async getById(@Param('id', ParseIntPipe) id: number) {
        return this.produtoService.buscarPorId(id);
    }

    @Post('adicionar-ingredientes')
    async addProductIngredient(@Body() produto: AddProductIngrentDTO) {
        return this.produtoService.adicionarIngredientes(produto);
    }
}
