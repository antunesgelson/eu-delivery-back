import { Body, Controller, Post } from "@nestjs/common";
import { AdicionarAdicionalDTO } from "./dto/adicionarAdicional.dto";


@Controller('adicional')
export class AdicionaisController {
    constructor() { }

    @Post()
    async adicionar(@Body() adicionais: AdicionarAdicionalDTO) {
        return ""
    }
}