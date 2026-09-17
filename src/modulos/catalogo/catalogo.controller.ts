import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
} from '@nestjs/common';
import { Admin, Publico } from '../../common/security';
import { CatalogoService } from './catalogo.service';
import { SalvarCatalogoDto } from './catalogo.dto';
@Controller()
export class CatalogoController {
  constructor(private catalogo: CatalogoService) {}
  @Publico() @Get('categoria/lista/detalhes') listar() {
    return this.catalogo.listar();
  }
  @Publico() @Get('categoria/listar') async categorias() {
    return (await this.catalogo.listar()).map(({ id, titulo }) => ({
      id,
      titulo,
    }));
  }
  @Publico() @Get('produto/:id') produto(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.catalogo.produto(id);
  }
  @Admin() @Get('admin/catalogo') admin() {
    return this.catalogo.admin();
  }
  @Admin() @Put('admin/catalogo') salvar(
    @Body() dto: SalvarCatalogoDto,
    @Req() r: any,
  ) {
    return this.catalogo.salvar(dto, r.user.id);
  }
}
