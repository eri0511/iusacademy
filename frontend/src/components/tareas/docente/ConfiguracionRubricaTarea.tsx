import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ClipboardList,
  FileSpreadsheet,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import AulaModal from '../../aula/AulaModal';
import Toast, {
  type TipoToast,
} from '../../shared/Toast';

import {
  useAuth,
} from '../../../auth/AuthContext';

import {
  crearRubricaTarea,
  eliminarRubricaTarea,
  importarRubricaExcel,
  obtenerRubricaTarea,
} from '../../../services/tareas/tareas-rubricas.service';

import type {
  CrearRubricaDatos,
  OrigenRubrica,
  RubricaCriterioForm,
  RubricaNivelForm,
  RubricaTarea,
} from '../../../types/tareas/rubricas.types';

type Props = {
  cursoId: number;
  tareaId: number;
  abierto: boolean;
  onCerrar: () => void;
  onCambio?: () => void;
};

type EstadoToast =
  | {
      visible:
        boolean;
      tipo:
        TipoToast;
      titulo:
        string;
      mensaje?:
        string;
    }
  | null;

const borradorInicial =
  (): CrearRubricaDatos => ({
    nombre:
      'Rúbrica de evaluación',
    origen:
      'MANUAL',
    ponderacionMax:
      100,
    criterios: [
      {
        orden:
          0,
        nombre:
          'Criterio 1',
        descripcion:
          '',
        peso:
          100,
        niveles: [
          {
            orden:
              0,
            etiqueta:
              'Insuficiente',
            puntos:
              0,
            descripcion:
              '',
          },
          {
            orden:
              1,
            etiqueta:
              'Logrado',
            puntos:
              75,
            descripcion:
              '',
          },
          {
            orden:
              2,
            etiqueta:
              'Excelente',
            puntos:
              100,
            descripcion:
              '',
          },
        ],
      },
    ],
  });

const aBorrador =
  (
    rubrica:
      RubricaTarea,
  ): CrearRubricaDatos =>
    ({
      nombre:
        rubrica.nombre,
      origen:
        rubrica.origen,
      ponderacionMax:
        rubrica.ponderacionMax,
      criterios:
        rubrica.criterios.map(
          (
            criterio,
          ) =>
            ({
              orden:
                criterio.orden,
              nombre:
                criterio.nombre,
              descripcion:
                criterio.descripcion,
              peso:
                criterio.peso,
              niveles:
                criterio.niveles.map(
                  (
                    nivel,
                  ) =>
                    ({
                      orden:
                        nivel.orden,
                      etiqueta:
                        nivel.etiqueta,
                      puntos:
                        nivel.puntos,
                      descripcion:
                        nivel.descripcion,
                    }),
                ),
            }),
        ),
    });

function numero(
  valor:
    string,
): number {
  const numero =
    Number(
      valor
        .replace(
          ',',
          '.',
        )
        .trim(),
    );

  return Number.isFinite(
    numero,
  )
    ? numero
    : 0;
}

function redondear(
  valor:
    number,
): number {
  return (
    Math.round(
      valor *
        100,
    ) /
    100
  );
}

