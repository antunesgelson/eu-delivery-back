import { TipoCupomEnum } from "../cupom.entity";
import { IsBoolean, IsDate, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min, MinDate, } from "class-validator";



export class EditarCupomDTO{

    @IsString()
    id:string

    @IsString()
    @IsOptional()
    nome:string;
    
    @IsString()
    @IsOptional()
    descricao:string;

    @IsNumber()
    @IsOptional()
    valor:number;

    @IsEnum(TipoCupomEnum)
    @IsOptional()
    tipo:TipoCupomEnum;

    @IsNumber()
    @IsOptional()
    @Min(1,{message:"A quantidade não pode ser menor que 1."})
    @Max(10000,{message:"A quantidade não pode ser maior que 10 Mil."})
    quantidade:number;

    @IsDateString()
    @IsOptional()
    validade:Date;

    @IsBoolean()
    @IsOptional()
    status:boolean;

    @IsNumber()
    @IsOptional()
    @Min(1,{message:"A quantidade não pode ser menor que 1."})
    valorMinimoGasto:number;

    @IsBoolean()
    @IsOptional()
    listaPublica:boolean;

    @IsBoolean()
    @IsOptional()
    unicoUso:boolean;

}

