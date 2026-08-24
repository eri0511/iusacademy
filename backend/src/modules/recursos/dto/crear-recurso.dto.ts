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
  UsoRecursoCurso,
} from '../../../generated/prisma/client';

export class CrearRecursoDto {
  @IsString()
  @MaxLength(180)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  descripcion?: string;

  @IsEnum(CategoriaRecursoCurso)
  categoria!: CategoriaRecursoCurso;

  @IsEnum(AlcanceRecursoCurso)
  alcance!: AlcanceRecursoCurso;

  @IsEnum(UsoRecursoCurso)
  uso!: UsoRecursoCurso;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hitoId?: number;

  @IsBoolean()
  visibleParaEstudiantes!: boolean;
}
