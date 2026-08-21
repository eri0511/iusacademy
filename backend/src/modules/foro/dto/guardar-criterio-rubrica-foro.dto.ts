import {
  Type,
} from 'class-transformer';

import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class GuardarCriterioRubricaForoDto {
  @Type(
    () =>
      Number,
  )
  @IsNumber({
    maxDecimalPlaces:
      2,
  })
  @Min(0)
  puntajeObtenido!:
    number;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  observacion?:
    string;
}
