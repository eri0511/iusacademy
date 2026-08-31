import type {
  ComponentType,
} from 'react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home,
  Library,
  LogOut,
  RefreshCw,
  Settings,
  User,
} from 'lucide-react';

import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../auth/AuthContext';

import {
  useConfiguracion,
} from '../config/ConfiguracionContext';

type MenuItem = {
  to: string;
  label: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
  end?: boolean;
  disabled?: boolean;
};

type PerfilSidebar = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  fotoPerfilUrl: string | null;

  rol:
    | 'ADMINISTRADOR'
    | 'DOCENTE'
    | 'ESTUDIANTE';

  estaActivo: boolean;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function crearHeadersAutorizados(
  accessToken: string,
): HeadersInit {
  return {
    Authorization:
      `Bearer ${accessToken}`,
  };
}

function construirUrlFoto(
  fotoPerfilUrl:
    string | null,
): string | null {
  if (!fotoPerfilUrl) {
    return null;
  }

  if (
    fotoPerfilUrl.startsWith(
      'http://',
    ) ||
    fotoPerfilUrl.startsWith(
      'https://',
    )
  ) {
    return fotoPerfilUrl;
  }

  const rutaNormalizada =
    fotoPerfilUrl.startsWith('/')
      ? fotoPerfilUrl
      : `/${fotoPerfilUrl}`;

  return `${API_URL}${rutaNormalizada}`;
}

const menuPrincipal: MenuItem[] = [
  {
    to:
      '/estudiante',

    label:
      'Inicio',

    icon:
      Home,

    end:
      true,
  },
  {
    to:
      '/estudiante/cursos',

    label:
      'Mis cursos',

    icon:
      BookOpen,
  },
  {
    to:
      '/estudiante/inscribirse',

    label:
      'Inscribirme a un curso',

    icon:
      BookOpen,
  },
  {
    to:
      '/estudiante/biblioteca',

    label:
      'Biblioteca jurídica',

    icon:
      Library,

    disabled:
      true,
  },
  {
    to:
      '/estudiante/calendario',

    label:
      'Calendario',

    icon:
      CalendarDays,

    disabled:
      true,
  },
  {
    to:
      '/estudiante/notificaciones',

    label:
      'Notificaciones',

    icon:
      Bell,
  },
];

const menuCuenta: MenuItem[] = [
  {
    to:
      '/estudiante/perfil',

    label:
      'Perfil',

    icon:
      User,
  },
  {
    to:
      '/estudiante/configuracion',

    label:
      'Configuración',

    icon:
      Settings,
  },
];

