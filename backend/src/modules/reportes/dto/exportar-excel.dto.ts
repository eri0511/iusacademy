import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ExportarReporteBaseDto } from './exportar-reporte-base.dto';

export class ExportarExcelDto extends ExportarReporteBaseDto {
  @IsOptional()
  @IsString()
  @Length(1, 31)
  @Matches(/^[^\\/?*:[\]]+$/, {
    message: 'El nombre de la hoja contiene caracteres no permitidos',
  })
  nombreHoja?: string;

  @IsOptional()
  @IsBoolean()
  autoFiltro?: boolean;

  @IsOptional()
  @IsBoolean()
  congelarEncabezado?: boolean;
}
