import { IsNumber } from "class-validator";

export class AddAdicionalProdutoDTO{
    @IsNumber()
    ingredienteId: number;

    @IsNumber()
    produtoId: number;
}