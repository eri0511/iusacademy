import type {
  ReactNode,
} from 'react';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Activity,
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';

import {
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../auth/AuthContext';

import type {
  AulaCursoOutletContext,
} from '../../../layouts/AulaCursoLayout';

import AvatarUsuario from '../../../components/shared/AvatarUsuario';
import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import AulaHeader from '../../../components/aula/AulaHeader';
import AulaModal from '../../../components/aula/AulaModal';

type EstadoInscripcion =
  | 'ACTIVA'
  | 'RETIRADA';

type EstudianteInscrito = {
  inscripcionId: number;

  estadoInscripcion:
    EstadoInscripcion;

  inscritoEn: string;
  retiradoEn: string | null;

  estudiante: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    correo: string;
    fotoPerfilUrl: string | null;
    ultimoAccesoEn: string | null;
  };
};

type RespuestaEstudiantes = {
  total: number;
  estudiantes: EstudianteInscrito[];
};

type CursoEstudiantesContext =
  AulaCursoOutletContext['curso'] & {
    codigoInscripcion?: string | null;
    codigoVigente?: boolean;
    codigoExpiraEn?: string | null;
  };

type CursoOutletContext = {
  curso: CursoEstudiantesContext;
  recargarCurso: () => Promise<void>;
};

type FormatoReporte =
  | 'PDF'
  | 'EXCEL'
  | 'CSV';

type RespuestaError = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};

type OrdenEstudiantes =
  | 'RECIENTES'
  | 'ANTIGUOS'
  | 'NOMBRE_ASC'
  | 'NOMBRE_DESC';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function obtenerMensajeError(
  datos: RespuestaError,
  predeterminado: string,
): string {
  if (
    Array.isArray(
      datos.message,
    )
  ) {
    return datos.message.join(
      '. ',
    );
  }

  return (
    datos.message ||
    datos.mensaje ||
    datos.error ||
    predeterminado
  );
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
      dateStyle:
        'medium',

      timeStyle:
        'short',
    },
  ).format(
    fecha,
  );
}

function formatearTiempoRelativo(
  valor: string | null,
): string {
  if (!valor) {
    return 'Nunca ingresó';
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime(),
    )
  ) {
    return 'Sin información';
  }

  const diferencia =
    Date.now() -
    fecha.getTime();

  const minutos =
    Math.max(
      Math.floor(
        diferencia /
        60000,
      ),
      0,
    );

  if (
    minutos <
    1
  ) {
    return 'Hace unos segundos';
  }

  if (
    minutos <
    60
  ) {
    return `Hace ${minutos} ${
      minutos === 1
        ? 'minuto'
        : 'minutos'
    }`;
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
    return `Hace ${horas} ${
      horas === 1
        ? 'hora'
        : 'horas'
    }`;
  }

  const dias =
    Math.floor(
      horas /
      24,
    );

  if (
    dias <
    30
  ) {
    return `Hace ${dias} ${
      dias === 1
        ? 'día'
        : 'días'
    }`;
  }

  return formatearFecha(
    valor,
  );
}

function obtenerNombreCompleto(
  estudiante:
    EstudianteInscrito['estudiante'],
): string {
  return [
    estudiante.nombres,
    estudiante.apellidoPaterno,
    estudiante.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(' ');
}

function estaConexionReciente(
  valor: string | null,
): boolean {
  if (!valor) {
    return false;
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime(),
    )
  ) {
    return false;
  }

  const diferencia =
    Date.now() -
    fecha.getTime();

  return (
    diferencia <=
    15 *
    60 *
    1000
  );
}

function calcularDiasDesde(
  valor: string,
): number {
  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime(),
    )
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor(
    (
      Date.now() -
      fecha.getTime()
    ) /
    (
      1000 *
      60 *
      60 *
      24
    ),
  );
}

