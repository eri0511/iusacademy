import {
  Type,
} from 'class-transformer';

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  ComponenteEvaluacion,
  EstadoActividadCalificable,
} from '../../../generated/prisma/client';

export class ActualizarActividadCalificableDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  titulo?:
    string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  descripcion?:
    string;

  @IsOptional()
  @IsEnum(
    ComponenteEvaluacion,
  )
  componente?:
    ComponenteEvaluacion;

  @IsOptional()
  @IsEnum(
    EstadoActividadCalificable,
  )
  estado?:
    EstadoActividadCalificable;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  orden?:
    number;

  @IsOptional()
  @IsBoolean()
  participaEnPromedio?:
    boolean;

  @IsOptional()
  @IsBoolean()
  visibleParaEstudiantes?:
    boolean;
}
