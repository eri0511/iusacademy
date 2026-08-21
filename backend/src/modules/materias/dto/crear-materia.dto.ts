import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearMateriaDto {
  @IsString({
    message:
      'El nombre debe ser una cadena de texto',
  })
  @IsNotEmpty({
    message:
      'El nombre de la materia es obligatorio',
  })
  @MaxLength(120, {
    message:
      'El nombre no puede superar los 120 caracteres',
  })
  nombre!: string;

  @IsString({
    message:
      'El código debe ser una cadena de texto',
  })
  @IsNotEmpty({
    message:
      'El código de la materia es obligatorio',
  })
  @MaxLength(30, {
    message:
      'El código no puede superar los 30 caracteres',
  })
  codigo!: string;

  @IsInt({
    message:
      'El semestre debe ser un número entero',
  })
  @Min(1, {
    message:
      'El semestre debe ser mayor o igual a 1',
  })
  @Max(9, {
    message:
      'El semestre no puede ser mayor a 9',
  })
  semestre!: number;

  @IsOptional()
  @IsString({
    message:
      'La descripción debe ser una cadena de texto',
  })
  @MaxLength(500, {
    message:
      'La descripción no puede superar los 500 caracteres',
  })
  descripcion?: string;
}
