import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class ExportarReporteBaseDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  nombreArchivo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  subtitulo?: string;

  @IsOptional()
  @IsObject()
  filtros?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  incluirFiltros?: boolean;
}
