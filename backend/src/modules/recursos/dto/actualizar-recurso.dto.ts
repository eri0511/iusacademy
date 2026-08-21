import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import {
  AlcanceRecursoCurso,
  CategoriaRecursoCurso,
} from '../../../generated/prisma/client';

export class ActualizarRecursoDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  descripcion?: string;

  @IsOptional()
  @IsEnum(CategoriaRecursoCurso)
  categoria?: CategoriaRecursoCurso;

  @IsOptional()
  @IsEnum(AlcanceRecursoCurso)
  alcance?: AlcanceRecursoCurso;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hitoId?: number;

  @IsOptional()
  @IsBoolean()
  visibleParaEstudiantes?: boolean;
}
