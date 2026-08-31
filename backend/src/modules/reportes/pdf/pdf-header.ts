import type PDFKit from 'pdfkit';

import { MetadatosReporte } from '../interfaces/reporte.interface';
import { formatearFechaHoraReporte } from '../helpers/fechas.helper';
import { PDF_ESTILOS } from './pdf.styles';
import { rutaImagenValida } from './pdf.utils';

export function dibujarEncabezadoPdf(
  documento: PDFKit.PDFDocument,
  metadatos: MetadatosReporte,
): void {
  const { left, right } = documento.page.margins;
  const ancho = documento.page.width - left - right;
  const inicioY = 26;

  documento
    .roundedRect(left, inicioY, ancho, 101, PDF_ESTILOS.radio.mediano)
    .fill(PDF_ESTILOS.color.fondoSuave);

  documento
    .roundedRect(left, inicioY, 7, 101, 3)
    .fill(PDF_ESTILOS.color.primario);

  if (rutaImagenValida(metadatos.logoInstitucionRuta)) {
    documento.image(metadatos.logoInstitucionRuta, left + 18, inicioY + 13, {
      fit: [68, 28],
      valign: 'center',
    });
  } else {
    documento
      .font(PDF_ESTILOS.fuente.negrita)
      .fontSize(10)
      .fillColor(PDF_ESTILOS.color.primarioOscuro)
      .text(metadatos.institucion ?? 'UNIFRANZ', left + 18, inicioY + 20, {
        width: 92,
      });
  }

  if (rutaImagenValida(metadatos.logoAplicacionRuta)) {
    documento.image(
      metadatos.logoAplicacionRuta,
      left + ancho - 92,
      inicioY + 12,
      {
        fit: [72, 30],
        align: 'right',
        valign: 'center',
      },
    );
  } else {
    documento
      .font(PDF_ESTILOS.fuente.negrita)
      .fontSize(10)
      .fontSize(13)
      .fillColor(PDF_ESTILOS.color.primario)
      .text(
        metadatos.aplicacion ?? 'IusAcademy',
        left + ancho - 120,
        inicioY + 18,
        {
          width: 100,
          align: 'right',
        },
      );
  }

  documento
    .moveTo(left + 18, inicioY + 48)
    .lineTo(left + ancho - 18, inicioY + 48)
    .lineWidth(0.7)
    .strokeColor(PDF_ESTILOS.color.borde)
    .stroke();

  documento
    .font(PDF_ESTILOS.fuente.negrita)
    .fontSize(PDF_ESTILOS.tamano.titulo)
    .fillColor(PDF_ESTILOS.color.texto)
    .text(metadatos.titulo, left + 18, inicioY + 57, {
      width: ancho - 150,
      align: 'left',
      ellipsis: true,
    });

  if (metadatos.subtitulo) {
    documento
      .font(PDF_ESTILOS.fuente.normal)
      .fontSize(PDF_ESTILOS.tamano.subtitulo)
      .fillColor(PDF_ESTILOS.color.textoSuave)
      .text(metadatos.subtitulo, left + 18, inicioY + 80, {
        width: ancho - 150,
        align: 'left',
        ellipsis: true,
      });
  }

  documento
    .font(PDF_ESTILOS.fuente.normal)
    .fontSize(PDF_ESTILOS.tamano.pequeno)
    .fillColor(PDF_ESTILOS.color.textoSuave)
    .text(
      `Generado: ${formatearFechaHoraReporte(metadatos.fechaGeneracion ?? new Date())}`,
      left,
      inicioY + 80,
      { width: ancho - 36, align: 'right' },
    );
}
