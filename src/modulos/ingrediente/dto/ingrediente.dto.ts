import {  IsNumber, IsString } from "class-validator";

export class IngredienteDTO {
    @IsString()
    nome: string;

    @IsNumber()
    valor: number;
}