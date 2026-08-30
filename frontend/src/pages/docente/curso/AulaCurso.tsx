import {
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  Gauge,
  MessageSquareText,
  Newspaper,
  RefreshCw,
  UsersRound,
} from 'lucide-react';

import {
  useMemo,
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
import AulaSkeleton from '../../../components/aula/AulaSkeleton';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import {
  useInicioHitoDocente,
} from '../../../hooks/aula/useInicioHitoDocente';

import type {
  ActividadRendimientoInicio,
  DistribucionRendimientoInicio,
  EstudianteSeguimientoInicio,
} from '../../../types/aula/inicioHitoDocente.types';

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

function formatearFecha(
  fecha: string,
) {
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
    new Date(
      fecha,
    ),
  );
}

function nombreEstudiante(
  estudiante: EstudianteSeguimientoInicio,
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

function etiquetaOrigen(
  origen: ActividadRendimientoInicio['origen'],
) {
  if (
    origen ===
    'FORO'
  ) {
    return 'Foro';
  }

  if (
    origen ===
    'QUIZ'
  ) {
    return 'Quiz';
  }

  return 'Tarea';
}

function IconoOrigen({
  origen,
}: {
  origen: ActividadRendimientoInicio['origen'];
}) {
  if (
    origen ===
    'FORO'
  ) {
    return (
      <MessageSquareText
        size={14}
      />
    );
  }

  if (
    origen ===
    'QUIZ'
  ) {
    return (
      <BrainCircuit
        size={14}
      />
    );
  }

  return (
    <ClipboardCheck
      size={14}
    />
  );
}

export default function AulaCurso() {
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

  const cursoId =
    Number(
      cursoIdParam,
    );

  const {
    datos,
    cargando,
    error,
    recargar,
  } =
    useInicioHitoDocente({
      cursoId,
      hitoId:
        hitoSeleccionado?.id,
      token:
        accessToken,
    });

  const maximoDistribucion =
    useMemo(
      () =>
        Math.max(
          ...(
            datos?.distribucion.map(
              (
                item: DistribucionRendimientoInicio,
              ) =>
                item.cantidad,
            ) ??
            [
              0,
            ]
          ),
          1,
        ),
      [
        datos,
      ],
    );

  const actividadesDestacadas =
    useMemo(
      () =>
        datos?.actividadesRendimiento.slice(
          0,
          6,
        ) ??
        [],
      [
        datos,
      ],
    );

  const irAActividad =
    (
      actividad: ActividadRendimientoInicio,
    ) => {
      if (
        actividad.origen ===
          'FORO' &&
        actividad.foroId
      ) {
        navigate(
          `foro/${actividad.foroId}`,
        );
        return;
      }

      if (
        actividad.origen ===
          'TAREA' &&
        actividad.tareaId
      ) {
        navigate(
          `tareas/${actividad.tareaId}`,
        );
        return;
      }

      if (
        actividad.origen ===
          'QUIZ' &&
        actividad.quizId
      ) {
        navigate(
          `quizzes/${actividad.quizId}`,
        );
      }
    };

  if (
    !hitoSeleccionado
  ) {
    return (
      <AulaEmptyState
        titulo="Selecciona un hito"
        descripcion="El resumen académico se organiza de acuerdo con el hito seleccionado."
        icono={
          BarChart3
        }
      />
    );
  }

  return (
    <section className="inicio-hito-docente">
      <AulaHeader
        icono={
          Gauge
        }
        etiqueta={`${hitoSeleccionado.codigo} · ${curso.materia.codigo}`}
        titulo="Inicio del hito"
        descripcion="Consulta el rendimiento académico, las actividades, las calificaciones pendientes y los estudiantes que requieren seguimiento."
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
        ]}
      />

      {cargando
        ? (
            <AulaSkeleton
              cantidad={6}
              variante="lista"
            />
          )
        : error
          ? (
              <AulaEmptyState
                titulo="No se pudo cargar el inicio del hito"
                descripcion={
                  error
                }
                icono={
                  BarChart3
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
                  <div className="inicio-hito-docente__resumen-grid">
                    <button
                      type="button"
                      className="inicio-hito-docente__resumen-card"
                      onClick={() =>
                        navigate(
                          'estudiantes',
                        )
                      }
                    >
                      <span className="inicio-hito-docente__resumen-icono">
                        <UsersRound
                          size={17}
                        />
                      </span>

                      <div>
                        <small>
                          Estudiantes activos
                        </small>

                        <strong>
                          {datos.resumen.estudiantesActivos}
                        </strong>

                        <span>
                          Inscritos en el curso
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="inicio-hito-docente__resumen-card"
                      onClick={() =>
                        navigate(
                          'calificaciones',
                        )
                      }
                    >
                      <span className="inicio-hito-docente__resumen-icono">
                        <CheckCircle2
                          size={17}
                        />
                      </span>

                      <div>
                        <small>
                          Pendientes de calificar
                        </small>

                        <strong>
                          {datos.resumen.pendientesCalificar}
                        </strong>

                        <span>
                          Registros que requieren revisión
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="inicio-hito-docente__resumen-card"
                      onClick={() =>
                        navigate(
                          'calificaciones',
                        )
                      }
                    >
                      <span className="inicio-hito-docente__resumen-icono">
                        <BarChart3
                          size={17}
                        />
                      </span>

                      <div>
                        <small>
                          Aporte promedio
                        </small>

                        <strong>
                          {formatoDecimal(
                            datos.rendimiento.total.aporteExacto,
                          )}
                        </strong>

                        <span>
                          /{datos.rendimiento.total.maximo} del hito
                        </span>
                      </div>
                    </button>

                    <article className="inicio-hito-docente__resumen-card sin-accion">
                      <span className="inicio-hito-docente__resumen-icono">
                        <CalendarDays
                          size={17}
                        />
                      </span>

                      <div>
                        <small>
                          Próximo vencimiento
                        </small>

                        <strong className="fecha">
                          {datos.proximoVencimiento
                            ? formatearFecha(
                                datos.proximoVencimiento.fecha,
                              )
                            : '—'}
                        </strong>

                        <span>
                          {datos.proximoVencimiento?.titulo ??
                            'Sin fechas próximas'}
                        </span>
                      </div>
                    </article>
                  </div>

                  <div className="inicio-hito-docente__contenido-grid">
                    <section className="inicio-hito-docente__panel rendimiento">
                      <header>
                        <div>
                          <span className="inicio-hito-docente__eyebrow">
                            Rendimiento académico
                          </span>

                          <h3>
                            Continua y Procesual
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              'calificaciones',
                            )
                          }
                        >
                          Ver calificaciones
                        </button>
                      </header>

                      <div className="inicio-hito-docente__componentes">
                        <article>
                          <span>
                            Continua
                          </span>

                          <strong>
                            {formatoDecimal(
                              datos.rendimiento.continua.promedioSobre100,
                            )}
                            <small>
                              /100
                            </small>
                          </strong>

                          <div>
                            <span>
                              Aporte
                            </span>
                            <b>
                              {formatoDecimal(
                                datos.rendimiento.continua.aporteExacto,
                              )}
                              /{datos.rendimiento.continua.maximo}
                            </b>
                          </div>

                          <div>
                            <span>
                              Nota final
                            </span>
                            <b className="final">
                              {datos.rendimiento.continua.notaFinal}
                              /{datos.rendimiento.continua.maximo}
                            </b>
                          </div>
                        </article>

                        <article>
                          <span>
                            Procesual
                          </span>

                          <strong>
                            {formatoDecimal(
                              datos.rendimiento.procesual.promedioSobre100,
                            )}
                            <small>
                              /100
                            </small>
                          </strong>

                          <div>
                            <span>
                              Aporte
                            </span>
                            <b>
                              {formatoDecimal(
                                datos.rendimiento.procesual.aporteExacto,
                              )}
                              /{datos.rendimiento.procesual.maximo}
                            </b>
                          </div>

                          <div>
                            <span>
                              Nota final
                            </span>
                            <b className="final">
                              {datos.rendimiento.procesual.notaFinal}
                              /{datos.rendimiento.procesual.maximo}
                            </b>
                          </div>
                        </article>
                      </div>
                    </section>

                    <section className="inicio-hito-docente__panel distribucion">
                      <header>
                        <div>
                          <span className="inicio-hito-docente__eyebrow">
                            Distribución
                          </span>

                          <h3>
                            Rendimiento del curso
                          </h3>
                        </div>
                      </header>

                      <div className="inicio-hito-docente__barras">
                        {datos.distribucion.map(
                          (
                            item: DistribucionRendimientoInicio,
                          ) => (
                            <div
                              key={
                                item.id
                              }
                              className="inicio-hito-docente__barra-item"
                            >
                              <div>
                                <span>
                                  {item.etiqueta}
                                </span>

                                <strong>
                                  {item.cantidad}
                                </strong>
                              </div>

                              <span className="inicio-hito-docente__barra-fondo">
                                <span
                                  style={{
                                    width:
                                      `${Math.max(
                                        (item.cantidad /
                                          maximoDistribucion) *
                                          100,
                                        item.cantidad >
                                        0
                                          ? 7
                                          : 0,
                                      )}%`,
                                  }}
                                />
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </section>
                  </div>

                  <section className="inicio-hito-docente__panel actividades">
                    <header>
                      <div>
                        <span className="inicio-hito-docente__eyebrow">
                          Actividades del hito
                        </span>

                        <h3>
                          Seguimiento por actividad
                        </h3>
                      </div>

                      <div className="inicio-hito-docente__conteos">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              'tablon',
                            )
                          }
                        >
                          <Newspaper
                            size={13}
                          />
                          {datos.resumen.publicaciones} publicaciones
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              'foro',
                            )
                          }
                        >
                          <MessageSquareText
                            size={13}
                          />
                          {datos.resumen.foros} foros
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              'tareas',
                            )
                          }
                        >
                          <ClipboardCheck
                            size={13}
                          />
                          {datos.resumen.tareas} tareas
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              'quizzes',
                            )
                          }
                        >
                          <FileQuestion
                            size={13}
                          />
                          {datos.resumen.quizzes} quizzes
                        </button>
                      </div>
                    </header>

                    {actividadesDestacadas.length >
                    0
                      ? (
                          <div className="inicio-hito-docente__tabla-wrap">
                            <table className="inicio-hito-docente__tabla">
                              <thead>
                                <tr>
                                  <th>
                                    Actividad
                                  </th>
                                  <th>
                                    Componente
                                  </th>
                                  <th>
                                    Promedio
                                  </th>
                                  <th>
                                    Calificadas
                                  </th>
                                  <th>
                                    Pendientes
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {actividadesDestacadas.map(
                                  (
                                    actividad: ActividadRendimientoInicio,
                                  ) => (
                                    <tr
                                      key={
                                        actividad.id
                                      }
                                      onClick={() =>
                                        irAActividad(
                                          actividad,
                                        )
                                      }
                                    >
                                      <td>
                                        <div className="inicio-hito-docente__actividad">
                                          <span>
                                            <IconoOrigen
                                              origen={
                                                actividad.origen
                                              }
                                            />
                                            {etiquetaOrigen(
                                              actividad.origen,
                                            )}
                                          </span>

                                          <strong>
                                            {actividad.titulo}
                                          </strong>
                                        </div>
                                      </td>

                                      <td>
                                        <span className="inicio-hito-docente__componente">
                                          {actividad.componente ===
                                          'CONTINUA'
                                            ? 'Continua'
                                            : 'Procesual'}
                                        </span>
                                      </td>

                                      <td>
                                        <strong className="inicio-hito-docente__promedio">
                                          {actividad.calificadas >
                                          0
                                            ? formatoDecimal(
                                                actividad.promedio,
                                              )
                                            : '—'}
                                        </strong>
                                      </td>

                                      <td>
                                        <span className="inicio-hito-docente__estado publicada">
                                          {actividad.calificadas}/{actividad.totalEstudiantes}
                                        </span>
                                      </td>

                                      <td>
                                        <span className={`inicio-hito-docente__estado ${actividad.pendientes > 0 ? 'pendiente' : 'completo'}`}>
                                          {actividad.pendientes}
                                        </span>
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        )
                      : (
                          <div className="inicio-hito-docente__vacio">
                            Todavía no existen actividades calificables en este hito.
                          </div>
                        )}
                  </section>

                  <section className="inicio-hito-docente__panel seguimiento">
                    <header>
                      <div>
                        <span className="inicio-hito-docente__eyebrow">
                          Seguimiento
                        </span>

                        <h3>
                          Estudiantes que requieren atención
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            'calificaciones',
                          )
                        }
                      >
                        Abrir libro de calificaciones
                      </button>
                    </header>

                    {datos.estudiantesSeguimiento.length >
                    0
                      ? (
                          <div className="inicio-hito-docente__seguimiento-lista">
                            {datos.estudiantesSeguimiento.map(
                              (
                                estudiante: EstudianteSeguimientoInicio,
                              ) => (
                                <article
                                  key={
                                    estudiante.id
                                  }
                                >
                                  <div>
                                    <strong>
                                      {nombreEstudiante(
                                        estudiante,
                                      )}
                                    </strong>

                                    <small>
                                      {estudiante.correo}
                                    </small>
                                  </div>

                                  <div className="inicio-hito-docente__seguimiento-datos">
                                    <span>
                                      Promedio
                                      <b>
                                        {estudiante.promedioSobre100 ===
                                        null
                                          ? '—'
                                          : formatoDecimal(
                                              estudiante.promedioSobre100,
                                            )}
                                      </b>
                                    </span>

                                    <span>
                                      Pendientes
                                      <b>
                                        {estudiante.actividadesPendientes}
                                      </b>
                                    </span>
                                  </div>
                                </article>
                              ),
                            )}
                          </div>
                        )
                      : (
                          <div className="inicio-hito-docente__todo-bien">
                            <CheckCircle2
                              size={17}
                            />
                            No se detectaron estudiantes con bajo rendimiento o varios registros pendientes.
                          </div>
                        )}
                  </section>
                </>
              )
            : null}

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
.inicio-hito-docente {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.inicio-hito-docente__eyebrow {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  color: var(--app-accent-dark);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
  letter-spacing: .075em;
  text-transform: uppercase;
}

/* HITO */




.inicio-hito-docente__hito > div:first-child {
  position: relative;
  z-index: 1;
  min-width: 0;
}





/* TARJETAS RESUMEN */

.inicio-hito-docente__resumen-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.inicio-hito-docente__resumen-card {
  position: relative;
  min-height: 122px;
  display: flex;
  align-items: flex-start;
  gap: 13px;
  overflow: hidden;
  padding: 17px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  color: inherit;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform .18s ease,
    border-color .18s ease,
    box-shadow .18s ease,
    background .18s ease;
}

.inicio-hito-docente__resumen-card::after {
  content: '';
  position: absolute;
  right: -22px;
  bottom: -36px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--app-accent-softer);
  pointer-events: none;
}

