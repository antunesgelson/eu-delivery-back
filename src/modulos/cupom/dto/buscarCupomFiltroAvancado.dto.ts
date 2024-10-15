
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";




export class BuscarCupomFiltroAvancado {
    @IsString()
    @IsOptional()
    nome: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({value})=>value==='true'?true:value==='false'?false:value)
    status: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({value})=>value==='true'?true:value==='false'? false:value)
    publico: boolean;
}

