import {
  Check,
  ChevronRight,
  Laptop,
  LogOut,
  Moon,
  PanelLeft,
  Palette,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  WandSparkles,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../../auth/AuthContext';

import {
  useConfiguracion,
} from '../../config/ConfiguracionContext';

import type {
  TemaAplicacion,
} from '../../config/configuracion.types';

type OpcionTema = {
  valor:
    TemaAplicacion;

  titulo:
    string;

  descripcion:
    string;

  icono:
    typeof Sun;
};

const opcionesTema:
  OpcionTema[] = [
    {
      valor:
        'CLARO',

      titulo:
        'Claro',

      descripcion:
        'Mantiene el diseño cálido y luminoso.',

      icono:
        Sun,
    },
    {
      valor:
        'OSCURO',

      titulo:
        'Oscuro',

      descripcion:
        'Reduce el brillo en ambientes con poca luz.',

      icono:
        Moon,
    },
    {
      valor:
        'SISTEMA',

      titulo:
        'Sistema',

      descripcion:
        'Sigue automáticamente el tema del dispositivo.',

      icono:
        Laptop,
    },
  ];

function Configuracion() {
  const navigate =
    useNavigate();

  const {
    sesion,
    cerrarSesion,
  } = useAuth();

  const {
    preferencias,
    temaAplicado,
    actualizarPreferencia,
    restaurarPreferencias,
  } = useConfiguracion();

  const obtenerRutaPerfil = () => {
    const rol =
      sesion?.usuario?.rol;

    if (
      rol ===
      'DOCENTE'
    ) {
      return '/docente/perfil';
    }

    if (
      rol ===
      'ESTUDIANTE'
    ) {
      return '/estudiante/perfil';
    }

    return '/admin/perfil';
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

  return (
    <main className="config-page">
      <section className="config-hero">
        <div className="config-hero__content">
          <div className="config-hero__icon">
            <WandSparkles
              size={28}
            />
          </div>

          <div>
            <span className="config-eyebrow">
              Preferencias personales
            </span>

            <h1>
              Configuración
            </h1>

            <p>
              Personaliza la apariencia y el comportamiento de IusAcademy.
            </p>
          </div>
        </div>

        <span className="saved-badge">
          <Sparkles size={15} />

          Guardado automático
        </span>
      </section>

      <section className="config-grid">
        <article className="config-card theme-card">
          <div className="section-heading">
            <div className="section-icon orange">
              <Palette size={21} />
            </div>

            <div>
              <h2>
                Apariencia
              </h2>

              <p>
                Selecciona el tema de las vistas autenticadas.
              </p>
            </div>
          </div>

          <div className="theme-options">
            {opcionesTema.map(
              (
                opcion,
              ) => {
                const Icono =
                  opcion.icono;

                const seleccionada =
                  preferencias.tema ===
                  opcion.valor;

                return (
                  <button
                    key={
                      opcion.valor
                    }
                    type="button"
                    className={`theme-option ${
                      seleccionada
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      actualizarPreferencia(
                        'tema',
                        opcion.valor,
                      )
                    }
                    aria-pressed={
                      seleccionada
                    }
                  >
                    <span className="theme-option__icon">
                      <Icono size={21} />
                    </span>

                    <span className="theme-option__copy">
                      <strong>
                        {opcion.titulo}
                      </strong>

                      <small>
                        {opcion.descripcion}
                      </small>
                    </span>

                    <span className="theme-option__check">
                      {seleccionada && (
                        <Check size={14} />
                      )}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          <div className="theme-current">
            Tema aplicado:

            <strong>
              {temaAplicado ===
              'OSCURO'
                ? 'Oscuro'
                : 'Claro'}
            </strong>
          </div>
        </article>

        <article className="config-card">
          <div className="section-heading">
            <div className="section-icon blue">
              <PanelLeft size={21} />
            </div>

            <div>
              <h2>
                Navegación
              </h2>

              <p>
                Personaliza el comportamiento del menú lateral.
              </p>
            </div>
          </div>

          <OpcionInterruptor
            titulo="Recordar menú contraído"
            descripcion="Conserva el estado del sidebar al recargar o volver a ingresar."
            activo={
              preferencias
                .sidebarContraido
            }
            onCambiar={
              (
                activo,
              ) =>
                actualizarPreferencia(
                  'sidebarContraido',
                  activo,
                )
            }
          />
        </article>

        <article className="config-card">
          <div className="section-heading">
            <div className="section-icon purple">
              <WandSparkles size={21} />
            </div>

            <div>
              <h2>
                Accesibilidad
              </h2>

              <p>
                Reduce movimientos y transiciones de la plataforma.
              </p>
            </div>
          </div>

          <OpcionInterruptor
            titulo="Reducir animaciones"
            descripcion="Minimiza animaciones y transiciones para una experiencia más tranquila."
            activo={
              preferencias
                .reducirAnimaciones
            }
            onCambiar={
              (
                activo,
              ) =>
                actualizarPreferencia(
                  'reducirAnimaciones',
                  activo,
                )
            }
          />
        </article>

        <article className="config-card session-card">
          <div className="section-heading">
            <div className="section-icon green">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h2>
                Cuenta y seguridad
              </h2>

              <p>
                Accede a tu perfil o finaliza la sesión actual.
              </p>
            </div>
          </div>

          <div className="action-list">
            <button
              type="button"
              className="action-row"
              onClick={() =>
                navigate(
                  obtenerRutaPerfil(),
                )
              }
            >
              <span className="action-row__icon">
                <UserRound size={19} />
              </span>

              <span className="action-row__copy">
                <strong>
                  Mi perfil
                </strong>

                <small>
                  Fotografía, datos personales y contraseña.
                </small>
              </span>

              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              className="action-row logout"
              onClick={
                manejarCerrarSesion
              }
            >
              <span className="action-row__icon">
                <LogOut size={19} />
              </span>

              <span className="action-row__copy">
                <strong>
                  Cerrar sesión
                </strong>

                <small>
                  Finaliza de manera segura la sesión actual.
                </small>
              </span>

              <ChevronRight size={18} />
            </button>
          </div>
        </article>

        <article className="config-card restore-card">
          <div className="restore-icon">
            <RefreshCcw size={22} />
          </div>

          <div>
            <h2>
              Restaurar preferencias
            </h2>

            <p>
              Devuelve el tema, la navegación y la accesibilidad a sus valores iniciales.
            </p>
          </div>

          <button
            type="button"
            onClick={
              restaurarPreferencias
            }
          >
            Restaurar
          </button>
        </article>
      </section>

      <style>
        {styles}
      </style>
    </main>
  );
}

function OpcionInterruptor({
  titulo,
  descripcion,
  activo,
  onCambiar,
}: {
  titulo:
    string;

  descripcion:
    string;

  activo:
    boolean;

  onCambiar:
    (
      activo:
        boolean,
    ) => void;
}) {
  return (
    <button
      type="button"
      className="switch-row"
      onClick={() =>
        onCambiar(
          !activo,
        )
      }
      aria-pressed={
        activo
      }
    >
      <span className="switch-copy">
        <strong>
          {titulo}
        </strong>

        <small>
          {descripcion}
        </small>
      </span>

      <span
        className={`switch ${
          activo
            ? 'active'
            : ''
        }`}
      >
        <span />
      </span>
    </button>
  );
}

const styles = `
  .config-page {
    width: 100%;
    min-width: 0;

    padding:
      0
      34px
      34px;

    color:
      var(--app-text);
  }

  .config-hero,
  .config-card {
    border:
      1px solid
      var(--app-border);

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow);
  }

  .config-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 22px;

    padding:
      28px
      30px;

    border-radius:
      var(--app-radius-xl);
  }

  .config-hero__content {
    display: flex;
    align-items: center;

    gap: 18px;
  }

  .config-hero__icon {
    width: 62px;
    height: 62px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 20px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .config-eyebrow {
    display: block;

    color:
      var(--app-accent-dark);

    font-size: 10px;
    font-weight: 850;

    letter-spacing: .15em;
    text-transform: uppercase;
  }

  .config-hero h1 {
    margin:
      6px
      0
      0;

    color:
      var(--app-text);

    font-size:
      clamp(
        29px,
        3vw,
        39px
      );

    font-weight: 900;
  }

  .config-hero p {
    margin:
      7px
      0
      0;

    color:
      var(--app-text-soft);

    font-size: 13px;
  }

  .saved-badge {
    display: inline-flex;
    align-items: center;

    gap: 7px;

    padding:
      9px
      13px;

    border:
      1px solid
      var(--app-success-border);

    border-radius: 999px;

    color:
      var(--app-success);

    background:
      var(--app-success-bg);

    font-size: 10px;
    font-weight: 850;
  }

  .config-grid {
    display: grid;

    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );

    gap: 18px;

    margin-top: 22px;
  }

  .config-card {
    min-width: 0;

    padding: 23px;

    border-radius:
      var(--app-radius-lg);
  }

  .theme-card,
  .session-card,
  .restore-card {
    grid-column:
      1 / -1;
  }

  .section-heading {
    display: flex;
    align-items: center;

    gap: 13px;
  }

  .section-icon {
    width: 44px;
    height: 44px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    border-radius: 14px;
  }

  .section-icon.orange {
    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .section-icon.blue {
    color:
      var(--app-info);

    background:
      var(--app-info-bg);
  }

  .section-icon.purple {
    color:
      var(--app-purple);

    background:
      var(--app-purple-bg);
  }

  .section-icon.green {
    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .section-heading h2,
  .restore-card h2 {
    margin: 0;

    color:
      var(--app-text);
  }

  .section-heading h2 {
    font-size: 18px;
  }

  .section-heading p,
  .restore-card p {
    color:
      var(--app-text-soft);
  }

  .section-heading p {
    margin:
      4px
      0
      0;

    font-size: 10px;
  }

  .theme-options {
    display: grid;

    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );

    gap: 12px;

    margin-top: 20px;
  }

  .theme-option {
    min-width: 0;

    display: grid;

    grid-template-columns:
      44px
      minmax(
        0,
        1fr
      )
      24px;

    align-items: center;

    gap: 11px;

    padding: 15px;

    border:
      1px solid
      var(--app-border-soft);

    border-radius: 18px;

    color:
      var(--app-text);

    background:
      var(--app-surface-alt);

    text-align: left;

    cursor: pointer;

    transition:
      transform .18s ease,
      border-color .18s ease,
      background .18s ease,
      box-shadow .18s ease;
  }

  .theme-option:hover {
    transform:
      translateY(
        -2px
      );

    border-color:
      var(--app-border-strong);

    box-shadow:
      var(--app-shadow-sm);
  }

  .theme-option.active {
    border-color:
      var(--app-accent);

    background:
      var(--app-accent-softer);
  }

  .theme-option__icon {
    width: 44px;
    height: 44px;

    display: grid;
    place-items: center;

    border-radius: 14px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .theme-option__copy {
    min-width: 0;
  }

  .theme-option__copy strong,
  .theme-option__copy small {
    display: block;
  }

  .theme-option__copy strong {
    color:
      var(--app-text);

    font-size: 12px;
  }

  .theme-option__copy small {
    margin-top: 4px;

    color:
      var(--app-text-soft);

    font-size: 9px;
    line-height: 1.45;
  }

  .theme-option__check {
    width: 23px;
    height: 23px;

    display: grid;
    place-items: center;

    border-radius: 50%;

    color: #fff;

    background:
      var(--app-accent);
  }

  .theme-current {
    margin-top: 13px;

    color:
      var(--app-text-soft);

    font-size: 10px;
  }

  .theme-current strong {
    margin-left: 5px;

    color:
      var(--app-text);
  }

  .switch-row {
    width: 100%;

    display: grid;

    grid-template-columns:
      1fr
      auto;

    align-items: center;

    gap: 16px;

    margin-top: 20px;

    padding: 17px;

    border:
      1px solid
      var(--app-border-soft);

    border-radius: 18px;

    color:
      var(--app-text);

    background:
      var(--app-surface-alt);

    text-align: left;

    cursor: pointer;

    transition:
      border-color .18s ease,
      transform .18s ease,
      box-shadow .18s ease;
  }

  .switch-row:hover {
    transform:
      translateY(
        -2px
      );

    border-color:
      var(--app-border-strong);

    box-shadow:
      var(--app-shadow-sm);
  }

  .switch-copy strong,
  .switch-copy small {
    display: block;
  }

  .switch-copy strong {
    color:
      var(--app-text);

    font-size: 12px;
  }

  .switch-copy small {
    margin-top: 5px;

    color:
      var(--app-text-soft);

    font-size: 9px;
    line-height: 1.5;
  }

  .switch {
    width: 44px;
    height: 25px;

    display: flex;
    align-items: center;

    flex-shrink: 0;

    padding: 3px;

    border-radius: 999px;

    background:
      var(--app-text-muted);

    transition:
      background .18s ease;
  }

  .switch > span {
    width: 19px;
    height: 19px;

    border-radius: 50%;

    background: #fff;

    box-shadow:
      0 2px 7px
      rgba(15,23,42,.2);

    transition:
      transform .18s ease;
  }

  .switch.active {
    background:
      var(--app-accent);
  }

  .switch.active > span {
    transform:
      translateX(
        19px
      );
  }

  .action-list {
    display: grid;

    gap: 10px;

    margin-top: 20px;
  }

  .action-row {
    width: 100%;

    display: grid;

    grid-template-columns:
      43px
      minmax(
        0,
        1fr
      )
      20px;

    align-items: center;

    gap: 12px;

    padding: 13px;

    border:
      1px solid
      var(--app-border-soft);

    border-radius: 17px;

    color:
      var(--app-text);

    background:
      var(--app-surface-alt);

    text-align: left;

    cursor: pointer;

    transition:
      transform .18s ease,
      border-color .18s ease,
      background .18s ease;
  }

  .action-row:hover {
    transform:
      translateX(
        3px
      );

    border-color:
      var(--app-border-strong);

    background:
      var(--app-accent-softer);
  }

  .action-row__icon {
    width: 43px;
    height: 43px;

    display: grid;
    place-items: center;

    border-radius: 13px;

    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .action-row.logout
  .action-row__icon {
    color:
      var(--app-danger);

    background:
      var(--app-danger-bg);
  }

  .action-row__copy strong,
  .action-row__copy small {
    display: block;
  }

  .action-row__copy strong {
    color:
      var(--app-text);

    font-size: 11px;
  }

  .action-row__copy small {
    margin-top: 4px;

    color:
      var(--app-text-soft);

    font-size: 9px;
  }

  .action-row > svg {
    color:
      var(--app-text-muted);
  }

  .restore-card {
    display: grid;

    grid-template-columns:
      48px
      minmax(
        0,
        1fr
      )
      auto;

    align-items: center;

    gap: 14px;
  }

  .restore-icon {
    width: 48px;
    height: 48px;

    display: grid;
    place-items: center;

    border-radius: 15px;

    color:
      var(--app-warning);

    background:
      var(--app-warning-bg);
  }

  .restore-card h2 {
    font-size: 16px;
  }

  .restore-card p {
    margin:
      4px
      0
      0;

    font-size: 9px;
  }

  .restore-card button {
    min-height: 40px;

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
      transparent;

    font-weight: 850;

    cursor: pointer;
  }

  @media (
    max-width:
      850px
  ) {
    .config-page {
      padding: 18px;
    }

    .config-hero {
      align-items: flex-start;
      flex-direction: column;

      padding: 24px;
    }

    .config-grid {
      grid-template-columns:
        1fr;
    }

    .theme-card,
    .session-card,
    .restore-card {
      grid-column: auto;
    }

    .theme-options {
      grid-template-columns:
        1fr;
    }
  }

  @media (
    max-width:
      560px
  ) {
    .config-hero__content {
      align-items: flex-start;
    }

    .config-hero__icon {
      width: 52px;
      height: 52px;

      border-radius: 17px;
    }

    .config-card {
      padding: 18px;
    }

    .restore-card {
      grid-template-columns:
        44px
        1fr;
    }

    .restore-card button {
      grid-column:
        1 / -1;

      width: 100%;
    }
  }
`;

export default Configuracion;