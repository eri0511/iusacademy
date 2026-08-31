import {
  useMemo,
} from 'react';

import {
  BookMarked,
  CheckCircle2,
  Gavel,
  Plus,
  Trash2,
  Type,
} from 'lucide-react';

import {
  SECCIONES_RESPUESTA_ESCRITA,
  TIPOS_CITA_JURIDICA,
  nuevoIdCita,
  nuevaRespuestaEscrita,
  palabrasPorSeccion,
  parsearRespuestaEscrita,
  serializarRespuestaEscrita,
  totalPalabrasRespuesta,
} from '../../utils/tareas/respuestaEscrita';

import type {
  ConfiguracionRespuestaEscrita,
  CitaJuridica,
  RespuestaEscritaEstado,
} from '../../utils/tareas/respuestaEscrita';

type Props = {
  valor: string;
  config:
    ConfiguracionRespuestaEscrita;
  onChange: (
    serializado:
      string,
  ) => void;
};

export default function EditorRespuestaEscrita(
  {
    valor,
    config,
    onChange,
  }: Props,
) {
  const estado =
    useMemo(
      () =>
        parsearRespuestaEscrita(
          valor,
        ) ??
        nuevaRespuestaEscrita(),
      [
        valor,
      ],
    );

  const palabrasPorSeccionActual =
    useMemo(
      () =>
        palabrasPorSeccion(
          estado,
        ),
      [
        estado,
      ],
    );

  const total =
    totalPalabrasRespuesta(
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

  const guardar =
    (
      proximo:
        RespuestaEscritaEstado,
    ) =>
      onChange(
        serializarRespuestaEscrita(
          proximo,
        ),
      );

  const editarSeccion =
    (
      clave:
        string,
      texto:
        string,
    ) =>
      guardar(
        {
          ...estado,
          secciones:
            {
              ...estado.secciones,
              [
                clave
              ]:
                texto,
            },
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

  return (
    <>
      <div className="ere">
        <div className="ere__panel">
          <div className="ere__panel-cabecera">
            <div className="ere__panel-titulo">
              <span className="ere__panel-icono">
                <Gavel
                  size={18}
                />
              </span>

              <div>
                <strong>
                  Respuesta jurídica guiada
                </strong>

                <small>
                  Desarrolla tu respuesta con la estructura y fuentes que solicita el docente.
                </small>
              </div>
            </div>

            <div className={`ere__contador ${dentroDeRango ? 'bueno' : 'aviso'}`}>
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

          <div className="ere__insignias">
            <span>
              {config.estructuraGuiada
                ? 'Estructura guiada'
                : 'Respuesta libre'}
            </span>

            <span>
              {config.exigirCitas
                ? `Mínimo ${config.minCitas} fuente(s) citada(s)`
                : 'Citas opcionales'}
            </span>
          </div>
        </div>

        <div className="ere__secciones">
          {SECCIONES_RESPUESTA_ESCRITA.map(
            (
              seccion,
            ) => (
              <div
                key={
                  seccion.clave
                }
                className="ere__seccion"
              >
                <div className="ere__seccion-titulo">
                  <strong>
                    {seccion.titulo}
                  </strong>

                  <small
                    className={
                      palabrasPorSeccionActual[
                        seccion.clave
                      ] >
                        0
                        ? 'tiene'
                        : ''
                    }
                  >
                    {
                      palabrasPorSeccionActual[
                        seccion.clave
                      ]
                    }{' '}
                    palabras
                  </small>
                </div>

                <p>
                  {
                    seccion.consigna
                  }
                </p>

                <textarea
                  className="ere__textarea"
                  value={
                    estado.secciones[
                      seccion.clave
                    ] ??
                    ''
                  }
                  maxLength={
                    50000
                  }
                  placeholder={`Escribe aquí tu desarrollo de "${seccion.titulo.toLowerCase()}"...`}
                  onChange={(
                    evento,
                  ) =>
                    editarSeccion(
                      seccion.clave,
                      evento.target
                        .value,
                    )
                  }
                />
              </div>
            ),
          )}
        </div>

        <div className="ere__citas">
          <div className="ere__citas-titulo">
            <span className="ere__citas-icono">
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
              <p className="ere__citas-pendiente">
                Aún faltan fuentes para cumplir el requisito del docente.
              </p>
            )}

          {config.bancoNormativo.length >
            0 && (
            <div className="ere__banco">
              <strong>
                Banco normativo sugerido por el docente
              </strong>

              <ul>
                {config.bancoNormativo.map(
                  (
                    item,
                  ) => (
                    <li
                      key={
                        item.id
                      }
                    >
                      <em>
                        {
                          item.norma
                        }
                      </em>

                      {item.detalle &&
                        ` — ${item.detalle}`}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {estado.citas.length >
            0 && (
            <div className="ere__citas-lista">
              {estado.citas.map(
                (
                  cita,
                ) => (
                  <div
                    key={
                      cita.id
                    }
                    className="ere__cita"
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

                    <div className="ere__cita-campos">
                      <input
                        value={
                          cita.referencia
                        }
                        placeholder="Referencia (ej. Código Civil, art. 984)"
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
                      className="ere__cita-quitar"
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

        <div className="ere__estado">
          <CheckCircle2
            size={15}
          />

          <span>
            {dentroDeRango
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
    .ere {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .ere__panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(255,255,255,0.45);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 14px 16px;
    }

    .ere__panel-cabecera {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .ere__panel-titulo {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .ere__panel-icono {
      width: 36px;
      height: 36px;
      flex: 0 0 36px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--app-primario, #8a6b4d);
      color: #fff;
    }

    .ere__panel-titulo strong {
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .ere__panel-titulo small {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ere__contador {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }

    .ere__contador.bueno {
      background: rgba(35,132,83,0.12);
      color: #238453;
    }

    .ere__contador.aviso {
      background: rgba(178,89,39,0.14);
      color: #b25927;
    }

    .ere__contador small {
      font-weight: 500;
    }

    .ere__insignias {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .ere__insignias span {
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(120,110,95,0.08);
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ere__secciones {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ere__seccion {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .ere__seccion-titulo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .ere__seccion-titulo strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .ere__seccion-titulo small {
      font-size: 11px;
      font-weight: 600;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ere__seccion-titulo small.tiene {
      color: #238453;
    }

    .ere__seccion p {
      margin: 0;
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ere__textarea {
      width: 100%;
      min-height: 130px;
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

    .ere__textarea:focus {
      border-color: var(--app-primario, #8a6b4d);
      box-shadow: 0 0 0 3px rgba(138,107,77,0.14);
    }

    .ere__citas {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(255,255,255,0.45);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 14px 16px;
    }

    .ere__citas-titulo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ere__citas-icono {
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      display: grid;
      place-items: center;
      border-radius: 9px;
      background: rgba(138,107,77,0.14);
      color: var(--app-primario, #8a6b4d);
    }

    .ere__citas-titulo > div {
      flex: 1;
    }

    .ere__citas-titulo strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .ere__citas-titulo small {
      display: block;
      font-size: 11px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ere__citas-titulo button {
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

    .ere__citas-pendiente {
      margin: 0;
      font-size: 12px;
      color: #b25927;
    }

    .ere__banco {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-left: 3px solid rgba(138,107,77,0.45);
      background: rgba(138,107,77,0.06);
      border-radius: 0 10px 10px 0;
      padding: 10px 12px;
    }

    .ere__banco strong {
      font-size: 12px;
      color: var(--app-texto, #2b2b2b);
    }

    .ere__banco ul {
      margin: 0;
      padding-left: 18px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .ere__banco li em {
      font-style: normal;
      font-weight: 600;
      color: #5b4a34;
    }

    .ere__citas-lista {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ere__cita {
      display: grid;
      grid-template-columns: 130px 1fr auto;
      gap: 8px;
      align-items: start;
    }

    .ere__cita select,
    .ere__cita input {
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 12px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .ere__cita select {
      cursor: pointer;
    }

    .ere__cita-campos {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .ere__cita-quitar {
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

    .ere__estado {
      display: flex;
      align-items: center;
      gap: 7px;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 12px;
    }

    .ere__estado {
      background: rgba(35,132,83,0.10);
      color: #238453;
    }

    @media (max-width: 640px) {
      .ere__palabras {
        grid-template-columns: 1fr;
      }

      .ere__cita {
        grid-template-columns: 1fr;
      }
    }
  `}</style>
);