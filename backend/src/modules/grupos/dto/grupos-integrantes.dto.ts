import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CrearGrupoCursoDto {
  @IsString({
    message:
      'El nombre del grupo debe ser un texto',
  })
  @MinLength(
    1,
    {
      message:
        'El nombre del grupo es obligatorio',
    },
  )
  @MaxLength(
    80,
    {
      message:
        'El nombre del grupo no puede superar los 80 caracteres',
    },
  )
  nombre!:
    string;

  @IsOptional()
  @IsString({
    message:
      'La descripción debe ser un texto',
  })
  @MaxLength(
    300,
    {
      message:
        'La descripción no puede superar los 300 caracteres',
    },
  )
  descripcion?:
    string;

  @IsOptional()
  @IsString({
    message:
      'El color debe ser un texto',
  })
  @MaxLength(
    30,
    {
      message:
        'El color no puede superar los 30 caracteres',
    },
  )
  color?:
    string;
}

export class ActualizarGrupoCursoDto {
  @IsOptional()
  @IsString({
    message:
      'El nombre del grupo debe ser un texto',
  })
  @MinLength(
    1,
    {
      message:
        'El nombre del grupo no puede estar vacío',
    },
  )
  @MaxLength(
    80,
    {
      message:
        'El nombre del grupo no puede superar los 80 caracteres',
    },
  )
  nombre?:
    string;

  @IsOptional()
  @IsString({
    message:
      'La descripción debe ser un texto',
  })
  @MaxLength(
    300,
    {
      message:
        'La descripción no puede superar los 300 caracteres',
    },
  )
  descripcion?:
    string | null;

  @IsOptional()
  @IsString({
    message:
      'El color debe ser un texto',
  })
  @MaxLength(
    30,
    {
      message:
        'El color no puede superar los 30 caracteres',
    },
  )
  color?:
    string | null;
}

export class AsignarEstudiantesGrupoDto {
  @IsArray({
    message:
      'Los estudiantes deben enviarse como una lista',
  })
  @ArrayNotEmpty({
    message:
      'Debes seleccionar al menos un estudiante',
  })
  @IsInt({
    each:
      true,
    message:
      'Cada estudiante debe tener un identificador válido',
  })
  estudianteIds!:
    number[];
}

export class MoverEstudianteGrupoDto {
  @IsInt({
    message:
      'El estudiante debe tener un identificador válido',
  })
  @Min(
    1,
    {
      message:
        'El identificador del estudiante no es válido',
    },
  )
  estudianteId!:
    number;

  @IsInt({
    message:
      'El grupo de destino debe tener un identificador válido',
  })
  @Min(
    1,
    {
      message:
        'El identificador del grupo de destino no es válido',
    },
  )
  grupoDestinoId!:
    number;
}

export class CambiarRepresentanteGrupoDto {
  @IsInt({
    message:
      'El estudiante debe tener un identificador válido',
  })
  @Min(
    1,
    {
      message:
        'El identificador del estudiante no es válido',
    },
  )
  estudianteId!:
    number;

  @IsBoolean({
    message:
      'El estado de representante debe ser verdadero o falso',
  })
  esRepresentante!:
    boolean;
}
