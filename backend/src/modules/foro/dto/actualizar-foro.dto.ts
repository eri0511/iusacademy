import {
  Type,
} from 'class-transformer';

import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  ComponenteEvaluacion,
  DinamicaGrupalForo,
  ModalidadNotaForo,
  ModalidadParticipacionForo,
  OrigenGrupoForo,
  TipoDescuentoRetraso,
  TipoEvaluacionForo,
  TipoPenalizacionComentarios,
  VisibilidadRespuestasForo,
} from '../../../generated/prisma/client';

export class ActualizarForoDto {
  @IsOptional()
  @IsEnum(
    ComponenteEvaluacion,
  )
  componente?:
    ComponenteEvaluacion;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  titulo?:
    string;

  @IsOptional()
  @IsString()
  @MaxLength(15000)
  contenido?:
    string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  instrucciones?:
    string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  objetivo?:
    string | null;

  @IsOptional()
  @IsBoolean()
  esCalificable?:
    boolean;

  @IsOptional()
  @IsEnum(
    ModalidadParticipacionForo,
  )
  modalidadParticipacion?:
    ModalidadParticipacionForo;

  @IsOptional()
  @IsEnum(
    OrigenGrupoForo,
  )
  origenGrupo?:
    OrigenGrupoForo;

  @IsOptional()
  @IsEnum(
    DinamicaGrupalForo,
  )
  dinamicaGrupal?:
    DinamicaGrupalForo;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  conjuntoGrupoId?:
    number | null;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(2)
  @Max(100)
  cantidadMinimaIntegrantes?:
    number | null;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(2)
  @Max(100)
  cantidadMaximaIntegrantes?:
    number | null;

  @IsOptional()
  @IsBoolean()
  requiereAprobacionEquipos?:
    boolean;

  @IsOptional()
  @IsBoolean()
  requiereRepresentante?:
    boolean;

  @IsOptional()
  @IsBoolean()
  bloquearEquipoAlResponder?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirComentarios?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirEditarRespuestas?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirEliminarRespuestas?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirEditarComentarios?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirEliminarComentarios?:
    boolean;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(0)
  @Max(100)
  minimoComentariosPorEstudiante?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(0)
  @Max(100)
  maximoComentariosPorEstudiante?:
    number | null;

  @IsOptional()
  @IsBoolean()
  penalizarIncumplimientoComentarios?:
    boolean;

  @IsOptional()
  @IsEnum(
    TipoPenalizacionComentarios,
  )
  tipoPenalizacionComentarios?:
    TipoPenalizacionComentarios;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsNumber({
    maxDecimalPlaces:
      2,
  })
  @Min(0.01)
  @Max(100)
  valorPenalizacionComentarios?:
    number | null;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(50000)
  palabrasMinimasRespuesta?:
    number | null;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(50000)
  palabrasMaximasRespuesta?:
    number | null;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(10000)
  palabrasMinimasComentario?:
    number | null;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(10000)
  palabrasMaximasComentario?:
    number | null;

  @IsOptional()
  @IsIn(
    [
      TipoEvaluacionForo.MANUAL,
      TipoEvaluacionForo.AUTOMATICA,
    ],
    {
      message:
        'La evaluación por rúbrica estará disponible en una próxima versión. Selecciona MANUAL o AUTOMATICA.',
    },
  )
  tipoEvaluacion?:
    TipoEvaluacionForo;

  @IsOptional()
  @IsEnum(
    ModalidadNotaForo,
  )
  modalidadNota?:
    ModalidadNotaForo;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsNumber({
    maxDecimalPlaces:
      2,
  })
  @Min(0)
  @Max(100)
  porcentajeNotaGrupal?:
    number | null;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsNumber({
    maxDecimalPlaces:
      2,
  })
  @Min(0)
  @Max(100)
  porcentajeNotaIndividual?:
    number | null;

  @IsOptional()
  @IsBoolean()
  calificacionAutomaticaAlCumplir?:
    boolean;

  @IsOptional()
  @IsDateString()
  fechaApertura?:
    string;

  @IsOptional()
  @IsDateString()
  fechaLimite?:
    string;

  @IsOptional()
  @IsDateString()
  fechaCierre?:
    string;

  @IsOptional()
  @IsBoolean()
  visibleAntesDeApertura?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirRetrasos?:
    boolean;

  @IsOptional()
  @IsDateString()
  fechaMaximaRetraso?:
    string | null;

  @IsOptional()
  @IsEnum(
    TipoDescuentoRetraso,
  )
  tipoDescuentoRetraso?:
    TipoDescuentoRetraso;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsNumber({
    maxDecimalPlaces:
      2,
  })
  @Min(0)
  @Max(100)
  valorDescuentoRetraso?:
    number | null;

  @IsOptional()
  @IsEnum(
    VisibilidadRespuestasForo,
  )
  visibilidadRespuestas?:
    VisibilidadRespuestasForo;

  @IsOptional()
  @IsBoolean()
  permitirAdjuntosTema?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirAdjuntosRespuesta?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirAdjuntosComentario?:
    boolean;

  @IsOptional()
  @IsBoolean()
  exigirAdjuntoRespuesta?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirDescargaAdjuntos?:
    boolean;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(0)
  @Max(20)
  maximoArchivosTema?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(0)
  @Max(20)
  maximoArchivosRespuesta?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(0)
  @Max(10)
  maximoArchivosComentario?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(100)
  tamanioMaximoArchivoMb?:
    number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(12)
  @IsString({
    each:
      true,
  })
  extensionesPermitidas?:
    string[];

  @IsOptional()
  @IsBoolean()
  participaEnPromedio?:
    boolean;
} 