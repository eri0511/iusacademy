import { useAuth } from "../../auth/AuthContext";

import { registrarActividad } from "../../utils/biblioteca/actividadBiblioteca";

import VisorPdfBiblioteca from "../../components/biblioteca/VisorPdfBiblioteca";

import VisorDocxBiblioteca from "../../components/biblioteca/VisorDocxBiblioteca";

import { useEffect, useRef, useState } from "react";

import { Link, useParams } from "react-router-dom";

import {

  ArrowLeft,

  ArrowUpRight,

  Bookmark,

  BookOpen,

  Download,

  ExternalLink,

  FileText,

  FolderHeart,

  Info,

  Settings2,

  ShieldCheck,

  Tag,

} from "lucide-react";

import {

  mensajeError,

  useBiblioteca,

} from "../../contexts/BibliotecaContext";

import { fecha } from "../../utils/biblioteca/biblioteca.utils";

import {

  categorias,

  vigencias,

} from "../../types/biblioteca/biblioteca.types";

import type {

  Coleccion,

  Recurso,

  Version,

} from "../../types/biblioteca/biblioteca.types";

const tonosCategoria: Record<string, string> = {

  MEMORIAL: "orange",

  CONTRATO: "purple",

  DEMANDA: "blue",

  JURISPRUDENCIA: "green",

  CODIGO: "yellow",

  LEY: "pink",

  SENTENCIA: "teal",

  DOCTRINA: "indigo",

  GUIA: "amber",

  CASO_PRACTICO: "rose",

  OTRO: "slate",

};

