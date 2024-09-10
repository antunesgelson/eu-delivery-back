import {  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req,  SetMetadata,  UploadedFiles, UseInterceptors } from "@nestjs/common";
import { AddProductIngrentDTO } from "./dto/addProductIngredient.dto";
import { ProdutoDTO } from "./dto/produto.dto";
import { ProdutoService } from "./produto.service";
import { IsPublic } from "../auth/decorators/isPublic.decorator";
import {  FilesInterceptor } from "@nestjs/platform-express";
import { DeletarFotoProdutoDTO } from "./dto/deletarFotoProduto.dto";
import { DeletarProdutoDTO } from "./dto/deletarProduto.dto";

@Controller('produto')
export class ProdutoController {
    constructor(
        private produtoService: ProdutoService,
    ) {}

    @Post('cadastrar')
    @SetMetadata('isAdmin',true)
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
    @SetMetadata('isAdmin',true)
    async addProductIngredient(@Body() produto: AddProductIngrentDTO) {
        return this.produtoService.adicionarIngredientes(produto);
    }

    @Delete(':produtoId')
    @SetMetadata('isAdmin',true)
    async deletarProduto(@Param() produtoDTO:DeletarProdutoDTO){
        return this.produtoService.deletarProduto(produtoDTO);
    }

    @Delete('/:produtoId/:etag')
    @SetMetadata('isAdmin',true)
    async deletarFotoProduto(@Param() produtoDTO:DeletarFotoProdutoDTO){
        return this.produtoService.deletarFotoProduto(produtoDTO);
    }

}
