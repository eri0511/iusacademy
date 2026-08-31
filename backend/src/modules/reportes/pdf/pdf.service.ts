import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

import {
  REPORTES_CONFIG,
  MIME_REPORTE,
  EXTENSION_REPORTE,
} from '../constants/reportes.constants';
import { GeneradorReporte } from '../interfaces/generador-reporte.interface';
import {
  ArchivoReporteGenerado,
  DefinicionReporte,
  MetadatosReporte,
  SeccionReporte,
} from '../interfaces/reporte.interface';
import {
  FilaReporte,
  FormatoReporte,
  OrientacionReporte,
} from '../tipos/reportes.types';
import { construirNombreArchivoReporte } from '../helpers/archivos.helper';
import { generarCodigoUnicoReporte } from '../helpers/codigos.helper';
import { formatearFechaHoraReporte } from '../helpers/fechas.helper';
import { normalizarTextoReporte } from '../helpers/normalizacion.helper';
import {
  contarRegistrosReporte,
  validarDefinicionReporte,
} from '../helpers/validacion-reporte.helper';
import { dibujarEncabezadoPdf } from './pdf-header';
import { dibujarPiePdf } from './pdf-footer';
import { PDF_ESTILOS } from './pdf.styles';
import { ColumnaPdfCalculada } from './pdf.types';
import {
  bufferDesdeDocumentoPdf,
  convertirAlineacionPdf,
  valorCeldaATextoPdf,
} from './pdf.utils';

@Injectable()
export class PdfService implements GeneradorReporte {
  async generar<TFila extends FilaReporte>(
    definicion: DefinicionReporte<TFila>,
    nombreArchivo?: string,
  ): Promise<ArchivoReporteGenerado> {
    validarDefinicionReporte(definicion);

    const generadoEn = definicion.metadatos.fechaGeneracion ?? new Date();
    const codigoUnico =
      definicion.metadatos.codigoUnico ?? generarCodigoUnicoReporte('PDF');
    const metadatos: MetadatosReporte = {
      ...definicion.metadatos,
      institucion:
        definicion.metadatos.institucion ?? REPORTES_CONFIG.nombreInstitucion,
      aplicacion:
        definicion.metadatos.aplicacion ?? REPORTES_CONFIG.nombreAplicacion,
      fechaGeneracion: generadoEn,
      codigoUnico,
    };
    const documento = new PDFDocument({
      autoFirstPage: false,
      bufferPages: true,
      compress: true,
      info: {
        Title: metadatos.titulo,
        Author: metadatos.generadoPor ?? REPORTES_CONFIG.autor,
        Subject:
          metadatos.descripcion ?? metadatos.subtitulo ?? metadatos.titulo,
        Creator: REPORTES_CONFIG.nombreAplicacion,
        CreationDate: generadoEn,
      },
    });
    const promesaBuffer = bufferDesdeDocumentoPdf(documento);
    let numeroPagina = 0;

    const agregarPagina = (): void => {
      numeroPagina += 1;
      documento.addPage({
        size: 'A4',
        layout:
          definicion.opciones?.orientacion === OrientacionReporte.HORIZONTAL
            ? 'landscape'
            : 'portrait',
        margins: {
          top: PDF_ESTILOS.pagina.altoEncabezado + 26,
          right: PDF_ESTILOS.pagina.margenHorizontal,
          bottom: PDF_ESTILOS.pagina.altoPie + 32,
          left: PDF_ESTILOS.pagina.margenHorizontal,
        },
      });
      dibujarEncabezadoPdf(documento, metadatos);
      documento.y = documento.page.margins.top;
    };

    agregarPagina();
    this.dibujarResumen(documento, definicion, metadatos, agregarPagina);

    for (const seccion of definicion.secciones) {
      this.dibujarSeccion(documento, seccion, agregarPagina);
    }

    if (definicion.opciones?.incluirQr) {
      await this.dibujarQr(
        documento,
        definicion.opciones.contenidoQr ?? codigoUnico,
        agregarPagina,
      );
    }

    const rango = documento.bufferedPageRange();
    for (
      let indice = rango.start;
      indice < rango.start + rango.count;
      indice += 1
    ) {
      documento.switchToPage(indice);
      dibujarPiePdf(
        documento,
        codigoUnico,
        metadatos.textoPie ?? 'Documento generado por IusAcademy · UNIFRANZ',
        indice - rango.start + 1,
      );
    }

    documento.end();
    const contenido = await promesaBuffer;

    return {
      contenido,
      nombreArchivo: construirNombreArchivoReporte(
        nombreArchivo ?? metadatos.titulo,
        FormatoReporte.PDF,
        true,
        generadoEn,
      ),
      formato: FormatoReporte.PDF,
      mimeType: MIME_REPORTE.PDF,
      extension: EXTENSION_REPORTE.PDF,
      codigoUnico,
      generadoEn,
      cantidadRegistros: contarRegistrosReporte(definicion),
    };
  }

