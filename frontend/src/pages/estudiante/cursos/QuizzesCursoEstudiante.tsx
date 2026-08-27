import {
  AlertCircle,
  Award,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileQuestion,
  PlayCircle,
  RefreshCw,
  Trophy,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaLoadingOverlay from '../../../components/aula/AulaLoadingOverlay';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import AulaToolbar, {
  type OpcionAulaToolbar,
} from '../../../components/aula/AulaToolbar';

import {
  useAuth,
} from '../../../auth/AuthContext';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import {
  listarQuizzesEstudiante,
} from '../../../services/quizzes/quizzes-estudiante.service';

import type {
  QuizListadoEstudiante,
} from '../../../types/quizzes/quizzes-estudiante.types';

type Filtro =
  | 'TODOS'
  | 'DISPONIBLES'
  | 'PROXIMOS'
  | 'EN_CURSO'
  | 'FINALIZADOS';

function fechaCompacta(
  valor:
    string |
    null |
    undefined,
) {
  if (
    !valor
  ) {
    return 'Sin fecha';
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
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',
      month:
        'short',
      hour:
        '2-digit',
      minute:
        '2-digit',
      hour12:
        false,
    },
  ).format(
    fecha,
  );
}

function etiquetaEstado(
  quiz:
    QuizListadoEstudiante,
) {
  if (
    quiz.estado ===
    'ESPERANDO'
  ) {
    if (
      quiz.modalidad ===
      'PROGRAMADO' &&
      quiz.aperturaProgramada &&
      new Date(
        quiz.aperturaProgramada,
      ).getTime() >
        Date.now()
    ) {
      return 'Próximo';
    }

    return 'Disponible';
  }

  if (
    quiz.estado ===
    'CUENTA_REGRESIVA'
  ) {
    return 'Iniciando';
  }

  if (
    quiz.estado ===
    'EN_CURSO'
  ) {
    return 'En curso';
  }

  if (
    quiz.estado ===
    'PAUSADO'
  ) {
    return 'Pausado';
  }

  if (
    quiz.resultadosPublicados
  ) {
    return 'Resultados publicados';
  }

  return 'Finalizado';
}

function claseEstado(
  quiz:
    QuizListadoEstudiante,
) {
  if (
    quiz.estado ===
    'ESPERANDO'
  ) {
    if (
      quiz.modalidad ===
      'PROGRAMADO' &&
      quiz.aperturaProgramada &&
      new Date(
        quiz.aperturaProgramada,
      ).getTime() >
        Date.now()
    ) {
      return 'proximo';
    }

    return 'disponible';
  }

  if (
    quiz.estado ===
    'CUENTA_REGRESIVA'
  ) {
    return 'iniciando';
  }

  if (
    quiz.estado ===
    'EN_CURSO'
  ) {
    return 'en-curso';
  }

  if (
    quiz.estado ===
    'PAUSADO'
  ) {
    return 'pausado';
  }

  if (
    quiz.resultadosPublicados
  ) {
    return 'publicado';
  }

  return 'finalizado';
}

