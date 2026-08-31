import type PDFKit from 'pdfkit';

import { PDF_ESTILOS } from './pdf.styles';

export function dibujarPiePdf(
  documento: PDFKit.PDFDocument,
  codigoUnico: string,
  textoPie: string,
  numeroPagina: number,
): void {
  const { left, right, bottom } = documento.page.margins;

  const ancho = documento.page.width - left - right;

  const altoPie = 27;
  const yContenedor = documento.page.height - altoPie - 12;

  const yTexto = yContenedor + 8;

  /*
   * Evita que PDFKit genere una página nueva al escribir
   * dentro del área reservada para el pie.
   */
  documento.page.margins.bottom = 0;

  documento.save();

  documento
    .roundedRect(left, yContenedor, ancho, altoPie, PDF_ESTILOS.radio.pequeno)
    .fill(PDF_ESTILOS.color.fondoSuave);

  documento
    .rect(left, yContenedor, 4, altoPie)
    .fill(PDF_ESTILOS.color.primario);

  documento
    .font(PDF_ESTILOS.fuente.normal)
    .fontSize(PDF_ESTILOS.tamano.pequeno)
    .fillColor(PDF_ESTILOS.color.textoSuave);

  documento.text(textoPie, left + 11, yTexto, {
    width: ancho * 0.38,
    height: 12,
    lineBreak: false,
    ellipsis: true,
  });

  documento.text(`Código: ${codigoUnico}`, left + ancho * 0.38, yTexto, {
    width: ancho * 0.42,
    height: 12,
    align: 'center',
    lineBreak: false,
    ellipsis: true,
  });

  documento.text(`Página ${numeroPagina}`, left + ancho * 0.8, yTexto, {
    width: ancho * 0.2 - 8,
    height: 12,
    align: 'right',
    lineBreak: false,
  });

  documento.restore();

  documento.page.margins.bottom = bottom;
}
