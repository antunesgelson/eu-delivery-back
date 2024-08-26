import { IsInt } from "class-validator";

export class GetProductByIdDTO {
    @IsInt()
    id: number;
}
