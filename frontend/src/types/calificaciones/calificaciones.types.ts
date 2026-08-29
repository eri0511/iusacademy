export type ComponenteCalificacion =
  | 'CONTINUA'
  | 'PROCESUAL';

export type OrigenCalificacion =
  | 'FORO'
  | 'TAREA'
  | 'QUIZ';

export type EstadoActividadCalificable =
  | 'BORRADOR'
  | 'ACTIVA'
  | 'CALIFICANDO'
  | 'CERRADA'
  | 'PUBLICADA'
  | 'ANULADA';

export type EstadoCalificacion =
  | 'PENDIENTE'
  | 'BORRADOR'
  | 'CALIFICADA'
  | 'PUBLICADA'
  | 'ANULADA';

export type HitoCalificaciones = {
  id: number;
  numero: number;
  codigo: string;
  nombre: string;
  puntajeContinua: number;
  puntajeProcesual: number;
  fechaInicio: string;
  fechaFin: string;
};

export type CursoCalificaciones = {
  id: number;
  estado?: string;
  planificacionId?: number | null;
  materia: {
    id?: number;
    nombre: string;
    codigo: string;
  };
};

export type CalificacionLibro = {
  id: number;
  estudianteId: number;
  notaBase: number;
  descuentoRetraso: number;
  ajusteIndividual: number;
  notaFinal: number;
  retroalimentacion: string | null;
  estado: EstadoCalificacion;
  publicadaEn: string | null;
};

export type ResumenActividadLibro = {
  totalEstudiantes: number;
  calificadas: number;
  publicadas: number;
  pendientes: number;
  promedio: number;
};

export type ActividadLibroDocente = {
  id: number;
  titulo: string;
  descripcion: string | null;
  foroId: number | null;
  tareaId: number | null;
  quizId: number | null;
  origen: OrigenCalificacion;
  componente: ComponenteCalificacion;
  estado: EstadoActividadCalificable;
  participaEnPromedio: boolean;
  visibleParaEstudiantes: boolean;
  orden: number;
  calificaciones: CalificacionLibro[];
  resumen: ResumenActividadLibro;
};

export type ResumenComponenteDocente = {
  actividadesTotales: number;
  actividadesCalificadas: number;
  actividadesPendientes: number;
  promedioSobre100: number;
  promedioRedondeado: number;
  maximo: number;
  notaExacta: number;
  notaRedondeada: number;
};

export type EstudianteLibro = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  fotoPerfilUrl: string | null;
  continua: ResumenComponenteDocente;
  procesual: ResumenComponenteDocente;
};

export type LibroCalificacionesDocente = {
  curso: CursoCalificaciones;
  hito: HitoCalificaciones;
  actividades: ActividadLibroDocente[];
  estudiantes: EstudianteLibro[];
};

export type CalificacionEstudiante = {
  id: number;
  notaBase: number;
  descuentoRetraso: number;
  ajusteIndividual: number;
  notaFinal: number;
  retroalimentacion: string | null;
  estado: 'PUBLICADA';
  publicadaEn: string | null;
};

export type ActividadCalificacionEstudiante = {
  id: number;
  titulo: string;
  descripcion: string | null;
  foroId: number | null;
  tareaId: number | null;
  quizId: number | null;
  origen: OrigenCalificacion;
  componente: ComponenteCalificacion;
  estado: 'PUBLICADA';
  participaEnPromedio: boolean;
  calificacion: CalificacionEstudiante | null;
};

export type ResumenComponenteEstudiante = {
  actividadesCalificadas: number;
  promedioSobre100: number;
  promedioRedondeado: number;
  maximo: number;
  notaExacta: number;
  notaRedondeada: number;
};

export type ComponenteEstudiante = {
  actividades: ActividadCalificacionEstudiante[];
  resumen: ResumenComponenteEstudiante;
};

export type MisCalificacionesRespuesta = {
  curso: CursoCalificaciones;
  hito: HitoCalificaciones;
  continua: ComponenteEstudiante;
  procesual: ComponenteEstudiante;
  totalHitoExacto: number;
  totalHito: number;
  maximoHito: number;
};
