import {
  IsEnum,
} from 'class-validator';

import {
  EstadoMateria,
} from '../../../generated/prisma/client';

export class CambiarEstadoMateriaDto {
  @IsEnum(
    EstadoMateria,
    {
      message:
        'El estado debe ser ACTIVA o INACTIVA',
    },
  )
  estado!: EstadoMateria;
}