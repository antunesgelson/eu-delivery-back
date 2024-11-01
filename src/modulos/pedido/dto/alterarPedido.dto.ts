import { Type } from "class-transformer"
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from "class-validator"
import { PeriodoEntregaEnum } from "../pedido.entity"
import { UmOuOutroValidator } from "src/shared/validator/umOuOutro.validator"

export class AlterarEnderecoDataDeEntregaDTO{
    @IsOptional()
    @IsNumber()
    enderecoId:number

    @IsOptional()
    @IsString()
    cupom:string

    @IsOptional()
    @IsDate()
    @Type(()=>Date)
    @UmOuOutroValidator('periodoEntrega',{message:'A dataEntrega ou periodoEntrega deve ser preenchida, mas não ambas.'})
    dataEntrega:Date

    @IsOptional()
    @IsEnum(PeriodoEntregaEnum)
    @UmOuOutroValidator('dataEntrega',{message:'A dataEntrega ou periodoEntrega deve ser preenchida, mas não ambas.'})
    periodoEntrega:PeriodoEntregaEnum


    @IsOptional()
    @IsString()
    obs:string
}