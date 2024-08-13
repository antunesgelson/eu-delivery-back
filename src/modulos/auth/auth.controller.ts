import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AdicionarUsuarioDTO } from "../usuario/dto/adicionarUsuario.dto";
import { AdicionarUsuarioService } from "../usuario/services/adicionarUsuario.service";
import { GetCodeDTO } from "./dto/getCode.dto";
import { LoginDTO } from "./dto/login.dto";
import { AuthUsuarioService } from "./services/authUsuario.service";
import { GetCodeService } from "./services/getCode.service";
import { LoginService } from "./services/login.service";


@Controller('auth')
export class AuthController {
  constructor(private adicionarUsuario: AdicionarUsuarioService,
    private authUsuarioService: AuthUsuarioService,
    private loginService: LoginService,
    private getCodeService: GetCodeService

  ) { }

  @Get('wp')
  async getCode(@Query() getCodeDTO: GetCodeDTO) {
    return this.getCodeService.exec(getCodeDTO);
  }


  @Post('cadastrar')
  async cadastrar(@Body() dadosUsuario: AdicionarUsuarioDTO) {
    return await this.adicionarUsuario.exec(dadosUsuario);
  }

  @Post('login')
  async login(@Body() dadosLogin: LoginDTO) {
    return await this.loginService.exec(dadosLogin);
  }

}