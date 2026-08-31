import { IsBoolean } from 'class-validator';

export class CambiarEstadoUsuarioDto {
  @IsBoolean({
    message: 'El campo estaActivo debe ser verdadero o falso',
  })
  estaActivo!: boolean;
}
