import { useEffect, useMemo, useState } from 'react';
import {
  Link,
  NavLink,
  useLocation,
} from 'react-router-dom';

import {
  ArrowRight,
  LayoutDashboard,
  Menu,
  Scale,
  X,
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import type { Rol } from '../../auth/auth.types';

function rutaInicioPorRol(
  rol: Rol,
): string {
  switch (rol) {
    case 'ADMINISTRADOR':
      return '/admin';

    case 'DOCENTE':
      return '/docente';

    case 'ESTUDIANTE':
      return '/estudiante';

    default:
      return '/login';
  }
}

const enlaces = [
  {
    to: '/',
    etiqueta: 'Inicio',
    end: true,
  },
  {
    to: '/servicios',
    etiqueta: 'Servicios',
  },
  {
    to: '/contacto',
    etiqueta: 'Contacto',
  },
];

export default function PublicNavbar() {
  const location = useLocation();

  const {
    sesion,
    estaAutenticado,
  } = useAuth();

  const [
    menuAbierto,
    setMenuAbierto,
  ] = useState(false);

  const [
    conSombra,
    setConSombra,
  ] = useState(false);

  const rutaPanel = useMemo(
    () =>
      sesion
        ? rutaInicioPorRol(
            sesion.usuario.rol,
          )
        : '/login',
    [sesion],
  );

  useEffect(() => {
    const controlarScroll = () => {
      setConSombra(
        window.scrollY > 24,
      );
    };

    controlarScroll();

    window.addEventListener(
      'scroll',
      controlarScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        'scroll',
        controlarScroll,
      );
    };
  }, []);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  return (
    <header
      className={`public-nav ${
        conSombra
          ? 'public-nav--scrolled'
          : ''
      }`}
    >
      <div className="public-nav__container">
        <div
          className="public-nav__wave"
          aria-hidden="true"
        />

        <nav
          className="public-nav__shell"
          aria-label="Navegación pública"
        >
          <Link
            to="/"
            className="public-nav__brand"
          >
            <span className="public-nav__brand-icon">
              <Scale size={20} />
            </span>

            <span className="public-nav__brand-text">
              <strong>IUS</strong>
              <span>ACADEMY</span>
            </span>
          </Link>

          <div className="public-nav__links">
            {enlaces.map(
              ({
                to,
                etiqueta,
                end,
              }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({
                    isActive,
                  }) =>
                    `public-nav__link ${
                      isActive
                        ? 'active'
                        : ''
                    }`
                  }
                >
                  {etiqueta}
                </NavLink>
              ),
            )}

            <Link
              to={rutaPanel}
              className="public-nav__action"
            >
              {estaAutenticado ? (
                <LayoutDashboard
                  size={17}
                />
              ) : (
                <ArrowRight size={17} />
              )}

              {estaAutenticado
                ? 'Mi panel'
                : 'Iniciar sesión'}
            </Link>
          </div>

          <button
            type="button"
            className="public-nav__mobile-button"
            onClick={() =>
              setMenuAbierto(
                (actual) =>
                  !actual,
              )
            }
            aria-expanded={menuAbierto}
            aria-label={
              menuAbierto
                ? 'Cerrar menú'
                : 'Abrir menú'
            }
          >
            {menuAbierto ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </nav>

        {menuAbierto && (
          <div className="public-nav__mobile-menu">
            {enlaces.map(
              ({
                to,
                etiqueta,
                end,
              }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({
                    isActive,
                  }) =>
                    `public-nav__mobile-link ${
                      isActive
                        ? 'active'
                        : ''
                    }`
                  }
                >
                  {etiqueta}
                </NavLink>
              ),
            )}

            <Link
              to={rutaPanel}
              className="public-nav__mobile-action"
            >
              {estaAutenticado ? (
                <LayoutDashboard
                  size={17}
                />
              ) : (
                <ArrowRight size={17} />
              )}

              {estaAutenticado
                ? 'Ir a mi panel'
                : 'Iniciar sesión'}
            </Link>
          </div>
        )}
      </div>

      <style>{styles}</style>
    </header>
  );
}

