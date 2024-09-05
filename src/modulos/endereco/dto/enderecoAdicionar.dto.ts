import { IsOptional, IsString } from "class-validator"

export class EnderecoAdicionarDTO{
    @IsOptional()
    usuarioId:number

    @IsString()
    apelido:string;

    @IsString()
    rua:string;

    @IsString()
    cep:string;

    @IsString()
    bairro:string;

    @IsString()
    numero:string;

    @IsString()
    complemento:string;

    @IsString()
    referencia:string

}