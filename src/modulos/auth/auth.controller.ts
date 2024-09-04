import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AdicionarUsuarioDTO } from "../usuario/dto/adicionarUsuario.dto";
import { AdicionarUsuarioService } from "../usuario/services/adicionarUsuario.service";
import { GetCodeDTO } from "./dto/getCode.dto";
import { VerifyCodeDTO } from "./dto/verifyCode.dto";
import { GetCodeService } from "./services/getCode.service";
import { VerifyCodeService } from "./services/verifyCode.service";
import { IsPublic } from "./decorators/isPublic.decorator";

@Controller('auth')
export class AuthController {
  constructor(private adicionarUsuario: AdicionarUsuarioService,
    private getCodeService: GetCodeService,
    private verifyCodeService: VerifyCodeService,
  ) { }


  @IsPublic()
  @Get('wp')
  async getCode(@Query() getCodeDTO: GetCodeDTO) {
    return this.getCodeService.exec(getCodeDTO);
  }

  @IsPublic()
  @Post('entraroucadastrar')
  async cadastrar(@Body() dadosUsuario: AdicionarUsuarioDTO) {
    return await this.adicionarUsuario.exec(dadosUsuario);
  }

  @IsPublic()
  @Post('verify')
  async verifyCode(@Body() code: VerifyCodeDTO) {
    return await this.verifyCodeService.exec(code);
  }

}