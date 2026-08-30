import {
  CalendarDays,
  Eye,
  EyeOff,
  LoaderCircle,
  MessageCircle,
  MessageSquareOff,
  Pin,
  Send,
  ExternalLink,
  Library,
  X,
} from 'lucide-react';

import {
  useEffect,
} from 'react';

import AvatarUsuario from '../shared/AvatarUsuario';

import type {
  ComentarioPublicacion,
  PublicacionCurso,
} from '../../types/aula/comunicacion-curso.types';

type DatosComentarios = {
  publicacionId: number;
  total: number;
  comentarios: ComentarioPublicacion[];
};

type DetallePublicacionPanelProps = {
  publicacion: PublicacionCurso;
  comentarios: DatosComentarios | null;
  cargandoComentarios: boolean;

  comentarioTexto: string;
  setComentarioTexto: (
    valor:
      string,
  ) => void;

  comentarioEditando: ComentarioPublicacion | null;
  setComentarioEditando: (
    comentario:
      ComentarioPublicacion | null,
  ) => void;

  textoEdicionComentario: string;
  setTextoEdicionComentario: (
    valor:
      string,
  ) => void;

  usuarioActualId?: number;
  puedeAdministrar: boolean;
  comentarioProcesandoId: number | null;

  onCerrar: () => void;
  onEnviarComentario: () => void;

  onEditarComentario: (
    comentarioId:
      number,
    contenido:
      string,
  ) => Promise<void>;

  onRetirarComentario: (
    comentarioId:
      number,
  ) => Promise<void>;
};

function obtenerEtiquetaTipo(
  tipo:
    string,
): string {
  return tipo
    .toLowerCase()
    .split(
      '_',
    )
    .map(
      (
        palabra,
      ) =>
        palabra.charAt(
          0,
        ).toUpperCase() +
        palabra.slice(
          1,
        ),
    )
    .join(
      ' ',
    );
}

function formatearFecha(
  fecha:
    string,
): string {
  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',
      month:
        'short',
      year:
        'numeric',
      hour:
        '2-digit',
      minute:
        '2-digit',
    },
  ).format(
    new Date(
      fecha,
    ),
  );
}

