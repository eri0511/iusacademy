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
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Home,
  Library,
  LogOut,
  RefreshCw,
  Scale,
  Settings,
  User,
} from 'lucide-react';

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

  return `${API_URL}${fotoPerfilUrl}`;
}

const menuPrincipal: MenuItem[] = [
  {
    to: '/docente',
    label: 'Inicio',
    icon: Home,
    end: true,
  },
  {
    to: '/docente/cursos',
    label: 'Mis cursos',
    icon: GraduationCap,
  },
  {
    to: '/docente/biblioteca',
    label: 'Biblioteca jurídica',
    icon: Library,
    disabled: true,
  },
  {
    to: '/docente/casos',
    label: 'Casos prácticos',
    icon: Scale,
    disabled: true,
  },
  {
    to: '/docente/recursos',
    label: 'Recursos',
    icon: FileText,
    disabled: true,
  },
  {
    to: '/docente/calendario',
    label: 'Calendario',
    icon: CalendarDays,
    disabled: true,
  },
  {
    to: '/docente/notificaciones',
    label: 'Notificaciones',
    icon: Bell,
    disabled: true,
  },
];

const menuCuenta: MenuItem[] = [
  {
    to: '/docente/perfil',
    label: 'Perfil',
    icon: User,
  },
  {
    to: '/docente/configuracion',
    label: 'Configuración',
    icon: Settings,
  },
];

