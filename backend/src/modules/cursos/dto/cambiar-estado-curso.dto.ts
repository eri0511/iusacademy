import {
  IsEnum,
} from 'class-validator';

import {
  EstadoCurso,
} from '../../../generated/prisma/client';

export class CambiarEstadoCursoDto {
  @IsEnum(
    EstadoCurso,
    {
      message:
        'El estado debe ser ACTIVO, INACTIVO o FINALIZADO',
    },
  )
  estado!: EstadoCurso;
}