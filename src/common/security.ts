import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { Sessao, Usuario } from '../database/entities';
export const Publico = () => SetMetadata('publico', true);
export const Admin = () => SetMetadata('admin', true);
@Injectable()
export class AcessoGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    private db: DataSource,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride('publico', [
        ctx.getHandler(),
        ctx.getClass(),
      ])
    )
      return true;
    const req = ctx.switchToHttp().getRequest();
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
    if (!token)
      throw new UnauthorizedException('Entre na sua conta para continuar.');
    let claims: any;
    try {
      claims = await this.jwt.verifyAsync(token, {
        algorithms: ['HS256'],
        issuer: 'assados-zanini',
        audience: 'assados-zanini-app',
      });
    } catch {
      throw new UnauthorizedException('Sessão expirada.');
    }
    if (!Number.isInteger(claims.sub) || typeof claims.sid !== 'string')
      throw new UnauthorizedException();
    const sessao = await this.db
      .getRepository(Sessao)
      .findOneBy({ id: claims.sid, usuarioId: claims.sub });
    const usuario = await this.db
      .getRepository(Usuario)
      .findOneBy({ id: claims.sub, ativo: true });
    if (
      !sessao ||
      sessao.revogadaEm ||
      sessao.expiraEm <= new Date() ||
      !usuario
    )
      throw new UnauthorizedException('Sessão encerrada.');
    if (
      this.reflector.getAllAndOverride('admin', [
        ctx.getHandler(),
        ctx.getClass(),
      ]) &&
      !usuario.isAdmin
    )
      throw new ForbiddenException('Acesso restrito à administração.');
    req.user = usuario;
    req.sessionId = sessao.id;
    return true;
  }
}
