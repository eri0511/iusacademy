import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ClipboardList,
  Edit3,
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
  importarRubricaArchivo,
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
  colorTipo?: string;
  fondoTipo?: string;
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
        Number(rubrica.ponderacionMax),
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
                Number(criterio.peso),
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
                        Number(nivel.puntos),
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
    colorTipo = 'var(--app-accent)',
    fondoTipo = 'var(--app-accent-softer)',
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

  const estiloTipo = {
    '--cr-type-color':
      colorTipo,
    '--cr-type-bg':
      fondoTipo,
  } as CSSProperties;


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
          Number(
            criterio.peso ??
              0,
          ),
        0,
      ),
    );

  const ponderacion =
    redondear(
      Number(
        borrador.ponderacionMax ??
          100,
      ),
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
                Number(
                  criterio.peso,
                ) *
                  (pesoSugerido /
                    (sumaPesos || 100)),
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

  const alElegirArchivo =
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
          await importarRubricaArchivo(
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
            'No se pudo importar la rúbrica',
          mensaje:
            error instanceof
              Error
              ? error.message
              : 'Verifica que el archivo sea .xlsx o .pdf y tenga una estructura válida',
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
        descripcion="Define los criterios que el docente usará para calificar esta tarea, o impórtalos desde un archivo Excel o PDF."
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
        <div
          className={`cr-cuerpo ${
            modo === 'ver'
              ? 'cr-cuerpo--ver'
              : modo === 'editar'
                ? 'cr-cuerpo--editar'
                : ''
          }`}
          style={
            estiloTipo
          }
        >
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

                    <div className="cr-escala-info">
                      <span>
                        Evaluación sobre 100
                      </span>

                      <small>
                        La conversión al aporte continuo o procesual se realiza en Calificaciones.
                      </small>
                    </div>
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
                      <Edit3
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

                      Importar archivo
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
                                  <div className="cr-nivel-vista">
                                    <span className="cr-nivel-vista__puntos">
                                      {Number(
                                        nivel.puntos,
                                      )}{' '}
                                      pts
                                    </span>

                                    <p>
                                      {
                                        nivel.descripcion ||
                                        'Sin descripción'
                                      }
                                    </p>
                                  </div>
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
                  accept=".xlsx,.pdf"
                  hidden
                  onChange={(
                    evento,
                  ) =>
                    alElegirArchivo(
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
                      ¿Tienes una rúbrica en Excel o PDF?
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
                        ? 'Reemplazar archivo'
                        : 'Importar archivo'}
                    </button>

                    <input
                      ref={
                        archivoRef
                      }
                      type="file"
                      accept=".xlsx,.pdf"
                      hidden
                      onChange={(
                        evento,
                      ) =>
                        alElegirArchivo(
                          evento.target
                            .files?.[0],
                        )
                      }
                    />
                  </div>
                </div>

                <div className="cr-escala-editor">
                  <div>
                    <strong>
                      Escala de evaluación
                    </strong>

                    <span>
                      100 puntos
                    </span>
                  </div>

                  <p>
                    La rúbrica se diseña y califica sobre 100. El aporte al hito se transforma después según el componente académico.
                  </p>
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
  --cr-type-color: var(--app-accent);
  --cr-type-bg: var(--app-accent-softer);
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
  max-height: min(72vh, 760px);
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: var(--app-accent-soft) transparent;
}

.cr-cuerpo::-webkit-scrollbar,
.cr-tabla-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.cr-cuerpo::-webkit-scrollbar-thumb,
.cr-tabla-scroll::-webkit-scrollbar-thumb {
  background: var(--app-accent-soft);
  border-radius: 999px;
}

.cr-cuerpo::-webkit-scrollbar-track,
.cr-tabla-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.cr-aviso {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.875rem;
}

.cr-aviso--alerta {
  padding: 12px 14px;
  border: 1px solid var(--app-warning-border);
  border-left: 4px solid var(--app-warning);
  border-radius: var(--app-radius-sm);
  background: var(--app-warning-bg);
  color: var(--app-warning-strong);
  line-height: 1.5;
}

.cr-cabecera {
  position: sticky;
  top: 0;
  z-index: 8;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  padding: 2px 2px 14px;
  border-bottom: 1px solid var(--app-border-soft);
  background: var(--app-surface);
}

.cr-cabecera > div:first-child {
  min-width: 280px;
  flex: 1;
}

.cr-cabecera h3 {
  margin: 0;
  font-size: 1.06rem;
  line-height: 1.35;
  color: var(--app-text);
  letter-spacing: -0.01em;
}

.cr-cabecera p {
  margin: 5px 0 0;
  font-size: 0.8125rem;
  color: var(--app-text-soft);
}

.cr-escala-info {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.cr-escala-info span {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 10px;
  border: 1px solid var(--app-accent-soft);
  border-radius: 999px;
  background: var(--app-accent-softer);
  color: var(--app-accent-dark);
  font-size: 0.75rem;
  font-weight: 800;
}

.cr-escala-info small {
  color: var(--app-text-muted);
  font-size: 0.75rem;
}

.cr-acciones {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.cr-acciones button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 14px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface-alt);
  color: var(--app-text-secondary);
  font: inherit;
  font-size: var(--app-font-sm);
  font-weight: 800;
  cursor: pointer;
  outline: none;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.cr-acciones button svg {
  flex: 0 0 auto;
}

.cr-acciones button:hover:not(:disabled) {
  border-color: var(--cr-type-color);
  color: var(--cr-type-color);
  background: var(--app-surface);
  transform: translateY(-1px);
}

.cr-acciones button:focus {
  outline: none;
}

.cr-acciones button:focus-visible {
  border-color: var(--cr-type-color);
  box-shadow:
    0 0 0 3px
    color-mix(
      in srgb,
      var(--cr-type-color) 16%,
      transparent
    );
}

.cr-acciones .secundario:first-child {
  border-color: var(--cr-type-color);
  background: var(--cr-type-color);
  color: #fff;
  box-shadow:
    0 10px 22px
    color-mix(
      in srgb,
      var(--cr-type-color) 22%,
      transparent
    );
}

.cr-acciones .secundario:first-child:hover:not(:disabled) {
  border-color: var(--cr-type-color);
  background: var(--cr-type-color);
  color: #fff;
  box-shadow:
    0 12px 26px
    color-mix(
      in srgb,
      var(--cr-type-color) 26%,
      transparent
    );
}

.cr-acciones .secundario:first-child:focus-visible {
  color: #fff;
  box-shadow:
    0 0 0 3px
      color-mix(
        in srgb,
        var(--cr-type-color) 18%,
        transparent
      ),
    0 10px 22px
      color-mix(
        in srgb,
        var(--cr-type-color) 22%,
        transparent
      );
}

.cr-acciones .danger {
  border-color:
    color-mix(
      in srgb,
      var(--app-danger) 28%,
      var(--app-border)
    );
  background: var(--app-surface);
  color: var(--app-danger);
}

.cr-acciones .danger:hover:not(:disabled) {
  border-color: var(--app-danger);
  background:
    color-mix(
      in srgb,
      var(--app-danger) 6%,
      var(--app-surface)
    );
  color: var(--app-danger);
}

.cr-acciones .danger:focus-visible {
  border-color: var(--app-danger);
  box-shadow:
    0 0 0 3px
    color-mix(
      in srgb,
      var(--app-danger) 14%,
      transparent
    );
}

.cr-acciones button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cr-tabla-scroll {
  position: relative;
  overflow: auto;
  max-height: min(58vh, 620px);
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-md);
  background: var(--app-surface-raised);
}

.cr-tabla {
  width: 100%;
  min-width: 1120px;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  table-layout: fixed;
}

.cr-tabla th,
.cr-tabla td {
  padding: 13px 14px;
  border-right: 1px solid var(--app-border-soft);
  border-bottom: 1px solid var(--app-border-soft);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--app-text-secondary);
  vertical-align: top;
  background: var(--app-surface-raised);
}

.cr-tabla th:last-child,
.cr-tabla td:last-child {
  border-right: 0;
}

.cr-tabla tbody tr:last-child td {
  border-bottom: 0;
}

.cr-tabla thead th {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--app-surface-alt);
  color: var(--app-text);
  font-weight: 800;
  box-shadow: inset 0 -1px 0 var(--app-border);
}

