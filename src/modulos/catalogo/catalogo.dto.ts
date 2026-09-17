import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
export class EstoqueDto {
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(100000) saturday: number;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(100000) sunday: number;
}
export class ComponenteDto {
  @IsInt() @Min(1) @Max(Number.MAX_SAFE_INTEGER) productId: number;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(1000) quantity: number;
}
export class ProdutoDto {
  @IsInt() @Min(1) @Max(Number.MAX_SAFE_INTEGER) id: number;
  @IsString() @MaxLength(200) title: string;
  @IsString() @MaxLength(3000) description: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(100000) price: number;
  @IsString() @MaxLength(2000000) image: string;
  @IsInt() @Min(1) @Max(1000) servingSize: number;
  @ValidateNested() @Type(() => EstoqueDto) stock: EstoqueDto;
  @IsBoolean() forcedSoldOut: boolean;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  classifications: string[];
  @IsOptional() @IsIn(['simple', 'compound']) productKind: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ComponenteDto)
  components: ComponenteDto[];
  @IsOptional() @IsObject() stockByDate: Record<string, number>;
  @IsOptional() @IsObject() soldOutByDate: Record<string, boolean>;
}
export class CategoriaDto {
  @IsString() @MaxLength(100) id: string;
  @IsString() @MaxLength(200) title: string;
  @IsString() @MaxLength(100) badge: string;
  @IsIn(['active', 'draft']) status: string;
  @IsOptional() @IsString() @MaxLength(100) campaign: string;
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ProdutoDto)
  products: ProdutoDto[];
}
export class SalvarCatalogoDto {
  @IsInt() @Min(0) version: number;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CategoriaDto)
  categories: CategoriaDto[];
}
