import {
  Type,
} from 'class-transformer';

import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const TIPOS_BUSQUEDA_DATASET_QUIZ = [
  'AUTO',
  'ARTICULO',
  'TITULO',
  'CAPITULO',
  'SECCION',
  'PALABRA_CLAVE',
] as const;

export type TipoBusquedaDatasetQuiz =
  typeof TIPOS_BUSQUEDA_DATASET_QUIZ[number];

export class BuscarDatasetQuizDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  q?: string;

  @IsOptional()
  @IsIn(
    TIPOS_BUSQUEDA_DATASET_QUIZ,
  )
  tipo?: TipoBusquedaDatasetQuiz;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
