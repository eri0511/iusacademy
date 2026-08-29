export type DificultadQuiz = 'FACIL' | 'MEDIO' | 'DIFICIL' | 'MIXTA';
export type ModalidadQuiz = 'EN_VIVO' | 'PROGRAMADO';
export type EstadoQuiz = 'BORRADOR' | 'ESPERANDO' | 'CUENTA_REGRESIVA' | 'EN_CURSO' | 'PAUSADO' | 'FINALIZADO' | 'CANCELADO';
export type RitmoQuiz = 'AUTOMATICO' | 'CONTROL_DOCENTE';
export type ModoTiempoQuiz = 'FIJO' | 'AUTOMATICO_DIFICULTAD';
export type ComponenteEvaluacion = 'CONTINUA' | 'PROCESUAL';
export type CriterioRankingQuiz = 'PUNTAJE_Y_TIEMPO' | 'SOLO_TIEMPO';
export type TipoPreguntaQuiz = 'OPCION_MULTIPLE' | 'VERDADERO_FALSO' | 'SELECCION_MULTIPLE';
export type OrigenPreguntaQuiz = 'GENERADA' | 'MANUAL';

export type HitoQuiz = {
  id: number;
  numero: number;
  codigo: string;
  nombre: string;
};

export type FragmentoQuiz = {
  id: number;
  fuenteId: number;
  tituloReferencia: string | null;
  tipoReferencia: string | null;
  paginaInicio: number | null;
  paginaFin: number | null;
  texto: string;
  orden: number;
};

export type FuenteQuiz = {
  id: number;
  quizId: number;
  versionId: number;
  orden: number;
  tituloSnapshot: string | null;
  nombreArchivoSnapshot: string | null;
  numeroVersionSnapshot: number | null;
  fragmentos?: FragmentoQuiz[];
  version?: {
    id: number;
    numeroVersion: number;
    archivo?: {
      id: number;
      nombreOriginal: string;
      extension: string;
      mimeType: string;
      tamanioBytes: number;
      hashSha256?: string | null;
      textoExtraido?: string | null;
    };
    contenido?: {
      id: number;
      titulo: string;
      recurso?: {
        id: number;
        titulo: string;
      };
    };
  };
};

export type QuizCurso = {
  id: number;
  cursoId: number;
  hitoId: number;
  creadorId: number;
  titulo: string;
  descripcion: string | null;
  dificultad: DificultadQuiz;
  esCalificable: boolean;
  componente: ComponenteEvaluacion | null;
  modalidad: ModalidadQuiz;
  estado: EstadoQuiz;
  ritmo: RitmoQuiz;
  modoTiempo: ModoTiempoQuiz;
  tiempoPreguntaSegundos: number;
  tiempoFacilSegundos: number;
  tiempoMedioSegundos: number;
  tiempoDificilSegundos: number;
  cantidadPreguntas: number;
  puntajeMaximo: number | string;
  usarRanking: boolean;
  criterioRanking: CriterioRankingQuiz;
  descuentoPorPuesto: number | string;
  puntajeMinimoRanking: number | string;
  usarPuntuacionVelocidad: boolean;
  descuentoVelocidadPorPosicion: number | string;
  puntajeMinimoVelocidad: number | string;
  permiteInicioConAusentes: boolean;
  cuentaRegresivaSegundos: number;
  aperturaProgramada: string | null;
  cierreProgramado: string | null;
  salaPublicadaEn: string | null;
  inicioEn: string | null;
  finalizadoEn: string | null;
  preguntaActualOrden: number | null;
  preguntaIniciadaEn: string | null;
  preguntaCierraEn: string | null;
  tiempoRestantePreguntaSegundos: number | null;
  resultadosPublicados: boolean;
  hito: HitoQuiz;
  fuentes?: FuenteQuiz[];
  preguntas?: PreguntaQuiz[];
  _count?: {
    preguntas: number;
  };
};

export type DatasetQuiz = {
  recursoId: number;
  recursoTitulo: string;
  recursoUso: 'AULA_Y_QUIZZES' | 'SOLO_QUIZZES';
  recursoAlcance: 'CURSO' | 'HITO';
  hito: HitoQuiz | null;
  contenidoId: number;
  contenidoTitulo: string;
  versionId: number;
  numeroVersion: number;
  archivo: {
    id: number;
    nombreOriginal: string;
    extension: string;
    mimeType: string;
    tamanioBytes: number;
    textoExtraido?: string | null;
    hashSha256?: string | null;
  };
};

export type ResultadoBusquedaDataset = {
  indice: number;
  tipo: string;
  titulo: string;
  texto: string;
  puntaje: number;
  vistaPrevia: string;
};

export type AnalisisDataset = {
  versionId: number;
  numeroVersion: number;
  archivo: {
    id: number;
    nombre: string;
    extension: string;
    tamanioBytes: number;
  };
  recurso: {
    id: number;
    titulo: string;
    alcance: string;
    hito: HitoQuiz | null;
  };
  contenido: {
    id: number;
    titulo: string;
  };
  estadisticas: {
    caracteres: number;
    palabras: number;
    bloques: number;
    articulos: number;
    titulos: number;
    capitulos: number;
    secciones: number;
    libros: number;
  };
  estructura: Array<{
    indice: number;
    tipo: string;
    titulo: string;
    vistaPrevia: string;
  }>;
};

