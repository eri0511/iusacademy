import {
  useMemo,
  useState,
} from 'react';

import {
  Check,
  Search,
  UsersRound,
  X,
} from 'lucide-react';

import Toast, {
  type TipoToast,
} from '../shared/Toast';

export type EstudianteDisponibleAfinidadTarea = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  correo?: string;
  fotoPerfilUrl?: string | null;
};

type Props = {
  abierto: boolean;
  estudiantes: EstudianteDisponibleAfinidadTarea[];
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
    EstudianteDisponibleAfinidadTarea,
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

export default function FormarEquipoAfinidadTareaModal({
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
    toast,
    setToast,
  ] =
    useState<{
      visible: boolean;
      tipo: TipoToast;
      titulo: string;
      mensaje?: string;
    }>({
      visible: false,
      tipo: 'informacion',
      titulo: '',
    });

  const mostrarToast =
    (
      tipo:
        TipoToast,
      titulo:
        string,
      mensaje?:
        string,
    ) => {
      setToast({
        visible: true,
        tipo,
        titulo,
        mensaje,
      });
    };

  const cerrarToast =
    () => {
      setToast(
        (
          actual,
        ) => ({
          ...actual,
          visible: false,
        }),
      );
    };

  const cerrarModal =
    () => {
      cerrarToast();

      setBusqueda(
        '',
      );

      setSeleccionados(
        [],
      );

      onCerrar();
    };

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
      cerrarToast();

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
            mostrarToast(
              'advertencia',
              'Límite de integrantes alcanzado',
              `Solo puedes seleccionar ${companerosMaximos} compañero(s) porque tú ya cuentas como integrante del equipo.`,
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
        mostrarToast(
          'advertencia',
          'Equipo incompleto',
          exacto
            ? `Debes completar un equipo de exactamente ${minimoIntegrantes} estudiantes.`
            : `El equipo debe tener entre ${minimoIntegrantes} y ${maximoIntegrantes} estudiantes.`,
        );

        return;
      }

      try {
        cerrarToast();

        await onConfirmar(
          seleccionados,
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo crear el equipo',
          causa instanceof Error
            ? causa.message
            : 'No fue posible formar el equipo para esta tarea.',
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
          : cerrarModal
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
            cerrarModal
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
              Equipo por afinidad
            </span>

            <h2 id="afe-title">
              Elige a tus compañeros
            </h2>

            <p>
              Tú ya cuentas como integrante. Selecciona a tus compañeros para completar el grupo.
            </p>
          </div>
        </header>

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
            El nombre del equipo se asigna automáticamente:
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
                : 'No hay más estudiantes disponibles para esta tarea.'}
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

        <Toast
          visible={
            toast.visible
          }
          tipo={
            toast.tipo
          }
          titulo={
            toast.titulo
          }
          mensaje={
            toast.mensaje
          }
          duracion={
            5000
          }
          onCerrar={
            cerrarToast
          }
        />

        <footer className="afe-actions">
          <button
            type="button"
            className="afe-btn afe-btn--secondary"
            disabled={
              procesando
            }
            onClick={
              cerrarModal
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
              ? 'Creando equipo...'
              : 'Crear equipo'}
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
    height: min(760px, calc(100dvh - 32px));
    max-height: calc(100dvh - 32px);

    display: grid;
    grid-template-rows:
      auto
      auto
      auto
      auto
      auto
      minmax(0, 1fr)
      auto;
    gap: 10px;

    padding: 18px;

    overflow: hidden;

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
    width: 44px;
    height: 44px;
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
    margin: 3px 0 0;
    font-size: 18px;
    font-weight: 900;
  }

  .afe-head p {
    margin: 3px 0 0;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.5;
  }

  .afe-search {
    min-height: 40px;
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
    min-height: 54px;

    display: grid;
    grid-template-rows:
      auto
      minmax(
        30px,
        auto
      );
    gap: 6px;

    padding-bottom: 2px;
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
    min-height: 30px;

    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;

    position: relative;
    z-index: 1;
  }

  .afe-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 4px 7px 4px 9px;
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
    min-height: 58px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    gap: 2px;

    padding: 7px 10px;

    border: 1px solid var(--app-border);
    border-radius: 12px;

    background: var(--app-surface-alt);

    text-align: center;
  }

  .afe-summary span {
    order: 1;

    color: var(--app-text-muted);

    font-size: 8px;
    font-weight: 750;
    line-height: 1.2;
  }

  .afe-summary strong {
    order: 2;

    color: var(--app-text);

    font-size: 16px;
    font-weight: 900;
    line-height: 1.05;
  }

  .afe-summary small {
    order: 3;

    color: var(--app-text-muted);

    font-size: 7.5px;
    line-height: 1.15;
  }

  .afe-auto-line {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 9px;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 8.7px;
  }

  .afe-list {
    min-height: 0;
    height: 100%;

    display: grid;
    align-content: start;
    gap: 6px;

    overflow-y: auto;
    overscroll-behavior: contain;

    padding:
      2px
      3px
      2px
      0;

    border-top:
      1px solid
      var(--app-border-soft);
  }

  .afe-list {
    scrollbar-width: thin;
    scrollbar-color:
      var(--app-scrollbar-thumb)
      transparent;
  }

  .afe-list::-webkit-scrollbar {
    width: 7px;
  }

  .afe-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .afe-list::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: var(--app-scrollbar-thumb);
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
    width: 36px;
    height: 36px;
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

  .afe-empty {
    grid-column:
      1 / -1;

    padding: 12px;

    border-radius: 11px;

    color: var(--app-text-muted);

    background: var(--app-surface-alt);

    font-size: 9px;
    text-align: center;
  }

  .afe-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;

    padding-top: 2px;

    background: var(--app-surface);
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
    .afe-summary {
      gap: 6px;
    }

    .afe-summary > div {
      min-height: 54px;
      padding: 6px 7px;
    }

    .afe-summary strong {
      font-size: 15px;
    }

    .afe-modal {
      height: calc(100dvh - 20px);
      max-height: calc(100dvh - 20px);

      padding: 15px;

      gap: 8px;
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