import { IsNumber } from "class-validator"

export class DeletarAdicionalProdutoDTO{
    
    @IsNumber()
    produtoId:number
    
    @IsNumber()
    ingredienteId:number
}