import { Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";


export class AddFotoProdutoDTO{
    @IsNumber()
    @Type(()=>Number)
    produtoId:number
}