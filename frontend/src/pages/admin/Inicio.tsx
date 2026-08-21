import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Activity,
  AlertCircle,
  ArrowRight,
  BellRing,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleX,
  Clock3,
  GraduationCap,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../../auth/AuthContext';

type EstadoCurso =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'FINALIZADO';

type EstadoMateria =
  | 'ACTIVA'
  | 'INACTIVA';

type TipoActividad =
  | 'USUARIO'
  | 'MATERIA'
  | 'CURSO';

type ResumenUsuarios = {
  total: number;
  estudiantes: number;
  docentes: number;
  administradores: number;
  activos: number;
  desactivados: number;
  cuentasActivadas: number;
  pendientesActivacion: number;
};

type ResumenMaterias = {
  total: number;
  activas: number;
  inactivas: number;
};

type ResumenCursos = {
  total: number;
  activos: number;
  inactivos: number;
  finalizados: number;
};

type EstadoPlanificacionDashboard =
  | 'SIN_PLANIFICACION'
  | 'PROXIMA'
  | 'EN_CURSO'
  | 'FINALIZADA';

type HitoDashboard = {
  id: number;
  numero: number;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
};

type ResumenHitosDashboard = {
  tienePlanificacion: boolean;
  gestion: string;
  planificacionId: number | null;
  estaActiva: boolean;
  estado: EstadoPlanificacionDashboard;
  hitoActual: HitoDashboard | null;
  proximoHito: HitoDashboard | null;
  totalHitos: number;
  puntajeTotal: number;
};

type CursoReciente = {
  id: number;
  materia: string;
  codigo: string;
  gestion: string;
  paralelo: string;
  semestre: number;
  estado: EstadoCurso;
  docente: string;
  creadoEn: string;
};

type ActividadReciente = {
  id: string;
  tipo: TipoActividad;
  titulo: string;
  descripcion: string;
  fecha: string;
  estado:
    | EstadoCurso
    | EstadoMateria
    | 'ACTIVO'
    | 'INACTIVO';
};

type PrioridadAlerta =
  | 'ALTA'
  | 'MEDIA'
  | 'BAJA';

type AlertaDashboard = {
  id: string;
  tipo:
    | 'USUARIOS'
    | 'MATERIAS'
    | 'CURSOS'
    | 'HITOS';
  prioridad: PrioridadAlerta;
  titulo: string;
  descripcion: string;
  cantidad: number;
  ruta: string;
  accion: string;
};

type ResumenAlertas = {
  total: number;
  altas: number;
  medias: number;
  bajas: number;
};

type DashboardRespuesta = {
  gestionActual: string;
  actualizadoEn: string;
  usuarios: ResumenUsuarios;
  materias: ResumenMaterias;
  cursos: ResumenCursos;
  hitos: ResumenHitosDashboard;
  cursosRecientes: CursoReciente[];
  actividadReciente: ActividadReciente[];
  alertas: AlertaDashboard[];
  resumenAlertas: ResumenAlertas;
};

type TipoToast =
  | 'exito'
  | 'error';

type ToastEstado = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const CLAVE_CACHE_DASHBOARD =
  'iusacademy_dashboard_cache';

const DURACION_CACHE_DASHBOARD =
  60_000;

const HITOS_VISUALES = [
  {
    numero: 1,
    codigo: 'H1',
    titulo: 'HITO 1',
    nombre: 'Retroalimentación',
    clase: 'violeta',
  },
  {
    numero: 2,
    codigo: 'H2',
    titulo: 'HITO 2',
    nombre: 'Primer parcial',
    clase: 'naranja',
  },
  {
    numero: 3,
    codigo: 'H3',
    titulo: 'HITO 3',
    nombre: 'Segundo parcial',
    clase: 'azul',
  },
  {
    numero: 4,
    codigo: 'H4',
    titulo: 'HITO 4',
    nombre: 'Tercer parcial',
    clase: 'verde',
  },
  {
    numero: 5,
    codigo: 'H5',
    titulo: 'HITO 5',
    nombre: 'Evaluación final',
    clase: 'rosado',
  },
] as const;

type DashboardCache = {
  guardadoEn: number;
  datos: DashboardRespuesta;
};

let peticionDashboardActiva:
  Promise<DashboardRespuesta> |
  null = null;

const datosIniciales:
  DashboardRespuesta = {
    gestionActual: '',
    actualizadoEn:
      new Date().toISOString(),

    usuarios: {
      total: 0,
      estudiantes: 0,
      docentes: 0,
      administradores: 0,
      activos: 0,
      desactivados: 0,
      cuentasActivadas: 0,
      pendientesActivacion: 0,
    },

    materias: {
      total: 0,
      activas: 0,
      inactivas: 0,
    },

    cursos: {
      total: 0,
      activos: 0,
      inactivos: 0,
      finalizados: 0,
    },

    hitos: {
      tienePlanificacion: false,
      gestion: '',
      planificacionId: null,
      estaActiva: false,
      estado: 'SIN_PLANIFICACION',
      hitoActual: null,
      proximoHito: null,
      totalHitos: 0,
      puntajeTotal: 0,
    },

    cursosRecientes: [],
    actividadReciente: [],
    alertas: [],

    resumenAlertas: {
      total: 0,
      altas: 0,
      medias: 0,
      bajas: 0,
    },
  };

function obtenerDashboardGuardado():
  DashboardCache | null {
  try {
    const valor =
      sessionStorage.getItem(
        CLAVE_CACHE_DASHBOARD,
      );

    if (!valor) {
      return null;
    }

    const cache =
      JSON.parse(
        valor,
      ) as Partial<DashboardCache>;

    if (
      typeof cache.guardadoEn !==
        'number' ||
      !cache.datos ||
      !cache.datos.hitos
    ) {
      sessionStorage.removeItem(
        CLAVE_CACHE_DASHBOARD,
      );

      return null;
    }

    return cache as DashboardCache;
  } catch {
    sessionStorage.removeItem(
      CLAVE_CACHE_DASHBOARD,
    );

    return null;
  }
}

function guardarDashboard(
  datos:
    DashboardRespuesta,
) {
  try {
    const cache:
      DashboardCache = {
        guardadoEn:
          Date.now(),

        datos,
      };

    sessionStorage.setItem(
      CLAVE_CACHE_DASHBOARD,
      JSON.stringify(
        cache,
      ),
    );
  } catch {
    /*
     * El dashboard puede seguir funcionando
     * aunque el navegador no permita guardar cache.
     */
  }
}

function crearHeadersAutorizados(
  accessToken: string,
): HeadersInit {
  return {
    Authorization:
      `Bearer ${accessToken}`,
  };
}

function obtenerMensajeError(
  datos: unknown,
  mensajePredeterminado:
    string,
): string {
  if (
    !datos ||
    typeof datos !== 'object'
  ) {
    return mensajePredeterminado;
  }

  const respuesta =
    datos as {
      message?:
        | string
        | string[];

      mensaje?: string;
      error?: string;
    };

  if (
    Array.isArray(
      respuesta.message,
    )
  ) {
    return respuesta.message.join(
      '. ',
    );
  }

  return (
    respuesta.message ||
    respuesta.mensaje ||
    respuesta.error ||
    mensajePredeterminado
  );
}

async function solicitarDashboard(
  accessToken: string,
): Promise<DashboardRespuesta> {
  if (
    peticionDashboardActiva
  ) {
    return peticionDashboardActiva;
  }

  peticionDashboardActiva =
    (async () => {
      const respuesta =
        await fetch(
          `${API_URL}/admin/dashboard`,
          {
            method:
              'GET',

            headers:
              crearHeadersAutorizados(
                accessToken,
              ),
          },
        );

      const tipoContenido =
        respuesta.headers.get(
          'content-type',
        );

      const respuestaJson =
        tipoContenido?.includes(
          'application/json',
        )
          ? await respuesta
              .json()
              .catch(
                () => ({}),
              )
          : {};

      if (
        !respuesta.ok
      ) {
        throw new Error(
          obtenerMensajeError(
            respuestaJson,
            'No fue posible cargar el dashboard.',
          ),
        );
      }

      return respuestaJson as
        DashboardRespuesta;
    })();

  try {
    return await peticionDashboardActiva;
  } finally {
    peticionDashboardActiva =
      null;
  }
}

function formatearFecha(
  valor: string,
): string {
  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime(),
    )
  ) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(fecha);
}

