import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { AdicinaisModule } from './modulos/adicional/adicionail.module';
import { AuthModules } from './modulos/auth/auth.modules';
import { CategoriaModule } from './modulos/categoria/categoria.module';
import { IngredienteModule } from './modulos/ingrediente/ingrediente.module';
import { ProdutoModule } from './modulos/produto/produto.module';
import { UsuarioModule } from './modulos/usuario/usuario.module';
import { SharedModule } from './shared/shared.module';


@Module({
  imports: [
    UsuarioModule,
    AuthModules,
    CategoriaModule,
    ProdutoModule,
    IngredienteModule,
    AdicinaisModule,
    SharedModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig()),
  ],

})
export class AppModule { }
