import type { Alignment, Borders, Fill, Font } from 'exceljs';

export const EXCEL_COLORES = {
  acento: 'FFF18B4B',
  acentoOscuro: 'FFC46A2C',
  crema: 'FFFFF8EF',
  superficie: 'FFFFFDF9',
  superficieAlterna: 'FFFFFAF4',
  texto: 'FF0F172A',
  textoSecundario: 'FF475569',
  borde: 'FFF1D7C5',
  blanco: 'FFFFFFFF',
  verde: 'FF15803D',
  verdeFondo: 'FFECFDF3',
  amarillo: 'FFB45309',
  amarilloFondo: 'FFFFF7DF',
  rojo: 'FFDC2626',
  rojoFondo: 'FFFEF2F2',
  azul: 'FF2563EB',
  azulFondo: 'FFEFF6FF',
  morado: 'FF7C3AED',
  moradoFondo: 'FFF5F3FF',
} as const;

export const EXCEL_FUENTE_TITULO: Partial<Font> = {
  name: 'Aptos Display',
  size: 20,
  bold: true,
  color: { argb: EXCEL_COLORES.texto },
};

export const EXCEL_FUENTE_ENCABEZADO: Partial<Font> = {
  name: 'Aptos',
  size: 10,
  bold: true,
  color: { argb: EXCEL_COLORES.blanco },
};

export const EXCEL_RELLENO_ENCABEZADO: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: EXCEL_COLORES.acento },
};

export const EXCEL_BORDE_CELDA: Partial<Borders> = {
  top: { style: 'thin', color: { argb: EXCEL_COLORES.borde } },
  left: { style: 'thin', color: { argb: EXCEL_COLORES.borde } },
  bottom: { style: 'thin', color: { argb: EXCEL_COLORES.borde } },
  right: { style: 'thin', color: { argb: EXCEL_COLORES.borde } },
};

export const EXCEL_ALINEACION_CELDA: Partial<Alignment> = {
  vertical: 'middle',
  wrapText: true,
};
