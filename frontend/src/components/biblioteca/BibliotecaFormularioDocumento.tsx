import {
  Clock3,
  FilePlus2,
  FileText,
  History,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { mensajeError, useBiblioteca } from "../../contexts/BibliotecaContext";
import type {
  Recurso,
  Version,
} from "../../types/biblioteca/biblioteca.types";

export type ArchivoPendienteBiblioteca = {
  archivo: File;
  titulo: string;
};

export type EnlacePendienteBiblioteca = {
  titulo: string;
  urlExterna: string;
};

type Props = {
  recurso?: Recurso | null;
  archivos: ArchivoPendienteBiblioteca[];
  enlaces: EnlacePendienteBiblioteca[];
  deshabilitado?: boolean;
  onArchivos: (archivos: ArchivoPendienteBiblioteca[]) => void;
  onEnlaces: (enlaces: EnlacePendienteBiblioteca[]) => void;
  onContenidoActualizado?: () => Promise<void> | void;
};

type ModalVersion =
  | { tipo: "historial"; contenidoId: number; titulo: string }
  | { tipo: "nueva"; contenidoId: number; titulo: string }
  | null;

function tamanio(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fechaVersion(valor: string) {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(valor));
}

export default function BibliotecaFormularioDocumento({
  recurso,
  archivos,
  enlaces,
  deshabilitado = false,
  onArchivos,
  onEnlaces,
  onContenidoActualizado,
}: Props) {
  const { api, avisar } = useBiblioteca();
  const [modalVersion, setModalVersion] = useState<ModalVersion>(null);
  const [versiones, setVersiones] = useState<Version[]>([]);
  const [cargandoVersiones, setCargandoVersiones] = useState(false);
  const [archivoVersion, setArchivoVersion] = useState<File | null>(null);
  const [motivoVersion, setMotivoVersion] = useState("");
  const [guardandoVersion, setGuardandoVersion] = useState(false);

  function agregarArchivos(nuevos: File[]) {
    const items = nuevos.map((archivo) => ({
      archivo,
      titulo: archivo.name.replace(/\.[^/.]+$/, ""),
    }));
    onArchivos([...archivos, ...items]);
  }

  async function abrirHistorial(contenidoId: number, titulo: string) {
    if (!recurso) return;
    setModalVersion({ tipo: "historial", contenidoId, titulo });
    setCargandoVersiones(true);
    try {
      const datos = await api.get<Version[]>(
        `/recursos/${recurso.id}/contenidos/${contenidoId}/versiones`,
      );
      setVersiones(datos);
    } catch (e) {
      avisar(mensajeError(e), true);
      setVersiones([]);
    } finally {
      setCargandoVersiones(false);
    }
  }

  function abrirNuevaVersion(contenidoId: number, titulo: string) {
    setArchivoVersion(null);
    setMotivoVersion("");
    setModalVersion({ tipo: "nueva", contenidoId, titulo });
  }

  async function guardarNuevaVersion() {
    if (!recurso || !modalVersion || modalVersion.tipo !== "nueva") return;
    if (!archivoVersion) {
      avisar("Selecciona el archivo de la nueva versión.", true);
      return;
    }
    if (!motivoVersion.trim()) {
      avisar("Indica el motivo de actualización.", true);
      return;
    }

    setGuardandoVersion(true);
    try {
      const form = new FormData();
      form.set("archivo", archivoVersion);
      form.set("titulo", modalVersion.titulo);
      form.set("motivoActualizacion", motivoVersion.trim());

      await api.send(
        `/recursos/${recurso.id}/contenidos/${modalVersion.contenidoId}/versiones`,
        "POST",
        form,
      );

      avisar("Nueva versión creada correctamente.");
      setModalVersion(null);
      setArchivoVersion(null);
      setMotivoVersion("");
      await onContenidoActualizado?.();
    } catch (e) {
      avisar(mensajeError(e), true);
    } finally {
      setGuardandoVersion(false);
    }
  }

  return (
    <div className="bib-materiales">
      {recurso && recurso.contenidos.length > 0 && (
        <section className="bib-materiales__actuales">
          <div className="bib-materiales__actuales-head">
            <div>
              <strong>Contenido publicado en este recurso</strong>
              <span>
                Cada archivo conserva su historial. Al reemplazarlo se crea una nueva versión,
                no se elimina la anterior.
              </span>
            </div>
            <b>{recurso.contenidos.length}</b>
          </div>

          <div className="bib-contenidos-actuales">
            {recurso.contenidos.map((contenido) => {
              const version = contenido.tipo === "ARCHIVO" ? contenido.versiones[0] : undefined;

              return (
                <article className="bib-contenido-actual" key={contenido.id}>
                  <span className={`bib-contenido-actual__icon ${contenido.tipo.toLowerCase()}`}>
                    {contenido.tipo === "ARCHIVO" ? <FileText size={20} /> : <Link2 size={20} />}
                  </span>

                  <div className="bib-contenido-actual__copy">
                    <div className="bib-contenido-actual__title">
                      <strong>{contenido.titulo}</strong>
                      <span>{contenido.tipo === "ARCHIVO" ? "ARCHIVO" : "ENLACE"}</span>
                    </div>

                    {contenido.tipo === "ARCHIVO" ? (
                      version ? (
                        <>
                          <p>{version.nombreOriginal}</p>
                          <div className="bib-version-meta">
                            <span className="bib-version-badge">v{version.numeroVersion}</span>
                            <span><Clock3 size={12} /> {fechaVersion(version.creadoEn)}</span>
                            <span>{version.extension.toUpperCase()}</span>
                            <span>{tamanio(version.tamanioBytes)}</span>
                          </div>
                        </>
                      ) : (
                        <p>Este contenido todavía no tiene una versión disponible.</p>
                      )
                    ) : (
                      <p className="bib-contenido-actual__url">{contenido.urlExterna}</p>
                    )}
                  </div>

                  {contenido.tipo === "ARCHIVO" && (
                    <div className="bib-contenido-actual__actions">
                      <button
                        type="button"
                        disabled={deshabilitado}
                        onClick={() => void abrirHistorial(contenido.id, contenido.titulo)}
                      >
                        <History size={14} /> Ver versiones
                      </button>
                      <button
                        type="button"
                        className="primary"
                        disabled={deshabilitado}
                        onClick={() => abrirNuevaVersion(contenido.id, contenido.titulo)}
                      >
                        <RefreshCw size={14} /> Nueva versión
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="bib-materiales__grid">
        <section className="bib-materiales__col">
          <header>
            <div className="bib-materiales__title">
              <span className="bib-materiales__icon"><FilePlus2 size={20} /></span>
              <div>
                <strong>{recurso ? "Agregar otro archivo" : "Archivos"}</strong>
                <span>PDF, DOC o DOCX de hasta 20 MB.</span>
              </div>
            </div>
            <label className="bib-materiales__add">
              <Plus size={15} /> Agregar
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                disabled={deshabilitado}
                onChange={(e) => {
                  agregarArchivos(Array.from(e.target.files ?? []));
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </header>

          {archivos.length === 0 ? (
            <div className="bib-materiales__empty">
              <span className="bib-materiales__empty-icon"><FilePlus2 size={28} /></span>
              <strong>Sin archivos nuevos</strong>
              <span>
                Arrastra la idea de un expediente digital: puedes añadir uno o varios
                documentos al mismo recurso.
              </span>
            </div>
          ) : (
            <div className="bib-materiales__list">
              {archivos.map((item, index) => (
                <article
                  className="bib-material-card"
                  key={`${item.archivo.name}-${item.archivo.lastModified}-${index}`}
                >
                  <div className="bib-material-card__top">
                    <span className="bib-material-card__icon"><FileText size={18} /></span>
                    <div>
                      <strong>{item.archivo.name}</strong>
                      <span>{tamanio(item.archivo.size)} · Nuevo archivo</span>
                    </div>
                    <button
                      type="button"
                      aria-label="Quitar archivo"
                      disabled={deshabilitado}
                      onClick={() => onArchivos(archivos.filter((_, i) => i !== index))}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <label>
                    <span>Título visible del archivo</span>
                    <input
                      value={item.titulo}
                      disabled={deshabilitado}
                      onChange={(e) =>
                        onArchivos(
                          archivos.map((actual, i) =>
                            i === index ? { ...actual, titulo: e.target.value } : actual,
                          ),
                        )
                      }
                    />
                  </label>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="bib-materiales__col">
          <header>
            <div className="bib-materiales__title">
              <span className="bib-materiales__icon"><Link2 size={20} /></span>
              <div>
                <strong>{recurso ? "Agregar otro enlace" : "Enlaces"}</strong>
                <span>Normativa, jurisprudencia o fuentes externas.</span>
              </div>
            </div>
            <button
              type="button"
              className="bib-materiales__add"
              disabled={deshabilitado}
              onClick={() => onEnlaces([...enlaces, { titulo: "", urlExterna: "" }])}
            >
              <Plus size={15} /> Agregar
            </button>
          </header>

          {enlaces.length === 0 ? (
            <div className="bib-materiales__empty">
              <span className="bib-materiales__empty-icon"><Link2 size={28} /></span>
              <strong>Sin enlaces nuevos</strong>
              <span>
                Puedes complementar el recurso con fuentes oficiales o material jurídico externo.
              </span>
            </div>
          ) : (
            <div className="bib-materiales__list">
              {enlaces.map((item, index) => (
                <article className="bib-material-card" key={index}>
                  <div className="bib-material-card__top">
                    <span className="bib-material-card__icon"><Link2 size={18} /></span>
                    <div>
                      <strong>Enlace {index + 1}</strong>
                      <span>Nuevo recurso externo</span>
                    </div>
                    <button
                      type="button"
                      aria-label="Quitar enlace"
                      disabled={deshabilitado}
                      onClick={() => onEnlaces(enlaces.filter((_, i) => i !== index))}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <label>
                    <span>Título</span>
                    <input
                      value={item.titulo}
                      disabled={deshabilitado}
                      placeholder="Ej. Código Civil Boliviano"
                      onChange={(e) =>
                        onEnlaces(
                          enlaces.map((actual, i) =>
                            i === index ? { ...actual, titulo: e.target.value } : actual,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    <span>URL</span>
                    <input
                      type="url"
                      value={item.urlExterna}
                      disabled={deshabilitado}
                      placeholder="https://..."
                      onChange={(e) =>
                        onEnlaces(
                          enlaces.map((actual, i) =>
                            i === index ? { ...actual, urlExterna: e.target.value } : actual,
                          ),
                        )
                      }
                    />
                  </label>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {modalVersion?.tipo === "historial" && (
        <div className="bib-version-modal" role="presentation">
          <section role="dialog" aria-modal="true">
            <header>
              <div>
                <span>TRAZABILIDAD DEL DOCUMENTO</span>
                <h3>Historial de versiones</h3>
                <p>{modalVersion.titulo}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => setModalVersion(null)}>
                <X size={18} />
              </button>
            </header>

            <div className="bib-version-modal__body">
              {cargandoVersiones ? (
                <div className="bib-version-empty">Cargando versiones...</div>
              ) : versiones.length ? (
                <div className="bib-version-list">
                  {versiones.map((version, index) => (
                    <article key={version.id} className={index === 0 ? "current" : ""}>
                      <span className="bib-version-list__number">v{version.numeroVersion}</span>
                      <div>
                        <div className="bib-version-list__title">
                          <strong>{version.nombreOriginal}</strong>
                          {index === 0 && <b>VIGENTE</b>}
                        </div>
                        <p>{version.motivoActualizacion || "Carga inicial"}</p>
                        <small>
                          <Clock3 size={11} />
                          {fechaVersion(version.creadoEn)}
                          <i>·</i>
                          {version.extension.toUpperCase()}
                          <i>·</i>
                          {tamanio(version.tamanioBytes)}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="bib-version-empty">No hay versiones registradas.</div>
              )}
            </div>

            <footer>
              <button type="button" onClick={() => setModalVersion(null)}>Cerrar</button>
            </footer>
          </section>
        </div>
      )}

      {modalVersion?.tipo === "nueva" && (
        <div className="bib-version-modal" role="presentation">
          <section role="dialog" aria-modal="true">
            <header>
              <div>
                <span>NUEVA VERSIÓN</span>
                <h3>Reemplazar archivo</h3>
                <p>{modalVersion.titulo}</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                disabled={guardandoVersion}
                onClick={() => setModalVersion(null)}
              >
                <X size={18} />
              </button>
            </header>

            <div className="bib-version-modal__body bib-version-form">
              <div className="bib-version-notice">
                <History size={18} />
                <div>
                  <strong>La versión anterior no se eliminará</strong>
                  <span>Se conservará en el historial para mantener la trazabilidad del recurso.</span>
                </div>
              </div>
              <label>
                <span>Nuevo archivo <b>*</b></span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  disabled={guardandoVersion}
                  onChange={(e) => setArchivoVersion(e.target.files?.[0] ?? null)}
                />
              </label>
              <label>
                <span>Motivo de actualización <b>*</b></span>
                <textarea
                  rows={3}
                  value={motivoVersion}
                  disabled={guardandoVersion}
                  placeholder="Ej. Actualización normativa 2026"
                  onChange={(e) => setMotivoVersion(e.target.value)}
                />
              </label>
            </div>

            <footer>
              <button
                type="button"
                disabled={guardandoVersion}
                onClick={() => setModalVersion(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary"
                disabled={guardandoVersion || !archivoVersion || !motivoVersion.trim()}
                onClick={() => void guardarNuevaVersion()}
              >
                <RefreshCw size={14} />
                {guardandoVersion ? "Guardando..." : "Crear nueva versión"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
