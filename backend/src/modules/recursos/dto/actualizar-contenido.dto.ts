import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ActualizarContenidoDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  urlExterna?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @IsOptional()
  @IsBoolean()
  disponibleParaQuiz?: boolean;
}
