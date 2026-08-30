import {
  Edit3,
  Lock,
  MessageSquare,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';

import {
  useState,
} from 'react';

import type {
  TemaForoCurso,
} from '../../types/aula/comunicacion-curso.types';

type TemaForoCardProps = {
  tema:
    TemaForoCurso;

  usuarioActualId?:
    number;

  esDocentePropietario?:
    boolean;

  procesando?:
    boolean;

  onAbrir: (
    tema:
      TemaForoCurso,
  ) => void;

  onEditar?: (
    tema:
      TemaForoCurso,
  ) => void;

  onEliminar?: (
    tema:
      TemaForoCurso,
  ) => void;

  onCambiarFijado?: (
    tema:
      TemaForoCurso,
  ) => void;

  onCambiarCerrado?: (
    tema:
      TemaForoCurso,
  ) => void;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function obtenerFoto(
  ruta:
    string | null,
): string | null {
  if (!ruta) {
    return null;
  }

  if (
    ruta.startsWith(
      'http://',
    ) ||
    ruta.startsWith(
      'https://',
    )
  ) {
    return ruta;
  }

  return `${API_URL}${
    ruta.startsWith('/')
      ? ruta
      : `/${ruta}`
  }`;
}

function obtenerPrimerNombre(
  nombres:
    string,
): string {
  return (
    nombres
      .trim()
      .split(/\s+/)[0] ??
    nombres
  );
}

function formatearFecha(
  fecha:
    string,
): string {
  return new Intl.DateTimeFormat(
    'es-BO',
    {
      dateStyle:
        'medium',

      timeStyle:
        'short',
    },
  ).format(
    new Date(
      fecha,
    ),
  );
}

export default function TemaForoCard({
  tema,
  usuarioActualId,
  esDocentePropietario =
    false,
  procesando =
    false,
  onAbrir,
  onEditar,
  onEliminar,
  onCambiarFijado,
  onCambiarCerrado,
}: TemaForoCardProps) {
  const [
    menuAbierto,
    setMenuAbierto,
  ] =
    useState(
      false,
    );

  const esAutor =
    usuarioActualId ===
    tema.autorId;

  const puedeEliminar =
    esAutor ||
    esDocentePropietario;

  const nombreAutor =
    `${obtenerPrimerNombre(
      tema.autor.nombres,
    )} ${tema.autor.apellidoPaterno}`
      .trim();

  const iniciales =
    `${obtenerPrimerNombre(
      tema.autor.nombres,
    ).charAt(0)}${tema.autor.apellidoPaterno.charAt(0)}`
      .toUpperCase();

  const foto =
    obtenerFoto(
      tema.autor.fotoPerfilUrl,
    );

  return (
    <article
      className={`forum-topic-card ${
        tema.estaFijado
          ? 'is-pinned'
          : ''
      } ${
        tema.estaCerrado
          ? 'is-closed'
          : ''
      }`}
    >
      <button
        type="button"
        className="forum-topic-card__main"
        onClick={() =>
          onAbrir(
            tema,
          )
        }
      >
        <div className="forum-topic-avatar">
          {foto ? (
            <img
              src={
                foto
              }
              alt={`Fotografía de ${nombreAutor}`}
            />
          ) : (
            <span>
              {iniciales}
            </span>
          )}
        </div>

        <div className="forum-topic-content">
          <div className="forum-topic-badges">
            {tema.estaFijado && (
              <span className="pinned">
                <Pin
                  size={11}
                />

                Fijado
              </span>
            )}

            <span
              className={
                tema.estaCerrado
                  ? 'closed'
                  : 'open'
              }
            >
              {tema.estaCerrado ? (
                <Lock
                  size={11}
                />
              ) : (
                <Unlock
                  size={11}
                />
              )}

              {tema.estaCerrado
                ? 'Cerrado'
                : 'Abierto'}
            </span>
          </div>

          <h3>
            {tema.titulo}
          </h3>

          <p>
            {tema.contenido}
          </p>

          <div className="forum-topic-meta">
            <span>
              Por
              {' '}
              <strong>
                {nombreAutor}
              </strong>
            </span>

            <span>
              {formatearFecha(
                tema.publicadoEn,
              )}
            </span>

            <span>
              <MessageSquare
                size={13}
              />

              {tema.totalRespuestas}
              {' '}
              respuestas
            </span>
          </div>
        </div>
      </button>

      {(esAutor ||
        esDocentePropietario) && (
        <div className="forum-topic-menu">
          <button
            type="button"
            className="forum-topic-trigger"
            disabled={
              procesando
            }
            aria-label="Opciones del tema"
            onClick={() =>
              setMenuAbierto(
                (
                  actual,
                ) =>
                  !actual,
              )
            }
          >
            {menuAbierto ? (
              <X
                size={17}
              />
            ) : (
              <MoreVertical
                size={17}
              />
            )}
          </button>

          {menuAbierto && (
            <div className="forum-topic-options">
              {esAutor &&
                onEditar && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAbierto(
                        false,
                      );

                      onEditar(
                        tema,
                      );
                    }}
                  >
                    <Edit3
                      size={14}
                    />

                    Editar
                  </button>
                )}

              {esDocentePropietario &&
                onCambiarFijado && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAbierto(
                        false,
                      );

                      onCambiarFijado(
                        tema,
                      );
                    }}
                  >
                    {tema.estaFijado ? (
                      <PinOff
                        size={14}
                      />
                    ) : (
                      <Pin
                        size={14}
                      />
                    )}

                    {tema.estaFijado
                      ? 'Desfijar'
                      : 'Fijar'}
                  </button>
                )}

              {esDocentePropietario &&
                onCambiarCerrado && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAbierto(
                        false,
                      );

                      onCambiarCerrado(
                        tema,
                      );
                    }}
                  >
                    {tema.estaCerrado ? (
                      <Unlock
                        size={14}
                      />
                    ) : (
                      <Lock
                        size={14}
                      />
                    )}

                    {tema.estaCerrado
                      ? 'Reabrir'
                      : 'Cerrar'}
                  </button>
                )}

              {puedeEliminar &&
                onEliminar && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setMenuAbierto(
                        false,
                      );

                      onEliminar(
                        tema,
                      );
                    }}
                  >
                    <Trash2
                      size={14}
                    />

                    {esAutor
                      ? 'Retirar'
                      : 'Moderar'}
                  </button>
                )}
            </div>
          )}
        </div>
      )}

      <style>
        {styles}
      </style>
    </article>
  );
}

