import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class LoginDTO {
    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsPhoneNumber()
    tel: string;

}