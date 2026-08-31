import {
  ClipboardPaste,
  Clock3,
  UsersRound,
} from 'lucide-react';

import {
  parsearDocumentoColaborativo,
  totalPalabrasDocumento,
  estadisticasAutores,
  colorAutor,
  eventosPegadoPorAutor,
} from '../../utils/tareas/documentoColaborativo';

type SesionEdicionVista = {
  autorId: number;
  autorNombre: string;
  segundosActivos: number;
  cantidadPegados: number;
  ultimoLatidoEn: string;
};

type Props = {
  contenido:
    string;
  sesiones?:
    SesionEdicionVista[];
};

function formatearDuracion(
  segundos:
    number,
): string {
  const total =
    Math.max(
      0,
      Math.round(
        segundos,
      ),
    );

  const horas =
    Math.floor(
      total /
        3600,
    );

  const minutos =
    Math.floor(
      (total %
        3600) /
        60,
    );

  if (
    horas >
    0
  ) {
    return `${horas}h ${minutos}m`;
  }

  if (
    minutos >
    0
  ) {
    const secs =
      total %
      60;
    return `${minutos}m ${secs}s`;
  }

  return `${total}s`;
}

function VistaDocumentoColaborativo({
  contenido,
  sesiones,
}: Props) {
  const estado =
    parsearDocumentoColaborativo(
      contenido,
    );

  if (
    !estado
  ) {
    return (
      <p>
        {
          contenido
        }
      </p>
    );
  }

  const total =
    totalPalabrasDocumento(
      estado,
    );

  const autores =
    estadisticasAutores(
      estado,
    );

  const idsAutores =
    [
      ...new Set(
        estado.bloques.map(
          (
            b,
          ) =>
            b.autorId,
        ),
      ),
    ];

  const pegadosPorAutor =
    new Map<
      number,
      number
    >(
      eventosPegadoPorAutor(
        estado,
      ).map(
        (
          p,
        ) => [
          p.autorId,
          p.cantidad,
        ],
      ) as Array<
        [number, number]
      >,
    );

  const sesionPorAutor =
    new Map<
      number,
      SesionEdicionVista
    >();

  sesiones?.forEach(
    (
      sesion,
    ) => {
      sesionPorAutor.set(
        sesion.autorId,
        sesion,
      );
    },
  );

  return (
    <div className="vdc">
      <div className="vdc__bloques">
        {estado.bloques.map(
          (
            bloque,
          ) => {
            const color =
              colorAutor(
                bloque.autorId,
                idsAutores,
              );

            return (
              <article
                key={
                  bloque.id
                }
                className="vdc__bloque"
              >
                <div className="vdc__bloque-barra">
                  <span
                    className="vdc__bloque-color"
                    style={{
                      backgroundColor:
                        color,
                    }}
                  />

                  <span className="vdc__bloque-autor">
                    {
                      bloque.autorNombre
                    }
                  </span>

                  <small>
                    {
                      new Date(
                        bloque.creadoEn,
                      ).toLocaleDateString(
                        'es-BO',
                      )
                    }
                  </small>
                </div>

                <div
                  className="vdc__bloque-contenido"
                  dangerouslySetInnerHTML={{
                    __html:
                      bloque.html ||
                      bloque.contenido ||
                      '(vacío)',
                  }}
                />
              </article>
            );
          },
        )}
      </div>

      {autores.length >
        0 && (
        <div className="vdc__reporte">
          <div className="vdc__reporte-titulo">
            <UsersRound
              size={14}
            />
            <span>
              Contribución por autor
            </span>
          </div>

          {autores.map(
            (
              autor,
            ) => (
              <div
                key={
                  autor.autorId
                }
                className="vdc__autor"
              >
                <div className="vdc__autor-fila">
                  <div className="vdc__autor-info">
                    <span
                      className="vdc__autor-color"
                      style={{
                        backgroundColor:
                          colorAutor(
                            autor.autorId,
                            idsAutores,
                          ),
                      }}
                    />

                    <span className="vdc__autor-nombre">
                      {
                        autor.autorNombre
                      }
                    </span>
                  </div>

                  <div className="vdc__autor-stats">
                    <small>
                      {
                        autor.bloquesCreados
                      }{' '}
                      bloque(s)
                    </small>

                    <small>
                      {
                        autor.totalPalabras
                      }{' '}
                      palabra(s)
                    </small>

                    <span className="vdc__autor-porcentaje">
                      {
                        total >
                          0
                          ? (
                            (
                              autor.totalPalabras /
                              total *
                              100
                            ).toFixed(
                              1,
                            )
                          )
                          : '0.0'
                      }
                      %
                    </span>
                  </div>
                </div>

                <div className="vdc__autor-barra">
                  <span
                    className="vdc__autor-barra__relleno"
                    style={{
                      width:
                        total >
                          0
                          ? `${Math.min(
                              100,
                              (autor.totalPalabras /
                                total *
                                100),
                            )}%`
                          : '0%',
                      backgroundColor:
                        colorAutor(
                          autor.autorId,
                          idsAutores,
                        ),
                    }}
                  />
                </div>

                {(
                  sesionPorAutor.has(
                    autor.autorId,
                  ) ||
                  (pegadosPorAutor.get(
                    autor.autorId,
                  ) ??
                    0) >
                    0
                ) && (
                  <div className="vdc__autor-metricas">
                    {(() => {
                      const sesion =
                        sesionPorAutor.get(
                          autor.autorId,
                        );

                      const pegados =
                        sesion
                          ? sesion.cantidadPegados
                          : (pegadosPorAutor.get(
                              autor.autorId,
                            ) ??
                              0);

                      const segundos =
                        sesion?.segundosActivos;

                      return (
                        <>
                          {typeof segundos ===
                            'number' && (
                            <small className="vdc__autor-metrica">
                              <Clock3
                                size={10}
                              />
                              {
                                formatearDuracion(
                                  segundos,
                                )
                              }{' '}
                              activo(s)
                            </small>
                          )}

                          {pegados >
                            0 && (
                            <small className="vdc__autor-metrica vdc__autor-metrica--pega">
                              <ClipboardPaste
                                size={10}
                              />
                              {
                                pegados
                              }{' '}
                              pegado(s)
                              detectado(s)
                            </small>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ),
          )}

          <div className="vdc__reporte-total">
            <small>
              Total:{' '}
              <strong>
                {
                  total
                }
              </strong>{' '}
              palabras ·{' '}
              {
                autores.length
              }{' '}
              autor(es)
            </small>
          </div>
        </div>
      )}

      <style>{`
        .vdc {
          display: grid;
          gap: 10px;
        }

        .vdc__bloques {
          display: grid;
          gap: 6px;
        }

        .vdc__bloque {
          border: 1px solid var(--app-border);
          border-radius: 8px;
          overflow: hidden;
        }

        .vdc__bloque-barra {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          background: var(--app-surface-alt);
          border-bottom: 1px solid var(--app-border);
          font-size: 9px;
        }

        .vdc__bloque-color {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .vdc__bloque-autor {
          font-weight: 750;
        }

        .vdc__bloque-barra small {
          margin-left: auto;
          color: var(--app-text-secondary);
        }

        .vdc__bloque-contenido {
          margin: 0;
          padding: 8px 10px;
          white-space: pre-wrap;
          font-size: 11px;
          line-height: 1.6;
        }

        .vdc__reporte {
          padding: 8px;
          border: 1px solid var(--app-border);
          border-radius: 8px;
          background: var(--app-surface-alt);
        }

        .vdc__reporte-titulo {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 6px;
          font-size: 10px;
          font-weight: 800;
        }

        .vdc__autor {
          display: grid;
          gap: 3px;
          padding: 5px 0;
        }

        .vdc__autor-fila {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .vdc__autor-info {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .vdc__autor-color {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .vdc__autor-nombre {
          font-size: 10px;
          font-weight: 700;
        }

        .vdc__autor-stats {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .vdc__autor-stats small {
          font-size: 9px;
          color: var(--app-text-secondary);
        }

        .vdc__autor-porcentaje {
          font-size: 10px;
          font-weight: 800;
          color: var(--app-accent, #2563eb);
        }

        .vdc__autor-barra {
          height: 5px;
          border-radius: 999px;
          background: var(--app-border, #e5e7eb);
          overflow: hidden;
        }

        .vdc__autor-barra__relleno {
          display: block;
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .vdc__autor-metricas {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .vdc__autor-metrica {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          color: var(--app-text-secondary);
          background: var(--app-surface, #fff);
          border: 1px solid var(--app-border, #e5e7eb);
          border-radius: 999px;
          padding: 2px 7px;
        }

        .vdc__autor-metrica--pega {
          color: var(--app-danger, #b91c1c);
          border-color: var(--app-danger-soft, #fecaca);
          background: var(--app-danger-bg, #fef2f2);
        }

        .vdc__reporte-total {
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid var(--app-border);
        }

        .vdc__reporte-total small {
          font-size: 9px;
          color: var(--app-text-secondary);
        }

        .vdc__reporte-total strong {
          color: var(--app-text);
        }
      `}</style>
    </div>
  );
}

export default VistaDocumentoColaborativo;
