import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { IsUnique } from "src/shared/validator/isUnique.validator";

export class AdicionarUsuarioDTO {
    @IsOptional()
    @IsString({ message: 'Nome inválido.' })
    nome?: string;

    @IsOptional()
    @IsEmail(undefined, { message: 'E-mail inválido.' })
    @IsUnique('usuarios', 'email', { message: 'E-mail já cadastrado.' })
    email?: string;

    @IsOptional()
    @IsPhoneNumber('BR', { message: 'Telefone inválido.' })
    @IsUnique('usuarios', 'tel', { message: 'Telefone já cadastrado.' })
    tel?: string;

    @IsNotEmpty({ message: 'Token obrigatório.' })
    token: string;
}