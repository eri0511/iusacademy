import {
  useMemo,
  useState,
} from 'react';

import {
  Award,
  Clock3,
  ListChecks,
  RotateCcw,
  Sparkles,
  Timer,
} from 'lucide-react';

import {
  estimarMinutosExposicion,
  parsearRespuestaExposicion,
  pesoTotalCriterios,
  totalPalabrasExposicion,
} from '../../utils/tareas/exposicion';

import type {
  ConfiguracionExposicion,
  RespuestaExposicionEstado,
} from '../../utils/tareas/exposicion';

type Props = {
  config:
    ConfiguracionExposicion;
  contenido: string;
  puntajeMaximo: number;
  onSugerida: (
    nota:
      number,
  ) => void;
};

export default function EvaluacionExposicionDocente(
  {
    config,
    contenido,
    puntajeMaximo,
    onSugerida,
  }: Props,
) {
  const estado =
    useMemo<
      RespuestaExposicionEstado | null
    >(
      () =>
        parsearRespuestaExposicion(
          contenido,
        ),
      [
        contenido,
      ],
    );

  const [
    puntajes,
    setPuntajes,
  ] =
    useState<
      Record<
        number,
        number
      >
    >(
      () => {
        const inicial:
          Record<
            number,
            number
          > =
          {};

        config.criterios.forEach(
          (
            criterio,
          ) => {
            inicial[
              criterio.id ??
                0
            ] =
              0;
          },
        );

        return inicial;
      },
    );

  const [
    tiempoObservado,
    setTiempoObservado,
  ] =
    useState(
      '',
    );

  const totalPeso =
    pesoTotalCriterios(
      config.criterios,
    );

  const puntajeObtenido =
    config.criterios.reduce(
      (
        suma,
        criterio,
      ) =>
        suma +
        Math.min(
          criterio.peso,
          Math.max(
            0,
            puntajes[
              criterio.id ??
                0
            ] ??
              0,
          ),
        ),
      0,
    );

  const notaSugerida =
    totalPeso >
      0
      ? Math.min(
          puntajeMaximo,
          (
            puntajeObtenido /
            totalPeso
          ) *
            puntajeMaximo,
        )
      : 0;

  const totalPalabras =
    estado
      ? totalPalabrasExposicion(
          estado,
        )
      : 0;

  const minutosEstimados =
    estado
      ? estimarMinutosExposicion(
          totalPalabras,
        )
      : 0;

  const sinPuntajes =
    config.criterios.every(
      (
        criterio,
      ) =>
        (
          puntajes[
            criterio.id ??
              0
          ] ??
            0
        ) ===
        0,
    );

  const registrarPuntaje =
    (
      id:
        number | undefined,
      valor:
        number,
    ) =>
      setPuntajes(
        (
          actual,
        ) => {
          const criterio =
            config.criterios.find(
              (
                item,
              ) =>
                item.id ===
                id,
            );

          const maximo =
            criterio?.peso ??
            0;

          return {
            ...actual,
            [id ?? 0]:
              Math.max(
                0,
                Math.min(
                  maximo,
                  Math.round(
                    valor *
                      10,
                  ) /
                      10,
                ),
              ),
          };
        },
      );

  const restablecer =
    () => {
      const vacio:
        Record<
          number,
          number
        > =
        {};

      config.criterios.forEach(
        (
          criterio,
        ) => {
          vacio[
            criterio.id ??
              0
          ] =
            0;
        },
      );

      setPuntajes(
        vacio,
      );

      setTiempoObservado(
        '',
      );
    };

  const tiempoObservadoNum =
    Number(
      tiempoObservado,
    );

  return (
    <section className="eexd">
      <div className="eexd__encabezado">
        <span className="eexd__icono">
          <Award
            size={17}
          />
        </span>

        <div>
          <strong>
            Evaluación de exposición
          </strong>

          <small>
            Asigna un puntaje por criterio y aplica la nota sugerida como base.
          </small>
        </div>
      </div>

      {estado && (
        <div className="eexd__metadatos">
          <span>
            <Clock3
              size={13}
            />

            Guión de {
              totalPalabras
            } palabras · ~{
              minutosEstimados
            } min
          </span>

          <span>
            <ListChecks
              size={13}
            />

            Checklist {
              estado.checklist.filter(
                (
                  item,
                ) =>
                  item.cumplido,
              ).length
            }{
              '/' 
            }
            {
              estado.checklist.length
            }
          </span>

          <span
            className={
              estado.preparacionConfirmada
                ? 'ok'
                : ''
            }
          >
            <ListChecks
              size={13}
            />

            {
              estado.preparacionConfirmada
                ? 'Confirmó estar listo'
                : 'No confirmó preparación'
            }
          </span>

          <span>
            <Timer
              size={13}
            />

            Previsto: {
              config.duracionPorExpositorMin
            } min + {
              config.pausaEntreTurnosMin
            } min de pausa
          </span>
        </div>
      )}

      <div className="eexd__criterios">
        {config.criterios.map(
          (
            criterio,
          ) => (
            <div
              key={
                criterio.id
              }
              className="eexd__criterio"
            >
              <div className="eexd__criterio-fila">
                <div>
                  <strong>
                    {
                      criterio.titulo
                    }
                  </strong>

                  <small>
                    Hasta {
                      criterio.peso
                    } pts · Total {
                      totalPeso
                    }
                  </small>
                </div>

                <input
                  type="number"
                  min={0}
                  max={
                    criterio.peso
                  }
                  step={0.5}
                  value={
                    puntajes[
                      criterio.id ??
                        0
                    ] ??
                      0
                  }
                  onChange={(
                    evento,
                  ) =>
                    registrarPuntaje(
                      criterio.id,
                      Number(
                        evento.target
                          .value,
                      ) ||
                        0,
                    )
                  }
                />
              </div>

              {criterio.descripcion.trim() && (
                <p>
                  {
                    criterio.descripcion
                  }
                </p>
              )}
            </div>
          ),
        )}
      </div>

      <label className="eexd__tiempo">
        <span>
          Tiempo real observado en aula (min)
        </span>

        <input
          type="number"
          min={0}
          max={240}
          value={
            tiempoObservado
          }
          placeholder="—"
          onChange={(
            evento,
          ) =>
            setTiempoObservado(
              evento.target
                .value,
            )
          }
        />

        {Number.isFinite(
          tiempoObservadoNum,
        ) &&
          tiempoObservadoNum >
            0 && (
            <small
              className={
                tiempoObservadoNum >
                  config.duracionPorExpositorMin
                  ? 'aviso'
                  : 'ok'
              }
            >
              {
                tiempoObservadoNum >
                  config.duracionPorExpositorMin
                  ? `Se excedió en ${tiempoObservadoNum - config.duracionPorExpositorMin} min del límite previsto.`
                  : `Dentro del límite previsto de ${config.duracionPorExpositorMin} min.`
              }
            </small>
          )}
      </label>

      <div className="eexd__resumen">
        <div>
          <small>
            Puntaje acumulado
          </small>

          <strong>
            {
              puntajeObtenido.toFixed(
                1,
              )
            }{' '}
            / {
              totalPeso
            }
          </strong>
        </div>

        <div>
          <small>
            Nota sugerida
          </small>

          <strong>
            {
              notaSugerida.toFixed(
                1,
              )
            }{' '}
            / {
              puntajeMaximo
            }
          </strong>
        </div>
      </div>

      <div className="eexd__acciones">
        <button
          type="button"
          className="eexd__aplicar"
          disabled={
            sinPuntajes
          }
          onClick={() =>
            onSugerida(
              Math.round(
                notaSugerida *
                  2,
              ) /
                2,
            )
          }
        >
          <Sparkles
            size={15}
          />

          Aplicar como nota base
        </button>

        <button
          type="button"
          className="eexd__limpiar"
          onClick={
            restablecer
          }
        >
          <RotateCcw
            size={14}
          />

          Limpiar
        </button>
      </div>

      {estilos}
    </section>
  );
}