.inicio-hito-docente__resumen-card:hover:not(.sin-accion) {
  transform: translateY(-2px);
  border-color: var(--app-border-strong);
  background: var(--app-surface-raised);
  box-shadow: var(--app-shadow);
}

.inicio-hito-docente__resumen-card.sin-accion {
  cursor: default;
}

.inicio-hito-docente__resumen-icono {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.inicio-hito-docente__resumen-card > div {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.inicio-hito-docente__resumen-card small,
.inicio-hito-docente__resumen-card strong,
.inicio-hito-docente__resumen-card div > span {
  display: block;
}

.inicio-hito-docente__resumen-card small {
  color: var(--app-text-soft);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
  letter-spacing: .045em;
  text-transform: uppercase;
}

.inicio-hito-docente__resumen-card strong {
  margin-top: 8px;
  color: var(--app-text);
  font-size: 29px;
  font-weight: var(--app-font-black);
  line-height: 1;
}

.inicio-hito-docente__resumen-card strong.fecha {
  margin-top: 9px;
  font-size: var(--app-font-section);
  line-height: 1.2;
}

.inicio-hito-docente__resumen-card div > span {
  margin-top: 7px;
  overflow: hidden;
  color: var(--app-text-muted);
  font-size: var(--app-font-xs);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* BLOQUES PRINCIPALES */

.inicio-hito-docente__contenido-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr);
  gap: 12px;
}

.inicio-hito-docente__panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.inicio-hito-docente__panel > header {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 15px 18px;
  border-bottom: 1px solid var(--app-border-soft);
  background:
    linear-gradient(
      180deg,
      var(--app-surface-raised) 0%,
      var(--app-surface) 100%
    );
}

.inicio-hito-docente__panel h3 {
  margin: 4px 0 0;
  color: var(--app-text);
  font-size: var(--app-font-section);
  font-weight: var(--app-font-bold);
}

.inicio-hito-docente__panel > header > button,
.inicio-hito-docente__conteos button {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--app-border-strong);
  border-radius: 9px;
  color: var(--app-accent-dark);
  background: var(--app-surface);
  font: inherit;
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
  cursor: pointer;
  transition:
    border-color .16s ease,
    background .16s ease,
    transform .16s ease;
}

