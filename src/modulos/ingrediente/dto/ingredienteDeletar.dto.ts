import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export class IngredienteDeletarDTO{
    @IsNumber()
    @Type(()=>Number)
    id:number
}