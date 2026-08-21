import {
  Type,
} from 'class-transformer';

import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum AccionMasivaCalificacionForo {
  ASIGNAR_NOTA =
    'ASIGNAR_NOTA',

  APLICAR_DESCUENTO =
    'APLICAR_DESCUENTO',

  APLICAR_AJUSTE =
    'APLICAR_AJUSTE',

  ASIGNAR_CERO =
    'ASIGNAR_CERO',

  AGREGAR_RETROALIMENTACION =
    'AGREGAR_RETROALIMENTACION',
}

export enum FiltroMasivoCalificacionForo {
  SELECCIONADOS =
    'SELECCIONADOS',

  TODOS =
    'TODOS',

  PENDIENTES =
    'PENDIENTES',

  TARDIOS =
    'TARDIOS',

  SIN_RESPUESTA =
    'SIN_RESPUESTA',

  CALIFICADOS =
    'CALIFICADOS',
}

export class CalificarForoMasivamenteDto {
  @IsEnum(
    AccionMasivaCalificacionForo,
  )
  accion!:
    AccionMasivaCalificacionForo;

  @IsEnum(
    FiltroMasivoCalificacionForo,
  )
  filtro!:
    FiltroMasivoCalificacionForo;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(500)
  @Type(
    () =>
      Number,
  )
  @IsInt({
    each:
      true,
  })
  @Min(
    1,
    {
      each:
        true,
    },
  )
  estudiantesIds?:
    number[];

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsNumber({
    maxDecimalPlaces:
      2,
  })
  @Min(-100)
  @Max(100)
  valor?:
    number;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  retroalimentacion?:
    string;
}
