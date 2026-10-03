import ReporteItem from "../../components/biblioteca/ReporteItem";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  History,
  Plus,
  Search,
  ShieldCheck,
  Users,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { mensajeError, useBiblioteca } from "../../contexts/BibliotecaContext";
import { fecha, nombre } from "../../utils/biblioteca/biblioteca.utils";
import type {
  Catalogo,
  Estado,
  Historial,
  Permiso,
  Persona,
  Reporte,
} from "../../types/biblioteca/biblioteca.types";
import { categorias } from "../../types/biblioteca/biblioteca.types";

export default function BibliotecaGestion() {
  const { api, base, capacidades, avisar } = useBiblioteca();
  const [tab, setTab] = useState("recursos");
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [estado, setEstado] = useState<Estado>("PUBLICADO");
  const [q, setQ] = useState("");
  const [buscar, setBuscar] = useState("");
  const [pagina, setPagina] = useState(1);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [docentes, setDocentes] = useState<Persona[]>([]);
  const [docenteId, setDocenteId] = useState("");
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      if (tab === "recursos")
        setCatalogo(
          await api.get<Catalogo>(
            `/recursos?estado=${estado}&pagina=${pagina}&q=${encodeURIComponent(buscar)}`,
          ),
        );
      else if (tab === "permisos") {
        const [p, d] = await Promise.all([
          api.get<Permiso[]>("/permisos"),
          api.get<Persona[]>("/docentes"),
        ]);
        setPermisos(p);
        setDocentes(d);
      } else if (tab === "reportes")
        setReportes(await api.get<Reporte[]>(`/reportes?pagina=${pagina}`));
      else
        setHistorial(await api.get<Historial[]>(`/historial?pagina=${pagina}`));
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [api, tab, estado, pagina, buscar]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

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

  function cambiarTab(t: string) {
    setTab(t);
    setPagina(1);
  }

  return (
    <>
      <div className="bib-page-heading">
        <div>
          <span className="bib-eyebrow">GESTIÓN DE LA BIBLIOTECA</span>
          <h2>Contenido que acompaña el aprendizaje</h2>
          <p>
            Organiza documentos, revisa reportes y mantén actualizadas sus
            fuentes.
          </p>
        </div>
        <Link className="bib-button primary" to={`${base}/nuevo`}>
          <Plus size={17} />
          Nuevo recurso
        </Link>
      </div>

      <div
        className="bib-subtabs"
        role="group"
        aria-label="Opciones de gestión"
      >
        {[
          ["recursos", "Recursos"],
          ["reportes", "Reportes"],
          ...(capacidades.puedeDelegar
            ? [
                ["permisos", "Permisos docentes"],
                ["historial", "Historial general"],
              ]
            : []),
        ].map(([k, v]) => (
          <button
            className={tab === k ? "selected" : ""}
            key={k}
            onClick={() => cambiarTab(k)}
          >
            {v}
          </button>
        ))}
      </div>

      {tab === "recursos" && (
        <div className="bib-panel">
          <div className="bib-subtabs">
            {(["PUBLICADO", "BORRADOR", "ARCHIVADO"] as const).map((e) => (
              <button
                key={e}
                className={estado === e ? "selected" : ""}
                onClick={() => {
                  setEstado(e);
                  setPagina(1);
                }}
              >
                {e === "PUBLICADO"
                  ? "Publicados"
                  : e === "BORRADOR"
                    ? "Borradores"
                    : "Archivados"}
              </button>
            ))}
          </div>
          <form
            className="bib-search"
            onSubmit={(e) => {
              e.preventDefault();
              setBuscar(q);
              setPagina(1);
            }}
          >
            <Search size={20} />
            <input
              aria-label="Buscar recursos para gestionar"
              placeholder="Buscar por título, tema o autor"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button>Buscar</button>
          </form>
        </div>
      )}

      {error && (
        <div className="bib-empty" role="alert">
          <p>{error}</p>
          <button onClick={() => void cargar()}>Reintentar</button>
        </div>
      )}

      {cargando ? (
        <div className="bib-empty" role="status">
          Cargando gestión…
        </div>
      ) : (
        !error && (
          <>
            {tab === "recursos" && (
              <section className="bib-panel">
                <div className="bib-management-grid">
                  {catalogo?.recursos.map((r) => (
                    <article className="bib-management-card" key={r.id}>
                      <div className="bib-management-top">
                        <span className="bib-tile-icon">
                          <FileText size={23} />
                        </span>
                        <span className="bib-badge">
                          {estado === "PUBLICADO"
                            ? "Publicado"
                            : estado === "BORRADOR"
                              ? "Borrador"
                              : "Archivado"}
                        </span>
                      </div>
                      <span className="bib-eyebrow">
                        {categorias[r.categoria]}
                      </span>
                      <h3>
                        <Link to={`${base}/recursos/${r.id}`}>{r.titulo}</Link>
                      </h3>
                      <p>{r.tema}</p>
                      <small>Actualizado: {fecha(r.actualizadoEn)}</small>
                      <footer>
                        <Link
                          className="bib-button"
                          to={`${base}/recursos/${r.id}`}
                        >
                          Ver recurso <ArrowUpRight size={15} />
                        </Link>
                        <Link
                          className="bib-button primary"
                          to={`${base}/recursos/${r.id}/editar`}
                        >
                          Gestionar
                        </Link>
                      </footer>
                    </article>
                  ))}
                </div>
                {!catalogo?.recursos.length && (
                  <div className="bib-empty">
                    <p>No hay recursos en este estado.</p>
                  </div>
                )}
                {catalogo && catalogo.paginas > 1 && (
                  <div className="bib-pagination">
                    <button
                      disabled={pagina === 1}
                      onClick={() => setPagina((x) => x - 1)}
                    >
                      Anterior
                    </button>
                    <span>
                      {pagina} / {catalogo.paginas}
                    </span>
                    <button
                      disabled={pagina >= catalogo.paginas}
                      onClick={() => setPagina((x) => x + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </section>
            )}
            {tab === "permisos" && (
              <>
                <section className="bib-panel bib-stack">
                  <h3>
                    <ShieldCheck size={21} />
                    Delegar gestión de biblioteca
                  </h3>
                  <p>
                    El docente podrá crear, actualizar, publicar y archivar
                    recursos. Solo tú podrás conceder o retirar este permiso.
                  </p>
                  <form
                    className="bib-inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void accion(
                        () => api.send(`/permisos/${docenteId}`, "PUT"),
                        "Permiso de gestión otorgado",
                      );
                    }}
                  >
                    <select
                      required
                      aria-label="Docente al que se otorgará permiso"
                      value={docenteId}
                      onChange={(e) => setDocenteId(e.target.value)}
                    >
                      <option value="">Selecciona un docente</option>
                      {docentes
                        .filter(
                          (d) =>
                            !permisos.some(
                              (p) => p.docenteId === d.id && p.estaActivo,
                            ),
                        )
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {nombre(d)} · {d.correo}
                          </option>
                        ))}
                    </select>
                    <button
                      className="bib-button primary"
                      type="submit"
                      disabled={ocupado || !docenteId}
                    >
                      <Check size={17} />
                      Otorgar permiso
                    </button>
                  </form>
                </section>
                <section className="bib-panel">
                  <h3>
                    <Users size={21} />
                    Permisos registrados
                  </h3>
                  {!permisos.length && (
                    <p>Todavía no has delegado la gestión.</p>
                  )}
                  {permisos.map((p) => (
                    <div className="bib-related" key={p.id}>
                      <span>
                        <strong>{nombre(p.docente)}</strong>
                        <small>
                          {p.docente.correo} ·{" "}
                          {p.estaActivo
                            ? "Gestión habilitada"
                            : "Permiso retirado"}
                        </small>
                      </span>
                      {p.estaActivo ? (
                        <button
                          className="bib-button bib-danger"
                          disabled={ocupado}
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Retirar el permiso de gestión a ${nombre(p.docente)}?`,
                              )
                            )
                              void accion(
                                () =>
                                  api.send(
                                    `/permisos/${p.docenteId}`,
                                    "DELETE",
                                  ),
                                "Permiso retirado",
                              );
                          }}
                        >
                          Retirar permiso
                        </button>
                      ) : (
                        <span className="bib-badge">Revocado</span>
                      )}
                    </div>
                  ))}
                </section>
              </>
            )}
            {tab === "reportes" && (
              <>
                {!reportes.length && (
                  <div className="bib-empty">
                    <Check size={30} />
                    <p>No hay reportes en esta página.</p>
                  </div>
                )}
                {reportes.map((r) => (
                  <ReporteItem
                    key={r.id}
                    reporte={r}
                    ocupado={ocupado}
                    atender={(estadoReporte, respuesta) =>
                      accion(
                        () =>
                          api.send(`/reportes/${r.id}`, "PATCH", {
                            estado: estadoReporte,
                            respuesta,
                          }),
                        "Reporte actualizado",
                      )
                    }
                  />
                ))}
                <div className="bib-pagination">
                  <button
                    disabled={pagina === 1 || ocupado}
                    onClick={() => setPagina((x) => x - 1)}
                  >
                    Anterior
                  </button>
                  <span>Página {pagina}</span>
                  <button
                    disabled={reportes.length < 30 || ocupado}
                    onClick={() => setPagina((x) => x + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
            {tab === "historial" && (
              <section className="bib-panel">
                <h3>
                  <History size={21} />
                  Historial general
                </h3>
                {historial.map((h) => (
                  <div className="bib-history" key={h.id}>
                    <span>
                      <strong>
                        {h.accion.replaceAll("_", " ").toLowerCase()}
                      </strong>
                      <small>
                        {nombre(h.actor)} · {fecha(h.creadoEn)}
                      </small>
                    </span>
                    {h.datos != null && (
                      <details>
                        <summary>Ver registro</summary>
                        <pre>{JSON.stringify(h.datos, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))}
                {!historial.length && <p>No hay registros en esta página.</p>}
                <div className="bib-pagination">
                  <button
                    disabled={pagina === 1}
                    onClick={() => setPagina((x) => x - 1)}
                  >
                    Anterior
                  </button>
                  <span>Página {pagina}</span>
                  <button
                    disabled={historial.length < 30}
                    onClick={() => setPagina((x) => x + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </section>
            )}
          </>
        )
      )}
    </>
  );
}
