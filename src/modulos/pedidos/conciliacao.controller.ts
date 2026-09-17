import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Query,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Admin } from '../../common/security';
import { ListaDto } from '../clientes/clientes.dto';
import { ExpiracaoService } from './expiracao.service';
@Admin()
@Controller('admin/conciliacoes')
export class ConciliacaoController {
  constructor(private expiracao: ExpiracaoService) {}
  @Get() listar(@Query() q: ListaDto) {
    return this.expiracao.listar(q);
  }
  @Post(':id/tentar')
  @HttpCode(202)
  tentar(@Param('id', ParseIntPipe) id: number, @Req() r: any) {
    return this.expiracao.solicitar(id, r.user.id);
  }
}
