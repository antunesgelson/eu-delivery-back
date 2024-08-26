import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsuarioModule } from "../usuario/usuario.module";
import { UsuarioEntiy } from "../usuario/usuarios.entity";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./auth.strategy";
import { CodigoWpEntity } from "./codigos_wp.entity";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthUsuarioService } from "./services/authUsuario.service";
import { GetCodeService } from "./services/getCode.service";
import { LoginService } from "./services/login.service";
import { VerifyCodeService } from "./services/verifyCode.service";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forFeature([UsuarioEntiy, CodigoWpEntity]),
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
        LoginService,
        GetCodeService,
        VerifyCodeService,
    ],
    exports: [AuthUsuarioService]
})
export class AuthModules { }
