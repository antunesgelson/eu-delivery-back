import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModules } from "../auth/auth.modules";
import { UsuarioEditarService } from "./services/UsuarioEditar.service";
import { AdicionarUsuarioService } from "./services/adicionarUsuario.service";
import { BuscarUsuarioService } from "./services/buscarUsuario.service";
import { UsuarioController } from "./usuario.controller";
import { UsuarioEntiy } from "./usuarios.entity";


@Module({
    imports: [TypeOrmModule.forFeature([UsuarioEntiy]),
    forwardRef(() => AuthModules),],
    controllers: [UsuarioController],
    providers: [AdicionarUsuarioService, UsuarioEditarService, BuscarUsuarioService],
    exports: [AdicionarUsuarioService]
})
export class UsuarioModule { }