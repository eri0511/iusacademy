import {
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  CircleDashed,
  Download,
  FileSpreadsheet,
  FileText,
  MessageSquareText,
  RefreshCw,
  Search,
  Sigma,
  UsersRound,
} from 'lucide-react';

import {
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
import DetalleActividadCalificacionModal from '../../../components/calificaciones/DetalleActividadCalificacionModal';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import {
  useCalificacionesCurso,
} from '../../../hooks/calificaciones/useCalificacionesCurso';

import type {
  ActividadLibroDocente,
  ComponenteCalificacion,
  EstudianteLibro,
  OrigenCalificacion,
} from '../../../types/calificaciones/calificaciones.types';

const nombreOrigen: Record<
  OrigenCalificacion,
  string
> = {
  FORO:
    'Foro',
  TAREA:
    'Tarea',
  QUIZ:
    'Quiz',
};

function IconoOrigen({
  origen,
  size = 15,
}: {
  origen: OrigenCalificacion;
  size?: number;
}) {
  if (
    origen ===
    'FORO'
  ) {
    return (
      <MessageSquareText
        size={size}
      />
    );
  }

  if (
    origen ===
    'QUIZ'
  ) {
    return (
      <BrainCircuit
        size={size}
      />
    );
  }

  return (
    <FileText
      size={size}
    />
  );
}

function nombreCompleto(
  estudiante: EstudianteLibro,
) {
  return [
    estudiante.apellidoPaterno,
    estudiante.apellidoMaterno,
    estudiante.nombres,
  ]
    .filter(
      Boolean,
    )
    .join(
      ' ',
    );
}

function iniciales(
  estudiante: EstudianteLibro,
) {
  const primera =
    estudiante.nombres
      ?.trim()
      .charAt(
        0,
      ) ??
    '';

  const segunda =
    estudiante.apellidoPaterno
      ?.trim()
      .charAt(
        0,
      ) ??
    '';

  return `${primera}${segunda}`.toUpperCase();
}

function formatoDecimal(
  valor: number,
) {
  return Number.isFinite(
    valor,
  )
    ? valor.toFixed(
        2,
      )
    : '0.00';
}

export default function CalificacionesCurso() {
  const navigate =
    useNavigate();

  const {
    cursoId:
      cursoIdParam,
  } =
    useParams();

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
    componente,
    setComponente,
  ] =
    useState<ComponenteCalificacion>(
      'CONTINUA',
    );

  const [
    busqueda,
    setBusqueda,
  ] =
    useState(
      '',
    );

  const [
    actividadDetalle,
    setActividadDetalle,
  ] =
    useState<ActividadLibroDocente | null>(
      null,
    );

  const [
    modalReportesAbierto,
    setModalReportesAbierto,
  ] =
    useState(
      false,
    );

  const cursoId =
    Number(
      cursoIdParam,
    );

  const {
    datos,
    cargando,
    formatoExportando,
    error,
    recargar,
    exportar,
  } =
    useCalificacionesCurso({
      cursoId,
      hitoId:
        hitoSeleccionado?.id,
      token:
        accessToken,
    });

  const actividades =
    useMemo(
      () =>
        datos?.actividades.filter(
          (
            actividad,
          ) =>
            actividad.componente ===
              componente &&
            actividad.estado !==
              'ANULADA',
        ) ??
        [],
      [
        datos,
        componente,
      ],
    );

  const estudiantes =
    useMemo(
      () => {
        const termino =
          busqueda
            .trim()
            .toLowerCase();

        if (
          !datos
        ) {
          return [];
        }

        if (
          !termino
        ) {
          return datos.estudiantes;
        }

        return datos.estudiantes.filter(
          (
            estudiante,
          ) =>
            `${nombreCompleto(
              estudiante,
            )} ${
              estudiante.correo
            }`
              .toLowerCase()
              .includes(
                termino,
              ),
        );
      },
      [
        datos,
        busqueda,
      ],
    );

  const resumenCurso =
    useMemo(
      () => {
        if (
          !datos
        ) {
          return {
            promedio:
              0,
            aporte:
              0,
            notaFinal:
              0,
            calificadas:
              0,
            pendientes:
              0,
            publicadas:
              0,
          };
        }

        const resumenes =
          datos.estudiantes.map(
            (
              estudiante,
            ) =>
              componente ===
              'CONTINUA'
                ? estudiante.continua
                : estudiante.procesual,
          );

        const conNota =
          resumenes.filter(
            (
              resumen,
            ) =>
              resumen.actividadesCalificadas >
              0,
          );

        const promedio =
          conNota.length >
          0
            ? conNota.reduce(
                (
                  suma,
                  resumen,
                ) =>
                  suma +
                  resumen.promedioSobre100,
                0,
              ) /
              conNota.length
            : 0;

        const aporte =
          conNota.length >
          0
            ? conNota.reduce(
                (
                  suma,
                  resumen,
                ) =>
                  suma +
                  resumen.notaExacta,
                0,
              ) /
              conNota.length
            : 0;

        return {
          promedio,
          aporte,

          notaFinal:
            Math.round(
              aporte,
            ),

          calificadas:
            actividades.reduce(
              (
                suma,
                actividad,
              ) =>
                suma +
                actividad.resumen.calificadas,
              0,
            ),

          pendientes:
            actividades.reduce(
              (
                suma,
                actividad,
              ) =>
                suma +
                actividad.resumen.pendientes,
              0,
            ),

          publicadas:
            actividades.reduce(
              (
                suma,
                actividad,
              ) =>
                suma +
                actividad.resumen.publicadas,
              0,
            ),
        };
      },
      [
        datos,
        actividades,
        componente,
      ],
    );

  const obtenerResumenEstudiante =
    (
      estudiante: EstudianteLibro,
    ) =>
      componente ===
      'CONTINUA'
        ? estudiante.continua
        : estudiante.procesual;

  const irAActividad =
    (
      actividad: ActividadLibroDocente,
    ) => {
      if (
        actividad.origen ===
          'FORO' &&
        actividad.foroId
      ) {
        navigate(
          `/docente/cursos/${cursoId}/foro/${actividad.foroId}`,
        );

        return;
      }

      if (
        actividad.origen ===
          'TAREA' &&
        actividad.tareaId
      ) {
        navigate(
          `/docente/cursos/${cursoId}/tareas/${actividad.tareaId}`,
        );

        return;
      }

      if (
        actividad.origen ===
          'QUIZ' &&
        actividad.quizId
      ) {
        navigate(
          `/docente/cursos/${cursoId}/quizzes/${actividad.quizId}`,
        );

        return;
      }

      setActividadDetalle(
        actividad,
      );
    };

  if (
    !hitoSeleccionado
  ) {
    return (
      <AulaEmptyState
        titulo="Selecciona un hito"
        descripcion="El libro de calificaciones se organiza por hito académico."
        icono={
          BookOpenCheck
        }
      />
    );
  }

  const maximoComponente =
    componente ===
    'CONTINUA'
      ? datos?.hito
          .puntajeContinua ??
        hitoSeleccionado
          .puntajeContinua
      : datos?.hito
          .puntajeProcesual ??
        hitoSeleccionado
          .puntajeProcesual;

  return (
    <section className="calificaciones-docente">
      <AulaHeader
        icono={
          BookOpenCheck
        }
        etiqueta={`${hitoSeleccionado.codigo} · ${curso.materia.codigo}`}
        titulo="Libro de calificaciones"
        descripcion="Seguimiento integral de Continua y Procesual. Consulta el desempeño por actividad, el aporte exacto y la nota final del componente."
        informacion={`${curso.materia.nombre} · ${curso.gestion} · Paralelo ${curso.paralelo}`}
        acciones={[
          {
            texto:
              'Actualizar',
            icono:
              RefreshCw,
            onClick:
              () => {
                void recargar();
              },
          },
          {
            texto:
              'Reportes',
            icono:
              FileText,
            variante:
              'primaria',
            onClick:
              () => {
                setModalReportesAbierto(
                  true,
                );
              },
          },
        ]}
      />

      <div className="calificaciones-docente__tabs">
        <button
          type="button"
          className={
            componente ===
            'CONTINUA'
              ? 'activo'
              : ''
          }
          onClick={() =>
            setComponente(
              'CONTINUA',
            )
          }
        >
          <span className="calificaciones-docente__tab-titulo">
            Continua
          </span>

          <span className="calificaciones-docente__tab-puntos">
            {datos?.hito
              .puntajeContinua ??
              hitoSeleccionado
                .puntajeContinua}{' '}
            puntos
          </span>
        </button>

        <button
          type="button"
          className={
            componente ===
            'PROCESUAL'
              ? 'activo'
              : ''
          }
          onClick={() =>
            setComponente(
              'PROCESUAL',
            )
          }
        >
          <span className="calificaciones-docente__tab-titulo">
            Procesual
          </span>

          <span className="calificaciones-docente__tab-puntos">
            {datos?.hito
              .puntajeProcesual ??
              hitoSeleccionado
                .puntajeProcesual}{' '}
            puntos
          </span>
        </button>
      </div>

      {cargando
        ? (
            <AulaSkeleton
              cantidad={
                4
              }
              variante="lista"
            />
          )
        : error
          ? (
              <AulaEmptyState
                titulo="No se pudieron cargar las calificaciones"
                descripcion={
                  error
                }
                icono={
                  BookOpenCheck
                }
                accionTexto="Reintentar"
                onAccion={() => {
                  void recargar();
                }}
              />
            )
          : datos
            ? (
                <>
                  <div className="calificaciones-docente__resumen-grid">
                    <article className="calificaciones-docente__resumen-card">
                      <div className="calificaciones-docente__resumen-card-top">
                        <span className="calificaciones-docente__resumen-icono">
                          <Sigma
                            size={
                              17
                            }
                          />
                        </span>

                        <span>
                          Promedio del curso
                        </span>
                      </div>

                      <div className="calificaciones-docente__resumen-valor">
                        <strong>
                          {formatoDecimal(
                            resumenCurso.promedio,
                          )}
                        </strong>

                        <small>
                          /100
                        </small>
                      </div>

                      <p>
                        Promedio exacto del componente.
                      </p>
                    </article>

                    <article className="calificaciones-docente__resumen-card">
                      <div className="calificaciones-docente__resumen-card-top">
                        <span className="calificaciones-docente__resumen-icono">
                          <BookOpenCheck
                            size={
                              17
                            }
                          />
                        </span>

                        <span>
                          Aporte promedio
                        </span>
                      </div>

                      <div className="calificaciones-docente__resumen-valor">
                        <strong>
                          {formatoDecimal(
                            resumenCurso.aporte,
                          )}
                        </strong>

                        <small>
                          /
                          {
                            maximoComponente
                          }
                        </small>
                      </div>

                      <p>
                        Conversión exacta del componente.
                      </p>
                    </article>

                    <article className="calificaciones-docente__resumen-card">
                      <div className="calificaciones-docente__resumen-card-top">
                        <span className="calificaciones-docente__resumen-icono">
                          <CheckCircle2
                            size={
                              17
                            }
                          />
                        </span>

                        <span>
                          Nota final promedio
                        </span>
                      </div>

                      <div className="calificaciones-docente__resumen-valor">
                        <strong>
                          {
                            resumenCurso.notaFinal
                          }
                        </strong>

                        <small>
                          /
                          {
                            maximoComponente
                          }
                        </small>
                      </div>

                      <p>
                        Resultado final redondeado.
                      </p>
                    </article>

                    <article className="calificaciones-docente__resumen-card">
                      <div className="calificaciones-docente__resumen-card-top">
                        <span className="calificaciones-docente__resumen-icono">
                          <CircleDashed
                            size={
                              17
                            }
                          />
                        </span>

                        <span>
                          Pendientes
                        </span>
                      </div>

                      <div className="calificaciones-docente__resumen-valor">
                        <strong>
                          {
                            resumenCurso.pendientes
                          }
                        </strong>
                      </div>

                      <p>
                        {
                          resumenCurso.publicadas
                        }{' '}
                        publicadas ·{' '}
                        {
                          resumenCurso.calificadas
                        }{' '}
                        registradas
                      </p>
                    </article>
                  </div>

                  <div className="calificaciones-docente__barra">
                    <div className="calificaciones-docente__busqueda">
                      <Search
                        size={
                          17
                        }
                      />

                      <input
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
                    </div>

                    <div className="calificaciones-docente__estados">
                      <span className="calificaciones-docente__estado publicada">
                        <CheckCircle2
                          size={
                            12
                          }
                        />
                        Publicada
                      </span>

                      <span className="calificaciones-docente__estado calificada">
                        <CircleDashed
                          size={
                            12
                          }
                        />
                        Calificada
                      </span>

                      <span className="calificaciones-docente__estado pendiente">
                        <CircleDashed
                          size={
                            12
                          }
                        />
                        Pendiente
                      </span>
                    </div>
                  </div>

                  {actividades.length ===
                  0
                    ? (
                        <AulaEmptyState
                          titulo={`Sin actividades ${
                            componente ===
                            'CONTINUA'
                              ? 'continuas'
                              : 'procesuales'
                          }`}
                          descripcion="Todavía no existen actividades calificables de este componente en el hito seleccionado."
                          icono={
                            BookOpenCheck
                          }
                        />
                      )
                    : estudiantes.length ===
                        0
                      ? (
                          <AulaEmptyState
                            titulo="Sin coincidencias"
                            descripcion="No encontramos estudiantes con la búsqueda indicada."
                            icono={
                              UsersRound
                            }
                          />
                        )
                      : (
                          <div className="calificaciones-docente__tabla-card">
                            <div className="calificaciones-docente__tabla-info">
                              <div className="calificaciones-docente__tabla-info-principal">
                                <span className="calificaciones-docente__tabla-icono">
                                  <Sigma
                                    size={
                                      18
                                    }
                                  />
                                </span>

                                <div>
                                  <strong>
                                    {componente ===
                                    'CONTINUA'
                                      ? 'Evaluación continua'
                                      : 'Evaluación procesual'}
                                  </strong>

                                  <small>
                                    {
                                      estudiantes.length
                                    }{' '}
                                    estudiantes ·{' '}
                                    {
                                      actividades.length
                                    }{' '}
                                    actividades
                                  </small>
                                </div>
                              </div>
                            </div>

                            <div className="calificaciones-docente__tabla-wrap">
                              <table className="calificaciones-docente__tabla">
                                <thead>
                                  <tr className="fila-grupos">
                                    <th
                                      className="col-estudiante"
                                      rowSpan={
                                        2
                                      }
                                    >
                                      <div className="calificaciones-docente__cabecera-estudiante">
                                        <UsersRound
                                          size={
                                            16
                                          }
                                        />

                                        <span>
                                          Estudiante
                                        </span>
                                      </div>
                                    </th>

                                    <th
                                      className="grupo-actividades"
                                      colSpan={
                                        actividades.length
                                      }
                                    >
                                      Actividades calificables
                                    </th>

                                    <th
                                      className="grupo-resultado"
                                      colSpan={
                                        3
                                      }
                                    >
                                      Resultado del componente
                                    </th>
                                  </tr>

                                  <tr className="fila-columnas">
                                    {actividades.map(
                                      (
                                        actividad,
                                      ) => (
                                        <th
                                          key={
                                            actividad.id
                                          }
                                          className="col-actividad"
                                        >
                                          <button
                                            type="button"
                                            className="calificaciones-docente__actividad-btn"
                                            onClick={() =>
                                              setActividadDetalle(
                                                actividad,
                                              )
                                            }
                                          >
                                            <span className="calificaciones-docente__origen">
                                              <IconoOrigen
                                                origen={
                                                  actividad.origen
                                                }
                                              />

                                              {
                                                nombreOrigen[
                                                  actividad.origen
                                                ]
                                              }
                                            </span>

                                            <strong>
                                              {
                                                actividad.titulo
                                              }
                                            </strong>

                                            <small>
                                              Prom.{' '}
                                              {formatoDecimal(
                                                actividad.resumen.promedio,
                                              )}
                                            </small>

                                            <span className="calificaciones-docente__actividad-progreso">
                                              {
                                                actividad.resumen.calificadas
                                              }
                                              /
                                              {
                                                actividad.resumen.totalEstudiantes
                                              }{' '}
                                              calificadas
                                            </span>
                                          </button>
                                        </th>
                                      ),
                                    )}

                                    <th className="col-promedio resumen-cabecera">
                                      <strong>
                                        Promedio
                                      </strong>

                                      <small>
                                        Exacto /100
                                      </small>
                                    </th>

                                    <th className="col-aporte resumen-cabecera">
                                      <strong>
                                        Aporte
                                      </strong>

                                      <small>
                                        Exacto /
                                        {
                                          maximoComponente
                                        }
                                      </small>
                                    </th>

                                    <th className="col-final resumen-cabecera">
                                      <strong>
                                        Nota final
                                      </strong>

                                      <small>
                                        Redondeada
                                      </small>
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {estudiantes.map(
                                    (
                                      estudiante,
                                    ) => {
                                      const resumen =
                                        obtenerResumenEstudiante(
                                          estudiante,
                                        );

                                      return (
                                        <tr
                                          key={
                                            estudiante.id
                                          }
                                        >
                                          <td className="col-estudiante">
                                            <div className="calificaciones-docente__estudiante">
                                              <span className="calificaciones-docente__avatar">
                                                {iniciales(
                                                  estudiante,
                                                )}
                                              </span>

                                              <div>
                                                <strong>
                                                  {nombreCompleto(
                                                    estudiante,
                                                  )}
                                                </strong>

                                                <small>
                                                  {
                                                    estudiante.correo
                                                  }
                                                </small>
                                              </div>
                                            </div>
                                          </td>

                                          {actividades.map(
                                            (
                                              actividad,
                                            ) => {
                                              const calificacion =
                                                actividad.calificaciones.find(
                                                  (
                                                    item,
                                                  ) =>
                                                    item.estudianteId ===
                                                    estudiante.id,
                                                ) ??
                                                null;

                                              const claseEstado =
                                                !calificacion
                                                  ? 'pendiente'
                                                  : calificacion.estado ===
                                                      'PUBLICADA'
                                                    ? 'publicada'
                                                    : 'calificada';

                                              return (
                                                <td
                                                  key={
                                                    actividad.id
                                                  }
                                                  className="col-nota"
                                                >
                                                  {calificacion
                                                    ? (
                                                        <button
                                                          type="button"
                                                          className={`calificaciones-docente__nota ${claseEstado}`}
                                                          onClick={() =>
                                                            setActividadDetalle(
                                                              actividad,
                                                            )
                                                          }
                                                          title="Ver detalle de la actividad"
                                                        >
                                                          <strong>
                                                            {formatoDecimal(
                                                              calificacion.notaFinal,
                                                            )}
                                                          </strong>

                                                          <small>
                                                            /100
                                                          </small>

                                                          <span>
                                                            {calificacion.estado ===
                                                            'PUBLICADA'
                                                              ? (
                                                                  <CheckCircle2
                                                                    size={
                                                                      11
                                                                    }
                                                                  />
                                                                )
                                                              : (
                                                                  <CircleDashed
                                                                    size={
                                                                      11
                                                                    }
                                                                  />
                                                                )}

                                                            {calificacion.estado ===
                                                            'PUBLICADA'
                                                              ? 'Publicada'
                                                              : 'Calificada'}
                                                          </span>
                                                        </button>
                                                      )
                                                    : (
                                                        <button
                                                          type="button"
                                                          className="calificaciones-docente__nota pendiente calificaciones-docente__nota--accion"
                                                          onClick={() =>
                                                            irAActividad(
                                                              actividad,
                                                            )
                                                          }
                                                          title="Ir a la actividad para calificar"
                                                        >
                                                          <strong>
                                                            —
                                                          </strong>

                                                          <span>
                                                            <CircleDashed
                                                              size={
                                                                11
                                                              }
                                                            />
                                                            Pendiente
                                                          </span>

                                                          <small className="calificaciones-docente__nota-ayuda">
                                                            Ir a calificar
                                                          </small>
                                                        </button>
                                                      )}
                                                </td>
                                              );
                                            },
                                          )}

                                          <td className="col-promedio resultado-celda">
                                            <div className="calificaciones-docente__resultado">
                                              <strong>
                                                {formatoDecimal(
                                                  resumen.promedioSobre100,
                                                )}
                                              </strong>

                                              <small>
                                                /100
                                              </small>
                                            </div>
                                          </td>

                                          <td className="col-aporte resultado-celda">
                                            <div className="calificaciones-docente__resultado">
                                              <strong>
                                                {formatoDecimal(
                                                  resumen.notaExacta,
                                                )}
                                              </strong>

                                              <small>
                                                /
                                                {
                                                  resumen.maximo
                                                }
                                              </small>
                                            </div>
                                          </td>

                                          <td className="col-final resultado-celda">
                                            <div className="calificaciones-docente__resultado final">
                                              <strong>
                                                {
                                                  resumen.notaRedondeada
                                                }
                                              </strong>

                                              <small>
                                                /
                                                {
                                                  resumen.maximo
                                                }
                                              </small>

                                              <span>
                                                Final
                                              </span>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    },
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                </>
              )
            : (
                <AulaEmptyState
                  titulo="Sin datos de calificaciones"
                  descripcion="No se encontraron registros para el hito seleccionado."
                  icono={
                    BookOpenCheck
                  }
                />
              )}

      <AulaModal
        abierto={
          modalReportesAbierto
        }
        titulo="Exportar libro de calificaciones"
        etiqueta="Reportes del hito"
        descripcion={`Selecciona el formato del reporte académico de ${hitoSeleccionado.codigo}.`}
        ancho="mediano"
        bloqueado={Boolean(
          formatoExportando,
        )}
        onCerrar={() =>
          setModalReportesAbierto(
            false,
          )
        }
      >
        <div className="calificaciones-docente__modal-reportes">
          {([
            [
              'PDF',
              FileText,
              'Informe institucional verificable con QR y resumen académico.',
            ],
            [
              'EXCEL',
              FileSpreadsheet,
              'Libro editable para revisión, filtros y análisis docente.',
            ],
            [
              'CSV',
              FileSpreadsheet,
              'Datos tabulares para procesamiento o respaldo.',
            ],
          ] as const).map(
            (
              [
                formato,
                Icono,
                descripcion,
              ],
            ) => (
              <button
                key={
                  formato
                }
                type="button"
                className="calificaciones-docente__opcion-reporte"
                disabled={Boolean(
                  formatoExportando,
                )}
                onClick={() => {
                  void exportar(
                    formato,
                  );
                }}
              >
                <span className="calificaciones-docente__opcion-reporte-icono">
                  <Icono
                    size={
                      21
                    }
                  />
                </span>

                <span className="calificaciones-docente__opcion-reporte-texto">
                  <strong>
                    {
                      formato
                    }
                  </strong>

                  <small>
                    {
                      descripcion
                    }
                  </small>
                </span>

                <Download
                  size={
                    16
                  }
                />
              </button>
            ),
          )}

          {formatoExportando && (
            <div className="calificaciones-docente__reporte-cargando">
              <RefreshCw
                size={
                  15
                }
                className="spin"
              />

              Generando{' '}
              {
                formatoExportando
              }
              …
            </div>
          )}
        </div>
      </AulaModal>

      <DetalleActividadCalificacionModal
        actividad={
          actividadDetalle
        }
        estudiantes={
          datos?.estudiantes ??
          []
        }
        cursoId={
          cursoId
        }
        onCerrar={() =>
          setActividadDetalle(
            null,
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
.calificaciones-docente {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.calificaciones-docente__tabs {
  display: inline-flex;
  width: fit-content;
  padding: 4px;
  gap: 4px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface);
}

.calificaciones-docente__tabs button {
  min-width: 156px;
  padding: 10px 14px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  text-align: left;
  transition: .18s ease;
}

.calificaciones-docente__tabs button:hover {
  background: var(--app-surface-alt);
}

.calificaciones-docente__tabs button.activo {
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.calificaciones-docente__tab-titulo,
.calificaciones-docente__tab-puntos {
  display: block;
}

.calificaciones-docente__tab-titulo {
  font-size: 14px;
  font-weight: 850;
}

.calificaciones-docente__tab-puntos {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 700;
  opacity: .78;
}

.calificaciones-docente__resumen-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.calificaciones-docente__resumen-card {
  min-height: 108px;
  padding: 15px 16px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 52%, var(--app-border));
  border-radius: 14px;
  background: #fff;
  box-shadow: none;
}

.calificaciones-docente__resumen-card:hover {
  border-color: var(--app-accent);
}

.calificaciones-docente__resumen-card-top {
  display: flex;
  align-items: center;
  gap: 9px;
}

.calificaciones-docente__resumen-card-top > span:last-child {
  color: var(--app-text-muted);
  font-size: 9.5px;
  font-weight: 850;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.calificaciones-docente__resumen-icono {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  flex: 0 0 31px;
  border-radius: 8px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.calificaciones-docente__resumen-valor {
  margin-top: 9px;
}

.calificaciones-docente__resumen-valor strong {
  color: var(--app-text);
  font-size: 27px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.03em;
}

.calificaciones-docente__resumen-valor small {
  margin-left: 3px;
  color: var(--app-text-muted);
  font-size: 10px;
  font-weight: 700;
}

.calificaciones-docente__resumen-card p {
  margin: 8px 0 0;
  color: var(--app-text-muted);
  font-size: 9px;
  line-height: 1.35;
}

.calificaciones-docente__barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.calificaciones-docente__busqueda {
  width: min(430px, 100%);
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
  border: 1px solid var(--app-border);
  border-radius: 11px;
  color: var(--app-text-muted);
  background: var(--app-surface);
}

.calificaciones-docente__busqueda:focus-within {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-accent) 8%, transparent);
}

.calificaciones-docente__busqueda input {
  width: 100%;
  height: 40px;
  border: 0;
  outline: 0;
  color: var(--app-text);
  background: transparent;
  font: inherit;
  font-size: 10px;
}

.calificaciones-docente__estados {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}

.calificaciones-docente__estado {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  font-size: 8.5px;
  font-weight: 800;
  white-space: nowrap;
}

.calificaciones-docente__estado.publicada {
  color: #15803d;
  border-color: color-mix(in srgb, #22c55e 28%, var(--app-border));
  background: #f0fdf4;
}

.calificaciones-docente__estado.calificada {
  color: #1d4ed8;
  border-color: color-mix(in srgb, #3b82f6 28%, var(--app-border));
  background: #eff6ff;
}

.calificaciones-docente__estado.pendiente {
  color: #b45309;
  border-color: color-mix(in srgb, #f59e0b 30%, var(--app-border));
  background: #fffbeb;
}

.calificaciones-docente__tabla-card {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface);
  box-shadow: 0 8px 25px rgba(15, 23, 42, .045);
}

.calificaciones-docente__tabla-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 15px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-surface);
}

.calificaciones-docente__tabla-info-principal {
  display: flex;
  align-items: center;
  gap: 9px;
}

.calificaciones-docente__tabla-icono {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.calificaciones-docente__tabla-info strong,
.calificaciones-docente__tabla-info small {
  display: block;
}

.calificaciones-docente__tabla-info strong {
  color: var(--app-text);
  font-size: 13px;
}

.calificaciones-docente__tabla-info small {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 10px;
}

.calificaciones-docente__tabla-wrap {
  width: 100%;
  overflow: auto;
  scrollbar-width: thin;
}

.calificaciones-docente__tabla {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
}

.calificaciones-docente__tabla th,
.calificaciones-docente__tabla td {
  border-right: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
}

.calificaciones-docente__tabla th:last-child,
.calificaciones-docente__tabla td:last-child {
  border-right: 0;
}

.calificaciones-docente__tabla tbody tr:last-child td {
  border-bottom: 0;
}

.calificaciones-docente__tabla thead th {
  color: var(--app-text);
}

.calificaciones-docente__tabla .fila-grupos th {
  position: sticky;
  top: 0;
  z-index: 7;
  height: 39px;
  padding: 9px 12px;
  background: var(--app-surface-alt);
  color: var(--app-text-muted);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: .05em;
  text-align: center;
  text-transform: uppercase;
}

.calificaciones-docente__tabla .fila-grupos .grupo-resultado {
  color: var(--app-accent-dark);
  background: color-mix(in srgb, var(--app-accent) 7%, var(--app-surface));
}

.calificaciones-docente__tabla .fila-columnas th {
  position: sticky;
  top: 39px;
  z-index: 6;
  background: var(--app-surface);
}

.calificaciones-docente__tabla .col-estudiante {
  position: sticky;
  left: 0;
  z-index: 5;
  width: 255px;
  min-width: 255px;
  max-width: 255px;
  background: var(--app-surface);
  box-shadow: 5px 0 12px rgba(15, 23, 42, .025);
}

.calificaciones-docente__tabla thead .col-estudiante {
  z-index: 10 !important;
  background: var(--app-surface-alt) !important;
}

.calificaciones-docente__cabecera-estudiante {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
}

.calificaciones-docente__tabla .col-actividad {
  width: 160px;
  min-width: 160px;
  max-width: 160px;
  padding: 0;
  vertical-align: stretch;
}

.calificaciones-docente__actividad-btn {
  width: 100%;
  min-height: 112px;
  display: grid;
  align-content: center;
  gap: 5px;
  padding: 11px 10px;
  border: 0;
  color: var(--app-text);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background .16s ease;
}

.calificaciones-docente__actividad-btn:hover {
  background: var(--app-accent-soft);
}

.calificaciones-docente__actividad-btn:hover strong {
  color: var(--app-accent-dark);
}

.calificaciones-docente__origen {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border: 1px solid var(--app-border);
  border-radius: 6px;
  color: var(--app-text-muted);
  background: var(--app-surface-alt);
  font-size: 8px;
  font-weight: 800;
}

.calificaciones-docente__actividad-btn strong {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: var(--app-text);
  font-size: 10.5px;
  line-height: 1.3;
}

.calificaciones-docente__actividad-btn small {
  color: var(--app-text-muted);
  font-size: 8.5px;
}

.calificaciones-docente__actividad-progreso {
  color: var(--app-text-muted);
  font-size: 8.5px;
  font-weight: 700;
}

.calificaciones-docente__tabla .resumen-cabecera {
  min-width: 112px;
  padding: 12px 10px;
  text-align: center;
  background: color-mix(in srgb, var(--app-accent) 4%, var(--app-surface)) !important;
}

.calificaciones-docente__tabla .resumen-cabecera strong,
.calificaciones-docente__tabla .resumen-cabecera small {
  display: block;
}

.calificaciones-docente__tabla .resumen-cabecera strong {
  color: var(--app-text);
  font-size: 10.5px;
}

.calificaciones-docente__tabla .resumen-cabecera small {
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 8.5px;
  font-weight: 650;
}

.calificaciones-docente__tabla .col-promedio,
.calificaciones-docente__tabla .col-aporte,
.calificaciones-docente__tabla .col-final {
  width: 118px;
  min-width: 118px;
}

.calificaciones-docente__tabla tbody tr {
  transition: background .14s ease;
}

.calificaciones-docente__tabla tbody tr:hover td {
  background: var(--app-surface-alt);
}

.calificaciones-docente__tabla tbody tr:hover .col-estudiante {
  background: var(--app-surface-alt);
}

.calificaciones-docente__tabla td {
  height: 82px;
  padding: 10px;
  vertical-align: middle;
  background: var(--app-surface);
}

.calificaciones-docente__estudiante {
  display: flex;
  align-items: center;
  gap: 10px;
}

.calificaciones-docente__avatar {
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 9px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
  font-size: 10px;
  font-weight: 850;
}

.calificaciones-docente__estudiante strong,
.calificaciones-docente__estudiante small {
  display: block;
}

.calificaciones-docente__estudiante strong {
  overflow: hidden;
  color: var(--app-text);
  font-size: 10.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calificaciones-docente__estudiante small {
  margin-top: 2px;
  overflow: hidden;
  color: var(--app-text-muted);
  font-size: 8.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calificaciones-docente__tabla .col-nota {
  padding: 8px;
  text-align: center;
}

.calificaciones-docente__nota {
  width: 100%;
  min-height: 62px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 2px;
  padding: 7px 8px;
  border: 1px solid var(--app-border);
  border-radius: 9px;
  background: var(--app-surface);
  font: inherit;
  cursor: pointer;
  transition:
    border-color .16s ease,
    background .16s ease,
    transform .16s ease,
    box-shadow .16s ease;
}

.calificaciones-docente__nota:hover {
  transform: translateY(-1px);
}

.calificaciones-docente__nota strong {
  color: var(--app-text);
  font-size: 15px;
  line-height: 1.1;
  font-weight: 900;
}

.calificaciones-docente__nota > small {
  color: var(--app-text-muted);
  font-size: 8px;
}

.calificaciones-docente__nota span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  font-size: 7.8px;
  font-weight: 800;
}

.calificaciones-docente__nota.publicada {
  border-color: color-mix(in srgb, #22c55e 38%, var(--app-border));
  background: #f0fdf4;
}

.calificaciones-docente__nota.publicada strong {
  color: #15803d;
}

.calificaciones-docente__nota.publicada span {
  color: #15803d;
}

.calificaciones-docente__nota.publicada:hover {
  border-color: #22c55e;
  background: #dcfce7;
  box-shadow: 0 5px 14px rgba(34, 197, 94, .10);
}

.calificaciones-docente__nota.calificada {
  border-color: color-mix(in srgb, #3b82f6 30%, var(--app-border));
  background: #eff6ff;
}

.calificaciones-docente__nota.calificada strong {
  color: #1d4ed8;
}

.calificaciones-docente__nota.calificada span {
  color: #1d4ed8;
}

.calificaciones-docente__nota.calificada:hover {
  border-color: #3b82f6;
  background: #dbeafe;
  box-shadow: 0 5px 14px rgba(59, 130, 246, .09);
}

.calificaciones-docente__nota.pendiente {
  border-color: color-mix(in srgb, #f59e0b 34%, var(--app-border));
  background: #fffbeb;
}

.calificaciones-docente__nota.pendiente strong,
.calificaciones-docente__nota.pendiente span {
  color: #b45309;
}

.calificaciones-docente__nota.pendiente:hover {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
  box-shadow: 0 5px 14px color-mix(in srgb, var(--app-accent) 12%, transparent);
}

.calificaciones-docente__nota--accion {
  cursor: pointer;
}

.calificaciones-docente__nota-ayuda {
  margin-top: 2px;
  color: var(--app-accent-dark) !important;
  font-size: 7px !important;
  font-weight: 800;
  opacity: .7;
}

.calificaciones-docente__nota--accion:hover .calificaciones-docente__nota-ayuda {
  opacity: 1;
}

.calificaciones-docente__tabla .resultado-celda {
  padding: 8px;
  text-align: center;
  background: var(--app-surface);
}

.calificaciones-docente__resultado {
  min-height: 60px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 1px;
}

.calificaciones-docente__resultado strong {
  color: var(--app-text);
  font-size: 17px;
  line-height: 1.1;
}

.calificaciones-docente__resultado small {
  color: var(--app-text-muted);
  font-size: 8.5px;
}

.calificaciones-docente__resultado.final {
  min-height: 62px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 38%, var(--app-border));
  border-radius: 9px;
  background: #fff;
}

.calificaciones-docente__resultado.final strong {
  color: var(--app-accent-dark);
  font-size: 21px;
}

.calificaciones-docente__resultado.final span {
  margin-top: 3px;
  padding: 3px 6px;
  border-radius: 5px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
  font-size: 7px;
  font-weight: 850;
  text-transform: uppercase;
}

.calificaciones-docente__modal-reportes {
  display: grid;
  gap: 9px;
}

.calificaciones-docente__opcion-reporte {
  width: 100%;
  min-height: 68px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  border: 1px solid color-mix(in srgb, var(--app-accent) 28%, var(--app-border));
  border-radius: 12px;
  color: var(--app-text-secondary);
  background: var(--app-surface);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color .16s ease,
    background .16s ease;
}

.calificaciones-docente__opcion-reporte:hover:not(:disabled) {
  border-color: var(--app-accent);
  background: var(--app-accent-softer);
}

.calificaciones-docente__opcion-reporte:disabled {
  opacity: .55;
  cursor: wait;
}

.calificaciones-docente__opcion-reporte-icono {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.calificaciones-docente__opcion-reporte-texto {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.calificaciones-docente__opcion-reporte-texto strong {
  color: var(--app-text);
  font-size: 10.5px;
  font-weight: 850;
}

.calificaciones-docente__opcion-reporte-texto small {
  color: var(--app-text-muted);
  font-size: 8.5px;
  line-height: 1.4;
}

.calificaciones-docente__reporte-cargando {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px;
  color: var(--app-text-muted);
  font-size: 9px;
}

.calificaciones-docente .spin {
  animation: calificacionesSpin .8s linear infinite;
}

@keyframes calificacionesSpin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .calificaciones-docente__resumen-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .calificaciones-docente__tabs {
    width: 100%;
  }

  .calificaciones-docente__tabs button {
    flex: 1;
    min-width: 0;
  }

  .calificaciones-docente__barra,
  .calificaciones-docente__tabla-info {
    align-items: stretch;
    flex-direction: column;
  }

  .calificaciones-docente__busqueda {
    width: 100%;
  }

  .calificaciones-docente__estados {
    justify-content: flex-start;
  }
}

@media (max-width: 560px) {
  .calificaciones-docente__resumen-grid {
    grid-template-columns: 1fr;
  }
}
`;