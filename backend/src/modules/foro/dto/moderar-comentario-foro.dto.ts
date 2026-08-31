import { IsBoolean } from 'class-validator';

export class ModerarComentarioForoDto {
  @IsBoolean()
  ocultar!: boolean;
}
