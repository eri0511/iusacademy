import {
  CheckCircle2,
  CirclePause,
  CirclePlay,
  CircleStop,
  Clock3,
  Crown,
  Medal,
  Radio,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useParams,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../auth/AuthContext';

import ResultadosQuizDocente from '../../../components/quizzes/ResultadosQuizDocente';

import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import {
  activarQuiz,
  finalizarQuiz,
  iniciarQuiz,
  obtenerEstadoEnVivoQuiz,
  obtenerLobbyQuiz,
  obtenerQuiz,
  pausarQuiz,
  reanudarQuiz,
  siguientePreguntaQuiz,
} from '../../../services/quizzes/quizzes.service';

import type {
  EstadoEnVivoQuiz,
  ItemRankingEnVivoQuiz,
  LobbyQuiz,
  QuizCurso,
} from '../../../types/quizzes/quizzes.types';

type EstadoToast = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje?: string;
};

function nombreRanking(
  item:
    ItemRankingEnVivoQuiz,
) {
  return [
    item.nombres,
    item.apellidoPaterno,
    item.apellidoMaterno,
  ]
    .filter(
      Boolean,
    )
    .join(
      ' ',
    );
}

function inicialesRanking(
  item:
    ItemRankingEnVivoQuiz,
) {
  return [
    item.nombres,
    item.apellidoPaterno,
  ]
    .filter(
      Boolean,
    )
    .map(
      (
        parte,
      ) =>
        parte.charAt(
          0,
        ),
    )
    .join(
      '',
    )
    .toUpperCase();
}

function nombreLobby(
  participante:
    LobbyQuiz['participantes'][number],
) {
  return [
    participante.estudiante.nombres,
    participante.estudiante.apellidoPaterno,
    participante.estudiante.apellidoMaterno,
  ]
    .filter(
      Boolean,
    )
    .join(
      ' ',
    );
}

function inicialesLobby(
  participante:
    LobbyQuiz['participantes'][number],
) {
  return [
    participante.estudiante.nombres,
    participante.estudiante.apellidoPaterno,
  ]
    .filter(
      Boolean,
    )
    .map(
      (
        parte,
      ) =>
        parte.charAt(
          0,
        ),
    )
    .join(
      '',
    )
    .toUpperCase();
}

function textoEstado(
  estado:
    QuizCurso['estado'],
) {
  switch (
    estado
  ) {
    case 'ESPERANDO':
      return 'Sala de espera';

    case 'CUENTA_REGRESIVA':
      return 'Iniciando';

    case 'EN_CURSO':
      return 'En curso';

    case 'PAUSADO':
      return 'Pausado';

    case 'FINALIZADO':
      return 'Finalizado';

    default:
      return estado;
  }
}

function formatearTiempo(
  ms:
    number,
) {
  const segundos =
    Math.floor(
      ms /
        1000,
    );

  const minutos =
    Math.floor(
      segundos /
        60,
    );

  return `${minutos}:${String(
    segundos %
      60,
  ).padStart(
    2,
    '0',
  )}`;
}

