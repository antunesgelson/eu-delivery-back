import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioEntiy } from 'src/modulos/usuario/usuario.entity';
import { Repository } from 'typeorm';
import { AuthUsuarioDTO } from '../dto/authUsuario.dto';


@Injectable()
export class AuthUsuarioService {
    constructor(private readonly jwtService: JwtService,
        @InjectRepository(UsuarioEntiy) private usuarioRepository: Repository<UsuarioEntiy>) { }

    async exec(authUsuarioDTO: AuthUsuarioDTO) {

        const payload = {
            sub: authUsuarioDTO.id,
            email: authUsuarioDTO.email,
            nome: authUsuarioDTO.nome,
            tel: authUsuarioDTO.tel
        }

        const jwtToken = await this.jwtService.sign(payload)
        const usuario = await this.usuarioRepository.findOne({ where: { id: authUsuarioDTO.id } });

        await this.usuarioRepository.save(usuario)

        return { token: jwtToken }

    }
}
