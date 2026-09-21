import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Admin, Publico } from '../../common/security';
import { ListaDto, RelatorioDto } from '../clientes/clientes.dto';
import {
  CarrinhoDto,
  ItemDto,
  PdvDto,
  QuantidadeDto,
  StatusDto,
  PagarDto,
  RascunhoPdvDto,
  EditarPedidoDto,
} from './pedidos.dto';
import { PedidosService } from './pedidos.service';
@Controller()
export class PedidosController {
  constructor(private pedidos: PedidosService) {}
  @Get('pedido/carrinho') carrinho(@Req() r: any) {
    return this.pedidos.carrinho(r.user.id);
  }
  @Post('pedido/carrinho') add(@Req() r: any, @Body() d: ItemDto) {
    return this.pedidos.adicionar(r.user.id, d);
  }
  @Put('pedido/carrinho') cart(@Req() r: any, @Body() d: CarrinhoDto) {
    return this.pedidos.alterar(r.user.id, d);
  }
  @Patch('pedido/carrinho/item/:id') quantidade(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() d: QuantidadeDto,
  ) {
    return this.pedidos.quantidade(r.user.id, id, d.quantidade);
  }
  @Delete('pedido/carrinho/item/:id') remover(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pedidos.remover(r.user.id, id);
  }
  @Delete('pedido/carrinho') limpar(@Req() r: any) {
    return this.pedidos.remover(r.user.id);
  }
  @Post('pedido/finalizar') finalizar(
    @Req() r: any,
    @Headers('idempotency-key') key: string,
  ) {
    return this.pedidos.finalizar(r.user.id, key);
  }
  @Publico() @Get('pedido/horarios/:data') horarios(
    @Param('data') data: string,
  ) {
    return this.pedidos.horarios(data);
  }
  @Get('pedido') listar(@Req() r: any, @Query() q: ListaDto) {
    return this.pedidos.listar(r.user.id, q);
  }
  @Get('pedido/:id') obter(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pedidos.obter(id, r.user.id, r.user.isAdmin);
  }
  @Post('pedido/:id/repetir') repetir(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
    @Headers('idempotency-key') key: string,
  ) {
    return this.pedidos.repetir(r.user.id, id, key);
  }
  @Admin() @Get('admin/pedidos') admin(@Req() r: any, @Query() q: ListaDto) {
    return this.pedidos.listar(r.user.id, q, true);
  }
  @Admin() @Patch('admin/pedidos/:id') editar(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() d: EditarPedidoDto,
  ) {
    return this.pedidos.editar(id, d, r.user.id);
  }
  @Admin() @Patch('admin/pedidos/:id/status') status(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() d: StatusDto,
  ) {
    return this.pedidos.mudarStatus(id, d.status, r.user.id);
  }
  @Admin() @Patch('admin/pedidos/:id/pagamento') pagar(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() d: PagarDto,
  ) {
    void d; // A validação do DTO aceita somente a confirmação explícita.
    return this.pedidos.pagar(id, r.user.id);
  }
  @Admin() @Get('admin/pdv/rascunhos') drafts(@Req() r: any) {
    return this.pedidos.rascunhosPdv(r.user.id);
  }
  @Admin() @Post('admin/pdv/rascunhos') saveDraft(
    @Req() r: any,
    @Body() d: RascunhoPdvDto,
  ) {
    return this.pedidos.salvarRascunhoPdv(r.user.id, d.dados);
  }
  @Admin() @Delete('admin/pdv/rascunhos/:id') removeDraft(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pedidos.excluirRascunhoPdv(r.user.id, id);
  }
  @Admin() @Post('admin/pdv') pdv(
    @Req() r: any,
    @Headers('idempotency-key') key: string,
    @Body() d: PdvDto,
  ) {
    return this.pedidos.finalizar(d.clienteId, key, d, r.user.id);
  }
  @Admin() @Get('admin/relatorios') relatorios(@Query() q: RelatorioDto) {
    return this.pedidos.relatorios(q);
  }
}