  private dibujarResumen<TFila extends FilaReporte>(
    documento: PDFKit.PDFDocument,
    definicion: DefinicionReporte<TFila>,
    metadatos: MetadatosReporte,
    agregarPagina: () => void,
  ): void {
    if (metadatos.descripcion) {
      const y = documento.y;
      const ancho =
        documento.page.width -
        documento.page.margins.left -
        documento.page.margins.right;
      const texto = normalizarTextoReporte(metadatos.descripcion);
      const altoTexto = documento.heightOfString(texto, {
        width: ancho - 24,
        align: 'justify',
      });
      documento
        .roundedRect(
          documento.page.margins.left,
          y,
          ancho,
          altoTexto + 22,
          PDF_ESTILOS.radio.pequeno,
        )
        .fill(PDF_ESTILOS.color.superficieAlterna);
      documento
        .font(PDF_ESTILOS.fuente.normal)
        .fontSize(PDF_ESTILOS.tamano.cuerpo)
        .fillColor(PDF_ESTILOS.color.texto)
        .text(texto, documento.page.margins.left + 12, y + 11, {
          width: ancho - 24,
          align: 'justify',
          lineGap: 2,
        });
      documento.y = y + altoTexto + 31;
    }

    if (metadatos.generadoPor) {
      documento
        .font(PDF_ESTILOS.fuente.negrita)
        .fontSize(PDF_ESTILOS.tamano.pequeno)
        .fillColor(PDF_ESTILOS.color.textoSuave)
        .text(`Generado por: ${normalizarTextoReporte(metadatos.generadoPor)}`);
      documento.moveDown(0.5);
    }

    if (definicion.opciones?.incluirFiltros !== false && metadatos.filtros) {
      const entradas = Object.entries(metadatos.filtros);
      if (entradas.length > 0) {
        this.asegurarEspacio(documento, 48, agregarPagina);
        const inicioX = documento.page.margins.left;
        const ancho =
          documento.page.width - inicioX - documento.page.margins.right;
        const alto = 27 + entradas.length * 16;
        documento
          .roundedRect(
            inicioX,
            documento.y,
            ancho,
            alto,
            PDF_ESTILOS.radio.pequeno,
          )
          .fill(PDF_ESTILOS.color.primarioSuave);
        const inicioY = documento.y + 10;
        documento
          .font(PDF_ESTILOS.fuente.negrita)
          .fontSize(PDF_ESTILOS.tamano.cuerpo)
          .fillColor(PDF_ESTILOS.color.primarioOscuro)
          .text('Filtros aplicados', inicioX + 12, inicioY, {
            width: ancho - 24,
          });
        documento.y = inicioY + 15;
        for (const [clave, valor] of entradas) {
          const texto =
            valor instanceof Date
              ? formatearFechaHoraReporte(valor)
              : Array.isArray(valor)
                ? valor.join(', ')
                : String(valor ?? '—');
          documento
            .font(PDF_ESTILOS.fuente.normal)
            .fillColor(PDF_ESTILOS.color.textoSuave)
            .text(
              `• ${normalizarTextoReporte(clave)}: ${normalizarTextoReporte(texto)}`,
              inicioX + 12,
              documento.y,
              { width: ancho - 24 },
            );
        }
        documento.y = inicioY + alto + 4;
      }
    }
  }

  private dibujarSeccion<TFila extends FilaReporte>(
    documento: PDFKit.PDFDocument,
    seccion: SeccionReporte<TFila>,
    agregarPagina: () => void,
  ): void {
    this.asegurarEspacio(documento, 70, agregarPagina);
    if (seccion.titulo) {
      documento
        .font(PDF_ESTILOS.fuente.negrita)
        .fontSize(PDF_ESTILOS.tamano.seccion)
        .fillColor(PDF_ESTILOS.color.primarioOscuro)
        .text(normalizarTextoReporte(seccion.titulo));
      documento.moveDown(0.25);
    }
    if (seccion.descripcion) {
      documento
        .font(PDF_ESTILOS.fuente.normal)
        .fontSize(PDF_ESTILOS.tamano.cuerpo)
        .fillColor(PDF_ESTILOS.color.textoSuave)
        .text(normalizarTextoReporte(seccion.descripcion));
      documento.moveDown(0.5);
    }

    const columnas = this.calcularColumnas(documento, seccion);
    const dibujarEncabezado = seccion.mostrarEncabezado !== false;
    if (dibujarEncabezado) {
      this.dibujarEncabezadoTabla(documento, columnas);
    }

    if (seccion.filas.length === 0) {
      documento
        .font(PDF_ESTILOS.fuente.cursiva)
        .fontSize(PDF_ESTILOS.tamano.cuerpo)
        .fillColor(PDF_ESTILOS.color.textoSuave)
        .text('No existen registros para mostrar.');
      documento.moveDown();
      return;
    }

    seccion.filas.forEach((fila, indice) => {
      const textos = columnas.map(({ definicion }) => {
        const valorOriginal = fila[definicion.clave];
        const valor = definicion.transformador
          ? definicion.transformador(valorOriginal, fila, indice)
          : valorOriginal;
        return valorCeldaATextoPdf(valor, definicion.tipo);
      });
      const alto = Math.max(
        PDF_ESTILOS.tabla.altoMinimoFila,
        ...columnas.map(
          (columna, posicion) =>
            documento.heightOfString(textos[posicion], {
              width: columna.ancho - PDF_ESTILOS.tabla.paddingHorizontal * 2,
              align: convertirAlineacionPdf(columna.definicion.alineacion),
            }) +
            PDF_ESTILOS.tabla.paddingVertical * 2,
        ),
      );

      if (!this.hayEspacio(documento, alto)) {
        agregarPagina();
        if (dibujarEncabezado) {
          this.dibujarEncabezadoTabla(documento, columnas);
        }
      }
      this.dibujarFila(documento, columnas, textos, alto, indice);
    });
    documento.moveDown(1.1);
  }

