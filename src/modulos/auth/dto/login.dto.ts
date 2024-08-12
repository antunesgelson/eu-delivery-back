import { IsEmail, IsOptional, IsPhoneNumber } from "class-validator";

export class LoginDTO {
    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsPhoneNumber()
    tel: string;
}