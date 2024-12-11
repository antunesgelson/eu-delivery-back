import { IsString, IsNumber, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";


class Item {
    @IsString()
    title: string;

    @IsNumber()
    quantity: number;

    @IsString()
    description: string;

    @IsNumber()
    unit_price: number;

    @IsString()
    id: string;
}

export class CriarPedidoDTO {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Item)
    itens: Item[];

    @IsString()
    external_reference: string;
}
