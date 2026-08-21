import {
  Injectable,
} from '@nestjs/common';
import ExcelJS, {
  Row,
  Worksheet,
} from 'exceljs';

import {
  MIME_REPORTE,
  REPORTES_CONFIG,
} from '../constants/reportes.constants';
import {
  construirNombreArchivoReporte,
} from '../helpers/archivos.helper';
import {
  generarCodigoUnicoReporte,
} from '../helpers/codigos.helper';
import {
  formatearFechaHoraReporte,
} from '../helpers/fechas.helper';
import {
  normalizarNombreHojaExcel,
  normalizarTextoReporte,
} from '../helpers/normalizacion.helper';
import {
  contarRegistrosReporte,
  validarDefinicionReporte,
} from '../helpers/validacion-reporte.helper';
import type {
  ArchivoReporteGenerado,
  DefinicionReporte,
  SeccionReporte,
} from '../interfaces/reporte.interface';
import {
  AlineacionReporte,
  FilaReporte,
  FormatoReporte,
  TipoDatoReporte,
} from '../tipos/reportes.types';
import {
  EXCEL_ALINEACION_CELDA,
  EXCEL_BORDE_CELDA,
  EXCEL_COLORES,
  EXCEL_FUENTE_ENCABEZADO,
  EXCEL_FUENTE_TITULO,
  EXCEL_RELLENO_ENCABEZADO,
} from './excel.styles';
import {
  calcularAnchoExcel,
  obtenerAlineacionExcel,
  obtenerFormatoNumeroExcel,
  obtenerValorFilaExcel,
} from './excel.utils';

@Injectable()
export class ExcelService {
  async generar<TFila extends FilaReporte>(
    definicion: DefinicionReporte<TFila>,
    nombreArchivo?: string,
  ): Promise<ArchivoReporteGenerado> {
    validarDefinicionReporte(definicion);

    const generadoEn = definicion.metadatos.fechaGeneracion ?? new Date();
    const codigoUnico = definicion.metadatos.codigoUnico ?? generarCodigoUnicoReporte();
    const libro = new ExcelJS.Workbook();

    libro.creator = REPORTES_CONFIG.nombreAplicacion;
    libro.company = definicion.metadatos.institucion ?? REPORTES_CONFIG.nombreInstitucion;
    libro.title = definicion.metadatos.titulo;
    libro.subject = definicion.metadatos.subtitulo ?? 'Reporte académico';
    libro.created = generadoEn;
    libro.modified = generadoEn;

    definicion.secciones.forEach((seccion, indice) => {
      const nombreBase = seccion.titulo
        ?? (indice === 0 ? definicion.opciones?.nombreHojaExcel : undefined)
        ?? `Sección ${indice + 1}`;
      const nombreHoja = this.obtenerNombreHojaUnico(libro, nombreBase);
      const hoja = libro.addWorksheet(nombreHoja, {
        properties: { defaultRowHeight: 20 },
        pageSetup: {
          orientation: definicion.opciones?.orientacion === 'HORIZONTAL'
            ? 'landscape'
            : 'portrait',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          margins: {
            left: 0.25,
            right: 0.25,
            top: 0.5,
            bottom: 0.5,
            header: 0.2,
            footer: 0.2,
          },
        },
      });

      this.construirHoja(
        hoja,
        definicion,
        seccion,
        codigoUnico,
        generadoEn,
      );
    });

    const datos = await libro.xlsx.writeBuffer();
    const contenido = Buffer.isBuffer(datos) ? datos : Buffer.from(datos);

    return {
      contenido,
      nombreArchivo: construirNombreArchivoReporte(
        nombreArchivo ?? definicion.metadatos.titulo,
        FormatoReporte.EXCEL,
      ),
      formato: FormatoReporte.EXCEL,
      mimeType: MIME_REPORTE.EXCEL,
      extension: 'xlsx',
      codigoUnico,
      generadoEn,
      cantidadRegistros: contarRegistrosReporte(definicion),
    };
  }

