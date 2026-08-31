import { ArchivoReporteGenerado, DefinicionReporte } from './reporte.interface';
import { FilaReporte } from '../tipos/reportes.types';

export interface GeneradorReporte {
  generar<TFila extends FilaReporte>(
    definicion: DefinicionReporte<TFila>,
    nombreArchivo?: string,
  ): Promise<ArchivoReporteGenerado>;
}
