import { Type } from "class-transformer";
import { IsDate, IsDateString, IsNumber, isNumber, IsOptional, isPort, IsString } from "class-validator";

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
    @IsDateString()
    dataDeNascimento:string;
}