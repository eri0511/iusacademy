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

export class GuardarCalificacionForoDto {
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

  /**
   * Solo se utiliza cuando el foro tiene modalidad
   * GRUPAL_E_INDIVIDUAL. Se mantiene separado en el
   * contrato HTTP aunque internamente se reutiliza el campo
   * ajusteIndividual para evitar una migración de Prisma.
   */
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
  notaIndividual?:
    number;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  retroalimentacion?:
    string;
}
