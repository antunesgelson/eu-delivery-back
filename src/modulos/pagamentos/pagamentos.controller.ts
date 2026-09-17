import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Headers,
  Query,
  Req,
} from '@nestjs/common';
import { Publico } from '../../common/security';
import { PagamentosService } from './pagamentos.service';
@Controller('pagamento')
export class PagamentosController {
  constructor(private pagamentos: PagamentosService) {}
  @Publico() @Get('metodos') metodos() {
    return { online: this.pagamentos.habilitado(), retirada: true };
  }
  @Post(':id/checkout') criar(
    @Param('id', ParseIntPipe) id: number,
    @Req() r: any,
  ) {
    return this.pagamentos.criar(id, r.user.id);
  }
  @Publico() @Post('mercadopago/webhook') webhook(
    @Query('data.id') id: string,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
  ) {
    return this.pagamentos.webhook(id, signature, requestId);
  }
}
