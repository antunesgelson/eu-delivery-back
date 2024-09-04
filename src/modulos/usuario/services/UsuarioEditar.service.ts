import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UsuarioEntiy } from "../usuarios.entity";
import { Repository } from "typeorm";
import { UsuarioEditarDTO } from "../dto/usuarioEditar.dto";



@Injectable()
export class UsuarioEditarService{
    constructor(@InjectRepository(UsuarioEntiy) private usuarioRepository:Repository<UsuarioEntiy>){

    }

    async exec(usuarioEditarDTO:UsuarioEditarDTO){

        const usuario = await this.usuarioRepository.findOne({where:{id:usuarioEditarDTO.id}})
        if(!usuario) throw new NotFoundException('Usuário não encontrado.')
        
        
        Object.assign(usuario,usuarioEditarDTO)
        return await this.usuarioRepository.save(usuario)
    }
}