.cr-tabla th:first-child,
.cr-tabla td:first-child {
  position: sticky;
  left: 0;
  z-index: 4;
  width: 210px;
  min-width: 210px;
  background: var(--app-surface-raised);
}

.cr-tabla thead th:first-child {
  z-index: 7;
  background: var(--app-surface-alt);
}

.cr-tabla th:not(:first-child):not(:last-child),
.cr-tabla td:not(:first-child):not(:last-child) {
  width: 205px;
  min-width: 205px;
}

.cr-tabla th:last-child,
.cr-tabla td:last-child {
  width: 76px;
  min-width: 76px;
  text-align: center;
}

.cr-tabla tbody tr:hover td {
  background: var(--app-surface-alt);
}

.cr-tabla tbody tr:hover td:first-child {
  background: var(--app-surface-alt);
}

.cr-tabla td strong {
  display: block;
  margin-bottom: 5px;
  color: var(--app-text);
  font-size: 0.83rem;
  line-height: 1.35;
}

.cr-tabla td > small {
  display: block;
  color: var(--app-text-muted);
  line-height: 1.5;
}

.cr-nivel-th {
  color: var(--app-accent-dark) !important;
}

.cr-nivel-vista {
  display: grid;
  gap: 7px;
}

.cr-nivel-vista__puntos {
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--app-accent-softer);
  color: var(--app-accent-dark);
  font-size: 0.7rem;
  font-weight: 800;
}

