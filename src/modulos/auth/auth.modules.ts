import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsuarioEntiy } from "../usuario/usuario.entity";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./auth.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthUsuarioService } from "./services/authUsuario.service";
import { UsuarioModule } from "../usuario/usuario.module";


@Module({
    imports: [
        TypeOrmModule.forFeature([UsuarioEntiy]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '1d' }
        }),
        forwardRef(() => UsuarioModule), // Resolver dependência circular
    ],
    controllers: [AuthController],
    providers: [

        JwtAuthGuard,
        AuthUsuarioService,
        JwtStrategy,
    ],
    exports: [AuthUsuarioService]
})
export class AuthModules { }