export default function EstudianteLayout() {
  const navigate =
    useNavigate();

  const {
    sesion,
    accessToken,
    cerrarSesion,
  } = useAuth();

  const {
    preferencias,
    actualizarPreferencia,
  } = useConfiguracion();

  const [
    collapsed,
    setCollapsed,
  ] =
    useState(
      preferencias.sidebarContraido,
    );

  const [
    perfilSidebar,
    setPerfilSidebar,
  ] =
    useState<PerfilSidebar | null>(
      null,
    );

  const [
    cargandoPerfil,
    setCargandoPerfil,
  ] =
    useState(
      false,
    );

  const usuario =
    sesion?.usuario;

  const cargarPerfilSidebar =
    useCallback(
      async () => {
        if (!accessToken) {
          return;
        }

        try {
          setCargandoPerfil(
            true,
          );

          const respuesta =
            await fetch(
              `${API_URL}/perfil`,
              {
                method:
                  'GET',

                headers:
                  crearHeadersAutorizados(
                    accessToken,
                  ),
              },
            );

          if (
            respuesta.status ===
            401
          ) {
            cerrarSesion();

            navigate(
              '/login',
              {
                replace:
                  true,
              },
            );

            return;
          }

          if (!respuesta.ok) {
            return;
          }

          const datos =
            await respuesta.json() as
              PerfilSidebar;

          setPerfilSidebar(
            datos,
          );
        } catch (
          error
        ) {
          console.error(
            'No fue posible cargar el perfil del estudiante:',
            error,
          );
        } finally {
          setCargandoPerfil(
            false,
          );
        }
      },
      [
        accessToken,
        cerrarSesion,
        navigate,
      ],
    );

  /*
   * El perfil se carga una sola vez.
   * No depende de la ruta para evitar
   * que la foto parpadee al navegar.
   */
  useEffect(
    () => {
      void cargarPerfilSidebar();
    },
    [
      cargarPerfilSidebar,
    ],
  );

  useEffect(
    () => {
      const actualizarPerfil = () => {
        void cargarPerfilSidebar();
      };

      window.addEventListener(
        'focus',
        actualizarPerfil,
      );

      window.addEventListener(
        'iusacademy:perfil-actualizado',
        actualizarPerfil,
      );

      return () => {
        window.removeEventListener(
          'focus',
          actualizarPerfil,
        );

        window.removeEventListener(
          'iusacademy:perfil-actualizado',
          actualizarPerfil,
        );
      };
    },
    [
      cargarPerfilSidebar,
    ],
  );

  useEffect(
    () => {
      setCollapsed(
        preferencias.sidebarContraido,
      );
    },
    [
      preferencias.sidebarContraido,
    ],
  );

  const saludo =
    useMemo(
      () => {
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
      },
      [],
    );

  const nombreUsuario =
    (
      perfilSidebar?.nombres ??
      usuario?.nombres ??
      'Estudiante'
    )
      .trim()
      .split(/\s+/)[0];

  const apellidoUsuario =
    (
      perfilSidebar?.apellidoPaterno ??
      usuario?.apellidoPaterno ??
      ''
    )
      .trim()
      .split(/\s+/)[0];

  const iniciales =
    useMemo(
      () =>
        `${nombreUsuario.charAt(0)}${apellidoUsuario.charAt(0)}`
          .toUpperCase(),
      [
        nombreUsuario,
        apellidoUsuario,
      ],
    );

  const fotoPerfil =
    construirUrlFoto(
      perfilSidebar?.fotoPerfilUrl ??
      null,
    );

  const cuentaActiva =
    perfilSidebar?.estaActivo ??
    true;

  const alternarSidebar = () => {
    setCollapsed(
      (
        valorActual,
      ) => {
        const nuevoEstado =
          !valorActual;

        actualizarPreferencia(
          'sidebarContraido',
          nuevoEstado,
        );

        return nuevoEstado;
      },
    );
  };

  const manejarCerrarSesion = () => {
    cerrarSesion();

    navigate(
      '/login',
      {
        replace:
          true,
      },
    );
  };

  const renderizarMenu = (
    items: MenuItem[],
  ) =>
    items.map(
      ({
        to,
        label,
        icon: Icon,
        end,
        disabled,
      }) => {
        if (
          disabled
        ) {
          return (
            <button
              key={
                to
              }
              type="button"
              className="student-nav-item disabled"
              title={
                collapsed
                  ? label
                  : undefined
              }
              aria-disabled="true"
            >
              <Icon
                size={
                  19
                }
                className="student-nav-icon"
              />

              <span className="student-nav-label">
                {label}
              </span>
            </button>
          );
        }

        return (
          <NavLink
            key={
              to
            }
            to={
              to
            }
            end={
              end
            }
            title={
              collapsed
                ? label
                : undefined
            }
            className={({
              isActive,
            }) =>
              `student-nav-item ${
                isActive
                  ? 'active'
                  : ''
              }`
            }
          >
            <Icon
              size={
                19
              }
              className="student-nav-icon"
            />

            <span className="student-nav-label">
              {label}
            </span>
          </NavLink>
        );
      },
    );

  return (
    <div
      className={`student-page ${
        collapsed
          ? 'is-collapsed'
          : ''
      }`}
    >
      <aside className="student-sidebar">
        <div className="student-profile">
          <button
            type="button"
            className="student-avatar-button"
            onClick={() =>
              navigate(
                '/estudiante/perfil',
              )
            }
            aria-label="Abrir mi perfil"
            title="Abrir mi perfil"
          >
            <div className="student-avatar">
              {fotoPerfil ? (
                <img
                  src={
                    fotoPerfil
                  }
                  alt={`Fotografía de ${nombreUsuario} ${apellidoUsuario}`}
                />
              ) : (
                <span>
                  {iniciales}
                </span>
              )}

              {cargandoPerfil && (
                <div className="student-avatar-loading">
                  <RefreshCw
                    size={
                      15
                    }
                    className="student-spin"
                  />
                </div>
              )}
            </div>

            <span
              className={`student-status-dot ${
                cuentaActiva
                  ? 'is-active'
                  : 'is-inactive'
              }`}
            />
          </button>

          <div className="student-profile-info">
            <span className="student-greeting">
              {saludo}
              {' '}
              ✨
            </span>

            <strong className="student-name">
              {nombreUsuario}
              {' '}
              {apellidoUsuario}
            </strong>

            <span className="student-role">
              Estudiante
            </span>
          </div>

          <button
            type="button"
            className="student-collapse"
            onClick={
              alternarSidebar
            }
            aria-label={
              collapsed
                ? 'Expandir menú'
                : 'Contraer menú'
            }
            title={
              collapsed
                ? 'Expandir menú'
                : 'Contraer menú'
            }
          >
            {collapsed ? (
              <ChevronRight
                size={
                  22
                }
                strokeWidth={
                  2.7
                }
              />
            ) : (
              <ChevronLeft
                size={
                  20
                }
                strokeWidth={
                  2.6
                }
              />
            )}
          </button>
        </div>

        <span className="student-menu-title">
          MENÚ PRINCIPAL
        </span>

        <nav
          className="student-nav"
          aria-label="Menú principal del estudiante"
        >
          {renderizarMenu(
            menuPrincipal,
          )}
        </nav>

        <div className="student-secondary">
          <span className="student-menu-title student-menu-title--secondary">
            CUENTA
          </span>

          <nav
            className="student-nav"
            aria-label="Opciones de cuenta"
          >
            {renderizarMenu(
              menuCuenta,
            )}
          </nav>

          <button
            type="button"
            className="student-logout"
            onClick={
              manejarCerrarSesion
            }
            title={
              collapsed
                ? 'Cerrar sesión'
                : undefined
            }
          >
            <LogOut
              size={
                19
              }
            />

            <span className="student-nav-label">
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      <main className="student-content">
        <Outlet />
      </main>

      <style>
        {styles}
      </style>
    </div>
  );
}