.inicio-hito-docente__panel > header > button:hover,
.inicio-hito-docente__conteos button:hover {
  transform: translateY(-1px);
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
}

/* CONTINUA / PROCESUAL */

.inicio-hito-docente__componentes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.inicio-hito-docente__componentes article {
  position: relative;
  overflow: hidden;
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 13px;
  background: var(--app-surface-raised);
}

.inicio-hito-docente__componentes article::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: var(--app-accent);
}

.inicio-hito-docente__componentes article > span {
  color: var(--app-text-soft);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
  letter-spacing: .045em;
  text-transform: uppercase;
}

.inicio-hito-docente__componentes article > strong {
  display: block;
  margin: 11px 0 14px;
  color: var(--app-text);
  font-size: 30px;
  font-weight: var(--app-font-black);
  line-height: 1;
}

.inicio-hito-docente__componentes article > strong small {
  margin-left: 3px;
  color: var(--app-text-muted);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-semibold);
}

.inicio-hito-docente__componentes article > div {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px solid var(--app-border-soft);
  color: var(--app-text-soft);
  font-size: var(--app-font-xs);
}

.inicio-hito-docente__componentes article > div b {
  color: var(--app-text);
  font-size: var(--app-font-sm);
}

.inicio-hito-docente__componentes article > div b.final {
  color: var(--app-accent-dark);
  font-size: var(--app-font-md);
}

