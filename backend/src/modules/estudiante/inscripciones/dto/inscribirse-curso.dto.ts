import { Transform, type TransformFnParams } from 'class-transformer';

import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class InscribirseCursoDto {
  @Transform(({ value }: TransformFnParams) => {
    const valor: unknown = value;
    return typeof valor === 'string' ? valor.trim().toUpperCase() : valor;
  })
  @IsString({
    message: 'El código de inscripción debe ser un texto',
  })
  @IsNotEmpty({
    message: 'Debes ingresar el código de inscripción',
  })
  @Length(6, 6, {
    message: 'El código de inscripción debe tener 6 caracteres',
  })
  @Matches(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/, {
    message: 'El código de inscripción no tiene un formato válido',
  })
  codigo!: string;
}
