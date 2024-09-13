import {  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req,  SetMetadata,  UploadedFile,  UploadedFiles, UseInterceptors } from "@nestjs/common";
import { AddProductIngrentDTO } from "./dto/addProductIngredient.dto";
import { ProdutoDTO } from "./dto/produto.dto";
import { ProdutoService } from "./produto.service";
import { IsPublic } from "../auth/decorators/isPublic.decorator";
import {  FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { DeletarFotoProdutoDTO } from "./dto/deletarFotoProduto.dto";
import { DeletarProdutoDTO } from "./dto/deletarProduto.dto";
import { AddFotoProdutoDTO } from "./dto/AddFotoProduto.dto";
import { AddAdicionalProdutoDTO } from "./dto/addAdicionalProduto.dto";
import { DeletarAdicionalProdutoDTO } from "./dto/deletarAdicionalProduto.dto";


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
    ) {
        const produtos = {...produtoDto,files:files}
        return this.produtoService.adicionar(produtos);
    }

    @Post('adicional')
    @SetMetadata('isAdmin',true)
    async adicionarAdicional(@Body() addAdicionarProdutoDTO:AddAdicionalProdutoDTO){
        return this.produtoService.adicionarAdicional(addAdicionarProdutoDTO);
    }

    @Delete('adicional')
    @SetMetadata('isAdmin',true)
    async deletarAdicional(@Body() produtoDTO:DeletarAdicionalProdutoDTO){
        return this.produtoService.deletarAdicional(produtoDTO)
    }

    @Post('/foto/:produtoId')
    @SetMetadata('isAdmin',true)
    @UseInterceptors(FileInterceptor('img',{limits:{fileSize:5*1024*1024}}))  // Lida com o campo de arquivo 'img'
    async cadastrarFotoProduto(
        @Param() fotoDTO: AddFotoProdutoDTO,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const foto = {...fotoDTO,file:file}
        return this.produtoService.adicionarFoto(foto);
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
