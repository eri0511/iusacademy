import {
  Type,
} from 'class-transformer';

import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GuardarCalificacionDto {
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
  notaBase!:
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
  descuentoRetraso?:
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
  @Min(-100)
  @Max(100)
  ajusteIndividual?:
    number;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  retroalimentacion?:
    string;
}