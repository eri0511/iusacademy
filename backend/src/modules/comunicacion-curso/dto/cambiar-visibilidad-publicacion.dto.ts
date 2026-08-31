import { IsBoolean } from 'class-validator';

export class CambiarVisibilidadPublicacionDto {
  @IsBoolean({
    message: 'La visibilidad para estudiantes debe ser verdadera o falsa',
  })
  visibleParaEstudiantes!: boolean;
}
