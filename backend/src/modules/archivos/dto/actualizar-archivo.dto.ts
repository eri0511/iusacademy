import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarArchivoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  permiteDescarga?: boolean;
}
