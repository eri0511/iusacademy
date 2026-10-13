import {
  BookOpen,
  Clock3,
  Download,
  FolderOpen,
  Heart,
  Home,
  LibraryBig,
  Settings2,
} from 'lucide-react';

import {
  Link,
  Outlet,
  useLocation,
} from 'react-router-dom';

import {
  BibliotecaProvider,
  useBiblioteca,
} from '../contexts/BibliotecaContext';

export default function BibliotecaLayout() {
  return (
    <BibliotecaProvider>
      <BibliotecaShell />
    </BibliotecaProvider>
  );
}

function BibliotecaShell() {
  const {
    base,
    capacidades,
  } = useBiblioteca();

  const location = useLocation();
  const path = location.pathname;

  const items = [
    {
      to: base,
      label: 'Inicio',
      icon: Home,
      exact: true,
    },
    {
      to: `${base}/categorias`,
      label: 'Categorías',
      icon: FolderOpen,
    },
    {
      to: `${base}/guardados`,
      label: 'Favoritos',
      icon: Heart,
    },
    {
      to: `${base}/descargas`,
      label: 'Mis descargas',
      icon: Download,
    },
    {
      to: `${base}/actividad`,
      label: 'Historial',
      icon: Clock3,
    },
    ...(capacidades.puedeDelegar
      ? [
          {
            to: `${base}/gestion`,
            label: 'Administración',
            icon: Settings2,
          },
        ]
      : []),
  ];

  const estaActivo = (
    to: string,
    exact?: boolean,
  ) => {
    if (exact) {
      return path === to;
    }

    return (
      path === to ||
      path.startsWith(`${to}/`)
    );
  };

  return (
    <section className="biblioteca-compartida-shell">
      <header className="biblioteca-encabezado">
        <div className="biblioteca-encabezado__contenido">
          <div className="biblioteca-encabezado__superior">
            BIBLIOTECA JURÍDICA
          </div>

          <div className="biblioteca-encabezado__principal">
            <div className="biblioteca-encabezado__icono">
              <LibraryBig
                size={29}
                strokeWidth={1.8}
              />
            </div>

            <div className="biblioteca-encabezado__informacion">
              <h1>
                Biblioteca virtual
              </h1>

              <p>
                Accede a materiales de estudio,
                doctrina, legislación y más.
              </p>

              <div className="biblioteca-encabezado__chips">
                <span>
                  <BookOpen
                    size={14}
                    strokeWidth={1.9}
                  />
                  Recursos jurídicos
                </span>

                <span>
                  <FolderOpen
                    size={14}
                    strokeWidth={1.9}
                  />
                  Categorías organizadas
                </span>

                <span>
                  <Download
                    size={14}
                    strokeWidth={1.9}
                  />
                  Material descargable
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav
        className="biblioteca-navegacion"
        aria-label="Navegación de Biblioteca"
      >
        {items.map(
          ({
            to,
            label,
            icon: Icon,
            exact,
          }) => {
            const activo = estaActivo(
              to,
              exact,
            );

            return (
              <Link
                key={to}
                to={to}
                className={
                  activo
                    ? 'biblioteca-navegacion__item activo'
                    : 'biblioteca-navegacion__item'
                }
              >
                <Icon
                  size={18}
                  strokeWidth={1.9}
                />

                <span>
                  {label}
                </span>
              </Link>
            );
          },
        )}
      </nav>

      <main className="biblioteca-compartida-content biblioteca-view-transition">
        <Outlet />
      </main>

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .biblioteca-compartida-shell {
    width: 100%;
    min-width: 0;

    display: grid;
    gap: 18px;

    padding:
      0
      34px
      50px;

    color:
      var(--app-text);
  }

  .biblioteca-encabezado {
    position: relative;

    width: 100%;
    min-width: 0;

    overflow: hidden;

    border:
      1px solid
      var(--app-border);

    border-radius: 26px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow),
      inset 0 1px 0
      color-mix(
        in srgb,
        var(--app-surface-raised)
        72%,
        transparent
      );
  }

  .biblioteca-encabezado::before {
    content: "";

    position: absolute;

    inset:
      0
      auto
      0
      0;

    width: 5px;

    background:
      var(--app-accent);
  }

  .biblioteca-encabezado__contenido {
    position: relative;
    z-index: 1;

    width: 100%;

    padding:
      23px
      30px;
  }

  .biblioteca-encabezado__superior {
    margin:
      0
      0
      5px
      75px;

    color:
      var(--app-accent-dark);

    font-size: 11px;
    font-weight: 850;
    line-height: 1;

    letter-spacing: .15em;
    text-transform: uppercase;
  }

  .biblioteca-encabezado__principal {
    display: flex;
    align-items: center;

    gap: 17px;
  }

  .biblioteca-encabezado__icono {
    width: 58px;
    height: 58px;

    flex:
      0
      0
      58px;

    display: grid;
    place-items: center;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 18px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    box-shadow:
      var(--app-shadow-sm);
  }

  .biblioteca-encabezado__informacion {
    min-width: 0;
  }

  .biblioteca-encabezado__informacion h1 {
    margin: 0;

    color:
      var(--app-text);

    font-size: 31px;
    font-weight: 900;
    line-height: 1.1;

    letter-spacing: -.025em;
  }

  .biblioteca-encabezado__informacion p {
    margin:
      6px
      0
      0;

    color:
      var(--app-text-soft);

    font-size: 14px;
    line-height: 1.45;
  }

  .biblioteca-encabezado__chips {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    gap: 7px;

    margin-top: 12px;
  }

  .biblioteca-encabezado__chips span {
    padding: 5px 9px;

    display: inline-flex;
    align-items: center;
    gap: 6px;

    border: 1px solid var(--app-warning-border);
    border-radius: 999px;

    color: var(--app-warning-strong);
    background: var(--app-warning-bg);

    font-size: 10px;
    font-weight: 750;
  }

  .biblioteca-encabezado__chips span svg {
    flex-shrink: 0;

    color: currentColor;
  }

  .biblioteca-navegacion {
    width: 100%;
    min-width: 0;

    display: grid;

    grid-template-columns:
      repeat(
        6,
        minmax(
          0,
          1fr
        )
      );

    gap: 5px;

    padding: 6px;

    background:
      var(--app-surface);

    border:
      1px solid
      var(--app-border);

    border-radius: 19px;

    box-shadow:
      var(--app-shadow-sm);
  }

  .biblioteca-navegacion__item {
    min-width: 0;
    min-height: 48px;

    padding:
      9px
      12px;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 8px;

    border:
      1px solid
      transparent;

    border-radius: 13px;

    color:
      var(--app-text-secondary);

    background:
      transparent;

    text-decoration:
      none;

    font-size: 12px;
    font-weight: 750;
    line-height: 1;

    transition:
      color 150ms ease,
      background 150ms ease,
      border-color 150ms ease,
      box-shadow 150ms ease,
      transform 150ms ease;
  }

  .biblioteca-navegacion__item svg {
    flex-shrink: 0;

    transition:
      transform 150ms ease;
  }

  .biblioteca-navegacion__item:hover {
    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);

    border-color:
      var(--app-border-strong);
  }

  .biblioteca-navegacion__item:hover svg {
    transform:
      translateY(-1px);
  }

  .biblioteca-navegacion__item.activo {
    color: #fff;

    background: var(--app-accent);

    border-color: var(--app-accent);

    box-shadow: var(--app-shadow-sm);
  }

  .biblioteca-navegacion__item.activo svg {
    color: #fff;
  }

  .biblioteca-navegacion__item:focus-visible {
    outline:
      3px solid
      color-mix(
        in srgb,
        var(--app-accent)
        24%,
        transparent
      );

    outline-offset: 2px;
  }

  .biblioteca-compartida-content {
    width: 100%;
    min-width: 0;

    position: relative;
  }

  .biblioteca-view-transition {
    animation:
      bibliotecaEntrada
      160ms
      ease-out;
  }

  @keyframes bibliotecaEntrada {
    from {
      opacity: .76;

      transform:
        translateY(
          3px
        );
    }

    to {
      opacity: 1;

      transform:
        translateY(
          0
        );
    }
  }

  @media (
    max-width:
      1100px
  ) {
    .biblioteca-navegacion {
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
    .biblioteca-compartida-shell {
      padding:
        0
        18px
        36px;
    }

    .biblioteca-encabezado {
      border-radius: 21px;
    }

    .biblioteca-encabezado__contenido {
      padding:
        22px;
    }

    .biblioteca-encabezado__superior {
      margin-left: 0;
    }

    .biblioteca-encabezado__principal {
      align-items:
        flex-start;

      gap: 14px;
    }

    .biblioteca-encabezado__icono {
      width: 54px;
      height: 54px;

      flex-basis:
        54px;

      border-radius:
        16px;
    }

    .biblioteca-encabezado__informacion h1 {
      font-size: 25px;
    }

    .biblioteca-encabezado__chips {
      margin-left:
        -68px;

      margin-top:
        17px;
    }
  }

  @media (
    max-width:
      560px
  ) {
    .biblioteca-compartida-shell {
      padding:
        0
        12px
        30px;
    }

    .biblioteca-navegacion {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .biblioteca-navegacion__item {
      justify-content:
        flex-start;
    }

    .biblioteca-encabezado__contenido {
      padding:
        19px;
    }

    .biblioteca-encabezado__principal {
      gap: 12px;
    }

    .biblioteca-encabezado__informacion h1 {
      font-size: 23px;
    }

    .biblioteca-encabezado__chips {
      margin-left:
        -66px;
    }
  }

  @media (
    max-width:
      390px
  ) {
    .biblioteca-navegacion {
      grid-template-columns:
        1fr;
    }
  }

  @media (
    prefers-reduced-motion:
      reduce
  ) {
    .biblioteca-view-transition {
      animation:
        none;
    }

    .biblioteca-navegacion__item,
    .biblioteca-navegacion__item svg {
      transition:
        none;
    }
  }
`;