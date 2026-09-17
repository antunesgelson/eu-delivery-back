import { Module } from '@nestjs/common';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { ClientesModule } from '../clientes/clientes.module';
import { PagamentosModule } from '../pagamentos/pagamentos.module';
import { ExpiracaoService } from './expiracao.service';
import { ConciliacaoController } from './conciliacao.controller';
@Module({
  imports: [CatalogoModule, ClientesModule, PagamentosModule],
  controllers: [PedidosController, ConciliacaoController],
  providers: [PedidosService, ExpiracaoService],
  exports: [PedidosService],
})
export class PedidosModule {}