const styles = `
  .public-nav {
    position: fixed;
    inset: 0 0 auto;
    z-index: 1000;
    padding-top: 12px;
    pointer-events: none;
  }

  .public-nav__container {
    width:
      min(
        1240px,
        calc(100% - 28px)
      );
    margin: 0 auto;
    position: relative;
  }

  .public-nav__wave {
    position: absolute;
    left: -8px;
    bottom: -20px;
    width: 170px;
    height: 82px;
    z-index: 0;
    opacity: 0.42;
    filter: blur(2px);
    pointer-events: none;
    transform-origin:
      left bottom;
    background:
      radial-gradient(
        circle at 0 100%,
        #f18b4b 0%,
        #f18b4b 38%,
        transparent 61%
      );
    animation:
      publicNavWave
      9s
      ease-in-out
      infinite;
  }

  .public-nav__shell {
    min-height: 62px;
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding:
      9px
      12px
      9px
      16px;
    border:
      1px solid
      rgba(248, 216, 176, 0.9);
    border-radius: 22px;
    background:
      rgba(255, 246, 237, 0.92);
    box-shadow:
      0 12px 30px
      rgba(15, 23, 42, 0.09);
    backdrop-filter:
      blur(15px);
    -webkit-backdrop-filter:
      blur(15px);
    pointer-events: auto;
    transition:
      background 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;
  }

  .public-nav--scrolled
  .public-nav__shell {
    background:
      rgba(255, 250, 245, 0.98);
    box-shadow:
      0 18px 44px
      rgba(15, 23, 42, 0.14);
    transform: translateY(-2px);
  }

  .public-nav__brand {
    min-width: max-content;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #0f172a;
    text-decoration: none;
  }

  .public-nav__brand-icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: white;
    background:
      linear-gradient(
        135deg,
        #f18b4b,
        #f39a5c
      );
    box-shadow:
      0 10px 24px
      rgba(217, 119, 6, 0.25);
  }

  .public-nav__brand-text {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: #0f172a;
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.13em;
  }

  .public-nav__brand-text strong {
    color: #c46a2c;
  }

  .public-nav__links {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .public-nav__link {
    padding: 9px 13px;
    border-radius: 999px;
    color: #64748b;
    font-size: 0.84rem;
    font-weight: 750;
    text-decoration: none;
    transition:
      color 0.18s ease,
      background 0.18s ease,
      transform 0.18s ease;
  }

  .public-nav__link:hover,
  .public-nav__link.active {
    color: #c46a2c;
    background:
      rgba(241, 139, 75, 0.1);
  }

  .public-nav__link:hover {
    transform: translateY(-1px);
  }

  .public-nav__action,
  .public-nav__mobile-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 999px;
    color: white;
    text-decoration: none;
    font-weight: 800;
    background:
      linear-gradient(
        135deg,
        #f18b4b,
        #f39a5c
      );
    box-shadow:
      0 13px 28px
      rgba(217, 119, 6, 0.28);
  }

  .public-nav__action {
    margin-left: 5px;
    padding: 10px 17px;
    font-size: 0.84rem;
  }

  .public-nav__mobile-button {
    width: 42px;
    height: 42px;
    display: none;
    place-items: center;
    border:
      1px solid
      rgba(248, 216, 176, 0.95);
    border-radius: 13px;
    background:
      rgba(255, 255, 255, 0.75);
    color: #475569;
    cursor: pointer;
  }

  .public-nav__mobile-menu {
    position: relative;
    z-index: 3;
    display: none;
    margin-top: 8px;
    padding: 11px;
    border:
      1px solid
      rgba(248, 216, 176, 0.95);
    border-radius: 20px;
    background:
      rgba(255, 250, 245, 0.98);
    box-shadow:
      0 18px 42px
      rgba(15, 23, 42, 0.16);
    pointer-events: auto;
  }

  .public-nav__mobile-link {
    display: block;
    padding: 11px 13px;
    border-radius: 13px;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 750;
    text-decoration: none;
  }

  .public-nav__mobile-link.active {
    color: #c46a2c;
    background:
      rgba(241, 139, 75, 0.1);
  }

  .public-nav__mobile-action {
    width: 100%;
    margin-top: 7px;
    padding: 12px 16px;
    font-size: 0.9rem;
  }

  @keyframes publicNavWave {
    0%,
    100% {
      transform:
        translateX(0)
        scaleY(1);
      opacity: 0.42;
    }

    50% {
      transform:
        translateX(12px)
        scaleY(1.05);
      opacity: 0.68;
    }
  }

  @media (max-width: 800px) {
    .public-nav__links {
      display: none;
    }

    .public-nav__mobile-button {
      display: grid;
    }

    .public-nav__mobile-menu {
      display: grid;
    }
  }
`;