import {
  Type,
} from 'class-transformer';

import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import {
  DificultadQuiz,
  TipoPreguntaQuiz,
} from '../../../generated/prisma/client';

export class GenerarBorradorPreguntasQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  fragmentoIds!: number[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  cantidad!: number;

  @IsEnum(DificultadQuiz)
  dificultad!: DificultadQuiz;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(
    TipoPreguntaQuiz,
    {
      each:
        true,
    },
  )
  tipos?: TipoPreguntaQuiz[];
}