function RankingEnVivo({
  ranking,
  finalizado,
}: {
  ranking: ItemRankingEnVivoQuiz[];
  finalizado: boolean;
}) {
  const maximo =
    Math.max(
      1,
      ...ranking.map(
        (
          item,
        ) =>
          item.puntajeActual,
      ),
    );

  return (
    <section className="quiz-live__panel quiz-live__ranking">
      <div className="quiz-live__panel-head">
        <div>
          <span className="quiz-live__eyebrow">
            {finalizado
              ? 'Clasificación final'
              : 'Actualización automática'}
          </span>

          <h2>
            <Trophy
              size={
                19
              }
            />

            {finalizado
              ? 'Ranking completo'
              : 'Clasificación en vivo'}
          </h2>
        </div>

        {!finalizado && (
          <span className="quiz-live__live">
            <i />

            EN VIVO
          </span>
        )}
      </div>

      {ranking.length ===
      0 ? (
        <div className="quiz-live__vacio">
          Aún no hay participantes para clasificar.
        </div>
      ) : (
        <div className="quiz-live__ranking-lista">
          {ranking.map(
            (
              item,
            ) => {
              const porcentaje =
                item.puntajeActual <=
                0
                  ? 0
                  : Math.max(
                      7,
                      (
                        item.puntajeActual /
                        maximo
                      ) *
                        100,
                    );

              return (
                <article
                  className={`quiz-live__ranking-item ${
                    item.posicion <=
                    3
                      ? `quiz-live__ranking-item--top-${item.posicion}`
                      : ''
                  }`}
                  key={
                    item.estudianteId
                  }
                >
                  <span className="quiz-live__posicion">
                    {item.posicion <=
                    3 ? (
                      <Medal
                        size={
                          17
                        }
                      />
                    ) : (
                      item.posicion
                    )}
                  </span>

                  <span className="quiz-live__avatar">
                    {
                      inicialesRanking(
                        item,
                      )
                    }
                  </span>

                  <div className="quiz-live__ranking-cuerpo">
                    <div className="quiz-live__ranking-info">
                      <strong>
                        {
                          nombreRanking(
                            item,
                          )
                        }
                      </strong>

                      <small>
                        {item.respuestasCorrectas} correctas · {item.respuestasIncorrectas} incorrectas · {formatearTiempo(
                          item.tiempoAcumuladoMs,
                        )}
                      </small>
                    </div>

                    <div className="quiz-live__barra">
                      <i
                        style={{
                          width:
                            `${porcentaje}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="quiz-live__puntos">
                    <strong>
                      {
                        Number.isInteger(
                          item.puntajeActual,
                        )
                          ? item.puntajeActual
                          : item.puntajeActual.toFixed(
                              1,
                            )
                      }
                    </strong>

                    <small>
                      pts
                    </small>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}

function Podio({
  ranking,
}: {
  ranking: ItemRankingEnVivoQuiz[];
}) {
  const primero =
    ranking[
      0
    ];

  const segundo =
    ranking[
      1
    ];

  const tercero =
    ranking[
      2
    ];

  const tarjeta = (
    item:
      ItemRankingEnVivoQuiz |
      undefined,
    lugar:
      1 |
      2 |
      3,
  ) => {
    if (
      !item
    ) {
      return (
        <div className={`quiz-live__podio-card quiz-live__podio-card--${lugar} quiz-live__podio-card--vacio`}>
          Sin participante
        </div>
      );
    }

    return (
      <article className={`quiz-live__podio-card quiz-live__podio-card--${lugar}`}>
        <div className="quiz-live__podio-medalla">
          {lugar ===
          1 ? (
            <Crown
              size={
                25
              }
            />
          ) : (
            <Medal
              size={
                23
              }
            />
          )}
        </div>

        <div className="quiz-live__podio-avatar">
          {
            inicialesRanking(
              item,
            )
          }
        </div>

        <strong>
          {
            nombreRanking(
              item,
            )
          }
        </strong>

        <b>
          {
            Number.isInteger(
              item.puntajeActual,
            )
              ? item.puntajeActual
              : item.puntajeActual.toFixed(
                  1,
                )
          } pts
        </b>

        <small>
          {lugar}.º lugar
        </small>
      </article>
    );
  };

  return (
    <section className="quiz-live__podio-panel">
      <span className="quiz-live__eyebrow">
        Resultado final
      </span>

      <h2>
        <Trophy
          size={
            21
          }
        />

        Podio del Quiz
      </h2>

      <div className="quiz-live__podio">
        {
          tarjeta(
            segundo,
            2,
          )
        }

        {
          tarjeta(
            primero,
            1,
          )
        }

        {
          tarjeta(
            tercero,
            3,
          )
        }
      </div>
    </section>
  );
}

export default function DetalleQuizDocentePagina() {
  const {
    quizId:
      quizIdParametro,
  } =
    useParams();

  const {
    accessToken,
  } =
    useAuth();

  const cursoId =
    Number(
      useParams().cursoId,
    );

  const quizId =
    Number(
      quizIdParametro,
    );

  const [
    quiz,
    setQuiz,
  ] =
    useState<QuizCurso | null>(
      null,
    );

  const [
    lobby,
    setLobby,
  ] =
    useState<LobbyQuiz | null>(
      null,
    );

  const [
    vivo,
    setVivo,
  ] =
    useState<EstadoEnVivoQuiz | null>(
      null,
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const [
    procesando,
    setProcesando,
  ] =
    useState(
      false,
    );

  const [
    ahora,
    setAhora,
  ] =
    useState(
      Date.now(),
    );

  const activandoRef =
    useRef(
      false,
    );

  const [
    toast,
    setToast,
  ] =
    useState<EstadoToast>({
      visible:
        false,

      tipo:
        'informacion',

      titulo:
        '',
    });

  const mostrarToast =
    useCallback(
      (
        tipo:
          TipoToast,
        titulo:
          string,
        mensaje?:
          string,
      ) => {
        setToast({
          visible:
            true,

          tipo,

          titulo,

          mensaje,
        });
      },
      [],
    );

  const cargar =
    useCallback(
      async (
        silencioso =
          false,
      ) => {
        if (
          !accessToken ||
          !Number.isFinite(
            cursoId,
          ) ||
          !Number.isFinite(
            quizId,
          )
        ) {
          return;
        }

        if (
          !silencioso
        ) {
          setCargando(
            true,
          );
        }

        try {
          const detalle =
            await obtenerQuiz(
              cursoId,
              quizId,
              accessToken,
            );

          setQuiz(
            detalle,
          );

          if (
            detalle.estado !==
            'BORRADOR'
          ) {
            const lobbyActual =
              await obtenerLobbyQuiz(
                cursoId,
                quizId,
                accessToken,
              );

            setLobby(
              lobbyActual,
            );
          }

          if (
            [
              'CUENTA_REGRESIVA',
              'EN_CURSO',
              'PAUSADO',
              'FINALIZADO',
            ].includes(
              detalle.estado,
            )
          ) {
            const estado =
              await obtenerEstadoEnVivoQuiz(
                cursoId,
                quizId,
                accessToken,
              );

            setVivo(
              estado,
            );
          } else {
            setVivo(
              null,
            );
          }
        } catch (
          error
        ) {
          if (
            !silencioso
          ) {
            mostrarToast(
              'error',
              'No fue posible cargar el Quiz',
              error instanceof
              Error
                ? error.message
                : undefined,
            );
          }
        } finally {
          if (
            !silencioso
          ) {
            setCargando(
              false,
            );
          }
        }
      },
      [
        accessToken,
        cursoId,
        quizId,
        mostrarToast,
      ],
    );

  useEffect(
    () => {
      void cargar();
    },
    [
      cargar,
    ],
  );

  useEffect(
    () => {
      const id =
        window.setInterval(
          () => {
            setAhora(
              Date.now(),
            );
          },
          500,
        );

      return () =>
        window.clearInterval(
          id,
        );
    },
    [],
  );

  useEffect(
    () => {
      if (
        !quiz ||
        quiz.estado !==
          'CUENTA_REGRESIVA' ||
        !quiz.inicioEn ||
        !accessToken ||
        activandoRef.current
      ) {
        return;
      }

      const inicioMs =
        new Date(
          quiz.inicioEn,
        ).getTime();

      if (
        Number.isNaN(
          inicioMs,
        ) ||
        ahora <
          inicioMs
      ) {
        return;
      }

      activandoRef.current =
        true;

      void activarQuiz(
        cursoId,
        quizId,
        accessToken,
      )
        .then(
          async () => {
            await cargar(
              true,
            );

            mostrarToast(
              'exito',
              'Primera pregunta habilitada',
            );
          },
        )
        .catch(
          (
            error,
          ) => {
            const mensaje =
              error instanceof
              Error
                ? error.message
                : '';

            /*
             * Si otro refresco ya activó la sesión, simplemente
             * recargamos. Evita mostrar un error falso por carrera.
             */
            if (
              mensaje
                .toLowerCase()
                .includes(
                  'no está en cuenta regresiva',
                )
            ) {
              void cargar(
                true,
              );

              return;
            }

            mostrarToast(
              'error',
              'No se pudo habilitar la primera pregunta',
              mensaje ||
                undefined,
            );
          },
        )
        .finally(
          () => {
            activandoRef.current =
              false;
          },
        );
    },
    [
      quiz?.estado,
      quiz?.inicioEn,
      ahora,
      accessToken,
      cursoId,
      quizId,
      cargar,
      mostrarToast,
    ],
  );

  useEffect(
    () => {
      if (
        !quiz ||
        ![
          'ESPERANDO',
          'CUENTA_REGRESIVA',
          'EN_CURSO',
          'PAUSADO',
        ].includes(
          quiz.estado,
        )
      ) {
        return;
      }

      const id =
        window.setInterval(
          () => {
            void cargar(
              true,
            );
          },
          1500,
        );

      return () =>
        window.clearInterval(
          id,
        );
    },
    [
      quiz?.estado,
      cargar,
    ],
  );

  const ejecutar =
    useCallback(
      async (
        accion:
          () =>
            Promise<unknown>,
        titulo:
          string,
      ) => {
        setProcesando(
          true,
        );

        try {
          await accion();

          mostrarToast(
            'exito',
            titulo,
          );

          await cargar(
            true,
          );
        } catch (
          error
        ) {
          mostrarToast(
            'error',
            'No fue posible completar la acción',
            error instanceof
            Error
              ? error.message
              : undefined,
          );
        } finally {
          setProcesando(
            false,
          );
        }
      },
      [
        cargar,
        mostrarToast,
      ],
    );

  const preguntaActual =
    useMemo(
      () =>
        quiz?.preguntas?.find(
          (
            pregunta,
          ) =>
            pregunta.orden ===
            quiz.preguntaActualOrden,
        ) ??
        null,
      [
        quiz,
      ],
    );

  const ranking =
    vivo?.ranking ??
    [];

  const segundosCuentaRegresiva =
    quiz?.estado ===
      'CUENTA_REGRESIVA' &&
    quiz.inicioEn
      ? Math.max(
          0,
          Math.ceil(
            (
              new Date(
                quiz.inicioEn,
              ).getTime() -
              ahora
            ) /
              1000,
          ),
        )
      : null;

  if (
    cargando
  ) {
    return (
      <section
        className="quiz-live quiz-live--loading-page"
        aria-label="Cargando sesión del Quiz"
      >
        <div className="quiz-live__loading-header">
          <span className="quiz-live__loading-back" />

          <div className="quiz-live__loading-title">
            <i />

            <strong />

            <small />
          </div>

          <span className="quiz-live__loading-state" />
        </div>

        <div className="quiz-live__loading-metrics">
          {Array.from({
            length:
              4,
          }).map(
            (
              _,
              indice,
            ) => (
              <article
                key={
                  indice
                }
              >
                <i />

                <span>
                  <small />

                  <strong />
                </span>
              </article>
            ),
          )}
        </div>

        <div className="quiz-live__loading-content">
          <section>
            <span />

            <strong />

            <small />

            <div>
              <i />
              <i />
              <i />
              <i />
            </div>
          </section>

          <aside>
            <span />

            {Array.from({
              length:
                4,
            }).map(
              (
                _,
                indice,
              ) => (
                <i
                  key={
                    indice
                  }
                />
              ),
            )}
          </aside>
        </div>

        <style>
          {styles}
        </style>
      </section>
    );
  }

  if (
    !quiz
  ) {
    return (
      <section className="quiz-live quiz-live--error-page">
        <div className="quiz-live__error-card">
          <XCircle
            size={
              24
            }
          />

          <div>
            <strong>
              No fue posible abrir el Quiz
            </strong>

            <p>
              La sesión no está disponible o ya no pertenece a este curso.
            </p>
          </div>
        </div>

        <style>
          {styles}
        </style>
      </section>
    );
  }

  const finalizado =
    quiz.estado ===
    'FINALIZADO';

  const enCurso =
    quiz.estado ===
      'EN_CURSO' ||
    quiz.estado ===
      'PAUSADO';

  return (
    <section className="quiz-live">
      <header className="quiz-live__cabecera">

        <div className="quiz-live__titulo">
          <div className="quiz-live__identidad">
            <span className="quiz-live__titulo-icono">
              <Radio
                size={
                  23
                }
              />
            </span>

            <div>
              <span className="quiz-live__eyebrow">
                Sesión del docente
              </span>

              <h1>
                {
                  quiz.titulo
                }
              </h1>

              {quiz.descripcion && (
                <p>
                  {
                    quiz.descripcion
                  }
                </p>
              )}
            </div>
          </div>

          <span className={`quiz-live__estado quiz-live__estado--${quiz.estado.toLowerCase()}`}>
            <Radio
              size={
                14
              }
            />

            {
              textoEstado(
                quiz.estado,
              )
            }
          </span>
        </div>
      </header>

      <div className="quiz-live__metricas">
        <article>
          <Users
            size={
              18
            }
          />

          <span>
            Conectados
          </span>

          <strong>
            {lobby?.conectados ??
            0}/{lobby?.totalInscritos ??
            0}
          </strong>
        </article>

        <article>
          <Radio
            size={
              18
            }
          />

          <span>
            Pregunta
          </span>

          <strong>
            {quiz.preguntaActualOrden ===
            null
              ? 0
              : quiz.preguntaActualOrden +
                1}/{vivo?.totalPreguntas ??
            quiz.cantidadPreguntas}
          </strong>
        </article>

        <article>
          <CheckCircle2
            size={
              18
            }
          />

          <span>
            Respondieron
          </span>

          <strong>
            {vivo?.respondieron ??
            0}/{vivo?.totalParticipantes ??
            lobby?.participantes.length ??
            0}
          </strong>
        </article>

        <article>
          <Clock3
            size={
              18
            }
          />

          <span>
            Tiempo
          </span>

          <strong>
            {quiz.estado ===
            'CUENTA_REGRESIVA'
              ? `${segundosCuentaRegresiva ?? 0} s`
              : vivo?.tiempoRestanteSegundos !==
                    null &&
                  vivo?.tiempoRestanteSegundos !==
                    undefined
                ? `${vivo.tiempoRestanteSegundos} s`
                : '—'}
          </strong>
        </article>
      </div>

      {quiz.estado ===
        'ESPERANDO' && (
        <section className="quiz-live__panel">
          <div className="quiz-live__panel-head">
            <div>
              <span className="quiz-live__eyebrow">
                Sala de espera
              </span>

              <h2>
                <Users
                  size={
                    19
                  }
                />

                Estudiantes en la sala
              </h2>
            </div>

            <button
              type="button"
              className="quiz-live__accion quiz-live__accion--principal"
              disabled={
                procesando
              }
              onClick={() =>
                void ejecutar(
                  () =>
                    iniciarQuiz(
                      cursoId,
                      quizId,
                      accessToken!,
                    ),
                  'Quiz iniciado',
                )
              }
            >
              <CirclePlay
                size={
                  17
                }
              />

              Iniciar Quiz
            </button>
          </div>

          <div className="quiz-live__lobby">
            {lobby?.participantes.map(
              (
                participante,
              ) => (
                <article
                  key={
                    participante.estudianteId
                  }
                >
                  <span className="quiz-live__avatar quiz-live__avatar--grande">
                    {
                      inicialesLobby(
                        participante,
                      )
                    }
                  </span>

                  <strong>
                    {
                      nombreLobby(
                        participante,
                      )
                    }
                  </strong>

                  <small>
                    {participante.estado ===
                    'LISTO'
                      ? 'Listo'
                      : participante.estado ===
                        'DESCONECTADO'
                        ? 'Desconectado'
                        : 'En sala'}
                  </small>
                </article>
              ),
            )}
          </div>
        </section>
      )}

      {quiz.estado ===
        'CUENTA_REGRESIVA' && (
        <section className="quiz-live__cuenta-regresiva">
          <Clock3
            size={
              27
            }
          />

          <span>
            Todos preparados
          </span>

          <strong>
            {segundosCuentaRegresiva ??
            0}
          </strong>

          <small>
            La primera pregunta aparecerá automáticamente.
          </small>
        </section>
      )}

      {enCurso && (
        <>
          <div className="quiz-live__juego">
            <section className="quiz-live__panel quiz-live__pregunta">
              <div className="quiz-live__panel-head">
                <div>
                  <span className="quiz-live__eyebrow">
                    Pregunta actual
                  </span>

                  <h2>
                    Pregunta {quiz.preguntaActualOrden ===
                    null
                      ? '—'
                      : quiz.preguntaActualOrden +
                        1}
                  </h2>
                </div>

                <span className="quiz-live__tiempo">
                  <Clock3
                    size={
                      17
                    }
                  />

                  {vivo?.tiempoRestanteSegundos ??
                  '—'} s
                </span>
              </div>

              {preguntaActual ? (
                <>
                  <p className="quiz-live__enunciado">
                    {
                      preguntaActual.enunciado
                    }
                  </p>

                  <div className="quiz-live__opciones">
                    {preguntaActual.opciones.map(
                      (
                        opcion,
                      ) => (
                        <div
                          key={
                            opcion.id
                          }
                        >
                          {
                            opcion.texto
                          }
                        </div>
                      ),
                    )}
                  </div>

                  <div className="quiz-live__respuesta-metricas">
                    <span className="quiz-live__correcta">
                      <CheckCircle2
                        size={
                          16
                        }
                      />

                      {vivo?.correctas ??
                      0} correctas
                    </span>

                    <span className="quiz-live__incorrecta">
                      <XCircle
                        size={
                          16
                        }
                      />

                      {vivo?.incorrectas ??
                      0} incorrectas
                    </span>

                    <span>
                      {vivo?.pendientes ??
                      0} pendientes
                    </span>
                  </div>
                </>
              ) : (
                <div className="quiz-live__vacio">
                  Preparando la primera pregunta...
                </div>
              )}
            </section>

            <RankingEnVivo
              ranking={
                ranking
              }
              finalizado={
                false
              }
            />
          </div>

          <div className="quiz-live__controles">
            {quiz.estado ===
            'PAUSADO' ? (
              <button
                type="button"
                className="quiz-live__accion"
                disabled={
                  procesando
                }
                onClick={() =>
                  void ejecutar(
                    () =>
                      reanudarQuiz(
                        cursoId,
                        quizId,
                        accessToken!,
                      ),
                    'Quiz reanudado',
                  )
                }
              >
                <CirclePlay
                  size={
                    17
                  }
                />

                Reanudar
              </button>
            ) : (
              <button
                type="button"
                className="quiz-live__accion"
                disabled={
                  procesando ||
                  quiz.estado !==
                  'EN_CURSO'
                }
                onClick={() =>
                  void ejecutar(
                    () =>
                      pausarQuiz(
                        cursoId,
                        quizId,
                        accessToken!,
                      ),
                    'Quiz pausado',
                  )
                }
              >
                <CirclePause
                  size={
                    17
                  }
                />

                Pausar
              </button>
            )}

            <button
              type="button"
              className="quiz-live__accion"
              disabled={
                procesando ||
                quiz.estado ===
                'CUENTA_REGRESIVA'
              }
              onClick={() =>
                void ejecutar(
                  () =>
                    siguientePreguntaQuiz(
                      cursoId,
                      quizId,
                      accessToken!,
                    ),
                  'Se avanzó a la siguiente pregunta',
                )
              }
            >
              Siguiente pregunta
            </button>

            <button
              type="button"
              className="quiz-live__accion quiz-live__accion--peligro"
              disabled={
                procesando ||
                quiz.estado ===
                'CUENTA_REGRESIVA'
              }
              onClick={() => {
                if (
                  window.confirm(
                    '¿Finalizar el Quiz? Los intentos activos se cerrarán y se calculará la clasificación final.',
                  )
                ) {
                  void ejecutar(
                    () =>
                      finalizarQuiz(
                        cursoId,
                        quizId,
                        accessToken!,
                      ),
                    'Quiz finalizado',
                  );
                }
              }}
            >
              <CircleStop
                size={
                  17
                }
              />

              Finalizar
            </button>
          </div>
        </>
      )}

      {finalizado && (
        <>
          <Podio
            ranking={
              ranking
            }
          />

          <RankingEnVivo
            ranking={
              ranking
            }
            finalizado
          />

          <ResultadosQuizDocente
            cursoId={
              cursoId
            }
            quizId={
              quizId
            }
            accessToken={
              accessToken!
            }
            onToast={
              mostrarToast
            }
            onActualizado={() =>
              void cargar(
                true,
              )
            }
          />
        </>
      )}

      <Toast
        visible={
          toast.visible
        }
        tipo={
          toast.tipo
        }
        titulo={
          toast.titulo
        }
        mensaje={
          toast.mensaje
        }
        onCerrar={() =>
          setToast(
            (
              actual,
            ) => ({
              ...actual,

              visible:
                false,
            }),
          )
        }
      />

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .quiz-live {
    width: 100%;
    min-width: 0;
    display: grid;
    gap: 14px;
    padding: 0 0 34px;
    color: var(--app-text);
  }

  button {
    font-family: inherit;
  }

  /* =========================================================
     CARGA — mismo lenguaje visual que DetalleForo
     ========================================================= */

  .quiz-live--loading-page,
  .quiz-live--error-page {
    display: grid;
    gap: 14px;
    padding-bottom: 34px;
  }

  .quiz-live__loading-header {
    min-height: 142px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    padding: 19px 21px;
    border: 1px solid var(--app-border);
    border-top: 4px solid var(--app-accent);
    border-radius: 22px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .quiz-live__loading-back,
  .quiz-live__loading-title i,
  .quiz-live__loading-title strong,
  .quiz-live__loading-title small,
  .quiz-live__loading-state,
  .quiz-live__loading-metrics article > i,
  .quiz-live__loading-metrics small,
  .quiz-live__loading-metrics strong,
  .quiz-live__loading-content section > span,
  .quiz-live__loading-content section > strong,
  .quiz-live__loading-content section > small,
  .quiz-live__loading-content section > div i,
  .quiz-live__loading-content aside > span,
  .quiz-live__loading-content aside > i {
    display: block;
    border-radius: 999px;
    background: var(--app-surface-disabled);
    animation: quizLivePulse 1.25s ease-in-out infinite;
  }

  .quiz-live__loading-back {
    grid-column: 1 / -1;
    width: 110px;
    height: 10px;
  }

  .quiz-live__loading-title {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    grid-template-rows: auto auto auto;
    align-items: center;
    gap: 7px 13px;
  }

  .quiz-live__loading-title i {
    grid-row: 1 / 4;
    width: 52px;
    height: 52px;
    border-radius: 15px;
  }

  .quiz-live__loading-title strong {
    width: min(390px, 72%);
    height: 24px;
  }

  .quiz-live__loading-title small {
    width: min(310px, 58%);
    height: 10px;
  }

  .quiz-live__loading-state {
    width: 105px;
    height: 30px;
  }

  .quiz-live__loading-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .quiz-live__loading-metrics article {
    min-height: 72px;
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    padding: 11px 13px;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
  }

  .quiz-live__loading-metrics article > i {
    width: 38px;
    height: 38px;
    border-radius: 12px;
  }

  .quiz-live__loading-metrics article > span {
    display: grid;
    gap: 6px;
  }

  .quiz-live__loading-metrics small {
    width: 72px;
    height: 8px;
  }

  .quiz-live__loading-metrics strong {
    width: 52px;
    height: 17px;
  }

  .quiz-live__loading-content {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(330px, .85fr);
    gap: 12px;
  }

  .quiz-live__loading-content section,
  .quiz-live__loading-content aside {
    min-height: 265px;
    padding: 17px;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
  }

  .quiz-live__loading-content section > span {
    width: 105px;
    height: 9px;
  }

  .quiz-live__loading-content section > strong {
    width: 78%;
    height: 20px;
    margin-top: 15px;
  }

  .quiz-live__loading-content section > small {
    width: 92%;
    height: 10px;
    margin-top: 9px;
  }

  .quiz-live__loading-content section > div {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-top: 22px;
  }

  .quiz-live__loading-content section > div i {
    height: 48px;
    border-radius: 11px;
  }

  .quiz-live__loading-content aside > span {
    width: 145px;
    height: 16px;
    margin-bottom: 16px;
  }

  .quiz-live__loading-content aside > i {
    height: 46px;
    margin-top: 8px;
    border-radius: 11px;
  }

  .quiz-live__error-card {
    min-height: 220px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 10px;
    padding: 28px;
    border: 1px solid var(--app-border);
    border-radius: 20px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    text-align: center;
  }

  .quiz-live__error-card > svg {
    width: 48px;
    height: 48px;
    padding: 11px;
    box-sizing: content-box;
    border-radius: 15px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .quiz-live__error-card strong {
    color: var(--app-text);
    font-size: 14px;
  }

  .quiz-live__error-card p {
    max-width: 420px;
    margin: 4px 0 0;
    font-size: 10px;
    line-height: 1.5;
  }

  .quiz-live__error-card button {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 5px;
    padding: 8px 12px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }

  /* =========================================================
     ENCABEZADO
     ========================================================= */

  .quiz-live__cabecera,
  .quiz-live__panel,
  .quiz-live__podio-panel {
    border: 1px solid var(--app-border);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .quiz-live__cabecera {
    position: relative;
    padding: 17px 20px 19px;
    overflow: hidden;
    border-top: 4px solid var(--app-accent);
  }

  .quiz-live__cabecera::after {
    content: "";
    position: absolute;
    width: 180px;
    height: 180px;
    right: -90px;
    top: -115px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--app-accent) 6%, transparent);
    pointer-events: none;
  }

  .quiz-live__volver {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    border: 0;
    color: var(--app-text-muted);
    background: transparent;
    font: inherit;
    font-size: 9.5px;
    font-weight: 800;
    cursor: pointer;
  }

  .quiz-live__volver:hover {
    color: var(--app-accent-dark);
  }

  .quiz-live__titulo {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-top: 13px;
  }

  .quiz-live__identidad {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .quiz-live__titulo-icono {
    width: 50px;
    height: 50px;
    flex: 0 0 50px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .quiz-live__eyebrow {
    color: var(--app-accent-dark);
    font-size: 8.5px;
    font-weight: 900;
    letter-spacing: .09em;
    text-transform: uppercase;
  }

  .quiz-live h1 {
    margin: 3px 0 0;
    color: var(--app-text);
    font-size: clamp(21px, 2.5vw, 28px);
    line-height: 1.12;
    letter-spacing: -.035em;
  }

  .quiz-live__titulo p {
    max-width: 780px;
    margin: 5px 0 0;
    color: var(--app-text-muted);
    font-size: 10px;
    line-height: 1.5;
  }

  .quiz-live__estado,
  .quiz-live__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    min-height: 31px;
    padding: 6px 10px;
    border: 1px solid color-mix(in srgb, var(--app-accent) 25%, var(--app-border));
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .quiz-live__estado--finalizado {
    color: var(--app-text-secondary);
    border-color: var(--app-border);
    background: var(--app-surface-alt);
  }

  .quiz-live__estado--pausado {
    color: var(--app-warning-strong);
    border-color: var(--app-warning-border);
    background: var(--app-warning-bg);
  }

  .quiz-live__live i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--app-danger);
    box-shadow: 0 0 0 4px var(--app-danger-bg);
  }

  /* =========================================================
     MÉTRICAS
     ========================================================= */

  .quiz-live__metricas {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .quiz-live__metricas article {
    min-width: 0;
    min-height: 76px;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-items: center;
    gap: 2px 10px;
    padding: 11px 13px;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
    transition:
      transform .16s ease,
      border-color .16s ease,
      background .16s ease;
  }

  .quiz-live__metricas article:hover {
    transform: translateY(-1px);
    border-color: var(--app-accent);
    background: var(--app-accent-softer);
  }

  .quiz-live__metricas svg {
    grid-row: 1 / 3;
    width: 19px;
    height: 19px;
    padding: 10px;
    box-sizing: content-box;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .quiz-live__metricas span {
    color: var(--app-text-muted);
    font-size: 8.5px;
    font-weight: 700;
  }

  .quiz-live__metricas strong {
    color: var(--app-text);
    font-size: 18px;
    line-height: 1;
    letter-spacing: -.03em;
  }

  /* =========================================================
     PANELES
     ========================================================= */

  .quiz-live__panel,
  .quiz-live__podio-panel {
    padding: 16px;
  }

  .quiz-live__panel {
    position: relative;
    overflow: hidden;
  }

  .quiz-live__pregunta {
    border-top: 3px solid var(--app-accent);
  }

  .quiz-live__panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 13px;
  }

  .quiz-live__panel-head h2,
  .quiz-live__podio-panel h2 {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 3px 0 0;
    color: var(--app-text);
    font-size: 15px;
    font-weight: 900;
  }

  .quiz-live__cuenta-regresiva {
    min-height: 250px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 7px;
    padding: 24px;
    border: 1px solid color-mix(in srgb, var(--app-accent) 28%, var(--app-border));
    border-top: 4px solid var(--app-accent);
    border-radius: 20px;
    color: var(--app-accent-dark);
    background:
      radial-gradient(
        circle at 50% 30%,
        color-mix(in srgb, var(--app-accent) 10%, transparent),
        transparent 35%
      ),
      var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    text-align: center;
  }

  .quiz-live__cuenta-regresiva > svg {
    width: 25px;
    height: 25px;
    padding: 10px;
    box-sizing: content-box;
    border-radius: 14px;
    background: var(--app-accent-soft);
  }

  .quiz-live__cuenta-regresiva > span {
    font-size: 11px;
    font-weight: 900;
  }

  .quiz-live__cuenta-regresiva > strong {
    color: var(--app-text);
    font-size: clamp(48px, 7vw, 76px);
    line-height: .95;
  }

  .quiz-live__cuenta-regresiva > small {
    margin-top: 4px;
    color: var(--app-text-muted);
    font-size: 9.5px;
  }

  .quiz-live__juego {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(350px, .88fr);
    gap: 12px;
    align-items: start;
  }

  .quiz-live__enunciado {
    margin: 4px 0 14px;
    color: var(--app-text);
    font-size: 14px;
    font-weight: 800;
    line-height: 1.55;
  }

  .quiz-live__opciones {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .quiz-live__opciones div {
    min-height: 48px;
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: 9.5px;
    line-height: 1.45;
  }

  .quiz-live__tiempo {
    min-width: 64px;
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 9px;
    border: 1px solid color-mix(in srgb, var(--app-accent) 24%, var(--app-border));
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 12px;
    font-weight: 900;
  }

  .quiz-live__respuesta-metricas {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
    margin-top: 13px;
    padding-top: 12px;
    border-top: 1px solid var(--app-border-soft);
  }

  .quiz-live__respuesta-metricas span {
    min-height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 8px;
    border-radius: 10px;
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    font-size: 8.5px;
    font-weight: 800;
  }

  .quiz-live__respuesta-metricas .quiz-live__correcta {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .quiz-live__respuesta-metricas .quiz-live__incorrecta {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  /* =========================================================
     LOBBY
     ========================================================= */

  .quiz-live__lobby {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
    gap: 9px;
  }

  .quiz-live__lobby article {
    min-height: 112px;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 5px;
    padding: 12px 9px;
    border: 1px solid var(--app-border-soft);
    border-radius: 14px;
    background: var(--app-surface-alt);
    text-align: center;
  }

  .quiz-live__lobby strong {
    max-width: 150px;
    overflow: hidden;
    color: var(--app-text);
    font-size: 9.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .quiz-live__lobby small {
    color: var(--app-text-muted);
    font-size: 8px;
    font-weight: 750;
    text-transform: uppercase;
  }

  /* =========================================================
     RANKING EN VIVO
     ========================================================= */

  .quiz-live__ranking {
    max-height: 620px;
    overflow: hidden;
  }

  .quiz-live__ranking-lista {
    display: grid;
    gap: 7px;
    max-height: 520px;
    overflow-y: auto;
    padding-right: 3px;
  }

  .quiz-live__ranking-item {
    display: grid;
    grid-template-columns: 28px 38px minmax(0, 1fr) 48px;
    align-items: center;
    gap: 8px;
    padding: 8px 9px;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    background: var(--app-surface-alt);
    transition:
      transform .2s ease,
      border-color .2s ease,
      background .2s ease;
  }

  .quiz-live__ranking-item:hover {
    border-color: var(--app-accent);
    background: var(--app-accent-softer);
  }

  .quiz-live__ranking-item--top-1 {
    border-color: #efd27d;
    background: #fffaf0;
  }

  .quiz-live__ranking-item--top-2,
  .quiz-live__ranking-item--top-3 {
    border-color: color-mix(in srgb, var(--app-accent) 30%, var(--app-border));
  }

  .quiz-live__posicion {
    display: grid;
    place-items: center;
    color: var(--app-text-muted);
    font-size: 9px;
    font-weight: 900;
  }

  .quiz-live__avatar,
  .quiz-live__podio-avatar {
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--app-accent) 30%, var(--app-border));
    border-radius: 50%;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-weight: 900;
  }

  .quiz-live__avatar {
    width: 38px;
    height: 38px;
    font-size: 9.5px;
  }

  .quiz-live__avatar--grande {
    width: 48px;
    height: 48px;
    font-size: 11px;
  }

  .quiz-live__ranking-cuerpo {
    min-width: 0;
  }

  .quiz-live__ranking-info {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 5px;
  }

  .quiz-live__ranking-info strong {
    overflow: hidden;
    color: var(--app-text);
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 9.5px;
  }

  .quiz-live__ranking-info small {
    flex: 0 0 auto;
    color: var(--app-text-muted);
    font-size: 7.3px;
  }

  .quiz-live__barra {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--app-surface-disabled);
  }

  .quiz-live__barra i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--app-accent), var(--app-accent-dark));
    transition: width .45s ease;
  }

  .quiz-live__puntos {
    text-align: right;
  }

  .quiz-live__puntos strong {
    display: block;
    color: var(--app-text);
    font-size: 12px;
  }

  .quiz-live__puntos small {
    color: var(--app-text-muted);
    font-size: 7px;
  }

  /* =========================================================
     CONTROLES
     ========================================================= */

  .quiz-live__controles {
    position: sticky;
    bottom: 10px;
    z-index: 5;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 10px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: color-mix(in srgb, var(--app-surface) 95%, transparent);
    box-shadow: var(--app-shadow-md);
    backdrop-filter: blur(12px);
  }

  .quiz-live__accion {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font: inherit;
    font-size: 8.8px;
    font-weight: 850;
    cursor: pointer;
    transition:
      transform .15s ease,
      border-color .15s ease,
      background .15s ease;
  }

  .quiz-live__accion:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .quiz-live__accion--principal {
    border-color: var(--app-accent);
    color: #fff;
    background: linear-gradient(135deg, var(--app-accent), var(--app-accent-hover));
  }

  .quiz-live__accion--principal:hover:not(:disabled) {
    color: #fff;
    background: var(--app-accent-dark);
  }

  .quiz-live__accion--peligro {
    border-color: color-mix(in srgb, var(--app-danger) 35%, var(--app-border));
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .quiz-live__accion:disabled {
    opacity: .48;
    cursor: not-allowed;
  }

  /* =========================================================
     PODIO Y RESULTADOS
     ========================================================= */

  .quiz-live__podio-panel {
    padding-top: 18px;
    text-align: center;
  }

  .quiz-live__podio-panel h2 {
    justify-content: center;
  }

  .quiz-live__podio {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 180px));
    align-items: end;
    justify-content: center;
    gap: 12px;
    margin-top: 24px;
  }

  .quiz-live__podio-card {
    display: grid;
    justify-items: center;
    gap: 6px;
    min-height: 175px;
    padding: 15px 10px;
    border: 1px solid var(--app-border);
    border-radius: 16px 16px 8px 8px;
    background: var(--app-surface-alt);
  }

  .quiz-live__podio-card--1 {
    min-height: 215px;
    padding-top: 18px;
    border-color: #efd27d;
    background: linear-gradient(180deg, #fff7d9, var(--app-surface-alt));
  }

  .quiz-live__podio-card--2 {
    min-height: 185px;
  }

  .quiz-live__podio-card--3 {
    min-height: 165px;
  }

  .quiz-live__podio-card--vacio {
    align-content: center;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .quiz-live__podio-medalla {
    color: var(--app-accent-dark);
  }

  .quiz-live__podio-card--1 .quiz-live__podio-medalla {
    color: #b98a00;
  }

  .quiz-live__podio-avatar {
    width: 58px;
    height: 58px;
    font-size: 13px;
  }

  .quiz-live__podio-card strong {
    color: var(--app-text);
    font-size: 9.5px;
  }

  .quiz-live__podio-card b {
    font-size: 16px;
  }

  .quiz-live__podio-card small {
    color: var(--app-text-muted);
    font-size: 8px;
    font-weight: 800;
  }

  .quiz-live__vacio {
    min-height: 130px;
    display: grid;
    place-items: center;
    padding: 28px 12px;
    color: var(--app-text-muted);
    text-align: center;
    font-size: 9.5px;
  }

  @media (max-width: 1050px) {
    .quiz-live__juego,
    .quiz-live__loading-content {
      grid-template-columns: 1fr;
    }

    .quiz-live__ranking {
      max-height: none;
    }
  }

  @media (max-width: 760px) {
    .quiz-live__metricas,
    .quiz-live__loading-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .quiz-live__titulo {
      align-items: flex-start;
      flex-direction: column;
    }

    .quiz-live__identidad {
      align-items: flex-start;
    }

    .quiz-live__opciones,
    .quiz-live__respuesta-metricas {
      grid-template-columns: 1fr;
    }

    .quiz-live__ranking-info small {
      display: none;
    }

    .quiz-live__podio {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .quiz-live__podio-card,
    .quiz-live__podio-card--1,
    .quiz-live__podio-card--2,
    .quiz-live__podio-card--3 {
      min-height: auto;
    }

    .quiz-live__podio-card--1 {
      order: -1;
    }

    .quiz-live__controles {
      position: static;
      flex-wrap: wrap;
    }
  }

  @media (max-width: 520px) {
    .quiz-live__metricas,
    .quiz-live__loading-metrics {
      grid-template-columns: 1fr;
    }

    .quiz-live__cabecera {
      padding: 15px;
    }

    .quiz-live__titulo-icono {
      width: 44px;
      height: 44px;
      flex-basis: 44px;
    }

    .quiz-live__loading-header {
      grid-template-columns: 1fr;
    }

    .quiz-live__loading-state {
      justify-self: start;
    }
  }

  @keyframes quizLivePulse {
    0%,
    100% {
      opacity: .58;
    }

    50% {
      opacity: 1;
    }
  }
`;
