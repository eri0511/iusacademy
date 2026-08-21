import {
  IsEnum,
} from 'class-validator';

import {
  EstadoForo,
} from '../../../generated/prisma/client';

export class CambiarEstadoForoDto {
  @IsEnum(
    EstadoForo,
  )
  estado!:
    EstadoForo;
}
