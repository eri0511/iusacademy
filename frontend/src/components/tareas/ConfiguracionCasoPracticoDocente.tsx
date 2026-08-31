import {
  FileText,
  Gavel,
  LibraryBig,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  UsersRound,
} from 'lucide-react';

import {
  configCasoInicial,
  totalPalabrasCaso,
} from '../../utils/tareas/casoPractico';

import {
  nuevoIdCita as nuevoIdCasero,
} from '../../utils/tareas/respuestaEscrita';

import type {
  ConfiguracionCasoPractico,
  DocumentoCaso,
  ParteCaso,
  PreguntaCaso,
} from '../../utils/tareas/casoPractico';

type Props = {
  valor:
    ConfiguracionCasoPractico | null;
  onChange: (
    configuracion:
      ConfiguracionCasoPractico,
  ) => void;
};

export default function ConfiguracionCasoPracticoDocente(
  {
    valor,
    onChange,
  }: Props,
) {
  if (
    !valor
  ) {
    return (
      <div className="tecp__panel">
        <div className="tecp__cabecera">
          <span className="tecp__icono">
            <Scale
              size={19}
            />
          </span>

          <div>
            <strong>
              Caso práctico estructurado
            </strong>

            <small>
              Arma el caso con partes procesales, hechos, documentos del expediente y preguntas que el estudiante debe resolver.
            </small>
          </div>
        </div>

        <button
          type="button"
          className="tecp__activar"
          onClick={() =>
            onChange(
              configCasoInicial(),
            )
          }
        >
          <Sparkles
            size={16}
          />

          Activar configuración del caso
        </button>

        {estilos}
      </div>
    );
  }

  const palabrasTotales =
    totalPalabrasCaso({
      version: 1,
      formato: 'CASO_PRACTICO',
      contexto: valor.contexto,
      partes: valor.partes,
      respuestas: valor.preguntas.map(
        (
          pregunta,
        ) => ({
          id:
            pregunta.id ?? 0,
          enunciado:
            pregunta.enunciado,
          respuesta:
            '',
        }),
      ),
      conclusion: '',
      citas: [],
    });

  const cambiar =
    (
      cambios:
        Partial<ConfiguracionCasoPractico>,
    ) =>
      onChange(
        {
          ...valor,
          ...cambios,
        },
      );

  const agregarParte =
    () =>
      cambiar(
        {
          partes:
            [
              ...valor.partes,
              {
                id:
                  nuevoIdCasero(),
                rol:
                  'Interviniente',
                nombre:
                  '',
                perfil:
                  '',
              },
            ],
        },
      );

  const editarParte =
    (
      id:
        number | undefined,
      cambios:
        Partial<ParteCaso>,
    ) =>
      cambiar(
        {
          partes:
            valor.partes.map(
              (
                parte,
              ) =>
                parte.id ===
                  id
                  ? {
                      ...parte,
                      ...cambios,
                    }
                  : parte,
            ),
        },
      );

  const quitarParte =
    (
      id:
        number | undefined,
    ) =>
      cambiar(
        {
          partes:
            valor.partes.filter(
              (
                parte,
              ) =>
                parte.id !==
                id,
            ),
        },
      );

  const agregarDocumento =
    () =>
      cambiar(
        {
          documentos:
            [
              ...valor.documentos,
              {
                id:
                  nuevoIdCasero(),
                titulo:
                  '',
                contenido:
                  '',
              },
            ],
        },
      );

  const editarDocumento =
    (
      id:
        number | undefined,
      cambios:
        Partial<DocumentoCaso>,
    ) =>
      cambiar(
        {
          documentos:
            valor.documentos.map(
              (
                documento,
              ) =>
                documento.id ===
                  id
                  ? {
                      ...documento,
                      ...cambios,
                    }
                  : documento,
            ),
        },
      );

  const quitarDocumento =
    (
      id:
        number | undefined,
    ) =>
      cambiar(
        {
          documentos:
            valor.documentos.filter(
              (
                documento,
              ) =>
                documento.id !==
                id,
            ),
        },
      );

  const agregarPregunta =
    () =>
      cambiar(
        {
          preguntas:
            [
              ...valor.preguntas,
              {
                id:
                  nuevoIdCasero(),
                enunciado:
                  '',
                pista:
                  '',
              },
            ],
        },
      );

  const editarPregunta =
    (
      id:
        number | undefined,
      cambios:
        Partial<PreguntaCaso>,
    ) =>
      cambiar(
        {
          preguntas:
            valor.preguntas.map(
              (
                pregunta,
              ) =>
                pregunta.id ===
                  id
                  ? {
                      ...pregunta,
                      ...cambios,
                    }
                  : pregunta,
            ),
        },
      );

  const quitarPregunta =
    (
      id:
        number | undefined,
    ) =>
      cambiar(
        {
          preguntas:
            valor.preguntas.filter(
              (
                pregunta,
              ) =>
                pregunta.id !==
                id,
            ),
        },
      );

  return (
    <>
      <div className="tecp__panel">
        <div className="tecp__cabecera">
          <span className="tecp__icono">
            <Scale
              size={19}
            />
          </span>

          <div>
            <strong>
              Caso práctico estructurado
            </strong>

            <small>
              El estudiante resolverá el caso con base en los datos y documentos que definas.
            </small>
          </div>
        </div>

        <div className="tecp__bloque">
          <div className="tecp__subtitulo">
            <Gavel
              size={15}
            />

            <strong>
              Planteamiento del caso
            </strong>
          </div>

          <label className="tecp__campo">
            <span>
              Título del caso
            </span>

            <input
              value={
                valor.tituloCaso
              }
              maxLength={
                180
              }
              placeholder="Ej. Incumplimiento de contrato de compraventa de un vehículo"
              onChange={(
                evento,
              ) =>
                cambiar(
                  {
                    tituloCaso:
                      evento.target
                        .value,
                  },
                )
              }
            />
          </label>

          <label className="tecp__campo">
            <span>
              Contexto y hechos relevantes
            </span>

            <textarea
              value={
                valor.contexto
              }
              maxLength={
                8000
              }
              rows={5}
              placeholder="Narra los hechos: relación entre las partes, plazo, incumplimiento, perjuicio..."
              onChange={(
                evento,
              ) =>
                cambiar(
                  {
                    contexto:
                      evento.target
                        .value,
                  },
                )
              }
            />

            <small>
              {
                palabrasTotales
              }{' '}
              palabras en el enunciado
            </small>
          </label>
        </div>

        <div className="tecp__bloque">
          <div className="tecp__subtitulo">
            <UsersRound
              size={15}
            />

            <strong>
              Partes del caso
            </strong>
          </div>

          <div className="tecp__lista">
            {valor.partes.map(
              (
                parte,
              ) => (
                <div
                  key={
                    parte.id
                  }
                  className="tecp__item"
                >
                  <input
                    value={
                      parte.rol
                    }
                    placeholder="Rol (ej. Demandante, Demandado, Tercero)"
                    onChange={(
                      evento,
                    ) =>
                      editarParte(
                        parte.id,
                        {
                          rol:
                            evento.target
                              .value,
                        },
                      )
                    }
                  />

                  <input
                    value={
                      parte.nombre
                    }
                    placeholder="Nombre"
                    onChange={(
                      evento,
                    ) =>
                      editarParte(
                        parte.id,
                        {
                          nombre:
                            evento.target
                              .value,
                        },
                      )
                    }
                  />

                  <input
                    value={
                      parte.perfil
                    }
                    placeholder="Perfil o posición procesal"
                    onChange={(
                      evento,
                    ) =>
                      editarParte(
                        parte.id,
                        {
                          perfil:
                            evento.target
                              .value,
                        },
                      )
                    }
                  />

                  <button
                    type="button"
                    className="tecp__quitar"
                    onClick={() =>
                      quitarParte(
                        parte.id,
                      )
                    }
                    aria-label="Quitar parte"
                  >
                    <Trash2
                      size={15}
                    />
                  </button>
                </div>
              ),
            )}
          </div>

          <button
            type="button"
            className="tecp__agregar"
            onClick={
              agregarParte
            }
          >
            <Plus
              size={15}
            />

            Agregar parte
          </button>
        </div>

        <div className="tecp__bloque">
          <div className="tecp__subtitulo">
            <LibraryBig
              size={15}
            />

            <strong>
              Documentos del expediente
            </strong>
          </div>

          <p className="tecp__nota">
            Datos del dataset que el estudiante podrá consultar: contratos, memoriales, oficios, peritajes.
          </p>

          <div className="tecp__lista">
            {valor.documentos.map(
              (
                documento,
              ) => (
                <div
                  key={
                    documento.id
                  }
                  className="tecp__documento"
                >
                  <input
                    value={
                      documento.titulo
                    }
                    placeholder="Título (ej. Contrato de compraventa)"
                    onChange={(
                      evento,
                    ) =>
                      editarDocumento(
                        documento.id,
                        {
                          titulo:
                            evento.target
                              .value,
                        },
                      )
                    }
                  />

                  <textarea
                    value={
                      documento.contenido
                    }
                    rows={3}
                    placeholder="Contenido del documento o extracto"
                    onChange={(
                      evento,
                    ) =>
                      editarDocumento(
                        documento.id,
                        {
                          contenido:
                            evento.target
                              .value,
                        },
                      )
                    }
                  />

                  <div className="tecp__documento-acciones">
                    <button
                      type="button"
                      className="tecp__quitar"
                      onClick={() =>
                        quitarDocumento(
                          documento.id,
                        )
                      }
                      aria-label="Quitar documento"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>

          <button
            type="button"
            className="tecp__agregar"
            onClick={
              agregarDocumento
            }
          >
            <Plus
              size={15}
            />

            Agregar documento
          </button>
        </div>

        <div className="tecp__bloque">
          <div className="tecp__subtitulo">
            <FileText
              size={15}
            />

            <strong>
              Preguntas del caso
            </strong>

            <small>
              {
                valor.preguntas.length
              }{' '}
              pregunta(s)
            </small>
          </div>

          <div className="tecp__lista">
            {valor.preguntas.map(
              (
                pregunta,
              ) => (
                <div
                  key={
                    pregunta.id
                  }
                  className="tecp__pregunta"
                >
                  <textarea
                    value={
                      pregunta.enunciado
                    }
                    rows={2}
                    placeholder="Enunciado de la pregunta o tarea a resolver"
                    onChange={(
                      evento,
                    ) =>
                      editarPregunta(
                        pregunta.id,
                        {
                          enunciado:
                            evento.target
                              .value,
                        },
                      )
                    }
                  />

                  <input
                    value={
                      pregunta.pista
                    }
                    placeholder="Pista o criterio de resolución (opcional)"
                    onChange={(
                      evento,
                    ) =>
                      editarPregunta(
                        pregunta.id,
                        {
                          pista:
                            evento.target
                              .value,
                        },
                      )
                    }
                  />

                  <button
                    type="button"
                    className="tecp__quitar"
                    onClick={() =>
                      quitarPregunta(
                        pregunta.id,
                      )
                    }
                    aria-label="Quitar pregunta"
                  >
                    <Trash2
                      size={15}
                    />
                  </button>
                </div>
              ),
            )}
          </div>

          <button
            type="button"
            className="tecp__agregar"
            onClick={
              agregarPregunta
            }
          >
            <Plus
              size={15}
            />

            Agregar pregunta
          </button>
        </div>

        <div className="tecp__bloque">
          <div className="tecp__palabras">
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

          <label className="tecp__interruptor">
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
              Exigir respuesta para cada pregunta del caso
            </span>
          </label>

          <label className="tecp__interruptor">
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
            <label className="tecp__citas-min">
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
    .tecp__panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: rgba(255,255,255,0.35);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 16px;
    }

    .tecp__cabecera {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .tecp__icono {
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--app-primario, #8a6b4d);
      color: #fff;
    }

    .tecp__cabecera strong {
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .tecp__cabecera small {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.45;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .tecp__activar {
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

    .tecp__bloque {
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-top: 1px dashed rgba(120,110,95,0.35);
      padding-top: 12px;
    }

    .tecp__subtitulo {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--app-primario, #8a6b4d);
    }

    .tecp__subtitulo strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .tecp__subtitulo small {
      font-size: 11px;
      font-weight: 600;
      color: var(--app-texto-suave, #6b6b6b);
      margin-left: auto;
    }

    .tecp__campo {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .tecp__campo > span,
    .tecp__palabras label > span,
    .tecp__citas-min > span {
      font-size: 12px;
      font-weight: 700;
      color: var(--app-texto, #2b2b2b);
    }

    .tecp__campo > small {
      font-size: 11px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .tecp__campo input,
    .tecp__campo textarea,
    .tecp__item input,
    .tecp__documento input,
    .tecp__documento textarea,
    .tecp__pregunta textarea,
    .tecp__pregunta input,
    .tecp__palabras input,
    .tecp__citas-min input {
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
      font-family: inherit;
    }

    .tecp__campo textarea,
    .tecp__documento textarea,
    .tecp__pregunta textarea {
      resize: vertical;
      line-height: 1.5;
    }

    .tecp__lista {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tecp__item {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      align-items: center;
      position: relative;
      padding-right: 34px;
    }

    .tecp__item .tecp__quitar {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
    }

    .tecp__quitar {
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

    .tecp__quitar:hover {
      background: rgba(178,59,59,0.20);
    }

    .tecp__agregar {
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

    .tecp__nota {
      margin: 0;
      font-size: 12px;
      line-height: 1.45;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .tecp__documento {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid rgba(120,110,95,0.25);
      border-radius: 10px;
      padding: 10px;
    }

    .tecp__documento-acciones {
      display: flex;
      justify-content: flex-end;
    }

    .tecp__pregunta {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid rgba(120,110,95,0.25);
      border-radius: 10px;
      padding: 10px;
    }

    .tecp__pregunta .tecp__quitar {
      align-self: flex-end;
    }

    .tecp__palabras {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .tecp__palabras label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tecp__interruptor {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
      cursor: pointer;
    }

    .tecp__interruptor input {
      margin-top: 2px;
      accent-color: var(--app-primario, #8a6b4d);
    }

    .tecp__citas-min {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tecp__citas-min input {
      max-width: 110px;
    }

    @media (max-width: 640px) {
      .tecp__item {
        grid-template-columns: 1fr;
      }

      .tecp__palabras {
        grid-template-columns: 1fr;
      }
    }
  `}</style>
);