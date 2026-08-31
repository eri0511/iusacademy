import { IsBoolean } from 'class-validator';

export class BloquearRespuestaForoDto {
  @IsBoolean()
  bloquear!: boolean;
}
