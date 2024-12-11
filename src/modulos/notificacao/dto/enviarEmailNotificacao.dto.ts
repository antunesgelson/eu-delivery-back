import { IsEmail, IsOptional, IsString } from "class-validator"

export class EnviarEmailNotificacaoDTO{
    
    @IsEmail()
    @IsString()
    from:string
    
    @IsEmail()
    @IsString()
    to:string

    @IsString()
    subject:string

    @IsString()
    @IsOptional()
    text:string

    @IsString()
    @IsOptional()
    html:string
}