import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsuarioEntiy } from "../usuario/usuario.entity";
import { UsuarioModule } from "../usuario/usuario.module";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./auth.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthUsuarioService } from "./services/authUsuario.service";
import { LoginService } from "./services/login.service";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forFeature([UsuarioEntiy]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '30d' }
        }),
        forwardRef(() => UsuarioModule), // Resolver dependência circular
    ],
    controllers: [AuthController],
    providers: [
        JwtAuthGuard,
        AuthUsuarioService,
        JwtStrategy,
        LoginService
    ],
    exports: [AuthUsuarioService]
})
export class AuthModules { }
