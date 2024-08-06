import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class UsuarioDTO {
    @IsOptional()
    id: number = null

    @IsOptional()
    @IsString()
    nome: string = null

    @IsOptional()
    @IsEmail()
    email?: string = null

    @IsPhoneNumber('BR')
    tel: string = null

    @IsOptional()
    cpf?: string = null

    @IsOptional()
    dataDeNascimento: Date = null

    @IsOptional()
    created_at?: Date = null

    @IsOptional()
    updated_at?: Date = null
}