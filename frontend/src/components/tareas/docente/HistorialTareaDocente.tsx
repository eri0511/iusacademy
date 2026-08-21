import {
  FileClock,
  History,
} from 'lucide-react';

import type {
  RespuestaHistorialTarea,
} from '../../../types/tareas/tarea-docente-seguimiento.types';

type Props = {
  historial:
    RespuestaHistorialTarea | null;
};

export default function HistorialTareaDocente({
  historial,
}: Props) {
  const eventos =
    historial?.eventos ??
    [];

  if (
    eventos.length ===
    0
  ) {
    return (
      <div className="htd-empty">
        <History
          size={25}
        />
        <strong>
          Sin movimientos registrados
        </strong>
        <p>
          Las entregas, ediciones y calificaciones aparecerán aquí.
        </p>

        <style>
          {styles}
        </style>
      </div>
    );
  }

  return (
    <div className="htd">
      {eventos.map(
        (
          evento,
        ) => (
          <article
            key={
              evento.id
            }
          >
            <span>
              <FileClock
                size={16}
              />
            </span>

            <div>
              <strong>
                {
                  evento.titulo
                }
              </strong>

              <p>
                {
                  evento.descripcion
                }
              </p>
            </div>

            <time>
              {new Intl.DateTimeFormat(
                'es-BO',
                {
                  day:
                    '2-digit',

                  month:
                    '2-digit',

                  year:
                    'numeric',

                  hour:
                    '2-digit',

                  minute:
                    '2-digit',

                  hour12:
                    false,
                },
              ).format(
                new Date(
                  evento.fecha,
                ),
              )}
            </time>
          </article>
        ),
      )}

      <style>
        {styles}
      </style>
    </div>
  );
}

const styles = `
  .htd {
    display: grid;
  }

  .htd article {
    display: grid;
    grid-template-columns:
      38px minmax(0, 1fr) auto;
    align-items: flex-start;
    gap: 9px;
    padding: 11px 4px;
    border-bottom: 1px solid var(--app-border);
  }

  .htd article > span {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .htd strong {
    font-size: var(--app-font-md);
  }

  .htd p {
    margin: 3px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    line-height: var(--app-line-normal);
  }

  .htd time {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    white-space: nowrap;
  }

  .htd-empty {
    display: grid;
    justify-items: center;
    gap: 5px;
    padding: 30px;
    color: var(--app-text-muted);
    text-align: center;
  }

  .htd-empty strong {
    color: var(--app-text);
    font-size: var(--app-font-section);
  }

  .htd-empty p {
    margin: 0;
    font-size: var(--app-font-sm);
  }

  @media (max-width: 650px) {
    .htd article {
      grid-template-columns:
        38px minmax(0, 1fr);
    }

    .htd time {
      grid-column: 2;
    }
  }
`;
