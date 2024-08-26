import { IsBoolean, IsNumber, IsString } from "class-validator";

export class IngredienteDTO {
    @IsString()
    nome: string;

    @IsString()
    valor: string;

    @IsBoolean()
    removivel: boolean;

    @IsNumber()
    quantia: number;

    @IsNumber()
    produtoId: number;
}