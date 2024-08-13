import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientOptions } from 'whatsapp-web.js';
import { CodigoWpEntity } from "../codigos_wp.entity";
import { GetCodeDTO } from "../dto/getCode.dto";



const clientOptions: ClientOptions = {
    puppeteer: {
        headless: false, // ou false se você quiser ver o navegador
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
};
export const client = new Client(clientOptions);
@Injectable()
export class GetCodeService {
    constructor(
        @InjectRepository(CodigoWpEntity)
        private codigoWpRepository: Repository<CodigoWpEntity>,
    ) { }

    async exec(getCodeDTO: GetCodeDTO) {
        const code = this.generateRandomCode();

        client.on('qr', (qr) => {
            // Mostrar o código QR e pedir ao usuário que faça o scan com o WhatsApp no celular
            // console.log('QR RECEBIDO', qr);
        });

        client.on('ready', () => {
            console.log('Client is ready!');
            this.enviarMensagem(getCodeDTO.tel, `Seu código de verificação é: ${code}`);
        });

        client.on('message', msg => {
            if (msg.body == '!ping') {
                msg.reply('pong');
            }
        });

        let codigo = new CodigoWpEntity();
        codigo.codigo = Number(code);
        codigo.telefone = getCodeDTO.tel;
        console.log("codigo =>", codigo);

        // await this.codigoWpRepository.save(codigo)
        client.initialize();
        return { message: 'Código gerado e enviado via WhatsApp', code };
    }

    private generateRandomCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async enviarMensagem(numero, texto) {
        // Certifique-se de incluir o código do país e remover espaços ou caracteres especiais
        let numeroFormatado = numero.replace(/\D/g, "") + "@c.us";
        await client.sendMessage(numeroFormatado, texto);
    }



}