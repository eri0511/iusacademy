import {
  Gavel,
  Plus,
  ScrollText,
  Sparkles,
  Trash2,
} from 'lucide-react';

import {
  TIPOS_PIEZA_JURIDICA,
  configRedaccionInicial,
  seccionesPorPieza,
  tipoPiezaCompleto,
} from '../../utils/tareas/redaccionJuridica';

import {
  nuevoIdCita,
} from '../../utils/tareas/respuestaEscrita';

import type {
  ConfiguracionRedaccionJuridica,
  SeccionRedaccionTipo,
  TipoPiezaJuridica,
} from '../../utils/tareas/redaccionJuridica';

type Props = {
  valor:
    ConfiguracionRedaccionJuridica | null;
  onChange: (
    configuracion:
      ConfiguracionRedaccionJuridica,
  ) => void;
};

export default function ConfiguracionRedaccionJuridicaDocente(
  {
    valor,
    onChange,
  }: Props,
) {
  if (
    !valor
  ) {
    return (
      <div className="trj__panel">
        <div className="trj__cabecera">
          <span className="trj__icono">
            <ScrollText
              size={19}
            />
          </span>

          <div>
            <strong>
              Redacción de piezas jurídicas
            </strong>

            <small>
              Estructura el documento con las secciones propias de la pieza (demanda, memorial, dictamen...) y exige fuentes verificables. El estudiante podrá descargarla en TXT.
            </small>
          </div>
        </div>

        <button
          type="button"
          className="trj__activar"
          onClick={() =>
            onChange(
              configRedaccionInicial(),
            )
          }
        >
          <Sparkles
            size={16}
          />

          Activar configuración de la pieza
        </button>

        {estilos}
      </div>
    );
  }

  const cambiar =
    (
      cambios:
        Partial<ConfiguracionRedaccionJuridica>,
    ) =>
      onChange(
        {
          ...valor,
          ...cambios,
        },
      );

  const cambiarPieza =
    (
      tipo:
        TipoPiezaJuridica,
    ) =>
      cambiar(
        {
          tipoPieza:
            tipo,
          secciones:
            seccionesPorPieza(
              tipo,
            ).map(
              (
                seccion,
                indice,
              ) => ({
                ...seccion,
                id:
                  indice +
                  1,
              }),
            ),
        },
      );

  const editarSeccion =
    (
      id:
        number | undefined,
      cambios:
        Partial<SeccionRedaccionTipo>,
    ) =>
      cambiar(
        {
          secciones:
            valor.secciones.map(
              (
                seccion,
              ) =>
                seccion.id ===
                  id
                  ? {
                      ...seccion,
                      ...cambios,
                    }
                  : seccion,
            ),
        },
      );

  const quitarSeccion =
    (
      id:
        number | undefined,
    ) =>
      cambiar(
        {
          secciones:
            valor.secciones.filter(
              (
                seccion,
              ) =>
                seccion.id !==
                id,
            ),
        },
      );

  const agregarSeccion =
    () =>
      cambiar(
        {
          secciones:
            [
              ...valor.secciones,
              {
                id:
                  nuevoIdCita(),
                titulo:
                  '',
                consigna:
                  '',
              },
            ],
        },
      );

  return (
    <>
      <div className="trj__panel">
        <div className="trj__cabecera">
          <span className="trj__icono">
            <ScrollText
              size={19}
            />
          </span>

          <div>
            <strong>
              Redacción de piezas jurídicas
            </strong>

            <small>
              El estudiante redactará el documento con la estructura que definas y podrá descargarlo en texto plano.
            </small>
          </div>
        </div>

        <div className="trj__pieza">
          <label>
            <span>
              Tipo de pieza jurídica
            </span>

            <select
              value={
                valor.tipoPieza
              }
              onChange={(
                evento,
              ) =>
                cambiarPieza(
                  tipoPiezaCompleto(
                    evento.target
                      .value,
                  ),
                )
              }
            >
              {TIPOS_PIEZA_JURIDICA.map(
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
                TIPOS_PIEZA_JURIDICA.find(
                  (
                    opcion,
                  ) =>
                    opcion.valor ===
                    valor.tipoPieza,
                )?.descripcion
              }
            </small>
          </label>

          <p className="trj__aviso">
            Al cambiar el tipo se restablece la estructura sugerida; luego puedes editarla.
          </p>
        </div>

        <div className="trj__bloque">
          <div className="trj__subtitulo">
            <Gavel
              size={15}
            />

            <strong>
              Estructura del documento
            </strong>

            <small>
              {
                valor.secciones.length
              }{' '}
              sección(es)
            </small>
          </div>

          <div className="trj__secciones">
            {valor.secciones.map(
              (
                seccion,
              ) => (
                <div
                  key={
                    seccion.id
                  }
                  className="trj__seccion"
                >
                  <div className="trj__seccion-fila">
                    <input
                      value={
                        seccion.titulo
                      }
                      placeholder="Título de la sección"
                      onChange={(
                        evento,
                      ) =>
                        editarSeccion(
                          seccion.id,
                          {
                            titulo:
                              evento.target
                                .value,
                          },
                        )
                      }
                    />

                    <button
                      type="button"
                      className="trj__quitar"
                      onClick={() =>
                        quitarSeccion(
                          seccion.id,
                        )
                      }
                      aria-label="Quitar sección"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>

                  <input
                    value={
                      seccion.consigna
                    }
                    placeholder="Consigna o criterio de redacción (opcional)"
                    onChange={(
                      evento,
                    ) =>
                      editarSeccion(
                        seccion.id,
                        {
                          consigna:
                            evento.target
                              .value,
                        },
                      )
                    }
                  />
                </div>
              ),
            )}
          </div>

          <button
            type="button"
            className="trj__agregar"
            onClick={
              agregarSeccion
            }
          >
            <Plus
              size={15}
            />

            Agregar sección
          </button>
        </div>

        <div className="trj__bloque">
          <div className="trj__palabras">
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
          </div>

          <label className="trj__interruptor">
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
              Exigir todas las secciones del documento
            </span>
          </label>

          <label className="trj__interruptor">
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
            <label className="trj__citas-min">
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
      </div>

      {estilos}
    </>
  );
}

const estilos = (
  <style>{`
    .trj__panel {
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: rgba(255,255,255,0.35);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 16px;
    }

    .trj__cabecera {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .trj__icono {
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--app-primario, #8a6b4d);
      color: #fff;
    }

    .trj__cabecera strong {
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .trj__cabecera small {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.45;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .trj__activar {
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

    .trj__pieza {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .trj__pieza label {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .trj__pieza label > span,
    .trj__palabras label > span,
    .trj__citas-min > span {
      font-size: 12px;
      font-weight: 700;
      color: var(--app-texto, #2b2b2b);
    }

    .trj__pieza label > small {
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .trj__pieza select,
    .trj__seccion input,
    .trj__palabras input,
    .trj__citas-min input {
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .trj__pieza select {
      cursor: pointer;
    }

    .trj__aviso {
      margin: 0;
      font-size: 11.5px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .trj__bloque {
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-top: 1px dashed rgba(120,110,95,0.35);
      padding-top: 12px;
    }

    .trj__subtitulo {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--app-primario, #8a6b4d);
    }

    .trj__subtitulo strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .trj__subtitulo small {
      font-size: 11px;
      font-weight: 600;
      color: var(--app-texto-suave, #6b6b6b);
      margin-left: auto;
    }

    .trj__secciones {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .trj__seccion {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid rgba(120,110,95,0.25);
      border-radius: 10px;
      padding: 10px;
    }

    .trj__seccion-fila {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .trj__seccion-fila input {
      flex: 1;
    }

    .trj__quitar {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: 8px;
      background: rgba(178,59,59,0.10);
      color: #b23b3b;
      cursor: pointer;
    }

    .trj__quitar:hover {
      background: rgba(178,59,59,0.20);
    }

    .trj__agregar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      align-self: flex-start;
      border: 1px dashed var(--app-primario, #8a6b4d);
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--app-primario, #8a6b4d);
      background: transparent;
      cursor: pointer;
    }

    .trj__palabras {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .trj__palabras label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .trj__interruptor {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
      cursor: pointer;
    }

    .trj__interruptor input {
      margin-top: 2px;
      accent-color: var(--app-primario, #8a6b4d);
    }

    .trj__citas-min {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .trj__citas-min input {
      max-width: 110px;
    }

    @media (max-width: 640px) {
      .trj__palabras {
        grid-template-columns: 1fr;
      }

      .trj__seccion-fila {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `}</style>
);