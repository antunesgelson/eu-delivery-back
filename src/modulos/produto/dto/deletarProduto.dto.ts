import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export class DeletarProdutoDTO{
    @IsNumber()
    @Type(()=>Number)
    produtoId:number
}