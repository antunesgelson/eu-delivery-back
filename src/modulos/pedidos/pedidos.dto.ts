import { EnderecoDto } from '../clientes/clientes.dto';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  IsObject,
} from 'class-validator';
export class SubstituicaoDto {
  @IsString() @MaxLength(100) removerId: string;
  @IsString() @MaxLength(100) adicionarId: string;
}
export class ItemDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => SubstituicaoDto)
  substituicoes?: SubstituicaoDto[];
  @IsInt() @Min(1) @Max(Number.MAX_SAFE_INTEGER) produtoId: number;
  @IsInt() @Min(1) @Max(100) quantidade: number;
  @IsOptional() @IsString() @MaxLength(500) obs: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  adicionais: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  ingredientes: string[];
}
export class QuantidadeDto {
  @IsInt() @Min(1) @Max(100) quantidade: number;
}
export class CarrinhoDto {
  @IsOptional() @IsInt() @Min(1) enderecoId: number;
  @IsOptional() @IsDateString({ strict: true }) dataEntrega: string;
  @IsOptional() @IsIn(['pickup', 'delivery']) tipoRecebimento: string;
  @IsOptional()
  @IsIn([
    'Pagamento na Entrega - Dinheiro',
    'Pagamento na Entrega - Cartão',
    'Pagamento online - Pix',
    'Pagamento online - Cartão de crédito',
  ])
  formaPagamento: string;
  @IsOptional() @IsString() @MaxLength(60) cupom: string;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  cashBack: number;
  @IsOptional() @IsString() @MaxLength(500) obs: string;
}
export class StatusDto {
  @IsIn(['analysis', 'production', 'ready', 'completed', 'cancelled'])
  status: string;
}
export class PagarDto {
  @IsIn(['paid']) paymentStatus: string;
}
export class ParcelaDto {
  @IsIn(['cash', 'card', 'pix']) metodo: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(100000) valor: number;
}
export class PdvDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => EnderecoDto)
  endereco: EnderecoDto;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ParcelaDto)
  pagamentos: ParcelaDto[];
  @IsInt() @Min(1) clienteId: number;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  itens: ItemDto[];
  @IsDateString({ strict: true }) dataEntrega: string;
  @IsIn(['retirada', 'balcao', 'entrega']) canal: string;
  @IsIn([
    'Pagamento na Entrega - Dinheiro',
    'Pagamento na Entrega - Cartão',
    'Pagamento na Entrega - Pix',
    'Pagamento na Entrega - Dividido',
  ])
  formaPagamento: string;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-100000)
  @Max(100000)
  ajuste: number;
  @IsOptional() @IsIn(['paid', 'pending']) pagamentoStatus: string;
  @IsOptional() @IsString() @MaxLength(60) cupom: string;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  cashBack: number;
  @IsOptional() @IsString() @MaxLength(500) obs: string;
}

export class RascunhoPdvDto {
  @IsObject() dados: Record<string, unknown>;
}

export class EditarPedidoDto {
  @IsOptional() @IsString() @MaxLength(500) obs?: string;
  @IsOptional() @IsDateString({ strict: true }) dataEntrega?: string;
}
