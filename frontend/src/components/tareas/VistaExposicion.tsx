import {
  useMemo,
} from 'react';

import {
  BookMarked,
  Clock3,
  ExternalLink,
  Link2,
  ListChecks,
  Presentation,
  ShieldCheck,
  Type,
} from 'lucide-react';

import {
  estimarMinutosExposicion,
  palabrasPorSeccionExposicion,
  parsearRespuestaExposicion,
  totalPalabrasExposicion,
} from '../../utils/tareas/exposicion';

import {
  TIPOS_CITA_JURIDICA,
} from '../../utils/tareas/respuestaEscrita';

type Props = {
  contenido: string;
};

export default function VistaExposicion(
  {
    contenido,
  }: Props,
) {
  const estado =
    useMemo(
      () =>
        parsearRespuestaExposicion(
          contenido,
        ),
      [
        contenido,
      ],
    );

  const total =
    estado
      ? totalPalabrasExposicion(
          estado,
        )
      : 0;

  const minutos =
    estado
      ? estimarMinutosExposicion(
          total,
        )
      : 0;

  const palabrasPorSeccion =
    estado
      ? palabrasPorSeccionExposicion(
          estado,
        )
      : {};

  const checklistCompletado =
    estado?.checklist.every(
      (
        item,
      ) =>
        item.cumplido,
    ) ??
    false;

  if (
    !estado
  ) {
    return (
      <div className="vex vex--plano">
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
      <div className="vex">
        <div className="vex__cabecera">
          <span className="vex__cabecera-icono">
            <Presentation
              size={17}
            />
          </span>

          <div>
            <strong>
              {
                estado.tema.trim() ||
                'Exposición'
              }
            </strong>

            <small>
              Preparación de la exposición
            </small>
          </div>

          <span className="vex__palabras">
            <Type
              size={14}
            />

            {total}{' '}
            palabras
          </span>
        </div>

        <div className="vex__marcas">
          <span>
            <Clock3
              size={14}
            />

            ~{
              minutos
            } min estimados
          </span>

          <span
            className={
              checklistCompletado
                ? 'ok'
                : ''
            }
          >
            <ListChecks
              size={14}
            />

            Checklist {
              estado.checklist.filter(
                (
                  item,
                ) =>
                  item.cumplido,
              ).length
            }{
              '/' 
            }
            {
              estado.checklist.length
            }
          </span>

          {estado.preparacionConfirmada && (
            <span className="ok">
              <ShieldCheck
                size={14}
              />

              Listo para exponer
            </span>
          )}
        </div>

        <div className="vex__secciones">
          {estado.secciones.map(
            (
              seccion,
            ) => {
              if (
                !seccion.contenido.trim()
              ) {
                return null;
              }

              return (
                <section
                  key={
                    seccion.id
                  }
                  className="vex__seccion"
                >
                  <div className="vex__seccion-titulo">
                    <h4>
                      {
                        seccion.titulo
                      }
                    </h4>

                    <small>
                      {
                        palabrasPorSeccion[
                          seccion.id
                        ] ??
                          0
                      }{' '}
                      palabras
                    </small>
                  </div>

                  <p>
                    {
                      seccion.contenido
                    }
                  </p>
                </section>
              );
            },
          )}
        </div>

        {estado.enlacePresentacion.trim() && (
          <div className="vex__enlace">
            <span className="vex__enlace-icono">
              <Link2
                size={15}
              />
            </span>

            <div>
              <strong>
                Presentación
              </strong>

              <a
                href={
                  estado.enlacePresentacion
                }
                target="_blank"
                rel="noreferrer"
              >
                {
                  estado.enlacePresentacion
                }

                <ExternalLink
                  size={13}
                />
              </a>
            </div>
          </div>
        )}

        {estado.citas.length >
          0 && (
          <div className="vex__citas">
            <div className="vex__citas-titulo">
              <span className="vex__citas-icono">
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
                    <span className="vex__cita-tipo">
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

        {estado.checklist.length >
          0 && (
          <div className="vex__checklist">
            <div className="vex__checklist-titulo">
              <strong>
                Preparación
              </strong>
            </div>

            <ul>
              {estado.checklist.map(
                (
                  item,
                ) => (
                  <li
                    key={
                      item.id
                    }
                    className={
                      item.cumplido
                        ? 'ok'
                        : ''
                    }
                  >
                    <span>
                      {
                        item.cumplido
                          ? '✓'
                          : '·'
                      }
                    </span>

                    {item.texto}
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
    .vex {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .vex--plano p {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .vex__cabecera {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .vex__cabecera-icono,
    .vex__enlace-icono,
    .vex__citas-icono {
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: rgba(138,107,77,0.14);
      color: var(--app-primario, #8a6b4d);
    }

    .vex__cabecera > div {
      display: flex;
      flex-direction: column;
    }

    .vex__cabecera strong {
      font-size: 13.5px;
      color: var(--app-texto, #2b2b2b);
    }

    .vex__cabecera small {
      font-size: 11.5px;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .vex__palabras {
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

    .vex__marcas {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .vex__marcas span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(120,110,95,0.08);
      color: var(--app-texto-suave, #6b6b6b);
    }

    .vex__marcas span.ok {
      background: rgba(35,132,83,0.12);
      color: #238453;
    }

    .vex__secciones {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .vex__seccion {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .vex__seccion-titulo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .vex__seccion-titulo h4 {
      margin: 0;
      font-size: 13px;
      color: #5b4a34;
    }

    .vex__seccion-titulo small {
      font-size: 11px;
      font-weight: 600;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .vex__seccion p {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.65;
      font-size: 14px;
      color: var(--app-texto, #2b2b2b);
    }

    .vex__enlace {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      border-left: 3px solid rgba(138,107,77,0.45);
      background: rgba(138,107,77,0.06);
      border-radius: 0 10px 10px 0;
      padding: 10px 12px;
    }

    .vex__enlace > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .vex__enlace strong {
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .vex__enlace a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      color: var(--app-primario, #8a6b4d);
      text-decoration: none;
      word-break: break-all;
    }

    .vex__citas {
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-left: 3px solid rgba(138,107,77,0.45);
      background: rgba(138,107,77,0.06);
      border-radius: 0 10px 10px 0;
      padding: 10px 12px;
    }

    .vex__citas-titulo,
    .vex__checklist-titulo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--app-texto, #2b2b2b);
    }

    .vex__citas ul,
    .vex__checklist ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .vex__citas li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .vex__cita-tipo {
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

    .vex__citas li > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .vex__citas em {
      font-style: normal;
      font-weight: 600;
      font-size: 12.5px;
      color: var(--app-texto, #2b2b2b);
    }

    .vex__citas small {
      font-size: 12px;
      line-height: 1.45;
      color: var(--app-texto-suave, #6b6b6b);
      white-space: pre-wrap;
    }

    .vex__checklist {
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-top: 1px dashed rgba(120,110,95,0.35);
      padding-top: 10px;
    }

    .vex__checklist li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12.5px;
      line-height: 1.45;
      color: var(--app-texto-suave, #6b6b6b);
    }

    .vex__checklist li span {
      color: rgba(120,110,95,0.5);
      font-weight: 700;
    }

    .vex__checklist li.ok {
      color: #238453;
    }

    .vex__checklist li.ok span {
      color: #238453;
    }
  `}</style>
);