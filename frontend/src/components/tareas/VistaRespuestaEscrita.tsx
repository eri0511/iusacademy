import {
  useMemo,
} from 'react';

import {
  BookMarked,
  Gavel,
  Type,
} from 'lucide-react';

import {
  SECCIONES_RESPUESTA_ESCRITA,
  TIPOS_CITA_JURIDICA,
  parsearRespuestaEscrita,
  totalPalabrasRespuesta,
} from '../../utils/tareas/respuestaEscrita';

type Props = {
  contenido: string;
};

export default function VistaRespuestaEscrita(
  {
    contenido,
  }: Props,
) {
  const estado =
    useMemo(
      () =>
        parsearRespuestaEscrita(
          contenido,
        ),
      [
        contenido,
      ],
    );

  const total =
    estado
      ? totalPalabrasRespuesta(
          estado,
        )
      : 0;

  if (
    !estado
  ) {
    return (
      <div className="vre vre--plano">
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
      <div className="vre">
        <div className="vre__cabecera">
          <span className="vre__cabecera-icono">
            <Gavel
              size={17}
            />
          </span>

          <strong>
            Respuesta jurídica
          </strong>

          <span className="vre__palabras">
            <Type
              size={14}
            />

            {total}{' '}
            palabras
          </span>
        </div>

        <div className="vre__secciones">
          {SECCIONES_RESPUESTA_ESCRITA.map(
            (
              seccion,
            ) => {
              const texto =
                estado.secciones[
                  seccion.clave
                ]?.trim();

              if (
                !texto
              ) {
                return null;
              }

              return (
                <section
                  key={
                    seccion.clave
                  }
                  className="vre__seccion"
                >
                  <h4>
                    {
                      seccion.titulo
                    }
                  </h4>

                  <p>
                    {
                      texto
                    }
                  </p>
                </section>
              );
            },
          )}
        </div>

        {estado.citas.length >
          0 && (
          <div className="vre__citas">
            <div className="vre__citas-titulo">
              <span className="vre__citas-icono">
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
                    <span className="vre__cita-tipo">
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
    .vre {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .vre--plano p {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .vre__cabecera {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .vre__cabecera-icono,
    .vre__citas-icono {
      width: 30px;
      height: 30px;
      flex: 0 0 30px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: rgba(138,107,77,0.14);
      color: var(--app-primario, #8a6b4d);
    }

    .vre__palabras {
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

    .vre__secciones {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .vre__seccion {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .vre__seccion h4 {
      margin: 0;
      font-size: 13px;
      color: #5b4a34;
    }

    .vre__seccion p {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .vre__citas {
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-left: 3px solid rgba(138,107,77,0.45);
      background: rgba(138,107,77,0.06);
      border-radius: 0 10px 10px 0;
      padding: 10px 12px;
    }

    .vre__citas-titulo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .vre__citas ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .vre__citas li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .vre__cita-tipo {
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

    .vre__citas li > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .vre__citas em {
      font-style: normal;
      font-weight: 600;
      font-size: 12.5px;
      color: var(--app-texto, #2b2b2b);
    }

    .vre__citas small {
      font-size: 12px;
      line-height: 1.45;
      color: var(--app-texto-suave, #6b6b6b);
      white-space: pre-wrap;
    }
  `}</style>
);