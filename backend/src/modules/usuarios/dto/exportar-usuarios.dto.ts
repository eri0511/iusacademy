import {
  IsEnum,
  IsOptional,
} from 'class-validator';

import {
  Rol,
} from '../../../generated/prisma/client';

import {
  FormatoReporte,
} from '../../reportes';

export enum EstadoUsuarioReporte {
  TODOS = 'TODOS',
  ACTIVOS = 'ACTIVOS',
  INACTIVOS = 'INACTIVOS',
}

export enum EstadoActivacionReporte {
  TODOS = 'TODOS',
  ACTIVADOS = 'ACTIVADOS',
  PENDIENTES = 'PENDIENTES',
}

export class FormatoUsuariosReporteDto {
  @IsEnum(FormatoReporte, {
    message: 'El formato debe ser PDF, EXCEL o CSV',
  })
  formato!: FormatoReporte;
}

export class ExportarUsuariosDto {
  @IsOptional()
  @IsEnum(Rol, {
    message: 'El rol seleccionado no es válido',
  })
  rol?: Rol;

  @IsOptional()
  @IsEnum(EstadoUsuarioReporte, {
    message: 'El estado debe ser TODOS, ACTIVOS o INACTIVOS',
  })
  estado: EstadoUsuarioReporte = EstadoUsuarioReporte.TODOS;

  @IsOptional()
  @IsEnum(EstadoActivacionReporte, {
    message: 'La activación debe ser TODOS, ACTIVADOS o PENDIENTES',
  })
  activacion: EstadoActivacionReporte = EstadoActivacionReporte.TODOS;
}
