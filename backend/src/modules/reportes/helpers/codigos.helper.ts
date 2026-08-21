import {
  randomBytes,
  randomUUID,
} from 'node:crypto';

import {
  formatearFechaArchivo,
} from './fechas.helper';

export function generarCodigoUnicoReporte(prefijo = 'RPT'): string {
  const prefijoSeguro = prefijo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .toUpperCase() || 'RPT';
  const fecha = formatearFechaArchivo(new Date());
  const aleatorio = randomBytes(4).toString('hex').toUpperCase();

  return `${prefijoSeguro}-${fecha}-${aleatorio}`;
}

export function generarIdentificadorReporte(): string {
  return randomUUID();
}

export function esCodigoUnicoReporteValido(codigo: string): boolean {
  return /^[A-Z0-9]{1,10}-\d{14}-[A-F0-9]{8}$/.test(codigo.trim());
}
