export type RolUsuario =
  | 'ADMINISTRADOR'
  | 'DOCENTE'
  | 'ESTUDIANTE';

export type EstadoCurso =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'FINALIZADO';

export type EstadoInscripcion =
  | 'ACTIVA'
  | 'RETIRADA';

export type TipoPublicacionCurso =
  | 'AVISO_GENERAL'
  | 'LECTURA_OBLIGATORIA'
  | 'EXAMEN'
  | 'PRESENTACION_PROYECTO'
  | 'ENTREGA_PROYECTO'
  | 'MATERIAL_COMPLEMENTARIO'
  | 'JURISPRUDENCIA'
  | 'CLASE_VIRTUAL'
  | 'CAMBIO_HORARIO'
  | 'RECORDATORIO'
  | 'FELICITACION'
  | 'OTRO';

export type PrioridadPublicacion =
  | 'INFORMATIVA'
  | 'MEDIA'
  | 'ALTA'
  | 'URGENTE';

export type AutorComunicacionCurso = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  fotoPerfilUrl: string | null;
  rol: RolUsuario;
};

export type MateriaComunicacionCurso = {
  id: number;
  nombre: string;
  codigo: string;
  semestre?: number;
  descripcion?: string | null;
};

export type DocenteComunicacionCurso = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  fotoPerfilUrl: string | null;
};

export type CursoComunicacion = {
  id: number;
  docenteId?: number;
  planificacionId?: number | null;
  gestion: string;
  paralelo: string;
  semestre: number;
  estado: EstadoCurso;
  finalizadoEn: string | null;
  materia: MateriaComunicacionCurso;
  docente?: DocenteComunicacionCurso;
};

export type InscripcionComunicacion = {
  id: number;
  estado: EstadoInscripcion;
  inscritoEn: string;
};

export type HitoComunicacion = {
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
};

export type PermisosTablon = {
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeComentar: boolean;
};

export type PublicacionCurso = {
  id: number;
  cursoId: number;
  hitoId: number | null;
  autorId: number;

  tipo: TipoPublicacionCurso;
  prioridad: PrioridadPublicacion;

  titulo: string;
  contenido: string;

  referencia: string | null;
  lugar: string | null;
  enlace: string | null;

  fechaEventoInicio: string | null;
  fechaEventoFin: string | null;

  estaFijada: boolean;
  estaActiva: boolean;

  comentariosHabilitados: boolean;
  visibleParaEstudiantes: boolean;

  notificarAlPublicar: boolean;
  recordarUnDiaAntes: boolean;
  recordarUnaHoraAntes: boolean;
  agregarAlCalendario: boolean;

  publicadoEn: string;
  editadoEn: string | null;
  eliminadoEn: string | null;

  creadoEn: string;
  actualizadoEn: string;

  autor: AutorComunicacionCurso;
};

export type ComentarioPublicacion = {
  id: number;
  publicacionId: number;
  autorId: number;
  contenido: string;
  estaActivo: boolean;
  publicadoEn: string;
  editadoEn: string | null;
  eliminadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  autor: AutorComunicacionCurso;
};

export type LecturaPublicacion = {
  id: number;
  leidoEn: string;
  creadoEn: string;
  actualizadoEn: string;
  usuario: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    correo: string;
    fotoPerfilUrl: string | null;
    ultimoAccesoEn: string | null;
    estaActivo: boolean;
    cuentaActivada: boolean;
  };
};

export type ResumenLecturasPublicacion = {
  totalEstudiantes: number;
  totalLecturas: number;
  totalPendientes: number;
  porcentajeLectura: number;
};

export type RespuestaLecturasPublicacion = {
  publicacion: {
    id: number;
    titulo: string;
    publicadoEn: string;
  };
  resumen: ResumenLecturasPublicacion;
  lecturas: LecturaPublicacion[];
};

export type TemaForoCurso = {
  id: number;
  cursoId: number;
  hitoId: number | null;
  autorId: number;
  titulo: string;
  contenido: string;
  estaFijado: boolean;
  estaCerrado: boolean;
  estaActivo: boolean;
  fechaVencimiento?: string | null;
  publicadoEn: string;
  editadoEn: string | null;
  eliminadoEn?: string | null;
  creadoEn: string;
  actualizadoEn: string;
  autor: AutorComunicacionCurso;
  totalRespuestas: number;
};

