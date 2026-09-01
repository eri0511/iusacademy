import {
  useMemo,
} from 'react';

import {
  Award,
  BookMarked,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Link2,
  ListTodo,
  Plus,
  Presentation,
  ShieldCheck,
  Timer,
  Trash2,
  Type,
} from 'lucide-react';

import {
  esEnlacePresentacionValido,
  estimarMinutosExposicion,
  nuevaRespuestaExposicion,
  palabrasPorSeccionExposicion,
  parsearRespuestaExposicion,
  serializarRespuestaExposicion,
  totalPalabrasExposicion,
} from '../../utils/tareas/exposicion';

import {
  TIPOS_CITA_JURIDICA,
  nuevoIdCita,
} from '../../utils/tareas/respuestaEscrita';

import type {
  ConfiguracionExposicion,
  RespuestaExposicionEstado,
} from '../../utils/tareas/exposicion';

import type {
  CitaJuridica,
} from '../../utils/tareas/respuestaEscrita';

type Props = {
  valor: string;
  config:
    ConfiguracionExposicion;
  onChange: (
    serializado:
      string,
  ) => void;
};

export default function EditorExposicion(
  {
    valor,
    config,
    onChange,
  }: Props,
) {
  const estado =
    useMemo<RespuestaExposicionEstado>(
      () => {
        const guardado =
          parsearRespuestaExposicion(
            valor,
          );

        if (
          guardado
        ) {
          return guardado;
        }

        return nuevaRespuestaExposicion(
          config,
        );
      },
      [
        valor,
        config,
      ],
    );

  const palabras =
    useMemo(
      () =>
        palabrasPorSeccionExposicion(
          estado,
        ),
      [
        estado,
      ],
    );

  const total =
    totalPalabrasExposicion(
      estado,
    );

  const minutosEstimados =
    estimarMinutosExposicion(
      total,
    );

  const dentroDeRango =
    !config.estructuraGuiada ||
    (total >= config.minPalabras &&
      total <= config.maxPalabras);

  const enlaceValido =
    esEnlacePresentacionValido(
      estado.enlacePresentacion,
    );

  const citasCompletas =
    estado.citas.filter(
      (
        cita,
      ) =>
        cita.referencia
          .trim(),
    );

  const citasCumplidas =
    !config.estructuraGuiada ||
    !config.exigirCitas ||
    citasCompletas.length >=
      config.minCitas;

  const seccionesCumplidas =
    !config.estructuraGuiada ||
    estado.secciones.every(
      (
        seccion,
      ) =>
        seccion.contenido
          .trim(),
    );

  const checklistCompletado =
    estado.checklist.length >
      0 &&
    estado.checklist.every(
      (
        item,
      ) =>
        item.cumplido,
    );

  const preparado =
    checklistCompletado &&
    dentroDeRango &&
    citasCumplidas &&
    (
      !config.exigirEnlacePresentacion ||
      enlaceValido
    );

  const guardar =
    (
      proximo:
        RespuestaExposicionEstado,
    ) =>
      onChange(
        serializarRespuestaExposicion(
          proximo,
        ),
      );

  const editarSeccion =
    (
      id:
        number,
      contenido:
        string,
    ) =>
      guardar(
        {
          ...estado,
          secciones:
            estado.secciones.map(
              (
                seccion,
              ) =>
                seccion.id ===
                  id
                  ? {
                      ...seccion,
                      contenido,
                    }
                  : seccion,
            ),
        },
      );

  const agregarCita =
    () =>
      guardar(
        {
          ...estado,
          citas:
            [
              ...estado.citas,
              {
                id:
                  nuevoIdCita(),
                tipo:
                  'NORMA',
                referencia:
                  '',
                fundamento:
                  '',
              },
            ],
        },
      );

  const editarCita =
    (
      id:
        number,
      cambios:
        Partial<CitaJuridica>,
    ) =>
      guardar(
        {
          ...estado,
          citas:
            estado.citas.map(
              (
                cita,
              ) =>
                cita.id ===
                  id
                  ? {
                      ...cita,
                      ...cambios,
                    }
                  : cita,
            ),
        },
      );

  const quitarCita =
    (
      id:
        number,
    ) =>
      guardar(
        {
          ...estado,
          citas:
            estado.citas.filter(
              (
                cita,
              ) =>
                cita.id !==
                id,
            ),
        },
      );

  const alternarChecklist =
    (
      id:
        number,
    ) =>
      guardar(
        {
          ...estado,
          checklist:
            estado.checklist.map(
              (
                item,
              ) =>
                item.id ===
                  id
                  ? {
                      ...item,
                      cumplido:
                        !item.cumplido,
                    }
                  : item,
            ),
        },
      );

  return (
    <>
      <div className="eex">
        <div className="eex__panel">
          <div className="eex__panel-cabecera">
            <div className="eex__panel-titulo">
              <span className="eex__panel-icono">
                <Presentation
                  size={19}
                />
              </span>

              <div>
                <strong>
                  Preparación de la exposición
                </strong>

                <small>
                  Arma tu guión por secciones, enlaza la presentación y confirma que estás listo.
                </small>
              </div>
            </div>

            <div className={`eex__contador ${dentroDeRango ? 'bueno' : 'aviso'}`}>
              <Type
                size={15}
              />

              <span>
                {total}
              </span>

              <small>
                / {
                  config.minPalabras
                } – {
                  config.maxPalabras
                } palabras
              </small>
            </div>
          </div>

          <div className="eex__tiempo">
            <Clock3
              size={15}
            />

            <strong>
              ~{
                minutosEstimados
              } min
            </strong>

            <small>
              de exposición estimada (a ~160 palabras/min). Ajusta a la duración prevista de {
                config.duracionPorExpositorMin
              } min.
            </small>
          </div>

          <section className="eex__criterios-docente">
            <div className="eex__criterios-docente-titulo">
              <Award size={16} />
              <div>
                <strong>Criterios con los que se evaluará tu exposición</strong>
                <small>Considera estos aspectos al preparar el guión y la presentación.</small>
              </div>
            </div>

            <div className="eex__criterios-docente-lista">
              {config.criterios.map((criterio) => (
                <div key={criterio.id}>
                  <span>{criterio.titulo}</span>
                  <b>{criterio.peso}%</b>
                  {criterio.descripcion.trim() && (
                    <small>{criterio.descripcion}</small>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="eex__campos">
            <label>
              <span>
                Tema de la exposición *
              </span>

              <input
                value={
                  estado.tema
                }
                maxLength={
                  180
                }
                placeholder="Título del tema a exponer"
                onChange={(
                  evento,
                ) =>
                  guardar(
                    {
                      ...estado,
                      tema:
                        evento.target
                          .value,
                    },
                  )
                }
              />
            </label>

            <label>
              <span>
                Enlace de la presentación{' '}
                {
                  config.exigirEnlacePresentacion
                    ? '*'
                    : '(opcional)'
                }
              </span>

              <div className="eex__enlace">
                <Link2
                  size={15}
                />

                <input
                  value={
                    estado.enlacePresentacion
                  }
                  maxLength={
                    500
                  }
                  placeholder="https://www.canva.com/... o enlace de tu presentación"
                  onChange={(
                    evento,
                  ) =>
                    guardar(
                      {
                        ...estado,
                        enlacePresentacion:
                          evento.target
                            .value,
                      },
                    )
                  }
                />
              </div>

              <small className={enlaceValido ? 'ok' : ''}>
                {config.exigirEnlacePresentacion && (
                  <>
                    {enlaceValido
                      ? 'Enlace válido.'
                      : 'Ingresa una URL válida (http/https).'}
                  </>
                )}
              </small>

              {enlaceValido && (
                <a
                  className="eex__enlace-preview"
                  href={
                    estado.enlacePresentacion
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink
                    size={14}
                  />

                  Abrir presentación en una pestaña nueva
                </a>
              )}
            </label>
          </div>
        </div>

        {config.estructuraGuiada && (
        <div className="eex__guion">
          {estado.secciones.map(
            (
              seccion,
            ) => (
              <div
                key={
                  seccion.id
                }
                className="eex__seccion"
              >
                <div className="eex__seccion-titulo">
                  <strong>
                    {
                      seccion.titulo
                    }
                  </strong>

                  <small
                    className={
                      palabras[
                        seccion.id
                      ] >
                        0
                        ? 'tiene'
                        : ''
                    }
                  >
                    {
                      palabras[
                        seccion.id
                      ] ??
                        0
                    }{' '}
                    palabras
                  </small>
                </div>

                {seccion.consigna.trim() && (
                  <p>
                    {
                      seccion.consigna
                    }
                  </p>
                )}

                <textarea
                  className="eex__textarea"
                  value={
                    seccion.contenido
                  }
                  maxLength={
                    50000
                  }
                  placeholder={`Guión de "${seccion.titulo}"...`}
                  onChange={(
                    evento,
                  ) =>
                    editarSeccion(
                      seccion.id,
                      evento.target
                        .value,
                    )
                  }
                />
              </div>
            ),
          )}
        </div>
        )}

        <div className="eex__citas">
          <div className="eex__citas-titulo">
            <span className="eex__citas-icono">
              <BookMarked
                size={17}
              />
            </span>

            <div>
              <strong>
                Fuentes citadas
              </strong>

              <small>
                {
                  citasCompletas.length
                }{' '}
                de{' '}
                {
                  config
                    .minCitas
                }{' '}
                requeridas
              </small>
            </div>

            {config.exigirCitas && (
              <button
                type="button"
                onClick={
                  agregarCita
                }
              >
                <Plus
                  size={15}
                />

                Agregar cita
              </button>
            )}
          </div>

          {config.exigirCitas &&
            !citasCumplidas && (
              <p className="eex__citas-pendiente">
                Aún faltan fuentes para cumplir el requisito del docente.
              </p>
            )}

          {estado.citas.length >
            0 && (
            <div className="eex__citas-lista">
              {estado.citas.map(
                (
                  cita,
                ) => (
                  <div
                    key={
                      cita.id
                    }
                    className="eex__cita"
                  >
                    <select
                      value={
                        cita.tipo
                      }
                      onChange={(
                        evento,
                      ) =>
                        editarCita(
                          cita.id,
                          {
                            tipo:
                              evento.target
                                .value as CitaJuridica['tipo'],
                          },
                        )
                      }
                    >
                      {TIPOS_CITA_JURIDICA.map(
                        (
                          tipo,
                        ) => (
                          <option
                            key={
                              tipo.valor
                            }
                            value={
                              tipo.valor
                            }
                          >
                            {
                              tipo.texto
                            }
                          </option>
                        ),
                      )}
                    </select>

                    <div className="eex__cita-campos">
                      <input
                        value={
                          cita.referencia
                        }
                        placeholder="Referencia (ej. Código Civil, art. 450)"
                        onChange={(
                          evento,
                        ) =>
                          editarCita(
                            cita.id,
                            {
                              referencia:
                                evento.target
                                  .value,
                            },
                          )
                        }
                      />

                      <input
                        value={
                          cita.fundamento
                        }
                        placeholder="Fundamento o aplicabilidad"
                        onChange={(
                          evento,
                        ) =>
                          editarCita(
                            cita.id,
                            {
                              fundamento:
                                evento.target
                                  .value,
                            },
                          )
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="eex__cita-quitar"
                      onClick={() =>
                        quitarCita(
                          cita.id,
                        )
                      }
                      aria-label="Quitar cita"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="eex__checklist">
          <div className="eex__checklist-titulo">
            <span className="eex__checklist-icono">
              <ListTodo
                size={17}
              />
            </span>

            <div>
              <strong>
                Lista de verificación
              </strong>

              <small>
                {
                  estado.checklist.filter(
                    (
                      item,
                    ) =>
                      item.cumplido,
                  ).length
                }{
                  ' '}/{
                  ' '}
                {
                  estado.checklist.length
                }{' '}
                puntos preparados
              </small>
            </div>

            {checklistCompletado && (
              <span className="eex__listo">
                <ShieldCheck
                  size={14}
                />

                Checklist completo
              </span>
            )}
          </div>

          <div className="eex__checklist-items">
            {estado.checklist.map(
              (
                item,
              ) => (
                <label
                  key={
                    item.id
                  }
                  className={
                    item.cumplido
                      ? 'hecho'
                      : ''
                  }
                >
                  <input
                    type="checkbox"
                    checked={
                      item.cumplido
                    }
                    onChange={() =>
                      alternarChecklist(
                        item.id,
                      )
                    }
                  />

                  <span>
                    {
                      item.texto
                    }
                  </span>
                </label>
              ),
            )}
          </div>
        </div>

        <label className="eex__confirmar">
          <input
            type="checkbox"
            checked={
              estado.preparacionConfirmada
            }
            onChange={() =>
              guardar(
                {
                  ...estado,
                  preparacionConfirmada:
                    !estado.preparacionConfirmada,
                },
              )
            }
          />

          <div>
            <strong>
              Confirmo que estoy listo para exponer
            </strong>

            <small>
              Marca esta casilla solo cuando el guión, la presentación y el material estén listos.
            </small>
          </div>
        </label>

        <div className={`eex__estado ${preparado ? 'ok' : ''}`}>
          {preparado ? (
            <>
              <CheckCircle2
                size={15}
              />

              <span>
                Preparación completa. Recuerda adjuntar tu presentación en archivos si corresponde.
              </span>
            </>
          ) : (
            <>
              <Timer
                size={15}
              />

              <span>
                {!seccionesCumplidas
                  ? 'Completa todas las secciones del guión.'
                  : !dentroDeRango
                    ? total <
                        config.minPalabras
                      ? `Te faltan ${config.minPalabras - total} palabra(s) para el mínimo del guión.`
                      : `El guión supera el máximo en ${total - config.maxPalabras} palabra(s).`
                    : config.exigirEnlacePresentacion &&
                        !enlaceValido
                      ? 'Ingresa un enlace válido de la presentación.'
                      : config.exigirCitas &&
                          !citasCumplidas
                        ? `Faltan fuentes citadas (mínimo ${config.minCitas}).`
                        : 'Completa la checklist de preparación para confirmar tu avance.'}
              </span>
            </>
          )}
        </div>
      </div>

      {estilos}
    </>
  );
}

const estilos = (
  <style>{`
    .eex {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .eex__panel,
    .eex__citas,
    .eex__checklist {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(255,255,255,0.45);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 14px 16px;
    }

    .eex__panel-cabecera {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .eex__panel-titulo {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .eex__panel-icono {
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--app-primario, #8a6b4d);
      color: #fff;
    }

    .eex__panel-titulo strong,
    .eex__citas-titulo strong,
    .eex__checklist-titulo strong {
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .eex__panel-titulo small,
    .eex__citas-titulo small,
    .eex__checklist-titulo small {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eex__contador {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }

    .eex__contador.bueno {
      background: rgba(35,132,83,0.12);
      color: #238453;
    }

    .eex__contador.aviso {
      background: rgba(178,89,39,0.14);
      color: #b25927;
    }

    .eex__contador small {
      font-weight: 500;
    }

    .eex__tiempo {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 7px;
      border-radius: 10px;
      padding: 9px 12px;
      background: rgba(138,107,77,0.08);
      color: #5b4a34;
    }

    .eex__tiempo strong {
      font-size: 13px;
    }

    .eex__tiempo small {
      flex-basis: 100%;
      font-size: 12px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eex__criterios-docente {
      display: grid;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--app-border, #e2e8f0);
      border-radius: 12px;
      background: var(--app-surface-alt, #f8fafc);
    }

    .eex__criterios-docente-titulo {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      color: var(--app-accent-dark, #1d4ed8);
    }

    .eex__criterios-docente-titulo div {
      display: grid;
      gap: 2px;
    }

    .eex__criterios-docente-titulo strong {
      color: var(--app-text, #1e293b);
      font-size: 13px;
    }

    .eex__criterios-docente-titulo small {
      color: var(--app-text-muted, #64748b);
      font-size: 11px;
    }

    .eex__criterios-docente-lista {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }

    .eex__criterios-docente-lista > div {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 2px 8px;
      padding: 8px;
      border-radius: 8px;
      background: var(--app-surface, #ffffff);
    }

    .eex__criterios-docente-lista span {
      color: var(--app-text, #1e293b);
      font-size: 12px;
      font-weight: 700;
    }

    .eex__criterios-docente-lista b {
      color: var(--app-accent-dark, #1d4ed8);
      font-size: 12px;
    }

    .eex__criterios-docente-lista small {
      grid-column: 1 / -1;
      color: var(--app-text-muted, #64748b);
      font-size: 11px;
      line-height: 1.35;
    }

    .eex__campos {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .eex__campos label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .eex__campos label > span {
      font-size: 12px;
      font-weight: 700;
      color: var(--app-texto, #2b2b2b);
    }

    .eex__campos input {
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .eex__campos label > small {
      font-size: 12px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eex__campos label > small.ok {
      color: #238453;
    }

    .eex__enlace {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .eex__enlace svg {
      flex: 0 0 auto;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eex__enlace input {
      flex: 1;
    }

    .eex__enlace-preview {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      align-self: flex-start;
      font-size: 12px;
      font-weight: 600;
      color: var(--app-primario, #8a6b4d);
      text-decoration: none;
    }

    .eex__guion {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .eex__seccion {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .eex__seccion-titulo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .eex__seccion-titulo strong {
      font-size: 13.5px;
      color: #5b4a34;
    }

    .eex__seccion-titulo small {
      font-size: 11px;
      font-weight: 600;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eex__seccion-titulo small.tiene {
      color: #238453;
    }

    .eex__seccion > p {
      margin: 0;
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eex__textarea {
      width: 100%;
      min-height: 110px;
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 10px;
      padding: 12px;
      font-size: 14px;
      line-height: 1.6;
      font-family: inherit;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
      resize: vertical;
    }

    .eex__textarea:focus {
      border-color: var(--app-primario, #8a6b4d);
      box-shadow: 0 0 0 3px rgba(138,107,77,0.14);
    }

    .eex__citas-titulo,
    .eex__checklist-titulo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .eex__citas-icono,
    .eex__checklist-icono {
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      display: grid;
      place-items: center;
      border-radius: 9px;
      background: rgba(138,107,77,0.14);
      color: var(--app-primario, #8a6b4d);
    }

    .eex__citas-titulo > div,
    .eex__checklist-titulo > div {
      flex: 1;
    }

    .eex__citas-titulo button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 0;
      border-radius: 9px;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      background: var(--app-primario, #8a6b4d);
      cursor: pointer;
    }

    .eex__citas-pendiente {
      margin: 0;
      font-size: 12px;
      color: #b25927;
    }

    .eex__citas-lista {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .eex__cita {
      display: grid;
      grid-template-columns: 130px 1fr auto;
      gap: 8px;
      align-items: start;
    }

    .eex__cita select,
    .eex__cita input {
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 12px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .eex__cita select {
      cursor: pointer;
    }

    .eex__cita-campos {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .eex__cita-quitar {
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

    .eex__checklist-items {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .eex__checklist-items label {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      border: 1px solid rgba(120,110,95,0.22);
      border-radius: 9px;
      padding: 9px 11px;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
      cursor: pointer;
    }

    .eex__checklist-items label.hecho {
      background: rgba(35,132,83,0.07);
      border-color: rgba(35,132,83,0.25);
    }

    .eex__checklist-items input {
      margin-top: 2px;
      accent-color: var(--app-primario, #8a6b4d);
    }

    .eex__listo {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(35,132,83,0.12);
      color: #238453;
    }

    .eex__confirmar {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      border: 1px solid rgba(138,107,77,0.35);
      border-radius: 12px;
      padding: 12px 14px;
      background: rgba(138,107,77,0.07);
      cursor: pointer;
    }

    .eex__confirmar input {
      margin-top: 3px;
      accent-color: var(--app-primario, #8a6b4d);
    }

    .eex__confirmar strong {
      display: block;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .eex__confirmar small {
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .eex__estado {
      display: flex;
      align-items: center;
      gap: 7px;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 12px;
      background: rgba(178,89,39,0.10);
      color: #b25927;
    }

    .eex__estado.ok {
      background: rgba(35,132,83,0.10);
      color: #238453;
    }

    @media (max-width: 640px) {
      .eex__cita {
        grid-template-columns: 1fr;
      }

      .eex__campos {
        flex-direction: column;
      }
    }
  `}</style>
);
