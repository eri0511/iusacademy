import type {
  AutorForo,
  EstadoForo,
  ForoListado,
} from './foro.types';

export type ArchivoForo = {
  id: number;
  nombreOriginal?: string;
  nombre?: string;
  url?: string;
  ruta?: string;
  mimeType?: string;
  tamanioBytes?: number;
};

export type ComentarioForo = {
  id: number;
  autorId: number;
  contenido: string;
  publicadoEn: string;
  editadoEn?: string | null;
  estaOculto?: boolean;
  autor: AutorForo;
  archivos?: ArchivoForo[];
  respuestas?: ComentarioForo[];
};

export type RespuestaForo = {
  id: number;
  autorId: number;
  titulo: string;
  contenido: string;
  estado: string;
  publicadoEn: string;
  editadoEn?: string | null;
  entregadaTarde?: boolean;
  estaBloqueada?: boolean;
  autor: AutorForo;
  archivos?: ArchivoForo[];
  comentarios?: ComentarioForo[];

  grupoCurso?: {
    id: number;
    nombre: string;
    color?: string | null;
    integrantes?: Array<{
      estudianteId: number;
      esRepresentante: boolean;
      estudiante: {
        id: number;
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno?: string | null;
        fotoPerfilUrl?: string | null;
      };
    }>;
  } | null;

  equipoAfinidad?: {
    id: number;
    nombre: string;
    integrantes?: Array<{
      estudianteId: number;
      esRepresentante: boolean;
      estudiante: {
        id: number;
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno?: string | null;
        fotoPerfilUrl?: string | null;
      };
    }>;
  } | null;

  _count?: {
    comentarios: number;
    archivos: number;
  };
};

export type CriterioRubricaForo = {
  id: number;
  nombre?: string;
  titulo?: string;
  descripcion?: string | null;
  puntajeMaximo?: number;
  ponderacion?: number;
  orden: number;
};

export type DetalleForo = ForoListado & {
  instrucciones?: string | null;

  // Participación
  modalidadParticipacion: string;
  origenGrupo: string;
  dinamicaGrupal: string;

  // Configuración de grupos de plataforma / afinidad
  conjuntoGrupoId?: number | null;
  cantidadMinimaIntegrantes?: number | null;
  cantidadMaximaIntegrantes?: number | null;
  requiereAprobacionEquipos?: boolean;
  requiereRepresentante?: boolean;
  bloquearEquipoAlResponder?: boolean;

  // Comentarios y permisos
  permitirComentarios: boolean;
  permitirEditarRespuestas: boolean;
  permitirEliminarRespuestas: boolean;
  permitirEditarComentarios: boolean;
  permitirEliminarComentarios: boolean;
  visibilidadRespuestas: string;

  // Reglas de participación
  minimoComentariosPorEstudiante?: number | null;
  maximoComentariosPorEstudiante?: number | null;
  penalizarIncumplimientoComentarios?: boolean;
  tipoPenalizacionComentarios?:
    | 'NINGUNA'
    | 'PUNTOS_FIJOS'
    | 'PORCENTAJE'
    | string;
  valorPenalizacionComentarios?: number | null;
  palabrasMinimasRespuesta?: number | null;
  palabrasMaximasRespuesta?: number | null;
  palabrasMinimasComentario?: number | null;
  palabrasMaximasComentario?: number | null;

  // Retrasos
  permitirRetrasos: boolean;
  fechaMaximaRetraso?: string | null;
  tipoDescuentoRetraso?: string;
  valorDescuentoRetraso?: number | null;

  // Archivos
  permitirAdjuntosTema: boolean;
  permitirAdjuntosRespuesta: boolean;
  permitirAdjuntosComentario: boolean;
  exigirAdjuntoRespuesta: boolean;
  permitirDescargaAdjuntos: boolean;
  extensionesPermitidas?: string[];
  maximoArchivosTema?: number;
  maximoArchivosRespuesta?: number;
  maximoArchivosComentario?: number;
  tamanioMaximoArchivoMb?: number;

  // Evaluación
  tipoEvaluacion?: string;
  modalidadNota?: string;
  porcentajeNotaGrupal?: number | null;
  porcentajeNotaIndividual?: number | null;
  calificacionAutomaticaAlCumplir?: boolean;
  participaEnPromedio?: boolean;

  // Estado / archivos
  archivos?: ArchivoForo[];
  estaCerrado?: boolean;

  actividadCalificable?: (
    ForoListado['actividadCalificable'] & {
      rubrica?: {
        id: number;
        criterios: CriterioRubricaForo[];
      } | null;
    }
  ) | null;
};

export type ResumenLecturasForo = {
  totalEstudiantes: number;
  totalLectores: number;
  totalSinLeer: number;
  porcentajeLectura: number;
};

export type EstadisticasForo = {
  resumen: {
    totalEstudiantes: number;
    estudiantesParticipantes: number;
    estudiantesSinParticipar: number;
    porcentajeParticipacion: number;
    estudiantesLectores: number;
    estudiantesSinLeer: number;
    cantidadRespuestas: number;
    cantidadComentarios: number;
    totalIntervenciones: number;
    cantidadVistas: number;
  };
};

export type PanelCalificacionesForo = {
  resumen?: {
    pendientes?: number;
    calificadas?: number;
    publicados?: number;
    totalEstudiantes?: number;
  };

  estudiantes?: unknown[];
};

export type HistorialForo = Array<{
  id: number;
  accion: string;
  registradoEn: string;
  detalle?: unknown;
  actor?: AutorForo | null;
}>;

export type AccionEstadoForo = EstadoForo;