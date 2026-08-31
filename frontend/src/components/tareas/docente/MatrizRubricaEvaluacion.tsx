import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Check,
  ClipboardList,
  Loader2,
} from 'lucide-react';

import {
  obtenerEvaluacionRubricaEntrega,
  obtenerRubricaTarea,
} from '../../../services/tareas/tareas-rubricas.service';

import type {
  RubricaItemCalificacion,
  RubricaTarea,
} from '../../../types/tareas/rubricas.types';

type Props = {
  cursoId: number;
  tareaId: number;
  entregaId: number;
  accessToken: string;
  onDatos: (
    datos:
      RubricaItemCalificacion[],
    nota:
      number | null,
  ) => void;
};

type Seleccion =
  | {
      nivelId:
        number;
      puntos:
        number;
      retroalimentacion:
        string;
    }
  | {
      nivelId:
        null;
      puntos:
        number;
      retroalimentacion:
        string;
    };

export default function MatrizRubricaEvaluacion(
  {
    cursoId,
    tareaId,
    entregaId,
    accessToken,
    onDatos,
  }:
    Props,
) {
  const [
    rubrica,
    setRubrica,
  ] =
    useState<RubricaTarea | null>(
      null,
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const onDatosRef =
    useRef(
      onDatos,
    );

  useEffect(
    () => {
      onDatosRef.current =
        onDatos;
    },
    [
      onDatos,
    ],
  );

  const [
    seleccion,
    setSeleccion,
  ] =
    useState<
      Partial<
        Record<
          number,
          Seleccion
        >
      >
    >(
      {},
    );

  useEffect(
    () => {
      let activo =
        true;

      Promise.all([
        obtenerRubricaTarea(
          cursoId,
          tareaId,
          accessToken,
        ),
        obtenerEvaluacionRubricaEntrega(
          cursoId,
          tareaId,
          entregaId,
          accessToken,
        ).catch(
          () =>
            null,
        ),
      ])
        .then(
          (
            [
              rubricaCargada,
              evaluacion,
            ],
          ) => {
            if (
              !activo
            ) {
              return;
            }

            if (
              !rubricaCargada
            ) {
              setRubrica(
                null,
              );
              onDatosRef.current(
                [],
                null,
              );
              setCargando(
                false,
              );
              return;
            }

            setRubrica(
              rubricaCargada,
            );

            const inicial =
              evaluacion?.items.reduce(
                (
                  mapa,
                  item,
                ) => {
                  mapa[
                    item.criterioId
                  ] = {
                    nivelId:
                      item.nivelId,
                    puntos:
                      item.puntosAsignados,
                    retroalimentacion:
                      item.retroalimentacion ??
                      '',
                  } as Seleccion;

                  return mapa;
                },
                {} as Partial<
                  Record<
                    number,
                    Seleccion
                  >
                >,
              ) ??
                {};

            setSeleccion(
              inicial,
            );
            setCargando(
              false,
            );
          },
        )
        .catch(
          () => {
            if (
              !activo
            ) {
              return;
            }

            setRubrica(
              null,
            );
            onDatosRef.current(
              [],
              null,
            );
            setCargando(
              false,
            );
          },
        );

      return () => {
        activo =
          false;
      };
    },
    [
      cursoId,
      tareaId,
      entregaId,
      accessToken,
    ],
  );

  useEffect(
    () => {
      if (
        !rubrica
      ) {
        return;
      }

      let nota =
        0;

      const items:
        RubricaItemCalificacion[] =
        rubrica.criterios
          .filter(
            (
              criterio,
            ) =>
              Boolean(
                seleccion[
                  criterio.id
                ],
              ),
          )
          .map(
            (
              criterio,
            ) => {
              const elegido =
                seleccion[
                  criterio.id
                ]!;

              nota +=
                elegido.puntos;

              return {
                criterioId:
                  criterio.id,
                nivelId:
                  elegido.nivelId ??
                  undefined,
                puntosAsignados:
                  elegido.puntos,
                retroalimentacion:
                  elegido.retroalimentacion.trim()
                    ? elegido.retroalimentacion
                    : undefined,
              };
            },
          );

      const estaCompleta =
        items.length ===
        rubrica.criterios.length;

      const notaFinal =
        estaCompleta
          ? Math.round(
              (nota /
                rubrica.ponderacionMax) *
                100 *
                100,
            ) /
            100
          : null;

      onDatosRef.current(
        items,
        notaFinal,
      );
    },
    [
      rubrica,
      seleccion,
    ],
  );

  if (
    cargando
  ) {
    return (
      <>
        <style>
          {estilos}
        </style>

        <div className="mre-mensaje">
          <Loader2
            className="mre-girando"
            size={17}
          />

          Cargando rúbrica…
        </div>
      </>
    );
  }

  if (
    !rubrica
  ) {
    return null;
  }

  const nivelesBase =
    rubrica.criterios.at(
      0,
    )?.niveles ?? [];

  const seleccionarNivel =
    (
      criterioId:
        number,
      nivelId:
        number,
      puntos:
        number,
    ) => {
      setSeleccion(
        (
          previo,
        ) => ({
          ...previo,
          [criterioId]: {
            nivelId,
            puntos,
            retroalimentacion:
              previo[
                criterioId
              ]?.retroalimentacion ??
              '',
          } as Seleccion,
        }),
      );
    };

  const cambiarPuntos =
    (
      criterioId:
        number,
      puntos:
        number,
    ) => {
      setSeleccion(
        (
          previo,
        ) => {
          const actual =
            previo[
              criterioId
            ];

          if (
            !actual
          ) {
            return previo;
          }

          return {
            ...previo,
            [criterioId]: {
              ...actual,
              puntos,
            },
          };
        },
      );
    };

  const cambiarRetro =
    (
      criterioId:
        number,
      retroalimentacion:
        string,
    ) => {
      setSeleccion(
        (
          previo,
        ) => {
          const actual =
            previo[
              criterioId
            ];

          if (
            !actual
          ) {
            return previo;
          }

          return {
            ...previo,
            [criterioId]: {
              ...actual,
              retroalimentacion,
            },
          };
        },
      );
    };

  const evaluados =
    rubrica.criterios.filter(
      (
        criterio,
      ) =>
        Boolean(
          seleccion[
            criterio.id
          ],
        ),
    ).length;

  const notaNumerica =
    rubrica.criterios.reduce(
      (
        suma,
        criterio,
      ) =>
        suma +
        Number(
          seleccion[
            criterio.id
          ]?.puntos ??
            0,
        ),
      0,
    );

  return (
    <>
      <style>
        {estilos}
      </style>

      <section className="mre">
        <header className="mre-cabecera">
        <div>
          <span className="mre-eyebrow">
            Evaluación por rúbrica
          </span>

          <h3>
            {rubrica.nombre}
          </h3>
        </div>

        {evaluados ===
          rubrica.criterios.length &&
          rubrica.criterios.length >
            0 && (
          <strong className="mre-nota">
            {Math.round(
              (notaNumerica /
                rubrica.ponderacionMax) *
                10000,
            ) /
              100}
            %
          </strong>
        )}
      </header>

      <div className="mre-tabla-scroll">
        <table className="mre-tabla">
          <thead>
            <tr>
              <th>
                Criterio
              </th>

              {nivelesBase.map(
                (
                  nivel,
                ) => (
                  <th
                    key={
                      nivel.id
                    }
                  >
                    {
                      nivel.etiqueta
                    }

                    <small>
                      {nivel.puntos}
                      {' '}
                      pts
                    </small>
                  </th>
                ),
              )}

              <th>
                Puntos
              </th>

              <th>
                Retroalimentación
              </th>
            </tr>
          </thead>

          <tbody>
            {rubrica.criterios.map(
              (
                criterio,
              ) => {
                const elegido =
                  seleccion[
                    criterio.id
                  ];

                return (
                  <tr
                    key={
                      criterio.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          criterio.nombre
                        }
                      </strong>

                      <small>
                        Peso:{' '}
                        {
                          criterio.peso
                        }
                        %
                      </small>
                    </td>

                    {criterio.niveles.map(
                      (
                        nivel,
                      ) => {
                        const activo =
                          elegido?.nivelId ===
                          nivel.id;

                        return (
                          <td
                            key={
                              nivel.id
                            }
                          >
                            <button
                              type="button"
                              className={
                                `mre-nivel${activo ? ' mre-nivel--activo' : ''}`
                              }
                              title={
                                nivel.descripcion ??
                                nivel.etiqueta
                              }
                              onClick={() =>
                                seleccionarNivel(
                                  criterio.id,
                                  nivel.id,
                                  nivel.puntos,
                                )
                              }
                            >
                              {activo && (
                                <Check
                                  size={14}
                                />
                              )}

                              {
                                nivel.descripcion ??
                                  nivel.etiqueta
                              }
                            </button>
</td>
                          );
                        },
                      )}

                    <td>
                      <input
                        type="number"
                        min={
                          0
                        }
                        max={
                          criterio.peso
                        }
                        value={
                          elegido?.puntos ??
                          0
                        }
                        disabled={
                          !elegido
                        }
                        onChange={(
                          evento,
                        ) =>
                          cambiarPuntos(
                            criterio.id,
                            Number(
                              evento.target
                                .value,
                            ),
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        placeholder={
                          elegido
                            ? 'Comentario del criterio'
                            : 'Selecciona un nivel'
                        }
                        value={
                          elegido?.retroalimentacion ??
                          ''
                        }
                        disabled={
                          !elegido
                        }
                        onChange={(
                          evento,
                        ) =>
                          cambiarRetro(
                            criterio.id,
                            evento.target
                              .value,
                          )
                        }
                      />
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>

      <footer className="mre-pie">
        <ClipboardList
          size={16}
        />

        <span>
          Marca un nivel por criterio. La nota se calcula al
          completar todos los criterios y se añade al campo Nota
          base.
        </span>
      </footer>
      </section>
    </>
  );
}

const estilos = `
.mre {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface-raised);
}

.mre-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mre-eyebrow {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-accent-dark);
}

.mre-cabecera h3 {
  margin: 4px 0 0;
  font-size: 0.9375rem;
  color: var(--app-text);
}

.mre-nota {
  font-size: 1.05rem;
  color: var(--app-success-strong);
}

.mre-tabla-scroll {
  overflow-x: auto;
}

.mre-tabla {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.mre-tabla th,
.mre-tabla td {
  padding: 8px;
  border: 1px solid var(--app-border-soft);
  font-size: 0.75rem;
  color: var(--app-text-secondary);
  vertical-align: top;
  min-width: 110px;
}

.mre-tabla th {
  background: var(--app-surface-alt);
  color: var(--app-text);
  font-weight: 600;
}

.mre-tabla th small {
  display: block;
  font-weight: 500;
  color: var(--app-text-muted);
}

.mre-tabla td strong {
  display: block;
  color: var(--app-text);
}

.mre-tabla td small {
  color: var(--app-text-muted);
}

.mre-tabla td input {
  width: 100%;
  min-width: 96px;
  padding: 7px 9px;
  border: 1px solid var(--app-input-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-input-bg);
  color: var(--app-text);
  font-size: 0.8125rem;
}

.mre-nivel {
  display: inline-flex;
  align-items: flex-start;
  gap: 5px;
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-sm);
  background: var(--app-surface-alt);
  color: var(--app-text-secondary);
  font-size: 0.75rem;
  text-align: left;
  cursor: pointer;
}

.mre-nivel:hover {
  border-color: var(--app-accent);
  color: var(--app-text);
}

.mre-nivel--activo {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
  color: var(--app-accent-dark);
  font-weight: 600;
}

.mre-pie {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-text-muted);
  font-size: 0.75rem;
}

.mre-mensaje {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-text-soft);
  font-size: 0.8125rem;
  padding: 10px 0;
}

.mre-girando {
  animation: mre-rotar 0.8s linear infinite;
}

@keyframes mre-rotar {
  to {
    transform: rotate(360deg);
  }
}
`;