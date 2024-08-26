import { IsNumber, IsString } from "class-validator";

export class AdicionalDTO {
    @IsString()
    nome: string;

    @IsString()
    valor: string;

    @IsNumber()
    produtoId: number;
}