import {
  BarChart3,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  Gauge,
  Megaphone,
  MessageSquareText,
  RefreshCw,
  Sparkles,
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
  useInicioHitoEstudiante,
} from '../../../hooks/aula/useInicioHitoEstudiante';

import type {
  CalificacionRecienteInicioEstudiante,
  OrigenInicioEstudiante,
  ProximaActividadInicioEstudiante,
} from '../../../types/aula/inicioHitoEstudiante.types';

function formatoDecimal(
  valor: number,
) {
  return Number.isFinite(valor)
    ? valor.toFixed(2)
    : '0.00';
}

function formatearFechaHora(
  fecha: string,
) {
  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    new Date(fecha),
  );
}

function etiquetaOrigen(
  origen: OrigenInicioEstudiante,
) {
  if (origen === 'FORO') {
    return 'Foro';
  }

  if (origen === 'QUIZ') {
    return 'Quiz';
  }

  return 'Tarea';
}

function IconoOrigen({
  origen,
}: {
  origen: OrigenInicioEstudiante;
}) {
  if (origen === 'FORO') {
    return <MessageSquareText size={15} />;
  }

  if (origen === 'QUIZ') {
    return <BrainCircuit size={15} />;
  }

  return <ClipboardCheck size={15} />;
}

export default function AulaCursoEstudiante() {
  const navigate =
    useNavigate();

  const {
    cursoId: cursoIdParam,
  } = useParams();

  const {
    accessToken,
  } = useAuth();

  const {
    curso,
    hitoSeleccionado,
  } = useAulaContext();

  const cursoId =
    Number(cursoIdParam);

  const {
    datos,
    cargando,
    error,
    recargar,
  } = useInicioHitoEstudiante({
    cursoId,
    hitoId: hitoSeleccionado?.id,
    token: accessToken,
  });

  const irAProximaActividad =
    (
      actividad: ProximaActividadInicioEstudiante,
    ) => {
      if (actividad.origen === 'FORO') {
        navigate(`foro/${actividad.referenciaId}`);
        return;
      }

      if (actividad.origen === 'TAREA') {
        navigate(`tareas/${actividad.referenciaId}`);
        return;
      }

      navigate(`quizzes/${actividad.referenciaId}`);
    };

  const irACalificacion =
    (
      actividad: CalificacionRecienteInicioEstudiante,
    ) => {
      if (
        actividad.origen === 'FORO' &&
        actividad.foroId
      ) {
        navigate(`foro/${actividad.foroId}`);
        return;
      }

      if (
        actividad.origen === 'TAREA' &&
        actividad.tareaId
      ) {
        navigate(`tareas/${actividad.tareaId}`);
        return;
      }

      if (
        actividad.origen === 'QUIZ' &&
        actividad.quizId
      ) {
        navigate(`quizzes/${actividad.quizId}`);
      }
    };

  if (!hitoSeleccionado) {
    return (
      <AulaEmptyState
        titulo="Selecciona un hito"
        descripcion="Tu resumen académico se organiza de acuerdo con el hito seleccionado."
        icono={Gauge}
      />
    );
  }

  return (
    <section className="inicio-estudiante">
      <AulaHeader
        icono={Sparkles}
        etiqueta={`${hitoSeleccionado.codigo} · ${curso.materia.codigo}`}
        titulo="Mi inicio"
        descripcion="Revisa tus próximas actividades, tu avance académico y las calificaciones que ya fueron publicadas."
        informacion={`${curso.materia.nombre} · ${curso.gestion} · Paralelo ${curso.paralelo}`}
        acciones={[
          {
            texto: 'Actualizar',
            icono: RefreshCw,
            onClick: () => {
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
                titulo="No se pudo cargar tu inicio"
                descripcion={error}
                icono={Gauge}
                accionTexto="Reintentar"
                onAccion={() => {
                  void recargar();
                }}
              />
            )
          : datos
            ? (
                <>
                  <div className="inicio-estudiante__resumen">
                    <button
                      type="button"
                      className="inicio-estudiante__resumen-card"
                      onClick={() => navigate('calificaciones')}
                    >
                      <span className="inicio-estudiante__resumen-icono">
                        <BarChart3 size={18} />
                      </span>

                      <div>
                        <small>
                          Aporte acumulado
                        </small>

                        <strong>
                          {formatoDecimal(
                            datos.resumen.aporteAcumulado,
                          )}
                          <em>
                            /{datos.resumen.maximoHito}
                          </em>
                        </strong>

                        <span>
                          Solo calificaciones publicadas
                        </span>
                      </div>
                    </button>

                    <article className="inicio-estudiante__resumen-card sin-accion">
                      <span className="inicio-estudiante__resumen-icono">
                        <CheckCircle2 size={18} />
                      </span>

                      <div>
                        <small>
                          Notas publicadas
                        </small>

                        <strong>
                          {datos.resumen.calificacionesPublicadas}
                        </strong>

                        <span>
                          Disponibles para consultar
                        </span>
                      </div>
                    </article>

                    <article className="inicio-estudiante__resumen-card sin-accion">
                      <span className="inicio-estudiante__resumen-icono">
                        <CalendarClock size={18} />
                      </span>

                      <div>
                        <small>
                          Próximo vencimiento
                        </small>

                        <strong className="fecha">
                          {datos.proximoVencimiento
                            ? formatearFechaHora(
                                datos.proximoVencimiento.fecha,
                              )
                            : '—'}
                        </strong>

                        <span>
                          {datos.proximoVencimiento?.titulo ??
                            'Sin vencimientos próximos'}
                        </span>
                      </div>
                    </article>

                    <article className="inicio-estudiante__resumen-card sin-accion">
                      <span className="inicio-estudiante__resumen-icono">
                        <ClipboardCheck size={18} />
                      </span>

                      <div>
                        <small>
                          Actividades del hito
                        </small>

                        <strong>
                          {datos.resumen.actividades}
                        </strong>

                        <span>
                          Foros, tareas y quizzes visibles
                        </span>
                      </div>
                    </article>
                  </div>

                  <div className="inicio-estudiante__principal">
                    <section className="inicio-estudiante__panel proximas">
                      <header>
                        <div>
                          <span className="inicio-estudiante__eyebrow">
                            Organiza tu trabajo
                          </span>

                          <h2>
                            Próximas actividades
                          </h2>

                          <p>
                            Actividades visibles con las fechas más cercanas.
                          </p>
                        </div>
                      </header>

                      {datos.proximasActividades.length > 0
                        ? (
                            <div className="inicio-estudiante__actividades-lista">
                              {datos.proximasActividades.map(
                                (actividad) => (
                                  <button
                                    key={actividad.id}
                                    type="button"
                                    onClick={() =>
                                      irAProximaActividad(actividad)
                                    }
                                  >
                                    <span className="inicio-estudiante__actividad-icono">
                                      <IconoOrigen origen={actividad.origen} />
                                    </span>

                                    <span className="inicio-estudiante__actividad-info">
                                      <small>
                                        {etiquetaOrigen(actividad.origen)}
                                      </small>

                                      <strong>
                                        {actividad.titulo}
                                      </strong>
                                    </span>

                                    <span className="inicio-estudiante__actividad-fecha">
                                      <CalendarClock size={13} />
                                      {formatearFechaHora(actividad.fecha)}
                                    </span>
                                  </button>
                                ),
                              )}
                            </div>
                          )
                        : (
                            <div className="inicio-estudiante__vacio">
                              <CheckCircle2 size={18} />
                              No tienes actividades con vencimientos próximos en este hito.
                            </div>
                          )}
                    </section>

                    <section className="inicio-estudiante__panel rendimiento">
                      <header>
                        <div>
                          <span className="inicio-estudiante__eyebrow">
                            Mi rendimiento
                          </span>

                          <h2>
                            Continua y Procesual
                          </h2>

                          <p>
                            Calculado únicamente con notas publicadas.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('calificaciones')}
                        >
                          Ver todas
                        </button>
                      </header>

                      <div className="inicio-estudiante__componentes">
                        <article>
                          <div className="inicio-estudiante__componente-titulo">
                            <span>
                              Continua
                            </span>

                            <small>
                              {datos.rendimiento.continua.actividadesPublicadas} publicadas
                            </small>
                          </div>

                          <strong>
                            {formatoDecimal(
                              datos.rendimiento.continua.promedioSobre100,
                            )}
                            <small>/100</small>
                          </strong>

                          <div className="inicio-estudiante__componente-fila">
                            <span>Aporte exacto</span>
                            <b>
                              {formatoDecimal(
                                datos.rendimiento.continua.aporteExacto,
                              )}
                              /{datos.rendimiento.continua.maximo}
                            </b>
                          </div>

                          <div className="inicio-estudiante__componente-fila">
                            <span>Nota final</span>
                            <b className="final">
                              {datos.rendimiento.continua.notaFinal}
                              /{datos.rendimiento.continua.maximo}
                            </b>
                          </div>
                        </article>

                        <article>
                          <div className="inicio-estudiante__componente-titulo">
                            <span>
                              Procesual
                            </span>

                            <small>
                              {datos.rendimiento.procesual.actividadesPublicadas} publicadas
                            </small>
                          </div>

                          <strong>
                            {formatoDecimal(
                              datos.rendimiento.procesual.promedioSobre100,
                            )}
                            <small>/100</small>
                          </strong>

                          <div className="inicio-estudiante__componente-fila">
                            <span>Aporte exacto</span>
                            <b>
                              {formatoDecimal(
                                datos.rendimiento.procesual.aporteExacto,
                              )}
                              /{datos.rendimiento.procesual.maximo}
                            </b>
                          </div>

                          <div className="inicio-estudiante__componente-fila">
                            <span>Nota final</span>
                            <b className="final">
                              {datos.rendimiento.procesual.notaFinal}
                              /{datos.rendimiento.procesual.maximo}
                            </b>
                          </div>
                        </article>
                      </div>
                    </section>
                  </div>

                  <div className="inicio-estudiante__secundario">
                    <section className="inicio-estudiante__panel notas">
                      <header>
                        <div>
                          <span className="inicio-estudiante__eyebrow">
                            Últimos resultados
                          </span>

                          <h2>
                            Calificaciones recientes
                          </h2>
                        </div>
                      </header>

                      {datos.calificacionesRecientes.length > 0
                        ? (
                            <div className="inicio-estudiante__notas-lista">
                              {datos.calificacionesRecientes.map(
                                (actividad) => (
                                  <button
                                    key={actividad.id}
                                    type="button"
                                    onClick={() =>
                                      irACalificacion(actividad)
                                    }
                                  >
                                    <span className="inicio-estudiante__nota-origen">
                                      <IconoOrigen origen={actividad.origen} />
                                    </span>

                                    <span className="inicio-estudiante__nota-info">
                                      <small>
                                        {etiquetaOrigen(actividad.origen)} · {actividad.componente === 'CONTINUA' ? 'Continua' : 'Procesual'}
                                      </small>

                                      <strong>
                                        {actividad.titulo}
                                      </strong>
                                    </span>

                                    <span className="inicio-estudiante__nota-valor">
                                      {formatoDecimal(actividad.nota)}
                                      <small>/100</small>
                                    </span>
                                  </button>
                                ),
                              )}
                            </div>
                          )
                        : (
                            <div className="inicio-estudiante__vacio simple">
                              Todavía no tienes calificaciones publicadas en este hito.
                            </div>
                          )}
                    </section>

                    <section className="inicio-estudiante__panel accesos">
                      <header>
                        <div>
                          <span className="inicio-estudiante__eyebrow">
                            Accesos rápidos
                          </span>

                          <h2>
                            Explorar el hito
                          </h2>
                        </div>
                      </header>

                      <div className="inicio-estudiante__accesos-grid">
                        <button
                          type="button"
                          onClick={() => navigate('tablon')}
                        >
                          <Megaphone size={17} />
                          <span>
                            Tablón
                            <small>
                              {datos.resumen.publicaciones} publicaciones
                            </small>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate('foro')}
                        >
                          <MessageSquareText size={17} />
                          <span>
                            Foros
                            <small>
                              {datos.resumen.foros} disponibles
                            </small>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate('tareas')}
                        >
                          <ClipboardCheck size={17} />
                          <span>
                            Tareas
                            <small>
                              {datos.resumen.tareas} disponibles
                            </small>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate('quizzes')}
                        >
                          <FileQuestion size={17} />
                          <span>
                            Quizzes
                            <small>
                              {datos.resumen.quizzes} disponibles
                            </small>
                          </span>
                        </button>
                      </div>
                    </section>
                  </div>
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
.inicio-estudiante {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.inicio-estudiante__eyebrow {
  display: block;
  color: var(--app-accent-dark);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
  letter-spacing: .07em;
  text-transform: uppercase;
}

.inicio-estudiante__resumen {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.inicio-estudiante__resumen-card {
  min-height: 118px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  padding: 17px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  color: var(--app-text);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}

.inicio-estudiante__resumen-card:hover:not(.sin-accion) {
  border-color: var(--app-border-strong);
  box-shadow: var(--app-shadow);
  transform: translateY(-2px);
}

.inicio-estudiante__resumen-card.sin-accion {
  cursor: default;
}

.inicio-estudiante__resumen-icono {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.inicio-estudiante__resumen-card small,
.inicio-estudiante__resumen-card strong,
.inicio-estudiante__resumen-card div > span {
  display: block;
}

.inicio-estudiante__resumen-card div > small {
  color: var(--app-text-soft);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
  letter-spacing: .035em;
  text-transform: uppercase;
}

.inicio-estudiante__resumen-card strong {
  margin-top: 7px;
  color: var(--app-text);
  font-size: 25px;
  line-height: 1;
  font-weight: var(--app-font-black);
}

.inicio-estudiante__resumen-card strong em {
  margin-left: 3px;
  color: var(--app-text-muted);
  font-size: 11px;
  font-style: normal;
  font-weight: var(--app-font-semibold);
}

.inicio-estudiante__resumen-card strong.fecha {
  font-size: 15px;
  line-height: 1.25;
}

.inicio-estudiante__resumen-card div > span {
  margin-top: 7px;
  overflow: hidden;
  color: var(--app-text-muted);
  font-size: var(--app-font-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inicio-estudiante__principal {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, .9fr);
  gap: 12px;
}

.inicio-estudiante__secundario {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr);
  gap: 12px;
}

.inicio-estudiante__panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.inicio-estudiante__panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--app-border-soft);
}

.inicio-estudiante__panel h2 {
  margin: 3px 0 0;
  color: var(--app-text);
  font-size: var(--app-font-section);
}

.inicio-estudiante__panel header p {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: var(--app-font-xs);
}

.inicio-estudiante__panel > header > button {
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid var(--app-border-strong);
  border-radius: 9px;
  color: var(--app-accent-dark);
  background: var(--app-surface);
  font: inherit;
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
  cursor: pointer;
}

.inicio-estudiante__panel > header > button:hover {
  background: var(--app-accent-soft);
}

.inicio-estudiante__actividades-lista,
.inicio-estudiante__notas-lista {
  display: grid;
}

.inicio-estudiante__actividades-lista > button,
.inicio-estudiante__notas-lista > button {
  width: 100%;
  display: grid;
  align-items: center;
  gap: 12px;
  padding: 13px 17px;
  border: 0;
  border-bottom: 1px solid var(--app-border-soft);
  color: var(--app-text);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background .16s ease;
}

.inicio-estudiante__actividades-lista > button {
  grid-template-columns: 38px minmax(0, 1fr) auto;
}

.inicio-estudiante__notas-lista > button {
  grid-template-columns: 36px minmax(0, 1fr) auto;
}

.inicio-estudiante__actividades-lista > button:last-child,
.inicio-estudiante__notas-lista > button:last-child {
  border-bottom: 0;
}

.inicio-estudiante__actividades-lista > button:hover,
.inicio-estudiante__notas-lista > button:hover {
  background: var(--app-surface-alt);
}

.inicio-estudiante__actividad-icono,
.inicio-estudiante__nota-origen {
  display: grid;
  place-items: center;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.inicio-estudiante__actividad-icono {
  width: 38px;
  height: 38px;
  border-radius: 11px;
}

.inicio-estudiante__nota-origen {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.inicio-estudiante__actividad-info,
.inicio-estudiante__nota-info {
  min-width: 0;
}

.inicio-estudiante__actividad-info small,
.inicio-estudiante__nota-info small {
  display: block;
  color: var(--app-accent-dark);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
}

.inicio-estudiante__actividad-info strong,
.inicio-estudiante__nota-info strong {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: var(--app-text);
  font-size: var(--app-font-md);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inicio-estudiante__actividad-fecha {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 8px;
  border-radius: 8px;
  color: var(--app-warning-strong);
  background: var(--app-warning-bg);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-bold);
  white-space: nowrap;
}

.inicio-estudiante__componentes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 14px;
}

.inicio-estudiante__componentes article {
  padding: 15px;
  border: 1px solid var(--app-border-soft);
  border-radius: 13px;
  background: var(--app-surface-alt);
}

.inicio-estudiante__componente-titulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.inicio-estudiante__componente-titulo > span {
  color: var(--app-text-secondary);
  font-size: var(--app-font-sm);
  font-weight: var(--app-font-bold);
}

.inicio-estudiante__componente-titulo small {
  color: var(--app-text-muted);
  font-size: var(--app-font-xs);
}

.inicio-estudiante__componentes article > strong {
  display: block;
  margin: 13px 0 14px;
  color: var(--app-text);
  font-size: 27px;
  line-height: 1;
  font-weight: var(--app-font-black);
}

.inicio-estudiante__componentes article > strong small {
  margin-left: 3px;
  color: var(--app-text-muted);
  font-size: var(--app-font-xs);
}

.inicio-estudiante__componente-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px solid var(--app-border-soft);
  color: var(--app-text-muted);
  font-size: var(--app-font-xs);
}

.inicio-estudiante__componente-fila b {
  color: var(--app-text);
}

.inicio-estudiante__componente-fila b.final {
  color: var(--app-accent-dark);
  font-size: var(--app-font-md);
}

.inicio-estudiante__nota-valor {
  color: var(--app-success-strong);
  font-size: 15px;
  font-weight: var(--app-font-black);
}

.inicio-estudiante__nota-valor small {
  margin-left: 2px;
  color: var(--app-text-muted);
  font-size: var(--app-font-xs);
}

.inicio-estudiante__accesos-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  padding: 14px;
}

.inicio-estudiante__accesos-grid button {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 66px;
  padding: 12px;
  border: 1px solid var(--app-border-soft);
  border-radius: 12px;
  color: var(--app-accent-dark);
  background: var(--app-surface-alt);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color .16s ease, background .16s ease, transform .16s ease;
}

.inicio-estudiante__accesos-grid button:hover {
  border-color: var(--app-border-strong);
  background: var(--app-accent-softer);
  transform: translateY(-1px);
}

.inicio-estudiante__accesos-grid button > span {
  display: grid;
  gap: 2px;
  color: var(--app-text);
  font-size: var(--app-font-md);
  font-weight: var(--app-font-bold);
}

.inicio-estudiante__accesos-grid small {
  color: var(--app-text-muted);
  font-size: var(--app-font-xs);
  font-weight: var(--app-font-medium);
}

.inicio-estudiante__vacio {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 22px;
  color: var(--app-success);
  font-size: var(--app-font-sm);
  text-align: center;
}

.inicio-estudiante__vacio.simple {
  color: var(--app-text-muted);
}

@media (max-width: 1100px) {
  .inicio-estudiante__resumen {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .inicio-estudiante__principal,
  .inicio-estudiante__secundario {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .inicio-estudiante__panel > header {
    align-items: flex-start;
    flex-direction: column;
  }

  .inicio-estudiante__actividades-lista > button {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .inicio-estudiante__actividad-fecha {
    grid-column: 2;
    width: fit-content;
  }
}

@media (max-width: 560px) {
  .inicio-estudiante__resumen,
  .inicio-estudiante__componentes,
  .inicio-estudiante__accesos-grid {
    grid-template-columns: 1fr;
  }
}
`;