function QuizCardEstudiante({
  quiz,
  onAbrir,
}: {
  quiz:
    QuizListadoEstudiante;

  onAbrir:
    () => void;
}) {
  const referencia =
    quiz.modalidad ===
      'PROGRAMADO' &&
    quiz.aperturaProgramada
      ? {
          etiqueta:
            'Apertura',

          valor:
            fechaCompacta(
              quiz.aperturaProgramada,
            ),
        }
      : quiz.estado ===
          'FINALIZADO'
        ? {
            etiqueta:
              'Finalizó',

            valor:
              fechaCompacta(
                quiz.finalizadoEn,
              ),
          }
        : {
            etiqueta:
              'Modalidad',

            valor:
              'En vivo',
          };

  return (
    <article className="qe-card">
      <button
        type="button"
        className="qe-card__body"
        onClick={
          onAbrir
        }
      >
        <div className="qe-card__chips">
          <span
            className={`qe-estado qe-estado--${claseEstado(
              quiz,
            )}`}
          >
            {etiquetaEstado(
              quiz,
            )}
          </span>

          {quiz.esCalificable && (
            <span className="qe-chip qe-chip--nota">
              <Award
                size={
                  12
                }
              />

              Calificable
            </span>
          )}

          {quiz.componente && (
            <span
              className={`qe-chip qe-chip--${quiz.componente.toLowerCase()}`}
            >
              {quiz.componente ===
              'CONTINUA'
                ? 'Continua'
                : 'Procesual'}
            </span>
          )}

          <span className="qe-chip">
            <FileQuestion
              size={
                12
              }
            />

            {quiz._count.preguntas}
            {' '}
            preguntas
          </span>
        </div>

        <h3>
          {quiz.titulo}
        </h3>

        <p>
          {quiz.descripcion ||
            'Responde las preguntas preparadas por tu docente.'}
        </p>

        <div className="qe-card__meta">
          <span>
            {quiz.hito.nombre}
          </span>

          <span>
            {quiz.modalidad ===
            'PROGRAMADO'
              ? 'Programado'
              : 'En vivo'}
          </span>

          <span>
            {quiz.dificultad ===
            'MIXTA'
              ? 'Dificultad mixta'
              : `Dificultad ${quiz.dificultad.toLowerCase()}`}
          </span>
        </div>

        <div className="qe-card__footer">
          <span>
            <CalendarClock
              size={
                14
              }
            />

            <span>
              <small>
                {referencia.etiqueta}
              </small>

              <strong>
                {referencia.valor}
              </strong>
            </span>
          </span>

          <span className="qe-card__action">
            {quiz.estado ===
            'FINALIZADO' ? (
              <Trophy
                size={
                  15
                }
              />
            ) : (
              <PlayCircle
                size={
                  15
                }
              />
            )}

            {quiz.estado ===
            'FINALIZADO'
              ? quiz.resultadosPublicados
                ? 'Ver resultado'
                : 'Ver estado'
              : 'Abrir Quiz'}
          </span>
        </div>
      </button>
    </article>
  );
}

