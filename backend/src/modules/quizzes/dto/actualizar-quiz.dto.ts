import { Type } from 'class-transformer';

import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  ComponenteEvaluacion,
  CriterioRankingQuiz,
  DificultadQuiz,
  ModalidadQuiz,
  ModoTiempoQuiz,
  RitmoQuiz,
} from '../../../generated/prisma/client';

export class ActualizarQuizDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  descripcion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hitoId?: number;

  @IsOptional()
  @IsEnum(DificultadQuiz)
  dificultad?: DificultadQuiz;

  @IsOptional()
  @IsBoolean()
  esCalificable?: boolean;

  @IsOptional()
  @IsEnum(ComponenteEvaluacion)
  componente?: ComponenteEvaluacion;

  @IsOptional()
  @IsEnum(ModalidadQuiz)
  modalidad?: ModalidadQuiz;

  @IsOptional()
  @IsEnum(RitmoQuiz)
  ritmo?: RitmoQuiz;

  @IsOptional()
  @IsEnum(ModoTiempoQuiz)
  modoTiempo?: ModoTiempoQuiz;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(120)
  tiempoPreguntaSegundos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(120)
  tiempoFacilSegundos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(120)
  tiempoMedioSegundos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(180)
  tiempoDificilSegundos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  cantidadPreguntas?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  puntajeMaximo?: number;

  @IsOptional()
  @IsBoolean()
  usarRanking?: boolean;

  @IsOptional()
  @IsEnum(CriterioRankingQuiz)
  criterioRanking?: CriterioRankingQuiz;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  descuentoPorPuesto?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  puntajeMinimoRanking?: number;

  @IsOptional()
  @IsBoolean()
  usarPuntuacionVelocidad?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  descuentoVelocidadPorPosicion?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  puntajeMinimoVelocidad?: number;

  @IsOptional()
  @IsBoolean()
  permiteInicioConAusentes?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(10)
  cuentaRegresivaSegundos?: number;

  @IsOptional()
  @IsDateString()
  aperturaProgramada?: string;

  @IsOptional()
  @IsDateString()
  cierreProgramado?: string;
}
