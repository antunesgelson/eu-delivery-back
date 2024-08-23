import { IsNumber } from "class-validator";

export class VerifyCodeDTO {
    @IsNumber()
    code: number;
}