export type OpcionBorradorPregunta = {
  texto: string;
  esCorrecta: boolean;
  orden: number;
};

export type BorradorPreguntaQuiz = {
  fragmentoId: number;
  enunciado: string;
  tipo: TipoPreguntaQuiz;
  dificultad: DificultadQuiz;
  origen: OrigenPreguntaQuiz;
  explicacion: string | null;
  tiempoSegundos: number | null;
  puntaje: number;
  orden: number;
  opciones: OpcionBorradorPregunta[];
};

export type OpcionPreguntaQuiz = OpcionBorradorPregunta & {
  id: number;
  preguntaId?: number;
};

export type PreguntaQuiz = Omit<
  BorradorPreguntaQuiz,
  'opciones'
> & {
  id: number;
  quizId?: number;
  opciones: OpcionPreguntaQuiz[];
};

export type CrearQuizDatos = {
  titulo: string;
  descripcion?: string;
  hitoId: number;
  dificultad: DificultadQuiz;
  esCalificable: boolean;
  componente?: ComponenteEvaluacion;
  modalidad: ModalidadQuiz;
  ritmo: RitmoQuiz;
  modoTiempo: ModoTiempoQuiz;
  tiempoPreguntaSegundos: number;
  tiempoFacilSegundos: number;
  tiempoMedioSegundos: number;
  tiempoDificilSegundos: number;
  cantidadPreguntas: number;
  puntajeMaximo: number;
  usarRanking: boolean;
  criterioRanking: CriterioRankingQuiz;
  descuentoPorPuesto: number;
  puntajeMinimoRanking: number;
  usarPuntuacionVelocidad: boolean;
  descuentoVelocidadPorPosicion: number;
  puntajeMinimoVelocidad: number;
  permiteInicioConAusentes: boolean;
  cuentaRegresivaSegundos: number;
  aperturaProgramada?: string;
  cierreProgramado?: string;
};

export type EstadoParticipanteQuiz =
  | 'CONECTADO'
  | 'ESPERANDO'
  | 'LISTO'
  | 'EN_CURSO'
  | 'FINALIZADO'
  | 'DESCONECTADO';

export type ParticipanteLobbyQuiz = {
  id: number;
  quizId: number;
  estudianteId: number;
  estado: EstadoParticipanteQuiz;
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

export type LobbyQuiz = {
  totalInscritos: number;
  conectados: number;
  listos: number;
  participantes: ParticipanteLobbyQuiz[];
};

export type ResultadoDocenteQuiz = {
  quiz: {
    id: number;
    titulo: string;
    estado: EstadoQuiz;
    esCalificable: boolean;
    componente: ComponenteEvaluacion | null;
    usarRanking: boolean;
    descuentoPorPuesto: number | string;
    puntajeMinimoRanking: number | string;
    usarPuntuacionVelocidad: boolean;
    descuentoVelocidadPorPosicion: number | string;
    puntajeMinimoVelocidad: number | string;
    resultadosPublicados: boolean;
  };
  totalInscritos: number;
  totalParticiparon: number;
  intentos: Array<{
    id: number | null;
    estudianteId: number;
    participo: boolean;
    posicionFinal: number | null;
    respuestasCorrectas: number;
    respuestasIncorrectas: number;
    respuestasOmitidas: number;
    puntajeBruto: number | string;
    notaBase: number | string;
    descuentoPosicion: number | string;
    notaFinal: number | string;
    tiempoTotalMs: number | null;
    finalizadoEn: string | null;
    estudiante: {
      id: number;
      nombres: string;
      apellidoPaterno: string;
      apellidoMaterno: string | null;
      fotoPerfilUrl: string | null;
    };
  }>;
};

export type ItemRankingEnVivoQuiz = {
  estudianteId: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  fotoPerfilUrl: string | null;
  conectado: boolean;
  estadoParticipante: EstadoParticipanteQuiz;
  puntajeActual: number;
  notaActual: number;
  respuestasCorrectas: number;
  respuestasIncorrectas: number;
  respuestasOmitidas: number;
  tiempoAcumuladoMs: number;
  posicion: number;
};

export type EstadoEnVivoQuiz = {
  quizId: number;
  estado: EstadoQuiz;
  preguntaActualOrden: number | null;
  preguntaId?: number;
  totalPreguntas: number;
  totalParticipantes: number;
  respondieron: number;
  correctas: number;
  incorrectas: number;
  pendientes: number;
  preguntaCierraEn: string | null;
  tiempoRestanteSegundos: number | null;
  ranking: ItemRankingEnVivoQuiz[];
};

export type DetalleResultadoEstudianteQuiz = {
  quiz: {
    id: number;
    titulo: string;
    esCalificable: boolean;
    componente: ComponenteEvaluacion | null;
    resultadosPublicados: boolean;
  };
  estudiante: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    fotoPerfilUrl: string | null;
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
    dificultad: DificultadQuiz;
    esCorrecta: boolean | null;
    omitida: boolean;
    tiempoRespuestaMs: number | null;
    puntajeObtenido: number;
    puntajePregunta: number;
    opcionesSeleccionadas: Array<{
      id: number;
      texto: string;
    }>;
    opcionesCorrectas: Array<{
      id: number;
      texto: string;
    }>;
    explicacion: string | null;
  }>;
};
