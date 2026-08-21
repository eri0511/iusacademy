import {
  CalendarDays,
  Check,
} from 'lucide-react';

import type {
  HitoAula,
} from '../../types/aulaCurso.types';

type SelectorHitosProps = {
  hitos: HitoAula[];
  hitoSeleccionadoId: number | null;
  onSeleccionar: (
    hito:
      HitoAula,
  ) => void;
};

const clasesHitos = [
  'violeta',
  'naranja',
  'azul',
  'verde',
  'rosado',
];

function formatearFechaCorta(
  fecha:
    string,
): string {
  const valor =
    new Date(
      fecha,
    );

  if (
    Number.isNaN(
      valor.getTime(),
    )
  ) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',

      month:
        'short',
    },
  )
    .format(
      valor,
    )
    .replace(
      '.',
      '',
    );
}

function calcularDuracionDias(
  fechaInicio:
    string,
  fechaFin:
    string,
): number {
  const inicio =
    new Date(
      fechaInicio,
    );

  const fin =
    new Date(
      fechaFin,
    );

  if (
    Number.isNaN(
      inicio.getTime(),
    ) ||
    Number.isNaN(
      fin.getTime(),
    )
  ) {
    return 0;
  }

  return Math.max(
    Math.floor(
      (
        fin.getTime() -
        inicio.getTime()
      ) /
        86400000,
    ) +
      1,
    0,
  );
}

