import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodigoWpEntity } from '../codigos_wp.entity';
import { AuthUsuarioService } from './authUsuario.service';
import { UsuarioEntiy } from 'src/modulos/usuario/usuarios.entity';
import { UsuarioService } from 'src/modulos/usuario/usuario.service';

@Injectable()
export class VerifyCodeService {
    constructor(@InjectRepository(CodigoWpEntity)
    private codigoWpRepository: Repository<CodigoWpEntity>,
        @InjectRepository(UsuarioEntiy)
        private usuarioRepository: Repository<UsuarioEntiy>,
        private usuarioService: UsuarioService,
        private authUsuarioService: AuthUsuarioService,
    ) { }

    async exec(code: any) {
        const numericCode = parseInt(code.code);
        if (isNaN(numericCode)) return { message: 'Código inválido' };
        const codigo = await this.codigoWpRepository.findOne({ where: { codigo: numericCode, isValid: false }, order: { id: 'DESC' } });
        if (!codigo) throw new NotFoundException('Código não encontrado.');
        if (codigo.validade < new Date()) throw new Error('Código inspirado.')
        if (numericCode !== codigo.codigo) throw new Error('Código inválido.')
        const usuarioExiste = await this.usuarioRepository.findOne({ where: { tel: codigo.telefone } });
        if (!usuarioExiste) {
            const usuario = await this.usuarioService.adicionar({ tel: codigo.telefone, email: '', token: process.env.TOKEN_SECRET });
            codigo.isValid = true;
            await this.codigoWpRepository.save(codigo)
            return this.authUsuarioService.exec(usuario);
        }else{
            return this.authUsuarioService.exec({email:usuarioExiste.email,id:usuarioExiste.id,isAdmin:usuarioExiste.isAdmin,nome:usuarioExiste.nome,tel:usuarioExiste.tel});
        }

    }
}

