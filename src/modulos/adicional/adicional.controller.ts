import { Body, Controller, Post } from "@nestjs/common";
import { AdicionalDTO } from "./dto/adicional.dto";

@Controller('adicional')
export class AdicionaisController {
    constructor() { }

    @Post('cadastrar')
    async createAdicionais(@Body() adicionais: AdicionalDTO) {
        return ""
    }
}