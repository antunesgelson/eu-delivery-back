// NestJS
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/isPublic.decorator';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtModule } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {


    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {

      //--------------Esse codigo é importante para filtrar produtos e caterorias que não são publicas..---
      //mas que usam rotas publicas.-----------------------------------------------------------------------
      const request = context.switchToHttp().getRequest();
      const authorizationToken = request.headers['authorization'] || request.headers['authorization']
      if(authorizationToken && authorizationToken.startsWith('Bearer ')){
        await super.canActivate(context);
      }
      //----------------------------------------------------------------------------------------------------
      return true;
    }

    const canActivate = await super.canActivate(context);

    if (typeof canActivate === 'boolean' && canActivate) {
      const RouterIsAdmin = this.reflector.get<boolean>('isAdmin', context.getHandler());
 
      const request = context.switchToHttp().getRequest();
      const user = request.user; // Usuário definido pelo Passport após validar o token
     
      if(RouterIsAdmin){
        if(user.isAdmin) return true;
        else return false
      }
          
        return true;
    }

    return false;
  }
}