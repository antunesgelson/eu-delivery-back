import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  IsIn,
  IsNumber,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
export class PerfilDto {
  @IsOptional() @IsString() @Length(1, 150) nome: string;
  @IsOptional() @IsEmail() @MaxLength(255) email: string;
  @IsOptional() @Matches(/^(|\d{11})$/) cpf: string;
  @IsOptional() @IsDateString({ strict: true }) dataDeNascimento: string;
}
export class EnderecoDto {
  @IsOptional() @IsInt() @Min(1) id: number;
  @IsOptional() @IsBoolean() favorite: boolean;
  @IsOptional() @IsString() @Length(1, 100) apelido: string;
  @IsOptional() @IsString() @Length(1, 200) rua: string;
  @IsOptional() @IsString() @Length(1, 200) bairro: string;
  @IsOptional() @Matches(/^\d{8}$/) cep: string;
  @IsOptional() @IsString() @Length(1, 30) numero: string;
  @IsOptional() @IsString() @MaxLength(200) complemento: string;
  @IsOptional() @IsString() @MaxLength(200) referencia: string;
}
export class ListaDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
  @IsOptional() @IsString() @MaxLength(100) search = '';
  @IsOptional() @IsIn(['ASC', 'DESC']) order: 'ASC' | 'DESC' = 'DESC';
  @IsOptional() @IsString() @MaxLength(30) status: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
}
export class ClienteAdminDto extends PerfilDto {
  @IsOptional() @Matches(/^55\d{10,11}$/) tel: string;
}
export class CupomDto {
  @IsOptional() @IsString() @MaxLength(100) id: string;
  @Matches(/^[A-Z0-9_-]{2,60}$/) nome: string;
  @IsString() @MaxLength(300) descricao: string;
  @IsIn(['porcentagem', 'valor_fixo']) tipo: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(100000) valor: number;
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  valorMinimoGasto: number;
  @IsInt() @Min(0) @Max(1000000) quantidade: number;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) validade: string;
  @IsBoolean() status: boolean;
  @IsBoolean() listaPublica: boolean;
  @IsBoolean() unicoUso: boolean;
}
export class ConfigDto {
  @IsString() @MaxLength(100) chave: string;
  @IsString() @MaxLength(10000) valor: string;
  @IsOptional() @IsBoolean() privado: boolean;
}

export class CriarClienteDto {
  @IsString() @Length(1, 150) nome: string;
  @Matches(/^55\d{10,11}$/) tel: string;
}

export class ConfiguracoesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ConfigDto)
  configuracoes: ConfigDto[];
}

export class RelatorioDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) inicio?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) fim?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
}
