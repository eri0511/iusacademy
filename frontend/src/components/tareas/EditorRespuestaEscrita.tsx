import {
  BookMarked,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  Type,
} from 'lucide-react';

import {
  useMemo,
} from 'react';

import EditorTextoEnriquecidoTarea from './EditorTextoEnriquecidoTarea';

import {
  TIPOS_CITA_JURIDICA,
  nuevoIdCita,
  nuevaRespuestaEscrita,
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
  deshabilitado?: boolean;
};

export default function EditorRespuestaEscrita(
  {
    valor,
    config,
    onChange,
    deshabilitado =
      false,
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

  const total =
    totalPalabrasRespuesta(
      estado,
    );

  const porDebajo =
    total <
    config.minPalabras;

  const dentroDeRango =
    total >=
      config.minPalabras &&
    total <=
      config.maxPalabras;

  const porEncima =
    total >
    config.maxPalabras;

  const porcentajeProgreso =
    Math.min(
      100,
      Math.max(
        0,
        (
          total /
          Math.max(
            1,
            config.maxPalabras,
          )
        ) *
          100,
      ),
    );

  const faltantesMinimo =
    Math.max(
      0,
      config.minPalabras -
        total,
    );

  const excedentesMaximo =
    Math.max(
      0,
      total -
        config.maxPalabras,
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

  const editarRespuesta =
    (
      html:
        string,
    ) =>
      guardar(
        {
          ...estado,
          secciones: {
            respuesta:
              html,
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
        <div className="ere__encabezado">
          <div className="ere__identidad">
            <span className="ere__icono">
              <FileText
                size={18}
              />
            </span>

            <div>
              <strong>
                Redacta tu respuesta
              </strong>

              <small>
                Analiza la consigna y desarrolla una respuesta completa con tu propio criterio jurídico.
              </small>
            </div>
          </div>

          <div
            className={`ere__contador ${
              dentroDeRango
                ? 'is-ok'
                : porEncima
                  ? 'is-over'
                  : 'is-under'
            }`}
            aria-live="polite"
          >
            <Type
              size={15}
            />

            <strong>
              {total}
            </strong>

            <span>
              / {config.maxPalabras}
            </span>

            <i>
              {porDebajo
                ? `Faltan ${faltantesMinimo}`
                : dentroDeRango
                  ? 'Correcto'
                  : `+${excedentesMaximo}`}
            </i>
          </div>
        </div>

        <EditorTextoEnriquecidoTarea
          valor={
            estado.secciones[
              'respuesta'
            ] ??
            ''
          }
          deshabilitado={
            deshabilitado
          }
          altoMinimo={
            360
          }
          placeholder="Escribe aquí tu respuesta. Fundamenta, argumenta y desarrolla tus ideas con claridad..."
          onChange={
            editarRespuesta
          }
        />

        <div
          className={`ere__progreso ${
            dentroDeRango
              ? 'is-ok'
              : porEncima
                ? 'is-over'
                : 'is-under'
          }`}
        >
          <div className="ere__progreso-top">
            <span>
              {porDebajo
                ? `Faltan ${faltantesMinimo} palabra(s) para alcanzar el mínimo`
                : dentroDeRango
                  ? 'Extensión adecuada para la entrega'
                  : `Excediste el máximo por ${excedentesMaximo} palabra(s)`}
            </span>
          </div>

          <div
            className="ere__progreso-barra"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={
              config.maxPalabras
            }
            aria-valuenow={
              Math.min(
                total,
                config.maxPalabras,
              )
            }
          >
            <span
              style={{
                width:
                  `${porcentajeProgreso}%`,
              }}
            />
          </div>

          <div className="ere__progreso-marcas">
            <span>
              0
            </span>

            <span>
              Mín. {config.minPalabras}
            </span>

            <span>
              Máx. {config.maxPalabras}
            </span>
          </div>
        </div>

        <div className="ere__ayuda">
          <span>
            <CheckCircle2
              size={15}
            />
          </span>

          <p>
            IusAcademy no te indica qué apartados debes redactar. El análisis de estructura, fundamentación y calidad jurídica se realizará posteriormente sobre tu respuesta.
          </p>
        </div>

        <section className="ere__citas">
          <header className="ere__citas-header">
            <div className="ere__citas-identidad">
              <span>
                <BookMarked
                  size={17}
                />
              </span>

              <div>
                <strong>
                  Fuentes citadas
                </strong>

                <small>
                  Registra las normas, jurisprudencia o doctrina que utilizaste en tu respuesta.
                </small>
              </div>
            </div>

            <button
              type="button"
              disabled={
                deshabilitado
              }
              onClick={
                agregarCita
              }
            >
              <Plus
                size={15}
              />

              Agregar cita
            </button>
          </header>

          {config.exigirCitas && (
            <div className="ere__citas-requisito">
              <span>
                {
                  citasCompletas.length
                } / {
                  config.minCitas
                }
              </span>

              <p>
                {citasCumplidas
                  ? 'Cumpliste el mínimo de fuentes solicitado.'
                  : `Debes registrar al menos ${config.minCitas} fuente(s).`}
              </p>
            </div>
          )}

          {config.bancoNormativo.length >
            0 && (
            <div className="ere__banco">
              <strong>
                Material normativo sugerido por el docente
              </strong>

              <ul>
                {config.bancoNormativo.map(
                  (
                    item,
                  ) => (
                    <li
                      key={
                        item.id ??
                        item.norma
                      }
                    >
                      <b>
                        {
                          item.norma
                        }
                      </b>

                      {item.detalle
                        ? ` — ${item.detalle}`
                        : ''}
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
                  <article
                    key={
                      cita.id
                    }
                    className="ere__cita"
                  >
                    <select
                      value={
                        cita.tipo
                      }
                      disabled={
                        deshabilitado
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
                        disabled={
                          deshabilitado
                        }
                        placeholder="Referencia, por ejemplo: Código Civil, art. 984"
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
                        disabled={
                          deshabilitado
                        }
                        placeholder="¿Cómo utilizaste esta fuente en tu argumentación?"
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
                      className="ere__quitar"
                      disabled={
                        deshabilitado
                      }
                      title="Quitar cita"
                      onClick={() =>
                        quitarCita(
                          cita.id,
                        )
                      }
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </article>
                ),
              )}
            </div>
          )}
        </section>

      </div>

      <style>{`
        .ere {
          display:
            grid;
          gap:
            10px;
        }

        .ere__encabezado {
          display:
            flex;
          align-items:
            center;
          justify-content:
            space-between;
          flex-wrap:
            wrap;
          gap:
            10px;
          padding:
            0 2px;
        }

        .ere__identidad {
          display:
            flex;
          align-items:
            center;
          gap:
            10px;
          min-width:
            0;
        }

        .ere__icono,
        .ere__citas-identidad > span {
          width:
            38px;
          height:
            38px;
          display:
            grid;
          place-items:
            center;
          flex:
            0 0 38px;
          border-radius:
            11px;
          color:
            var(--app-accent-dark);
          background:
            var(--app-accent-soft);
        }

        .ere__identidad strong,
        .ere__citas-identidad strong {
          display:
            block;
          color:
            var(--app-text);
          font-size:
            var(--app-font-md);
        }

        .ere__identidad small,
        .ere__citas-identidad small {
          display:
            block;
          margin-top:
            2px;
          color:
            var(--app-text-muted);
          font-size:
            var(--app-font-xs);
          line-height:
            1.45;
        }

        .ere__contador {
          display:
            inline-flex;
          align-items:
            center;
          gap:
            5px;
          min-height:
            38px;
          padding:
            7px 10px;
          border:
            1px solid;
          border-radius:
            999px;
          font-size:
            var(--app-font-xs);
          white-space:
            nowrap;
          transition:
            color .18s ease,
            border-color .18s ease,
            background .18s ease;
        }

        .ere__contador strong {
          font-size:
            var(--app-font-md);
        }

        .ere__contador i {
          margin-left:
            3px;
          padding-left:
            8px;
          border-left:
            1px solid
            currentColor;
          font-style:
            normal;
          font-weight:
            850;
        }

        .ere__contador.is-under {
          color:
            #b42318;
          border-color:
            #f7b4ad;
          background:
            #fff1ef;
        }

        .ere__contador.is-ok {
          color:
            #087a49;
          border-color:
            #a8dfc3;
          background:
            #effbf5;
        }

        .ere__contador.is-over {
          color:
            #b54708;
          border-color:
            #f5c48d;
          background:
            #fff7ed;
        }

        .ere__progreso {
          display:
            grid;
          gap:
            5px;
          padding:
            0 2px 2px;
        }

        .ere__progreso-top,
        .ere__progreso-marcas {
          display:
            flex;
          align-items:
            center;
          justify-content:
            space-between;
          gap:
            12px;
        }

        .ere__progreso-top {
          font-size:
            var(--app-font-xs);
        }

        .ere__progreso-top span {
          color:
            var(--app-text-secondary);
        }

        .ere__progreso-top strong {
          font-size:
            var(--app-font-xs);
        }

        .ere__progreso-barra {
          height:
            7px;
          overflow:
            hidden;
          border-radius:
            999px;
          background:
            var(--app-border);
        }

        .ere__progreso-barra > span {
          display:
            block;
          height:
            100%;
          border-radius:
            inherit;
          transition:
            width .18s ease,
            background .18s ease;
        }

        .ere__progreso.is-under
        .ere__progreso-barra > span {
          background:
            #dc2626;
        }

        .ere__progreso.is-ok
        .ere__progreso-barra > span {
          background:
            #16a34a;
        }

        .ere__progreso.is-over
        .ere__progreso-barra > span {
          background:
            #d97706;
        }

        .ere__progreso.is-under
        .ere__progreso-top strong {
          color:
            #b42318;
        }

        .ere__progreso.is-ok
        .ere__progreso-top strong {
          color:
            #087a49;
        }

        .ere__progreso.is-over
        .ere__progreso-top strong {
          color:
            #b54708;
        }

        .ere__progreso-marcas {
          color:
            var(--app-text-muted);
          font-size:
            10px;
        }

        .ere__ayuda {
          display:
            flex;
          align-items:
            center;
          gap:
            7px;
          padding:
            1px 2px;
          color:
            var(--app-text-muted);
        }

        .ere__ayuda > span {
          width:
            24px;
          height:
            24px;
          display:
            grid;
          place-items:
            center;
          flex:
            0 0 24px;
          border-radius:
            999px;
          color:
            var(--app-accent-dark);
          background:
            var(--app-accent-soft);
        }

        .ere__ayuda p {
          margin:
            0;
          color:
            var(--app-text-muted);
          font-size:
            10px;
          line-height:
            1.45;
        }

        .ere__citas {
          display:
            grid;
          gap:
            10px;
          padding:
            14px;
          border:
            1px solid
            var(--app-border);
          border-radius:
            14px;
          background:
            var(--app-surface-alt);
        }

        .ere__citas-header {
          display:
            flex;
          align-items:
            center;
          justify-content:
            space-between;
          gap:
            12px;
          flex-wrap:
            wrap;
        }

        .ere__citas-identidad {
          display:
            flex;
          align-items:
            center;
          gap:
            9px;
        }

        .ere__citas-header > button {
          min-height:
            36px;
          display:
            inline-flex;
          align-items:
            center;
          justify-content:
            center;
          gap:
            6px;
          padding:
            8px 11px;
          border:
            1px solid
            var(--app-accent);
          border-radius:
            10px;
          color:
            #fff;
          background:
            var(--app-accent);
          font:
            inherit;
          font-size:
            var(--app-font-xs);
          font-weight:
            850;
          cursor:
            pointer;
        }

        .ere__citas-header > button:hover:not(:disabled) {
          background:
            var(--app-accent-hover);
          border-color:
            var(--app-accent-hover);
        }

        .ere__citas-header > button:disabled {
          opacity:
            .55;
          cursor:
            not-allowed;
        }

        .ere__citas-requisito {
          display:
            flex;
          align-items:
            center;
          gap:
            8px;
          padding:
            8px 10px;
          border-radius:
            10px;
          color:
            var(--app-text-secondary);
          background:
            var(--app-surface);
        }

        .ere__citas-requisito > span {
          min-width:
            42px;
          padding:
            4px 7px;
          border-radius:
            999px;
          color:
            var(--app-accent-dark);
          background:
            var(--app-accent-soft);
          font-size:
            var(--app-font-xs);
          font-weight:
            900;
          text-align:
            center;
        }

        .ere__citas-requisito p {
          margin:
            0;
          font-size:
            var(--app-font-xs);
        }

        .ere__banco {
          padding:
            10px 11px;
          border:
            1px solid
            color-mix(
              in srgb,
              var(--app-accent) 20%,
              var(--app-border)
            );
          border-radius:
            10px;
          background:
            var(--app-surface);
        }

        .ere__banco > strong {
          color:
            var(--app-accent-dark);
          font-size:
            var(--app-font-xs);
        }

        .ere__banco ul {
          margin:
            7px 0 0;
          padding-left:
            18px;
          color:
            var(--app-text-secondary);
          font-size:
            var(--app-font-xs);
          line-height:
            1.55;
        }

        .ere__citas-lista {
          display:
            grid;
          gap:
            8px;
        }

        .ere__cita {
          display:
            grid;
          grid-template-columns:
            150px
            minmax(
              0,
              1fr
            )
            36px;
          align-items:
            start;
          gap:
            8px;
          padding:
            10px;
          border:
            1px solid
            var(--app-border);
          border-radius:
            11px;
          background:
            var(--app-surface);
        }

        .ere__cita select,
        .ere__cita input {
          width:
            100%;
          min-height:
            38px;
          box-sizing:
            border-box;
          border:
            1px solid
            var(--app-border);
          border-radius:
            9px;
          padding:
            8px 10px;
          color:
            var(--app-text);
          background:
            var(--app-surface);
          font:
            inherit;
          font-size:
            var(--app-font-xs);
          outline:
            none;
        }

        .ere__cita select:focus,
        .ere__cita input:focus {
          border-color:
            var(--app-accent);
          box-shadow:
            0 0 0 3px
            color-mix(
              in srgb,
              var(--app-accent) 10%,
              transparent
            );
        }

        .ere__cita-campos {
          display:
            grid;
          gap:
            7px;
        }

        .ere__quitar {
          width:
            36px;
          height:
            36px;
          display:
            grid;
          place-items:
            center;
          border:
            1px solid
            color-mix(
              in srgb,
              var(--app-danger) 25%,
              var(--app-border)
            );
          border-radius:
            9px;
          color:
            var(--app-danger);
          background:
            var(--app-surface);
          cursor:
            pointer;
        }

        .ere__quitar:disabled,
        .ere__cita select:disabled,
        .ere__cita input:disabled {
          opacity:
            .55;
          cursor:
            not-allowed;
        }

        .ere__estado {
          display:
            flex;
          align-items:
            center;
          gap:
            7px;
          color:
            var(--app-text-muted);
          font-size:
            var(--app-font-xs);
        }

        .ere__estado > svg {
          color:
            currentColor;
        }

        .ere__estado.is-under {
          color:
            #b42318;
        }

        .ere__estado.is-ok {
          color:
            #087a49;
        }

        .ere__estado.is-over {
          color:
            #b54708;
        }

        @media (
          max-width:
            720px
        ) {
          .ere__cita {
            grid-template-columns:
              1fr;
          }

          .ere__quitar {
            justify-self:
              end;
          }
        }
      `}</style>
    </>
  );
}
