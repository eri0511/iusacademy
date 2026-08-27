import {
  BookOpenCheck,
  Clock3,
  FileQuestion,
  PlayCircle,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../auth/AuthContext';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaModal from '../../../components/aula/AulaModal';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';

import AulaToolbar, {
  type OpcionAulaToolbar,
} from '../../../components/aula/AulaToolbar';

import FormularioQuizInteligente from '../../../components/quizzes/FormularioQuizInteligente';
import QuizCard from '../../../components/quizzes/QuizCard';

import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import {
  eliminarQuiz,
  listarQuizzes,
} from '../../../services/quizzes/quizzes.service';

import type {
  QuizCurso,
} from '../../../types/quizzes/quizzes.types';

type Filtro =
  | 'TODOS'
  | 'BORRADOR'
  | 'ESPERANDO'
  | 'EN_CURSO'
  | 'FINALIZADO';

type EstadoToast = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje?: string;
};

export default function QuizzesCurso() {
  const navigate =
    useNavigate();

  const {
    accessToken,
  } =
    useAuth();

  const {
    curso,
    hitoSeleccionado,
    aula,
  } =
    useAulaContext();

  const [
    quizzes,
    setQuizzes,
  ] = useState<QuizCurso[]>(
    [],
  );

  const [
    cargando,
    setCargando,
  ] = useState(
    true,
  );

  const [
    filtro,
    setFiltro,
  ] = useState<Filtro>(
    'TODOS',
  );

  const [
    busqueda,
    setBusqueda,
  ] = useState(
    '',
  );

  const [
    formularioAbierto,
    setFormularioAbierto,
  ] = useState(
    false,
  );

  const [
    quizEditarId,
    setQuizEditarId,
  ] =
    useState<
      number |
      null
    >(
      null,
    );

  const [
    quizEliminar,
    setQuizEliminar,
  ] =
    useState<QuizCurso | null>(
      null,
    );

  const [
    eliminando,
    setEliminando,
  ] =
    useState(
      false,
    );

  const [
    toast,
    setToast,
  ] = useState<EstadoToast>({
    visible: false,
    tipo: 'informacion',
    titulo: '',
  });

  const mostrarToast = useCallback(
    (
      tipo: TipoToast,
      titulo: string,
      mensaje?: string,
    ) => {
      setToast({
        visible: true,
        tipo,
        titulo,
        mensaje,
      });
    },
    [],
  );

  const cargar = useCallback(
    async () => {
      if (
        !accessToken ||
        !curso?.id
      ) {
        setCargando(
          false,
        );

        return;
      }

      try {
        setCargando(
          true,
        );

        setQuizzes(
          await listarQuizzes(
            curso.id,
            accessToken,
          ),
        );
      } catch (error) {
        mostrarToast(
          'error',
          'No se pudieron cargar los Quizzes',
          error instanceof Error
            ? error.message
            : undefined,
        );
      } finally {
        setCargando(
          false,
        );
      }
    },
    [
      accessToken,
      curso?.id,
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

  const confirmarEliminar =
    async () => {
      if (
        !accessToken ||
        !curso?.id ||
        !quizEliminar
      ) {
        return;
      }

      try {
        setEliminando(
          true,
        );

        await eliminarQuiz(
          curso.id,
          quizEliminar.id,
          accessToken,
        );

        setQuizEliminar(
          null,
        );

        await cargar();

        mostrarToast(
          'exito',
          'Borrador eliminado',
          'El Quiz y su contenido de borrador fueron eliminados correctamente.',
        );
      } catch (
        error
      ) {
        mostrarToast(
          'error',
          'No se pudo eliminar el borrador',
          error instanceof
            Error
            ? error.message
            : undefined,
        );
      } finally {
        setEliminando(
          false,
        );
      }
    };

  const delHito = useMemo(
    () =>
      quizzes.filter(
        (quiz) =>
          quiz.hitoId ===
          hitoSeleccionado?.id,
      ),
    [
      quizzes,
      hitoSeleccionado?.id,
    ],
  );

  const visibles = useMemo(
    () => {
      const q =
        busqueda
          .trim()
          .toLocaleLowerCase(
            'es',
          );

      return delHito.filter(
        (quiz) => {
          if (
            filtro ===
              'BORRADOR' &&
            quiz.estado !==
              'BORRADOR'
          ) {
            return false;
          }

          if (
            filtro ===
              'ESPERANDO' &&
            ![
              'ESPERANDO',
              'CUENTA_REGRESIVA',
            ].includes(
              quiz.estado,
            )
          ) {
            return false;
          }

          if (
            filtro ===
              'EN_CURSO' &&
            ![
              'EN_CURSO',
              'PAUSADO',
            ].includes(
              quiz.estado,
            )
          ) {
            return false;
          }

          if (
            filtro ===
              'FINALIZADO' &&
            quiz.estado !==
              'FINALIZADO'
          ) {
            return false;
          }

          if (!q) {
            return true;
          }

          return [
            quiz.titulo,
            quiz.descripcion ?? '',
            quiz.hito.codigo,
            quiz.hito.nombre,
          ]
            .join(
              ' ',
            )
            .toLocaleLowerCase(
              'es',
            )
            .includes(
              q,
            );
        },
      );
    },
    [
      delHito,
      filtro,
      busqueda,
    ],
  );

  const contador = (
    estado: Filtro,
  ) => {
    if (
      estado ===
      'TODOS'
    ) {
      return delHito.length;
    }

    if (
      estado ===
      'ESPERANDO'
    ) {
      return delHito.filter(
        (quiz) =>
          [
            'ESPERANDO',
            'CUENTA_REGRESIVA',
          ].includes(
            quiz.estado,
          ),
      ).length;
    }

    if (
      estado ===
      'EN_CURSO'
    ) {
      return delHito.filter(
        (quiz) =>
          [
            'EN_CURSO',
            'PAUSADO',
          ].includes(
            quiz.estado,
          ),
      ).length;
    }

    return delHito.filter(
      (quiz) =>
        quiz.estado ===
        estado,
    ).length;
  };

  const opciones:
    OpcionAulaToolbar<Filtro>[] = [
      {
        id: 'TODOS',
        texto: 'Todos',
        icono: FileQuestion,
        contador: contador(
          'TODOS',
        ),
      },
      {
        id: 'BORRADOR',
        texto: 'Borradores',
        icono: BookOpenCheck,
        contador: contador(
          'BORRADOR',
        ),
      },
      {
        id: 'ESPERANDO',
        texto: 'Sala abierta',
        icono: Radio,
        contador: contador(
          'ESPERANDO',
        ),
      },
      {
        id: 'EN_CURSO',
        texto: 'En curso',
        icono: PlayCircle,
        contador: contador(
          'EN_CURSO',
        ),
      },
      {
        id: 'FINALIZADO',
        texto: 'Finalizados',
        icono: Clock3,
        contador: contador(
          'FINALIZADO',
        ),
      },
    ];

  if (
    cargando &&
    quizzes.length ===
      0
  ) {
    return (
      <AulaSkeleton
        variante="tarjetas"
        cantidad={
          4
        }
      />
    );
  }

  return (
    <section className="quizzes-page">
      <AulaHeader
        icono={
          Sparkles
        }
        etiqueta={
          hitoSeleccionado
            ? `Quizzes · ${hitoSeleccionado.codigo}`
            : 'Quizzes'
        }
        titulo="Evaluaciones inteligentes"
        descripcion="Crea Quizzes a partir de los PDF de Recursos, selecciona artículos o fragmentos y revisa las preguntas antes de abrir la sala."
        informacion={
          hitoSeleccionado
            ? `${hitoSeleccionado.nombre} · ${delHito.length} Quiz${delHito.length === 1 ? '' : 'zes'}`
            : 'Selecciona un hito académico.'
        }
        acciones={[
          {
            texto: 'Crear Quiz',
            icono: Plus,
            variante: 'primaria',
            deshabilitada:
              !hitoSeleccionado,
            onClick: () => {
              setQuizEditarId(
                null,
              );

              setFormularioAbierto(
                true,
              );
            },
          },
          {
            texto: 'Actualizar',
            icono: RefreshCw,
            onClick: () =>
              void cargar(),
          },
        ]}
      />

      <div className="quizzes-page__controles">
        <AulaToolbar
          opciones={
            opciones
          }
          opcionActiva={
            filtro
          }
          onCambiar={
            setFiltro
          }
        />

        <label className="quizzes-page__buscador">
          <Search
            size={
              16
            }
          />

          <input
            value={
              busqueda
            }
            placeholder="Buscar Quiz..."
            onChange={(
              evento,
            ) =>
              setBusqueda(
                evento.target.value,
              )
            }
          />
        </label>
      </div>

      {visibles.length ===
      0 ? (
        <AulaEmptyState
          icono={
            Sparkles
          }
          titulo={
            delHito.length ===
            0
              ? 'Aún no hay Quizzes en este hito'
              : 'No encontramos Quizzes'
          }
          descripcion={
            delHito.length ===
            0
              ? 'Crea una evaluación inteligente usando los PDF disponibles en Recursos.'
              : 'Prueba con otro filtro o término de búsqueda.'
          }
          accionTexto={
            delHito.length ===
            0
              ? 'Crear primer Quiz'
              : undefined
          }
          onAccion={
            delHito.length ===
            0
              ? () => {
                  setQuizEditarId(
                    null,
                  );

                  setFormularioAbierto(
                    true,
                  );
                }
              : undefined
          }
        />
      ) : (
        <div className="quizzes-page__grid">
          {visibles.map(
            (quiz) => (
              <QuizCard
                key={
                  quiz.id
                }
                quiz={
                  quiz
                }
                onAbrir={() => {
                  if (
                    quiz.estado ===
                    'BORRADOR'
                  ) {
                    setQuizEditarId(
                      quiz.id,
                    );

                    setFormularioAbierto(
                      true,
                    );

                    return;
                  }

                  navigate(
                    String(
                      quiz.id,
                    ),
                  );
                }}
                onEliminar={
                  quiz.estado ===
                    'BORRADOR'
                    ? () =>
                        setQuizEliminar(
                          quiz,
                        )
                    : undefined
                }
              />
            ),
          )}
        </div>
      )}

      {accessToken && (
        <FormularioQuizInteligente
          abierto={
            formularioAbierto
          }
          cursoId={
            curso.id
          }
          accessToken={
            accessToken
          }
          hitos={
            aula.planificacion.hitos.map(
              (hito) => ({
                id: hito.id,
                codigo: hito.codigo,
                nombre: hito.nombre,
              }),
            )
          }
          hitoInicialId={
            hitoSeleccionado?.id ??
            null
          }
          quizInicialId={
            quizEditarId
          }
          onCerrar={() => {
            setFormularioAbierto(
              false,
            );

            setQuizEditarId(
              null,
            );

            void cargar();
          }}
          onCompletado={() => {
            setFormularioAbierto(
              false,
            );

            setQuizEditarId(
              null,
            );

            void cargar();
          }}
          onToast={
            mostrarToast
          }
        />
      )}

      <AulaModal
        abierto={
          quizEliminar !==
          null
        }
        ancho="compacto"
        icono={
          Trash2
        }
        etiqueta="Eliminar borrador"
        titulo="¿Eliminar este Quiz?"
        descripcion="Esta acción solo está disponible mientras el Quiz permanezca en borrador."
        bloqueado={
          eliminando
        }
        onCerrar={() => {
          if (
            !eliminando
          ) {
            setQuizEliminar(
              null,
            );
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="quiz-eliminar-btn quiz-eliminar-btn--cancelar"
              disabled={
                eliminando
              }
              onClick={() =>
                setQuizEliminar(
                  null,
                )
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              className="quiz-eliminar-btn quiz-eliminar-btn--confirmar"
              disabled={
                eliminando
              }
              onClick={() =>
                void confirmarEliminar()
              }
            >
              <Trash2
                size={
                  15
                }
              />

              {eliminando
                ? 'Eliminando...'
                : 'Eliminar'}
            </button>
          </>
        }
      >
        <div className="quiz-eliminar">
          <div className="quiz-eliminar__icono">
            <Trash2
              size={
                22
              }
            />
          </div>

          <div>
            <strong>
              {quizEliminar?.titulo}
            </strong>

            <p>
              Se eliminarán la configuración, fuentes, fragmentos y preguntas del borrador. Los PDF originales de Recursos permanecerán intactos.
            </p>
          </div>
        </div>

        <style>
          {`
            .quiz-eliminar {
              display: grid;
              grid-template-columns: 46px minmax(0, 1fr);
              align-items: start;
              gap: 12px;
              padding: 10px 4px;
            }

            .quiz-eliminar__icono {
              width: 46px;
              height: 46px;
              display: grid;
              place-items: center;
              border-radius: 13px;
              color: var(--app-danger);
              background: var(--app-danger-bg);
            }

            .quiz-eliminar strong {
              color: var(--app-text);
              font-size: 13px;
            }

            .quiz-eliminar p {
              margin: 6px 0 0;
              color: var(--app-text-muted);
              font-size: 10px;
              line-height: 1.55;
            }

            .quiz-eliminar-btn {
              min-height: 38px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              padding: 8px 12px;
              border-radius: 10px;
              font: inherit;
              font-size: 10px;
              font-weight: 850;
              cursor: pointer;
            }

            .quiz-eliminar-btn:disabled {
              opacity: .55;
              cursor: not-allowed;
            }

            .quiz-eliminar-btn--cancelar {
              border: 1px solid var(--app-border-strong);
              color: var(--app-text-secondary);
              background: var(--app-surface);
            }

            .quiz-eliminar-btn--confirmar {
              border: 1px solid color-mix(in srgb, var(--app-danger) 35%, var(--app-border));
              color: var(--app-danger);
              background: var(--app-danger-bg);
            }
          `}
        </style>
      </AulaModal>


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
            (actual) => ({
              ...actual,
              visible: false,
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
  .quizzes-page {
    min-width: 0;
    display: grid;
    gap: 16px;
  }

  .quizzes-page__controles {
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(240px, 330px);
    gap: 10px;
  }

  .quizzes-page__buscador {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 0 12px;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .quizzes-page__buscador input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    color: var(--app-text);
    background: transparent;
    font: inherit;
    font-size: 10px;
  }

  .quizzes-page__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  @media (max-width: 900px) {
    .quizzes-page__controles,
    .quizzes-page__grid {
      grid-template-columns: 1fr;
    }

    .quizzes-page__buscador {
      min-height: 46px;
    }
  }
`;