  private construirHoja<TFila extends FilaReporte>(
    hoja: Worksheet,
    definicion: DefinicionReporte<TFila>,
    seccion: SeccionReporte<TFila>,
    codigoUnico: string,
    generadoEn: Date,
  ): void {
    const columnas = seccion.columnas.filter((columna) => columna.visible !== false);
    const incluyeNumero = seccion.mostrarNumeroFila === true;
    const totalColumnas = Math.max(1, columnas.length + (incluyeNumero ? 1 : 0));

    hoja.mergeCells(1, 1, 1, totalColumnas);
    const celdaMarca = hoja.getCell(1, 1);
    celdaMarca.value = `${REPORTES_CONFIG.nombreAplicacion} · ${definicion.metadatos.institucion ?? REPORTES_CONFIG.nombreInstitucion}`;
    celdaMarca.font = { name: 'Aptos', size: 10, bold: true, color: { argb: EXCEL_COLORES.acentoOscuro } };
    celdaMarca.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORES.crema } };
    celdaMarca.alignment = { vertical: 'middle', horizontal: 'left' };
    hoja.getRow(1).height = 25;

    hoja.mergeCells(2, 1, 2, totalColumnas);
    const celdaTitulo = hoja.getCell(2, 1);
    celdaTitulo.value = definicion.metadatos.titulo;
    celdaTitulo.font = EXCEL_FUENTE_TITULO;
    celdaTitulo.alignment = { vertical: 'middle', horizontal: 'left' };
    hoja.getRow(2).height = 34;

    let filaActual = 3;
    if (definicion.metadatos.subtitulo) {
      hoja.mergeCells(filaActual, 1, filaActual, totalColumnas);
      const celda = hoja.getCell(filaActual, 1);
      celda.value = definicion.metadatos.subtitulo;
      celda.font = { name: 'Aptos', size: 11, color: { argb: EXCEL_COLORES.textoSecundario } };
      filaActual += 1;
    }

    hoja.mergeCells(filaActual, 1, filaActual, totalColumnas);
    const celdaMeta = hoja.getCell(filaActual, 1);
    celdaMeta.value = `Código: ${codigoUnico}  ·  Generado: ${formatearFechaHoraReporte(generadoEn)}${definicion.metadatos.generadoPor ? `  ·  Por: ${definicion.metadatos.generadoPor}` : ''}`;
    celdaMeta.font = { name: 'Aptos', size: 9, color: { argb: EXCEL_COLORES.textoSecundario } };
    filaActual += 2;

    if (definicion.opciones?.incluirFiltros !== false && definicion.metadatos.filtros) {
      const filtros = Object.entries(definicion.metadatos.filtros)
        .map(([clave, valor]) => `${clave}: ${Array.isArray(valor) ? valor.join(', ') : String(valor ?? 'Todos')}`)
        .join('  ·  ');
      hoja.mergeCells(filaActual, 1, filaActual, totalColumnas);
      const celda = hoja.getCell(filaActual, 1);
      celda.value = `Filtros · ${filtros}`;
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORES.superficieAlterna } };
      celda.font = { name: 'Aptos', size: 9, italic: true, color: { argb: EXCEL_COLORES.textoSecundario } };
      celda.alignment = { wrapText: true, vertical: 'middle' };
      filaActual += 2;
    }

    if (seccion.titulo) {
      hoja.mergeCells(filaActual, 1, filaActual, totalColumnas);
      const celda = hoja.getCell(filaActual, 1);
      celda.value = seccion.titulo;
      celda.font = { name: 'Aptos', size: 13, bold: true, color: { argb: EXCEL_COLORES.texto } };
      filaActual += 1;
    }

    const filaEncabezado = filaActual;
    const etiquetas = incluyeNumero
      ? ['N.º', ...columnas.map((columna) => columna.etiqueta)]
      : columnas.map((columna) => columna.etiqueta);
    const encabezado = hoja.getRow(filaEncabezado);
    encabezado.values = etiquetas;
    this.estilizarEncabezado(encabezado, etiquetas.length);

    seccion.filas.forEach((fila, indice) => {
      const valores = columnas.map((columna) => obtenerValorFilaExcel(fila, columna, indice));
      const filaExcel = hoja.addRow(incluyeNumero ? [indice + 1, ...valores] : valores);
      filaExcel.height = 22;

      filaExcel.eachCell({ includeEmpty: true }, (celda, indiceColumna) => {
        const columna = incluyeNumero ? columnas[indiceColumna - 2] : columnas[indiceColumna - 1];
        celda.font = { name: 'Aptos', size: 10, color: { argb: EXCEL_COLORES.texto } };
        celda.border = EXCEL_BORDE_CELDA;
        celda.alignment = {
          ...EXCEL_ALINEACION_CELDA,
          horizontal: columna
            ? obtenerAlineacionExcel(columna.alineacion)
            : 'center',
        };
        celda.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: indice % 2 === 0
              ? EXCEL_COLORES.superficie
              : EXCEL_COLORES.superficieAlterna,
          },
        };
        if (columna) {
          celda.numFmt = obtenerFormatoNumeroExcel(columna.tipo) ?? 'General';
        }
      });
    });

    if (seccion.filas.length === 0) {
      hoja.mergeCells(filaEncabezado + 1, 1, filaEncabezado + 1, totalColumnas);
      const celda = hoja.getCell(filaEncabezado + 1, 1);
      celda.value = 'No existen registros para los filtros seleccionados.';
      celda.alignment = { horizontal: 'center', vertical: 'middle' };
      celda.font = { name: 'Aptos', size: 10, italic: true, color: { argb: EXCEL_COLORES.textoSecundario } };
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_COLORES.superficie } };
    }

    let offset = 1;
    if (incluyeNumero) {
      hoja.getColumn(1).width = 8;
      offset = 2;
    }
    columnas.forEach((columna, indice) => {
      hoja.getColumn(indice + offset).width = calcularAnchoExcel(columna, seccion.filas);
    });

    hoja.autoFilter = {
      from: { row: filaEncabezado, column: 1 },
      to: { row: filaEncabezado, column: totalColumnas },
    };
    hoja.views = [{ state: 'frozen', ySplit: filaEncabezado, activeCell: `A${filaEncabezado + 1}` }];
    hoja.headerFooter.oddFooter = `&LIusAcademy · ${codigoUnico}&RPágina &P de &N`;
    hoja.pageSetup.printTitlesRow = `${filaEncabezado}:${filaEncabezado}`;
    hoja.pageSetup.printArea = `A1:${hoja.getColumn(totalColumnas).letter}${Math.max(filaEncabezado + 1, hoja.rowCount)}`;
  }

  private estilizarEncabezado(fila: Row, totalColumnas: number): void {
    fila.height = 28;
    for (let indice = 1; indice <= totalColumnas; indice += 1) {
      const celda = fila.getCell(indice);
      celda.font = EXCEL_FUENTE_ENCABEZADO;
      celda.fill = EXCEL_RELLENO_ENCABEZADO;
      celda.border = EXCEL_BORDE_CELDA;
      celda.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    }
  }

  private obtenerNombreHojaUnico(libro: ExcelJS.Workbook, nombre: string): string {
    const base = normalizarNombreHojaExcel(normalizarTextoReporte(nombre));
    let candidato = base;
    let numero = 2;

    while (libro.getWorksheet(candidato)) {
      const sufijo = ` (${numero})`;
      candidato = `${base.slice(0, 31 - sufijo.length)}${sufijo}`;
      numero += 1;
    }

    return candidato;
  }
}
