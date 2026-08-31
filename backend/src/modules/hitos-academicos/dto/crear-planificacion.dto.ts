import { Transform, Type, type TransformFnParams } from 'class-transformer';

import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class FechaHitoDto {
  @Type(() => Number)
  @IsInt({
    message: 'El número del hito debe ser un entero',
  })
  @Min(1, {
    message: 'El número del hito debe estar entre 1 y 5',
  })
  @Max(5, {
    message: 'El número del hito debe estar entre 1 y 5',
  })
  numero!: number;

  @IsDateString(
    {},
    {
      message: 'La fecha de inicio debe tener un formato válido',
    },
  )
  fechaInicio!: string;

  @IsDateString(
    {},
    {
      message: 'La fecha de finalización debe tener un formato válido',
    },
  )
  fechaFin!: string;
}

export class CrearPlanificacionDto {
  @Transform(({ value }: TransformFnParams) => {
    const valor: unknown = value;
    return typeof valor === 'string' ? valor.trim().toUpperCase() : valor;
  })
  @IsString({
    message: 'La gestión debe ser un texto',
  })
  @IsNotEmpty({
    message: 'La gestión académica es obligatoria',
  })
  @Matches(/^\d{4}-[12]$/, {
    message: 'La gestión debe tener el formato AAAA-1 o AAAA-2',
  })
  gestion!: string;

  @IsOptional()
  @Transform(({ value }: TransformFnParams) => {
    const valor: unknown = value;
    return typeof valor === 'string' ? valor.trim() : valor;
  })
  @IsString({
    message: 'La descripción debe ser un texto',
  })
  @MaxLength(500, {
    message: 'La descripción no puede superar los 500 caracteres',
  })
  descripcion?: string;

  @IsArray({
    message: 'Los hitos deben enviarse en una lista',
  })
  @ArrayMinSize(5, {
    message: 'Debes registrar exactamente los cinco hitos',
  })
  @ArrayMaxSize(5, {
    message: 'Debes registrar exactamente los cinco hitos',
  })
  @ValidateNested({
    each: true,
  })
  @Type(() => FechaHitoDto)
  hitos!: FechaHitoDto[];
}
