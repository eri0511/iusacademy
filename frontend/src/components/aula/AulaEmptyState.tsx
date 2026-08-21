import type {
  LucideIcon,
} from 'lucide-react';

import {
  Inbox,
} from 'lucide-react';

type AulaEmptyStateProps = {
  titulo: string;
  descripcion: string;
  icono?: LucideIcon;
  accionTexto?: string;
  onAccion?: () => void;
  compacto?: boolean;
};

export default function AulaEmptyState({
  titulo,
  descripcion,
  icono:
    Icono =
    Inbox,
  accionTexto,
  onAccion,
  compacto =
    false,
}: AulaEmptyStateProps) {
  return (
    <section
      className={`aula-empty-state ${
        compacto
          ? 'compacto'
          : ''
      }`}
    >
      <div className="aula-empty-state__decoracion">
        <span />
        <span />
        <span />
      </div>

      <div className="aula-empty-state__icono">
        <Icono
          size={
            compacto
              ? 22
              : 29
          }
        />
      </div>

      <div className="aula-empty-state__contenido">
        <strong>
          {titulo}
        </strong>

        <p>
          {descripcion}
        </p>

        {accionTexto &&
          onAccion && (
          <button
            type="button"
            onClick={
              onAccion
            }
          >
            {accionTexto}
          </button>
        )}
      </div>

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .aula-empty-state {
    position: relative;
    min-height: 220px;
    display: grid;
    grid-template-columns:
      68px
      minmax(
        0,
        1fr
      );
    gap: 17px;
    align-items: center;
    padding: 24px;
    overflow: hidden;
    border: 1px dashed
      color-mix(
        in srgb,
        var(--app-accent) 42%,
        var(--app-border)
      );
    border-radius: 21px;
    background:
      linear-gradient(
        145deg,
        var(--app-surface-alt),
        color-mix(
          in srgb,
          var(--app-accent-soft) 38%,
          var(--app-surface)
        )
      );
  }

  .aula-empty-state.compacto {
    min-height: 150px;
    grid-template-columns:
      52px
      minmax(
        0,
        1fr
      );
    padding: 18px;
  }

  .aula-empty-state__decoracion {
    position: absolute;
    top: 16px;
    right: 18px;
    display: flex;
    gap: 5px;
  }

  .aula-empty-state__decoracion span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--app-accent);
    opacity: .2;
  }

  .aula-empty-state__icono {
    width: 68px;
    height: 68px;
    display: grid;
    place-items: center;
    border-radius: 20px;
    color: var(--app-accent-dark);
    background:
      linear-gradient(
        145deg,
        var(--app-surface),
        var(--app-accent-soft)
      );
    box-shadow:
      0 14px 28px
      color-mix(
        in srgb,
        var(--app-accent) 12%,
        transparent
      );
  }

  .aula-empty-state.compacto
  .aula-empty-state__icono {
    width: 52px;
    height: 52px;
    border-radius: 16px;
  }

  .aula-empty-state__contenido {
    min-width: 0;
  }

  .aula-empty-state__contenido strong {
    display: block;
    color: var(--app-text);
    font-size: 15px;
    font-weight: 850;
  }

  .aula-empty-state__contenido p {
    max-width: 700px;
    margin: 7px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.65;
  }

  .aula-empty-state__contenido button {
    min-height: 39px;
    margin-top: 14px;
    padding: 9px 13px;
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
    font-weight: 800;
    cursor: pointer;
  }

  @media (
    max-width: 560px
  ) {
    .aula-empty-state,
    .aula-empty-state.compacto {
      grid-template-columns: 1fr;
    }
  }
`;