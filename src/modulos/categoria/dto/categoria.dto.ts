import { IsString } from "class-validator";
export class CategoriaDTO {
    @IsString()
    titulo: string
}