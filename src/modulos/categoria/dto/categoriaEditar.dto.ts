import { IsNumber, IsOptional, IsString } from "class-validator";
export class CategoriaEditarDTO {

    @IsNumber()
    id:number;

    @IsString()
    titulo: string;

}