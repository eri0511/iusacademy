import {
  useMemo,
  useState,
} from 'react';

import {
  Check,
  Search,
  UserRoundPlus,
  UsersRound,
  X,
} from 'lucide-react';

import type {
  EstudianteDisponibleAfinidad,
} from '../../hooks/foro/useForoEstudiante';

type Props = {
  abierto: boolean;
  estudiantes: EstudianteDisponibleAfinidad[];
  minimoIntegrantes: number;
  maximoIntegrantes: number;
  procesando?: boolean;
  onCerrar: () => void;
  onConfirmar: (
    integrantesIds: number[],
  ) => Promise<void> | void;
};

function nombreCompleto(
  estudiante:
    EstudianteDisponibleAfinidad,
): string {
  return [
    estudiante.nombres,
    estudiante.apellidoPaterno,
    estudiante.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(
      ' ',
    );
}

export default function FormarEquipoAfinidadModal({
  abierto,
  estudiantes,
  minimoIntegrantes,
  maximoIntegrantes,
  procesando = false,
  onCerrar,
  onConfirmar,
}: Props) {
  const [
    busqueda,
    setBusqueda,
  ] =
    useState(
      '',
    );

  const [
    seleccionados,
    setSeleccionados,
  ] =
    useState<number[]>(
      [],
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const companerosMinimos =
    Math.max(
      0,
      minimoIntegrantes -
        1,
    );

  const companerosMaximos =
    Math.max(
      0,
      maximoIntegrantes -
        1,
    );

  const exacto =
    minimoIntegrantes ===
    maximoIntegrantes;

  const disponibles =
    useMemo(
      () => {
        const texto =
          busqueda
            .trim()
            .toLocaleLowerCase(
              'es',
            );

        if (
          !texto
        ) {
          return estudiantes;
        }

        return estudiantes.filter(
          (
            estudiante,
          ) => {
            const partesNombre = [
              estudiante.nombres,
              estudiante.apellidoPaterno,
              estudiante.apellidoMaterno ??
                '',
            ]
              .flatMap(
                (
                  parte,
                ) =>
                  parte
                    .trim()
                    .split(
                      /\s+/,
                    ),
              )
              .filter(
                Boolean,
              )
              .map(
                (
                  parte,
                ) =>
                  parte.toLocaleLowerCase(
                    'es',
                  ),
              );

            return partesNombre.some(
              (
                parte,
              ) =>
                parte.startsWith(
                  texto,
                ),
            );
          },
        );
      },
      [
        estudiantes,
        busqueda,
      ],
    );

  if (
    !abierto
  ) {
    return null;
  }

  const alternar =
    (
      estudianteId:
        number,
    ) => {
      setError(
        null,
      );

      setSeleccionados(
        (
          actuales,
        ) => {
          if (
            actuales.includes(
              estudianteId,
            )
          ) {
            return actuales.filter(
              (
                id,
              ) =>
                id !==
                estudianteId,
            );
          }

          if (
            actuales.length >=
            companerosMaximos
          ) {
            setError(
              `Solo puedes seleccionar ${companerosMaximos} compañero(s).`,
            );

            return actuales;
          }

          return [
            ...actuales,
            estudianteId,
          ];
        },
      );
    };

  const cantidadTotal =
    seleccionados.length +
    1;

  const valido =
    cantidadTotal >=
      minimoIntegrantes &&
    cantidadTotal <=
      maximoIntegrantes;

  const confirmar =
    async () => {
      if (
        !valido
      ) {
        setError(
          exacto
            ? `Debes completar un equipo de exactamente ${minimoIntegrantes} estudiantes.`
            : `El equipo debe tener entre ${minimoIntegrantes} y ${maximoIntegrantes} estudiantes.`,
        );

        return;
      }

      try {
        setError(
          null,
        );

        await onConfirmar(
          seleccionados,
        );
      } catch (
        causa
      ) {
        setError(
          causa instanceof Error
            ? causa.message
            : 'No fue posible formar el equipo.',
        );
      }
    };

  return (
    <div
      className="afe-backdrop"
      role="presentation"
      onMouseDown={
        procesando
          ? undefined
          : onCerrar
      }
    >
      <section
        className="afe-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="afe-title"
        onMouseDown={(
          evento,
        ) =>
          evento.stopPropagation()
        }
      >
        <button
          type="button"
          className="afe-close"
          disabled={
            procesando
          }
          onClick={
            onCerrar
          }
          aria-label="Cerrar"
        >
          <X
            size={18}
          />
        </button>

        <header className="afe-head">
          <span className="afe-head__icon">
            <UsersRound
              size={25}
            />
          </span>

          <div>
            <span className="afe-eyebrow">
              Grupo por afinidad
            </span>

            <h2 id="afe-title">
              Elige a tus compañeros
            </h2>

            <p>
              Tú ya cuentas como integrante. Selecciona a tus compañeros para completar el grupo.
            </p>
          </div>
        </header>

        <aside className="afe-rule">
          <UserRoundPlus
            size={19}
          />

          <div>
            <strong>
              Regla del foro
            </strong>

            <span>
              {exacto
                ? `El equipo debe tener exactamente ${minimoIntegrantes} estudiantes. Como tú ya cuentas, debes seleccionar ${companerosMinimos} compañero(s).`
                : `El equipo debe tener entre ${minimoIntegrantes} y ${maximoIntegrantes} estudiantes. Debes seleccionar entre ${companerosMinimos} y ${companerosMaximos} compañero(s).`}
            </span>
          </div>

          <b>
            {cantidadTotal}
            /
            {maximoIntegrantes}
          </b>
        </aside>

        <div className="afe-summary">
          <div>
            <span>
              Tú ya cuentas
            </span>

            <strong>
              1
            </strong>

            <small>
              integrante
            </small>
          </div>

          <div>
            <span>
              Mínimo
            </span>

            <strong>
              {minimoIntegrantes}
            </strong>

            <small>
              integrantes
            </small>
          </div>

          <div>
            <span>
              Máximo
            </span>

            <strong>
              {maximoIntegrantes}
            </strong>

            <small>
              integrantes
            </small>
          </div>
        </div>

        <div className="afe-auto-line">
          <UsersRound
            size={15}
          />

          <span>
            El nombre se asigna automáticamente:
            {' '}
            <strong>
              Grupo 1, Grupo 2, Grupo 3…
            </strong>
          </span>
        </div>

        <label className="afe-search">
          <Search
            size={17}
          />

          <input
            value={
              busqueda
            }
            placeholder="Escribe una letra o nombre: Ana, Álvarez, Arce..."
            disabled={
              procesando
            }
            onChange={(
              evento,
            ) =>
              setBusqueda(
                evento.target.value,
              )
            }
          />
        </label>

        <div className="afe-selected-wrap">
          <div className="afe-selected-head">
            <span>
              Integrantes seleccionados
            </span>

            <b>
              {cantidadTotal}
              /
              {maximoIntegrantes}
            </b>
          </div>

          <div className="afe-selected">
            <span className="afe-chip afe-chip--self">
              Tú
            </span>

            {seleccionados.map(
              (
                id,
              ) => {
                const estudiante =
                  estudiantes.find(
                    (
                      item,
                    ) =>
                      item.id ===
                      id,
                  );

                return (
                  <span
                    className="afe-chip"
                    key={
                      id
                    }
                  >
                    <span>
                      {estudiante
                        ? nombreCompleto(
                            estudiante,
                          )
                        : `Estudiante ${id}`}
                    </span>

                    <button
                      type="button"
                      disabled={
                        procesando
                      }
                      aria-label={
                        estudiante
                          ? `Quitar a ${nombreCompleto(
                              estudiante,
                            )}`
                          : `Quitar estudiante ${id}`
                      }
                      onClick={() =>
                        alternar(
                          id,
                        )
                      }
                    >
                      <X
                        size={13}
                      />
                    </button>
                  </span>
                );
              },
            )}
          </div>
        </div>

        <div className="afe-list">
          {disponibles.length ===
          0 ? (
            <div className="afe-empty">
              {busqueda.trim()
                ? `No encontramos nombres o apellidos que empiecen con "${busqueda.trim()}".`
                : 'No hay más estudiantes disponibles para este foro.'}
            </div>
          ) : (
            disponibles.map(
              (
                estudiante,
              ) => {
                const seleccionado =
                  seleccionados.includes(
                    estudiante.id,
                  );

                return (
                  <button
                    type="button"
                    className={`afe-student ${seleccionado ? 'selected' : ''}`}
                    key={
                      estudiante.id
                    }
                    disabled={
                      procesando
                    }
                    onClick={() =>
                      alternar(
                        estudiante.id,
                      )
                    }
                  >
                    <span className="afe-avatar">
                      {
                        estudiante.nombres
                          .trim()
                          .charAt(
                            0,
                          )
                          .toUpperCase()
                      }
                      {
                        estudiante.apellidoPaterno
                          .trim()
                          .charAt(
                            0,
                          )
                          .toUpperCase()
                      }
                    </span>

                    <span className="afe-student__text">
                      <strong>
                        {nombreCompleto(
                          estudiante,
                        )}
                      </strong>

                      <small>
                        {estudiante.correo ||
                          'Estudiante del curso'}
                      </small>
                    </span>

                    <span className="afe-check">
                      {seleccionado && (
                        <Check
                          size={15}
                        />
                      )}
                    </span>
                  </button>
                );
              },
            )
          )}
        </div>

        {error && (
          <div className="afe-error">
            {error}
          </div>
        )}

        <footer className="afe-actions">
          <button
            type="button"
            className="afe-btn afe-btn--secondary"
            disabled={
              procesando
            }
            onClick={
              onCerrar
            }
          >
            Cancelar
          </button>

          <button
            type="button"
            className="afe-btn afe-btn--primary"
            disabled={
              !valido ||
              procesando
            }
            onClick={() =>
              void confirmar()
            }
          >
            {procesando
              ? 'Formando equipo...'
              : 'Confirmar grupo'}
          </button>
        </footer>

        <style>
          {styles}
        </style>
      </section>
    </div>
  );
}

const styles = `
  .afe-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: var(--app-overlay);
    backdrop-filter: blur(6px);
  }

  .afe-modal {
    position: relative;
    width: min(690px, 100%);
    max-height: calc(100dvh - 40px);
    display: grid;
    gap: 14px;
    padding: 22px;
    overflow-y: auto;
    border: 1px solid var(--app-border);
    border-radius: 24px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-modal);
  }

  .afe-close {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 35px;
    height: 35px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    cursor: pointer;
  }

  .afe-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-right: 42px;
  }

  .afe-head__icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .afe-eyebrow {
    color: var(--app-accent-dark);
    font-size: 9px;
    font-weight: 850;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  .afe-head h2 {
    margin: 4px 0 0;
    font-size: 20px;
    font-weight: 900;
  }

  .afe-head p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.5;
  }

  .afe-rule {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 11px 13px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
  }

  .afe-rule strong,
  .afe-rule span {
    display: block;
  }

  .afe-rule strong {
    color: var(--app-text);
    font-size: 10px;
  }

  .afe-rule span {
    margin-top: 3px;
    color: var(--app-text-soft);
    font-size: 9px;
  }

  .afe-rule b {
    min-width: 48px;
    padding: 7px 9px;
    border-radius: 999px;
    background: var(--app-accent-soft);
    text-align: center;
    font-size: 10px;
  }

  .afe-search {
    min-height: 44px;
    border: 1px solid var(--app-input-border);
    border-radius: 12px;
    background: var(--app-input-bg);
  }

  .afe-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    color: var(--app-text-muted);
  }

  .afe-search input {
    width: 100%;
    border: 0;
    outline: 0;
    color: var(--app-text);
    background: transparent;
    font: inherit;
    font-size: 10px;
  }

  .afe-search:focus-within {
    border-color: var(--app-accent);
    box-shadow: 0 0 0 4px var(--app-input-ring);
  }

  .afe-selected-wrap {
    display: grid;
    gap: 7px;
  }

  .afe-selected-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .afe-selected-head > span {
    color: var(--app-text-soft);
    font-size: 9px;
    font-weight: 800;
  }

  .afe-selected-head b {
    color: var(--app-accent-dark);
    font-size: 9px;
  }

  .afe-selected {
    min-height: 38px;
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    align-items: center;
  }

  .afe-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 6px 7px 6px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 8.8px;
    font-weight: 800;
  }

  .afe-chip > span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .afe-chip--self {
    padding-right: 10px;
    border-color: var(--app-success-border);
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .afe-chip button {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    flex: 0 0 20px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    cursor: pointer;
  }

  .afe-chip button:hover {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .afe-chip button:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .afe-summary {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );
    gap: 8px;
  }

  .afe-summary > div {
    display: grid;
    place-items: center;
    gap: 2px;
    padding: 10px 8px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .afe-summary span,
  .afe-summary small {
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .afe-summary strong {
    color: var(--app-text);
    font-size: 17px;
  }

  .afe-auto-line {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 10px;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 8.7px;
  }

  .afe-list {
    max-height: 300px;
    display: grid;
    gap: 7px;
    overflow-y: auto;
  }

  .afe-student {
    width: 100%;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 28px;
    align-items: center;
    gap: 10px;
    padding: 9px 11px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .afe-student:hover,
  .afe-student.selected {
    border-color: var(--app-accent);
    background: var(--app-accent-softer);
  }

  .afe-avatar {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 10px;
    font-weight: 900;
  }

  .afe-student__text {
    min-width: 0;
  }

  .afe-student__text strong,
  .afe-student__text small {
    display: block;
  }

  .afe-student__text strong {
    overflow: hidden;
    color: var(--app-text);
    font-size: 10px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .afe-student__text small {
    margin-top: 3px;
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: 8.5px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .afe-check {
    width: 25px;
    height: 25px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border);
    border-radius: 8px;
  }

  .afe-student.selected .afe-check {
    border-color: var(--app-accent);
    color: #fff;
    background: var(--app-accent);
  }

  .afe-empty,
  .afe-error {
    padding: 12px;
    border-radius: 11px;
    font-size: 9px;
  }

  .afe-empty {
    grid-column:
      1 / -1;
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    text-align: center;
  }

  .afe-error {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .afe-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .afe-btn {
    min-height: 39px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 9px 14px;
    border-radius: 11px;
    font: inherit;
    font-size: 9.5px;
    font-weight: 800;
    cursor: pointer;
  }

  .afe-btn--secondary {
    border: 1px solid var(--app-border);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .afe-btn--primary {
    border: 1px solid var(--app-accent);
    color: #fff;
    background: var(--app-accent);
  }

  .afe-btn:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  @media (max-width: 580px) {
    .afe-modal {
      padding: 18px;
    }

    .afe-rule {
      grid-template-columns: 34px 1fr;
    }

    .afe-rule b {
      grid-column: 2;
      justify-self: start;
    }

    .afe-actions {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
`;