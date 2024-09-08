import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class EnderecoBuscarPorIdDTO{
    @IsNumber()
    @Type(()=>Number)
    id:number

    @IsOptional()
    usuarioId:number
}