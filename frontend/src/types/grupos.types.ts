export type AlcanceConjuntoGrupo =
  | 'CURSO'
  | 'HITO'
  | 'ACTIVIDAD';

export type MetodoCreacionGrupo =
  | 'MANUAL'
  | 'ALEATORIO'
  | 'IMPORTADO';

export type CriterioDistribucionGrupo =
  | 'CANTIDAD_GRUPOS'
  | 'INTEGRANTES_POR_GRUPO';

export type TipoEvaluacionGrupo =
  | 'CONTINUA'
  | 'PROCESUAL';

export type AccionHistorialGrupo =
  | 'CONJUNTO_CREADO'
  | 'CONJUNTO_ACTUALIZADO'
  | 'CONJUNTO_BLOQUEADO'
  | 'CONJUNTO_DESBLOQUEADO'
  | 'GRUPO_CREADO'
  | 'GRUPO_ACTUALIZADO'
  | 'GRUPO_ELIMINADO'
  | 'ESTUDIANTE_AGREGADO'
  | 'ESTUDIANTE_MOVIDO'
  | 'ESTUDIANTE_RETIRADO'
  | 'REPRESENTANTE_ASIGNADO'
  | 'REPRESENTANTE_REMOVIDO'
  | 'DISTRIBUCION_GENERADA'
  | 'DISTRIBUCION_REGENERADA'
  | 'CONJUNTO_IMPORTADO';

export type EstudianteGrupo = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  fotoPerfilUrl: string | null;
};

export type IntegranteGrupoCurso = {
  id: number;
  conjuntoId?: number;
  grupoId?: number;
  estudianteId: number;
  esRepresentante: boolean;
  estaActivo?: boolean;
  agregadoEn: string;
  retiradoEn?: string | null;
  estudiante: EstudianteGrupo;
};

export type GrupoCursoResumen = {
  id: number;
  nombre: string;
  color: string | null;
  orden: number;
  totalIntegrantes: number;
};

export type GrupoCursoDetalle = {
  id: number;
  conjuntoId: number;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  orden: number;
  estaActivo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  integrantes: IntegranteGrupoCurso[];
};

export type HitoGrupoResumen = {
  id: number;
  codigo: string;
  nombre: string;
};

export type ConjuntoGrupoResumen = {
  id: number;
  cursoId: number;
  hitoId: number | null;
  hito: HitoGrupoResumen | null;
  nombre: string;
  descripcion: string | null;
  alcance: AlcanceConjuntoGrupo;
  tipoEvaluacion: TipoEvaluacionGrupo;
  metodoCreacion: MetodoCreacionGrupo;
  criterioDistribucion: CriterioDistribucionGrupo | null;
  cantidadGruposObjetivo: number | null;
  integrantesPorGrupoObjetivo: number | null;
  requiereRepresentante: boolean;
  estaBloqueado: boolean;
  creadoEn: string;
  actualizadoEn: string;
  totalGrupos: number;
  totalIntegrantes: number;
  grupos: GrupoCursoResumen[];
};

export type ConjuntoGrupoDetalle = {
  id: number;
  cursoId: number;
  hitoId: number | null;
  hito: HitoGrupoResumen | null;
  nombre: string;
  descripcion: string | null;
  alcance: AlcanceConjuntoGrupo;
  tipoEvaluacion: TipoEvaluacionGrupo;
  metodoCreacion: MetodoCreacionGrupo;
  criterioDistribucion: CriterioDistribucionGrupo | null;
  cantidadGruposObjetivo: number | null;
  integrantesPorGrupoObjetivo: number | null;
  requiereRepresentante: boolean;
  estaBloqueado: boolean;
  estaActivo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  totalGrupos: number;
  totalIntegrantes: number;
  grupos: GrupoCursoDetalle[];
};

export type RespuestaDetalleConjunto = {
  conjunto: ConjuntoGrupoDetalle;
  estudiantesSinGrupo: EstudianteGrupo[];
};

export type ResumenDistribucionGrupo = {
  numeroGrupo: number;
  cantidadIntegrantes: number;
};

