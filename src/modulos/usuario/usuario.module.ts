import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdicionarUsuarioService } from "./services/adicionarUsuario.service";
import { UsuarioEntiy } from "./usuario.entity";

@Module({
    imports: [TypeOrmModule.forFeature([UsuarioEntiy])],
    controllers: [],
    providers: [AdicionarUsuarioService],
    exports: [AdicionarUsuarioService]
})

export class UsuarioModule { }