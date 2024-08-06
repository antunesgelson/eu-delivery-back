import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AdicionarUsuarioDTO } from "../usuario/dto/adicionarUsuario.dto";
import { AdicionarUsuarioService } from "../usuario/services/adicionarUsuario.service";
import { GetCodeDTO } from "./dto/getCode.dto";
import { GetCodeService } from "./services/getCode.service";

@Controller('auth')
export class AuthController {
    constructor(private getCodeService: GetCodeService,
        private adicionarUsuario: AdicionarUsuarioService,
    ) { }

    @Get('wp')
    async getCode(@Query() getCodeDTO: GetCodeDTO) {
        return this.getCodeService.exec(getCodeDTO);
    }


    @Post('cadastrar')
    async cadastrar(@Body() dadosUsuario: AdicionarUsuarioDTO) {
        return await this.adicionarUsuario.exec(dadosUsuario);
    }
}