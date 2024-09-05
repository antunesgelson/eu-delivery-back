import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EnderecoEntity } from "./endereco.entity";
import { Repository } from "typeorm";

@Injectable()
export class EnderecoService {
    constructor(@InjectRepository(EnderecoEntity) private enderecoRepository: Repository<EnderecoEntity>) { }

    async adicionar(adicionarDTO) {
        const enderecosExiste = await this.enderecoRepository.find({ where: { usuario: { id: adicionarDTO.usuarioId } } });
        for (const end of enderecosExiste) {
            if (end.apelido == adicionarDTO.apelido) throw new ConflictException("Apelido já cadastrado");
            if (
                end.rua == adicionarDTO.rua &&
                end.bairro == adicionarDTO.bairro &&
                end.cep == adicionarDTO.cep &&
                end.numero == adicionarDTO.numero
            ) throw new ConflictException("Endereço já cadastrado.")
        }
        return this.enderecoRepository.save({...adicionarDTO,usuario:{id:adicionarDTO.usuarioId}});
    }

    async buscarTodosEnderecos(buscarTodosDTO) { 
        return this.enderecoRepository.find({where:{usuario:{id:buscarTodosDTO.usuarioId}}});
    }

    async editar(editarDTO) { 
        const endereco = await this.enderecoRepository.findOne({where:{id:editarDTO.id},relations:["usuario"]});
        if(endereco.usuario.id != editarDTO.usuarioId) throw new UnauthorizedException('Usuário não tem permissão para alterar esse endereço.')
        if(!endereco) throw new NotFoundException('Endereço não encontrado.');
        delete editarDTO.usuarioId;
        Object.assign(endereco,editarDTO)
        return this.enderecoRepository.save(endereco);
    }

    async deletar(deletarDTO) { 
        const endereco = await this.enderecoRepository.findOne({where:{id:deletarDTO.id},relations:["usuario"]});
        if(!endereco) throw new NotFoundException('Endereço não encontrado.');
        if(endereco.usuario.id != deletarDTO.usuarioId) throw new UnauthorizedException('Usuário nao tem permissão para deletar o endereço.')
        return this.enderecoRepository.delete(endereco.id);
    }
}