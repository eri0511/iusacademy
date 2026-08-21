import {
  Ban,
  Download,
  Eye,
  FileImage,
  FileText,
  Info,
  Lock,
  MessageSquare,
  Paperclip,
  Unlock,
  UsersRound,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import AulaModal from '../aula/AulaModal';
import AvatarUsuario from '../shared/AvatarUsuario';

import type {
  ArchivoForo,
  ComentarioForo,
  RespuestaForo,
} from '../../types/foro/foro-detalle.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const formatearFecha = (
  valor: string,
): string =>
  new Intl.DateTimeFormat(
    'es-BO',
    {
      dateStyle:
        'medium',
      timeStyle:
        'short',
    },
  ).format(
    new Date(
      valor,
    ),
  );

const obtenerNombre = (
  autor: {
    nombres:
      string;
    apellidoPaterno:
      string;
  },
): string =>
  `${autor.nombres.trim().split(/\s+/)[0]} ${autor.apellidoPaterno}`;

const obtenerNombreCorto = (
  autor: {
    nombres:
      string;
    apellidoPaterno:
      string;
  },
): string =>
  `${autor.nombres.trim().split(/\s+/)[0]} ${autor.apellidoPaterno.trim().split(/\s+/)[0]}`;

const obtenerUrlArchivo = (
  archivo:
    ArchivoForo,
): string => {
  const ubicacion =
    archivo.url ??
    archivo.ruta;

  if (
    !ubicacion
  ) {
    return '#';
  }

  if (
    ubicacion.startsWith(
      'http://',
    ) ||
    ubicacion.startsWith(
      'https://',
    )
  ) {
    return ubicacion;
  }

  return `${API_URL}${
    ubicacion.startsWith(
      '/',
    )
      ? ubicacion
      : `/${ubicacion}`
  }`;
};

const nombreArchivo = (
  archivo:
    ArchivoForo,
) =>
  archivo.nombreOriginal ??
  archivo.nombre ??
  'Archivo adjunto';

const extensionArchivo = (
  archivo:
    ArchivoForo,
) =>
  (
    nombreArchivo(
      archivo,
    )
      .split(
        '.',
      )
      .pop() ??
    ''
  ).toLowerCase();

const esImagen = (
  archivo:
    ArchivoForo,
) =>
  Boolean(
    archivo.mimeType?.startsWith(
      'image/',
    ) ||
      /^(png|jpe?g|webp|gif)$/i.test(
        extensionArchivo(
          archivo,
        ),
      ),
  );

const esPdf = (
  archivo:
    ArchivoForo,
) =>
  Boolean(
    archivo.mimeType ===
      'application/pdf' ||
      extensionArchivo(
        archivo,
      ) ===
        'pdf',
  );

