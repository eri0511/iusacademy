import {
  MoreHorizontal,
  X,
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  createPortal,
} from 'react-dom';

export type OpcionAulaDropdown = {
  texto:
    string;

  peligro?:
    boolean;

  deshabilitada?:
    boolean;

  separadorAntes?:
    boolean;

  onClick:
    () => void;
};

type AulaDropdownProps = {
  opciones:
    OpcionAulaDropdown[];

  titulo?:
    string;

  ariaLabel?:
    string;

  deshabilitado?:
    boolean;

  triggerClassName?:
    string;
};

type PosicionDropdown = {
  top:
    number;

  left:
    number;

  maxHeight:
    number;

  abreArriba:
    boolean;
};

export default function AulaDropdown({
  opciones,
  titulo =
    'Opciones',
  ariaLabel =
    'Abrir opciones',
  deshabilitado =
    false,
  triggerClassName =
    '',
}: AulaDropdownProps) {
  const [
    abierto,
    setAbierto,
  ] =
    useState(
      false,
    );

  const [
    posicion,
    setPosicion,
  ] =
    useState<PosicionDropdown>({
      top:
        0,
      left:
        0,
      maxHeight:
        320,
      abreArriba:
        false,
    });

  const triggerRef =
    useRef<HTMLButtonElement | null>(
      null,
    );

  const panelRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const cerrar =
    () =>
      setAbierto(
        false,
      );

  const abrir =
    () => {
      const trigger =
        triggerRef.current;

      if (!trigger) {
        return;
      }

      const rect =
        trigger.getBoundingClientRect();

      const ancho =
        215;

      const altoEstimado =
        Math.min(
          360,
          54 +
          opciones.length *
            42 +
          16,
        );

      const margen =
        12;

      const separacion =
        8;

      const espacioAbajo =
        window.innerHeight -
        rect.bottom -
        margen;

      const espacioArriba =
        rect.top -
        margen;

      const abreArriba =
        espacioAbajo <
          altoEstimado &&
        espacioArriba >
          espacioAbajo;

      const maxHeight =
        Math.max(
          180,
          Math.min(
            altoEstimado,
            abreArriba
              ? espacioArriba -
                  separacion
              : espacioAbajo -
                  separacion,
          ),
        );

      const top =
        abreArriba
          ? Math.max(
              margen,
              rect.top -
                maxHeight -
                separacion,
            )
          : Math.min(
              window.innerHeight -
                maxHeight -
                margen,
              rect.bottom +
                separacion,
            );

      const left =
        Math.min(
          window.innerWidth -
            ancho -
            margen,
          Math.max(
            margen,
            rect.right -
              ancho,
          ),
        );

      setPosicion({
        top,
        left,
        maxHeight,
        abreArriba,
      });

      setAbierto(
        true,
      );
    };

  useEffect(
    () => {
      if (!abierto) {
        return;
      }

      const manejarClick =
        (
          evento:
            MouseEvent,
        ) => {
          const objetivo =
            evento.target as Node;

          if (
            panelRef.current?.contains(
              objetivo,
            ) ||
            triggerRef.current?.contains(
              objetivo,
            )
          ) {
            return;
          }

          cerrar();
        };

      const manejarTeclado =
        (
          evento:
            KeyboardEvent,
        ) => {
          if (
            evento.key ===
            'Escape'
          ) {
            cerrar();
          }
        };

      const cerrarAlMover =
        () =>
          cerrar();

      document.addEventListener(
        'mousedown',
        manejarClick,
      );

      document.addEventListener(
        'keydown',
        manejarTeclado,
      );

      window.addEventListener(
        'resize',
        cerrarAlMover,
      );

      window.addEventListener(
        'scroll',
        cerrarAlMover,
        true,
      );

      return () => {
        document.removeEventListener(
          'mousedown',
          manejarClick,
        );

        document.removeEventListener(
          'keydown',
          manejarTeclado,
        );

        window.removeEventListener(
          'resize',
          cerrarAlMover,
        );

        window.removeEventListener(
          'scroll',
          cerrarAlMover,
          true,
        );
      };
    },
    [
      abierto,
    ],
  );

  const ejecutar =
    (
      opcion:
        OpcionAulaDropdown,
    ) => {
      if (
        opcion.deshabilitada
      ) {
        return;
      }

      cerrar();
      opcion.onClick();
    };

  return (
    <>
      <button
        ref={
          triggerRef
        }
        type="button"
        className={`aula-dropdown__trigger ${triggerClassName}`}
        disabled={
          deshabilitado
        }
        aria-label={
          ariaLabel
        }
        aria-expanded={
          abierto
        }
        onClick={() =>
          abierto
            ? cerrar()
            : abrir()
        }
      >
        <MoreHorizontal
          size={18}
        />
      </button>

      {abierto &&
        createPortal(
          <div
            ref={
              panelRef
            }
            className={`aula-dropdown__panel ${
              posicion.abreArriba
                ? 'arriba'
                : 'abajo'
            }`}
            style={{
              top:
                posicion.top,
              left:
                posicion.left,
              maxHeight:
                posicion.maxHeight,
            }}
          >
            <header>
              <strong>
                {titulo}
              </strong>

              <button
                type="button"
                aria-label="Cerrar opciones"
                onClick={
                  cerrar
                }
              >
                <X
                  size={16}
                />
              </button>
            </header>

            <div className="aula-dropdown__opciones">
              {opciones.map(
                (
                  opcion,
                  indice,
                ) => (
                  <div
                    key={`${opcion.texto}-${indice}`}
                  >
                    {opcion.separadorAntes && (
                      <span className="aula-dropdown__separador" />
                    )}

                    <button
                      type="button"
                      className={
                        opcion.peligro
                          ? 'peligro'
                          : ''
                      }
                      disabled={
                        opcion.deshabilitada
                      }
                      onClick={() =>
                        ejecutar(
                          opcion,
                        )
                      }
                    >
                      {opcion.texto}
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>,
          document.body,
        )}

      <style>
        {styles}
      </style>
    </>
  );
}

const styles = `
  .aula-dropdown__trigger {
    width: 37px;
    height: 37px;
    display: grid;
    place-items: center;
    padding: 0;
    border:
      1px solid
      var(
        --app-border-soft
      );
    border-radius: 12px;
    color:
      var(
        --app-text-soft
      );
    background:
      var(
        --app-surface
      );
    cursor: pointer;
    transition:
      color
      .14s
      ease,
      border-color
      .14s
      ease,
      background
      .14s
      ease;
  }

  .aula-dropdown__trigger:hover:not(:disabled) {
    color:
      var(
        --app-accent-dark
      );
    border-color:
      var(
        --app-accent
      );
    background:
      var(
        --app-accent-soft
      );
  }

  .aula-dropdown__trigger:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .aula-dropdown__panel {
    position: fixed;
    z-index: 80000;
    width: 215px;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 7px;
    border:
      1px solid
      var(
        --app-border
      );
    border-radius: 15px;
    color:
      var(
        --app-text
      );
    background:
      var(
        --app-surface
      );
    box-shadow:
      0
      24px
      60px
      rgba(
        15,
        23,
        42,
        .2
      );
    animation:
      aulaDropdownEntrada
      .16s
      ease-out;
  }

  .aula-dropdown__panel > header {
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding:
      5px
      3px
      9px
      9px;
    border-bottom:
      1px solid
      var(
        --app-border-soft
      );
  }

  .aula-dropdown__panel > header strong {
    font-size: 12px;
    font-weight: 850;
  }

  .aula-dropdown__panel > header button {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    padding: 0;
    border: none;
    border-radius: 8px;
    color:
      var(
        --app-text-muted
      );
    background: transparent;
    cursor: pointer;
  }

  .aula-dropdown__panel > header button:hover {
    color:
      var(
        --app-danger
      );
    background:
      var(
        --app-danger-bg
      );
  }

  .aula-dropdown__opciones {
    display: grid;
    padding-top: 4px;
  }

  .aula-dropdown__opciones > div > button {
    width: 100%;
    min-height: 36px;
    display: flex;
    align-items: center;
    padding:
      9px
      9px;
    border: none;
    border-radius: 9px;
    color:
      var(
        --app-text-secondary
      );
    background: transparent;
    font-family: inherit;
    font-size: 10px;
    font-weight: 800;
    line-height: 1.25;
    text-align: left;
    cursor: pointer;
  }

  .aula-dropdown__opciones > div > button:hover:not(:disabled) {
    color:
      var(
        --app-accent-dark
      );
    background:
      var(
        --app-surface-alt
      );
  }

  .aula-dropdown__opciones > div > button.peligro {
    color:
      var(
        --app-danger
      );
  }

  .aula-dropdown__opciones > div > button.peligro:hover:not(:disabled) {
    background:
      var(
        --app-danger-bg
      );
  }

  .aula-dropdown__opciones > div > button:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  .aula-dropdown__separador {
    display: block;
    height: 1px;
    margin:
      3px
      2px;
    background:
      var(
        --app-border-soft
      );
  }

  @keyframes aulaDropdownEntrada {
    from {
      opacity: 0;
      transform:
        translateY(
          -4px
        )
        scale(
          .99
        );
    }

    to {
      opacity: 1;
      transform:
        translateY(
          0
        )
        scale(
          1
        );
    }
  }

  @media (
    prefers-reduced-motion:
      reduce
  ) {
    .aula-dropdown__trigger,
    .aula-dropdown__panel {
      transition: none !important;
      animation: none !important;
    }
  }
`;
