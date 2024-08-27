import { Body, Controller, Post } from "@nestjs/common";
import { IngredienteDTO } from "./dto/ingrediente.dto";
import { IngredienteService } from "./ingrediente.service";

@Controller('ingredientes')
export class IngredientesController {
    constructor(private ingredienteService: IngredienteService) { }

    @Post('cadastrar')
    async createIngredientes(@Body() ingredientes: IngredienteDTO) {
        return this.ingredienteService.create(ingredientes);
    }
}