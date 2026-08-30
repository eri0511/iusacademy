export type OrigenInicioEstudiante =
  | 'FORO'
  | 'TAREA'
  | 'QUIZ';

export type ComponenteInicioEstudiante =
  | 'CONTINUA'
  | 'PROCESUAL';

export type ResumenComponenteInicioEstudiante = {
  promedioSobre100: number;
  aporteExacto: number;
  notaFinal: number;
  maximo: number;
  actividadesPublicadas: number;
};

export type ProximaActividadInicioEstudiante = {
  id: string;
  origen: OrigenInicioEstudiante;
  referenciaId: number;
  titulo: string;
  fecha: string;
  estado: string;
};

export type CalificacionRecienteInicioEstudiante = {
  id: number;
  titulo: string;
  origen: OrigenInicioEstudiante;
  componente: ComponenteInicioEstudiante;
  foroId: number | null;
  tareaId: number | null;
  quizId: number | null;
  nota: number;
  publicadaEn: string | null;
};

export type InicioHitoEstudianteRespuesta = {
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
    publicaciones: number;
    foros: number;
    tareas: number;
    quizzes: number;
    actividades: number;
    calificacionesPublicadas: number;
    aporteAcumulado: number;
    notaAcumulada: number;
    maximoHito: number;
  };

  rendimiento: {
    continua: ResumenComponenteInicioEstudiante;
    procesual: ResumenComponenteInicioEstudiante;
    total: {
      aporteExacto: number;
      notaFinal: number;
      maximo: number;
    };
  };

  proximoVencimiento: ProximaActividadInicioEstudiante | null;
  proximasActividades: ProximaActividadInicioEstudiante[];
  calificacionesRecientes: CalificacionRecienteInicioEstudiante[];
};
