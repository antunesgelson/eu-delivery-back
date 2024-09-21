import { IsArray, IsNumber, IsString, ArrayNotEmpty, IsOptional } from "class-validator";

export class AdicionarItemAoCarrinhoDTO {

    @IsNumber()
    produtoId: number;

    @IsArray()
    @ArrayNotEmpty() // Garante que o array não esteja vazio
    @IsNumber({}, { each: true }) // Garante que cada item no array seja um número
    ingredientes: number[];

    @IsArray()
    @IsNumber({}, { each: true }) // Garante que cada item no array seja um número
    adicionais: number[];

    @IsString()
    obs: string;

    @IsNumber()
    quantidade: number;
}
