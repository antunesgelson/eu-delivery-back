import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthUsuarioService } from "src/modulos/auth/services/authUsuario.service";
import { Repository } from "typeorm";
import { UsuarioEntiy } from "./usuarios.entity";
import { AdicionarUsuarioDTO } from "./dto/adicionarUsuario.dto";
import { UsuarioEditarDTO } from "./dto/usuarioEditar.dto";

@Injectable()
export class UsuarioService {
    constructor(@InjectRepository(UsuarioEntiy) private usuarioRepository: Repository<UsuarioEntiy>,
        private jwtAuth: AuthUsuarioService,
    ) { } // Acesso a entidade Usuario no banco de dados

    async buscar(buscarDTO) {
        return this.usuarioRepository.find({ where: { id: buscarDTO.usuarioId } });
    }

    async editar(usuarioEditarDTO: UsuarioEditarDTO & { id: number }) {
        const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioEditarDTO.id } })
        if (!usuario) throw new NotFoundException('Usuário não encontrado.')
        Object.assign(usuario, usuarioEditarDTO);
        return await this.usuarioRepository.save(usuario);
    }

    async adicionar(adicionarUsuarioDTO: AdicionarUsuarioDTO) { // função para adicionar novo usuário, será chamada no controller
        if (!adicionarUsuarioDTO.token || adicionarUsuarioDTO.token !== process.env.TOKEN_SECRET) return { message: 'Token inválido.' }; // Verifica se o token foi passado
        if (!adicionarUsuarioDTO.tel && !adicionarUsuarioDTO.email) {
            if (!adicionarUsuarioDTO.tel) return { message: 'Telefone é obrigatório' };
            if (!adicionarUsuarioDTO.email) return { message: 'E-mail é obrigatório' };
        }
        let user;
        if (adicionarUsuarioDTO.tel) {
            user = await this.usuarioRepository.findOne({ where: { tel: adicionarUsuarioDTO.tel } })
        } else {
            user = await this.usuarioRepository.findOne({ where: { email: adicionarUsuarioDTO.email } })
        }
        if (!user) {
            const usuario = await this.usuarioRepository.save({ ...adicionarUsuarioDTO }); // Salva novo usuário no banco de dados
            return usuario;
        }
        return user;
    }


}



