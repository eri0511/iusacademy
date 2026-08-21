import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  TipoComponenteTarea,
} from '../../../generated/prisma/client';

export class CrearComponenteTareaDto {
  @IsEnum(
    TipoComponenteTarea,
  )
  tipo!:
    TipoComponenteTarea;

  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  titulo!:
    string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  descripcion?:
    string;

  @IsOptional()
  @IsBoolean()
  obligatorio?:
    boolean;

  @IsOptional()
  @IsObject()
  configuracion?:
    Record<string, unknown>;
}
