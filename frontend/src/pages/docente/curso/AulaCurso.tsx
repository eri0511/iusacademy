import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  MessageSquarePlus,
  MessageSquareText,
  Megaphone,
  Newspaper,
  Sparkles,
  Target,
} from 'lucide-react';

import {
  useNavigate,
  useOutletContext,
} from 'react-router-dom';

import type {
  AulaCursoOutletContext,
} from '../../../layouts/AulaCursoLayout';

function formatearFecha(
  fecha:
    string,
): string {
  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',

      month:
        'long',

      year:
        'numeric',
    },
  ).format(
    new Date(
      fecha,
    ),
  );
}

export default function AulaCurso() {
  const navigate =
    useNavigate();

  const {
    curso,
    permisos,
    hitoSeleccionado,
  } =
    useOutletContext<AulaCursoOutletContext>();

  return (
    <section className="aula-dashboard">
      <article className="hito-principal">
        <div className="hito-principal__glow" />

        <div className="hito-principal__contenido">
          <span className="section-eyebrow">
            Hito seleccionado
          </span>

          <h2>
            {hitoSeleccionado
              ? `HITO ${hitoSeleccionado.numero}`
              : 'Sin hito seleccionado'}
          </h2>

          <strong className="hito-principal__nombre">
            {hitoSeleccionado?.nombre ??
            'Selecciona un hito para continuar'}
          </strong>

          <p>
            {hitoSeleccionado?.descripcion ??
            'La información académica aparecerá cuando selecciones uno de los hitos disponibles.'}
          </p>

          {hitoSeleccionado && (
            <div className="hito-principal__meta">
              <span>
                <CalendarDays
                  size={14}
                />

                {formatearFecha(
                  hitoSeleccionado.fechaInicio,
                )}
                {' — '}
                {formatearFecha(
                  hitoSeleccionado.fechaFin,
                )}
              </span>

              <span>
                <Target
                  size={14}
                />

                {hitoSeleccionado.puntajeTotal}
                {' '}
                puntos
              </span>

              <span
                className={`hito-principal__estado ${hitoSeleccionado.estado.toLowerCase()}`}
              >
                <Sparkles
                  size={14}
                />

                {hitoSeleccionado.estado ===
                'EN_CURSO'
                  ? 'En curso'
                  : hitoSeleccionado.estado ===
                      'PROXIMO'
                    ? 'Próximo'
                    : hitoSeleccionado.estado ===
                        'FINALIZADO'
                      ? 'Finalizado'
                      : 'Pendiente'}
              </span>
            </div>
          )}
        </div>

        <div className="hito-principal__visual">
          <span>
            {hitoSeleccionado?.codigo ??
            '—'}
          </span>

          <small>
            {hitoSeleccionado?.puntajeTotal ??
            0}
            {' '}
            pts.
          </small>
        </div>
      </article>

      <section className="hito-dashboard-grid">
        <article className="actividad-hito-card">
          <header className="actividad-hito-card__header">
            <div>
              <span className="section-eyebrow">
                Actividad del hito
              </span>

              <h3>
                Resumen académico
              </h3>

              <p>
                Consulta el estado general del hito sin repetir los accesos de la navegación superior.
              </p>
            </div>

            <span className="actividad-hito-card__codigo">
              {hitoSeleccionado?.codigo ??
              '—'}
            </span>
          </header>

          <div className="actividad-hito-card__contenido">
            <div className="actividad-resumen-grid">
              <button
                type="button"
                className="actividad-resumen actividad-resumen--publicaciones"
                onClick={() =>
                  navigate(
                    'tablon',
                  )
                }
              >
                <span className="actividad-resumen__icono">
                  <Newspaper
                    size={20}
                  />
                </span>

                <span className="actividad-resumen__datos">
                  <small>
                    Publicaciones
                  </small>

                  <strong>
                    0
                  </strong>

                  <em>
                    Sin novedades
                  </em>
                </span>
              </button>

              <button
                type="button"
                className="actividad-resumen actividad-resumen--foros"
                onClick={() =>
                  navigate(
                    'foro',
                  )
                }
              >
                <span className="actividad-resumen__icono">
                  <MessageSquareText
                    size={20}
                  />
                </span>

                <span className="actividad-resumen__datos">
                  <small>
                    Foros
                  </small>

                  <strong>
                    0
                  </strong>

                  <em>
                    Sin debates
                  </em>
                </span>
              </button>

              <button
                type="button"
                className="actividad-resumen actividad-resumen--tareas"
                onClick={() =>
                  navigate(
                    'tareas',
                  )
                }
              >
                <span className="actividad-resumen__icono">
                  <ClipboardCheck
                    size={20}
                  />
                </span>

                <span className="actividad-resumen__datos">
                  <small>
                    Tareas
                  </small>

                  <strong>
                    0
                  </strong>

                  <em>
                    Sin entregas
                  </em>
                </span>
              </button>

              <button
                type="button"
                className="actividad-resumen actividad-resumen--quizzes"
                onClick={() =>
                  navigate(
                    'quizzes',
                  )
                }
              >
                <span className="actividad-resumen__icono">
                  <FileQuestion
                    size={20}
                  />
                </span>

                <span className="actividad-resumen__datos">
                  <small>
                    Quizzes
                  </small>

                  <strong>
                    0
                  </strong>

                  <em>
                    Sin evaluaciones
                  </em>
                </span>
              </button>
            </div>

            <div className="actividad-vacia actividad-vacia--mejorada">
              <div className="actividad-vacia__decoracion">
                <span />
                <span />
                <span />
              </div>

              <div className="actividad-vacia__icono">
                <BookOpen
                  size={28}
                />
              </div>

              <div className="actividad-vacia__texto">
                <span className="actividad-vacia__eyebrow">
                  Línea de actividad
                </span>

                <strong>
                  Este hito todavía está listo para comenzar
                </strong>

                <p>
                  Aquí aparecerán automáticamente los avisos, foros, tareas y evaluaciones más recientes del hito seleccionado.
                </p>

                {permisos.puedeAdministrar ? (
                  <div className="actividad-vacia__acciones">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          'tablon',
                        )
                      }
                    >
                      <Megaphone
                        size={15}
                      />

                      Crear publicación
                    </button>

                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        navigate(
                          'foro',
                        )
                      }
                    >
                      <MessageSquarePlus
                        size={15}
                      />

                      Abrir foro
                    </button>
                  </div>
                ) : (
                  <span className="actividad-vacia__espera">
                    Las novedades aparecerán cuando el docente publique contenido.
                  </span>
                )}
              </div>
            </div>
          </div>
        </article>

        <aside className="hito-lateral">
          <article className="pendientes-card">
            <span className="section-eyebrow">
              Pendientes
            </span>

            <h3>
              Sin pendientes
            </h3>

            <p>
              {permisos.puedeAdministrar
                ? 'No tienes actividades por revisar en este hito.'
                : 'No tienes actividades pendientes en este hito.'}
            </p>

            <div className="pendientes-card__estado">
              <CheckCircle2
                size={17}
              />

              Todo al día
            </div>
          </article>

          <article className="vencimiento-card">
            <span className="section-eyebrow">
              Próximo vencimiento
            </span>

            <h3>
              Sin fechas próximas
            </h3>

            <p>
              Cuando se registre una tarea, foro o quiz con fecha límite, aparecerá aquí.
            </p>

            <div className="vencimiento-card__fecha">
              <CalendarDays
                size={17}
              />

              No disponible
            </div>
          </article>

          {permisos.puedeAdministrar && (
            <article className="acciones-docente-card">
              <span className="section-eyebrow">
                Acciones rápidas
              </span>

              <h3>
                Comienza el hito
              </h3>

              <p>
                Usa estas acciones para crear el primer contenido académico.
              </p>

              <div className="acciones-docente-card__botones">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      'tablon',
                    )
                  }
                >
                  <Megaphone
                    size={16}
                  />

                  Publicar aviso
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    navigate(
                      'foro',
                    )
                  }
                >
                  <MessageSquarePlus
                    size={16}
                  />

                  Crear foro
                </button>
              </div>
            </article>
          )}
        </aside>
      </section>

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .aula-dashboard {
    display: grid;
    gap: 18px;
  }

  .section-eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: 9px;
    font-weight: 850;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .hito-principal {
    position: relative;
    min-height: 185px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
    padding: 27px 30px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 24px;
    background:
      linear-gradient(
        135deg,
        var(--app-surface),
        color-mix(
          in srgb,
          var(--app-accent-soft) 56%,
          var(--app-surface)
        )
      );
    box-shadow: var(--app-shadow-sm);
    isolation: isolate;
  }

  .hito-principal__glow {
    position: absolute;
    top: -100px;
    right: 8%;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        var(--app-warning-bg),
        transparent 68%
      );
    z-index: -1;
  }

  .hito-principal__contenido {
    min-width: 0;
  }

  .hito-principal h2 {
    margin: 7px 0 0;
    color: var(--app-accent-dark);
    font-size: 31px;
    font-weight: 950;
    letter-spacing: -.04em;
  }

  .hito-principal__nombre {
    display: block;
    margin-top: 5px;
    color: var(--app-text);
    font-size: 18px;
  }

  .hito-principal p {
    max-width: 720px;
    margin: 8px 0 0;
    color: var(--app-text-soft);
    font-size: 11px;
    line-height: 1.6;
  }

  .hito-principal__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 15px;
  }

  .hito-principal__meta > span {
    min-height: 29px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid var(--app-border-soft);
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font-size: 9px;
    font-weight: 700;
  }

  .hito-principal__estado.en_curso {
    color: var(--app-success);
    border-color: var(--app-success-border);
    background: var(--app-success-bg);
  }

  .hito-principal__estado.proximo {
    color: var(--app-warning-strong);
    border-color: var(--app-warning-border);
    background: var(--app-warning-bg);
  }

  .hito-principal__estado.finalizado {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .hito-principal__estado.pendiente {
    color: var(--app-text-muted);
    background: var(--app-surface-disabled);
  }

  .hito-principal__visual {
    width: 105px;
    height: 105px;
    display: grid;
    place-items: center;
    align-content: center;
    flex-shrink: 0;
    border: 1px solid var(--app-border-strong);
    border-radius: 30px;
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        145deg,
        var(--app-surface),
        var(--app-warning-bg)
      );
    box-shadow:
      0 18px 34px
      color-mix(
        in srgb,
        var(--app-accent) 14%,
        transparent
      );
  }

  .hito-principal__visual span {
    font-size: 28px;
    font-weight: 950;
  }

  .hito-principal__visual small {
    margin-top: 5px;
    color: var(--app-text-soft);
    font-size: 9px;
  }

  .puntajes-grid,

  .puntajes-grid span {
    color: var(--app-text-soft);
    font-size: 9px;
  }

  .puntajes-grid strong {
    margin-top: 5px;
    color: var(--app-text);
    font-size: 23px;
    line-height: 1;
  }

  .puntajes-grid small {
    margin-top: 5px;
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .hito-dashboard-grid {
    display: grid;
    grid-template-columns:
      minmax(0, 1.45fr)
      minmax(270px, .55fr);
    gap: 14px;
  }

  .actividad-hito-card,
  .pendientes-card,
  .vencimiento-card,
  .acciones-docente-card,
  .progress-card,
  .activity-card {
    border: 1px solid var(--app-border);
    border-radius: 22px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .actividad-hito-card {
    padding: 22px 23px;
  }

  .actividad-hito-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .actividad-hito-card h3,
  .pendientes-card h3,
  .vencimiento-card h3,
  .acciones-docente-card h3,
  .progress-card h3,
  .activity-card h3 {
    margin: 6px 0 0;
    color: var(--app-text);
    font-size: 18px;
    font-weight: 850;
  }

  .actividad-hito-card__header p,
  .pendientes-card p,
  .vencimiento-card p,
  .acciones-docente-card p,
  .progress-card p,
  .activity-card p {
    margin: 6px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.6;
  }

  .actividad-hito-card__codigo {
    min-width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 13px;
    color: var(--app-purple);
    background: var(--app-purple-bg);
    font-size: 12px;
    font-weight: 900;
  }

  .actividad-hito-card__contenido {
    margin-top: 18px;
  }

  .actividad-resumen-grid {
    display: grid;
    grid-template-columns:
      repeat(
        4,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px;
  }

  .actividad-resumen {
    --actividad-color:
      var(--app-accent);

    --actividad-bg:
      var(--app-accent-soft);

    min-width: 0;
    display: grid;
    grid-template-columns:
      42px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding: 13px;
    border: 1px solid var(--app-border-soft);
    border-radius: 16px;
    color: var(--app-text);
    background:
      linear-gradient(
        145deg,
        var(--app-surface-alt),
        color-mix(
          in srgb,
          var(--actividad-bg) 38%,
          var(--app-surface)
        )
      );
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      transform .18s ease,
      border-color .18s ease,
      box-shadow .18s ease;
  }

  .actividad-resumen:hover {
    transform: translateY(-3px);
    border-color:
      color-mix(
        in srgb,
        var(--actividad-color) 42%,
        var(--app-border)
      );
    box-shadow:
      0 12px 24px
      color-mix(
        in srgb,
        var(--actividad-color) 11%,
        transparent
      );
  }

  .actividad-resumen--foros {
    --actividad-color:
      var(--app-purple);

    --actividad-bg:
      var(--app-purple-bg);
  }

  .actividad-resumen--tareas {
    --actividad-color:
      var(--app-success);

    --actividad-bg:
      var(--app-success-bg);
  }

  .actividad-resumen--quizzes {
    --actividad-color:
      var(--app-warning);

    --actividad-bg:
      var(--app-warning-bg);
  }

  .actividad-resumen__icono {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: var(--actividad-color);
    background: var(--actividad-bg);
  }

  .actividad-resumen__datos {
    min-width: 0;
  }

  .actividad-resumen__datos small,
  .actividad-resumen__datos strong,
  .actividad-resumen__datos em {
    display: block;
  }

  .actividad-resumen__datos small {
    color: var(--app-text-soft);
    font-size: 8px;
    font-weight: 750;
  }

  .actividad-resumen__datos strong {
    margin-top: 3px;
    color: var(--app-text);
    font-size: 20px;
    line-height: 1;
  }

  .actividad-resumen__datos em {
    margin-top: 4px;
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: 7px;
    font-style: normal;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .actividad-vacia--mejorada {
    position: relative;
    min-height: 175px;
    display: grid;
    grid-template-columns:
      58px minmax(0, 1fr);
    gap: 15px;
    align-items: center;
    margin-top: 13px;
    padding: 20px;
    overflow: hidden;
    border: 1px dashed
      color-mix(
        in srgb,
        var(--app-accent) 42%,
        var(--app-border)
      );
    border-radius: 18px;
    background:
      linear-gradient(
        135deg,
        var(--app-surface-alt),
        color-mix(
          in srgb,
          var(--app-accent-soft) 42%,
          var(--app-surface)
        )
      );
  }

  .actividad-vacia__decoracion {
    position: absolute;
    top: 15px;
    right: 18px;
    display: flex;
    gap: 5px;
  }

  .actividad-vacia__decoracion span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--app-accent);
    opacity: .22;
  }

  .actividad-vacia__icono {
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        145deg,
        var(--app-surface),
        var(--app-accent-soft)
      );
    box-shadow:
      0 12px 24px
      color-mix(
        in srgb,
        var(--app-accent) 12%,
        transparent
      );
  }

  .actividad-vacia__texto {
    min-width: 0;
  }

  .actividad-vacia__eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: 8px;
    font-weight: 850;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .actividad-vacia__texto strong {
    display: block;
    margin-top: 5px;
    color: var(--app-text);
    font-size: 14px;
    font-weight: 850;
  }

  .actividad-vacia__texto p {
    max-width: 720px;
    margin: 6px 0 0;
    color: var(--app-text-soft);
    font-size: 9px;
    line-height: 1.6;
  }

  .actividad-vacia__acciones {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 13px;
  }

  .actividad-vacia__acciones button {
    min-height: 37px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 12px;
    border: none;
    border-radius: 11px;
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
    font-family: inherit;
    font-size: 9px;
    font-weight: 750;
    cursor: pointer;
  }

  .actividad-vacia__acciones button.secondary {
    border: 1px solid var(--app-border-strong);
    color: var(--app-accent-dark);
    background: var(--app-surface);
  }

  .actividad-vacia__espera {
    display: inline-flex;
    margin-top: 12px;
    padding: 7px 10px;
    border-radius: 999px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    font-size: 8px;
  }

  .hito-lateral {
    display: grid;
    gap: 12px;
  }

  .pendientes-card,
  .vencimiento-card,
  .acciones-docente-card {
    padding: 18px;
  }

  .pendientes-card {
    background:
      linear-gradient(
        145deg,
        var(--app-surface),
        var(--app-success-bg)
      );
  }

  .vencimiento-card {
    background:
      linear-gradient(
        145deg,
        var(--app-surface),
        var(--app-warning-bg)
      );
  }

  .acciones-docente-card {
    background:
      linear-gradient(
        145deg,
        var(--app-surface),
        var(--app-accent-softer)
      );
  }

  .pendientes-card__estado,
  .vencimiento-card__fecha {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 13px;
    padding: 7px 9px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 750;
  }

  .pendientes-card__estado {
    color: var(--app-success);
    background: var(--app-surface);
  }

  .vencimiento-card__fecha {
    color: var(--app-warning-strong);
    background: var(--app-surface);
  }

  .acciones-docente-card__botones {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 14px;
  }

  .acciones-docente-card button {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 11px;
    border: none;
    border-radius: 11px;
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
    font-family: inherit;
    font-size: 9px;
    font-weight: 750;
    cursor: pointer;
  }

  .acciones-docente-card button.secondary {
    border: 1px solid var(--app-border-strong);
    color: var(--app-accent-dark);
    background: var(--app-surface);
  }

  @media (max-width: 760px) {
    .hito-principal {
      align-items: flex-start;
      padding: 23px 20px;
    }

    .hito-principal__visual {
      width: 75px;
      height: 75px;
      border-radius: 22px;
    }

    .actividad-resumen-grid {
      grid-template-columns: 1fr 1fr;
    }

    .hito-dashboard-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 520px) {
    .hito-principal__visual {
      display: none;
    }

    .actividad-hito-card,
    .pendientes-card,
    .vencimiento-card,
    .acciones-docente-card {
      padding: 18px;
    }

    .actividad-resumen-grid {
      grid-template-columns: 1fr;
    }

    .actividad-vacia--mejorada {
      grid-template-columns: 1fr;
    }

    .acciones-docente-card__botones {
      grid-template-columns: 1fr;
    }
  }
`;