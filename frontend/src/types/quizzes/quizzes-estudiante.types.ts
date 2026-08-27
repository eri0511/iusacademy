import type {
  AvatarQuizCodigo,
} from './avatar-quiz.types';

export type EstadoQuizEstudiante =
  | 'ESPERANDO'
  | 'CUENTA_REGRESIVA'
  | 'EN_CURSO'
  | 'PAUSADO'
  | 'FINALIZADO';

export type ModalidadQuizEstudiante =
  | 'EN_VIVO'
  | 'PROGRAMADO';

export type DificultadQuizEstudiante =
  | 'FACIL'
  | 'MEDIO'
  | 'DIFICIL'
  | 'MIXTA';

export type ComponenteQuizEstudiante =
  | 'CONTINUA'
  | 'PROCESUAL'
  | null;

export type EstadoParticipanteQuizEstudiante =
  | 'ESPERANDO'
  | 'LISTO'
  | 'EN_CURSO'
  | 'FINALIZADO'
  | 'DESCONECTADO'
  | 'AUSENTE';

export type QuizListadoEstudiante = {
  id: number;
  titulo: string;
  descripcion: string | null;
  dificultad: DificultadQuizEstudiante;
  modalidad: ModalidadQuizEstudiante;
  estado: EstadoQuizEstudiante;
  esCalificable: boolean;
  componente: ComponenteQuizEstudiante;
  hito: {
    id: number;
    codigo: string;
    nombre: string;
  };
  aperturaProgramada: string | null;
  cierreProgramado: string | null;
  salaPublicadaEn: string | null;
  inicioEn: string | null;
  finalizadoEn: string | null;
  resultadosPublicados: boolean;
  _count: {
    preguntas: number;
  };
};

export type ParticipanteQuizEstudiante = {
  estudianteId: number;
  estado: EstadoParticipanteQuizEstudiante;
  avatarCodigo: AvatarQuizCodigo | null;
  ultimaConexionEn: string;
  listoEn: string | null;
  inicioEn: string | null;
  finalizadoEn: string | null;
};

export type OpcionPreguntaQuizEstudiante = {
  id: number;
  texto: string;
  orden: number;
};

export type PreguntaActualQuizEstudiante = {
  id: number;
  enunciado: string;
  tipo:
    | 'OPCION_MULTIPLE'
    | 'VERDADERO_FALSO'
    | 'SELECCION_MULTIPLE';
  dificultad: DificultadQuizEstudiante;
  tiempoSegundos: number | null;
  orden: number;
  opciones: OpcionPreguntaQuizEstudiante[];
};

export type RespuestaActualQuizEstudiante = {
  id: number;
  respondidoEn: string;
  tiempoRespuestaMs: number;
  opcionIds: number[];
};

export type IntentoQuizEstudiante = {
  id: number;
  estado:
    | 'EN_CURSO'
    | 'FINALIZADO'
    | 'ABANDONADO';
};

export type RespuestaPreguntaQuizEstudiante = {
  id: number;
  intentoId: number;
  preguntaId: number;
  respondidoEn: string;
  tiempoRespuestaMs: number;
  puntajeObtenido: number | string;
};

export type QuizDetalleEstudiante = {
  id: number;
  titulo: string;
  descripcion: string | null;
  dificultad: DificultadQuizEstudiante;
  modalidad: ModalidadQuizEstudiante;
  estado: EstadoQuizEstudiante;
  esCalificable: boolean;
  componente: ComponenteQuizEstudiante;
  hito: {
    id: number;
    codigo: string;
    nombre: string;
  };
  cuentaRegresivaSegundos: number;
  aperturaProgramada: string | null;
  cierreProgramado: string | null;
  inicioEn: string | null;
  preguntaActualOrden: number | null;
  preguntaIniciadaEn: string | null;
  preguntaCierraEn: string | null;
  tiempoRestantePreguntaSegundos: number | null;
  tiempoTotalPreguntaSegundos: number | null;
  usarPuntuacionVelocidad: boolean;
  descuentoVelocidadPorPosicion: number;
  puntajeMinimoVelocidad: number;
  resultadosPublicados: boolean;
  participante: ParticipanteQuizEstudiante | null;
  intento: IntentoQuizEstudiante | null;
  preguntaActual: PreguntaActualQuizEstudiante | null;
  respuestaActual: RespuestaActualQuizEstudiante | null;
};

export type RespuestaAccionQuizEstudiante = {
  id?: number;
  estado?: EstadoParticipanteQuizEstudiante;
  listoEn?: string | null;
};


export type ParticipanteLobbyQuizEstudiante = {
  id: number;
  quizId: number;
  estudianteId: number;
  estado: EstadoParticipanteQuizEstudiante;
  estadoVisual: EstadoParticipanteQuizEstudiante;
  avatarCodigo: AvatarQuizCodigo | null;
  conectado: boolean;
  conectadoEn: string;
  listoEn: string | null;
  inicioEn: string | null;
  finalizadoEn: string | null;
  desconectadoEn: string | null;
  ultimaConexionEn: string;
  estudiante: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    fotoPerfilUrl: string | null;
  };
};

export type LobbyQuizEstudiante = {
  totalInscritos: number;
  conectados: number;
  listos: number;
  participantes: ParticipanteLobbyQuizEstudiante[];
};

export type MiResultadoQuizEstudiante = {
  quiz: {
    id: number;
    titulo: string;
    esCalificable: boolean;
    componente: ComponenteQuizEstudiante;
    resultadosPublicados: boolean;
  };
  intento: {
    id: number;
    posicionFinal: number | null;
    respuestasCorrectas: number;
    respuestasIncorrectas: number;
    respuestasOmitidas: number;
    puntajeBruto: number;
    notaBase: number;
    descuentoPosicion: number;
    notaFinal: number;
    tiempoTotalMs: number | null;
    finalizadoEn: string | null;
  };
  preguntas: Array<{
    preguntaId: number;
    orden: number;
    enunciado: string;
    dificultad: DificultadQuizEstudiante;
    explicacion: string | null;
    puntajePregunta: number;
    esCorrecta: boolean | null;
    omitida: boolean;
    tiempoRespuestaMs: number | null;
    puntajeObtenido: number;
    posicionRespuestaCorrecta: number | null;
    descuentoVelocidad: number;
    opcionesSeleccionadas: Array<{
      id: number;
      texto: string;
      orden: number;
    }>;
    opcionesCorrectas: Array<{
      id: number;
      texto: string;
      orden: number;
    }>;
  }>;
};

export type ItemRankingFinalQuizEstudiante = {
  estudianteId: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  fotoPerfilUrl: string | null;
  avatarCodigo: AvatarQuizCodigo | null;
  posicion: number;
  puntaje: number;
  notaFinal: number;
  respuestasCorrectas: number;
  respuestasIncorrectas: number;
  respuestasOmitidas: number;
  tiempoTotalMs: number | null;
  esYo: boolean;
};

export type RankingFinalQuizEstudiante = {
  quiz: {
    id: number;
    titulo: string;
    resultadosPublicados: boolean;
    esCalificable: boolean;
    componente: ComponenteQuizEstudiante;
  };
  miPosicion: number | null;
  ranking: ItemRankingFinalQuizEstudiante[];
};
