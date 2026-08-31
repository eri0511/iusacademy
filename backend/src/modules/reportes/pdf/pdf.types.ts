import type PDFKit from 'pdfkit';

import { FilaReporte } from '../tipos/reportes.types';
import { ColumnaReporte } from '../interfaces/columna-reporte.interface';

export interface ContextoPaginaPdf {
  documento: PDFKit.PDFDocument;
  numeroPagina: number;
  codigoUnico: string;
  textoPie: string;
}

export interface ColumnaPdfCalculada<TFila extends FilaReporte = FilaReporte> {
  definicion: ColumnaReporte<TFila>;
  x: number;
  ancho: number;
}

export interface MargenesPdf {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface EstadoTablaPdf {
  y: number;
  pagina: number;
}
