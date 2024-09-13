import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export class IngredienteListaByIdDTO{
    @IsNumber()
    @Type(()=>Number)
    id:number
}