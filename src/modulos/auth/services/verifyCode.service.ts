import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodigoWpEntity } from '../codigos_wp.entity';

import { AdicionarUsuarioService } from 'src/modulos/usuario/services/adicionarUsuario.service';

@Injectable()
export class VerifyCodeService {
    constructor(@InjectRepository(CodigoWpEntity)
    private codigoWpRepository: Repository<CodigoWpEntity>,
        private adicionarUsuarioService: AdicionarUsuarioService,
    ) { }

    async exec(code: any) {

        
        const numericCode = parseInt(code.code);
        if (isNaN(numericCode)) return { message: 'Código inválido' };

        const codigo = await this.codigoWpRepository.findOne({ where: { codigo: numericCode }, order: { id: 'DESC' } });

        if (!codigo) return { message: 'Código inválido' };
        if (codigo.validade < new Date()) return { message: 'Código expirado' };
        if (Number(code) !== codigo.codigo) return { message: 'Código inválido.' };
       
        this.adicionarUsuarioService.exec({ tel: codigo.telefone, email: null,token:process.env.TOKEN_SECRET });

        return { message: 'Conta criada con sucesso!' };
    }
}

