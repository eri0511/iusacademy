import { IsInt, Min } from 'class-validator';

export class ActualizarDiapositivaExposicionDto {
  @IsInt()
  @Min(1)
  diapositiva!: number;
}
