import {
  useState,
} from 'react';

import {
  BookOpenCheck,
  Landmark,
  Library,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { BANCO_NORMATIVO_POR_AREA } from '../../data/bancoNormativoCivilBoliviano';

import {
  AREAS_DERECHO_CIVIL,
  completarAreaDerecho,
  nuevoIdCita,
} from '../../utils/tareas/respuestaEscrita';

import type {
  AreaDerechoCivil,
  BancoNormativoItem,
  ConfiguracionRespuestaEscrita,
} from '../../utils/tareas/respuestaEscrita';

type Props = {
  valor:
    ConfiguracionRespuestaEscrita | null;
  onChange: (
    configuracion:
      ConfiguracionRespuestaEscrita,
  ) => void;
};

const configInicial =
  (): ConfiguracionRespuestaEscrita => ({
    areaDerecho:
      'OBLIGACIONES',
    minPalabras:
      200,
    maxPalabras:
      1200,
    estructuraGuiada:
      true,
    exigirCitas:
      true,
    minCitas:
      2,
    bancoNormativo:
      BANCO_NORMATIVO_POR_AREA
        .OBLIGACIONES.map(
          (
            sugerencia,
          ) => ({
            ...sugerencia,
            id:
              nuevoIdCita(),
          }),
        ),
  });

export default function ConfiguracionRespuestaEscritaDocente(
  {
    valor,
    onChange,
  }: Props,
) {
  const [
    bancoAbierto,
    setBancoAbierto,
  ] =
    useState(
      false,
    );

  if (
    !valor
  ) {
    return (
      <div className="tarea-re__panel">
        <div className="tarea-re__panel-titulo">
          <span className="tarea-re__panel-icono">
            <Landmark
              size={18}
            />
          </span>

          <div>
            <strong>
              Experiencia guiada de derecho
            </strong>

            <small>
              Convierte esta respuesta escrita en una matriz especializada en derecho civil boliviano: estructura guiada, banco normativo y citas.
            </small>
          </div>
        </div>

        <button
          type="button"
          className="tarea-re__activar"
          onClick={() =>
            onChange(
              configInicial(),
            )
          }
        >
          <Sparkles
            size={16}
          />

          Activar configuración de derecho
        </button>

        {estilos}
      </div>
    );
  }

  const cambiar =
    (
      cambios:
        Partial<ConfiguracionRespuestaEscrita>,
    ) =>
      onChange(
        {
          ...valor,
          ...cambios,
        },
      );

  const actualizarSugerencias =
    () => {
      const area =
        valor.areaDerecho;

      const sugerencias =
        BANCO_NORMATIVO_POR_AREA[
          area
        ].map(
          (
            sugerencia,
          ) => ({
            ...sugerencia,
            id:
              nuevoIdCita(),
          }),
        );

      cambiar(
        {
          bancoNormativo:
            sugerencias,
        },
      );

      setBancoAbierto(
        sugerencias.length >
          0,
      );
    };

  const agregarItem =
    () =>
      cambiar(
        {
          bancoNormativo:
            [
              ...valor.bancoNormativo,
              {
                id:
                  nuevoIdCita(),
                norma:
                  '',
                detalle:
                  '',
              },
            ],
        },
      );

  const editarItem =
    (
      id:
        number | undefined,
      cambios:
        Partial<BancoNormativoItem>,
    ) =>
      cambiar(
        {
          bancoNormativo:
            valor.bancoNormativo.map(
              (
                item,
              ) =>
                item.id ===
                  id
                  ? {
                      ...item,
                      ...cambios,
                    }
                  : item,
            ),
        },
      );

  const quitarItem =
    (
      id:
        number | undefined,
    ) =>
      cambiar(
        {
          bancoNormativo:
            valor.bancoNormativo.filter(
              (
                item,
              ) =>
                item.id !==
                id,
            ),
        },
      );

  const palabrasOk =
    valor.maxPalabras >=
    valor.minPalabras;

  return (
    <>
      <div className="tarea-re__panel">
        <div className="tarea-re__panel-titulo">
          <span className="tarea-re__panel-icono">
            <Landmark
              size={18}
            />
          </span>

          <div>
            <strong>
              Experiencia guiada de derecho
            </strong>

            <small>
              El estudiante responde con estructura jurídica, banco normativo y citas verificables.
            </small>
          </div>
        </div>

        <div className="tarea-re__area">
          <label>
            <span>
              Área del derecho civil
            </span>

            <select
              value={
                valor.areaDerecho
              }
              onChange={(
                evento,
              ) =>
                cambiar(
                  {
                    areaDerecho:
                      completarAreaDerecho(
                        evento.target
                          .value as AreaDerechoCivil,
                      ),
                  },
                )
              }
            >
              {AREAS_DERECHO_CIVIL.map(
                (
                  opcion,
                ) => (
                  <option
                    key={
                      opcion.valor
                    }
                    value={
                      opcion.valor
                    }
                  >
                    {
                      opcion.texto
                    }
                  </option>
                ),
              )}
            </select>

            <small>
              {
                AREAS_DERECHO_CIVIL.find(
                  (
                    opcion,
                  ) =>
                    opcion.valor ===
                    valor.areaDerecho,
                )
                  ?.descripcion
              }
            </small>
          </label>

          <button
            type="button"
            className="tarea-re__sugerencias"
            onClick={
              actualizarSugerencias
            }
          >
            <Library
              size={15}
            />

            Cargar sugerencias normativas del área
          </button>
        </div>

        <div className="tarea-re__palabras">
          <label>
            <span>
              Palabras mínimas
            </span>

            <input
              type="number"
              min={0}
              max={10000}
              value={
                valor.minPalabras
              }
              onChange={(
                evento,
              ) =>
                cambiar(
                  {
                    minPalabras:
                      Math.max(
                        0,
                        Math.floor(
                          Number(
                            evento.target
                              .value,
                          ) ||
                            0,
                        ),
                      ),
                  },
                )
              }
            />
          </label>

          <label>
            <span>
              Palabras máximas
            </span>

            <input
              type="number"
              min={1}
              max={20000}
              value={
                valor.maxPalabras
              }
              onChange={(
                evento,
              ) =>
                cambiar(
                  {
                    maxPalabras:
                      Math.max(
                        1,
                        Math.floor(
                          Number(
                            evento.target
                              .value,
                          ) ||
                            1,
                        ),
                      ),
                  },
                )
              }
            />
          </label>

          {!palabrasOk && (
            <small className="tarea-re__aviso">
              El máximo debe ser mayor o igual al mínimo.
            </small>
          )}
        </div>

        <div className="tarea-re__interruptores">
          <label className="tarea-re__interruptor">
            <input
              type="checkbox"
              checked={
                valor.estructuraGuiada
              }
              onChange={() =>
                cambiar(
                  {
                    estructuraGuiada:
                      !valor.estructuraGuiada,
                  },
                )
              }
            />

            <span>
              Estructura guiada (relación jurídica, fundamento normativo, argumentación y conclusión)
            </span>
          </label>

          <label className="tarea-re__interruptor">
            <input
              type="checkbox"
              checked={
                valor.exigirCitas
              }
              onChange={() =>
                cambiar(
                  {
                    exigirCitas:
                      !valor.exigirCitas,
                  },
                )
              }
            />

            <span>
              Exigir fuentes citadas (normas, jurisprudencia o doctrina)
            </span>
          </label>

          {valor.exigirCitas && (
            <label className="tarea-re__citas-min">
              <span>
                Citas mínimas
              </span>

              <input
                type="number"
                min={1}
                max={20}
                value={
                  valor.minCitas
                }
                onChange={(
                  evento,
                ) =>
                  cambiar(
                    {
                      minCitas:
                        Math.max(
                          1,
                          Math.floor(
                            Number(
                              evento.target
                                .value,
                            ) ||
                              1,
                          ),
                        ),
                    },
                  )
                }
              />
            </label>
          )}
        </div>

        <div className="tarea-re__banco">
          <button
            type="button"
            className="tarea-re__banco-titulo"
            onClick={() =>
              setBancoAbierto(
                (
                  abierto,
                ) =>
                  !abierto,
                )
              }
          >
            <span>
              Banco normativo de referencia
            </span>

            <small>
              {
                valor
                  .bancoNormativo
                  .length
              }{' '}
              fuente(s)
            </small>
          </button>

          {bancoAbierto && (
            <div className="tarea-re__banco-lista">
              <p className="tarea-re__banco-nota">
                <BookOpenCheck
                  size={14}
                />

                Sugerencias orientativas; verifica la vigencia de cada fuente antes de publicarla.
              </p>

              {valor.bancoNormativo.map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item.id
                    }
                    className="tarea-re__banco-item"
                  >
                    <div>
                      <input
                        value={
                          item.norma
                        }
                        placeholder="Norma o fuente (ej. Código Civil, art. 984)"
                        onChange={(
                          evento,
                        ) =>
                          editarItem(
                            item.id,
                            {
                              norma:
                                evento.target
                                  .value,
                            },
                          )
                        }
                      />

                      <input
                        value={
                          item.detalle
                        }
                        placeholder="Tema o alcance (ej. responsabilidad civil)"
                        onChange={(
                          evento,
                        ) =>
                          editarItem(
                            item.id,
                            {
                              detalle:
                                evento.target
                                  .value,
                            },
                          )
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="tarea-re__banco-quitar"
                      onClick={() =>
                        quitarItem(
                          item.id,
                        )
                      }
                      aria-label="Quitar fuente"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                ),
              )}

              <div className="tarea-re__banco-acciones">
                <button
                  type="button"
                  onClick={
                    agregarItem
                  }
                >
                  <Plus
                    size={15}
                  />

                  Agregar fuente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {estilos}
    </>
  );
}

const estilos = (
  <style>{`
    .tarea-re__panel {
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: rgba(255,255,255,0.35);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 16px;
    }

    .tarea-re__panel-titulo {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .tarea-re__panel-icono {
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--app-primario, #8a6b4d);
      color: #fff;
    }

    .tarea-re__panel-titulo strong {
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .tarea-re__panel-titulo small {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.45;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .tarea-re__activar,
    .tarea-re__sugerencias {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      cursor: pointer;
      border: 0;
      border-radius: 10px;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      background: var(--app-primario, #8a6b4d);
    }

    .tarea-re__activar:hover,
    .tarea-re__sugerencias:hover {
      filter: brightness(1.06);
    }

    .tarea-re__area {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tarea-re__area label,
    .tarea-re__citas-min {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tarea-re__area label > span,
    .tarea-re__palabras label > span,
    .tarea-re__citas-min > span {
      font-size: 12px;
      font-weight: 700;
      color: var(--app-texto, #2b2b2b);
    }

    .tarea-re__area label > small {
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .tarea-re__palabras {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .tarea-re__palabras label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tarea-re__aviso {
      grid-column: 1 / -1;
      font-size: 12px;
      color: #b23b3b;
    }

    .tarea-re__interruptores {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .tarea-re__interruptor {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
      cursor: pointer;
    }

    .tarea-re__interruptor input {
      margin-top: 2px;
      accent-color: var(--app-primario, #8a6b4d);
    }

    .tarea-re__citas-min input,
    .tarea-re__palabras input,
    .tarea-re__area select,
    .tarea-re__banco-item input {
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .tarea-re__citas-min input {
      max-width: 110px;
    }

    .tarea-re__area select {
      background: #fff;
      cursor: pointer;
    }

    .tarea-re__banco {
      border-top: 1px dashed rgba(120,110,95,0.35);
      padding-top: 12px;
    }

    .tarea-re__banco-titulo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      border: 0;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      color: var(--app-texto, #2b2b2b);
    }

    .tarea-re__banco-titulo small {
      font-weight: 500;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .tarea-re__banco-lista {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tarea-re__banco-nota {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12px;
      line-height: 1.45;
      color: var(--app-texto-suave, #6b6b6b);
      margin: 0;
    }

    .tarea-re__banco-item {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }

    .tarea-re__banco-item > div {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .tarea-re__banco-quitar {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border: 0;
      border-radius: 8px;
      background: rgba(178,59,59,0.10);
      color: #b23b3b;
      cursor: pointer;
    }

    .tarea-re__banco-quitar:hover {
      background: rgba(178,59,59,0.20);
    }

    .tarea-re__banco-acciones {
      display: flex;
      justify-content: flex-end;
    }

    .tarea-re__banco-acciones button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px dashed var(--app-primario, #8a6b4d);
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--app-primario, #8a6b4d);
      background: transparent;
      cursor: pointer;
    }
  `}</style>
);