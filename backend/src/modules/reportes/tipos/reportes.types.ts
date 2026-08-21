export enum FormatoReporte {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
}

export enum OrientacionReporte {
  VERTICAL = 'VERTICAL',
  HORIZONTAL = 'HORIZONTAL',
}

export enum AlineacionReporte {
  IZQUIERDA = 'IZQUIERDA',
  CENTRO = 'CENTRO',
  DERECHA = 'DERECHA',
}

export enum TipoDatoReporte {
  TEXTO = 'TEXTO',
  NUMERO = 'NUMERO',
  DECIMAL = 'DECIMAL',
  PORCENTAJE = 'PORCENTAJE',
  MONEDA = 'MONEDA',
  FECHA = 'FECHA',
  FECHA_HORA = 'FECHA_HORA',
  BOOLEANO = 'BOOLEANO',
}

export type ValorCeldaReporte =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type FilaReporte = Record<string, ValorCeldaReporte>;

export type FiltrosReporte = Record<
  string,
  string | number | boolean | Date | null | Array<string | number>
>;
