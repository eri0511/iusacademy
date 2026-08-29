import {
  Award,
  CheckCircle2,
  Clock3,
  Eye,
  FileQuestion,
  Medal,
  Percent,
  Send,
  Trophy,
  Users,
  X,
  XCircle,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  obtenerDetalleResultadoEstudianteQuiz,
  obtenerResultadosQuiz,
  publicarResultadosQuiz,
} from '../../services/quizzes/quizzes.service';

import type {
  DetalleResultadoEstudianteQuiz,
  ResultadoDocenteQuiz,
} from '../../types/quizzes/quizzes.types';

import type {
  TipoToast,
} from '../shared/Toast';

type Props = {
  cursoId: number;
  quizId: number;
  accessToken: string;
  onToast: (
    tipo: TipoToast,
    titulo: string,
    mensaje?: string,
  ) => void;
  onActualizado: () => void;
};

function nombre(
  estudiante: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
  },
) {
  return [
    estudiante.nombres,
    estudiante.apellidoPaterno,
    estudiante.apellidoMaterno,
  ]
    .filter(
      Boolean,
    )
    .join(
      ' ',
    );
}

function tiempo(
  ms:
    number |
    null,
) {
  if (
    !ms
  ) {
    return '—';
  }

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

  const resto =
    segundos %
    60;

  return `${minutos}:${String(
    resto,
  ).padStart(
    2,
    '0',
  )}`;
}

function numero(
  valor:
    number |
    string |
    null |
    undefined,
) {
  const convertido =
    Number(
      valor ??
      0,
    );

  return Number.isFinite(
    convertido,
  )
    ? convertido
    : 0;
}

