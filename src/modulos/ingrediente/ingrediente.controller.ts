import { Body, Controller, Delete, Get, Param, Post, Put, SetMetadata } from "@nestjs/common";
import { IngredienteDTO } from "./dto/ingrediente.dto";
import { IngredienteService } from "./ingrediente.service";
import { IsPublic } from "../auth/decorators/isPublic.decorator";
import { IngredienteListaByIdDTO } from "./dto/ingredienteListaById.dto";
import { IngredienteEditarDTO } from "./dto/ingredienteEditar.dto";
import { IngredienteDeletarDTO } from "./dto/ingredienteDeletar.dto";


@Controller('ingredientes')
export class IngredientesController {
    constructor(private ingredienteService: IngredienteService) { }

    @Post('cadastrar')
    @SetMetadata('isAdmin',true)
    async createIngredientes(@Body() ingredientes: IngredienteDTO) {
        return this.ingredienteService.adicionar(ingredientes);
    }

    @Get()
    @IsPublic()
    async listarTodos(){
        return this.ingredienteService.listarTodos()
    }

    @Get(':id')
    @IsPublic()
    async listaById(@Param() listarByIdDTO:IngredienteListaByIdDTO){
        return this.ingredienteService.listaById(listarByIdDTO);
    }

    @Put()
    @SetMetadata('isAdmin',true)
    async editar(@Body() ingredienteDTO:IngredienteEditarDTO){
        return this.ingredienteService.editar(ingredienteDTO)
    }

    @Delete(':id')
    @SetMetadata('isAdmin',true)
    async deletar(@Param() ingredienteDeletarDTO:IngredienteDeletarDTO){
        return this.ingredienteService.deletar(ingredienteDeletarDTO);
    }
    
}