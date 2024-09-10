import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModules } from "../auth/auth.modules";

import { UsuarioController } from "./usuario.controller";
import { UsuarioEntiy } from "./usuarios.entity";
import { UsuarioService } from "./usuario.service";


@Module({
    imports: [TypeOrmModule.forFeature([UsuarioEntiy]),
    forwardRef(() => AuthModules),],
    controllers: [UsuarioController],
    providers: [UsuarioService],
    exports: [UsuarioService]
})
export class UsuarioModule { }