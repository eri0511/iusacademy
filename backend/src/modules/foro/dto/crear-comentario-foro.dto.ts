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

export class CrearComentarioForoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12000)
  contenido!:
    string;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  comentarioPadreId?:
    number;
}
