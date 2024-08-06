import { IsEmail, IsNumber, IsOptional, IsPhoneNumber, IsString } from "class-validator";


export class AuthUsuarioDTO {
    @IsNumber()
    id: number;

    @IsOptional()
    @IsString()
    nome: string;

    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsPhoneNumber()
    tel: string;

}