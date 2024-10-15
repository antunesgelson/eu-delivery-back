import { Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";




export class BuscarCupomPorIdDTO{
    @IsString()
    cupomId:string;
}

