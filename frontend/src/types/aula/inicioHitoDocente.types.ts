import type {
  EstadoActividadCalificable,
  OrigenCalificacion,
} from '../calificaciones/calificaciones.types';

export type ResumenRendimientoInicio = {
  promedioSobre100: number;
  aporteExacto: number;
  notaFinal: number;
  maximo: number;
};

export type DistribucionRendimientoInicio = {
  id:
    | 'BAJO'
    | 'REGULAR'
    | 'BUENO'
    | 'DESTACADO'
    | 'SIN_NOTA';
  etiqueta: string;
  cantidad: number;
};

export type ActividadRendimientoInicio = {
  id: number;
  titulo: string;
  origen: OrigenCalificacion;
  componente:
    | 'CONTINUA'
    | 'PROCESUAL';
  estado: EstadoActividadCalificable;
  foroId: number | null;
  tareaId: number | null;
  quizId: number | null;
  promedio: number;
  calificadas: number;
  pendientes: number;
  totalEstudiantes: number;
};

export type EstudianteSeguimientoInicio = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  promedioSobre100: number | null;
  actividadesCalificadas: number;
  actividadesPendientes: number;
};

export type ProximoVencimientoInicio = {
  tipo:
    | 'FORO'
    | 'TAREA'
    | 'QUIZ';
  id: number;
  titulo: string;
  fecha: string;
};

export type InicioHitoDocenteRespuesta = {
  curso: {
    id: number;
    gestion: string;
    paralelo: string;
    estado: string;
    materia: {
      id: number;
      nombre: string;
      codigo: string;
      semestre: number;
      descripcion: string | null;
      estado: string;
    };
  };
  hito: {
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
    estado: string;
  };
  resumen: {
    estudiantesActivos: number;
    publicaciones: number;
    foros: number;
    tareas: number;
    quizzes: number;
    actividadesCalificables: number;
    pendientesCalificar: number;
    calificacionesRegistradas: number;
    calificacionesPublicadas: number;
  };
  rendimiento: {
    continua: ResumenRendimientoInicio;
    procesual: ResumenRendimientoInicio;
    total: {
      aporteExacto: number;
      notaFinal: number;
      maximo: number;
    };
  };
  distribucion: DistribucionRendimientoInicio[];
  actividadesRendimiento: ActividadRendimientoInicio[];
  estudiantesSeguimiento: EstudianteSeguimientoInicio[];
  proximoVencimiento: ProximoVencimientoInicio | null;
};