const styles = `
  :root {
    --student-sidebar-width: 228px;
    --student-sidebar-collapsed: 74px;
  }

  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  .student-page {
    min-height: 100vh;
    min-height: 100dvh;
    position: relative;
    overflow-x: hidden;
    color: var(--app-text);
    background:
      radial-gradient(
        circle at 0% 0%,
        var(--app-accent-softer),
        transparent 38%
      ),
      radial-gradient(
        circle at 100% 0%,
        var(--app-warning-bg),
        transparent 34%
      ),
      var(--app-bg);
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .student-sidebar {
    position: fixed;
    top: 20px;
    left: 20px;
    width: var(--student-sidebar-width);
    height: calc(100dvh - 40px);
    display: flex;
    flex-direction: column;
    padding: 12px;
    overflow: visible;
    border: 1px solid var(--app-border);
    border-radius: 24px;
    background:
      color-mix(
        in srgb,
        var(--app-surface) 96%,
        transparent
      );
    box-shadow: var(--app-shadow-lg);
    backdrop-filter: blur(14px);
    transition:
      width .3s cubic-bezier(.22,1,.36,1);
    z-index: 20;
  }

  .student-page.is-collapsed
  .student-sidebar {
    width: var(--student-sidebar-collapsed);
  }

  .student-profile {
    position: relative;
    min-height: 76px;
    padding: 0 4px 12px;
    border-bottom: 1px solid var(--app-border-soft);
  }

  .student-avatar-button {
    position: absolute;
    top: 0;
    left: 0;
    width: 46px;
    height: 46px;
    padding: 0;
    border: none;
    border-radius: 14px;
    background: transparent;
    cursor: pointer;
  }

  .student-avatar {
    position: relative;
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--app-border-strong);
    border-radius: 14px;
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-surface-alt)
      );
    font-size: 14px;
    font-weight: 900;
    box-shadow: var(--app-shadow-sm);
  }

  .student-avatar img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .student-avatar-loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff;
    background: rgba(15,23,42,.46);
    backdrop-filter: blur(2px);
  }

  .student-status-dot {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 13px;
    height: 13px;
    border: 3px solid var(--app-surface);
    border-radius: 50%;
  }

  .student-status-dot.is-active {
    background: #22c55e;
  }

  .student-status-dot.is-inactive {
    background: #ef4444;
  }

  .student-profile-info {
    position: absolute;
    top: 0;
    left: 58px;
    width: 145px;
    min-width: 145px;
    opacity: 1;
    visibility: visible;
    transition:
      opacity .14s ease .1s,
      transform .2s ease .06s,
      visibility 0s linear 0s;
  }

  .student-page.is-collapsed
  .student-profile-info {
    opacity: 0;
    visibility: hidden;
    transform: translateX(-7px);
    pointer-events: none;
  }

  .student-greeting {
    display: block;
    color: var(--app-text-soft);
    font-size: 12px;
  }

  .student-name {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    color: var(--app-text);
    font-size: 14px;
    font-weight: 800;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .student-role {
    display: block;
    margin-top: 2px;
    color: var(--app-accent-dark);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .student-collapse {
    position: absolute;
    top: 12px;
    right: 5px;
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    padding: 0;
    border: none;
    color: var(--app-accent-dark);
    background: transparent;
    cursor: pointer;
    z-index: 50;
  }

  .student-page.is-collapsed
  .student-collapse {
    top: 18px;
    right: -12px;
  }

  .student-menu-title {
    display: block;
    max-height: 20px;
    margin: 13px 8px 6px;
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .13em;
    white-space: nowrap;
    opacity: 1;
    visibility: visible;
    transition:
      max-height .2s ease,
      margin .2s ease,
      opacity .12s ease;
  }

  .student-page.is-collapsed
  .student-menu-title {
    max-height: 0;
    margin-top: 0;
    margin-bottom: 0;
    opacity: 0;
    visibility: hidden;
  }

  .student-menu-title--secondary {
    margin-top: 0;
  }

  .student-nav {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .student-nav-item,
  .student-logout {
    position: relative;
    width: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border: none;
    border-radius: 15px;
    color: var(--app-text-secondary);
    background: transparent;
    font-family: inherit;
    font-size: 14px;
    font-weight: 650;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    transition:
      background .18s ease,
      color .18s ease,
      transform .18s ease;
  }

  .student-nav-item:hover,
  .student-logout:hover {
    color: var(--app-accent-dark);
    background: var(--app-accent-softer);
    transform: translateX(2px);
  }

  .student-nav-item.active {
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-accent-softer)
      );
    box-shadow:
      inset 0 0 0 1px
      var(--app-border);
  }

  .student-nav-item.disabled {
    opacity: .45;
    cursor: default;
  }

  .student-nav-item.disabled:hover {
    color: var(--app-text-secondary);
    background: transparent;
    transform: none;
  }

  .student-nav-label {
    position: absolute;
    left: 50px;
    width: 155px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    opacity: 1;
    visibility: visible;
    transition:
      opacity .14s ease .1s,
      transform .2s ease .06s;
  }

  .student-page.is-collapsed
  .student-nav-label {
    opacity: 0;
    visibility: hidden;
    transform: translateX(-7px);
  }

  .student-page.is-collapsed
  .student-nav-item,
  .student-page.is-collapsed
  .student-logout {
    justify-content: center;
    padding-inline: 0;
  }

  .student-secondary {
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid var(--app-border-soft);
  }

  .student-logout {
    margin-top: 8px;
    color: var(--app-accent-dark);
  }

  .student-content {
    min-height: calc(100dvh - 40px);
    margin-left:
      calc(
        var(--student-sidebar-width) + 48px
      );
    padding: 20px 28px 20px 0;
    transition:
      margin-left .3s cubic-bezier(.22,1,.36,1);
  }

  .student-page.is-collapsed
  .student-content {
    margin-left:
      calc(
        var(--student-sidebar-collapsed) + 48px
      );
  }

  html[data-theme='oscuro']
  .student-page {
    background:
      linear-gradient(
        180deg,
        var(--app-bg-soft),
        var(--app-bg)
      );
  }

  .student-spin {
    animation:
      studentSpin .8s linear infinite;
  }

  @keyframes studentSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 900px) {
    .student-sidebar,
    .student-page.is-collapsed
    .student-sidebar {
      position: relative;
      top: 0;
      left: 0;
      width: 100%;
      height: auto;
      border-radius: 0 0 22px 22px;
    }

    .student-profile-info,
    .student-page.is-collapsed
    .student-profile-info {
      left: 58px;
      width: calc(100% - 62px);
      min-width: 0;
      opacity: 1;
      visibility: visible;
      transform: none;
      pointer-events: auto;
    }

    .student-collapse,
    .student-page.is-collapsed
    .student-collapse {
      top: 8px;
      right: 2px;
      width: 26px;
      height: 26px;
    }

    .student-menu-title {
      display: none;
    }

    .student-nav {
      flex-direction: row;
      overflow-x: auto;
      padding-top: 12px;
      padding-bottom: 4px;
    }

    .student-nav-item,
    .student-page.is-collapsed
    .student-nav-item {
      min-width: max-content;
      justify-content: center;
      padding-inline: 14px;
    }

    .student-nav-label,
    .student-page.is-collapsed
    .student-nav-label {
      position: static;
      width: auto;
      opacity: 1;
      visibility: visible;
      transform: none;
    }

    .student-secondary {
      margin-top: 10px;
      padding-top: 10px;
    }

    .student-content,
    .student-page.is-collapsed
    .student-content {
      min-height: auto;
      margin-left: 0;
      padding: 20px;
    }
  }

  @media (max-width: 520px) {
    .student-content,
    .student-page.is-collapsed
    .student-content {
      padding: 14px;
    }

    .student-name {
      font-size: 13px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
`;