.cr-nivel-vista p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.55;
}

.cr-editor-encabezado {
  position: sticky;
  top: 0;
  z-index: 7;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 14px;
  padding: 2px 2px 14px;
  border-bottom: 1px solid var(--app-border-soft);
  background: var(--app-surface);
}

.cr-editor-encabezado label,
.cr-criterio label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.73rem;
  font-weight: 700;
  color: var(--app-text-soft);
}

.cr-editor-encabezado input,
.cr-criterio input {
  width: 100%;
  min-height: 39px;
  padding: 9px 11px;
  border: 1px solid var(--app-input-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-input-bg);
  color: var(--app-text);
  font-size: 0.84rem;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background 150ms ease;
}

.cr-editor-encabezado input:focus,
.cr-criterio input:focus {
  outline: none;
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-softer);
  background: var(--app-surface-raised);
}

.cr-importar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  border: 1px dashed var(--app-accent-soft);
  border-radius: var(--app-radius-sm);
  background: var(--app-accent-softer);
  flex-wrap: wrap;
}

.cr-importar span {
  font-size: 0.8125rem;
  color: var(--app-text-secondary);
}

.cr-importar button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 13px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-alt);
  color: var(--app-text-secondary);
  font: inherit;
  font-size: var(--app-font-sm);
  font-weight: 800;
  cursor: pointer;
  outline: none;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.cr-importar button:hover:not(:disabled) {
  border-color: var(--cr-type-color);
  color: var(--cr-type-color);
  background: var(--app-surface);
}

.cr-importar button:focus {
  outline: none;
}

.cr-importar button:focus-visible {
  border-color: var(--cr-type-color);
  color: var(--cr-type-color);
  box-shadow:
    0 0 0 3px
    color-mix(
      in srgb,
      var(--cr-type-color) 16%,
      transparent
    );
}

.cr-escala-editor {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid var(--app-border-soft);
  border-left: 4px solid var(--app-accent);
  border-radius: var(--app-radius-sm);
  background: var(--app-surface-alt);
}

.cr-escala-editor > div {
  display: grid;
  gap: 3px;
  min-width: 145px;
}

.cr-escala-editor strong {
  color: var(--app-text);
  font-size: 0.76rem;
}

.cr-escala-editor span {
  color: var(--app-accent-dark);
  font-size: 1rem;
  font-weight: 900;
}

.cr-escala-editor p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.78rem;
  line-height: 1.5;
}

