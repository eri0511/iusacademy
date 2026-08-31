import { EXTENSION_REPORTE } from '../constants/reportes.constants';
import { FormatoReporte } from '../tipos/reportes.types';
import { formatearFechaArchivo } from './fechas.helper';

const NOMBRE_RESERVADO_WINDOWS = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function limpiarNombreArchivo(nombre: string): string {
  const limpio = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.\s-]+|[.\s-]+$/g, '')
    .toLowerCase();

  if (!limpio) {
    return 'reporte';
  }

  return NOMBRE_RESERVADO_WINDOWS.test(limpio) ? `reporte-${limpio}` : limpio;
}

export function obtenerExtensionReporte(formato: FormatoReporte): string {
  return EXTENSION_REPORTE[formato];
}

export function asegurarExtensionArchivo(
  nombre: string,
  extension: string,
): string {
  const extensionLimpia = extension.replace(/^\.+/, '').toLowerCase();
  const nombreLimpio = nombre.replace(/[.\s]+$/g, '');

  if (!extensionLimpia) {
    return nombreLimpio;
  }

  return nombreLimpio.toLowerCase().endsWith(`.${extensionLimpia}`)
    ? nombreLimpio
    : `${nombreLimpio}.${extensionLimpia}`;
}

export function construirNombreArchivoReporte(
  nombreBase: string,
  formato: FormatoReporte,
  incluirFechaHora = true,
  fecha = new Date(),
): string {
  const base = limpiarNombreArchivo(nombreBase);
  const sufijo = incluirFechaHora ? `-${formatearFechaArchivo(fecha)}` : '';

  return asegurarExtensionArchivo(
    `${base}${sufijo}`,
    obtenerExtensionReporte(formato),
  );
}
