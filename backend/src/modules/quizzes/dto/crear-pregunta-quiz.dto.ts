import {
  Type,
} from 'class-transformer';

import {
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  DificultadQuiz,
  OrigenPreguntaQuiz,
  TipoPreguntaQuiz,
} from '../../../generated/prisma/client';

export class CrearOpcionPreguntaQuizDto {
  @IsString()
  @MaxLength(1000)
  texto!: string;

  @IsBoolean()
  esCorrecta!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  orden!: number;
}

export class CrearPreguntaQuizDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fragmentoId?: number;

  @IsString()
  @MaxLength(4000)
  enunciado!: string;

  @IsEnum(TipoPreguntaQuiz)
  tipo!: TipoPreguntaQuiz;

  @IsEnum(DificultadQuiz)
  dificultad!: DificultadQuiz;

  @IsEnum(OrigenPreguntaQuiz)
  origen!: OrigenPreguntaQuiz;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  explicacion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(180)
  tiempoSegundos?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  puntaje!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  orden!: number;

  @ValidateNested({
    each:
      true,
  })
  @Type(
    () =>
      CrearOpcionPreguntaQuizDto,
  )
  @ArrayMinSize(2)
  opciones!: CrearOpcionPreguntaQuizDto[];
}
