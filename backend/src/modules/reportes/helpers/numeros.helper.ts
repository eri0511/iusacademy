import { REPORTES_CONFIG } from '../constants/reportes.constants';

export interface OpcionesNumeroReporte {
  locale?: string;
  minimoDecimales?: number;
  maximoDecimales?: number;
}

function validarNumero(valor: number): void {
  if (!Number.isFinite(valor)) {
    throw new TypeError('El valor debe ser un número finito');
  }
}

function normalizarDecimales(
  valor: number | undefined,
  defecto: number,
): number {
  if (valor === undefined) {
    return defecto;
  }

  return Math.min(20, Math.max(0, Math.trunc(valor)));
}

export function redondearReporte(valor: number, decimales = 2): number {
  validarNumero(valor);
  const precision = normalizarDecimales(decimales, 2);
  const factor = 10 ** precision;

  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

export function formatearNumeroReporte(
  valor: number | null | undefined,
  opciones: OpcionesNumeroReporte = {},
): string {
  if (valor === null || valor === undefined) {
    return '';
  }

  validarNumero(valor);
  const minimo = normalizarDecimales(opciones.minimoDecimales, 0);
  const maximo = Math.max(
    minimo,
    normalizarDecimales(opciones.maximoDecimales, 2),
  );

  return new Intl.NumberFormat(opciones.locale ?? REPORTES_CONFIG.locale, {
    minimumFractionDigits: minimo,
    maximumFractionDigits: maximo,
  }).format(valor);
}

export function formatearPorcentajeReporte(
  valor: number | null | undefined,
  decimales = 2,
  valorEnEscalaCien = true,
): string {
  if (valor === null || valor === undefined) {
    return '';
  }

  validarNumero(valor);
  const precision = normalizarDecimales(decimales, 2);
  const valorNormalizado = valorEnEscalaCien ? valor / 100 : valor;

  return new Intl.NumberFormat(REPORTES_CONFIG.locale, {
    style: 'percent',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(valorNormalizado);
}

export function formatearMonedaReporte(
  valor: number | null | undefined,
  moneda = 'BOB',
  decimales = 2,
): string {
  if (valor === null || valor === undefined) {
    return '';
  }

  validarNumero(valor);
  const precision = normalizarDecimales(decimales, 2);

  return new Intl.NumberFormat(REPORTES_CONFIG.locale, {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(valor);
}

export function calcularPromedio(valores: number[]): number | null {
  const numerosValidos = valores.filter(Number.isFinite);

  if (numerosValidos.length === 0) {
    return null;
  }

  return (
    numerosValidos.reduce((total, valor) => total + valor, 0) /
    numerosValidos.length
  );
}
