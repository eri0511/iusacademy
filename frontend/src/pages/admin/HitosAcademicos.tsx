import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  Archive,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleX,
  Clock3,
  Edit3,
  History,
  LoaderCircle,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react';

import {
  useAuth,
} from '../../auth/AuthContext';

type EstadoTemporalHito =
  | 'PROXIMO'
  | 'EN_CURSO'
  | 'FINALIZADO';

type FiltroPlanificaciones =
  | 'ACTUAL'
  | 'ANTERIORES'
  | 'TODAS';

type TipoToast =
  | 'exito'
  | 'error'
  | 'advertencia';

type HitoAcademico = {
  id: number;
  planificacionId: number;
  numero: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string;
  puntajeTotal: number;
  puntajeContinua: number;
  puntajeProcesual: number;
  creadoEn: string;
  actualizadoEn: string;
};

type PlanificacionAcademica = {
  id: number;
  gestion: string;
  descripcion: string | null;
  estaActiva: boolean;
  creadoEn: string;
  actualizadoEn: string;
  totalCursos: number;
  puntajeMateria: number;
  hitos: HitoAcademico[];
};

type RespuestaAccion = {
  mensaje: string;
  advertencias?: string[];
  planificacion: PlanificacionAcademica;
};

type RespuestaEstado = {
  mensaje: string;
  planificacion: PlanificacionAcademica;
};

type RespuestaError = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};

type FechaFormulario = {
  numero: number;
  fechaInicio: string;
  fechaFin: string;
};

type FormularioPlanificacion = {
  gestion: string;
  descripcion: string;
  hitos: FechaFormulario[];
};

type ToastEstado = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
};

