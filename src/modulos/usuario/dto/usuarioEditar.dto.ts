import { IsDate, IsNumber, isNumber, IsOptional, isPort, IsString } from "class-validator";

export class UsuarioEditarDTO{

    @IsOptional()
    @IsNumber()
    id:number

    @IsOptional()
    @IsString()
    nome:string

    @IsOptional()
    @IsString()
    cpf:string

    @IsOptional()
    @IsString()
    dataDeNascimento:string
}