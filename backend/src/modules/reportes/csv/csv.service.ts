import { Injectable } from '@nestjs/common';
import { format } from '@fast-csv/format';

import {
  DELIMITADORES_CSV_PERMITIDOS,
  MIME_REPORTE,
} from '../constants/reportes.constants';
import { construirNombreArchivoReporte } from '../helpers/archivos.helper';
import { generarCodigoUnicoReporte } from '../helpers/codigos.helper';
import {
  contarRegistrosReporte,
  validarDefinicionReporte,
} from '../helpers/validacion-reporte.helper';
import type {
  ArchivoReporteGenerado,
  DefinicionReporte,
} from '../interfaces/reporte.interface';
import { FilaReporte, FormatoReporte } from '../tipos/reportes.types';
import { obtenerFilaCsv } from './csv.utils';

@Injectable()
export class CsvService {
  async generar<TFila extends FilaReporte>(
    definicion: DefinicionReporte<TFila>,
    nombreArchivo?: string,
  ): Promise<ArchivoReporteGenerado> {
    validarDefinicionReporte(definicion);

    const generadoEn = definicion.metadatos.fechaGeneracion ?? new Date();
    const codigoUnico =
      definicion.metadatos.codigoUnico ?? generarCodigoUnicoReporte();
    const delimitador = this.validarDelimitador(
      definicion.opciones?.delimitadorCsv,
    );
    const incluirBom = definicion.opciones?.incluirBomCsv !== false;
    const contenido = await this.construirCsv(
      definicion,
      delimitador,
      incluirBom,
    );

    return {
      contenido,
      nombreArchivo: construirNombreArchivoReporte(
        nombreArchivo ?? definicion.metadatos.titulo,
        FormatoReporte.CSV,
      ),
      formato: FormatoReporte.CSV,
      mimeType: MIME_REPORTE.CSV,
      extension: 'csv',
      codigoUnico,
      generadoEn,
      cantidadRegistros: contarRegistrosReporte(definicion),
    };
  }

  private construirCsv<TFila extends FilaReporte>(
    definicion: DefinicionReporte<TFila>,
    delimitador: string,
    incluirBom: boolean,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const fragmentos: Buffer[] = [];
      const flujo = format({
        delimiter: delimitador,
        quote: '"',
        rowDelimiter: '\r\n',
        includeEndRowDelimiter: true,
      });

      flujo.on('data', (fragmento: Buffer | string) => {
        fragmentos.push(
          Buffer.isBuffer(fragmento) ? fragmento : Buffer.from(fragmento),
        );
      });
      flujo.on('error', reject);
      flujo.on('end', () => {
        const csv = Buffer.concat(fragmentos);
        resolve(incluirBom ? Buffer.concat([Buffer.from('\uFEFF'), csv]) : csv);
      });

      definicion.secciones.forEach((seccion, indiceSeccion) => {
        const columnas = seccion.columnas.filter(
          (columna) => columna.visible !== false,
        );
        const incluirNumero = seccion.mostrarNumeroFila === true;

        if (definicion.secciones.length > 1) {
          if (indiceSeccion > 0) {
            flujo.write([]);
          }
          flujo.write([seccion.titulo ?? `Sección ${indiceSeccion + 1}`]);
        }

        flujo.write(
          incluirNumero
            ? ['N.º', ...columnas.map((columna) => columna.etiqueta)]
            : columnas.map((columna) => columna.etiqueta),
        );

        seccion.filas.forEach((fila, indice) => {
          flujo.write(obtenerFilaCsv(fila, columnas, indice, incluirNumero));
        });
      });

      flujo.end();
    });
  }

  private validarDelimitador(valor?: string): string {
    if (!valor) {
      return ';';
    }

    return (DELIMITADORES_CSV_PERMITIDOS as readonly string[]).includes(valor)
      ? valor
      : ';';
  }
}
