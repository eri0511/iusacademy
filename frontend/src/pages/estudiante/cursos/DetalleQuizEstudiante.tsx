import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Crown,
  ChevronRight,
  Clock3,
  CircleDot,
  FileQuestion,
  Info,
  LogIn,
  Medal,
  PauseCircle,
  Send,
  RefreshCw,
  ShieldCheck,
  Trophy,
  XCircle,
  UserCheck,
  Users,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../auth/AuthContext';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaModal from '../../../components/aula/AulaModal';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';

import AvatarQuiz, {
  nombreAvatarQuiz,
} from '../../../components/quizzes/AvatarQuiz';

import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import {
  heartbeatQuizEstudiante,
  marcarListoQuizEstudiante,
  obtenerLobbyQuizEstudiante,
  obtenerMiResultadoQuizEstudiante,
  obtenerQuizEstudiante,
  obtenerRankingFinalQuizEstudiante,
  responderPreguntaQuizEstudiante,
  seleccionarAvatarQuizEstudiante,
  unirseQuizEstudiante,
} from '../../../services/quizzes/quizzes-estudiante.service';

import {
  AVATARES_QUIZ,
  type AvatarQuizCodigo,
} from '../../../types/quizzes/avatar-quiz.types';

import type {
  LobbyQuizEstudiante,
  MiResultadoQuizEstudiante,
  ParticipanteLobbyQuizEstudiante,
  RankingFinalQuizEstudiante,
  QuizDetalleEstudiante,
} from '../../../types/quizzes/quizzes-estudiante.types';

type EstadoToast = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje?: string;
  duracion?: number;
  preguntaIdOrigen?: number | null;
};

function fecha(
  valor:
    string |
    null |
    undefined,
) {
  if (
    !valor
  ) {
    return 'Sin definir';
  }

  const objeto =
    new Date(
      valor,
    );

  if (
    Number.isNaN(
      objeto.getTime(),
    )
  ) {
    return 'Sin definir';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',
      month:
        '2-digit',
      year:
        'numeric',
      hour:
        '2-digit',
      minute:
        '2-digit',
      hour12:
        false,
    },
  ).format(
    objeto,
  );
}

function tiempoRestante(
  milisegundos:
    number,
) {
  const total =
    Math.max(
      0,
      Math.ceil(
        milisegundos /
        1000,
      ),
    );

  const dias =
    Math.floor(
      total /
      86400,
    );

  const horas =
    Math.floor(
      (
        total %
        86400
      ) /
      3600,
    );

  const minutos =
    Math.floor(
      (
        total %
        3600
      ) /
      60,
    );

  const segundos =
    total %
    60;

  if (
    dias >
    0
  ) {
    return `${dias} d ${horas} h ${minutos} min`;
  }

  if (
    horas >
    0
  ) {
    return `${horas} h ${minutos} min ${segundos} s`;
  }

  return `${minutos} min ${segundos} s`;
}

