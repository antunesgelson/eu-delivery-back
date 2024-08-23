import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodigoWpEntity } from '../codigos_wp.entity';
import { LoginService } from './login.service';

@Injectable()
export class VerifyCodeService {
    constructor(@InjectRepository(CodigoWpEntity)
    private codigoWpRepository: Repository<CodigoWpEntity>,
        private login: LoginService,
    ) { }

    async exec(code: any) {
        const numericCode = parseInt(code.code);
        if (isNaN(numericCode)) return { message: 'Código inválido' };

        const codigo = await this.codigoWpRepository.findOne({ where: { codigo: numericCode }, order: { id: 'DESC' } });

        if (!codigo) return { message: 'Código inválido' };
        if (codigo.validade < new Date()) return { message: 'Código expirado' };
        if (Number(code) !== codigo.codigo) return { message: 'Código inválido.' };

        this.login.exec({ tel: codigo.telefone, email: null });

        return { message: 'Conta criada con sucesso!' };
    }
}

