import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';

import {
  AlcanceConjuntoGrupo,
  CriterioDistribucionGrupo,
  MetodoCreacionGrupo,
  TipoEvaluacionGrupo,
} from '../../../generated/prisma/client';

export class GrupoInicialDto {
  @IsString({
    message:
      'El nombre del grupo debe ser un texto',
  })
  @MinLength(
    1,
    {
      message:
        'El nombre del grupo es obligatorio',
    },
  )
  @MaxLength(
    80,
    {
      message:
        'El nombre del grupo no puede superar los 80 caracteres',
    },
  )
  nombre!:
    string;

  @IsOptional()
  @IsString({
    message:
      'La descripción del grupo debe ser un texto',
  })
  @MaxLength(
    300,
    {
      message:
        'La descripción del grupo no puede superar los 300 caracteres',
    },
  )
  descripcion?:
    string;

  @IsOptional()
  @IsString({
    message:
      'El color del grupo debe ser un texto',
  })
  @MaxLength(
    30,
    {
      message:
        'El color del grupo no puede superar los 30 caracteres',
    },
  )
  color?:
    string;

  @IsOptional()
  @IsArray({
    message:
      'Los estudiantes deben enviarse como una lista',
  })
  @IsInt({
    each:
      true,
    message:
      'Cada estudiante debe tener un identificador válido',
  })
  estudianteIds?:
    number[];
}

export class CrearConjuntoGrupoDto {
  @IsString({
    message:
      'El nombre del conjunto debe ser un texto',
  })
  @MinLength(
    3,
    {
      message:
        'El nombre del conjunto debe tener al menos 3 caracteres',
    },
  )
  @MaxLength(
    120,
    {
      message:
        'El nombre del conjunto no puede superar los 120 caracteres',
    },
  )
  nombre!:
    string;

  @IsOptional()
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
  descripcion?:
    string;

  @IsEnum(
    AlcanceConjuntoGrupo,
    {
      message:
        'El alcance del conjunto no es válido',
    },
  )
  alcance!:
    AlcanceConjuntoGrupo;

  @IsEnum(
    TipoEvaluacionGrupo,
    {
      message:
        'El tipo de evaluación del conjunto no es válido',
    },
  )
  tipoEvaluacion!:
    TipoEvaluacionGrupo;

  @ValidateIf(
    (
      objeto:
        CrearConjuntoGrupoDto,
    ) =>
      objeto.alcance ===
      AlcanceConjuntoGrupo.HITO,
  )
  @IsInt({
    message:
      'El hito debe tener un identificador válido',
  })
  @Min(
    1,
    {
      message:
        'El identificador del hito no es válido',
    },
  )
  hitoId?:
    number;

  @IsEnum(
    MetodoCreacionGrupo,
    {
      message:
        'El método de creación no es válido',
    },
  )
  metodoCreacion!:
    MetodoCreacionGrupo;

  @IsOptional()
  @IsEnum(
    CriterioDistribucionGrupo,
    {
      message:
        'El criterio de distribución no es válido',
    },
  )
  criterioDistribucion?:
    CriterioDistribucionGrupo;

  @ValidateIf(
    (
      objeto:
        CrearConjuntoGrupoDto,
    ) =>
      objeto.criterioDistribucion ===
      CriterioDistribucionGrupo.CANTIDAD_GRUPOS,
  )
  @IsInt({
    message:
      'La cantidad de grupos debe ser un número entero',
  })
  @Min(
    2,
    {
      message:
        'Debes crear al menos 2 grupos',
    },
  )
  @Max(
    100,
    {
      message:
        'No puedes crear más de 100 grupos',
    },
  )
  cantidadGruposObjetivo?:
    number;

  @ValidateIf(
    (
      objeto:
        CrearConjuntoGrupoDto,
    ) =>
      objeto.criterioDistribucion ===
      CriterioDistribucionGrupo.INTEGRANTES_POR_GRUPO,
  )
  @IsInt({
    message:
      'Los integrantes por grupo deben ser un número entero',
  })
  @Min(
    2,
    {
      message:
        'Cada grupo debe tener al menos 2 integrantes',
    },
  )
  @Max(
    100,
    {
      message:
        'Un grupo no puede tener más de 100 integrantes',
    },
  )
  integrantesPorGrupoObjetivo?:
    number;

  @IsOptional()
  @IsBoolean({
    message:
      'La configuración de representante debe ser verdadera o falsa',
  })
  requiereRepresentante?:
    boolean;

  @ValidateIf(
    (
      objeto:
        CrearConjuntoGrupoDto,
    ) =>
      objeto.metodoCreacion ===
      MetodoCreacionGrupo.MANUAL,
  )
  @IsArray({
    message:
      'Los grupos iniciales deben enviarse como una lista',
  })
  @ArrayNotEmpty({
    message:
      'Debes crear al menos un grupo',
  })
  @ValidateNested({
    each:
      true,
  })
  @Type(
    () =>
      GrupoInicialDto,
  )
  grupos?:
    GrupoInicialDto[];
}
