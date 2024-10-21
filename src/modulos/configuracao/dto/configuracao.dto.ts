import { IsBoolean, IsString } from "class-validator"

export class ConfiguracaoDTO{
    
    @IsString()
    chave:string

    @IsString()
    valor:string

    @IsBoolean()
    privado:boolean
}