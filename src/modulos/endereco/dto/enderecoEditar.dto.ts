import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class EnderecoEditarDTO{
  
    @IsNumber()
    id:number

    @IsBoolean()
    @IsOptional()
    favorite:boolean;
    
    @IsString()
    @IsOptional()
    apelido:string;

    @IsString()
    @IsOptional()
    rua:string;

    @IsString()
    @IsOptional()
    cep:string;

    @IsString()
    @IsOptional()
    bairro:string;

    @IsString()
    @IsOptional()
    numero:string;

    @IsString()
    @IsOptional()
    complemento:string;

    @IsString()
    @IsOptional()
    referencia:string

}