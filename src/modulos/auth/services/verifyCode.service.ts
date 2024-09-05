import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodigoWpEntity } from '../codigos_wp.entity';

import { AdicionarUsuarioService } from 'src/modulos/usuario/services/adicionarUsuario.service';
import { error } from 'console';

@Injectable()
export class VerifyCodeService {
    constructor(@InjectRepository(CodigoWpEntity)
    private codigoWpRepository: Repository<CodigoWpEntity>,
        private adicionarUsuarioService: AdicionarUsuarioService,
    ) { }

    async exec(code: any) {
        const numericCode = parseInt(code.code);
        if (isNaN(numericCode)) return { message: 'Código inválido' };
        const codigo = await this.codigoWpRepository.findOne({ where: { codigo: numericCode, isValid:false }, order: { id: 'DESC' } });
        if (!codigo) throw new NotFoundException('Código não encontrado.');
        if (codigo.validade < new Date()) throw new Error('Código inspirado.')
        if (numericCode !== codigo.codigo) throw new Error('Código inválido.')     
        await this.adicionarUsuarioService.exec({ tel: codigo.telefone, email: null,token:process.env.TOKEN_SECRET });
        codigo.isValid = true;
        await this.codigoWpRepository.save(codigo)
        return { message: 'Conta criada con sucesso!' };
    }
}