export type ResultadoDistribucion = {
  totalEstudiantes: number;
  cantidadGrupos: number;
  integrantesPorGrupoSolicitados: number | null;
  tamanos: number[];
  grupos: ResumenDistribucionGrupo[];
  diferenciaMaxima: number;
  esEquilibrada: boolean;
};

export type RespuestaPrevisualizacionGrupos = {
  distribucion: ResultadoDistribucion;
  sugerencias: ResultadoDistribucion[];
  estudiantes: EstudianteGrupo[];
};

export type GrupoInicialDatos = {
  nombre: string;
  descripcion?: string;
  color?: string;
  estudianteIds?: number[];
};

export type CrearConjuntoGrupoDatos = {
  nombre: string;
  descripcion?: string;
  alcance: AlcanceConjuntoGrupo;
  tipoEvaluacion: TipoEvaluacionGrupo;
  hitoId?: number;
  metodoCreacion: MetodoCreacionGrupo;
  criterioDistribucion?: CriterioDistribucionGrupo;
  cantidadGruposObjetivo?: number;
  integrantesPorGrupoObjetivo?: number;
  requiereRepresentante?: boolean;
  grupos?: GrupoInicialDatos[];
};

export type ActualizarConjuntoGrupoDatos = {
  nombre?: string;
  descripcion?: string | null;
  requiereRepresentante?: boolean;
};

export type PrevisualizarDistribucionDatos = {
  criterio: CriterioDistribucionGrupo;
  cantidadGrupos?: number;
  integrantesPorGrupo?: number;
};

export type CrearGrupoCursoDatos = {
  nombre: string;
  descripcion?: string;
  color?: string;
};

export type ActualizarGrupoCursoDatos = {
  nombre?: string;
  descripcion?: string | null;
  color?: string | null;
};

export type AsignarEstudiantesGrupoDatos = {
  estudianteIds: number[];
};

export type MoverEstudianteGrupoDatos = {
  estudianteId: number;
  grupoDestinoId: number;
};

export type CambiarRepresentanteGrupoDatos = {
  estudianteId: number;
  esRepresentante: boolean;
};

export type ImportarConjuntoGrupoDatos = {
  conjuntoOrigenId: number;
  nombre: string;
  hitoId?: number;
  copiarIntegrantes?: boolean;
};

export type HistorialGrupoCurso = {
  id: number;
  conjuntoId: number;
  grupoId: number | null;
  actorId: number;
  estudianteId: number | null;
  accion: AccionHistorialGrupo;
  detalle: unknown;
  registradoEn: string;
  actor: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
  };
  estudiante: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
  } | null;
  grupo: {
    id: number;
    nombre: string;
  } | null;
};

export type RespuestaAccionGrupo<T = unknown> = {
  mensaje: string;
  conjuntoId?: number;
  totalAsignados?: number;
  conjunto?: T;
  grupo?: T;
};

export type RespuestaErrorApi = {
  statusCode?: number;
  message?: string | string[];
  mensaje?: string;
  error?: string;
};


export type ModalidadContinuaGrupo =
  | 'NINGUNA'
  | 'SEMESTRAL'
  | 'POR_HITOS';

export type ConjuntoExistenteValidacion = {
  id: number;
  nombre: string;
};

export type HitoValidacionGrupo = {
  id: number;
  codigo: string;
  nombre: string;
  numero: number;
  ocupado: boolean;
  conjunto: ConjuntoExistenteValidacion | null;
};

export type ValidacionesCreacionGrupos = {
  totalEstudiantes: number;

  procesual: {
    existe: boolean;
    disponible: boolean;
    conjunto: ConjuntoExistenteValidacion | null;
  };

  continua: {
    modalidad: ModalidadContinuaGrupo;
    semestralExiste: boolean;
    puedeCrearSemestral: boolean;
    puedeCrearPorHito: boolean;
    conjuntoSemestral: ConjuntoExistenteValidacion | null;
    hitos: HitoValidacionGrupo[];
  };
};
