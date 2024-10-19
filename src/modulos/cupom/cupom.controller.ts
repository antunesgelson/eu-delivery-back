import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
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

    @Get('/free')
    async buscarCupomFree(@Req() request){
      return this.cupomService.buscarCupomFree({usuarioId:request.user.sub})
    }

    @Put()
    async editarCupom(@Body() cupom: EditarCupomDTO) {
        return this.cupomService.editarCupom(cupom);
    }

    @Get('/ativar/:cupom')
    async ativarCupom(@Param() cupom:{cupom:string},@Req() req){
        if(!cupom.cupom || cupom.cupom=="") throw new BadRequestException('Erro ao tentar ativar o cupom /cupom/ativar/:cupom')
        return this.cupomService.ativarCupom({cupom:cupom.cupom,usuarioId:req.user.sub})
    }

    @Get('/:cupomId')
    async buscarCuporPorId(@Param() cupom: BuscarCupomPorIdDTO) {
        return this.cupomService.buscarCuporPorId(cupom);
    }

    
}