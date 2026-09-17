import { Module } from '@nestjs/common';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService, MercadoPagoGateway } from './pagamentos.service';
@Module({
  imports: [],
  controllers: [PagamentosController],
  providers: [PagamentosService, MercadoPagoGateway],
  exports: [PagamentosService],
})
export class PagamentosModule {}
