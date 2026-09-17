import {
  IsEmail,
  IsString,
  Length,
  Matches,
  IsUUID,
  MaxLength,
} from 'class-validator';
export class LoginDto {
  @IsEmail() @MaxLength(255) email: string;
  @IsString() @Length(8, 128) senha: string;
}
export class RefreshDto {
  @IsString() @Length(64, 128) refreshToken: string;
}
export class SolicitarCodigoDto {
  @Matches(/^55\d{10,11}$/) tel: string;
}
export class VerificarCodigoDto {
  @IsUUID() desafioId: string;
  @Matches(/^55\d{10,11}$/) tel: string;
  @Matches(/^\d{6}$/) code: string;
}
export class EsqueciSenhaDto {
  @IsEmail() @MaxLength(255) email: string;
}
export class RedefinirSenhaDto {
  @IsUUID() desafioId: string;
  @IsString() @Length(64, 128) token: string;
  @IsString() @Length(12, 128) senha: string;
}
export class GoogleDto {
  @IsString() @Length(50, 10000) idToken: string;
}
