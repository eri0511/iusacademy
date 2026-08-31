import { ColumnaReporte } from './columna-reporte.interface';
import {
  FilaReporte,
  FiltrosReporte,
  FormatoReporte,
  OrientacionReporte,
} from '../tipos/reportes.types';

export interface MetadatosReporte {
  titulo: string;
  subtitulo?: string;
  descripcion?: string;
  institucion?: string;
  aplicacion?: string;
  codigoUnico?: string;
  fechaGeneracion?: Date;
  generadoPor?: string;
  filtros?: FiltrosReporte;
  logoInstitucionRuta?: string;
  logoAplicacionRuta?: string;
  textoPie?: string;
}

export interface SeccionReporte<TFila extends FilaReporte = FilaReporte> {
  id: string;
  titulo?: string;
  descripcion?: string;
  columnas: Array<ColumnaReporte<TFila>>;
  filas: TFila[];
  mostrarEncabezado?: boolean;
  mostrarNumeroFila?: boolean;
}

export interface OpcionesReporte {
  orientacion?: OrientacionReporte;
  incluirQr?: boolean;
  contenidoQr?: string;
  incluirFiltros?: boolean;
  incluirFechaHora?: boolean;
  nombreHojaExcel?: string;
  delimitadorCsv?: string;
  incluirBomCsv?: boolean;
}

export interface DefinicionReporte<TFila extends FilaReporte = FilaReporte> {
  metadatos: MetadatosReporte;
  secciones: Array<SeccionReporte<TFila>>;
  opciones?: OpcionesReporte;
}

export interface ArchivoReporteGenerado {
  contenido: Buffer;
  nombreArchivo: string;
  formato: FormatoReporte;
  mimeType: string;
  extension: string;
  codigoUnico: string;
  generadoEn: Date;
  cantidadRegistros: number;
}
