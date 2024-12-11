import { Injectable } from "@nestjs/common";
import * as nodemailer from 'nodemailer'
import { OnEvent } from "@nestjs/event-emitter";
import { EnviarTelegramNotificacaoDTO } from "./dto/enviarTelegramNotificacao.dto";
import axios from "axios"
import { EnviarEmailNotificacaoDTO } from "./dto/enviarEmailNotificacao.dto";



@Injectable()
export class NotificacaoService {
    private transporter: nodemailer.Transporter;
    constructor() {
        this.transporter = this.emailConfig();
    }

    @OnEvent('notificacao.email')
    async eventEnviarEmail(dto: EnviarEmailNotificacaoDTO) {
        this.transporter.sendMail({ ...dto }).then(result => null).catch((error) => { console.log(error) })
    }

    async emailSuporte(dto: EnviarEmailNotificacaoDTO) {
        await this.eventNotificarSuporte({ de: dto.from, assunto: dto.subject, msg: dto.text }) // notifica no telegram...
        dto.text = `de:${dto.from} \n assunto:${dto.subject} \n MSG api de suport:${dto.text}`// ajuste a mensagem
        dto.to = process.env.EMAIL_USER;       // muda o to para o mesmo email da configuração pra não enviar para outra pessoa..
        dto.html = '';//seta o html como vazio...
        dto.from = process.env.EMAIL_USER;  // ajusta o to e from para o email configurado..
        return this.transporter.sendMail({ ...dto });//envia o email.
    }

    @OnEvent('notificacao.telegram')
    async eventEnviarTelegram(dto: EnviarTelegramNotificacaoDTO) {
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${dto.chatId}&text=${encodeURIComponent(dto.mensagem)}`;
        try {
            const response = await axios.get(url);
        } catch (error) {
            console.error(error);
        }
    }

    @OnEvent('app.error')
    eventNotificarGrupo(event: any) {
        this.eventEnviarTelegram({ chatId: parseInt(process.env.TELEGRAM_IDGRUPO), mensagem: JSON.stringify(event) });
    }




    @OnEvent('pagamento.change')
    @OnEvent('pagamento.error')
    @OnEvent('pagamento.aprovado')
    eventNotificarGrupoPagamentoAprovado(event: any) {
        const msg = `🤑 PAGAMENTO 💰💰💰
status: ${event.status}
referencia: ${event.referenciaId}
valor: ${event.valor}
        `
        this.eventEnviarTelegram({ chatId: parseInt(process.env.TELEGRAM_IDGRUPO), mensagem: msg });
    }


    async eventNotificarSuporte(event: any) {
        const msg = `📢📢📢 SUPORTE 📢📢📢
DE: ${event.de}
ASSUNTO: ${event.assunto}
MSG: ${event.msg}
        `
        return this.eventEnviarTelegram({ chatId: parseInt(process.env.TELEGRAM_IDGRUPO), mensagem: msg });
    }

    private emailConfig() {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER, // generated ethereal user
                pass: process.env.EMAIL_PASS, // generated ethereal password
            },
            tls: {
                rejectUnauthorized: false, // Aceita certificados autoassinados
            }
        });
    }
}