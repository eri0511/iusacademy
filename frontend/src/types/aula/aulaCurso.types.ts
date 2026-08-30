export type RolAula =
  | 'DOCENTE'
  | 'ESTUDIANTE';

export type EstadoCursoAula =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'FINALIZADO';

export type EstadoPlanificacionAula =
  | 'SIN_PLANIFICACION'
  | 'PROXIMA'
  | 'EN_CURSO'
  | 'FINALIZADA'
  | 'SIN_HITOS';

export type EstadoTemporalHito =
  | 'FINALIZADO'
  | 'EN_CURSO'
  | 'PROXIMO'
  | 'PENDIENTE';

export type UsuarioAula = {
  id: number;
  rol: RolAula;
  nombres: string;
  apellidoPaterno: string;
};

export type PermisosAula = {
  puedeAdministrar: boolean;
  puedePublicar: boolean;
  puedeCrearForos: boolean;
  puedeCrearTareas: boolean;
  puedeCrearQuizzes: boolean;
  puedeCalificar: boolean;
  puedeVerEstudiantes: boolean;
  puedeComentar: boolean;
  puedeResponderForos: boolean;
  puedeEntregarTareas: boolean;
  puedeResolverQuizzes: boolean;
  puedeVerPropiasCalificaciones: boolean;
};

export type MateriaAula = {
  id: number;
  nombre: string;
  codigo: string;
  semestre: number;
  descripcion: string | null;
  estado: string;
};

export type DocenteAula = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  fotoPerfilUrl: string | null;
};

export type InscripcionAula = {
  id: number;
  estado: string;
  inscritoEn: string;
  retiradoEn: string | null;
} | null;

export type CursoAula = {
  id: number;
  materiaId: number;
  docenteId: number;
  gestion: string;
  paralelo: string;
  semestre: number;
  cupoMaximo: number | null;
  estado: EstadoCursoAula;
  finalizadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  materia: MateriaAula;
  docente: DocenteAula;
  estudiantesInscritos: number;
  cuposDisponibles: number | null;
  estaDisponible: boolean;
};

export type HitoAula = {
  id: number;
  numero: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string;
  puntajeTotal: number;
  puntajeContinua: number;
  puntajeProcesual: number;
  estado: EstadoTemporalHito;
};

export type PlanificacionAula = {
  tienePlanificacion: boolean;
  id: number | null;
  gestion: string | null;
  descripcion: string | null;
  estaActiva: boolean;
  hitoActualId: number | null;
  proximoHitoId: number | null;
  estado: EstadoPlanificacionAula;
  hitos: HitoAula[];
};

export type AulaCursoRespuesta = {
  usuario: UsuarioAula;
  permisos: PermisosAula;
  inscripcion: InscripcionAula;
  curso: CursoAula;
  planificacion: PlanificacionAula;
};

export type HitosCursoRespuesta = {
  curso: {
    id: number;
    gestion: string;
    paralelo: string;
    estado: EstadoCursoAula;
    materia: MateriaAula;
  };
  permisos: PermisosAula;
  planificacion: PlanificacionAula;
};

export type HitoCursoRespuesta = {
  curso: {
    id: number;
    gestion: string;
    paralelo: string;
    estado: EstadoCursoAula;
    materia: MateriaAula;
    docente: DocenteAula;
  };
  permisos: PermisosAula;
  planificacion: {
    id: number | null;
    gestion: string | null;
    estaActiva: boolean;
    estado: EstadoPlanificacionAula;
    hitoActualId: number | null;
    proximoHitoId: number | null;
  };
  hito: HitoAula;
};

export type ErrorApiAula = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};