import type {
  CrearRubricaDatos,
} from './rubricas.types';

export type EstadoTarea =
  | 'BORRADOR'
  | 'PROGRAMADA'
  | 'DISPONIBLE'
  | 'CERRADA'
  | 'ANULADA';

export type TipoTarea =
  | 'ENTREGA_ARCHIVOS'
  | 'RESPUESTA_ESCRITA'
  | 'DOCUMENTO_COLABORATIVO'
  | 'REDACCION_JURIDICA'
  | 'EXPOSICION'
  | 'CASO_PRACTICO'
  | 'MIXTA'
  | 'PRESENCIAL';

export type CapacidadTarea =
  | 'ARCHIVOS'
  | 'EDITOR_TEXTO'
  | 'EDICION_COLABORATIVA'
  | 'SEGUIMIENTO_AUTORIA'
  | 'HISTORIAL_VERSIONES'
  | 'EXPORTACION_PDF'
  | 'EXPOSICION'
  | 'CASO_ESTRUCTURADO'
  | 'REDACCION_JURIDICA'
  | 'EVIDENCIA_DOCENTE';

export type ModoEdicionTarea =
  | 'SIN_EDITOR'
  | 'INDIVIDUAL'
  | 'COLABORATIVO';

export type TipoComponenteTarea =
  | 'ARCHIVOS'
  | 'TEXTO'
  | 'DOCUMENTO_COLABORATIVO'
  | 'REDACCION_JURIDICA'
  | 'EXPOSICION'
  | 'CASO_PRACTICO'
  | 'PRESENCIAL';

export type ModalidadTarea =
  | 'INDIVIDUAL'
  | 'GRUPAL';

export type OrigenGrupoTarea =
  | 'NINGUNO'
  | 'PLATAFORMA'
  | 'AFINIDAD';

export type ResponsableEntregaGrupo =
  | 'SOLO_REPRESENTANTE'
  | 'CUALQUIER_INTEGRANTE';

export type ModalidadNotaTarea =
  | 'INDIVIDUAL'
  | 'GRUPAL'
  | 'GRUPAL_E_INDIVIDUAL';

export type ComponenteEvaluacion =
  | 'CONTINUA'
  | 'PROCESUAL';

export type TipoDescuentoRetraso =
  | 'NINGUNO'
  | 'PUNTOS_FIJOS'
  | 'PORCENTAJE'
  | 'POR_HORA'
  | 'POR_DIA'
  | 'NOTA_MAXIMA';

export type ComponenteTareaFormulario = {
  tipo: TipoComponenteTarea;

  titulo: string;

  descripcion?: string;

  obligatorio?: boolean;

  configuracion?: Record<string, unknown>;
};

export type CrearTareaDatos = {
  hitoId: number;

  titulo: string;

  descripcion?: string;

  instrucciones?: string;

  tipo: TipoTarea;

  capacidades?: CapacidadTarea[];

  configuracionTipo?: Record<string, unknown>;

  componentes?: ComponenteTareaFormulario[];

  esCalificable?: boolean;

  componente?: ComponenteEvaluacion;

  puntajeMaximo?: number;

  modalidad: ModalidadTarea;

  origenGrupo?: OrigenGrupoTarea;

  conjuntoGrupoId?: number;

  modalidadNota?: ModalidadNotaTarea;

  porcentajeNotaGrupal?: number;

  porcentajeNotaIndividual?: number;

  requiereRepresentante?: boolean;

  fechaApertura: string;

  fechaLimite: string;

  fechaCierre: string;

  visibleAntesDeApertura?: boolean;

  permitirRetrasos?: boolean;

  fechaMaximaRetraso?: string;

  tipoDescuentoRetraso?: TipoDescuentoRetraso;

  valorDescuentoRetraso?: number;

  exigirContenidoEditor?: boolean;

  exigirArchivo?: boolean;

  maximoArchivos?: number;

  tamanioMaximoArchivoMb?: number;

  extensionesPermitidas?: string[];

  permitirEditarEntrega?: boolean;

  publicar?: boolean;

  archivosConsigna?: File[];

  archivosConsignaEliminar?: number[];

  archivoRubrica?: File | null;

  usarRubrica?: boolean;

  modoRubrica?:
    | 'PREDETERMINADA'
    | 'PERSONALIZADA';

  rubricaDatos?: CrearRubricaDatos | null;
};

