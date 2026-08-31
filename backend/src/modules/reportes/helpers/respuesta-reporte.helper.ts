import type { ArchivoReporteGenerado } from '../interfaces/reporte.interface';

export interface RespuestaDescargaReporte {
  setHeader(nombre: string, valor: string): unknown;
  send(contenido: Buffer): unknown;
}

export function construirContentDispositionReporte(
  nombreArchivo: string,
): string {
  const nombreSeguro = nombreArchivo
    .replace(/[\r\n"]/g, '')
    .replace(/[^\x20-\x7E]/g, '_');
  const nombreUtf8 = encodeURIComponent(nombreArchivo)
    .replace(/['()]/g, escape)
    .replace(/\*/g, '%2A');

  return `attachment; filename="${nombreSeguro}"; filename*=UTF-8''${nombreUtf8}`;
}

export function enviarArchivoReporte(
  respuesta: RespuestaDescargaReporte,
  archivo: ArchivoReporteGenerado,
): void {
  respuesta.setHeader('Content-Type', archivo.mimeType);
  respuesta.setHeader(
    'Content-Disposition',
    construirContentDispositionReporte(archivo.nombreArchivo),
  );
  respuesta.setHeader('Content-Length', archivo.contenido.length.toString());
  respuesta.setHeader('X-Reporte-Codigo', archivo.codigoUnico);
  respuesta.setHeader(
    'X-Reporte-Registros',
    archivo.cantidadRegistros.toString(),
  );
  respuesta.send(archivo.contenido);
}
