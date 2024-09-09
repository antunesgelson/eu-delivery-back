import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsuarioEntiy } from "../usuarios.entity";

@Injectable()
export class BuscarUsuarioService {
    constructor(
        @InjectRepository(UsuarioEntiy)
        private usuarioRepository: Repository<UsuarioEntiy>
    ) { }

    async exec(buscarDTO) {
        return this.usuarioRepository.find({ where: { id: buscarDTO.usuarioId } });
    }
}