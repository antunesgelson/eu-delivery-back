import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, SetMetadata, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { AddProductIngrentDTO } from "./dto/addProductIngredient.dto";
import { ProdutoDTO } from "./dto/produto.dto";
import { ProdutoService } from "./produto.service";
import { IsPublic } from "../auth/decorators/isPublic.decorator";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { DeletarFotoProdutoDTO } from "./dto/deletarFotoProduto.dto";
import { DeletarProdutoDTO } from "./dto/deletarProduto.dto";
import { AddFotoProdutoDTO } from "./dto/AddFotoProduto.dto";
import { AddAdicionalProdutoDTO } from "./dto/addAdicionalProduto.dto";
import { DeletarAdicionalProdutoDTO } from "./dto/deletarAdicionalProduto.dto";


@Controller('produto')
export class ProdutoController {
    constructor(
        private produtoService: ProdutoService,
    ) { }

    @Post('cadastrar')
    @SetMetadata('isAdmin', true)
    @UseInterceptors(FilesInterceptor('imgs', 10, { limits: { fileSize: 5 * 1024 * 1024 } }))  // Lida com o campo de arquivo 'img'
    async cadastrarProduto(
        @Body() produtoDto: ProdutoDTO,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        const produtos = { ...produtoDto, files: files }
        return this.produtoService.adicionar(produtos);
    }

    @Post('adicional')
    @SetMetadata('isAdmin', true)
    async adicionarAdicional(@Body() produto: AddAdicionalProdutoDTO | AddAdicionalProdutoDTO[]) {
        if (Array.isArray(produto)) {
            console.log(await this.produtoService.deletarTodosAdicionaisDeUmProduto(produto[0].produtoId))
            let result = [];
            for(const p of produto){
                result.push(await this.produtoService.adicionarAdicional(p))
            }
            return result;
        } else {
            console.log(await this.produtoService.deletarTodosAdicionaisDeUmProduto(produto.produtoId))
            return this.produtoService.adicionarAdicional(produto);
        }
    }

    @Post('adicionar-ingredientes')
    @SetMetadata('isAdmin', true)
    async addProductIngredient(@Body() produto: AddProductIngrentDTO | AddProductIngrentDTO[]) {
        if (Array.isArray(produto)) {
            await this.produtoService.deletarTodosIngredientesDeUmProduto(produto[0].produtoId)
            return Promise.all(produto.map(p => this.produtoService.adicionarIngredientes(p)));
        } else {
            await this.produtoService.deletarTodosIngredientesDeUmProduto(produto.produtoId)
            return this.produtoService.adicionarIngredientes(produto);
        }
    }



    @Post('/foto/:produtoId')
    @SetMetadata('isAdmin', true)
    @UseInterceptors(FileInterceptor('img', { limits: { fileSize: 5 * 1024 * 1024 } }))  // Lida com o campo de arquivo 'img'
    async cadastrarFotoProduto(
        @Param() fotoDTO: AddFotoProdutoDTO,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const foto = { ...fotoDTO, file: file }
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

    @Delete(':produtoId')
    @SetMetadata('isAdmin', true)
    async deletarProduto(@Param() produtoDTO: DeletarProdutoDTO) {
        return this.produtoService.deletarProduto(produtoDTO);
    }

    @Delete('/:produtoId/:etag')
    @SetMetadata('isAdmin', true)
    async deletarFotoProduto(@Param() produtoDTO: DeletarFotoProdutoDTO) {
        return this.produtoService.deletarFotoProduto(produtoDTO);
    }

}
