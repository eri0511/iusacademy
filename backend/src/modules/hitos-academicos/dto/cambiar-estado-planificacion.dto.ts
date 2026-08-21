import {
  IsBoolean,
} from 'class-validator';

export class CambiarEstadoPlanificacionDto {
  @IsBoolean({
    message:
      'El estado debe ser verdadero o falso',
  })
  estaActiva!: boolean;
}