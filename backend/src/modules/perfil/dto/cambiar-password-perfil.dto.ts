import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CambiarPasswordPerfilDto {
  @IsString({
    message:
      'La contraseña actual es obligatoria',
  })
  @MinLength(
    1,
    {
      message:
        'La contraseña actual es obligatoria',
    },
  )
  passwordActual!: string;

  @IsString({
    message:
      'La nueva contraseña es obligatoria',
  })
  @MinLength(
    8,
    {
      message:
        'La nueva contraseña debe tener al menos 8 caracteres',
    },
  )
  @MaxLength(
    72,
    {
      message:
        'La nueva contraseña no puede superar los 72 caracteres',
    },
  )
  @Matches(
    /[A-Z]/,
    {
      message:
        'La nueva contraseña debe contener al menos una mayúscula',
    },
  )
  @Matches(
    /[a-z]/,
    {
      message:
        'La nueva contraseña debe contener al menos una minúscula',
    },
  )
  @Matches(
    /\d/,
    {
      message:
        'La nueva contraseña debe contener al menos un número',
    },
  )
  @Matches(
    /[^A-Za-z0-9]/,
    {
      message:
        'La nueva contraseña debe contener al menos un carácter especial',
    },
  )
  nuevaPassword!: string;

  @IsString({
    message:
      'La confirmación de contraseña es obligatoria',
  })
  @MinLength(
    1,
    {
      message:
        'La confirmación de contraseña es obligatoria',
    },
  )
  confirmarPassword!: string;
}