const formatearTamanio = (
  bytes?:
    number,
) => {
  if (
    !bytes ||
    bytes <=
      0
  ) {
    return null;
  }

  if (
    bytes <
    1024 *
      1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(
      0,
    )} KB`;
  }

  return `${(
    bytes /
    (
      1024 *
      1024
    )
  ).toFixed(
    1,
  )} MB`;
};

type ArchivoPreview = {
  nombre:
    string;
  url:
    string;
  tipo:
    'IMAGEN' |
    'PDF';
};

type Props = {
  respuesta:
    RespuestaForo;
  numero:
    number;
  procesando:
    boolean;
  onModerar: (
    respuestaId:
      number,
    ocultar:
      boolean,
  ) =>
    void;
  onBloquear: (
    respuestaId:
      number,
    bloquear:
      boolean,
  ) =>
    void;
  onModerarComentario: (
    comentarioId:
      number,
    ocultar:
      boolean,
  ) =>
    void;
};

type ComentarioProps = {
  item:
    ComentarioForo;
  nivel?:
    number;
  procesando:
    boolean;
  onModerar: (
    comentarioId:
      number,
    ocultar:
      boolean,
  ) =>
    void;
};

function Comentario({
  item,
  nivel = 0,
  procesando,
  onModerar,
}: ComentarioProps) {
  const comentarioOculto =
    item.estaOculto ===
    true;

  return (
    <div
      className="rfc-comment"
      style={{
        marginLeft:
          Math.min(
            nivel,
            2,
          ) *
          12,
      }}
    >
      <div className="rfc-comment__head">
        <AvatarUsuario
          fotoPerfilUrl={
            item.autor
              .fotoPerfilUrl
          }
          nombres={
            item.autor
              .nombres
          }
          apellidoPaterno={
            item.autor
              .apellidoPaterno
          }
          size={31}
        />

        <div>
          <strong>
            {obtenerNombre(
              item.autor,
            )}
          </strong>

          <span>
            {formatearFecha(
              item.publicadoEn,
            )}
          </span>
        </div>

        <button
          type="button"
          disabled={
            procesando
          }
          onClick={() =>
            onModerar(
              item.id,
              !comentarioOculto,
            )
          }
        >
          {comentarioOculto
            ? 'Restaurar'
            : 'Moderar'}
        </button>
      </div>

      <p>
        {item.contenido}
      </p>

      {item.archivos &&
        item.archivos.length >
          0 && (
          <div className="rfc-files">
            {item.archivos.map(
              (
                archivo,
              ) => (
                <a
                  key={
                    archivo.id
                  }
                  href={
                    obtenerUrlArchivo(
                      archivo,
                    )
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText
                    size={
                      14
                    }
                  />

                  {nombreArchivo(
                    archivo,
                  )}
                </a>
              ),
            )}
          </div>
        )}

      {item.respuestas?.map(
        (
          respuesta,
        ) => (
          <Comentario
            key={
              respuesta.id
            }
            item={
              respuesta
            }
            nivel={
              nivel +
              1
            }
            procesando={
              procesando
            }
            onModerar={
              onModerar
            }
          />
        ),
      )}
    </div>
  );
}

export default function RespuestaForoCard({
  respuesta,
  numero,
  procesando,
  onModerar,
  onBloquear,
  onModerarComentario,
}: Props) {
  const [
    detalleAbierto,
    setDetalleAbierto,
  ] =
    useState(
      false,
    );

  const [
    archivoPreview,
    setArchivoPreview,
  ] =
    useState<ArchivoPreview | null>(
      null,
    );

  const grupo =
    respuesta.grupoCurso ??
    respuesta.equipoAfinidad ??
    null;

  const integrantes =
    useMemo(
      () =>
        respuesta.grupoCurso
          ?.integrantes ??
        respuesta.equipoAfinidad
          ?.integrantes ??
        [],
      [
        respuesta.grupoCurso,
        respuesta.equipoAfinidad,
      ],
    );

  const modalidad =
    grupo
      ? 'Grupal'
      : 'Individual';

  const estadoEntrega =
    respuesta.entregadaTarde
      ? 'Tardía'
      : 'A tiempo';

  const totalComentarios =
    respuesta._count
      ?.comentarios ??
    respuesta.comentarios
      ?.length ??
    0;

  const totalArchivos =
    respuesta._count
      ?.archivos ??
    respuesta.archivos
      ?.length ??
    0;

  const abrirArchivo = (
    archivo:
      ArchivoForo,
  ) => {
    const url =
      obtenerUrlArchivo(
        archivo,
      );

    if (
      !url ||
      url ===
        '#'
    ) {
      return;
    }

    if (
      esImagen(
        archivo,
      )
    ) {
      setArchivoPreview({
        nombre:
          nombreArchivo(
            archivo,
          ),
        url,
        tipo:
          'IMAGEN',
      });

      return;
    }

    if (
      esPdf(
        archivo,
      )
    ) {
      setArchivoPreview({
        nombre:
          nombreArchivo(
            archivo,
          ),
        url,
        tipo:
          'PDF',
      });

      return;
    }

    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <>
      <article className="rfc-card">
        <button
          type="button"
          className="rfc-card__open"
          onClick={() =>
            setDetalleAbierto(
              true,
            )
          }
        >
          <div className="rfc-card__author-row">
            <AvatarUsuario
              fotoPerfilUrl={
                respuesta.autor
                  .fotoPerfilUrl
              }
              nombres={
                respuesta.autor
                  .nombres
              }
              apellidoPaterno={
                respuesta.autor
                  .apellidoPaterno
              }
              size={44}
            />

            <div className="rfc-card__author-data">
              <strong>
                {obtenerNombre(
                  respuesta.autor,
                )}
              </strong>

              <span>
                Respuesta #{numero}
                {' · '}
                {formatearFecha(
                  respuesta.publicadoEn,
                )}
              </span>
            </div>
          </div>

          <div className="rfc-card__content">
            <h4>
              {respuesta.titulo ||
                'Respuesta principal'}
            </h4>

            <p>
              {respuesta.contenido ||
                'La respuesta no contiene texto.'}
            </p>
          </div>

          <footer className="rfc-card__main-footer">
            <div className="rfc-card__stats">
              <span>
                <MessageSquare
                  size={14}
                />
                {
                  totalComentarios
                }
                {' '}
                comentarios
              </span>

              <span>
                <Paperclip
                  size={14}
                />
                {
                  totalArchivos
                }
                {' '}
                adjunto(s)
              </span>

              {grupo && (
                <span>
                  <UsersRound
                    size={14}
                  />
                  {
                    integrantes.length
                  }
                  {' '}
                  integrantes
                </span>
              )}
            </div>

            <span className="rfc-card__detail">
              <Info
                size={15}
              />
              Ver detalle
            </span>
          </footer>
        </button>

        <div className="rfc-card__actions">
          <button
            type="button"
            disabled={
              procesando
            }
            onClick={() =>
              onBloquear(
                respuesta.id,
                !respuesta.estaBloqueada,
              )
            }
          >
            {respuesta.estaBloqueada
              ? (
                <Unlock
                  size={14}
                />
              )
              : (
                <Lock
                  size={14}
                />
              )}

            {respuesta.estaBloqueada
              ? 'Desbloquear'
              : 'Bloquear'}
          </button>

          <button
            type="button"
            className="danger"
            disabled={
              procesando
            }
            onClick={() =>
              onModerar(
                respuesta.id,
                true,
              )
            }
          >
            <Ban
              size={14}
            />
            Moderar
          </button>
        </div>
      </article>

      <AulaModal
        abierto={
          detalleAbierto
        }
        ancho="amplio"
        titulo={
          respuesta.titulo ||
          'Respuesta principal'
        }
        etiqueta={`Respuesta #${numero}`}
        descripcion={`${obtenerNombre(respuesta.autor)} · ${formatearFecha(respuesta.publicadoEn)}`}
        icono={
          MessageSquare
        }
        onCerrar={() =>
          setDetalleAbierto(
            false,
          )
        }
      >
        <div className="rfc-modal">
          <section className="rfc-modal__summary">
            <AvatarUsuario
              fotoPerfilUrl={
                respuesta.autor
                  .fotoPerfilUrl
              }
              nombres={
                respuesta.autor
                  .nombres
              }
              apellidoPaterno={
                respuesta.autor
                  .apellidoPaterno
              }
              size={48}
            />

            <div>
              <strong>
                {obtenerNombre(
                  respuesta.autor,
                )}
              </strong>

              <span>
                {formatearFecha(
                  respuesta.publicadoEn,
                )}
              </span>
            </div>

            <div className="rfc-modal__badges">
              <span
                className={`rfc-badge ${
                  respuesta.entregadaTarde
                    ? 'is-late'
                    : 'is-on-time'
                }`}
              >
                {
                  estadoEntrega
                }
              </span>

              <span className="rfc-badge is-mode">
                {
                  modalidad
                }
              </span>

              {grupo && (
                <span className="rfc-badge is-group">
                  {
                    grupo.nombre
                  }
                </span>
              )}
            </div>

            {grupo &&
              integrantes.length >
                0 && (
                <div className="rfc-modal__members-inline">
                  <span className="rfc-modal__members-label">
                    <UsersRound size={13} />
                    {integrantes.length} integrantes
                  </span>

                  <div className="rfc-modal__member-chips">
                    {integrantes.map(
                      (
                        integrante,
                      ) => (
                        <span
                          key={
                            integrante.estudianteId
                          }
                          className={`rfc-member-chip ${
                            integrante.esRepresentante
                              ? 'is-representative'
                              : ''
                          }`}
                          title={`${integrante.estudiante.nombres} ${integrante.estudiante.apellidoPaterno}`}
                        >
                          <AvatarUsuario
                            fotoPerfilUrl={
                              integrante.estudiante.fotoPerfilUrl
                            }
                            nombres={
                              integrante.estudiante.nombres
                            }
                            apellidoPaterno={
                              integrante.estudiante.apellidoPaterno
                            }
                            size={25}
                          />

                          <span className="rfc-member-chip__name">
                            {obtenerNombreCorto(
                              integrante.estudiante,
                            )}
                          </span>

                          {integrante.esRepresentante && (
                            <small>
                              Rep.
                            </small>
                          )}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
          </section>

          <section className="rfc-modal__content">
            <span>
              Contenido de la respuesta
            </span>

            <p>
              {respuesta.contenido ||
                'La respuesta no contiene texto.'}
            </p>
          </section>

          {respuesta.archivos &&
            respuesta.archivos.length >
              0 && (
              <section className="rfc-modal__attachments">
                <div className="rfc-modal__section-title">
                  <Paperclip
                    size={17}
                  />

                  <div>
                    <strong>
                      Archivos adjuntos
                    </strong>
                    <span>
                      {
                        respuesta.archivos.length
                      }
                      {' '}
                      archivo(s)
                    </span>
                  </div>
                </div>

                <div className="rfc-attachments">
                  {respuesta.archivos.map(
                    (
                      archivo,
                    ) => {
                      const url =
                        obtenerUrlArchivo(
                          archivo,
                        );

                      const nombre =
                        nombreArchivo(
                          archivo,
                        );

                      const tamanio =
                        formatearTamanio(
                          archivo.tamanioBytes,
                        );

                      const extension =
                        extensionArchivo(
                          archivo,
                        ).toUpperCase();

                      return (
                        <article
                          key={
                            archivo.id
                          }
                          className="rfc-attachment"
                        >
                          <button
                            type="button"
                            className={`rfc-attachment__preview ${
                              esImagen(
                                archivo,
                              )
                                ? 'is-image'
                                : 'is-document'
                            }`}
                            onClick={() =>
                              abrirArchivo(
                                archivo,
                              )
                            }
                          >
                            {esImagen(
                              archivo,
                            ) ? (
                              <img
                                src={
                                  url
                                }
                                alt={
                                  nombre
                                }
                              />
                            ) : (
                              <>
                                <span className="rfc-attachment__type">
                                  {extension ||
                                    'FILE'}
                                </span>

                                <FileText
                                  size={24}
                                />
                              </>
                            )}
                          </button>

                          <div className="rfc-attachment__body">
                            <div>
                              <strong
                                title={
                                  nombre
                                }
                              >
                                {
                                  nombre
                                }
                              </strong>

                              <small>
                                {[
                                  extension ||
                                    null,
                                  tamanio,
                                ]
                                  .filter(
                                    Boolean,
                                  )
                                  .join(
                                    ' · ',
                                  ) ||
                                  archivo.mimeType ||
                                  'Archivo'}
                              </small>
                            </div>

                            <div className="rfc-attachment__actions">
                              <button
                                type="button"
                                onClick={() =>
                                  abrirArchivo(
                                    archivo,
                                  )
                                }
                              >
                                {esImagen(
                                  archivo,
                                ) ? (
                                  <FileImage
                                    size={14}
                                  />
                                ) : (
                                  <Info
                                    size={14}
                                  />
                                )}

                                {esImagen(
                                  archivo,
                                )
                                  ? 'Ver'
                                  : esPdf(
                                        archivo,
                                      )
                                    ? 'Ver PDF'
                                    : 'Abrir'}
                              </button>

                              {url !==
                                '#' && (
                                <a
                                  href={
                                    url
                                  }
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download
                                    size={14}
                                  />
                                  Descargar
                                </a>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              </section>
            )}

          <section className="rfc-modal__comments">
            <div className="rfc-modal__section-title">
              <MessageSquare
                size={17}
              />

              <div>
                <strong>
                  Comentarios
                </strong>
                <span>
                  {
                    totalComentarios
                  }
                  {' '}
                  registrados
                </span>
              </div>
            </div>

            {respuesta.comentarios &&
            respuesta.comentarios.length >
              0 ? (
              <div className="rfc-comments">
                {respuesta.comentarios.map(
                  (
                    comentario,
                  ) => (
                    <Comentario
                      key={
                        comentario.id
                      }
                      item={
                        comentario
                      }
                      procesando={
                        procesando
                      }
                      onModerar={
                        onModerarComentario
                      }
                    />
                  ),
                )}
              </div>
            ) : (
              <p className="rfc-empty">
                Esta respuesta todavía no tiene comentarios.
              </p>
            )}
          </section>
        </div>

        <style>
          {styles}
        </style>
      </AulaModal>

      <AulaModal
        abierto={
          Boolean(
            archivoPreview,
          )
        }
        ancho="amplio"
        titulo={
          archivoPreview?.nombre ??
          'Vista previa'
        }
        etiqueta="Archivo adjunto"
        descripcion={
          archivoPreview?.tipo ===
            'PDF'
            ? 'Vista previa del documento PDF.'
            : 'Vista previa de la imagen adjunta.'
        }
        icono={
          FileText
        }
        onCerrar={() =>
          setArchivoPreview(
            null,
          )
        }
      >
        {archivoPreview && (
          <div className="rfc-file-preview">
            {archivoPreview.tipo ===
              'IMAGEN' ? (
              <div className="rfc-file-preview__image">
                <img
                  src={
                    archivoPreview.url
                  }
                  alt={
                    archivoPreview.nombre
                  }
                />
              </div>
            ) : (
              <div className="rfc-file-preview__pdf">
                <iframe
                  src={
                    archivoPreview.url
                  }
                  title={
                    archivoPreview.nombre
                  }
                />
              </div>
            )}

            <div className="rfc-file-preview__actions">
              <a
                href={
                  archivoPreview.url
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye
                  size={14}
                />
                Abrir original
              </a>

              <a
                href={
                  archivoPreview.url
                }
                download
                target="_blank"
                rel="noopener noreferrer"
                className="primary"
              >
                <Download
                  size={14}
                />
                Descargar
              </a>
            </div>
          </div>
        )}

        <style>
          {styles}
        </style>
      </AulaModal>

      <style>
        {styles}
      </style>
    </>
  );
}

const styles = `
  .rfc-card {
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 17px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .rfc-card__open {
    width: 100%;
    display: block;
    padding: 18px 20px 14px;
    border: 0;
    color: inherit;
    background: transparent;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .rfc-card__open:hover {
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 14%,
        var(--app-surface)
      );
  }

  .rfc-card__author-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .rfc-card__author-data {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .rfc-card__author-data strong {
    color: var(--app-text);
    font-size: 11.5px;
    font-weight: 850;
  }

  .rfc-card__author-data span {
    color: var(--app-text-muted);
    font-size: 8.8px;
  }

  .rfc-card__content {
    margin-top: 14px;
  }

  .rfc-card__content h4 {
    margin: 0;
    color: var(--app-text);
    font-size: 12px;
    font-weight: 850;
  }

  .rfc-card__content p {
    display: -webkit-box;
    margin: 7px 0 0;
    overflow: hidden;
    color: var(--app-text-secondary);
    font-size: 10.5px;
    line-height: 1.55;
    white-space: pre-wrap;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .rfc-card__main-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 18px;
    padding-top: 12px;
    border-top: 1px solid var(--app-border-soft);
  }

  .rfc-card__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: var(--app-text-muted);
    font-size: 8.7px;
  }

  .rfc-card__stats span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .rfc-card__detail {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    flex: 0 0 auto;
    min-height: 34px;
    padding: 7px 10px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--app-accent) 42%,
        var(--app-border)
      );
    border-radius: 10px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font-size: 8.7px;
    font-weight: 850;
    white-space: nowrap;
  }

  .rfc-card__actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    padding: 9px 12px;
    border-top: 1px solid var(--app-border-soft);
    background: var(--app-surface-alt);
  }

  .rfc-card__actions button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    font-size: 8.7px;
    font-weight: 750;
    cursor: pointer;
  }

  .rfc-card__actions .danger {
    color: var(--app-danger);
  }

  /*
   * El contenido del detalle es el que hace scroll.
   * El encabezado del AulaModal permanece visible y el modal
   * ya no crece hasta salirse de la pantalla.
   */
  .rfc-modal {
    max-height:
      min(
        66vh,
        680px
      );
    display: grid;
    gap: 9px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 5px;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--app-border-strong) transparent;
    scrollbar-gutter: stable;
  }

  .rfc-modal::-webkit-scrollbar,
  .rfc-comments::-webkit-scrollbar,
  .rfc-modal__content p::-webkit-scrollbar {
    width: 7px;
  }

  .rfc-modal::-webkit-scrollbar-thumb,
  .rfc-comments::-webkit-scrollbar-thumb,
  .rfc-modal__content p::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: var(--app-border-strong);
  }

  .rfc-modal__summary,
  .rfc-modal__content,
  .rfc-modal__attachments,
  .rfc-modal__comments {
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface);
  }

  .rfc-modal__summary {
    display: grid;
    grid-template-columns:
      48px
      minmax(0, 1fr)
      auto;
    align-items: center;
    gap: 10px;
    background: var(--app-surface-alt);
  }

  .rfc-modal__summary > div:nth-child(2) {
    display: grid;
    gap: 3px;
  }

  .rfc-modal__summary strong {
    font-size: 11.5px;
  }

  .rfc-modal__summary span {
    color: var(--app-text-muted);
    font-size: 8.8px;
  }

  .rfc-modal__section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 9px;
    color: var(--app-accent-dark);
  }

  .rfc-modal__section-title > svg {
    padding: 5px;
    width: 28px;
    height: 28px;
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .rfc-modal__section-title > div {
    display: grid;
    gap: 2px;
  }

  .rfc-modal__section-title strong {
    color: var(--app-text);
    font-size: 10.5px;
  }

  .rfc-modal__section-title span {
    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .rfc-modal__members-inline {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
    padding-top: 9px;
    border-top: 1px solid var(--app-border-soft);
  }

  .rfc-modal__members-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    color: var(--app-text-muted) !important;
    font-size: 8px !important;
    font-weight: 800;
    white-space: nowrap;
  }

  .rfc-modal__member-chips {
    min-width: 0;
    display: flex;
    flex: 1;
    align-items: center;
    gap: 5px;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .rfc-member-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    min-height: 31px;
    padding: 3px 8px 3px 3px;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    color: var(--app-text-secondary) !important;
    background: var(--app-surface);
    font-size: 8.7px !important;
    font-weight: 800;
  }

  .rfc-member-chip.is-representative {
    border-color:
      color-mix(
        in srgb,
        var(--app-accent) 30%,
        var(--app-border)
      );
    color: var(--app-accent-dark) !important;
    background: var(--app-accent-soft);
  }

  .rfc-member-chip__name {
    max-width: 165px;
    overflow: hidden;
    color: var(--app-text) !important;
    font-size: 8.9px !important;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rfc-member-chip small {
    color: var(--app-accent-dark);
    font-size: 7px;
    font-weight: 900;
  }

  .rfc-modal__content {
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(
        135deg,
        color-mix(
          in srgb,
          var(--app-accent-soft) 28%,
          var(--app-surface)
        ),
        var(--app-surface)
      );
  }

  .rfc-modal__content::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--app-accent);
  }

  .rfc-modal__content > span {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 4px 8px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 8.5px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .055em;
  }

  /*
   * No reducimos la tipografía. Cuando la respuesta es muy larga,
   * únicamente este bloque adquiere su propio scroll.
   */
  .rfc-modal__content p {
    max-height: 190px;
    margin: 9px 0 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 5px;
    color: var(--app-text-secondary);
    font-size: 10.8px;
    line-height: 1.65;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    scrollbar-width: thin;
  }

  /*
   * Adjuntos compactos:
   * 3 por fila en escritorio, sin obligar a que un PDF o Word
   * ocupe la mitad del modal.
   */
  .rfc-attachments {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );
    align-items: start;
    gap: 8px;
  }

  .rfc-attachment {
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .rfc-attachment__preview {
    position: relative;
    width: 100%;
    height: 88px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 0;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
    cursor: pointer;
  }

  .rfc-attachment__preview.is-image img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    object-position: center;
    background: var(--app-surface);
  }

  .rfc-attachment__preview.is-document {
    gap: 4px;
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 24%,
        var(--app-surface-alt)
      );
  }

  .rfc-attachment__type {
    position: absolute;
    top: 7px;
    left: 7px;
    padding: 3px 5px;
    border-radius: 6px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font-size: 7px;
    font-weight: 900;
  }

  .rfc-attachment__body {
    display: grid;
    gap: 7px;
    padding: 8px 9px 9px;
  }

  .rfc-attachment__body > div:first-child {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .rfc-attachment__body strong {
    overflow: hidden;
    color: var(--app-text);
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rfc-attachment__body small {
    color: var(--app-text-muted);
    font-size: 7.7px;
  }

  .rfc-attachment__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .rfc-attachment__actions button,
  .rfc-attachment__actions a {
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 5px 7px;
    border: 1px solid var(--app-border);
    border-radius: 8px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font: inherit;
    font-size: 7.8px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
  }

  /*
   * Muchos comentarios ya no empujan el resto del contenido.
   */
  .rfc-comments {
    max-height: 230px;
    display: grid;
    gap: 8px;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: var(--app-border-strong) transparent;
  }

  .rfc-comment {
    position: relative;
    padding: 10px 11px;
    overflow: hidden;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    background: var(--app-surface);
  }

  .rfc-comment::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 2px;
    background:
      color-mix(
        in srgb,
        var(--app-accent) 72%,
        transparent
      );
  }

  .rfc-comment__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rfc-comment__head > div:nth-child(2) {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .rfc-comment__head strong {
    color: var(--app-text);
    font-size: 9.4px;
    font-weight: 850;
  }

  .rfc-comment__head span {
    color: var(--app-text-muted);
    font-size: 7.9px;
  }

  .rfc-comment__head button {
    margin-left: auto;
    border: 0;
    color: var(--app-danger);
    background: transparent;
    font: inherit;
    font-size: 8px;
    cursor: pointer;
  }

  .rfc-comment p {
    max-height: 120px;
    margin: 8px 0 0;
    overflow-y: auto;
    color: var(--app-text-secondary);
    font-size: 9.8px;
    line-height: 1.55;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .rfc-files {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 7px;
  }

  .rfc-files a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 7px;
    border: 1px solid var(--app-border);
    border-radius: 8px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    text-decoration: none;
    font-size: 8px;
  }

  .rfc-empty {
    margin: 0;
    padding: 13px;
    border: 1px dashed
      color-mix(
        in srgb,
        var(--app-accent) 24%,
        var(--app-border)
      );
    border-radius: 11px;
    color: var(--app-text-muted);
    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 18%,
        var(--app-surface)
      );
    font-size: 9px;
    text-align: center;
  }

  .rfc-file-preview {
    display: grid;
    gap: 10px;
  }

  .rfc-file-preview__image {
    height:
      min(
        52vh,
        500px
      );
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .rfc-file-preview__image img {
    max-width: 100%;
    max-height: 100%;
    display: block;
    object-fit: contain;
  }

  .rfc-file-preview__pdf {
    height:
      min(
        55vh,
        540px
      );
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .rfc-file-preview__pdf iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }

  .rfc-file-preview__actions {
    display: flex;
    justify-content: flex-end;
    gap: 7px;
  }

  .rfc-file-preview__actions a {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 7px 10px;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font-size: 8.5px;
    font-weight: 800;
    text-decoration: none;
  }

  .rfc-file-preview__actions a.primary {
    border-color: var(--app-accent);
    color: #fff;
    background: var(--app-accent);
  }

  @media (max-height: 760px) {
    .rfc-modal {
      max-height: 58vh;
    }

    .rfc-modal__content p {
      max-height: 145px;
    }

    .rfc-comments {
      max-height: 180px;
    }

    .rfc-file-preview__image,
    .rfc-file-preview__pdf {
      height: 48vh;
    }
  }

  @media (max-width: 1050px) {
    .rfc-attachments {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }
  }

  @media (max-width: 700px) {
    .rfc-modal__summary {
      grid-template-columns:
        40px
        minmax(0, 1fr);
    }

    .rfc-modal__badges {
      grid-column:
        1 / -1;
      justify-self: start;
    }

    .rfc-card__main-footer {
      align-items: flex-start;
      flex-direction: column;
    }

    .rfc-modal__members-inline {
      align-items: flex-start;
      flex-direction: column;
    }

    .rfc-attachments {
      grid-template-columns:
        1fr;
    }

    .rfc-attachment__preview {
      height: 104px;
    }

    .rfc-file-preview__actions {
      flex-direction: column;
    }
  }
`;
