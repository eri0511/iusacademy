export type EstadoForo =
  | 'BORRADOR'
  | 'PROGRAMADO'
  | 'ABIERTO'
  | 'VENCIDO'
  | 'CERRADO'
  | 'CALIFICANDO'
  | 'CALIFICADO'
  | 'NOTAS_PUBLICADAS'
  | 'ANULADO';

export type EstadoLecturaForo =
  | ''
  | 'LEIDOS'
  | 'NO_LEIDOS'
  | 'CON_NOVEDADES'
  | 'SIN_NOVEDADES';

export type OrdenListadoForo =
  | 'ULTIMA_ACTIVIDAD_DESC'
  | 'ULTIMA_ACTIVIDAD_ASC'
  | 'CREACION_DESC'
  | 'CREACION_ASC'
  | 'RESPUESTAS_DESC'
  | 'RESPUESTAS_ASC'
  | 'TITULO_ASC'
  | 'TITULO_DESC';

export type ModalidadParticipacionForo =
  | 'INDIVIDUAL'
  | 'GRUPAL';

export type AutorForo = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fotoPerfilUrl?: string | null;
};

export type IndicadoresForo = {
  leido: boolean;
  tieneNovedades: boolean;
  ultimaLecturaEn: string | null;
  misVisitas: number;
  cantidadVistas: number;
  cantidadLectores: number;
  cantidadRespuestas: number;
  cantidadComentarios: number;
  cantidadParticipantes: number;
  ultimaActividadEn: string;
};

export type ForoListado = {
  id: number;
  titulo: string;
  contenido: string;
  instrucciones?: string | null;
  objetivo?: string | null;

  estado: EstadoForo;
  estaFijado: boolean;
  esCalificable: boolean;

  modalidadParticipacion:
    ModalidadParticipacionForo;

  fechaApertura: string;
  fechaLimite: string;
  fechaCierre: string;

  creadoEn: string;
  actualizadoEn: string;

  autor: AutorForo;

  hito?: {
    id: number;
    numero: number;
    codigo: string;
    nombre: string;
  } | null;

  conjuntoGrupo?: {
    id: number;
    nombre: string;
    alcance: string;
  } | null;

  actividadCalificable?: {
    id: number;
    componente: string;
    participaEnPromedio: boolean;
    estado: string;
  } | null;

  _count?: {
    respuestas: number;
    equiposAfinidad: number;
    archivos: number;
  };

  indicadores: IndicadoresForo;
};

export type PaginacionForos = {
  pagina: number;
  limite: number;
  totalRegistros: number;
  totalPaginas: number;
  tienePaginaAnterior: boolean;
  tienePaginaSiguiente: boolean;
};

export type FiltrosForo = {
  busqueda: string;
  estado: EstadoForo | '';
  lectura: EstadoLecturaForo;
  orden: OrdenListadoForo;
  pagina: number;
  limite: number;
  hitoId?: number;
};

export type RespuestaListadoForos = {
  datos: ForoListado[];
  paginacion: PaginacionForos;
  filtrosAplicados: Record<string, unknown>;
};