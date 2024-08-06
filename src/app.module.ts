import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { AuthModules } from './modulos/auth/auth.modules';
import { UsuarioModule } from './modulos/usuario/usuario.module';
import { SharedModule } from './shared/shared.module';



@Module({
  imports: [
    UsuarioModule,
    AuthModules,
    SharedModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig()),
  ],

})
export class AppModule { }
