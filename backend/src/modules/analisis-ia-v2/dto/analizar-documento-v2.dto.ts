import { IsEnum, IsString, Matches } from 'class-validator';

export const TipoActividadV2 = {
  EXPOSICION: 'EXPOSICION',
  ENTREGA_ARCHIVOS: 'ENTREGA_ARCHIVOS',
  RESPUESTA_ESCRITA: 'RESPUESTA_ESCRITA',
  REDACCION_JURIDICA: 'REDACCION_JURIDICA',
  DOCUMENTO_COLABORATIVO: 'DOCUMENTO_COLABORATIVO',
  CASO_PRACTICO: 'CASO_PRACTICO',
  MIXTA: 'MIXTA',
  PRESENCIAL: 'PRESENCIAL',
  REVISION_LIBRE: 'REVISION_LIBRE',
} as const;

export type TipoActividadV2 =
  (typeof TipoActividadV2)[keyof typeof TipoActividadV2];

export const TipoDocumentoV2 = {
  GENERICO: 'GENERICO',
  RESPUESTA_ACADEMICA: 'RESPUESTA_ACADEMICA',
  DEMANDA: 'DEMANDA',
  MEMORIAL: 'MEMORIAL',
  CONTRATO: 'CONTRATO',
  RECURSO: 'RECURSO',
  INCIDENTE: 'INCIDENTE',
  EXPOSICION: 'EXPOSICION',
  CASO_PRACTICO: 'CASO_PRACTICO',
  OTRO: 'OTRO',
} as const;

export type TipoDocumentoV2 =
  (typeof TipoDocumentoV2)[keyof typeof TipoDocumentoV2];

export const TipoComponenteJuridicoV2 = {
  GENERICO: 'GENERICO',
  ENCABEZADO: 'ENCABEZADO',
  IDENTIFICACION_PARTES: 'IDENTIFICACION_PARTES',
  HECHOS: 'HECHOS',
  PROBLEMA_JURIDICO: 'PROBLEMA_JURIDICO',
  CONCEPTUALIZACION: 'CONCEPTUALIZACION',
  ELEMENTOS_JURIDICOS: 'ELEMENTOS_JURIDICOS',
  FUNDAMENTACION_JURIDICA: 'FUNDAMENTACION_JURIDICA',
  NORMA_APLICABLE: 'NORMA_APLICABLE',
  JURISPRUDENCIA_APLICABLE: 'JURISPRUDENCIA_APLICABLE',
  DOCTRINA_APLICABLE: 'DOCTRINA_APLICABLE',
  ARGUMENTACION_JURIDICA: 'ARGUMENTACION_JURIDICA',
  APLICACION_NORMA_HECHO: 'APLICACION_NORMA_HECHO',
  ANALISIS_CASO: 'ANALISIS_CASO',
  VIA_JURIDICA: 'VIA_JURIDICA',
  PROCEDIMIENTO: 'PROCEDIMIENTO',
  SOLUCION: 'SOLUCION',
  PETITORIO: 'PETITORIO',
  CONCLUSION: 'CONCLUSION',
  CLAUSULAS: 'CLAUSULAS',
  OBJETO_CONTRATO: 'OBJETO_CONTRATO',
  OBLIGACIONES: 'OBLIGACIONES',
  PLAZO: 'PLAZO',
  INCUMPLIMIENTO: 'INCUMPLIMIENTO',
  RESOLUCION_CONTRATO: 'RESOLUCION_CONTRATO',
  OTROSI: 'OTROSI',
  FIRMAS: 'FIRMAS',
  REFERENCIAS: 'REFERENCIAS',
  CITA: 'CITA',
} as const;

export type TipoComponenteJuridicoV2 =
  (typeof TipoComponenteJuridicoV2)[keyof typeof TipoComponenteJuridicoV2];

export const TipoFuenteV2 = {
  BIBLIOTECA_IUSACADEMY: 'BIBLIOTECA_IUSACADEMY',
  RECURSO_CURSO: 'RECURSO_CURSO',
  NORMATIVA: 'NORMATIVA',
  JURISPRUDENCIA: 'JURISPRUDENCIA',
  DOCTRINA: 'DOCTRINA',
  ENTREGA_ESTUDIANTE: 'ENTREGA_ESTUDIANTE',
  WEB: 'WEB',
  FUENTE_DECLARADA: 'FUENTE_DECLARADA',
} as const;

export type TipoFuenteV2 = (typeof TipoFuenteV2)[keyof typeof TipoFuenteV2];

export const TipoEvidenciaV2 = {
  ESTRUCTURA: 'ESTRUCTURA',
  REQUISITO: 'REQUISITO',
  FUNDAMENTACION: 'FUNDAMENTACION',
  ARGUMENTACION: 'ARGUMENTACION',
  COHERENCIA: 'COHERENCIA',
  SIMILITUD: 'SIMILITUD',
  FUENTE: 'FUENTE',
  CITA: 'CITA',
  REDACCION: 'REDACCION',
  POSIBLE_IA: 'POSIBLE_IA',
  OMISION: 'OMISION',
  CORRECCION_JURIDICA: 'CORRECCION_JURIDICA',
} as const;

