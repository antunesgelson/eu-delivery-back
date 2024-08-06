import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthUsuarioService } from "src/modulos/auth/services/authUsuario.service";
import { Repository } from "typeorm";
import { AdicionarUsuarioDTO } from "../dto/adicionarUsuario.dto";
import { UsuarioEntiy } from "../usuario.entity";

@Injectable()
export class AdicionarUsuarioService {
    constructor(@InjectRepository(UsuarioEntiy) private usuarioRepository: Repository<UsuarioEntiy>,
        private jwtAuth: AuthUsuarioService,
    ) { } // Acesso a entidade Usuario no banco de dados

    async exec(adicionarUsuarioDTO: AdicionarUsuarioDTO) { // função para adicionar novo usuário, será chamada no controller
        if (!adicionarUsuarioDTO.token || adicionarUsuarioDTO.token !== process.env.TOKEN_SECRET) return { message: 'Token inválido.' }; // Verifica se o token foi passado

        if (!adicionarUsuarioDTO.tel && !adicionarUsuarioDTO.email) {
            if (!adicionarUsuarioDTO.tel) return { message: 'Telefone é obrigatório' };
            if (!adicionarUsuarioDTO.email) return { message: 'E-mail é obrigatório' };
        }

        const usuario = await this.usuarioRepository.save({ ...adicionarUsuarioDTO }); // Salva novo usuário no banco de dados
        return this.jwtAuth.exec({ id: usuario.id, nome: usuario.nome, email: usuario.email, tel: usuario.tel }); // Retorna o usuário salvo
    }
}



