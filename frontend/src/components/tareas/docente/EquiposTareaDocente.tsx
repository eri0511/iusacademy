import {
  Crown,
  FileCheck2,
  UsersRound,
} from 'lucide-react';

import type {
  CSSProperties,
} from 'react';

import AvatarUsuario from '../../shared/AvatarUsuario';

import type {
  PanelEvaluacionTarea,
} from '../../../types/tareas/tarea-docente-seguimiento.types';

type Props = {
  panel:
    PanelEvaluacionTarea;
};

const COLORES_EQUIPO = [
  '#2563eb',
  '#16a34a',
  '#f18b4b',
  '#7c3aed',
  '#db2777',
  '#0891b2',
] as const;

function nombreCorto(
  nombres:
    string,
  apellidoPaterno:
    string,
) {
  const primerNombre =
    nombres
      .trim()
      .split(
        /\s+/,
      )[0] ??
    '';

  const primerApellido =
    apellidoPaterno
      .trim()
      .split(
        /\s+/,
      )[0] ??
    '';

  return `${primerNombre} ${primerApellido}`.trim();
}

function estadoEntrega(
  estado:
    string,
) {
  const etiquetas:
    Record<string, string> =
    {
      PENDIENTE:
        'Pendiente',
      BORRADOR:
        'Borrador',
      ENTREGADA:
        'Entregada',
      TARDIA:
        'Tardía',
      BLOQUEADA:
        'Bloqueada',
      ANULADA:
        'Anulada',
    };

  return (
    etiquetas[
      estado
    ] ??
    estado
  );
}

export default function EquiposTareaDocente({
  panel,
}: Props) {
  if (
    panel.equipos.length ===
    0
  ) {
    return (
      <div className="eqtd-empty">
        <UsersRound
          size={25}
        />
        <strong>
          No hay equipos registrados
        </strong>
        <p>
          Esta tarea todavía no tiene equipos disponibles para mostrar.
        </p>

        <style>
          {styles}
        </style>
      </div>
    );
  }

  return (
    <div className="eqtd">
      <header className="eqtd-heading">
        <div>
          <span className="eqtd-heading__icon">
            <UsersRound
              size={20}
            />
          </span>

          <div>
            <h3>
              Equipos de la tarea
            </h3>

            <p>
              Revisa integrantes, representante y estado de la entrega oficial.
            </p>
          </div>
        </div>

        <strong>
          {panel.equipos.length}{' '}
          {panel.equipos.length ===
          1
            ? 'grupo'
            : 'grupos'}
        </strong>
      </header>

      <div className="eqtd-grid">
        {panel.equipos.map(
          (
            equipo,
            indice,
          ) => {
            const representante =
              equipo.integrantes.find(
                (
                  integrante,
                ) =>
                  integrante.esRepresentante,
              );

            const color =
              COLORES_EQUIPO[
                indice %
                COLORES_EQUIPO.length
              ];

            const estado =
              equipo.estadoEntrega.toLowerCase();

            return (
              <article
                key={`${equipo.tipo}-${equipo.id}`}
                className="eqtd-card"
                style={
                  {
                    '--team-color':
                      color,
                  } as CSSProperties
                }
              >
                <header className="eqtd-card__header">
                  <span className="eqtd-card__identifier">
                    G{indice + 1}
                  </span>

                  <div>
                    <small>
                      {equipo.tipo ===
                      'PLATAFORMA'
                        ? 'Grupo de plataforma'
                        : 'Equipo por afinidad'}
                    </small>

                    <h4>
                      {
                        equipo.nombre
                      }
                    </h4>

                    <span>
                      {equipo.integrantes.length}{' '}
                      {equipo.integrantes.length ===
                      1
                        ? 'integrante'
                        : 'integrantes'}
                    </span>
                  </div>

                  <span
                    className={`eqtd-delivery is-${estado}`}
                  >
                    {
                      estadoEntrega(
                        equipo.estadoEntrega,
                      )
                    }
                  </span>
                </header>

                <div className="eqtd-members">
                  {equipo.integrantes.map(
                    (
                      integrante,
                    ) => (
                      <article
                        key={
                          integrante.estudiante.id
                        }
                        className="eqtd-member"
                      >
                        <AvatarUsuario
                          fotoPerfilUrl={
                            integrante.estudiante.fotoPerfilUrl
                          }
                          nombres={
                            integrante.estudiante.nombres
                          }
                          apellidoPaterno={
                            integrante.estudiante.apellidoPaterno
                          }
                          size={44}
                          className="eqtd-member__avatar"
                        />

                        <div className="eqtd-member__data">
                          <strong>
                            {nombreCorto(
                              integrante.estudiante.nombres,
                              integrante.estudiante.apellidoPaterno,
                            )}
                          </strong>

                          <small>
                            {integrante.esRepresentante
                              ? 'Representante'
                              : 'Integrante'}
                          </small>
                        </div>

                        {integrante.esRepresentante && (
                          <span className="eqtd-member__role">
                            <Crown
                              size={12}
                            />
                            Representante
                          </span>
                        )}
                      </article>
                    ),
                  )}
                </div>

                <footer className="eqtd-card__footer">
                  <span>
                    Origen:{' '}
                    <strong>
                      {equipo.tipo ===
                      'PLATAFORMA'
                        ? 'Plataforma'
                        : 'Afinidad'}
                    </strong>
                  </span>

                  {representante && (
                    <span>
                      Representante:{' '}
                      <strong>
                        {nombreCorto(
                          representante.estudiante.nombres,
                          representante.estudiante.apellidoPaterno,
                        )}
                      </strong>
                    </span>
                  )}

                  <span
                    className={`eqtd-footer-delivery is-${estado}`}
                  >
                    <FileCheck2
                      size={13}
                    />
                    Entrega:{' '}
                    <strong>
                      {
                        estadoEntrega(
                          equipo.estadoEntrega,
                        )
                      }
                    </strong>
                  </span>
                </footer>
              </article>
            );
          },
        )}
      </div>

      <style>
        {styles}
      </style>
    </div>
  );
}

