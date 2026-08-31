import {
  useCallback,
  useEffect,
} from 'react';

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  Clock3,
  FileText,
  GraduationCap,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Trash2,
} from 'lucide-react';

import type {
  ComponentType,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import useNotificaciones from '../../hooks/notificaciones/useNotificaciones';

import type {
  Notificacion,
  TipoNotificacion,
} from '../../types/notificaciones/notificacion.types';

type RolSeccion =
  | 'ADMINISTRADOR'
  | 'DOCENTE'
  | 'ESTUDIANTE';

type ConfiguracionTipo = {
  etiqueta: string;

  clase:
    | 'azul'
    | 'naranja'
    | 'rojo'
    | 'verde'
    | 'morado'
    | 'celeste';

  icono: ComponentType<{
    size?: number;
  }>;
};

const CONFIGURACION_TIPO:
  Record<
    TipoNotificacion,
    ConfiguracionTipo
  > = {
    NUEVA_TAREA: {
      etiqueta: 'Nueva tarea',
      clase: 'azul',
      icono: FileText,
    },

    TAREA_POR_VENCER: {
      etiqueta: 'Por vencer',
      clase: 'naranja',
      icono: Clock3,
    },

    TAREA_VENCIDA: {
      etiqueta: 'Tarea vencida',
      clase: 'rojo',
      icono: AlertTriangle,
    },

    NUEVO_TABLON: {
      etiqueta: 'Tablón',
      clase: 'verde',
      icono: Megaphone,
    },

    NOTA_PUBLICADA: {
      etiqueta: 'Nota publicada',
      clase: 'morado',
      icono: GraduationCap,
    },

    EXTENSION_PLAZO: {
      etiqueta: 'Plazo extendido',
      clase: 'celeste',
      icono: CalendarClock,
    },

    FORO_POR_VENCER: {
      etiqueta: 'Foro por vencer',
      clase: 'naranja',
      icono: MessagesSquare,
    },

    FORO_NUEVO_TEMA: {
      etiqueta: 'Nuevo tema',
      clase: 'azul',
      icono: MessageCircle,
    },
  };

function formatearFecha(
  fecha: string,
): string {
  const instante =
    new Date(fecha);

  if (
    Number.isNaN(
      instante.getTime(),
    )
  ) {
    return '';
  }

  const ahora =
    new Date();

  const mismoDia =
    ahora.getFullYear() ===
      instante.getFullYear() &&
    ahora.getMonth() ===
      instante.getMonth() &&
    ahora.getDate() ===
      instante.getDate();

  if (mismoDia) {
    return new Intl.DateTimeFormat(
      'es-BO',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      },
    ).format(instante);
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  ).format(instante);
}

function resolverEnlace(
  enlace: string | null,
  rol: RolSeccion,
): string | null {
  if (!enlace) {
    return null;
  }

  if (
    rol ===
    'ESTUDIANTE'
  ) {
    return enlace;
  }

  if (
    rol ===
      'DOCENTE' &&
    enlace.startsWith(
      '/estudiante/',
    )
  ) {
    return enlace.replace(
      '/estudiante',
      '/docente',
    );
  }

  return null;
}

type NotificacionesPageProps = {
  rolSeccion: RolSeccion;
};

