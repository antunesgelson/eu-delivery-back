import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { Admin, Publico } from '../../common/security';
import { ClientesService } from './clientes.service';
import {
  PerfilDto,
  EnderecoDto,
  ListaDto,
  CupomDto,
  ConfigDto,
  ClienteAdminDto,
  CriarClienteDto,
} from './clientes.dto';
@Controller()
export class ClientesController {
  constructor(private clientes: ClientesService) {}
  @Get('usuario') perfil(@Req() r: any) {
    return this.clientes.perfil(r.user.id);
  }
  @Put('usuario') editar(@Req() r: any, @Body() d: PerfilDto) {
    return this.clientes.editarPerfil(r.user.id, d);
  }
  @Get('usuario/beneficios') beneficios(@Req() r: any) {
    return this.clientes.beneficios(r.user.id);
  }
  @Get('endereco/todos') enderecos(@Req() r: any) {
    return this.clientes.enderecos(r.user.id);
  }
  @Get('endereco/:id') endereco(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientes.endereco(r.user.id, id);
  }
  @Post('endereco') adicionar(@Req() r: any, @Body() d: EnderecoDto) {
    return this.clientes.salvarEndereco(r.user.id, d, true);
  }
  @Put('endereco') salvar(@Req() r: any, @Body() d: EnderecoDto) {
    return this.clientes.salvarEndereco(r.user.id, d);
  }
  @Delete('endereco/:id') excluir(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientes.excluirEndereco(r.user.id, id);
  }
  @Admin() @Post('admin/clientes') criarCliente(
    @Req() r: any,
    @Body() d: CriarClienteDto,
  ) {
    return this.clientes.criarCliente(d, r.user.id);
  }
  @Admin() @Post('admin/clientes/:id/premios/:premioId/resgatar') premio(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('premioId', ParseIntPipe) premioId: number,
  ) {
    return this.clientes.resgatar(id, premioId, r.user.id);
  }
  @Admin() @Get('admin/clientes/:id/beneficios') saldo(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientes.beneficios(id);
  }
  @Admin() @Get('admin/clientes') clientesLista(@Query() q: ListaDto) {
    return this.clientes.clientes(q);
  }
  @Admin() @Put('admin/clientes/:id') cliente(
    @Req() r: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() d: ClienteAdminDto,
  ) {
    return this.clientes.editarCliente(id, d, r.user.id);
  }
  @Publico() @Get('cupom/publicos') cupons() {
    return this.clientes.cupons();
  }
  @Get('cupom/free') free() {
    return this.clientes.cupons();
  }
  @Admin() @Get('cupom') adminCupons() {
    return this.clientes.cupons(true);
  }
  @Admin() @Post('cupom') novoCupom(@Req() r: any, @Body() d: CupomDto) {
    return this.clientes.salvarCupom(d, r.user.id);
  }
  @Admin() @Put('cupom') editarCupom(@Req() r: any, @Body() d: CupomDto) {
    return this.clientes.salvarCupom(d, r.user.id);
  }
  @Admin() @Delete('cupom/:id') deletarCupom(
    @Req() r: any,
    @Param('id') id: string,
  ) {
    return this.clientes.excluirCupom(id, r.user.id);
  }
  @Publico() @Get('configuracao') config() {
    return this.clientes.config();
  }
  @Admin() @Post('configuracao') criarConfig(
    @Req() r: any,
    @Body() d: ConfigDto,
  ) {
    return this.clientes.configurar(d, r.user.id);
  }
  @Admin() @Put('configuracao') editarConfig(
    @Req() r: any,
    @Body() d: ConfigDto,
  ) {
    return this.clientes.configurar(d, r.user.id);
  }
}
