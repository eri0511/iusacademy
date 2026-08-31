import { Type } from 'class-transformer';

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  ComponenteEvaluacion,
  TipoOrigenActividad,
} from '../../../generated/prisma/client';

export class CrearActividadCalificableDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hitoId!: number;

  @IsEnum(TipoOrigenActividad)
  origen!: TipoOrigenActividad;

  @IsEnum(ComponenteEvaluacion)
  componente!: ComponenteEvaluacion;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  participaEnPromedio?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleParaEstudiantes?: boolean;
}