export default function BibliotecaDetalle() {

  const { id } = useParams();

  const { sesion } = useAuth();

  const { api, base, capacidades, avisar } = useBiblioteca();

  const [recurso, setRecurso] = useState<Recurso | null>(null);

  const [error, setError] = useState("");

  const [vista, setVista] = useState("");

  const [vistaNombre, setVistaNombre] = useState("");

  const [vistaTipo, setVistaTipo] = useState<"pdf" | "docx" | "">("");

  const [ocupado, setOcupado] = useState(false);

  const [colecciones, setColecciones] = useState<Coleccion[]>([]);

  const [coleccion, setColeccion] = useState("");

  const [motivo, setMotivo] = useState("");

  const [reportar, setReportar] = useState(false);

  const urlRef = useRef("");

  useEffect(() => {

    const controller = new AbortController();

    setRecurso(null);

    setError("");

    setVista("");

    setVistaNombre("");

    setVistaTipo("");

    api

      .get<Recurso>(`/recursos/${id}`, controller.signal)

      .then((respuesta) => {

        if (controller.signal.aborted) return;

        setRecurso(respuesta);

        registrarActividad(sesion?.usuario.id, "consulta", respuesta);

        void api

          .send(`/recursos/${respuesta.id}/visualizaciones`, "POST")

          .catch((e) => avisar(mensajeError(e), true));

      })

      .catch((e) => {

        if (!controller.signal.aborted) {

          setError(mensajeError(e));

        }

      });

    api

      .get<Coleccion[]>("/colecciones", controller.signal)

      .then(setColecciones)

      .catch(() => {});

    return () => {

      controller.abort();

      if (urlRef.current) {

        URL.revokeObjectURL(urlRef.current);

      }

      urlRef.current = "";

    };

  }, [api, id, sesion?.usuario.id]);

  useEffect(() => {

    const version = recurso?.contenidos.find((contenido) => {

      const extension = contenido.versiones[0]?.extension?.toLowerCase();

      return (

        contenido.tipo === "ARCHIVO" &&

        (extension === "pdf" || extension === "docx")

      );

    })?.versiones[0];

    if (!version) return;

    let cancelado = false;

    api

      .archivo(version.id, false)

      .then((blob) => {

        if (cancelado) return;

        if (urlRef.current) {

          URL.revokeObjectURL(urlRef.current);

        }

        const url = URL.createObjectURL(blob);

        const extension = version.extension.toLowerCase();

        urlRef.current = url;

        setVista(url);

        setVistaNombre(version.nombreOriginal);

        setVistaTipo(extension === "docx" ? "docx" : "pdf");

      })

      .catch(() => {

        /* El botón de vista previa permite reintentar. */

      });

    return () => {

      cancelado = true;

    };

  }, [api, recurso?.id]);

  async function abrir(version: Version, previsualizar: boolean) {

    setOcupado(true);

    try {

      const blob = await api.archivo(version.id, false);

      const url = URL.createObjectURL(blob);

      if (previsualizar) {

        if (urlRef.current) {

          URL.revokeObjectURL(urlRef.current);

        }

        urlRef.current = url;

        setVista(url);

        setVistaNombre(version.nombreOriginal);

        setVistaTipo(

          version.extension.toLowerCase() === "docx" ? "docx" : "pdf",

        );

      } else {

        const enlace = document.createElement("a");

        enlace.href = url;

        enlace.download = version.nombreOriginal;

        enlace.click();

        if (recurso) {

          registrarActividad(

            sesion?.usuario.id,

            "descarga",

            recurso,

            version.nombreOriginal,

          );

        }

        setTimeout(() => URL.revokeObjectURL(url), 10000);

      }

    } catch (e) {

      avisar(mensajeError(e), true);

    } finally {

      setOcupado(false);

    }

  }

  function cerrarVista() {

    if (urlRef.current) {

      URL.revokeObjectURL(urlRef.current);

    }

    urlRef.current = "";

    setVista("");

    setVistaNombre("");

    setVistaTipo("");

  }



  async function favorito() {

    if (!recurso) return;

    setOcupado(true);

    try {

      await api.send(

        `/recursos/${id}/favorito`,

        recurso.esFavorito ? "DELETE" : "PUT",

      );

      setRecurso({

        ...recurso,

        esFavorito: !recurso.esFavorito,

      });

    } catch (e) {

      avisar(mensajeError(e), true);

    } finally {

      setOcupado(false);

    }

  }

  if (error) {

    return (

      <>

        <div className="bib-detalle-estado" role="alert">

          <Info size={28} />

          <h3>No pudimos abrir este recurso</h3>

          <p>{error}</p>

          <Link to={base}>Volver a la biblioteca</Link>

        </div>

        <style>{styles}</style>

      </>

    );

  }

  if (!recurso) {

    return (

      <>

        <div className="bib-detalle-estado" role="status">

          <span className="bib-detalle-loader" />

          <strong>Cargando documento…</strong>

        </div>

        <style>{styles}</style>

      </>

    );

  }

  const tono = tonosCategoria[recurso.categoria] || "slate";

  const categoriaNombre =

    categorias[recurso.categoria] ?? "Recurso jurídico";

  const primerArchivo = recurso.contenidos.find(

    (contenido) =>

      contenido.tipo === "ARCHIVO" && contenido.versiones[0],

  )?.versiones[0];

  const cantidadArchivos = recurso.contenidos.filter(

    (contenido) => contenido.tipo === "ARCHIVO",

  ).length;

  const cantidadEnlaces = recurso.contenidos.filter(

    (contenido) => contenido.tipo === "ENLACE",

  ).length;

  const cantidadContenidos = recurso.contenidos.length;

  return (

    <>

      <main className={`bib-detalle tone-${tono}`}>

        <section className="bib-detalle-hero">
          <div className="bib-detalle-hero__main">
            <span className="bib-detalle-hero__icon" aria-hidden="true">
              <BookOpen size={24} strokeWidth={2.15} />
            </span>

            <div className="bib-detalle-hero__content">
              <h1>{recurso.titulo}</h1>
              <p>{recurso.descripcion}</p>
            </div>
          </div>

          <div className="bib-detalle-hero__side">
            <Link
              to={`${base}?categoria=${encodeURIComponent(recurso.categoria)}`}
              className="bib-detalle-hero__back"
            >
              <ArrowLeft size={15} strokeWidth={2.2} />
              Volver a {categoriaNombre}
            </Link>

            <div className="bib-detalle-hero__labels">
              <span className="bib-detalle-categoria">{categoriaNombre}</span>
              {recurso.tema && (
                <span className="bib-detalle-tema">{recurso.tema}</span>
              )}
              <span
                className={`bib-detalle-estado-publicacion estado-${recurso.estado.toLowerCase()}`}
              >
                <span />
                {recurso.estado === "PUBLICADO"
                  ? "Publicado"
                  : recurso.estado === "BORRADOR"
                    ? "Borrador"
                    : "Archivado"}
              </span>
              {primerArchivo && (
                <span
                  className="bib-detalle-version"
                  title={`Versión vigente ${primerArchivo.numeroVersion}`}
                >
                  v{primerArchivo.numeroVersion}
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="bib-detalle-layout">

          <div className="bib-detalle-principal">

            {vista && vistaTipo === "pdf" ? (

              <VisorPdfBiblioteca

                url={vista}

                nombre={vistaNombre}

                onCerrar={() => cerrarVista()}

              />

            ) : vista && vistaTipo === "docx" ? (

              <VisorDocxBiblioteca

                url={vista}

                nombre={vistaNombre}

                onCerrar={() => cerrarVista()}

              />

            ) : (

              <section className="bib-detalle-preview-empty">

                <span>

                  <FileText size={34} />

                </span>

                <h2>Vista previa del documento</h2>

                {primerArchivo ? (

                  <>

                    <p>

                      {["pdf", "docx"].includes(primerArchivo.extension.toLowerCase())

                        ? "Selecciona Vista previa para consultar el documento sin salir de la Biblioteca."

                        : "Este formato no dispone de vista previa integrada. Puedes descargar el archivo para consultarlo."}

                    </p>

                    <div>

                      {["pdf", "docx"].includes(primerArchivo.extension.toLowerCase()) && (

                        <button

                          type="button"

                          disabled={ocupado}

                          onClick={() =>

                            void abrir(primerArchivo, true)

                          }

                        >

                          <FileText size={16} />

                          Vista previa

                        </button>

                      )}

                      <button

                        type="button"

                        className="secondary"

                        disabled={ocupado}

                        onClick={() =>

                          void abrir(primerArchivo, false)

                        }

                      >

                        <Download size={16} />

                        Descargar archivo

                      </button>

                    </div>

                  </>

                ) : (

                  <p>

                    Este recurso no dispone de un archivo para

                    previsualizar.

                  </p>

                )}

              </section>

            )}

            <section className="bib-detalle-card bib-detalle-contenidos">

              <div className="bib-detalle-section-title">

                <div>

                  <span className="bib-detalle-section-icon">

                    <FileText size={18} />

                  </span>

                  <div>

                    <h2>Documentos y fuentes</h2>

                    <p>

                      Archivos, enlaces y versiones disponibles en

                      este recurso.

                    </p>

                  </div>

                </div>

                <span className="bib-detalle-count">

                  {cantidadContenidos}

                </span>

              </div>

              {cantidadContenidos > 0 && (

                <div className="bib-detalle-composicion">

                  {cantidadArchivos > 0 && (

                    <span>

                      {cantidadArchivos}{" "}

                      {cantidadArchivos === 1

                        ? "archivo"

                        : "archivos"}

                    </span>

                  )}

                  {cantidadEnlaces > 0 && (

                    <span>

                      {cantidadEnlaces}{" "}

                      {cantidadEnlaces === 1

                        ? "enlace"

                        : "enlaces"}

                    </span>

                  )}

                </div>

              )}

              {recurso.contenidos.length ? (

                <div className="bib-detalle-lista">

                  {recurso.contenidos.map((contenido) => {

                    const version = contenido.versiones[0];

                    return (

                      <article

                        className="bib-detalle-archivo"

                        key={contenido.id}

                      >

                        <span className="bib-detalle-archivo__icon">

                          {contenido.tipo === "ENLACE" ? (

                            <ExternalLink size={21} />

                          ) : (

                            <FileText size={21} />

                          )}

                        </span>

                        <div className="bib-detalle-archivo__info">

                          <strong>{contenido.titulo}</strong>

                          <small>

                            {contenido.tipo === "ENLACE"

                              ? "Fuente externa"

                              : version

                                ? `${version.nombreOriginal} · Versión ${version.numeroVersion}`

                                : "Sin archivo disponible"}

                          </small>

                        </div>

                        <div className="bib-detalle-archivo__acciones">

                          {contenido.tipo === "ENLACE" ? (

                            <a

                              href={contenido.urlExterna}

                              target="\_blank"

                              rel="noopener noreferrer"

                            >

                              Abrir

                              <ArrowUpRight size={15} />

                            </a>

                          ) : (

                            version && (

                              <>

                                {["pdf", "docx"].includes(version.extension.toLowerCase()) && (

                                  <button

                                    type="button"

                                    disabled={ocupado}

                                    onClick={() =>

                                      void abrir(version, true)

                                    }

                                  >

                                    Vista previa

                                  </button>

                                )}

                                <button

                                  type="button"

                                  className="icon"

                                  disabled={ocupado}

                                  aria-label={`Descargar ${version.nombreOriginal}`}

                                  title={`Descargar ${version.nombreOriginal}`}

                                  onClick={() =>

                                    void abrir(version, false)

                                  }

                                >

                                  <Download size={17} />

                                </button>

                              </>

                            )

                          )}

                        </div>

                      </article>

                    );

                  })}

                </div>

              ) : (

                <div className="bib-detalle-sin-contenido">

                  <FileText size={26} />

                  <p>

                    Este recurso todavía no tiene documentos o

                    enlaces asociados.

                  </p>

                </div>

              )}

            </section>

            {recurso.finalidad && (

              <section className="bib-detalle-card">

                <div className="bib-detalle-section-title">

                  <div>

                    <span className="bib-detalle-section-icon">

                      <Info size={18} />

                    </span>

                    <div>

                      <h2>¿Para qué sirve?</h2>

                      <p>

                        Utilidad académica y jurídica de este

                        recurso.

                      </p>

                    </div>

                  </div>

                </div>

                <p className="bib-detalle-finalidad">

                  {recurso.finalidad}

                </p>

              </section>

            )}

            {!!recurso.relacionados?.length && (

              <section className="bib-detalle-card">

                <div className="bib-detalle-section-title">

                  <div>

                    <span className="bib-detalle-section-icon">

                      <BookOpen size={18} />

                    </span>

                    <div>

                      <h2>Continúa tu consulta</h2>

                      <p>

                        Recursos relacionados que podrían serte

                        útiles.

                      </p>

                    </div>

                  </div>

                </div>

                <div className="bib-detalle-relacionados">

                  {recurso.relacionados.map((relacionado) => (

                    <Link

                      key={relacionado.id}

                      to={`${base}/recursos/${relacionado.id}`}

                    >

                      <span>

                        <strong>{relacionado.titulo}</strong>

                        <small>

                          {categorias[relacionado.categoria]} ·{" "}

                          {relacionado.tema}

                        </small>

                      </span>

                      <ArrowUpRight size={17} />

                    </Link>

                  ))}

                </div>

              </section>

            )}

          </div>

          <aside className="bib-detalle-sidebar">

            <section className="bib-detalle-actions-card">

              <button

                type="button"

                className="primary"

                disabled={!primerArchivo || ocupado}

                onClick={() => {

                  if (primerArchivo) {

                    void abrir(primerArchivo, false);

                  }

                }}

              >

                <Download size={17} />

                Descargar

              </button>

              <button

                type="button"

                className={recurso.esFavorito ? "favorite active" : "favorite"}

                disabled={ocupado}

                onClick={() => void favorito()}

              >

                <Bookmark

                  size={17}

                  fill={

                    recurso.esFavorito

                      ? "currentColor"

                      : "none"

                  }

                />

                {recurso.esFavorito

                  ? "Guardado en favoritos"

                  : "Agregar a favoritos"}

              </button>

              {capacidades.puedeGestionar && (

                <Link

                  className="edit"

                  to={`${base}/recursos/${id}/editar`}

                >

                  <Settings2 size={17} />

                  Editar recurso

                </Link>

              )}

            </section>

            <section className="bib-detalle-card bib-detalle-ficha">

              <div className="bib-detalle-ficha__title">

                <span>

                  <Info size={18} />

                </span>

                <div>

                  <h2>Información del documento</h2>

                  <p>Ficha jurídica del recurso</p>

                </div>

              </div>

              <div className="bib-detalle-ficha__categoria">

                <span>Categoría</span>

                <strong>{categoriaNombre}</strong>

              </div>

              <dl>

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

                <div className="bib-detalle-vigencia">

                  <ShieldCheck size={19} />

                  <div>

                    <strong>

                      {vigencias[recurso.vigencia]}

                    </strong>

                    <small>

                      {recurso.vigenciaVerificadaEn

                        ? `Revisada el ${fecha(

                            recurso.vigenciaVerificadaEn,

                          )}`

                        : "Pendiente de verificación"}

                    </small>

                    {recurso.observacionVigencia && (

                      <p>

                        {recurso.observacionVigencia}

                      </p>

                    )}

                  </div>

                </div>

              )}

              {!!recurso.etiquetas.length && (

                <div className="bib-detalle-tags">

                  <span className="bib-detalle-tags__title">

                    <Tag size={14} />

                    Palabras clave

                  </span>

                  <div>

                    {recurso.etiquetas.map((etiqueta) => (

                      <span key={etiqueta}>

                        {etiqueta}

                      </span>

                    ))}

                  </div>

                </div>

              )}

            </section>

            <section className="bib-detalle-card bib-detalle-coleccion">

              <div className="bib-detalle-small-title">

                <span>

                  <FolderHeart size={18} />

                </span>

                <div>

                  <h2>Organiza tu lectura</h2>

                  <p>Guarda este recurso en una colección.</p>

                </div>

              </div>

              {colecciones.length ? (

                <>

                  <label>

                    Colección

                    <select

                      value={coleccion}

                      onChange={(e) =>

                        setColeccion(e.target.value)

                      }

                    >

                      <option value="">

                        Elige una colección

                      </option>

                      {colecciones.map((item) => (

                        <option

                          key={item.id}

                          value={item.id}

                        >

                          {item.nombre}

                        </option>

                      ))}

                    </select>

                  </label>

                  <button

                    type="button"

                    disabled={!coleccion || ocupado}

                    onClick={async () => {

                      setOcupado(true);

                      try {

                        await api.send(

                          `/colecciones/${coleccion}/recursos/${id}`,

                          "PUT",

                        );

                        avisar(

                          "Documento agregado a tu colección",

                        );

                      } catch (e) {

                        avisar(mensajeError(e), true);

                      } finally {

                        setOcupado(false);

                      }

                    }}

                  >

                    <FolderHeart size={16} />

                    Agregar a colección

                  </button>

                </>

              ) : (

                <Link to={`${base}/guardados`}>

                  Crear mi primera colección

                </Link>

              )}

            </section>

            <section className="bib-detalle-card bib-detalle-reportar">

              <div className="bib-detalle-small-title">

                <span>

                  <ShieldCheck size={18} />

                </span>

                <div>

                  <h2>Ayúdanos a mejorar</h2>

                  <p>

                    Avísanos si este recurso necesita revisión.

                  </p>

                </div>

              </div>

              <button

                type="button"

                className="report"

                onClick={() => setReportar(!reportar)}

              >

                {reportar ? "Cancelar reporte" : "Reportar un problema"}

              </button>

              {reportar && (

                <form

                  onSubmit={async (e) => {

                    e.preventDefault();

                    setOcupado(true);

                    try {

                      await api.send(

                        `/recursos/${id}/reportes`,

                        "POST",

                        {

                          motivo: motivo.trim(),

                        },

                      );

                      avisar(

                        "Reporte enviado para revisión",

                      );

                      setMotivo("");

                      setReportar(false);

                    } catch (err) {

                      avisar(mensajeError(err), true);

                    } finally {

                      setOcupado(false);

                    }

                  }}

                >

                  <label>

                    Describe el problema

                    <textarea

                      required

                      minLength={10}

                      maxLength={2000}

                      value={motivo}

                      placeholder="Describe brevemente qué debería revisarse…"

                      onChange={(e) =>

                        setMotivo(e.target.value)

                      }

                    />

                  </label>

                  <button

                    type="submit"

                    disabled={ocupado}

                  >

                    Enviar reporte

                  </button>

                </form>

              )}

            </section>

          </aside>

        </div>

      </main>

      <style>{styles}</style>

    </>

  );

}

