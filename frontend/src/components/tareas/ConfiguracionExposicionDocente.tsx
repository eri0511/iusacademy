import {
  BookOpenCheck,
  Clock3,
  Presentation,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';

import {
  ORDENES_TURNO,
  configExposicionInicial,
  seccionesGuionInicial,
} from '../../utils/tareas/exposicion';

import {
  nuevoIdCita,
} from '../../utils/tareas/respuestaEscrita';

import type {
  ConfiguracionExposicion,
  SeccionGuionTipo,
} from '../../utils/tareas/exposicion';

type Props = {
  valor: ConfiguracionExposicion | null;
  onChange: (
    configuracion: ConfiguracionExposicion,
  ) => void;
};

export default function ConfiguracionExposicionDocente({
  valor,
  onChange,
}: Props) {
  const configuracion =
    valor ?? configExposicionInicial();

  const cambiar = (
    cambios: Partial<ConfiguracionExposicion>,
  ) => {
    onChange({
      ...configuracion,
      ...cambios,
    });
  };

  const editarSeccion = (
    id: number | undefined,
    cambios: Partial<SeccionGuionTipo>,
  ) => {
    cambiar({
      secciones: configuracion.secciones.map(
        (seccion) =>
          seccion.id === id
            ? {
                ...seccion,
                ...cambios,
              }
            : seccion,
      ),
    });
  };

  const quitarSeccion = (
    id: number | undefined,
  ) => {
    cambiar({
      secciones: configuracion.secciones.filter(
        (seccion) => seccion.id !== id,
      ),
    });
  };

  const agregarSeccion = () => {
    cambiar({
      secciones: [
        ...configuracion.secciones,
        {
          id: nuevoIdCita(),
          titulo: '',
          consigna: '',
        },
      ],
    });
  };

  return (
    <>
      <section className="tex__panel">
        <header className="tex__cabecera">
          <span className="tex__icono">
            <Presentation size={19} />
          </span>

          <div>
            <strong>Configuración de la exposición</strong>
            <small>
              Define la dinámica de presentación y, si lo necesitas, solicita un guion previo al estudiante.
            </small>
          </div>
        </header>

        <div className="tex__grupo">
          <div className="tex__grupo-titulo">
            <Clock3 size={15} />
            <span>
              <strong>Dinámica de presentación</strong>
              <small>Configura tiempos y orden de participación.</small>
            </span>
          </div>

          <div className="tex__logistica">
            <label>
              <span>Duración por expositor</span>
              <div className="tex__numero">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={configuracion.duracionPorExpositorMin}
                  onChange={(evento) =>
                    cambiar({
                      duracionPorExpositorMin: Math.max(
                        1,
                        Math.floor(
                          Number(evento.target.value) || 1,
                        ),
                      ),
                    })
                  }
                />
                <small>min</small>
              </div>
            </label>

            <label>
              <span>Pausa entre turnos</span>
              <div className="tex__numero">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={configuracion.pausaEntreTurnosMin}
                  onChange={(evento) =>
                    cambiar({
                      pausaEntreTurnosMin: Math.max(
                        0,
                        Math.floor(
                          Number(evento.target.value) || 0,
                        ),
                      ),
                    })
                  }
                />
                <small>min</small>
              </div>
            </label>

            <label className="tex__orden">
              <span>Orden de exposición</span>
              <select
                value={configuracion.ordenTurnos}
                onChange={(evento) =>
                  cambiar({
                    ordenTurnos:
                      evento.target.value as ConfiguracionExposicion['ordenTurnos'],
                  })
                }
              >
                {ORDENES_TURNO.map((opcion) => (
                  <option
                    key={opcion.valor}
                    value={opcion.valor}
                  >
                    {opcion.texto}
                  </option>
                ))}
              </select>
              <small>
                {
                  ORDENES_TURNO.find(
                    (opcion) =>
                      opcion.valor === configuracion.ordenTurnos,
                  )?.descripcion
                }
              </small>
            </label>
          </div>
        </div>

        <label className="tex__switch-card">
          <span className="tex__switch-card-icono">
            <Presentation size={17} />
          </span>

          <span className="tex__switch-card-texto">
            <strong>Solicitar enlace de presentación</strong>
            <small>
              El estudiante deberá registrar el enlace de sus diapositivas o material digital.
            </small>
          </span>

          <input
            type="checkbox"
            checked={configuracion.exigirEnlacePresentacion}
            onChange={(evento) =>
              cambiar({
                exigirEnlacePresentacion: evento.target.checked,
              })
            }
          />

          <i>
            <b />
          </i>
        </label>

        <div className="tex__guion">
          <label className="tex__switch-card tex__switch-card--principal">
            <span className="tex__switch-card-icono">
              <BookOpenCheck size={17} />
            </span>

            <span className="tex__switch-card-texto">
              <strong>Guion de exposición</strong>
              <small>
                Solicita una estructura previa para orientar la preparación. Está desactivado por defecto.
              </small>
            </span>

            <input
              type="checkbox"
              checked={configuracion.estructuraGuiada}
              onChange={(evento) =>
                cambiar({
                  estructuraGuiada: evento.target.checked,
                })
              }
            />

            <i>
              <b />
            </i>
          </label>

          {configuracion.estructuraGuiada && (
            <div className="tex__guion-contenido">
              <div className="tex__bloque">
                <div className="tex__subtitulo">
                  <div>
                    <strong>Extensión del guion</strong>
                    <small>
                      Define una referencia de extensión para el desarrollo previo.
                    </small>
                  </div>
                </div>

                <div className="tex__palabras">
                  <label>
                    <span>Palabras mínimas</span>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={configuracion.minPalabras}
                      onChange={(evento) =>
                        cambiar({
                          minPalabras: Math.max(
                            1,
                            Math.floor(
                              Number(evento.target.value) || 1,
                            ),
                          ),
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Palabras máximas</span>
                    <input
                      type="number"
                      min={1}
                      max={20000}
                      value={configuracion.maxPalabras}
                      onChange={(evento) =>
                        cambiar({
                          maxPalabras: Math.max(
                            1,
                            Math.floor(
                              Number(evento.target.value) || 1,
                            ),
                          ),
                        })
                      }
                    />
                  </label>
                </div>

                {configuracion.minPalabras >
                  configuracion.maxPalabras && (
                  <div className="tex__aviso">
                    Las palabras mínimas no pueden superar las máximas.
                  </div>
                )}
              </div>

              <div className="tex__bloque">
                <div className="tex__subtitulo tex__subtitulo--acciones">
                  <div>
                    <strong>Estructura solicitada</strong>
                    <small>
                      {configuracion.secciones.length} sección(es) del guion.
                    </small>
                  </div>

                  <button
                    type="button"
                    className="tex__restaurar"
                    onClick={() =>
                      cambiar({
                        secciones: seccionesGuionInicial(),
                      })
                    }
                  >
                    <RotateCcw size={14} />
                    Restablecer
                  </button>
                </div>

                <div className="tex__secciones">
                  {configuracion.secciones.map(
                    (seccion, indice) => (
                      <article
                        key={seccion.id ?? indice}
                        className="tex__seccion"
                      >
                        <span className="tex__seccion-numero">
                          {indice + 1}
                        </span>

                        <div className="tex__seccion-contenido">
                          <input
                            value={seccion.titulo}
                            placeholder="Título de la sección"
                            onChange={(evento) =>
                              editarSeccion(
                                seccion.id,
                                {
                                  titulo: evento.target.value,
                                },
                              )
                            }
                          />

                          <textarea
                            rows={2}
                            value={seccion.consigna}
                            placeholder="Indica qué debe desarrollar el estudiante en esta sección."
                            onChange={(evento) =>
                              editarSeccion(
                                seccion.id,
                                {
                                  consigna: evento.target.value,
                                },
                              )
                            }
                          />
                        </div>

                        <button
                          type="button"
                          className="tex__quitar"
                          aria-label={`Eliminar sección ${indice + 1}`}
                          onClick={() =>
                            quitarSeccion(seccion.id)
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </article>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  className="tex__agregar"
                  onClick={agregarSeccion}
                >
                  <Plus size={15} />
                  Agregar sección
                </button>
              </div>

              <div className="tex__bloque">
                <div className="tex__subtitulo">
                  <div>
                    <strong>Fuentes jurídicas</strong>
                    <small>
                      Define si el guion debe incluir sustento normativo o bibliográfico.
                    </small>
                  </div>
                </div>

                <label className="tex__switch-card tex__switch-card--interno">
                  <span className="tex__switch-card-texto">
                    <strong>Exigir fuentes jurídicas</strong>
                    <small>
                      Solicita citas normativas, doctrinales o jurisprudenciales.
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={configuracion.exigirCitas}
                    onChange={(evento) =>
                      cambiar({
                        exigirCitas: evento.target.checked,
                      })
                    }
                  />

                  <i>
                    <b />
                  </i>
                </label>

                {configuracion.exigirCitas && (
                  <label className="tex__citas-min">
                    <span>Mínimo de fuentes</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={configuracion.minCitas}
                      onChange={(evento) =>
                        cambiar({
                          minCitas: Math.max(
                            1,
                            Math.floor(
                              Number(evento.target.value) || 1,
                            ),
                          ),
                        })
                      }
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {estilos}
    </>
  );
}

const estilos = (
  <style>{`
    .tex__panel {
      display: grid;
      gap: 16px;
      padding: 17px;
      border: 1px solid var(--app-border, #e2e8f0);
      border-left: 3px solid var(--app-accent, #f18b4b);
      border-radius: 14px;
      background: var(--app-surface, #fff);
      box-shadow: 0 8px 24px rgba(15, 23, 42, .04);
    }

    .tex__cabecera,
    .tex__grupo-titulo {
      display: flex;
      align-items: flex-start;
      gap: 11px;
    }

    .tex__icono {
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      color: var(--app-accent, #f18b4b);
      background: var(--app-accent-soft, #fff3e8);
    }

    .tex__cabecera > div,
    .tex__grupo-titulo > span,
    .tex__switch-card-texto,
    .tex__subtitulo > div {
      display: grid;
      gap: 3px;
      min-width: 0;
    }

    .tex__cabecera strong,
    .tex__grupo-titulo strong,
    .tex__subtitulo strong,
    .tex__switch-card strong {
      color: var(--app-text, #0f172a);
    }

    .tex__cabecera strong {
      font-size: 14px;
    }

    .tex__cabecera small,
    .tex__grupo-titulo small,
    .tex__subtitulo small,
    .tex__switch-card small,
    .tex__orden > small {
      color: var(--app-text-muted, #64748b);
      font-size: 11px;
      line-height: 1.45;
    }

    .tex__grupo {
      display: grid;
      gap: 12px;
      padding: 14px;
      border: 1px solid var(--app-border, #e2e8f0);
      border-radius: 12px;
      background: var(--app-surface-alt, #fffaf4);
    }

    .tex__grupo-titulo svg {
      margin-top: 1px;
      color: var(--app-accent, #f18b4b);
    }

    .tex__grupo-titulo strong,
    .tex__subtitulo strong {
      font-size: 12px;
    }

    .tex__logistica {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .tex__logistica label,
    .tex__palabras label,
    .tex__citas-min {
      display: grid;
      gap: 5px;
    }

    .tex__logistica label > span,
    .tex__palabras label > span,
    .tex__citas-min > span {
      color: var(--app-text, #0f172a);
      font-size: 11px;
      font-weight: 700;
    }

    .tex__orden {
      grid-column: 1 / -1;
    }

    .tex__logistica input,
    .tex__logistica select,
    .tex__palabras input,
    .tex__citas-min input,
    .tex__seccion input,
    .tex__seccion textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--app-border, #e2e8f0);
      border-radius: 9px;
      padding: 9px 10px;
      background: var(--app-surface-raised, #fff);
      color: var(--app-text, #0f172a);
      font: inherit;
      font-size: 12px;
      outline: none;
    }

    .tex__seccion textarea {
      resize: vertical;
      min-height: 64px;
      line-height: 1.45;
    }

    .tex__logistica input:focus,
    .tex__logistica select:focus,
    .tex__palabras input:focus,
    .tex__citas-min input:focus,
    .tex__seccion input:focus,
    .tex__seccion textarea:focus {
      border-color: var(--app-accent, #f18b4b);
      box-shadow: 0 0 0 3px rgba(241, 139, 75, .12);
    }

    .tex__numero {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 7px;
    }

    .tex__numero > small {
      color: var(--app-text-muted, #64748b);
      font-size: 11px;
      font-weight: 700;
    }

    .tex__switch-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 13px;
      border: 1px solid var(--app-border, #e2e8f0);
      border-radius: 12px;
      background: var(--app-surface-alt, #fffaf4);
      cursor: pointer;
    }

    .tex__switch-card--principal {
      border-color: rgba(241, 139, 75, .42);
      background: var(--app-accent-soft, #fff3e8);
    }

    .tex__switch-card--interno {
      background: var(--app-surface, #fff);
    }

    .tex__switch-card-icono {
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      display: grid;
      place-items: center;
      border-radius: 9px;
      color: var(--app-accent, #f18b4b);
      background: rgba(241, 139, 75, .10);
    }

    .tex__switch-card-texto {
      flex: 1;
    }

    .tex__switch-card strong {
      font-size: 12px;
    }

    .tex__switch-card > input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .tex__switch-card > i {
      position: relative;
      width: 36px;
      height: 21px;
      flex: 0 0 36px;
      border-radius: 999px;
      background: var(--app-border-strong, #cbd5e1);
      transition: background .2s ease;
    }

    .tex__switch-card > i b {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(15, 23, 42, .18);
      transition: transform .2s ease;
    }

    .tex__switch-card > input:checked ~ i {
      background: var(--app-accent, #f18b4b);
    }

    .tex__switch-card > input:checked ~ i b {
      transform: translateX(15px);
    }

    .tex__guion {
      display: grid;
      gap: 10px;
    }

    .tex__guion-contenido {
      display: grid;
      gap: 12px;
      margin-left: 14px;
      padding: 4px 0 0 16px;
      border-left: 2px solid rgba(241, 139, 75, .28);
    }

    .tex__bloque {
      display: grid;
      gap: 10px;
      padding: 13px;
      border: 1px solid var(--app-border, #e2e8f0);
      border-radius: 11px;
      background: var(--app-surface, #fff);
    }

    .tex__subtitulo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .tex__subtitulo--acciones {
      align-items: flex-start;
    }

    .tex__palabras {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .tex__secciones {
      display: grid;
      gap: 8px;
    }

    .tex__seccion {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr) 32px;
      align-items: start;
      gap: 9px;
      padding: 10px;
      border: 1px solid var(--app-border, #e2e8f0);
      border-radius: 10px;
      background: var(--app-surface-alt, #fffaf4);
    }

    .tex__seccion-numero {
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: rgba(241, 139, 75, .13);
      color: var(--app-accent, #f18b4b);
      font-size: 11px;
      font-weight: 800;
    }

    .tex__seccion-contenido {
      display: grid;
      gap: 7px;
    }

    .tex__quitar {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 8px;
      color: #b42318;
      background: rgba(180, 35, 24, .08);
      cursor: pointer;
    }

    .tex__quitar:hover {
      background: rgba(180, 35, 24, .14);
    }

    .tex__agregar,
    .tex__restaurar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: fit-content;
      border-radius: 8px;
      padding: 7px 10px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
    }

    .tex__agregar {
      border: 1px dashed var(--app-accent, #f18b4b);
      color: var(--app-accent, #f18b4b);
      background: transparent;
    }

    .tex__restaurar {
      border: 1px solid var(--app-border, #e2e8f0);
      color: var(--app-text-secondary, #475569);
      background: var(--app-surface-alt, #fffaf4);
    }

    .tex__citas-min input {
      max-width: 120px;
    }

    .tex__aviso {
      padding: 8px 10px;
      border-radius: 8px;
      color: #9a3412;
      background: #fff7ed;
      font-size: 11px;
      font-weight: 600;
    }

    @media (max-width: 700px) {
      .tex__logistica,
      .tex__palabras {
        grid-template-columns: 1fr;
      }

      .tex__orden {
        grid-column: auto;
      }

      .tex__guion-contenido {
        margin-left: 0;
        padding-left: 10px;
      }

      .tex__seccion {
        grid-template-columns: 28px minmax(0, 1fr);
      }

      .tex__quitar {
        grid-column: 2;
      }

      .tex__subtitulo--acciones {
        flex-direction: column;
      }
    }
  `}</style>
);
