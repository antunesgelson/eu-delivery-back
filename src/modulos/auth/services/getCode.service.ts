import { Injectable } from "@nestjs/common";
import { GetCodeDTO } from "../dto/getCode.dto";

@Injectable()
export class GetCodeService {
    async exec(getCodeDTO: GetCodeDTO) {
        const code = this.generateRandomCode();
        console.log(`Generated code: ${code}`);
        console.log(getCodeDTO);
        return { message: 'Código gerado e enviado via WhatsApp', code };
    }

    private generateRandomCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}