/* DISTRIBUCIÓN */

.inicio-hito-docente__barras {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.inicio-hito-docente__barra-item > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 7px;
  color: var(--app-text-secondary);
  font-size: var(--app-font-xs);
}

.inicio-hito-docente__barra-item strong {
  min-width: 25px;
  padding: 2px 7px;
  border-radius: 999px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
  font-size: var(--app-font-xs);
  text-align: center;
}

.inicio-hito-docente__barra-fondo {
  height: 9px;
  display: block;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-surface-alt);
  box-shadow: inset 0 0 0 1px var(--app-border-soft);
}

.inicio-hito-docente__barra-fondo > span {
  height: 100%;
  display: block;
  border-radius: inherit;
  background:
    linear-gradient(
      90deg,
      var(--app-accent-dark),
      var(--app-accent)
    );
  transition: width .3s ease;
}

/* CONTEOS */

.inicio-hito-docente__conteos {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

/* TABLA */

.inicio-hito-docente__tabla-wrap {
  width: 100%;
  overflow-x: auto;
}

.inicio-hito-docente__tabla {
  width: 100%;
  min-width: 760px;
  border-collapse: separate;
  border-spacing: 0;
}

.inicio-hito-docente__tabla th,
.inicio-hito-docente__tabla td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--app-border-soft);
  text-align: left;
  vertical-align: middle;
}

