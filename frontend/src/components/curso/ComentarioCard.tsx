import {
  Edit3,
  Trash2,
} from 'lucide-react';

import type {
  ComentarioPublicacion,
} from '../../types/comunicacion-curso.types';

type ComentarioCardProps = {
  comentario:
    ComentarioPublicacion;

  usuarioActualId?:
    number;

  esDocentePropietario?:
    boolean;

  procesando?:
    boolean;

  onEditar?: (
    comentario:
      ComentarioPublicacion,
  ) => void;

  onEliminar?: (
    comentario:
      ComentarioPublicacion,
  ) => void;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function construirUrlFoto(
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

function primerNombre(
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

export default function ComentarioCard({
  comentario,
  usuarioActualId,
  esDocentePropietario =
    false,
  procesando =
    false,
  onEditar,
  onEliminar,
}: ComentarioCardProps) {
  const nombre =
    `${primerNombre(
      comentario.autor.nombres,
    )} ${comentario.autor.apellidoPaterno}`
      .trim();

  const iniciales =
    `${primerNombre(
      comentario.autor.nombres,
    ).charAt(0)}${comentario.autor.apellidoPaterno.charAt(0)}`
      .toUpperCase();

  const foto =
    construirUrlFoto(
      comentario.autor
        .fotoPerfilUrl,
    );

  const esAutor =
    usuarioActualId ===
    comentario.autorId;

  const puedeEliminar =
    esAutor ||
    esDocentePropietario;

  return (
    <article className="comment-card">
      <div className="comment-avatar">
        {foto ? (
          <img
            src={
              foto
            }
            alt={`Fotografía de ${nombre}`}
          />
        ) : (
          <span>
            {iniciales}
          </span>
        )}
      </div>

      <div className="comment-content">
        <header>
          <div>
            <strong>
              {nombre}
            </strong>

            <span
              className={`comment-role ${comentario.autor.rol.toLowerCase()}`}
            >
              {comentario.autor.rol ===
              'DOCENTE'
                ? 'Docente'
                : 'Estudiante'}
            </span>
          </div>

          <span className="comment-date">
            {formatearFecha(
              comentario.publicadoEn,
            )}

            {comentario.editadoEn && (
              <>
                {' · '}
                Editado
              </>
            )}
          </span>
        </header>

        <p>
          {comentario.contenido}
        </p>

        {(esAutor ||
          puedeEliminar) && (
          <footer>
            {esAutor &&
              onEditar && (
                <button
                  type="button"
                  disabled={
                    procesando
                  }
                  onClick={() =>
                    onEditar(
                      comentario,
                    )
                  }
                >
                  <Edit3
                    size={13}
                  />

                  Editar
                </button>
              )}

            {puedeEliminar &&
              onEliminar && (
                <button
                  type="button"
                  className="danger"
                  disabled={
                    procesando
                  }
                  onClick={() =>
                    onEliminar(
                      comentario,
                    )
                  }
                >
                  <Trash2
                    size={13}
                  />

                  {esAutor
                    ? 'Retirar'
                    : 'Moderar'}
                </button>
              )}
          </footer>
        )}
      </div>

      <style>
        {styles}
      </style>
    </article>
  );
}

const styles = `
  .comment-card {
    display: grid;
    grid-template-columns: 39px minmax(0, 1fr);
    gap: 10px;
    align-items: flex-start;
  }

  .comment-avatar {
    width: 39px;
    height: 39px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--app-border-strong);
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: 10px;
    font-weight: 900;
  }

  .comment-avatar img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .comment-content {
    min-width: 0;
    padding: 11px 13px;
    border: 1px solid var(--app-border-soft);
    border-radius: 0 15px 15px 15px;
    background: var(--app-surface-alt);
  }

  .comment-content header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .comment-content header > div {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .comment-content header strong {
    color: var(--app-text);
    font-size: 10px;
  }

  .comment-role {
    padding: 3px 6px;
    border-radius: 999px;
    font-size: 7px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .comment-role.docente {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .comment-role.estudiante {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .comment-date {
    flex-shrink: 0;
    color: var(--app-text-muted);
    font-size: 8px;
  }

  .comment-content p {
    margin: 7px 0 0;
    color: var(--app-text-secondary);
    font-size: 10px;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .comment-content footer {
    display: flex;
    gap: 7px;
    margin-top: 9px;
  }

  .comment-content footer button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 7px;
    border: none;
    border-radius: 8px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-family: inherit;
    font-size: 8px;
    font-weight: 750;
    cursor: pointer;
  }

  .comment-content footer button.danger {
    color: var(--app-danger-strong);
    background: var(--app-danger-bg);
  }

  .comment-content footer button:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    .comment-content header {
      flex-direction: column;
    }

    .comment-date {
      white-space: normal;
    }
  }
`;