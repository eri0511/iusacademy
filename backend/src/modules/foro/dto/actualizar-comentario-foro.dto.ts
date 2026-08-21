import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class ActualizarComentarioForoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12000)
  contenido!:
    string;
}
