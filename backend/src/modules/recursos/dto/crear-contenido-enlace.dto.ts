import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearContenidoEnlaceDto {
  @IsString()
  @MaxLength(180)
  titulo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @IsString()
  @MaxLength(2048)
  urlExterna!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
