import { IsNumber } from "class-validator";

export class AdicionarAdicionalDTO {

    @IsNumber()
    ingredienteId: number;

    @IsNumber()
    produtoId: number;
}