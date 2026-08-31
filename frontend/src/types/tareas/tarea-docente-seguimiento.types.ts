export type EstadoEntregaDocente =
  | 'PENDIENTE'
  | 'BORRADOR'
  | 'ENTREGADA'
  | 'TARDIA'
  | 'BLOQUEADA'
  | 'ANULADA';

export type EstudianteTareaDocente = {
  id:
    number;

  nombres:
    string;

  apellidoPaterno:
    string;

  apellidoMaterno:
    string | null;

  correo:
    string;

  fotoPerfilUrl:
    string | null;
};

export type ArchivoEntregaDocente = {
  id:
    number;

  nombreOriginal:
    string;

  mimeType:
    string;

  extension:
    string;

  tamanioBytes:
    number;

  permiteDescarga:
    boolean;

  creadoEn:
    string;
};

export type CalificacionTareaDocente = {
  id:
    number;

  estudianteId:
    number;

  notaBase:
    number | string;

  descuentoRetraso:
    number | string;

  ajusteIndividual:
    number | string;

  notaFinal:
    number | string;

  retroalimentacion:
    string | null;

  estado:
    'PENDIENTE'
    | 'BORRADOR'
    | 'CALIFICADA'
    | 'PUBLICADA'
    | 'ANULADA';

  calificadaEn:
    string | null;

  publicadaEn:
    string | null;
};

export type EntregaTareaDocente = {
  id:
    number;

  estado:
    EstadoEntregaDocente;

  contenido:
    string | null;

  esGrupal:
    boolean;

  entregadaTarde:
    boolean;

  minutosRetraso:
    number;

  descuentoCalculado:
    number | string;

  enviadaEn:
    string | null;

  editadaEn:
    string | null;

  creadoEn:
    string;

  grupoCursoId:
    number | null;

  equipoAfinidadTareaId:
    number | null;

  archivos:
    ArchivoEntregaDocente[];

  autorEntrega: {
    id:
      number;

    nombres:
      string;

    apellidoPaterno:
      string;
  };

  calificaciones:
    Array<
      CalificacionTareaDocente & {
        estudiante: {
          id:
            number;

          nombres:
            string;

          apellidoPaterno:
            string;

          apellidoMaterno:
            string | null;
        };
      }
    >;
};

export type EvaluableTareaDocente = {
  clave:
    string;

  tipo:
    'ESTUDIANTE'
    | 'GRUPO';

  nombre:
    string;

  estudiantes:
    EstudianteTareaDocente[];

  integrantes?:
    Array<{
      estudiante:
        EstudianteTareaDocente;

      esRepresentante:
        boolean;
    }>;

  estadoEquipo?:
    string;

  entrega:
    EntregaTareaDocente | null;

  calificacion:
    CalificacionTareaDocente | null;
};

export type EquipoTareaDocente = {
  id:
    number;

  tipo:
    'PLATAFORMA'
    | 'AFINIDAD';

  nombre:
    string;

  estado:
    string;

  entregaId:
    number | null;

  estadoEntrega:
    EstadoEntregaDocente;

  integrantes:
    Array<{
      estudiante:
        EstudianteTareaDocente;

      esRepresentante:
        boolean;
    }>;
};

export type FilaCalificacionTarea = {
  estudiante:
    EstudianteTareaDocente;

  grupo: {
    id:
      number;

    nombre:
      string;

    tipo:
      'PLATAFORMA'
      | 'AFINIDAD';
  } | null;

  entrega: {
    id:
      number;

    estado:
      EstadoEntregaDocente;

    enviadaEn:
      string | null;

    entregadaTarde:
      boolean;
  } | null;

  calificacion:
    CalificacionTareaDocente | null;
};

export type PanelEvaluacionTarea = {
  tarea: {
    id:
      number;

    titulo:
      string;

    modalidad:
      'INDIVIDUAL'
      | 'GRUPAL';

    origenGrupo:
      'NINGUNO'
      | 'PLATAFORMA'
      | 'AFINIDAD';

    modalidadNota:
      'INDIVIDUAL'
      | 'GRUPAL'
      | 'GRUPAL_E_INDIVIDUAL';

    componente:
      'CONTINUA'
      | 'PROCESUAL';

    puntajeMaximo:
      number | string;

    esCalificable:
      boolean;

    actividadCalificableId:
      number | null;

    estadoActividadCalificable:
      string | null;
  };

  resumen: {
    totalEstudiantes:
      number;

    totalEntregas:
      number;

    entregadas:
      number;

    tardias:
      number;

    pendientes:
      number;

    calificadas:
      number;

    publicadas:
      number;

    puntuales:
      number;

    fueraDePlazo:
      number;

    promedioNota:
      number | null;
  };

  evaluables:
    EvaluableTareaDocente[];

  calificaciones:
    FilaCalificacionTarea[];

  equipos:
    EquipoTareaDocente[];
};

export type EventoHistorialTarea = {
  id:
    string;

  tipo:
    string;

  titulo:
    string;

  descripcion:
    string;

  fecha:
    string;

  actor?: {
    id:
      number;

    nombres:
      string;

    apellidoPaterno:
      string;

    rol:
      string;
  };
};

export type RespuestaHistorialTarea = {
  total:
    number;

  eventos:
    EventoHistorialTarea[];
};


export type IntegranteRevisionTarea = {
  esRepresentante:
    boolean;

  estudiante:
    EstudianteTareaDocente;
};

export type RevisionEntregaTareaDocente = {
  tarea: {
    id:
      number;

    cursoId:
      number;

    titulo:
      string;

    descripcion:
      string | null;

    tipo:
      string;

    modalidad:
      'INDIVIDUAL'
      | 'GRUPAL';

    modalidadNota:
      'INDIVIDUAL'
      | 'GRUPAL'
      | 'GRUPAL_E_INDIVIDUAL';

    componente:
      'CONTINUA'
      | 'PROCESUAL';

    puntajeMaximo:
      number;

    esCalificable:
      boolean;

    configuracionTipo:
      Record<string, unknown> | null;
  };

  entrega: {
    id:
      number;

    estado:
      EstadoEntregaDocente;

    contenido:
      string | null;

    esGrupal:
      boolean;

    entregadaTarde:
      boolean;

    minutosRetraso:
      number;

    descuentoCalculado:
      number;

    enviadaEn:
      string | null;

    editadaEn:
      string | null;

    creadoEn:
      string;

    archivos:
      ArchivoEntregaDocente[];

    autorEntrega: {
      id:
        number;

      nombres:
        string;

      apellidoPaterno:
        string;

      apellidoMaterno:
        string | null;

      fotoPerfilUrl:
        string | null;
    };

    calificaciones:
      Array<
        CalificacionTareaDocente & {
          estudiante: {
            id:
              number;

            nombres:
              string;

            apellidoPaterno:
              string;

            apellidoMaterno:
              string | null;

            fotoPerfilUrl:
              string | null;
          };
        }
      >;
  };

  sujeto:
    | {
        tipo:
          'GRUPO';

        id:
          number;

        nombre:
          string;

        origen:
          'PLATAFORMA'
          | 'AFINIDAD';

        estado:
          string;

        representante:
          EstudianteTareaDocente | null;

        integrantes:
          IntegranteRevisionTarea[];
      }
    | {
        tipo:
          'ESTUDIANTE';

        id:
          number;

        nombre:
          string;

        estudiante:
          EstudianteTareaDocente | null;
      };
};
