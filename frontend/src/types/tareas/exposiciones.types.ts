export type MetodoOrdenExposicion =
  | 'ORDEN_ENTREGA'
  | 'ALEATORIO'
  | 'ALFABETICO'
  | 'MANUAL';

export type EstadoJornadaExposicion =
  | 'CONFIGURANDO'
  | 'LISTA'
  | 'EN_CURSO'
  | 'PAUSADA'
  | 'FINALIZADA'
  | 'CANCELADA';

export type EstadoTurnoExposicion =
  | 'PENDIENTE'
  | 'EN_ESPERA'
  | 'EN_CURSO'
  | 'PAUSADO'
  | 'FINALIZADO'
  | 'AUSENTE';

export type EstadoPreguntaExposicion =
  | 'PENDIENTE'
  | 'SELECCIONADA'
  | 'RESPONDIDA'
  | 'DESCARTADA';


export type EstadoAnalisisExposicion =
  | 'PENDIENTE'
  | 'PROCESANDO'
  | 'COMPLETADO'
  | 'ERROR';

export type EvidenciasAnalisisExposicion = {
  versionMotor?: number;
  estructuraGuiada?: boolean;
  seccionesEsperadas?: string[];
  palabrasGuion?: number;
  palabrasMaterial?: number;
  palabrasTotales?: number;
  citasRegistradas?: number;
  referenciasNormativasDetectadas?: number;
  segundosAsignados?: number;
  segundosUtilizados?: number;
  preguntasRegistradas?: number;
  preguntasConContexto?: number;
  diapositivasEstimadas?: number | null;
  archivos?: Array<{
    id: number;
    nombre: string;
    extension: string;
    paginas: number | null;
    palabras: number;
    textoDisponible: boolean;
  }>;
  [clave: string]: unknown;
};

export type AnalisisExposicion = {
  id: number;
  turnoId: number;
  generadoPorId: number;
  estado: EstadoAnalisisExposicion;
  version: number;
  motor: string;
  puntuacionEstructura: number | string | null;
  puntuacionContenidoJuridico: number | string | null;
  puntuacionPresentacion: number | string | null;
  puntuacionGlobal: number | string | null;
  resumen: string | null;
  fortalezas: string[];
  advertencias: string[];
  omisiones: string[];
  retroalimentacionSugerida: string | null;
  evidencias: EvidenciasAnalisisExposicion | null;
  hashEntrada: string | null;
  error: string | null;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

export type ArchivoExposicion = {
  id: number;
  nombreOriginal: string;
  mimeType: string;
  extension: string;
  urlPublica: string | null;
  miniaturaUrl: string | null;
};

export type PersonaExposicion = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  fotoPerfilUrl?: string | null;
};

export type PreguntaExposicion = {
  id: number;
  contenido: string;
  estado: EstadoPreguntaExposicion;
  diapositiva: number | null;
  segundosExposicion: number | null;
  destacada: boolean;
  respondidaEn: string | null;
  descartadaEn: string | null;
  creadoEn: string;
  autor: PersonaExposicion;
  votos: Array<{ usuarioId: number }>;
};

export type EntregaTurnoExposicion = {
  id: number;
  enviadaEn: string | null;
  esGrupal: boolean;
  estudiante: PersonaExposicion | null;
  grupoCurso: { id: number; nombre: string } | null;
  equipoAfinidadTarea: { id: number; nombre: string } | null;
  archivos: ArchivoExposicion[];
  calificacionRubrica: {
    completada: boolean;
    items: Array<{
      puntosAsignados: number | string;
      retroalimentacion: string | null;
      criterio: {
        id: number;
        nombre: string;
        peso: number | string;
      };
      nivel: {
        id: number;
        etiqueta: string;
      } | null;
    }>;
  } | null;
};

export type TurnoExposicion = {
  id: number;
  jornadaId: number;
  entregaId: number;
  orden: number;
  estado: EstadoTurnoExposicion;
  iniciadoEn: string | null;
  pausadoEn: string | null;
  reanudadoEn: string | null;
  finalizadoEn: string | null;
  segundosPausaAcumulados: number;
  segundosUtilizados: number;
  diapositivaActual: number;
  presentadorId: number | null;
  presentador: PersonaExposicion | null;
  entrega: EntregaTurnoExposicion;
  preguntas: PreguntaExposicion[];
};

export type CronometroExposicion = {
  ahoraServidor: string;
  segundosAsignados: number;
  segundosUtilizados: number;
  segundosRestantes: number;
  tiempoExtraSegundos: number;
  enPausa: boolean;
  tiempoCumplido: boolean;
};

export type SalaExposicionDocente = {
  id: number;
  tareaId: number;
  creadorId: number;
  metodoOrden: MetodoOrdenExposicion;
  estado: EstadoJornadaExposicion;
  duracionSegundos: number;
  avisoSegundos: number;
  permitirTiempoExtra: boolean;
  mostrarSiguiente: boolean;
  generadaEn: string | null;
  iniciadaEn: string | null;
  finalizadaEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  tarea: {
    id: number;
    titulo: string;
    cursoId: number;
    esCalificable: boolean;
  };
  turnos: TurnoExposicion[];
  turnoActivoId: number | null;
  cronometro: CronometroExposicion | null;
};

export type SalaExposicionEstudiante = SalaExposicionDocente & {
  miTurno: {
    id: number;
    orden: number;
    estado: EstadoTurnoExposicion;
    presentadorId: number | null;
  } | null;
};

export type ConfigurarJornadaExposicionDatos = {
  metodoOrden: MetodoOrdenExposicion;
  duracionSegundos: number;
  avisoSegundos?: number;
  permitirTiempoExtra?: boolean;
  mostrarSiguiente?: boolean;
  ordenManualEntregaIds?: number[];
};