const styles = `

  .bib-detalle {

    --category-color: #64748b;

    --category-soft: #f1f5f9;

    width: 100%;

    color: var(--app-text, #0f172a);

  }

  .bib-detalle.tone-orange {

    --category-color: #ea6d22;

    --category-soft: #fff0e5;

  }

  .bib-detalle.tone-purple {

    --category-color: #7c3aed;

    --category-soft: #f2ebff;

  }

  .bib-detalle.tone-blue {

    --category-color: #2f80ed;

    --category-soft: #e8f2ff;

  }

  .bib-detalle.tone-green {

    --category-color: #18a86b;

    --category-soft: #e9f9f0;

  }

  .bib-detalle.tone-yellow {

    --category-color: #d97706;

    --category-soft: #fff6dc;

  }

  .bib-detalle.tone-pink {

    --category-color: #e91e63;

    --category-soft: #ffedf3;

  }

  .bib-detalle.tone-teal {

    --category-color: #0f9f9a;

    --category-soft: #e8f8f7;

  }

  .bib-detalle.tone-indigo {

    --category-color: #6366f1;

    --category-soft: #eeefff;

  }

  .bib-detalle.tone-amber {

    --category-color: #d88a00;

    --category-soft: #fff4d9;

  }

  .bib-detalle.tone-rose {

    --category-color: #e5486d;

    --category-soft: #ffedf1;

  }

  .bib-detalle.tone-slate {

    --category-color: #64748b;

    --category-soft: #f1f5f9;

  }

  .bib-detalle \*,

  .bib-detalle \*::before,

  .bib-detalle \*::after {

    box-sizing: border-box;

  }

  .bib-detalle-hero {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 17px 22px;
    margin-bottom: 14px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 253, 249, 0.98) 100%);
    border: 1px solid var(--app-border, rgba(241, 139, 75, 0.2));
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.028);
    box-sizing: border-box;
  }

  .bib-detalle-hero__main {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
  }

  .bib-detalle-hero__icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    flex: 0 0 48px;
    color: #2f80ed;
    background: #e8f2ff;
    border: 1px solid rgba(47, 128, 237, 0.16);
    border-radius: 14px;
  }

  .bib-detalle-hero__content {
    min-width: 0;
    flex: 1;
  }

  .bib-detalle-hero h1 {
    margin: 0;
    color: var(--app-text, #0f172a);
    font-size: 21px;
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: -0.025em;
  }

  .bib-detalle-hero__content > p {
    max-width: 760px;
    margin: 5px 0 0;
    color: var(--app-text-secondary, #475569);
    font-size: 13px;
    line-height: 1.45;
  }

  .bib-detalle-hero__side {
    flex: 0 0 auto;
    display: grid;
    justify-items: end;
    gap: 7px;
  }

  .bib-detalle-hero__back {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 16px;
    color: var(--app-accent-700, #d86827);
    background: #fff8f1;
    border: 1px solid rgba(241, 139, 75, 0.3);
    border-radius: 999px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
    font-size: 11.5px;
    font-weight: 850;
    text-decoration: none;
    white-space: nowrap;
    transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
  }

  .bib-detalle-hero__back:hover {
    background: var(--app-accent-100, #ffe9d6);
    border-color: var(--app-border-strong, rgba(241, 139, 75, 0.36));
    transform: translateY(-1px);
  }

  .bib-detalle-hero__labels {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 5px;
  }

  .bib-detalle-categoria,
  .bib-detalle-tema,
  .bib-detalle-estado-publicacion,
  .bib-detalle-version {
    min-height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 850;
    line-height: 1;
  }

  .bib-detalle-categoria {
    color: var(--category-color);
    background: var(--category-soft);
  }

  .bib-detalle-tema {
    color: var(--app-text-secondary, #475569);
    background: var(--app-surface-disabled, #f8fafc);
  }

  .bib-detalle-version {
    color: #2563eb;
    background: #eff6ff;
    border: 1px solid #dbeafe;
    letter-spacing: 0.01em;
  }

  .bib-detalle-estado-publicacion {
    gap: 5px;
    color: #15815b;
    background: #ecfdf5;
    border: 1px solid #d1fae5;
  }

  .bib-detalle-estado-publicacion > span {
    width: 5px;
    height: 5px;
    flex-shrink: 0;
    background: currentColor;
    border-radius: 50%;
  }

  .bib-detalle-estado-publicacion.estado-borrador {
    color: #b45309;
    background: #fffbeb;
    border-color: #fde68a;
  }

  .bib-detalle-estado-publicacion.estado-archivado {
    color: #64748b;
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  .bib-detalle-layout {

    display: grid;

    grid-template-columns: minmax(0, 1.75fr) minmax(300px, 0.72fr);

    align-items: start;

    gap: 18px;

  }

  .bib-detalle-principal,

  .bib-detalle-sidebar {

    min-width: 0;

  }

  .bib-detalle-principal {

    display: grid;

    gap: 16px;

  }

  .bib-detalle-sidebar {

    display: grid;

    gap: 14px;

  }

  .bib-detalle-card,

  .bib-detalle-actions-card {

    background: var(--app-surface-raised, #ffffff);

    border: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));

    border-radius: 18px;

    box-shadow: 0 6px 22px rgba(15, 23, 42, 0.025);

  }

  .bib-detalle-card {

    padding: 18px;

  }

  .bib-detalle-actions-card {

    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 9px;

    padding: 12px;

  }

  .bib-detalle-actions-card button,

  .bib-detalle-actions-card a {

    min-height: 42px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 7px;

    padding: 0 12px;

    border: 1px solid var(--app-border, rgba(241, 139, 75, 0.2));

    border-radius: 11px;

    font: inherit;

    font-size: 10.5px;

    font-weight: 800;

    text-decoration: none;

    cursor: pointer;

    transition:

      transform 160ms ease,

      background 160ms ease,

      border-color 160ms ease;

  }

  .bib-detalle-actions-card button:hover:not(:disabled),

  .bib-detalle-actions-card a:hover {

    transform: translateY(-1px);

  }

  .bib-detalle-actions-card .primary {

    color: #ffffff;

    background: var(--app-accent, #f18b4b);

    border-color: var(--app-accent, #f18b4b);

  }

  .bib-detalle-actions-card .primary:hover:not(:disabled) {

    background: var(--app-accent-600, #ea7a35);

  }

  .bib-detalle-actions-card .favorite,

  .bib-detalle-actions-card .edit {

    color: var(--app-accent-700, #d86827);

    background: var(--app-accent-50, #fff5ec);

  }

  .bib-detalle-actions-card .favorite.active {

    color: #d93b67;

    background: #ffedf3;

    border-color: #ffd2df;

  }

  .bib-detalle-actions-card .edit {

    grid-column: 1 / -1;

  }

  .bib-detalle-actions-card button:disabled {

    opacity: 0.55;

    cursor: not-allowed;

  }

  .bib-detalle-preview-empty {

    min-height: 520px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    padding: 40px;

    text-align: center;

    background: var(--app-surface-raised, #ffffff);

    border: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));

    border-radius: 20px;

  }

  .bib-detalle-preview-empty > span {

    width: 72px;

    height: 72px;

    display: grid;

    place-items: center;

    margin-bottom: 16px;

    color: var(--app-accent-700, #d86827);

    background: var(--app-accent-50, #fff5ec);

    border-radius: 20px;

  }

  .bib-detalle-preview-empty h2 {

    margin: 0;

    font-size: 18px;

    font-weight: 900;

  }

  .bib-detalle-preview-empty p {

    max-width: 500px;

    margin: 8px 0 18px;

    color: var(--app-text-soft, #64748b);

    font-size: 12px;

    line-height: 1.6;

  }

  .bib-detalle-preview-empty > div {

    display: flex;

    flex-wrap: wrap;

    justify-content: center;

    gap: 8px;

  }

  .bib-detalle-preview-empty button {

    min-height: 40px;

    display: inline-flex;

    align-items: center;

    gap: 7px;

    padding: 0 15px;

    color: #ffffff;

    background: var(--app-accent, #f18b4b);

    border: 0;

    border-radius: 11px;

    font: inherit;

    font-size: 11px;

    font-weight: 800;

    cursor: pointer;

  }

  .bib-detalle-preview-empty button.secondary {

    color: var(--app-accent-700, #d86827);

    background: var(--app-accent-50, #fff5ec);

    border: 1px solid var(--app-border, rgba(241, 139, 75, 0.2));

  }

  .bib-detalle-section-title {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 14px;

    margin-bottom: 14px;

  }

  .bib-detalle-section-title > div:first-child {

    min-width: 0;

    display: flex;

    align-items: center;

    gap: 11px;

  }

  .bib-detalle-section-icon,

  .bib-detalle-ficha__title > span,

  .bib-detalle-small-title > span {

    width: 38px;

    height: 38px;

    display: grid;

    place-items: center;

    flex-shrink: 0;

    color: var(--app-accent-700, #d86827);

    background: var(--app-accent-50, #fff5ec);

    border-radius: 11px;

  }

  .bib-detalle-section-title h2,

  .bib-detalle-ficha__title h2,

  .bib-detalle-small-title h2 {

    margin: 0;

    color: var(--app-text, #0f172a);

    font-size: 14px;

    font-weight: 900;

  }

  .bib-detalle-section-title p,

  .bib-detalle-ficha__title p,

  .bib-detalle-small-title p {

    margin: 3px 0 0;

    color: var(--app-text-soft, #64748b);

    font-size: 10.5px;

    line-height: 1.4;

  }

  .bib-detalle-count {

    min-width: 29px;

    height: 29px;

    display: grid;

    place-items: center;

    padding: 0 8px;

    color: var(--app-accent-700, #d86827);

    background: var(--app-accent-50, #fff5ec);

    border-radius: 999px;

    font-size: 10px;

    font-weight: 900;

  }

  .bib-detalle-composicion {

    display: flex;

    flex-wrap: wrap;

    gap: 6px;

    margin: -2px 0 12px 49px;

  }

  .bib-detalle-composicion span {

    padding: 4px 8px;

    color: var(--app-text-soft, #64748b);

    background: var(--app-surface-disabled, #f8fafc);

    border-radius: 999px;

    font-size: 9.5px;

    font-weight: 750;

  }

  .bib-detalle-lista {

    border-top: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));

  }

  .bib-detalle-archivo {

    display: grid;

    grid-template-columns: 42px minmax(0, 1fr) auto;

    align-items: center;

    gap: 11px;

    padding: 13px 2px;

    border-bottom: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));

  }

  .bib-detalle-archivo:last-child {

    border-bottom: 0;

    padding-bottom: 1px;

  }

  .bib-detalle-archivo__icon {

    width: 40px;

    height: 40px;

    display: grid;

    place-items: center;

    color: var(--category-color);

    background: var(--category-soft);

    border-radius: 11px;

  }

  .bib-detalle-archivo__info {

    min-width: 0;

  }

  .bib-detalle-archivo__info strong,

  .bib-detalle-archivo__info small {

    display: block;

  }

  .bib-detalle-archivo__info strong {

    overflow: hidden;

    color: var(--app-text, #0f172a);

    font-size: 11.5px;

    font-weight: 800;

    text-overflow: ellipsis;

    white-space: nowrap;

  }

  .bib-detalle-archivo__info small {

    margin-top: 4px;

    overflow: hidden;

    color: var(--app-text-soft, #64748b);

    font-size: 9.5px;

    text-overflow: ellipsis;

    white-space: nowrap;

  }

  .bib-detalle-archivo__acciones {

    display: flex;

    align-items: center;

    gap: 6px;

  }

  .bib-detalle-archivo__acciones button,

  .bib-detalle-archivo__acciones a {

    min-height: 34px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 5px;

    padding: 0 11px;

    color: var(--app-accent-700, #d86827);

    background: var(--app-accent-50, #fff5ec);

    border: 1px solid var(--app-border, rgba(241, 139, 75, 0.2));

    border-radius: 9px;

    font: inherit;

    font-size: 9.5px;

    font-weight: 800;

    text-decoration: none;

    cursor: pointer;

  }

  .bib-detalle-archivo__acciones .icon {

    width: 34px;

    padding: 0;

  }

  .bib-detalle-sin-contenido {

    display: flex;

    align-items: center;

    gap: 10px;

    padding: 16px;

    color: var(--app-text-soft, #64748b);

    background: var(--app-surface-disabled, #f8fafc);

    border-radius: 12px;

  }

  .bib-detalle-sin-contenido p {

    margin: 0;

    font-size: 11px;

  }

  .bib-detalle-finalidad {

    margin: 0;

    white-space: pre-wrap;

    color: var(--app-text-secondary, #475569);

    font-size: 12px;

    line-height: 1.7;

  }

  .bib-detalle-ficha__title,

  .bib-detalle-small-title {

    display: flex;

    align-items: center;

    gap: 10px;

    margin-bottom: 15px;

  }

  .bib-detalle-ficha__categoria {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 10px;

    padding: 10px 11px;

    margin-bottom: 4px;

    background: var(--category-soft);

    border-radius: 11px;

  }

  .bib-detalle-ficha__categoria span {

    color: var(--app-text-soft, #64748b);

    font-size: 9.5px;

    font-weight: 700;

  }

  .bib-detalle-ficha__categoria strong {

    color: var(--category-color);

    font-size: 10px;

    font-weight: 900;

  }

  .bib-detalle-ficha dl {

    margin: 0;

  }

  .bib-detalle-ficha dl > div {

    display: grid;

    grid-template-columns: minmax(100px, 0.8fr) minmax(0, 1.2fr);

    gap: 10px;

    padding: 10px 2px;

    border-bottom: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));

  }

  .bib-detalle-ficha dt {

    color: var(--app-text-soft, #64748b);

    font-size: 9.5px;

    font-weight: 700;

  }

  .bib-detalle-ficha dd {

    margin: 0;

    overflow-wrap: anywhere;

    color: var(--app-text-secondary, #475569);

    font-size: 9.5px;

    font-weight: 750;

    text-align: right;

  }

  .bib-detalle-vigencia {

    display: flex;

    align-items: flex-start;

    gap: 9px;

    padding: 11px;

    margin-top: 12px;

    color: #087854;

    background: #ecfdf5;

    border: 1px solid #d1fae5;

    border-radius: 11px;

  }

  .bib-detalle-vigencia > svg {

    flex-shrink: 0;

  }

  .bib-detalle-vigencia strong,

  .bib-detalle-vigencia small {

    display: block;

  }

  .bib-detalle-vigencia strong {

    font-size: 10px;

  }

  .bib-detalle-vigencia small {

    margin-top: 2px;

    color: #3c7865;

    font-size: 8.5px;

  }

  .bib-detalle-vigencia p {

    margin: 6px 0 0;

    color: #3c7865;

    font-size: 9px;

    line-height: 1.45;

  }

  .bib-detalle-tags {

    margin-top: 14px;

  }

  .bib-detalle-tags__title {

    display: flex;

    align-items: center;

    gap: 5px;

    margin-bottom: 8px;

    color: var(--app-text-soft, #64748b);

    font-size: 9.5px;

    font-weight: 800;

  }

  .bib-detalle-tags > div {

    display: flex;

    flex-wrap: wrap;

    gap: 5px;

  }

  .bib-detalle-tags > div > span {

    padding: 5px 8px;

    color: var(--app-text-secondary, #475569);

    background: var(--app-surface-disabled, #f8fafc);

    border-radius: 999px;

    font-size: 8.5px;

    font-weight: 700;

  }

  .bib-detalle-coleccion label,

  .bib-detalle-reportar label {

    display: grid;

    gap: 6px;

    color: var(--app-text-secondary, #475569);

    font-size: 9.5px;

    font-weight: 800;

  }

  .bib-detalle-coleccion select,

  .bib-detalle-reportar textarea {

    width: 100%;

    border: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));

    outline: 0;

    background: #ffffff;

    color: var(--app-text, #0f172a);

    border-radius: 10px;

    font: inherit;

  }

  .bib-detalle-coleccion select {

    height: 40px;

    padding: 0 10px;

  }

  .bib-detalle-reportar textarea {

    min-height: 100px;

    padding: 10px;

    resize: vertical;

  }

  .bib-detalle-coleccion > button,

  .bib-detalle-reportar > button,

  .bib-detalle-reportar form button {

    width: 100%;

    min-height: 39px;

    display: flex;

    align-items: center;

    justify-content: center;

    gap: 6px;

    margin-top: 9px;

    border: 0;

    border-radius: 10px;

    font: inherit;

    font-size: 9.5px;

    font-weight: 800;

    cursor: pointer;

  }

  .bib-detalle-coleccion > button,

  .bib-detalle-reportar form button {

    color: #ffffff;

    background: var(--app-accent, #f18b4b);

  }

  .bib-detalle-reportar > button.report {

    color: var(--app-text-secondary, #475569);

    background: var(--app-surface-disabled, #f8fafc);

    border: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));

  }

  .bib-detalle-coleccion > a {

    display: block;

    padding: 10px;

    color: var(--app-accent-700, #d86827);

    background: var(--app-accent-50, #fff5ec);

    border-radius: 10px;

    font-size: 10px;

    font-weight: 800;

    text-align: center;

    text-decoration: none;

  }

  .bib-detalle-reportar form {

    display: grid;

    gap: 8px;

    margin-top: 10px;

  }

  .bib-detalle-relacionados {

    display: grid;

    gap: 7px;

  }

  .bib-detalle-relacionados a {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 12px;

    padding: 11px 12px;

    color: var(--app-text, #0f172a);

    background: var(--app-surface-disabled, #f8fafc);

    border-radius: 11px;

    text-decoration: none;

  }

  .bib-detalle-relacionados a:hover {

    background: var(--app-accent-50, #fff5ec);

  }

  .bib-detalle-relacionados strong,

  .bib-detalle-relacionados small {

    display: block;

  }

  .bib-detalle-relacionados strong {

    font-size: 10.5px;

  }

  .bib-detalle-relacionados small {

    margin-top: 3px;

    color: var(--app-text-soft, #64748b);

    font-size: 9px;

  }

  .bib-detalle-relacionados svg {

    flex-shrink: 0;

    color: var(--app-accent-700, #d86827);

  }

  .bib-detalle-estado {

    min-height: 260px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    gap: 9px;

    padding: 30px;

    color: var(--app-text-secondary, #475569);

    background: var(--app-surface-raised, #ffffff);

    border: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));

    border-radius: 18px;

    text-align: center;

  }

  .bib-detalle-estado h3,

  .bib-detalle-estado p {

    margin: 0;

  }

  .bib-detalle-estado h3 {

    color: var(--app-text, #0f172a);

    font-size: 16px;

  }

  .bib-detalle-estado p {

    font-size: 12px;

  }

  .bib-detalle-estado a {

    margin-top: 5px;

    color: var(--app-accent-700, #d86827);

    font-size: 11px;

    font-weight: 800;

  }

  .bib-detalle-loader {

    width: 28px;

    height: 28px;

    border: 3px solid var(--app-accent-100, #ffe9d6);

    border-top-color: var(--app-accent, #f18b4b);

    border-radius: 50%;

    animation: bibDetalleSpin 0.7s linear infinite;

  }

  @keyframes bibDetalleSpin {

    to {

      transform: rotate(360deg);

    }

  }

  @media (max-width: 1050px) {

    .bib-detalle-layout {

      grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.8fr);

    }

  }

  @media (max-width: 850px) {

    .bib-detalle-layout {

      grid-template-columns: 1fr;

    }

    .bib-detalle-sidebar {

      grid-template-columns: repeat(2, minmax(0, 1fr));

    }

    .bib-detalle-actions-card,

    .bib-detalle-ficha {

      grid-column: 1 / -1;

    }

  }

  @media (max-width: 620px) {

    .bib-detalle-hero {
      align-items: flex-start;
      flex-direction: column;
      gap: 12px;
      padding: 17px 18px;
    }

    .bib-detalle-hero__main {
      align-items: flex-start;
      gap: 11px;
    }

    .bib-detalle-hero__icon {
      width: 44px;
      height: 44px;
      flex-basis: 44px;
      border-radius: 12px;
    }

    .bib-detalle-hero__side {
      width: 100%;
      justify-items: start;
    }

    .bib-detalle-hero__labels {
      justify-content: flex-start;
    }

    .bib-detalle-sidebar {

      grid-template-columns: 1fr;

    }

    .bib-detalle-actions-card,

    .bib-detalle-ficha {

      grid-column: auto;

    }

    .bib-detalle-archivo {

      grid-template-columns: 40px minmax(0, 1fr);

    }

    .bib-detalle-archivo__acciones {

      grid-column: 1 / -1;

      padding-left: 51px;

    }

    .bib-detalle-preview-empty {

      min-height: 400px;

      padding: 25px 18px;

    }

  }

  @media (max-width: 430px) {

    .bib-detalle-actions-card {

      grid-template-columns: 1fr;

    }

    .bib-detalle-actions-card .edit {

      grid-column: auto;

    }

    .bib-detalle-ficha dl > div {

      grid-template-columns: 1fr;

      gap: 4px;

    }

    .bib-detalle-ficha dd {

      text-align: left;

    }

  }

`;
