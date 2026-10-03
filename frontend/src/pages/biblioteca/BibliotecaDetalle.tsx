import { useAuth } from "../../auth/AuthContext";
import { registrarActividad } from "../../utils/biblioteca/actividadBiblioteca";
import VisorPdfBiblioteca from "../../components/biblioteca/VisorPdfBiblioteca";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Download,
  FileText,
  FolderHeart,
  Gavel,
  Scale,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { mensajeError, useBiblioteca } from "../../contexts/BibliotecaContext";
import { fecha } from "../../utils/biblioteca/biblioteca.utils";
import { categorias, vigencias } from "../../types/biblioteca/biblioteca.types";
import type {
  Recurso,
  Version,
  Coleccion,
} from "../../types/biblioteca/biblioteca.types";

const iconosCategoria: Record<
  string,
  React.ComponentType<{ size?: number }>
> = {
  MEMORIAL: FileText,
  CONTRATO: ShieldCheck,
  DEMANDA: Scale,
  CODIGO: BookOpen,
  LEY: BookOpen,
  JURISPRUDENCIA: Gavel,
  SENTENCIA: Gavel,
  DOCTRINA: UserRound,
  GUIA: BookOpen,
  CASO_PRACTICO: FileText,
  OTRO: FileText,
};

export default function BibliotecaDetalle() {
  const { id } = useParams();
  const { sesion } = useAuth();
  const { api, base, capacidades, avisar } = useBiblioteca();
  const [recurso, setRecurso] = useState<Recurso | null>(null);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("");
  const [vistaNombre, setVistaNombre] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [coleccion, setColeccion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [reportar, setReportar] = useState(false);
  const urlRef = useRef("");

  useEffect(() => {
    const c = new AbortController();
    setRecurso(null);
    setError("");
    setVista("");
    api
      .get<Recurso>(`/recursos/${id}`, c.signal)
      .then((r) => {
        if (c.signal.aborted) return;
        setRecurso(r);
        registrarActividad(sesion?.usuario.id, "consulta", r);
        void api
          .send(`/recursos/${r.id}/visualizaciones`, "POST")
          .catch((e) => avisar(mensajeError(e), true));
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(mensajeError(e));
      });
    api
      .get<Coleccion[]>("/colecciones", c.signal)
      .then(setColecciones)
      .catch(() => {});
    return () => {
      c.abort();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    };
  }, [api, id, sesion?.usuario.id]);

  useEffect(() => {
    const version = recurso?.contenidos.find(
      (c) => c.tipo === "ARCHIVO" && c.versiones[0]?.extension === "pdf",
    )?.versiones[0];
    if (!version) return;
    let cancelado = false;
    api
      .archivo(version.id, true)
      .then((blob) => {
        if (cancelado) return;
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setVista(url);
        setVistaNombre(version.nombreOriginal);
      })
      .catch(() => {
        /* El botón Leer PDF permite reintentar. */
      });
    return () => {
      cancelado = true;
    };
  }, [api, recurso?.id]);

  async function abrir(version: Version, previsualizar: boolean) {
    setOcupado(true);
    try {
      const blob = await api.archivo(version.id, previsualizar);
      const url = URL.createObjectURL(blob);
      if (previsualizar) {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setVista(url);
        setVistaNombre(version.nombreOriginal);
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = version.nombreOriginal;
        a.click();
        if (recurso)
          registrarActividad(
            sesion?.usuario.id,
            "descarga",
            recurso,
            version.nombreOriginal,
          );
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (e) {
      avisar(mensajeError(e), true);
    } finally {
      setOcupado(false);
    }
  }

  async function favorito() {
    if (!recurso) return;
    setOcupado(true);
    try {
      await api.send(
        `/recursos/${id}/favorito`,
        recurso.esFavorito ? "DELETE" : "PUT",
      );
      setRecurso({ ...recurso, esFavorito: !recurso.esFavorito });
    } catch (e) {
      avisar(mensajeError(e), true);
    } finally {
      setOcupado(false);
    }
  }

  if (error)
    return (
      <div className="bib-empty" role="alert">
        <p>{error}</p>
        <Link to={base} className="bib-button">
          Volver a la biblioteca
        </Link>
      </div>
    );
  if (!recurso)
    return (
      <div className="bib-empty" role="status">
        Cargando documento…
      </div>
    );

  const IconoCategoria = iconosCategoria[recurso.categoria] || FileText;

  return (
    <>
      <Link className="bib-back" to={`${base}?categoria=${recurso.categoria}`}>
        <ArrowLeft size={17} />
        Volver a{" "}
        {paramsGetCategoria(recurso.categoria)
          ? categorias[recurso.categoria]
          : "la biblioteca"}
      </Link>

      <section className="bib-detail-header">
        <span className="bib-detail-icon">
          <IconoCategoria size={28} />
        </span>
        <span className="bib-detail-eyebrow">
          {categorias[recurso.categoria]} · {recurso.tema}
        </span>
        <h2>{recurso.titulo}</h2>
        <p>{recurso.descripcion}</p>
      </section>

      <div className="bib-detail-grid">
        <div className="bib-viewer-column">
          {vista && (
            <VisorPdfBiblioteca
              url={vista}
              nombre={vistaNombre}
              onCerrar={() => {
                if (urlRef.current) URL.revokeObjectURL(urlRef.current);
                urlRef.current = "";
                setVista("");
              }}
            />
          )}
          <section className="bib-panel bib-files-panel">
            <h3>
              <FileText size={20} />
              Documentos y fuentes
            </h3>
            {recurso.contenidos.length ? (
              recurso.contenidos.map((c) => (
                <div className="bib-file" key={c.id}>
                  <FileText size={22} />
                  <div>
                    <strong>{c.titulo}</strong>
                    <small>
                      {c.tipo === "ENLACE"
                        ? "Fuente externa"
                        : `${c.versiones[0]?.nombreOriginal ?? "Sin archivo"} · Versión ${c.versiones[0]?.numeroVersion ?? "—"}`}
                    </small>
                  </div>
                  <div className="bib-actions">
                    {c.tipo === "ENLACE" ? (
                      <a
                        className="bib-button"
                        href={c.urlExterna}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir
                        <ArrowUpRight size={16} />
                      </a>
                    ) : (
                      c.versiones[0] && (
                        <>
                          {c.versiones[0].extension === "pdf" && (
                            <button
                              className="bib-button"
                              disabled={ocupado}
                              onClick={() => void abrir(c.versiones[0], true)}
                            >
                              Leer PDF
                            </button>
                          )}
                          <button
                            className="bib-icon-button"
                            disabled={ocupado}
                            aria-label={`Descargar ${c.versiones[0].nombreOriginal}`}
                            onClick={() => void abrir(c.versiones[0], false)}
                          >
                            <Download size={18} />
                          </button>
                        </>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>Este recurso todavía no tiene documentos.</p>
            )}
          </section>

          {recurso.finalidad && (
            <section className="bib-panel">
              <h3>¿Para qué sirve?</h3>
              <p className="bib-preserve">{recurso.finalidad}</p>
            </section>
          )}

          {!!recurso.relacionados?.length && (
            <section className="bib-panel">
              <h3>Continúa tu consulta</h3>
              {recurso.relacionados.map((r) => (
                <Link
                  className="bib-related"
                  key={r.id}
                  to={`${base}/recursos/${r.id}`}
                >
                  <span>
                    <strong>{r.titulo}</strong>
                    <small>
                      {categorias[r.categoria]} · {r.tema}
                    </small>
                  </span>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
            </section>
          )}
        </div>

        <aside className="bib-ficha-column">
          <div className="bib-actions bib-document-tools">
            {recurso.contenidos.find(
              (c) => c.tipo === "ARCHIVO" && c.versiones[0],
            )?.versiones[0] && (
              <button
                className="bib-button primary"
                disabled={ocupado}
                onClick={() => {
                  const v = recurso.contenidos.find(
                    (c) => c.tipo === "ARCHIVO" && c.versiones[0],
                  )?.versiones[0];
                  if (v) void abrir(v, false);
                }}
              >
                <Download size={17} /> Descargar
              </button>
            )}
            <button disabled={ocupado} onClick={() => void favorito()}>
              <Bookmark
                size={17}
                fill={recurso.esFavorito ? "currentColor" : "none"}
                strokeWidth={recurso.esFavorito ? 2.5 : 1.5}
              />
              {recurso.esFavorito ? "Guardado" : "Guardar favorito"}
            </button>
            {capacidades.puedeGestionar && (
              <Link className="bib-button" to={`${base}/recursos/${id}/editar`}>
                <Settings2 size={17} />
                Editar recurso
              </Link>
            )}
            <span className="bib-badge">
              {recurso.estado === "PUBLICADO"
                ? "Publicado"
                : recurso.estado === "BORRADOR"
                  ? "Borrador"
                  : "Archivado"}
            </span>
          </div>

          <section className="bib-panel bib-document-info">
            <h3>Ficha jurídica</h3>
            <span className="bib-category-label">
              {categorias[recurso.categoria]}
            </span>
            <p className="bib-info-description">{recurso.descripcion}</p>
            <dl className="bib-ficha">
              {[
                ["Autor o institución", recurso.autorInstitucion],
                ["Fuente", recurso.fuente],
                [
                  "Fecha del documento",
                  recurso.fechaDocumento
                    ? fecha(recurso.fechaDocumento)
                    : undefined,
                ],
                ["Número de norma", recurso.numeroNorma],
                ["Tribunal", recurso.tribunal],
                ["Resolución", recurso.numeroResolucion],
                ["Actualización", fecha(recurso.actualizadoEn)],
              ]
                .filter(([, valor]) => valor)
                .map(([clave, valor]) => (
                  <div key={clave}>
                    <dt>{clave}</dt>
                    <dd>{valor}</dd>
                  </div>
                ))}
            </dl>
            {recurso.vigencia !== "NO_APLICA" && (
              <div className="bib-vigencia">
                <ShieldCheck size={18} />
                <strong>{vigencias[recurso.vigencia]}</strong>
                <small>
                  {recurso.vigenciaVerificadaEn
                    ? `Revisada el ${fecha(recurso.vigenciaVerificadaEn)}`
                    : "Pendiente de verificación"}
                </small>
                {recurso.observacionVigencia && (
                  <p>{recurso.observacionVigencia}</p>
                )}
              </div>
            )}
            <div className="bib-tags">
              {recurso.etiquetas.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </section>

          <section className="bib-panel">
            <h3>Organiza tu lectura</h3>
            {colecciones.length ? (
              <>
                <label className="bib-field">
                  Colección
                  <select
                    value={coleccion}
                    onChange={(e) => setColeccion(e.target.value)}
                  >
                    <option value="">Elige una colección</option>
                    {colecciones.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  disabled={!coleccion || ocupado}
                  onClick={async () => {
                    setOcupado(true);
                    try {
                      await api.send(
                        `/colecciones/${coleccion}/recursos/${id}`,
                        "PUT",
                      );
                      avisar("Documento agregado a tu colección");
                    } catch (e) {
                      avisar(mensajeError(e), true);
                    } finally {
                      setOcupado(false);
                    }
                  }}
                >
                  <FolderHeart size={17} />
                  Agregar
                </button>
              </>
            ) : (
              <Link to={`${base}/guardados`}>Crear mi primera colección</Link>
            )}
          </section>

          <section className="bib-panel">
            <h3>Ayúdanos a mejorar</h3>
            <p>Avísanos si el documento o su enlace necesita una revisión.</p>
            <button onClick={() => setReportar(!reportar)}>
              Reportar un problema
            </button>
            {reportar && (
              <form
                className="bib-stack"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setOcupado(true);
                  try {
                    await api.send(`/recursos/${id}/reportes`, "POST", {
                      motivo: motivo.trim(),
                    });
                    avisar("Reporte enviado para revisión");
                    setMotivo("");
                    setReportar(false);
                  } catch (err) {
                    avisar(mensajeError(err), true);
                  } finally {
                    setOcupado(false);
                  }
                }}
              >
                <label className="bib-field">
                  Describe el problema
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </label>
                <button disabled={ocupado} type="submit">
                  Enviar reporte
                </button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function paramsGetCategoria(cat: string): boolean {
  return Object.keys(categorias).includes(cat);
}
