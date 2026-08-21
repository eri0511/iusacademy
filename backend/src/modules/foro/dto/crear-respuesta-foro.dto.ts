import {
  Type,
} from 'class-transformer';

import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearRespuestaForoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  titulo!:
    string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30000)
  contenido!:
    string;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  grupoCursoId?:
    number;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  equipoAfinidadId?:
    number;
}
