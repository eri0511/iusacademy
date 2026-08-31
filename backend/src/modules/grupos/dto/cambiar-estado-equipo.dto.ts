import { IsEnum } from 'class-validator';

import { EstadoEquipoForo } from '../../../generated/prisma/client';

export class CambiarEstadoEquipoDto {
  @IsEnum(EstadoEquipoForo)
  estado!: EstadoEquipoForo;
}
