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
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modulos/auth/guards/jwt-auth.guard';
import { EnderecoModule } from './modulos/endereco/endereco.module';
import { s3Module } from './modulos/s3/s3.module';
import { PedidoModule } from './modulos/pedido/pedido.module';
import { CupomModule } from './modulos/cupom/cupom.module';
import { ConfiguracaoModule } from './modulos/configuracao/configuracao.module';
import { MercadoPagoCheckoutProModule } from './modulos/pagamento/mercadoPagoCheckoutPro/mercadoPagoCheckoutPro.module';


@Module({
  imports: [
    UsuarioModule,
    AuthModules,
    CategoriaModule,
    ProdutoModule,
    IngredienteModule,
    AdicinaisModule,
    SharedModule,
    s3Module,
    EnderecoModule,
    CupomModule,
    PedidoModule,
    MercadoPagoCheckoutProModule,
    ConfiguracaoModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig()),
  ],
  providers:[{provide:APP_GUARD, useClass:JwtAuthGuard}]
})
export class AppModule { }
