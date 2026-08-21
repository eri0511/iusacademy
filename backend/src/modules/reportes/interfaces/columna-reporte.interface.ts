import {
  AlineacionReporte,
  FilaReporte,
  TipoDatoReporte,
  ValorCeldaReporte,
} from '../tipos/reportes.types';

export interface ColumnaReporte<TFila extends FilaReporte = FilaReporte> {
  clave: keyof TFila & string;
  etiqueta: string;
  tipo?: TipoDatoReporte;
  ancho?: number;
  alineacion?: AlineacionReporte;
  visible?: boolean;
  transformador?: (
    valor: ValorCeldaReporte,
    fila: TFila,
    indice: number,
  ) => ValorCeldaReporte;
}
