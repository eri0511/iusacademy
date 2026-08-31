import { Type } from 'class-transformer';

import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AgregarFragmentoQuizDto {
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
