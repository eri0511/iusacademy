import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ActivarCuentaDto {
  @IsString({
    message: 'El token de activación debe ser una cadena de texto',
  })
  @IsNotEmpty({
    message: 'El token de activación es obligatorio',
  })
  token!: string;

  @IsString({
    message: 'La contraseña debe ser una cadena de texto',
  })
  @IsNotEmpty({
    message: 'La contraseña es obligatoria',
  })
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @Matches(/[A-Z]/, {
    message: 'La contraseña debe contener al menos una letra mayúscula',
  })
  @Matches(/[a-z]/, {
    message: 'La contraseña debe contener al menos una letra minúscula',
  })
  @Matches(/\d/, {
    message: 'La contraseña debe contener al menos un número',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'La contraseña debe contener al menos un carácter especial',
  })
  password!: string;

  @IsString({
    message: 'La confirmación de contraseña debe ser una cadena de texto',
  })
  @IsNotEmpty({
    message: 'La confirmación de contraseña es obligatoria',
  })
  confirmarPassword!: string;
}
