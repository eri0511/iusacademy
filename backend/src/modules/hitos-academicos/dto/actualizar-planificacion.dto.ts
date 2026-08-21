import {
  Transform,
  Type,
} from 'class-transformer';

import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import {
  FechaHitoDto,
} from './crear-planificacion.dto';

export class ActualizarPlanificacionDto {
  @IsOptional()
  @Transform(
    ({
      value,
    }) =>
      typeof value ===
      'string'
        ? value.trim()
        : value,
  )
  @IsString({
    message:
      'La descripción debe ser un texto',
  })
  @MaxLength(
    500,
    {
      message:
        'La descripción no puede superar los 500 caracteres',
    },
  )
  descripcion?: string;

  @IsOptional()
  @IsArray({
    message:
      'Los hitos deben enviarse en una lista',
  })
  @ArrayMinSize(
    5,
    {
      message:
        'Debes registrar exactamente los cinco hitos',
    },
  )
  @ArrayMaxSize(
    5,
    {
      message:
        'Debes registrar exactamente los cinco hitos',
    },
  )
  @ValidateNested({
    each:
      true,
  })
  @Type(
    () =>
      FechaHitoDto,
  )
  hitos?: FechaHitoDto[];
}