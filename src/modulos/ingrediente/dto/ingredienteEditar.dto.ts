import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";


export class IngredienteEditarDTO{
    @IsNumber()
    id:number

    @IsOptional()
    @IsString()
    nome: string;

    @IsOptional()
    @IsNumber()
    valor: number;
 
}