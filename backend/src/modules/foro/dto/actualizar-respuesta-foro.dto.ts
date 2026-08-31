import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarRespuestaForoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30000)
  contenido?: string;
}
