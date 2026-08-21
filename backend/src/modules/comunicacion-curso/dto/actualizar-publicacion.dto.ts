import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  PrioridadPublicacion,
  TipoPublicacionCurso,
} from '../../../generated/prisma/client';

export class ActualizarPublicacionDto {
  @IsOptional()
  @IsEnum(
    TipoPublicacionCurso,
    {
      message:
        'El tipo de publicación seleccionado no es válido',
    },
  )
  tipo?:
    TipoPublicacionCurso;

  @IsOptional()
  @IsEnum(
    PrioridadPublicacion,
    {
      message:
        'La prioridad seleccionada no es válida',
    },
  )
  prioridad?:
    PrioridadPublicacion;

  @IsOptional()
  @IsString({
    message:
      'El título debe ser un texto',
  })
  @MinLength(
    3,
    {
      message:
        'El título debe tener al menos 3 caracteres',
    },
  )
  @MaxLength(
    150,
    {
      message:
        'El título no puede superar los 150 caracteres',
    },
  )
  titulo?:
    string;

  @IsOptional()
  @IsString({
    message:
      'El contenido debe ser un texto',
  })
  @MinLength(
    3,
    {
      message:
        'El contenido debe tener al menos 3 caracteres',
    },
  )
  @MaxLength(
    10000,
    {
      message:
        'El contenido no puede superar los 10000 caracteres',
    },
  )
  contenido?:
    string;

  @IsOptional()
  @IsString({
    message:
      'La referencia debe ser un texto',
  })
  @MaxLength(
    250,
    {
      message:
        'La referencia no puede superar los 250 caracteres',
    },
  )
  referencia?:
    string | null;

  @IsOptional()
  @IsString({
    message:
      'El lugar debe ser un texto',
  })
  @MaxLength(
    200,
    {
      message:
        'El lugar no puede superar los 200 caracteres',
    },
  )
  lugar?:
    string | null;

  @IsOptional()
  @IsString({
    message:
      'El enlace debe ser un texto',
  })
  @MaxLength(
    1000,
    {
      message:
        'El enlace no puede superar los 1000 caracteres',
    },
  )
  enlace?:
    string | null;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'La fecha de inicio del evento no es válida',
    },
  )
  fechaEventoInicio?:
    string | null;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'La fecha de finalización del evento no es válida',
    },
  )
  fechaEventoFin?:
    string | null;

  @IsOptional()
  @IsBoolean({
    message:
      'La configuración de comentarios debe ser verdadera o falsa',
  })
  comentariosHabilitados?:
    boolean;

  @IsOptional()
  @IsBoolean({
    message:
      'La notificación al publicar debe ser verdadera o falsa',
  })
  notificarAlPublicar?:
    boolean;

  @IsOptional()
  @IsBoolean({
    message:
      'El recordatorio de un día antes debe ser verdadero o falso',
  })
  recordarUnDiaAntes?:
    boolean;

  @IsOptional()
  @IsBoolean({
    message:
      'El recordatorio de una hora antes debe ser verdadero o falso',
  })
  recordarUnaHoraAntes?:
    boolean;

  @IsOptional()
  @IsBoolean({
    message:
      'La opción de agregar al calendario debe ser verdadera o falsa',
  })
  agregarAlCalendario?:
    boolean;
}

export class CambiarFijadoPublicacionDto {
  @IsBoolean({
    message:
      'El estado fijado debe ser verdadero o falso',
  })
  estaFijada!:
    boolean;
}

export class CambiarComentariosPublicacionDto {
  @IsBoolean({
    message:
      'La configuración de comentarios debe ser verdadera o falsa',
  })
  comentariosHabilitados!:
    boolean;
}