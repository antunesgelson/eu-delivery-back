import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModules } from "../auth/auth.modules";
import { AdicionarUsuarioService } from "./services/adicionarUsuario.service";
import { UsuarioEntiy } from "./usuarios.entity";
import { UsuarioController } from "./usuario.controller";
import { UsuarioEditarService } from "./services/UsuarioEditar.service";


@Module({
    imports: [TypeOrmModule.forFeature([UsuarioEntiy]),
    forwardRef(() => AuthModules),],
    controllers: [UsuarioController],
    providers: [AdicionarUsuarioService,UsuarioEditarService],
    exports: [AdicionarUsuarioService]
})
export class UsuarioModule { }