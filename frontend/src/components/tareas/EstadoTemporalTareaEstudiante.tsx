import {
  Clock3,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  TareaCurso,
} from '../../types/tareas/tareas.types';

type Nivel =
  | 'normal'
  | 'urgente'
  | 'critico'
  | 'finalizado';

type Tiempo = {
  texto:
    string;
  nivel:
    Nivel;
};

function fecha(
  valor?:
    string | null,
) {
  if (!valor) {
    return 'Sin definir';
  }

  const objeto =
    new Date(
      valor,
    );

  if (
    Number.isNaN(
      objeto.getTime(),
    )
  ) {
    return 'Sin definir';
  }

  return new Intl.DateTimeFormat(
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
    objeto,
  );
}

function formatearTiempo(
  milisegundos:
    number,
): Tiempo {
  if (
    milisegundos <=
    0
  ) {
    return {
      texto:
        'Plazo finalizado',
      nivel:
        'finalizado',
    };
  }

  const totalSegundos =
    Math.floor(
      milisegundos /
      1000,
    );

  const dias =
    Math.floor(
      totalSegundos /
      86400,
    );

  const horas =
    Math.floor(
      (
        totalSegundos %
        86400
      ) /
      3600,
    );

  const minutos =
    Math.floor(
      (
        totalSegundos %
        3600
      ) /
      60,
    );

  const segundos =
    totalSegundos %
    60;

  const texto =
    dias >
    0
      ? `${dias} d ${horas} h ${minutos} min ${segundos} s`
      : horas >
        0
        ? `${horas} h ${minutos} min ${segundos} s`
        : `${minutos} min ${segundos} s`;

  const nivel =
    milisegundos <=
    60 *
      60 *
      1000
      ? 'critico'
      : milisegundos <=
        24 *
          60 *
          60 *
          1000
        ? 'urgente'
        : 'normal';

  return {
    texto,
    nivel,
  };
}

function penalizacion(
  tarea:
    TareaCurso,
) {
  const tipo =
    tarea.tipoDescuentoRetraso;

  const numero =
    Number(
      tarea.valorDescuentoRetraso ??
      0,
    );

  if (
    tipo ===
      'NINGUNO'
  ) {
    return 'Sin penalización';
  }

  if (
    tipo ===
      'PORCENTAJE'
  ) {
    return `Penalización: −${numero}% de la nota`;
  }

  if (
    tipo ===
      'PUNTOS_FIJOS'
  ) {
    return `Penalización: −${numero} punto${numero === 1 ? '' : 's'}`;
  }

  if (
    tipo ===
      'POR_HORA'
  ) {
    return `Penalización: −${numero} punto${numero === 1 ? '' : 's'} por hora`;
  }

  if (
    tipo ===
      'POR_DIA'
  ) {
    return `Penalización: −${numero} punto${numero === 1 ? '' : 's'} por día`;
  }

  if (
    tipo ===
      'NOTA_MAXIMA'
  ) {
    return `Nota máxima por retraso: ${numero}`;
  }

  return null;
}

export type EstadoTemporalTarea = {
  disponible:
    boolean;
  tardia:
    boolean;
  cerrada:
    boolean;
  antesApertura:
    boolean;
};

type Props = {
  tarea:
    TareaCurso;

  onEstado?:
    (
      estado:
        EstadoTemporalTarea,
    ) => void;
};

