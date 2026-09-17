import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { opcoesBanco } from './database/data-source';
import { AcessoGuard } from './common/security';
import { AuthModule } from './modulos/auth/auth.module';
import { CatalogoModule } from './modulos/catalogo/catalogo.module';
import { ClientesModule } from './modulos/clientes/clientes.module';
import { PedidosModule } from './modulos/pedidos/pedidos.module';
import { PagamentosModule } from './modulos/pagamentos/pagamentos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.DOTENV_CONFIG_PATH ?? '.env',
      validate: (env) => {
        if (!env.JWT_SECRET || env.JWT_SECRET.length < 32)
          throw new Error('JWT_SECRET deve conter pelo menos 32 caracteres.');
        if (
          env.NODE_ENV === 'production' &&
          env.AUTH_DELIVERY_MODE === 'development'
        )
          throw new Error(
            'Códigos de desenvolvimento não são permitidos em produção.',
          );
        for (const name of ['MYSQL_USER', 'MYSQL_DB'])
          if (!env[name]) throw new Error(`${name} obrigatório.`);
        return env;
      },
    }),
    TypeOrmModule.forRootAsync({ useFactory: () => opcoesBanco() }),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({ secret: process.env.JWT_SECRET }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 240 }]),
    AuthModule,
    CatalogoModule,
    ClientesModule,
    PedidosModule,
    PagamentosModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AcessoGuard },
  ],
})
export class AppModule {}
