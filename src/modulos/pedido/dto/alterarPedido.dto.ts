import { Type } from "class-transformer"
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator"

export class AlterarEnderecoDataDeEntregaDTO{
    @IsOptional()
    @IsNumber()
    enderecoId:number

    @IsOptional()
    @IsString()
    cupomId:string

    @IsOptional()
    @IsDate()
    @Type(()=>Date)
    dataEntrega:Date


    @IsOptional()
    @IsString()
    obs:string
}