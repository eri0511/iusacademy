import {
  ColumnaReporte,
} from '../interfaces/columna-reporte.interface';
import {
  FilaReporte,
} from '../tipos/reportes.types';
import {
  escaparFormulaHojaCalculo,
  normalizarTextoReporte,
  normalizarValorCelda,
} from '../helpers/normalizacion.helper';

export function obtenerFilaCsv<TFila extends FilaReporte>(
  fila: TFila,
  columnas: Array<ColumnaReporte<TFila>>,
  indice: number,
  incluirNumero: boolean,
): Array<string | number | boolean> {
  const valores = columnas.map((columna) => {
    const valorOriginal = fila[columna.clave];
    const valor = columna.transformador
      ? columna.transformador(valorOriginal, fila, indice)
      : valorOriginal;
    const normalizado = normalizarValorCelda(valor, columna.tipo);

    return typeof normalizado === 'string'
      ? escaparFormulaHojaCalculo(normalizarTextoReporte(normalizado))
      : normalizado;
  });

  return incluirNumero ? [indice + 1, ...valores] : valores;
}
