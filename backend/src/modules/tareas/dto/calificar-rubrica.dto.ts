import { Type } from 'class-transformer';

import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RubricaItemCalificacionDto {
  @IsInt()
  @Min(1)
  criterioId!: number;

  /** Nivel seleccionado. Si no se envía, el criterio queda sin evaluar. */
  @IsOptional()
  @IsInt()
  @Min(1)
  nivelId?: number;

  /**
   * Puntos otorgados sobre la escala del criterio. Normalmente coincide
   * con los puntos del nivel elegido, pero el docente puede ajustarlos.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  @Max(100)
  puntosAsignados?: number;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  retroalimentacion?: string;
}

export class CalificarRutricaDto {
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => RubricaItemCalificacionDto)
  items!: RubricaItemCalificacionDto[];

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  retroalimentacion?: string;
}