export default function NotificacionesPage({
  rolSeccion,
}: NotificacionesPageProps) {
  const navigate =
    useNavigate();

  const {
    notificaciones,
    total,
    noLeidas,
    cargando,
    error,
    cargar,
    marcarLeida,
    marcarTodasLeidas,
    retirar,
    limpiarError,
  } =
    useNotificaciones();

  useEffect(
    () => {
      void cargar();
    },
    [
      cargar,
    ],
  );

  const manejarClickNotificacion =
    useCallback(
      (
        notificacion:
          Notificacion,
      ) => {
        if (
          !notificacion.esLeida
        ) {
          void marcarLeida(
            notificacion.id,
          );
        }

        const destino =
          resolverEnlace(
            notificacion.enlace,
            rolSeccion,
          );

        if (destino) {
          navigate(destino);
        }
      },
      [
        marcarLeida,
        navigate,
        rolSeccion,
      ],
    );

  const manejarLeerTodas =
    useCallback(
      () => {
        void marcarTodasLeidas();
      },
      [
        marcarTodasLeidas,
      ],
    );

  return (
    <section className="notif-page">
      <header className="notif-hero">
        <div className="notif-hero__main">
          <span className="notif-hero__icon">
            <Bell size={24} />
          </span>

          <div>
            <span className="notif-eyebrow">
              CENTRO DE NOTIFICACIONES
            </span>

            <h1>
              Notificaciones
            </h1>

            <p>
              Consulta las novedades,
              actividades y avisos
              importantes de tus cursos.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="notif-leer-todas"
          onClick={
            manejarLeerTodas
          }
          disabled={
            noLeidas === 0
          }
        >
          <CheckCheck
            size={17}
          />

          Marcar todas como leídas
        </button>
      </header>

      <div className="notif-resumen">
        <article className="notif-stat">
          <span className="notif-stat__icon total">
            <Bell size={20} />
          </span>

          <div>
            <strong>
              {cargando
                ? '—'
                : total}
            </strong>

            <span>
              Notificaciones
            </span>
          </div>
        </article>

        <article className="notif-stat">
          <span className="notif-stat__icon unread">
            <MessageCircle
              size={20}
            />
          </span>

          <div>
            <strong>
              {cargando
                ? '—'
                : noLeidas}
            </strong>

            <span>
              Sin leer
            </span>
          </div>
        </article>

        <article className="notif-stat">
          <span className="notif-stat__icon read">
            <CheckCheck
              size={20}
            />
          </span>

          <div>
            <strong>
              {cargando
                ? '—'
                : Math.max(
                    total -
                      noLeidas,
                    0,
                  )}
            </strong>

            <span>
              Leídas
            </span>
          </div>
        </article>
      </div>

      <article className="notif-panel">
        <div className="notif-panel__head">
          <div>
            <span className="notif-eyebrow">
              ACTIVIDAD RECIENTE
            </span>

            <h2>
              Tus novedades
            </h2>
          </div>

          {!cargando &&
            total > 0 && (
              <span className="notif-panel__count">
                {total}{' '}
                {total === 1
                  ? 'notificación'
                  : 'notificaciones'}
              </span>
            )}
        </div>

        {cargando &&
        notificaciones.length ===
          0 ? (
          <div className="notif-state">
            <span className="notif-state__icon">
              <Bell size={25} />
            </span>

            <strong>
              Cargando notificaciones
            </strong>

            <p>
              Estamos consultando
              tus novedades.
            </p>
          </div>
        ) : error ? (
          <div className="notif-state notif-state--error">
            <span className="notif-state__icon">
              <AlertTriangle
                size={25}
              />
            </span>

            <strong>
              No fue posible cargar
              las notificaciones
            </strong>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                limpiarError();

                void cargar();
              }}
            >
              Reintentar
            </button>
          </div>
        ) : notificaciones.length ===
            0 ? (
          <div className="notif-state">
            <span className="notif-state__icon">
              <CheckCheck
                size={26}
              />
            </span>

            <strong>
              Todo está al día
            </strong>

            <p>
              Cuando exista una nueva
              tarea, publicación, foro
              o calificación aparecerá
              aquí.
            </p>
          </div>
        ) : (
          <ul className="notif-list">
            {notificaciones.map(
              (
                notificacion,
              ) => {
                const configuracion =
                  CONFIGURACION_TIPO[
                    notificacion.tipo
                  ];

                const Icono =
                  configuracion.icono;

                const tieneEnlace =
                  resolverEnlace(
                    notificacion.enlace,
                    rolSeccion,
                  ) !== null;

                return (
                  <li
                    key={
                      notificacion.id
                    }
                    className={`notif-item ${
                      notificacion.esLeida
                        ? 'is-read'
                        : 'is-unread'
                    }`}
                  >
                    <button
                      type="button"
                      className="notif-item__main"
                      onClick={() =>
                        manejarClickNotificacion(
                          notificacion,
                        )
                      }
                    >
                      <span
                        className={`notif-item__icon ${configuracion.clase}`}
                      >
                        <Icono
                          size={19}
                        />
                      </span>

                      <span className="notif-item__content">
                        <span className="notif-item__top">
                          <span
                            className={`notif-item__type ${configuracion.clase}`}
                          >
                            {
                              configuracion.etiqueta
                            }
                          </span>

                          <span className="notif-item__date">
                            {formatearFecha(
                              notificacion.creadoEn,
                            )}
                          </span>
                        </span>

                        <strong className="notif-item__title">
                          {
                            notificacion.titulo
                          }
                        </strong>

                        {notificacion.cuerpo && (
                          <span className="notif-item__body">
                            {
                              notificacion.cuerpo
                            }
                          </span>
                        )}

                        {tieneEnlace && (
                          <span className="notif-item__link">
                            Ver detalle

                            <span>
                              →
                            </span>
                          </span>
                        )}
                      </span>

                      {!notificacion.esLeida && (
                        <span
                          className="notif-item__dot"
                          aria-label="No leída"
                        />
                      )}
                    </button>

                    <button
                      type="button"
                      className="notif-item__delete"
                      onClick={(
                        evento,
                      ) => {
                        evento.stopPropagation();

                        void retirar(
                          notificacion.id,
                        );
                      }}
                      aria-label="Eliminar notificación"
                      title="Eliminar"
                    >
                      <Trash2
                        size={16}
                      />
                    </button>
                  </li>
                );
              },
            )}
          </ul>
        )}
      </article>

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .notif-page {
    width: 100%;
    min-width: 0;

    padding:
      0
      34px
      28px;

    color:
      var(--app-text);
  }

  .notif-hero {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 24px;

    margin-bottom: 16px;

    padding:
      25px
      29px;

    border:
      1px solid
      var(--app-border);

    border-left:
      4px solid
      var(--app-accent);

    border-radius:
      26px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow);
  }

  .notif-hero__main {
    min-width: 0;

    display: flex;
    align-items: center;

    gap: 15px;
  }

  .notif-hero__icon {
    width: 52px;
    height: 52px;

    display: grid;
    place-items: center;

    flex:
      0 0 auto;

    border-radius: 16px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .notif-eyebrow {
    display: block;

    color:
      var(--app-accent-dark);

    font-size: 10.5px;
    font-weight: 850;

    letter-spacing: .14em;

    text-transform:
      uppercase;
  }

  .notif-hero h1 {
    margin:
      5px
      0
      0;

    color:
      var(--app-text);

    font-size: 28px;
    font-weight: 900;
  }

  .notif-hero p {
    max-width: 700px;

    margin:
      6px
      0
      0;

    color:
      var(--app-text-soft);

    font-size: 13px;
    line-height: 1.55;
  }

  .notif-leer-todas {
    min-height: 40px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 7px;

    flex:
      0 0 auto;

    padding:
      9px
      15px;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 999px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    font-family: inherit;
    font-size: 11.5px;
    font-weight: 800;

    cursor: pointer;

    transition:
      transform .18s ease,
      border-color .18s ease,
      background .18s ease;
  }

  .notif-leer-todas:hover:not(:disabled) {
    transform:
      translateY(-1px);

    border-color:
      var(--app-accent);
  }

  .notif-leer-todas:disabled {
    opacity: .45;
    cursor: not-allowed;
    transform: none;
  }

  .notif-resumen {
    display: grid;

    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );

    gap: 13px;

    margin-bottom: 16px;
  }

  .notif-stat {
    min-width: 0;

    display: flex;
    align-items: center;

    gap: 13px;

    min-height: 82px;

    padding:
      15px
      17px;

    border:
      1px solid
      var(--app-border);

    border-radius: 20px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);
  }

  .notif-stat__icon {
    width: 44px;
    height: 44px;

    display: grid;
    place-items: center;

    flex:
      0 0 auto;

    border-radius: 14px;
  }

  .notif-stat__icon.total {
    color:
      var(--app-accent);

    background:
      var(--app-accent-soft);
  }

  .notif-stat__icon.unread {
    color:
      var(--app-warning);

    background:
      var(--app-warning-bg);
  }

  .notif-stat__icon.read {
    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .notif-stat strong {
    display: block;

    color:
      var(--app-text);

    font-size: 22px;
    font-weight: 900;
  }

  .notif-stat span:not(
    .notif-stat__icon
  ) {
    display: block;

    margin-top: 3px;

    color:
      var(--app-text-soft);

    font-size: 11px;
  }

  .notif-panel {
    overflow: hidden;

    border:
      1px solid
      var(--app-border);

    border-radius: 23px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow);
  }

  .notif-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 16px;

    padding:
      20px
      23px;

    border-bottom:
      1px solid
      var(--app-border);
  }

  .notif-panel__head h2 {
    margin:
      4px
      0
      0;

    color:
      var(--app-text);

    font-size: 18px;
    font-weight: 850;
  }

  .notif-panel__count {
    display: inline-flex;
    align-items: center;

    padding:
      6px
      10px;

    border:
      1px solid
      var(--app-border);

    border-radius: 999px;

    color:
      var(--app-text-soft);

    background:
      var(--app-surface-alt);

    font-size: 10px;
    font-weight: 750;
  }

  .notif-list {
    list-style: none;

    margin: 0;

    padding:
      8px
      10px
      10px;
  }

  .notif-item {
    position: relative;

    display: flex;
    align-items: stretch;

    min-width: 0;

    border:
      1px solid
      transparent;

    border-radius: 15px;

    transition:
      border-color .18s ease,
      background .18s ease;
  }

  .notif-item +
  .notif-item {
    margin-top: 6px;
  }

  .notif-item.is-unread {
    border-color:
      var(--app-border);

    background:
      var(--app-accent-soft);
  }

  .notif-item.is-read {
    background:
      transparent;
  }

  .notif-item:hover {
    border-color:
      var(--app-border-strong);

    background:
      var(--app-surface-alt);
  }

  .notif-item__main {
    min-width: 0;

    flex: 1;

    display: grid;

    grid-template-columns:
      42px
      minmax(
        0,
        1fr
      )
      auto;

    align-items: flex-start;

    gap: 12px;

    padding:
      13px
      48px
      13px
      13px;

    border: 0;

    border-radius: 15px;

    color: inherit;

    background:
      transparent;

    font-family: inherit;

    text-align: left;

    cursor: pointer;
  }

  .notif-item__icon {
    width: 42px;
    height: 42px;

    display: grid;
    place-items: center;

    flex:
      0 0 auto;

    border-radius: 13px;
  }

  .notif-item__icon.azul {
    color: #2563eb;
    background: #eff6ff;
  }

  .notif-item__icon.naranja {
    color: #d97706;
    background: #fff7ed;
  }

  .notif-item__icon.rojo {
    color: #dc2626;
    background: #fef2f2;
  }

  .notif-item__icon.verde {
    color: #059669;
    background: #ecfdf5;
  }

  .notif-item__icon.morado {
    color: #7c3aed;
    background: #f5f3ff;
  }

  .notif-item__icon.celeste {
    color: #0891b2;
    background: #ecfeff;
  }

  .notif-item__content {
    min-width: 0;

    display: flex;
    flex-direction: column;

    gap: 3px;
  }

  .notif-item__top {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 12px;
  }

  .notif-item__type {
    display: inline-flex;
    align-items: center;

    width: fit-content;

    font-size: 9.5px;
    font-weight: 850;

    letter-spacing: .05em;

    text-transform:
      uppercase;
  }

  .notif-item__type.azul {
    color: #2563eb;
  }

  .notif-item__type.naranja {
    color: #d97706;
  }

  .notif-item__type.rojo {
    color: #dc2626;
  }

  .notif-item__type.verde {
    color: #059669;
  }

  .notif-item__type.morado {
    color: #7c3aed;
  }

  .notif-item__type.celeste {
    color: #0891b2;
  }

  .notif-item__date {
    flex:
      0 0 auto;

    color:
      var(--app-text-muted);

    font-size: 10px;

    white-space: nowrap;
  }

  .notif-item__title {
    overflow: hidden;

    margin-top: 1px;

    color:
      var(--app-text);

    font-size: 12.5px;
    font-weight: 800;

    line-height: 1.4;

    text-overflow:
      ellipsis;
  }

  .notif-item__body {
    display:
      -webkit-box;

    overflow: hidden;

    color:
      var(--app-text-soft);

    font-size: 11px;
    line-height: 1.5;

    -webkit-box-orient:
      vertical;

    -webkit-line-clamp:
      2;
  }

  .notif-item__link {
    display: inline-flex;
    align-items: center;

    gap: 4px;

    width: fit-content;

    margin-top: 3px;

    color:
      var(--app-accent-dark);

    font-size: 10px;
    font-weight: 800;
  }

  .notif-item__link span {
    transition:
      transform .18s ease;
  }

  .notif-item:hover
  .notif-item__link span {
    transform:
      translateX(2px);
  }

  .notif-item__dot {
    width: 8px;
    height: 8px;

    align-self: center;

    margin-top: 17px;

    border-radius: 50%;

    background:
      var(--app-accent);
  }

  .notif-item__delete {
    position: absolute;

    top: 50%;
    right: 11px;

    width: 32px;
    height: 32px;

    display: grid;
    place-items: center;

    padding: 0;

    border: 0;

    border-radius: 9px;

    color:
      var(--app-text-muted);

    background:
      transparent;

    cursor: pointer;

    opacity: 0;

    transform:
      translateY(-50%);

    transition:
      opacity .18s ease,
      color .18s ease,
      background .18s ease;
  }

  .notif-item:hover
  .notif-item__delete {
    opacity: 1;
  }

  .notif-item__delete:hover {
    color:
      var(--app-danger);

    background:
      var(--app-danger-bg);
  }

  .notif-state {
    min-height: 280px;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    gap: 6px;

    padding:
      35px
      20px;

    color:
      var(--app-text-soft);

    text-align: center;
  }

  .notif-state__icon {
    width: 54px;
    height: 54px;

    display: grid;
    place-items: center;

    margin-bottom: 5px;

    border-radius: 17px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .notif-state strong {
    color:
      var(--app-text);

    font-size: 13px;
  }

  .notif-state p {
    max-width: 430px;

    margin: 0;

    font-size: 11px;
    line-height: 1.55;
  }

  .notif-state--error
  .notif-state__icon {
    color:
      var(--app-danger);

    background:
      var(--app-danger-bg);
  }

  .notif-state--error
  strong {
    color:
      var(--app-danger);
  }

  .notif-state button {
    min-height: 35px;

    margin-top: 7px;

    padding:
      7px
      13px;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 9px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-surface);

    font-family: inherit;

    font-size: 10.5px;
    font-weight: 800;

    cursor: pointer;
  }

  @media (
    max-width:
      900px
  ) {
    .notif-resumen {
      grid-template-columns:
        repeat(
          3,
          minmax(
            0,
            1fr
          )
        );
    }
  }

  @media (
    max-width:
      760px
  ) {
    .notif-page {
      padding:
        0
        18px
        24px;
    }

    .notif-hero {
      align-items: stretch;
      flex-direction: column;

      padding: 21px;
    }

    .notif-leer-todas {
      width: 100%;
    }

    .notif-resumen {
      grid-template-columns:
        1fr;
    }

    .notif-panel__head {
      align-items: flex-start;
      flex-direction: column;
    }

    .notif-item__main {
      grid-template-columns:
        40px
        minmax(
          0,
          1fr
        );

      padding-right: 44px;
    }

    .notif-item__dot {
      position: absolute;

      top: 17px;
      right: 14px;

      margin: 0;
    }

    .notif-item__top {
      align-items: flex-start;
      flex-direction: column;

      gap: 3px;
    }
  }

  @media (
    max-width:
      520px
  ) {
    .notif-hero__main {
      align-items: flex-start;
    }

    .notif-hero__icon {
      width: 46px;
      height: 46px;

      border-radius: 14px;
    }

    .notif-hero h1 {
      font-size: 24px;
    }

    .notif-list {
      padding: 6px;
    }

    .notif-item__main {
      gap: 9px;

      padding:
        11px
        42px
        11px
        10px;
    }

    .notif-item__icon {
      width: 38px;
      height: 38px;

      border-radius: 11px;
    }

    .notif-item__delete {
      opacity: 1;

      right: 7px;
    }
  }
`;