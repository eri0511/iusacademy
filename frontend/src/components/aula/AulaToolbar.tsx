import type {
  ComponentType,
} from 'react';

export type OpcionAulaToolbar<
  TId extends string,
> = {
  id:
    TId;

  texto:
    string;

  icono?:
    ComponentType<{
      size?:
        number;
    }>;

  contador?:
    number;

  deshabilitada?:
    boolean;
};

type AulaToolbarProps<
  TId extends string,
> = {
  opciones:
    OpcionAulaToolbar<TId>[];

  opcionActiva:
    TId;

  ariaLabel?:
    string;

  onCambiar:
    (
      id:
        TId,
    ) => void;
};

export default function AulaToolbar<
  TId extends string,
>({
  opciones,
  opcionActiva,
  ariaLabel =
    'Filtros de la sección',
  onCambiar,
}: AulaToolbarProps<TId>) {
  return (
    <nav
      className="aula-toolbar"
      aria-label={
        ariaLabel
      }
    >
      {opciones.map(
        (
          opcion,
        ) => {
          const Icono =
            opcion.icono;

          const activa =
            opcionActiva ===
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
              aria-pressed={
                activa
              }
              disabled={
                opcion.deshabilitada
              }
              onClick={() =>
                onCambiar(
                  opcion.id,
                )
              }
            >
              {Icono && (
                <Icono
                  size={16}
                />
              )}

              <span>
                {opcion.texto}
              </span>

              {typeof opcion.contador ===
                'number' && (
                <strong>
                  {opcion.contador}
                </strong>
              )}
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
  .aula-toolbar {
    min-width: 0;
    display: grid;
    grid-template-columns:
      repeat(
        auto-fit,
        minmax(
          132px,
          1fr
        )
      );
    align-items: center;
    gap: 8px;
    padding: 10px;
    border:
      1px solid
      var(
        --app-border
      );
    border-radius: 18px;
    background:
      var(
        --app-surface
      );
    box-shadow:
      var(
        --app-shadow-sm
      );
  }

  .aula-toolbar button {
    min-width: 0;
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 9px;
    overflow: hidden;
    border:
      1px solid
      var(
        --app-border-soft
      );
    border-radius: 13px;
    color:
      var(
        --app-text-secondary
      );
    background:
      var(
        --app-surface-alt
      );
    font-family: inherit;
    font-size: 11px;
    font-weight: 750;
    cursor: pointer;
    transition:
      transform .15s ease,
      color .15s ease,
      border-color .15s ease,
      background .15s ease,
      box-shadow .15s ease;
  }

  .aula-toolbar button > span {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .aula-toolbar button svg,
  .aula-toolbar button strong {
    flex-shrink: 0;
  }

  .aula-toolbar button:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
  }

  .aula-toolbar button.activo {
    border-color: var(--app-accent);
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );
    box-shadow:
      0 9px 20px
      color-mix(
        in srgb,
        var(--app-accent) 22%,
        transparent
      );
  }

  .aula-toolbar button strong {
    min-width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    padding: 0 6px;
    border-radius: 999px;
    color: inherit;
    background:
      color-mix(
        in srgb,
        currentColor 11%,
        transparent
      );
    font-size: 9px;
  }

  .aula-toolbar button.activo strong {
    background: rgba(255, 255, 255, .2);
  }

  .aula-toolbar button:disabled {
    opacity: .48;
    cursor: not-allowed;
  }

  @media (max-width: 1280px) {
    .aula-toolbar {
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

  @media (max-width: 760px) {
    .aula-toolbar {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }
  }

  @media (max-width: 520px) {
    .aula-toolbar {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .aula-toolbar *,
    .aula-toolbar *::before,
    .aula-toolbar *::after {
      transition: none !important;
      animation: none !important;
    }
  }
`;
