import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ActualizarConjuntoGrupoDto {
  @IsOptional()
  @IsString({
    message: 'El nombre del conjunto debe ser un texto',
  })
  @MinLength(3, {
    message: 'El nombre del conjunto debe tener al menos 3 caracteres',
  })
  @MaxLength(120, {
    message: 'El nombre del conjunto no puede superar los 120 caracteres',
  })
  nombre?: string;

  @IsOptional()
  @IsString({
    message: 'La descripción debe ser un texto',
  })
  @MaxLength(500, {
    message: 'La descripción no puede superar los 500 caracteres',
  })
  descripcion?: string | null;

  @IsOptional()
  @IsBoolean({
    message: 'La configuración de representante debe ser verdadera o falsa',
  })
  requiereRepresentante?: boolean;
}

export class CambiarBloqueoConjuntoDto {
  @IsBoolean({
    message: 'El estado de bloqueo debe ser verdadero o falso',
  })
  estaBloqueado!: boolean;
}
