import { Type } from 'class-transformer';

import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { OrigenRubrica } from '../../../generated/prisma/client';

export class RubricaNivelDto {
  @IsInt()
  @Min(0)
  orden!: number;

  @IsString()
  @MaxLength(80)
  etiqueta!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  @Max(100)
  puntos?: number;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  descripcion?: string;
}

export class RubricaCriterioDto {
  @IsInt()
  @Min(0)
  orden!: number;

  @IsString()
  @MaxLength(160)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  @Max(100)
  peso?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({
    each: true,
  })
  @Type(() => RubricaNivelDto)
  niveles!: RubricaNivelDto[];
}

export class CrearRubricaDto {
  @IsString()
  @MaxLength(160)
  nombre!: string;

  @IsOptional()
  @IsEnum(OrigenRubrica)
  origen?: OrigenRubrica;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(1)
  @Max(100)
  ponderacionMax?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(() => RubricaCriterioDto)
  criterios!: RubricaCriterioDto[];
}
