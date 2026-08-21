import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  CsvService,
} from './csv/csv.service';
import {
  ExcelService,
} from './excel/excel.service';
import type {
  ArchivoReporteGenerado,
  DefinicionReporte,
} from './interfaces/reporte.interface';
import {
  PdfService,
} from './pdf/pdf.service';
import {
  FilaReporte,
  FormatoReporte,
} from './tipos/reportes.types';

@Injectable()
export class ReportesService {
  constructor(
    private readonly pdfService: PdfService,
    private readonly excelService: ExcelService,
    private readonly csvService: CsvService,
  ) {}

  async generar<TFila extends FilaReporte>(
    formato: FormatoReporte,
    definicion: DefinicionReporte<TFila>,
    nombreArchivo?: string,
  ): Promise<ArchivoReporteGenerado> {
    switch (formato) {
      case FormatoReporte.PDF:
        return this.pdfService.generar(definicion, nombreArchivo);

      case FormatoReporte.EXCEL:
        return this.excelService.generar(definicion, nombreArchivo);

      case FormatoReporte.CSV:
        return this.csvService.generar(definicion, nombreArchivo);

      default:
        throw new BadRequestException(
          'El formato solicitado no está disponible. Use PDF, EXCEL o CSV.',
        );
    }
  }

  async generarPdf<TFila extends FilaReporte>(
    definicion: DefinicionReporte<TFila>,
    nombreArchivo?: string,
  ): Promise<ArchivoReporteGenerado> {
    return this.generar(FormatoReporte.PDF, definicion, nombreArchivo);
  }

  async generarExcel<TFila extends FilaReporte>(
    definicion: DefinicionReporte<TFila>,
    nombreArchivo?: string,
  ): Promise<ArchivoReporteGenerado> {
    return this.generar(FormatoReporte.EXCEL, definicion, nombreArchivo);
  }

  async generarCsv<TFila extends FilaReporte>(
    definicion: DefinicionReporte<TFila>,
    nombreArchivo?: string,
  ): Promise<ArchivoReporteGenerado> {
    return this.generar(FormatoReporte.CSV, definicion, nombreArchivo);
  }
}
