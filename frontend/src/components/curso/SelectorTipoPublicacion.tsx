import {
  Check,
  X,
} from 'lucide-react';

import {
  CONFIGURACION_TIPOS_PUBLICACION,
  TIPOS_PUBLICACION_ORDENADOS,
} from '../../config/publicacionesCurso.config';

import type {
  TipoPublicacionCurso,
} from '../../types/comunicacion-curso.types';

type SelectorTipoPublicacionProps = {
  abierto: boolean;

  valor:
    TipoPublicacionCurso;

  onSeleccionar: (
    tipo:
      TipoPublicacionCurso,
  ) => void;

  onCerrar: () => void;
};

export default function SelectorTipoPublicacion({
  abierto,
  valor,
  onSeleccionar,
  onCerrar,
}: SelectorTipoPublicacionProps) {
  if (!abierto) {
    return null;
  }

  return (
    <div
      className="selector-tipo-backdrop"
      role="presentation"
      onMouseDown={(
        evento,
      ) => {
        if (
          evento.target ===
          evento.currentTarget
        ) {
          onCerrar();
        }
      }}
    >
      <section className="selector-tipo">
        <header className="selector-tipo__header">
          <div>
            <span>
              Nueva publicación
            </span>

            <h3>
              ¿Qué deseas comunicar?
            </h3>

            <p>
              Selecciona una plantilla. El formulario mostrará únicamente los campos necesarios.
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar selector"
            onClick={
              onCerrar
            }
          >
            <X
              size={19}
            />
          </button>
        </header>

        <div className="selector-tipo__grid">
          {TIPOS_PUBLICACION_ORDENADOS.map(
            (
              tipo,
            ) => {
              const configuracion =
                CONFIGURACION_TIPOS_PUBLICACION[
                  tipo
                ];

              const Icono =
                configuracion.icono;

              const seleccionado =
                valor ===
                tipo;

              return (
                <button
                  key={
                    tipo
                  }
                  type="button"
                  className={`tipo-card tipo-card--${configuracion.tono} ${
                    seleccionado
                      ? 'seleccionado'
                      : ''
                  }`}
                  onClick={() => {
                    onSeleccionar(
                      tipo,
                    );

                    onCerrar();
                  }}
                >
                  <span className="tipo-card__icono">
                    <Icono
                      size={21}
                    />
                  </span>

                  <span className="tipo-card__contenido">
                    <strong>
                      {configuracion.etiqueta}
                    </strong>

                    <small>
                      {configuracion.descripcion}
                    </small>
                  </span>

                  {seleccionado && (
                    <span className="tipo-card__check">
                      <Check
                        size={14}
                      />
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>

        <style>
          {styles}
        </style>
      </section>
    </div>
  );
}

const styles = `
  .selector-tipo-backdrop {
    position: fixed;
    inset: 0;
    z-index: 97000;
    display: grid;
    place-items: center;
    padding: 24px;
    overflow: hidden;
    background: rgba(15, 23, 42, .56);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .selector-tipo {
    width: min(760px, calc(100vw - 48px));
    max-height: calc(100vh - 48px);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    color: var(--app-text);
    background: var(--app-surface);
    box-shadow: 0 30px 90px rgba(15, 23, 42, .3);
    animation: selectorTipoEntrada .2s ease-out;
  }

  .selector-tipo__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--app-border-soft);
    background:
      linear-gradient(
        135deg,
        var(--app-surface),
        color-mix(
          in srgb,
          var(--app-accent-soft) 24%,
          var(--app-surface)
        )
      );
  }

  .selector-tipo__header > div {
    min-width: 0;
  }

  .selector-tipo__header span {
    color: var(--app-accent-dark);
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  .selector-tipo__header h3 {
    margin: 4px 0 0;
    color: var(--app-text);
    font-size: 22px;
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -.025em;
  }

  .selector-tipo__header p {
    max-width: 590px;
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.45;
  }

  .selector-tipo__header button {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    padding: 0;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    cursor: pointer;
    transition:
      color .15s ease,
      background .15s ease,
      transform .15s ease;
  }

  .selector-tipo__header button:hover {
    color: var(--app-danger);
    background: var(--app-danger-bg);
    transform: rotate(3deg);
  }

  .selector-tipo__grid {
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    align-content: start;
    padding: 13px;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .tipo-card {
    position: relative;
    min-width: 0;
    min-height: 86px;
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding: 11px 12px;
    overflow: hidden;
    border: 1px solid var(--app-border-soft);
    border-radius: 14px;
    color: var(--app-text-secondary);
    background:
      linear-gradient(
        135deg,
        var(--app-surface),
        color-mix(
          in srgb,
          var(--tipo-suave) 16%,
          var(--app-surface)
        )
      );
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      transform .15s ease,
      border-color .15s ease,
      box-shadow .15s ease,
      background .15s ease;
  }

  .tipo-card::before {
    content: "";
    position: absolute;
    inset: 8px auto 8px 0;
    width: 3px;
    border-radius: 0 4px 4px 0;
    background: var(--tipo-acento);
    opacity: .55;
  }

  .tipo-card:hover {
    transform: translateY(-1px);
    border-color:
      color-mix(
        in srgb,
        var(--tipo-acento) 62%,
        var(--app-border)
      );
    box-shadow:
      0 9px 22px
      color-mix(
        in srgb,
        var(--tipo-acento) 11%,
        transparent
      );
  }

  .tipo-card.seleccionado {
    border-color: var(--tipo-acento);
    background:
      color-mix(
        in srgb,
        var(--tipo-suave) 54%,
        var(--app-surface)
      );
    box-shadow:
      inset 0 0 0 1px
      color-mix(
        in srgb,
        var(--tipo-acento) 14%,
        transparent
      );
  }

  .tipo-card.seleccionado::before {
    width: 4px;
    opacity: 1;
  }

  .tipo-card__icono {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    color: var(--tipo-acento);
    background: var(--tipo-suave);
  }

  .tipo-card__contenido {
    min-width: 0;
    padding-right: 19px;
  }

  .tipo-card__contenido strong,
  .tipo-card__contenido small {
    display: block;
  }

  .tipo-card__contenido strong {
    overflow: hidden;
    color: var(--app-text);
    font-size: 12px;
    font-weight: 850;
    line-height: 1.25;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .tipo-card__contenido small {
    display: -webkit-box;
    margin-top: 4px;
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: 10px;
    line-height: 1.38;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .tipo-card__check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #fff;
    background: var(--tipo-acento);
    box-shadow:
      0 5px 12px
      color-mix(
        in srgb,
        var(--tipo-acento) 25%,
        transparent
      );
  }

  .tipo-card--azul {
    --tipo-acento: #2563eb;
    --tipo-suave: #dbeafe;
  }

  .tipo-card--verde {
    --tipo-acento: #15803d;
    --tipo-suave: #dcfce7;
  }

  .tipo-card--rojo {
    --tipo-acento: #dc2626;
    --tipo-suave: #fee2e2;
  }

  .tipo-card--morado {
    --tipo-acento: #7c3aed;
    --tipo-suave: #ede9fe;
  }

  .tipo-card--naranja {
    --tipo-acento: #ea580c;
    --tipo-suave: #ffedd5;
  }

  .tipo-card--celeste {
    --tipo-acento: #0284c7;
    --tipo-suave: #e0f2fe;
  }

  .tipo-card--gris {
    --tipo-acento: #475569;
    --tipo-suave: #e2e8f0;
  }

  .tipo-card--indigo {
    --tipo-acento: #4f46e5;
    --tipo-suave: #e0e7ff;
  }

  .tipo-card--amarillo {
    --tipo-acento: #ca8a04;
    --tipo-suave: #fef9c3;
  }

  .tipo-card--rosa {
    --tipo-acento: #db2777;
    --tipo-suave: #fce7f3;
  }

  @keyframes selectorTipoEntrada {
    from {
      opacity: 0;
      transform: translateY(7px) scale(.99);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 740px) {
    .selector-tipo {
      width: min(560px, calc(100vw - 28px));
    }

    .selector-tipo__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 480px) {
    .selector-tipo-backdrop {
      padding: 8px;
    }

    .selector-tipo {
      width: 100%;
      max-height: calc(100vh - 16px);
      border-radius: 18px;
    }

    .selector-tipo__header {
      padding: 14px;
    }

    .selector-tipo__header h3 {
      font-size: 20px;
    }

    .selector-tipo__grid {
      grid-template-columns: 1fr;
      padding: 10px;
    }

    .tipo-card {
      min-height: 76px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .selector-tipo,
    .tipo-card,
    .selector-tipo__header button {
      animation: none !important;
      transition: none !important;
    }
  }
`;
