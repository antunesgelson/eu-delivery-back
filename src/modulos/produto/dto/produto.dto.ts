import { IsNumber, IsString } from "class-validator";

export class ProdutoDTO {
    @IsString()
    titulo: string;

    @IsString()
    descricao: string;

    @IsString()
    valor: string;

    @IsString()
    img: string;

    @IsNumber()
    desconto: number;

    @IsNumber()
    limitItens: number;

    @IsNumber()
    servingSize: number;

    @IsNumber()
    categoriaId: number;
}