export default function EstudiantesCurso() {
  const navigate =
    useNavigate();

  const {
    cursoId,
  } = useParams();

  const {
    accessToken,
    cerrarSesion,
  } = useAuth();

  const {
    curso,
    recargarCurso,
  } =
    useOutletContext<CursoOutletContext>();

  const cerrarSesionRef =
    useRef(
      cerrarSesion,
    );

  const navigateRef =
    useRef(
      navigate,
    );

  useEffect(
    () => {
      cerrarSesionRef.current =
        cerrarSesion;
    },
    [
      cerrarSesion,
    ],
  );

  useEffect(
    () => {
      navigateRef.current =
        navigate;
    },
    [
      navigate,
    ],
  );

  const [
    estudiantes,
    setEstudiantes,
  ] =
    useState<EstudianteInscrito[]>(
      [],
    );

  const [
    total,
    setTotal,
  ] =
    useState(
      0,
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
    useState(
      '',
    );

  const [
    busqueda,
    setBusqueda,
  ] =
    useState(
      '',
    );

  const [
    orden,
    setOrden,
  ] =
    useState<OrdenEstudiantes>(
      'RECIENTES',
    );

  const [
    codigoCopiado,
    setCodigoCopiado,
  ] =
    useState(
      false,
    );

  const [
    modalReportesAbierto,
    setModalReportesAbierto,
  ] =
    useState(
      false,
    );

  const [
    descargandoReporte,
    setDescargandoReporte,
  ] =
    useState<FormatoReporte | null>(
      null,
    );

  const [
    toast,
    setToast,
  ] =
    useState<{
      visible: boolean;
      tipo: TipoToast;
      titulo: string;
      mensaje?: string;
    }>({
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
    ) => {
      setToast({
        visible:
          true,
        tipo,
        titulo,
        mensaje,
      });
    };

  const cargarEstudiantes =
    useCallback(
      async (
        esActualizacion =
          false,
      ) => {
        if (
          !accessToken ||
          !cursoId
        ) {
          setCargando(
            false,
          );

          return;
        }

        try {
          if (
            esActualizacion
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
            '',
          );

          const respuesta =
            await fetch(
              `${API_URL}/docente/cursos/${cursoId}/estudiantes`,
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },
              },
            );

          if (
            respuesta.status ===
            401
          ) {
            cerrarSesionRef.current();

            navigateRef.current(
              '/login',
              {
                replace:
                  true,
              },
            );

            throw new Error(
              'Tu sesión venció. Inicia sesión nuevamente.',
            );
          }

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
                'No fue posible cargar los estudiantes.',
              ),
            );
          }

          const respuestaDatos =
            datos as RespuestaEstudiantes;

          const lista =
            Array.isArray(
              respuestaDatos.estudiantes,
            )
              ? respuestaDatos.estudiantes
              : [];

          setEstudiantes(
            lista,
          );

          setTotal(
            Number(
              respuestaDatos.total ??
              lista.length,
            ),
          );
        } catch (
          problema
        ) {
          setError(
            problema instanceof Error
              ? problema.message
              : 'Ocurrió un error inesperado.',
          );
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
        cursoId,
      ],
    );

  useEffect(
    () => {
      void cargarEstudiantes();
    },
    [
      cargarEstudiantes,
    ],
  );

  const estudiantesFiltrados =
    useMemo(
      () => {
        const texto =
          busqueda
            .trim()
            .toLowerCase();

        const lista =
          estudiantes.filter(
            (
              item,
            ) => {
              if (
                !texto
              ) {
                return true;
              }

              const nombreCompleto =
                obtenerNombreCompleto(
                  item.estudiante,
                )
                  .toLowerCase();

              const correo =
                item.estudiante.correo
                  .toLowerCase();

              return (
                nombreCompleto.includes(
                  texto,
                ) ||
                correo.includes(
                  texto,
                )
              );
            },
          );

        return [
          ...lista,
        ].sort(
          (
            primero,
            segundo,
          ) => {
            const nombrePrimero =
              obtenerNombreCompleto(
                primero.estudiante,
              )
                .toLocaleLowerCase(
                  'es',
                );

            const nombreSegundo =
              obtenerNombreCompleto(
                segundo.estudiante,
              )
                .toLocaleLowerCase(
                  'es',
                );

            if (
              orden ===
              'NOMBRE_ASC'
            ) {
              return nombrePrimero.localeCompare(
                nombreSegundo,
                'es',
              );
            }

            if (
              orden ===
              'NOMBRE_DESC'
            ) {
              return nombreSegundo.localeCompare(
                nombrePrimero,
                'es',
              );
            }

            const fechaPrimero =
              new Date(
                primero.inscritoEn,
              ).getTime();

            const fechaSegundo =
              new Date(
                segundo.inscritoEn,
              ).getTime();

            if (
              orden ===
              'ANTIGUOS'
            ) {
              return (
                fechaPrimero -
                fechaSegundo
              );
            }

            return (
              fechaSegundo -
              fechaPrimero
            );
          },
        );
      },
      [
        estudiantes,
        busqueda,
        orden,
      ],
    );

  const resumen =
    useMemo(
      () => {
        const cuposDisponibles =
          curso.cupoMaximo ===
          null
            ? null
            : Math.max(
                curso.cupoMaximo -
                estudiantes.length,
                0,
              );

        const porcentajeOcupacion =
          curso.cupoMaximo ===
            null ||
          curso.cupoMaximo <=
            0
            ? null
            : Math.min(
                Math.round(
                  (
                    estudiantes.length /
                    curso.cupoMaximo
                  ) *
                  100,
                ),
                100,
              );

        const recientes =
          estudiantes.filter(
            (
              item,
            ) =>
              calcularDiasDesde(
                item.inscritoEn,
              ) <=
              7,
          ).length;

        const conectadosRecientemente =
          estudiantes.filter(
            (
              item,
            ) =>
              estaConexionReciente(
                item.estudiante
                  .ultimoAccesoEn,
              ),
          ).length;

        return {
          total:
            estudiantes.length,

          cuposDisponibles,

          porcentajeOcupacion,

          recientes,

          conectadosRecientemente,
        };
      },
      [
        estudiantes,
        curso.cupoMaximo,
      ],
    );

  const actualizarTodo =
    async () => {
      await Promise.all([
        cargarEstudiantes(
          true,
        ),

        recargarCurso(),
      ]);
  };

  const descargarReporte =
    async (
      formato:
        FormatoReporte,
    ) => {
      if (
        !accessToken ||
        !cursoId ||
        descargandoReporte
      ) {
        return;
      }

      try {
        setDescargandoReporte(
          formato,
        );

        const respuesta =
          await fetch(
            `${API_URL}/docente/cursos/${cursoId}/estudiantes/exportar/${formato}`,
            {
              method:
                'GET',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        const tipoContenido =
          respuesta.headers.get(
            'content-type',
          );

        if (
          !respuesta.ok
        ) {
          const datos =
            tipoContenido?.includes(
              'application/json',
            )
              ? await respuesta
                  .json()
                  .catch(
                    () => ({}),
                  )
              : {};

          throw new Error(
            obtenerMensajeError(
              datos as RespuestaError,
              `No fue posible generar el reporte ${formato}.`,
            ),
          );
        }

        const archivo =
          await respuesta.blob();

        const url =
          URL.createObjectURL(
            archivo,
          );

        const enlace =
          document.createElement(
            'a',
          );

        const disposicion =
          respuesta.headers.get(
            'content-disposition',
          );

        const nombreCodificado =
          disposicion?.match(
            /filename\*=UTF-8''([^;]+)/i,
          )?.[1];

        const nombreSimple =
          disposicion?.match(
            /filename="?([^";]+)"?/i,
          )?.[1];

        const extensiones:
          Record<FormatoReporte, string> = {
            PDF:
              'pdf',
            EXCEL:
              'xlsx',
            CSV:
              'csv',
          };

        enlace.href =
          url;

        enlace.download =
          nombreCodificado
            ? decodeURIComponent(
                nombreCodificado,
              )
            : nombreSimple ||
              `estudiantes-curso-${cursoId}-iusacademy.${extensiones[formato]}`;

        document.body.appendChild(
          enlace,
        );

        enlace.click();
        enlace.remove();

        URL.revokeObjectURL(
          url,
        );

        setModalReportesAbierto(
          false,
        );

        mostrarToast(
          'exito',
          'Reporte descargado',
          `El reporte de estudiantes en ${formato} fue descargado correctamente.`,
        );
      } catch (
        problema
      ) {
        mostrarToast(
          'error',
          'No se pudo descargar',
          problema instanceof Error
            ? problema.message
            : 'No fue posible descargar el reporte de estudiantes.',
        );
      } finally {
        setDescargandoReporte(
          null,
        );
      }
    };

  const copiarCodigo =
    async () => {
      if (
        !curso.codigoInscripcion
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          curso.codigoInscripcion,
        );

        setCodigoCopiado(
          true,
        );

        window.setTimeout(
          () => {
            setCodigoCopiado(
              false,
            );
          },
          1800,
        );
      } catch {
        setCodigoCopiado(
          false,
        );
      }
    };

  if (
    cargando
  ) {
    return (
      <section className="students-section">
        <div className="students-state">
          <span className="spinner" />

          <div>
            <strong>
              Cargando estudiantes
            </strong>

            <p>
              Estamos consultando las inscripciones del curso.
            </p>
          </div>
        </div>

        <style>
          {styles}
        </style>
      </section>
    );
  }

  if (
    error
  ) {
    return (
      <section className="students-section">
        <div className="students-state error">
          <ShieldAlert
            size={23}
          />

          <div>
            <strong>
              No fue posible cargar la información
            </strong>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void cargarEstudiantes()
              }
            >
              Reintentar
            </button>
          </div>
        </div>

        <style>
          {styles}
        </style>
      </section>
    );
  }

  return (
    <section className="students-section">
      <AulaHeader
        icono={Users}
        etiqueta="Gestión académica"
        titulo="Estudiantes inscritos"
        descripcion="Consulta las inscripciones, la última conexión y la actividad reciente del grupo."
        informacion={
          curso.cupoMaximo === null
            ? `${resumen.total} estudiante(s) · Sin límite de cupos`
            : `${resumen.total} de ${curso.cupoMaximo} cupos ocupados`
        }
        acciones={[
          {
            texto:
              'Reportes',
            icono:
              FileText,
            variante:
              'primaria',
            onClick: () =>
              setModalReportesAbierto(
                true,
              ),
          },
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
              void actualizarTodo(),
          },
        ]}
      />

      <section className="summary-grid">
        <Resumen
          icono={
            <Users
              size={21}
            />
          }
          valor={
            String(
              resumen.total,
            )
          }
          titulo="Inscritos"
          descripcion="Estudiantes del curso"
          clase="accent"
        />

        <Resumen
          icono={
            <GraduationCap
              size={21}
            />
          }
          valor={
            resumen.cuposDisponibles ===
            null
              ? '∞'
              : String(
                  resumen.cuposDisponibles,
                )
          }
          titulo="Cupos disponibles"
          descripcion={
            curso.cupoMaximo ===
            null
              ? 'Sin límite definido'
              : `de ${curso.cupoMaximo} plazas`
          }
          clase="success"
        />

        <Resumen
          icono={
            <Activity
              size={21}
            />
          }
          valor={
            resumen.porcentajeOcupacion ===
            null
              ? '—'
              : `${resumen.porcentajeOcupacion}%`
          }
          titulo="Ocupación"
          descripcion={
            curso.cupoMaximo ===
            null
              ? 'Curso sin límite'
              : 'Capacidad utilizada'
          }
          clase="purple"
        />

        <Resumen
          icono={
            <Sparkles
              size={21}
            />
          }
          valor={
            String(
              resumen.recientes,
            )
          }
          titulo="Nuevos esta semana"
          descripcion={`${resumen.conectadosRecientemente} con conexión reciente`}
          clase="warning"
        />
      </section>

      <section className="students-panel">
        <div className="students-panel__top">
          <div>
            <span className="section-eyebrow">
              Directorio del curso
            </span>

            <h3>
              Lista de estudiantes
            </h3>

            <p>
              Busca por nombre o correo y ordena la información según necesites.
            </p>
          </div>

          <div className="results-box">
            <strong>
              {
                estudiantesFiltrados.length
              }
            </strong>

            <span>
              de {total}
            </span>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-card">
            <Search
              size={18}
            />

            <input
              type="search"
              value={
                busqueda
              }
              onChange={(
                evento,
              ) =>
                setBusqueda(
                  evento.target.value,
                )
              }
              placeholder="Buscar estudiante por nombre o correo..."
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
                Limpiar
              </button>
            )}
          </div>

          <div className="order-control">
            {orden ===
            'NOMBRE_DESC' ? (
              <ArrowUpAZ
                size={17}
              />
            ) : (
              <ArrowDownAZ
                size={17}
              />
            )}

            <select
              value={
                orden
              }
              onChange={(
                evento,
              ) =>
                setOrden(
                  evento.target.value as
                    OrdenEstudiantes,
                )
              }
            >
              <option value="RECIENTES">
                Más recientes
              </option>

              <option value="ANTIGUOS">
                Más antiguos
              </option>

              <option value="NOMBRE_ASC">
                Nombre A-Z
              </option>

              <option value="NOMBRE_DESC">
                Nombre Z-A
              </option>
            </select>
          </div>
        </div>
      </section>

      {estudiantesFiltrados.length ===
      0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <UserRound
              size={37}
            />
          </div>

          <strong>
            {total ===
            0
              ? 'Todavía no hay estudiantes inscritos'
              : 'No encontramos coincidencias'}
          </strong>

          <span>
            {total ===
            0
              ? 'Comparte el código de inscripción para que los estudiantes puedan unirse a este curso.'
              : 'Prueba buscando con otro nombre o correo electrónico.'}
          </span>

          {total ===
            0 &&
            curso.codigoInscripcion && (
            <div className="empty-code">
              <span>
                Código de inscripción
              </span>

              <strong>
                {
                  curso.codigoInscripcion
                }
              </strong>

              <button
                type="button"
                onClick={() =>
                  void copiarCodigo()
                }
              >
                {codigoCopiado ? (
                  <Check
                    size={17}
                  />
                ) : (
                  <Copy
                    size={17}
                  />
                )}

                {codigoCopiado
                  ? 'Copiado'
                  : 'Copiar código'}
              </button>
            </div>
          )}

          {busqueda && (
            <button
              type="button"
              className="clear-button"
              onClick={() =>
                setBusqueda(
                  '',
                )
              }
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    Estudiante
                  </th>

                  <th>
                    Correo
                  </th>

                  <th>
                    Última conexión
                  </th>

                  <th>
                    Inscripción
                  </th>

                  <th>
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {estudiantesFiltrados.map(
                  (
                    item,
                  ) => {
                    const conexionReciente =
                      estaConexionReciente(
                        item.estudiante
                          .ultimoAccesoEn,
                      );

                    return (
                      <tr
                        key={
                          item.inscripcionId
                        }
                      >
                        <td>
                          <div className="student-cell">
                            <AvatarUsuario
                              fotoPerfilUrl={
                                item.estudiante
                                  .fotoPerfilUrl
                              }
                              nombres={
                                item.estudiante
                                  .nombres
                              }
                              apellidoPaterno={
                                item.estudiante
                                  .apellidoPaterno
                              }
                              size={
                                46
                              }
                              mostrarEstado={
                                true
                              }
                              estaActivo={
                                conexionReciente
                              }
                            />

                            <div>
                              <strong>
                                {obtenerNombreCompleto(
                                  item.estudiante,
                                )}
                              </strong>

                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="email-cell">
                            <Mail
                              size={15}
                            />

                            <span>
                              {item.estudiante.correo}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="connection-cell">
                            <span
                              className={`connection-dot ${
                                conexionReciente
                                  ? 'online'
                                  : 'offline'
                              }`}
                            />

                            <div>
                              <strong>
                                {formatearTiempoRelativo(
                                  item.estudiante
                                    .ultimoAccesoEn,
                                )}
                              </strong>

                              <span>
                                {item.estudiante
                                  .ultimoAccesoEn
                                  ? formatearFecha(
                                      item.estudiante
                                        .ultimoAccesoEn,
                                    )
                                  : 'Sin registros de acceso'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="date-cell">
                            <CalendarDays
                              size={15}
                            />

                            <div>
                              <strong>
                                {formatearFecha(
                                  item.inscritoEn,
                                )}
                              </strong>

                              <span>
                                Fecha de incorporación
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`enrollment-badge ${item.estadoInscripcion.toLowerCase()}`}
                          >
                            {item.estadoInscripcion ===
                            'ACTIVA'
                              ? 'Inscrito'
                              : 'Retirado'}
                          </span>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          <div className="students-mobile-list">
            {estudiantesFiltrados.map(
              (
                item,
              ) => {
                const conexionReciente =
                  estaConexionReciente(
                    item.estudiante
                      .ultimoAccesoEn,
                  );

                return (
                  <article
                    className="student-mobile-card"
                    key={
                      item.inscripcionId
                    }
                  >
                    <div className="student-mobile-card__top">
                      <div className="student-cell">
                        <AvatarUsuario
                          fotoPerfilUrl={
                            item.estudiante
                              .fotoPerfilUrl
                          }
                          nombres={
                            item.estudiante
                              .nombres
                          }
                          apellidoPaterno={
                            item.estudiante
                              .apellidoPaterno
                          }
                          size={
                            48
                          }
                          mostrarEstado={
                            true
                          }
                          estaActivo={
                            conexionReciente
                          }
                        />

                        <div>
                          <strong>
                            {obtenerNombreCompleto(
                              item.estudiante,
                            )}
                          </strong>

                          <span className="student-cell__secondary">
                            {
                              item.estudiante.correo
                            }
                          </span>
                        </div>
                      </div>

                      <span
                        className={`enrollment-badge ${item.estadoInscripcion.toLowerCase()}`}
                      >
                        {item.estadoInscripcion ===
                        'ACTIVA'
                          ? 'Inscrito'
                          : 'Retirado'}
                      </span>
                    </div>

                    <div className="student-mobile-card__details">
                      <div>
                        <span
                          className={`connection-dot ${
                            conexionReciente
                              ? 'online'
                              : 'offline'
                          }`}
                        />

                        <div>
                          <strong>
                            Última conexión
                          </strong>

                          <span>
                            {formatearTiempoRelativo(
                              item.estudiante
                                .ultimoAccesoEn,
                            )}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Clock3
                          size={15}
                        />

                        <div>
                          <strong>
                            Inscripción
                          </strong>

                          <span>
                            {formatearFecha(
                              item.inscritoEn,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        </>
      )}

      <AulaModal
        abierto={
          modalReportesAbierto
        }
        titulo="Exportar estudiantes"
        etiqueta="Reportes del curso"
        descripcion="Selecciona el formato del directorio de estudiantes inscritos."
        ancho="mediano"
        bloqueado={
          Boolean(
            descargandoReporte,
          )
        }
        onCerrar={() =>
          setModalReportesAbierto(
            false,
          )
        }
      >
        <div className="ec-report-options">
          <button
            type="button"
            className="ec-report-option ec-report-option--pdf"
            disabled={
              Boolean(
                descargandoReporte,
              )
            }
            onClick={() =>
              void descargarReporte(
                'PDF',
              )
            }
          >
            <span className="ec-report-option__icon">
              <FileText
                size={23}
              />
            </span>

            <span className="ec-report-option__text">
              <strong>
                Reporte PDF
              </strong>

              <small>
                Informe institucional verificable con QR y código único.
              </small>
            </span>

            <Download
              size={18}
            />
          </button>

          <button
            type="button"
            className="ec-report-option ec-report-option--excel"
            disabled={
              Boolean(
                descargandoReporte,
              )
            }
            onClick={() =>
              void descargarReporte(
                'EXCEL',
              )
            }
          >
            <span className="ec-report-option__icon">
              <FileSpreadsheet
                size={23}
              />
            </span>

            <span className="ec-report-option__text">
              <strong>
                Reporte Excel
              </strong>

              <small>
                Hoja editable con estudiantes, correo, conexión e inscripción.
              </small>
            </span>

            <Download
              size={18}
            />
          </button>

          <button
            type="button"
            className="ec-report-option ec-report-option--csv"
            disabled={
              Boolean(
                descargandoReporte,
              )
            }
            onClick={() =>
              void descargarReporte(
                'CSV',
              )
            }
          >
            <span className="ec-report-option__icon">
              <FileSpreadsheet
                size={23}
              />
            </span>

            <span className="ec-report-option__text">
              <strong>
                Reporte CSV
              </strong>

              <small>
                Formato ligero para análisis, importación o respaldo de datos.
              </small>
            </span>

            <Download
              size={18}
            />
          </button>

          {descargandoReporte && (
            <div className="ec-report-generating">
              <span className="spinner" />

              Generando reporte
              {' '}
              {descargandoReporte}
              ...
            </div>
          )}

          <div className="ec-report-note">
            El PDF se registra como reporte verificable de IusAcademy e incluye QR, código único y validación pública. Excel y CSV conservan el detalle completo de datos.
          </div>
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

function Resumen({
  icono,
  valor,
  titulo,
  descripcion,
  clase,
}: {
  icono: ReactNode;
  valor: string;
  titulo: string;
  descripcion: string;
  clase: string;
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
          {valor}
        </strong>

        <span>
          {titulo}
        </span>

        <small>
          {descripcion}
        </small>
      </div>
    </article>
  );
}

const styles = `
  .students-section {
    width: 100%;
    min-width: 0;
    display: grid;
    gap: 14px;
    color: var(--app-text);
  }

  .students-state {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 24px;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .students-state.error {
    border-color: var(--app-danger-border);
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .students-state strong {
    display: block;
    color: var(--app-text);
    font-size: 13px;
    font-weight: 700;
  }

  .students-state p {
    margin: 4px 0 0;
    font-size: 10px;
  }

  .students-state button {
    min-height: 36px;
    margin-top: 10px;
    padding: 8px 12px;
    border: 1px solid var(--app-border-strong);
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font-family: inherit;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
  }

  .spinner {
    width: 23px;
    height: 23px;
    flex-shrink: 0;
    border: 3px solid var(--app-border);
    border-top-color: var(--app-accent);
    border-radius: 50%;
    animation: spin .8s linear infinite;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 22px 23px;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .section-header__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .reports-button,
  .refresh-button {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: 12px;
    font-family: inherit;
    font-size: 10px;
    font-weight: 650;
    cursor: pointer;
  }

  .reports-button {
    border: 1px solid var(--app-accent);
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .reports-button:hover {
    background: var(--app-accent-softer);
  }

  .report-feedback {
    margin-top: 10px;
    padding: 10px 13px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    font-size: 9px;
  }

  .ec-report-options {
    display: grid;
    gap: 11px;
  }

  .students-report-option {
    width: 100%;
    display: grid;
    grid-template-columns:
      46px
      minmax(0, 1fr)
      24px;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 16px;
    text-align: left;
    background: var(--app-surface-alt);
    font: inherit;
    cursor: pointer;
  }

  .students-report-option--pdf {
    border: 1px solid var(--app-warning-border);
    color: var(--app-warning);
  }

  .students-report-option--excel {
    border: 1px solid var(--app-success-border);
    color: var(--app-success);
  }

  .students-report-option--csv {
    border: 1px solid var(--app-info-border);
    color: var(--app-info);
  }

  .ec-report-option__icon {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 13px;
  }

  .students-report-option--pdf
  .ec-report-option__icon {
    background: var(--app-warning-bg);
  }

  .students-report-option--excel
  .ec-report-option__icon {
    background: var(--app-success-bg);
  }

  .students-report-option--csv
  .ec-report-option__icon {
    background: var(--app-info-bg);
  }

  .ec-report-option__text {
    min-width: 0;
  }

  .ec-report-option__text strong,
  .ec-report-option__text small {
    display: block;
  }

  .ec-report-option__text strong {
    color: var(--app-text);
    font-size: 11px;
  }

  .ec-report-option__text small {
    margin-top: 4px;
    color: var(--app-text-soft);
    font-size: 9px;
    line-height: 1.45;
  }

  .students-report-option:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .ec-report-generating {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 12px;
    border-radius: 11px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 9px;
    font-weight: 650;
  }

  .section-eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .section-header h2,
  .students-panel h3 {
    margin: 6px 0 0;
    color: var(--app-text);
    font-size: 20px;
    font-weight: 850;
    letter-spacing: -.02em;
  }

  .section-header p,
  .students-panel p {
    margin: 6px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.55;
  }

  .refresh-button {
    border: none;
    color: #fff;
    background: var(--app-accent);
  }

  .refresh-button:disabled {
    opacity: .65;
    cursor: not-allowed;
  }

  .summary-grid {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin: 0;
  }

  .summary-card {
    min-width: 0;
    min-height: 102px;
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 17px 18px;
    border: 1px solid var(--app-border);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition:
      transform .18s ease,
      border-color .18s ease,
      box-shadow .18s ease;
  }

  .summary-card:hover {
    transform: translateY(-2px);
    border-color: var(--app-border-strong);
    box-shadow: var(--app-shadow);
  }

  .summary-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 15px;
  }

  .summary-icon.accent {
    color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .summary-icon.success {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .summary-icon.warning {
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .summary-icon.purple {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .summary-card strong {
    display: block;
    color: var(--app-text);
    font-size: 22px;
    font-weight: 850;
    line-height: 1;
  }

  .summary-card span {
    display: block;
    margin-top: 6px;
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 650;
  }

  .summary-card small {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: 8px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .students-panel {
    margin-bottom: 0;
    padding: 21px 22px;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .students-panel__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .results-box {
    min-width: 86px;
    padding: 9px 12px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
    text-align: right;
  }

  .results-box strong {
    display: block;
    color: var(--app-accent-dark);
    font-size: 18px;
    font-weight: 800;
  }

  .results-box span {
    display: block;
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .toolbar {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      minmax(190px, .35fr);
    gap: 12px;
    margin-top: 17px;
  }

  .search-card,
  .order-control {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px 8px 13px;
    border: 1px solid var(--app-input-border);
    border-radius: 14px;
    color: var(--app-text-muted);
    background: var(--app-surface);
  }

  .search-card:focus-within,
  .order-control:focus-within {
    border-color: var(--app-accent);
    box-shadow:
      0 0 0 4px
      var(--app-input-ring);
  }

  .search-card input,
  .order-control select {
    width: 100%;
    min-width: 0;
    border: none;
    outline: none;
    color: var(--app-text);
    background: transparent;
    font-family: inherit;
    font-size: 11px;
  }

  .order-control select {
    cursor: pointer;
  }

  .search-card button {
    min-height: 30px;
    padding: 6px 10px;
    border: none;
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-family: inherit;
    font-size: 9px;
    font-weight: 600;
    cursor: pointer;
  }

  .table-wrapper {
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--app-border);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  table {
    width: 100%;
    min-width: 1040px;
    border-collapse: separate;
    border-spacing: 0;
  }

  th,
  td {
    padding: 14px 15px;
    border-bottom: 1px solid var(--app-border-soft);
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: var(--app-text-soft);
    background: var(--app-accent-soft);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  td {
    color: var(--app-text-secondary);
    font-size: 10px;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: var(--app-accent-softer);
  }

  .student-cell {
    min-width: 235px;
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .student-cell > div:last-child {
    min-width: 0;
  }

  .student-cell .ius-avatar {
    align-self: center;
  }

  .student-cell strong {
    display: block;
    overflow: hidden;
    color: var(--app-text);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .student-cell__secondary {
    display: block;
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .email-cell {
    min-width: 205px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--app-text-muted);
  }

  .email-cell svg {
    flex-shrink: 0;
    color: var(--app-accent);
  }

  .email-cell span {
    overflow-wrap: anywhere;
  }

  .connection-cell,
  .date-cell {
    min-width: 190px;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .connection-cell strong,
  .date-cell strong {
    display: block;
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 650;
  }

  .connection-cell span,
  .date-cell span {
    display: block;
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .date-cell > svg {
    flex-shrink: 0;
    color: var(--app-purple);
  }

  .connection-dot {
    width: 9px;
    height: 9px;
    flex-shrink: 0;
    border-radius: 50%;
    box-shadow:
      0 0 0 4px
      var(--app-surface-alt);
  }

  .connection-dot.online {
    background: var(--app-success);
  }

  .connection-dot.offline {
    background: var(--app-text-muted);
  }

  .enrollment-badge {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 650;
  }

  .enrollment-badge.activa {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .enrollment-badge.retirada {
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .students-mobile-list {
    display: none;
  }

  .empty-state {
    min-height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 30px;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    text-align: center;
    box-shadow: var(--app-shadow-sm);
  }

  .empty-icon {
    width: 66px;
    height: 66px;
    display: grid;
    place-items: center;
    margin-bottom: 4px;
    border-radius: 20px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .empty-state > strong {
    color: var(--app-text);
    font-size: 15px;
  }

  .empty-state > span {
    max-width: 470px;
    font-size: 10px;
    line-height: 1.55;
  }

  .empty-code {
    min-width: min(340px, 100%);
    display: grid;
    gap: 7px;
    margin-top: 12px;
    padding: 15px;
    border: 1px dashed var(--app-border-strong);
    border-radius: 16px;
    background: var(--app-surface-alt);
  }

  .empty-code > span {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .empty-code > strong {
    color: var(--app-accent-dark);
    font-size: 22px;
    font-weight: 800;
    letter-spacing: .15em;
  }

  .empty-code button,
  .clear-button {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: 5px;
    padding: 9px 13px;
    border: 1px solid var(--app-border-strong);
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font-family: inherit;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
  }


  .ec-report-options {
    display: grid;
    gap: 12px;
  }

  .ec-report-option {
    width: 100%;
    display: grid;
    grid-template-columns:
      48px
      minmax(0, 1fr)
      24px;
    align-items: center;
    gap: 13px;
    padding: 16px;
    border-radius: 17px;
    text-align: left;
    background: var(--app-surface-alt);
    font: inherit;
    cursor: pointer;
  }

  .ec-report-option--pdf {
    border: 1px solid var(--app-warning-border);
    color: var(--app-warning);
  }

  .ec-report-option--excel {
    border: 1px solid var(--app-success-border);
    color: var(--app-success);
  }

  .ec-report-option--csv {
    border: 1px solid var(--app-info-border);
    color: var(--app-info);
  }

  .ec-report-option__icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 14px;
  }

  .ec-report-option--pdf
  .ec-report-option__icon {
    background: var(--app-warning-bg);
  }

  .ec-report-option--excel
  .ec-report-option__icon {
    background: var(--app-success-bg);
  }

  .ec-report-option--csv
  .ec-report-option__icon {
    background: var(--app-info-bg);
  }

  .ec-report-option__text {
    min-width: 0;
  }

  .ec-report-option__text strong,
  .ec-report-option__text small {
    display: block;
  }

  .ec-report-option__text strong {
    color: var(--app-text);
    font-size: 12px;
  }

  .ec-report-option__text small {
    margin-top: 4px;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.5;
  }

  .ec-report-option:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .ec-report-generating,
  .ec-report-note {
    padding: 12px 14px;
    border-radius: 13px;
    color: var(--app-warning-strong);
    background: var(--app-bg-soft);
    font-size: 10px;
    line-height: 1.55;
  }

  .ec-report-generating {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 750;
  }

  .ec-report-note {
    border-left: 4px solid var(--app-accent);
  }

  .spin {
    animation: spin .8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  html[data-theme='oscuro'] th {
    background: var(--app-surface-raised);
  }

  @media (max-width: 1180px) {
    .summary-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .section-header {
      align-items: stretch;
      flex-direction: column;
    }

    .section-header__actions {
      width: 100%;
    }

    .reports-button,
    .refresh-button {
      flex: 1;
    }

    .toolbar {
      grid-template-columns: 1fr;
    }

    .table-wrapper {
      display: none;
    }

    .students-mobile-list {
      display: grid;
      gap: 12px;
    }

    .student-mobile-card {
      padding: 16px;
      border: 1px solid var(--app-border);
      border-radius: 18px;
      background: var(--app-surface);
      box-shadow: var(--app-shadow-sm);
    }

    .student-mobile-card__top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .student-mobile-card .student-cell {
      min-width: 0;
      flex: 1;
    }

    .student-mobile-card .student-cell strong,
    .student-mobile-card .student-cell span {
      white-space: normal;
    }

    .student-mobile-card__details {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 14px;
      padding-top: 13px;
      border-top: 1px solid var(--app-border-soft);
    }

    .student-mobile-card__details > div {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: var(--app-text-muted);
      font-size: 9px;
    }

    .student-mobile-card__details strong {
      display: block;
      color: var(--app-text-secondary);
      font-size: 9px;
      font-weight: 650;
    }

    .student-mobile-card__details span {
      display: block;
      margin-top: 3px;
      font-size: 8px;
    }

    .student-mobile-card__details svg {
      flex-shrink: 0;
      color: var(--app-purple);
    }
  }

  @media (max-width: 620px) {
    .ec-report-option {
      grid-template-columns:
        44px
        minmax(0, 1fr);
    }

    .ec-report-option > svg {
      display: none;
    }

    .summary-grid {
      grid-template-columns: 1fr;
    }

    .students-panel {
      padding: 18px;
    }

    .students-panel__top {
      flex-direction: column;
    }

    .results-box {
      width: 100%;
      text-align: left;
    }

    .student-mobile-card__top {
      flex-direction: column;
    }

    .student-mobile-card__details {
      grid-template-columns: 1fr;
    }
  }
`;