export default function DetallePublicacionPanel({
  publicacion,
  comentarios,
  cargandoComentarios,
  comentarioTexto,
  setComentarioTexto,
  comentarioEditando,
  setComentarioEditando,
  textoEdicionComentario,
  setTextoEdicionComentario,
  usuarioActualId,
  puedeAdministrar,
  comentarioProcesandoId,
  onCerrar,
  onEnviarComentario,
  onEditarComentario,
  onRetirarComentario,
}: DetallePublicacionPanelProps) {
  const comentariosAbiertos =
    publicacion.comentariosHabilitados;

  useEffect(
    () => {
      const overflowAnterior =
        document.body.style.overflow;

      document.body.style.overflow =
        'hidden';

      const cerrarConEscape =
        (
          evento:
            KeyboardEvent,
        ) => {
          if (
            evento.key ===
            'Escape'
          ) {
            onCerrar();
          }
        };

      window.addEventListener(
        'keydown',
        cerrarConEscape,
      );

      return () => {
        document.body.style.overflow =
          overflowAnterior;

        window.removeEventListener(
          'keydown',
          cerrarConEscape,
        );
      };
    },
    [
      onCerrar,
    ],
  );

  return (
    <div
      className="detalle-modal-backdrop"
      role="presentation"
      onMouseDown={
        onCerrar
      }
    >
      <aside
        className="detalle-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${publicacion.titulo}`}
        onMouseDown={(evento) =>
          evento.stopPropagation()
        }
      >
      <header className="detalle-panel__header">
        <div className="detalle-panel__autor">
          <AvatarUsuario
            fotoPerfilUrl={
              publicacion.autor.fotoPerfilUrl
            }
            nombres={
              publicacion.autor.nombres
            }
            apellidoPaterno={
              publicacion.autor.apellidoPaterno
            }
            size={
              44
            }
            mostrarEstado={
              false
            }
          />

          <div className="detalle-panel__autor-datos">
            <div className="detalle-panel__autor-linea">
              <strong>
                {publicacion.autor.nombres}
                {' '}
                {publicacion.autor.apellidoPaterno}
              </strong>

              <span>
                Docente
              </span>
            </div>

            <small>
              Publicado
              {' · '}
              {formatearFecha(
                publicacion.publicadoEn,
              )}
            </small>
          </div>
        </div>

        <button
          type="button"
          className="detalle-panel__cerrar"
          aria-label="Cerrar publicación"
          onClick={
            onCerrar
          }
        >
          <X
            size={18}
          />
        </button>
      </header>

      <div className="detalle-panel__contenido-general">
        <article className="detalle-panel__publicacion">
          <div className="detalle-panel__tipo">
            <span>
              {obtenerEtiquetaTipo(
                publicacion.tipo,
              )}
            </span>

            <small>
              Aviso académico
            </small>
          </div>

          <h3>
            {publicacion.titulo}
          </h3>

          <p>
            {publicacion.contenido}
          </p>

          <div className="detalle-panel__meta">
            <span
              className={`detalle-badge ${
                publicacion.visibleParaEstudiantes
                  ? 'visible'
                  : 'oculta'
              }`}
            >
              {publicacion.visibleParaEstudiantes ? (
                <Eye
                  size={13}
                />
              ) : (
                <EyeOff
                  size={13}
                />
              )}

              {publicacion.visibleParaEstudiantes
                ? 'Visible'
                : 'No visible'}
            </span>

            <span
              className={`detalle-badge ${
                comentariosAbiertos
                  ? 'comentarios'
                  : 'sin-comentarios'
              }`}
            >
              {comentariosAbiertos ? (
                <MessageCircle
                  size={13}
                />
              ) : (
                <MessageSquareOff
                  size={13}
                />
              )}

              {comentariosAbiertos
                ? 'Comentarios abiertos'
                : 'Sin comentarios'}
            </span>

            {publicacion.estaFijada && (
              <span className="detalle-badge fijada">
                <Pin
                  size={13}
                />

                Fijada
              </span>
            )}

            <span className="detalle-badge fecha">
              <CalendarDays
                size={13}
              />

              {formatearFecha(
                publicacion.publicadoEn,
              )}
            </span>
          </div>
        </article>

        {publicacion.enlace &&
          (
            publicacion.tipo ===
              'MATERIAL_COMPLEMENTARIO' ||
            publicacion.tipo ===
              'JURISPRUDENCIA'
          ) && (
            <a
              className="detalle-recurso"
              href={
                publicacion.enlace
              }
              target={
                publicacion.enlace.startsWith(
                  'http',
                )
                  ? '_blank'
                  : undefined
              }
              rel={
                publicacion.enlace.startsWith(
                  'http',
                )
                  ? 'noreferrer'
                  : undefined
              }
            >
              <span>
                {publicacion.enlace.startsWith(
                  '/',
                ) ? (
                  <Library
                    size={18}
                  />
                ) : (
                  <ExternalLink
                    size={18}
                  />
                )}
              </span>

              <div>
                <strong>
                  {publicacion.tipo ===
                  'JURISPRUDENCIA'
                    ? 'Consultar jurisprudencia'
                    : 'Abrir material complementario'}
                </strong>

                <small>
                  {publicacion.enlace.startsWith(
                    '/',
                  )
                    ? 'Disponible en la biblioteca del curso'
                    : 'Se abrirá el recurso externo'}
                </small>
              </div>

              <ExternalLink
                size={16}
              />
            </a>
          )}

        {comentariosAbiertos ? (
          <section className="detalle-panel__comentarios">
            <header className="comentarios-header">
              <div>
                <span className="comentarios-icono">
                  <MessageCircle
                    size={16}
                  />
                </span>

                <div>
                  <strong>
                    Comentarios
                  </strong>

                  <small>
                    {comentarios?.total ??
                    0}
                    {' '}
                    participaciones
                  </small>
                </div>
              </div>

              <span className="comentarios-estado abiertos">
                Abiertos
              </span>
            </header>

            <div className="comentarios-lista">
              {cargandoComentarios ? (
                <div className="comentarios-cargando">
                  <LoaderCircle
                    size={18}
                    className="spin"
                  />

                  Cargando comentarios…
                </div>
              ) : comentarios?.comentarios.length ? (
                comentarios.comentarios.map(
                  (
                    comentario,
                  ) => (
                    <article
                      key={
                        comentario.id
                      }
                      className="comentario-card"
                    >
                      <div className="comentario-card__header">
                        <AvatarUsuario
                          fotoPerfilUrl={
                            comentario.autor.fotoPerfilUrl
                          }
                          nombres={
                            comentario.autor.nombres
                          }
                          apellidoPaterno={
                            comentario.autor.apellidoPaterno
                          }
                          size={
                            38
                          }
                          mostrarEstado={
                            false
                          }
                        />

                        <div>
                          <strong>
                            {comentario.autor.nombres}
                            {' '}
                            {comentario.autor.apellidoPaterno}
                          </strong>

                          <small>
                            {formatearFecha(
                              comentario.publicadoEn,
                            )}
                          </small>
                        </div>
                      </div>

                      {comentarioEditando?.id ===
                      comentario.id ? (
                        <div className="comentario-edicion">
                          <textarea
                            rows={
                              3
                            }
                            value={
                              textoEdicionComentario
                            }
                            onChange={(
                              evento,
                            ) =>
                              setTextoEdicionComentario(
                                evento.target.value,
                              )
                            }
                          />

                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                setComentarioEditando(
                                  null,
                                )
                              }
                            >
                              Cancelar
                            </button>

                            <button
                              type="button"
                              disabled={
                                !textoEdicionComentario.trim()
                              }
                              onClick={() =>
                                void onEditarComentario(
                                  comentario.id,
                                  textoEdicionComentario,
                                )
                              }
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>
                          {comentario.contenido}
                        </p>
                      )}

                      {(comentario.autorId ===
                        usuarioActualId ||
                        puedeAdministrar) && (
                        <div className="comentario-card__acciones">
                          {comentario.autorId ===
                            usuarioActualId && (
                            <button
                              type="button"
                              onClick={() => {
                                setComentarioEditando(
                                  comentario,
                                );

                                setTextoEdicionComentario(
                                  comentario.contenido,
                                );
                              }}
                            >
                              Editar
                            </button>
                          )}

                          <button
                            type="button"
                            className="peligro"
                            disabled={
                              comentarioProcesandoId ===
                              comentario.id
                            }
                            onClick={() =>
                              void onRetirarComentario(
                                comentario.id,
                              )
                            }
                          >
                            Retirar
                          </button>
                        </div>
                      )}
                    </article>
                  ),
                )
              ) : (
                <div className="comentarios-vacios">
                  <MessageCircle
                    size={21}
                  />

                  <strong>
                    Todavía no hay participaciones
                  </strong>

                  <p>
                    El primer comentario aparecerá aquí.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>

      {comentariosAbiertos && (
        <footer className="detalle-panel__compositor">
          <textarea
            rows={
              2
            }
            value={
              comentarioTexto
            }
            placeholder="Escribe un comentario..."
            onChange={(
              evento,
            ) =>
              setComentarioTexto(
                evento.target.value,
              )
            }
          />

          <button
            type="button"
            aria-label="Enviar comentario"
            disabled={
              !comentarioTexto.trim()
            }
            onClick={
              onEnviarComentario
            }
          >
            <Send
              size={17}
            />
          </button>
        </footer>
      )}

        <style>
          {styles}
        </style>
      </aside>
    </div>
  );
}

const styles = `
  .detalle-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 70000;
    display: grid;
    place-items: center;
    padding: 22px;
    overflow: hidden;
    background: rgba(15, 23, 42, .58);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: detalleBackdropEntrada .18s ease-out;
  }

  .detalle-panel {
    position: relative;
    width: min(820px, 100%);
    min-width: 0;
    max-height: calc(100vh - 44px);
    display: grid;
    grid-template-rows:
      auto
      minmax(
        0,
        1fr
      )
      auto;
    overflow: hidden;
    border:
      1px solid
      var(
        --app-border
      );
    border-radius: 24px;
    color:
      var(
        --app-text
      );
    background:
      var(
        --app-surface
      );
    box-shadow:
      0
      20px
      48px
      color-mix(
        in srgb,
        var(
          --app-text
        ) 11%,
        transparent
      );
  }

  .detalle-panel::before {
    content: "";
    position: absolute;
    inset:
      0
      0
      auto;
    z-index: 3;
    height: 4px;
    background:
      linear-gradient(
        90deg,
        var(
          --app-accent
        ),
        var(
          --app-accent-hover
        )
      );
  }

  .detalle-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding:
      18px
      19px
      16px;
    border-bottom:
      1px solid
      var(
        --app-border-soft
      );
    background:
      linear-gradient(
        135deg,
        var(
          --app-surface
        ),
        color-mix(
          in srgb,
          var(
            --app-accent-soft
          ) 18%,
          var(
            --app-surface
          )
        )
      );
  }

  .detalle-panel__autor {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .detalle-panel__autor-datos {
    min-width: 0;
  }

  .detalle-panel__autor-linea {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .detalle-panel__autor-linea strong {
    overflow: hidden;
    color:
      var(
        --app-text
      );
    font-size: 13px;
    font-weight: 850;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .detalle-panel__autor-linea span {
    flex-shrink: 0;
    padding:
      4px
      7px;
    border-radius: 999px;
    color:
      var(
        --app-accent-dark
      );
    background:
      var(
        --app-accent-soft
      );
    font-size: 9px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .detalle-panel__autor-datos small {
    display: block;
    margin-top: 4px;
    color:
      var(
        --app-text-muted
      );
    font-size: 10px;
  }

  .detalle-panel__cerrar {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    padding: 0;
    border:
      1px solid
      var(
        --app-border-soft
      );
    border-radius: 12px;
    color:
      var(
        --app-text-soft
      );
    background:
      var(
        --app-surface-alt
      );
    cursor: pointer;
    transition:
      color
      .15s
      ease,
      background
      .15s
      ease,
      transform
      .15s
      ease;
  }

  .detalle-panel__cerrar:hover {
    transform:
      rotate(
        4deg
      );
    color:
      var(
        --app-danger
      );
    background:
      var(
        --app-danger-bg
      );
  }

  .detalle-panel__contenido-general {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .detalle-panel__publicacion {
    padding:
      20px
      20px
      18px;
  }

  .detalle-panel__tipo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .detalle-panel__tipo span {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding:
      6px
      10px;
    border-radius: 999px;
    color:
      var(
        --app-accent-dark
      );
    background:
      var(
        --app-accent-soft
      );
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .detalle-panel__tipo small {
    color:
      var(
        --app-text-muted
      );
    font-size: 9px;
    font-weight: 700;
  }

  .detalle-panel__publicacion h3 {
    margin:
      15px
      0
      0;
    color:
      var(
        --app-text
      );
    font-size:
      clamp(
        24px,
        2vw,
        30px
      );
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -.025em;
  }

  .detalle-panel__publicacion p {
    margin:
      12px
      0
      0;
    color:
      var(
        --app-text-secondary
      );
    font-size: 13px;
    line-height: 1.65;
    white-space: pre-wrap;
  }

  .detalle-panel__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 17px;
    padding-top: 15px;
    border-top:
      1px solid
      var(
        --app-border-soft
      );
  }

  .detalle-badge {
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding:
      6px
      9px;
    border:
      1px solid
      transparent;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 800;
  }

  .detalle-badge.fijada {
    color:
      var(
        --app-accent-dark
      );
    border-color:
      color-mix(
        in srgb,
        var(
          --app-accent
        ) 26%,
        var(
          --app-border
        )
      );
    background:
      var(
        --app-accent-soft
      );
  }

  .detalle-badge.visible {
    color:
      var(
        --app-success
      );
    border-color:
      var(
        --app-success-border
      );
    background:
      var(
        --app-success-bg
      );
  }

  .detalle-badge.oculta {
    color:
      var(
        --app-danger
      );
    border-color:
      var(
        --app-danger-border
      );
    background:
      var(
        --app-danger-bg
      );
  }

  .detalle-badge.comentarios {
    color: #2563eb;
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  .detalle-badge.sin-comentarios,
  .detalle-badge.fecha {
    color:
      var(
        --app-text-muted
      );
    border-color:
      var(
        --app-border-soft
      );
    background:
      var(
        --app-surface-alt
      );
  }

  .detalle-recurso {
    display: grid;
    grid-template-columns:
      40px
      minmax(
        0,
        1fr
      )
      auto;
    gap: 10px;
    align-items: center;
    margin:
      0
      20px
      18px;
    padding: 12px;
    border:
      1px solid
      color-mix(
        in srgb,
        var(
          --app-accent
        ) 28%,
        var(
          --app-border
        )
      );
    border-radius: 15px;
    color:
      var(
        --app-text-secondary
      );
    background:
      color-mix(
        in srgb,
        var(
          --app-accent-soft
        ) 34%,
        var(
          --app-surface
        )
      );
    text-decoration: none;
    transition:
      transform
      .15s
      ease,
      border-color
      .15s
      ease;
  }

  .detalle-recurso:hover {
    transform:
      translateY(
        -2px
      );
    border-color:
      var(
        --app-accent
      );
  }

  .detalle-recurso > span {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color:
      var(
        --app-accent-dark
      );
    background:
      var(
        --app-accent-soft
      );
  }

  .detalle-recurso strong,
  .detalle-recurso small {
    display: block;
  }

  .detalle-recurso strong {
    color:
      var(
        --app-text
      );
    font-size: 11px;
  }

  .detalle-recurso small {
    margin-top: 3px;
    color:
      var(
        --app-text-muted
      );
    font-size: 9px;
  }

  .detalle-panel__comentarios {
    min-height: 0;
    flex: 1;
    display: grid;
    grid-template-rows:
      auto
      minmax(
        0,
        1fr
      );
    border-top:
      1px solid
      var(
        --app-border-soft
      );
    padding:
      15px
      18px
      17px;
    background:
      var(
        --app-surface-alt
      );
  }

  .comentarios-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .comentarios-header > div {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .comentarios-icono {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    color:
      var(
        --app-accent-dark
      );
    background:
      var(
        --app-accent-soft
      );
  }

  .comentarios-header strong,
  .comentarios-header small {
    display: block;
  }

  .comentarios-header strong {
    color:
      var(
        --app-text
      );
    font-size: 13px;
  }

  .comentarios-header small {
    margin-top: 3px;
    color:
      var(
        --app-text-muted
      );
    font-size: 9px;
  }

  .comentarios-estado {
    padding:
      6px
      8px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 800;
  }

  .comentarios-estado.abiertos {
    color:
      var(
        --app-success
      );
    background:
      var(
        --app-success-bg
      );
  }

  .comentarios-lista {
    min-height: 0;
    display: grid;
    align-content: start;
    gap: 9px;
    margin-top: 12px;
    padding-right: 4px;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color:
      var(
        --app-border-strong
      )
      transparent;
  }

  .comentario-card {
    padding: 13px;
    border:
      1px solid
      var(
        --app-border-soft
      );
    border-radius: 14px;
    background:
      var(
        --app-surface
      );
    box-shadow:
      var(
        --app-shadow-sm
      );
  }

  .comentario-card__header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .comentario-card__header strong,
  .comentario-card__header small {
    display: block;
  }

  .comentario-card__header strong {
    color:
      var(
        --app-text
      );
    font-size: 11px;
  }

  .comentario-card__header small {
    margin-top: 3px;
    color:
      var(
        --app-text-muted
      );
    font-size: 8px;
  }

  .comentario-card > p {
    margin:
      9px
      0
      0;
    color:
      var(
        --app-text-secondary
      );
    font-size: 11px;
    line-height: 1.55;
  }

  .comentario-card__acciones,
  .comentario-edicion > div {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }

  .comentario-card__acciones button,
  .comentario-edicion button {
    border: none;
    color:
      var(
        --app-accent-dark
      );
    background: transparent;
    font-family: inherit;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
  }

  .comentario-card__acciones .peligro {
    color:
      var(
        --app-danger
      );
  }

  .comentario-edicion {
    margin-top: 9px;
  }

  .comentario-edicion textarea,
  .detalle-panel__compositor textarea {
    width: 100%;
    box-sizing: border-box;
    padding:
      10px
      11px;
    border:
      1px solid
      var(
        --app-input-border
      );
    border-radius: 12px;
    outline: none;
    color:
      var(
        --app-text
      );
    background:
      var(
        --app-input-bg
      );
    font-family: inherit;
    font-size: 10px;
    line-height: 1.45;
    resize: none;
  }

  .comentarios-cargando,
  .comentarios-vacios {
    display: grid;
    place-items: center;
    gap: 5px;
    padding:
      26px
      10px;
    color:
      var(
        --app-text-muted
      );
    font-size: 9px;
    text-align: center;
  }

  .comentarios-vacios p {
    margin: 0;
  }

  .detalle-panel__compositor {
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      46px;
    gap: 8px;
    padding:
      13px
      18px
      16px;
    border-top:
      1px solid
      var(
        --app-border-soft
      );
    background:
      var(
        --app-surface
      );
  }

  .detalle-panel__compositor button {
    display: grid;
    place-items: center;
    border: none;
    border-radius: 12px;
    color: #fff;
    background:
      linear-gradient(
        135deg,
        var(
          --app-accent
        ),
        var(
          --app-accent-hover
        )
      );
    cursor: pointer;
    transition:
      transform
      .15s
      ease,
      box-shadow
      .15s
      ease;
  }

  .detalle-panel__compositor button:hover:not(:disabled) {
    transform:
      translateY(
        -1px
      );
    box-shadow:
      0
      8px
      18px
      color-mix(
        in srgb,
        var(
          --app-accent
        ) 25%,
        transparent
      );
  }

  .detalle-panel__compositor button:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .spin {
    animation:
      detalleSpin
      .8s
      linear
      infinite;
  }

  @keyframes detalleSpin {
    to {
      transform:
        rotate(
          360deg
        );
    }
  }

  @keyframes detalleBackdropEntrada {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (
    max-width:
      1050px
  ) {
    .detalle-panel {
      width: min(760px, 100%);
    }

    .comentarios-lista {
      max-height: none;
    }
  }

  @media (
    max-width:
      620px
  ) {
    .detalle-modal-backdrop {
      padding: 0;
    }

    .detalle-panel {
      width: 100vw;
      max-height: 100vh;
      min-height: 100vh;
      border: none;
      border-radius: 0;
    }

    .detalle-panel__header {
      padding:
        15px;
    }

    .detalle-panel__autor-linea {
      align-items: flex-start;
      flex-direction: column;
      gap: 4px;
    }

    .detalle-panel__publicacion {
      padding:
        17px
        15px
        18px;
    }

    .detalle-panel__comentarios {
      padding:
        14px
        15px
        16px;
    }

    .detalle-panel__meta {
      gap: 5px;
    }

    .detalle-badge {
      font-size: 8px;
    }
  }
`;
