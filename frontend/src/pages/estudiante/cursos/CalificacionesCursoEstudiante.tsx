import {
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ExternalLink,
  FileText,
  MessageSquareText,
  RefreshCw,
} from 'lucide-react';

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
  useMisCalificaciones,
} from '../../../hooks/calificaciones/useMisCalificaciones';

import type {
  ActividadCalificacionEstudiante,
  ComponenteEstudiante,
  OrigenCalificacion,
} from '../../../types/calificaciones/calificaciones.types';

function IconoOrigen({
  origen,
}: {
  origen: OrigenCalificacion;
}) {
  if (
    origen ===
    'FORO'
  ) {
    return (
      <MessageSquareText
        size={15}
      />
    );
  }

  if (
    origen ===
    'QUIZ'
  ) {
    return (
      <BrainCircuit
        size={15}
      />
    );
  }

  return (
    <FileText
      size={15}
    />
  );
}

function etiquetaOrigen(
  origen: OrigenCalificacion,
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

function TarjetaResumen({
  titulo,
  componente,
}: {
  titulo: string;
  componente: ComponenteEstudiante;
}) {
  return (
    <article className="mis-calificaciones__resumen-card">
      <div className="mis-calificaciones__resumen-encabezado">
        <span>
          {titulo}
        </span>

        <small>
          {
            componente.resumen.actividadesCalificadas
          }{' '}
          publicadas
        </small>
      </div>

      <div className="mis-calificaciones__resumen-promedio">
        <strong>
          {formatoDecimal(
            componente.resumen.promedioSobre100,
          )}
        </strong>

        <small>
          /100
        </small>
      </div>

      <div className="mis-calificaciones__resumen-detalle">
        <div>
          <span>
            Aporte exacto
          </span>

          <strong>
            {formatoDecimal(
              componente.resumen.notaExacta,
            )}
            /
            {
              componente.resumen.maximo
            }
          </strong>
        </div>

        <div>
          <span>
            Nota final
          </span>

          <strong className="final">
            {
              componente.resumen.notaRedondeada
            }
            /
            {
              componente.resumen.maximo
            }
          </strong>
        </div>
      </div>
    </article>
  );
}

function TablaComponente({
  titulo,
  componente,
  onIrActividad,
}: {
  titulo: string;
  componente: ComponenteEstudiante;
  onIrActividad: (
    actividad: ActividadCalificacionEstudiante,
  ) => void;
}) {
  return (
    <section className="mis-calificaciones__bloque">
      <header className="mis-calificaciones__bloque-header">
        <div>
          <span className="mis-calificaciones__eyebrow">
            Componente académico
          </span>

          <h2>
            {titulo}
          </h2>

          <p>
            Actividades cuyas calificaciones ya fueron publicadas.
          </p>
        </div>

        <span className="mis-calificaciones__componente-final">
          Final{' '}
          {
            componente.resumen.notaRedondeada
          }
          /
          {
            componente.resumen.maximo
          }
        </span>
      </header>

      {componente.actividades.length >
      0
        ? (
            <div className="mis-calificaciones__tabla-wrap">
              <table className="mis-calificaciones__tabla">
                <thead>
                  <tr>
                    <th>
                      Actividad
                    </th>

                    <th>
                      Tipo
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                      Nota
                    </th>

                    <th>
                      Retroalimentación
                    </th>

                    <th>
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {componente.actividades.map(
                    (
                      actividad,
                    ) => {
                      const calificacion =
                        actividad.calificacion;

                      return (
                        <tr
                          key={
                            actividad.id
                          }
                        >
                          <td className="mis-calificaciones__actividad-col">
                            <div className="mis-calificaciones__actividad-titulo">
                              <strong>
                                {
                                  actividad.titulo
                                }
                              </strong>

                              {actividad.descripcion?.trim() && (
                                <small>
                                  {
                                    actividad.descripcion
                                  }
                                </small>
                              )}
                            </div>
                          </td>

                          <td>
                            <span className="mis-calificaciones__tipo">
                              <IconoOrigen
                                origen={
                                  actividad.origen
                                }
                              />

                              {etiquetaOrigen(
                                actividad.origen,
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="mis-calificaciones__estado-publicada">
                              <CheckCircle2
                                size={
                                  12
                                }
                              />

                              Publicada
                            </span>
                          </td>

                          <td>
                            <div className="mis-calificaciones__nota-publicada">
                              <strong>
                                {calificacion
                                  ? formatoDecimal(
                                      calificacion.notaFinal,
                                    )
                                  : '—'}
                              </strong>

                              <small>
                                /100
                              </small>
                            </div>
                          </td>

                          <td className="mis-calificaciones__retro-col">
                            {calificacion?.retroalimentacion?.trim()
                              ? (
                                  <div className="mis-calificaciones__retro">
                                    <strong>
                                      Comentario del docente
                                    </strong>

                                    <p>
                                      {
                                        calificacion.retroalimentacion
                                      }
                                    </p>
                                  </div>
                                )
                              : (
                                  <span className="mis-calificaciones__sin-retro">
                                    Sin retroalimentación
                                  </span>
                                )}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="mis-calificaciones__accion"
                              onClick={() =>
                                onIrActividad(
                                  actividad,
                                )
                              }
                            >
                              <ExternalLink
                                size={
                                  13
                                }
                              />

                              Ver actividad
                            </button>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )
        : (
            <div className="mis-calificaciones__sin-actividades">
              Todavía no tienes calificaciones publicadas en este componente.
            </div>
          )}
    </section>
  );
}

export default function CalificacionesCursoEstudiante() {
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
    useMisCalificaciones({
      cursoId,
      hitoId:
        hitoSeleccionado?.id,
      token:
        accessToken,
    });

  const irAActividad =
    (
      actividad: ActividadCalificacionEstudiante,
    ) => {
      if (
        actividad.origen ===
          'FORO' &&
        actividad.foroId
      ) {
        navigate(
          `/estudiante/cursos/${cursoId}/foro/${actividad.foroId}`,
        );

        return;
      }

      if (
        actividad.origen ===
          'TAREA' &&
        actividad.tareaId
      ) {
        navigate(
          `/estudiante/cursos/${cursoId}/tareas/${actividad.tareaId}`,
        );

        return;
      }

      if (
        actividad.origen ===
          'QUIZ' &&
        actividad.quizId
      ) {
        navigate(
          `/estudiante/cursos/${cursoId}/quizzes/${actividad.quizId}`,
        );
      }
    };

  if (
    !hitoSeleccionado
  ) {
    return (
      <AulaEmptyState
        titulo="Selecciona un hito"
        descripcion="Tus calificaciones se consultan de acuerdo con el hito académico seleccionado."
        icono={
          BookOpenCheck
        }
      />
    );
  }

  return (
    <section className="mis-calificaciones">
      <AulaHeader
        icono={
          BookOpenCheck
        }
        etiqueta={`${hitoSeleccionado.codigo} · ${curso.materia.codigo}`}
        titulo="Mis calificaciones"
        descripcion="Consulta tus notas publicadas, el promedio de cada componente y su aporte al hito seleccionado."
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
              cantidad={
                3
              }
              variante="lista"
            />
          )
        : error
          ? (
              <AulaEmptyState
                titulo="No se pudieron cargar tus calificaciones"
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
                  <div className="mis-calificaciones__resumen-grid">
                    <TarjetaResumen
                      titulo="Continua"
                      componente={
                        datos.continua
                      }
                    />

                    <TarjetaResumen
                      titulo="Procesual"
                      componente={
                        datos.procesual
                      }
                    />

                    <article className="mis-calificaciones__total-card">
                      <div className="mis-calificaciones__total-titulo">
                        <span>
                          Total acumulado del hito
                        </span>

                        <small>
                          Resultado general
                        </small>
                      </div>

                      <div className="mis-calificaciones__total-nota">
                        <strong>
                          {
                            datos.totalHito
                          }
                        </strong>

                        <small>
                          /
                          {
                            datos.maximoHito
                          }
                        </small>
                      </div>

                      <div className="mis-calificaciones__total-exacto">
                        <span>
                          Aporte exacto acumulado
                        </span>

                        <strong>
                          {formatoDecimal(
                            datos.totalHitoExacto,
                          )}
                          /
                          {
                            datos.maximoHito
                          }
                        </strong>
                      </div>
                    </article>
                  </div>

                  <TablaComponente
                    titulo="Evaluación continua"
                    componente={
                      datos.continua
                    }
                    onIrActividad={
                      irAActividad
                    }
                  />

                  <TablaComponente
                    titulo="Evaluación procesual"
                    componente={
                      datos.procesual
                    }
                    onIrActividad={
                      irAActividad
                    }
                  />
                </>
              )
            : (
                <AulaEmptyState
                  titulo="Sin calificaciones"
                  descripcion="Todavía no existen calificaciones publicadas para este hito."
                  icono={
                    BookOpenCheck
                  }
                />
              )}

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
.mis-calificaciones {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.mis-calificaciones__resumen-grid {
  display: grid;
  grid-template-columns:
    repeat(
      3,
      minmax(
        0,
        1fr
      )
    );
  gap: 10px;
}

.mis-calificaciones__resumen-card,
.mis-calificaciones__total-card {
  min-height: 132px;

  padding: 16px;

  border: 1px solid
    color-mix(
      in srgb,
      var(--app-accent) 48%,
      var(--app-border)
    );

  border-radius: 14px;

  background: #fff;

  box-shadow: none;
}

.mis-calificaciones__resumen-encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 10px;
}

.mis-calificaciones__resumen-encabezado > span {
  color:
    var(--app-text);

  font-size: 12px;
  font-weight: 850;

  text-transform:
    uppercase;

  letter-spacing:
    .04em;
}

.mis-calificaciones__resumen-encabezado small {
  color:
    var(--app-text-muted);

  font-size:
    8.5px;
}

.mis-calificaciones__resumen-promedio {
  margin-top:
    14px;
}

.mis-calificaciones__resumen-promedio strong {
  color:
    var(--app-text);

  font-size:
    30px;

  line-height:
    1;

  font-weight:
    900;
}

.mis-calificaciones__resumen-promedio small {
  margin-left:
    3px;

  color:
    var(--app-text-muted);

  font-size:
    10px;
}

.mis-calificaciones__resumen-detalle {
  display:
    grid;

  grid-template-columns:
    repeat(
      2,
      minmax(
        0,
        1fr
      )
    );

  gap:
    8px;

  margin-top:
    13px;

  padding-top:
    11px;

  border-top:
    1px solid
    var(--app-border-soft);
}

.mis-calificaciones__resumen-detalle > div {
  display:
    grid;

  gap:
    3px;
}

.mis-calificaciones__resumen-detalle span {
  color:
    var(--app-text-muted);

  font-size:
    8px;
}

.mis-calificaciones__resumen-detalle strong {
  color:
    var(--app-text);

  font-size:
    11px;
}

.mis-calificaciones__resumen-detalle strong.final {
  color:
    var(--app-accent-dark);

  font-size:
    13px;
}

.mis-calificaciones__total-card {
  display:
    grid;

  align-content:
    center;
}

.mis-calificaciones__total-titulo {
  display:
    grid;

  gap:
    2px;
}

.mis-calificaciones__total-titulo span {
  color:
    var(--app-text);

  font-size:
    12px;

  font-weight:
    850;

  text-transform:
    uppercase;

  letter-spacing:
    .04em;
}

.mis-calificaciones__total-titulo small {
  color:
    var(--app-text-muted);

  font-size:
    8.5px;
}

.mis-calificaciones__total-nota {
  margin-top:
    12px;
}

.mis-calificaciones__total-nota strong {
  color:
    var(--app-accent-dark);

  font-size:
    34px;

  line-height:
    1;

  font-weight:
    950;
}

.mis-calificaciones__total-nota small {
  margin-left:
    3px;

  color:
    var(--app-text-muted);

  font-size:
    11px;
}

.mis-calificaciones__total-exacto {
  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    10px;

  margin-top:
    12px;

  padding-top:
    10px;

  border-top:
    1px solid
    var(--app-border-soft);
}

.mis-calificaciones__total-exacto span {
  color:
    var(--app-text-muted);

  font-size:
    8.5px;
}

.mis-calificaciones__total-exacto strong {
  color:
    var(--app-text);

  font-size:
    11px;
}

.mis-calificaciones__bloque {
  overflow:
    hidden;

  border:
    1px solid
    var(--app-border);

  border-radius:
    17px;

  background:
    var(--app-surface);

  box-shadow:
    var(--app-shadow-sm);
}

.mis-calificaciones__bloque-header {
  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    15px;

  padding:
    14px 16px;

  border-bottom:
    1px solid
    var(--app-border);

  background:
    var(--app-surface);
}

.mis-calificaciones__eyebrow {
  display:
    block;

  color:
    var(--app-accent-dark);

  font-size:
    8px;

  font-weight:
    850;

  letter-spacing:
    .08em;

  text-transform:
    uppercase;
}

.mis-calificaciones__bloque-header h2 {
  margin:
    3px 0 0;

  color:
    var(--app-text);

  font-size:
    15px;
}

.mis-calificaciones__bloque-header p {
  margin:
    3px 0 0;

  color:
    var(--app-text-muted);

  font-size:
    9px;
}

.mis-calificaciones__componente-final {
  display:
    inline-flex;

  align-items:
    center;

  min-height:
    29px;

  padding:
    5px 9px;

  border:
    1px solid
    color-mix(
      in srgb,
      var(--app-accent) 32%,
      var(--app-border)
    );

  border-radius:
    8px;

  color:
    var(--app-accent-dark);

  background:
    var(--app-accent-soft);

  font-size:
    9px;

  font-weight:
    850;

  white-space:
    nowrap;
}

.mis-calificaciones__tabla-wrap {
  width:
    100%;

  overflow-x:
    auto;
}

.mis-calificaciones__tabla {
  width:
    100%;

  min-width:
    980px;

  border-collapse:
    collapse;
}

.mis-calificaciones__tabla th,
.mis-calificaciones__tabla td {
  padding:
    11px 12px;

  border-bottom:
    1px solid
    var(--app-border-soft);

  text-align:
    left;

  vertical-align:
    middle;
}

.mis-calificaciones__tabla thead th {
  color:
    var(--app-text-muted);

  background:
    var(--app-surface-alt);

  font-size:
    8px;

  font-weight:
    850;

  text-transform:
    uppercase;

  letter-spacing:
    .04em;
}

.mis-calificaciones__tabla tbody tr:last-child td {
  border-bottom:
    0;
}

.mis-calificaciones__tabla tbody tr:hover {
  background:
    var(--app-surface-alt);
}

.mis-calificaciones__actividad-col {
  min-width:
    230px;
}

.mis-calificaciones__actividad-titulo {
  display:
    grid;

  gap:
    3px;
}

.mis-calificaciones__actividad-titulo strong {
  color:
    var(--app-text);

  font-size:
    10px;

  line-height:
    1.35;
}

.mis-calificaciones__actividad-titulo small {
  display:
    -webkit-box;

  overflow:
    hidden;

  max-width:
    340px;

  color:
    var(--app-text-muted);

  font-size:
    8px;

  line-height:
    1.35;

  -webkit-line-clamp:
    2;

  -webkit-box-orient:
    vertical;
}

.mis-calificaciones__tipo {
  display:
    inline-flex;

  align-items:
    center;

  gap:
    5px;

  padding:
    5px 7px;

  border:
    1px solid
    var(--app-border);

  border-radius:
    7px;

  color:
    var(--app-accent-dark);

  background:
    var(--app-accent-soft);

  font-size:
    8px;

  font-weight:
    800;
}

.mis-calificaciones__estado-publicada {
  display:
    inline-flex;

  align-items:
    center;

  gap:
    4px;

  padding:
    5px 7px;

  border:
    1px solid
    color-mix(
      in srgb,
      #22c55e 30%,
      var(--app-border)
    );

  border-radius:
    7px;

  color:
    #15803d;

  background:
    #f0fdf4;

  font-size:
    8px;

  font-weight:
    800;
}

.mis-calificaciones__nota-publicada {
  min-width:
    82px;

  display:
    inline-flex;

  align-items:
    baseline;

  justify-content:
    center;

  gap:
    2px;

  padding:
    8px 10px;

  border:
    1px solid
    color-mix(
      in srgb,
      #22c55e 34%,
      var(--app-border)
    );

  border-radius:
    8px;

  background:
    #f0fdf4;
}

.mis-calificaciones__nota-publicada strong {
  color:
    #15803d;

  font-size:
    16px;

  font-weight:
    900;
}

.mis-calificaciones__nota-publicada small {
  color:
    #16a34a;

  font-size:
    8px;
}

.mis-calificaciones__retro-col {
  min-width:
    260px;

  max-width:
    340px;
}

.mis-calificaciones__retro {
  padding:
    8px 9px;

  border-left:
    3px solid
    var(--app-accent);

  border-radius:
    0 8px 8px 0;

  background:
    var(--app-accent-softer);
}

.mis-calificaciones__retro strong {
  display:
    block;

  color:
    var(--app-accent-dark);

  font-size:
    7.5px;

  font-weight:
    850;
}

.mis-calificaciones__retro p {
  margin:
    4px 0 0;

  color:
    var(--app-text-secondary);

  font-size:
    8.5px;

  line-height:
    1.4;

  white-space:
    pre-wrap;
}

.mis-calificaciones__sin-retro {
  color:
    var(--app-text-muted);

  font-size:
    8px;
}

.mis-calificaciones__accion {
  display:
    inline-flex;

  align-items:
    center;

  gap:
    5px;

  min-height:
    30px;

  padding:
    6px 9px;

  border:
    1px solid
    color-mix(
      in srgb,
      var(--app-accent) 32%,
      var(--app-border)
    );

  border-radius:
    8px;

  color:
    var(--app-accent-dark);

  background:
    var(--app-surface);

  font:
    inherit;

  font-size:
    8px;

  font-weight:
    800;

  white-space:
    nowrap;

  cursor:
    pointer;

  transition:
    border-color .16s ease,
    background .16s ease;
}

.mis-calificaciones__accion:hover {
  border-color:
    var(--app-accent);

  background:
    var(--app-accent-soft);
}

.mis-calificaciones__sin-actividades {
  padding:
    24px;

  color:
    var(--app-text-muted);

  font-size:
    10px;

  text-align:
    center;
}

@media (
  max-width:
  950px
) {
  .mis-calificaciones__resumen-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
  }

  .mis-calificaciones__total-card {
    grid-column:
      1 / -1;
  }
}

@media (
  max-width:
  620px
) {
  .mis-calificaciones__resumen-grid {
    grid-template-columns:
      1fr;
  }

  .mis-calificaciones__total-card {
    grid-column:
      auto;
  }

  .mis-calificaciones__bloque-header {
    align-items:
      flex-start;

    flex-direction:
      column;
  }
}
`;