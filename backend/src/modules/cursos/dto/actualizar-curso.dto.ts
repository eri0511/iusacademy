import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class ActualizarCursoDto {
  @IsOptional()
  @IsInt({
    message: 'La materia debe ser un identificador numérico',
  })
  @Min(1, {
    message: 'La materia seleccionada no es válida',
  })
  materiaId?: number;

  @IsOptional()
  @IsInt({
    message: 'El docente debe ser un identificador numérico',
  })
  @Min(1, {
    message: 'El docente seleccionado no es válido',
  })
  docenteId?: number;

  @IsOptional()
  @IsString({
    message: 'La gestión debe ser una cadena de texto',
  })
  @Matches(/^\d{4}-[12]$/, {
    message: 'La gestión debe tener el formato AAAA-1 o AAAA-2',
  })
  gestion?: string;

  @IsOptional()
  @IsString({
    message: 'El paralelo debe ser una cadena de texto',
  })
  @Matches(/^[A-Za-z]$/, {
    message: 'El paralelo debe ser una sola letra entre A y Z',
  })
  paralelo?: string;

  @IsOptional()
  @IsInt({
    message: 'El semestre debe ser un número entero',
  })
  @Min(1, {
    message: 'El semestre debe ser mayor o igual a 1',
  })
  @Max(9, {
    message: 'El semestre no puede ser mayor a 9',
  })
  semestre?: number;

  @IsOptional()
  @IsInt({
    message: 'El cupo máximo debe ser un número entero',
  })
  @Min(1, {
    message: 'El cupo máximo debe ser mayor a 0',
  })
  @Max(200, {
    message: 'El cupo máximo no puede superar los 200 estudiantes',
  })
  cupoMaximo?: number;
}
