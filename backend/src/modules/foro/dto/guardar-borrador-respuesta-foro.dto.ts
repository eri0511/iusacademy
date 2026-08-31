import { Type } from 'class-transformer';

import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class GuardarBorradorRespuestaForoDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30000)
  contenido?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  grupoCursoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  equipoAfinidadId?: number;
}
