import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator"

export class EnderecoDeletarDTO{
    @IsOptional()
    @IsNumber()
    usuarioId:number

    @IsNumber()
    id:number

    
}