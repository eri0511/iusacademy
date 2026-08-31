import {
  useMemo,
} from 'react';

import {
  BookMarked,
  CheckCircle2,
  Download,
  Plus,
  ScrollText,
  Trash2,
  Type,
} from 'lucide-react';

import {
  TIPOS_PIEZA_JURIDICA,
  compilarRedaccionTxt,
  nuevaRespuestaRedaccion,
  palabrasPorSeccionRedaccion,
  parsearRespuestaRedaccion,
  serializarRespuestaRedaccion,
  totalPalabrasRedaccion,
} from '../../utils/tareas/redaccionJuridica';

import {
  TIPOS_CITA_JURIDICA,
  nuevoIdCita,
} from '../../utils/tareas/respuestaEscrita';

import type {
  ConfiguracionRedaccionJuridica,
  RespuestaRedaccionEstado,
} from '../../utils/tareas/redaccionJuridica';

import type {
  CitaJuridica,
} from '../../utils/tareas/respuestaEscrita';

type Props = {
  valor: string;
  config:
    ConfiguracionRedaccionJuridica;
  onChange: (
    serializado:
      string,
  ) => void;
};

export default function EditorRedaccionJuridica(
  {
    valor,
    config,
    onChange,
  }: Props,
) {
  const estado =
    useMemo<RespuestaRedaccionEstado>(
      () => {
        const guardado =
          parsearRespuestaRedaccion(
            valor,
          );

        if (
          guardado
        ) {
          return guardado;
        }

        return nuevaRespuestaRedaccion(
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
        palabrasPorSeccionRedaccion(
          estado,
        ),
      [
        estado,
      ],
    );

  const total =
    totalPalabrasRedaccion(
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

  const seccionesCumplidas =
    !config.estructuraGuiada ||
    estado.secciones.every(
      (
        seccion,
      ) =>
        seccion.contenido
          .trim(),
    );

  const guardar =
    (
      proximo:
        RespuestaRedaccionEstado,
    ) =>
      onChange(
        serializarRespuestaRedaccion(
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

  const descargarTxt =
    () => {
      const contenidoTxt =
        compilarRedaccionTxt(
          estado,
        );

      const blob =
        new Blob(
          [
            '\ufeff',
            contenidoTxt,
          ],
          {
            type:
              'text/plain;charset=utf-8',
          },
        );

      const url =
        URL.createObjectURL(
          blob,
        );

      const enlace =
        document.createElement(
          'a',
        );

      enlace.href =
        url;

      enlace.download =
        `${estado.tituloDocumento.trim() || 'redaccion_juridica'}.txt`;

      document.body.appendChild(
        enlace,
      );

      enlace.click();

      document.body.removeChild(
        enlace,
      );

      URL.revokeObjectURL(
        url,
      );
    };

  const tipoPiezaInfo =
    TIPOS_PIEZA_JURIDICA.find(
      (
        opcion,
      ) =>
        opcion.valor ===
        estado.tipoPieza,
    );

  return (
    <>
      <div className="erj">
        <div className="erj__panel">
          <div className="erj__panel-cabecera">
            <div className="erj__panel-titulo">
              <span className="erj__panel-icono">
                <ScrollText
                  size={19}
                />
              </span>

              <div>
                <strong>
                  {
                    tipoPiezaInfo?.texto ??
                    'Pieza jurídica'
                  }
                </strong>

                <small>
                  {
                    tipoPiezaInfo?.descripcion
                  }{' '}
                  — redacta cada sección y descarga tu pieza en TXT.
                </small>
              </div>
            </div>

            <div className={`erj__contador ${dentroDeRango ? 'bueno' : 'aviso'}`}>
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

          <div className="erj__titulo">
            <label>
              <span>
                Título del documento
              </span>

              <input
                value={
                  estado.tituloDocumento
                }
                maxLength={
                  180
                }
                placeholder={`Ej. Demanda por incumplimiento de contrato`}
                onChange={(
                  evento,
                ) =>
                  guardar(
                    {
                      ...estado,
                      tituloDocumento:
                        evento.target
                          .value,
                    },
                  )
                }
              />
            </label>

            <button
              type="button"
              className="erj__descargar"
              onClick={
                descargarTxt
              }
            >
              <Download
                size={16}
              />

              Descargar TXT
            </button>
          </div>

          <div className="erj__insignias">
            <span>
              {
                estado.secciones.length
              }{' '}
              sección(es)
            </span>

            <span>
              {config.exigirCitas
                ? `Mínimo ${config.minCitas} fuente(s) citada(s)`
                : 'Citas opcionales'}
            </span>
          </div>
        </div>

        <div className="erj__secciones">
          {estado.secciones.map(
            (
              seccion,
            ) => (
              <div
                key={
                  seccion.id
                }
                className="erj__seccion"
              >
                <div className="erj__seccion-titulo">
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
                  className="erj__textarea"
                  value={
                    seccion.contenido
                  }
                  maxLength={
                    50000
                  }
                  placeholder={`Redacta el contenido de "${seccion.titulo}"...`}
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

        <div className="erj__citas">
          <div className="erj__citas-titulo">
            <span className="erj__citas-icono">
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
              <p className="erj__citas-pendiente">
                Aún faltan fuentes para cumplir el requisito del docente.
              </p>
            )}

          {estado.citas.length >
            0 && (
            <div className="erj__citas-lista">
              {estado.citas.map(
                (
                  cita,
                ) => (
                  <div
                    key={
                      cita.id
                    }
                    className="erj__cita"
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

                    <div className="erj__cita-campos">
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
                      className="erj__cita-quitar"
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

        <div className="erj__estado">
          <CheckCircle2
            size={15}
          />

          <span>
            {!seccionesCumplidas
              ? 'Completa todas las secciones del documento.'
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
    .erj {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .erj__panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(255,255,255,0.45);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 14px 16px;
    }

    .erj__panel-cabecera {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .erj__panel-titulo {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .erj__panel-icono {
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: var(--app-primario, #8a6b4d);
      color: #fff;
    }

    .erj__panel-titulo strong {
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .erj__panel-titulo small {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .erj__contador {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }

    .erj__contador.bueno {
      background: rgba(35,132,83,0.12);
      color: #238453;
    }

    .erj__contador.aviso {
      background: rgba(178,89,39,0.14);
      color: #b25927;
    }

    .erj__contador small {
      font-weight: 500;
    }

    .erj__titulo {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 10px;
    }

    .erj__titulo label {
      flex: 1;
      min-width: 220px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .erj__titulo label > span {
      font-size: 12px;
      font-weight: 700;
      color: var(--app-texto, #2b2b2b);
    }

    .erj__titulo input {
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .erj__descargar {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      border: 0;
      border-radius: 9px;
      padding: 9px 14px;
      font-size: 12.5px;
      font-weight: 600;
      color: #fff;
      background: var(--app-primario, #8a6b4d);
      cursor: pointer;
    }

    .erj__descargar:hover {
      filter: brightness(1.06);
    }

    .erj__insignias {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .erj__insignias span {
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(120,110,95,0.08);
      color: var(--app-texto-suave, #6b6b6b);
    }

    .erj__secciones {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .erj__seccion {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .erj__seccion-titulo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .erj__seccion-titulo strong {
      font-size: 13.5px;
      color: #5b4a34;
    }

    .erj__seccion-titulo small {
      font-size: 11px;
      font-weight: 600;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .erj__seccion-titulo small.tiene {
      color: #238453;
    }

    .erj__seccion > p {
      margin: 0;
      font-size: 12px;
      line-height: 1.4;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .erj__textarea {
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

    .erj__textarea:focus {
      border-color: var(--app-primario, #8a6b4d);
      box-shadow: 0 0 0 3px rgba(138,107,77,0.14);
    }

    .erj__citas {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(255,255,255,0.45);
      border: 1px solid rgba(160,139,106,0.28);
      border-radius: 14px;
      padding: 14px 16px;
    }

    .erj__citas-titulo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .erj__citas-icono {
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      display: grid;
      place-items: center;
      border-radius: 9px;
      background: rgba(138,107,77,0.14);
      color: var(--app-primario, #8a6b4d);
    }

    .erj__citas-titulo > div {
      flex: 1;
    }

    .erj__citas-titulo strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .erj__citas-titulo small {
      display: block;
      font-size: 11px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .erj__citas-titulo button {
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

    .erj__citas-pendiente {
      margin: 0;
      font-size: 12px;
      color: #b25927;
    }

    .erj__citas-lista {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .erj__cita {
      display: grid;
      grid-template-columns: 130px 1fr auto;
      gap: 8px;
      align-items: start;
    }

    .erj__cita select,
    .erj__cita input {
      border: 1px solid rgba(120,110,95,0.35);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 12px;
      background: #fff;
      color: var(--app-texto, #2b2b2b);
      outline: none;
    }

    .erj__cita select {
      cursor: pointer;
    }

    .erj__cita-campos {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .erj__cita-quitar {
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

    .erj__estado {
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
      .erj__cita {
        grid-template-columns: 1fr;
      }

      .erj__titulo {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `}</style>
);