import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileSearch,
  Gauge,
  Info,
  ListOrdered,
  Minus,
  Plus,
  Radio,
  Search,
  Type,
  Sparkles,
  Trophy,
  WandSparkles,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import AulaLoadingOverlay from '../aula/AulaLoadingOverlay';
import AulaModal from '../aula/AulaModal';

import type {
  TipoToast,
} from '../shared/Toast';

import {
  agregarFuenteQuiz,
  actualizarQuiz,
  buscarDatasetQuiz,
  crearQuiz,
  eliminarPreguntaQuiz,
  generarBorradorQuiz,
  guardarPreguntaQuiz,
  listarDatasetsQuiz,
  obtenerQuiz,
  publicarSalaQuiz,
  seleccionarFragmentosQuiz,
} from '../../services/quizzes/quizzes.service';

import type {
  BorradorPreguntaQuiz,
  ComponenteEvaluacion,
  DatasetQuiz,
  DificultadQuiz,
  FragmentoQuiz,
  FuenteQuiz,
  ModalidadQuiz,
  ModoTiempoQuiz,
  ResultadoBusquedaDataset,
  RitmoQuiz,
  TipoPreguntaQuiz,
} from '../../types/quizzes/quizzes.types';

type PasoFormulario =
  | 1
  | 2
  | 3
  | 4
  | 5;

type ModoBusquedaContenido =
  | 'PALABRA'
  | 'RANGO_ARTICULOS';


type TemaAyudaQuiz =
  | 'dificultad'
  | 'modalidad'
  | 'modoTiempo'
  | 'ritmo'
  | 'programacion'
  | 'componente'
  | 'ranking'
  | 'puntuacionVelocidad';

type Hito = {
  id: number;
  codigo: string;
  nombre: string;
};

type Props = {
  abierto: boolean;
  cursoId: number;
  accessToken: string;
  hitos: Hito[];
  hitoInicialId: number | null;
  quizInicialId?: number | null;
  onCerrar: () => void;
  onCompletado: () => void;
  onToast: (
    tipo: TipoToast,
    titulo: string,
    mensaje?: string,
  ) => void;
};

type EstadoFormulario = {
  titulo: string;
  descripcion: string;
  hitoId: number | null;
  dificultad: DificultadQuiz;
  cantidadPreguntas: number;
  modalidad: ModalidadQuiz;
  fechaApertura: string;
  horaApertura: string;
  cierreAutomatico: boolean;
  fechaCierre: string;
  horaCierre: string;
  ritmo: RitmoQuiz;
  modoTiempo: ModoTiempoQuiz;
  tiempoPreguntaSegundos: number;
  tiempoFacilSegundos: number;
  tiempoMedioSegundos: number;
  tiempoDificilSegundos: number;
  esCalificable: boolean;
  componente: ComponenteEvaluacion | null;
  usarRanking: boolean;
  usarPuntuacionVelocidad: boolean;
  descuentoVelocidadPorPosicion: number;
  puntajeMinimoVelocidad: number;
  permiteInicioConAusentes: boolean;
};

const crearInicial = (
  hitoId: number | null,
): EstadoFormulario => ({
  titulo: '',
  descripcion: '',
  hitoId,
  dificultad: 'MEDIO',
  cantidadPreguntas: 10,
  modalidad: 'EN_VIVO',
  fechaApertura: '',
  horaApertura: '',
  cierreAutomatico: false,
  fechaCierre: '',
  horaCierre: '',
  ritmo: 'CONTROL_DOCENTE',
  modoTiempo: 'FIJO',
  tiempoPreguntaSegundos: 20,
  tiempoFacilSegundos: 20,
  tiempoMedioSegundos: 30,
  tiempoDificilSegundos: 45,
  esCalificable: true,
  componente: 'CONTINUA',
  usarRanking: false,
  usarPuntuacionVelocidad: false,
  descuentoVelocidadPorPosicion: 1,
  puntajeMinimoVelocidad: 5,
  permiteInicioConAusentes: true,
});

function formatearPuntajePregunta(
  valor:
    number,
) {
  return Number.isInteger(
    valor,
  )
    ? String(
        valor,
      )
    : valor.toFixed(
        2,
      );
}

function ContadorNumero({
  etiqueta,
  valor,
  minimo,
  maximo,
  paso = 1,
  onChange,
}: {
  etiqueta: string;
  valor: number;
  minimo: number;
  maximo: number;
  paso?: number;
  onChange: (valor: number) => void;
}) {
  const cambiar = (
    direccion: -1 | 1,
  ) => {
    onChange(
      Math.min(
        maximo,
        Math.max(
          minimo,
          valor +
            direccion *
              paso,
        ),
      ),
    );
  };

  return (
    <div className="crear-quiz-contador">
      <span>
        {etiqueta}
      </span>

      <div>
        <button
          type="button"
          disabled={
            valor <= minimo
          }
          onClick={() =>
            cambiar(
              -1,
            )
          }
        >
          <Minus
            size={
              15
            }
          />
        </button>

        <strong>
          {valor}
        </strong>

        <button
          type="button"
          disabled={
            valor >= maximo
          }
          onClick={() =>
            cambiar(
              1,
            )
          }
        >
          <Plus
            size={
              15
            }
          />
        </button>
      </div>
    </div>
  );
}

function BotonAyudaQuiz({
  tema,
  etiqueta,
  onAbrir,
}: {
  tema: TemaAyudaQuiz;
  etiqueta: string;
  onAbrir: (tema: TemaAyudaQuiz) => void;
}) {
  return (
    <button
      type="button"
      className="crear-quiz-ayuda-boton"
      aria-label={`Ayuda sobre ${etiqueta}`}
      title={`¿Qué significa ${etiqueta}?`}
      onClick={(
        evento,
      ) => {
        evento.preventDefault();
        evento.stopPropagation();
        onAbrir(
          tema,
        );
      }}
    >
      ?
    </button>
  );
}

function SwitchQuizConAyuda({
  activo,
  titulo,
  descripcion,
  tema,
  etiquetaAyuda,
  onChange,
  onAbrirAyuda,
}: {
  activo: boolean;
  titulo: string;
  descripcion: string;
  tema?: TemaAyudaQuiz;
  etiquetaAyuda?: string;
  onChange: (activo: boolean) => void;
  onAbrirAyuda?: (tema: TemaAyudaQuiz) => void;
}) {
  return (
    <div className="crear-quiz-switch-con-ayuda">
      <label className="crear-quiz-switch">
        <span>
          <strong>
            {titulo}
          </strong>

          <small>
            {descripcion}
          </small>
        </span>

        <input
          type="checkbox"
          checked={
            activo
          }
          onChange={(
            evento,
          ) =>
            onChange(
              evento.target.checked,
            )
          }
        />

        <i>
          <b />
        </i>
      </label>

      {tema && (
        <BotonAyudaQuiz
          tema={
            tema
          }
          etiqueta={
            etiquetaAyuda ??
            titulo
          }
          onAbrir={
            onAbrirAyuda ??
            (() => undefined)
          }
        />
      )}
    </div>
  );
}

