import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsuarioEntiy } from "../usuario/usuario.entity";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./auth.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthUsuarioService } from "./services/authUsuario.service";
import { GetCodeService } from "./services/getCode.service";
@Module({
    imports: [
        TypeOrmModule.forFeature([UsuarioEntiy]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1d' }
        }),

    ],
    controllers: [AuthController],
    providers: [
        GetCodeService,
        JwtAuthGuard,
        AuthUsuarioService,
        JwtStrategy,
    ],
    exports: [AuthUsuarioService]
})
export class AuthModules { }
