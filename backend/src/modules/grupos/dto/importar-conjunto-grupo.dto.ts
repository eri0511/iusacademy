import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ImportarConjuntoGrupoDto {
  @IsInt({
    message:
      'El conjunto de origen debe tener un identificador válido',
  })
  @Min(
    1,
    {
      message:
        'El identificador del conjunto de origen no es válido',
    },
  )
  conjuntoOrigenId!:
    number;

  @IsString({
    message:
      'El nombre del nuevo conjunto debe ser un texto',
  })
  @MinLength(
    3,
    {
      message:
        'El nombre debe tener al menos 3 caracteres',
    },
  )
  @MaxLength(
    120,
    {
      message:
        'El nombre no puede superar los 120 caracteres',
    },
  )
  nombre!:
    string;

  @IsOptional()
  @IsInt({
    message:
      'El hito debe tener un identificador válido',
  })
  @Min(
    1,
    {
      message:
        'El identificador del hito no es válido',
    },
  )
  hitoId?:
    number;

  @IsOptional()
  @IsBoolean({
    message:
      'La opción de copiar integrantes debe ser verdadera o falsa',
  })
  copiarIntegrantes?:
    boolean;
}
