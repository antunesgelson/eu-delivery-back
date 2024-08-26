import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModules } from "../auth/auth.modules";
import { AdicionarUsuarioService } from "./services/adicionarUsuario.service";
import { UsuarioEntiy } from "./usuarios.entity";


@Module({
    imports: [TypeOrmModule.forFeature([UsuarioEntiy]),
    forwardRef(() => AuthModules),],
    controllers: [],
    providers: [AdicionarUsuarioService],
    exports: [AdicionarUsuarioService]
})
export class UsuarioModule { }