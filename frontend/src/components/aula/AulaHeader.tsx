import type { ComponentType, ReactNode } from 'react';

export type VarianteAccionAula = 'primaria' | 'secundaria' | 'peligro';

export type AccionAulaHeader = {
  texto: string;
  icono?: ComponentType<{ size?: number }>;
  variante?: VarianteAccionAula;
  deshabilitada?: boolean;
  onClick: () => void;
};

type AulaHeaderProps = {
  icono: ComponentType<{ size?: number }>;
  etiqueta: string;
  titulo: string;
  descripcion: string;
  informacion?: ReactNode;
  acciones?: AccionAulaHeader[];
};

export default function AulaHeader({
  icono: Icono,
  etiqueta,
  titulo,
  descripcion,
  informacion,
  acciones = [],
}: AulaHeaderProps) {
  return (
    <header className="aula-header">
      <div className="aula-header__principal">
        <span className="aula-header__icono"><Icono size={24} /></span>
        <div className="aula-header__contenido">
          <span className="aula-header__eyebrow">{etiqueta}</span>
          <h2>{titulo}</h2>
          <p>{descripcion}</p>
          {informacion && <small>{informacion}</small>}
        </div>
      </div>

      {acciones.length > 0 && (
        <div className="aula-header__acciones">
          {acciones.map((accion) => {
            const IconoAccion = accion.icono;
            return (
              <button
                key={accion.texto}
                type="button"
                className={`aula-header__accion ${accion.variante ?? 'secundaria'}`}
                disabled={accion.deshabilitada}
                onClick={accion.onClick}
              >
                {IconoAccion && <IconoAccion size={16} />}
                {accion.texto}
              </button>
            );
          })}
        </div>
      )}

      <style>{styles}</style>
    </header>
  );
}

const styles = `
  .aula-header {
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 184px;
    gap: 22px;
    align-items: start;
    padding: 20px 22px;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    color: var(--app-text);
    background: linear-gradient(
      135deg,
      var(--app-surface),
      color-mix(in srgb, var(--app-accent-soft) 24%, var(--app-surface))
    );
    box-shadow: var(--app-shadow-sm);
  }

  .aula-header__principal {
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .aula-header__icono {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid var(--app-border-strong);
    border-radius: 16px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    box-shadow: var(--app-shadow-sm);
  }

  .aula-header__contenido { min-width: 0; }

  .aula-header__eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .13em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .aula-header h2 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 25px;
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -.025em;
  }

  .aula-header p {
    max-width: 760px;
    margin: 6px 0 0;
    color: var(--app-text-soft);
    font-size: 13px;
    line-height: 1.48;
  }

  .aula-header small {
    display: block;
    margin-top: 8px;
    color: var(--app-text-muted);
    font-size: 10px;
    line-height: 1.4;
  }

  .aula-header__acciones {
    width: 184px;
    display: grid;
    gap: 8px;
  }

  .aula-header__accion {
    width: 100%;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 13px;
    border: none;
    border-radius: 12px;
    font-family: inherit;
    font-size: 11px;
    font-weight: 850;
    cursor: pointer;
    transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
  }

  .aula-header__accion:hover:not(:disabled) { transform: translateY(-1px); }

  .aula-header__accion.primaria {
    color: #fff;
    background: linear-gradient(135deg, var(--app-accent), var(--app-accent-hover));
    box-shadow: 0 10px 24px color-mix(in srgb, var(--app-accent) 22%, transparent);
  }

  .aula-header__accion.secundaria {
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .aula-header__accion.peligro {
    color: #fff;
    background: var(--app-danger);
  }

  .aula-header__accion:disabled { opacity: .55; cursor: not-allowed; }

  @media (max-width: 760px) {
    .aula-header { grid-template-columns: 1fr; gap: 16px; padding: 18px; }
    .aula-header__acciones {
      width: 100%;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 520px) {
    .aula-header__principal { flex-direction: column; }
    .aula-header__acciones { grid-template-columns: 1fr; }
    .aula-header h2 { font-size: 22px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .aula-header *, .aula-header *::before, .aula-header *::after {
      transition: none !important;
      animation: none !important;
    }
  }
`;
