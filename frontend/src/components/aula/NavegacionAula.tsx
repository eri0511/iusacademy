import {
  ClipboardCheck,
  FileQuestion,
  Home,
  LayoutDashboard,
  MessageSquareText,
  Newspaper,
  PackageOpen,
  UserRoundCog,
  Users,
} from 'lucide-react';

import type {
  PermisosAula,
} from '../../types/aula/aulaCurso.types';

export type SeccionAula =
  | 'inicio'
  | 'tablon'
  | 'foro'
  | 'tareas'
  | 'quizzes'
  | 'calificaciones'
  | 'estudiantes'
  | 'grupos'
  | 'recursos';

type NavegacionAulaProps = {
  seccionActiva:
    SeccionAula;

  permisos:
    PermisosAula;

  onCambiarSeccion: (
    seccion:
      SeccionAula,
  ) => void;
};

type OpcionNavegacion = {
  id:
    SeccionAula;

  label:
    string;

  icono:
    typeof Home;

  visible:
    boolean;
};

export default function NavegacionAula({
  seccionActiva,
  permisos,
  onCambiarSeccion,
}: NavegacionAulaProps) {
  const opciones:
    OpcionNavegacion[] = [
      {
        id:
          'inicio',
        label:
          'Inicio',
        icono:
          Home,
        visible:
          true,
      },
      {
        id:
          'tablon',
        label:
          'Tablón',
        icono:
          Newspaper,
        visible:
          true,
      },
      {
        id:
          'foro',
        label:
          'Foro',
        icono:
          MessageSquareText,
        visible:
          true,
      },
      {
        id:
          'tareas',
        label:
          'Tareas',
        icono:
          ClipboardCheck,
        visible:
          true,
      },
      {
        id:
          'quizzes',
        label:
          'Quizzes',
        icono:
          FileQuestion,
        visible:
          true,
      },
      {
        id:
          'calificaciones',
        label:
          'Calificaciones',
        icono:
          LayoutDashboard,
        visible:
          true,
      },
      {
        id:
          'estudiantes',
        label:
          'Estudiantes',
        icono:
          Users,
        visible:
          permisos.puedeVerEstudiantes,
      },
      {
        id:
          'grupos',
        label:
          'Grupos',
        icono:
          UserRoundCog,
        visible:
          permisos.puedeVerEstudiantes,
      },
      {
        id:
          'recursos',
        label:
          'Recursos',
        icono:
          PackageOpen,
        visible:
          true,
      },
    ];

  return (
    <nav
      className="navegacion-aula"
      aria-label="Secciones del aula"
    >
      {opciones
        .filter(
          (
            opcion,
          ) =>
            opcion.visible,
        )
        .map(
          (
            opcion,
          ) => {
            const Icono =
              opcion.icono;

            const activa =
              seccionActiva ===
              opcion.id;

            return (
              <button
                key={
                  opcion.id
                }
                type="button"
                className={
                  activa
                    ? 'activo'
                    : ''
                }
                aria-current={
                  activa
                    ? 'page'
                    : undefined
                }
                title={
                  opcion.label
                }
                onClick={() =>
                  onCambiarSeccion(
                    opcion.id,
                  )
                }
              >
                <Icono
                  size={
                    18
                  }
                  strokeWidth={
                    2.15
                  }
                />

                <span>
                  {opcion.label}
                </span>
              </button>
            );
          },
        )}

      <style>
        {styles}
      </style>
    </nav>
  );
}

const styles = `
  .navegacion-aula {
    display: grid;
    grid-template-columns:
      repeat(
        10,
        minmax(
          0,
          1fr
        )
      );
    gap: 6px;
    width: 100%;
    min-width: 0;
    padding: 7px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .navegacion-aula button {
    min-width: 0;
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 10px 7px;
    overflow: hidden;
    border: none;
    border-radius: 13px;
    color: var(--app-text-secondary);
    background: transparent;
    font-family: inherit;
    font-size: clamp(10px, .73vw, 13px);
    font-weight: 750;
    line-height: 1;
    cursor: pointer;
    transition:
      color .15s ease,
      background .15s ease,
      transform .15s ease,
      box-shadow .15s ease;
  }

  .navegacion-aula button span {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .navegacion-aula button svg {
    flex-shrink: 0;
  }

  .navegacion-aula button:hover:not(.activo) {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    transform: translateY(-1px);
  }

  .navegacion-aula button.activo {
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
    box-shadow:
      0 9px 22px
      color-mix(
        in srgb,
        var(--app-accent) 25%,
        transparent
      );
  }

  .navegacion-aula button:focus-visible {
    outline: 3px solid var(--app-input-ring);
    outline-offset: 2px;
  }

  @media (
    max-width:
      1180px
  ) {
    .navegacion-aula {
      grid-template-columns:
        repeat(
          5,
          minmax(
            0,
            1fr
          )
        );
    }

    .navegacion-aula button {
      font-size: 12px;
    }
  }

  @media (
    max-width:
      700px
  ) {
    .navegacion-aula {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .navegacion-aula button {
      justify-content: flex-start;
      padding: 11px 13px;
    }
  }
`;
