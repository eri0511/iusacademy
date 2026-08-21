import type {
  Alignment,
  CellValue,
} from 'exceljs';

import {
  ColumnaReporte,
} from '../interfaces/columna-reporte.interface';
import {
  AlineacionReporte,
  FilaReporte,
  TipoDatoReporte,
  ValorCeldaReporte,
} from '../tipos/reportes.types';
import {
  escaparFormulaHojaCalculo,
  normalizarTextoReporte,
} from '../helpers/normalizacion.helper';

export function obtenerAlineacionExcel(
  alineacion?: AlineacionReporte,
): Alignment['horizontal'] {
  switch (alineacion) {
    case AlineacionReporte.CENTRO:
      return 'center';
    case AlineacionReporte.DERECHA:
      return 'right';
    default:
      return 'left';
  }
}

export function obtenerFormatoNumeroExcel(tipo?: TipoDatoReporte): string | undefined {
  switch (tipo) {
    case TipoDatoReporte.NUMERO:
      return '#,##0';
    case TipoDatoReporte.DECIMAL:
      return '#,##0.00';
    case TipoDatoReporte.PORCENTAJE:
      return '0.00%';
    case TipoDatoReporte.MONEDA:
      return '[$Bs.-es-BO] #,##0.00';
    case TipoDatoReporte.FECHA:
      return 'dd/mm/yyyy';
    case TipoDatoReporte.FECHA_HORA:
      return 'dd/mm/yyyy hh:mm';
    default:
      return undefined;
  }
}

export function convertirValorExcel(
  valor: ValorCeldaReporte,
  tipo?: TipoDatoReporte,
): CellValue {
  if (valor === null || valor === undefined) {
    return '';
  }

  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? '' : valor;
  }

  if (typeof valor === 'string') {
    return escaparFormulaHojaCalculo(normalizarTextoReporte(valor));
  }

  if (tipo === TipoDatoReporte.PORCENTAJE && typeof valor === 'number') {
    return valor / 100;
  }

  return valor;
}

export function obtenerValorFilaExcel<TFila extends FilaReporte>(
  fila: TFila,
  columna: ColumnaReporte<TFila>,
  indice: number,
): CellValue {
  const valorOriginal = fila[columna.clave];
  const valor = columna.transformador
    ? columna.transformador(valorOriginal, fila, indice)
    : valorOriginal;

  return convertirValorExcel(valor, columna.tipo);
}

export function calcularAnchoExcel<TFila extends FilaReporte>(
  columna: ColumnaReporte<TFila>,
  filas: TFila[],
): number {
  if (columna.ancho !== undefined) {
    return Math.min(60, Math.max(8, columna.ancho));
  }

  const mayor = filas.slice(0, 200).reduce((actual, fila) => {
    const valor = fila[columna.clave];
    return Math.max(actual, normalizarTextoReporte(valor).length);
  }, columna.etiqueta.length);

  return Math.min(38, Math.max(10, mayor + 2));
}
