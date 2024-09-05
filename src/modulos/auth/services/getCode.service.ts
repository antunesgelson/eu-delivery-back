import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import axios from "axios";
import { Repository } from 'typeorm';
import { CodigoWpEntity } from "../codigos_wp.entity";
import { GetCodeDTO } from "../dto/getCode.dto";

@Injectable()
export class GetCodeService {
    constructor(
        @InjectRepository(CodigoWpEntity)
        private codigoWpRepository: Repository<CodigoWpEntity>,
    ) { }

    async exec(getCodeDTO: GetCodeDTO) {
        const code = this.generateRandomCode();
        const timeValidate = new Date();
        timeValidate.setMinutes(timeValidate.getMinutes() + 2); // 2 minutos de validade

        let codigo = new CodigoWpEntity();
        codigo.codigo = Number(code);
        codigo.telefone = getCodeDTO.tel;
        codigo.validade = timeValidate;

        await this.codigoWpRepository.save(codigo)
        await this.enviarMensagem(getCodeDTO.tel, `Seu código de verificação é: ${code}`);
      
        return { message: 'Código gerado e enviado via WhatsApp' };
    }

    private generateRandomCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async enviarMensagem(numero, texto) {
        // Certifique-se de incluir o código do país e remover espaços ou caracteres especiais
        let numeroFormatado = numero.replace(/\D/g, "") + "@c.us";
        return axios.post(`https://emporio-wp.seu.dev.br/bot/enviar`, {
            numero: numeroFormatado,
            mensagem: texto
        }, {
            headers: {
                'Authorization': 'Bearer jfjj5448fgjJJjJjkUFrHJHBVCCfDGHjKklf54F4Ff4f4Ff6f97f6flJUGlGyf' // Token de autorização para evitar requisição maliciosa
            }
        })
    }



}