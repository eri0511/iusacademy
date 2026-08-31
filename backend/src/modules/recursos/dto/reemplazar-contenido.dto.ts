import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReemplazarContenidoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivoActualizacion?: string;

  @IsOptional()
  @IsDateString()
  fechaDocumento?: string;
}