export type TipoEvidenciaV2 =
  (typeof TipoEvidenciaV2)[keyof typeof TipoEvidenciaV2];

export const NivelObservacionV2 = {
  INFORMATIVO: 'INFORMATIVO',
  CORRECTO: 'CORRECTO',
  ADVERTENCIA: 'ADVERTENCIA',
  ERROR: 'ERROR',
} as const;

export type NivelObservacionV2 =
  (typeof NivelObservacionV2)[keyof typeof NivelObservacionV2];

export const EstadoComponenteV2 = {
  PRESENTE: 'PRESENTE',
  PARCIAL: 'PARCIAL',
  AUSENTE: 'AUSENTE',
  NO_REQUERIDO: 'NO_REQUERIDO',
} as const;

export type EstadoComponenteV2 =
  (typeof EstadoComponenteV2)[keyof typeof EstadoComponenteV2];

export const EstadoFundamentacionV2 = {
  RESPALDADA: 'RESPALDADA',
  PARCIALMENTE_RESPALDADA: 'PARCIALMENTE_RESPALDADA',
  SIN_RESPALDO: 'SIN_RESPALDO',
  EVIDENCIA_INSUFICIENTE: 'EVIDENCIA_INSUFICIENTE',
  POSIBLE_CONTRADICCION: 'POSIBLE_CONTRADICCION',
  SIN_EVIDENCIA: 'SIN_EVIDENCIA',
  NO_EVALUADA: 'NO_EVALUADA',
} as const;

export type EstadoFundamentacionV2 =
  (typeof EstadoFundamentacionV2)[keyof typeof EstadoFundamentacionV2];

export const EstadoRevisionLlmV2 = {
  DESACTIVADO: 'desactivado',
  SIMULADO: 'simulado',
  COMPLETADO: 'completado',
  ERROR: 'error',
} as const;

export type EstadoRevisionLlmV2 =
  (typeof EstadoRevisionLlmV2)[keyof typeof EstadoRevisionLlmV2];

export const TipoProveedorLlmV2 = {
  DISABLED: 'disabled',
  MOCK: 'mock',
  REAL: 'real',
  DESCONOCIDO: 'desconocido',
} as const;

export type TipoProveedorLlmV2 =
  (typeof TipoProveedorLlmV2)[keyof typeof TipoProveedorLlmV2];

export const EstadoValidacionCorreccionV2 = {
  PENDIENTE: 'pendiente',
  VALIDADA: 'validada',
  RECHAZADA: 'rechazada',
} as const;

export type EstadoValidacionCorreccionV2 =
  (typeof EstadoValidacionCorreccionV2)[keyof typeof EstadoValidacionCorreccionV2];

export const EstadoVerificacionReferenciaV2 = {
  IDENTIFICADA_POR_ID: 'identificada_por_id',
  COMPROBADA_POR_CONTENIDO: 'comprobada_por_contenido',
  NO_COMPROBADA: 'no_comprobada',
} as const;

export type EstadoVerificacionReferenciaV2 =
  (typeof EstadoVerificacionReferenciaV2)[keyof typeof EstadoVerificacionReferenciaV2];

export const COMBINACIONES_SOPORTADAS_V2: ReadonlyArray<
  readonly [TipoActividadV2, TipoDocumentoV2]
> = [
  [TipoActividadV2.REDACCION_JURIDICA, TipoDocumentoV2.DEMANDA],
  [TipoActividadV2.REDACCION_JURIDICA, TipoDocumentoV2.CONTRATO],
  [TipoActividadV2.REDACCION_JURIDICA, TipoDocumentoV2.MEMORIAL],
  [TipoActividadV2.REDACCION_JURIDICA, TipoDocumentoV2.RECURSO],
  [TipoActividadV2.REDACCION_JURIDICA, TipoDocumentoV2.INCIDENTE],
  [TipoActividadV2.RESPUESTA_ESCRITA, TipoDocumentoV2.RESPUESTA_ACADEMICA],
  [TipoActividadV2.CASO_PRACTICO, TipoDocumentoV2.CASO_PRACTICO],
  [TipoActividadV2.EXPOSICION, TipoDocumentoV2.EXPOSICION],
];

export class AnalizarDocumentoV2Dto {
  @IsString()
  @Matches(/\S/, {
    message: 'documento_id no puede contener solo espacios.',
  })
  documento_id: string;

  @IsString()
  @Matches(/\S/, {
    message: 'texto no puede contener solo espacios.',
  })
  texto: string;

  @IsEnum(TipoActividadV2)
  tipo_actividad: TipoActividadV2;

  @IsEnum(TipoDocumentoV2)
  tipo_documento: TipoDocumentoV2;
}

export interface DocumentoV2Dto {
  id: string;
  tipo_documento: TipoDocumentoV2;
}

export interface FragmentoV2Dto {
  identificador: string;
  indice: number;
  texto: string;
  componente: TipoComponenteJuridicoV2;
  inicio: number;
  fin: number;
}