export default function SelectorHitos({
  hitos,
  hitoSeleccionadoId,
  onSeleccionar,
}: SelectorHitosProps) {
  const totalHitos =
    hitos.length;

  const hitosFinalizados =
    hitos.filter(
      (
        hito,
      ) =>
        hito.estado ===
        'FINALIZADO',
    ).length;

  const hitoActual =
    hitos.find(
      (
        hito,
      ) =>
        hito.estado ===
        'EN_CURSO',
    ) ??
    null;

  const todosFinalizados =
    totalHitos >
      0 &&
    hitosFinalizados ===
      totalHitos;

  return (
    <section className="selector-hitos">
      <header className="selector-hitos__encabezado">
        <div>
          <span className="selector-hitos__eyebrow">
            Organización académica
          </span>

          <h2>
            Hitos del curso
          </h2>

          <p>
            Selecciona un hito para revisar sus contenidos, actividades y evaluaciones.
          </p>
        </div>

        <div className="selector-hitos__resumen">
          <div className="selector-hitos__contador">
            <strong>
              {hitosFinalizados}
              /
              {totalHitos}
            </strong>

            <span>
              finalizados
            </span>
          </div>

          <div
            className={`selector-hitos__estado-general ${
              hitoActual
                ? 'activo'
                : todosFinalizados
                  ? 'finalizado'
                  : 'proximo'
            }`}
          >
            <span className="selector-hitos__estado-punto" />

            {hitoActual
              ? `${hitoActual.codigo} en curso`
              : todosFinalizados
                ? 'Semestre finalizado'
                : 'Semestre próximo'}
          </div>
        </div>
      </header>

      <div className="selector-hitos__grid">
        {hitos.map(
          (
            hito,
            indice,
          ) => {
            const seleccionado =
              hito.id ===
              hitoSeleccionadoId;

            const esActual =
              hito.estado ===
              'EN_CURSO';

            const finalizado =
              hito.estado ===
              'FINALIZADO';

            const clase =
              clasesHitos[
                indice
              ] ??
              'violeta';

            const duracion =
              calcularDuracionDias(
                hito.fechaInicio,
                hito.fechaFin,
              );

            return (
              <button
                key={
                  hito.id
                }
                type="button"
                className={`selector-hito ${clase} ${
                  esActual
                    ? 'actual'
                    : ''
                } ${
                  finalizado
                    ? 'finalizado'
                    : ''
                } ${
                  seleccionado
                    ? 'seleccionado'
                    : ''
                }`}
                aria-pressed={
                  seleccionado
                }
                onClick={() =>
                  onSeleccionar(
                    hito,
                  )
                }
              >
                <div className="selector-hito__barra" />

                <div className="selector-hito__cabecera">
                  <span className="selector-hito__codigo">
                    {finalizado ? (
                      <Check
                        size={16}
                      />
                    ) : (
                      hito.codigo
                    )}
                  </span>

                  <div className="selector-hito__fechas">
                    <CalendarDays
                      size={13}
                    />

                    <span>
                      {formatearFechaCorta(
                        hito.fechaInicio,
                      )}
                      {' — '}
                      {formatearFechaCorta(
                        hito.fechaFin,
                      )}
                    </span>
                  </div>
                </div>

                <div className="selector-hito__contenido">
                  <span className="selector-hito__numero">
                    HITO
                    {' '}
                    {hito.numero}
                  </span>

                  <strong>
                    {hito.nombre}
                  </strong>

                  <small>
                    {duracion >
                    0
                      ? `${duracion} días calendario`
                      : 'Duración no disponible'}
                  </small>
                </div>

                {seleccionado && (
                  <span className="selector-hito__viendo">
                    Seleccionado
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
  );
}

const styles = `
  .selector-hitos {
    position: relative;
    padding: 22px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .selector-hitos::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 4px;
    background:
      linear-gradient(
        90deg,
        #7c3aed,
        #ea580c,
        #2563eb,
        #16a34a,
        #db2777
      );
  }

  .selector-hitos__encabezado {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .selector-hitos__eyebrow {
    color: var(--app-accent-dark);
    font-size: 11px;
    font-weight: 850;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  .selector-hitos__encabezado h2 {
    margin: 5px 0 0;
    color: var(--app-text);
    font-size: 24px;
    font-weight: 900;
  }

  .selector-hitos__encabezado p {
    margin: 5px 0 0;
    color: var(--app-text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .selector-hitos__resumen {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-shrink: 0;
  }

  .selector-hitos__contador {
    min-width: 82px;
    padding: 8px 11px;
    border: 1px solid var(--app-border-soft);
    border-radius: 13px;
    background: var(--app-surface-alt);
    text-align: center;
  }

  .selector-hitos__contador strong,
  .selector-hitos__contador span {
    display: block;
  }

  .selector-hitos__contador strong {
    color: var(--app-text);
    font-size: 18px;
  }

  .selector-hitos__contador span {
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .selector-hitos__estado-general {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 850;
  }

  .selector-hitos__estado-general.activo {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .selector-hitos__estado-general.proximo {
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
  }

  .selector-hitos__estado-general.finalizado {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .selector-hitos__estado-punto {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--hito-color);
  }

  .selector-hitos__grid {
    display: grid;
    grid-template-columns:
      repeat(
        5,
        minmax(
          0,
          1fr
        )
      );
    gap: 9px;
  }

  .selector-hito {
    --hito-color: #7c3aed;
    position: relative;
    min-width: 0;
    min-height: 154px;
    display: flex;
    flex-direction: column;
    padding: 15px;
    overflow: hidden;
    border: 1px solid var(--app-border-soft);
    border-radius: 16px;
    color: var(--app-text);
    background: var(--app-surface-alt);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      transform .18s ease,
      border-color .18s ease,
      box-shadow .18s ease,
      background .18s ease;
  }

  .selector-hito:hover {
    transform: translateY(-2px);
    border-color: var(--hito-color);
    box-shadow:
      0 12px 24px
      color-mix(
        in srgb,
        var(--hito-color) 11%,
        transparent
      );
  }

  .selector-hito.seleccionado {
    border-color: var(--hito-color);
    background:
      color-mix(
        in srgb,
        var(--hito-color) 7%,
        var(--app-surface)
      );
    box-shadow:
      0 12px 25px
      color-mix(
        in srgb,
        var(--hito-color) 13%,
        transparent
      );
  }

  .selector-hito.actual {
    border-width: 2px;
    border-color: var(--hito-color);
    background:
      color-mix(
        in srgb,
        var(--hito-color) 10%,
        var(--app-surface)
      );
    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--hito-color) 12%,
        transparent
      ),
      0 16px 30px
      color-mix(
        in srgb,
        var(--hito-color) 15%,
        transparent
      );
  }

  .selector-hito.finalizado {
    opacity: .67;
  }

  .selector-hito__barra {
    position: absolute;
    inset: 0 0 auto;
    height: 4px;
    background: var(--hito-color);
  }

  .selector-hito.actual
  .selector-hito__barra {
    height: 6px;
  }

  .selector-hito.violeta {
    --hito-color: #7c3aed;
  }

  .selector-hito.naranja {
    --hito-color: #ea580c;
  }

  .selector-hito.azul {
    --hito-color: #2563eb;
  }

  .selector-hito.verde {
    --hito-color: #16a34a;
  }

  .selector-hito.rosado {
    --hito-color: #db2777;
  }


  .selector-hito__cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 7px;
  }

  .selector-hito__codigo {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 11px;
    color: var(--hito-color);
    background:
      color-mix(
        in srgb,
        var(--hito-color) 12%,
        var(--app-surface)
      );
    font-size: 12px;
    font-weight: 900;
  }

  .selector-hito.actual
  .selector-hito__codigo {
    color: #fff;
    background: var(--hito-color);
  }

  .selector-hito__fechas {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
    color: var(--app-text-muted);
  }

  .selector-hito__fechas span {
    overflow: hidden;
    font-size: 9px;
    font-weight: 750;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .selector-hito__contenido {
    margin-top: 15px;
  }

  .selector-hito__numero {
    display: block;
    color: var(--hito-color);
    font-size: 15px;
    font-weight: 950;
    letter-spacing: -.02em;
  }

  .selector-hito.actual
  .selector-hito__numero {
    font-size: 16px;
  }

  .selector-hito__contenido strong {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: var(--app-text);
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .selector-hito__contenido small {
    display: block;
    margin-top: 5px;
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .selector-hito__viendo {
    position: absolute;
    right: 10px;
    bottom: 9px;
    padding: 4px 7px;
    border-radius: 999px;
    color: var(--hito-color);
    background:
      color-mix(
        in srgb,
        var(--hito-color) 12%,
        var(--app-surface)
      );
    font-size: 9px;
    font-weight: 900;
  }

  @media (max-width: 1100px) {
    .selector-hitos__grid {
      grid-template-columns:
        repeat(
          3,
          minmax(
            0,
            1fr
          )
        );
    }
  }

  @media (max-width: 760px) {
    .selector-hitos__encabezado {
      align-items: flex-start;
      flex-direction: column;
    }

    .selector-hitos__resumen {
      width: 100%;
      justify-content: space-between;
    }

    .selector-hitos__grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 520px) {
    .selector-hitos {
      padding: 15px;
    }

    .selector-hitos__grid {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .selector-hito {
      transition: none !important;
    }
  }
`;