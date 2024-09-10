import { Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";


export class DeletarFotoProdutoDTO{
    @IsNumber()
    @Type(()=>Number)
    produtoId:number

    @IsString()
    etag:string
}