export type RespuestaForoCurso = {
  id: number;
  temaId: number;
  autorId: number;
  contenido: string;
  estaActiva: boolean;
  publicadoEn: string;
  editadoEn: string | null;
  eliminadoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  autor: AutorComunicacionCurso;
};

export type RespuestaTablonAula = {
  curso: CursoComunicacion;
  hito: HitoComunicacion;
  inscripcion: InscripcionComunicacion | null;
  permisos: PermisosTablon;
  total: number;
  publicaciones: PublicacionCurso[];
};

/*
 * Alias temporales para mantener compatibilidad mientras
 * terminamos de migrar componentes antiguos.
 */
export type RespuestaTablonDocente =
  RespuestaTablonAula;

export type RespuestaTablonEstudiante =
  RespuestaTablonAula;

export type RespuestaComentarios = {
  publicacion: {
    id: number;
    titulo: string;
    comentariosHabilitados: boolean;
  };
  total: number;
  comentarios: ComentarioPublicacion[];
};

export type RespuestaTemasForo = {
  curso: CursoComunicacion;
  inscripcion: InscripcionComunicacion | null;
  total: number;
  temas: TemaForoCurso[];
};

export type RespuestaDetalleTemaForo = {
  curso: CursoComunicacion;
  inscripcion: InscripcionComunicacion | null;
  tema: TemaForoCurso;
  respuestas: RespuestaForoCurso[];
};

export type CrearPublicacionDatos = {
  tipo: TipoPublicacionCurso;
  prioridad: PrioridadPublicacion;

  titulo: string;
  contenido: string;

  referencia?: string;
  lugar?: string;
  enlace?: string;

  fechaEventoInicio?: string;
  fechaEventoFin?: string;

  estaFijada?: boolean;
  comentariosHabilitados?: boolean;
  visibleParaEstudiantes?: boolean;

  notificarAlPublicar?: boolean;
  recordarUnDiaAntes?: boolean;
  recordarUnaHoraAntes?: boolean;
  agregarAlCalendario?: boolean;
};

export type ActualizarPublicacionDatos = {
  tipo?: TipoPublicacionCurso;
  prioridad?: PrioridadPublicacion;

  titulo?: string;
  contenido?: string;

  referencia?: string | null;
  lugar?: string | null;
  enlace?: string | null;

  fechaEventoInicio?: string | null;
  fechaEventoFin?: string | null;

  comentariosHabilitados?: boolean;

  notificarAlPublicar?: boolean;
  recordarUnDiaAntes?: boolean;
  recordarUnaHoraAntes?: boolean;
  agregarAlCalendario?: boolean;
};

export type CrearComentarioDatos = {
  contenido: string;
};

export type ActualizarComentarioDatos = {
  contenido: string;
};

export type CrearTemaForoDatos = {
  titulo: string;
  contenido: string;
  fechaVencimiento?: string | null;
};

export type ActualizarTemaForoDatos = {
  titulo?: string;
  contenido?: string;
  fechaVencimiento?: string | null;
};

export type CrearRespuestaForoDatos = {
  contenido: string;
};

export type ActualizarRespuestaForoDatos = {
  contenido: string;
};

export type RespuestaPublicacionAccion = {
  mensaje: string;
  publicacion: PublicacionCurso;
};

export type RespuestaComentarioAccion = {
  mensaje: string;
  comentario: ComentarioPublicacion;
};

export type RespuestaTemaForoAccion = {
  mensaje: string;
  tema: TemaForoCurso;
};

export type RespuestaRespuestaForoAccion = {
  mensaje: string;
  respuesta: RespuestaForoCurso;
};

export type RespuestaRegistrarLectura = {
  mensaje: string;
  lectura: {
    id: number;
    publicacionId: number;
    usuarioId: number;
    leidoEn: string;
    creadoEn: string;
    actualizadoEn: string;
  };
};

export type RespuestaErrorApi = {
  statusCode?: number;
  message?: string | string[];
  mensaje?: string;
  error?: string;
};