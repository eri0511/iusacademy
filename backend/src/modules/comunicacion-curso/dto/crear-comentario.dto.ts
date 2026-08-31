import { Transform } from 'class-transformer';

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CrearComentarioDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'El comentario debe ser un texto',
  })
  @IsNotEmpty({
    message: 'El comentario no puede estar vacío',
  })
  @MinLength(2, {
    message: 'El comentario debe tener al menos 2 caracteres',
  })
  @MaxLength(3000, {
    message: 'El comentario no puede superar los 3000 caracteres',
  })
  contenido!: string;
}
