import type PDFKit from 'pdfkit';
import {
  existsSync,
} from 'node:fs';

import {
  AlineacionReporte,
  TipoDatoReporte,
  ValorCeldaReporte,
} from '../tipos/reportes.types';
import {
  normalizarValorCelda,
} from '../helpers/normalizacion.helper';

export function convertirAlineacionPdf(
  alineacion?: AlineacionReporte,
): 'left' | 'center' | 'right' {
  switch (alineacion) {
    case AlineacionReporte.CENTRO:
      return 'center';
    case AlineacionReporte.DERECHA:
      return 'right';
    default:
      return 'left';
  }
}

export function valorCeldaATextoPdf(
  valor: ValorCeldaReporte,
  tipo: TipoDatoReporte = TipoDatoReporte.TEXTO,
): string {
  const normalizado = normalizarValorCelda(valor, tipo);
  return typeof normalizado === 'boolean'
    ? normalizado ? 'Sí' : 'No'
    : String(normalizado);
}

export function bufferDesdeDocumentoPdf(
  documento: PDFKit.PDFDocument,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const partes: Buffer[] = [];

    documento.on('data', (parte: Buffer | Uint8Array) => {
      partes.push(Buffer.isBuffer(parte) ? parte : Buffer.from(parte));
    });
    documento.on('end', () => resolve(Buffer.concat(partes)));
    documento.on('error', reject);
  });
}

export function rutaImagenValida(ruta?: string): ruta is string {
  if (!ruta?.trim()) {
    return false;
  }

  return existsSync(ruta);
}
