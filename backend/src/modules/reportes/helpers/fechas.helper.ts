import { REPORTES_CONFIG } from '../constants/reportes.constants';

export interface OpcionesFormatoFecha {
  locale?: string;
  zonaHoraria?: string;
}

function esFechaValida(fecha: Date): boolean {
  return !Number.isNaN(fecha.getTime());
}

export function convertirAFecha(valor: Date | string | number): Date {
  const fecha =
    valor instanceof Date ? new Date(valor.getTime()) : new Date(valor);

  if (!esFechaValida(fecha)) {
    throw new TypeError('El valor recibido no representa una fecha válida');
  }

  return fecha;
}

export function formatearFechaReporte(
  valor: Date | string | number | null | undefined,
  opciones: OpcionesFormatoFecha = {},
): string {
  if (valor === null || valor === undefined) {
    return '';
  }

  const fecha = convertirAFecha(valor);

  return new Intl.DateTimeFormat(opciones.locale ?? REPORTES_CONFIG.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: opciones.zonaHoraria ?? REPORTES_CONFIG.zonaHoraria,
  }).format(fecha);
}

export function formatearFechaHoraReporte(
  valor: Date | string | number | null | undefined,
  opciones: OpcionesFormatoFecha = {},
): string {
  if (valor === null || valor === undefined) {
    return '';
  }

  const fecha = convertirAFecha(valor);

  return new Intl.DateTimeFormat(opciones.locale ?? REPORTES_CONFIG.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: opciones.zonaHoraria ?? REPORTES_CONFIG.zonaHoraria,
  }).format(fecha);
}

export function formatearFechaArchivo(
  valor: Date | string | number = new Date(),
  zonaHoraria = REPORTES_CONFIG.zonaHoraria,
): string {
  const fecha = convertirAFecha(valor);
  const partes = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: zonaHoraria,
  }).formatToParts(fecha);

  const obtener = (tipo: Intl.DateTimeFormatPartTypes): string =>
    partes.find((parte) => parte.type === tipo)?.value ?? '00';

  return [
    obtener('year'),
    obtener('month'),
    obtener('day'),
    obtener('hour'),
    obtener('minute'),
    obtener('second'),
  ].join('');
}

export function obtenerFechaGeneracion(): Date {
  return new Date();
}
