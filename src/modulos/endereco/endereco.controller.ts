import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UsePipes, ValidationPipe } from "@nestjs/common";
import { EnderecoService } from "./endereco.service";
import { EnderecoAdicionarDTO } from "./dto/enderecoAdicionar.dto";
import { EnderecoEditarDTO } from "./dto/enderecoEditar.dto";
import { EnderecoDeletarDTO } from "./dto/enderecoDeletar.dto";

@Controller('endereco')
export class EnderecoController {
    constructor(private enderecoService:EnderecoService) {}

    @Post()
    async adicionar(@Body() adicionarDTO:EnderecoAdicionarDTO, @Req() request){
        adicionarDTO.usuarioId = request.user.sub;      
        return this.enderecoService.adicionar(adicionarDTO);
    }
    
    @Get('todos')
    async buscarTodosEnderecos(@Req() request) {
        return this.enderecoService.buscarTodosEnderecos({usuarioId:request.user.sub});
    }

    @Put()
    async editar(@Body() enderecoEditarDTO:EnderecoEditarDTO, @Req() request){
        enderecoEditarDTO.usuarioId = request.user.sub;
        return this.enderecoService.editar(enderecoEditarDTO);
    }

    @Delete(':id')
    @UsePipes(new ValidationPipe({ transform: true })) 
    async deletar(@Param('id') id: string, @Req() request) {
        const idDelete = parseInt(id);
        
        if (isNaN(idDelete)) {
            throw new Error('Parâmetro inválido, era esperado um número.');
        }

        const deletarDTO = new EnderecoDeletarDTO();
        deletarDTO.id = idDelete;
        deletarDTO.usuarioId = request.user.sub;

        return this.enderecoService.deletar(deletarDTO);
    }
    
}