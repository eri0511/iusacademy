import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CsvService } from './csv/csv.service';
import { ExcelService } from './excel/excel.service';
import { PdfService } from './pdf/pdf.service';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { ReportesVerificacionService } from './reportes-verificacion.service';
import { ReportesVerificacionController } from './reportes-verificacion.controller';

@Module({
  imports: [AuthModule],
  controllers: [ReportesController, ReportesVerificacionController],
  providers: [
    PdfService,
    ExcelService,
    CsvService,
    ReportesService,
    ReportesVerificacionService,
  ],
  exports: [
    PdfService,
    ExcelService,
    CsvService,
    ReportesService,
    ReportesVerificacionService,
  ],
})
export class ReportesModule {}