export default function QuizzesCursoEstudiante() {
  const navigate =
    useNavigate();

  const {
    accessToken,
  } =
    useAuth();

  const {
    curso,
    hitoSeleccionado,
  } =
    useAulaContext();

  const [
    quizzes,
    setQuizzes,
  ] =
    useState<QuizListadoEstudiante[]>(
      [],
    );

  const [
    filtro,
    setFiltro,
  ] =
    useState<Filtro>(
      'TODOS',
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const [
    actualizando,
    setActualizando,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const cargar =
    async (
      silencioso =
        false,
    ) => {
      if (
        !accessToken
      ) {
        return;
      }

      try {
        if (
          silencioso
        ) {
          setActualizando(
            true,
          );
        } else {
          setCargando(
            true,
          );
        }

        setError(
          null,
        );

        setQuizzes(
          await listarQuizzesEstudiante(
            curso.id,
            accessToken,
          ),
        );
      } catch (
        causa
      ) {
        setError(
          causa instanceof
            Error
            ? causa.message
            : 'No fue posible cargar los quizzes.',
        );
      } finally {
        setCargando(
          false,
        );

        setActualizando(
          false,
        );
      }
    };

  useEffect(
    () => {
      void cargar();
    },
    [
      curso.id,
      accessToken,
    ],
  );

  useEffect(
    () => {
      const intervalo =
        window.setInterval(
          () => {
            if (
              document.visibilityState ===
              'visible'
            ) {
              void cargar(
                true,
              );
            }
          },
          5000,
        );

      return () =>
        window.clearInterval(
          intervalo,
        );
    },
    [
      curso.id,
      accessToken,
    ],
  );

  const delHito =
    useMemo(
      () =>
        quizzes.filter(
          (
            quiz,
          ) =>
            !hitoSeleccionado ||
            quiz.hito.id ===
              hitoSeleccionado.id,
        ),
      [
        quizzes,
        hitoSeleccionado,
      ],
    );

  const filtrados =
    useMemo(
      () =>
        delHito.filter(
          (
            quiz,
          ) => {
            const ahora =
              Date.now();

            const apertura =
              quiz.aperturaProgramada
                ? new Date(
                    quiz.aperturaProgramada,
                  ).getTime()
                : null;

            if (
              filtro ===
              'DISPONIBLES'
            ) {
              return (
                quiz.estado ===
                  'ESPERANDO' &&
                (
                  quiz.modalidad ===
                    'EN_VIVO' ||
                  apertura ===
                    null ||
                  apertura <=
                    ahora
                )
              );
            }

            if (
              filtro ===
              'PROXIMOS'
            ) {
              return (
                quiz.estado ===
                  'ESPERANDO' &&
                quiz.modalidad ===
                  'PROGRAMADO' &&
                apertura !==
                  null &&
                apertura >
                  ahora
              );
            }

            if (
              filtro ===
              'EN_CURSO'
            ) {
              return [
                'CUENTA_REGRESIVA',
                'EN_CURSO',
                'PAUSADO',
              ].includes(
                quiz.estado,
              );
            }

            if (
              filtro ===
              'FINALIZADOS'
            ) {
              return quiz.estado ===
                'FINALIZADO';
            }

            return true;
          },
        ),
      [
        delHito,
        filtro,
      ],
    );

  const opciones:
    OpcionAulaToolbar<Filtro>[] = [
      {
        id:
          'TODOS',
        texto:
          'Todos',
        icono:
          FileQuestion,
        contador:
          delHito.length,
      },
      {
        id:
          'DISPONIBLES',
        texto:
          'Disponibles',
        icono:
          CheckCircle2,
      },
      {
        id:
          'PROXIMOS',
        texto:
          'Próximos',
        icono:
          CalendarClock,
      },
      {
        id:
          'EN_CURSO',
        texto:
          'En curso',
        icono:
          Clock3,
      },
      {
        id:
          'FINALIZADOS',
        texto:
          'Finalizados',
        icono:
          Trophy,
      },
    ];

  return (
    <section className="qe-page">
      <AulaHeader
        icono={
          FileQuestion
        }
        etiqueta="Evaluación interactiva"
        titulo="Quizzes"
        descripcion="Participa en evaluaciones rápidas, responde en tiempo real y consulta tus resultados cuando el docente los publique."
        informacion={
          hitoSeleccionado
            ? `Mostrando quizzes de ${hitoSeleccionado.nombre}.`
            : 'Selecciona un hito para consultar sus quizzes.'
        }
        acciones={[
          {
            texto:
              'Actualizar',
            icono:
              RefreshCw,
            variante:
              'secundaria',
            deshabilitada:
              actualizando,
            onClick: () =>
              void cargar(
                true,
              ),
          },
        ]}
      />

      <AulaToolbar
        opciones={
          opciones
        }
        opcionActiva={
          filtro
        }
        ariaLabel="Estados de los quizzes"
        onCambiar={
          setFiltro
        }
      />

      {error && (
        <div
          className="qe-error"
          role="alert"
        >
          <AlertCircle
            size={
              18
            }
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError(
                null,
              )
            }
          >
            <X
              size={
                15
              }
            />
          </button>
        </div>
      )}

      <div className="qe-resultados">
        <AulaLoadingOverlay
          visible={
            actualizando
          }
          texto="Actualizando quizzes…"
        />

        {cargando ? (
          <AulaSkeleton
            cantidad={
              4
            }
            variante="tarjetas"
          />
        ) : filtrados.length ===
          0 ? (
          <AulaEmptyState
            icono={
              FileQuestion
            }
            titulo={
              filtro ===
              'TODOS'
                ? 'Todavía no hay quizzes'
                : 'No hay quizzes en esta categoría'
            }
            descripcion={
              filtro ===
              'TODOS'
                ? 'Los quizzes publicados por tu docente aparecerán aquí.'
                : 'Cambia el filtro para consultar otros quizzes.'
            }
            accionTexto={
              filtro !==
              'TODOS'
                ? 'Ver todos'
                : undefined
            }
            onAccion={
              filtro !==
              'TODOS'
                ? () =>
                    setFiltro(
                      'TODOS',
                    )
                : undefined
            }
          />
        ) : (
          <div className="qe-grid">
            {filtrados.map(
              (
                quiz,
              ) => (
                <QuizCardEstudiante
                  key={
                    quiz.id
                  }
                  quiz={
                    quiz
                  }
                  onAbrir={() =>
                    navigate(
                      String(
                        quiz.id,
                      ),
                    )
                  }
                />
              ),
            )}
          </div>
        )}
      </div>

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .qe-page {
    display: grid;
    gap: 14px;
    min-width: 0;
    color: var(--app-text);
  }

  .qe-error {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 12px 14px;
    border: 1px solid var(--app-danger-border);
    border-radius: 14px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
    font-size: 11px;
  }

  .qe-error span {
    flex: 1;
  }

  .qe-error button {
    display: grid;
    place-items: center;
    padding: 4px;
    border: 0;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }

  .qe-resultados {
    position: relative;
    min-height: 180px;
  }

  .qe-grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 13px;
  }

  .qe-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-left: 4px solid var(--app-accent);
    border-radius: 19px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition:
      transform .16s ease,
      border-color .16s ease,
      box-shadow .16s ease;
  }

  .qe-card:hover {
    transform: translateY(-2px);
    border-color: var(--app-border-strong);
    box-shadow: var(--app-shadow-md);
  }

  .qe-card__body {
    width: 100%;
    display: block;
    padding: 17px;
    border: 0;
    color: inherit;
    background: transparent;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .qe-card__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .qe-estado,
  .qe-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  .qe-chip {
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
  }

  .qe-estado--disponible {
    color: #047857;
    background: #d1fae5;
  }

  .qe-estado--proximo {
    color: #1d4ed8;
    background: #dbeafe;
  }

  .qe-estado--iniciando,
  .qe-estado--en-curso {
    color: #7c3aed;
    background: #ede9fe;
  }

  .qe-estado--pausado {
    color: #b45309;
    background: #ffedd5;
  }

  .qe-estado--finalizado {
    color: #64748b;
    background: #f1f5f9;
  }

  .qe-estado--publicado {
    color: #0369a1;
    background: #e0f2fe;
  }

  .qe-chip--nota {
    color: #6d28d9;
    background: #ede9fe;
  }

  .qe-chip--continua {
    color: #047857;
    background: #ecfdf5;
  }

  .qe-chip--procesual {
    color: #1d4ed8;
    background: #eff6ff;
  }

  .qe-card h3 {
    margin: 14px 0 6px;
    font-size: 16px;
    line-height: 1.25;
  }

  .qe-card p {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: var(--app-text-soft);
    font-size: 11px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .qe-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px 12px;
    margin-top: 12px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .qe-card__meta span + span::before {
    content: "•";
    margin-right: 12px;
  }

  .qe-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--app-border-soft);
  }

  .qe-card__footer > span:first-child {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--app-accent-dark);
  }

  .qe-card__footer > span:first-child > span {
    display: grid;
    gap: 1px;
  }

  .qe-card__footer small {
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .qe-card__footer strong {
    color: var(--app-text-secondary);
    font-size: 9px;
  }

  .qe-card__action {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--app-accent-dark);
    font-size: 9px;
    font-weight: 850;
  }

  @media (max-width: 850px) {
    .qe-grid {
      grid-template-columns: 1fr;
    }
  }
`;
