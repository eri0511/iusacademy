import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { Rol, TratamientoUsuario } from '../../../generated/prisma/enums';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidoPaterno!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  apellidoMaterno?: string;

  @IsEmail()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9._%+-]+@unifranz\.edu\.bo$/, {
    message:
      'El correo debe pertenecer al dominio institucional @unifranz.edu.bo',
  })
  correo!: string;

  @IsEnum(Rol)
  rol!: Rol;

  @IsOptional()
  @IsEnum(TratamientoUsuario)
  tratamiento?: TratamientoUsuario;
}
