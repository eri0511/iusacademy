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

  let texto: string;

  if (typeof valor === 'string') {
    texto = valor;
  } else if (
    typeof valor === 'number' ||
    typeof valor === 'boolean' ||
    typeof valor === 'bigint'
  ) {
    texto = String(valor);
  } else if (valor instanceof Date) {
    texto = valor.toISOString();
  } else {
    try {
      texto = JSON.stringify(valor) ?? '';
    } catch {
      texto = '';
    }
  }

  return texto
    .normalize('NFC')
    .split('')
    .filter((caracter) => {
      const codigo = caracter.charCodeAt(0);
      return !(
        codigo <= 8 ||
        codigo === 11 ||
        codigo === 12 ||
        (codigo >= 14 && codigo <= 31) ||
        codigo === 127
      );
    })
    .join('')
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
