import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdicionarUsuarioService } from "./services/adicionarUsuario.service";
import { UsuarioEntiy } from "./usuario.entity";
import { AuthModules } from "../auth/auth.modules";


@Module({
    imports: [TypeOrmModule.forFeature([UsuarioEntiy]),
    forwardRef(() => AuthModules),],
    controllers: [],
    providers: [AdicionarUsuarioService],
    exports: [AdicionarUsuarioService]
})
export class UsuarioModule { }