export default function ResultadosQuizDocente({
  cursoId,
  quizId,
  accessToken,
  onToast,
  onActualizado,
}: Props) {
  const [
    resultados,
    setResultados,
  ] =
    useState<ResultadoDocenteQuiz | null>(
      null,
    );

  const [
    detalle,
    setDetalle,
  ] =
    useState<DetalleResultadoEstudianteQuiz | null>(
      null,
    );

  const [
    detalleAbierto,
    setDetalleAbierto,
  ] =
    useState<number | null>(
      null,
    );

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] =
    useState(
      false,
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const [
    publicando,
    setPublicando,
  ] =
    useState(
      false,
    );

  const cargar =
    async () => {
      try {
        setCargando(
          true,
        );

        setResultados(
          await obtenerResultadosQuiz(
            cursoId,
            quizId,
            accessToken,
          ),
        );
      } catch (
        error
      ) {
        onToast(
          'error',
          'No se pudieron cargar los resultados',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setCargando(
          false,
        );
      }
    };

  useEffect(
    () => {
      void cargar();
    },
    [
      cursoId,
      quizId,
      accessToken,
    ],
  );

  const resumen =
    useMemo(
      () => {
        const intentos =
          resultados?.intentos ??
          [];

        if (
          intentos.length ===
          0
        ) {
          return {
            promedio:
              0,
            maxima:
              0,
            minima:
              0,
            aciertos:
              0,
          };
        }

        const notas =
          intentos.map(
            (
              intento,
            ) =>
              numero(
                intento.notaFinal,
              ),
          );

        const totalRespondidas =
          intentos.reduce(
            (
              suma,
              intento,
            ) =>
              suma +
              intento.respuestasCorrectas +
              intento.respuestasIncorrectas,
            0,
          );

        const correctas =
          intentos.reduce(
            (
              suma,
              intento,
            ) =>
              suma +
              intento.respuestasCorrectas,
            0,
          );

        return {
          promedio:
            notas.reduce(
              (
                suma,
                nota,
              ) =>
                suma +
                nota,
              0,
            ) /
            notas.length,

          maxima:
            Math.max(
              ...notas,
            ),

          minima:
            Math.min(
              ...notas,
            ),

          aciertos:
            totalRespondidas >
            0
              ? (
                  correctas /
                  totalRespondidas
                ) *
                100
              : 0,
        };
      },
      [
        resultados,
      ],
    );

  const abrirDetalle =
    async (
      estudianteId:
        number,
    ) => {
      try {
        setDetalleAbierto(
          estudianteId,
        );

        setDetalle(
          null,
        );

        setCargandoDetalle(
          true,
        );

        setDetalle(
          await obtenerDetalleResultadoEstudianteQuiz(
            cursoId,
            quizId,
            estudianteId,
            accessToken,
          ),
        );
      } catch (
        error
      ) {
        setDetalleAbierto(
          null,
        );

        onToast(
          'error',
          'No se pudo abrir el detalle',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setCargandoDetalle(
          false,
        );
      }
    };

  const publicar =
    async () => {
      if (
        !resultados ||
        resultados.quiz.resultadosPublicados
      ) {
        return;
      }

      try {
        setPublicando(
          true,
        );

        await publicarResultadosQuiz(
          cursoId,
          quizId,
          accessToken,
        );

        await cargar();

        onActualizado();

        onToast(
          'exito',
          resultados.quiz.esCalificable
            ? 'Notas publicadas'
            : 'Resultados publicados',
          resultados.quiz.esCalificable
            ? 'Las calificaciones ya están disponibles para los estudiantes.'
            : 'Los resultados ya están disponibles para los estudiantes.',
        );
      } catch (
        error
      ) {
        onToast(
          'error',
          'No se pudieron publicar los resultados',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setPublicando(
          false,
        );
      }
    };

  if (
    cargando
  ) {
    return (
      <div className="quiz-resultados__cargando">
        Cargando resultados...
      </div>
    );
  }

  if (
    !resultados
  ) {
    return null;
  }

  return (
    <section className="quiz-resultados">
      <header className="quiz-resultados__cabecera">
        <div>
          <Trophy
            size={
              19
            }
          />

          <span>
            <strong>
              Resultados del Quiz
            </strong>

            <small>
              {resultados.quiz.esCalificable
                ? resultados.quiz.componente ===
                    'CONTINUA'
                  ? 'Evaluación continua'
                  : 'Evaluación procesual'
                : 'Quiz de práctica'}
            </small>
          </span>
        </div>

        {resultados.quiz.resultadosPublicados ? (
          <span className="quiz-resultados__publicado">
            <CheckCircle2
              size={
                14
              }
            />

            NOTAS PUBLICADAS
          </span>
        ) : (
          <button
            type="button"
            disabled={
              publicando
            }
            onClick={() =>
              void publicar()
            }
          >
            <Send
              size={
                14
              }
            />

            {publicando
              ? 'Publicando...'
              : resultados.quiz.esCalificable
                ? 'Publicar notas'
                : 'Publicar resultados'}
          </button>
        )}
      </header>

      <div className="quiz-resultados__resumen">
        <article>
          <Users
            size={
              17
            }
          />

          <span>
            Participación
          </span>

          <strong>
            {resultados.totalParticiparon} / {resultados.totalInscritos}
          </strong>
        </article>

        <article>
          <Percent
            size={
              17
            }
          />

          <span>
            Promedio
          </span>

          <strong>
            {resumen.promedio.toFixed(
              1,
            )}
          </strong>
        </article>

        <article>
          <Award
            size={
              17
            }
          />

          <span>
            Nota máxima
          </span>

          <strong>
            {resumen.maxima.toFixed(
              1,
            )}
          </strong>
        </article>

        <article>
          <Medal
            size={
              17
            }
          />

          <span>
            Nota mínima
          </span>

          <strong>
            {resumen.minima.toFixed(
              1,
            )}
          </strong>
        </article>

        <article>
          <CheckCircle2
            size={
              17
            }
          />

          <span>
            Aciertos
          </span>

          <strong>
            {resumen.aciertos.toFixed(
              0,
            )}%
          </strong>
        </article>
      </div>

      <div className="quiz-resultados__tabla-wrap">
        <table className="quiz-resultados__tabla">
          <thead>
            <tr>
              <th>
                #
              </th>

              <th>
                Estudiante
              </th>

              <th>
                Estado
              </th>

              <th>
                Respuestas
              </th>

              <th>
                Omitidas
              </th>

              <th>
                Tiempo
              </th>

              <th>
                Nota base
              </th>

              {resultados.quiz.usarRanking && (
                <th>
                  Desc.
                </th>
              )}

              <th>
                Nota final
              </th>

              <th />
            </tr>
          </thead>

          <tbody>
            {resultados.intentos.map(
              (
                intento,
              ) => (
                <tr
                  key={
                    intento.estudianteId
                  }
                  className={
                    intento.participo
                      ? undefined
                      : 'quiz-resultados__fila-ausente'
                  }
                >
                  <td>
                    <span className={`quiz-resultados__puesto puesto-${intento.posicionFinal ?? 0}`}>
                      {intento.posicionFinal ??
                        '—'}
                    </span>
                  </td>

                  <td>
                    <div className="quiz-resultados__estudiante">
                      <span className="quiz-resultados__avatar">
                        {`${intento.estudiante.nombres.charAt(0)}${intento.estudiante.apellidoPaterno.charAt(0)}`.toUpperCase()}
                      </span>

                      <div>
                        <strong>
                          {nombre(
                            intento.estudiante,
                          )}
                        </strong>

                        <small>
                          {intento.participo
                            ? intento.posicionFinal
                              ? `${intento.posicionFinal}.º lugar`
                              : 'Sin posición'
                            : 'Sin intento registrado'}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span
                      className={
                        intento.participo
                          ? 'quiz-resultados__estado-participacion participo'
                          : 'quiz-resultados__estado-participacion ausente'
                      }
                    >
                      {intento.participo ? (
                        <>
                          <CheckCircle2
                            size={
                              12
                            }
                          />

                          PARTICIPÓ
                        </>
                      ) : (
                        <>
                          <XCircle
                            size={
                              12
                            }
                          />

                          NO PARTICIPÓ
                        </>
                      )}
                    </span>
                  </td>

                  <td>
                    {intento.participo ? (
                      <div className="quiz-resultados__respuestas-mini">
                        <span className="correcta">
                          <CheckCircle2
                            size={
                              12
                            }
                          />

                          {intento.respuestasCorrectas}
                        </span>

                        <span className="incorrecta">
                          <XCircle
                            size={
                              12
                            }
                          />

                          {intento.respuestasIncorrectas}
                        </span>
                      </div>
                    ) : (
                      <span className="quiz-resultados__sin-dato">
                        —
                      </span>
                    )}
                  </td>

                  <td>
                    <span className="quiz-resultados__dato-chip">
                      <FileQuestion
                        size={
                          12
                        }
                      />

                      {intento.respuestasOmitidas}
                    </span>
                  </td>

                  <td>
                    <span className="quiz-resultados__dato-chip">
                      <Clock3
                        size={
                          12
                        }
                      />

                      {tiempo(
                        intento.tiempoTotalMs,
                      )}
                    </span>
                  </td>

                  <td>
                    {numero(
                      intento.notaBase,
                    ).toFixed(
                      1,
                    )}
                  </td>

                  {resultados.quiz.usarRanking && (
                    <td>
                      <span className="quiz-resultados__descuento">
                        -{numero(
                          intento.descuentoPosicion,
                        ).toFixed(
                          1,
                        )}
                      </span>
                    </td>
                  )}

                  <td>
                    <strong className="quiz-resultados__nota">
                      {numero(
                        intento.notaFinal,
                      ).toFixed(
                        1,
                      )}
                    </strong>
                  </td>

                  <td>
                    {intento.participo ? (
                      <button
                        type="button"
                        className="quiz-resultados__detalle-btn"
                        onClick={() =>
                          void abrirDetalle(
                            intento.estudianteId,
                          )
                        }
                      >
                        <Eye
                          size={
                            13
                          }
                        />

                        Ver detalle
                      </button>
                    ) : (
                      <span className="quiz-resultados__sin-intento">
                        Sin detalle
                      </span>
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {detalleAbierto && (
        <div
          className="quiz-resultados-modal__fondo"
          role="presentation"
          onMouseDown={(
            evento,
          ) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
              setDetalleAbierto(
                null,
              );

              setDetalle(
                null,
              );
            }
          }}
        >
          <section
            className="quiz-resultados-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Detalle de resultado del estudiante"
          >
            <header className="quiz-resultados-modal__cabecera">
              <div>
                <small>
                  Detalle del resultado
                </small>

                <h3>
                  {detalle
                    ? nombre(
                        detalle.estudiante,
                      )
                    : 'Cargando estudiante...'}
                </h3>

                {detalle && (
                  <p>
                    {detalle.intento.respuestasCorrectas} correctas · {detalle.intento.respuestasIncorrectas} incorrectas · {detalle.intento.respuestasOmitidas} omitidas
                  </p>
                )}
              </div>

              <button
                type="button"
                aria-label="Cerrar detalle"
                onClick={() => {
                  setDetalleAbierto(
                    null,
                  );

                  setDetalle(
                    null,
                  );
                }}
              >
                <X
                  size={
                    18
                  }
                />
              </button>
            </header>

            {detalle && (
              <div className="quiz-resultados-modal__metricas">
                <article>
                  <small>
                    Puesto
                  </small>

                  <strong>
                    {detalle.intento.posicionFinal ??
                      '—'}°
                  </strong>
                </article>

                <article>
                  <small>
                    Tiempo
                  </small>

                  <strong>
                    {tiempo(
                      detalle.intento.tiempoTotalMs,
                    )}
                  </strong>
                </article>

                <article>
                  <small>
                    Nota base
                  </small>

                  <strong>
                    {numero(
                      detalle.intento.notaBase,
                    ).toFixed(
                      1,
                    )}
                  </strong>
                </article>

                <article className="destacada">
                  <small>
                    Nota final
                  </small>

                  <strong>
                    {numero(
                      detalle.intento.notaFinal,
                    ).toFixed(
                      1,
                    )}
                  </strong>
                </article>
              </div>
            )}

            <div className="quiz-resultados-modal__contenido">
              {cargandoDetalle ? (
                <div className="quiz-resultados__detalle-cargando">
                  Cargando detalle...
                </div>
              ) : detalle ? (
                <div className="quiz-resultados__preguntas">
                  {detalle.preguntas.map(
                    (
                      pregunta,
                    ) => (
                      <article
                        key={
                          pregunta.preguntaId
                        }
                        className={
                          pregunta.omitida
                            ? 'omitida'
                            : pregunta.esCorrecta
                              ? 'correcta'
                              : 'incorrecta'
                        }
                      >
                        <header>
                          <div>
                            <small>
                              Pregunta {pregunta.orden + 1}
                            </small>

                            <strong>
                              {pregunta.enunciado}
                            </strong>
                          </div>

                          <span
                            className={
                              pregunta.omitida
                                ? 'estado omitida'
                                : pregunta.esCorrecta
                                  ? 'estado correcta'
                                  : 'estado incorrecta'
                            }
                          >
                            {pregunta.omitida ? (
                              <FileQuestion
                                size={
                                  13
                                }
                              />
                            ) : pregunta.esCorrecta ? (
                              <CheckCircle2
                                size={
                                  13
                                }
                              />
                            ) : (
                              <XCircle
                                size={
                                  13
                                }
                              />
                            )}

                            {pregunta.omitida
                              ? 'OMITIDA'
                              : pregunta.esCorrecta
                                ? 'CORRECTA'
                                : 'INCORRECTA'}
                          </span>
                        </header>

                        <div className="quiz-resultados__respuesta-grid">
                          <div>
                            <span>
                              Respuesta del estudiante
                            </span>

                            <strong>
                              {pregunta.opcionesSeleccionadas.length
                                ? pregunta.opcionesSeleccionadas
                                    .map(
                                      (
                                        opcion,
                                      ) =>
                                        opcion.texto,
                                    )
                                    .join(
                                      ', ',
                                    )
                                : 'Sin respuesta'}
                            </strong>
                          </div>

                          <div className="correcta">
                            <span>
                              Respuesta correcta
                            </span>

                            <strong>
                              {pregunta.opcionesCorrectas
                                .map(
                                  (
                                    opcion,
                                  ) =>
                                    opcion.texto,
                                )
                                .join(
                                  ', ',
                                )}
                            </strong>
                          </div>
                        </div>

                        <footer>
                          <span>
                            <Clock3
                              size={
                                12
                              }
                            />

                            {tiempo(
                              pregunta.tiempoRespuestaMs,
                            )}
                          </span>

                          <span>
                            Puntaje:
                            <strong>
                              {pregunta.puntajeObtenido.toFixed(
                                1,
                              )} / {pregunta.puntajePregunta.toFixed(
                                1,
                              )}
                            </strong>
                          </span>
                        </footer>
                      </article>
                    ),
                  )}
                </div>
              ) : null}
            </div>

            <footer className="quiz-resultados-modal__pie">
              <button
                type="button"
                onClick={() => {
                  setDetalleAbierto(
                    null,
                  );

                  setDetalle(
                    null,
                  );
                }}
              >
                Cerrar
              </button>
            </footer>
          </section>
        </div>
      )}

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .quiz-resultados {
    width: 100%;
    min-width: 0;
    display: grid;
    gap: 12px;
    color: var(--app-text);
  }

  .quiz-resultados__cargando {
    min-height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border: 1px solid var(--app-border);
    border-radius: 17px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    font-size: 10px;
  }

  .quiz-resultados__cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 14px 15px;
    border: 1px solid var(--app-border);
    border-radius: 17px;
    background: var(--app-surface);
  }

  .quiz-resultados__cabecera > div {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .quiz-resultados__cabecera > div > svg {
    width: 19px;
    height: 19px;
    padding: 9px;
    box-sizing: content-box;
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .quiz-resultados__cabecera > div > span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .quiz-resultados__cabecera strong {
    color: var(--app-text);
    font-size: 12px;
  }

  .quiz-resultados__cabecera small {
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .quiz-resultados__cabecera > button {
    min-height: 35px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 11px;
    border: 0;
    border-radius: 999px;
    color: #fff;
    background: linear-gradient(135deg, var(--app-accent), var(--app-accent-hover));
    font: inherit;
    font-size: 8.5px;
    font-weight: 800;
    cursor: pointer;
  }

  .quiz-resultados__cabecera > button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .quiz-resultados__publicado {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-success);
    background: var(--app-success-bg);
    font-size: 7.8px;
    font-weight: 900;
  }

  .quiz-resultados__resumen {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 9px;
  }

  .quiz-resultados__resumen article {
    min-width: 0;
    min-height: 67px;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-items: center;
    gap: 2px 8px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 15px;
    background: var(--app-surface);
  }

  .quiz-resultados__resumen article > svg {
    grid-row: 1 / 3;
    width: 17px;
    height: 17px;
    padding: 8px;
    box-sizing: content-box;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .quiz-resultados__resumen article > span {
    color: var(--app-text-muted);
    font-size: 7.8px;
  }

  .quiz-resultados__resumen article > strong {
    color: var(--app-text);
    font-size: 15px;
    line-height: 1;
  }

  .quiz-resultados__tabla-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--app-border);
    border-radius: 17px;
    background: var(--app-surface);
  }

  .quiz-resultados__tabla {
    width: 100%;
    min-width: 1040px;
    border-collapse: collapse;
  }

  .quiz-resultados__tabla th,
  .quiz-resultados__tabla td {
    padding: 10px 11px;
    border-bottom: 1px solid var(--app-border-soft);
    text-align: left;
    vertical-align: middle;
  }

  .quiz-resultados__tabla th {
    color: var(--app-text-soft);
    background: var(--app-accent-soft);
    font-size: 8px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: .025em;
  }

  .quiz-resultados__tabla td {
    color: var(--app-text-secondary);
    font-size: 9px;
  }

  .quiz-resultados__tabla tbody tr:last-child td {
    border-bottom: 0;
  }

  .quiz-resultados__tabla tbody tr:hover {
    background: var(--app-accent-softer);
  }

  .quiz-resultados__puesto {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 8.5px;
    font-weight: 900;
  }

  .quiz-resultados__estudiante {
    min-width: 210px;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .quiz-resultados__avatar {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--app-accent) 30%, var(--app-border));
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 9px;
    font-weight: 900;
  }

  .quiz-resultados__estudiante > div {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .quiz-resultados__estudiante strong {
    overflow: hidden;
    max-width: 220px;
    color: var(--app-text);
    font-size: 9.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .quiz-resultados__estudiante small {
    color: var(--app-text-muted);
    font-size: 7.5px;
  }

  .quiz-resultados__respuestas-mini {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .quiz-resultados__respuestas-mini span,
  .quiz-resultados__dato-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 25px;
    padding: 4px 7px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 800;
  }

  .quiz-resultados__respuestas-mini .correcta {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .quiz-resultados__respuestas-mini .incorrecta {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .quiz-resultados__dato-chip {
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
  }

  .quiz-resultados__fila-ausente {
    background: color-mix(in srgb, var(--app-surface-alt) 72%, var(--app-surface));
  }

  .quiz-resultados__fila-ausente:hover {
    background: color-mix(in srgb, var(--app-warning-bg, #fffbeb) 45%, var(--app-surface));
  }

  .quiz-resultados__estado-participacion {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 25px;
    padding: 4px 7px;
    border-radius: 999px;
    font-size: 7.5px;
    font-weight: 900;
    white-space: nowrap;
  }

  .quiz-resultados__estado-participacion.participo {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .quiz-resultados__estado-participacion.ausente {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .quiz-resultados__sin-dato {
    color: var(--app-text-muted);
    font-size: 10px;
    font-weight: 800;
  }

  .quiz-resultados__sin-intento {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    font-size: 7.8px;
    font-weight: 800;
    white-space: nowrap;
  }

  .quiz-resultados__descuento {
    color: var(--app-danger);
    font-weight: 800;
  }

  .quiz-resultados__nota {
    display: inline-grid;
    place-items: center;
    min-width: 48px;
    min-height: 29px;
    padding: 4px 8px;
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 10px;
    font-weight: 900;
  }

  .quiz-resultados__detalle-btn {
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border: 1px solid var(--app-border-strong);
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
    font: inherit;
    font-size: 8px;
    font-weight: 750;
    cursor: pointer;
  }

  .quiz-resultados__detalle-btn:hover {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  /* MODAL DE DETALLE — coherente con DetalleForo/AulaModal */
  .quiz-resultados-modal__fondo {
    position: fixed;
    inset: 0;
    z-index: 97000;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(31, 24, 20, .58);
    backdrop-filter: blur(7px);
    -webkit-backdrop-filter: blur(7px);
    animation: quizResultadosFade .18s ease-out;
  }

  .quiz-resultados-modal {
    width: min(920px, 100%);
    max-height: min(88vh, 900px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--app-accent) 18%, var(--app-border));
    border-radius: 25px;
    color: var(--app-text);
    background: var(--app-surface);
    box-shadow: 0 28px 75px rgba(43, 31, 24, .28);
    animation: quizResultadosModalIn .22s cubic-bezier(.2,.8,.2,1);
  }

  .quiz-resultados-modal__cabecera {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 20px 22px 17px;
    border-bottom: 1px solid var(--app-border);
    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--app-accent) 9%, var(--app-surface)),
        var(--app-surface) 58%
      );
  }

  .quiz-resultados-modal__cabecera small {
    color: var(--app-accent-dark);
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .quiz-resultados-modal__cabecera h3 {
    margin: 3px 0 0;
    color: var(--app-text);
    font-size: 17px;
  }

  .quiz-resultados-modal__cabecera p {
    margin: 4px 0 0;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .quiz-resultados-modal__cabecera > button {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    cursor: pointer;
  }

  .quiz-resultados-modal__cabecera > button:hover {
    color: var(--app-danger);
    border-color: color-mix(in srgb, var(--app-danger) 35%, var(--app-border));
  }

  .quiz-resultados-modal__metricas {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    padding: 12px 22px;
    border-bottom: 1px solid var(--app-border-soft);
  }

  .quiz-resultados-modal__metricas article {
    display: grid;
    gap: 3px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .quiz-resultados-modal__metricas article.destacada {
    border-color: color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
    background: var(--app-accent-soft);
  }

  .quiz-resultados-modal__metricas small {
    color: var(--app-text-muted);
    font-size: 7.5px;
  }

  .quiz-resultados-modal__metricas strong {
    color: var(--app-text);
    font-size: 13px;
  }

  .quiz-resultados-modal__contenido {
    min-height: 0;
    overflow-y: auto;
    padding: 14px 22px;
    scrollbar-gutter: stable;
  }

  .quiz-resultados__detalle-cargando {
    min-height: 190px;
    display: grid;
    place-items: center;
    color: var(--app-text-muted);
    font-size: 9.5px;
  }

  .quiz-resultados__preguntas {
    display: grid;
    gap: 9px;
  }

  .quiz-resultados__preguntas article {
    display: grid;
    gap: 9px;
    padding: 11px;
    border: 1px solid var(--app-border);
    border-left: 4px solid var(--app-border-strong);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .quiz-resultados__preguntas article.correcta {
    border-left-color: var(--app-success);
  }

  .quiz-resultados__preguntas article.incorrecta {
    border-left-color: var(--app-danger);
  }

  .quiz-resultados__preguntas article.omitida {
    border-left-color: var(--app-warning, #d97706);
  }

  .quiz-resultados__preguntas article > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .quiz-resultados__preguntas article > header > div {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .quiz-resultados__preguntas article > header small {
    color: var(--app-accent-dark);
    font-size: 7.5px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .quiz-resultados__preguntas article > header > div > strong {
    color: var(--app-text);
    font-size: 10px;
    line-height: 1.45;
  }

  .quiz-resultados__preguntas .estado {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    padding: 5px 7px;
    border-radius: 999px;
    font-size: 7.5px;
    font-weight: 900;
  }

  .quiz-resultados__preguntas .estado.correcta {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .quiz-resultados__preguntas .estado.incorrecta {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .quiz-resultados__preguntas .estado.omitida {
    color: var(--app-warning-strong, #b45309);
    background: var(--app-warning-bg, #fffbeb);
  }

  .quiz-resultados__respuesta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .quiz-resultados__respuesta-grid > div {
    display: grid;
    gap: 4px;
    padding: 9px 10px;
    border: 1px solid var(--app-border-soft);
    border-radius: 10px;
    background: var(--app-surface);
  }

  .quiz-resultados__respuesta-grid > div.correcta {
    border-color: color-mix(in srgb, var(--app-success) 25%, var(--app-border));
    background: color-mix(in srgb, var(--app-success-bg) 60%, var(--app-surface));
  }

  .quiz-resultados__respuesta-grid span {
    color: var(--app-text-muted);
    font-size: 7px;
    text-transform: uppercase;
  }

  .quiz-resultados__respuesta-grid strong {
    color: var(--app-text-secondary);
    font-size: 8.5px;
    line-height: 1.45;
  }

  .quiz-resultados__preguntas article > footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: var(--app-text-muted);
    font-size: 7.5px;
  }

  .quiz-resultados__preguntas article > footer span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .quiz-resultados__preguntas article > footer strong {
    color: var(--app-text);
  }

  .quiz-resultados-modal__pie {
    display: flex;
    justify-content: flex-end;
    padding: 12px 22px;
    border-top: 1px solid var(--app-border);
    background: color-mix(in srgb, var(--app-bg) 25%, var(--app-surface));
  }

  .quiz-resultados-modal__pie button {
    min-width: 100px;
    min-height: 35px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    font-size: 8.5px;
    font-weight: 800;
    cursor: pointer;
  }

  @keyframes quizResultadosFade {
    from {
      opacity: 0;
    }
  }

  @keyframes quizResultadosModalIn {
    from {
      opacity: 0;
      transform: translateY(14px) scale(.98);
    }
  }

  @media (max-width: 920px) {
    .quiz-resultados__resumen {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .quiz-resultados-modal__metricas {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .quiz-resultados__cabecera {
      align-items: flex-start;
      flex-direction: column;
    }

    .quiz-resultados__resumen,
    .quiz-resultados-modal__metricas,
    .quiz-resultados__respuesta-grid {
      grid-template-columns: 1fr;
    }

    .quiz-resultados-modal__fondo {
      padding: 0;
      place-items: end center;
    }

    .quiz-resultados-modal {
      width: 100%;
      max-height: 94vh;
      border-radius: 23px 23px 0 0;
    }
  }
`;
