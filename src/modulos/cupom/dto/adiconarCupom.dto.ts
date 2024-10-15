import { TipoCupomEnum } from "../cupom.entity";
import { IsBoolean, IsDate, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min, MinDate, } from "class-validator";



export class AdicionarCupomDTO{
    @IsString()
    nome:string;
    
    @IsString()
    descricao:string;

    @IsNumber()
    valor:number;

    @IsEnum(TipoCupomEnum)
    tipo:TipoCupomEnum;

    @IsNumber()
    @Min(1,{message:"A quantidade não pode ser menor que 1."})
    @Max(10000,{message:"A quantidade não pode ser maior que 10 Mil."})
    quantidade:number;

    @IsDateString()
    @IsOptional()
    validade:Date;

    @IsBoolean()
    status:boolean;

    @IsNumber()
    @Min(1,{message:"A quantidade não pode ser menor que 1."})
    valorMinimoGasto:number;

    @IsBoolean()
    listaPublica:boolean;

    @IsBoolean()
    unicoUso:boolean;

}

