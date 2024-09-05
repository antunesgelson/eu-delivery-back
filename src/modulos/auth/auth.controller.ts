import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AdicionarUsuarioDTO } from "../usuario/dto/adicionarUsuario.dto";
import { AdicionarUsuarioService } from "../usuario/services/adicionarUsuario.service";
import { GetCodeDTO } from "./dto/getCode.dto";
import { VerifyCodeDTO } from "./dto/verifyCode.dto";
import { GetCodeService } from "./services/getCode.service";
import { VerifyCodeService } from "./services/verifyCode.service";
import { IsPublic } from "./decorators/isPublic.decorator";
import { AuthUsuarioService } from "./services/authUsuario.service";

@Controller('auth')
export class AuthController {
  constructor(private adicionarUsuario: AdicionarUsuarioService,
    private getCodeService: GetCodeService,
    private verifyCodeService: VerifyCodeService,
    private authUsuarioService:AuthUsuarioService
  ) { }

  @IsPublic()
  @Post('wp')
  async getCode(@Body() getCodeDTO: GetCodeDTO) {
    return this.getCodeService.exec(getCodeDTO);
  }

  @IsPublic()
  @Post('entraroucadastrar')
  async cadastrar(@Body() dadosUsuario: AdicionarUsuarioDTO) {
    const usuario = await this.adicionarUsuario.exec(dadosUsuario);
    return this.authUsuarioService.exec(usuario);

  }

  @IsPublic()
  @Post('verify')
  async verifyCode(@Body() code: VerifyCodeDTO) {
    return await this.verifyCodeService.exec(code);
  }

}