.cr-criterios {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cr-criterio {
  padding: 14px;
  border: 1px solid var(--app-border);
  border-left: 4px solid var(--app-accent);
  border-radius: var(--app-radius-md);
  background: var(--app-surface-raised);
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.cr-criterio-cabecera {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 14px;
}

.cr-criterio-titulo {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(180px, 0.75fr) minmax(260px, 1.25fr);
  gap: 8px;
  align-items: end;
}

.cr-criterio-titulo > strong {
  grid-column: 1 / -1;
  font-size: 0.76rem;
  color: var(--app-accent-dark);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.cr-peso-editor {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-top: 23px;
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
  margin-left: -4px;
}

.cr-niveles {
  display: grid;
  grid-template-columns: repeat(4, minmax(190px, 1fr));
  gap: 9px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.cr-nivel {
  min-width: 190px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 86px auto;
  gap: 8px;
  align-items: end;
  padding: 11px;
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-sm);
  background: var(--app-surface-alt);
}

.cr-nivel label:nth-of-type(3) {
  grid-column: 1 / -1;
}

.cr-nivel button.icono {
  align-self: end;
  margin-bottom: 4px;
}

.cr-nivel button.icono,
.cr-peso-editor button.icono {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--app-radius-sm);
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 150ms ease,
    color 150ms ease;
}

.cr-nivel button.icono:hover:not(:disabled),
.cr-peso-editor button.icono:hover:not(:disabled) {
  background: var(--app-danger-soft);
  color: var(--app-danger);
}

.cr-nivel button.icono:disabled,
.cr-peso-editor button.icono:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.cr-agregar-nivel,
.cr-agregar-criterio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  align-self: flex-start;
  min-height: 35px;
  border: 1px dashed var(--cr-type-color);
  border-radius: var(--app-radius-sm);
  padding: 7px 12px;
  background: var(--cr-type-bg);
  color: var(--cr-type-color);
  font-size: 0.77rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    background 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}

.cr-agregar-criterio {
  align-self: center;
  min-width: 180px;
}

.cr-agregar-nivel:hover,
.cr-agregar-criterio:hover {
  border-color: var(--app-accent);
  background: var(--app-accent-softest, var(--app-accent-softer));
  transform: translateY(-1px);
}

.cr-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.cr-footer button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 15px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-alt);
  color: var(--app-text-secondary);
  font: inherit;
  font-size: var(--app-font-sm);
  font-weight: 800;
  cursor: pointer;
  outline: none;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.cr-footer .primario {
  border-color: var(--cr-type-color);
  background: var(--cr-type-color);
  color: #fff;
  box-shadow:
    0 8px 18px
    color-mix(
      in srgb,
      var(--cr-type-color) 20%,
      transparent
    );
}

.cr-footer .primario:hover:not(:disabled) {
  color: #fff;
  box-shadow:
    0 10px 22px
    color-mix(
      in srgb,
      var(--cr-type-color) 24%,
      transparent
    );
}

.cr-footer .secundario:hover:not(:disabled) {
  border-color: var(--cr-type-color);
  color: var(--cr-type-color);
  background: var(--app-surface);
}

.cr-footer button:focus {
  outline: none;
}

.cr-footer button:focus-visible {
  border-color: var(--cr-type-color);
  box-shadow:
    0 0 0 3px
    color-mix(
      in srgb,
      var(--cr-type-color) 16%,
      transparent
    );
}

.cr-footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 1150px) {
  .cr-niveles {
    grid-template-columns: repeat(2, minmax(230px, 1fr));
  }

  .cr-criterio-titulo {
    grid-template-columns: 1fr;
  }

  .cr-criterio-titulo > strong {
    grid-column: 1;
  }
}

@media (max-width: 760px) {
  .cr-cuerpo {
    max-height: 70vh;
  }

  .cr-editor-encabezado {
    grid-template-columns: 1fr;
  }

  .cr-cabecera {
    position: static;
  }

  .cr-acciones {
    width: 100%;
    justify-content: stretch;
  }

  .cr-acciones button {
    flex: 1;
  }

  .cr-escala-editor {
    grid-template-columns: 1fr;
  }

  .cr-criterio-cabecera {
    grid-template-columns: 1fr;
  }

  .cr-peso-editor {
    padding-top: 0;
    justify-content: flex-end;
  }

  .cr-niveles {
    grid-template-columns: 1fr;
  }

  .cr-nivel {
    min-width: 0;
    grid-template-columns: minmax(0, 1fr) 84px auto;
  }
}
`;