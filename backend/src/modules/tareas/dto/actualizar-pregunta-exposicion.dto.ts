import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { EstadoPreguntaExposicion } from '../../../generated/prisma/client';

export class ActualizarPreguntaExposicionDto {
  @IsOptional()
  @IsEnum(EstadoPreguntaExposicion)
  estado?: EstadoPreguntaExposicion;

  @IsOptional()
  @IsBoolean()
  destacada?: boolean;
}
