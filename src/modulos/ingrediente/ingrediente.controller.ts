import { Body, Controller, Post } from "@nestjs/common";
import { IngredienteDTO } from "./dto/ingrediente.dto";
import { AddIngredienteService } from "./services/addIngrediente.service";

@Controller('ingredientes')
export class IngredientesController {
    constructor(private addIngredientes: AddIngredienteService) { }

    @Post('cadastrar')
    async createIngredientes(@Body() ingredientes: IngredienteDTO) {
        return this.addIngredientes.exec(ingredientes);
    }
}