export type ComponenteTarea = {
  id: number;

  orden: number;

  tipo: TipoComponenteTarea;

  titulo: string;

  descripcion: string | null;

  obligatorio: boolean;

  configuracion: Record<string, unknown> | null;
};

export type TareaCurso = {
  id: number;

  cursoId: number;

  autorId: number;

  hitoId: number;

  conjuntoGrupoId: number | null;

  titulo: string;

  descripcion: string | null;

  instrucciones: string | null;

  tipo: TipoTarea;

  capacidades: CapacidadTarea[];

  modoEdicion: ModoEdicionTarea;

  configuracionTipo: Record<string, unknown> | null;

  esCalificable: boolean;

  componente: ComponenteEvaluacion | null;

  puntajeMaximo: number | string;

  modalidad: ModalidadTarea;

  origenGrupo: OrigenGrupoTarea;

  modalidadNota: ModalidadNotaTarea;

  porcentajeNotaGrupal: number | string | null;

  porcentajeNotaIndividual: number | string | null;

  requiereRepresentante: boolean;

  fechaApertura: string;

  fechaLimite: string;

  fechaCierre: string;

  visibleAntesDeApertura: boolean;

  permitirRetrasos: boolean;

  fechaMaximaRetraso: string | null;

  tipoDescuentoRetraso: TipoDescuentoRetraso;

  valorDescuentoRetraso: number | string | null;

  exigirContenidoEditor: boolean;

  exigirArchivo: boolean;

  maximoArchivos: number;

  tamanioMaximoArchivoMb: number;

  extensionesPermitidas: string[];

  permitirEditarEntrega: boolean;

  estado: EstadoTarea;

  estadoVisual: EstadoTarea;

  tieneTrabajoEstudiantil: boolean;

  totalRegistrosTrabajo: number;

  estaCerrada: boolean;

  estaActiva: boolean;

  publicadoEn: string | null;

  cerradoEn: string | null;

  eliminadoEn: string | null;

  creadoEn: string;

  actualizadoEn: string;

  hito: {
    id: number;

    numero: number;

    codigo: string;

    nombre: string;

    fechaInicio: string;

    fechaFin: string;
  };

  conjuntoGrupo: {
    id: number;

    nombre: string;

    alcance:
      | 'CURSO'
      | 'HITO'
      | 'ACTIVIDAD';

    tipoEvaluacion:
      | 'CONTINUA'
      | 'PROCESUAL';

    requiereRepresentante: boolean;

    estaBloqueado: boolean;

    estaActivo: boolean;
  } | null;

  componentes: ComponenteTarea[];

  actividadCalificable: {
    id: number;

    origen: string;

    componente: ComponenteEvaluacion;

    puntajeMaximo: number | string;

    participaEnPromedio: boolean;

    estado: string;

    visibleParaEstudiantes: boolean;

    publicadaEn: string | null;

    cerradaEn: string | null;
  } | null;

  archivos: Array<{
    id: number;

    nombreOriginal: string;

    mimeType: string;

    extension: string;

    tamanioBytes: number;

    permiteDescarga: boolean;

    creadoEn: string;
  }>;
};

export type RespuestaListadoTareas = {
  total: number;

  tareas: TareaCurso[];
};

export type RespuestaTarea = {
  mensaje?: string;

  tarea: TareaCurso;

  calificacion?: {
    notaBase: number | string;

    descuentoRetraso: number | string;

    ajusteIndividual: number | string;

    notaFinal: number | string;

    retroalimentacion: string | null;

    calificadaEn: string | null;

    publicadaEn: string | null;
  } | null;
};