export default function FormularioQuizInteligente({
  abierto,
  cursoId,
  accessToken,
  hitos,
  hitoInicialId,
  quizInicialId = null,
  onCerrar,
  onCompletado,
  onToast,
}: Props) {
  const contenidoRef =
    useRef<HTMLDivElement>(
      null,
    );

  const [
    paso,
    setPaso,
  ] =
    useState<PasoFormulario>(
      1,
    );

  const [
    temaAyuda,
    setTemaAyuda,
  ] =
    useState<TemaAyudaQuiz | null>(
      null,
    );

  const [
    datos,
    setDatos,
  ] =
    useState<EstadoFormulario>(
      crearInicial(
        hitoInicialId,
      ),
    );


  const puntajeMaximoQuiz =
    100;

  const valorPorPregunta =
    useMemo(
      () =>
        Math.max(
          1,
          Math.round(
            puntajeMaximoQuiz /
              Math.max(
                1,
                datos.cantidadPreguntas,
              ),
          ),
        ),
      [
        datos.cantidadPreguntas,
      ],
    );

  const [
    quizId,
    setQuizId,
  ] =
    useState<
      number |
      null
    >(
      null,
    );

  const [
    datasets,
    setDatasets,
  ] =
    useState<
      DatasetQuiz[]
    >(
      [],
    );

  const [
    datasetSeleccionado,
    setDatasetSeleccionado,
  ] =
    useState<
      DatasetQuiz |
      null
    >(
      null,
    );

  const [
    fuente,
    setFuente,
  ] =
    useState<
      FuenteQuiz |
      null
    >(
      null,
    );

  const [
    analizando,
    setAnalizando,
  ] =
    useState(
      false,
    );

  const [
    termino,
    setTermino,
  ] =
    useState(
      '',
    );

  const tipoBusqueda =
    'AUTO';

  const [
    modoBusqueda,
    setModoBusqueda,
  ] =
    useState<ModoBusquedaContenido>(
      'PALABRA',
    );

  const [
    articuloDesde,
    setArticuloDesde,
  ] =
    useState(
      '',
    );

  const [
    articuloHasta,
    setArticuloHasta,
  ] =
    useState(
      '',
    );

  const [
    resultados,
    setResultados,
  ] =
    useState<
      ResultadoBusquedaDataset[]
    >(
      [],
    );

  const [
    seleccionados,
    setSeleccionados,
  ] =
    useState<
      ResultadoBusquedaDataset[]
    >(
      [],
    );

  const [
    fragmentos,
    setFragmentos,
  ] =
    useState<
      FragmentoQuiz[]
    >(
      [],
    );

  const [
    tiposPregunta,
    setTiposPregunta,
  ] =
    useState<
      TipoPreguntaQuiz[]
    >([
      'OPCION_MULTIPLE',
      'VERDADERO_FALSO',
    ]);

  const [
    borradores,
    setBorradores,
  ] =
    useState<
      BorradorPreguntaQuiz[]
    >(
      [],
    );

  const [
    guardando,
    setGuardando,
  ] =
    useState(
      false,
    );

  const bloqueado =
    guardando ||
    analizando;

  const actualizar =
    <K extends keyof EstadoFormulario>(
      campo: K,
      valor: EstadoFormulario[K],
    ) => {
      setDatos(
        (
          actual,
        ) => ({
          ...actual,
          [campo]:
            valor,
        }),
      );
    };

  const convertirIsoAFechaHoraLocal =
    (
      valor:
        string |
        null |
        undefined,
    ) => {
      if (
        !valor
      ) {
        return {
          fecha:
            '',
          hora:
            '',
        };
      }

      const fecha =
        new Date(
          valor,
        );

      if (
        Number.isNaN(
          fecha.getTime(),
        )
      ) {
        return {
          fecha:
            '',
          hora:
            '',
        };
      }

      const anio =
        fecha.getFullYear();

      const mes =
        String(
          fecha.getMonth() +
            1,
        ).padStart(
          2,
          '0',
        );

      const dia =
        String(
          fecha.getDate(),
        ).padStart(
          2,
          '0',
        );

      const hora =
        String(
          fecha.getHours(),
        ).padStart(
          2,
          '0',
        );

      const minuto =
        String(
          fecha.getMinutes(),
        ).padStart(
          2,
          '0',
        );

      return {
        fecha:
          `${anio}-${mes}-${dia}`,

        hora:
          `${hora}:${minuto}`,
      };
    };

  useEffect(
    () => {
      if (
        !temaAyuda
      ) {
        return;
      }

      const cerrarConEscape =
        (
          evento:
            KeyboardEvent,
        ) => {
          if (
            evento.key ===
            'Escape'
          ) {
            setTemaAyuda(
              null,
            );
          }
        };

      document.addEventListener(
        'keydown',
        cerrarConEscape,
      );

      return () =>
        document.removeEventListener(
          'keydown',
          cerrarConEscape,
        );
    },
    [
      temaAyuda,
    ],
  );

  useEffect(
    () => {
      if (
        !abierto
      ) {
        return;
      }

      if (
        quizInicialId
      ) {
        return;
      }

      setPaso(
        1,
      );

      setDatos(
        crearInicial(
          hitoInicialId,
        ),
      );

      setQuizId(
        null,
      );

      setDatasets(
        [],
      );

      setDatasetSeleccionado(
        null,
      );

      setFuente(
        null,
      );

      setTermino(
        '',
      );

      setModoBusqueda(
        'PALABRA',
      );

      setArticuloDesde(
        '',
      );

      setArticuloHasta(
        '',
      );

      setResultados(
        [],
      );

      setSeleccionados(
        [],
      );

      setFragmentos(
        [],
      );

      setBorradores(
        [],
      );
    },
    [
      abierto,
      hitoInicialId,
      quizInicialId,
    ],
  );

  useEffect(
    () => {
      if (
        !abierto ||
        !quizInicialId
      ) {
        return;
      }

      let cancelado =
        false;

      const cargarBorrador =
        async () => {
          try {
            setGuardando(
              true,
            );

            const [
              quiz,
              datasetsDisponibles,
            ] =
              await Promise.all([
                obtenerQuiz(
                  cursoId,
                  quizInicialId,
                  accessToken,
                ),

                listarDatasetsQuiz(
                  cursoId,
                  accessToken,
                ),
              ]);

            if (
              cancelado
            ) {
              return;
            }

            if (
              quiz.estado !==
              'BORRADOR'
            ) {
              onToast(
                'advertencia',
                'El Quiz ya no es un borrador',
                'La edición completa solo está disponible mientras el Quiz permanece en borrador.',
              );

              onCerrar();

              return;
            }

            const apertura =
              convertirIsoAFechaHoraLocal(
                quiz.aperturaProgramada,
              );

            const cierre =
              convertirIsoAFechaHoraLocal(
                quiz.cierreProgramado,
              );

            setQuizId(
              quiz.id,
            );

            setDatos({
              titulo:
                quiz.titulo,
              descripcion:
                quiz.descripcion ??
                '',
              hitoId:
                quiz.hitoId,
              dificultad:
                quiz.dificultad,
              cantidadPreguntas:
                quiz.cantidadPreguntas,
              modalidad:
                quiz.modalidad,
              fechaApertura:
                apertura.fecha,
              horaApertura:
                apertura.hora,
              cierreAutomatico:
                Boolean(
                  quiz.cierreProgramado,
                ),
              fechaCierre:
                cierre.fecha,
              horaCierre:
                cierre.hora,
              ritmo:
                quiz.ritmo,
              modoTiempo:
                quiz.modoTiempo,
              tiempoPreguntaSegundos:
                quiz.tiempoPreguntaSegundos,
              tiempoFacilSegundos:
                quiz.tiempoFacilSegundos,
              tiempoMedioSegundos:
                quiz.tiempoMedioSegundos,
              tiempoDificilSegundos:
                quiz.tiempoDificilSegundos,
              esCalificable:
                quiz.esCalificable,
              componente:
                quiz.componente,
              usarRanking:
                quiz.usarRanking,
              usarPuntuacionVelocidad:
                quiz.usarPuntuacionVelocidad ??
                false,

              descuentoVelocidadPorPosicion:
                Math.max(
                  1,
                  Math.round(
                    Number(
                      quiz.descuentoVelocidadPorPosicion ??
                        1,
                    ),
                  ),
                ),

              puntajeMinimoVelocidad:
                Math.round(
                  Math.min(
                    Number(
                      quiz.puntajeMinimoVelocidad ??
                        5,
                    ),
                    Math.max(
                      1,
                      Math.round(
                        100 /
                          Math.max(
                            1,
                            quiz.cantidadPreguntas,
                          ),
                      ),
                    ),
                  ),
                ),
              permiteInicioConAusentes:
                quiz.permiteInicioConAusentes,
            });

            setDatasets(
              datasetsDisponibles,
            );

            const fuenteExistente =
              quiz.fuentes?.[
                0
              ] ??
              null;

            setFuente(
              fuenteExistente,
            );

            setDatasetSeleccionado(
              fuenteExistente
                ? datasetsDisponibles.find(
                    (
                      dataset,
                    ) =>
                      dataset.versionId ===
                      fuenteExistente.versionId,
                  ) ??
                  null
                : null,
            );

            const fragmentosExistentes =
              fuenteExistente?.fragmentos ??
              [];

            setFragmentos(
              fragmentosExistentes,
            );

            setResultados(
              [],
            );

            setSeleccionados(
              [],
            );

            const preguntasExistentes =
              quiz.preguntas ??
              [];

            setBorradores(
              preguntasExistentes.map(
                (
                  pregunta,
                ) => ({
                  fragmentoId:
                    pregunta.fragmentoId ??
                    fragmentosExistentes[
                      0
                    ]?.id ??
                    0,
                  enunciado:
                    pregunta.enunciado,
                  tipo:
                    pregunta.tipo,
                  dificultad:
                    pregunta.dificultad,
                  origen:
                    pregunta.origen,
                  explicacion:
                    pregunta.explicacion,
                  tiempoSegundos:
                    pregunta.tiempoSegundos,
                  puntaje:
                    Number(
                      pregunta.puntaje,
                    ),
                  orden:
                    pregunta.orden,
                  opciones:
                    pregunta.opciones.map(
                      (
                        opcion,
                      ) => ({
                        texto:
                          opcion.texto,
                        esCorrecta:
                          opcion.esCorrecta,
                        orden:
                          opcion.orden,
                      }),
                    ),
                }),
              ),
            );

            if (
              !fuenteExistente ||
              fragmentosExistentes.length ===
                0
            ) {
              setPaso(
                2,
              );
            } else {
              setPaso(
                3,
              );
            }
          } catch (
            error
          ) {
            if (
              cancelado
            ) {
              return;
            }

            onToast(
              'error',
              'No se pudo continuar el borrador',
              error instanceof
                Error
                ? error.message
                : undefined,
            );

            onCerrar();
          } finally {
            if (
              !cancelado
            ) {
              setGuardando(
                false,
              );
            }
          }
        };

      void cargarBorrador();

      return () => {
        cancelado =
          true;
      };
    },
    [
      abierto,
      quizInicialId,
      cursoId,
      accessToken,
      onCerrar,
      onToast,
    ],
  );

  useEffect(
    () => {
      contenidoRef.current?.scrollTo({
        top:
          0,

        behavior:
          'smooth',
      });
    },
    [
      paso,
    ],
  );

  useEffect(
    () => {
      if (
        !abierto ||
        paso !==
          2
      ) {
        return;
      }

      void listarDatasetsQuiz(
        cursoId,
        accessToken,
      )
        .then(
          setDatasets,
        )
        .catch(
          (
            error,
          ) =>
            onToast(
              'error',
              'No se pudieron cargar las fuentes',
              error instanceof
                Error
                ? error.message
                : undefined,
            ),
        );
    },
    [
      abierto,
      paso,
      cursoId,
      accessToken,
      onToast,
    ],
  );

  const convertirFechaLocalIso =
    (
      fecha:
        string,

      hora:
        string,
    ) => {
      if (
        !fecha ||
        !hora
      ) {
        return null;
      }

      const local =
        new Date(
          `${fecha}T${hora}:00`,
        );

      if (
        Number.isNaN(
          local.getTime(),
        )
      ) {
        return null;
      }

      return local.toISOString();
    };

  const obtenerProgramacion =
    () => {
      if (
        datos.modalidad !==
        'PROGRAMADO'
      ) {
        return {
          aperturaProgramada:
            undefined,

          cierreProgramado:
            undefined,
        };
      }

      const aperturaProgramada =
        convertirFechaLocalIso(
          datos.fechaApertura,
          datos.horaApertura,
        ) ??
        undefined;

      const cierreProgramado =
        datos.cierreAutomatico
          ? convertirFechaLocalIso(
              datos.fechaCierre,
              datos.horaCierre,
            ) ??
            undefined
          : undefined;

      return {
        aperturaProgramada,
        cierreProgramado,
      };
    };

  const validarPaso =
    (
      pasoValidar:
        PasoFormulario,
    ) => {
      if (
        pasoValidar ===
        1
      ) {
        if (
          datos.titulo.trim().length <
          3
        ) {
          return 'Escribe un título para el Quiz.';
        }

        if (
          !datos.hitoId
        ) {
          return 'Selecciona el hito del Quiz.';
        }
      }

      if (
        pasoValidar ===
        2
      ) {
        if (
          !datasetSeleccionado ||
          !fuente
        ) {
          return 'Selecciona un PDF de Recursos para utilizarlo como fuente.';
        }

        if (
          seleccionados.length ===
            0 &&
          fragmentos.length ===
            0
        ) {
          return 'Selecciona al menos un artículo, título, capítulo o fragmento.';
        }
      }

      if (
        pasoValidar ===
        3 &&
        borradores.length ===
          0
      ) {
        return 'Genera y revisa al menos una pregunta.';
      }

      if (
        pasoValidar ===
        4
      ) {
        if (
          datos.modalidad ===
          'PROGRAMADO'
        ) {
          if (
            !datos.fechaApertura ||
            !datos.horaApertura
          ) {
            return 'Define la fecha y la hora de apertura del Quiz.';
          }

          const apertura =
            convertirFechaLocalIso(
              datos.fechaApertura,
              datos.horaApertura,
            );

          if (
            !apertura
          ) {
            return 'La fecha u hora de apertura no es válida.';
          }

          if (
            new Date(
              apertura,
            ).getTime() <=
            Date.now()
          ) {
            return 'La apertura programada debe ser posterior al momento actual.';
          }

          if (
            datos.cierreAutomatico
          ) {
            if (
              !datos.fechaCierre ||
              !datos.horaCierre
            ) {
              return 'Define la fecha y la hora de cierre automático.';
            }

            const cierre =
              convertirFechaLocalIso(
                datos.fechaCierre,
                datos.horaCierre,
              );

            if (
              !cierre
            ) {
              return 'La fecha u hora de cierre no es válida.';
            }

            if (
              new Date(
                cierre,
              ).getTime() <=
              new Date(
                apertura,
              ).getTime()
            ) {
              return 'El cierre debe ser posterior a la apertura.';
            }
          }
        }
      }

      if (
        pasoValidar ===
          5 &&
        datos.esCalificable &&
        !datos.componente
      ) {
        return 'Selecciona Continua o Procesual.';
      }

      return null;
    };

  const prepararQuiz =
    async () => {
      const problema =
        validarPaso(
          1,
        );

      if (
        problema
      ) {
        onToast(
          'advertencia',
          'Revisa la información',
          problema,
        );

        return;
      }

      try {
        setGuardando(
          true,
        );

        if (
          quizId
        ) {
          await actualizarQuiz(
            cursoId,
            quizId,
            accessToken,
            {
              titulo:
                datos.titulo.trim(),
              descripcion:
                datos.descripcion.trim() ||
                undefined,
              hitoId:
                datos.hitoId!,
              dificultad:
                datos.dificultad,
              esCalificable:
                datos.esCalificable,
              componente:
                datos.esCalificable
                  ? datos.componente ??
                    undefined
                  : undefined,
              cantidadPreguntas:
                datos.cantidadPreguntas,
            },
          );

          setPaso(
            2,
          );

          return;
        }

        const quiz =
          await crearQuiz(
            cursoId,
            accessToken,
            {
              titulo:
                datos.titulo.trim(),

              descripcion:
                datos.descripcion.trim() ||
                undefined,

              hitoId:
                datos.hitoId!,

              dificultad:
                datos.dificultad,

              esCalificable:
                datos.esCalificable,

              componente:
                datos.esCalificable
                  ? datos.componente ??
                    undefined
                  : undefined,

              modalidad:
                datos.modalidad,

              ritmo:
                datos.ritmo,

              modoTiempo:
                datos.modoTiempo,

              tiempoPreguntaSegundos:
                datos.tiempoPreguntaSegundos,

              tiempoFacilSegundos:
                datos.tiempoFacilSegundos,

              tiempoMedioSegundos:
                datos.tiempoMedioSegundos,

              tiempoDificilSegundos:
                datos.tiempoDificilSegundos,

              cantidadPreguntas:
                datos.cantidadPreguntas,

              puntajeMaximo:
                puntajeMaximoQuiz,

              usarRanking:
                datos.usarRanking,

              criterioRanking:
                'PUNTAJE_Y_TIEMPO',

              descuentoPorPuesto: 0,
              puntajeMinimoRanking: 0,
              usarPuntuacionVelocidad:
                datos.usarPuntuacionVelocidad,

              descuentoVelocidadPorPosicion:
                datos.usarPuntuacionVelocidad
                  ? Math.round(
                      datos.descuentoVelocidadPorPosicion,
                    )
                  : 0,

              puntajeMinimoVelocidad:
                datos.usarPuntuacionVelocidad
                  ? Math.round(
                      datos.puntajeMinimoVelocidad,
                    )
                  : 0,

              permiteInicioConAusentes:
                datos.permiteInicioConAusentes,

              cuentaRegresivaSegundos:
                3,
            },
          );

        setQuizId(
          quiz.id,
        );

        setPaso(
          2,
        );
      } catch (
        error
      ) {
        onToast(
          'error',
          'No se pudo preparar el Quiz',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setGuardando(
          false,
        );
      }
    };

  const guardarSesion =
    async () => {
      const problema =
        validarPaso(
          4,
        );

      if (
        problema
      ) {
        onToast(
          'advertencia',
          'Revisa la programación',
          problema,
        );

        return;
      }

      if (
        !quizId
      ) {
        return;
      }

      const programacion =
        obtenerProgramacion();

      try {
        setGuardando(
          true,
        );

        await actualizarQuiz(
          cursoId,
          quizId,
          accessToken,
          {
            modalidad:
              datos.modalidad,

            ritmo:
              datos.ritmo,

            modoTiempo:
              datos.modoTiempo,

            tiempoPreguntaSegundos:
              datos.tiempoPreguntaSegundos,

            tiempoFacilSegundos:
              datos.tiempoFacilSegundos,

            tiempoMedioSegundos:
              datos.tiempoMedioSegundos,

            tiempoDificilSegundos:
              datos.tiempoDificilSegundos,

            permiteInicioConAusentes:
              datos.permiteInicioConAusentes,

            aperturaProgramada:
              programacion.aperturaProgramada,

            cierreProgramado:
              programacion.cierreProgramado,
          },
        );

        setPaso(
          5,
        );
      } catch (
        error
      ) {
        onToast(
          'error',
          'No se pudo guardar la sesión',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setGuardando(
          false,
        );
      }
    };

  const seleccionarDataset =
    async (
      item:
        DatasetQuiz,
    ) => {
      if (
        !quizId
      ) {
        return;
      }

      try {
        setAnalizando(
          true,
        );

        const fuentePreparada =
          await agregarFuenteQuiz(
            cursoId,
            quizId,
            item.versionId,
            accessToken,
          );

        setDatasetSeleccionado(
          item,
        );

        setFuente(
          fuentePreparada,
        );

        setResultados(
          [],
        );

        setSeleccionados(
          [],
        );

        setModoBusqueda(
          'PALABRA',
        );

        setTermino(
          '',
        );

        setArticuloDesde(
          '',
        );

        setArticuloHasta(
          '',
        );

        setFragmentos(
          fuentePreparada.fragmentos ??
          [],
        );

        onToast(
          'exito',
          'Fuente seleccionada',
          `${item.contenidoTitulo} · versión ${item.numeroVersion}`,
        );
      } catch (
        error
      ) {
        onToast(
          'error',
          'No se pudo preparar el PDF',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setAnalizando(
          false,
        );
      }
    };

  const buscarPorPalabra =
    async () => {
      if (
        !datasetSeleccionado
      ) {
        return;
      }

      if (
        !termino.trim()
      ) {
        onToast(
          'advertencia',
          'Escribe qué quieres buscar',
          'Puedes buscar por artículo, título, capítulo, sección o palabra clave.',
        );

        return;
      }

      try {
        setAnalizando(
          true,
        );

        const respuesta =
          await buscarDatasetQuiz(
            cursoId,
            datasetSeleccionado.versionId,
            accessToken,
            termino.trim(),
            tipoBusqueda,
          );

        setResultados(
          respuesta,
        );

        setSeleccionados(
          [],
        );
      } catch (
        error
      ) {
        onToast(
          'error',
          'No se pudo buscar en el documento',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setAnalizando(
          false,
        );
      }
    };

  const obtenerNumeroArticulo =
    (
      resultado:
        ResultadoBusquedaDataset,
    ) => {
      const texto =
        [
          resultado.titulo,
          resultado.vistaPrevia,
        ].join(
          ' ',
        );

      const coincidencia =
        texto.match(
          /ART[ÍI]CULO\s+(\d+)/i,
        );

      if (
        !coincidencia
      ) {
        return null;
      }

      return Number(
        coincidencia[
          1
        ],
      );
    };

  const buscarPorRango =
    async () => {
      if (
        !datasetSeleccionado
      ) {
        return;
      }

      const desde =
        Number(
          articuloDesde,
        );

      const hasta =
        Number(
          articuloHasta,
        );

      if (
        !Number.isInteger(
          desde,
        ) ||
        !Number.isInteger(
          hasta,
        ) ||
        desde <=
          0 ||
        hasta <=
          0
      ) {
        onToast(
          'advertencia',
          'Rango inválido',
          'Escribe números de artículo válidos.',
        );

        return;
      }

      if (
        hasta <
        desde
      ) {
        onToast(
          'advertencia',
          'Rango inválido',
          'El artículo final debe ser igual o posterior al artículo inicial.',
        );

        return;
      }

      const cantidad =
        hasta -
        desde +
        1;

      if (
        cantidad >
        60
      ) {
        onToast(
          'advertencia',
          'Rango demasiado amplio',
          'Selecciona un máximo de 60 artículos por búsqueda para mantener una generación precisa.',
        );

        return;
      }

      try {
        setAnalizando(
          true,
        );

        const numeros =
          Array.from(
            {
              length:
                cantidad,
            },
            (
              _,
              indice,
            ) =>
              desde +
              indice,
          );

        const grupos:
          number[][] =
          [];

        for (
          let indice =
            0;
          indice <
          numeros.length;
          indice +=
            8
        ) {
          grupos.push(
            numeros.slice(
              indice,
              indice +
                8,
            ),
          );
        }

        const encontrados:
          ResultadoBusquedaDataset[] =
          [];

        for (
          const grupo
          of grupos
        ) {
          const respuestas =
            await Promise.all(
              grupo.map(
                async (
                  numero,
                ) => {
                  const resultadosArticulo =
                    await buscarDatasetQuiz(
                      cursoId,
                      datasetSeleccionado.versionId,
                      accessToken,
                      String(
                        numero,
                      ),
                      'ARTICULO',
                    );

                  const exacto =
                    resultadosArticulo.find(
                      (
                        item,
                      ) =>
                        obtenerNumeroArticulo(
                          item,
                        ) ===
                        numero,
                    );

                  return exacto ??
                    null;
                },
              ),
            );

          encontrados.push(
            ...respuestas.filter(
              (
                item,
              ): item is ResultadoBusquedaDataset =>
                item !==
                null,
            ),
          );
        }

        const unicos =
          Array.from(
            new Map(
              encontrados.map(
                (
                  item,
                ) => [
                  item.indice,
                  item,
                ],
              ),
            ).values(),
          ).sort(
            (
              a,
              b,
            ) =>
              (
                obtenerNumeroArticulo(
                  a,
                ) ??
                0
              ) -
              (
                obtenerNumeroArticulo(
                  b,
                ) ??
                0
              ),
          );

        setResultados(
          unicos,
        );

        setSeleccionados(
          unicos,
        );

        if (
          unicos.length ===
          0
        ) {
          onToast(
            'advertencia',
            'No se encontraron artículos',
            `No fue posible localizar artículos entre el ${desde} y el ${hasta}.`,
          );

          return;
        }

        if (
          unicos.length !==
          cantidad
        ) {
          onToast(
            'informacion',
            'Rango localizado parcialmente',
            `Se encontraron ${unicos.length} de ${cantidad} artículos. Puedes revisar la selección antes de generar las preguntas.`,
          );
        }
      } catch (
        error
      ) {
        onToast(
          'error',
          'No se pudo buscar el rango',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setAnalizando(
          false,
        );
      }
    };


  const alternarResultado =
    (
      resultado:
        ResultadoBusquedaDataset,
    ) => {
      setSeleccionados(
        (
          actuales,
        ) =>
          actuales.some(
            (
              item,
            ) =>
              item.indice ===
              resultado.indice,
          )
            ? actuales.filter(
                (
                  item,
                ) =>
                  item.indice !==
                  resultado.indice,
              )
            : [
                ...actuales,
                resultado,
              ],
      );
    };

  const generarPreguntas =
    async () => {
      const problema =
        validarPaso(
          2,
        );

      if (
        problema
      ) {
        onToast(
          'advertencia',
          'Selecciona contenido',
          problema,
        );

        return;
      }

      if (
        !quizId ||
        !fuente
      ) {
        return;
      }

      try {
        setGuardando(
          true,
        );

        let guardados =
          fragmentos;

        if (
          seleccionados.length >
          0
        ) {
          guardados =
            await seleccionarFragmentosQuiz(
              cursoId,
              quizId,
              fuente.id,
              accessToken,
              seleccionados,
            );

          setFragmentos(
            guardados,
          );
        }

        const generadas =
          await generarBorradorQuiz(
            cursoId,
            quizId,
            accessToken,
            {
              fragmentoIds:
                guardados.map(
                  (
                    item,
                  ) =>
                    item.id,
                ),

              cantidad:
                datos.cantidadPreguntas,

              dificultad:
                datos.dificultad,

              tipos:
                tiposPregunta,
            },
          );

        setBorradores(
          generadas,
        );

        setPaso(
          3,
        );
      } catch (
        error
      ) {
        onToast(
          'error',
          'No se pudieron generar las preguntas',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setGuardando(
          false,
        );
      }
    };

  const regenerar =
    async () => {
      if (
        !quizId ||
        fragmentos.length ===
          0
      ) {
        return;
      }

      try {
        setGuardando(
          true,
        );

        setBorradores(
          await generarBorradorQuiz(
            cursoId,
            quizId,
            accessToken,
            {
              fragmentoIds:
                fragmentos.map(
                  (
                    item,
                  ) =>
                    item.id,
                ),

              cantidad:
                datos.cantidadPreguntas,

              dificultad:
                datos.dificultad,

              tipos:
                tiposPregunta,
            },
          ),
        );
      } catch (
        error
      ) {
        onToast(
          'error',
          'No se pudieron regenerar las preguntas',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setGuardando(
          false,
        );
      }
    };

  const finalizar =
    async () => {
      const problema =
        validarPaso(
          5,
        );

      if (
        problema
      ) {
        onToast(
          'advertencia',
          'Revisa la evaluación',
          problema,
        );

        return;
      }

      if (
        !quizId ||
        borradores.length ===
          0
      ) {
        return;
      }

      try {
        setGuardando(
          true,
        );

        await actualizarQuiz(
          cursoId,
          quizId,
          accessToken,
          {
            esCalificable:
              datos.esCalificable,

            componente:
              datos.esCalificable
                ? datos.componente ??
                  undefined
                : undefined,

            usarRanking:
              datos.usarRanking,

            descuentoPorPuesto: 0,
            puntajeMinimoRanking: 0,
            usarPuntuacionVelocidad:
              datos.usarPuntuacionVelocidad,

            descuentoVelocidadPorPosicion:
              datos.usarPuntuacionVelocidad
                ? Math.round(
                    datos.descuentoVelocidadPorPosicion,
                  )
                : 0,

            puntajeMinimoVelocidad:
              datos.usarPuntuacionVelocidad
                ? Math.round(
                    datos.puntajeMinimoVelocidad,
                  )
                : 0,
          },
        );

        const quizActual =
          await obtenerQuiz(
            cursoId,
            quizId,
            accessToken,
          );

        for (
          const pregunta
          of quizActual.preguntas ??
          []
        ) {
          await eliminarPreguntaQuiz(
            cursoId,
            quizId,
            pregunta.id,
            accessToken,
          );
        }

        const puntaje =
          Math.max(
            1,
            Math.round(
              100 /
                Math.max(
                  1,
                  borradores.length,
                ),
            ),
          );

        for (
          let indice =
            0;
          indice <
          borradores.length;
          indice +=
            1
        ) {
          await guardarPreguntaQuiz(
            cursoId,
            quizId,
            accessToken,
            {
              ...borradores[
                indice
              ],

              orden:
                indice,

              puntaje,
            },
          );
        }

        await publicarSalaQuiz(
          cursoId,
          quizId,
          accessToken,
        );

        onToast(
          'exito',
          'Quiz creado',
          'La sala quedó preparada correctamente.',
        );

        onCompletado();
      } catch (
        error
      ) {
        onToast(
          'error',
          'No se pudo crear el Quiz',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setGuardando(
          false,
        );
      }
    };

  const pasosFormulario =
    (
      <div className="crear-quiz-pasos">
        {(
          [
            [
              1,
              'Información',
              BookOpenCheck,
            ],

            [
              2,
              'Contenido',
              FileSearch,
            ],

            [
              3,
              'Preguntas',
              BrainCircuit,
            ],

            [
              4,
              'Sesión',
              Radio,
            ],

            [
              5,
              'Evaluación',
              Trophy,
            ],
          ] as const
        ).map(
          (
            [
              numero,
              etiqueta,
              Icono,
            ],
          ) => {
            const completo =
              paso >
              numero;

            return (
              <button
                key={
                  numero
                }
                type="button"
                className={`${paso === numero ? 'activo' : ''} ${completo ? 'completo' : ''}`}
                onClick={() => {
                  if (
                    numero <
                    paso
                  ) {
                    setPaso(
                      numero,
                    );
                  }
                }}
              >
                <span className="crear-quiz-pasos__estado">
                  {completo ? (
                    <Check
                      size={
                        15
                      }
                    />
                  ) : (
                    numero
                  )}
                </span>

                <span className="crear-quiz-pasos__texto">
                  <Icono
                    size={
                      14
                    }
                  />

                  <small>
                    {etiqueta}
                  </small>
                </span>
              </button>
            );
          },
        )}
      </div>
    );

  const pieFormulario =
    (
      <>
        <button
          type="button"
          className="crear-quiz-btn secundario"
          disabled={
            bloqueado
          }
          onClick={() => {
            if (
              paso ===
              1
            ) {
              onCerrar();

              return;
            }

            setPaso(
              (
                paso -
                1
              ) as PasoFormulario,
            );
          }}
        >
          {paso >
            1 && (
            <ArrowLeft
              size={
                16
              }
            />
          )}

          {paso ===
          1
            ? 'Cancelar'
            : 'Anterior'}
        </button>

        {paso ===
          1 && (
          <button
            type="button"
            className="crear-quiz-btn primario"
            disabled={
              bloqueado
            }
            onClick={() =>
              void prepararQuiz()
            }
          >
            Siguiente

            <ArrowRight
              size={
                16
              }
            />
          </button>
        )}

        {paso ===
          2 && (
          <button
            type="button"
            className="crear-quiz-btn primario"
            disabled={
              bloqueado
            }
            onClick={() =>
              void generarPreguntas()
            }
          >
            Generar preguntas

            <WandSparkles
              size={
                16
              }
            />
          </button>
        )}

        {paso ===
          3 && (
          <button
            type="button"
            className="crear-quiz-btn primario"
            disabled={
              bloqueado ||
              borradores.length ===
                0
            }
            onClick={() =>
              setPaso(
                4,
              )
            }
          >
            Siguiente

            <ArrowRight
              size={
                16
              }
            />
          </button>
        )}

        {paso ===
          4 && (
          <button
            type="button"
            className="crear-quiz-btn primario"
            disabled={
              bloqueado
            }
            onClick={() =>
              void guardarSesion()
            }
          >
            Siguiente

            <ArrowRight
              size={
                16
              }
            />
          </button>
        )}

        {paso ===
          5 && (
          <button
            type="button"
            className="crear-quiz-btn primario"
            disabled={
              bloqueado
            }
            onClick={() =>
              void finalizar()
            }
          >
            <CheckCircle2
              size={
                16
              }
            />

            Crear Quiz
          </button>
        )}
      </>
    );

  const resumen =
    useMemo(
      () => ({
        hito:
          hitos.find(
            (
              hito,
            ) =>
              hito.id ===
              datos.hitoId,
          ),

        tiempo:
          datos.modoTiempo ===
          'FIJO'
            ? `${datos.tiempoPreguntaSegundos} s`
            : 'Inteligente',

        evaluacion:
          datos.esCalificable
            ? datos.componente ===
              'CONTINUA'
              ? 'Calificable · Continua'
              : 'Calificable · Procesual'
            : 'Práctica',
      }),
      [
        datos,
        hitos,
      ],
    );

  const ayudas: Record<
    TemaAyudaQuiz,
    {
      titulo:
        string;

      introduccion:
        string;

      opciones:
        string[];
    }
  > = {
    dificultad: {
      titulo:
        'Dificultad del Quiz',

      introduccion:
        'Define el nivel general de complejidad de las preguntas que se generarán o seleccionarán.',

      opciones: [
        'Fácil: preguntas directas de reconocimiento y comprensión básica.',
        'Medio: combina comprensión, interpretación y aplicación jurídica.',
        'Difícil: exige mayor análisis, precisión conceptual y razonamiento.',
      ],
    },

    modalidad: {
      titulo:
        'Modalidad del Quiz',

      introduccion:
        'Define cómo se habilitará la sesión para los estudiantes.',

      opciones: [
        'En vivo: los estudiantes ingresan a una sala y esperan a que el docente inicie.',
        'Programado: el Quiz se habilita automáticamente en la fecha y hora configuradas.',
      ],
    },

    modoTiempo: {
      titulo:
        'Tiempo por pregunta',

      introduccion:
        'Controla cuánto tiempo dispone el estudiante para responder cada pregunta.',

      opciones: [
        'Tiempo fijo: todas las preguntas utilizan la misma duración.',
        'Tiempo inteligente: la duración puede variar según la dificultad de la pregunta.',
        'Al llegar a cero, la respuesta queda bloqueada y se considera omitida si no fue enviada.',
      ],
    },

    ritmo: {
      titulo:
        'Ritmo del Quiz',

      introduccion:
        'Define quién decide cuándo avanzar a la siguiente pregunta.',

      opciones: [
        'Control docente: el profesor decide cuándo avanzar, aunque todos hayan respondido.',
        'Automático: avanza cuando todos los participantes activos responden o cuando el tiempo llega a cero.',
      ],
    },

    programacion: {
      titulo:
        'Programación del Quiz',

      introduccion:
        'Permite establecer cuándo se abrirá y, si corresponde, cuándo dejará de estar disponible el Quiz.',

      opciones: [
        'La apertura indica el momento desde el cual los estudiantes podrán ingresar.',
        'El cierre debe ser posterior a la apertura.',
        'Antes de la hora configurada, el estudiante podrá ver que el Quiz está próximo pero no podrá iniciarlo.',
      ],
    },

    componente: {
      titulo:
        'Componente de evaluación',

      introduccion:
        'Define en qué parte del hito se registrará el resultado del Quiz cuando la actividad sea calificable.',

      opciones: [
        'Continua: registra el Quiz como una actividad de seguimiento desarrollada durante el hito.',
        'Procesual: registra el Quiz como evidencia vinculada al desempeño o producto procesual.',
        'Esta elección solo se utiliza cuando el Quiz está marcado como Calificable.',
      ],
    },

    ranking: {
      titulo:
        'Ranking competitivo',

      introduccion:
        'Activa una clasificación final de los estudiantes según su rendimiento en el Quiz.',

      opciones: [
        'El ranking ordena primero por mayor puntaje obtenido.',
        'Cuando existe empate de puntaje, se utiliza el menor tiempo total para definir la posición.',
        'Activar el ranking no significa que se descuenten puntos automáticamente.',
        'La puntuación por velocidad se configura por separado y puede permanecer desactivada.',
      ],
    },

    puntuacionVelocidad: {
      titulo:
        'Puntuación por velocidad',

      introduccion:
        'Permite que el orden de las respuestas correctas influya en los puntos obtenidos en cada pregunta.',

      opciones: [
        'Solo las respuestas correctas ocupan una posición.',
        'Ejemplo: si la pregunta vale 10 puntos y el descuento por posición es 1, el 1.º correcto obtiene 10, el 2.º 9 y el 3.º 8.',
        'Las respuestas incorrectas y omitidas reciben 0 puntos y no ocupan una posición entre las respuestas correctas.',
        'El valor de cada pregunta se calcula automáticamente dividiendo 100 entre la cantidad de preguntas y redondeando al entero más cercano.',
        'Ejemplo: 15 preguntas dan 7 puntos por pregunta. El total bruto sería 105 y al finalizar el sistema normaliza la nota nuevamente sobre 100.',
        'El puntaje mínimo protegido nunca puede superar el valor base redondeado de una pregunta y evita que una respuesta correcta baje de ese valor por efecto de la velocidad.',
        'Si cambias la cantidad de preguntas, el formulario recalcula el valor por pregunta y ajusta automáticamente el mínimo y el descuento si fuera necesario.',
        'Si esta opción está desactivada, todas las respuestas correctas reciben el puntaje completo de la pregunta.',
      ],
    },
  };

  return (
    <>
      <AulaModal
      abierto={
        abierto
      }
      ancho="amplio"
      icono={
        Sparkles
      }
      etiqueta={
        datos.hitoId
          ? `Quizzes · ${resumen.hito?.codigo ?? ''}`
          : 'Quizzes'
      }
      titulo={
        quizInicialId
          ? 'Continuar Quiz'
          : 'Crear Quiz inteligente'
      }
      descripcion={
        quizInicialId
          ? 'Retoma la configuración y el contenido guardado de este borrador.'
          : 'Construye una evaluación jurídica desde los recursos del curso.'
      }
      bloqueado={
        bloqueado
      }
      onCerrar={
        onCerrar
      }
      pasos={
        pasosFormulario
      }
      footer={
        pieFormulario
      }
    >
      <div className="crear-quiz">
        <AulaLoadingOverlay
          visible={
            bloqueado
          }
          texto={
            analizando
              ? 'Cargando contenido…'
              : 'Guardando Quiz…'
          }
        />

        <div
          ref={
            contenidoRef
          }
          className={`crear-quiz-layout paso-${paso}`}
        >
          {paso ===
            1 && (
            <section className="crear-quiz-seccion">
              <header className="crear-quiz-seccion__cabecera">
                <span>
                  <BookOpenCheck
                    size={
                      19
                    }
                  />
                </span>

                <div>
                  <strong>
                    Información del Quiz
                  </strong>

                  <small>
                    Define el tema, el hito y la dificultad general.
                  </small>
                </div>
              </header>

              <div className="crear-quiz-grid">
                <label>
                  Título

                  <input
                    maxLength={
                      180
                    }
                    value={
                      datos.titulo
                    }
                    placeholder="Ej. Contratos civiles"
                    onChange={(
                      evento,
                    ) =>
                      actualizar(
                        'titulo',
                        evento.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  Hito

                  <select
                    value={
                      datos.hitoId ??
                      ''
                    }
                    onChange={(
                      evento,
                    ) =>
                      actualizar(
                        'hitoId',
                        Number(
                          evento.target.value,
                        ) ||
                          null,
                      )
                    }
                  >
                    <option value="">
                      Seleccionar…
                    </option>

                    {hitos.map(
                      (
                        hito,
                      ) => (
                        <option
                          key={
                            hito.id
                          }
                          value={
                            hito.id
                          }
                        >
                          {hito.codigo} · {hito.nombre}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="ancho-completo">
                  Descripción

                  <textarea
                    rows={
                      3
                    }
                    value={
                      datos.descripcion
                    }
                    placeholder="Describe brevemente qué conocimientos evaluará este Quiz."
                    onChange={(
                      evento,
                    ) =>
                      actualizar(
                        'descripcion',
                        evento.target.value,
                      )
                    }
                  />
                </label>
              </div>

              <div className="crear-quiz-subtitulo">
                Dificultad
              </div>

              <div className="crear-quiz-opciones crear-quiz-opciones--3">
                {(
                  [
                    [
                      'FACIL',
                      'Fácil',
                      'Preguntas directas de reconocimiento.',
                    ],

                    [
                      'MEDIO',
                      'Medio',
                      'Comprensión y aplicación jurídica.',
                    ],

                    [
                      'DIFICIL',
                      'Difícil',
                      'Análisis y precisión conceptual.',
                    ],
                  ] as Array<
                    [
                      DificultadQuiz,
                      string,
                      string,
                    ]
                  >
                ).map(
                  (
                    [
                      valor,
                      titulo,
                      descripcion,
                    ],
                  ) => (
                    <button
                      key={
                        valor
                      }
                      type="button"
                      className={
                        datos.dificultad ===
                        valor
                          ? 'activo'
                          : ''
                      }
                      onClick={() =>
                        actualizar(
                          'dificultad',
                          valor,
                        )
                      }
                    >
                      <Gauge
                        size={
                          17
                        }
                      />

                      <span>
                        <strong>
                          {titulo}
                        </strong>

                        <small>
                          {descripcion}
                        </small>
                      </span>
                    </button>
                  ),
                )}
              </div>
            </section>
          )}

          {paso ===
            2 && (
            <>
              <section className="crear-quiz-seccion">
                <header className="crear-quiz-seccion__cabecera">
                  <span>
                    <FileSearch
                      size={
                        19
                      }
                    />
                  </span>

                  <div>
                    <strong>
                      Fuente del Quiz
                    </strong>

                    <small>
                      Los PDF configurados para Quizzes en Recursos ya funcionan automáticamente como datasets.
                    </small>
                  </div>
                </header>

                <div className="crear-quiz-datasets">
                  {datasets.length ===
                  0 ? (
                    <div className="crear-quiz-vacio">
                      No existen PDF habilitados para Quizzes en este curso.
                    </div>
                  ) : (
                    datasets.map(
                      (
                        item,
                      ) => {
                        const activo =
                          datasetSeleccionado?.versionId ===
                          item.versionId;

                        return (
                          <button
                            key={
                              item.versionId
                            }
                            type="button"
                            className={
                              activo
                                ? 'activo'
                                : ''
                            }
                            disabled={
                              bloqueado
                            }
                            onClick={() =>
                              void seleccionarDataset(
                                item,
                              )
                            }
                          >
                            <span className="crear-quiz-dataset__icono">
                              <BookOpenCheck
                                size={
                                  18
                                }
                              />
                            </span>

                            <span className="crear-quiz-dataset__texto">
                              <strong>
                                {item.contenidoTitulo}
                              </strong>

                              <small>
                                {item.recursoTitulo} · PDF · versión {item.numeroVersion}
                              </small>
                            </span>

                            {activo && (
                              <CheckCircle2
                                size={
                                  18
                                }
                              />
                            )}
                          </button>
                        );
                      },
                    )
                  )}
                </div>
              </section>

              {datasetSeleccionado && (
                <section className="crear-quiz-seccion">
                  <header className="crear-quiz-seccion__cabecera">
                    <span>
                      <Search
                        size={
                          19
                        }
                      />
                    </span>

                    <div>
                      <strong>
                        Buscar dentro del documento
                      </strong>

                      <small>
                        Localiza artículos, títulos, capítulos, secciones o conceptos.
                      </small>
                    </div>
                  </header>

                  <div className="crear-quiz-modos-busqueda">
                    <button
                      type="button"
                      className={
                        modoBusqueda ===
                        'PALABRA'
                          ? 'activo'
                          : ''
                      }
                      onClick={() => {
                        setModoBusqueda(
                          'PALABRA',
                        );

                        setResultados(
                          [],
                        );

                        setSeleccionados(
                          [],
                        );
                      }}
                    >
                      <span>
                        <Type
                          size={
                            17
                          }
                        />
                      </span>

                      <div>
                        <strong>
                          Buscar por palabra
                        </strong>

                        <small>
                          Busca conceptos, artículos, títulos, capítulos o secciones.
                        </small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={
                        modoBusqueda ===
                        'RANGO_ARTICULOS'
                          ? 'activo'
                          : ''
                      }
                      onClick={() => {
                        setModoBusqueda(
                          'RANGO_ARTICULOS',
                        );

                        setResultados(
                          [],
                        );

                        setSeleccionados(
                          [],
                        );
                      }}
                    >
                      <span>
                        <ListOrdered
                          size={
                            17
                          }
                        />
                      </span>

                      <div>
                        <strong>
                          Buscar por rango
                        </strong>

                        <small>
                          Selecciona todos los artículos comprendidos entre dos números.
                        </small>
                      </div>
                    </button>
                  </div>

                  {modoBusqueda ===
                    'PALABRA' ? (
                    <div className="crear-quiz-busqueda">
                      <label className="crear-quiz-busqueda__campo">
                        <Search
                          size={
                            16
                          }
                        />

                        <input
                          value={
                            termino
                          }
                          placeholder="Buscar concepto, artículo, título, capítulo o sección..."
                          onChange={(
                            evento,
                          ) =>
                            setTermino(
                              evento.target.value,
                            )
                          }
                          onKeyDown={(
                            evento,
                          ) => {
                            if (
                              evento.key ===
                              'Enter'
                            ) {
                              evento.preventDefault();

                              void buscarPorPalabra();
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        disabled={
                          bloqueado ||
                          !termino.trim()
                        }
                        onClick={() =>
                          void buscarPorPalabra()
                        }
                      >
                        <Search
                          size={
                            15
                          }
                        />

                        Buscar
                      </button>
                    </div>
                  ) : (
                    <div className="crear-quiz-rango">
                      <label>
                        <span>
                          Desde el artículo
                        </span>

                        <input
                          type="number"
                          min={
                            1
                          }
                          inputMode="numeric"
                          value={
                            articuloDesde
                          }
                          placeholder="Ej. 450"
                          onChange={(
                            evento,
                          ) =>
                            setArticuloDesde(
                              evento.target.value,
                            )
                          }
                        />
                      </label>

                      <span className="crear-quiz-rango__separador">
                        hasta
                      </span>

                      <label>
                        <span>
                          Hasta el artículo
                        </span>

                        <input
                          type="number"
                          min={
                            1
                          }
                          inputMode="numeric"
                          value={
                            articuloHasta
                          }
                          placeholder="Ej. 480"
                          onChange={(
                            evento,
                          ) =>
                            setArticuloHasta(
                              evento.target.value,
                            )
                          }
                          onKeyDown={(
                            evento,
                          ) => {
                            if (
                              evento.key ===
                              'Enter'
                            ) {
                              evento.preventDefault();

                              void buscarPorRango();
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        disabled={
                          bloqueado
                        }
                        onClick={() =>
                          void buscarPorRango()
                        }
                      >
                        <Search
                          size={
                            15
                          }
                        />

                        Buscar rango
                      </button>
                    </div>
                  )}

                  {modoBusqueda ===
                    'RANGO_ARTICULOS' &&
                    resultados.length >
                      0 && (
                    <div className="crear-quiz-rango-resumen">
                      <div>
                        <ListOrdered
                          size={
                            16
                          }
                        />

                        <span>
                          <strong>
                            Artículos {articuloDesde} al {articuloHasta}
                          </strong>

                          <small>
                            {resultados.length} artículo(s) encontrado(s). El rango está seleccionado automáticamente.
                          </small>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const todosSeleccionados =
                            resultados.every(
                              (
                                resultado,
                              ) =>
                                seleccionados.some(
                                  (
                                    seleccionado,
                                  ) =>
                                    seleccionado.indice ===
                                    resultado.indice,
                                ),
                            );

                          setSeleccionados(
                            todosSeleccionados
                              ? []
                              : resultados,
                          );
                        }}
                      >
                        {resultados.every(
                          (
                            resultado,
                          ) =>
                            seleccionados.some(
                              (
                                seleccionado,
                              ) =>
                                seleccionado.indice ===
                                resultado.indice,
                            ),
                        )
                          ? 'Quitar selección'
                          : 'Seleccionar todos'}
                      </button>
                    </div>
                  )}

                  <div className="crear-quiz-resultados">
                    {resultados.map(
                      (
                        resultado,
                      ) => {
                        const activo =
                          seleccionados.some(
                            (
                              item,
                            ) =>
                              item.indice ===
                              resultado.indice,
                          );

                        return (
                          <button
                            key={
                              resultado.indice
                            }
                            type="button"
                            className={
                              activo
                                ? 'activo'
                                : ''
                            }
                            onClick={() =>
                              alternarResultado(
                                resultado,
                              )
                            }
                          >
                            <span className="crear-quiz-check">
                              {activo && (
                                <Check
                                  size={
                                    14
                                  }
                                />
                              )}
                            </span>

                            <span>
                              <strong>
                                {resultado.titulo}
                              </strong>

                              <small>
                                {resultado.tipo}
                              </small>

                              <p>
                                {resultado.vistaPrevia}
                              </p>
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>

                  <div className="crear-quiz-nota">
                    <CheckCircle2
                      size={
                        16
                      }
                    />

                    {seleccionados.length} fragmento(s) seleccionado(s)
                  </div>
                </section>
              )}
            </>
          )}

          {paso ===
            3 && (
            <>
              <section className="crear-quiz-seccion">
                <header className="crear-quiz-seccion__cabecera">
                  <span>
                    <BrainCircuit
                      size={
                        19
                      }
                    />
                  </span>

                  <div>
                    <strong>
                      Preguntas inteligentes
                    </strong>

                    <small>
                      Define cuántas preguntas generar y revisa cada borrador.
                    </small>
                  </div>
                </header>

                <div className="crear-quiz-config-preguntas">
                  <ContadorNumero
                    etiqueta="Cantidad de preguntas"
                    valor={
                      datos.cantidadPreguntas
                    }
                    minimo={
                      1
                    }
                    maximo={
                      30
                    }
                    onChange={(
                      valor,
                    ) => {
                      const nuevoValorPorPregunta =
                        Math.max(
                          1,
                          Math.round(
                            puntajeMaximoQuiz /
                              Math.max(
                                1,
                                valor,
                              ),
                          ),
                        );

                      setDatos(
                        (
                          actual,
                        ) => ({
                          ...actual,

                          cantidadPreguntas:
                            valor,

                          puntajeMinimoVelocidad:
                            Math.min(
                              actual.puntajeMinimoVelocidad,
                              nuevoValorPorPregunta,
                            ),

                          descuentoVelocidadPorPosicion:
                            Math.min(
                              actual.descuentoVelocidadPorPosicion,
                              nuevoValorPorPregunta,
                            ),
                        }),
                      );
                    }}
                  />

                  <div className="crear-quiz-tipos">
                    {(
                      [
                        [
                          'OPCION_MULTIPLE',
                          'Opción múltiple',
                        ],

                        [
                          'VERDADERO_FALSO',
                          'Verdadero / Falso',
                        ],

                        [
                          'SELECCION_MULTIPLE',
                          'Selección múltiple',
                        ],
                      ] as Array<
                        [
                          TipoPreguntaQuiz,
                          string,
                        ]
                      >
                    ).map(
                      (
                        [
                          tipo,
                          etiqueta,
                        ],
                      ) => {
                        const activo =
                          tiposPregunta.includes(
                            tipo,
                          );

                        return (
                          <button
                            key={
                              tipo
                            }
                            type="button"
                            className={
                              activo
                                ? 'activo'
                                : ''
                            }
                            onClick={() =>
                              setTiposPregunta(
                                (
                                  actuales,
                                ) =>
                                  activo
                                    ? actuales.length >
                                      1
                                      ? actuales.filter(
                                          (
                                            item,
                                          ) =>
                                            item !==
                                            tipo,
                                        )
                                      : actuales
                                    : [
                                        ...actuales,
                                        tipo,
                                      ],
                              )
                            }
                          >
                            <span className="crear-quiz-check">
                              {activo && (
                                <Check
                                  size={
                                    13
                                  }
                                />
                              )}
                            </span>

                            {etiqueta}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <button
                    type="button"
                    className="crear-quiz-generar"
                    disabled={
                      bloqueado
                    }
                    onClick={() =>
                      void regenerar()
                    }
                  >
                    <WandSparkles
                      size={
                        16
                      }
                    />

                    Regenerar borrador
                  </button>
                </div>
              </section>

              <section className="crear-quiz-preguntas">
                {borradores.map(
                  (
                    pregunta,
                    indice,
                  ) => (
                    <article
                      key={
                        indice
                      }
                    >
                      <header>
                        <div>
                          <small>
                            Pregunta {indice + 1}
                          </small>

                          <strong>
                            {pregunta.tipo ===
                            'OPCION_MULTIPLE'
                              ? 'Opción múltiple'
                              : pregunta.tipo ===
                                  'VERDADERO_FALSO'
                                ? 'Verdadero / Falso'
                                : 'Selección múltiple'}
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setBorradores(
                              (
                                actuales,
                              ) =>
                                actuales.filter(
                                  (
                                    _,
                                    posicion,
                                  ) =>
                                    posicion !==
                                    indice,
                                ),
                            )
                          }
                        >
                          Eliminar
                        </button>
                      </header>

                      <textarea
                        rows={
                          2
                        }
                        value={
                          pregunta.enunciado
                        }
                        onChange={(
                          evento,
                        ) =>
                          setBorradores(
                            (
                              actuales,
                            ) =>
                              actuales.map(
                                (
                                  item,
                                  posicion,
                                ) =>
                                  posicion ===
                                  indice
                                    ? {
                                        ...item,

                                        enunciado:
                                          evento.target.value,
                                      }
                                    : item,
                              ),
                          )
                        }
                      />

                      <div className="crear-quiz-respuestas">
                        {pregunta.opciones.map(
                          (
                            opcion,
                            opcionIndice,
                          ) => (
                            <label
                              key={
                                opcionIndice
                              }
                              className={
                                opcion.esCorrecta
                                  ? 'correcta'
                                  : ''
                              }
                            >
                              <input
                                type={
                                  pregunta.tipo ===
                                  'SELECCION_MULTIPLE'
                                    ? 'checkbox'
                                    : 'radio'
                                }
                                name={`correcta-${indice}`}
                                checked={
                                  opcion.esCorrecta
                                }
                                onChange={() => {
                                  setBorradores(
                                    (
                                      actuales,
                                    ) =>
                                      actuales.map(
                                        (
                                          item,
                                          posicion,
                                        ) => {
                                          if (
                                            posicion !==
                                            indice
                                          ) {
                                            return item;
                                          }

                                          return {
                                            ...item,

                                            opciones:
                                              item.opciones.map(
                                                (
                                                  respuesta,
                                                  posicionRespuesta,
                                                ) => ({
                                                  ...respuesta,

                                                  esCorrecta:
                                                    item.tipo ===
                                                    'SELECCION_MULTIPLE'
                                                      ? posicionRespuesta ===
                                                        opcionIndice
                                                        ? !respuesta.esCorrecta
                                                        : respuesta.esCorrecta
                                                      : posicionRespuesta ===
                                                        opcionIndice,
                                                }),
                                              ),
                                          };
                                        },
                                      ),
                                  );
                                }}
                              />

                              <input
                                value={
                                  opcion.texto
                                }
                                onChange={(
                                  evento,
                                ) =>
                                  setBorradores(
                                    (
                                      actuales,
                                    ) =>
                                      actuales.map(
                                        (
                                          item,
                                          posicion,
                                        ) => {
                                          if (
                                            posicion !==
                                            indice
                                          ) {
                                            return item;
                                          }

                                          return {
                                            ...item,

                                            opciones:
                                              item.opciones.map(
                                                (
                                                  respuesta,
                                                  posicionRespuesta,
                                                ) =>
                                                  posicionRespuesta ===
                                                  opcionIndice
                                                    ? {
                                                        ...respuesta,

                                                        texto:
                                                          evento.target.value,
                                                      }
                                                    : respuesta,
                                              ),
                                          };
                                        },
                                      ),
                                  )
                                }
                              />
                            </label>
                          ),
                        )}
                      </div>

                      <div className="crear-quiz-fuente-pregunta">
                        <BookOpenCheck
                          size={
                            14
                          }
                        />

                        Fuente vinculada al fragmento seleccionado
                      </div>
                    </article>
                  ),
                )}
              </section>
            </>
          )}

          {paso ===
            4 && (
            <section className="crear-quiz-seccion">
              <header className="crear-quiz-seccion__cabecera">
                <span>
                  <Radio
                    size={
                      19
                    }
                  />
                </span>

                <div>
                  <strong>
                    Configuración de la sesión
                  </strong>

                  <small>
                    Define cómo iniciará el Quiz y cuánto tiempo tendrá cada pregunta.
                  </small>
                </div>
              </header>

              <div className="crear-quiz-subtitulo">
                Modalidad
              </div>

              <div className="crear-quiz-opciones">
                <button
                  type="button"
                  className={
                    datos.modalidad ===
                    'EN_VIVO'
                      ? 'activo'
                      : ''
                  }
                  onClick={() => {
                    actualizar(
                      'modalidad',
                      'EN_VIVO',
                    );

                    actualizar(
                      'fechaApertura',
                      '',
                    );

                    actualizar(
                      'horaApertura',
                      '',
                    );

                    actualizar(
                      'cierreAutomatico',
                      false,
                    );

                    actualizar(
                      'fechaCierre',
                      '',
                    );

                    actualizar(
                      'horaCierre',
                      '',
                    );
                  }}
                >
                  <Radio
                    size={
                      18
                    }
                  />

                  <span>
                    <strong>
                      En vivo
                    </strong>

                    <small>
                      Los estudiantes ingresan al lobby y esperan a que el docente presione Iniciar.
                    </small>
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    datos.modalidad ===
                    'PROGRAMADO'
                      ? 'activo'
                      : ''
                  }
                  onClick={() =>
                    actualizar(
                      'modalidad',
                      'PROGRAMADO',
                    )
                  }
                >
                  <Clock3
                    size={
                      18
                    }
                  />

                  <span>
                    <strong>
                      Programado
                    </strong>

                    <small>
                      La disponibilidad se controla automáticamente según la programación.
                    </small>
                  </span>
                </button>
              </div>

              {datos.modalidad ===
                'PROGRAMADO' && (
                <div className="crear-quiz-programacion">
                  <header>
                    <span>
                      <CalendarDays
                        size={
                          18
                        }
                      />
                    </span>

                    <div>
                      <strong>
                        Programación del Quiz
                      </strong>

                      <small>
                        Define cuándo se habilitará para los estudiantes.
                      </small>
                    </div>
                  </header>

                  <div className="crear-quiz-programacion__grid">
                    <label>
                      Fecha de apertura

                      <input
                        type="date"
                        value={
                          datos.fechaApertura
                        }
                        onChange={(
                          evento,
                        ) =>
                          actualizar(
                            'fechaApertura',
                            evento.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      Hora de apertura

                      <input
                        type="time"
                        value={
                          datos.horaApertura
                        }
                        onChange={(
                          evento,
                        ) =>
                          actualizar(
                            'horaApertura',
                            evento.target.value,
                          )
                        }
                      />
                    </label>
                  </div>

                  <label className="crear-quiz-switch crear-quiz-programacion__switch">
                    <span>
                      <strong>
                        Cierre automático
                      </strong>

                      <small>
                        Impide nuevos ingresos después de la fecha y hora configuradas.
                      </small>
                    </span>

                    <input
                      type="checkbox"
                      checked={
                        datos.cierreAutomatico
                      }
                      onChange={(
                        evento,
                      ) => {
                        actualizar(
                          'cierreAutomatico',
                          evento.target.checked,
                        );

                        if (
                          !evento.target.checked
                        ) {
                          actualizar(
                            'fechaCierre',
                            '',
                          );

                          actualizar(
                            'horaCierre',
                            '',
                          );
                        }
                      }}
                    />

                    <i>
                      <b />
                    </i>
                  </label>

                  {datos.cierreAutomatico && (
                    <div className="crear-quiz-programacion__grid">
                      <label>
                        Fecha de cierre

                        <input
                          type="date"
                          value={
                            datos.fechaCierre
                          }
                          onChange={(
                            evento,
                          ) =>
                            actualizar(
                              'fechaCierre',
                              evento.target.value,
                            )
                          }
                        />
                      </label>

                      <label>
                        Hora de cierre

                        <input
                          type="time"
                          value={
                            datos.horaCierre
                          }
                          onChange={(
                            evento,
                          ) =>
                            actualizar(
                              'horaCierre',
                              evento.target.value,
                            )
                          }
                        />
                      </label>
                    </div>
                  )}

                  <div className="crear-quiz-programacion__nota">
                    <Clock3
                      size={
                        15
                      }
                    />

                    <span>
                      El horario se guarda usando la hora local del docente y el backend lo conserva como fecha ISO.
                    </span>
                  </div>
                </div>
              )}

              <div className="crear-quiz-subtitulo">
                Tiempo por pregunta
              </div>

              <div className="crear-quiz-opciones">
                <button
                  type="button"
                  className={
                    datos.modoTiempo ===
                    'FIJO'
                      ? 'activo'
                      : ''
                  }
                  onClick={() =>
                    actualizar(
                      'modoTiempo',
                      'FIJO',
                    )
                  }
                >
                  <Clock3
                    size={
                      18
                    }
                  />

                  <span>
                    <strong>
                      Tiempo fijo
                    </strong>

                    <small>
                      Todas las preguntas usan la misma duración.
                    </small>
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    datos.modoTiempo ===
                    'AUTOMATICO_DIFICULTAD'
                      ? 'activo'
                      : ''
                  }
                  onClick={() =>
                    actualizar(
                      'modoTiempo',
                      'AUTOMATICO_DIFICULTAD',
                    )
                  }
                >
                  <Sparkles
                    size={
                      18
                    }
                  />

                  <span>
                    <strong>
                      Tiempo inteligente
                    </strong>

                    <small>
                      Ajusta la duración según la dificultad.
                    </small>
                  </span>
                </button>
              </div>

              {datos.modoTiempo ===
              'FIJO' ? (
                <div className="crear-quiz-tiempo">
                  {[
                    10,
                    20,
                    30,
                    45,
                    60,
                  ].map(
                    (
                      segundos,
                    ) => (
                      <button
                        key={
                          segundos
                        }
                        type="button"
                        className={
                          datos.tiempoPreguntaSegundos ===
                          segundos
                            ? 'activo'
                            : ''
                        }
                        onClick={() =>
                          actualizar(
                            'tiempoPreguntaSegundos',
                            segundos,
                          )
                        }
                      >
                        {segundos} s
                      </button>
                    ),
                  )}
                </div>
              ) : (
                <div className="crear-quiz-grid crear-quiz-grid--3">
                  <label>
                    Fácil

                    <select
                      value={
                        datos.tiempoFacilSegundos
                      }
                      onChange={(
                        evento,
                      ) =>
                        actualizar(
                          'tiempoFacilSegundos',
                          Number(
                            evento.target.value,
                          ),
                        )
                      }
                    >
                      <option value="10">
                        10 s
                      </option>

                      <option value="20">
                        20 s
                      </option>

                      <option value="30">
                        30 s
                      </option>
                    </select>
                  </label>

                  <label>
                    Medio

                    <select
                      value={
                        datos.tiempoMedioSegundos
                      }
                      onChange={(
                        evento,
                      ) =>
                        actualizar(
                          'tiempoMedioSegundos',
                          Number(
                            evento.target.value,
                          ),
                        )
                      }
                    >
                      <option value="20">
                        20 s
                      </option>

                      <option value="30">
                        30 s
                      </option>

                      <option value="45">
                        45 s
                      </option>
                    </select>
                  </label>

                  <label>
                    Difícil

                    <select
                      value={
                        datos.tiempoDificilSegundos
                      }
                      onChange={(
                        evento,
                      ) =>
                        actualizar(
                          'tiempoDificilSegundos',
                          Number(
                            evento.target.value,
                          ),
                        )
                      }
                    >
                      <option value="30">
                        30 s
                      </option>

                      <option value="45">
                        45 s
                      </option>

                      <option value="60">
                        60 s
                      </option>
                    </select>
                  </label>
                </div>
              )}

              <div className="crear-quiz-subtitulo">
                Ritmo
              </div>

              <div className="crear-quiz-opciones">
                <button
                  type="button"
                  className={
                    datos.ritmo ===
                    'CONTROL_DOCENTE'
                      ? 'activo'
                      : ''
                  }
                  onClick={() =>
                    actualizar(
                      'ritmo',
                      'CONTROL_DOCENTE',
                    )
                  }
                >
                  <strong>
                    Control docente
                  </strong>

                  <small>
                    El docente decide cuándo avanzar.
                  </small>
                </button>

                <button
                  type="button"
                  className={
                    datos.ritmo ===
                    'AUTOMATICO'
                      ? 'activo'
                      : ''
                  }
                  onClick={() =>
                    actualizar(
                      'ritmo',
                      'AUTOMATICO',
                    )
                  }
                >
                  <strong>
                    Automático
                  </strong>

                  <small>
                    Avanza cuando se agota el tiempo.
                  </small>
                </button>
              </div>
            </section>
          )}

          {paso ===
            5 && (
            <section className="crear-quiz-seccion">
              <header className="crear-quiz-seccion__cabecera">
                <span>
                  <Trophy
                    size={
                      19
                    }
                  />
                </span>

                <div>
                  <strong>
                    Evaluación y puntuación
                  </strong>

                  <small>
                    Define si tendrá nota y si se aplicará ranking competitivo.
                  </small>
                </div>
              </header>

              <div className="crear-quiz-opciones">
                <button
                  type="button"
                  className={
                    !datos.esCalificable
                      ? 'activo'
                      : ''
                  }
                  onClick={() => {
                    actualizar(
                      'esCalificable',
                      false,
                    );

                    actualizar(
                      'componente',
                      null,
                    );
                  }}
                >
                  <strong>
                    Práctica
                  </strong>

                  <small>
                    El resultado no afecta la nota.
                  </small>
                </button>

                <button
                  type="button"
                  className={
                    datos.esCalificable
                      ? 'activo'
                      : ''
                  }
                  onClick={() => {
                    actualizar(
                      'esCalificable',
                      true,
                    );

                    actualizar(
                      'componente',
                      datos.componente ??
                        'CONTINUA',
                    );
                  }}
                >
                  <strong>
                    Calificable
                  </strong>

                  <small>
                    Se registra en el libro de calificaciones.
                  </small>
                </button>
              </div>

              {datos.esCalificable && (
                <>
                  <div className="crear-quiz-titulo-con-ayuda">
                    <div className="crear-quiz-subtitulo">
                      Componente
                    </div>

                    <BotonAyudaQuiz
                      tema="componente"
                      etiqueta="el componente de evaluación"
                      onAbrir={
                        setTemaAyuda
                      }
                    />
                  </div>

                  <div className="crear-quiz-opciones">
                    <button
                      type="button"
                      className={
                        datos.componente ===
                        'CONTINUA'
                          ? 'activo'
                          : ''
                      }
                      onClick={() =>
                        actualizar(
                          'componente',
                          'CONTINUA',
                        )
                      }
                    >
                      <strong>
                        Continua
                      </strong>

                      <small>
                        Seguimiento del aprendizaje durante el hito.
                      </small>
                    </button>

                    <button
                      type="button"
                      className={
                        datos.componente ===
                        'PROCESUAL'
                          ? 'activo'
                          : ''
                      }
                      onClick={() =>
                        actualizar(
                          'componente',
                          'PROCESUAL',
                        )
                      }
                    >
                      <strong>
                        Procesual
                      </strong>

                      <small>
                        Evidencia de desempeño del proceso.
                      </small>
                    </button>
                  </div>
                </>
              )}

              <SwitchQuizConAyuda
                activo={
                  datos.usarRanking
                }
                titulo="Ranking competitivo"
                descripcion="Ordena por mayor puntaje y menor tiempo."
                tema="ranking"
                etiquetaAyuda="el ranking competitivo"
                onAbrirAyuda={
                  setTemaAyuda
                }
                onChange={(
                  activo,
                ) =>
                  actualizar(
                    'usarRanking',
                    activo,
                  )
                }
              />

              {datos.usarRanking && (
                <div className="crear-quiz-ranking-extra">
                  <SwitchQuizConAyuda
                    activo={
                      datos.usarPuntuacionVelocidad
                    }
                    titulo="Puntuación por velocidad"
                    descripcion="Ajusta el puntaje según el orden de las respuestas correctas."
                    tema="puntuacionVelocidad"
                    etiquetaAyuda="la puntuación por velocidad"
                    onAbrirAyuda={
                      setTemaAyuda
                    }
                    onChange={(
                      activo,
                    ) =>
                      actualizar(
                        'usarPuntuacionVelocidad',
                        activo,
                      )
                    }
                  />

                  {datos.usarPuntuacionVelocidad && (
                    <div className="crear-quiz-velocidad-grid">
                      <div className="crear-quiz-valor-pregunta">
                        <span>
                          Valor por pregunta
                        </span>

                        <strong>
                          {formatearPuntajePregunta(
                            valorPorPregunta,
                          )}
                        </strong>

                        <small>
                          pts · redondeado
                        </small>
                      </div>

                      <ContadorNumero
                        etiqueta="Descuento por posición"
                        valor={
                          Math.round(
                            datos.descuentoVelocidadPorPosicion,
                          )
                        }
                        minimo={
                          1
                        }
                        maximo={
                          Math.max(
                            1,
                            valorPorPregunta,
                          )
                        }
                        paso={
                          1
                        }
                        onChange={(
                          valor,
                        ) =>
                          actualizar(
                            'descuentoVelocidadPorPosicion',
                            Math.round(
                              Math.min(
                                valor,
                                valorPorPregunta,
                              ),
                            ),
                          )
                        }
                      />

                      <ContadorNumero
                        etiqueta="Puntaje mínimo protegido"
                        valor={
                          Math.round(
                            Math.min(
                              datos.puntajeMinimoVelocidad,
                              valorPorPregunta,
                            ),
                          )
                        }
                        minimo={
                          0
                        }
                        maximo={
                          valorPorPregunta
                        }
                        paso={
                          1
                        }
                        onChange={(
                          valor,
                        ) =>
                          actualizar(
                            'puntajeMinimoVelocidad',
                            Math.round(
                              Math.min(
                                valor,
                                valorPorPregunta,
                              ),
                            ),
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="crear-quiz-resumen">
                <div>
                  <span>
                    Hito
                  </span>

                  <strong>
                    {resumen.hito
                      ? `${resumen.hito.codigo} · ${resumen.hito.nombre}`
                      : 'Sin seleccionar'}
                  </strong>
                </div>

                <div>
                  <span>
                    Fuente
                  </span>

                  <strong>
                    {datasetSeleccionado
                      ? `${datasetSeleccionado.contenidoTitulo} · v${datasetSeleccionado.numeroVersion}`
                      : 'Sin fuente'}
                  </strong>
                </div>

                <div>
                  <span>
                    Preguntas
                  </span>

                  <strong>
                    {borradores.length}
                  </strong>
                </div>

                <div>
                  <span>
                    Sesión
                  </span>

                  <strong>
                    {datos.modalidad ===
                    'EN_VIVO'
                      ? 'En vivo'
                      : datos.fechaApertura &&
                          datos.horaApertura
                        ? `Programado · ${datos.fechaApertura} ${datos.horaApertura}`
                        : 'Programado'}
                  </strong>
                </div>

                <div>
                  <span>
                    Tiempo
                  </span>

                  <strong>
                    {resumen.tiempo}
                  </strong>
                </div>

                <div>
                  <span>
                    Evaluación
                  </span>

                  <strong>
                    {resumen.evaluacion}
                  </strong>
                </div>
              </div>
            </section>
          )}
        </div>

        <style>
          {styles}
        </style>
      </div>
      </AulaModal>

      {temaAyuda && (
        <div
          className="crear-quiz-ayuda-modal__fondo"
          role="presentation"
          onMouseDown={(
            evento,
          ) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
              setTemaAyuda(
                null,
              );
            }
          }}
        >
          <section
            className="crear-quiz-ayuda-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crear-quiz-ayuda-titulo"
          >
            <header>
              <span>
                <Info
                  size={
                    20
                  }
                />
              </span>

              <div>
                <small>
                  Ayuda
                </small>

                <h3 id="crear-quiz-ayuda-titulo">
                  {ayudas[
                    temaAyuda
                  ].titulo}
                </h3>
              </div>

              <button
                type="button"
                aria-label="Cerrar ayuda"
                onClick={() =>
                  setTemaAyuda(
                    null,
                  )
                }
              >
                <X
                  size={
                    18
                  }
                />
              </button>
            </header>

            <div className="crear-quiz-ayuda-modal__contenido">
              <p>
                {
                  ayudas[
                    temaAyuda
                  ].introduccion
                }
              </p>

              <ul>
                {ayudas[
                  temaAyuda
                ].opciones.map(
                  (
                    opcion,
                  ) => (
                    <li
                      key={
                        opcion
                      }
                    >
                      <Check
                        size={
                          16
                        }
                      />

                      <span>
                        {
                          opcion
                        }
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <footer>
              <button
                type="button"
                onClick={() =>
                  setTemaAyuda(
                    null,
                  )
                }
              >
                Entendido
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

const styles = `
  .crear-quiz,
  .crear-quiz input,
  .crear-quiz textarea,
  .crear-quiz select,
  .crear-quiz option {
    color-scheme: light;
  }

  .crear-quiz {
    height: 100%;
    min-height: 0;
    position: relative;
    overflow: hidden;
    color: var(--app-text);
    background: var(--app-surface);
    font-size: 12px;
  }

  .crear-quiz-layout {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px 16px 88px;
    scrollbar-width: thin;
    scrollbar-color: var(--app-border-strong) transparent;
    scrollbar-gutter: stable;
  }

  .crear-quiz-pasos {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    padding: 8px 18px;
    border-bottom: 1px solid var(--app-border-soft);
    background: var(--app-surface-alt);
  }

  .crear-quiz-pasos button {
    min-height: 30px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 2px 0;
    border: 0;
    color: var(--app-text-muted);
    background: transparent;
    font: inherit;
    cursor: default;
  }

  .crear-quiz-pasos__estado {
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border-strong);
    border-radius: 50%;
    background: var(--app-card);
    font-size: 10px;
    font-weight: 900;
  }

  .crear-quiz-pasos__texto {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .crear-quiz-pasos small {
    font-size: 10px;
    font-weight: 850;
  }

  .crear-quiz-pasos button.activo,
  .crear-quiz-pasos button.completo {
    color: var(--app-accent-dark);
  }

  .crear-quiz-pasos button.activo .crear-quiz-pasos__estado,
  .crear-quiz-pasos button.completo .crear-quiz-pasos__estado {
    border-color: var(--app-accent);
    color: white;
    background: var(--app-accent);
    box-shadow: 0 5px 12px color-mix(in srgb, var(--app-accent) 24%, transparent);
  }

  .crear-quiz-seccion {
    display: grid;
    gap: 10px;
  }

  .crear-quiz-seccion + .crear-quiz-seccion {
    margin-top: 18px;
  }

  .crear-quiz-seccion__cabecera {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    padding-bottom: 10px;
  }

  .crear-quiz-seccion__cabecera > span {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--app-accent) 18%, transparent);
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .crear-quiz-seccion__cabecera > div {
    display: grid;
    gap: 3px;
  }

  .crear-quiz-seccion__cabecera strong {
    font-size: 16px;
    line-height: 1.2;
  }

  .crear-quiz-seccion__cabecera small {
    color: var(--app-text-muted);
    font-size: 11px;
  }

  .crear-quiz-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
  }

  .crear-quiz-grid--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .crear-quiz-grid > label,
  .crear-quiz-seccion > label {
    display: grid;
    gap: 5px;
    color: var(--app-text-secondary);
    font-size: 12px;
    font-weight: 800;
  }

  .crear-quiz input,
  .crear-quiz textarea,
  .crear-quiz select {
    width: 100%;
    min-height: 42px;
    box-sizing: border-box;
    padding: 8px 12px;
    border: 1px solid var(--app-border-strong);
    border-radius: 11px;
    outline: 0;
    color: var(--app-text);
    background: var(--app-surface);
    font: inherit;
    font-size: 12px;
    font-weight: 400;
  }

  .crear-quiz textarea {
    min-height: 72px;
    resize: vertical;
  }

  .crear-quiz input:focus,
  .crear-quiz textarea:focus,
  .crear-quiz select:focus {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-accent) 12%, transparent);
  }

  .ancho-completo {
    grid-column: 1 / -1;
  }

  .crear-quiz-subtitulo {
    margin-top: 5px;
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 850;
  }

  .crear-quiz-opciones {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .crear-quiz-opciones--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .crear-quiz-opciones button {
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .crear-quiz-opciones button > span {
    display: grid;
    gap: 2px;
  }

  .crear-quiz-opciones button strong {
    color: var(--app-text);
    font-size: 11px;
  }

  .crear-quiz-opciones button small {
    color: var(--app-text-muted);
    font-size: 9px;
    line-height: 1.4;
  }

  .crear-quiz-opciones button.activo {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: 0 0 0 1px var(--app-accent);
  }

  .crear-quiz-datasets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .crear-quiz-datasets > button {
    min-width: 0;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .crear-quiz-datasets > button.activo {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
    box-shadow: 0 0 0 1px var(--app-accent);
  }

  .crear-quiz-dataset__icono {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .crear-quiz-dataset__texto {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .crear-quiz-dataset__texto strong {
    overflow: hidden;
    color: var(--app-text);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .crear-quiz-dataset__texto small {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .crear-quiz-modos-busqueda {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .crear-quiz-modos-busqueda > button {
    min-width: 0;
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .crear-quiz-modos-busqueda > button > span {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
  }

  .crear-quiz-modos-busqueda > button > div {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  .crear-quiz-modos-busqueda strong {
    color: var(--app-text);
    font-size: 10.5px;
    font-weight: 850;
  }

  .crear-quiz-modos-busqueda small {
    color: var(--app-text-muted);
    font-size: 8.8px;
    line-height: 1.4;
  }

  .crear-quiz-modos-busqueda > button.activo {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
    box-shadow: 0 0 0 1px var(--app-accent);
  }

  .crear-quiz-rango {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
    align-items: end;
    gap: 9px;
  }

  .crear-quiz-rango > label {
    display: grid;
    gap: 5px;
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 800;
  }

  .crear-quiz-rango__separador {
    padding-bottom: 13px;
    color: var(--app-text-muted);
    font-size: 9px;
    font-weight: 800;
  }

  .crear-quiz-rango > button {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    border: 0;
    border-radius: 11px;
    color: white;
    background: var(--app-accent);
    font: inherit;
    font-size: 10.5px;
    font-weight: 850;
    cursor: pointer;
  }

  .crear-quiz-rango-resumen {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 11px;
    border: 1px solid color-mix(in srgb, var(--app-accent) 24%, var(--app-border));
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .crear-quiz-rango-resumen > div {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .crear-quiz-rango-resumen > div > span {
    display: grid;
    gap: 2px;
  }

  .crear-quiz-rango-resumen strong {
    font-size: 10px;
  }

  .crear-quiz-rango-resumen small {
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .crear-quiz-rango-resumen > button {
    flex-shrink: 0;
    padding: 6px 9px;
    border: 1px solid color-mix(in srgb, var(--app-accent) 30%, var(--app-border));
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font: inherit;
    font-size: 8.5px;
    font-weight: 850;
    cursor: pointer;
  }

  .crear-quiz-busqueda {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
  }

  .crear-quiz-busqueda__campo {
    min-width: 0;
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 13px;
    border: 1px solid var(--app-border-strong);
    border-radius: 12px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    transition:
      border-color .16s ease,
      box-shadow .16s ease;
  }

  .crear-quiz-busqueda__campo:focus-within {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 12%,
        transparent
      );
  }

  .crear-quiz-busqueda__campo > svg {
    flex: 0 0 auto;
  }

  .crear-quiz-busqueda__campo input {
    min-width: 0;
    min-height: 42px;
    padding: 0;
    border: 0 !important;
    outline: 0;
    background: transparent;
    box-shadow: none !important;
  }

  .crear-quiz-busqueda__campo input:focus {
    border: 0 !important;
    outline: 0;
    box-shadow: none !important;
  }

  .crear-quiz-busqueda > button,
  .crear-quiz-generar {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    border: 0;
    border-radius: 12px;
    color: white;
    background: var(--app-accent);
    font: inherit;
    font-size: 11px;
    font-weight: 850;
    cursor: pointer;
  }

  .crear-quiz-busqueda > button:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .crear-quiz-resultados {
    max-height: 310px;
    display: grid;
    gap: 8px;
    overflow-y: auto;
    padding-right: 3px;
    scrollbar-width: thin;
  }

  .crear-quiz-resultados > button {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr);
    gap: 9px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    color: var(--app-text);
    background: var(--app-surface-alt);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .crear-quiz-resultados > button.activo {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .crear-quiz-check {
    width: 23px;
    height: 23px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border-strong);
    border-radius: 7px;
    color: white;
    background: var(--app-surface);
  }

  .activo > .crear-quiz-check,
  .crear-quiz-tipos button.activo .crear-quiz-check {
    border-color: var(--app-accent);
    background: var(--app-accent);
  }

  .crear-quiz-resultados strong {
    font-size: 10.5px;
  }

  .crear-quiz-resultados small {
    display: block;
    margin-top: 2px;
    color: var(--app-accent-dark);
    font-size: 8px;
    font-weight: 850;
  }

  .crear-quiz-resultados p {
    margin: 5px 0 0;
    color: var(--app-text-muted);
    font-size: 9px;
    line-height: 1.45;
  }

  .crear-quiz-nota {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 10px;
    border-radius: 11px;
    color: #246a43;
    background: #eaf8ef;
    font-size: 9.5px;
    font-weight: 750;
  }

  .crear-quiz-config-preguntas {
    display: grid;
    grid-template-columns: minmax(190px, .7fr) minmax(0, 1.5fr) auto;
    align-items: end;
    gap: 10px;
  }

  .crear-quiz-contador {
    min-height: 70px;
    display: grid;
    place-items: center;
    gap: 5px;
    padding: 8px 10px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .crear-quiz-contador > span {
    color: var(--app-text-secondary);
    font-size: 10.5px;
    font-weight: 800;
  }

  .crear-quiz-contador > div {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .crear-quiz-contador button {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    cursor: pointer;
  }

  .crear-quiz-contador button:disabled {
    opacity: .4;
    cursor: not-allowed;
  }

  .crear-quiz-contador strong {
    min-width: 26px;
    text-align: center;
    font-size: 19px;
  }

  .crear-quiz-tipos {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .crear-quiz-tipos button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 6px 9px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    font-size: 9px;
    font-weight: 750;
    cursor: pointer;
  }

  .crear-quiz-tipos button.activo {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .crear-quiz-preguntas {
    display: grid;
    gap: 10px;
    margin-top: 14px;
  }

  .crear-quiz-preguntas article {
    display: grid;
    gap: 10px;
    padding: 13px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .crear-quiz-preguntas article > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .crear-quiz-preguntas article > header > div {
    display: grid;
    gap: 2px;
  }

  .crear-quiz-preguntas article > header small {
    color: var(--app-accent-dark);
    font-size: 8.5px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .crear-quiz-preguntas article > header strong {
    font-size: 11px;
  }

  .crear-quiz-preguntas article > header button {
    border: 0;
    color: var(--app-danger);
    background: transparent;
    font: inherit;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }

  .crear-quiz-respuestas {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .crear-quiz-respuestas label {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 7px;
    padding: 7px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: var(--app-surface);
  }

  .crear-quiz-respuestas label.correcta {
    border-color: #b9e2c8;
    background: #eaf8ef;
  }

  .crear-quiz-respuestas input:last-child {
    min-height: 35px;
    padding: 7px 8px;
    font-size: 9px;
  }

  .crear-quiz-fuente-pregunta {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .crear-quiz-programacion {
    display: grid;
    gap: 10px;
    padding: 12px;
    border: 1px solid color-mix(in srgb, var(--app-accent) 30%, var(--app-border));
    border-radius: 14px;
    background: color-mix(in srgb, var(--app-accent-soft) 58%, var(--app-surface));
  }

  .crear-quiz-programacion > header {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
  }

  .crear-quiz-programacion > header > span {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
  }

  .crear-quiz-programacion > header > div {
    display: grid;
    gap: 2px;
  }

  .crear-quiz-programacion > header strong {
    font-size: 11px;
  }

  .crear-quiz-programacion > header small {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .crear-quiz-programacion__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .crear-quiz-programacion__grid label {
    display: grid;
    gap: 5px;
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 800;
  }

  .crear-quiz-programacion__switch {
    background: var(--app-surface) !important;
  }

  .crear-quiz-programacion__nota {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 10px;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font-size: 8.7px;
    line-height: 1.4;
  }

  .crear-quiz-tiempo {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .crear-quiz-tiempo button {
    min-width: 72px;
    min-height: 38px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
  }

  .crear-quiz-tiempo button.activo {
    border-color: var(--app-accent);
    color: white;
    background: var(--app-accent);
  }

  .crear-quiz-switch {
    min-height: 48px;
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 10px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .crear-quiz-switch > span {
    display: grid;
    gap: 2px;
  }

  .crear-quiz-switch strong {
    font-size: 10.5px;
  }

  .crear-quiz-switch small {
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .crear-quiz-switch input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .crear-quiz-switch i {
    width: 38px;
    height: 21px;
    flex: 0 0 auto;
    padding: 2px;
    border-radius: 20px;
    background: var(--app-border-strong);
    transition: .2s;
  }

  .crear-quiz-switch i b {
    display: block;
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px #0002;
    transition: .2s;
  }

  .crear-quiz-switch input:checked + i {
    background: var(--app-accent);
  }

  .crear-quiz-switch input:checked + i b {
    transform: translateX(17px);
  }

  .crear-quiz-ranking-extra { display: grid; gap: 10px; }

  .crear-quiz-info-rapidez {
    display: grid; align-content: center; gap: 4px; min-height: 72px;
    padding: 12px 14px; border: 1px solid var(--app-border);
    border-radius: 12px; background: var(--app-surface-alt);
  }

  .crear-quiz-info-rapidez strong { font-size: 10px; }
  .crear-quiz-info-rapidez span {
    color: var(--app-text-muted); font-size: 9px; line-height: 1.45;
  }

  .crear-quiz-resumen {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 6px;
    padding: 11px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .crear-quiz-resumen > div {
    display: grid;
    gap: 3px;
    padding: 8px;
    border-radius: 9px;
    background: var(--app-surface);
  }

  .crear-quiz-resumen span {
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .crear-quiz-resumen strong {
    color: var(--app-text);
    font-size: 10px;
  }

  .crear-quiz-vacio {
    grid-column: 1 / -1;
    padding: 15px;
    border: 1px dashed var(--app-border-strong);
    border-radius: 12px;
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    font-size: 10px;
    text-align: center;
  }

  .crear-quiz-btn {
    min-width: 118px;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 15px;
    border-radius: 12px;
    font: inherit;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
  }

  .crear-quiz-btn.secundario {
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .crear-quiz-btn.primario {
    border: 0;
    color: white;
    background: linear-gradient(135deg, var(--app-accent), var(--app-accent-hover));
  }

  .crear-quiz-btn:disabled {
    opacity: .6;
    cursor: not-allowed;
  }


  .crear-quiz-titulo-con-ayuda {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .crear-quiz-switch-con-ayuda {
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      28px;
    align-items: center;
    gap: 8px;
  }

  .crear-quiz-switch-con-ayuda
  > .crear-quiz-switch {
    width: 100%;
  }

  .crear-quiz-switch-con-ayuda
  > .crear-quiz-ayuda-boton {
    justify-self: center;
  }

  .crear-quiz-velocidad-grid {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px;
  }

  .crear-quiz-valor-pregunta {
    min-height: 64px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 3px;
    padding: 7px 10px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    background: var(--app-surface-alt);
    text-align: center;
  }

  .crear-quiz-valor-pregunta > span {
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 800;
  }

  .crear-quiz-valor-pregunta > strong {
    color: var(--app-text);
    font-size: 20px;
    line-height: 1;
  }

  .crear-quiz-valor-pregunta > small {
    color: var(--app-text-muted);
    font-size: 8.5px;
    font-weight: 600;
  }

  .crear-quiz-ayuda-boton {
    width: 21px;
    height: 21px;
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    padding: 0;
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-accent) 55%,
        var(--app-border)
      );
    border-radius: 50%;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font: inherit;
    font-size: 12px;
    font-weight: 850;
    line-height: 1;
    cursor: pointer;
  }

  .crear-quiz-ayuda-boton:hover,
  .crear-quiz-ayuda-boton:focus-visible {
    border-color: var(--app-accent);
    outline: 3px solid
      color-mix(
        in srgb,
        var(--app-accent) 14%,
        transparent
      );
  }

  .crear-quiz-ayuda-modal__fondo {
    position: fixed;
    inset: 0;
    z-index: 96000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(15, 23, 42, .64);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }

  .crear-quiz-ayuda-modal {
    width: min(
      520px,
      calc(100vw - 32px)
    );
    max-height: min(
      650px,
      calc(100vh - 40px)
    );
    display: grid;
    grid-template-rows:
      auto
      minmax(
        0,
        1fr
      )
      auto;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 20px;
    color: var(--app-text);
    background: var(--app-surface);
    box-shadow:
      0 28px 80px
      rgba(
        15,
        23,
        42,
        .34
      );
    animation:
      crearQuizAyudaEntrada
      .18s
      ease-out;
  }

  .crear-quiz-ayuda-modal header {
    display: grid;
    grid-template-columns:
      40px
      minmax(
        0,
        1fr
      )
      34px;
    align-items: center;
    gap: 11px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--app-border-soft);
    background:
      linear-gradient(
        135deg,
        var(--app-surface),
        var(--app-accent-soft)
      );
  }

  .crear-quiz-ayuda-modal header > span {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 75%,
        var(--app-surface)
      );
  }

  .crear-quiz-ayuda-modal header small {
    color: var(--app-accent-dark);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .crear-quiz-ayuda-modal h3 {
    margin: 2px 0 0;
    font-size: 17px;
  }

  .crear-quiz-ayuda-modal header button {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    cursor: pointer;
  }

  .crear-quiz-ayuda-modal__contenido {
    overflow-y: auto;
    padding: 16px;
  }

  .crear-quiz-ayuda-modal__contenido p {
    margin: 0 0 12px;
    color: var(--app-text-secondary);
    font-size: 12px;
    line-height: 1.55;
  }

  .crear-quiz-ayuda-modal__contenido ul {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .crear-quiz-ayuda-modal__contenido li {
    display: grid;
    grid-template-columns:
      22px
      minmax(
        0,
        1fr
      );
    gap: 8px;
    align-items: start;
    padding: 9px 10px;
    border: 1px solid var(--app-border-soft);
    border-radius: 11px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: 11px;
    line-height: 1.45;
  }

  .crear-quiz-ayuda-modal__contenido li svg {
    margin-top: 1px;
    color: var(--app-accent-dark);
  }

  .crear-quiz-ayuda-modal footer {
    display: flex;
    justify-content: flex-end;
    padding: 11px 16px;
    border-top: 1px solid var(--app-border-soft);
  }

  .crear-quiz-ayuda-modal footer button {
    min-width: 110px;
    padding: 9px 15px;
    border: 0;
    border-radius: 10px;
    color: white;
    background: var(--app-accent);
    font: inherit;
    font-size: 11px;
    font-weight: 750;
    cursor: pointer;
  }

  @keyframes crearQuizAyudaEntrada {
    from {
      opacity: 0;
      transform:
        translateY(
          7px
        )
        scale(
          .99
        );
    }

    to {
      opacity: 1;
      transform:
        translateY(
          0
        )
        scale(
          1
        );
    }
  }

  @media (max-width: 900px) {
    .crear-quiz-velocidad-grid {
      grid-template-columns:
        1fr;
    }

    .crear-quiz-opciones--3,
    .crear-quiz-grid--3,
    .crear-quiz-resumen,
    .crear-quiz-config-preguntas {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .crear-quiz-pasos small {
      display: none;
    }

    .crear-quiz-grid,
    .crear-quiz-opciones,
    .crear-quiz-datasets,
    .crear-quiz-busqueda,
    .crear-quiz-respuestas,
    .crear-quiz-modos-busqueda,
    .crear-quiz-rango,
    .crear-quiz-programacion__grid {
      grid-template-columns: 1fr;
    }

    .crear-quiz-rango__separador {
      display: none;
    }

    .crear-quiz-rango-resumen {
      align-items: stretch;
      flex-direction: column;
    }

    .ancho-completo {
      grid-column: auto;
    }
  }
`;