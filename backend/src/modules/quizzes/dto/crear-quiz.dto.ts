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

export class CrearQuizDto {
  @IsString()
  @MaxLength(180)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  descripcion?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  hitoId!: number;

  @IsEnum(DificultadQuiz)
  dificultad!: DificultadQuiz;

  @IsBoolean()
  esCalificable!: boolean;

  @IsOptional()
  @IsEnum(ComponenteEvaluacion)
  componente?: ComponenteEvaluacion;

  @IsEnum(ModalidadQuiz)
  modalidad!: ModalidadQuiz;

  @IsEnum(RitmoQuiz)
  ritmo!: RitmoQuiz;

  @IsEnum(ModoTiempoQuiz)
  modoTiempo!: ModoTiempoQuiz;

  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(120)
  tiempoPreguntaSegundos!: number;

  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(120)
  tiempoFacilSegundos!: number;

  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(120)
  tiempoMedioSegundos!: number;

  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(180)
  tiempoDificilSegundos!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  cantidadPreguntas!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  puntajeMaximo!: number;

  @IsBoolean()
  usarRanking!: boolean;

  @IsEnum(CriterioRankingQuiz)
  criterioRanking!: CriterioRankingQuiz;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  descuentoPorPuesto!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  puntajeMinimoRanking!: number;

  @IsBoolean()
  usarPuntuacionVelocidad!: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  descuentoVelocidadPorPosicion!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  puntajeMinimoVelocidad!: number;

  @IsBoolean()
  permiteInicioConAusentes!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(10)
  cuentaRegresivaSegundos!: number;

  @IsOptional()
  @IsDateString()
  aperturaProgramada?: string;

  @IsOptional()
  @IsDateString()
  cierreProgramado?: string;
}
