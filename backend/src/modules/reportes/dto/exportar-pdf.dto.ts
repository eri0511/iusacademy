import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  OrientacionReporte,
} from '../tipos/reportes.types';
import {
  ExportarReporteBaseDto,
} from './exportar-reporte-base.dto';

export class ExportarPdfDto extends ExportarReporteBaseDto {
  @IsOptional()
  @IsEnum(OrientacionReporte)
  orientacion?: OrientacionReporte;

  @IsOptional()
  @IsBoolean()
  incluirQr?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  contenidoQr?: string;
}
