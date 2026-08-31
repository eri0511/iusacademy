import { TipoDatoReporte, ValorCeldaReporte } from '../tipos/reportes.types';
import {
  formatearFechaHoraReporte,
  formatearFechaReporte,
} from './fechas.helper';
import {
  formatearMonedaReporte,
  formatearNumeroReporte,
  formatearPorcentajeReporte,
} from './numeros.helper';

export function normalizarTextoReporte(valor: unknown): string {
  if (valor === null || valor === undefined) {
    return '';
  }

  return String(valor)
    .normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .trim();
}

export function normalizarNombreHojaExcel(nombre: string): string {
  const nombreLimpio = normalizarTextoReporte(nombre)
    .replace(/[\\/?*:[\]]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 31)
    .trim();

  return nombreLimpio || 'Reporte';
}

export function normalizarValorCelda(
  valor: ValorCeldaReporte,
  tipo: TipoDatoReporte = TipoDatoReporte.TEXTO,
): string | number | boolean {
  if (valor === null || valor === undefined) {
    return '';
  }

  switch (tipo) {
    case TipoDatoReporte.NUMERO:
    case TipoDatoReporte.DECIMAL:
      return typeof valor === 'number' ? valor : normalizarTextoReporte(valor);
    case TipoDatoReporte.PORCENTAJE:
      return typeof valor === 'number'
        ? formatearPorcentajeReporte(valor)
        : normalizarTextoReporte(valor);
    case TipoDatoReporte.MONEDA:
      return typeof valor === 'number'
        ? formatearMonedaReporte(valor)
        : normalizarTextoReporte(valor);
    case TipoDatoReporte.FECHA:
      return valor instanceof Date
        ? formatearFechaReporte(valor)
        : normalizarTextoReporte(valor);
    case TipoDatoReporte.FECHA_HORA:
      return valor instanceof Date
        ? formatearFechaHoraReporte(valor)
        : normalizarTextoReporte(valor);
    case TipoDatoReporte.BOOLEANO:
      return typeof valor === 'boolean' ? valor : normalizarTextoReporte(valor);
    case TipoDatoReporte.TEXTO:
    default:
      return typeof valor === 'number'
        ? formatearNumeroReporte(valor)
        : normalizarTextoReporte(valor);
  }
}

export function escaparFormulaHojaCalculo(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
}
