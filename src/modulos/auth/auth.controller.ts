import { Controller, Get, Query } from "@nestjs/common";
import { GetCodeDTO } from "./dto/getCode.dto";
import { GetCodeService } from "./services/getCode.service";

@Controller('auth')
export class AuthController {
    constructor(private getCodeService: GetCodeService) {
    }

    @Get('wp')
    async getCode(@Query() getCodeDTO: GetCodeDTO) {
        return this.getCodeService.exec(getCodeDTO);

    }
}