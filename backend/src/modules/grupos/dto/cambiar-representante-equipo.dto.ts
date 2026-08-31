import { IsInt, Min } from 'class-validator';

export class CambiarRepresentanteEquipoDto {
  @IsInt()
  @Min(1)
  estudianteId!: number;
}