.inicio-hito-docente__tabla th {
  color: var(--app-text-soft);
  background: var(--app-surface-alt);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
  letter-spacing: .04em;
  text-transform: uppercase;
}

.inicio-hito-docente__tabla tbody tr {
  cursor: pointer;
  transition: background .14s ease;
}

.inicio-hito-docente__tabla tbody tr:hover {
  background: var(--app-accent-softer);
}

.inicio-hito-docente__tabla tbody tr:last-child td {
  border-bottom: 0;
}

.inicio-hito-docente__actividad {
  display: grid;
  gap: 5px;
}

.inicio-hito-docente__actividad span {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--app-accent-dark);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
}

.inicio-hito-docente__actividad strong {
  color: var(--app-text);
  font-size: var(--app-font-sm);
  font-weight: var(--app-font-semibold);
}

.inicio-hito-docente__componente,
.inicio-hito-docente__estado {
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
}

.inicio-hito-docente__componente {
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.inicio-hito-docente__estado.publicada,
.inicio-hito-docente__estado.completo {
  color: var(--app-success);
  background: var(--app-success-bg);
  box-shadow: inset 0 0 0 1px var(--app-success-border);
}

.inicio-hito-docente__estado.pendiente {
  color: var(--app-warning);
  background: var(--app-warning-bg);
  box-shadow: inset 0 0 0 1px var(--app-warning-border);
}

.inicio-hito-docente__promedio {
  color: var(--app-text);
  font-size: var(--app-font-md);
  font-weight: var(--app-font-bold);
}

/* SEGUIMIENTO */

.inicio-hito-docente__seguimiento-lista {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 15px;
}

.inicio-hito-docente__seguimiento-lista article {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 14px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-raised);
  transition:
    border-color .16s ease,
    box-shadow .16s ease;
}

