import {
  Transform,
  Type,
} from 'class-transformer';

import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  EstadoForo,
} from '../../../generated/prisma/client';

export const ESTADOS_LECTURA_FORO = [
  'LEIDOS',
  'NO_LEIDOS',
  'CON_NOVEDADES',
  'SIN_NOVEDADES',
] as const;

export type EstadoLecturaForo =
  (typeof ESTADOS_LECTURA_FORO)[number];

export const ORDENES_LISTADO_FORO = [
  'CREACION_DESC',
  'CREACION_ASC',
  'ULTIMA_ACTIVIDAD_DESC',
  'ULTIMA_ACTIVIDAD_ASC',
  'RESPUESTAS_DESC',
  'RESPUESTAS_ASC',
  'TITULO_ASC',
  'TITULO_DESC',
] as const;

export type OrdenListadoForo =
  (typeof ORDENES_LISTADO_FORO)[number];

export class ListarForosQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @MaxLength(150)
  busqueda?: string;

  @IsOptional()
  @IsEnum(EstadoForo)
  estado?: EstadoForo;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  autorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  grupoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hitoId?: number;

  @IsOptional()
  @IsIn(ESTADOS_LECTURA_FORO)
  lectura?: EstadoLecturaForo;

  @IsOptional()
  @IsIn(ORDENES_LISTADO_FORO)
  orden?: OrdenListadoForo =
    'ULTIMA_ACTIVIDAD_DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number = 20;
}
