import {
  UsersRound,
} from 'lucide-react';

import {
  configDocumentoColaborativoInicial,
} from '../../utils/tareas/documentoColaborativo';

import type {
  ConfiguracionDocumentoColaborativo,
} from '../../utils/tareas/documentoColaborativo';

type Props = {
  valor:
    | ConfiguracionDocumentoColaborativo
    | null;
  onChange:
    (
      nuevo:
        | ConfiguracionDocumentoColaborativo
        | null,
    ) => void;
};

function ConfiguracionDocumentoColaborativoDocente({
  valor,
  onChange,
}: Props) {
  const estado =
    valor ??
    configDocumentoColaborativoInicial();

  return (
    <div className="tdc">
      <div className="tdc__titulo">
        <UsersRound
          size={16}
        />
        <span>
          Configuración del documento colaborativo
        </span>
      </div>

      <div className="tdc__grid">
        <label className="tdc__campo">
          <span>
            Bloques mínimos
          </span>
          <input
            type="number"
            min={1}
            max={
              estado.maxBloques
            }
            value={
              estado.minBloques
            }
            onChange={(
              e,
            ) =>
              onChange({
                ...estado,
                minBloques:
                  Math.max(
                    1,
                    Number(
                      e.target
                        .value,
                    ) ||
                      1,
                  ),
              })
            }
          />
        </label>

        <label className="tdc__campo">
          <span>
            Bloques máximos
          </span>
          <input
            type="number"
            min={
              estado.minBloques
            }
            value={
              estado.maxBloques
            }
            onChange={(
              e,
            ) =>
              onChange({
                ...estado,
                maxBloques:
                  Math.max(
                    estado.minBloques,
                    Number(
                      e.target
                        .value,
                    ) ||
                      30,
                  ),
              })
            }
          />
        </label>

        <label className="tdc__campo">
          <span>
            Palabras por bloque (mín.)
          </span>
          <input
            type="number"
            min={0}
            value={
              estado.minPalabrasPorBloque
            }
            onChange={(
              e,
            ) =>
              onChange({
                ...estado,
                minPalabrasPorBloque:
                  Math.max(
                    0,
                    Number(
                      e.target
                        .value,
                    ) ||
                      0,
                  ),
              })
            }
          />
        </label>

        <label className="tdc__campo">
          <span>
            Palabras por bloque (máx.)
          </span>
          <input
            type="number"
            min={
              estado.minPalabrasPorBloque
            }
            value={
              estado.maxPalabrasPorBloque
            }
            onChange={(
              e,
            ) =>
              onChange({
                ...estado,
                maxPalabrasPorBloque:
                  Math.max(
                    estado.minPalabrasPorBloque,
                    Number(
                      e.target
                        .value,
                    ) ||
                      500,
                  ),
              })
            }
          />
        </label>

        <label className="tdc__campo">
          <span>
            Total mínimo de palabras
          </span>
          <input
            type="number"
            min={0}
            value={
              estado.totalMinPalabras
            }
            onChange={(
              e,
            ) =>
              onChange({
                ...estado,
                totalMinPalabras:
                  Math.max(
                    0,
                    Number(
                      e.target
                        .value,
                    ) ||
                      0,
                  ),
              })
            }
          />
        </label>

        <label className="tdc__campo">
          <span>
            Total máximo de palabras
          </span>
          <input
            type="number"
            min={
              estado.totalMinPalabras
            }
            value={
              estado.totalMaxPalabras
            }
            onChange={(
              e,
            ) =>
              onChange({
                ...estado,
                totalMaxPalabras:
                  Math.max(
                    estado.totalMinPalabras,
                    Number(
                      e.target
                        .value,
                    ) ||
                      5000,
                  ),
              })
            }
          />
        </label>
      </div>

      <label className="tdc__check">
        <input
          type="checkbox"
          checked={
            estado.exigirAutores
          }
          onChange={(
            e,
          ) =>
            onChange({
              ...estado,
              exigirAutores:
                e.target
                  .checked,
            })
          }
        />
        <span>
          Exigir mínimo de autores diferentes
        </span>
      </label>

      {estado.exigirAutores && (
        <label className="tdc__campo tdc__campo--inline">
          <span>
            Autores mínimos
          </span>
          <input
            type="number"
            min={2}
            value={
              estado.minAutores
            }
            onChange={(
              e,
            ) =>
              onChange({
                ...estado,
                minAutores:
                  Math.max(
                    2,
                    Number(
                      e.target
                        .value,
                    ) ||
                      2,
                  ),
              })
            }
          />
        </label>
      )}

      <style>{`
        .tdc {
          display: grid;
          gap: 10px;
        }

        .tdc__titulo {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--app-text);
          font-size: 11px;
          font-weight: 800;
        }

        .tdc__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7px;
        }

        .tdc__campo {
          display: grid;
          gap: 3px;
        }

        .tdc__campo span {
          font-size: 9.5px;
          color: var(--app-text-secondary);
        }

        .tdc__campo input {
          padding: 6px 8px;
          border: 1px solid var(--app-border);
          border-radius: 8px;
          font: inherit;
          font-size: 11px;
          background: var(--app-surface);
        }

        .tdc__campo--inline {
          grid-template-columns: auto auto;
          align-items: center;
        }

        .tdc__campo--inline input {
          width: 60px;
        }

        .tdc__check {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: var(--app-text-secondary);
        }

        .tdc__check input {
          accent-color: var(--app-accent);
        }
      `}</style>
    </div>
  );
}

export default ConfiguracionDocumentoColaborativoDocente;