function formatearTiempoRelativo(
  valor: string,
): string {
  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime(),
    )
  ) {
    return 'Fecha no disponible';
  }

  const diferencia =
    Date.now() -
    fecha.getTime();

  const minutos =
    Math.floor(
      diferencia /
      60_000,
    );

  if (
    minutos <
    1
  ) {
    return 'Hace un momento';
  }

  if (
    minutos <
    60
  ) {
    return `Hace ${minutos} min`;
  }

  const horas =
    Math.floor(
      minutos /
      60,
    );

  if (
    horas <
    24
  ) {
    return `Hace ${horas} h`;
  }

  const dias =
    Math.floor(
      horas /
      24,
    );

  if (
    dias <
    7
  ) {
    return `Hace ${dias} d`;
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      dateStyle: 'medium',
    },
  ).format(fecha);
}

function obtenerSaludo(): string {
  const hora =
    new Date().getHours();

  if (
    hora <
    12
  ) {
    return 'Buenos días';
  }

  if (
    hora <
    19
  ) {
    return 'Buenas tardes';
  }

  return 'Buenas noches';
}

function obtenerNombreCorto(
  nombres?: string,
): string {
  const nombre =
    nombres
      ?.trim()
      .split(
        /\s+/,
      )[0];

  return nombre ||
    'Administrador';
}

function calcularPorcentaje(
  cantidad: number,
  total: number,
): number {
  if (
    total <=
    0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (
        cantidad /
        total
      ) *
      100,
    ),
  );
}

