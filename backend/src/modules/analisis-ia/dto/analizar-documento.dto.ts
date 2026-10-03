export type TipoDocumentoAnalisisIa =
  | 'GENERICO'
  | 'EXPOSICION'
  | 'DEMANDA'
  | 'MEMORIAL'
  | 'CONTRATO'
  | 'RECURSO'
  | 'INCIDENTE';

export type TipoFuenteAnalisisIa =
  | 'BIBLIOTECA_JURIDICA'
  | 'RECURSO_CURSO'
  | 'ENTREGA_ESTUDIANTE'
  | 'NORMATIVA'
  | 'JURISPRUDENCIA'
  | 'WEB';

export type TipoSeccionJuridicaIa =
  | 'GENERICA'
  | 'ENCABEZADO'
  | 'IDENTIFICACION_PARTES'
  | 'ANTECEDENTES'
  | 'HECHOS'
  | 'FUNDAMENTACION_JURIDICA'
  | 'PETITORIO'
  | 'OTROSI'
  | 'CLAUSULAS'
  | 'CONCLUSIONES'
  | 'REFERENCIAS'
  | 'FIRMAS';

export interface DocumentoAnalisisIaDto {
  id_externo?: string | null;
  tipo_documento: TipoDocumentoAnalisisIa;
  texto: string;
  idioma?: string;
  titulo?: string | null;
  metadatos?: Record<string, unknown>;
}

export interface FuenteAnalisisIaDto {
  id_externo?: string | null;
  tipo_fuente: TipoFuenteAnalisisIa;
  titulo: string;
  texto: string;
  autorizada?: boolean;
  url?: string | null;
  metadatos?: Record<string, unknown>;
}

export interface AnalisisCompletoIaRequestDto {
  documento: DocumentoAnalisisIaDto;
  fuentes?: FuenteAnalisisIaDto[];
}

export interface EvidenciaCoincidenciaIaDto {
  indice_fragmento: number;
  texto_fragmento: string;
  fuente_id_externo: string | null;
  fuente_tipo: TipoFuenteAnalisisIa;
  fuente_titulo: string;
  fuente_autorizada: boolean;
  texto_coincidente: string;
  similitud_semantica: number;
  similitud_lexica: number;
  similitud_combinada: number;
  seccion: TipoSeccionJuridicaIa;
  peso_seccion: number;
  fuente_url: string | null;
  fuente_fragmento_indice: number | null;
  fuente_fragmento_inicio: number | null;
  fuente_fragmento_fin: number | null;
  metadatos: Record<string, unknown>;
}

export interface ResultadoAnalisisIaDto {
  documento_id_externo: string | null;
  total_fragmentos: number;
  total_fuentes_evaluadas: number;
  total_evidencias: number;
  similitud_maxima: number;
  similitud_promedio: number;
  evidencias: EvidenciaCoincidenciaIaDto[];
  metadatos: Record<string, unknown>;
}