const estilos = (
  <style>{`
    .eexd {
      display: flex;
      flex-direction: column;
      gap: 12px;
      border: 1px solid rgba(138,107,77,0.28);
      border-radius: 12px;
      padding: 13px 14px;
      background: rgba(138,107,77,0.05);
    }

    .eexd__encabezado {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .eexd__icono {
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: var(--app-primario, #8a6b4d);
      color: #fff;
    }

    .eexd__encabezado strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .eexd__encabezado small {
      display: block;
      font-size: 11.5px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eexd__metadatos {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .eexd__metadatos span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border-radius: 999px;
      padding: 3px 9px;
      font-size: 10.5px;
      font-weight: 600;
      background: rgba(120,110,95,0.08);
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eexd__metadatos span.ok {
      background: rgba(35,132,83,0.12);
      color: #238453;
    }

    .eexd__criterios {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .eexd__criterio {
      display: flex;
      flex-direction: column;
      gap: 4px;
      border: 1px solid rgba(120,110,95,0.2);
      border-radius: 9px;
      padding: 9px 11px;
      background: rgba(255,255,255,0.5);
    }

    .eexd__criterio-fila {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .eexd__criterio-fila > div {
      display: flex;
      flex-direction: column;
    }

    .eexd__criterio-fila strong {
      font-size: 12.5px;
      color: var(--app-texto, #2b2b2b);
    }

    .eexd__criterio-fila small {
      font-size: 10.5px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eexd__criterio-fila input {
      width: 72px;
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 7px;
      padding: 6px 8px;
      font-size: 13px;
      text-align: right;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .eexd__criterio p {
      margin: 0;
      font-size: 11px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eexd__tiempo {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }

    .eexd__tiempo > span {
      flex-basis: 100%;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--app-texto, #2b2b2b);
    }

    .eexd__tiempo input {
      width: 90px;
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 7px;
      padding: 6px 8px;
      font-size: 13px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .eexd__tiempo small {
      font-size: 11px;
      font-weight: 600;
    }

    .eexd__tiempo small.ok {
      color: #238453;
    }

    .eexd__tiempo small.aviso {
      color: #b25927;
    }

    .eexd__resumen {
      display: flex;
      gap: 10px;
    }

    .eexd__resumen > div {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      border-radius: 9px;
      padding: 8px;
      background: rgba(138,107,77,0.08);
    }

    .eexd__resumen small {
      font-size: 10.5px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eexd__resumen strong {
      font-size: 15px;
      color: var(--app-primario, #8a6b4d);
    }

    .eexd__acciones {
      display: flex;
      gap: 8px;
    }

    .eexd__aplicar {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: 0;
      border-radius: 9px;
      padding: 9px 12px;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      background: var(--app-primario, #8a6b4d);
      cursor: pointer;
    }

    .eexd__aplicar:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .eexd__limpiar {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border: 0;
      border-radius: 9px;
      padding: 9px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--app-texto-suave, #6b6b6b);
      background: rgba(120,110,95,0.1);
      cursor: pointer;
    }
  `}</style>
);