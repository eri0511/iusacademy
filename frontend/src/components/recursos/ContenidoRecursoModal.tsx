import {
  Download,
  ExternalLink,
  FilePlus2,
  FileText,
  Files,
  History,
  Link2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';

import AulaModal from '../aula/AulaModal';

import type {
  RecursoContenido,
  RecursoCurso,
} from '../../types/recursos/recursos.types';

import {
  obtenerCategoriaRecurso,
  obtenerVersionVigente,
} from '../../types/recursos/recursos.types';

type Props = {
  abierto: boolean;
  recurso: RecursoCurso | null;
  esDocente: boolean;
  bloqueado?: boolean;
  onCerrar: () => void;
  onAbrirArchivo: (contenido: RecursoContenido) => void;
  onDescargarArchivo: (contenido: RecursoContenido) => void;
  onAbrirEnlace: (contenido: RecursoContenido) => void;
  onAgregarMaterial?: () => void;
  onReemplazar?: (contenido: RecursoContenido) => void;
  onHistorial?: (contenido: RecursoContenido) => void;
  onAlternarQuiz?: (contenido: RecursoContenido) => void;
  onEliminar?: (contenido: RecursoContenido) => void;
};

function tamanio(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ContenidoRecursoModal({
  abierto,
  recurso,
  esDocente,
  bloqueado = false,
  onCerrar,
  onAbrirArchivo,
  onDescargarArchivo,
  onAbrirEnlace,
  onAgregarMaterial,
  onReemplazar,
  onHistorial,
  onAlternarQuiz,
  onEliminar,
}: Props) {
  if (!recurso) {
    return null;
  }

  const categoria =
    obtenerCategoriaRecurso(
      recurso.categoria,
    );

  const archivos =
    recurso.contenidos.filter(
      (item) =>
        item.tipo === 'ARCHIVO' &&
        item.estaActivo,
    );

  const enlaces =
    recurso.contenidos.filter(
      (item) =>
        item.tipo === 'ENLACE' &&
        item.estaActivo,
    );

  return (
    <AulaModal
      abierto={abierto}
      titulo={recurso.titulo}
      etiqueta={categoria.etiqueta}
      descripcion={
        recurso.descripcion ??
        'Material académico del curso.'
      }
      icono={Files}
      ancho="amplio"
      bloqueado={bloqueado}
      onCerrar={onCerrar}
      footer={
        <div className="contenido-modal__footer">
          {esDocente && (
            <button
              type="button"
              className="secondary"
              onClick={onAgregarMaterial}
            >
              <Plus size={15} />
              Agregar material
            </button>
          )}

          <button
            type="button"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="contenido-modal">
        {archivos.length > 0 && (
          <section>
            <div className="contenido-modal__section-head">
              <strong>
                Archivos
              </strong>

              <span>
                {archivos.length}{' '}
                archivo
                {archivos.length === 1
                  ? ''
                  : 's'}
              </span>
            </div>

            <div className="contenido-modal__cards">
              {archivos.map(
                (contenido) => {
                  const vigente =
                    obtenerVersionVigente(
                      contenido,
                    );

                  if (!vigente) {
                    return null;
                  }

                  return (
                    <article
                      key={contenido.id}
                      className="material-card"
                    >
                      <div className="material-card__icono">
                        <FileText
                          size={21}
                        />
                      </div>

                      <div className="material-card__body">
                        <div className="material-card__titulo">
                          <strong>
                            {contenido.titulo}
                          </strong>

                          {esDocente &&
                            recurso.uso !==
                              'AULA' &&
                            contenido.disponibleParaQuiz && (
                              <span className="quiz-badge">
                                <Sparkles
                                  size={11}
                                />
                                Quiz
                              </span>
                            )}
                        </div>

                        <small>
                          {vigente.archivo.extension.toUpperCase()}
                          {' · '}
                          {tamanio(
                            vigente.archivo.tamanioBytes,
                          )}
                          {' · '}
                          v
                          {vigente.numeroVersion}
                        </small>

                        {contenido.descripcion && (
                          <p>
                            {contenido.descripcion}
                          </p>
                        )}

                        <div className="material-card__acciones">
                          <button
                            type="button"
                            onClick={() =>
                              onAbrirArchivo(
                                contenido,
                              )
                            }
                          >
                            <ExternalLink
                              size={14}
                            />
                            Ver
                          </button>

                          {vigente.archivo.permiteDescarga && (
                            <button
                              type="button"
                              onClick={() =>
                                onDescargarArchivo(
                                  contenido,
                                )
                              }
                            >
                              <Download
                                size={14}
                              />
                              Descargar
                            </button>
                          )}

                          {esDocente && (
                            <>
                              <button
                                type="button"
                                className="texto"
                                onClick={() =>
                                  onReemplazar?.(
                                    contenido,
                                  )
                                }
                              >
                                <RefreshCw
                                  size={13}
                                />
                                Reemplazar
                              </button>

                              <button
                                type="button"
                                className="texto"
                                onClick={() =>
                                  onHistorial?.(
                                    contenido,
                                  )
                                }
                              >
                                <History
                                  size={13}
                                />
                                Versiones
                              </button>

                              {recurso.uso !==
                                'AULA' &&
                                vigente.archivo.extension.toLowerCase() ===
                                  'pdf' && (
                                  <button
                                    type="button"
                                    className={`texto ${
                                      contenido.disponibleParaQuiz
                                        ? 'quiz-activo'
                                        : ''
                                    }`}
                                    onClick={() =>
                                      onAlternarQuiz?.(
                                        contenido,
                                      )
                                    }
                                  >
                                    <Sparkles
                                      size={13}
                                    />

                                    {contenido.disponibleParaQuiz
                                      ? 'Quitar de Quiz'
                                      : 'Usar en Quiz'}
                                  </button>
                                )}

                              <button
                                type="button"
                                className="texto peligro"
                                onClick={() =>
                                  onEliminar?.(
                                    contenido,
                                  )
                                }
                              >
                                <Trash2
                                  size={13}
                                />
                                Retirar
                              </button>
                            </>
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

        {enlaces.length > 0 && (
          <section>
            <div className="contenido-modal__section-head">
              <strong>
                Enlaces
              </strong>

              <span>
                {enlaces.length}{' '}
                enlace
                {enlaces.length === 1
                  ? ''
                  : 's'}
              </span>
            </div>

            <div className="contenido-modal__cards">
              {enlaces.map(
                (contenido) => (
                  <article
                    key={contenido.id}
                    className="material-card material-card--link"
                  >
                    <div className="material-card__icono">
                      <Link2
                        size={21}
                      />
                    </div>

                    <div className="material-card__body">
                      <strong>
                        {contenido.titulo}
                      </strong>

                      <small>
                        Recurso externo
                      </small>

                      {contenido.descripcion && (
                        <p>
                          {contenido.descripcion}
                        </p>
                      )}

                      <div className="material-card__acciones">
                        <button
                          type="button"
                          onClick={() =>
                            onAbrirEnlace(
                              contenido,
                            )
                          }
                        >
                          <ExternalLink
                            size={14}
                          />
                          Abrir enlace
                        </button>

                        {esDocente && (
                          <button
                            type="button"
                            className="texto peligro"
                            onClick={() =>
                              onEliminar?.(
                                contenido,
                              )
                            }
                          >
                            <Trash2
                              size={13}
                            />
                            Retirar
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        )}

        {archivos.length === 0 &&
          enlaces.length === 0 && (
            <div className="contenido-modal__vacio">
              <FilePlus2
                size={18}
              />

              <div>
                <strong>
                  Este recurso todavía no tiene materiales.
                </strong>

                <span>
                  {esDocente
                    ? 'Agrega un archivo o un enlace para comenzar.'
                    : 'El docente aún no agregó contenido.'}
                </span>
              </div>
            </div>
          )}
      </div>

      <style>
        {styles}
      </style>
    </AulaModal>
  );
}

const styles = `
  .contenido-modal {
    display: grid;
    gap: 18px;
  }

  .contenido-modal section {
    display: grid;
    gap: 9px;
  }

  .contenido-modal__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .contenido-modal__section-head strong {
    color: var(--app-text);
    font-size: 11px;
  }

  .contenido-modal__section-head span {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .contenido-modal__cards {
    display: grid;
    grid-template-columns: repeat(
      2,
      minmax(0, 1fr)
    );
    gap: 9px;
  }

  .material-card {
    min-width: 0;

    display: grid;
    grid-template-columns:
      44px
      minmax(0, 1fr);

    gap: 10px;

    padding: 12px;

    border: 1px solid var(--app-border);
    border-radius: 15px;

    background: var(--app-surface-alt);
  }

  .material-card__icono {
    width: 44px;
    height: 44px;

    display: grid;
    place-items: center;

    border-radius: 12px;

    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .material-card--link
    .material-card__icono {
    color: #7c3aed;
    background: #f5f3ff;
  }

  .material-card__body {
    min-width: 0;
  }

  .material-card__titulo {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .material-card strong {
    color: var(--app-text);
    font-size: 10.5px;
  }

  .material-card small {
    display: block;

    margin-top: 3px;

    color: var(--app-text-muted);
    font-size: 8.5px;
  }

  .material-card p {
    margin: 5px 0 0;

    color: var(--app-text-soft);

    font-size: 9px;
    line-height: 1.4;
  }

  .quiz-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;

    padding: 3px 6px;

    border-radius: 999px;

    color: var(--app-accent-dark);
    background: var(--app-accent-soft);

    font-size: 7px;
    font-weight: 900;
  }

  .material-card__acciones {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    margin-top: 10px;
  }

  .material-card__acciones button {
    min-height: 31px;

    display: inline-flex;
    align-items: center;
    gap: 5px;

    padding: 6px 9px;

    border: 1px solid var(--app-border-strong);
    border-radius: 9px;

    color: var(--app-text-secondary);
    background: var(--app-surface);

    font: inherit;
    font-size: 8.5px;
    font-weight: 800;

    cursor: pointer;
  }

  .material-card__acciones
    button.texto {
    padding-inline: 5px;

    border-color: transparent;

    color: var(--app-accent-dark);
    background: transparent;
  }

  .material-card__acciones
    button.quiz-activo {
    color: var(--app-success);
  }

  .material-card__acciones
    button.peligro {
    color: var(--app-danger);
  }

  .contenido-modal__vacio {
    display: flex;
    align-items: center;
    gap: 10px;

    padding: 15px;

    border: 1px dashed var(--app-border-strong);
    border-radius: 13px;

    color: var(--app-text-muted);
    background: var(--app-surface-alt);
  }

  .contenido-modal__vacio div {
    display: grid;
    gap: 3px;
  }

  .contenido-modal__vacio strong {
    color: var(--app-text-secondary);
    font-size: 10px;
  }

  .contenido-modal__vacio span {
    font-size: 9px;
  }

  .contenido-modal__footer {
    width: 100%;

    display: flex;
    justify-content: flex-end;
    gap: 7px;
  }

  .contenido-modal__footer button {
    min-height: 38px;

    display: inline-flex;
    align-items: center;
    gap: 6px;

    padding: 8px 12px;

    border: none;
    border-radius: 10px;

    color: #fff;

    background:
      linear-gradient(
        135deg,
        var(--app-accent),
        var(--app-accent-hover)
      );

    font: inherit;
    font-size: 9px;
    font-weight: 850;

    cursor: pointer;
  }

  .contenido-modal__footer
    button.secondary {
    border: 1px solid var(--app-border-strong);

    color: var(--app-accent-dark);
    background: var(--app-surface);
  }

  @media (max-width: 720px) {
    .contenido-modal__cards {
      grid-template-columns: 1fr;
    }
  }
`;