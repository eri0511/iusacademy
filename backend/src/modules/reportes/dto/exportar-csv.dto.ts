import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { DELIMITADORES_CSV_PERMITIDOS } from '../constants/reportes.constants';
import { ExportarReporteBaseDto } from './exportar-reporte-base.dto';

export class ExportarCsvDto extends ExportarReporteBaseDto {
  @IsOptional()
  @IsIn([...DELIMITADORES_CSV_PERMITIDOS])
  delimitador?: string;

  @IsOptional()
  @IsBoolean()
  incluirBom?: boolean;
}
