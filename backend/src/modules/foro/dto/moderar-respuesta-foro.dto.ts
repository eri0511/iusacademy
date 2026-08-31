import { IsBoolean } from 'class-validator';

export class ModerarRespuestaForoDto {
  @IsBoolean()
  ocultar!: boolean;
}
