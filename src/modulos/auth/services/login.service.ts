import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioEntiy } from 'src/modulos/usuario/usuario.entity';
import { Repository } from 'typeorm';
import { LoginDTO } from '../dto/login.dto';
import { AuthUsuarioService } from './authUsuario.service';


@Injectable()
export class LoginService {
    constructor(@InjectRepository(UsuarioEntiy)
    private usuarioRepository: Repository<UsuarioEntiy>,
        private jwtAuth: AuthUsuarioService,
    ) { }

    async exec(loginDTO: LoginDTO) {
        if (!loginDTO.email && !loginDTO.tel) {
            if (!loginDTO.email) throw new Error("Informe o email.");
            if (!loginDTO.tel) throw new Error("Informe o telefone.");
        }

        // const usuario = await this.usuarioRepository.findOne({ where: { email: loginDTO.email } });
        // if (!usuario) throw new Error("Usuário não encontrado.");
        const usuario = await this.usuarioRepository.createQueryBuilder('usuarios') // busca usuário por e-mail ou telefone
            .where('usuarios.email = :email', { email: loginDTO.email })
            .orWhere('usuarios.tel = :tel', { tel: loginDTO.tel })
            .getOne();

        return this.jwtAuth.exec({ id: usuario.id, nome: usuario.nome, email: usuario.email, tel: usuario.tel }); // Retorna o usuário salvo

    }
}
