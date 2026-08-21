import type {
  FiltrosReporte,
} from '../tipos/reportes.types';

export interface DatosRegistroReporte {
  tipo: string;
  generadoPorId: number;
  filtros?: FiltrosReporte;
  expiraEn?: Date;
}

export interface ResultadoVerificacionReporte {
  valido: boolean;
  codigo: string;
  estado: string;
  titulo: string;
  tipo: string;
  formato: string;
  nombreArchivo: string | null;
  cantidadRegistros: number;
  generadoEn: Date;
  finalizadoEn: Date | null;
  expiraEn: Date | null;
  anuladoEn: Date | null;
  motivoAnulacion: string | null;
  generadoPor: string;
  institucion: string;
}
