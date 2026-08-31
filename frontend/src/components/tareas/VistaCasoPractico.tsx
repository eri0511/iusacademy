import {
  useMemo,
} from 'react';

import {
  BookMarked,
  Scale,
  Type,
  UsersRound,
} from 'lucide-react';

import {
  parsearRespuestaCaso,
  totalPalabrasCaso,
} from '../../utils/tareas/casoPractico';

import {
  TIPOS_CITA_JURIDICA,
} from '../../utils/tareas/respuestaEscrita';

type Props = {
  contenido: string;
};

export default function VistaCasoPractico(
  {
    contenido,
  }: Props,
) {
  const estado =
    useMemo(
      () =>
        parsearRespuestaCaso(
          contenido,
        ),
      [
        contenido,
      ],
    );

  const total =
    estado
      ? totalPalabrasCaso(
          estado,
        )
      : 0;

  if (
    !estado
  ) {
    return (
      <div className="vcp vcp--plano">
        <p>
          {
            contenido
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="vcp">
        <div className="vcp__cabecera">
          <span className="vcp__cabecera-icono">
            <Scale
              size={17}
            />
          </span>

          <strong>
            Resolución del caso
          </strong>

          <span className="vcp__palabras">
            <Type
              size={14}
            />

            {total}{' '}
            palabras
          </span>
        </div>

        {estado.contexto.trim() && (
          <div className="vcp__contexto">
            <h4>
              Planteamiento del caso
            </h4>

            <p>
              {
                estado.contexto
              }
            </p>

            {estado.partes.length >
              0 && (
              <ul className="vcp__partes">
                {estado.partes.map(
                  (
                    parte,
                    indice,
                  ) => (
                    <li
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

                      <span>
                        {
                          parte.nombre
                        }
                      </span>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        )}

        <div className="vcp__respuestas">
          {estado.respuestas.map(
            (
              item,
            ) => {
              if (
                !item.respuesta.trim()
              ) {
                return null;
              }

              return (
                <section
                  key={
                    item.id
                  }
                  className="vcp__respuesta"
                >
                  <h4>
                    {
                      item.enunciado
                    }
                  </h4>

                  <p>
                    {
                      item.respuesta
                    }
                  </p>
                </section>
              );
            },
          )}

          {estado.conclusion.trim() && (
            <section className="vcp__conclusion">
              <h4>
                Conclusión fundamentada
              </h4>

              <p>
                {
                  estado.conclusion
                }
              </p>
            </section>
          )}
        </div>

        {estado.citas.length >
          0 && (
          <div className="vcp__citas">
            <div className="vcp__citas-titulo">
              <span className="vcp__citas-icono">
                <BookMarked
                  size={15}
                />
              </span>

              <strong>
                Fuentes citadas
              </strong>
            </div>

            <ul>
              {estado.citas.map(
                (
                  cita,
                ) => (
                  <li
                    key={
                      cita.id
                    }
                  >
                    <span className="vcp__cita-tipo">
                      {
                        TIPOS_CITA_JURIDICA.find(
                          (
                            tipo,
                          ) =>
                            tipo.valor ===
                            cita.tipo,
                        )
                          ?.texto ??
                        cita.tipo
                      }
                    </span>

                    <div>
                      <em>
                        {
                          cita.referencia
                        }
                      </em>

                      {cita.fundamento.trim() && (
                        <small>
                          {
                            cita.fundamento
                          }
                        </small>
                      )}
                    </div>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </div>

      {estilos}
    </>
  );
}

const estilos = (
  <style>{`
    .vcp {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .vcp--plano p {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .vcp__cabecera {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .vcp__cabecera-icono,
    .vcp__citas-icono {
      width: 30px;
      height: 30px;
      flex: 0 0 30px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: rgba(138,107,77,0.14);
      color: var(--app-primario, #8a6b4d);
    }

    .vcp__palabras {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-left: auto;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(120,110,95,0.08);
      color: var(--app-texto-suave, #6b6b6b);
    }

    .vcp__contexto {
      display: flex;
      flex-direction: column;
      gap: 7px;
      border-left: 3px solid rgba(138,107,77,0.45);
      background: rgba(138,107,77,0.06);
      border-radius: 0 10px 10px 0;
      padding: 12px 14px;
    }

    .vcp__contexto h4,
    .vcp__respuesta h4,
    .vcp__conclusion h4 {
      margin: 0;
      font-size: 13px;
      color: #5b4a34;
    }

    .vcp__contexto p {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 13.5px;
      color: var(--app-texto, #2b2b2b);
    }

    .vcp__partes {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .vcp__partes li {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11.5px;
      background: rgba(138,107,77,0.12);
      color: var(--app-texto-suave, #6b6b6b);
    }

    .vcp__partes li strong {
      color: #5b4a34;
      margin-right: 1px;
    }

    .vcp__respuestas {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .vcp__respuesta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .vcp__respuesta p,
    .vcp__conclusion p {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .vcp__conclusion {
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-top: 1px dashed rgba(120,110,95,0.35);
      padding-top: 10px;
    }

    .vcp__citas {
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-left: 3px solid rgba(138,107,77,0.45);
      background: rgba(138,107,77,0.06);
      border-radius: 0 10px 10px 0;
      padding: 10px 12px;
    }

    .vcp__citas-titulo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .vcp__citas ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .vcp__citas li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .vcp__cita-tipo {
      flex: 0 0 auto;
      border-radius: 999px;
      padding: 2px 9px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      background: rgba(138,107,77,0.16);
      color: #5b4a34;
    }

    .vcp__citas li > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .vcp__citas em {
      font-style: normal;
      font-weight: 600;
      font-size: 12.5px;
      color: var(--app-texto, #2b2b2b);
    }

    .vcp__citas small {
      font-size: 12px;
      line-height: 1.45;
      color: var(--app-texto-suave, #6b6b6b);
      white-space: pre-wrap;
    }
  `}</style>
);