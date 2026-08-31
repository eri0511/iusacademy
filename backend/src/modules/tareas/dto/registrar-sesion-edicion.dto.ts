import { IsInt, Max, Min } from 'class-validator';

export class RegistrarSesionEdicionDto {
  @IsInt()
  @Min(0)
  @Max(86400)
  segundosActivos: number;

  @IsInt()
  @Min(0)
  @Max(1000)
  cantidadPegados: number;
}
