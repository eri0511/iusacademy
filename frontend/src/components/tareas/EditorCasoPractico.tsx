import {
  useMemo,
  useState,
} from 'react';

import {
  BookMarked,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Gavel,
  Landmark,
  Plus,
  Scale,
  Trash2,
  Type,
  UsersRound,
} from 'lucide-react';

import {
  nuevaRespuestaCaso,
  parsearRespuestaCaso,
  serializarRespuestaCaso,
  totalPalabrasCaso,
} from '../../utils/tareas/casoPractico';

import {
  TIPOS_CITA_JURIDICA,
  nuevoIdCita,
} from '../../utils/tareas/respuestaEscrita';

import type {
  ConfiguracionCasoPractico,
  RespuestaCasoEstado,
  RespuestaCasoItem,
} from '../../utils/tareas/casoPractico';

import type {
  CitaJuridica,
} from '../../utils/tareas/respuestaEscrita';

type Props = {
  valor: string;
  config:
    ConfiguracionCasoPractico;
  onChange: (
    serializado:
      string,
  ) => void;
};

export default function EditorCasoPractico(
  {
    valor,
    config,
    onChange,
  }: Props,
) {
  const estado =
    useMemo<RespuestaCasoEstado>(
      () => {
        const guardado =
          parsearRespuestaCaso(
            valor,
          );

        if (
          guardado
        ) {
          return guardado;
        }

        const inicial =
          nuevaRespuestaCaso(
            config,
          );

        return inicial;
      },
      [
        valor,
        config,
      ],
    );

  const total =
    totalPalabrasCaso(
      estado,
    );

  const dentroDeRango =
    total >=
      config.minPalabras &&
    total <=
      config.maxPalabras;

  const citasCompletas =
    estado.citas.filter(
      (
        cita,
      ) =>
        cita.referencia
          .trim(),
    );

  const citasCumplidas =
    !config.exigirCitas ||
    citasCompletas.length >=
      config.minCitas;

  const preguntasCumplidas =
    !config.estructuraGuiada ||
    estado.respuestas.every(
      (
        item,
      ) =>
        item.respuesta
          .trim(),
    );

  const guardar =
    (
      proximo:
        RespuestaCasoEstado,
    ) =>
      onChange(
        serializarRespuestaCaso(
          proximo,
        ),
      );

  const editarRespuesta =
    (
      id:
        number,
      respuesta:
        string,
    ) =>
      guardar(
        {
          ...estado,
          respuestas:
            estado.respuestas.map(
              (
                item,
              ) =>
                item.id ===
                  id
                  ? {
                      ...item,
                      respuesta,
                    }
                  : item,
            ),
        },
      );

  const editarConclusion =
    (
      conclusion:
        string,
    ) =>
      guardar(
        {
          ...estado,
          conclusion,
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

  const [documentosAbiertos, setDocumentosAbiertos] =
    useState<Record<number, boolean>>({});

  const contarRespuesta =
    (
      item:
        RespuestaCasoItem,
    ) =>
      item.respuesta
        .trim()
        ? item.respuesta
            .replace(
              /\s+/g,
              ' ',
            )
            .split(' ')
            .length
        : 0;

  const alternarDocumento =
    (
      id:
        number,
    ) =>
      setDocumentosAbiertos(
        (
          actual,
        ) => ({
          ...actual,
          [
            id
          ]:
            !actual[id],
        }),
      );

  return (
    <>
      <div
        className="ecp"
      >
        <div className="ecp__panel">
          <div className="ecp__panel-titulo">
            <span className="ecp__panel-icono">
              <Scale
                size={19}
              />
            </span>

            <div>
              <strong>
                {
                  config.tituloCaso ||
                  'Caso práctico'
                }
              </strong>

              <small>
                Resuelve el caso con fundamento en los documentos y preguntas planteadas.
              </small>
            </div>
          </div>

          <div className={`ecp__contador ${dentroDeRango ? 'bueno' : 'aviso'}`}>
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

          <div className="ecp__insignias">
            <span>
              {
                config.preguntas.length
              }{' '}
              pregunta(s)
            </span>

            <span>
              {config.exigirCitas
                ? `Mínimo ${config.minCitas} fuente(s) citada(s)`
                : 'Citas opcionales'}
            </span>
          </div>
        </div>

        <div className="ecp__caso">
          <div className="ecp__caso-titulo">
            <Gavel
              size={16}
            />

            <strong>
              Planteamiento del caso
            </strong>
          </div>

          <p>
            {
              estado.contexto
                .trim() ||
              'Sin contexto definido por el docente.'
            }
          </p>

          {estado.partes.length >
            0 && (
            <div className="ecp__partes">
              {estado.partes.map(
                (
                  parte,
                  indice,
                ) => (
                  <span
                    key={
                      indice
                    }
                  >
                    <UsersRound
                      size={13}
                    />

                    <strong>
                      {
                        parte.rol
                      }
                    </strong>

                    {
                      parte.nombre
                    }
                  </span>
                ),
              )}
            </div>
          )}

          {config.documentos.length >
            0 && (
            <div className="ecp__documentos">
              <span className="ecp__documentos-titulo">
                <FileText
                  size={14}
                />

                Documentos del expediente
              </span>

              {config.documentos.map(
                (
                  documento,
                ) => (
                  <details
                    key={
                      documento.id
                    }
                    className="ecp__documento"
                  >
                    <summary
                      onClick={() =>
                        alternarDocumento(
                          documento.id ?? 0,
                        )
                      }
                    >
                      {
                        documentosAbiertos[
                          documento.id ?? 0
                        ]
                          ? <ChevronDown size={14} />
                          : <ChevronRight size={14} />
                      }

                      {documento.titulo ||
                        'Documento'}
                    </summary>

                    <p>
                      {
                        documento.contenido
                      }
                    </p>
                  </details>
                ),
              )}
            </div>
          )}
        </div>

        <div className="ecp__respuestas">
          <div className="ecp__bloque-titulo">
            <Landmark
              size={16}
            />

            <strong>
              Tu resolución
            </strong>

            {config.estructuraGuiada && (
              <small className={preguntasCumplidas ? 'ok' : 'falta'}>
                {preguntasCumplidas
                  ? 'Todas las preguntas respondidas'
                  : 'Faltan preguntas por responder'}
              </small>
            )}
          </div>

          {estado.respuestas.map(
            (
              item,
            ) => (
              <div
                key={
                  item.id
                }
                className="ecp__pregunta"
              >
                <div className="ecp__pregunta-titulo">
                  <strong>
                    {
                      item.enunciado
                    }
                  </strong>

                  <small>
                    {
                      contarRespuesta(
                        item,
                      )
                    }{' '}
                    palabras
                  </small>
                </div>

                {config.preguntas.find(
                  (
                    pregunta,
                  ) =>
                    pregunta.id ===
                    item.id,
                )?.pista && (
                  <p className="ecp__pregunta-pista">
                    Pista: {
                      config.preguntas.find(
                        (
                          pregunta,
                        ) =>
                          pregunta.id ===
                          item.id,
                      )?.pista
                    }
                  </p>
                )}

                <textarea
                  className="ecp__textarea"
                  value={
                    item.respuesta
                  }
                  maxLength={
                    50000
                  }
                  placeholder="Argumenta tu respuesta con fundamento jurídico..."
                  onChange={(
                    evento,
                  ) =>
                    editarRespuesta(
                      item.id,
                      evento.target
                        .value,
                    )
                  }
                />
              </div>
            ),
          )}

          <div className="ecp__pregunta">
            <div className="ecp__pregunta-titulo">
              <strong>
                Conclusión fundamentada
              </strong>

              <small>
                {
                  estado.conclusion
                    .trim()
                    ? estado.conclusion
                        .replace(
                          /\s+/g,
                          ' ',
                        )
                        .split(' ')
                        .length
                    : 0
                }{' '}
                palabras
              </small>
            </div>

            <p className="ecp__pregunta-pista">
              Cierra con tu postura final sobre el caso, sustentada en el análisis anterior.
            </p>

            <textarea
              className="ecp__textarea"
              value={
                estado.conclusion
              }
              maxLength={
                50000
              }
              placeholder="Conclusión sobre la solución del caso..."
              onChange={(
                evento,
              ) =>
                editarConclusion(
                  evento.target
                    .value,
                )
              }
            />
          </div>
        </div>

        <div className="ecp__citas">
          <div className="ecp__citas-titulo">
            <span className="ecp__citas-icono">
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
          </div>

          {config.exigirCitas &&
            !citasCumplidas && (
              <p className="ecp__citas-pendiente">
                Aún faltan fuentes para cumplir el requisito del docente.
              </p>
            )}

          {estado.citas.length >
            0 && (
            <div className="ecp__citas-lista">
              {estado.citas.map(
                (
                  cita,
                ) => (
                  <div
                    key={
                      cita.id
                    }
                    className="ecp__cita"
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

                    <div className="ecp__cita-campos">
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
                      className="ecp__cita-quitar"
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

        <div className="ecp__estado">
          <CheckCircle2
            size={15}
          />

          <span>
            {!preguntasCumplidas
              ? 'Responde todas las preguntas del caso.'
              : dentroDeRango
                ? 'Dentro del rango de palabras'
                : total <
                    config.minPalabras
                  ? `Te faltan ${config.minPalabras - total} palabra(s) para el mínimo.`
                  : `Superaste el máximo en ${total - config.maxPalabras} palabra(s).`}
          </span>
        </div>
      </div>

      {estilos}
    </>
  );
}

const estilos = (
  <style>{`
    .ecp {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .ecp__panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(255,255,255,0.45);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 14px 16px;
    }

    .ecp__panel-titulo {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .ecp__panel-icono {
      width: 36px;
      height: 36px;
      flex: 0 0 36px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--app-primario, #8a6b4d);
      color: #fff;
    }

    .ecp__panel-titulo strong {
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .ecp__panel-titulo small {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ecp__contador {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      align-self: flex-start;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }

    .ecp__contador.bueno {
      background: rgba(35,132,83,0.12);
      color: #238453;
    }

    .ecp__contador.aviso {
      background: rgba(178,89,39,0.14);
      color: #b25927;
    }

    .ecp__contador small {
      font-weight: 500;
    }

    .ecp__insignias {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .ecp__insignias span {
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(120,110,95,0.08);
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ecp__caso {
      display: flex;
      flex-direction: column;
      gap: 9px;
      background: rgba(255,255,255,0.45);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 14px 16px;
    }

    .ecp__caso-titulo,
    .ecp__bloque-titulo {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--app-primario, #8a6b4d);
    }

    .ecp__caso-titulo strong,
    .ecp__bloque-titulo strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .ecp__caso > p {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .ecp__partes {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .ecp__partes span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      padding: 5px 11px;
      font-size: 12px;
      background: rgba(138,107,77,0.10);
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ecp__partes strong {
      color: #5b4a34;
      margin-right: 2px;
    }

    .ecp__documentos {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-top: 1px dashed rgba(120,110,95,0.35);
      padding-top: 10px;
    }

    .ecp__documentos-titulo {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: var(--app-texto, #2b2b2b);
    }

    .ecp__documento {
      border: 1px solid rgba(120,110,95,0.25);
      border-radius: 9px;
      background: #fff;
    }

    .ecp__documento summary {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 600;
      color: #5b4a34;
      list-style: none;
    }

    .ecp__documento summary::-webkit-details-marker {
      display: none;
    }

    .ecp__documento > p {
      margin: 0;
      padding: 0 12px 10px;
      white-space: pre-wrap;
      line-height: 1.55;
      font-size: 12.5px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ecp__respuestas {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ecp__bloque-titulo small {
      margin-left: auto;
      font-size: 11px;
      font-weight: 600;
    }

    .ecp__bloque-titulo small.ok {
      color: #238453;
    }

    .ecp__bloque-titulo small.falta {
      color: #b25927;
    }

    .ecp__pregunta {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .ecp__pregunta-titulo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .ecp__pregunta-titulo strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .ecp__pregunta-titulo small {
      font-size: 11px;
      font-weight: 600;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ecp__pregunta-pista {
      margin: 0;
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ecp__textarea {
      width: 100%;
      min-height: 120px;
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

    .ecp__textarea:focus {
      border-color: var(--app-primario, #8a6b4d);
      box-shadow: 0 0 0 3px rgba(138,107,77,0.14);
    }

    .ecp__citas {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(255,255,255,0.45);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 14px 16px;
    }

    .ecp__citas-titulo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ecp__citas-icono {
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      display: grid;
      place-items: center;
      border-radius: 9px;
      background: rgba(138,107,77,0.14);
      color: var(--app-primario, #8a6b4d);
    }

    .ecp__citas-titulo > div {
      flex: 1;
    }

    .ecp__citas-titulo strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .ecp__citas-titulo small {
      display: block;
      font-size: 11px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ecp__citas-titulo button {
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

    .ecp__citas-pendiente {
      margin: 0;
      font-size: 12px;
      color: #b25927;
    }

    .ecp__citas-lista {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ecp__cita {
      display: grid;
      grid-template-columns: 130px 1fr auto;
      gap: 8px;
      align-items: start;
    }

    .ecp__cita select,
    .ecp__cita input {
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 12px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .ecp__cita select {
      cursor: pointer;
    }

    .ecp__cita-campos {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .ecp__cita-quitar {
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

    .ecp__estado {
      display: flex;
      align-items: center;
      gap: 7px;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 12px;
      background: rgba(35,132,83,0.10);
      color: #238453;
    }

    @media (max-width: 640px) {
      .ecp__cita {
        grid-template-columns: 1fr;
      }
    }
  `}</style>
);