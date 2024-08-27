import { IsBoolean, IsNumber } from "class-validator";

export class AddProductIngrentDTO {
    @IsNumber()
    produtoId: number;

    @IsNumber()
    ingredienteId: number;

    @IsNumber()
    quantia: number;

    @IsBoolean()
    removivel: boolean;
}