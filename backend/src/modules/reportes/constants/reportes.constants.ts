export const REPORTES_CONFIG = {
  zonaHoraria: 'America/La_Paz',
  locale: 'es-BO',
  nombreInstitucion: 'UNIFRANZ',
  nombreAplicacion: 'IusAcademy',
  autor: 'IusAcademy',
  colorPrimario: '#E86F2D',
  colorSecundario: '#1F2937',
  colorTexto: '#111827',
  colorTextoSuave: '#6B7280',
  colorBorde: '#D1D5DB',
  colorFondoAlterno: '#F9FAFB',
  formatoFecha: 'dd/MM/yyyy',
  formatoFechaHora: 'dd/MM/yyyy HH:mm',
  maximoFilasSinConfirmacion: 50_000,
} as const;

export const MIME_REPORTE = {
  PDF: 'application/pdf',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  CSV: 'text/csv; charset=utf-8',
} as const;

export const EXTENSION_REPORTE = {
  PDF: 'pdf',
  EXCEL: 'xlsx',
  CSV: 'csv',
} as const;

export const DELIMITADORES_CSV_PERMITIDOS = [',', ';', '\t', '|'] as const;

export const NOMBRE_HOJA_EXCEL_POR_DEFECTO = 'Reporte';

export const LIMITES_REPORTE = {
  titulo: 160,
  subtitulo: 240,
  descripcion: 1_000,
  nombreArchivo: 120,
  nombreHojaExcel: 31,
  etiquetaColumna: 100,
} as const;
