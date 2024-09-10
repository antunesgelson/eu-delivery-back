import { Body, Controller, Get, Put, Req } from "@nestjs/common";
import { UsuarioEditarDTO } from "./dto/usuarioEditar.dto";
import { UsuarioService } from "./usuario.service";

@Controller('usuario')
export class UsuarioController {
    constructor(private usuarioService: UsuarioService,
    ) {}

    @Put()
    async editar(@Body() usuarioEditarDTO: UsuarioEditarDTO,@Req() request) {
        const usuario = {...usuarioEditarDTO, id:request.user.sub}
        return this.usuarioService.editar(usuario);
    }

    @Get()
    async buscar(@Req() request) {
        return this.usuarioService.buscar({ usuarioId: request.user.sub });
    }
}