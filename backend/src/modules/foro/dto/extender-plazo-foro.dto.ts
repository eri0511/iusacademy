import { Type } from 'class-transformer';

import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

import { TipoDescuentoRetraso } from '../../../generated/prisma/client';

export class ExtenderPlazoForoDto {
  @IsDateString()
  fechaLimite!: string;

  @IsDateString()
  fechaCierre!: string;

  @IsOptional()
  @IsBoolean()
  permitirRetrasos?: boolean;

  @ValidateIf((objeto) => objeto.permitirRetrasos === true)
  @IsDateString()
  fechaMaximaRetraso?: string;

  @IsOptional()
  @IsEnum(TipoDescuentoRetraso)
  tipoDescuentoRetraso?: TipoDescuentoRetraso;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  @Max(100)
  valorDescuentoRetraso?: number;
}
