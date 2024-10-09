import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EnderecoEntity } from "./endereco.entity";
import { DataSource, Repository } from "typeorm";
import { EnderecoEditarDTO } from "./dto/enderecoEditar.dto";

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
        adicionarDTO.favorite = true;
        await this.enderecoRepository.update({usuario:{id:adicionarDTO.usuarioId}},{favorite:false})
        return this.enderecoRepository.save({...adicionarDTO,usuario:{id:adicionarDTO.usuarioId}});
    }

    async buscarPorId(buscarPorIdDTO:{id:number,usuarioId:number}) { 
        return this.enderecoRepository.find({where:{id:buscarPorIdDTO.id,usuario:{id:buscarPorIdDTO.usuarioId}}});
    }

    async buscarTodosEnderecos(buscarTodosDTO) { 
        return this.enderecoRepository.find({where:{usuario:{id:buscarTodosDTO.usuarioId}},relations:["usuario"]});
    }

    async editar(editarDTO:EnderecoEditarDTO & {usuarioId:number}) { 
        const enderecos = await this.enderecoRepository.find({where:{usuario:{id:editarDTO.usuarioId}}})
        if(editarDTO.favorite==true)await Promise.all(enderecos.map((end) => {end.favorite = false; return this.enderecoRepository.save(end)}))       
        const endereco = await this.enderecoRepository.findOne({where:{id:editarDTO.id},relations:["usuario"]});
        if(!endereco) throw new NotFoundException('Endereço não encontrado.');
        if(endereco.usuario.id != editarDTO.usuarioId) throw new UnauthorizedException('Usuário não tem permissão para alterar esse endereço.')
        delete editarDTO.usuarioId;
        Object.assign(endereco,editarDTO)
        return this.enderecoRepository.save(endereco);
    }

    async buscarEnderecoFavoritoOuMaisRelevante(tdo:{usuarioId:number}){
        const endereco = await this.enderecoRepository.findOne({where:{usuario:{id:tdo.usuarioId},favorite:true}})
        if(!endereco) return this.enderecoRepository.findOne({where:{usuario:{id:tdo.usuarioId}},order:{id:"DESC"}});
        return endereco;
    }

    async deletar(deletarDTO) { 
        const endereco = await this.enderecoRepository.findOne({where:{id:deletarDTO.id},relations:["usuario"]});
        if(!endereco) throw new NotFoundException('Endereço não encontrado.');
        if(endereco.usuario.id != deletarDTO.usuarioId) throw new UnauthorizedException('Usuário nao tem permissão para deletar o endereço.')
        return this.enderecoRepository.delete(endereco.id);
    }
}