export default function EstadoTemporalTareaEstudiante({
  tarea,
  onEstado,
}: Props) {
  const [
    ahora,
    setAhora,
  ] =
    useState(
      () =>
        Date.now(),
    );

  useEffect(
    () => {
      const intervalo =
        window.setInterval(
          () => {
            setAhora(
              Date.now(),
            );
          },
          1000,
        );

      return () => {
        window.clearInterval(
          intervalo,
        );
      };
    },
    [],
  );

  const datos =
    useMemo(
      () => {
        const apertura =
          new Date(
            tarea.fechaApertura,
          ).getTime();

        const limite =
          new Date(
            tarea.fechaLimite,
          ).getTime();

        const cierreNormal =
          new Date(
            tarea.fechaCierre,
          ).getTime();

        const cierreRetraso =
          new Date(
            tarea.fechaMaximaRetraso ??
            tarea.fechaCierre,
          ).getTime();

        const cierreEfectivo =
          tarea.permitirRetrasos
            ? cierreRetraso
            : cierreNormal;

        const antesApertura =
          ahora <
          apertura;

        const limiteVencido =
          ahora >=
          limite;

        const cerrada =
          tarea.estado ===
            'CERRADA' ||
          tarea.estado ===
            'ANULADA' ||
          ahora >=
            cierreEfectivo;

        const tardia =
          !cerrada &&
          tarea.permitirRetrasos &&
          limiteVencido;


        if (
          antesApertura
        ) {
          const tiempo =
            formatearTiempo(
              apertura -
              ahora,
            );

          return {
            nivel:
              tiempo.nivel,
            tituloPrincipal:
              'Apertura de la tarea',
            valorPrincipal:
              fecha(
                tarea.fechaApertura,
              ),
            contadorEtiqueta:
              'Tiempo para abrir',
            contador:
              tiempo.texto,
            contadorFecha:
              fecha(
                tarea.fechaApertura,
              ),
            estadoTexto:
              'Disponible próximamente',
            mostrarPenalizacion:
              false,
            disponible:
              false,
            tardia:
              false,
            cerrada:
              false,
            antesApertura:
              true,
          };
        }

        if (
          cerrada
        ) {
          return {
            nivel:
              'finalizado' as Nivel,
            tituloPrincipal:
              'Estado temporal',
            valorPrincipal:
              'Actividad finalizada',
            contadorEtiqueta:
              'Estado de la tarea',
            contador:
              'Plazo finalizado',
            contadorFecha:
              fecha(
                tarea.permitirRetrasos
                  ? tarea.fechaMaximaRetraso ??
                    tarea.fechaCierre
                  : tarea.fechaCierre,
              ),
            estadoTexto:
              'Entrega cerrada',
            mostrarPenalizacion:
              false,
            disponible:
              false,
            tardia:
              false,
            cerrada:
              true,
            antesApertura:
              false,
          };
        }

        if (
          tardia
        ) {
          const objetivo =
            tarea.fechaMaximaRetraso ??
            tarea.fechaCierre;

          const tiempo =
            formatearTiempo(
              new Date(
                objetivo,
              ).getTime() -
              ahora,
            );

          return {
            nivel:
              tiempo.nivel,
            tituloPrincipal:
              'Entrega habilitada',
            valorPrincipal:
              'Período con retraso',
            contadorEtiqueta:
              'Cierre con retraso',
            contador:
              tiempo.texto,
            contadorFecha:
              fecha(
                objetivo,
              ),
            estadoTexto:
              'Disponible con retraso',
            mostrarPenalizacion:
              true,
            disponible:
              true,
            tardia:
              true,
            cerrada:
              false,
            antesApertura:
              false,
          };
        }

        const tiempo =
          formatearTiempo(
            limite -
            ahora,
          );

        return {
          nivel:
            tiempo.nivel,
          tituloPrincipal:
            'Tarea disponible',
          valorPrincipal:
            'Entrega habilitada',
          contadorEtiqueta:
            'Cierre normal',
          contador:
            tiempo.texto,
          contadorFecha:
            fecha(
              tarea.fechaLimite,
            ),
          estadoTexto:
            'Disponible para entregar',
          mostrarPenalizacion:
            false,
          disponible:
            true,
          tardia:
            false,
          cerrada:
            false,
          antesApertura:
            false,
        };
      },
      [
        ahora,
        tarea,
      ],
    );

  useEffect(
    () => {
      onEstado?.({
        disponible:
          datos.disponible,
        tardia:
          datos.tardia,
        cerrada:
          datos.cerrada,
        antesApertura:
          datos.antesApertura,
      });
    },
    [
      datos.antesApertura,
      datos.cerrada,
      datos.disponible,
      datos.tardia,
      onEstado,
    ],
  );

  return (
    <section
      className={`ete-state ete-state--${datos.nivel} ${
        datos.cerrada
          ? 'is-closed'
          : ''
      }`}
    >
      <div className="ete-state__main">
        <span className="ete-state__icon">
          <Clock3
            size={19}
          />
        </span>

        <div className="ete-state__date">
          <small>
            {
              datos.tituloPrincipal
            }
          </small>

          <strong>
            {
              datos.valorPrincipal
            }
          </strong>
        </div>
      </div>

      <div className="ete-state__timers">
        <div
          className={`ete-timer-card ${
            datos.tardia
              ? 'ete-timer-card--late'
              : ''
          }`}
        >
          <small>
            {
              datos.contadorEtiqueta
            }
          </small>

          <strong>
            {
              datos.contador
            }
          </strong>

          <span>
            {
              datos.contadorFecha
            }
          </span>

          {datos.mostrarPenalizacion && (
            <em className="ete-timer-card__penalty">
              {
                penalizacion(
                  tarea,
                )
              }
            </em>
          )}
        </div>
      </div>

      <span className="ete-state__status">
        {
          datos.estadoTexto
        }
      </span>

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .ete-state {
    display: grid;
    grid-template-columns:
      minmax(
        220px,
        .8fr
      )
      minmax(
        0,
        1.5fr
      )
      auto;

    align-items: stretch;
    gap: 10px;

    padding:
      10px
      12px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      16px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);
  }

  .ete-state__main {
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ete-state__icon {
    width: 44px;
    height: 44px;

    display: grid;
    place-items: center;

    flex:
      0
      0
      44px;

    border-radius:
      11px;

    color:
      var(
        --dte-color,
        var(--app-accent-dark)
      );

    background:
      var(
        --dte-fondo,
        var(--app-accent-soft)
      );
  }

  .ete-state__date {
    min-width: 0;

    display: grid;
    gap: 2px;
  }

  .ete-state small {
    color:
      var(--app-text-muted);

    font-size:
      10px;

    font-weight:
      650;
  }

  .ete-state strong {
    font-size:
      13px;

    font-weight:
      850;

    line-height:
      1.2;

    font-variant-numeric:
      tabular-nums;
  }

  .ete-state__timers {
    min-width: 0;

    display: grid;

    grid-template-columns:
      repeat(
        auto-fit,
        minmax(
          180px,
          1fr
        )
      );

    gap: 8px;
  }

  .ete-timer-card {
    min-width: 0;

    display: grid;
    align-content: center;
    gap: 4px;

    padding:
      10px
      13px;

    border:
      1px solid
      var(--app-border-soft);

    border-radius:
      11px;

    background:
      var(--app-surface-alt);
  }

  .ete-timer-card strong {
    color:
      var(
        --dte-color,
        var(--app-accent-dark)
      );

    font-size:
      13.5px;

    font-weight:
      900;

    letter-spacing:
      -.01em;

    white-space:
      nowrap;
  }

  .ete-timer-card > span {
    color:
      var(--app-text-muted);

    font-size:
      9px;

    font-weight:
      650;
  }

  .ete-timer-card--late {
    border-color:
      color-mix(
        in srgb,
        var(--app-warning) 28%,
        var(--app-border)
      );

    background:
      color-mix(
        in srgb,
        var(--app-warning-bg) 65%,
        var(--app-surface)
      );
  }

  .ete-timer-card--late strong {
    color:
      var(--app-warning);
  }

  .ete-timer-card__penalty {
    width: fit-content;

    margin-top: 4px;

    padding:
      4px
      7px;

    border-radius:
      999px;

    color:
      var(--app-warning);

    background:
      color-mix(
        in srgb,
        var(--app-warning-bg) 82%,
        var(--app-surface)
      );

    font-size:
      9px;

    font-style:
      normal;

    font-weight:
      850;

    line-height:
      1.2;
  }

  .ete-state--urgente
  .ete-timer-card:not(
    .ete-timer-card--late
  )
  strong {
    color:
      var(--app-warning);
  }

  .ete-state--critico
  .ete-timer-card:not(
    .ete-timer-card--late
  )
  strong {
    color:
      var(--app-danger);
  }

  .ete-state__status {
    align-self: center;
    justify-self: end;

    padding:
      8px
      12px;

    border-radius:
      999px;

    color:
      var(--app-success);

    background:
      var(--app-success-bg);

    font-size:
      10px;

    font-weight:
      850;

    white-space:
      nowrap;
  }

  .ete-state.is-closed
  .ete-state__status {
    color:
      var(--app-text-muted);

    background:
      var(--app-surface-disabled);
  }

  .ete-state.is-closed
  .ete-timer-card strong {
    color:
      var(--app-text-muted);
  }

  @media (
    max-width:
      700px
  ) {
    .ete-state {
      grid-template-columns:
        1fr;
    }

    .ete-state__timers {
      grid-template-columns:
        1fr;
    }

    .ete-state__status {
      justify-self:
        stretch;

      text-align:
        center;
    }
  }
`; 