.inicio-hito-docente__seguimiento-lista article:hover {
  border-color: var(--app-border-strong);
  box-shadow: var(--app-shadow-sm);
}

.inicio-hito-docente__seguimiento-lista article > div:first-child {
  min-width: 0;
}

.inicio-hito-docente__seguimiento-lista article strong,
.inicio-hito-docente__seguimiento-lista article small {
  display: block;
}

.inicio-hito-docente__seguimiento-lista article strong {
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--app-font-sm);
  font-weight: var(--app-font-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inicio-hito-docente__seguimiento-lista article small {
  margin-top: 4px;
  overflow: hidden;
  color: var(--app-text-muted);
  font-size: var(--app-font-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inicio-hito-docente__seguimiento-datos {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 7px;
}

.inicio-hito-docente__seguimiento-datos span {
  min-width: 68px;
  display: grid;
  gap: 3px;
  padding: 7px 9px;
  border: 1px solid var(--app-border-soft);
  border-radius: 9px;
  color: var(--app-text-soft);
  background: var(--app-surface-alt);
  font-size: var(--app-font-xs);
  text-align: center;
}

.inicio-hito-docente__seguimiento-datos b {
  color: var(--app-text);
  font-size: var(--app-font-sm);
}

.inicio-hito-docente__todo-bien,
.inicio-hito-docente__vacio {
  padding: 28px 20px;
  color: var(--app-text-muted);
  font-size: var(--app-font-sm);
  text-align: center;
}

.inicio-hito-docente__todo-bien {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--app-success);
  background: var(--app-success-bg);
}

/* RESPONSIVE */

@media (max-width: 1180px) {
  .inicio-hito-docente__resumen-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .inicio-hito-docente__contenido-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .inicio-hito-docente__panel > header {
    align-items: flex-start;
    flex-direction: column;
  }

  .inicio-hito-docente__conteos {
    justify-content: flex-start;
  }

  .inicio-hito-docente__seguimiento-lista {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 580px) {
  .inicio-hito-docente__resumen-grid,
  .inicio-hito-docente__componentes {
    grid-template-columns: 1fr;
  }

  .inicio-hito-docente__hito {
    padding: 18px;
  }

  .inicio-hito-docente__seguimiento-lista article {
    align-items: flex-start;
    flex-direction: column;
  }

  .inicio-hito-docente__seguimiento-datos {
    width: 100%;
  }

  .inicio-hito-docente__seguimiento-datos span {
    flex: 1;
  }
}
`;