  private calcularColumnas<TFila extends FilaReporte>(
    documento: PDFKit.PDFDocument,
    seccion: SeccionReporte<TFila>,
  ): Array<ColumnaPdfCalculada<TFila>> {
    const visibles = seccion.columnas.filter(
      (columna) => columna.visible !== false,
    );
    const anchoDisponible =
      documento.page.width -
      documento.page.margins.left -
      documento.page.margins.right;
    const pesos = visibles.map((columna) => columna.ancho ?? 1);
    const total = pesos.reduce((suma, peso) => suma + peso, 0);
    let x = documento.page.margins.left;

    return visibles.map((definicion, indice) => {
      const ancho = (anchoDisponible * pesos[indice]) / total;
      const calculada = { definicion, x, ancho };
      x += ancho;
      return calculada;
    });
  }

  private dibujarEncabezadoTabla<TFila extends FilaReporte>(
    documento: PDFKit.PDFDocument,
    columnas: Array<ColumnaPdfCalculada<TFila>>,
  ): void {
    const y = documento.y;
    const alto = PDF_ESTILOS.tabla.altoEncabezado;
    columnas.forEach(({ definicion, x, ancho }) => {
      documento.rect(x, y, ancho, alto).fill(PDF_ESTILOS.color.primario);
      documento
        .font(PDF_ESTILOS.fuente.negrita)
        .fontSize(PDF_ESTILOS.tamano.encabezadoTabla)
        .fillColor(PDF_ESTILOS.color.blanco)
        .text(normalizarTextoReporte(definicion.etiqueta), x + 5, y + 7, {
          width: ancho - 10,
          align: convertirAlineacionPdf(definicion.alineacion),
          ellipsis: true,
          lineBreak: false,
        });
    });
    documento.y = y + alto;
  }

  private dibujarFila<TFila extends FilaReporte>(
    documento: PDFKit.PDFDocument,
    columnas: Array<ColumnaPdfCalculada<TFila>>,
    textos: string[],
    alto: number,
    indice: number,
  ): void {
    const y = documento.y;
    columnas.forEach((columna, posicion) => {
      documento
        .rect(columna.x, y, columna.ancho, alto)
        .fillAndStroke(
          indice % 2 === 0
            ? PDF_ESTILOS.color.blanco
            : PDF_ESTILOS.color.fondoAlterno,
          PDF_ESTILOS.color.borde,
        );
      documento
        .font(PDF_ESTILOS.fuente.normal)
        .fontSize(PDF_ESTILOS.tamano.cuerpo)
        .fillColor(PDF_ESTILOS.color.texto)
        .text(
          textos[posicion],
          columna.x + PDF_ESTILOS.tabla.paddingHorizontal,
          y + PDF_ESTILOS.tabla.paddingVertical,
          {
            width: columna.ancho - PDF_ESTILOS.tabla.paddingHorizontal * 2,
            height: alto - PDF_ESTILOS.tabla.paddingVertical * 2,
            align: convertirAlineacionPdf(columna.definicion.alineacion),
            ellipsis: true,
          },
        );
    });
    documento.y = y + alto;
  }

  private async dibujarQr(
    documento: PDFKit.PDFDocument,
    contenido: string,
    agregarPagina: () => void,
  ): Promise<void> {
    this.asegurarEspacio(documento, 96, agregarPagina);
    const qr = await QRCode.toBuffer(contenido, {
      type: 'png',
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: PDF_ESTILOS.color.primarioOscuro, light: '#FFFFFFFF' },
    });
    const x = documento.page.width - documento.page.margins.right - 72;
    const y = documento.y;
    documento.image(qr, x, y, { width: 72, height: 72 });
    documento
      .font(PDF_ESTILOS.fuente.negrita)
      .fontSize(PDF_ESTILOS.tamano.pequeno)
      .fillColor(PDF_ESTILOS.color.textoSuave)
      .text('Verificación del reporte', x - 110, y + 27, {
        width: 100,
        align: 'right',
      });
    documento.y = y + 82;
  }

  private hayEspacio(documento: PDFKit.PDFDocument, alto: number): boolean {
    return (
      documento.y + alto <=
      documento.page.height - documento.page.margins.bottom
    );
  }

  private asegurarEspacio(
    documento: PDFKit.PDFDocument,
    alto: number,
    agregarPagina: () => void,
  ): void {
    if (!this.hayEspacio(documento, alto)) {
      agregarPagina();
    }
  }
}