export default function AdminInicio() {
  const navigate =
    useNavigate();

  const {
    sesion,
    accessToken,
  } = useAuth();

  const cacheInicial =
    useMemo(
      () =>
        obtenerDashboardGuardado(),
      [],
    );

  const [
    datos,
    setDatos,
  ] = useState<DashboardRespuesta>(
    () =>
      cacheInicial?.datos ??
      datosIniciales,
  );

  const [
    cargando,
    setCargando,
  ] = useState(
    () =>
      !cacheInicial,
  );

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    toast,
    setToast,
  ] = useState<ToastEstado>({
    visible: false,
    tipo: 'exito',
    titulo: '',
    mensaje: '',
  });

  const mostrarToast = useCallback(
    (
      tipo: TipoToast,
      titulo: string,
      mensaje: string,
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

  const cerrarToast = useCallback(
    () => {
      setToast(
        (
          anterior,
        ) => ({
          ...anterior,
          visible: false,
        }),
      );
    },
    [],
  );

  const obtenerDashboard =
    useCallback(
      async (
        mostrarNotificacion =
          false,
      ) => {
        if (!accessToken) {
          setError(
            'No existe una sesión válida.',
          );

          setCargando(
            false,
          );

          return;
        }

        try {
          setError(
            null,
          );

          if (
            mostrarNotificacion
          ) {
            setActualizando(
              true,
            );
          } else if (
            !cacheInicial
          ) {
            setCargando(
              true,
            );
          }

          const respuestaJson =
            await solicitarDashboard(
              accessToken,
            );

          setDatos(
            respuestaJson,
          );

          guardarDashboard(
            respuestaJson,
          );

          if (
            mostrarNotificacion
          ) {
            mostrarToast(
              'exito',
              'Dashboard actualizado',
              'La información fue actualizada correctamente.',
            );
          }
        } catch (
          errorActual
        ) {
          console.error(
            errorActual,
          );

          const mensaje =
            errorActual instanceof Error
              ? errorActual.message
              : 'No fue posible cargar el dashboard.';

          setError(
            mensaje,
          );

          if (
            mostrarNotificacion
          ) {
            mostrarToast(
              'error',
              'No se pudo actualizar',
              mensaje,
            );
          }
        } finally {
          setCargando(
            false,
          );

          setActualizando(
            false,
          );
        }
      },
      [
        accessToken,
        cacheInicial,
        mostrarToast,
      ],
    );

  useEffect(
    () => {
      const cacheSigueVigente =
        cacheInicial &&
        Date.now() -
          cacheInicial.guardadoEn <
          DURACION_CACHE_DASHBOARD;

      if (
        cacheSigueVigente
      ) {
        return;
      }

      void obtenerDashboard();
    },
    [
      cacheInicial,
      obtenerDashboard,
    ],
  );

  const porcentajeActivadas =
    useMemo(
      () =>
        calcularPorcentaje(
          datos.usuarios
            .cuentasActivadas,
          datos.usuarios.total,
        ),
      [
        datos.usuarios,
      ],
    );

  const porcentajeActivos =
    useMemo(
      () =>
        calcularPorcentaje(
          datos.usuarios.activos,
          datos.usuarios.total,
        ),
      [
        datos.usuarios,
      ],
    );

  const maximoRol =
    useMemo(
      () =>
        Math.max(
          datos.usuarios
            .estudiantes,
          datos.usuarios
            .docentes,
          datos.usuarios
            .administradores,
          1,
        ),
      [
        datos.usuarios,
      ],
    );

  const nombreAdministrador =
    obtenerNombreCorto(
      sesion?.usuario?.nombres,
    );

  const hitoVisible =
    datos.hitos.hitoActual ??
    datos.hitos.proximoHito;

  const tituloEstadoHitos =
    datos.hitos.estado ===
      'SIN_PLANIFICACION'
      ? 'Planificación pendiente'
      : datos.hitos.estado ===
          'EN_CURSO'
        ? `${datos.hitos.hitoActual?.codigo ?? 'Hito'} en curso`
        : datos.hitos.estado ===
            'PROXIMA'
          ? `Próximo: ${datos.hitos.proximoHito?.codigo ?? 'Hito'}`
          : 'Gestión finalizada';

  const descripcionEstadoHitos =
    datos.hitos.estado ===
      'SIN_PLANIFICACION'
      ? `La gestión ${datos.gestionActual || 'actual'} todavía no tiene fechas configuradas.`
      : datos.hitos.estado ===
          'EN_CURSO'
        ? `${datos.hitos.hitoActual?.nombre ?? 'Hito académico'} · ${formatearFecha(datos.hitos.hitoActual?.fechaInicio ?? datos.actualizadoEn)} al ${formatearFecha(datos.hitos.hitoActual?.fechaFin ?? datos.actualizadoEn)}`
        : datos.hitos.estado ===
            'PROXIMA'
          ? `${datos.hitos.proximoHito?.nombre ?? 'Hito académico'} inicia el ${formatearFecha(datos.hitos.proximoHito?.fechaInicio ?? datos.actualizadoEn)}`
          : 'Todos los hitos de la gestión concluyeron.';

  const numeroHitoActual =
    datos.hitos.hitoActual?.numero ??
    null;

  const numeroProximoHito =
    datos.hitos.proximoHito?.numero ??
    null;

  const obtenerEstadoVisualHito =
    (
      numero:
        number,
    ):
      | 'SIN_CONFIGURAR'
      | 'FINALIZADO'
      | 'ACTUAL'
      | 'PROXIMO'
      | 'PENDIENTE' => {
      if (
        datos.hitos.estado ===
        'SIN_PLANIFICACION'
      ) {
        return 'SIN_CONFIGURAR';
      }

      if (
        datos.hitos.estado ===
        'FINALIZADA'
      ) {
        return 'FINALIZADO';
      }

      if (
        numeroHitoActual !==
        null
      ) {
        if (
          numero <
          numeroHitoActual
        ) {
          return 'FINALIZADO';
        }

        if (
          numero ===
          numeroHitoActual
        ) {
          return 'ACTUAL';
        }

        return 'PENDIENTE';
      }

      if (
        numeroProximoHito !==
        null
      ) {
        if (
          numero <
          numeroProximoHito
        ) {
          return 'FINALIZADO';
        }

        if (
          numero ===
          numeroProximoHito
        ) {
          return 'PROXIMO';
        }
      }

      return 'PENDIENTE';
    };

  const tarjetasPrincipales = [
    {
      titulo:
        'Usuarios',
      cantidad:
        datos.usuarios.total,
      descripcion:
        'Cuentas registradas',
      clase:
        'usuarios',
      icono:
        <UsersRound size={21} />,
      ruta:
        '/admin/usuarios',
    },
    {
      titulo:
        'Estudiantes',
      cantidad:
        datos.usuarios
          .estudiantes,
      descripcion:
        'Perfiles estudiantiles',
      clase:
        'estudiantes',
      icono:
        <GraduationCap size={21} />,
      ruta:
        '/admin/usuarios',
    },
    {
      titulo:
        'Docentes',
      cantidad:
        datos.usuarios
          .docentes,
      descripcion:
        'Docentes registrados',
      clase:
        'docentes',
      icono:
        <UserCheck size={21} />,
      ruta:
        '/admin/usuarios',
    },
    {
      titulo:
        'Administradores',
      cantidad:
        datos.usuarios
          .administradores,
      descripcion:
        'Control del sistema',
      clase:
        'administradores',
      icono:
        <ShieldCheck size={21} />,
      ruta:
        '/admin/usuarios',
    },
  ];

  const tarjetasAcademicas = [
    {
      titulo:
        'Materias',
      cantidad:
        datos.materias.total,
      descripcion:
        `${datos.materias.activas} activas`,
      clase:
        'materias',
      icono:
        <BookOpen size={21} />,
      ruta:
        '/admin/materias',
    },
    {
      titulo:
        'Materias inactivas',
      cantidad:
        datos.materias
          .inactivas,
      descripcion:
        'Fuera de disponibilidad',
      clase:
        'materias-inactivas',
      icono:
        <Layers3 size={21} />,
      ruta:
        '/admin/materias',
    },
    {
      titulo:
        'Cursos activos',
      cantidad:
        datos.cursos.activos,
      descripcion:
        'En desarrollo',
      clase:
        'cursos-activos',
      icono:
        <Activity size={21} />,
      ruta:
        '/admin/cursos',
    },
    {
      titulo:
        'Cursos finalizados',
      cantidad:
        datos.cursos
          .finalizados,
      descripcion:
        'Historial académico',
      clase:
        'cursos-finalizados',
      icono:
        <CheckCircle2 size={21} />,
      ruta:
        '/admin/cursos',
    },
  ];

  if (
    cargando
  ) {
    return (
      <main className="dashboard-page">
        <DashboardSkeleton />

        <style>
          {styles}
        </style>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      {toast.visible && (
        <Toast
          tipo={toast.tipo}
          titulo={toast.titulo}
          mensaje={toast.mensaje}
          onCerrar={cerrarToast}
        />
      )}

      <section className="hero-dashboard">
        <div className="hero-dashboard__content">
          <div className="hero-icon">
            <Sparkles size={25} />
          </div>

          <div>
            <span className="dashboard-eyebrow">
              Panel de administración
            </span>

            <h1>
              {obtenerSaludo()},{' '}
              {nombreAdministrador}
            </h1>

            <p>
              Aquí tienes una vista general del estado actual de IusAcademy.
            </p>

            <div className="hero-meta">
              <span>
                Gestión{' '}
                {datos.gestionActual ||
                  'actual'}
              </span>

              <span>
                Actualizado{' '}
                {formatearTiempoRelativo(
                  datos.actualizadoEn,
                )}
              </span>

              <span>
                Área Civil
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-actualizar"
          onClick={() =>
            void obtenerDashboard(
              true,
            )
          }
          disabled={
            actualizando
          }
        >
          <RefreshCw
            size={18}
            className={
              actualizando
                ? 'girando'
                : ''
            }
          />

          {actualizando
            ? 'Actualizando...'
            : 'Actualizar datos'}
        </button>
      </section>

      {error && (
        <section className="dashboard-error">
          <CircleX size={21} />

          <div>
            <strong>
              No se pudo cargar toda la información
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void obtenerDashboard(
                true,
              )
            }
          >
            Reintentar
          </button>
        </section>
      )}

      <section className="academic-overview-card">
        <div className="academic-overview__heading">
          <div className="academic-overview__title">
            <div className="academic-overview__icon">
              <CalendarDays
                size={22}
              />
            </div>

            <div>
              <span className="section-eyebrow">
                Planificación académica
              </span>

              <h2>
                Gestión
                {' '}
                {datos.hitos.gestion ||
                datos.gestionActual ||
                'actual'}
              </h2>

              <p>
                {datos.hitos.tienePlanificacion
                  ? descripcionEstadoHitos
                  : 'Registra las fechas institucionales de H1 a H5 para organizar el semestre.'}
              </p>
            </div>
          </div>

          <div className="academic-overview__actions">
            <span
              className={`academic-overview__status ${datos.hitos.estado.toLowerCase()}`}
            >
              {datos.hitos.estado ===
              'EN_CURSO'
                ? 'En curso'
                : datos.hitos.estado ===
                    'PROXIMA'
                  ? 'Próximo hito'
                  : datos.hitos.estado ===
                      'FINALIZADA'
                    ? 'Finalizada'
                    : 'Pendiente'}
            </span>

            <button
              type="button"
              className="academic-overview__button"
              onClick={() =>
                navigate(
                  '/admin/hitos',
                )
              }
            >
              {datos.hitos.tienePlanificacion
                ? 'Ver planificación'
                : 'Registrar'}

              <ArrowRight
                size={15}
              />
            </button>
          </div>
        </div>

        {datos.hitos.tienePlanificacion ? (
          <>
            <div className="academic-hitos-row">
              {HITOS_VISUALES.map(
                (
                  hito,
                ) => {
                  const estado =
                    obtenerEstadoVisualHito(
                      hito.numero,
                    );

                  return (
                    <article
                      key={
                        hito.codigo
                      }
                      className={`academic-hito ${hito.clase} ${estado.toLowerCase()}`}
                    >
                      <div className="academic-hito__top">
                        <span className="academic-hito__code">
                          {estado ===
                          'FINALIZADO' ? (
                            <Check
                              size={14}
                            />
                          ) : (
                            hito.codigo
                          )}
                        </span>

                        {estado ===
                          'ACTUAL' && (
                          <span className="academic-hito__badge current">
                            Actual
                          </span>
                        )}

                        {estado ===
                          'PROXIMO' && (
                          <span className="academic-hito__badge next">
                            Próximo
                          </span>
                        )}
                      </div>

                      <strong>
                        {hito.titulo}
                      </strong>

                      <small>
                        {hito.nombre}
                      </small>
                    </article>
                  );
                },
              )}
            </div>

            <div className="academic-overview__footer">
              <div>
                <strong>
                  {tituloEstadoHitos}
                </strong>

                <span>
                  {hitoVisible
                    ? `${formatearFecha(hitoVisible.fechaInicio)} — ${formatearFecha(hitoVisible.fechaFin)}`
                    : 'El calendario académico de esta gestión ha concluido.'}
                </span>
              </div>

              <div className="academic-overview__metrics">
                <span>
                  <b>
                    {datos.hitos.totalHitos}
                  </b>
                  {' '}
                  hitos
                </span>

                <span>
                  <b>
                    {datos.hitos.puntajeTotal}
                  </b>
                  {' '}
                  puntos
                </span>
              </div>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="academic-empty"
            onClick={() =>
              navigate(
                '/admin/hitos',
              )
            }
          >
            <AlertCircle
              size={22}
            />

            <div>
              <strong>
                Planificación académica pendiente
              </strong>

              <span>
                Configura las fechas de H1 a H5 para la gestión
                {' '}
                {datos.gestionActual}.
              </span>
            </div>

            <ArrowRight
              size={18}
            />
          </button>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">
              Comunidad
            </span>

            <h2>
              Resumen de usuarios
            </h2>
          </div>

          <button
            type="button"
            className="section-link"
            onClick={() =>
              navigate(
                '/admin/usuarios',
              )
            }
          >
            Ver usuarios

            <ArrowRight size={16} />
          </button>
        </div>

        <div className="stats-grid">
          {tarjetasPrincipales.map(
            (
              tarjeta,
            ) => (
              <TarjetaEstadistica
                key={
                  tarjeta.titulo
                }
                {...tarjeta}
                onClick={() =>
                  navigate(
                    tarjeta.ruta,
                  )
                }
              />
            ),
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">
              Gestión académica
            </span>

            <h2>
              Materias y cursos
            </h2>
          </div>
        </div>

        <div className="stats-grid">
          {tarjetasAcademicas.map(
            (
              tarjeta,
            ) => (
              <TarjetaEstadistica
                key={
                  tarjeta.titulo
                }
                {...tarjeta}
                onClick={() =>
                  navigate(
                    tarjeta.ruta,
                  )
                }
              />
            ),
          )}
        </div>
      </section>

      <section className="attention-card">
        <div className="attention-heading">
          <div className="attention-title">
            <div className="attention-icon">
              <BellRing size={22} />
            </div>

            <div>
              <span className="section-eyebrow">
                Supervisión
              </span>

              <h2>
                Centro de atención
              </h2>

              <p>
                Situaciones administrativas que conviene revisar.
              </p>
            </div>
          </div>

          <div className="attention-summary">
            <span className="attention-total">
              {datos.resumenAlertas.total}
              {' '}
              {datos.resumenAlertas.total === 1
                ? 'aviso'
                : 'avisos'}
            </span>

            {datos.resumenAlertas.altas > 0 && (
              <span className="attention-priority high">
                {datos.resumenAlertas.altas} alta
              </span>
            )}

            {datos.resumenAlertas.medias > 0 && (
              <span className="attention-priority medium">
                {datos.resumenAlertas.medias} media
              </span>
            )}
          </div>
        </div>

        {datos.alertas.length === 0 ? (
          <div className="attention-empty">
            <CheckCircle2 size={24} />

            <div>
              <strong>
                Todo está bajo control
              </strong>

              <span>
                No existen situaciones administrativas pendientes.
              </span>
            </div>
          </div>
        ) : (
          <div className="attention-grid">
            {datos.alertas.map(
              (
                alerta,
              ) => (
                <button
                  key={alerta.id}
                  type="button"
                  className={`attention-item ${alerta.prioridad.toLowerCase()}`}
                  onClick={() =>
                    navigate(
                      alerta.ruta,
                    )
                  }
                >
                  <div className="attention-item-icon">
                    <AlertCircle size={20} />
                  </div>

                  <div className="attention-item-content">
                    <div className="attention-item-top">
                      <strong>
                        {alerta.titulo}
                      </strong>

                      <span
                        className={`priority-badge ${alerta.prioridad.toLowerCase()}`}
                      >
                        {alerta.prioridad === 'ALTA'
                          ? 'Alta'
                          : alerta.prioridad === 'MEDIA'
                            ? 'Media'
                            : 'Baja'}
                      </span>
                    </div>

                    <p>
                      {alerta.descripcion}
                    </p>

                    <span className="attention-action">
                      {alerta.accion}

                      <ArrowRight size={14} />
                    </span>
                  </div>

                  <span className="attention-count">
                    {alerta.cantidad}
                  </span>
                </button>
              ),
            )}
          </div>
        )}
      </section>

      <section className="dashboard-two-columns">
        <article className="dashboard-card account-card">
          <div className="card-heading">
            <div>
              <span className="section-eyebrow">
                Seguridad
              </span>

              <h2>
                Estado de cuentas
              </h2>

              <p>
                Seguimiento de acceso y activación.
              </p>
            </div>

            <div className="card-heading-icon accounts">
              <ShieldCheck size={21} />
            </div>
          </div>

          <div className="progress-group">
            <Progreso
              titulo="Cuentas activadas"
              cantidad={
                datos.usuarios
                  .cuentasActivadas
              }
              total={
                datos.usuarios.total
              }
              porcentaje={
                porcentajeActivadas
              }
              clase="activadas"
            />

            <Progreso
              titulo="Usuarios activos"
              cantidad={
                datos.usuarios.activos
              }
              total={
                datos.usuarios.total
              }
              porcentaje={
                porcentajeActivos
              }
              clase="activos"
            />
          </div>

          <div className="mini-status-grid">
            <MiniEstado
              titulo="Pendientes"
              cantidad={
                datos.usuarios
                  .pendientesActivacion
              }
              clase="pendientes"
            />

            <MiniEstado
              titulo="Desactivados"
              cantidad={
                datos.usuarios
                  .desactivados
              }
              clase="desactivados"
            />
          </div>
        </article>

        <article className="dashboard-card roles-card">
          <div className="card-heading">
            <div>
              <span className="section-eyebrow">
                Distribución
              </span>

              <h2>
                Usuarios por rol
              </h2>

              <p>
                Composición actual de la plataforma.
              </p>
            </div>

            <div className="card-heading-icon roles">
              <UsersRound size={21} />
            </div>
          </div>

          <div className="roles-chart">
            <BarraRol
              titulo="Estudiantes"
              cantidad={
                datos.usuarios
                  .estudiantes
              }
              maximo={
                maximoRol
              }
              clase="estudiantes"
            />

            <BarraRol
              titulo="Docentes"
              cantidad={
                datos.usuarios
                  .docentes
              }
              maximo={
                maximoRol
              }
              clase="docentes"
            />

            <BarraRol
              titulo="Administradores"
              cantidad={
                datos.usuarios
                  .administradores
              }
              maximo={
                maximoRol
              }
              clase="administradores"
            />
          </div>

          <div className="roles-total">
            <span>
              Total de perfiles
            </span>

            <strong>
              {datos.usuarios.total}
            </strong>
          </div>
        </article>
      </section>

      <section className="dashboard-two-columns">
        <article className="dashboard-card recent-card">
          <div className="card-heading">
            <div>
              <span className="section-eyebrow">
                Seguimiento
              </span>

              <h2>
                Cursos recientes
              </h2>

              <p>
                Últimos cursos registrados.
              </p>
            </div>

            <button
              type="button"
              className="icon-link"
              onClick={() =>
                navigate(
                  '/admin/cursos',
                )
              }
              aria-label="Ver cursos"
            >
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="recent-list">
            {datos.cursosRecientes
              .length ===
            0 ? (
              <EstadoVacio
                titulo="Todavía no hay cursos"
                mensaje="Los cursos creados aparecerán en esta sección."
              />
            ) : (
              datos.cursosRecientes.map(
                (
                  curso,
                ) => (
                  <button
                    key={
                      curso.id
                    }
                    type="button"
                    className="course-item"
                    onClick={() =>
                      navigate(
                        '/admin/cursos',
                      )
                    }
                  >
                    <div className="course-icon">
                      <BookOpen size={18} />
                    </div>

                    <div className="course-info">
                      <strong>
                        {curso.materia}
                      </strong>

                      <span>
                        {curso.codigo}
                        {' · '}
                        {curso.gestion}
                        {' · '}
                        Paralelo{' '}
                        {curso.paralelo}
                      </span>

                      <small>
                        {curso.docente}
                      </small>
                    </div>

                    <span
                      className={`course-status ${curso.estado.toLowerCase()}`}
                    >
                      {curso.estado ===
                      'FINALIZADO'
                        ? 'Finalizado'
                        : curso.estado ===
                            'INACTIVO'
                          ? 'Inactivo'
                          : 'Activo'}
                    </span>
                  </button>
                ),
              )
            )}
          </div>
        </article>

        <article className="dashboard-card activity-card">
          <div className="card-heading">
            <div>
              <span className="section-eyebrow">
                Novedades
              </span>

              <h2>
                Actividad reciente
              </h2>

              <p>
                Últimos registros del sistema.
              </p>
            </div>

            <div className="card-heading-icon activity">
              <Clock3 size={21} />
            </div>
          </div>

          <div className="activity-list">
            {datos.actividadReciente
              .length ===
            0 ? (
              <EstadoVacio
                titulo="Sin actividad reciente"
                mensaje="Los nuevos registros aparecerán aquí."
              />
            ) : (
              datos.actividadReciente.map(
                (
                  actividad,
                ) => (
                  <div
                    key={
                      actividad.id
                    }
                    className="activity-item"
                  >
                    <div
                      className={`activity-dot ${actividad.tipo.toLowerCase()}`}
                    />

                    <div>
                      <strong>
                        {actividad.titulo}
                      </strong>

                      <span>
                        {actividad.descripcion}
                      </span>
                    </div>

                    <small>
                      {formatearTiempoRelativo(
                        actividad.fecha,
                      )}
                    </small>
                  </div>
                ),
              )
            )}
          </div>
        </article>
      </section>

      <section className="quick-access-card">
        <div className="quick-access-heading">
          <div>
            <span className="section-eyebrow">
              Accesos rápidos
            </span>

            <h2>
              Gestiona IusAcademy
            </h2>

            <p>
              Entra directamente a las funciones principales.
            </p>
          </div>

          <div className="quick-spark">
            <Sparkles size={24} />
          </div>
        </div>

        <div className="quick-grid">
          <AccesoRapido
            titulo="Usuarios"
            descripcion="Crear y administrar cuentas"
            icono={
              <UsersRound size={20} />
            }
            clase="usuarios"
            onClick={() =>
              navigate(
                '/admin/usuarios',
              )
            }
          />

          <AccesoRapido
            titulo="Materias"
            descripcion="Gestionar la oferta académica"
            icono={
              <BookOpen size={20} />
            }
            clase="materias"
            onClick={() =>
              navigate(
                '/admin/materias',
              )
            }
          />

          <AccesoRapido
            titulo="Cursos"
            descripcion="Crear cursos y revisar historial"
            icono={
              <GraduationCap size={20} />
            }
            clase="cursos"
            onClick={() =>
              navigate(
                '/admin/cursos',
              )
            }
          />

          <AccesoRapido
            titulo="Hitos académicos"
            descripcion="Configurar calendario H1–H5"
            icono={
              <CalendarDays size={20} />
            }
            clase="hitos"
            onClick={() =>
              navigate(
                '/admin/hitos',
              )
            }
          />
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>
          Última actualización:{' '}
          {formatearFecha(
            datos.actualizadoEn,
          )}
        </span>

        <strong>
          IusAcademy
        </strong>
      </footer>

      <style>
        {styles}
      </style>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="dashboard-skeleton"
      aria-label="Cargando dashboard"
      aria-busy="true"
    >
      <section className="skeleton-hero">
        <div className="skeleton-icon shimmer" />

        <div className="skeleton-hero-copy">
          <div className="skeleton-line tiny shimmer" />
          <div className="skeleton-line title shimmer" />
          <div className="skeleton-line medium shimmer" />

          <div className="skeleton-chips">
            <div className="skeleton-chip shimmer" />
            <div className="skeleton-chip shimmer" />
            <div className="skeleton-chip shimmer" />
          </div>
        </div>

        <div className="skeleton-button shimmer" />
      </section>

      <div className="skeleton-heading">
        <div>
          <div className="skeleton-line tiny shimmer" />
          <div className="skeleton-line subtitle shimmer" />
        </div>
      </div>

      <div className="skeleton-stats">
        {Array.from({
          length: 8,
        }).map(
          (
            _,
            indice,
          ) => (
            <div
              key={indice}
              className="skeleton-stat"
            >
              <div className="skeleton-stat-icon shimmer" />

              <div className="skeleton-stat-copy">
                <div className="skeleton-line small shimmer" />
                <div className="skeleton-line number shimmer" />
                <div className="skeleton-line tiny shimmer" />
              </div>
            </div>
          ),
        )}
      </div>

      <div className="skeleton-panels">
        <div className="skeleton-panel shimmer" />
        <div className="skeleton-panel shimmer" />
      </div>
    </div>
  );
}

function TarjetaEstadistica({
  titulo,
  cantidad,
  descripcion,
  clase,
  icono,
  onClick,
}: {
  titulo: string;
  cantidad: number;
  descripcion: string;
  clase: string;
  icono: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="stat-card"
      onClick={onClick}
    >
      <div
        className={`stat-icon ${clase}`}
      >
        {icono}
      </div>

      <div className="stat-content">
        <span>
          {titulo}
        </span>

        <strong>
          {cantidad}
        </strong>

        <small>
          {descripcion}
        </small>
      </div>

      <ArrowRight
        size={16}
        className="stat-arrow"
      />
    </button>
  );
}

function Progreso({
  titulo,
  cantidad,
  total,
  porcentaje,
  clase,
}: {
  titulo: string;
  cantidad: number;
  total: number;
  porcentaje: number;
  clase: string;
}) {
  return (
    <div className="progress-item">
      <div className="progress-meta">
        <div>
          <strong>
            {titulo}
          </strong>

          <span>
            {cantidad} de {total}
          </span>
        </div>

        <b>
          {porcentaje}%
        </b>
      </div>

      <div className="progress-track">
        <div
          className={`progress-value ${clase}`}
          style={{
            width:
              `${porcentaje}%`,
          }}
        />
      </div>
    </div>
  );
}

function MiniEstado({
  titulo,
  cantidad,
  clase,
}: {
  titulo: string;
  cantidad: number;
  clase: string;
}) {
  return (
    <div
      className={`mini-status ${clase}`}
    >
      <span>
        {titulo}
      </span>

      <strong>
        {cantidad}
      </strong>
    </div>
  );
}

function BarraRol({
  titulo,
  cantidad,
  maximo,
  clase,
}: {
  titulo: string;
  cantidad: number;
  maximo: number;
  clase: string;
}) {
  const porcentaje =
    Math.max(
      cantidad >
      0
        ? 8
        : 0,
      Math.round(
        (
          cantidad /
          maximo
        ) *
        100,
      ),
    );

  return (
    <div className="role-row">
      <div className="role-row-meta">
        <span>
          {titulo}
        </span>

        <strong>
          {cantidad}
        </strong>
      </div>

      <div className="role-track">
        <div
          className={`role-value ${clase}`}
          style={{
            width:
              `${porcentaje}%`,
          }}
        />
      </div>
    </div>
  );
}

function AccesoRapido({
  titulo,
  descripcion,
  icono,
  clase,
  onClick,
}: {
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  clase: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="quick-item"
      onClick={onClick}
    >
      <div
        className={`quick-icon ${clase}`}
      >
        {icono}
      </div>

      <div>
        <strong>
          {titulo}
        </strong>

        <span>
          {descripcion}
        </span>
      </div>

      <ArrowRight size={17} />
    </button>
  );
}

function EstadoVacio({
  titulo,
  mensaje,
}: {
  titulo: string;
  mensaje: string;
}) {
  return (
    <div className="empty-state">
      <Sparkles size={22} />

      <strong>
        {titulo}
      </strong>

      <span>
        {mensaje}
      </span>
    </div>
  );
}

function Toast({
  tipo,
  titulo,
  mensaje,
  onCerrar,
}: {
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
  onCerrar: () => void;
}) {
  useEffect(
    () => {
      const temporizador =
        window.setTimeout(
          onCerrar,
          5000,
        );

      return () =>
        window.clearTimeout(
          temporizador,
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
          <CheckCircle2 size={22} />
        ) : (
          <CircleX size={22} />
        )}
      </div>

      <div>
        <strong>
          {titulo}
        </strong>

        <p>
          {mensaje}
        </p>
      </div>

      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar mensaje"
      >
        <CircleX size={16} />
      </button>

      <div className="toast-progress" />
    </div>
  );
}

const styles = `
  .dashboard-page {
    width: 100%;
    min-width: 0;
    padding:
      0
      34px
      34px;
    color: var(--app-text);
  }

  .hero-dashboard {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 26px;
    margin-bottom: 22px;
    padding: 28px 30px;
    overflow: hidden;
    border:
      1px solid
      var(--app-border);
    border-radius: 28px;
    background:
      linear-gradient(
        135deg,
        var(--app-surface) 0%,
        var(--app-bg-soft) 100%
      );
    box-shadow:
      var(--app-shadow-lg);
  }

  .hero-dashboard::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: var(--app-accent);
  }

  .hero-dashboard::after {
    content: "";
    position: absolute;
    width: 260px;
    height: 260px;
    top: -145px;
    right: -80px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        var(--app-border),
        rgba(241,139,75,0)
      );
    pointer-events: none;
  }

  .hero-dashboard__content {
    position: relative;
    z-index: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .hero-icon {
    width: 62px;
    height: 62px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border:
      1px solid
      var(--app-border-strong);
    border-radius: 20px;
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        145deg,
        var(--app-accent-soft),
        var(--app-surface-alt)
      );
    box-shadow:
      var(--app-shadow-sm);
  }

  .dashboard-eyebrow,
  .section-eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .15em;
    text-transform: uppercase;
  }

  .hero-dashboard h1 {
    margin: 6px 0 0;
    color: var(--app-text);
    font-size:
      clamp(
        27px,
        3vw,
        38px
      );
    font-weight: 900;
    letter-spacing: -.035em;
  }

  .hero-dashboard p {
    margin: 7px 0 0;
    color: var(--app-text-soft);
    font-size: 14px;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 14px;
  }

  .hero-meta span {
    padding: 6px 10px;
    border:
      1px solid
      var(--app-input-border);
    border-radius: 999px;
    color: var(--app-warning-strong);
    background: var(--app-surface-alt);
    font-size: 10px;
    font-weight: 800;
  }

  .btn-actualizar {
    position: relative;
    z-index: 1;
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    flex-shrink: 0;
    padding: 11px 20px;
    border: none;
    border-radius: 999px;
    color: #fff;
    background: var(--app-accent);
    font-family: inherit;
    font-weight: 800;
    cursor: pointer;
    box-shadow:
      0 14px 30px
      rgba(217,119,6,.22);
    transition:
      transform .18s ease,
      background .18s ease,
      box-shadow .18s ease,
      opacity .18s ease;
  }

  .btn-actualizar:hover:not(:disabled) {
    transform: translateY(-2px);
    background: var(--app-accent-hover);
    box-shadow:
      0 18px 36px
      rgba(217,119,6,.28);
  }

  .btn-actualizar:disabled {
    opacity: .65;
    cursor: not-allowed;
  }

  .girando {
    animation:
      girar
      .8s
      linear
      infinite;
  }

  .dashboard-error {
    display: grid;
    grid-template-columns:
      30px
      1fr
      auto;
    align-items: center;
    gap: 13px;
    margin-bottom: 20px;
    padding: 15px 17px;
    border:
      1px solid
      #fecaca;
    border-radius: 17px;
    color: var(--app-danger-strong);
    background: var(--app-danger-bg);
  }

  .dashboard-error strong {
    display: block;
    font-size: 13px;
  }

  .dashboard-error p {
    margin: 3px 0 0;
    color: #7f1d1d;
    font-size: 11px;
  }

  .dashboard-error button {
    padding: 8px 13px;
    border:
      1px solid
      #fecaca;
    border-radius: 999px;
    color: var(--app-danger-strong);
    background: var(--app-surface-raised);
    font-weight: 800;
    cursor: pointer;
  }

  .academic-overview-card {
    position: relative;
    margin-top: 20px;
    padding: 19px 21px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow);
  }

  .academic-overview-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 4px;
    background:
      linear-gradient(
        90deg,
        #7c3aed,
        #ea580c,
        #2563eb,
        #16a34a,
        #db2777
      );
  }

  .academic-overview__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .academic-overview__title {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .academic-overview__icon {
    width: 45px;
    height: 45px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .academic-overview__heading h2 {
    margin: 4px 0 0;
    color: var(--app-text);
    font-size: 18px;
    font-weight: 900;
  }

  .academic-overview__heading p {
    margin: 4px 0 0;
    overflow: hidden;
    color: var(--app-text-soft);
    font-size: 10px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .academic-overview__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .academic-overview__status {
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 850;
  }

  .academic-overview__status.en_curso {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .academic-overview__status.proxima {
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
  }

  .academic-overview__status.finalizada {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .academic-overview__status.sin_planificacion {
    color: var(--app-danger-strong);
    background: var(--app-danger-bg);
  }

  .academic-overview__button {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid var(--app-border-strong);
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
    font-family: inherit;
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
  }

  .academic-hitos-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 9px;
    margin-top: 15px;
  }

  .academic-hito {
    position: relative;
    min-width: 0;
    min-height: 92px;
    padding: 11px 12px;
    overflow: hidden;
    border: 1px solid var(--app-border-soft);
    border-radius: 15px;
    background: var(--app-surface-alt);
    opacity: .68;
    transition:
      transform .18s ease,
      box-shadow .18s ease,
      opacity .18s ease;
  }

  .academic-hito::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: currentColor;
  }

  .academic-hito.violeta {
    color: #7c3aed;
  }

  .academic-hito.naranja {
    color: #ea580c;
  }

  .academic-hito.azul {
    color: #2563eb;
  }

  .academic-hito.verde {
    color: #16a34a;
  }

  .academic-hito.rosado {
    color: #db2777;
  }

  .academic-hito.actual,
  .academic-hito.proximo {
    opacity: 1;
    transform: translateY(-2px);
    box-shadow:
      0 12px 25px
      color-mix(
        in srgb,
        currentColor 13%,
        transparent
      );
  }

  .academic-hito.actual {
    border-color: currentColor;
    background:
      color-mix(
        in srgb,
        currentColor 8%,
        var(--app-surface)
      );
  }

  .academic-hito.proximo {
    border-style: dashed;
    border-color: currentColor;
  }

  .academic-hito.finalizado {
    opacity: .48;
  }

  .academic-hito__top {
    min-height: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
  }

  .academic-hito__code {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 9px;
    color: currentColor;
    background:
      color-mix(
        in srgb,
        currentColor 12%,
        var(--app-surface)
      );
    font-size: 9px;
    font-weight: 900;
  }

  .academic-hito__badge {
    padding: 4px 6px;
    border-radius: 999px;
    font-size: 7px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .academic-hito__badge.current {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .academic-hito__badge.next {
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
  }

  .academic-hito > strong,
  .academic-hito > small {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .academic-hito > strong {
    margin-top: 9px;
    color: currentColor;
    font-size: 13px;
    font-weight: 950;
  }

  .academic-hito > small {
    margin-top: 4px;
    color: var(--app-text);
    font-size: 9px;
    font-weight: 700;
  }

  .academic-overview__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 12px;
    padding-top: 11px;
    border-top: 1px solid var(--app-border-soft);
  }

  .academic-overview__footer strong,
  .academic-overview__footer span {
    display: block;
  }

  .academic-overview__footer strong {
    color: var(--app-text);
    font-size: 11px;
  }

  .academic-overview__footer > div:first-child > span {
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .academic-overview__metrics {
    display: flex;
    gap: 7px;
  }

  .academic-overview__metrics span {
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-text-soft);
    background: var(--app-surface-alt);
    font-size: 9px;
  }

  .academic-overview__metrics b {
    color: var(--app-text);
  }

  .academic-empty {
    width: 100%;
    display: grid;
    grid-template-columns: 40px 1fr 20px;
    align-items: center;
    gap: 11px;
    margin-top: 14px;
    padding: 13px;
    border: 1px dashed var(--app-danger-border);
    border-radius: 15px;
    color: var(--app-danger-strong);
    background: var(--app-danger-bg);
    text-align: left;
    cursor: pointer;
  }

  .academic-empty strong,
  .academic-empty span {
    display: block;
  }

  .academic-empty strong {
    font-size: 11px;
  }

  .academic-empty span {
    margin-top: 3px;
    color: var(--app-text-soft);
    font-size: 9px;
  }

  .dashboard-section {
    margin-top: 22px;
  }

  .section-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 13px;
  }

  .section-heading h2,
  .card-heading h2,
  .quick-access-heading h2 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 18px;
    font-weight: 900;
    letter-spacing: -.015em;
  }

  .section-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 12px;
    border: none;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-weight: 800;
    cursor: pointer;
  }

  .stats-grid {
    display: grid;
    grid-template-columns:
      repeat(
        4,
        minmax(0,1fr)
      );
    gap: 14px;
  }

  .stat-card {
    position: relative;
    min-width: 0;
    display: grid;
    grid-template-columns:
      48px
      1fr
      18px;
    align-items: center;
    gap: 13px;
    min-height: 106px;
    padding: 17px;
    overflow: hidden;
    border:
      1px solid
      var(--app-border-soft);
    border-radius: 21px;
    text-align: left;
    color: inherit;
    background: var(--app-surface);
    box-shadow:
      var(--app-shadow-sm);
    cursor: pointer;
    transition:
      transform .2s ease,
      box-shadow .2s ease,
      border-color .2s ease;
  }

  .stat-card::after {
    content: "";
    position: absolute;
    width: 100px;
    height: 100px;
    top: -56px;
    right: -40px;
    border-radius: 50%;
    background:
      rgba(241,139,75,.05);
  }

  .stat-card:hover {
    transform: translateY(-3px);
    border-color:
      var(--app-border-strong);
    box-shadow:
      0 20px 42px
      rgba(148,81,22,.1);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 15px;
  }

  .stat-icon.usuarios {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .stat-icon.estudiantes {
    color: #d97706;
    background: var(--app-warning-bg);
  }

  .stat-icon.docentes {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .stat-icon.administradores {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .stat-icon.materias {
    color: var(--app-info);
    background: var(--app-info-bg);
  }

  .stat-icon.materias-inactivas {
    color: var(--app-text-soft);
    background: var(--app-surface-disabled);
  }

  .stat-icon.cursos-activos {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .stat-icon.cursos-finalizados {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .stat-content {
    min-width: 0;
  }

  .stat-content span {
    display: block;
    overflow: hidden;
    color: var(--app-text-soft);
    font-size: 11px;
    font-weight: 750;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .stat-content strong {
    display: block;
    margin-top: 5px;
    color: var(--app-text);
    font-size: 25px;
    font-weight: 900;
    line-height: 1;
  }

  .stat-content small {
    display: block;
    margin-top: 7px;
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: 10px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .stat-arrow {
    position: relative;
    z-index: 1;
    color: var(--app-text-muted);
  }

  .attention-card {
    position: relative;
    margin-top: 22px;
    padding: 23px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 23px;
    background:
      linear-gradient(
        135deg,
        var(--app-surface),
        var(--app-surface-alt)
      );
    box-shadow:
      var(--app-shadow);
  }

  .attention-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .attention-title {
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .attention-icon {
    width: 45px;
    height: 45px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .attention-heading h2 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 18px;
    font-weight: 900;
  }

  .attention-heading p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 11px;
  }

  .attention-summary {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 7px;
  }

  .attention-total,
  .attention-priority {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 850;
  }

  .attention-total {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .attention-priority.high {
    color: var(--app-danger-strong);
    background: var(--app-danger-bg);
  }

  .attention-priority.medium {
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .attention-grid {
    display: grid;
    grid-template-columns:
      repeat(2,minmax(0,1fr));
    gap: 12px;
    margin-top: 19px;
  }

  .attention-item {
    width: 100%;
    min-width: 0;
    display: grid;
    grid-template-columns:
      42px 1fr auto;
    align-items: flex-start;
    gap: 12px;
    padding: 15px;
    border-radius: 18px;
    text-align: left;
    color: inherit;
    background: var(--app-surface-raised);
    cursor: pointer;
    transition:
      transform .18s ease,
      box-shadow .18s ease;
  }

  .attention-item.alta {
    border: 1px solid var(--app-danger-border);
  }

  .attention-item.media {
    border: 1px solid var(--app-warning-border);
  }

  .attention-item.baja {
    border: 1px solid var(--app-border-soft);
  }

  .attention-item:hover {
    transform: translateY(-2px);
    box-shadow:
      0 14px 30px rgba(15,23,42,.08);
  }

  .attention-item-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 13px;
  }

  .attention-item.alta .attention-item-icon {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .attention-item.media .attention-item-icon {
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .attention-item.baja .attention-item-icon {
    color: var(--app-text-soft);
    background: var(--app-surface-alt);
  }

  .attention-item-content {
    min-width: 0;
  }

  .attention-item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
  }

  .attention-item-top strong {
    color: var(--app-text);
    font-size: 12px;
  }

  .priority-badge {
    flex-shrink: 0;
    padding: 4px 7px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .priority-badge.alta {
    color: var(--app-danger-strong);
    background: var(--app-danger-bg);
  }

  .priority-badge.media {
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .priority-badge.baja {
    color: var(--app-text-soft);
    background: var(--app-surface-disabled);
  }

  .attention-item-content p {
    margin: 7px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.55;
  }

  .attention-action {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
    color: var(--app-accent-dark);
    font-size: 10px;
    font-weight: 850;
  }

  .attention-count {
    min-width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--app-text);
    background: var(--app-surface-alt);
    font-size: 12px;
    font-weight: 900;
  }

  .attention-empty {
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 13px;
    margin-top: 18px;
    padding: 18px;
    border: 1px dashed var(--app-success-border);
    border-radius: 18px;
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .attention-empty strong,
  .attention-empty span {
    display: block;
  }

  .attention-empty strong {
    font-size: 12px;
  }

  .attention-empty span {
    margin-top: 3px;
    color: var(--app-text-soft);
    font-size: 10px;
  }

  .dashboard-two-columns {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(0,1fr)
      );
    gap: 18px;
    margin-top: 22px;
  }

  .dashboard-card,
  .quick-access-card {
    position: relative;
    min-width: 0;
    padding: 23px;
    overflow: hidden;
    border:
      1px solid
      var(--app-border);
    border-radius: 23px;
    background: var(--app-surface);
    box-shadow:
      var(--app-shadow);
  }

  .card-heading,
  .quick-access-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .card-heading p,
  .quick-access-heading p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 11px;
  }

  .card-heading-icon,
  .quick-spark {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 14px;
  }

  .card-heading-icon.accounts {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .card-heading-icon.roles {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .card-heading-icon.activity {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .progress-group {
    display: grid;
    gap: 20px;
    margin-top: 24px;
  }

  .progress-meta {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  .progress-meta strong {
    display: block;
    color: var(--app-text-secondary);
    font-size: 12px;
  }

  .progress-meta span {
    display: block;
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .progress-meta b {
    color: var(--app-text);
    font-size: 14px;
  }

  .progress-track,
  .role-track {
    height: 9px;
    margin-top: 9px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--app-surface-disabled);
  }

  .progress-value,
  .role-value {
    height: 100%;
    border-radius: inherit;
    transition:
      width .45s ease;
  }

  .progress-value.activadas {
    background:
      linear-gradient(
        90deg,
        var(--app-success),
        var(--app-success-strong)
      );
  }

  .progress-value.activos {
    background:
      linear-gradient(
        90deg,
        var(--app-accent),
        var(--app-accent-dark)
      );
  }

  .mini-status-grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(0,1fr)
      );
    gap: 11px;
    margin-top: 22px;
  }

  .mini-status {
    padding: 14px;
    border-radius: 16px;
  }

  .mini-status span {
    display: block;
    font-size: 10px;
    font-weight: 750;
  }

  .mini-status strong {
    display: block;
    margin-top: 6px;
    font-size: 20px;
  }

  .mini-status.pendientes {
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .mini-status.desactivados {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .roles-chart {
    display: grid;
    gap: 19px;
    margin-top: 24px;
  }

  .role-row-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .role-row-meta span {
    color: var(--app-text-secondary);
    font-size: 12px;
    font-weight: 750;
  }

  .role-row-meta strong {
    color: var(--app-text);
    font-size: 12px;
  }

  .role-value.estudiantes {
    background: var(--app-accent);
  }

  .role-value.docentes {
    background: var(--app-success);
  }

  .role-value.administradores {
    background: var(--app-purple);
  }

  .roles-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 22px;
    padding: 13px 14px;
    border-radius: 15px;
    color: var(--app-text-soft);
    background: var(--app-surface-alt);
    font-size: 11px;
  }

  .roles-total strong {
    color: var(--app-text);
    font-size: 17px;
  }

  .icon-link {
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

  .recent-list,
  .activity-list {
    display: grid;
    gap: 10px;
    margin-top: 20px;
  }

  .course-item {
    width: 100%;
    min-width: 0;
    display: grid;
    grid-template-columns:
      43px
      1fr
      auto;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border:
      1px solid
      var(--app-border-soft);
    border-radius: 16px;
    text-align: left;
    color: inherit;
    background: var(--app-surface-alt);
    cursor: pointer;
    transition:
      transform .18s ease,
      background .18s ease,
      border-color .18s ease;
  }

  .course-item:hover {
    transform: translateX(3px);
    border-color:
      var(--app-border-strong);
    background: var(--app-bg-soft);
  }

  .course-icon {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .course-info {
    min-width: 0;
  }

  .course-info strong,
  .course-info span,
  .course-info small {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .course-info strong {
    color: var(--app-text);
    font-size: 12px;
  }

  .course-info span {
    margin-top: 3px;
    color: var(--app-text-soft);
    font-size: 10px;
  }

  .course-info small {
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .course-status {
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 850;
  }

  .course-status.activo {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .course-status.inactivo {
    color: var(--app-text-soft);
    background: var(--app-surface-disabled);
  }

  .course-status.finalizado {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .activity-item {
    display: grid;
    grid-template-columns:
      10px
      1fr
      auto;
    align-items: center;
    gap: 11px;
    padding:
      10px
      0;
    border-bottom:
      1px solid
      var(--app-border-soft);
  }

  .activity-item:last-child {
    border-bottom: none;
  }

  .activity-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }

  .activity-dot.usuario {
    background: var(--app-accent);
  }

  .activity-dot.materia {
    background: var(--app-info);
  }

  .activity-dot.curso {
    background: var(--app-success);
  }

  .activity-item strong,
  .activity-item span {
    display: block;
  }

  .activity-item strong {
    color: var(--app-text);
    font-size: 11px;
  }

  .activity-item span {
    margin-top: 3px;
    color: var(--app-text-soft);
    font-size: 10px;
  }

  .activity-item small {
    color: var(--app-text-muted);
    font-size: 9px;
    white-space: nowrap;
  }

  .empty-state {
    min-height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 7px;
    padding: 20px;
    border:
      1px dashed
      var(--app-border-strong);
    border-radius: 17px;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
    text-align: center;
  }

  .empty-state strong {
    color: var(--app-text-secondary);
    font-size: 12px;
  }

  .empty-state span {
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .quick-access-card {
    margin-top: 22px;
    background:
      linear-gradient(
        135deg,
        var(--app-surface),
        var(--app-bg-soft)
      );
  }

  .quick-spark {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .quick-grid {
    display: grid;
    grid-template-columns:
      repeat(
        4,
        minmax(0,1fr)
      );
    gap: 12px;
    margin-top: 20px;
  }

  .quick-item {
    min-width: 0;
    display: grid;
    grid-template-columns:
      43px
      1fr
      17px;
    align-items: center;
    gap: 11px;
    padding: 14px;
    border:
      1px solid
      var(--app-border-soft);
    border-radius: 17px;
    color: inherit;
    text-align: left;
    background: var(--app-surface-alt);
    cursor: pointer;
    transition:
      transform .18s ease,
      box-shadow .18s ease,
      border-color .18s ease;
  }

  .quick-item:hover {
    transform: translateY(-2px);
    border-color:
      var(--app-border-strong);
    box-shadow:
      0 12px 28px
      rgba(148,81,22,.08);
  }

  .quick-icon {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    border-radius: 13px;
  }

  .quick-icon.usuarios {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .quick-icon.materias {
    color: var(--app-info);
    background: var(--app-info-bg);
  }

  .quick-icon.cursos {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .quick-icon.hitos {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .quick-item strong,
  .quick-item span {
    display: block;
  }

  .quick-item strong {
    color: var(--app-text);
    font-size: 12px;
  }

  .quick-item span {
    margin-top: 4px;
    overflow: hidden;
    color: var(--app-text-soft);
    font-size: 9px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .quick-item > svg {
    color: var(--app-text-muted);
  }

  .dashboard-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 20px;
    padding: 0 3px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .dashboard-footer strong {
    color: var(--app-accent-dark);
    letter-spacing: .08em;
  }

  .dashboard-skeleton {
    display: grid;
    gap: 20px;
  }

  .skeleton-hero {
    display: grid;
    grid-template-columns:
      62px
      1fr
      170px;
    align-items: center;
    gap: 18px;
    min-height: 190px;
    padding: 28px 30px;
    border:
      1px solid
      var(--app-border-soft);
    border-radius: 28px;
    background: var(--app-surface);
  }

  .skeleton-icon,
  .skeleton-stat-icon {
    border-radius: 18px;
  }

  .skeleton-icon {
    width: 62px;
    height: 62px;
  }

  .skeleton-hero-copy {
    display: grid;
    gap: 10px;
  }

  .skeleton-line {
    height: 10px;
    border-radius: 999px;
  }

  .skeleton-line.tiny {
    width: 105px;
  }

  .skeleton-line.small {
    width: 78px;
  }

  .skeleton-line.medium {
    width:
      min(
        430px,
        80%
      );
  }

  .skeleton-line.title {
    width:
      min(
        360px,
        70%
      );
    height: 32px;
  }

  .skeleton-line.subtitle {
    width: 190px;
    height: 19px;
  }

  .skeleton-line.number {
    width: 45px;
    height: 27px;
  }

  .skeleton-chips {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .skeleton-chip {
    width: 92px;
    height: 25px;
    border-radius: 999px;
  }

  .skeleton-button {
    width: 170px;
    height: 46px;
    border-radius: 999px;
  }

  .skeleton-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    min-height: 44px;
  }

  .skeleton-heading > div {
    display: grid;
    gap: 8px;
  }

  .skeleton-stats {
    display: grid;
    grid-template-columns:
      repeat(
        4,
        minmax(0,1fr)
      );
    gap: 14px;
  }

  .skeleton-stat {
    display: grid;
    grid-template-columns:
      48px
      1fr;
    align-items: center;
    gap: 13px;
    min-height: 106px;
    padding: 17px;
    border:
      1px solid
      var(--app-border-soft);
    border-radius: 21px;
    background: var(--app-surface);
  }

  .skeleton-stat-icon {
    width: 48px;
    height: 48px;
  }

  .skeleton-stat-copy {
    display: grid;
    gap: 8px;
  }

  .skeleton-panels {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(0,1fr)
      );
    gap: 18px;
  }

  .skeleton-panel {
    min-height: 260px;
    border-radius: 23px;
  }

  .shimmer {
    position: relative;
    overflow: hidden;
    background:
      var(--app-surface-disabled);
  }

  .shimmer::after {
    content: "";
    position: absolute;
    inset: 0;
    transform:
      translateX(
        -100%
      );
    background:
      linear-gradient(
        90deg,
        transparent,
        color-mix(in srgb, var(--app-surface-raised) 72%, transparent),
        transparent
      );
    animation:
      shimmerMove
      1.25s
      infinite;
  }

  .toast {
    position: fixed;
    top: 25px;
    right: 28px;
    z-index: 9999;
    width:
      min(
        390px,
        calc(100vw - 40px)
      );
    display: grid;
    grid-template-columns:
      42px
      1fr
      28px;
    gap: 11px;
    align-items: flex-start;
    padding:
      15px
      15px
      18px;
    overflow: hidden;
    border-radius: 18px;
    box-shadow:
      var(--app-shadow-lg);
    animation:
      toastIn
      .3s
      ease;
  }

  .toast.exito {
    border:
      1px solid
      #bbf7d0;
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .toast.error {
    border:
      1px solid
      #fecaca;
    color: var(--app-danger-strong);
    background: var(--app-danger-bg);
  }

  .toast-icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 13px;
  }

  .toast.exito
  .toast-icon {
    background: #dcfce7;
  }

  .toast.error
  .toast-icon {
    background: var(--app-danger-bg);
  }

  .toast strong {
    display: block;
    font-size: 13px;
  }

  .toast p {
    margin: 4px 0 0;
    color: var(--app-text-soft);
    font-size: 11px;
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
    transform-origin:
      left center;
    animation:
      toastProgress
      5s
      linear
      forwards;
  }

  .toast.exito
  .toast-progress {
    background: var(--app-success);
  }

  .toast.error
  .toast-progress {
    background: var(--app-danger);
  }

  html[data-theme='oscuro']
  .hero-dashboard,
  html[data-theme='oscuro']
  .stat-card,
  html[data-theme='oscuro']
  .attention-card,
  html[data-theme='oscuro']
  .dashboard-card,
  html[data-theme='oscuro']
  .quick-access-card,
  html[data-theme='oscuro']
  .course-item,
  html[data-theme='oscuro']
  .quick-item,
  html[data-theme='oscuro']
  .skeleton-hero,
  html[data-theme='oscuro']
  .skeleton-stat {
    background:
      var(--app-surface);

    border-color:
      var(--app-border-soft);

    box-shadow:
      var(--app-shadow);
  }

  html[data-theme='oscuro']
  .attention-item,
  html[data-theme='oscuro']
  .roles-total,
  html[data-theme='oscuro']
  .empty-state {
    background:
      var(--app-surface-alt);
  }

  html[data-theme='oscuro']
  .hero-meta span,
  html[data-theme='oscuro']
  .section-link,
  html[data-theme='oscuro']
  .icon-link {
    background:
      var(--app-accent-soft);
  }

  html[data-theme='oscuro']
  .progress-track,
  html[data-theme='oscuro']
  .role-track {
    background:
      var(--app-surface-disabled);
  }

  @keyframes shimmerMove {
    100% {
      transform:
        translateX(
          100%
        );
    }
  }

  @keyframes girar {
    to {
      transform:
        rotate(
          360deg
        );
    }
  }

  @keyframes flotar {
    0%,
    100% {
      transform:
        translateY(
          0
        );
    }

    50% {
      transform:
        translateY(
          -6px
        );
    }
  }

  @keyframes toastIn {
    from {
      opacity: 0;
      transform:
        translateX(
          30px
        );
    }

    to {
      opacity: 1;
      transform:
        translateX(
          0
        );
    }
  }

  @keyframes toastProgress {
    from {
      transform:
        scaleX(
          1
        );
    }

    to {
      transform:
        scaleX(
          0
        );
    }
  }

  @media (
    max-width:
      1200px
  ) {
    .stats-grid,
    .quick-grid,
    .skeleton-stats {
      grid-template-columns:
        repeat(
          2,
          minmax(0,1fr)
        );
    }
  }

  @media (
    max-width:
      900px
  ) {
    .dashboard-page {
      padding:
        18px;
    }

    .hero-dashboard {
      align-items: stretch;
      flex-direction: column;
      padding:
        24px;
    }

    .btn-actualizar {
      width: 100%;
    }

    .dashboard-two-columns,
    .skeleton-panels {
      grid-template-columns:
        1fr;
    }

    .academic-overview__heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .academic-overview__actions {
      width: 100%;
      justify-content: space-between;
    }

    .academic-hitos-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .skeleton-hero {
      grid-template-columns:
        52px
        1fr;
    }

    .skeleton-button {
      grid-column:
        1 / -1;
      width: 100%;
    }

    .attention-grid {
      grid-template-columns:
        1fr;
    }
  }

  @media (
    max-width:
      620px
  ) {
    .hero-dashboard__content {
      align-items: flex-start;
    }

    .academic-hitos-row {
      grid-template-columns: 1fr 1fr;
    }

    .academic-overview__footer {
      align-items: flex-start;
      flex-direction: column;
    }

    .academic-overview__metrics {
      flex-wrap: wrap;
    }

    .attention-heading,
    .attention-item-top {
      align-items: flex-start;
      flex-direction: column;
    }

    .attention-summary {
      justify-content: flex-start;
    }

    .attention-item {
      grid-template-columns:
        42px 1fr;
    }

    .attention-count {
      grid-column: 2;
      width: fit-content;
    }

    .hero-icon {
      width: 52px;
      height: 52px;
      border-radius: 17px;
    }

    .stats-grid,
    .quick-grid,
    .skeleton-stats {
      grid-template-columns:
        1fr;
    }

    .skeleton-hero {
      padding: 22px;
    }

    .skeleton-icon {
      width: 52px;
      height: 52px;
    }

    .section-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .section-link {
      width: 100%;
      justify-content: center;
    }

    .course-item {
      grid-template-columns:
        43px
        1fr;
    }

    .course-status {
      grid-column:
        2;
      width: fit-content;
    }

    .activity-item {
      grid-template-columns:
        10px
        1fr;
    }

    .activity-item small {
      grid-column:
        2;
    }

    .dashboard-error {
      grid-template-columns:
        28px
        1fr;
    }

    .dashboard-error button {
      grid-column:
        1 / -1;
    }

    .dashboard-footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;