export default function DocenteLayout() {
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
  ] = useState(
    preferencias.sidebarContraido,
  );

  const [
    perfilSidebar,
    setPerfilSidebar,
  ] = useState<PerfilSidebar | null>(
    null,
  );

  const [
    cargandoPerfil,
    setCargandoPerfil,
  ] = useState(false);

  const usuario =
    sesion?.usuario;

  const cargarPerfilSidebar =
    useCallback(
      async () => {
        if (!accessToken) {
          return;
        }

        try {
          setCargandoPerfil(true);

          const respuesta =
            await fetch(
              `${API_URL}/perfil`,
              {
                method: 'GET',
                headers:
                  crearHeadersAutorizados(
                    accessToken,
                  ),
              },
            );

          if (!respuesta.ok) {
            return;
          }

          const datos =
            await respuesta.json() as
              PerfilSidebar;

          setPerfilSidebar(datos);
        } catch (error) {
          console.error(
            'No fue posible actualizar el perfil del menú docente:',
            error,
          );
        } finally {
          setCargandoPerfil(false);
        }
      },
      [accessToken],
    );

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
        'iusacademy:perfil-actualizado',
        actualizarPerfil,
      );

      return () => {
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

  const saludo =
    useMemo(
      () => {
        const hora =
          new Date().getHours();

        if (hora < 12) {
          return 'Buenos días';
        }

        if (hora < 19) {
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
      'Docente'
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
      () => {
        const inicialNombre =
          nombreUsuario.charAt(0);

        const inicialApellido =
          apellidoUsuario.charAt(0);

        return `${inicialNombre}${inicialApellido}`
          .toUpperCase();
      },
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
      (valorActual) => {
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

  useEffect(
    () => {
      setCollapsed(
        preferencias.sidebarContraido,
      );
    },
    [preferencias.sidebarContraido],
  );

  const manejarCerrarSesion = () => {
    cerrarSesion();

    navigate(
      '/login',
      {
        replace: true,
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
        if (disabled) {
          return (
            <button
              key={to}
              type="button"
              title={
                collapsed
                  ? label
                  : undefined
              }
              className="docente-nav-item docente-nav-item--disabled"
              aria-disabled="true"
            >
              <Icon
                size={19}
                className="docente-nav-icon"
              />

              <span className="docente-nav-label">
                {label}
              </span>
            </button>
          );
        }

        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={
              collapsed
                ? label
                : undefined
            }
            className={({
              isActive,
            }) =>
              `docente-nav-item ${
                isActive
                  ? 'active'
                  : ''
              }`
            }
          >
            <Icon
              size={19}
              className="docente-nav-icon"
            />

            <span className="docente-nav-label">
              {label}
            </span>
          </NavLink>
        );
      },
    );

  return (
    <div
      className={`docente-page ${
        collapsed
          ? 'is-collapsed'
          : ''
      }`}
    >
      <aside className="docente-sidebar">
        <div className="docente-profile">
          <button
            type="button"
            className="docente-avatar-button"
            onClick={() =>
              navigate(
                '/docente/perfil',
              )
            }
            aria-label="Abrir mi perfil"
            title="Abrir mi perfil"
          >
            <div
              className="docente-avatar"
              aria-label={`Perfil de ${nombreUsuario} ${apellidoUsuario}`}
            >
              {fotoPerfil ? (
                <img
                  src={fotoPerfil}
                  alt={`Fotografía de ${nombreUsuario} ${apellidoUsuario}`}
                />
              ) : (
                <span>
                  {iniciales}
                </span>
              )}

              {cargandoPerfil && (
                <div className="docente-avatar-loading">
                  <RefreshCw
                    size={15}
                    className="docente-spin"
                  />
                </div>
              )}
            </div>

            <span
              className={`docente-status-dot ${
                cuentaActiva
                  ? 'is-active'
                  : 'is-inactive'
              }`}
              aria-hidden="true"
            />
          </button>

          <div className="docente-profile-info">
            <span className="docente-greeting">
              {saludo}
              <span aria-hidden="true">
                {' '}✨
              </span>
            </span>

            <strong className="docente-name">
              {nombreUsuario}{' '}
              {apellidoUsuario}
            </strong>

            <span className="docente-role">
              Docente
            </span>
          </div>

          <button
            type="button"
            className="docente-collapse"
            onClick={alternarSidebar}
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
                size={22}
                strokeWidth={2.7}
              />
            ) : (
              <ChevronLeft
                size={20}
                strokeWidth={2.6}
              />
            )}
          </button>
        </div>

        <span className="docente-menu-title">
          MENÚ PRINCIPAL
        </span>

        <nav
          className="docente-nav"
          aria-label="Menú principal"
        >
          {renderizarMenu(
            menuPrincipal,
          )}
        </nav>

        <div className="docente-secondary">
          <span className="docente-menu-title docente-menu-title--secondary">
            CUENTA
          </span>

          <nav
            className="docente-nav docente-nav--secondary"
            aria-label="Opciones de cuenta"
          >
            {renderizarMenu(
              menuCuenta,
            )}
          </nav>

          <button
            type="button"
            className="docente-logout"
            title={
              collapsed
                ? 'Cerrar sesión'
                : undefined
            }
            onClick={
              manejarCerrarSesion
            }
          >
            <LogOut size={19} />

            <span className="docente-nav-label">
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      <main className="docente-content">
        <Outlet />
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  :root {
    --docente-bg:
      var(--app-bg);

    --docente-card:
      var(--app-surface);

    --docente-text:
      var(--app-text);

    --docente-text-soft:
      var(--app-text-soft);

    --docente-accent:
      var(--app-accent);

    --docente-accent-light:
      var(--app-accent-hover);

    --docente-accent-dark:
      var(--app-accent-dark);

    --docente-gold:
      var(--app-warning);

    --docente-soft:
      var(--app-accent-soft);

    --docente-border:
      var(--app-border);

    --docente-sidebar-width: 228px;
    --docente-sidebar-collapsed: 74px;
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

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  .docente-page {
    min-height: 100vh;
    min-height: 100dvh;

    position: relative;

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
      var(--docente-bg);

    color: var(--docente-text);

    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "SF Pro Text",
      "Segoe UI",
      sans-serif;

    overflow-x: hidden;
  }

  .docente-sidebar {
    position: fixed;

    top: 20px;
    left: 20px;

    width:
      var(--docente-sidebar-width);

    height:
      calc(100vh - 40px);

    height:
      calc(100dvh - 40px);

    display: flex;
    flex-direction: column;

    padding: 12px;

    border:
      1px solid
      var(--app-border);

    border-radius: 24px;

    background:
      color-mix(
        in srgb,
        var(--app-surface)
        96%,
        transparent
      );

    box-shadow:
      var(--app-shadow-lg);

    backdrop-filter:
      blur(14px);

    -webkit-backdrop-filter:
      blur(14px);

    transition:
      width .3s cubic-bezier(.22,1,.36,1);

    overflow: visible;

    z-index: 20;
  }

  .docente-page.is-collapsed
  .docente-sidebar {
    width:
      var(
        --docente-sidebar-collapsed
      );
  }

  .docente-profile {
    position: relative;

    min-height: 76px;

    padding:
      0
      4px
      12px;

    border-bottom:
      1px solid
      var(--app-border-soft);

    transition:
      min-height .24s ease,
      padding .24s ease;
  }

  .docente-page.is-collapsed
  .docente-profile {
    min-height: 64px;

    padding:
      0
      4px
      8px;
  }

  .docente-avatar-button {
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

  .docente-avatar-button:focus-visible {
    outline:
      3px solid
      var(--app-input-ring);
    outline-offset: 3px;
  }

  .docente-avatar {
    position: relative;
    width: 46px;
    height: 46px;

    display: grid;
    place-items: center;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 14px;

    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-surface-alt)
      );

    color:
      var(--docente-accent-dark);

    font-size: 14px;
    font-weight: 900;

    box-shadow:
      var(--app-shadow-sm);

    overflow: hidden;
  }

  .docente-avatar img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .docente-avatar > span {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }

  .docente-avatar-loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff;
    background:
      rgba(15,23,42,.46);
    backdrop-filter:
      blur(2px);
  }

  .docente-status-dot {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 13px;
    height: 13px;
    border:
      3px solid
      var(--app-surface);
    border-radius: 50%;
  }

  .docente-status-dot.is-active {
    background: #22c55e;
  }

  .docente-status-dot.is-inactive {
    background: #ef4444;
  }

  .docente-profile-info {
    position: absolute;

    top: 0;
    left: 58px;

    width: 145px;
    min-width: 145px;

    opacity: 1;
    visibility: visible;

    transform:
      translateX(
        0
      );

    transition:
      opacity .14s ease .1s,
      transform .2s ease .06s,
      visibility 0s linear 0s;

    pointer-events: auto;
  }

  .docente-page.is-collapsed
  .docente-profile-info {
    opacity: 0;
    visibility: hidden;

    transform:
      translateX(
        -7px
      );

    transition:
      opacity .08s ease,
      transform .14s ease,
      visibility 0s linear .12s;

    pointer-events: none;
  }

  .docente-greeting {
    display: block;

    color:
      var(--docente-text-soft);

    font-size: 12px;
  }

  .docente-name {
    display: block;

    margin-top: 3px;

    color:
      var(--docente-text);

    font-size: 14px;
    font-weight: 800;

    white-space: nowrap;

    overflow: hidden;
    text-overflow: ellipsis;
  }

  .docente-role {
    display: block;

    margin-top: 2px;

    color:
      var(--docente-accent-dark);

    font-size: 10px;
    font-weight: 800;

    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .docente-spin {
    animation:
      docenteSpin
      .8s
      linear
      infinite;
  }

  .docente-collapse {
    position: absolute;

    top: 12px;
    right: 5px;

    width: 24px;
    height: 24px;

    display: grid;
    place-items: center;

    padding: 0;

    border: none;
    outline: none;
    border-radius: 0;

    color:
      var(--docente-accent-dark);

    background: transparent;
    box-shadow: none;

    cursor: pointer;

    z-index: 50;

    opacity: .88;

    transition:
      color .18s ease,
      opacity .18s ease,
      transform .18s ease;
  }

  .docente-page.is-collapsed
  .docente-collapse {
    top: 18px;
    right: -12px;

    width: 25px;
    height: 25px;

    opacity: 1;
  }

  .docente-collapse:hover {
    color:
      var(--docente-accent);

    opacity: 1;

    transform:
      translateX(
        2px
      );
  }

  .docente-page.is-collapsed
  .docente-collapse:hover {
    transform:
      translateX(
        3px
      );
  }

  .docente-collapse:active {
    transform:
      scale(
        .9
      );
  }

  .docente-collapse:focus-visible {
    outline:
      2px solid
      var(--app-input-ring);

    outline-offset:
      3px;
  }

  .docente-menu-title {
    display: block;

    height: 21px;

    margin:
      13px
      8px
      6px;

    overflow: hidden;

    color: var(--app-text-muted);

    font-size: 11px;
    font-weight: 800;

    letter-spacing: 0.13em;
    white-space: nowrap;

    opacity: 1;
    visibility: visible;

    transition:
      height .2s ease,
      margin .2s ease,
      opacity .12s ease .08s,
      visibility 0s linear 0s;
  }

  .docente-page.is-collapsed
  .docente-menu-title {
    height: 0;

    margin:
      0;

    opacity: 0;
    visibility: hidden;

    transition:
      height .16s ease,
      margin .16s ease,
      opacity .08s ease,
      visibility 0s linear .12s;
  }

  .docente-menu-title--secondary {
    margin-top: 0;
  }

  .docente-menu-title {
    max-height: 20px;
    opacity: 1;
    visibility: visible;
    overflow: hidden;
    white-space: nowrap;
    transition:
      max-height 0.2s ease,
      margin 0.2s ease,
      opacity 0.12s ease 0.06s,
      visibility 0s linear 0s;
  }

  .docente-page.is-collapsed
  .docente-menu-title {
    max-height: 0;
    margin-top: 0;
    margin-bottom: 0;
    opacity: 0;
    visibility: hidden;
    transition:
      max-height 0.18s ease,
      margin 0.18s ease,
      opacity 0.08s ease,
      visibility 0s linear 0.18s;
  }

  .docente-nav {
    display: flex;
    flex-direction: column;

    gap: 5px;
  }

  .docente-page.is-collapsed
  .docente-nav {
    padding-top: 5px;
  }

  .docente-nav-label {
    position: absolute;

    left: 50px;

    width: 155px;

    overflow: hidden;

    color: inherit;

    white-space: nowrap;
    text-overflow: ellipsis;

    opacity: 1;
    visibility: visible;

    transform:
      translateX(
        0
      );

    transition:
      opacity .14s ease .11s,
      transform .2s ease .07s,
      visibility 0s linear 0s;
  }

  .docente-page.is-collapsed
  .docente-nav-label {
    opacity: 0;
    visibility: hidden;

    transform:
      translateX(
        -7px
      );

    transition:
      opacity .07s ease,
      transform .13s ease,
      visibility 0s linear .1s;
  }

  .docente-nav-item {
    position: relative;

    min-height: 44px;

    display: flex;
    align-items: center;

    gap: 10px;

    padding: 10px;

    border-radius: 15px;

    color: var(--app-text-secondary);

    font-size: 14px;
    font-weight: 650;

    text-decoration: none;

    transition:
      background 0.18s ease,
      color 0.18s ease,
      transform 0.18s ease,
      box-shadow 0.18s ease;
  }

  .docente-page.is-collapsed
  .docente-nav-item {
    justify-content: center;

    padding-inline: 0;
  }

  .docente-nav-item:hover {
    color:
      var(--docente-accent-dark);

    background:
      var(--app-accent-softer);

    transform:
      translateX(2px);
  }

  .docente-page.is-collapsed
  .docente-nav-item:hover {
    transform:
      translateY(-1px);
  }

  .docente-nav-item.active {
    color:
      var(--docente-accent-dark);

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

  .docente-nav-icon {
    flex-shrink: 0;
  }

  .docente-nav-label {
    max-width: 170px;
    opacity: 1;
    visibility: visible;
    overflow: hidden;
    white-space: nowrap;
    transform: translateX(0);
    transition:
      max-width 0.22s ease,
      opacity 0.15s ease 0.07s,
      transform 0.2s ease,
      visibility 0s linear 0s;
  }

  .docente-page.is-collapsed
  .docente-nav-label {
    max-width: 0;
    opacity: 0;
    visibility: hidden;
    transform: translateX(-8px);
    transition:
      max-width 0.22s ease,
      opacity 0.1s ease,
      transform 0.18s ease,
      visibility 0s linear 0.22s;
  }

  .docente-secondary {
    margin-top: auto;

    padding-top: 14px;

    border-top:
      1px solid
      var(--app-border-soft);
  }

  .docente-nav--secondary {
    margin-bottom: 8px;
  }

  .docente-logout {
    position: relative;

    width: 100%;
    min-height: 44px;

    display: flex;
    align-items: center;

    padding: 10px;

    border: none;
    border-radius: 15px;

    background: transparent;

    color:
      var(--docente-accent-dark);

    font-family: inherit;

    font-size: 14px;
    font-weight: 650;

    text-align: left;

    cursor: pointer;

    transition:
      background .18s ease,
      color .18s ease,
      transform .18s ease,
      box-shadow .18s ease;
  }

  .docente-logout svg {
    flex-shrink: 0;
  }

  .docente-logout
  .docente-nav-label {
    position: absolute;

    left: 50px;

    width: 155px;

    color: inherit;

    overflow: hidden;

    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .docente-page.is-collapsed
  .docente-logout {
    justify-content: center;

    padding-inline: 0;
  }

  .docente-logout:hover {
    color:
      var(--docente-accent-dark);

    background:
      var(--app-accent-softer);

    transform:
      translateX(
        2px
      );
  }

  .docente-page.is-collapsed
  .docente-logout:hover {
    transform:
      translateY(
        -1px
      );
  }

  .docente-content {
    min-height:
      calc(100vh - 40px);

    min-height:
      calc(100dvh - 40px);

    margin-left:
      calc(
        var(
          --docente-sidebar-width
        )
        + 48px
      );

    padding:
      20px
      28px
      20px
      0;

    transition:
      margin-left .3s cubic-bezier(.22,1,.36,1);
  }

  .docente-page.is-collapsed
  .docente-content {
    margin-left:
      calc(
        var(
          --docente-sidebar-collapsed
        )
        + 48px
      );
  }

  html[data-theme='oscuro']
  .docente-page {
    background:
      linear-gradient(
        180deg,
        var(--app-bg-soft),
        var(--app-bg)
      );
  }

  html[data-theme='oscuro']
  .docente-sidebar {
    background:
      color-mix(
        in srgb,
        var(--app-surface)
        96%,
        transparent
      );

    border-color:
      var(--app-border-soft);
  }

  html[data-theme='oscuro']
  .docente-nav-item.active {
    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-surface-alt)
      );
  }

  @keyframes docenteSpin {
    to {
      transform:
        rotate(
          360deg
        );
    }
  }

  @media (
    max-width: 900px
  ) {
    .docente-page {
      padding-top: 0;
    }

    .docente-sidebar {
      position: relative;

      top: 0;
      left: 0;

      width: 100%;
      height: auto;

      padding: 12px 14px;

      border-radius: 0 0 22px 22px;
    }

    .docente-page.is-collapsed
    .docente-sidebar {
      width: 100%;
    }

    .docente-profile {
      min-height: 55px;

      padding:
        0
        38px
        9px
        0;
    }

    .docente-avatar-button {
      left: 0;
    }

    .docente-profile-info,
    .docente-page.is-collapsed
    .docente-profile-info {
      left: 58px;

      width:
        calc(
          100% -
          62px
        );
      min-width: 0;

      opacity: 1;
      visibility: visible;

      transform: none;

      pointer-events: auto;
    }

    .docente-collapse {
      top: 5px;
      right: 0;

      width: 30px;
      height: 30px;

      border:
        1px solid
        var(--app-border);

      border-radius: 10px;
    }

    .docente-page.is-collapsed
    .docente-profile {
      grid-template-columns:
        46px
        minmax(0, 1fr)
        28px;
    }

    .docente-page.is-collapsed
    .docente-profile-info {
      display: block;
      max-width: 170px;
      opacity: 1;
      visibility: visible;
      transform: none;
    }


    .docente-page.is-collapsed
    .docente-collapse {
      position: static;

      background: transparent;
      box-shadow: none;
    }

    .docente-collapse,
    .docente-page.is-collapsed
    .docente-collapse {
      top: 8px;
      right: 2px;

      width: 26px;
      height: 26px;

      opacity: 1;
    }

    .docente-menu-title {
      display: none;
    }

    .docente-nav {
      flex-direction: row;

      overflow-x: auto;

      padding-top: 12px;
      padding-bottom: 4px;

      scrollbar-width: thin;
    }

    .docente-nav-item,
    .docente-page.is-collapsed
    .docente-nav-item {
      min-width: max-content;

      justify-content: center;

      padding-inline: 14px;
    }

    .docente-nav-label,
    .docente-page.is-collapsed
    .docente-nav-label {
      max-width: 170px;
      opacity: 1;
      visibility: visible;
      transform: none;
    }

    .docente-secondary {
      margin-top: 10px;
      padding-top: 10px;
    }

    .docente-nav--secondary {
      margin-bottom: 6px;
    }

    .docente-logout,
    .docente-page.is-collapsed
    .docente-logout {
      justify-content: center;

      padding-inline: 14px;
    }

    .docente-logout
    .docente-nav-label,
    .docente-page.is-collapsed
    .docente-logout
    .docente-nav-label {
      position: static;

      width: auto;
      max-width: 170px;

      opacity: 1;
      visibility: visible;

      transform: none;
    }

    .docente-content,
    .docente-page.is-collapsed
    .docente-content {
      min-height: auto;

      margin-left: 0;

      padding: 20px;
    }
  }

  @media (
    max-width: 520px
  ) {
    .docente-profile-info {
      padding-right: 34px;
    }

    .docente-collapse,
    .docente-page.is-collapsed
    .docente-collapse {
      top: 8px;
      right: 2px;
    }

    .docente-name {
      font-size: 13px;
    }

    .docente-content,
    .docente-page.is-collapsed
    .docente-content {
      padding: 14px;
    }
  }

  @media (
    prefers-reduced-motion:
    reduce
  ) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }

  @media (max-width: 900px) {
    .docente-nav-label,
    .docente-page.is-collapsed
    .docente-nav-label {
      position: static;

      width: auto;

      opacity: 1;
      visibility: visible;

      transform: none;
    }

    .docente-page.is-collapsed
    .docente-nav {
      padding-top: 12px;
    }
  }

  .docente-nav-item--disabled {
    width: 100%;
    border: none;
    font-family: inherit;
    text-align: left;
    opacity: .45;
    cursor: default;
  }

  .docente-nav-item--disabled:hover {
    color: var(--app-text-secondary);
    background: transparent;
    transform: none;
  }

`;