export interface ClaridadLegibilidadV2Dto {
  cantidad_caracteres: number;
  cantidad_palabras: number;
  cantidad_oraciones: number;
  promedio_caracteres_por_palabra: number;
  promedio_caracteres_por_oracion: number;
}

export interface SilabasLegibilidadV2Dto {
  cantidad_silabas: number;
  cantidad_palabras: number;
  cantidad_palabras_sin_silabas: number;
  promedio_silabas_por_palabra: number;
}

export interface FrasesLegibilidadV2Dto {
  cantidad_frases: number;
}

export interface IfszLegibilidadV2Dto {
  valor: number;
  aplicable: boolean;
  motivo_no_aplicable: string | null;
}

export interface InterpretacionIfszLegibilidadV2Dto {
  nivel: string | null;
  descripcion: string | null;
  aplicable: boolean;
  motivo_no_aplicable: string | null;
}

export interface LegibilidadV2Dto {
  claridad: ClaridadLegibilidadV2Dto;
  silabas: SilabasLegibilidadV2Dto;
  frases: FrasesLegibilidadV2Dto;
  ifsz: IfszLegibilidadV2Dto;
  interpretacion_ifsz: InterpretacionIfszLegibilidadV2Dto;
}

export interface MetricasV2Dto {
  cumplimiento_estructural: number | null;
  cobertura_requisitos: number | null;
  fundamentacion_juridica: number | null;
  coherencia: number | null;
  cobertura_fuentes: number | null;
  redaccion: null;
  legibilidad: LegibilidadV2Dto | null;
}

export interface EstructuraV2Dto {
  evaluado: boolean;
  total_esperados: number;
  presentes: number;
  ausentes: number;
  cumplimiento: number | null;
}

export interface RequisitoV2Dto {
  codigo: string;
  descripcion: string;
  estado: EstadoComponenteV2;
  fragmentos_relacionados: string[];
  confianza: number;
  explicacion: string | null;
}

export interface FundamentacionV2Dto {
  estado: EstadoFundamentacionV2;
  cantidad_evidencias: number;
  puntuacion_recuperacion: number | null;
  puntuacion_respaldo: number | null;
  evaluada: boolean;
}

export interface CoherenciaV2Dto {
  valor: number;
}

export interface CoberturaFuentesV2Dto {
  evaluado: boolean;
  fragmentos_evaluables: number;
  fragmentos_con_trazabilidad: number;
  cumplimiento: number | null;
  alcance_fuentes_disponibles: string[];
}

export interface FuenteV2Dto {
  id: string;
  tipo: TipoFuenteV2;
  titulo: string;
  articulos: string[];
  fragmentos_relacionados: string[];
}

export interface PosibleIaV2Dto {
  estado: string;
  fragmentos_analizados: number;
  oraciones_analizadas: number;
  limitaciones: string[];
}

export interface DiagnosticosRedaccionV2Dto {
  estado: string;
  fragmentos_analizados: number;
}

export interface ObservacionV2Dto {
  id: string;
  tipo: TipoEvidenciaV2;
  nivel: NivelObservacionV2;
  titulo: string;
  mensaje: string;
  fragmento_indice: string | null;
}

export type MetadatosV2Dto = Record<string, string | number | boolean | null>;

export interface ReferenciaLlmV2Dto {
  fuente_id: string;
  articulo: string | null;
  texto_evidencia: string | null;
  estado_verificacion: EstadoVerificacionReferenciaV2;
}

export interface CorreccionLlmV2Dto {
  id_observacion: string;
  id_fragmento: string;
  inicio: number;
  fin: number;
  inicio_utf16: number;
  fin_utf16: number;
  texto_original: string;
  texto_propuesto: string | null;
  justificacion: string;
  evidencias: string[];
  referencias: ReferenciaLlmV2Dto[];
  estado_validacion: EstadoValidacionCorreccionV2;
}

export interface CorreccionRechazadaLlmV2Dto {
  id_observacion: string;
  id_fragmento: string;
  motivo: string;
}

export interface RevisionLlmV2Dto {
  estado: EstadoRevisionLlmV2;
  tipo_proveedor: TipoProveedorLlmV2;
  detalle_error: string | null;
  correcciones: CorreccionLlmV2Dto[];
  correcciones_rechazadas: CorreccionRechazadaLlmV2Dto[];
}

export interface ResultadoAnalisisFinalV11Dto {
  version_contrato: '1.1';
  documento: DocumentoV2Dto;
  fragmentos: FragmentoV2Dto[];
  resumen: string | null;
  metricas: MetricasV2Dto;
  estructura: EstructuraV2Dto;
  requisitos: RequisitoV2Dto[];
  fundamentacion: FundamentacionV2Dto;
  coherencia: CoherenciaV2Dto;
  cobertura_fuentes: CoberturaFuentesV2Dto;
  fuentes: FuenteV2Dto[];
  posible_ia: PosibleIaV2Dto;
  diagnosticos_redaccion: DiagnosticosRedaccionV2Dto;
  observaciones: ObservacionV2Dto[];
  metadatos: MetadatosV2Dto;
  revision_llm: RevisionLlmV2Dto;
}
