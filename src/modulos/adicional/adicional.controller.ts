import { Body, Controller, Post } from "@nestjs/common";
import { AdicionalDTO } from "./dto/adicional.dto";
import { AddAdicionaisService } from "./services/addAdicionais.service";

@Controller('adicional')
export class AdicionaisController {
    constructor(private addAdicionais: AddAdicionaisService) { }

    @Post('cadastrar')
    async createAdicionais(@Body() adicionais: AdicionalDTO) {
        return this.addAdicionais.exec(adicionais);
    }
}