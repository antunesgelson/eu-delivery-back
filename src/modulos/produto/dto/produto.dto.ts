import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { AzureActiveDirectoryPasswordAuthentication } from "typeorm/driver/sqlserver/authentication/AzureActiveDirectoryPasswordAuthentication";

export class ProdutoDTO {
    @IsString()
    titulo: string;

    @IsString()
    descricao: string;

    @IsNumber()
    @Type(()=>Number)
    valor: number;

    @IsNumber()
    @Type(()=>Number)
    valorPromocional: number;

    @IsNumber()
    @Type(()=>Number)
    limitItens: number;

    @IsNumber()
    @Type(()=>Number)
    servingSize: number;

    @IsNumber()
    @Type(()=>Number)
    categoriaId: number;

    @IsOptional()
    img:any

}