const styles = `
  .forum-topic-card {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 17px;
    border: 1px solid var(--app-border);
    border-radius: 19px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition:
      transform .18s ease,
      box-shadow .18s ease,
      border-color .18s ease;
  }

  .forum-topic-card:hover {
    transform: translateY(-2px);
    border-color: var(--app-border-strong);
    box-shadow: var(--app-shadow);
  }

  .forum-topic-card.is-pinned {
    border-color: var(--app-warning-border);
  }

  .forum-topic-card.is-closed {
    opacity: .85;
  }

  .forum-topic-card__main {
    min-width: 0;
    flex: 1;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 12px;
    padding: 0;
    border: none;
    color: inherit;
    background: transparent;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }

  .forum-topic-avatar {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--app-border-strong);
    border-radius: 14px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 11px;
    font-weight: 900;
  }

  .forum-topic-avatar img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .forum-topic-content {
    min-width: 0;
  }

  .forum-topic-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .forum-topic-badges span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 7px;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 800;
  }

  .forum-topic-badges .pinned {
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
  }

  .forum-topic-badges .open {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .forum-topic-badges .closed {
    color: var(--app-text-muted);
    background: var(--app-surface-disabled);
  }

  .forum-topic-content h3 {
    margin: 7px 0 0;
    color: var(--app-text);
    font-size: 15px;
    line-height: 1.3;
  }

  .forum-topic-content > p {
    margin: 7px 0 0;
    overflow: hidden;
    color: var(--app-text-soft);
    font-size: 10px;
    line-height: 1.55;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .forum-topic-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 11px;
    margin-top: 11px;
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .forum-topic-meta span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .forum-topic-meta strong {
    color: var(--app-text-secondary);
  }

  .forum-topic-menu {
    position: relative;
    flex-shrink: 0;
  }

  .forum-topic-trigger {
    width: 33px;
    height: 33px;
    display: grid;
    place-items: center;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    color: var(--app-text-soft);
    background: var(--app-surface);
    cursor: pointer;
  }

  .forum-topic-options {
    position: absolute;
    top: 39px;
    right: 0;
    z-index: 30;
    width: 185px;
    display: grid;
    gap: 3px;
    padding: 7px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-raised);
    box-shadow: var(--app-shadow-lg);
  }

  .forum-topic-options button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 9px;
    border: none;
    border-radius: 9px;
    color: var(--app-text-secondary);
    background: transparent;
    font-family: inherit;
    font-size: 9px;
    font-weight: 700;
    cursor: pointer;
  }

  .forum-topic-options button:hover {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .forum-topic-options button.danger {
    color: var(--app-danger-strong);
  }

  .forum-topic-options button.danger:hover {
    background: var(--app-danger-bg);
  }

  @media (max-width: 560px) {
    .forum-topic-card {
      padding: 14px;
    }

    .forum-topic-card__main {
      grid-template-columns: 1fr;
    }

    .forum-topic-avatar {
      width: 39px;
      height: 39px;
    }
  }
`;