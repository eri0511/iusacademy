import type { ComponentType } from 'react';

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
  BookOpen,
  CalendarDays,
  GraduationCap,
  FileClock,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  RefreshCw,
  Settings,
  User,
  Users,
} from 'lucide-react';

import { useAuth } from '../auth/AuthContext';

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
    to: '/admin',
    label: 'Inicio',
    icon: Home,
    end: true,
  },
  {
    to: '/admin/usuarios',
    label: 'Usuarios',
    icon: Users,
  },
  {
    to: '/admin/materias',
    label: 'Materias',
    icon: BookOpen,
  },
  {
    to: '/admin/cursos',
    label: 'Cursos',
    icon: GraduationCap,
  },
  {
    to: '/admin/hitos',
    label: 'Hitos académicos',
    icon: CalendarDays,
  },
  {
    to: '/admin/reportes',
    label: 'Historial de reportes',
    icon: FileClock,
  },
];

const menuCuenta: MenuItem[] = [
  {
    to: '/admin/perfil',
    label: 'Perfil',
    icon: User,
  },
  {
    to: '/admin/configuracion',
    label: 'Configuración',
    icon: Settings,
  },
];

export default function AdministradorLayout() {
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
            'No fue posible actualizar el perfil del menú:',
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
      ],
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
    perfilSidebar?.nombres?.trim() ||
    usuario?.nombres?.trim() ||
    'Administrador';

  const apellidoUsuario =
    perfilSidebar?.apellidoPaterno?.trim() ||
    usuario?.apellidoPaterno?.trim() ||
    '';

  const iniciales =
    useMemo(
      () => {
        const inicialNombre =
          nombreUsuario.charAt(
            0,
          );

        const inicialApellido =
          apellidoUsuario.charAt(
            0,
          );

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

  const manejarCerrarSesion = () => {
    cerrarSesion();

    navigate('/login', {
      replace: true,
    });
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
      }) => (
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
            `admin-nav-item ${
              isActive
                ? 'active'
                : ''
            }`
          }
        >
          <Icon
            size={19}
            className="admin-nav-icon"
          />

          <span className="admin-nav-label">
            {label}
          </span>
        </NavLink>
      ),
    );

  return (
    <div
      className={`admin-page ${
        collapsed
          ? 'is-collapsed'
          : ''
      }`}
    >
      <aside className="admin-sidebar">
        <div className="admin-profile">
          <button
            type="button"
            className="admin-avatar-button"
            onClick={() =>
              navigate(
                '/admin/perfil',
              )
            }
            aria-label="Abrir mi perfil"
            title="Abrir mi perfil"
          >
            <div
              className="admin-avatar"
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
                <div className="admin-avatar-loading">
                  <RefreshCw
                    size={15}
                    className="admin-spin"
                  />
                </div>
              )}
            </div>

            <span
              className={`admin-status-dot ${
                cuentaActiva
                  ? 'is-active'
                  : 'is-inactive'
              }`}
              aria-hidden="true"
            />
          </button>

          <div className="admin-profile-info">
            <span className="admin-greeting">
              {saludo}
              <span aria-hidden="true">
                {' '}
                ✨
              </span>
            </span>

            <strong className="admin-name">
              {nombreUsuario}{' '}
              {apellidoUsuario}
            </strong>

            <span className="admin-role">
              Administrador
            </span>
          </div>

          <button
            type="button"
            className="admin-collapse"
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

        <span className="admin-menu-title">
          MENÚ PRINCIPAL
        </span>

        <nav
          className="admin-nav"
          aria-label="Menú principal"
        >
          {renderizarMenu(
            menuPrincipal,
          )}
        </nav>

        <div className="admin-secondary">
          <span className="admin-menu-title admin-menu-title--secondary">
            CUENTA
          </span>

          <nav
            className="admin-nav admin-nav--secondary"
            aria-label="Opciones de cuenta"
          >
            {renderizarMenu(
              menuCuenta,
            )}
          </nav>

          <button
            type="button"
            className="admin-logout"
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

            <span className="admin-nav-label">
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  :root {
    --admin-bg:
      var(--app-bg);

    --admin-card:
      var(--app-surface);

    --admin-text:
      var(--app-text);

    --admin-text-soft:
      var(--app-text-soft);

    --admin-accent:
      var(--app-accent);

    --admin-accent-light:
      var(--app-accent-hover);

    --admin-accent-dark:
      var(--app-accent-dark);

    --admin-gold:
      var(--app-warning);

    --admin-soft:
      var(--app-accent-soft);

    --admin-border:
      var(--app-border);

    --admin-sidebar-width: 228px;
    --admin-sidebar-collapsed: 74px;
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

  .admin-page {
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
      var(--admin-bg);

    color: var(--admin-text);

    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "SF Pro Text",
      "Segoe UI",
      sans-serif;

    overflow-x: hidden;
  }

  .admin-sidebar {
    position: fixed;

    top: 20px;
    left: 20px;

    width:
      var(--admin-sidebar-width);

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

  .admin-page.is-collapsed
  .admin-sidebar {
    width:
      var(
        --admin-sidebar-collapsed
      );
  }

  .admin-profile {
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

  .admin-page.is-collapsed
  .admin-profile {
    min-height: 64px;

    padding:
      0
      4px
      8px;
  }

  .admin-avatar-button {
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

  .admin-avatar-button:focus-visible {
    outline:
      3px solid
      var(--app-input-ring);
    outline-offset: 3px;
  }

  .admin-avatar {
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
      var(--admin-accent-dark);

    font-size: 14px;
    font-weight: 900;

    box-shadow:
      var(--app-shadow-sm);

    overflow: hidden;
  }

  .admin-avatar img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .admin-avatar > span {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }

  .admin-avatar-loading {
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

  .admin-status-dot {
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

  .admin-status-dot.is-active {
    background: #22c55e;
  }

  .admin-status-dot.is-inactive {
    background: #ef4444;
  }

  .admin-profile-info {
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

  .admin-page.is-collapsed
  .admin-profile-info {
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

  .admin-greeting {
    display: block;

    color:
      var(--admin-text-soft);

    font-size: 12px;
  }

  .admin-name {
    display: block;

    margin-top: 3px;

    color:
      var(--admin-text);

    font-size: 14px;
    font-weight: 800;

    white-space: nowrap;

    overflow: hidden;
    text-overflow: ellipsis;
  }

  .admin-role {
    display: block;

    margin-top: 2px;

    color:
      var(--admin-accent-dark);

    font-size: 10px;
    font-weight: 800;

    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .admin-spin {
    animation:
      adminSpin
      .8s
      linear
      infinite;
  }

  .admin-collapse {
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
      var(--admin-accent-dark);

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

  .admin-page.is-collapsed
  .admin-collapse {
    top: 18px;
    right: -12px;

    width: 25px;
    height: 25px;

    opacity: 1;
  }

  .admin-collapse:hover {
    color:
      var(--admin-accent);

    opacity: 1;

    transform:
      translateX(
        2px
      );
  }

  .admin-page.is-collapsed
  .admin-collapse:hover {
    transform:
      translateX(
        3px
      );
  }

  .admin-collapse:active {
    transform:
      scale(
        .9
      );
  }

  .admin-collapse:focus-visible {
    outline:
      2px solid
      var(--app-input-ring);

    outline-offset:
      3px;
  }

  .admin-menu-title {
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

  .admin-page.is-collapsed
  .admin-menu-title {
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

  .admin-menu-title--secondary {
    margin-top: 0;
  }

  .admin-menu-title {
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

  .admin-page.is-collapsed
  .admin-menu-title {
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

  .admin-nav {
    display: flex;
    flex-direction: column;

    gap: 5px;
  }

  .admin-page.is-collapsed
  .admin-nav {
    padding-top: 5px;
  }

  .admin-nav-label {
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

  .admin-page.is-collapsed
  .admin-nav-label {
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

  .admin-nav-item {
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

  .admin-page.is-collapsed
  .admin-nav-item {
    justify-content: center;

    padding-inline: 0;
  }

  .admin-nav-item:hover {
    color:
      var(--admin-accent-dark);

    background:
      var(--app-accent-softer);

    transform:
      translateX(2px);
  }

  .admin-page.is-collapsed
  .admin-nav-item:hover {
    transform:
      translateY(-1px);
  }

  .admin-nav-item.active {
    color:
      var(--admin-accent-dark);

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

  .admin-nav-icon {
    flex-shrink: 0;
  }

  .admin-nav-label {
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

  .admin-page.is-collapsed
  .admin-nav-label {
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

  .admin-secondary {
    margin-top: auto;

    padding-top: 14px;

    border-top:
      1px solid
      var(--app-border-soft);
  }

  .admin-nav--secondary {
    margin-bottom: 8px;
  }

  .admin-logout {
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
      var(--admin-accent-dark);

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

  .admin-logout svg {
    flex-shrink: 0;
  }

  .admin-logout
  .admin-nav-label {
    position: absolute;

    left: 50px;

    width: 155px;

    color: inherit;

    overflow: hidden;

    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .admin-page.is-collapsed
  .admin-logout {
    justify-content: center;

    padding-inline: 0;
  }

  .admin-logout:hover {
    color:
      var(--admin-accent-dark);

    background:
      var(--app-accent-softer);

    transform:
      translateX(
        2px
      );
  }

  .admin-page.is-collapsed
  .admin-logout:hover {
    transform:
      translateY(
        -1px
      );
  }

  .admin-content {
    min-height:
      calc(100vh - 40px);

    min-height:
      calc(100dvh - 40px);

    margin-left:
      calc(
        var(
          --admin-sidebar-width
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

  .admin-page.is-collapsed
  .admin-content {
    margin-left:
      calc(
        var(
          --admin-sidebar-collapsed
        )
        + 48px
      );
  }

  html[data-theme='oscuro']
  .admin-page {
    background:
      linear-gradient(
        180deg,
        var(--app-bg-soft),
        var(--app-bg)
      );
  }

  html[data-theme='oscuro']
  .admin-sidebar {
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
  .admin-nav-item.active {
    background:
      linear-gradient(
        135deg,
        var(--app-accent-soft),
        var(--app-surface-alt)
      );
  }

  @keyframes adminSpin {
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
    .admin-page {
      padding-top: 0;
    }

    .admin-sidebar {
      position: relative;

      top: 0;
      left: 0;

      width: 100%;
      height: auto;

      padding: 12px 14px;

      border-radius: 0 0 22px 22px;
    }

    .admin-page.is-collapsed
    .admin-sidebar {
      width: 100%;
    }

    .admin-profile {
      min-height: 55px;

      padding:
        0
        38px
        9px
        0;
    }

    .admin-avatar-button {
      left: 0;
    }

    .admin-profile-info,
    .admin-page.is-collapsed
    .admin-profile-info {
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

    .admin-collapse {
      top: 5px;
      right: 0;

      width: 30px;
      height: 30px;

      border:
        1px solid
        var(--app-border);

      border-radius: 10px;
    }

    .admin-page.is-collapsed
    .admin-profile {
      grid-template-columns:
        46px
        minmax(0, 1fr)
        28px;
    }

    .admin-page.is-collapsed
    .admin-profile-info {
      display: block;
      max-width: 170px;
      opacity: 1;
      visibility: visible;
      transform: none;
    }


    .admin-page.is-collapsed
    .admin-collapse {
      position: static;

      background: transparent;
      box-shadow: none;
    }

    .admin-collapse,
    .admin-page.is-collapsed
    .admin-collapse {
      top: 8px;
      right: 2px;

      width: 26px;
      height: 26px;

      opacity: 1;
    }

    .admin-menu-title {
      display: none;
    }

    .admin-nav {
      flex-direction: row;

      overflow-x: auto;

      padding-top: 12px;
      padding-bottom: 4px;

      scrollbar-width: thin;
    }

    .admin-nav-item,
    .admin-page.is-collapsed
    .admin-nav-item {
      min-width: max-content;

      justify-content: center;

      padding-inline: 14px;
    }

    .admin-nav-label,
    .admin-page.is-collapsed
    .admin-nav-label {
      max-width: 170px;
      opacity: 1;
      visibility: visible;
      transform: none;
    }

    .admin-secondary {
      margin-top: 10px;
      padding-top: 10px;
    }

    .admin-nav--secondary {
      margin-bottom: 6px;
    }

    .admin-logout,
    .admin-page.is-collapsed
    .admin-logout {
      justify-content: center;

      padding-inline: 14px;
    }

    .admin-logout
    .admin-nav-label,
    .admin-page.is-collapsed
    .admin-logout
    .admin-nav-label {
      position: static;

      width: auto;
      max-width: 170px;

      opacity: 1;
      visibility: visible;

      transform: none;
    }

    .admin-content,
    .admin-page.is-collapsed
    .admin-content {
      min-height: auto;

      margin-left: 0;

      padding: 20px;
    }
  }

  @media (
    max-width: 520px
  ) {
    .admin-profile-info {
      padding-right: 34px;
    }

    .admin-collapse,
    .admin-page.is-collapsed
    .admin-collapse {
      top: 8px;
      right: 2px;
    }

    .admin-name {
      font-size: 13px;
    }

    .admin-content,
    .admin-page.is-collapsed
    .admin-content {
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
    .admin-nav-label,
    .admin-page.is-collapsed
    .admin-nav-label {
      position: static;

      width: auto;

      opacity: 1;
      visibility: visible;

      transform: none;
    }

    .admin-page.is-collapsed
    .admin-nav {
      padding-top: 12px;
    }
  }
`;
