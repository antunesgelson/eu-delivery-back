import { Body, Controller, Put } from "@nestjs/common";
import { IsPublic } from "../auth/decorators/isPublic.decorator";
import { UsuarioEditarDTO } from "./dto/usuarioEditar.dto";
import { UsuarioEditarService } from "./services/UsuarioEditar.service";

@Controller('usuario')
export class UsuarioController{

    constructor(private usuarioEditarService:UsuarioEditarService){

    }

    @Put()
    async editar(@Body() usuarioEditarDTO:UsuarioEditarDTO){
        return this.usuarioEditarService.exec(usuarioEditarDTO);
    }
}