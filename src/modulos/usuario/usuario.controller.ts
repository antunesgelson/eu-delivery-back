import { Body, Controller, Get, Put, Req } from "@nestjs/common";
import { UsuarioEditarDTO } from "./dto/usuarioEditar.dto";
import { UsuarioEditarService } from "./services/UsuarioEditar.service";
import { BuscarUsuarioService } from "./services/buscarUsuario.service";

@Controller('usuario')
export class UsuarioController {
    constructor(private usuarioEditarService: UsuarioEditarService,
        private usuarioBuscarService: BuscarUsuarioService
    ) { }

    @Put()
    async editar(@Body() usuarioEditarDTO: UsuarioEditarDTO) {
        return this.usuarioEditarService.exec(usuarioEditarDTO);
    }

    @Get()
    async buscar(@Req() request) {
        return this.usuarioBuscarService.exec({ usuarioId: request.user.sub });
    }
}