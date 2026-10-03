import { IsString, MaxLength, MinLength } from 'class-validator';

export class CrearPreguntaExposicionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  contenido!: string;
}