export default function ConfiguracionRubricaTarea(
  {
    cursoId,
    tareaId,
    abierto,
    onCerrar,
    onCambio,
  }:
    Props,
) {
  const {
    accessToken,
  } =
    useAuth();

  const [
    rubricaExistente,
    setRubricaExistente,
  ] =
    useState<RubricaTarea | null>(
      null,
    );

  const [
    modo,
    setModo,
  ] =
    useState<
      'cargando' | 'ver' | 'editar'
    >(
      'cargando',
    );

  const [
    borrador,
    setBorrador,
  ] =
    useState<CrearRubricaDatos>(
      borradorInicial,
    );

  const [
    guardando,
    setGuardando,
  ] =
    useState(
      false,
    );

  const [
    toast,
    setToast,
  ] =
    useState<EstadoToast>(
      null,
    );

  const archivoRef =
    useRef<HTMLInputElement>(
      null,
    );

  useEffect(
    () => {
      if (
        !abierto
      ) {
        return;
      }

      let activo =
        true;

      setModo(
        'cargando',
      );

      obtenerRubricaTarea(
        cursoId,
        tareaId,
        accessToken ?? '',
      )
        .then(
          (
            rubrica,
          ) => {
            if (
              !activo
            ) {
              return;
            }

            setRubricaExistente(
              rubrica,
            );

            if (
              rubrica
            ) {
              setBorrador(
                aBorrador(
                  rubrica,
                ),
              );
              setModo(
                'ver',
              );
            } else {
              setBorrador(
                borradorInicial(),
              );
              setModo(
                'editar',
              );
            }
          },
        )
        .catch(
          (
            error,
          ) => {
            if (
              !activo
            ) {
              return;
            }

            setToast({
              visible:
                true,
              tipo:
                'error',
              titulo:
                'Error al cargar la rúbrica',
              mensaje:
                error instanceof
                  Error
                  ? error.message
                  : 'No se pudo consultar la rúbrica',
            });
            setModo(
              'editar',
            );
          },
        );

      return () => {
        activo =
          false;
      };
    },
    [
      abierto,
      cursoId,
      tareaId,
      accessToken,
    ],
  );

  const sumaPesos =
    redondear(
      borrador.criterios.reduce(
        (
          suma,
          criterio,
        ) =>
          suma +
          criterio.peso,
        0,
      ),
    );

  const ponderacion =
    redondear(
      borrador.ponderacionMax ??
        100,
    );

  const pesosCoinciden =
    Math.abs(
      sumaPesos -
      ponderacion,
    ) <=
      0.5;

  const cambiarCriterio =
    (
      indice:
        number,
      cambios:
        Partial<RubricaCriterioForm>,
    ) => {
      setBorrador(
        (
          previo,
        ) => {
          const criterios =
            previo.criterios.map(
              (
                criterio,
                posicion,
              ) =>
                posicion ===
                indice
                  ? {
                      ...criterio,
                      ...cambios,
                    }
                  : criterio,
            );

          return {
            ...previo,
            criterios,
          };
        },
      );
    };

  const cambiarNivel =
    (
      indiceCriterio:
        number,
      indiceNivel:
        number,
      cambios:
        Partial<RubricaNivelForm>,
    ) => {
      const criterio =
        borrador.criterios[
          indiceCriterio
        ];

      setBorrador(
        {
          ...borrador,
          criterios:
            borrador.criterios.map(
              (
                item,
              ) =>
                item.orden ===
                criterio.orden
                  ? {
                      ...item,
                      niveles:
                        item.niveles.map(
                          (
                            nivel,
                            posicion,
                          ) =>
                            posicion ===
                            indiceNivel
                              ? {
                                  ...nivel,
                                  ...cambios,
                                }
                              : nivel,
                        ),
                    }
                  : item,
            ),
        },
      );
    };

  const agregarCriterio =
    () => {
      const pesoSugerido =
        redondear(
          ponderacion /
            (borrador.criterios.length +
              1),
        );

      const nuevos =
        borrador.criterios.map(
          (
            criterio,
          ) => ({
            ...criterio,
            peso:
              redondear(
                criterio.peso *
                  (pesoSugerido /
                    sumaPesos),
              ),
          }),
        );

      nuevos.push(
        {
          orden:
            nuevos.length,
          nombre:
            `Criterio ${nuevos.length + 1}`,
          descripcion:
            '',
          peso:
            pesoSugerido,
          niveles: [
            {
              orden:
                0,
              etiqueta:
                'Insuficiente',
              puntos:
                0,
              descripcion:
                '',
            },
            {
              orden:
                1,
              etiqueta:
                'Logrado',
              puntos:
                redondear(
                  pesoSugerido /
                    2,
                ),
              descripcion:
                '',
            },
            {
              orden:
                2,
              etiqueta:
                'Excelente',
              puntos:
                pesoSugerido,
              descripcion:
                '',
            },
          ],
        },
      );

      setBorrador(
        {
          ...borrador,
          criterios:
            nuevos,
        },
      );
    };

  const eliminarCriterio =
    (
      indice:
        number,
    ) => {
      setBorrador(
        (
          previo,
        ) => ({
          ...previo,
          criterios:
            previo.criterios
              .filter(
                (
                  _,
                  posicion,
                ) =>
                  posicion !==
                  indice,
              )
              .map(
                (
                  criterio,
                  posicion,
                ) => ({
                  ...criterio,
                  orden:
                    posicion,
                }),
              ),
        }),
      );
    };

  const agregarNivel =
    (
      indiceCriterio:
        number,
    ) => {
      const criterio =
        borrador.criterios[
          indiceCriterio
        ];

      const nivel:
        RubricaNivelForm = {
          orden:
            criterio.niveles.length,
          etiqueta:
            `Nivel ${criterio.niveles.length + 1}`,
          puntos:
            redondear(
              (Number(
                criterio.niveles.at(
                  -1,
                )?.puntos ??
                  0,
              ) +
                criterio.peso) /
                2,
            ),
          descripcion:
            '',
        };

      setBorrador(
        (
          previo,
        ) => ({
          ...previo,
          criterios:
            previo.criterios.map(
              (
                item,
              ) =>
                item.orden ===
                criterio.orden
                  ? {
                      ...item,
                      niveles: [
                        ...item.niveles,
                        nivel,
                      ],
                    }
                  : item,
            ),
        }),
      );
    };

  const eliminarNivel =
    (
      indiceCriterio:
        number,
      indiceNivel:
        number,
    ) => {
      const criterio =
        borrador.criterios[
          indiceCriterio
        ];

      const criteriosActualizados =
        borrador.criterios.map(
          (
            item,
          ) => {
            if (
              item.orden !==
              criterio.orden
            ) {
              return item;
            }

            const nivelesActualizados =
              item.niveles
                .filter(
                  (
                    _,
                    posicion,
                  ) =>
                    posicion !==
                    indiceNivel,
                )
                .map(
                  (
                    nivel,
                    posicion,
                  ) => ({
                    ...nivel,
                    orden:
                      posicion,
                  }),
                );

            return {
              ...item,
              niveles:
                nivelesActualizados,
            };
          },
        );

      setBorrador(
        (
          previo,
        ) => ({
          ...previo,
          criterios:
            criteriosActualizados,
        }),
      );
    };

  const alElegirExcel =
    async (
      archivo:
        File | undefined,
    ) => {
      if (
        !archivo
      ) {
        return;
      }

      setGuardando(
        true,
      );

      try {
        const importado =
          await importarRubricaExcel(
            cursoId,
            tareaId,
            archivo,
            accessToken ?? '',
          );

        setBorrador(
          importado,
        );
        setModo(
          'editar',
        );

        setToast({
          visible:
            true,
          tipo:
            'exito',
          titulo:
            'Rúbrica importada',
          mensaje:
            'Revisa los criterios y niveles importados antes de guardar',
        });
      } catch (
        error
      ) {
        setToast({
          visible:
            true,
          tipo:
            'error',
          titulo:
            'No se pudo importar el Excel',
          mensaje:
            error instanceof
              Error
              ? error.message
              : 'Verifica el formato del archivo',
        });
      } finally {
        setGuardando(
          false,
        );

        if (
          archivoRef.current
        ) {
          archivoRef.current.value =
            '';
        }
      }
    };

  const guardar =
    async () => {
      setGuardando(
        true,
      );

      try {
        const guardada =
          await crearRubricaTarea(
            cursoId,
            tareaId,
            {
              ...borrador,
              ponderacionMax:
                ponderacion,
            },
            accessToken ?? '',
          );

        setRubricaExistente(
          guardada,
        );
        setBorrador(
          aBorrador(
            guardada,
          ),
        );
        setModo(
          'ver',
        );
        onCambio?.();

        setToast({
          visible:
            true,
          tipo:
            'exito',
          titulo:
            'Rúbrica guardada',
        });
      } catch (
        error
      ) {
        setToast({
          visible:
            true,
          tipo:
            'error',
          titulo:
            'Error al guardar la rúbrica',
          mensaje:
            error instanceof
              Error
              ? error.message
              : 'Intenta nuevamente',
        });
      } finally {
        setGuardando(
          false,
        );
      }
    };

  const eliminar =
    async () => {
      setGuardando(
        true,
      );

      try {
        await eliminarRubricaTarea(
          cursoId,
          tareaId,
          accessToken ?? '',
        );

        setRubricaExistente(
          null,
        );
        setBorrador(
          borradorInicial(),
        );
        setModo(
          'editar',
        );
        onCambio?.();

        setToast({
          visible:
            true,
          tipo:
            'exito',
          titulo:
            'Rúbrica eliminada',
        });
      } catch (
        error
      ) {
        setToast({
          visible:
            true,
          tipo:
            'error',
          titulo:
            'Error al eliminar la rúbrica',
          mensaje:
            error instanceof
              Error
              ? error.message
              : 'Intenta nuevamente',
        });
      } finally {
        setGuardando(
          false,
        );
      }
    };

  const origenEtiqueta =
    (
      origen:
        OrigenRubrica,
    ) =>
      origen ===
      'EXCEL'
        ? 'Importada de Excel'
        : 'Manual';

  return (
    <>
      <AulaModal
        abierto={
          abierto
        }
        titulo="Rúbrica de evaluación"
        etiqueta="Tareas"
        descripcion="Define los criterios que el docente usará para calificar esta tarea, o impórtalos desde un archivo Excel."
        icono={
          ClipboardList
        }
        ancho="amplio"
        bloqueado={
          guardando
        }
        onCerrar={
          onCerrar
        }
        footer={
          <div className="cr-footer">
            {modo ===
              'editar' && (
              <>
                {!rubricaExistente && (
                  <button
                    type="button"
                    className="secundario"
                    disabled={
                      guardando
                    }
                    onClick={
                      onCerrar
                    }
                  >
                    Cancelar
                  </button>
                )}

                {rubricaExistente && (
                  <button
                    type="button"
                    className="secundario"
                    disabled={
                      guardando
                    }
                    onClick={() =>
                      setModo(
                        'ver',
                      )
                    }
                  >
                    Volver
                  </button>
                )}

                <button
                  type="button"
                  className="primario"
                  disabled={
                    guardando ||
                    borrador.criterios.length ===
                      0 ||
                    !pesosCoinciden
                  }
                  onClick={
                    guardar
                  }
                >
                  <Save
                    size={
                      16
                    }
                  />

                  Guardar rúbrica
                </button>
              </>
            )}

            {modo ===
              'ver' && (
              <button
                type="button"
                className="primario"
                onClick={
                  onCerrar
                }
              >
                Cerrar
              </button>
            )}
          </div>
        }
      >
        <div className="cr-cuerpo">
          {modo ===
            'cargando' && (
            <p className="cr-aviso">
              Consultando la rúbrica…
            </p>
          )}

          {modo ===
            'ver' &&
            rubricaExistente && (
              <>
                <div className="cr-cabecera">
                  <div>
                    <h3>
                      {
                        rubricaExistente.nombre
                      }
                    </h3>

                    <p>
                      Origen:{' '}
                      {origenEtiqueta(
                        rubricaExistente.origen,
                      )}{' '}
                      · Ponderación máxima:{' '}
                      {
                        rubricaExistente.ponderacionMax
                      }
                      %
                    </p>
                  </div>

                  <div className="cr-acciones">
                    <button
                      type="button"
                      className="secundario"
                      disabled={
                        guardando
                      }
                      onClick={() =>
                        setModo(
                          'editar',
                        )
                      }
                    >
                      <Save
                        size={
                          16
                        }
                      />

                      Rediseñar
                    </button>

                    <button
                      type="button"
                      className="secundario"
                      disabled={
                        guardando
                      }
                      onClick={() =>
                        archivoRef.current?.click()
                      }
                    >
                      <Upload
                        size={
                          16
                        }
                      />

                      Importar Excel
                    </button>

                    <button
                      type="button"
                      className="danger"
                      disabled={
                        guardando
                      }
                      onClick={
                        eliminar
                      }
                    >
                      <Trash2
                        size={
                          16
                        }
                      />

                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="cr-tabla-scroll">
                  <table className="cr-tabla">
                    <thead>
                      <tr>
                        <th>
                          Criterio
                        </th>

                        {rubricaExistente.criterios.at(
                          0,
                        )?.niveles.map(
                          (
                            nivel,
                          ) => (
                            <th
                              key={
                                nivel.id
                              }
                              className="cr-nivel-th"
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
                          Peso
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {rubricaExistente.criterios.map(
                        (
                          criterio,
                        ) => (
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

                              {criterio.descripcion && (
                                <small>
                                  {
                                    criterio.descripcion
                                  }
                                </small>
                              )}
                            </td>

                            {criterio.niveles.map(
                              (
                                nivel,
                              ) => (
                                <td
                                  key={
                                    nivel.id
                                  }
                                >
                                  {
                                    nivel.descripcion
                                  }
                                </td>
                              ),
                            )}

                            <td>
                              {
                                criterio.peso
                              }
                              %
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <input
                  ref={
                    archivoRef
                  }
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={(
                    evento,
                  ) =>
                    alElegirExcel(
                      evento.target
                        .files?.[0],
                    )
                  }
                />
              </>
            )}

          {modo ===
            'editar' && (
              <>
                <div className="cr-editor-encabezado">
                  <label>
                    <span>
                      Nombre de la rúbrica
                    </span>

                    <input
                      type="text"
                      value={
                        borrador.nombre
                      }
                      maxLength={
                        160
                      }
                      onChange={(
                        evento,
                      ) =>
                        setBorrador(
                          (
                            previo,
                          ) => ({
                            ...previo,
                            nombre:
                              evento.target
                                .value,
                          }),
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Ponderación máxima (%)
                    </span>

                    <input
                      type="number"
                      min={
                        1
                      }
                      max={
                        100
                      }
                      value={
                        borrador.ponderacionMax
                      }
                      onChange={(
                        evento,
                      ) =>
                        setBorrador(
                          (
                            previo,
                          ) => ({
                            ...previo,
                            ponderacionMax:
                              numero(
                                evento.target
                                  .value,
                              ),
                          }),
                        )
                      }
                    />
                  </label>

                  <div className="cr-importar">
                    <span>
                      ¿Tienes una rúbrica en Excel?
                    </span>

                    <button
                      type="button"
                      className="secundario"
                      disabled={
                        guardando
                      }
                      onClick={() =>
                        archivoRef.current?.click()
                      }
                    >
                      <FileSpreadsheet
                        size={
                          16
                        }
                      />

                      {rubricaExistente
                        ? 'Reemplazar desde Excel'
                        : 'Importar desde Excel'}
                    </button>

                    <input
                      ref={
                        archivoRef
                      }
                      type="file"
                      accept=".xlsx,.xls"
                      hidden
                      onChange={(
                        evento,
                      ) =>
                        alElegirExcel(
                          evento.target
                            .files?.[0],
                        )
                      }
                    />
                  </div>
                </div>

                {!pesosCoinciden && (
                  <p className="cr-aviso cr-aviso--alerta">
                    La suma de pesos ({sumaPesos}%)
                    {' '}
                    no coincide con la ponderación
                    máxima ({ponderacion}%). Ajusta
                    los pesos para poder guardar.
                  </p>
                )}

                <div className="cr-criterios">
                  {borrador.criterios.map(
                    (
                      criterio,
                      indice,
                    ) => (
                      <div
                        className="cr-criterio"
                        key={
                          criterio.orden
                        }
                      >
                        <div className="cr-criterio-cabecera">
                          <div className="cr-criterio-titulo">
                            <strong>
                              {
                                criterio.nombre
                              }
                            </strong>

                            <input
                              type="text"
                              placeholder="Nombre del criterio"
                              value={
                                criterio.nombre
                              }
                              maxLength={
                                160
                              }
                              onChange={(
                                evento,
                              ) =>
                                cambiarCriterio(
                                  indice,
                                  {
                                    nombre:
                                      evento.target
                                        .value,
                                  },
                                )
                              }
                            />

                            <input
                              type="text"
                              placeholder="Descripción (opcional)"
                              value={
                                criterio.descripcion ??
                                ''
                              }
                              maxLength={
                                500
                              }
                              onChange={(
                                evento,
                              ) =>
                                cambiarCriterio(
                                  indice,
                                  {
                                    descripcion:
                                      evento.target
                                        .value,
                                  },
                                )
                              }
                            />
                          </div>

                          <div className="cr-peso-editor">
                            <label>
                              Peso
                              <input
                                type="number"
                                min={
                                  0
                                }
                                max={
                                  100
                                }
                                value={
                                  criterio.peso
                                }
                                onChange={(
                                  evento,
                                ) =>
                                  cambiarCriterio(
                                    indice,
                                    {
                                      peso:
                                        numero(
                                          evento.target
                                            .value,
                                        ),
                                    },
                                  )
                                }
                              />
                              %
                            </label>

                            <button
                              type="button"
                              className="icono"
                              disabled={
                                borrador.criterios.length ===
                                1
                              }
                              title="Eliminar criterio"
                              onClick={() =>
                                eliminarCriterio(
                                  indice,
                                )
                              }
                            >
                              <Trash2
                                size={
                                  16
                                }
                              />
                            </button>
                          </div>
                        </div>

                        <div className="cr-niveles">
                          {criterio.niveles.map(
                            (
                              nivel,
                              indiceNivel,
                            ) => (
                              <div
                                className="cr-nivel"
                                key={
                                  nivel.orden
                                }
                              >
                                <label>
                                  Nivel
                                  <input
                                    type="text"
                                    placeholder="Etiqueta del nivel"
                                    value={
                                      nivel.etiqueta
                                    }
                                    maxLength={
                                      80
                                    }
                                    onChange={(
                                      evento,
                                    ) =>
                                      cambiarNivel(
                                        indice,
                                        indiceNivel,
                                        {
                                          etiqueta:
                                            evento
                                              .target
                                              .value,
                                        },
                                      )
                                    }
                                  />
                                </label>

                                <label>
                                  Puntos
                                  <input
                                    type="number"
                                    min={
                                      0
                                    }
                                    max={
                                      criterio.peso
                                    }
                                    value={
                                      nivel.puntos
                                    }
                                    onChange={(
                                      evento,
                                    ) =>
                                      cambiarNivel(
                                        indice,
                                        indiceNivel,
                                        {
                                          puntos:
                                            numero(
                                              evento
                                                .target
                                                .value,
                                            ),
                                        },
                                      )
                                    }
                                  />
                                </label>

                                <label>
                                  Descripción
                                  <input
                                    type="text"
                                    placeholder="Descripción del nivel (opcional)"
                                    value={
                                      nivel.descripcion ??
                                      ''
                                    }
                                    maxLength={
                                      600
                                    }
                                    onChange={(
                                      evento,
                                    ) =>
                                      cambiarNivel(
                                        indice,
                                        indiceNivel,
                                        {
                                          descripcion:
                                            evento
                                              .target
                                              .value,
                                        },
                                      )
                                    }
                                  />
                                </label>

                                <button
                                  type="button"
                                  className="icono"
                                  title="Eliminar nivel"
                                  disabled={
                                    criterio.niveles.length ===
                                    1
                                  }
                                  onClick={() =>
                                    eliminarNivel(
                                      indice,
                                      indiceNivel,
                                    )
                                  }
                                >
                                  <X
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>
                            ),
                          )}
                        </div>

                        <button
                          type="button"
                          className="cr-agregar-nivel"
                          onClick={() =>
                            agregarNivel(
                              indice,
                            )
                          }
                        >
                          <Plus
                            size={
                              14
                            }
                          />

                          Agregar nivel
                        </button>
                      </div>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  className="cr-agregar-criterio"
                  onClick={
                    agregarCriterio
                  }
                >
                  <Plus
                    size={
                      16
                    }
                  />

                  Agregar criterio
                </button>
              </>
            )}
        </div>
      </AulaModal>

      <Toast
        visible={
          Boolean(
            toast,
          )
        }
        tipo={
          toast?.tipo ??
          'informacion'
        }
        titulo={
          toast?.titulo ??
          ''
        }
        mensaje={
          toast?.mensaje
        }
        onCerrar={() =>
          setToast(
            null,
          )
        }
      />

      <style>
        {estilos}
      </style>
    </>
  );
}

const estilos = `
.cr-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cr-aviso {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.875rem;
}

.cr-aviso--alerta {
  padding: 10px 14px;
  border: 1px solid var(--app-warning-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-warning-bg);
  color: var(--app-warning-strong);
}

.cr-cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.cr-cabecera h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--app-text);
}

.cr-cabecera p {
  margin: 4px 0 0;
  font-size: 0.8125rem;
  color: var(--app-text-soft);
}

.cr-acciones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cr-tabla-scroll {
  overflow-x: auto;
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-md);
  background: var(--app-surface-raised);
}

.cr-tabla {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.cr-tabla th,
.cr-tabla td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--app-border-soft);
  font-size: 0.8125rem;
  color: var(--app-text-secondary);
  vertical-align: top;
  min-width: 140px;
}

.cr-tabla tbody tr:last-child th,
.cr-tabla tbody tr:last-child td {
  border-bottom: 0;
}

.cr-tabla th {
  background: var(--app-surface-alt);
  color: var(--app-text);
  font-weight: 600;
}

.cr-tabla td {
  background: var(--app-surface-raised);
}

.cr-nivel-th small {
  display: block;
  font-weight: 500;
  color: var(--app-text-muted);
}

.cr-tabla td strong {
  display: block;
  color: var(--app-text);
}

.cr-tabla td small {
  color: var(--app-text-muted);
}

.cr-editor-encabezado {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 14px;
}

.cr-editor-encabezado label,
.cr-criterio label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--app-text-soft);
}

.cr-editor-encabezado input,
.cr-criterio input {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--app-input-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-input-bg);
  color: var(--app-text);
  font-size: 0.875rem;
}

.cr-editor-encabezado input:focus,
.cr-criterio input:focus {
  outline: 2px solid var(--app-input-focus);
  outline-offset: 0;
}

.cr-importar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border: 1px dashed var(--app-border-strong);
  border-radius: var(--app-radius-sm);
  background: var(--app-accent-softer);
  flex-wrap: wrap;
}

.cr-importar span {
  font-size: 0.8125rem;
  color: var(--app-text-secondary);
}

.cr-criterios {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cr-criterio {
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface-raised);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cr-criterio-cabecera {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.cr-criterio-titulo {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cr-criterio-titulo strong {
  font-size: 0.8125rem;
  color: var(--app-accent-dark);
}

.cr-peso-editor {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cr-peso-editor label {
  flex-direction: row;
  align-items: center;
  gap: 6px;
  color: var(--app-text);
}

.cr-peso-editor input {
  width: 78px;
}

.cr-peso-editor::after {
  content: '%';
  font-size: 0.8125rem;
  color: var(--app-text-soft);
}

.cr-niveles {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(240px, 1fr)
  );
  gap: 10px;
}

.cr-nivel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-sm);
  background: var(--app-surface-alt);
}

.cr-nivel button.icono,
.cr-peso-editor button.icono {
  align-self: flex-end;
  border: 0;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  display: inline-flex;
}

.cr-nivel button.icono:hover,
.cr-peso-editor button.icono:hover {
  color: var(--app-danger);
}

.cr-agregar-nivel,
.cr-agregar-criterio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  border: 1px dashed var(--app-border-strong);
  border-radius: var(--app-radius-sm);
  padding: 8px 12px;
  background: transparent;
  color: var(--app-accent-dark);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.cr-agregar-criterio {
  align-self: center;
}

.cr-agregar-nivel:hover,
.cr-agregar-criterio:hover {
  background: var(--app-accent-softer);
}

.cr-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 720px) {
  .cr-editor-encabezado {
    grid-template-columns: 1fr;
  }

  .cr-niveles {
    grid-template-columns: 1fr;
  }
}
`;