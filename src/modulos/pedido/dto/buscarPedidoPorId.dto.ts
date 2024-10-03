import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export class BuscarPedidoPorIdDTO {
    @IsNumber()
    @Type(()=>Number)
    pedidoId: number;

}
