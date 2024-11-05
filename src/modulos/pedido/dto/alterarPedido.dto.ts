import { Type } from "class-transformer"
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
import { PeriodoEntregaEnum } from "../pedido.entity"
import { UmOuOutroValidator } from "src/shared/validator/umOuOutro.validator"


class PeriodoEntregaDTO{

    @IsEnum(PeriodoEntregaEnum)
    periodo:PeriodoEntregaEnum;

    @IsDate()
    @Type(()=>Date)
    data:Date;
}


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
    @Type(()=>PeriodoEntregaDTO)
    @ValidateNested()
    @UmOuOutroValidator('dataEntrega',{message:'A dataEntrega ou periodoEntrega deve ser preenchida, mas não ambas.'})
    periodoEntrega:PeriodoEntregaDTO


    @IsOptional()
    @IsString()
    obs:string
}