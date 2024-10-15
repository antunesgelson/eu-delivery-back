import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { AdicionarCupomDTO } from "./dto/adiconarCupom.dto";
import { CupomService } from "./cupom.service";
import { BuscarCupomPorIdDTO } from "./dto/buscarCupomPorId.dto";
import { BuscarCupomFiltroAvancado } from "./dto/buscarCupomFiltroAvancado.dto";
import { EditarCupomDTO } from "./dto/editarCupom.dto";

@Controller('/cupom')
export class CupomController {
    constructor(private cupomService: CupomService) { }

    @Post()
    async cadastrarCupom(@Body() cupom: AdicionarCupomDTO) {
        return this.cupomService.cadastrarCupom(cupom);
    }

    @Get('/buscar')
    async buscarCupomFiltroAvancado(@Query() dto: BuscarCupomFiltroAvancado) {
        return this.cupomService.buscarCupomFiltroAvancado(dto);
    }

    @Get('/:cupomId')
    async buscarCuporPorId(@Param() cupom: BuscarCupomPorIdDTO) {
        return this.cupomService.buscarCuporPorId(cupom);
    }

    @Put()
    async editarCupom(@Body() cupom: EditarCupomDTO) {
        return this.cupomService.editarCupom(cupom);
    }

}