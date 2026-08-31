import { IsEnum } from 'class-validator';

import { EstadoEquipoAfinidadTarea } from '../../../generated/prisma/client';

export class CambiarEstadoEquipoTareaDto {
  @IsEnum(EstadoEquipoAfinidadTarea)
  estado!: EstadoEquipoAfinidadTarea;
}
