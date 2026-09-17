import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Publico } from '../../common/security';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshDto,
  SolicitarCodigoDto,
  VerificarCodigoDto,
  EsqueciSenhaDto,
  RedefinirSenhaDto,
  GoogleDto,
} from './auth.dto';
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Publico()
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Post('login')
  login(@Body() d: LoginDto) {
    return this.auth.login(d.email, d.senha);
  }
  @Publico() @Post('refresh') refresh(@Body() d: RefreshDto) {
    return this.auth.refresh(d.refreshToken);
  }
  @Post('logout') sair(@Req() r: any) {
    return this.auth.sair(r.sessionId);
  }
  @Get('me') me(@Req() r: any) {
    return this.auth.usuarioPublico(r.user);
  }
  @Publico()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('wp')
  solicitar(@Body() d: SolicitarCodigoDto) {
    return this.auth.solicitar(d.tel);
  }
  @Publico()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify')
  verificar(@Body() d: VerificarCodigoDto) {
    return this.auth.verificar(d);
  }
  @Publico()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('esqueci-senha')
  esqueci(@Body() d: EsqueciSenhaDto) {
    return this.auth.esqueci(d.email);
  }
  @Publico()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('redefinir-senha')
  redefinir(@Body() d: RedefinirSenhaDto) {
    return this.auth.redefinir(d);
  }
  @Publico() @Post('google') google(@Body() d: GoogleDto) {
    return this.auth.google(d.idToken);
  }
}
