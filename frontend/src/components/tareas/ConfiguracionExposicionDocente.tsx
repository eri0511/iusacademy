import {
  Award,
  Clock3,
  Plus,
  Presentation,
  Sparkles,
  Trash2,
} from 'lucide-react';

import {
  ORDENES_TURNO,
  configExposicionInicial,
  criteriosExposicionInicial,
  pesoTotalCriterios,
  seccionesGuionInicial,
} from '../../utils/tareas/exposicion';

import {
  nuevoIdCita,
} from '../../utils/tareas/respuestaEscrita';

import type {
  ConfiguracionExposicion,
  CriterioExposicion,
  SeccionGuionTipo,
} from '../../utils/tareas/exposicion';

type Props = {
  valor:
    ConfiguracionExposicion | null;
  onChange: (
    configuracion:
      ConfiguracionExposicion,
  ) => void;
};

export default function ConfiguracionExposicionDocente(
  {
    valor,
    onChange,
  }: Props,
) {
  if (
    !valor
  ) {
    return (
      <div className="tex__panel">
        <div className="tex__cabecera">
          <span className="tex__icono">
            <Presentation
              size={19}
            />
          </span>

          <div>
            <strong>
              Exposición guiada
            </strong>

            <small>
              El estudiante prepara un guión por secciones, adjunta o enlaza su presentación y confirma su preparación. El docente evalúa con criterios ponderados.
            </small>
          </div>
        </div>

        <button
          type="button"
          className="tex__activar"
          onClick={() =>
            onChange(
              configExposicionInicial(),
            )
          }
        >
          <Sparkles
            size={16}
          />

          Activar configuración de la exposición
        </button>

        {estilos}
      </div>
    );
  }

  const cambiar =
    (
      cambios:
        Partial<ConfiguracionExposicion>,
    ) =>
      onChange(
        {
          ...valor,
          ...cambios,
        },
      );

  const editarSeccion =
    (
      id:
        number | undefined,
      cambios:
        Partial<SeccionGuionTipo>,
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

  const restablecerSecciones =
    () =>
      cambiar(
        {
          secciones:
            seccionesGuionInicial(),
        },
      );

  const editarCriterio =
    (
      id:
        number | undefined,
      cambios:
        Partial<CriterioExposicion>,
    ) =>
      cambiar(
        {
          criterios:
            valor.criterios.map(
              (
                criterio,
              ) =>
                criterio.id ===
                  id
                  ? {
                      ...criterio,
                      ...cambios,
                    }
                  : criterio,
            ),
        },
      );

  const quitarCriterio =
    (
      id:
        number | undefined,
    ) =>
      cambiar(
        {
          criterios:
            valor.criterios.filter(
              (
                criterio,
              ) =>
                criterio.id !==
                id,
            ),
        },
      );

  const agregarCriterio =
    () =>
      cambiar(
        {
          criterios:
            [
              ...valor.criterios,
              {
                id:
                  nuevoIdCita(),
                titulo:
                  '',
                descripcion:
                  '',
                peso: 10,
              },
            ],
        },
      );

  const totalPesos =
    pesoTotalCriterios(
      valor.criterios,
    );

  return (
    <>
      <div className="tex__panel">
        <div className="tex__cabecera">
          <span className="tex__icono">
            <Presentation
              size={19}
            />
          </span>

          <div>
            <strong>
              Exposición guiada
            </strong>

            <small>
              Define la logística, el guión solicitado y los criterios de evaluación.
            </small>
          </div>
        </div>

        <label className="tex__interruptor tex__interruptor--principal">
          <input
            type="checkbox"
            checked={valor.estructuraGuiada}
            onChange={() =>
              cambiar({
                estructuraGuiada: !valor.estructuraGuiada,
              })
            }
          />

          <span>
            Usar guión de exposición
            <small>
              {valor.estructuraGuiada
                ? 'El estudiante deberá completar las secciones solicitadas.'
                : 'El estudiante podrá omitir el guión y preparar directamente su presentación.'}
            </small>
          </span>

          <i>
            <b />
          </i>
        </label>

        <div className="tex__logistica">
          <label>
            <span>
              Duración por expositor (min)
            </span>

            <input
              type="number"
              min={1}
              max={120}
              value={
                valor.duracionPorExpositorMin
              }
              onChange={(
                evento,
              ) =>
                cambiar(
                  {
                    duracionPorExpositorMin:
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

          <label>
            <span>
              Pausa entre turnos (min)
            </span>

            <input
              type="number"
              min={0}
              max={30}
              value={
                valor.pausaEntreTurnosMin
              }
              onChange={(
                evento,
              ) =>
                cambiar(
                  {
                    pausaEntreTurnosMin:
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
              Orden de los turnos
            </span>

            <select
              value={
                valor.ordenTurnos
              }
              onChange={(
                evento,
              ) =>
                cambiar(
                  {
                    ordenTurnos:
                      evento.target
                        .value as ConfiguracionExposicion['ordenTurnos'],
                  },
                )
              }
            >
              {ORDENES_TURNO.map(
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
                ORDENES_TURNO.find(
                  (
                    opcion,
                  ) =>
                    opcion.valor ===
                    valor.ordenTurnos,
                )?.descripcion
              }
            </small>
          </label>
        </div>

        {valor.estructuraGuiada && (
        <div className="tex__bloque">
          <div className="tex__subtitulo">
            <Clock3
              size={15}
            />

            <strong>
              Guión de la exposición
            </strong>

            <small>
              {
                valor.secciones.length
              }{' '}
              sección(es)
            </small>
          </div>

          <div className="tex__secciones">
            {valor.secciones.map(
              (
                seccion,
              ) => (
                <div
                  key={
                    seccion.id
                  }
                  className="tex__seccion"
                >
                  <div className="tex__seccion-fila">
                    <input
                      value={
                        seccion.titulo
                      }
                      placeholder="Título de la sección del guión"
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
                      className="tex__quitar"
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
                    placeholder="Consigna para el estudiante (opcional)"
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

          <div className="tex__acciones">
            <button
              type="button"
              className="tex__agregar"
              onClick={
                agregarSeccion
              }
            >
              <Plus
                size={15}
              />

              Agregar sección
            </button>

            <button
              type="button"
              className="tex__restaurar"
              onClick={
                restablecerSecciones
              }
            >
              Restablecer sugeridas
            </button>
          </div>
        </div>
        )}

        {valor.estructuraGuiada && (
        <div className="tex__bloque">
          <div className="tex__palabras">
            <label>
              <span>
                Palabras mínimas del guión
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
                Palabras máximas del guión
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

          <label className="tex__interruptor">
            <input
              type="checkbox"
              checked={
                valor.exigirEnlacePresentacion
              }
              onChange={() =>
                cambiar(
                  {
                    exigirEnlacePresentacion:
                      !valor.exigirEnlacePresentacion,
                  },
                )
              }
            />

            <span>
              Exigir enlace de la presentación (Canva, Google Slides, PDF en línea…)
            </span>
          </label>

          <label className="tex__interruptor">
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
              Exigir fuentes citadas en el guión
            </span>
          </label>

          {valor.exigirCitas && (
            <label className="tex__citas-min">
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
        )}

        <div className="tex__bloque">
          <div className="tex__subtitulo">
            <Award
              size={15}
            />

            <strong>
              Criterios de evaluación
            </strong>

            <small
              className={
                totalPesos ===
                  100
                  ? 'ok'
                  : 'aviso'
              }
            >
              Total: {
                totalPesos
              }%
            </small>
          </div>

          <div className="tex__criterios">
            {valor.criterios.map(
              (
                criterio,
              ) => (
                <div
                  key={
                    criterio.id
                  }
                  className="tex__criterio"
                >
                  <div className="tex__criterio-fila">
                    <input
                      value={
                        criterio.titulo
                      }
                      placeholder="Criterio evaluado"
                      onChange={(
                        evento,
                      ) =>
                        editarCriterio(
                          criterio.id,
                          {
                            titulo:
                              evento.target
                                .value,
                          },
                        )
                      }
                    />

                    <label className="tex__peso">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={
                          criterio.peso
                        }
                        onChange={(
                          evento,
                        ) =>
                          editarCriterio(
                            criterio.id,
                            {
                              peso:
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

                      <span>
                        %
                      </span>
                    </label>

                    <button
                      type="button"
                      className="tex__quitar"
                      onClick={() =>
                        quitarCriterio(
                          criterio.id,
                        )
                      }
                      aria-label="Quitar criterio"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>

                  <input
                    value={
                      criterio.descripcion
                    }
                    placeholder="Descripción de qué se evalúa"
                    onChange={(
                      evento,
                    ) =>
                      editarCriterio(
                        criterio.id,
                        {
                          descripcion:
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

          <div className="tex__acciones">
            <button
              type="button"
              className="tex__agregar"
              onClick={
                agregarCriterio
              }
            >
              <Plus
                size={15}
              />

              Agregar criterio
            </button>

            <button
              type="button"
              className="tex__restaurar"
              onClick={() =>
                cambiar(
                  {
                    criterios:
                      criteriosExposicionInicial(),
                  },
                )
              }
            >
              Restablecer sugeridos
            </button>
          </div>

          {totalPesos !==
            100 && (
            <p className="tex__aviso-pesos">
              La suma de pesos queda fuera de 100%; la nota sugerida se normalizará igualmente.
            </p>
          )}
        </div>
      </div>

      {estilos}
    </>
  );
}

const estilos = (
  <style>{`
    .tex__panel {
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: rgba(255,255,255,0.35);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 16px;
    }

    .tex__cabecera {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .tex__icono {
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--app-primario, #8a6b4d);
      color: #fff;
    }

    .tex__cabecera strong {
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .tex__cabecera small {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.45;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .tex__activar {
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

    .tex__logistica {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .tex__logistica label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tex__logistica label > span,
    .tex__palabras label > span,
    .tex__citas-min > span {
      font-size: 12px;
      font-weight: 700;
      color: var(--app-texto, #2b2b2b);
    }

    .tex__logistica label > small {
      grid-column: 1 / -1;
      font-size: 11.5px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .tex__logistica label:nth-child(3) {
      grid-column: 1 / -1;
    }

    .tex__logistica select,
    .tex__logistica input,
    .tex__seccion input,
    .tex__palabras input,
    .tex__citas-min input,
    .tex__criterio input {
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .tex__logistica select {
      cursor: pointer;
    }

    .tex__bloque {
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-top: 1px dashed rgba(120,110,95,0.35);
      padding-top: 12px;
    }

    .tex__subtitulo {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--app-primario, #8a6b4d);
    }

    .tex__subtitulo strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .tex__subtitulo small {
      margin-left: auto;
      font-size: 11px;
      font-weight: 700;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .tex__subtitulo small.ok {
      color: #238453;
    }

    .tex__subtitulo small.aviso {
      color: #b25927;
    }

    .tex__secciones,
    .tex__criterios {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tex__seccion,
    .tex__criterio {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid rgba(120,110,95,0.25);
      border-radius: 10px;
      padding: 10px;
    }

    .tex__seccion-fila,
    .tex__criterio-fila {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tex__seccion-fila input,
    .tex__criterio-fila input {
      flex: 1;
    }

    .tex__peso {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .tex__peso input {
      width: 64px;
      flex: none;
      text-align: right;
    }

    .tex__peso span {
      font-size: 12px;
      font-weight: 700;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .tex__quitar {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      flex: 0 0 30px;
      border: 0;
      border-radius: 8px;
      background: rgba(178,59,59,0.10);
      color: #b23b3b;
      cursor: pointer;
    }

    .tex__quitar:hover {
      background: rgba(178,59,59,0.20);
    }

    .tex__acciones {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tex__agregar {
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

    .tex__restaurar {
      border: 0;
      border-radius: 8px;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--app-texto-suave, #6b6b6b);
      background: rgba(120,110,95,0.08);
      cursor: pointer;
    }

    .tex__palabras {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .tex__palabras label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tex__interruptor {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
      cursor: pointer;
    }

    .tex__interruptor input {
      margin-top: 2px;
      accent-color: var(--app-primario, #8a6b4d);
    }

    .tex__interruptor--principal {
      align-items: center;
      padding: 11px 12px;
      border: 1px solid var(--app-border, #e2e8f0);
      border-radius: 12px;
      background: var(--app-surface-alt, #f8fafc);
    }

    .tex__interruptor--principal > span {
      display: grid;
      gap: 3px;
      flex: 1;
      font-weight: 700;
    }

    .tex__interruptor--principal small {
      color: var(--app-text-muted, #64748b);
      font-size: 11px;
      font-weight: 500;
    }

    .tex__interruptor--principal > i {
      position: relative;
      width: 34px;
      height: 20px;
      border-radius: 999px;
      background: var(--app-border-strong, #cbd5e1);
    }

    .tex__interruptor--principal input:checked ~ i {
      background: var(--app-accent, #2563eb);
    }

    .tex__interruptor--principal > i b {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #fff;
      transition: transform .2s ease;
    }

    .tex__interruptor--principal input:checked ~ i b {
      transform: translateX(14px);
    }

    .tex__citas-min {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tex__citas-min input {
      max-width: 110px;
    }

    .tex__aviso-pesos {
      margin: 0;
      font-size: 11.5px;
      color: #b25927;
    }

    @media (max-width: 640px) {
      .tex__logistica,
      .tex__palabras {
        grid-template-columns: 1fr;
      }

      .tex__logistica label:nth-child(3) {
        grid-column: auto;
      }

      .tex__seccion-fila,
      .tex__criterio-fila {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `}</style>
);
