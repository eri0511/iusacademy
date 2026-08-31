import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class RegistroPresencialEstudianteDto {
  @IsNumber()
  @Min(1)
  estudianteId!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  notaBase!: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observacion?: string;
}

export class RegistrarPresencialTareaDto {
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => RegistroPresencialEstudianteDto)
  @IsNotEmpty()
  estudiantes!: RegistroPresencialEstudianteDto[];
}
