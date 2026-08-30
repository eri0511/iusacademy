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
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
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

export class CrearForoDto {
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  hitoId!:
    number;

  @ValidateIf(
    (
      objeto,
    ) =>
      objeto.esCalificable ===
      true,
  )
  @IsEnum(
    ComponenteEvaluacion,
  )
  componente?:
    ComponenteEvaluacion;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  titulo!:
    string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15000)
  contenido!:
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
    string;

  @IsOptional()
  @IsBoolean()
  esCalificable?:
    boolean;

  @IsEnum(
    ModalidadParticipacionForo,
  )
  modalidadParticipacion!:
    ModalidadParticipacionForo;

  @IsEnum(
    OrigenGrupoForo,
  )
  origenGrupo!:
    OrigenGrupoForo;

  @IsEnum(
    DinamicaGrupalForo,
  )
  dinamicaGrupal!:
    DinamicaGrupalForo;

  @ValidateIf(
    (
      objeto,
    ) =>
      objeto.modalidadParticipacion ===
        ModalidadParticipacionForo.GRUPAL &&
      objeto.origenGrupo ===
        OrigenGrupoForo.PLATAFORMA,
  )
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  conjuntoGrupoId?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(2)
  @Max(100)
  cantidadMinimaIntegrantes?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(2)
  @Max(100)
  cantidadMaximaIntegrantes?:
    number;

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
    number;

  /**
   * Penalización individual por incumplir
   * los comentarios mínimos exigidos.
   *
   * Regla de negocio:
   * - REPRESENTANTE_UNICO:
   *   no debe utilizar esta penalización.
   *
   * - PARTICIPACION_DISTRIBUIDA:
   *   se evalúan los comentarios del integrante
   *   dentro de la respuesta principal de su equipo.
   *
   * - COLABORACION_ABIERTA:
   *   se evalúan los comentarios del integrante
   *   en respuestas principales de otros equipos.
   *
   * El representante queda exento porque su obligación
   * consiste en publicar la respuesta principal.
   */
  @IsOptional()
  @IsBoolean()
  penalizarIncumplimientoComentarios?:
    boolean;

  @ValidateIf(
    (
      objeto,
    ) =>
      objeto.penalizarIncumplimientoComentarios ===
      true,
  )
  @IsEnum(
    TipoPenalizacionComentarios,
  )
  tipoPenalizacionComentarios?:
    TipoPenalizacionComentarios;

  @ValidateIf(
    (
      objeto,
    ) =>
      objeto.penalizarIncumplimientoComentarios ===
        true &&
      objeto.tipoPenalizacionComentarios !==
        TipoPenalizacionComentarios.NINGUNA,
  )
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
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(50000)
  palabrasMinimasRespuesta?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(50000)
  palabrasMaximasRespuesta?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(10000)
  palabrasMinimasComentario?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(10000)
  palabrasMaximasComentario?:
    number;

  @ValidateIf(
    (
      objeto,
    ) =>
      objeto.esCalificable ===
      true,
  )
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

  @ValidateIf(
    (
      objeto,
    ) =>
      objeto.esCalificable ===
      true,
  )
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
    number;

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
    number;

  @IsOptional()
  @IsBoolean()
  calificacionAutomaticaAlCumplir?:
    boolean;

  @IsDateString()
  fechaApertura!:
    string;

  @IsDateString()
  fechaLimite!:
    string;

  @IsDateString()
  fechaCierre!:
    string;

  /*
   * true:
   * el estudiante ve el foro desde que el docente lo publica,
   * aunque la participación permanezca bloqueada hasta fechaApertura.
   *
   * false:
   * el foro no aparece para el estudiante hasta fechaApertura.
   */
  @IsOptional()
  @IsBoolean()
  visibleAntesDeApertura?:
    boolean;

  @IsOptional()
  @IsBoolean()
  permitirRetrasos?:
    boolean;

  @ValidateIf(
    (
      objeto,
    ) =>
      objeto.permitirRetrasos ===
      true,
  )
  @IsDateString()
  fechaMaximaRetraso?:
    string;

  @IsOptional()
  @IsEnum(
    TipoDescuentoRetraso,
  )
  tipoDescuentoRetraso?:
    TipoDescuentoRetraso;

  @ValidateIf(
    (
      objeto,
    ) =>
      objeto.permitirRetrasos ===
        true &&
      objeto.tipoDescuentoRetraso !==
        TipoDescuentoRetraso.NINGUNO,
  )
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
    number;

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