const styles = `
  .eqtd {
    display: grid;
    gap: 11px;
  }

  .eqtd-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 16px;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
  }

  .eqtd-heading > div {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .eqtd-heading__icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex: 0 0 44px;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .eqtd-heading h3,
  .eqtd-heading p {
    margin: 0;
  }

  .eqtd-heading h3 {
    font-size: var(--app-font-section);
    font-weight: var(--app-font-black);
  }

  .eqtd-heading p {
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .eqtd-heading > strong {
    color: var(--app-accent-dark);
    font-size: var(--app-font-sm);
  }

  .eqtd-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 11px;
    align-items: start;
  }

  .eqtd-card {
    position: relative;
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .eqtd-card::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 4px;
    background: var(--team-color);
  }

  .eqtd-card__header {
    min-height: 78px;
    display: grid;
    grid-template-columns:
      48px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 14px 15px 12px;
  }

  .eqtd-card__identifier {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border: 1px solid
      color-mix(
        in srgb,
        var(--team-color) 36%,
        var(--app-border)
      );
    border-radius: 14px;
    color: var(--team-color);
    background:
      color-mix(
        in srgb,
        var(--team-color) 10%,
        var(--app-surface)
      );
    font-size: var(--app-font-section);
    font-weight: var(--app-font-black);
  }

  .eqtd-card__header > div {
    min-width: 0;
  }

  .eqtd-card__header small {
    display: block;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .eqtd-card__header h4 {
    margin: 3px 0 0;
    font-size: var(--app-font-section);
    font-weight: var(--app-font-black);
  }

  .eqtd-card__header div > span {
    display: block;
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .eqtd-delivery {
    min-height: 27px;
    display: inline-flex;
    align-items: center;
    padding: 5px 9px;
    border-radius: 999px;
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
    white-space: nowrap;
  }

  .eqtd-delivery.is-entregada {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .eqtd-delivery.is-tardia {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .eqtd-delivery.is-borrador {
    color: var(--app-info);
    background: var(--app-info-bg);
  }

  .eqtd-delivery.is-pendiente,
  .eqtd-delivery.is-bloqueada {
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .eqtd-delivery.is-anulada {
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .eqtd-members {
    padding: 0 14px;
  }

  .eqtd-member {
    min-height: 64px;
    display: grid;
    grid-template-columns:
      44px minmax(0, 1fr) auto;
    gap: 11px;
    align-items: center;
    padding: 9px 0;
    border-top: 1px solid var(--app-border-soft);
  }

  .eqtd-member:first-child {
    border-top: 0;
  }

  .eqtd-member__avatar .ius-avatar__surface {
    border-color:
      color-mix(
        in srgb,
        var(--team-color) 38%,
        var(--app-border)
      ) !important;
  }

  .eqtd-member__avatar .ius-avatar__initials,
  .eqtd-member__avatar .ius-avatar__surface > span {
    color:
      var(--team-color) !important;
  }

  .eqtd-member__data {
    min-width: 0;
  }

  .eqtd-member__data strong,
  .eqtd-member__data small {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .eqtd-member__data strong {
    font-size: var(--app-font-md);
  }

  .eqtd-member__data small {
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .eqtd-member__role {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 9px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--team-color) 26%,
        var(--app-border)
      );
    border-radius: 999px;
    color: var(--team-color);
    background:
      color-mix(
        in srgb,
        var(--team-color) 7%,
        var(--app-surface)
      );
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
    white-space: nowrap;
  }

  .eqtd-card__footer {
    min-height: 40px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
    padding: 9px 16px 10px;
    border-top: 1px solid var(--app-border-soft);
    color: var(--app-text-muted);
    background: var(--app-surface-alt);
    font-size: var(--app-font-xs);
  }

  .eqtd-card__footer strong {
    color: var(--app-text-secondary);
  }

  .eqtd-footer-delivery {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .eqtd-footer-delivery.is-entregada {
    color: var(--app-success);
  }

  .eqtd-footer-delivery.is-tardia,
  .eqtd-footer-delivery.is-anulada {
    color: var(--app-danger);
  }

  .eqtd-footer-delivery.is-pendiente,
  .eqtd-footer-delivery.is-bloqueada {
    color: var(--app-warning);
  }

  .eqtd-empty {
    display: grid;
    justify-items: center;
    gap: 5px;
    padding: 30px;
    color: var(--app-text-muted);
    text-align: center;
  }

  .eqtd-empty strong {
    color: var(--app-text);
    font-size: var(--app-font-section);
  }

  .eqtd-empty p {
    margin: 0;
    font-size: var(--app-font-sm);
  }

  @media (max-width: 760px) {
    .eqtd-grid {
      grid-template-columns: 1fr;
    }

    .eqtd-card__header {
      grid-template-columns:
        48px minmax(0, 1fr);
    }

    .eqtd-delivery {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .eqtd-member {
      grid-template-columns:
        44px minmax(0, 1fr);
    }

    .eqtd-member__role {
      grid-column: 2;
      justify-self: start;
    }

    .eqtd-footer-delivery {
      width: 100%;
      margin-left: 0;
    }
  }
`;
