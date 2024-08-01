import { IsPhoneNumber } from "class-validator";

export class GetCodeDTO {
    @IsPhoneNumber('BR', { message: 'Telefone inválido' })
    tel: string;
}