type DefinicionHito = {
  numero: number;
  codigo: string;
  nombre: string;
  subtitulo: string;
  puntajeTotal: number;
  puntajeContinua: number;
  puntajeProcesual: number;
  duracion: string;
  clase: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const definicionesHitos: DefinicionHito[] = [
  {
    numero: 1,
    codigo: 'H1',
    nombre: 'Retroalimentación',
    subtitulo:
      'Diagnóstico, nivelación y acompañamiento inicial.',
    puntajeTotal: 0,
    puntajeContinua: 0,
    puntajeProcesual: 0,
    duracion: '7 a 14 días',
    clase: 'violeta',
  },
  {
    numero: 2,
    codigo: 'H2',
    nombre: 'Primer parcial',
    subtitulo:
      'Primer periodo de evaluación académica.',
    puntajeTotal: 25,
    puntajeContinua: 15,
    puntajeProcesual: 10,
    duracion: '30 a 40 días',
    clase: 'naranja',
  },
  {
    numero: 3,
    codigo: 'H3',
    nombre: 'Segundo parcial',
    subtitulo:
      'Segundo periodo de evaluación académica.',
    puntajeTotal: 25,
    puntajeContinua: 15,
    puntajeProcesual: 10,
    duracion: '30 a 40 días',
    clase: 'azul',
  },
  {
    numero: 4,
    codigo: 'H4',
    nombre: 'Tercer parcial',
    subtitulo:
      'Tercer periodo de evaluación académica.',
    puntajeTotal: 25,
    puntajeContinua: 15,
    puntajeProcesual: 10,
    duracion: '30 a 40 días',
    clase: 'verde',
  },
  {
    numero: 5,
    codigo: 'H5',
    nombre: 'Evaluación final',
    subtitulo:
      'Cierre, consolidación y evaluación final.',
    puntajeTotal: 25,
    puntajeContinua: 15,
    puntajeProcesual: 10,
    duracion: '10 a 18 días',
    clase: 'rosado',
  },
];

function obtenerGestionActual(
  fecha =
    new Date(),
): string {
  const anio =
    fecha.getFullYear();

  const periodo =
    fecha.getMonth() <=
    5
      ? 1
      : 2;

  return `${anio}-${periodo}`;
}

function obtenerPeriodoGestion(
  gestion:
    string,
): string {
  return gestion.endsWith(
    '-1',
  )
    ? 'Enero — Junio'
    : 'Julio — Diciembre';
}

function crearFormularioVacio(): FormularioPlanificacion {
  return {
    gestion:
      obtenerGestionActual(),

    descripcion:
      '',

    hitos:
      definicionesHitos.map(
        (
          hito,
        ) => ({
          numero:
            hito.numero,

          fechaInicio:
            '',

          fechaFin:
            '',
        }),
      ),
  };
}

function crearHeadersAutorizados(
  accessToken:
    string,
  incluirContenido =
    false,
): HeadersInit {
  return {
    Accept:
      'application/json',

    ...(
      incluirContenido
        ? {
            'Content-Type':
              'application/json',
          }
        : {}
    ),

    Authorization:
      `Bearer ${accessToken}`,
  };
}

function obtenerMensajeError(
  datos:
    RespuestaError,
  predeterminado:
    string,
): string {
  if (
    Array.isArray(
      datos.message,
    )
  ) {
    return datos.message.join(
      ' ',
    );
  }

  return (
    datos.message ||
    datos.mensaje ||
    datos.error ||
    predeterminado
  );
}

function fechaApiAInput(
  fecha:
    string,
): string {
  const valor =
    new Date(
      fecha,
    );

  if (
    Number.isNaN(
      valor.getTime(),
    )
  ) {
    return '';
  }

  const anio =
    valor.getFullYear();

  const mes =
    String(
      valor.getMonth() +
      1,
    ).padStart(
      2,
      '0',
    );

  const dia =
    String(
      valor.getDate(),
    ).padStart(
      2,
      '0',
    );

  return `${anio}-${mes}-${dia}`;
}

function fechaInicioAApi(
  fecha:
    string,
): string {
  return new Date(
    `${fecha}T00:00:00`,
  ).toISOString();
}

function fechaFinAApi(
  fecha:
    string,
): string {
  return new Date(
    `${fecha}T23:59:59.999`,
  ).toISOString();
}

function calcularDuracionDias(
  inicio:
    string,
  fin:
    string,
): number | null {
  if (
    !inicio ||
    !fin
  ) {
    return null;
  }

  const fechaInicio =
    new Date(
      `${inicio}T00:00:00`,
    );

  const fechaFin =
    new Date(
      `${fin}T00:00:00`,
    );

  if (
    Number.isNaN(
      fechaInicio.getTime(),
    ) ||
    Number.isNaN(
      fechaFin.getTime(),
    ) ||
    fechaFin <
      fechaInicio
  ) {
    return null;
  }

  return (
    Math.floor(
      (
        fechaFin.getTime() -
        fechaInicio.getTime()
      ) /
        86400000,
    ) +
    1
  );
}

function obtenerEstadoHito(
  fechaInicio:
    string,
  fechaFin:
    string,
): EstadoTemporalHito {
  const ahora =
    new Date();

  const inicio =
    new Date(
      fechaInicio,
    );

  const fin =
    new Date(
      fechaFin,
    );

  if (
    ahora <
    inicio
  ) {
    return 'PROXIMO';
  }

  if (
    ahora >
    fin
  ) {
    return 'FINALIZADO';
  }

  return 'EN_CURSO';
}

function formatearFecha(
  fecha:
    string,
): string {
  const valor =
    new Date(
      fecha,
    );

  if (
    Number.isNaN(
      valor.getTime(),
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

      year:
        'numeric',
    },
  ).format(
    valor,
  );
}

export default function HitosAcademicos() {
  const {
    sesion,
  } = useAuth();

  const accessToken =
    sesion?.accessToken ??
    '';

  const gestionActual =
    useMemo(
      () =>
        obtenerGestionActual(),
      [],
    );

  const [
    planificaciones,
    setPlanificaciones,
  ] =
    useState<PlanificacionAcademica[]>(
      [],
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const [
    panelAbierto,
    setPanelAbierto,
  ] =
    useState(
      false,
    );

  const [
    planificacionEditandoId,
    setPlanificacionEditandoId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    formulario,
    setFormulario,
  ] =
    useState<FormularioPlanificacion>(
      crearFormularioVacio,
    );

  const [
    guardando,
    setGuardando,
  ] =
    useState(
      false,
    );

  const [
    planificacionEstado,
    setPlanificacionEstado,
  ] =
    useState<PlanificacionAcademica | null>(
      null,
    );

  const [
    actualizandoEstado,
    setActualizandoEstado,
  ] =
    useState(
      false,
    );

  const [
    busqueda,
    setBusqueda,
  ] =
    useState(
      '',
    );

  const [
    filtro,
    setFiltro,
  ] =
    useState<FiltroPlanificaciones>(
      'ACTUAL',
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastEstado>({
      visible:
        false,

      tipo:
        'exito',

      titulo:
        '',

      mensaje:
        '',
    });

  const mostrarToast =
    (
      tipo:
        TipoToast,

      titulo:
        string,

      mensaje:
        string,
    ) => {
      setToast({
        visible:
          true,

        tipo,

        titulo,

        mensaje,
      });
    };

  const cerrarToast =
    useCallback(
      () => {
        setToast(
          (
            anterior,
          ) => ({
            ...anterior,

            visible:
              false,
          }),
        );
      },
      [],
    );

  const obtenerPlanificaciones =
    useCallback(
      async () => {
        try {
          setCargando(
            true,
          );

          if (
            !accessToken
          ) {
            throw new Error(
              'No existe una sesión válida.',
            );
          }

          const respuesta =
            await fetch(
              `${API_URL}/admin/hitos`,
              {
                method:
                  'GET',

                headers:
                  crearHeadersAutorizados(
                    accessToken,
                  ),
              },
            );

          const datos =
            await respuesta
              .json()
              .catch(
                () => ({}),
              );

          if (
            !respuesta.ok
          ) {
            throw new Error(
              obtenerMensajeError(
                datos as RespuestaError,
                'No se pudieron obtener las planificaciones.',
              ),
            );
          }

          setPlanificaciones(
            Array.isArray(
              datos,
            )
              ? datos
              : [],
          );
        } catch (
          error
        ) {
          console.error(
            error,
          );

          mostrarToast(
            'error',
            'Error al cargar',
            error instanceof Error
              ? error.message
              : 'No fue posible obtener las planificaciones académicas.',
          );
        } finally {
          setCargando(
            false,
          );
        }
      },
      [
        accessToken,
      ],
    );

  useEffect(
    () => {
      if (
        !accessToken
      ) {
        setCargando(
          false,
        );

        return;
      }

      void obtenerPlanificaciones();
    },
    [
      accessToken,
      obtenerPlanificaciones,
    ],
  );

  const limpiarFormulario =
    () => {
      setFormulario(
        crearFormularioVacio(),
      );

      setPlanificacionEditandoId(
        null,
      );
    };

  const abrirNuevaPlanificacion =
    () => {
      if (
        existeGestionActual
      ) {
        mostrarToast(
          'advertencia',
          'Planificación ya registrada',
          `La gestión ${gestionActual} ya cuenta con una planificación académica. Puedes modificarla mediante el botón Editar fechas.`,
        );

        return;
      }

      limpiarFormulario();

      setPanelAbierto(
        true,
      );

      window.scrollTo({
        top:
          0,

        behavior:
          'smooth',
      });
    };

  const abrirEdicion =
    (
      planificacion:
        PlanificacionAcademica,
    ) => {
      setFormulario({
        gestion:
          planificacion.gestion,

        descripcion:
          planificacion.descripcion ??
          '',

        hitos:
          definicionesHitos.map(
            (
              definicion,
            ) => {
              const hito =
                planificacion.hitos.find(
                  (
                    elemento,
                  ) =>
                    elemento.numero ===
                    definicion.numero,
                );

              return {
                numero:
                  definicion.numero,

                fechaInicio:
                  hito
                    ? fechaApiAInput(
                        hito.fechaInicio,
                      )
                    : '',

                fechaFin:
                  hito
                    ? fechaApiAInput(
                        hito.fechaFin,
                      )
                    : '',
              };
            },
          ),
      });

      setPlanificacionEditandoId(
        planificacion.id,
      );

      setPanelAbierto(
        true,
      );

      window.scrollTo({
        top:
          0,

        behavior:
          'smooth',
      });
    };

  const cerrarFormulario =
    () => {
      limpiarFormulario();

      setPanelAbierto(
        false,
      );
    };

  const actualizarFechaHito =
    (
      numero:
        number,

      campo:
        'fechaInicio' |
        'fechaFin',

      valor:
        string,
    ) => {
      setFormulario(
        (
          anterior,
        ) => ({
          ...anterior,

          hitos:
            anterior.hitos.map(
              (
                hito,
              ) =>
                hito.numero ===
                numero
                  ? {
                      ...hito,

                      [campo]:
                        valor,
                    }
                  : hito,
            ),
        }),
      );
    };

  const erroresFormulario =
    useMemo(
      () => {
        const errores:
          string[] = [];

        for (
          const hito of
          formulario.hitos
        ) {
          if (
            !hito.fechaInicio ||
            !hito.fechaFin
          ) {
            errores.push(
              `Completa la fecha inicial y final de H${hito.numero}.`,
            );

            continue;
          }

          const inicio =
            new Date(
              `${hito.fechaInicio}T00:00:00`,
            );

          const fin =
            new Date(
              `${hito.fechaFin}T23:59:59`,
            );

          if (
            fin <=
            inicio
          ) {
            errores.push(
              `La fecha final de H${hito.numero} debe ser posterior a la inicial.`,
            );
          }
        }

        for (
          let indice = 1;
          indice <
          formulario.hitos.length;
          indice +=
            1
        ) {
          const anterior =
            formulario.hitos[
              indice -
              1
            ];

          const actual =
            formulario.hitos[
              indice
            ];

          if (
            anterior.fechaFin &&
            actual.fechaInicio &&
            new Date(
              `${actual.fechaInicio}T00:00:00`,
            ) <=
            new Date(
              `${anterior.fechaFin}T23:59:59`,
            )
          ) {
            errores.push(
              `H${actual.numero} se cruza con H${anterior.numero}.`,
            );
          }
        }

        return errores;
      },
      [
        formulario.hitos,
      ],
    );

  const hitosCompletos =
    useMemo(
      () =>
        formulario.hitos.filter(
          (
            hito,
          ) =>
            Boolean(
              hito.fechaInicio &&
              hito.fechaFin,
            ),
        ).length,
      [
        formulario.hitos,
      ],
    );

  const guardarPlanificacion =
    async (
      event:
        React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        erroresFormulario.length >
        0
      ) {
        mostrarToast(
          'error',
          'Fechas incompletas',
          erroresFormulario[0],
        );

        return;
      }

      try {
        setGuardando(
          true,
        );

        const editando =
          planificacionEditandoId !==
          null;

        const respuesta =
          await fetch(
            editando
              ? `${API_URL}/admin/hitos/${planificacionEditandoId}`
              : `${API_URL}/admin/hitos`,
            {
              method:
                editando
                  ? 'PUT'
                  : 'POST',

              headers:
                crearHeadersAutorizados(
                  accessToken,
                  true,
                ),

              body:
                JSON.stringify({
                  ...(
                    editando
                      ? {}
                      : {
                          gestion:
                            formulario.gestion,
                        }
                  ),

                  descripcion:
                    formulario.descripcion.trim() ||
                    undefined,

                  hitos:
                    formulario.hitos.map(
                      (
                        hito,
                      ) => ({
                        numero:
                          hito.numero,

                        fechaInicio:
                          fechaInicioAApi(
                            hito.fechaInicio,
                          ),

                        fechaFin:
                          fechaFinAApi(
                            hito.fechaFin,
                          ),
                      }),
                    ),
                }),
            },
          );

        const datos =
          await respuesta
            .json()
            .catch(
              () => ({}),
            ) as RespuestaAccion &
            RespuestaError;

        if (
          !respuesta.ok
        ) {
          throw new Error(
            obtenerMensajeError(
              datos,
              'No fue posible guardar la planificación.',
            ),
          );
        }

        cerrarFormulario();

        await obtenerPlanificaciones();

        const advertencias =
          datos.advertencias ??
          [];

        mostrarToast(
          advertencias.length >
            0
            ? 'advertencia'
            : 'exito',
          editando
            ? 'Planificación actualizada'
            : 'Planificación registrada',
          advertencias.length >
            0
            ? advertencias.join(
                ' ',
              )
            : datos.mensaje ||
              'Las fechas académicas fueron guardadas correctamente.',
        );
      } catch (
        error
      ) {
        console.error(
          error,
        );

        mostrarToast(
          'error',
          'No se pudo guardar',
          error instanceof Error
            ? error.message
            : 'No fue posible comunicarse con el servidor.',
        );
      } finally {
        setGuardando(
          false,
        );
      }
    };

  const cambiarEstadoPlanificacion =
    async () => {
      if (
        !planificacionEstado
      ) {
        return;
      }

      try {
        setActualizandoEstado(
          true,
        );

        const respuesta =
          await fetch(
            `${API_URL}/admin/hitos/${planificacionEstado.id}/estado`,
            {
              method:
                'PATCH',

              headers:
                crearHeadersAutorizados(
                  accessToken,
                  true,
                ),

              body:
                JSON.stringify({
                  estaActiva:
                    !planificacionEstado.estaActiva,
                }),
            },
          );

        const datos =
          await respuesta
            .json()
            .catch(
              () => ({}),
            ) as RespuestaEstado &
            RespuestaError;

        if (
          !respuesta.ok
        ) {
          throw new Error(
            obtenerMensajeError(
              datos,
              'No fue posible cambiar el estado.',
            ),
          );
        }

        setPlanificacionEstado(
          null,
        );

        await obtenerPlanificaciones();

        mostrarToast(
          'exito',
          'Estado actualizado',
          datos.mensaje ||
          'El estado fue actualizado correctamente.',
        );
      } catch (
        error
      ) {
        console.error(
          error,
        );

        mostrarToast(
          'error',
          'No se pudo actualizar',
          error instanceof Error
            ? error.message
            : 'No fue posible cambiar el estado.',
        );
      } finally {
        setActualizandoEstado(
          false,
        );
      }
    };

  const cantidadActual =
    useMemo(
      () =>
        planificaciones.filter(
          (
            planificacion,
          ) =>
            planificacion.gestion ===
            gestionActual,
        ).length,
      [
        gestionActual,
        planificaciones,
      ],
    );

  const cantidadAnteriores =
    useMemo(
      () =>
        planificaciones.filter(
          (
            planificacion,
          ) =>
            planificacion.gestion.localeCompare(
              gestionActual,
            ) <
            0,
        ).length,
      [
        gestionActual,
        planificaciones,
      ],
    );

  const planificacionesFiltradas =
    useMemo(
      () => {
        const texto =
          busqueda
            .trim()
            .toLowerCase();

        return planificaciones.filter(
          (
            planificacion,
          ) => {
            const coincideFiltro =
              filtro ===
                'TODAS'
                ? true
                : filtro ===
                    'ACTUAL'
                  ? planificacion.gestion ===
                    gestionActual
                  : planificacion.gestion.localeCompare(
                      gestionActual,
                    ) <
                    0;

            const coincideBusqueda =
              !texto ||
              planificacion.gestion
                .toLowerCase()
                .includes(
                  texto,
                ) ||
              (
                planificacion.descripcion ??
                ''
              )
                .toLowerCase()
                .includes(
                  texto,
                );

            return (
              coincideFiltro &&
              coincideBusqueda
            );
          },
        );
      },
      [
        busqueda,
        filtro,
        gestionActual,
        planificaciones,
      ],
    );

  const existeGestionActual =
    cantidadActual >
    0;

  const estadoAcademicoActual =
    useMemo(
      () => {
        const planificacion =
          planificaciones.find(
            (
              elemento,
            ) =>
              elemento.gestion ===
              gestionActual,
          );

        if (
          !planificacion
        ) {
          return {
            valor:
              '—',

            titulo:
              'Sin planificación registrada',
          };
        }

        const hitoEnCurso =
          planificacion.hitos.find(
            (
              hito,
            ) =>
              obtenerEstadoHito(
                hito.fechaInicio,
                hito.fechaFin,
              ) ===
              'EN_CURSO',
          );

        if (
          hitoEnCurso
        ) {
          return {
            valor:
              hitoEnCurso.codigo,

            titulo:
              `${hitoEnCurso.nombre} en curso`,
          };
        }

        const proximoHito =
          planificacion.hitos.find(
            (
              hito,
            ) =>
              obtenerEstadoHito(
                hito.fechaInicio,
                hito.fechaFin,
              ) ===
              'PROXIMO',
          );

        if (
          proximoHito
        ) {
          return {
            valor:
              proximoHito.codigo,

            titulo:
              `Próximo: ${proximoHito.nombre}`,
          };
        }

        return {
          valor:
            'Finalizada',

          titulo:
            'Todos los hitos concluyeron',
        };
      },
      [
        gestionActual,
        planificaciones,
      ],
    );

  return (
    <main className="hitos-page">
      {toast.visible && (
        <Toast
          tipo={
            toast.tipo
          }
          titulo={
            toast.titulo
          }
          mensaje={
            toast.mensaje
          }
          onCerrar={
            cerrarToast
          }
        />
      )}

      <header className="hitos-header">
        <div className="hitos-header__content">
          <div className="hitos-header__icon">
            <CalendarDays
              size={26}
            />
          </div>

          <div>
            <span className="hitos-eyebrow">
              Administración académica
            </span>

            <h1>
              Hitos académicos
            </h1>

            <p>
              Configura las fechas institucionales que organizarán el semestre.
            </p>

            <div className="hitos-header__meta">
              <span>
                5 hitos
              </span>

              <span>
                100 puntos
              </span>

              <span>
                Gestión automática
              </span>
            </div>
          </div>
        </div>

        <div className="hitos-header__actions">
          <button
            type="button"
            className="btn-registrar"
            disabled={
              existeGestionActual
            }
            title={
              existeGestionActual
                ? `La gestión ${gestionActual} ya tiene una planificación registrada`
                : 'Registrar planificación académica'
            }
            onClick={
              abrirNuevaPlanificacion
            }
          >
            {existeGestionActual ? (
              <CheckCircle2
                size={18}
              />
            ) : (
              <Plus
                size={18}
              />
            )}

            {existeGestionActual
              ? 'Planificación registrada'
              : 'Registrar planificación'}
          </button>

          <button
            type="button"
            className="btn-actualizar"
            disabled={
              cargando
            }
            onClick={() =>
              void obtenerPlanificaciones()
            }
          >
            <RefreshCw
              size={17}
              className={
                cargando
                  ? 'spin'
                  : ''
              }
            />

            Actualizar
          </button>
        </div>
      </header>

      <section className="summary-grid">
        <Resumen
          icono={
            <Sparkles
              size={21}
            />
          }
          cantidad={
            gestionActual
          }
          titulo="Gestión actual"
          clase="actual"
        />

        <Resumen
          icono={
            <Target
              size={21}
            />
          }
          cantidad={
            '100'
          }
          titulo="Puntos de la materia"
          clase="puntos"
        />

        <Resumen
          icono={
            <Clock3
              size={21}
            />
          }
          cantidad={
            estadoAcademicoActual.valor
          }
          titulo={
            estadoAcademicoActual.titulo
          }
          clase="curso"
        />
      </section>

      {panelAbierto && (
        <section className="form-card">
          <div className="form-card-header">
            <div>
              <span className="section-eyebrow">
                {planificacionEditandoId
                  ? 'Editar calendario'
                  : 'Nueva planificación'}
              </span>

              <h2>
                {planificacionEditandoId
                  ? `Editar gestión ${formulario.gestion}`
                  : `Configurar gestión ${formulario.gestion}`}
              </h2>

              <p>
                Completa la fecha inicial y final de H1 a H5.
              </p>
            </div>

            <button
              type="button"
              className="btn-cerrar-form"
              onClick={
                cerrarFormulario
              }
            >
              <X
                size={18}
              />
            </button>
          </div>

          <div className="gestion-automatica">
            <div className="gestion-automatica__icon">
              <Sparkles
                size={22}
              />
            </div>

            <div>
              <span>
                Gestión detectada automáticamente
              </span>

              <strong>
                {formulario.gestion}
              </strong>

              <p>
                {obtenerPeriodoGestion(
                  formulario.gestion,
                )}
                {' · '}
                No editable
              </p>
            </div>

            <div className="progreso-formulario">
              <strong>
                {hitosCompletos}/5
              </strong>

              <span>
                hitos completos
              </span>
            </div>
          </div>

          <form
            className="hitos-form"
            onSubmit={
              guardarPlanificacion
            }
          >
            <label className="descripcion-field">
              <span>
                Descripción opcional
              </span>

              <input
                type="text"
                value={
                  formulario.descripcion
                }
                maxLength={500}
                placeholder="Ej. Calendario institucional de la gestión"
                onChange={(
                  event,
                ) =>
                  setFormulario(
                    (
                      anterior,
                    ) => ({
                      ...anterior,

                      descripcion:
                        event.target.value,
                    }),
                  )
                }
              />

              <small>
                {formulario.descripcion.length}/500
              </small>
            </label>

            <div className="hitos-grid">
              {definicionesHitos.map(
                (
                  definicion,
                ) => {
                  const fechas =
                    formulario.hitos.find(
                      (
                        hito,
                      ) =>
                        hito.numero ===
                        definicion.numero,
                    );

                  const duracion =
                    calcularDuracionDias(
                      fechas?.fechaInicio ??
                        '',
                      fechas?.fechaFin ??
                        '',
                    );

                  const completo =
                    Boolean(
                      fechas?.fechaInicio &&
                      fechas?.fechaFin,
                    );

                  return (
                    <article
                      key={
                        definicion.codigo
                      }
                      className={`hito-form-card ${definicion.clase} ${
                        completo
                          ? 'completo'
                          : ''
                      }`}
                    >
                      <div className="hito-accento" />

                      <header>
                        <div className="hito-identidad">
                          <div className="hito-codigo">
                            {definicion.codigo}
                          </div>

                          <div>
                            <span>
                              Periodo académico
                            </span>

                            <h3 className="hito-titulo-principal">
                              {`HITO ${definicion.numero}`}
                            </h3>

                            <p className="hito-nombre-secundario">
                              {definicion.nombre}
                            </p>

                            <small className="hito-descripcion-extra">
                              {definicion.subtitulo}
                            </small>
                          </div>
                        </div>

                        <span
                          className={`estado-completo ${
                            completo
                              ? 'listo'
                              : ''
                          }`}
                        >
                          {completo ? (
                            <CheckCircle2
                              size={16}
                            />
                          ) : (
                            <Clock3
                              size={16}
                            />
                          )}

                          {completo
                            ? 'Completo'
                            : 'Pendiente'}
                        </span>
                      </header>

                      <div className="hito-puntajes">
                        <span>
                          Duración sugerida:
                          {' '}
                          <strong>
                            {definicion.duracion}
                          </strong>
                        </span>

                        {definicion.numero ===
                        1 ? (
                          <span>
                            Sin calificación
                          </span>
                        ) : (
                          <>
                            <span>
                              Continua:
                              {' '}
                              <strong>
                                {definicion.puntajeContinua}
                              </strong>
                            </span>

                            <span>
                              Procesual:
                              {' '}
                              <strong>
                                {definicion.puntajeProcesual}
                              </strong>
                            </span>

                            <span className="puntaje-total">
                              Total:
                              {' '}
                              <strong>
                                {definicion.puntajeTotal}
                              </strong>
                            </span>
                          </>
                        )}
                      </div>

                      <div className="fechas-grid">
                        <label>
                          <span>
                            Fecha de inicio
                          </span>

                          <div className="input-fecha">
                            <CalendarDays
                              size={18}
                            />

                            <input
                              type="date"
                              value={
                                fechas?.fechaInicio ??
                                ''
                              }
                              onChange={(
                                event,
                              ) =>
                                actualizarFechaHito(
                                  definicion.numero,
                                  'fechaInicio',
                                  event.target.value,
                                )
                              }
                            />
                          </div>
                        </label>

                        <label>
                          <span>
                            Fecha de finalización
                          </span>

                          <div className="input-fecha">
                            <CalendarDays
                              size={18}
                            />

                            <input
                              type="date"
                              value={
                                fechas?.fechaFin ??
                                ''
                              }
                              min={
                                fechas?.fechaInicio ||
                                undefined
                              }
                              onChange={(
                                event,
                              ) =>
                                actualizarFechaHito(
                                  definicion.numero,
                                  'fechaFin',
                                  event.target.value,
                                )
                              }
                            />
                          </div>
                        </label>
                      </div>

                      <footer>
                        <Clock3
                          size={16}
                        />

                        <span>
                          {duracion ===
                          null
                            ? 'Selecciona ambas fechas'
                            : `${duracion} días calendario`}
                        </span>
                      </footer>
                    </article>
                  );
                },
              )}
            </div>

            {erroresFormulario.length >
              0 && (
              <div className="errores-formulario">
                <AlertCircle
                  size={20}
                />

                <div>
                  <strong>
                    Revisa las fechas
                  </strong>

                  {erroresFormulario
                    .slice(
                      0,
                      5,
                    )
                    .map(
                      (
                        error,
                      ) => (
                        <span
                          key={
                            error
                          }
                        >
                          {error}
                        </span>
                      ),
                    )}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={
                  cerrarFormulario
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={
                  guardando ||
                  erroresFormulario.length >
                    0
                }
              >
                {guardando ? (
                  <LoaderCircle
                    size={18}
                    className="spin"
                  />
                ) : (
                  <Save
                    size={18}
                  />
                )}

                {guardando
                  ? 'Guardando...'
                  : planificacionEditandoId
                    ? 'Guardar cambios'
                    : 'Registrar planificación'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="planificaciones-card">
        <div className="planificaciones-card__top">
          <div>
            <h2>
              Planificaciones registradas
            </h2>

            <p>
              Consulta la gestión actual y los calendarios anteriores.
            </p>
          </div>

          <span className="cantidad-registros">
            {planificaciones.length}
            {' '}
            {planificaciones.length ===
            1
              ? 'planificación'
              : 'planificaciones'}
          </span>
        </div>

        <div className="filtros">
          <button
            type="button"
            className={
              filtro ===
              'ACTUAL'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro(
                'ACTUAL',
              )
            }
          >
            <Sparkles
              size={16}
            />

            Actual

            <span>
              {cantidadActual}
            </span>
          </button>

          <button
            type="button"
            className={
              filtro ===
              'ANTERIORES'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro(
                'ANTERIORES',
              )
            }
          >
            <History
              size={16}
            />

            Anteriores

            <span>
              {cantidadAnteriores}
            </span>
          </button>

          <button
            type="button"
            className={
              filtro ===
              'TODAS'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFiltro(
                'TODAS',
              )
            }
          >
            <Archive
              size={16}
            />

            Todas

            <span>
              {planificaciones.length}
            </span>
          </button>
        </div>

        <div className="search-box">
          <Search
            size={17}
          />

          <input
            type="search"
            value={
              busqueda
            }
            placeholder="Buscar por gestión o descripción..."
            onChange={(
              event,
            ) =>
              setBusqueda(
                event.target.value,
              )
            }
          />

          {busqueda && (
            <button
              type="button"
              onClick={() =>
                setBusqueda(
                  '',
                )
              }
            >
              <X
                size={16}
              />
            </button>
          )}
        </div>
      </section>

      <section className="listado-section">
        {cargando ? (
          <div className="state-card">
            <LoaderCircle
              size={28}
              className="spin"
            />

            <strong>
              Cargando planificaciones...
            </strong>
          </div>
        ) : planificacionesFiltradas.length ===
          0 ? (
          <div className="state-card vacio">
            <div className="state-icon">
              <CalendarDays
                size={34}
              />
            </div>

            <strong>
              {filtro ===
                'ACTUAL' &&
              !existeGestionActual
                ? 'La gestión actual todavía no tiene planificación'
                : 'No hay planificaciones en este filtro'}
            </strong>

            <p>
              Registra las fechas de H1 a H5 para organizar las actividades académicas.
            </p>

            <button
              type="button"
              className="btn-primary"
              onClick={
                abrirNuevaPlanificacion
              }
            >
              <Plus
                size={18}
              />

              Registrar planificación
            </button>
          </div>
        ) : (
          <div className="planificaciones-lista">
            {planificacionesFiltradas.map(
              (
                planificacion,
              ) => {
                const esActual =
                  planificacion.gestion ===
                  gestionActual;

                const hitoEnCurso =
                  planificacion.hitos.find(
                    (
                      hito,
                    ) =>
                      obtenerEstadoHito(
                        hito.fechaInicio,
                        hito.fechaFin,
                      ) ===
                      'EN_CURSO',
                  );

                const proximoHito =
                  planificacion.hitos.find(
                    (
                      hito,
                    ) =>
                      obtenerEstadoHito(
                        hito.fechaInicio,
                        hito.fechaFin,
                      ) ===
                      'PROXIMO',
                  );

                return (
                  <article
                    key={
                      planificacion.id
                    }
                    className={`planificacion-item ${
                      esActual
                        ? 'actual'
                        : ''
                    }`}
                  >
                    <header>
                      <div className="planificacion-titulo">
                        <div className="planificacion-icono">
                          <CalendarDays
                            size={24}
                          />
                        </div>

                        <div>
                          <span>
                            {esActual
                              ? 'Gestión actual'
                              : 'Gestión académica'}
                          </span>

                          <h3>
                            {planificacion.gestion}
                          </h3>

                          <p>
                            {obtenerPeriodoGestion(
                              planificacion.gestion,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="planificacion-badges">
                        {esActual && (
                          <span className="badge-actual">
                            <Sparkles
                              size={14}
                            />

                            Actual
                          </span>
                        )}

                        <span
                          className={`badge-estado ${
                            planificacion.estaActiva
                              ? 'activa'
                              : 'inactiva'
                          }`}
                        >
                          <span className="status-dot" />

                          {planificacion.estaActiva
                            ? 'Activa'
                            : 'Inactiva'}
                        </span>
                      </div>
                    </header>

                    <p className="planificacion-descripcion">
                      {planificacion.descripcion ||
                      'Sin descripción adicional para esta planificación.'}
                    </p>

                    <div className="planificacion-resumen">
                      <div>
                        <strong>
                          {planificacion.puntajeMateria}
                        </strong>

                        <span>
                          puntos
                        </span>
                      </div>

                      <div>
                        <strong>
                          {planificacion.hitos.length}
                        </strong>

                        <span>
                          hitos
                        </span>
                      </div>

                      <div>
                        <strong>
                          {planificacion.totalCursos}
                        </strong>

                        <span>
                          cursos asociados
                        </span>
                      </div>

                      <div>
                        <strong>
                          {hitoEnCurso?.codigo ??
                            proximoHito?.codigo ??
                            'Finalizada'}
                        </strong>

                        <span>
                          {hitoEnCurso
                            ? 'hito en curso'
                            : proximoHito
                              ? 'próximo hito'
                              : 'estado académico'}
                        </span>
                      </div>
                    </div>

                    <div className="hitos-timeline">
                      {planificacion.hitos.map(
                        (
                          hito,
                        ) => {
                          const definicion =
                            definicionesHitos.find(
                              (
                                elemento,
                              ) =>
                                elemento.numero ===
                                hito.numero,
                            );

                          const estado =
                            obtenerEstadoHito(
                              hito.fechaInicio,
                              hito.fechaFin,
                            );

                          return (
                            <div
                              key={
                                hito.id
                              }
                              className={`timeline-hito ${
                                definicion?.clase ??
                                ''
                              } ${estado.toLowerCase()}`}
                            >
                              <div className="timeline-codigo">
                                {estado ===
                                'FINALIZADO' ? (
                                  <Check
                                    size={15}
                                  />
                                ) : (
                                  hito.codigo
                                )}
                              </div>

                              <strong className="timeline-hito-principal">
                                {`HITO ${hito.numero}`}
                              </strong>

                              <p className="timeline-hito-secundario">
                                {hito.nombre}
                              </p>

                              <span>
                                {formatearFecha(
                                  hito.fechaInicio,
                                )}
                              </span>

                              <small>
                                hasta
                                {' '}
                                {formatearFecha(
                                  hito.fechaFin,
                                )}
                              </small>
                            </div>
                          );
                        },
                      )}
                    </div>

                    <footer>
                      <button
                        type="button"
                        className="btn-editar"
                        onClick={() =>
                          abrirEdicion(
                            planificacion,
                          )
                        }
                      >
                        <Edit3
                          size={16}
                        />

                        Editar fechas
                      </button>

                      <button
                        type="button"
                        className={`btn-estado ${
                          planificacion.estaActiva
                            ? 'desactivar'
                            : 'activar'
                        }`}
                        onClick={() =>
                          setPlanificacionEstado(
                            planificacion,
                          )
                        }
                      >
                        <Power
                          size={16}
                        />

                        {planificacion.estaActiva
                          ? 'Desactivar'
                          : 'Activar'}
                      </button>
                    </footer>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      {planificacionEstado && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <div
              className={`confirm-icon ${
                planificacionEstado.estaActiva
                  ? 'warning'
                  : 'success'
              }`}
            >
              <Power
                size={25}
              />
            </div>

            <span className="modal-eyebrow">
              Confirmar acción
            </span>

            <h3>
              {planificacionEstado.estaActiva
                ? '¿Desactivar planificación?'
                : '¿Activar planificación?'}
            </h3>

            <p>
              La planificación de la gestión
              {' '}
              <strong>
                {planificacionEstado.gestion}
              </strong>
              {' '}
              {planificacionEstado.estaActiva
                ? 'dejará de estar disponible para nuevas operaciones.'
                : 'volverá a estar disponible para los cursos asociados.'}
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel"
                disabled={
                  actualizandoEstado
                }
                onClick={() =>
                  setPlanificacionEstado(
                    null,
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={`modal-confirm ${
                  planificacionEstado.estaActiva
                    ? 'disable'
                    : 'enable'
                }`}
                disabled={
                  actualizandoEstado
                }
                onClick={() =>
                  void cambiarEstadoPlanificacion()
                }
              >
                {actualizandoEstado
                  ? 'Procesando...'
                  : planificacionEstado.estaActiva
                    ? 'Desactivar'
                    : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {styles}
      </style>
    </main>
  );
}

function Resumen({
  icono,
  cantidad,
  titulo,
  clase,
}: {
  icono:
    React.ReactNode;
  cantidad:
    string;
  titulo:
    string;
  clase:
    string;
}) {
  return (
    <article className="summary-card">
      <div
        className={`summary-icon ${clase}`}
      >
        {icono}
      </div>

      <div>
        <strong>
          {cantidad}
        </strong>

        <span>
          {titulo}
        </span>
      </div>
    </article>
  );
}

function Toast({
  tipo,
  titulo,
  mensaje,
  onCerrar,
}: {
  tipo:
    TipoToast;
  titulo:
    string;
  mensaje:
    string;
  onCerrar:
    () => void;
}) {
  useEffect(
    () => {
      const timer =
        window.setTimeout(
          onCerrar,
          5500,
        );

      return () =>
        window.clearTimeout(
          timer,
        );
    },
    [
      onCerrar,
    ],
  );

  return (
    <div
      className={`toast ${tipo}`}
    >
      <div className="toast-icon">
        {tipo ===
        'exito' ? (
          <CheckCircle2
            size={22}
          />
        ) : tipo ===
          'advertencia' ? (
          <AlertCircle
            size={22}
          />
        ) : (
          <CircleX
            size={22}
          />
        )}
      </div>

      <div className="toast-content">
        <strong>
          {titulo}
        </strong>

        <p>
          {mensaje}
        </p>
      </div>

      <button
        type="button"
        onClick={
          onCerrar
        }
      >
        <X
          size={16}
        />
      </button>

      <div className="toast-progress" />
    </div>
  );
}

const styles = `
  .hitos-page {
    width: 100%;
    min-width: 0;
    padding: 0 34px 34px;
    color: var(--app-text);
    background: transparent;
  }

  .hitos-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    margin-bottom: 18px;
    padding: 23px 30px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 26px;
    background: var(--app-surface);
    box-shadow:
      var(--app-shadow),
      inset 0 1px 0
      color-mix(
        in srgb,
        var(--app-surface-raised) 72%,
        transparent
      );
  }

  .hitos-header::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: var(--app-accent);
  }

  .hitos-header__content {
    position: relative;
    z-index: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 17px;
  }

  .hitos-header__icon {
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid var(--app-border-strong);
    border-radius: 18px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: var(--app-shadow-sm);
  }

  .hitos-eyebrow,
  .section-eyebrow,
  .modal-eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: 11px;
    font-weight: 850;
    letter-spacing: .15em;
    text-transform: uppercase;
  }

  .hitos-header h1 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 31px;
    font-weight: 900;
    letter-spacing: -.025em;
  }

  .hitos-header p {
    margin: 6px 0 0;
    color: var(--app-text-soft);
    font-size: 14px;
  }

  .hitos-header__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 12px;
  }

  .hitos-header__meta span {
    padding: 5px 9px;
    border: 1px solid var(--app-warning-border);
    border-radius: 999px;
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
    font-size: 10px;
    font-weight: 750;
  }

  .hitos-header__actions {
    position: relative;
    z-index: 1;
    width: 225px;
    display: grid;
    gap: 9px;
    flex-shrink: 0;
  }

  .btn-registrar,
  .btn-primary {
    border: none;
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
    box-shadow:
      0 14px 32px
      color-mix(
        in srgb,
        var(--app-accent) 28%,
        transparent
      );
  }

  .btn-registrar,
  .btn-actualizar,
  .btn-primary,
  .btn-secondary,
  .btn-editar,
  .btn-estado,
  .modal-cancel,
  .modal-confirm {
    min-height: 43px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 999px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }

  .btn-registrar,
  .btn-actualizar {
    width: 100%;
  }

  .btn-actualizar,
  .btn-secondary,
  .btn-editar,
  .modal-cancel {
    border: 1px solid var(--app-border-strong);
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
  }

  .btn-registrar:disabled,
  .btn-actualizar:disabled,
  .btn-primary:disabled,
  .btn-secondary:disabled,
  .btn-editar:disabled,
  .btn-estado:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .btn-registrar:disabled {
    color: var(--app-success);
    border: 1px solid var(--app-success-border);
    background: var(--app-success-bg);
    box-shadow: none;
    opacity: 1;
  }

  .summary-grid {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
    gap: 14px;
    margin-bottom: 18px;
  }

  .summary-card {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 80px;
    padding: 15px 18px;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .summary-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 15px;
  }

  .summary-icon.actual {
    color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .summary-icon.puntos {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .summary-icon.curso {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .summary-card strong {
    display: block;
    color: var(--app-text);
    font-size: 23px;
    font-weight: 900;
  }

  .summary-card span {
    display: block;
    margin-top: 5px;
    color: var(--app-text-soft);
    font-size: 12px;
  }

  .form-card,
  .planificaciones-card {
    margin-bottom: 18px;
    padding: 21px 24px;
    border: 1px solid var(--app-border);
    border-radius: 23px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);
  }

  .form-card {
    position: relative;
    overflow: hidden;
  }

  .form-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 4px;
    background:
      linear-gradient(
        90deg,
        var(--app-accent),
        var(--app-warning),
        transparent 80%
      );
  }

  .form-card-header,
  .planificaciones-card__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }

  .form-card-header h2,
  .planificaciones-card__top h2 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 21px;
    font-weight: 850;
  }

  .form-card-header p,
  .planificaciones-card__top p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 13px;
  }

  .btn-cerrar-form {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    cursor: pointer;
  }

  .gestion-automatica {
    display: grid;
    grid-template-columns: 48px 1fr auto;
    gap: 13px;
    align-items: center;
    margin-top: 20px;
    padding: 16px 18px;
    border: 1px solid var(--app-success-border);
    border-radius: 17px;
    background: var(--app-success-bg);
  }

  .gestion-automatica__icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: var(--app-success);
    background: var(--app-surface);
  }

  .gestion-automatica span,
  .gestion-automatica strong,
  .gestion-automatica p {
    display: block;
  }

  .gestion-automatica > div:nth-child(2) > span {
    color: var(--app-success);
    font-size: 10px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .gestion-automatica > div:nth-child(2) > strong {
    margin-top: 3px;
    color: var(--app-text);
    font-size: 24px;
  }

  .gestion-automatica p {
    margin: 3px 0 0;
    color: var(--app-text-soft);
    font-size: 11px;
  }

  .progreso-formulario {
    padding: 10px 13px;
    border-radius: 13px;
    color: var(--app-success);
    background: var(--app-surface);
    text-align: center;
  }

  .progreso-formulario strong {
    font-size: 18px;
  }

  .progreso-formulario span {
    margin-top: 3px;
    font-size: 9px;
  }

  .hitos-form {
    margin-top: 20px;
  }

  .descripcion-field {
    display: grid;
    gap: 7px;
  }

  .descripcion-field > span,
  .fechas-grid label > span {
    color: var(--app-text-secondary);
    font-size: 13px;
    font-weight: 700;
  }

  .descripcion-field input {
    width: 100%;
    min-height: 46px;
    box-sizing: border-box;
    padding: 12px 14px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    outline: none;
    color: var(--app-text);
    background: var(--app-input-bg);
    font-family: inherit;
  }

  .descripcion-field input:focus,
  .input-fecha:focus-within {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 4px var(--app-input-ring);
  }

  .descripcion-field small {
    justify-self: end;
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .hitos-grid {
    display: grid;
    gap: 14px;
    margin-top: 20px;
  }

  .hito-form-card {
    position: relative;
    overflow: hidden;
    padding: 19px 20px;
    border: 1px solid var(--app-border);
    border-radius: 19px;
    background: var(--app-surface-alt);
  }

  .hito-form-card.completo {
    border-color: var(--app-success-border);
  }

  .hito-accento {
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
  }

  .violeta .hito-accento { background: #7c3aed; }
  .naranja .hito-accento { background: #ea580c; }
  .azul .hito-accento { background: #2563eb; }
  .verde .hito-accento { background: #16a34a; }
  .rosado .hito-accento { background: #db2777; }

  .hito-form-card > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
  }

  .hito-identidad {
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .hito-codigo {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 15px;
    font-size: 16px;
    font-weight: 900;
  }

  .violeta .hito-codigo { color: #7c3aed; background: color-mix(in srgb, #7c3aed 12%, var(--app-surface)); }
  .naranja .hito-codigo { color: #ea580c; background: color-mix(in srgb, #ea580c 12%, var(--app-surface)); }
  .azul .hito-codigo { color: #2563eb; background: color-mix(in srgb, #2563eb 12%, var(--app-surface)); }
  .verde .hito-codigo { color: #16a34a; background: color-mix(in srgb, #16a34a 12%, var(--app-surface)); }
  .rosado .hito-codigo { color: #db2777; background: color-mix(in srgb, #db2777 12%, var(--app-surface)); }

  .hito-identidad span {
    color: var(--app-text-muted);
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .hito-identidad h3 {
    margin: 3px 0 0;
    color: var(--app-text);
    font-size: 18px;
  }

  .hito-identidad h3.hito-titulo-principal {
    margin-top: 3px;
    font-size: 31px;
    line-height: 1;
    font-weight: 950;
    letter-spacing: -.04em;
  }

  .hito-form-card.violeta .hito-titulo-principal {
    color: #7c3aed;
  }

  .hito-form-card.naranja .hito-titulo-principal {
    color: #ea580c;
  }

  .hito-form-card.azul .hito-titulo-principal {
    color: #2563eb;
  }

  .hito-form-card.verde .hito-titulo-principal {
    color: #16a34a;
  }

  .hito-form-card.rosado .hito-titulo-principal {
    color: #db2777;
  }

  .hito-identidad p {
    margin: 4px 0 0;
    color: var(--app-text-soft);
    font-size: 12px;
  }

  .hito-identidad p.hito-nombre-secundario {
    margin-top: 7px;
    color: var(--app-text);
    font-size: 17px;
    font-weight: 850;
  }

  .hito-descripcion-extra {
    display: block;
    margin-top: 5px;
    color: var(--app-text-soft);
    font-size: 11px;
    line-height: 1.45;
  }

  .estado-completo {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    font-size: 10px;
    font-weight: 800;
  }

  .estado-completo.listo {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .hito-puntajes {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 14px;
  }

  .hito-puntajes span {
    padding: 6px 9px;
    border: 1px solid var(--app-border-soft);
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font-size: 10px;
  }

  .hito-puntajes .puntaje-total {
    color: var(--app-success);
    border-color: var(--app-success-border);
    background: var(--app-success-bg);
  }

  .fechas-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 13px;
    margin-top: 15px;
  }

  .fechas-grid label {
    display: grid;
    gap: 7px;
  }

  .input-fecha {
    min-height: 48px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 13px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-input-bg);
  }

  .input-fecha input {
    width: 100%;
    min-height: 46px;
    border: none;
    outline: none;
    color: var(--app-text);
    background: transparent;
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    color-scheme: light;
  }

  html[data-theme='oscuro']
  .input-fecha input {
    color-scheme: dark;
  }

  .hito-form-card > footer {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 13px;
    padding-top: 12px;
    border-top: 1px solid var(--app-border-soft);
    color: var(--app-text-muted);
    font-size: 11px;
  }

  .errores-formulario {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 17px;
    padding: 14px;
    border: 1px solid var(--app-danger-border);
    border-radius: 14px;
    color: var(--app-danger-strong);
    background: var(--app-danger-bg);
  }

  .errores-formulario strong,
  .errores-formulario span {
    display: block;
  }

  .errores-formulario strong {
    font-size: 13px;
  }

  .errores-formulario span {
    margin-top: 4px;
    font-size: 10px;
  }

  .form-actions,
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }

  .cantidad-registros {
    padding: 6px 11px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 12px;
    font-weight: 800;
  }

  .filtros {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 18px;
  }

  .filtros button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    border: 1px solid var(--app-input-border);
    border-radius: 999px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    font-family: inherit;
    font-size: 12px;
    font-weight: 750;
    cursor: pointer;
  }

  .filtros button.active {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-accent-softer)
      );
  }

  .filtros button span {
    min-width: 21px;
    height: 21px;
    display: grid;
    place-items: center;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--app-accent-softer);
    font-size: 10px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 14px;
    padding: 10px 14px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    color: var(--app-text-muted);
    background: var(--app-surface);
  }

  .search-box input {
    width: 100%;
    border: none;
    outline: none;
    color: var(--app-text);
    background: transparent;
    font-family: inherit;
  }

  .search-box button {
    display: grid;
    place-items: center;
    padding: 0;
    border: none;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }

  .state-card {
    min-height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    padding: 25px;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .state-card.vacio {
    flex-direction: column;
    text-align: center;
  }

  .state-icon {
    width: 68px;
    height: 68px;
    display: grid;
    place-items: center;
    border-radius: 20px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .state-card strong {
    color: var(--app-text);
    font-size: 16px;
  }

  .state-card p {
    max-width: 520px;
    margin: 0 0 5px;
    color: var(--app-text-soft);
    font-size: 12px;
  }

  .planificaciones-lista {
    display: grid;
    gap: 15px;
  }

  .planificacion-item {
    position: relative;
    overflow: hidden;
    padding: 20px 22px;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .planificacion-item.actual {
    border-color: var(--app-accent);
  }

  .planificacion-item.actual::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: var(--app-accent);
  }

  .planificacion-item > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
  }

  .planificacion-titulo {
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .planificacion-icono {
    width: 53px;
    height: 53px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 16px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .planificacion-titulo span {
    color: var(--app-accent-dark);
    font-size: 10px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .planificacion-titulo h3 {
    margin: 3px 0 0;
    color: var(--app-text);
    font-size: 23px;
  }

  .planificacion-titulo p {
    margin: 3px 0 0;
    color: var(--app-text-soft);
    font-size: 11px;
  }

  .planificacion-badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .badge-actual,
  .badge-estado {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 850;
  }

  .badge-actual {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .badge-estado.activa {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .badge-estado.inactiva {
    color: var(--app-text-muted);
    background: var(--app-surface-disabled);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .planificacion-descripcion {
    margin: 14px 0 0;
    color: var(--app-text-soft);
    font-size: 12px;
  }

  .planificacion-resumen {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 9px;
    margin-top: 15px;
  }

  .planificacion-resumen > div {
    padding: 12px;
    border: 1px solid var(--app-border-soft);
    border-radius: 13px;
    background: var(--app-surface-alt);
  }

  .planificacion-resumen strong,
  .planificacion-resumen span {
    display: block;
  }

  .planificacion-resumen strong {
    color: var(--app-text);
    font-size: 19px;
  }

  .planificacion-resumen span {
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .hitos-timeline {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-top: 15px;
  }

  .timeline-hito {
    position: relative;
    min-height: 142px;
    padding: 13px;
    overflow: hidden;
    border: 1px solid var(--app-border-soft);
    border-radius: 15px;
    background: var(--app-surface-alt);
    transition:
      transform .18s ease,
      box-shadow .18s ease,
      border-color .18s ease;
  }

  .timeline-hito::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 4px;
  }

  .timeline-hito.violeta::before {
    background: #7c3aed;
  }

  .timeline-hito.naranja::before {
    background: #ea580c;
  }

  .timeline-hito.azul::before {
    background: #2563eb;
  }

  .timeline-hito.verde::before {
    background: #16a34a;
  }

  .timeline-hito.rosado::before {
    background: #db2777;
  }

  .timeline-hito:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow-sm);
  }

  .timeline-hito.en_curso {
    border-color: var(--app-success-border);
    background: var(--app-success-bg);
  }

  .timeline-hito.finalizado {
    opacity: .76;
  }

  .timeline-codigo {
    width: 33px;
    height: 33px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 900;
  }

  .timeline-hito.violeta .timeline-codigo { color: #7c3aed; background: color-mix(in srgb, #7c3aed 12%, var(--app-surface)); }
  .timeline-hito.naranja .timeline-codigo { color: #ea580c; background: color-mix(in srgb, #ea580c 12%, var(--app-surface)); }
  .timeline-hito.azul .timeline-codigo { color: #2563eb; background: color-mix(in srgb, #2563eb 12%, var(--app-surface)); }
  .timeline-hito.verde .timeline-codigo { color: #16a34a; background: color-mix(in srgb, #16a34a 12%, var(--app-surface)); }
  .timeline-hito.rosado .timeline-codigo { color: #db2777; background: color-mix(in srgb, #db2777 12%, var(--app-surface)); }

  .timeline-hito strong,
  .timeline-hito span,
  .timeline-hito small {
    display: block;
  }

  .timeline-hito strong {
    margin-top: 8px;
    color: var(--app-text);
    font-size: 10px;
  }

  .timeline-hito strong.timeline-hito-principal {
    margin-top: 9px;
    font-size: 16px;
    font-weight: 950;
    letter-spacing: -.02em;
  }

  .timeline-hito.violeta .timeline-hito-principal {
    color: #7c3aed;
  }

  .timeline-hito.naranja .timeline-hito-principal {
    color: #ea580c;
  }

  .timeline-hito.azul .timeline-hito-principal {
    color: #2563eb;
  }

  .timeline-hito.verde .timeline-hito-principal {
    color: #16a34a;
  }

  .timeline-hito.rosado .timeline-hito-principal {
    color: #db2777;
  }

  .timeline-hito-secundario {
    margin: 4px 0 0;
    color: var(--app-text);
    font-size: 10px;
    font-weight: 750;
    line-height: 1.3;
  }

  .timeline-hito span {
    margin-top: 7px;
    color: var(--app-text-secondary);
    font-size: 8px;
  }

  .timeline-hito small {
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .planificacion-item > footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 15px;
    padding-top: 14px;
    border-top: 1px solid var(--app-border-soft);
  }

  .btn-estado {
    border: 1px solid;
  }

  .btn-estado.desactivar {
    border-color: var(--app-danger-border);
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .btn-estado.activar {
    border-color: var(--app-success-border);
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 8000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: var(--app-overlay);
    backdrop-filter: blur(6px);
  }

  .confirm-modal {
    width: min(430px, 100%);
    padding: 28px;
    border: 1px solid var(--app-border);
    border-radius: 25px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-modal);
  }

  .confirm-icon {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    margin-bottom: 18px;
    border-radius: 17px;
  }

  .confirm-icon.warning {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .confirm-icon.success {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .confirm-modal h3 {
    margin: 7px 0 0;
    color: var(--app-text);
    font-size: 21px;
  }

  .confirm-modal p {
    margin: 7px 0 0;
    color: var(--app-text-soft);
    font-size: 13px;
    line-height: 1.55;
  }

  .modal-confirm {
    border: none;
    color: #fff;
  }

  .modal-confirm.disable {
    background: var(--app-danger);
  }

  .modal-confirm.enable {
    background: var(--app-success);
  }

  .toast {
    position: fixed;
    top: 25px;
    right: 28px;
    z-index: 9999;
    width: min(410px, calc(100vw - 40px));
    display: grid;
    grid-template-columns: 42px 1fr 28px;
    gap: 11px;
    padding: 15px 15px 18px;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: var(--app-shadow-lg);
  }

  .toast.exito {
    border: 1px solid var(--app-success-border);
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .toast.error {
    border: 1px solid var(--app-danger-border);
    color: var(--app-danger-strong);
    background: var(--app-danger-bg);
  }

  .toast.advertencia {
    border: 1px solid var(--app-warning-border);
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
  }

  .toast-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    background: var(--app-surface);
  }

  .toast-content strong {
    display: block;
    font-size: 14px;
  }

  .toast-content p {
    margin: 4px 0 0;
    color: var(--app-text-soft);
    font-size: 12px;
  }

  .toast button {
    border: none;
    color: var(--app-text-muted);
    background: transparent;
    cursor: pointer;
  }

  .toast-progress {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 4px;
    transform-origin: left center;
    animation: toastProgress 5.5s linear forwards;
  }

  .toast.exito .toast-progress {
    background: var(--app-success);
  }

  .toast.error .toast-progress {
    background: var(--app-danger);
  }

  .toast.advertencia .toast-progress {
    background: var(--app-warning);
  }

  .spin {
    animation: spin .8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes toastProgress {
    from {
      transform: scaleX(1);
    }

    to {
      transform: scaleX(0);
    }
  }

  @media (max-width: 1100px) {
    .hitos-timeline {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 850px) {
    .hitos-page {
      padding: 18px;
    }

    .hitos-header {
      align-items: stretch;
      flex-direction: column;
    }

    .hitos-header__actions,
    .btn-registrar,
    .btn-actualizar {
      width: 100%;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .gestion-automatica {
      grid-template-columns: 48px 1fr;
    }

    .progreso-formulario {
      grid-column: 1 / -1;
    }

    .planificacion-resumen {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 600px) {
    .hitos-page {
      padding: 12px;
    }

    .form-card,
    .planificaciones-card,
    .planificacion-item {
      padding: 18px 16px;
    }

    .form-card-header,
    .planificaciones-card__top,
    .hito-form-card > header,
    .planificacion-item > header,
    .planificacion-item > footer,
    .form-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .fechas-grid,
    .planificacion-resumen,
    .hitos-timeline {
      grid-template-columns: 1fr;
    }

    .btn-primary,
    .btn-secondary,
    .btn-editar,
    .btn-estado {
      width: 100%;
    }

    .planificacion-badges {
      justify-content: flex-start;
    }
  }
`;