function nombreParticipante(
  participante:
    ParticipanteLobbyQuizEstudiante,
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

function nombreCorto(
  participante:
    ParticipanteLobbyQuizEstudiante,
) {
  const nombres =
    participante.estudiante.nombres
      .trim()
      .split(
        /\s+/,
      );

  return `${nombres[0] ?? ''} ${participante.estudiante.apellidoPaterno}`.trim();
}

function inicialesParticipante(
  participante:
    ParticipanteLobbyQuizEstudiante,
) {
  const primera =
    participante.estudiante.nombres
      .trim()
      .charAt(
        0,
      );

  const segunda =
    participante.estudiante.apellidoPaterno
      .trim()
      .charAt(
        0,
      );

  return `${primera}${segunda}`.toUpperCase();
}

function etiquetaEstadoParticipante(
  participante:
    ParticipanteLobbyQuizEstudiante,
) {
  if (
    !participante.conectado ||
    participante.estadoVisual ===
      'DESCONECTADO'
  ) {
    return 'Desconectado';
  }

  if (
    participante.estado ===
    'LISTO'
  ) {
    return 'Listo';
  }

  if (
    participante.estado ===
    'EN_CURSO'
  ) {
    return 'En curso';
  }

  if (
    participante.estado ===
    'FINALIZADO'
  ) {
    return 'Finalizó';
  }

  return 'En sala';
}

function formatearTiempoTotal(
  milisegundos:
    number |
    null,
) {
  if (
    !milisegundos
  ) {
    return '—';
  }

  const segundos =
    Math.floor(
      milisegundos /
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

function nota(
  valor:
    number |
    null |
    undefined,
) {
  return Number(
    valor ??
    0,
  ).toFixed(
    1,
  );
}

function nombreRankingFinal(
  item:
    RankingFinalQuizEstudiante['ranking'][number],
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

function inicialesRankingFinal(
  item:
    RankingFinalQuizEstudiante['ranking'][number],
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

export default function DetalleQuizEstudiante() {
  const navigate =
    useNavigate();

  const {
    accessToken,
  } =
    useAuth();

  const {
    cursoId,
    quizId,
  } =
    useParams();

  const idCurso =
    Number(
      cursoId,
    );

  const idQuiz =
    Number(
      quizId,
    );

  const [
    quiz,
    setQuiz,
  ] =
    useState<QuizDetalleEstudiante | null>(
      null,
    );

  const [
    lobby,
    setLobby,
  ] =
    useState<LobbyQuizEstudiante | null>(
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
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    ahora,
    setAhora,
  ] =
    useState(
      Date.now(),
    );

  const [
    seleccionadas,
    setSeleccionadas,
  ] =
    useState<number[]>(
      [],
    );

  const [
    enviandoRespuesta,
    setEnviandoRespuesta,
  ] =
    useState(
      false,
    );

  const [
    preguntaVistaId,
    setPreguntaVistaId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    resultado,
    setResultado,
  ] =
    useState<MiResultadoQuizEstudiante | null>(
      null,
    );

  const [
    rankingFinal,
    setRankingFinal,
  ] =
    useState<RankingFinalQuizEstudiante | null>(
      null,
    );

  const [
    cargandoRankingFinal,
    setCargandoRankingFinal,
  ] =
    useState(
      false,
    );

  const [
    cargandoResultado,
    setCargandoResultado,
  ] =
    useState(
      false,
    );

    useState(
      false,
    );

  const [
    modalDetalle,
    setModalDetalle,
  ] =
    useState(
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
        'exito',
      titulo:
        '',
    });

  const mostrarToast =
    (
      tipo:
        TipoToast,

      titulo:
        string,

      mensaje?:
        string,

      duracion =
        5000,

      preguntaIdOrigen:
        number |
        null =
        null,
    ) => {
      setToast({
        visible:
          true,

        tipo,

        titulo,

        mensaje,

        duracion,

        preguntaIdOrigen,
      });
    };

  const cargar =
    useCallback(
      async (
        silencioso =
          false,
      ) => {
        if (
          !accessToken ||
          !idCurso ||
          !idQuiz
        ) {
          return;
        }

        try {
          if (
            !silencioso
          ) {
            setCargando(
              true,
            );
          }

          setError(
            null,
          );

          const [
            detalle,
            sala,
          ] =
            await Promise.all([
              obtenerQuizEstudiante(
                idCurso,
                idQuiz,
                accessToken,
              ),

              obtenerLobbyQuizEstudiante(
                idCurso,
                idQuiz,
                accessToken,
              ).catch(
                () =>
                  null,
              ),
            ]);

          setQuiz(
            detalle,
          );

          setLobby(
            sala,
          );
        } catch (
          causa
        ) {
          setError(
            causa instanceof
              Error
              ? causa.message
              : 'No fue posible abrir el Quiz.',
          );
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
        idCurso,
        idQuiz,
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
      const reloj =
        window.setInterval(
          () => {
            setAhora(
              Date.now(),
            );
          },
          1000,
        );

      return () =>
        window.clearInterval(
          reloj,
        );
    },
    [],
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
          900,
        );

      return () =>
        window.clearInterval(
          intervalo,
        );
    },
    [
      quiz?.estado,
      cargar,
    ],
  );

  useEffect(
    () => {
      if (
        !accessToken ||
        !quiz?.participante ||
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

      const enviar =
        () =>
          heartbeatQuizEstudiante(
            idCurso,
            idQuiz,
            accessToken,
          ).catch(
            () =>
              undefined,
          );

      void enviar();

      const intervalo =
        window.setInterval(
          () => {
            if (
              document.visibilityState ===
              'visible'
            ) {
              void enviar();
            }
          },
          4000,
        );

      return () =>
        window.clearInterval(
          intervalo,
        );
    },
    [
      accessToken,
      quiz?.participante,
      quiz?.estado,
      idCurso,
      idQuiz,
    ],
  );

  useEffect(
    () => {
      if (
        !toast.visible ||
        toast.titulo !==
          'Respuesta registrada' ||
        !toast.preguntaIdOrigen
      ) {
        return;
      }

      const preguntaActualId =
        quiz?.preguntaActual?.id ??
        null;

      if (
        quiz?.estado ===
          'FINALIZADO' ||
        (
          preguntaActualId !==
            null &&
          preguntaActualId !==
            toast.preguntaIdOrigen
        )
      ) {
        setToast(
          (
            actual,
          ) => ({
            ...actual,

            visible:
              false,
          }),
        );
      }
    },
    [
      quiz?.estado,
      quiz?.preguntaActual?.id,
      toast.visible,
      toast.titulo,
      toast.preguntaIdOrigen,
    ],
  );

  useEffect(
    () => {
      const preguntaId =
        quiz?.preguntaActual?.id ??
        null;

      if (
        preguntaVistaId ===
        preguntaId
      ) {
        return;
      }

      setPreguntaVistaId(
        preguntaId,
      );

      setSeleccionadas(
        quiz?.respuestaActual?.opcionIds ??
        [],
      );
    },
    [
      quiz?.preguntaActual?.id,
      quiz?.respuestaActual,
      preguntaVistaId,
    ],
  );

  useEffect(
    () => {
      if (
        !quiz ||
        quiz.estado !==
          'FINALIZADO' ||
        !accessToken
      ) {
        setRankingFinal(
          null,
        );

        return;
      }

      let cancelado =
        false;

      const cargarRanking =
        async () => {
          try {
            setCargandoRankingFinal(
              true,
            );

            const datos =
              await obtenerRankingFinalQuizEstudiante(
                idCurso,
                idQuiz,
                accessToken,
              );

            if (
              !cancelado
            ) {
              setRankingFinal(
                datos,
              );
            }
          } catch (
            causa
          ) {
            if (
              !cancelado
            ) {
              mostrarToast(
                'error',
                'No se pudo cargar el ranking final',
                causa instanceof
                  Error
                  ? causa.message
                  : undefined,
              );
            }
          } finally {
            if (
              !cancelado
            ) {
              setCargandoRankingFinal(
                false,
              );
            }
          }
        };

      void cargarRanking();

      return () => {
        cancelado =
          true;
      };
    },
    [
      quiz?.estado,
      accessToken,
      idCurso,
      idQuiz,
    ],
  );

  useEffect(
    () => {
      if (
        !quiz ||
        quiz.estado !==
          'FINALIZADO' ||
        !quiz.resultadosPublicados ||
        !accessToken
      ) {
        setResultado(
          null,
        );

        return;
      }

      let cancelado =
        false;

      const cargarResultado =
        async () => {
          try {
            setCargandoResultado(
              true,
            );

            const datos =
              await obtenerMiResultadoQuizEstudiante(
                idCurso,
                idQuiz,
                accessToken,
              );

            if (
              !cancelado
            ) {
              setResultado(
                datos,
              );

            }
          } catch (
            causa
          ) {
            if (
              !cancelado
            ) {
              mostrarToast(
                'error',
                'No se pudo cargar tu resultado',
                causa instanceof
                  Error
                  ? causa.message
                  : undefined,
              );
            }
          } finally {
            if (
              !cancelado
            ) {
              setCargandoResultado(
                false,
              );
            }
          }
        };

      void cargarResultado();

      return () => {
        cancelado =
          true;
      };
    },
    [
      quiz?.estado,
      quiz?.resultadosPublicados,
      accessToken,
      idCurso,
      idQuiz,
    ],
  );

  const aperturaMs =
    quiz?.aperturaProgramada
      ? new Date(
          quiz.aperturaProgramada,
        ).getTime()
      : null;

  const cierreMs =
    quiz?.cierreProgramado
      ? new Date(
          quiz.cierreProgramado,
        ).getTime()
      : null;

  const antesApertura =
    Boolean(
      quiz?.modalidad ===
        'PROGRAMADO' &&
      aperturaMs !==
        null &&
      ahora <
        aperturaMs,
    );

  const ventanaCerrada =
    Boolean(
      quiz?.modalidad ===
        'PROGRAMADO' &&
      cierreMs !==
        null &&
      ahora >=
        cierreMs,
    );

  const segundosCuenta =
    useMemo(
      () => {
        if (
          !quiz ||
          quiz.estado !==
            'CUENTA_REGRESIVA' ||
          !quiz.inicioEn
        ) {
          return null;
        }

        return Math.max(
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
        );
      },
      [
        quiz,
        ahora,
      ],
    );

  const unido =
    Boolean(
      quiz?.participante,
    );

  const listo =
    quiz?.participante?.estado ===
      'LISTO';

  const miParticipanteLobby =
    lobby?.participantes.find(
      (
        participante,
      ) =>
        participante.estudianteId ===
        quiz?.participante?.estudianteId,
    ) ??
    null;

  const puedeEntrar =
    Boolean(
      quiz &&
      !unido &&
      !antesApertura &&
      !ventanaCerrada &&
      [
        'ESPERANDO',
        'CUENTA_REGRESIVA',
      ].includes(
        quiz.estado,
      ),
    );

  const puedeMarcarListo =
    Boolean(
      quiz &&
      unido &&
      !listo &&
      quiz.estado ===
        'ESPERANDO',
    );

  const tiempoPreguntaActual =
    useMemo(
      () => {
        if (
          !quiz ||
          quiz.estado !==
            'EN_CURSO'
        ) {
          return null;
        }

        if (
          quiz.preguntaCierraEn
        ) {
          return Math.max(
            0,
            Math.ceil(
              (
                new Date(
                  quiz.preguntaCierraEn,
                ).getTime() -
                ahora
              ) /
                1000,
            ),
          );
        }

        return quiz.tiempoRestantePreguntaSegundos;
      },
      [
        quiz,
        ahora,
      ],
    );

  const respondida =
    Boolean(
      quiz?.respuestaActual,
    );

  const tiempoAgotado =
    tiempoPreguntaActual !==
      null &&
    tiempoPreguntaActual <=
      0;

  const porcentajeTiempoRestante =
    quiz?.tiempoTotalPreguntaSegundos && tiempoPreguntaActual !== null
      ? Math.max(
          0,
          Math.min(
            100,
            (tiempoPreguntaActual / quiz.tiempoTotalPreguntaSegundos) * 100,
          ),
        )
      : 0;

  const puedeResponder =
    Boolean(
      quiz?.estado ===
        'EN_CURSO' &&
      quiz.preguntaActual &&
      !respondida &&
      !tiempoAgotado &&
      seleccionadas.length >
        0,
    );

  const seleccionarOpcion =
    (
      opcionId:
        number,
    ) => {
      if (
        !quiz?.preguntaActual ||
        respondida ||
        tiempoAgotado ||
        enviandoRespuesta
      ) {
        return;
      }

      const multiple =
        quiz.preguntaActual.tipo ===
        'SELECCION_MULTIPLE';

      if (
        multiple
      ) {
        setSeleccionadas(
          (
            actuales,
          ) =>
            actuales.includes(
              opcionId,
            )
              ? actuales.filter(
                  (
                    id,
                  ) =>
                    id !==
                    opcionId,
                )
              : [
                  ...actuales,
                  opcionId,
                ],
        );

        return;
      }

      setSeleccionadas([
        opcionId,
      ]);
    };

  const enviarRespuesta =
    async () => {
      if (
        !accessToken ||
        !quiz?.preguntaActual ||
        !puedeResponder
      ) {
        return;
      }

      const preguntaEnviadaId =
        quiz.preguntaActual.id;

      const segundosRestantes =
        Math.max(
          1,
          tiempoPreguntaActual ??
            quiz.tiempoTotalPreguntaSegundos ??
            1,
        );

      try {
        setEnviandoRespuesta(
          true,
        );

        await responderPreguntaQuizEstudiante(
          idCurso,
          idQuiz,
          accessToken,
          preguntaEnviadaId,
          seleccionadas,
        );

        /*
         * La pregunta siguiente NUNCA se adelanta localmente.
         * Volvemos a consultar al backend, que es la única fuente
         * de verdad para docente y estudiantes.
         */
        await cargar(
          true,
        );

        mostrarToast(
          'exito',
          'Respuesta registrada',
          'Tu respuesta quedó guardada. La siguiente pregunta aparecerá en cuanto la sesión avance.',
          segundosRestantes *
            1000,
          preguntaEnviadaId,
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo registrar la respuesta',
          causa instanceof
            Error
            ? causa.message
            : undefined,
        );

        await cargar(
          true,
        );
      } finally {
        setEnviandoRespuesta(
          false,
        );
      }
    };

  const ingresar =
    async () => {
      if (
        !accessToken
      ) {
        return;
      }

      try {
        setProcesando(
          true,
        );

        await unirseQuizEstudiante(
          idCurso,
          idQuiz,
          accessToken,
        );

        await cargar(
          true,
        );

        mostrarToast(
          'exito',
          'Ingresaste a la sala',
          'Elige un avatar si deseas y marca tu estado como listo.',
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo ingresar',
          causa instanceof
            Error
            ? causa.message
            : undefined,
        );
      } finally {
        setProcesando(
          false,
        );
      }
    };

  const marcarListo =
    async () => {
      if (
        !accessToken
      ) {
        return;
      }

      try {
        setProcesando(
          true,
        );

        await marcarListoQuizEstudiante(
          idCurso,
          idQuiz,
          accessToken,
        );

        await cargar(
          true,
        );

        mostrarToast(
          'exito',
          'Estás listo',
          'Espera a que el docente inicie el Quiz.',
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo actualizar tu estado',
          causa instanceof
            Error
            ? causa.message
            : undefined,
        );
      } finally {
        setProcesando(
          false,
        );
      }
    };

  const cambiarAvatar =
    async (
      avatarCodigo:
        AvatarQuizCodigo |
        null,
    ) => {
      if (
        !accessToken ||
        !quiz?.participante
      ) {
        return;
      }

      try {
        setProcesando(
          true,
        );

        await seleccionarAvatarQuizEstudiante(
          idCurso,
          idQuiz,
          accessToken,
          avatarCodigo,
        );

        await cargar(
          true,
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo cambiar el avatar',
          causa instanceof
            Error
            ? causa.message
            : undefined,
        );
      } finally {
        setProcesando(
          false,
        );
      }
    };

  if (
    cargando
  ) {
    return (
      <section className="dqe-page">
        <AulaSkeleton
          cantidad={
            4
          }
          variante="tarjetas"
        />

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
      <section className="dqe-page">
        <AulaEmptyState
          icono={
            AlertCircle
          }
          titulo="No fue posible abrir el Quiz"
          descripcion={
            error ||
            'Este Quiz no se encuentra disponible.'
          }
          accionTexto="Volver a Quizzes"
          onAccion={() =>
            navigate(
              `/estudiante/cursos/${idCurso}/quizzes`,
            )
          }
        />

        <style>
          {styles}
        </style>
      </section>
    );
  }

  return (
    <section className="dqe-page">
      <AulaHeader
        icono={
          FileQuestion
        }
        etiqueta={`Quiz · ${quiz.hito.codigo}`}
        titulo={
          quiz.titulo
        }
        descripcion={
          quiz.descripcion ||
          'Evaluación interactiva preparada por tu docente.'
        }
        informacion={
          quiz.modalidad ===
          'PROGRAMADO'
            ? `Apertura: ${fecha(
                quiz.aperturaProgramada,
              )}`
            : 'Modalidad en vivo.'
        }
        acciones={[
          {
            texto:
              'Volver a Quizzes',
            icono:
              ArrowLeft,
            onClick: () =>
              navigate(
                `/estudiante/cursos/${idCurso}/quizzes`,
              ),
          },
          {
            texto:
              'Actualizar',
            icono:
              RefreshCw,
            onClick: () =>
              void cargar(
                true,
              ),
          },
          {
            texto:
              'Detalles',
            icono:
              Info,
            variante:
              'primaria',
            onClick: () =>
              setModalDetalle(
                true,
              ),
          },
        ]}
      />

      {antesApertura && (
        <section className="dqe-temporal dqe-temporal--programado">
          <span>
            <CalendarClock
              size={
                20
              }
            />
          </span>

          <div>
            <small>
              Quiz programado
            </small>

            <strong>
              Disponible próximamente
            </strong>

            <p>
              Apertura: {fecha(
                quiz.aperturaProgramada,
              )}
            </p>
          </div>

          <div className="dqe-temporal__contador">
            <small>
              Tiempo para abrir
            </small>

            <strong>
              {aperturaMs !==
              null
                ? tiempoRestante(
                    aperturaMs -
                    ahora,
                  )
                : 'Calculando…'}
            </strong>
          </div>
        </section>
      )}

      {!antesApertura &&
        quiz.estado ===
          'ESPERANDO' && (
        <section className="dqe-lobby">
          <header className="dqe-lobby__header">
            <div>
              <span className="dqe-lobby__icono">
                <Users
                  size={
                    23
                  }
                />
              </span>

              <div>
                <small>
                  Sala de espera
                </small>

                <h2>
                  {unido
                    ? listo
                      ? 'Todo listo para comenzar'
                      : 'Ya estás en la sala'
                    : 'Únete a la sesión'}
                </h2>

                <p>
                  {unido
                    ? listo
                      ? 'Mira quiénes están conectados mientras el docente prepara el inicio.'
                      : 'Puedes elegir un avatar jurídico o usar tus iniciales.'
                    : 'Entra para aparecer en tiempo real junto a tus compañeros.'}
                </p>
              </div>
            </div>

            <div className="dqe-lobby__stats">
              <span>
                <strong>
                  {lobby?.conectados ??
                    0}
                </strong>
                conectados
              </span>

              <span>
                <strong>
                  {lobby?.listos ??
                    0}
                </strong>
                listos
              </span>

              <span>
                <strong>
                  {lobby?.totalInscritos ??
                    0}
                </strong>
                inscritos
              </span>
            </div>
          </header>

          {unido && (
            <section className="dqe-avatar-selector">
              <div className="dqe-avatar-selector__titulo">
                <div>
                  <strong>
                    Tu identidad en la sala
                  </strong>

                  <small>
                    El avatar solo se usa dentro de este Quiz.
                  </small>
                </div>

                {listo && (
                  <span className="dqe-listo">
                    <CheckCircle2
                      size={
                        15
                      }
                    />
                    LISTO
                  </span>
                )}
              </div>

              <div className="dqe-avatar-selector__opciones">
                <button
                  type="button"
                  className={
                    !quiz.participante?.avatarCodigo
                      ? 'activo'
                      : ''
                  }
                  disabled={
                    procesando
                  }
                  onClick={() =>
                    void cambiarAvatar(
                      null,
                    )
                  }
                >
                  <span>
                    {miParticipanteLobby
                      ? inicialesParticipante(
                          miParticipanteLobby,
                        )
                      : 'TÚ'}
                  </span>

                  <small>
                    Iniciales
                  </small>
                </button>

                {AVATARES_QUIZ.map(
                  (
                    codigo,
                  ) => (
                    <button
                      key={
                        codigo
                      }
                      type="button"
                      className={
                        quiz.participante?.avatarCodigo ===
                        codigo
                          ? 'activo'
                          : ''
                      }
                      disabled={
                        procesando
                      }
                      title={
                        nombreAvatarQuiz(
                          codigo,
                        )
                      }
                      onClick={() =>
                        void cambiarAvatar(
                          codigo,
                        )
                      }
                    >
                      <span>
                        <AvatarQuiz
                          codigo={
                            codigo
                          }
                          iniciales=""
                          size={
                            20
                          }
                        />
                      </span>

                      <small>
                        {nombreAvatarQuiz(
                          codigo,
                        )}
                      </small>
                    </button>
                  ),
                )}
              </div>
            </section>
          )}

          <section className="dqe-participantes">
            {lobby?.participantes.length ? (
              <div className="dqe-participantes__grid">
                {lobby.participantes.map(
                  (
                    participante,
                  ) => (
                    <article
                      key={
                        participante.id
                      }
                      className={`dqe-participante ${participante.conectado ? '' : 'desconectado'} ${participante.estado === 'LISTO' && participante.conectado ? 'listo' : ''}`}
                      title={
                        nombreParticipante(
                          participante,
                        )
                      }
                    >
                      <span className="dqe-participante__avatar">
                        <AvatarQuiz
                          codigo={
                            participante.avatarCodigo
                          }
                          iniciales={
                            inicialesParticipante(
                              participante,
                            )
                          }
                          size={
                            24
                          }
                        />
                      </span>

                      <strong>
                        {nombreCorto(
                          participante,
                        )}
                      </strong>

                      <small>
                        {etiquetaEstadoParticipante(
                          participante,
                        )}
                      </small>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className="dqe-participantes__vacio">
                <Users
                  size={
                    24
                  }
                />

                <strong>
                  Aún no hay estudiantes en la sala
                </strong>

                <span>
                  Los participantes aparecerán aquí automáticamente.
                </span>
              </div>
            )}
          </section>

          <footer className="dqe-lobby__footer">
            <div className="dqe-lobby__chips">
              <span>
                <ShieldCheck
                  size={
                    14
                  }
                />

                {quiz.esCalificable
                  ? 'Calificable'
                  : 'Práctica'}
              </span>

              {quiz.componente && (
                <span>
                  <Award
                    size={
                      14
                    }
                  />

                  {quiz.componente ===
                  'CONTINUA'
                    ? 'Continua'
                    : 'Procesual'}
                </span>
              )}
            </div>

            <div className="dqe-lobby__accion">
              {puedeEntrar && (
                <button
                  type="button"
                  disabled={
                    procesando
                  }
                  onClick={() =>
                    void ingresar()
                  }
                >
                  <LogIn
                    size={
                      16
                    }
                  />

                  {procesando
                    ? 'Ingresando…'
                    : 'Entrar a la sala'}
                </button>
              )}

              {puedeMarcarListo && (
                <button
                  type="button"
                  disabled={
                    procesando
                  }
                  onClick={() =>
                    void marcarListo()
                  }
                >
                  <UserCheck
                    size={
                      16
                    }
                  />

                  {procesando
                    ? 'Actualizando…'
                    : 'Estoy listo'}
                </button>
              )}

              {listo && (
                <span className="dqe-espera-docente">
                  <CheckCircle2
                    size={
                      16
                    }
                  />

                  Esperando al docente…
                </span>
              )}
            </div>
          </footer>
        </section>
      )}

      {quiz.estado ===
        'CUENTA_REGRESIVA' && (
        <section className="dqe-countdown">
          <Clock3
            size={
              26
            }
          />

          <small>
            Todos preparados
          </small>

          <strong>
            {segundosCuenta ??
              0}
          </strong>

          <p>
            La primera pregunta aparecerá automáticamente.
          </p>
        </section>
      )}

      {quiz.estado ===
        'PAUSADO' && (
        <section className="dqe-paused">
          <PauseCircle
            size={
              23
            }
          />

          <div>
            <strong>
              Quiz pausado
            </strong>

            <p>
              El docente pausó temporalmente la sesión. Conserva esta pantalla abierta.
            </p>
          </div>
        </section>
      )}

      {quiz.estado ===
        'EN_CURSO' && (
        <>
          {quiz.preguntaActual ? (
            <section className="dqe-pregunta">
              <header className="dqe-pregunta__header">
                <div>
                  <span className="dqe-pregunta__numero">
                    Pregunta {quiz.preguntaActual.orden + 1}
                  </span>

                  <span className="dqe-pregunta__dificultad">
                    {quiz.preguntaActual.dificultad ===
                    'MIXTA'
                      ? 'Mixta'
                      : quiz.preguntaActual.dificultad.toLowerCase()}
                  </span>
                </div>

                <div
                  className={`dqe-pregunta__tiempo ${
                    tiempoPreguntaActual !==
                      null &&
                    tiempoPreguntaActual <=
                      5
                      ? 'urgente'
                      : ''
                  }`}
                >
                  <Clock3
                    size={
                      17
                    }
                  />

                  <span>
                    Tiempo
                  </span>

                  <strong>
                    {tiempoPreguntaActual ??
                      '—'}
                    {tiempoPreguntaActual !==
                    null
                      ? ' s'
                      : ''}
                  </strong>
                </div>
              </header>

              <div className="dqe-pregunta__progreso">
                <span>
                  Tiempo restante
                </span>

                <i>
                  <b
                    style={{
                      width: `${porcentajeTiempoRestante}%`,
                    }}
                  />
                </i>
              </div>

              <h2>
                {quiz.preguntaActual.enunciado}
              </h2>

              <p className="dqe-pregunta__instruccion">
                {quiz.preguntaActual.tipo ===
                'SELECCION_MULTIPLE'
                  ? 'Selecciona todas las opciones que consideres correctas.'
                  : 'Selecciona una opción y envía tu respuesta antes de que termine el tiempo.'}
              </p>

              <div className="dqe-opciones">
                {quiz.preguntaActual.opciones.map(
                  (
                    opcion,
                    indice,
                  ) => {
                    const seleccionada =
                      seleccionadas.includes(
                        opcion.id,
                      );

                    return (
                      <button
                        type="button"
                        key={
                          opcion.id
                        }
                        className={`dqe-opcion ${
                          seleccionada
                            ? 'seleccionada'
                            : ''
                        } ${
                          respondida
                            ? 'bloqueada'
                            : ''
                        }`}
                        disabled={
                          respondida ||
                          tiempoAgotado ||
                          enviandoRespuesta
                        }
                        onClick={() =>
                          seleccionarOpcion(
                            opcion.id,
                          )
                        }
                      >
                        <span className="dqe-opcion__letra">
                          {String.fromCharCode(
                            65 +
                            indice,
                          )}
                        </span>

                        <span className="dqe-opcion__texto">
                          {opcion.texto}
                        </span>

                        <span className="dqe-opcion__marca">
                          {seleccionada ? (
                            <CheckCircle2
                              size={
                                18
                              }
                            />
                          ) : (
                            <CircleDot
                              size={
                                18
                              }
                            />
                          )}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              <footer className="dqe-pregunta__footer">
                <div>
                  {respondida ? (
                    <span className="dqe-respuesta-estado dqe-respuesta-estado--ok">
                      <CheckCircle2
                        size={
                          15
                        }
                      />

                      Respuesta enviada
                    </span>
                  ) : tiempoAgotado ? (
                    <span className="dqe-respuesta-estado dqe-respuesta-estado--agotado">
                      <Clock3
                        size={
                          15
                        }
                      />

                      Tiempo agotado
                    </span>
                  ) : (
                    <span className="dqe-respuesta-ayuda">
                      Tu respuesta no podrá modificarse después de enviarla.
                    </span>
                  )}
                </div>

                {!respondida &&
                  !tiempoAgotado && (
                  <button
                    type="button"
                    disabled={
                      !puedeResponder ||
                      enviandoRespuesta
                    }
                    onClick={() =>
                      void enviarRespuesta()
                    }
                  >
                    <Send
                      size={
                        16
                      }
                    />

                    {enviandoRespuesta
                      ? 'Enviando…'
                      : 'Enviar respuesta'}

                    <ChevronRight
                      size={
                        15
                      }
                    />
                  </button>
                )}
              </footer>

              {(respondida ||
                tiempoAgotado) && (
                <div className="dqe-espera">
                  <RefreshCw
                    size={
                      16
                    }
                  />

                  <div>
                    <strong>
                      {respondida
                        ? 'Respuesta registrada'
                        : 'La pregunta terminó'}
                    </strong>

                    <p>
                      {respondida
                        ? 'Espera a que el docente avance. La siguiente pregunta aparecerá automáticamente.'
                        : 'Ya no puedes responder esta pregunta. Espera a que el docente avance.'}
                    </p>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="dqe-stage-next">
              <RefreshCw
                size={
                  24
                }
              />

              <div>
                <strong>
                  Preparando la siguiente pregunta
                </strong>

                <p>
                  Mantén esta pantalla abierta. La pregunta aparecerá automáticamente.
                </p>
              </div>
            </section>
          )}
        </>
      )}

      {quiz.estado ===
        'FINALIZADO' && (
        <section className="dqe-final">
          <header className="dqe-final__cabecera">
            <div>
              <span className="dqe-final__etiqueta">
                <Trophy
                  size={
                    16
                  }
                />

                QUIZ FINALIZADO
              </span>

              <h2>
                Clasificación final
              </h2>

              <p>
                Así terminó la competencia. El podio y el ranking final ya están disponibles.
              </p>
            </div>

            <span
              className={`dqe-final__publicacion ${
                quiz.resultadosPublicados
                  ? 'publicado'
                  : 'pendiente'
              }`}
            >
              {quiz.resultadosPublicados ? (
                <CheckCircle2
                  size={
                    15
                  }
                />
              ) : (
                <Clock3
                  size={
                    15
                  }
                />
              )}

              {quiz.resultadosPublicados
                ? 'NOTAS PUBLICADAS'
                : 'NOTAS PENDIENTES'}
            </span>
          </header>

          {cargandoRankingFinal ? (
            <div className="dqe-final__cargando">
              <RefreshCw
                size={
                  20
                }
              />

              Cargando clasificación final…
            </div>
          ) : rankingFinal ? (
            <>
              <section className="dqe-podio">
                <div className="dqe-podio__titulo">
                  <small>
                    Los tres mejores resultados
                  </small>

                  <h3>
                    <Trophy
                      size={
                        19
                      }
                    />

                    Podio del Quiz
                  </h3>
                </div>

                <div className="dqe-podio__puestos">
                  {[
                    rankingFinal.ranking[1],
                    rankingFinal.ranking[0],
                    rankingFinal.ranking[2],
                  ].map(
                    (
                      participante,
                      indice,
                    ) => {
                      const lugar =
                        indice ===
                        0
                          ? 2
                          : indice ===
                              1
                            ? 1
                            : 3;

                      if (
                        !participante
                      ) {
                        return (
                          <div
                            key={
                              `vacio-${lugar}`
                            }
                            className={`dqe-podio__puesto dqe-podio__puesto--${lugar} vacio`}
                          >
                            Sin participante
                          </div>
                        );
                      }

                      return (
                        <article
                          key={
                            participante.estudianteId
                          }
                          className={`dqe-podio__puesto dqe-podio__puesto--${lugar} ${
                            participante.esYo
                              ? 'soy-yo'
                              : ''
                          }`}
                        >
                          <span className="dqe-podio__medalla">
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
                          </span>

                          <span className="dqe-podio__avatar">
                            <AvatarQuiz
                              codigo={
                                participante.avatarCodigo as AvatarQuizCodigo | null
                              }
                              iniciales={
                                inicialesRankingFinal(
                                  participante,
                                )
                              }
                              size={
                                28
                              }
                            />
                          </span>

                          <strong>
                            {nombreRankingFinal(
                              participante,
                            )}
                          </strong>

                          <b>
                            {participante.puntaje.toFixed(
                              Number.isInteger(
                                participante.puntaje,
                              )
                                ? 0
                                : 1,
                            )} pts
                          </b>

                          <small>
                            {lugar}.º lugar
                          </small>

                          {participante.esYo && (
                            <span className="dqe-podio__yo">
                              TÚ
                            </span>
                          )}
                        </article>
                      );
                    },
                  )}
                </div>
              </section>

              <section className="dqe-ranking-final">
                <header>
                  <div>
                    <small>
                      Clasificación completa
                    </small>

                    <h3>
                      <BarChart3
                        size={
                          18
                        }
                      />

                      Ranking final
                    </h3>
                  </div>

                  {rankingFinal.miPosicion && (
                    <span>
                      Tu puesto: <strong>{rankingFinal.miPosicion}°</strong>
                    </span>
                  )}
                </header>

                <div className="dqe-ranking-final__lista">
                  {rankingFinal.ranking.map(
                    (
                      participante,
                    ) => {
                      const maximo =
                        Math.max(
                          1,
                          ...rankingFinal.ranking.map(
                            (
                              item,
                            ) =>
                              item.puntaje,
                          ),
                        );

                      const ancho =
                        participante.puntaje <=
                          0
                          ? 0
                          : Math.max(
                              6,
                              (
                                participante.puntaje /
                                maximo
                              ) *
                                100,
                            );

                      return (
                        <article
                          key={
                            participante.estudianteId
                          }
                          className={
                            participante.esYo
                              ? 'soy-yo'
                              : ''
                          }
                        >
                          <span className="dqe-ranking-final__posicion">
                            {participante.posicion <=
                            3 ? (
                              <Medal
                                size={
                                  17
                                }
                              />
                            ) : (
                              participante.posicion
                            )}
                          </span>

                          <span className="dqe-ranking-final__avatar">
                            <AvatarQuiz
                              codigo={
                                participante.avatarCodigo as AvatarQuizCodigo | null
                              }
                              iniciales={
                                inicialesRankingFinal(
                                  participante,
                                )
                              }
                              size={
                                20
                              }
                            />
                          </span>

                          <div className="dqe-ranking-final__cuerpo">
                            <div className="dqe-ranking-final__nombre">
                              <strong>
                                {nombreRankingFinal(
                                  participante,
                                )}
                              </strong>

                              <small>
                                {participante.respuestasCorrectas} correctas · {participante.respuestasIncorrectas} incorrectas · {participante.respuestasOmitidas} omitidas
                              </small>
                            </div>

                            <div className="dqe-ranking-final__barra">
                              <i
                                style={{
                                  width:
                                    `${ancho}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="dqe-ranking-final__puntaje">
                            <strong>
                              {participante.puntaje.toFixed(
                                Number.isInteger(
                                  participante.puntaje,
                                )
                                  ? 0
                                  : 1,
                              )}
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
              </section>

              <section className="dqe-resolucion">
                <header className="dqe-resolucion__cabecera">
                  <div>
                    <small>
                      Retroalimentación
                    </small>

                    <h3>
                      <BookOpenCheck
                        size={
                          19
                        }
                      />

                      Resolución del Quiz
                    </h3>

                    <p>
                      Revisa qué respondiste, cuál era la respuesta correcta y la explicación de cada pregunta.
                    </p>
                  </div>

                  <span
                    className={
                      quiz.resultadosPublicados
                        ? 'disponible'
                        : 'bloqueada'
                    }
                  >
                    {quiz.resultadosPublicados
                      ? 'RETROALIMENTACIÓN DISPONIBLE'
                      : 'DISPONIBLE AL PUBLICAR NOTAS'}
                  </span>
                </header>

                {!quiz.resultadosPublicados ? (
                  <div className="dqe-resolucion__espera">
                    <Clock3
                      size={
                        22
                      }
                    />

                    <div>
                      <strong>
                        Las respuestas correctas todavía no están publicadas
                      </strong>

                      <p>
                        El podio y el ranking final ya están disponibles. La resolución completa se habilitará cuando el docente publique las notas.
                      </p>
                    </div>
                  </div>
                ) : cargandoResultado ? (
                  <div className="dqe-resolucion__cargando">
                    <RefreshCw
                      size={
                        20
                      }
                    />

                    Preparando la retroalimentación…
                  </div>
                ) : resultado ? (
                  <div className="dqe-resolucion__lista">
                    {resultado.preguntas.map(
                      (
                        pregunta,
                      ) => {
                        const estadoPregunta =
                          pregunta.omitida
                            ? 'omitida'
                            : pregunta.esCorrecta
                              ? 'correcta'
                              : 'incorrecta';

                        return (
                          <article
                            key={
                              pregunta.preguntaId
                            }
                            className={`dqe-resolucion__pregunta ${estadoPregunta}`}
                          >
                            <header>
                              <div>
                                <span>
                                  Pregunta {pregunta.orden + 1}
                                </span>

                                <strong>
                                  {pregunta.enunciado}
                                </strong>
                              </div>

                              <span className={`dqe-resolucion__estado ${estadoPregunta}`}>
                                {pregunta.omitida ? (
                                  <FileQuestion
                                    size={
                                      14
                                    }
                                  />
                                ) : pregunta.esCorrecta ? (
                                  <CheckCircle2
                                    size={
                                      14
                                    }
                                  />
                                ) : (
                                  <XCircle
                                    size={
                                      14
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

                            <div className="dqe-resolucion__comparacion">
                              <div className="dqe-resolucion__respuesta-estudiante">
                                <small>
                                  Tu respuesta
                                </small>

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
                                    : 'No respondiste esta pregunta'}
                                </strong>
                              </div>

                              <div className="dqe-resolucion__respuesta-correcta">
                                <small>
                                  Respuesta correcta
                                </small>

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

                            {pregunta.explicacion && (
                              <div className="dqe-resolucion__explicacion">
                                <Info
                                  size={
                                    15
                                  }
                                />

                                <div>
                                  <small>
                                    ¿Por qué?
                                  </small>

                                  <p>
                                    {pregunta.explicacion}
                                  </p>
                                </div>
                              </div>
                            )}

                            <footer>
                              <span>
                                <Clock3
                                  size={
                                    13
                                  }
                                />

                                {formatearTiempoTotal(
                                  pregunta.tiempoRespuestaMs,
                                )}
                              </span>

                              <span>
                                Puntaje obtenido:
                                <strong>
                                  {pregunta.puntajeObtenido.toFixed(
                                    Number.isInteger(
                                      pregunta.puntajeObtenido,
                                    )
                                      ? 0
                                      : 1,
                                  )} / {pregunta.puntajePregunta.toFixed(
                                    Number.isInteger(
                                      pregunta.puntajePregunta,
                                    )
                                      ? 0
                                      : 1,
                                  )}
                                </strong>
                              </span>
                            </footer>
                          </article>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="dqe-resolucion__cargando">
                    No fue posible cargar la resolución del Quiz.
                  </div>
                )}
              </section>

              {quiz.resultadosPublicados &&
                cargandoResultado && (
                <section className="dqe-resultado-cargando">
                  Cargando tu calificación…
                </section>
              )}

              {quiz.resultadosPublicados &&
                resultado && (
                <section className="dqe-resultado">
                  <header className="dqe-resultado__hero">
                    <div className="dqe-resultado__nota">
                      <small>
                        {resultado.quiz.esCalificable
                          ? 'Nota final'
                          : 'Rendimiento'}
                      </small>

                      <strong>
                        {nota(
                          resultado.intento.notaFinal,
                        )}
                      </strong>

                      <span>
                        / 100
                      </span>
                    </div>

                    <div className="dqe-resultado__hero-info">
                      <span className="dqe-resultado__publicado">
                        <CheckCircle2
                          size={
                            14
                          }
                        />

                        NOTAS PUBLICADAS
                      </span>

                      <h2>
                        {resultado.quiz.esCalificable
                          ? 'Tu calificación'
                          : 'Tu rendimiento'}
                      </h2>

                      <p>
                        {resultado.quiz.esCalificable
                          ? resultado.quiz.componente ===
                              'CONTINUA'
                            ? 'Esta nota corresponde al componente de evaluación continua.'
                            : 'Esta nota corresponde al componente de evaluación procesual.'
                          : 'Este Quiz no afecta tu calificación académica.'}
                      </p>
                    </div>
                  </header>

                  <div className="dqe-resultado__metricas">
                    <article>
                      <Trophy />

                      <span>
                        Puesto
                      </span>

                      <strong>
                        {resultado.intento.posicionFinal
                          ? `${resultado.intento.posicionFinal}°`
                          : '—'}
                      </strong>
                    </article>

                    <article className="correctas">
                      <CheckCircle2 />

                      <span>
                        Correctas
                      </span>

                      <strong>
                        {resultado.intento.respuestasCorrectas}
                      </strong>
                    </article>

                    <article className="incorrectas">
                      <XCircle />

                      <span>
                        Incorrectas
                      </span>

                      <strong>
                        {resultado.intento.respuestasIncorrectas}
                      </strong>
                    </article>

                    <article>
                      <FileQuestion />

                      <span>
                        Omitidas
                      </span>

                      <strong>
                        {resultado.intento.respuestasOmitidas}
                      </strong>
                    </article>

                    <article>
                      <Clock3 />

                      <span>
                        Tiempo total
                      </span>

                      <strong>
                        {formatearTiempoTotal(
                          resultado.intento.tiempoTotalMs,
                        )}
                      </strong>
                    </article>
                  </div>

                </section>
              )}
            </>
          ) : null}
        </section>
      )}

      {ventanaCerrada &&
        !unido &&
        quiz.estado ===
          'ESPERANDO' && (
        <section className="dqe-paused">
          <AlertCircle
            size={
              23
            }
          />

          <div>
            <strong>
              El periodo de ingreso finalizó
            </strong>

            <p>
              Ya no es posible ingresar a esta sesión.
            </p>
          </div>
        </section>
      )}

      <AulaModal
        abierto={
          modalDetalle
        }
        ancho="mediano"
        titulo="Detalles del Quiz"
        etiqueta="Información importante"
        descripcion="Revisa la modalidad, evaluación y programación antes de participar."
        icono={
          Info
        }
        onCerrar={() =>
          setModalDetalle(
            false,
          )
        }
      >
        <div className="dqe-detalles">
          <article>
            <FileQuestion />

            <div>
              <small>
                Dificultad
              </small>

              <strong>
                {quiz.dificultad ===
                'MIXTA'
                  ? 'Mixta'
                  : quiz.dificultad.toLowerCase()}
              </strong>
            </div>
          </article>

          <article>
            <ShieldCheck />

            <div>
              <small>
                Evaluación
              </small>

              <strong>
                {quiz.esCalificable
                  ? 'Calificable'
                  : 'No calificable'}
              </strong>
            </div>
          </article>

          <article>
            <Award />

            <div>
              <small>
                Componente
              </small>

              <strong>
                {quiz.componente ===
                'CONTINUA'
                  ? 'Continua'
                  : quiz.componente ===
                      'PROCESUAL'
                    ? 'Procesual'
                    : 'No aplica'}
              </strong>
            </div>
          </article>

          <article>
            <CalendarClock />

            <div>
              <small>
                Modalidad
              </small>

              <strong>
                {quiz.modalidad ===
                'PROGRAMADO'
                  ? 'Programado'
                  : 'En vivo'}
              </strong>
            </div>
          </article>

          {quiz.modalidad ===
            'PROGRAMADO' && (
            <>
              <article>
                <Clock3 />

                <div>
                  <small>
                    Apertura
                  </small>

                  <strong>
                    {fecha(
                      quiz.aperturaProgramada,
                    )}
                  </strong>
                </div>
              </article>

              <article>
                <Clock3 />

                <div>
                  <small>
                    Cierre de ingreso
                  </small>

                  <strong>
                    {quiz.cierreProgramado
                      ? fecha(
                          quiz.cierreProgramado,
                        )
                      : 'Sin cierre automático'}
                  </strong>
                </div>
              </article>
            </>
          )}
        </div>
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
        duracion={
          toast.duracion ??
          5000
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
  .dqe-page {
    display: grid;
    gap: 14px;
    min-width: 0;
    padding-bottom: 34px;
    color: var(--app-text);
  }

  .dqe-temporal,
  .dqe-pregunta {
    display: grid;
    gap: 13px;
    padding: 18px;
    border: 1px solid var(--app-border);
    border-top: 4px solid var(--app-accent);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dqe-pregunta__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .dqe-pregunta__header > div:first-child {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
  }

  .dqe-pregunta__numero,
  .dqe-pregunta__dificultad {
    display: inline-flex;
    align-items: center;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: var(--app-font-sm);
    font-weight: 850;
    text-transform: uppercase;
  }

  .dqe-pregunta__numero {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-pregunta__dificultad {
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
  }

  .dqe-pregunta__tiempo {
    min-width: 96px;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 2px 6px;
    padding: 8px 10px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-pregunta__tiempo span {
    font-size: 8px;
    font-weight: 800;
  }

  .dqe-pregunta__tiempo strong {
    grid-column: 2;
    color: var(--app-text);
    font-size: 16px;
    font-variant-numeric: tabular-nums;
  }

  .dqe-pregunta__tiempo.urgente {
    color: var(--app-danger);
    border-color: var(--app-danger-border);
    background: var(--app-danger-bg);
  }

  .dqe-pregunta__tiempo.urgente strong {
    color: var(--app-danger);
  }

  .dqe-pregunta__progreso {
    display: grid;
    gap: 5px;
  }

  .dqe-pregunta__progreso > span {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dqe-pregunta__progreso > i {
    height: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--app-border-soft);
  }

  .dqe-pregunta__progreso > i > b {
    height: 100%;
    display: block;
    border-radius: inherit;
    background: var(--app-accent);
    transition: width 1s linear;
  }

  .dqe-pregunta h2 {
    margin: 2px 0 0;
    font-size: 20px;
    line-height: 1.42;
  }

  .dqe-pregunta__instruccion {
    margin: -4px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
  }

  .dqe-opciones {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .dqe-opcion {
    min-width: 0;
    min-height: 72px;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) 24px;
    align-items: center;
    gap: 9px;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    color: var(--app-text);
    background: var(--app-surface-alt);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      border-color .15s ease,
      background .15s ease,
      transform .15s ease;
  }

  .dqe-opcion:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: var(--app-accent);
  }

  .dqe-opcion.seleccionada {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .dqe-opcion:disabled {
    cursor: default;
  }

  .dqe-opcion.bloqueada:not(.seleccionada) {
    opacity: .58;
  }

  .dqe-opcion__letra {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font-size: 11px;
    font-weight: 900;
  }

  .dqe-opcion.seleccionada .dqe-opcion__letra {
    color: white;
    background: var(--app-accent);
  }

  .dqe-opcion__texto {
    font-size: var(--app-font-body);
    line-height: 1.45;
  }

  .dqe-opcion__marca {
    display: grid;
    place-items: center;
    color: var(--app-text-muted);
  }

  .dqe-opcion.seleccionada .dqe-opcion__marca {
    color: var(--app-accent-dark);
  }

  .dqe-pregunta__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--app-border-soft);
  }

  .dqe-pregunta__footer > button {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border: 0;
    border-radius: 11px;
    color: white;
    background: var(--app-accent);
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 850;
    cursor: pointer;
  }

  .dqe-pregunta__footer > button:disabled {
    opacity: .48;
    cursor: not-allowed;
  }

  .dqe-respuesta-ayuda {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dqe-respuesta-estado {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: var(--app-font-sm);
    font-weight: 850;
  }

  .dqe-respuesta-estado--ok {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .dqe-respuesta-estado--agotado {
    color: #b45309;
    background: #ffedd5;
  }

  .dqe-espera {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
  }

  .dqe-espera > svg {
    width: 34px;
    height: 34px;
    padding: 8px;
    box-sizing: border-box;
    border-radius: 10px;
    background: var(--app-accent-soft);
  }

  .dqe-espera strong {
    font-size: var(--app-font-md);
  }

  .dqe-espera p {
    margin: 2px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    line-height: 1.45;
  }

  .dqe-paused,
  .dqe-stage-next,
  .dqe-finalizado {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--app-border);
    border-radius: 17px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dqe-temporal > span {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-temporal small,
  .dqe-detalles small {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dqe-temporal strong {
    margin: 2px 0 0;
    font-size: var(--app-font-section);
  }

  .dqe-temporal p,
  .dqe-paused p,
  .dqe-stage-next p,
  .dqe-finalizado p {
    margin: 4px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
    line-height: 1.5;
  }

  .dqe-temporal__contador {
    min-width: 180px;
    display: grid;
    gap: 3px;
    padding: 9px 12px;
    border-radius: 11px;
    background: var(--app-surface-alt);
    text-align: right;
  }

  .dqe-lobby {
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-top: 3px solid var(--app-accent);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dqe-lobby__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--app-border-soft);
  }

  .dqe-lobby__header > div:first-child {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dqe-lobby__icono {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-lobby__header small {
    color: var(--app-accent-dark);
    font-size: var(--app-font-sm);
    font-weight: 850;
    text-transform: uppercase;
  }

  .dqe-lobby__header h2 {
    margin: 2px 0 0;
    font-size: var(--app-font-title);
  }

  .dqe-lobby__header p {
    margin: 4px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
  }

  .dqe-lobby__stats {
    display: flex;
    gap: 7px;
    flex-shrink: 0;
  }

  .dqe-lobby__stats span {
    min-width: 72px;
    display: grid;
    gap: 1px;
    padding: 8px 10px;
    border-radius: 11px;
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    font-size: var(--app-font-xs);
    text-align: center;
  }

  .dqe-lobby__stats strong {
    color: var(--app-text);
    font-size: var(--app-font-section);
  }

  .dqe-avatar-selector {
    display: grid;
    gap: 10px;
    padding: 13px 20px;
    border-bottom: 1px solid var(--app-border-soft);
    background: color-mix(in srgb, var(--app-accent-soft) 35%, var(--app-surface));
  }

  .dqe-avatar-selector__titulo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .dqe-avatar-selector__titulo > div {
    display: grid;
    gap: 2px;
  }

  .dqe-avatar-selector__titulo strong {
    font-size: var(--app-font-body);
  }

  .dqe-avatar-selector__titulo small {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dqe-avatar-selector__opciones {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .dqe-avatar-selector__opciones button {
    min-width: 70px;
    display: grid;
    place-items: center;
    gap: 4px;
    padding: 8px 7px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    cursor: pointer;
    transition: .15s ease;
  }

  .dqe-avatar-selector__opciones button:hover,
  .dqe-avatar-selector__opciones button.activo {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-avatar-selector__opciones button > span {
    min-width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: var(--app-surface-alt);
    font-size: 9px;
    font-weight: 900;
  }

  .dqe-avatar-selector__opciones button small {
    font-size: 8px;
    font-weight: 800;
  }

  .dqe-listo {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-success);
    background: var(--app-success-bg);
    font-size: var(--app-font-sm);
    font-weight: 900;
  }

  .dqe-participantes {
    padding: 16px 20px;
  }

  .dqe-participantes__grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
  }

  .dqe-participante {
    min-width: 0;
    display: grid;
    place-items: center;
    gap: 5px;
    padding: 12px 8px 10px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
    text-align: center;
    transition: .15s ease;
  }

  .dqe-participante.listo {
    border-color: color-mix(in srgb, var(--app-success) 35%, var(--app-border));
    background: var(--app-success-bg);
  }

  .dqe-participante.desconectado {
    opacity: .5;
  }

  .dqe-participante__avatar {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-accent) 14%, transparent);
  }

  .avatar-quiz__iniciales {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: .03em;
  }

  .dqe-participante strong {
    width: 100%;
    overflow: hidden;
    font-size: var(--app-font-md);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dqe-participante small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    font-weight: 800;
    text-transform: uppercase;
  }

  .dqe-participante.listo small {
    color: var(--app-success);
  }

  .dqe-participantes__vacio {
    min-height: 120px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 4px;
    color: var(--app-text-muted);
    text-align: center;
  }

  .dqe-participantes__vacio strong {
    color: var(--app-text);
    font-size: var(--app-font-body);
  }

  .dqe-participantes__vacio span {
    font-size: var(--app-font-sm);
  }

  .dqe-lobby__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 13px 20px;
    border-top: 1px solid var(--app-border-soft);
    background: var(--app-surface-alt);
  }

  .dqe-lobby__chips,
  .dqe-lobby__accion {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
  }

  .dqe-lobby__chips span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font-size: var(--app-font-sm);
    font-weight: 800;
  }

  .dqe-lobby__accion button {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 13px;
    border: 1px solid var(--app-accent);
    border-radius: 11px;
    color: white;
    background: var(--app-accent);
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 850;
    cursor: pointer;
  }

  .dqe-lobby__accion button:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .dqe-espera-docente {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--app-success);
    font-size: var(--app-font-sm);
    font-weight: 850;
  }

  .dqe-countdown {
    min-height: 300px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 5px;
    border: 1px solid color-mix(in srgb, var(--app-accent) 25%, var(--app-border));
    border-radius: 20px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: var(--app-shadow-sm);
    text-align: center;
  }

  .dqe-countdown small {
    font-size: var(--app-font-section);
    font-weight: 850;
  }

  .dqe-countdown strong {
    color: var(--app-text);
    font-size: 72px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .dqe-countdown p {
    margin: 6px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
  }

  .dqe-paused,
  .dqe-stage-next,
  .dqe-finalizado {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .dqe-paused > svg,
  .dqe-stage-next > svg,
  .dqe-finalizado > svg {
    width: 48px;
    height: 48px;
    padding: 12px;
    box-sizing: border-box;
    border-radius: 13px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-paused strong,
  .dqe-stage-next strong,
  .dqe-finalizado strong {
    font-size: var(--app-font-section);
  }

  .dqe-final {
    display: grid;
    gap: 14px;
  }

  .dqe-final__cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 17px 18px;
    border: 1px solid var(--app-border);
    border-top: 4px solid var(--app-accent);
    border-radius: 19px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dqe-final__etiqueta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--app-accent-dark);
    font-size: var(--app-font-sm);
    font-weight: 900;
    letter-spacing: .07em;
  }

  .dqe-final__cabecera h2 {
    margin: 4px 0 0;
    font-size: 21px;
  }

  .dqe-final__cabecera p {
    margin: 4px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
  }

  .dqe-final__publicacion {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    padding: 7px 10px;
    border-radius: 999px;
    font-size: var(--app-font-sm);
    font-weight: 900;
  }

  .dqe-final__publicacion.publicado {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .dqe-final__publicacion.pendiente {
    color: #b45309;
    background: #ffedd5;
  }

  .dqe-final__cargando {
    min-height: 150px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 7px;
    border: 1px solid var(--app-border);
    border-radius: 17px;
    color: var(--app-text-muted);
    background: var(--app-surface);
  }

  .dqe-podio,
  .dqe-ranking-final {
    padding: 17px;
    border: 1px solid var(--app-border);
    border-radius: 19px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dqe-podio__titulo {
    text-align: center;
  }

  .dqe-podio__titulo small,
  .dqe-ranking-final header small {
    color: var(--app-accent-dark);
    font-size: var(--app-font-sm);
    font-weight: 850;
    text-transform: uppercase;
  }

  .dqe-podio__titulo h3,
  .dqe-ranking-final header h3 {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 4px 0 0;
    font-size: 17px;
  }

  .dqe-podio__titulo h3 {
    justify-content: center;
  }

  .dqe-podio__puestos {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 190px));
    align-items: end;
    justify-content: center;
    gap: 12px;
    margin-top: 24px;
  }

  .dqe-podio__puesto {
    position: relative;
    min-height: 176px;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 6px;
    padding: 15px 10px;
    border: 1px solid var(--app-border);
    border-radius: 18px 18px 9px 9px;
    background: var(--app-surface-alt);
    text-align: center;
  }

  .dqe-podio__puesto--1 {
    min-height: 218px;
    border-color: color-mix(in srgb, #d7a800 45%, var(--app-border));
    background: linear-gradient(
      180deg,
      color-mix(in srgb, #f4c430 12%, var(--app-surface)),
      var(--app-surface-alt)
    );
  }

  .dqe-podio__puesto--2 {
    min-height: 190px;
  }

  .dqe-podio__puesto--3 {
    min-height: 168px;
  }

  .dqe-podio__puesto.soy-yo {
    box-shadow:
      0 0 0 3px
      color-mix(in srgb, var(--app-accent) 14%, transparent);
  }

  .dqe-podio__puesto.vacio {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dqe-podio__medalla {
    color: var(--app-accent-dark);
  }

  .dqe-podio__puesto--1 .dqe-podio__medalla {
    color: #b58a00;
  }

  .dqe-podio__avatar {
    width: 62px;
    height: 62px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-podio__puesto strong {
    max-width: 100%;
    overflow: hidden;
    font-size: var(--app-font-md);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dqe-podio__puesto b {
    font-size: 17px;
  }

  .dqe-podio__puesto > small {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    font-weight: 800;
  }

  .dqe-podio__yo {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 6px;
    border-radius: 999px;
    color: white;
    background: var(--app-accent);
    font-size: 7px;
    font-weight: 900;
  }

  .dqe-ranking-final {
    display: grid;
    gap: 12px;
  }

  .dqe-ranking-final > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .dqe-ranking-final > header > span {
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-sm);
  }

  .dqe-ranking-final__lista {
    display: grid;
    gap: 8px;
  }

  .dqe-ranking-final__lista article {
    display: grid;
    grid-template-columns: 32px 42px minmax(0, 1fr) 50px;
    align-items: center;
    gap: 9px;
    padding: 9px 10px;
    border: 1px solid var(--app-border-soft);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .dqe-ranking-final__lista article.soy-yo {
    border-color: var(--app-accent);
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 55%,
        var(--app-surface)
      );
  }

  .dqe-ranking-final__posicion {
    display: grid;
    place-items: center;
    color: var(--app-text-muted);
    font-size: var(--app-font-md);
    font-weight: 900;
  }

  .dqe-ranking-final__avatar {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-ranking-final__cuerpo {
    min-width: 0;
  }

  .dqe-ranking-final__nombre {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 5px;
  }

  .dqe-ranking-final__nombre strong {
    overflow: hidden;
    font-size: var(--app-font-md);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dqe-ranking-final__nombre small {
    flex: 0 0 auto;
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .dqe-ranking-final__barra {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--app-border-soft);
  }

  .dqe-ranking-final__barra i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      var(--app-accent),
      var(--app-accent-dark)
    );
  }

  .dqe-ranking-final__puntaje {
    text-align: right;
  }

  .dqe-ranking-final__puntaje strong {
    display: block;
    font-size: 14px;
  }

  .dqe-ranking-final__puntaje small {
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .dqe-resolucion {
    display: grid;
    gap: 13px;
    padding: 17px;
    border: 1px solid var(--app-border);
    border-radius: 19px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dqe-resolucion__cabecera {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .dqe-resolucion__cabecera > div {
    min-width: 0;
  }

  .dqe-resolucion__cabecera small {
    color: var(--app-accent-dark);
    font-size: var(--app-font-sm);
    font-weight: 850;
    text-transform: uppercase;
  }

  .dqe-resolucion__cabecera h3 {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 4px 0 0;
    font-size: 17px;
  }

  .dqe-resolucion__cabecera p {
    margin: 5px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
    line-height: 1.5;
  }

  .dqe-resolucion__cabecera > span {
    flex: 0 0 auto;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 900;
  }

  .dqe-resolucion__cabecera > span.disponible {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .dqe-resolucion__cabecera > span.bloqueada {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .dqe-resolucion__espera,
  .dqe-resolucion__cargando {
    min-height: 115px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px;
    border: 1px dashed var(--app-border-strong);
    border-radius: 14px;
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
  }

  .dqe-resolucion__espera > div {
    max-width: 650px;
  }

  .dqe-resolucion__espera strong {
    display: block;
    color: var(--app-text);
    font-size: var(--app-font-md);
  }

  .dqe-resolucion__espera p {
    margin: 4px 0 0;
    font-size: var(--app-font-body);
    line-height: 1.5;
  }

  .dqe-resolucion__lista {
    display: grid;
    gap: 10px;
  }

  .dqe-resolucion__pregunta {
    display: grid;
    gap: 11px;
    padding: 13px;
    border: 1px solid var(--app-border);
    border-left-width: 4px;
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .dqe-resolucion__pregunta.correcta {
    border-left-color: var(--app-success);
  }

  .dqe-resolucion__pregunta.incorrecta {
    border-left-color: var(--app-danger);
  }

  .dqe-resolucion__pregunta.omitida {
    border-left-color: var(--app-warning, #d97706);
  }

  .dqe-resolucion__pregunta > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .dqe-resolucion__pregunta > header > div {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .dqe-resolucion__pregunta > header > div > span {
    color: var(--app-accent-dark);
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .dqe-resolucion__pregunta > header > div > strong {
    color: var(--app-text);
    font-size: 12px;
    line-height: 1.45;
  }

  .dqe-resolucion__estado {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex: 0 0 auto;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 900;
  }

  .dqe-resolucion__estado.correcta {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .dqe-resolucion__estado.incorrecta {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .dqe-resolucion__estado.omitida {
    color: var(--app-warning-strong, #b45309);
    background: var(--app-warning-bg, #fffbeb);
  }

  .dqe-resolucion__comparacion {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .dqe-resolucion__comparacion > div {
    display: grid;
    gap: 4px;
    padding: 10px;
    border: 1px solid var(--app-border-soft);
    border-radius: 11px;
    background: var(--app-surface);
  }

  .dqe-resolucion__comparacion small {
    color: var(--app-text-muted);
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .dqe-resolucion__comparacion strong {
    color: var(--app-text-secondary);
    font-size: 10px;
    line-height: 1.45;
  }

  .dqe-resolucion__respuesta-correcta {
    border-color:
      color-mix(
        in srgb,
        var(--app-success) 25%,
        var(--app-border)
      ) !important;
    background:
      color-mix(
        in srgb,
        var(--app-success-bg) 60%,
        var(--app-surface)
      ) !important;
  }

  .dqe-resolucion__explicacion {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 8px;
    align-items: start;
    padding: 10px;
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-resolucion__explicacion small {
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .dqe-resolucion__explicacion p {
    margin: 3px 0 0;
    color: var(--app-text-secondary);
    font-size: 9.5px;
    line-height: 1.5;
  }

  .dqe-resolucion__pregunta > footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .dqe-resolucion__pregunta > footer span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .dqe-resolucion__pregunta > footer strong {
    color: var(--app-text);
  }

  .dqe-resultado-espera {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 17px;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dqe-resultado-espera > svg {
    width: 52px;
    height: 52px;
    padding: 13px;
    box-sizing: border-box;
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-resultado-espera small {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dqe-resultado-espera strong {
    display: block;
    margin-top: 2px;
    font-size: var(--app-font-section);
  }

  .dqe-resultado-espera p {
    margin: 4px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
    line-height: 1.5;
  }

  .dqe-resultado-espera > span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border-radius: 999px;
    color: #b45309;
    background: #ffedd5;
    font-size: var(--app-font-sm);
    font-weight: 850;
  }

  .dqe-resultado-cargando {
    min-height: 150px;
    display: grid;
    place-items: center;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
  }

  .dqe-resultado {
    display: grid;
    gap: 12px;
  }

  .dqe-resultado__hero {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 14px;
    padding: 16px;
    border: 1px solid color-mix(in srgb, var(--app-accent) 24%, var(--app-border));
    border-radius: 19px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dqe-resultado__nota {
    min-height: 130px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 1px;
    border-radius: 15px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-resultado__nota small {
    font-size: var(--app-font-sm);
    font-weight: 850;
  }

  .dqe-resultado__nota strong {
    color: var(--app-text);
    font-size: 42px;
    line-height: 1;
  }

  .dqe-resultado__nota span {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dqe-resultado__hero-info {
    display: grid;
    align-content: center;
    gap: 5px;
  }

  .dqe-resultado__publicado {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 999px;
    color: var(--app-success);
    background: var(--app-success-bg);
    font-size: var(--app-font-sm);
    font-weight: 900;
  }

  .dqe-resultado__hero-info h2 {
    margin: 3px 0 0;
    font-size: 20px;
  }

  .dqe-resultado__hero-info p {
    margin: 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
    line-height: 1.5;
  }

  .dqe-resultado__metricas {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
  }

  .dqe-resultado__metricas article {
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 3px 7px;
    padding: 10px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
  }

  .dqe-resultado__metricas article > svg {
    grid-row: 1 / 3;
  }

  .dqe-resultado__metricas span {
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .dqe-resultado__metricas strong {
    color: var(--app-text);
    font-size: 12px;
  }

  .dqe-resultado__metricas .correctas {
    color: var(--app-success);
  }

  .dqe-resultado__metricas .incorrectas {
    color: var(--app-danger);
  }

  .dqe-resultado__calculo {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface);
  }

  .dqe-resultado__calculo > div {
    display: grid;
    gap: 3px;
    padding: 11px 13px;
    border-right: 1px solid var(--app-border-soft);
  }

  .dqe-resultado__calculo > div:last-child {
    border-right: 0;
  }

  .dqe-resultado__calculo span {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dqe-resultado__calculo strong {
    font-size: 15px;
  }

  .dqe-resultado__calculo .final {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-resultado__revision-btn {
    width: fit-content;
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-self: end;
    padding: 8px 12px;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 850;
    cursor: pointer;
  }

  .dqe-revision {
    display: grid;
    gap: 9px;
  }

  .dqe-revision article {
    display: grid;
    gap: 8px;
    padding: 12px 13px;
    border: 1px solid var(--app-border);
    border-left: 4px solid var(--app-border-strong);
    border-radius: 13px;
    background: var(--app-surface);
  }

  .dqe-revision article.correcta {
    border-left-color: var(--app-success);
  }

  .dqe-revision article.incorrecta {
    border-left-color: var(--app-danger);
  }

  .dqe-revision article.omitida {
    border-left-color: var(--app-text-muted);
  }

  .dqe-revision header,
  .dqe-revision footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .dqe-revision header span,
  .dqe-revision footer span {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dqe-revision header strong {
    font-size: var(--app-font-sm);
    text-transform: uppercase;
  }

  .dqe-revision h3 {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
  }

  .dqe-revision__respuestas {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .dqe-revision__respuestas > div {
    display: grid;
    gap: 3px;
    padding: 9px 10px;
    border-radius: 10px;
    background: var(--app-surface-alt);
  }

  .dqe-revision__respuestas small {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dqe-revision__respuestas strong {
    font-size: var(--app-font-body);
    line-height: 1.45;
  }

  .dqe-revision__explicacion {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 7px;
    padding: 8px 9px;
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-sm);
    line-height: 1.5;
  }

  .dqe-detalles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .dqe-detalles article {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    background: var(--app-surface-alt);
  }

  .dqe-detalles article > svg {
    width: 38px;
    height: 38px;
    padding: 9px;
    box-sizing: border-box;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .dqe-detalles strong {
    display: block;
    margin-top: 2px;
    font-size: var(--app-font-md);
  }

  @media (max-width: 980px) {
    .dqe-participantes__grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .dqe-resolucion__cabecera,
    .dqe-resolucion__pregunta > header,
    .dqe-resolucion__pregunta > footer {
      align-items: flex-start;
      flex-direction: column;
    }

    .dqe-resolucion__comparacion {
      grid-template-columns: 1fr;
    }

    .dqe-final__cabecera,
    .dqe-ranking-final > header {
      align-items: flex-start;
      flex-direction: column;
    }

    .dqe-podio__puestos {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .dqe-podio__puesto,
    .dqe-podio__puesto--1,
    .dqe-podio__puesto--2,
    .dqe-podio__puesto--3 {
      min-height: auto;
    }

    .dqe-podio__puesto--1 {
      order: -1;
    }

    .dqe-ranking-final__nombre small {
      display: none;
    }

    .dqe-lobby__header,
    .dqe-lobby__footer {
      align-items: stretch;
      flex-direction: column;
    }

    .dqe-lobby__stats {
      width: 100%;
    }

    .dqe-lobby__stats span {
      flex: 1;
    }

    .dqe-participantes__grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .dqe-temporal {
      grid-template-columns: 48px minmax(0, 1fr);
    }

    .dqe-temporal__contador {
      grid-column: 1 / -1;
      width: 100%;
      box-sizing: border-box;
      text-align: left;
    }

    .dqe-detalles,
    .dqe-opciones,
    .dqe-resultado__hero,
    .dqe-resultado__calculo,
    .dqe-revision__respuestas {
      grid-template-columns: 1fr;
    }

    .dqe-resultado__metricas {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dqe-resultado__calculo > div {
      border-right: 0;
      border-bottom: 1px solid var(--app-border-soft);
    }

    .dqe-resultado__calculo > div:last-child {
      border-bottom: 0;
    }

    .dqe-resultado-espera {
      grid-template-columns: 52px minmax(0, 1fr);
    }

    .dqe-resultado-espera > span {
      grid-column: 1 / -1;
      width: fit-content;
    }

    .dqe-pregunta__header,
    .dqe-pregunta__footer {
      align-items: stretch;
      flex-direction: column;
    }

    .dqe-pregunta__footer > button {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 520px) {
    .dqe-participantes__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dqe-avatar-selector__opciones button {
      flex: 1 0 70px;
    }

    .dqe-lobby__accion button {
      width: 100%;
      justify-content: center;
    }
  }
`;
