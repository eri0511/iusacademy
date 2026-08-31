import { Type } from 'class-transformer';

import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class FragmentoSeleccionadoQuizDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  tituloReferencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tipoReferencia?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paginaInicio?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paginaFin?: number;

  @IsString()
  texto!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orden?: number;
}

export class SeleccionarFragmentosQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(() => FragmentoSeleccionadoQuizDto)
  fragmentos!: FragmentoSeleccionadoQuizDto[];
}
