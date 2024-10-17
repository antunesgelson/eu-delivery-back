import { Body, Controller, Delete, Get, Param, Post, Put, Req, SetMetadata, UsePipes, ValidationPipe } from "@nestjs/common";
import { CategoriaSerivice } from "./categoria.service";
import { CategoriaDTO } from "./dto/categoria.dto";
import { IsPublic } from "../auth/decorators/isPublic.decorator";
import { CategoriaEditarDTO } from "./dto/categoriaEditar.dto";


@Controller('categoria')
export class CategoriaController {
    constructor(
        private categoriaService: CategoriaSerivice,
    ) { }

    @SetMetadata('isAdmin',true)//deixar rota protegida apenas para uso do admin.. 
    @Post()
    async cadastrar(@Body() dadosCategoria: CategoriaDTO) {
        return this.categoriaService.create(dadosCategoria);
    }

    @SetMetadata('isAdmin',true)//deixar rota protegida apenas para uso do admin.. 
    @Put()
    async editar(@Body() categoriaEditarDTO: CategoriaEditarDTO) {
        return this.categoriaService.editar(categoriaEditarDTO);
    }

    @Delete(':id')
    @SetMetadata('isAdmin',true)//deixar rota protegida apenas para uso do admin.. 
    @UsePipes(new ValidationPipe({ transform: true })) 
    async deletar(@Param('id') id: string) {
        const idDelete = parseInt(id);
        if (isNaN(idDelete)) {
            throw new Error('Parâmetro inválido, era esperado um número.');
        }
        return this.categoriaService.deletar(idDelete);
    }

    @IsPublic()
    @Get('listar')
    async listar(@Req() req) {
        const usuario = req.user;
        console.log(usuario);
        let isAdmin = false;
        if(usuario){
            isAdmin = usuario.isAdmin;
        }
        return this.categoriaService.list({isAdmin:isAdmin});
    }

    @IsPublic()
    @Get('lista/detalhes')
    async listDetails(@Req() req) {
        const usuario = req.user;
        let isAdmin = false;
        if(usuario){
            isAdmin = usuario.isAdmin;
        }
        return this.categoriaService.listDetails({isAdmin:isAdmin});
    }
}