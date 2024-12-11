import { IsEmail, IsNumber, IsOptional, IsString } from "class-validator"

export class EnviarTelegramNotificacaoDTO {

    @IsNumber()
    chatId: number

    @IsString()
    mensagem: string


}