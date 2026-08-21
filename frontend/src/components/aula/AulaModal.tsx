import { X } from "lucide-react";

import type { ComponentType, ReactNode } from "react";

import { useEffect } from "react";

type AulaModalProps = {
  abierto: boolean;
  titulo: string;
  etiqueta?: string;
  descripcion?: string;
  icono?: ComponentType<{ size?: number }>;
  ancho?: "compacto" | "mediano" | "amplio";
  pasos?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  bloqueado?: boolean;
  ariaLabelledBy?: string;
  onCerrar: () => void;
};

export default function AulaModal({
  abierto,
  titulo,
  etiqueta,
  descripcion,
  icono: Icono,
  ancho = "mediano",
  pasos,
  children,
  footer,
  bloqueado = false,
  ariaLabelledBy,
  onCerrar,
}: AulaModalProps) {
  useEffect(() => {
    if (!abierto) {
      return;
    }

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const manejarTeclado = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !bloqueado) {
        onCerrar();
      }
    };

    document.addEventListener("keydown", manejarTeclado);

    return () => {
      document.body.style.overflow = overflowAnterior;

      document.removeEventListener("keydown", manejarTeclado);
    };
  }, [abierto, bloqueado, onCerrar]);

  if (!abierto) {
    return null;
  }

  return (
    <div
      className="aula-modal__backdrop"
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !bloqueado) {
          onCerrar();
        }
      }}
    >
      <section
        className={`aula-modal aula-modal--${ancho}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
      >
        <header className="aula-modal__header">
          <div className="aula-modal__identidad">
            {Icono && (
              <span className="aula-modal__icono">
                <Icono size={22} />
              </span>
            )}

            <div>
              {etiqueta && (
                <span className="aula-modal__eyebrow">{etiqueta}</span>
              )}

              <h2 id={ariaLabelledBy}>{titulo}</h2>

              {descripcion && <p>{descripcion}</p>}
            </div>
          </div>

          <button
            type="button"
            className="aula-modal__cerrar"
            disabled={bloqueado}
            aria-label="Cerrar"
            onClick={onCerrar}
          >
            <X size={19} />
          </button>
        </header>

        {pasos && <div className="aula-modal__pasos">{pasos}</div>}

        <div className="aula-modal__contenido">{children}</div>

        {footer && <footer className="aula-modal__footer">{footer}</footer>}

        <style>{styles}</style>
      </section>
    </div>
  );
}

const styles = `
  .aula-modal__backdrop {
    position: fixed;
    inset: 0;
    z-index: 95000;
    display: grid;
    place-items: center;
    padding: 32px 22px;
    overflow: hidden;
    background: rgba(15, 23, 42, .6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .aula-modal {
    width: min(820px, calc(100vw - 56px));
    max-height: calc(100vh - 64px);
    display: grid;
    grid-template-rows:
      auto
      auto
      minmax(0, 1fr)
      auto;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 24px;
    color: var(--app-text);
    background: var(--app-surface);
    box-shadow:
      0 34px 100px
      rgba(15, 23, 42, .32);
    animation:
      aulaModalEntrada
      .2s
      ease-out;
  }

  .aula-modal--compacto {
    width: min(540px, calc(100vw - 40px));
  }

  .aula-modal--amplio {
    width:
      min(
        900px,
        calc(
          100vw - 56px
        )
      );
  }

  .aula-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 15px 18px;
    border-bottom:
      1px solid
      var(--app-border-soft);
    background:
      linear-gradient(
        135deg,
        var(--app-surface),
        color-mix(
          in srgb,
          var(--app-accent-soft) 26%,
          var(--app-surface)
        )
      );
  }

  .aula-modal__identidad {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .aula-modal__icono {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid var(--app-border-strong);
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .aula-modal__eyebrow {
    color: var(--app-accent-dark);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .aula-modal__header h2 {
    margin: 3px 0 0;
    color: var(--app-text);
    font-size: 21px;
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -.025em;
  }

  .aula-modal__header p {
    margin: 4px 0 0;
    color: var(--app-text-soft);
    font-size: 11px;
    line-height: 1.4;
  }

  .aula-modal__cerrar {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    padding: 0;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    cursor: pointer;
  }

  .aula-modal__cerrar:hover:not(:disabled) {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .aula-modal__cerrar:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .aula-modal__pasos {
    border-bottom:
      1px solid
      var(--app-border-soft);
    background:
      var(--app-surface-alt);
  }

  .aula-modal__contenido {
    min-height: 0;
    overflow: hidden;
    padding: 12px 16px;
  }

  .aula-modal__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 16px;
    border-top:
      1px solid
      var(--app-border-soft);
    background:
      var(--app-surface);
  }

  @keyframes aulaModalEntrada {
    from {
      opacity: 0;
      transform:
        translateY(8px)
        scale(.99);
    }

    to {
      opacity: 1;
      transform:
        translateY(0)
        scale(1);
    }
  }

  @media (max-height: 700px) {
    .aula-modal__contenido {
      overflow-y: auto;
    }
  }

  @media (max-width: 720px) {
    .aula-modal__backdrop {
      padding: 10px;
    }

    .aula-modal,
    .aula-modal--amplio {
      width: calc(100vw - 20px);
      max-height: calc(100vh - 20px);
    }

    .aula-modal__header {
      padding: 15px;
    }

    .aula-modal__contenido {
      overflow-y: auto;
      padding: 13px 15px;
    }

    .aula-modal__footer {
      padding: 11px 15px;
    }
  }

  @media (max-width: 520px) {
    .aula-modal__identidad {
      align-items: flex-start;
    }

    .aula-modal__header h2 {
      font-size: 20px;
    }

    .aula-modal__footer {
      align-items: stretch;
      flex-direction: column;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .aula-modal {
      animation: none;
    }
  }
  /* Ajuste compacto definitivo */
  .aula-modal--amplio {
    width: min(900px, calc(100vw - 44px));
  }

  .aula-modal__contenido {
    max-height: 620px;
  }

  .aula-modal__footer > * {
    flex-shrink: 0;
  }

`;
