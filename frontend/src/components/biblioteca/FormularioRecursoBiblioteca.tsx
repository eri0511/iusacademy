import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  FileText,
  History,
  Link2,
  Plus,
  Save,
  Upload,
} from "lucide-react";
import { mensajeError, useBiblioteca } from "../../contexts/BibliotecaContext";
import { fecha, nombre } from "../../utils/biblioteca/biblioteca.utils";
import { categorias, vigencias } from "../../types/biblioteca/biblioteca.types";
import type {
  Catalogo,
  Contenido,
  Ficha,
  Historial,
  Recurso,
  Version,
} from "../../types/biblioteca/biblioteca.types";
const vacia: Ficha = {
  titulo: "",
  descripcion: "",
  finalidad: "",
  categoria: "MEMORIAL",
  tema: "",
  etiquetas: [],
  autorInstitucion: "",
  fuente: "",
  fechaDocumento: "",
  numeroNorma: "",
  tribunal: "",
  numeroResolucion: "",
  vigencia: "NO_APLICA",
  observacionVigencia: "",
  destacado: false,
};
export default function FormularioRecursoBiblioteca({
  integrado = false,
  onOcupadoChange,
  onCancelar,
}: {
  integrado?: boolean;
  onCancelar?: () => void;
  onOcupadoChange?: (ocupado: boolean) => void;
} = {}) {
  const { id } = useParams();
  const [pestana, setPestana] = useState<"informacion" | "documentos">(
    "informacion",
  );
  const dosPestanas = integrado && !id;
  const { api, base, avisar } = useBiblioteca();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState<Ficha>(vacia);
  const [recurso, setRecurso] = useState<Recurso | null>(null);
  const [etiquetas, setEtiquetas] = useState("");
  const [cargando, setCargando] = useState(!!id);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [publicarAlCrear, setPublicarAlCrear] = useState(true);
  useEffect(() => {
    onOcupadoChange?.(ocupado);
  }, [ocupado, onOcupadoChange]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tituloArchivo, setTituloArchivo] = useState("");
  const [motivoVersion, setMotivoVersion] = useState("");
  const [versionar, setVersionar] = useState<Contenido | null>(null);
  const [archivoKey, setArchivoKey] = useState(0);
  const [tituloEnlace, setTituloEnlace] = useState("");
  const [urlEnlace, setUrlEnlace] = useState("");
  const [editarEnlace, setEditarEnlace] = useState<number | null>(null);
  const [versiones, setVersiones] = useState<Version[]>([]);
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [candidatos, setCandidatos] = useState<Recurso[]>([]);
  const [relacionados, setRelacionados] = useState<
    Pick<Recurso, "id" | "titulo" | "categoria" | "tema">[]
  >([]);
  const cargar = useCallback(
    async (inicial = false) => {
      if (!id) return;
      const r = await api.get<Recurso>(`/recursos/${id}`);
      setRecurso(r);
      if (inicial) {
        const datos = { ...vacia };
        for (const k of Object.keys(vacia) as (keyof Ficha)[])
          Object.assign(datos, { [k]: r[k] ?? vacia[k] });
        datos.fechaDocumento = r.fechaDocumento?.slice(0, 10) ?? "";
        setFicha(datos);
        setEtiquetas(r.etiquetas.join(", "));
        setRelacionados(r.relacionados ?? []);
      }
    },
    [api, id],
  );
  useEffect(() => {
    if (id) {
      setCargando(true);
      setError("");
      cargar(true)
        .catch((e) => setError(mensajeError(e)))
        .finally(() => setCargando(false));
    } else {
      setFicha(vacia);
      setRecurso(null);
      setEtiquetas("");
    }
  }, [cargar, id]);
  async function accion(fn: () => Promise<unknown>, mensaje: string) {
    setOcupado(true);
    try {
      await fn();
      await cargar();
      avisar(mensaje);
    } catch (e) {
      avisar(mensajeError(e), true);
    } finally {
      setOcupado(false);
    }
  }
  async function guardar(e: FormEvent) {
    e.preventDefault();
    const formulario = e.currentTarget as HTMLFormElement;
    if (!formulario.checkValidity()) {
      const invalido = formulario.querySelector<HTMLElement>(
        "input:invalid, select:invalid, textarea:invalid",
      );
      if (dosPestanas)
        setPestana(
          invalido?.closest("#bib-form-documentos")
            ? "documentos"
            : "informacion",
        );
      invalido?.closest("details")?.setAttribute("open", "");
      requestAnimationFrame(() => formulario.reportValidity());
      return;
    }
    if (dosPestanas && pestana === "informacion") {
      setPestana("documentos");
      return;
    }
    if (!id && publicarAlCrear && !archivo && !urlEnlace.trim()) {
      avisar(
        "Adjunta un archivo o agrega un enlace para publicar el recurso",
        true,
      );
      return;
    }
    if (
      !id &&
      archivo &&
      (archivo.size > 20 * 1024 * 1024 || !/\.(pdf|docx?)$/i.test(archivo.name))
    ) {
      avisar("Selecciona un PDF o Word de hasta 20 MB", true);
      return;
    }
    if (!id && urlEnlace.trim() && !/^https?:\/\//i.test(urlEnlace.trim())) {
      avisar("El enlace debe comenzar con http:// o https://", true);
      return;
    }
    setOcupado(true);
    let creado: number | null = null;
    try {
      const body = {
        ...ficha,
        etiquetas: [
          ...new Set(
            etiquetas
              .split(",")
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean),
          ),
        ],
        fechaDocumento: ficha.fechaDocumento || undefined,
      };
      const r = await api.send<Recurso>(
        id ? `/recursos/${id}` : "/recursos",
        id ? "PATCH" : "POST",
        body,
      );
      if (id) {
        avisar("Ficha actualizada");
        await cargar();
      } else {
        creado = r.id;
        if (archivo) {
          const form = new FormData();
          form.set("archivo", archivo);
          form.set("titulo", tituloArchivo.trim() || archivo.name);
          await api.send(`/recursos/${r.id}/archivos`, "POST", form);
        }
        if (urlEnlace.trim()) {
          await api.send(`/recursos/${r.id}/enlaces`, "POST", {
            titulo: tituloEnlace.trim() || ficha.titulo.trim(),
            url: urlEnlace.trim(),
          });
        }
        if (publicarAlCrear)
          await api.send(`/recursos/${r.id}/estado`, "PATCH", {
            estado: "PUBLICADO",
          });
        avisar(
          publicarAlCrear ? "Recurso creado y publicado" : "Borrador guardado",
        );
        navigate(
          publicarAlCrear
            ? `${base}/recursos/${r.id}`
            : `${base}/recursos/${r.id}/editar`,
          { replace: true },
        );
      }
    } catch (err) {
      avisar(
        creado
          ? `La ficha quedó guardada como borrador. Completa los archivos o la publicación desde esta pantalla. ${mensajeError(err)}`
          : mensajeError(err),
        true,
      );
      if (creado)
        navigate(`${base}/recursos/${creado}/editar`, { replace: true });
    } finally {
      setOcupado(false);
    }
  }
  function campo<K extends keyof Ficha>(clave: K, valor: Ficha[K]) {
    setFicha((x) => ({ ...x, [clave]: valor }));
  }
  async function subir(e: FormEvent) {
    e.preventDefault();
    if (!archivo || !id) return;
    if (archivo.size > 20 * 1024 * 1024) {
      avisar("El archivo debe pesar como máximo 20 MB", true);
      return;
    }
    const form = new FormData();
    form.set("archivo", archivo);
    form.set("titulo", tituloArchivo.trim());
    if (motivoVersion.trim())
      form.set("motivoActualizacion", motivoVersion.trim());
    await accion(async () => {
      await api.send(
        versionar
          ? `/recursos/${id}/contenidos/${versionar.id}/versiones`
          : `/recursos/${id}/archivos`,
        "POST",
        form,
      );
      setArchivo(null);
      setArchivoKey((x) => x + 1);
      setTituloArchivo("");
      setMotivoVersion("");
      setVersionar(null);
      setVersiones([]);
    }, "Documento guardado");
  }
  async function descargar(v: Version) {
    setOcupado(true);
    try {
      const blob = await api.archivo(v.id, false);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = v.nombreOriginal;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      avisar(mensajeError(e), true);
    } finally {
      setOcupado(false);
    }
  }
  if (cargando)
    return (
      <div className="bib-empty" role="status">
        Cargando ficha…
      </div>
    );
  if (error)
    return (
      <div className="bib-empty" role="alert">
        <p>{error}</p>
        <Link to={`${base}/gestion`}>Volver a gestión</Link>
      </div>
    );
  return (
    <>
      {!integrado && (
        <Link className="bib-back" to={`${base}/gestion`}>
          <ArrowLeft size={17} />
          Volver a gestión
        </Link>
      )}
      {!integrado && (
        <div className="bib-section-heading">
          <div>
            <span className="bib-eyebrow">GESTIÓN DOCUMENTAL</span>
            <h2>{id ? "Editar recurso jurídico" : "Nuevo recurso jurídico"}</h2>
            <p>
              {id
                ? "Actualiza su ficha, archivos y fuentes."
                : "Completa la información, adjunta un documento o enlace y crea tu recurso."}
            </p>
          </div>
          {recurso && <span className="bib-badge">{recurso.estado}</span>}
        </div>
      )}
      <form
        className="bib-panel bib-stack bib-resource-form"
        onSubmit={guardar}
        noValidate
      >
        <fieldset className="bib-form-content" disabled={ocupado}>
          {dosPestanas && (
            <div
              className="bib-create-tabs"
              role="tablist"
              aria-label="Crear recurso"
            >
              {(["informacion", "documentos"] as const).map((key, index) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`bib-tab-${key}`}
                  aria-selected={pestana === key}
                  aria-controls={
                    key === "informacion"
                      ? "bib-info-panel"
                      : "bib-form-documentos"
                  }
                  tabIndex={pestana === key ? 0 : -1}
                  onClick={() => setPestana(key)}
                  onKeyDown={(e) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                    ) {
                      e.preventDefault();
                      const siguiente =
                        e.key === "Home"
                          ? "informacion"
                          : e.key === "End"
                            ? "documentos"
                            : key === "informacion"
                              ? "documentos"
                              : "informacion";
                      setPestana(siguiente);
                      document.getElementById(`bib-tab-${siguiente}`)?.focus();
                    }
                  }}
                >
                  <span>{index + 1}</span>
                  {index === 0
                    ? "Información del recurso"
                    : "Documentos y enlaces"}
                </button>
              ))}
            </div>
          )}
          <div
            id="bib-info-panel"
            role={dosPestanas ? "tabpanel" : undefined}
            aria-labelledby={dosPestanas ? "bib-tab-informacion" : undefined}
            hidden={dosPestanas && pestana !== "informacion"}
            className="bib-info-panel"
          >
            <nav
              className="bib-form-sections"
              aria-label="Secciones del formulario"
            >
              {[
                ["informacion", "Información"],
                ["referencias", "Referencias"],
                ...(!id ? [["documentos", "Documentos"]] : []),
              ].map(([key, label], index) => (
                <button
                  type="button"
                  key={key}
                  onClick={() =>
                    document
                      .getElementById(`bib-form-${key}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <span>{index + 1}</span>
                  {label}
                </button>
              ))}
            </nav>
            <section className="bib-form-section" id="bib-form-informacion">
              <div className="bib-form-section-title">
                <span>
                  <FileText size={19} />
                </span>
                <div>
                  <h3>Configuración del recurso</h3>
                  <p>
                    Completa la información, categoría y finalidad del recurso.
                  </p>
                </div>
              </div>
              <label className="bib-field">
                Título *
                <input
                  required
                  minLength={3}
                  maxLength={200}
                  value={ficha.titulo}
                  onChange={(e) => campo("titulo", e.target.value)}
                  placeholder="Por ejemplo: Contrato de arrendamiento de inmueble"
                />
              </label>
              <div className="bib-form-grid">
                <label className="bib-field">
                  Categoría *
                  <select
                    value={ficha.categoria}
                    onChange={(e) =>
                      campo("categoria", e.target.value as Ficha["categoria"])
                    }
                  >
                    {Object.entries(categorias).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="bib-field">
                  Tema jurídico *
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    value={ficha.tema}
                    onChange={(e) => campo("tema", e.target.value)}
                    placeholder="Arrendamiento, obligaciones, propiedad…"
                  />
                </label>
              </div>
              <label className="bib-field">
                Descripción *
                <textarea
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={3}
                  value={ficha.descripcion}
                  onChange={(e) => campo("descripcion", e.target.value)}
                />
              </label>
            </section>
            <details
              className="bib-form-section bib-reference-details"
              id="bib-form-referencias"
              open={id ? true : undefined}
            >
              <summary>Datos adicionales del recurso (opcional)</summary>
              <div className="bib-form-section-title">
                <span>
                  <Link2 size={19} />
                </span>
                <div>
                  <h3>Referencias y orientación</h3>
                  <p>
                    Agrega la fuente y los datos que ayudan a comprender el
                    recurso.
                  </p>
                </div>
              </div>
              <label className="bib-field">
                Finalidad y orientación de uso
                <textarea
                  maxLength={3000}
                  rows={3}
                  value={ficha.finalidad}
                  onChange={(e) => campo("finalidad", e.target.value)}
                  placeholder="Explica para qué sirve y qué aspectos debe revisar el estudiante."
                />
              </label>
              <div className="bib-form-grid">
                <label className="bib-field">
                  Autor o institución
                  <input
                    maxLength={250}
                    value={ficha.autorInstitucion}
                    onChange={(e) => campo("autorInstitucion", e.target.value)}
                  />
                </label>
                <label className="bib-field">
                  Fuente
                  <input
                    maxLength={1000}
                    value={ficha.fuente}
                    onChange={(e) => campo("fuente", e.target.value)}
                  />
                </label>
                <label className="bib-field">
                  Fecha del documento
                  <input
                    type="date"
                    value={ficha.fechaDocumento}
                    onChange={(e) => campo("fechaDocumento", e.target.value)}
                  />
                </label>
                <label className="bib-field">
                  Etiquetas separadas por comas
                  <input
                    value={etiquetas}
                    onChange={(e) => setEtiquetas(e.target.value)}
                    placeholder="civil, arrendamiento, inmueble"
                  />
                </label>
              </div>
              {["LEY", "CODIGO", "JURISPRUDENCIA", "SENTENCIA"].includes(
                ficha.categoria,
              ) && (
                <fieldset className="bib-fieldset">
                  <legend>Datos jurídicos específicos</legend>
                  <div className="bib-form-grid">
                    <label className="bib-field">
                      Número de norma
                      <input
                        maxLength={100}
                        value={ficha.numeroNorma}
                        onChange={(e) => campo("numeroNorma", e.target.value)}
                      />
                    </label>
                    <label className="bib-field">
                      Tribunal
                      <input
                        maxLength={250}
                        value={ficha.tribunal}
                        onChange={(e) => campo("tribunal", e.target.value)}
                      />
                    </label>
                    <label className="bib-field">
                      Número de resolución
                      <input
                        maxLength={100}
                        value={ficha.numeroResolucion}
                        onChange={(e) =>
                          campo("numeroResolucion", e.target.value)
                        }
                      />
                    </label>
                    <label className="bib-field">
                      Estado de vigencia
                      <select
                        value={ficha.vigencia}
                        onChange={(e) =>
                          campo("vigencia", e.target.value as Ficha["vigencia"])
                        }
                      >
                        {Object.entries(vigencias).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="bib-field">
                    Observación sobre la vigencia
                    <textarea
                      maxLength={2000}
                      value={ficha.observacionVigencia}
                      onChange={(e) =>
                        campo("observacionVigencia", e.target.value)
                      }
                    />
                  </label>
                </fieldset>
              )}
              <label className="bib-checkbox">
                <input
                  type="checkbox"
                  checked={ficha.destacado}
                  onChange={(e) => campo("destacado", e.target.checked)}
                />
                Destacar en el catálogo
              </label>
            </details>
          </div>
          {!id && (
            <fieldset
              className="bib-create-attachments bib-form-section"
              id="bib-form-documentos"
              role={dosPestanas ? "tabpanel" : undefined}
              aria-labelledby={dosPestanas ? "bib-tab-documentos" : undefined}
              hidden={dosPestanas && pestana !== "documentos"}
              disabled={ocupado}
            >
              <legend className="bib-visually-hidden">
                Documento y fuente de consulta
              </legend>
              <div className="bib-form-section-title">
                <span>
                  <Upload size={19} />
                </span>
                <div>
                  <h3>Documentos y enlaces</h3>
                  <p>
                    Adjunta el material que podrán consultar los estudiantes.
                  </p>
                </div>
              </div>
              <p>
                Agrega un archivo, un enlace o ambos. PDF y Word de hasta 20 MB.
              </p>
              <div className="bib-form-grid">
                <div className="bib-material-column">
                  <div className="bib-material-header">
                    <div className="bib-material-heading">
                      <span className="bib-material-icon">
                        <Upload size={20} />
                      </span>
                      <div>
                        <strong>Archivos</strong>
                        <small>PDF o Word · hasta 20 MB.</small>
                      </div>
                    </div>
                    <label className="bib-add-material">
                      <Plus size={15} /> {archivo ? "Cambiar" : "Agregar"}
                      <input
                        className="bib-visually-hidden"
                        aria-label="Archivo del recurso"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) =>
                          setArchivo(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  </div>
                  <div
                    className={
                      archivo ? "bib-material-preview" : "bib-material-empty"
                    }
                  >
                    <FileText size={28} />
                    <strong>
                      {archivo ? archivo.name : "Agrega el documento jurídico"}
                    </strong>
                    <span>
                      {archivo
                        ? `${(archivo.size / 1024 / 1024).toFixed(2)} MB · Listo para guardar`
                        : "Selecciona un memorial, contrato, demanda u otro documento."}
                    </span>
                  </div>
                  <label className="bib-field">
                    Título del archivo (opcional)
                    <input
                      maxLength={200}
                      value={tituloArchivo}
                      onChange={(e) => setTituloArchivo(e.target.value)}
                      placeholder="Se usará el nombre del archivo"
                    />
                  </label>
                </div>
                <div className="bib-material-column">
                  <div className="bib-material-header">
                    <div className="bib-material-heading">
                      <span className="bib-material-icon">
                        <Link2 size={20} />
                      </span>
                      <div>
                        <strong>Enlaces</strong>
                        <small>Fuentes y documentos de consulta.</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="bib-add-material"
                      onClick={(e) =>
                        e.currentTarget
                          .closest(".bib-material-column")
                          ?.querySelector<HTMLInputElement>('input[type="url"]')
                          ?.focus()
                      }
                    >
                      <Plus size={15} /> Agregar
                    </button>
                  </div>
                  <div className="bib-material-empty bib-link-intro">
                    <Link2 size={28} />
                    <strong>Conecta una fuente de consulta</strong>
                    <span>
                      Pega el enlace al documento o a su publicación oficial.
                    </span>
                  </div>
                  <label className="bib-field">
                    Enlace de consulta (opcional)
                    <input
                      type="url"
                      maxLength={2000}
                      value={urlEnlace}
                      onChange={(e) => setUrlEnlace(e.target.value)}
                      placeholder="https://…"
                    />
                  </label>
                  <label className="bib-field">
                    Título del enlace (opcional)
                    <input
                      maxLength={200}
                      value={tituloEnlace}
                      onChange={(e) => setTituloEnlace(e.target.value)}
                      placeholder="Se usará el título del recurso"
                    />
                  </label>
                </div>
              </div>
              <label className="bib-checkbox">
                <input
                  type="checkbox"
                  checked={publicarAlCrear}
                  onChange={(e) => setPublicarAlCrear(e.target.checked)}
                />
                Publicar al crear para estudiantes y docentes
              </label>
              <small>
                Desmarca esta opción si deseas guardarlo como borrador.
              </small>
            </fieldset>
          )}
          <div className="bib-actions bib-form-footer">
            <span className="bib-form-footer-hint">
              {id
                ? "Guarda tus cambios antes de salir."
                : publicarAlCrear
                  ? "El recurso será visible para estudiantes y docentes."
                  : "El borrador quedará disponible en Gestión."}
            </span>
            {onCancelar && (
              <button type="button" disabled={ocupado} onClick={onCancelar}>
                Cancelar
              </button>
            )}
            {dosPestanas && pestana === "documentos" && (
              <button
                type="button"
                disabled={ocupado}
                onClick={() => setPestana("informacion")}
              >
                Anterior
              </button>
            )}
            {dosPestanas && pestana === "informacion" ? (
              <button
                className="primary"
                type="button"
                disabled={ocupado}
                onClick={(e) => {
                  const controles = e.currentTarget.form?.querySelectorAll<
                    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                  >(
                    "#bib-info-panel input, #bib-info-panel select, #bib-info-panel textarea",
                  );
                  const invalido = Array.from(controles ?? []).find(
                    (c) => !c.checkValidity(),
                  );
                  if (invalido) {
                    invalido.closest("details")?.setAttribute("open", "");
                    invalido.reportValidity();
                    return;
                  }
                  setPestana("documentos");
                }}
              >
                Siguiente: documentos
              </button>
            ) : (
              <button className="primary" disabled={ocupado} type="submit">
                <Save size={17} />
                {ocupado
                  ? "Guardando…"
                  : id
                    ? "Guardar ficha"
                    : publicarAlCrear
                      ? "Crear recurso"
                      : "Guardar borrador"}
              </button>
            )}
            {id && (
              <Link className="bib-button" to={`${base}/recursos/${id}`}>
                Ver recurso
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </fieldset>
      </form>
      <style>{formStyles}</style>
      {recurso && (
        <>
          <section className="bib-panel">
            <h3>Archivos y enlaces</h3>
            {recurso.contenidos.map((c) => (
              <div className="bib-file" key={c.id}>
                <FileText size={21} />
                <div>
                  <strong>{c.titulo}</strong>
                  <small>
                    {c.tipo === "ENLACE"
                      ? c.urlExterna
                      : `${c.versiones[0]?.nombreOriginal ?? "Sin archivo"} · v${c.versiones[0]?.numeroVersion ?? "—"}`}
                  </small>
                </div>
                <div className="bib-actions">
                  {c.tipo === "ARCHIVO" ? (
                    <>
                      <button
                        disabled={ocupado}
                        onClick={() => {
                          setVersionar(c);
                          setTituloArchivo(c.titulo);
                          setMotivoVersion("");
                          document
                            .getElementById("bib-upload")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                        }}
                      >
                        Nueva versión
                      </button>
                      <button
                        disabled={ocupado}
                        onClick={async () => {
                          setOcupado(true);
                          try {
                            setVersiones(
                              await api.get<Version[]>(
                                `/recursos/${id}/contenidos/${c.id}/versiones`,
                              ),
                            );
                          } catch (e) {
                            avisar(mensajeError(e), true);
                          } finally {
                            setOcupado(false);
                          }
                        }}
                      >
                        <History size={16} />
                        Versiones
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={ocupado}
                      onClick={() => {
                        setEditarEnlace(c.id);
                        setTituloEnlace(c.titulo);
                        setUrlEnlace(c.urlExterna ?? "");
                      }}
                    >
                      Editar enlace
                    </button>
                  )}
                  <button
                    className="bib-danger"
                    disabled={ocupado}
                    onClick={() => {
                      if (
                        window.confirm(
                          "¿Quitar este contenido del recurso? Sus versiones se conservarán.",
                        )
                      )
                        void accion(
                          () =>
                            api.send(
                              `/recursos/${id}/contenidos/${c.id}`,
                              "DELETE",
                            ),
                          "Contenido archivado",
                        );
                    }}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
            {versiones.length > 0 && (
              <div className="bib-versiones">
                <div className="bib-section-heading">
                  <h4>Historial de versiones</h4>
                  <button onClick={() => setVersiones([])}>Cerrar</button>
                </div>
                {versiones.map((v) => (
                  <div className="bib-related" key={v.id}>
                    <span>
                      <strong>
                        Versión {v.numeroVersion} · {v.nombreOriginal}
                      </strong>
                      <small>
                        {fecha(v.creadoEn)} ·{" "}
                        {v.motivoActualizacion ?? "Carga inicial"}
                      </small>
                    </span>
                    <button
                      disabled={ocupado}
                      onClick={() => void descargar(v)}
                    >
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <div className="bib-form-grid">
            <form
              className="bib-panel bib-stack"
              id="bib-upload"
              onSubmit={subir}
            >
              <h3>
                <Upload size={20} />
                {versionar
                  ? `Nueva versión: ${versionar.titulo}`
                  : "Agregar documento"}
              </h3>
              <p>
                PDF o Word · máximo 20 MB. Puedes agregar ambos formatos a la
                misma ficha.
              </p>
              <label className="bib-field">
                Título del contenido *
                <input
                  required
                  minLength={2}
                  maxLength={200}
                  value={tituloArchivo}
                  onChange={(e) => setTituloArchivo(e.target.value)}
                />
              </label>
              <label className="bib-upload">
                <Upload size={25} />
                <strong>{archivo?.name ?? "Seleccionar archivo"}</strong>
                <input
                  key={archivoKey}
                  aria-label="Seleccionar documento PDF o Word"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  required
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setArchivo(f);
                    if (f && !tituloArchivo)
                      setTituloArchivo(f.name.replace(/\.[^.]+$/, ""));
                  }}
                />
              </label>
              {versionar && (
                <label className="bib-field">
                  Motivo de actualización *
                  <textarea
                    required
                    maxLength={1000}
                    value={motivoVersion}
                    onChange={(e) => setMotivoVersion(e.target.value)}
                  />
                </label>
              )}
              <div className="bib-actions">
                <button
                  type="submit"
                  className="primary"
                  disabled={ocupado || !archivo}
                >
                  <Upload size={17} />
                  Subir documento
                </button>
                {versionar && (
                  <button
                    type="button"
                    onClick={() => {
                      setVersionar(null);
                      setTituloArchivo("");
                    }}
                  >
                    Cancelar versión
                  </button>
                )}
              </div>
            </form>
            <form
              className="bib-panel bib-stack"
              onSubmit={(e) => {
                e.preventDefault();
                void accion(async () => {
                  await api.send(
                    editarEnlace
                      ? `/recursos/${id}/enlaces/${editarEnlace}`
                      : `/recursos/${id}/enlaces`,
                    editarEnlace ? "PATCH" : "POST",
                    { titulo: tituloEnlace.trim(), url: urlEnlace.trim() },
                  );
                  setEditarEnlace(null);
                  setTituloEnlace("");
                  setUrlEnlace("");
                }, "Enlace guardado");
              }}
            >
              <h3>
                <Link2 size={20} />
                {editarEnlace
                  ? "Editar fuente externa"
                  : "Agregar fuente externa"}
              </h3>
              <p>Enlaza el documento con su fuente de consulta.</p>
              <label className="bib-field">
                Título del enlace *
                <input
                  required
                  minLength={2}
                  maxLength={200}
                  value={tituloEnlace}
                  onChange={(e) => setTituloEnlace(e.target.value)}
                />
              </label>
              <label className="bib-field">
                URL *
                <input
                  required
                  type="url"
                  maxLength={2000}
                  placeholder="https://…"
                  value={urlEnlace}
                  onChange={(e) => setUrlEnlace(e.target.value)}
                />
              </label>
              <div className="bib-actions">
                <button type="submit" disabled={ocupado}>
                  <Plus size={17} />
                  Guardar enlace
                </button>
                {editarEnlace && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditarEnlace(null);
                      setTituloEnlace("");
                      setUrlEnlace("");
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
          <section className="bib-panel">
            <h3>Documentos relacionados</h3>
            <p>
              Vincula modelos, normas y fuentes que complementen este recurso.
            </p>
            <form
              className="bib-inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                setOcupado(true);
                try {
                  const d = await api.get<Catalogo>(
                    `/recursos?q=${encodeURIComponent(busqueda)}&limite=20`,
                  );
                  setCandidatos(d.recursos.filter((r) => r.id !== Number(id)));
                } catch (err) {
                  avisar(mensajeError(err), true);
                } finally {
                  setOcupado(false);
                }
              }}
            >
              <input
                aria-label="Buscar documentos relacionados"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en documentos publicados"
              />
              <button disabled={ocupado}>Buscar</button>
            </form>
            {candidatos.map((r) => (
              <label className="bib-checkbox" key={r.id}>
                <input
                  type="checkbox"
                  checked={relacionados.some((x) => x.id === r.id)}
                  onChange={(e) =>
                    setRelacionados(
                      e.target.checked
                        ? [...relacionados.filter((x) => x.id !== r.id), r]
                        : relacionados.filter((x) => x.id !== r.id),
                    )
                  }
                />
                {r.titulo}
              </label>
            ))}
            <div className="bib-tags">
              {relacionados.map((r) => (
                <button
                  key={r.id}
                  onClick={() =>
                    setRelacionados(relacionados.filter((x) => x.id !== r.id))
                  }
                >
                  {r.titulo} ×
                </button>
              ))}
            </div>
            <button
              disabled={ocupado}
              onClick={() =>
                void accion(
                  () =>
                    api.send(`/recursos/${id}/relacionados`, "PUT", {
                      ids: relacionados.map((r) => r.id),
                    }),
                  "Relaciones guardadas",
                )
              }
            >
              <Check size={17} />
              Guardar relaciones
            </button>
          </section>
          <section className="bib-panel">
            <div className="bib-section-heading">
              <div>
                <h3>Publicación</h3>
                <p>
                  Guarda los cambios de la ficha antes de cambiar su estado.
                </p>
              </div>
              <span className="bib-badge">{recurso.estado}</span>
            </div>
            <div className="bib-actions">
              {recurso.estado !== "PUBLICADO" && (
                <button
                  className="primary"
                  disabled={ocupado || !recurso.contenidos.length}
                  onClick={() =>
                    void accion(
                      () =>
                        api.send(`/recursos/${id}/estado`, "PATCH", {
                          estado: "PUBLICADO",
                        }),
                      "Recurso publicado",
                    )
                  }
                >
                  <Check size={17} />
                  Publicar recurso
                </button>
              )}
              {recurso.estado !== "BORRADOR" && (
                <button
                  disabled={ocupado}
                  onClick={() => {
                    if (
                      window.confirm(
                        "¿Pasar a borrador? Dejará de estar visible para los lectores.",
                      )
                    )
                      void accion(
                        () =>
                          api.send(`/recursos/${id}/estado`, "PATCH", {
                            estado: "BORRADOR",
                          }),
                        "Recurso en borrador",
                      );
                  }}
                >
                  Pasar a borrador
                </button>
              )}
              {recurso.estado !== "ARCHIVADO" && (
                <button
                  className="bib-danger"
                  disabled={ocupado}
                  onClick={() => {
                    if (
                      window.confirm(
                        "¿Archivar este recurso? Se conservarán su ficha y archivos.",
                      )
                    )
                      void accion(
                        () => api.send(`/recursos/${id}`, "DELETE"),
                        "Recurso archivado",
                      );
                  }}
                >
                  Archivar
                </button>
              )}
            </div>
          </section>
          <section className="bib-panel">
            <div className="bib-section-heading">
              <h3>
                <History size={20} />
                Historial del recurso
              </h3>
              <button
                disabled={ocupado}
                onClick={async () => {
                  setOcupado(true);
                  try {
                    setHistorial(
                      await api.get<Historial[]>(
                        `/recursos/${id}/historial?pagina=1`,
                      ),
                    );
                    setPaginaHistorial(1);
                  } catch (e) {
                    avisar(mensajeError(e), true);
                  } finally {
                    setOcupado(false);
                  }
                }}
              >
                Consultar historial
              </button>
            </div>
            {historial.map((h) => (
              <div className="bib-history" key={h.id}>
                <span>
                  <strong>{h.accion.replaceAll("_", " ").toLowerCase()}</strong>
                  <small>
                    {nombre(h.actor)} · {fecha(h.creadoEn)}
                  </small>
                </span>
                {h.datos != null && (
                  <details>
                    <summary>Ver cambios</summary>
                    <pre>{JSON.stringify(h.datos, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
            {historial.length >= paginaHistorial * 30 && (
              <button
                disabled={ocupado}
                onClick={async () => {
                  setOcupado(true);
                  try {
                    const h = await api.get<Historial[]>(
                      `/recursos/${id}/historial?pagina=${paginaHistorial + 1}`,
                    );
                    setHistorial([...historial, ...h]);
                    setPaginaHistorial((x) => x + 1);
                  } catch (e) {
                    avisar(mensajeError(e), true);
                  } finally {
                    setOcupado(false);
                  }
                }}
              >
                Cargar más
              </button>
            )}
          </section>
        </>
      )}
    </>
  );
}

const formStyles = `
.bib-resource-form {background:var(--app-surface-raised);border:1px solid var(--app-input-border);border-radius:18px;padding:24px;box-shadow:var(--app-shadow-sm);}
.bib-form-content {border:0;padding:0;margin:0;min-width:0;display:flex;flex-direction:column;gap:18px;}
.bib-create-attachments {border:1px solid var(--app-border-strong);border-radius:16px;padding:20px;margin:0;min-width:0;background:var(--app-surface-raised);}
.bib-create-attachments legend {font-size:15px;font-weight:750;padding:0 8px;}
.bib-create-attachments p {font-size:12px;margin:0 0 16px;}
.bib-create-attachments small {color:var(--bib-muted);font-size:11px;overflow-wrap:anywhere;}
.bib-create-attachments .bib-checkbox {margin-top:18px;}
.bib-create-attachments input[type=file] {background:var(--app-surface-alt);border:1px dashed var(--app-border-strong);padding:14px;border-radius:12px;width:100%;}
html[data-theme='oscuro'] .bib-resource-form,html[data-theme='oscuro'] .bib-create-attachments {background:var(--app-surface);border-color:var(--app-border);}
@media(max-width:700px) {.bib-resource-form {padding:17px;}.bib-create-attachments {padding:15px;}}

.bib-resource-form {padding:0;overflow:hidden;border-radius:20px;}
.bib-form-content {gap:0;}
.bib-form-sections {display:flex;gap:24px;align-items:center;padding:12px 24px;background:var(--app-surface-alt);border-bottom:1px solid var(--app-border-soft);flex-wrap:wrap;}
.bib-form-sections button {padding:0;border:0;background:transparent;border-radius:0;font-size:11px;color:var(--bib-accent);gap:8px;}
.bib-form-sections button:hover:not(:disabled) {border:0;background:transparent;}
.bib-form-sections button span {display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--app-accent-soft);border:1px solid var(--app-border-strong);font-size:10px;}
.bib-form-section {display:flex;flex-direction:column;gap:14px;padding:24px;border:0;border-bottom:1px solid var(--app-border-soft);border-radius:0;scroll-margin-top:20px;min-width:0;}
.bib-form-section-title {display:grid;grid-template-columns:36px 1fr;align-items:center;gap:10px;margin-bottom:4px;}
.bib-form-section-title>span {width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--app-border-strong);border-radius:12px;color:var(--app-accent-dark);background:var(--app-accent-soft);}
.bib-form-section-title h3 {margin:0;font-size:16px;line-height:1.2;letter-spacing:-.02em;}
.bib-form-section-title p {margin:4px 0 0;font-size:11px;}
.bib-resource-form .bib-field {gap:5px;font-size:11px;font-weight:750;letter-spacing:.035em;}
.bib-resource-form .bib-field input,.bib-resource-form .bib-field select,.bib-resource-form .bib-field textarea {font-size:12px;font-weight:400;letter-spacing:0;border-radius:10px;border:1px solid var(--app-border-strong);background:var(--bib-paper);padding:10px 12px;min-height:40px;}
.bib-resource-form .bib-form-grid {gap:14px;}
.bib-create-attachments {margin:0;}
.bib-create-attachments>p {margin:0;font-size:11px;}
.bib-create-attachments input[type=file] {border-style:dashed;min-height:60px;background:var(--app-accent-softer);}
.bib-create-attachments input::file-selector-button {padding:8px 12px;border:1px solid var(--app-border-strong);border-radius:8px;background:var(--app-surface-raised);color:var(--app-accent-dark);font:inherit;margin-right:12px;cursor:pointer;}
.bib-form-footer {padding:18px 24px;margin:0;background:var(--app-surface-alt);justify-content:flex-end;flex-wrap:wrap;}
.bib-form-footer-hint {margin-right:auto;font-size:11px;max-width:360px;color:var(--bib-muted);}
.bib-visually-hidden {position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}
@media(max-width:700px) {.bib-resource-form {padding:0;}.bib-form-section {padding:18px;}.bib-form-sections {padding:12px 18px;gap:16px;}.bib-form-footer {padding:16px 18px;}.bib-form-footer-hint {width:100%;max-width:none;margin-bottom:5px;}}

.bib-info-panel {display:flex;flex-direction:column;gap:22px;min-width:0;}
.bib-info-panel[hidden],.bib-create-attachments[hidden] {display:none!important;}
.bib-create-tabs {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding-bottom:18px;border-bottom:1px solid var(--app-border-soft);}
.bib .bib-create-tabs button {justify-content:flex-start;padding:11px 14px;border:1px solid var(--app-border);border-radius:12px;background:var(--app-surface-raised);color:var(--app-text-soft);font-size:12px;}
.bib-create-tabs button>span {display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--app-surface-alt);border:1px solid var(--app-border-strong);font-size:10px;flex-shrink:0;}
.bib .bib-create-tabs button[aria-selected=true] {color:var(--app-accent-dark);background:var(--app-accent-soft);border-color:var(--app-accent);}
.bib-create-tabs button[aria-selected=true]>span {background:var(--app-accent);color:#fff;border-color:var(--app-accent);}
@media(max-width:700px) {.bib-create-tabs {gap:8px;}.bib .bib-create-tabs button {font-size:10px;padding:10px 8px;gap:6px;}}
`;
