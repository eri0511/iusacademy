import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Download, FileText, Search, ArrowUpRight } from "lucide-react";
import { useBiblioteca } from "../../contexts/BibliotecaContext";
import type { ActividadBiblioteca } from "../../utils/biblioteca/actividadBiblioteca";
import { categorias } from "../../types/biblioteca/biblioteca.types";

export default function BibliotecaActividad({
  tipo,
}: {
  tipo: "consulta" | "descarga";
}) {
  const { api, base } = useBiblioteca();
  const [busqueda, setBusqueda] = useState("");

  const [registros, setRegistros] = useState<
    (ActividadBiblioteca & { registroId: number })[]
  >([]);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPagina(1);
  }, [tipo]);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError("");
    api
      .get<{
        items: (ActividadBiblioteca & { registroId: number })[];
        paginas: number;
      }>(
        `/${tipo === "descarga" ? "mis-descargas" : "mis-consultas"}?pagina=${pagina}&limite=50`,
        controller.signal,
      )
      .then((datos) => {
        setRegistros(datos.items);
        setPaginas(datos.paginas);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "No se pudo cargar el registro",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [api, tipo, pagina]);

  const resultados = registros.filter((r) =>
    `${r.titulo} ${r.archivo ?? ""} ${categorias[r.categoria] ?? ""}`
      .toLocaleLowerCase("es")
      .includes(busqueda.toLocaleLowerCase("es")),
  );

  return (
    <section className="bib-activity-page">
      <label className="bib-search">
        <Search size={20} />
        <input
          aria-label={
            tipo === "descarga"
              ? "Buscar en mis descargas"
              : "Buscar en mi historial"
          }
          placeholder={
            tipo === "descarga"
              ? "Buscar en mis descargas…"
              : "Buscar en mi historial…"
          }
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </label>

      <div className="bib-section-heading">
        <h2>
          {tipo === "descarga"
            ? "Documentos descargados"
            : "Consultas recientes"}
        </h2>
        <span>{resultados.length} documentos</span>
      </div>

      {error && <p role="alert">{error}</p>}
      {cargando ? (
        <p role="status">Cargando registros…</p>
      ) : error ? null : resultados.length ? (
        <div className="bib-table-wrap">
          <table className="bib-activity-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Categoría</th>
                <th>
                  {tipo === "descarga"
                    ? "Fecha de descarga"
                    : "Fecha de consulta"}
                </th>
                {tipo === "descarga" && <th>Archivo</th>}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.registroId}>
                  <td>
                    <div className="bib-table-doc">
                      <FileText size={20} />
                      <strong>{r.titulo}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="bib-badge">
                      {categorias[r.categoria] ?? "Recurso jurídico"}
                    </span>
                  </td>
                  <td>
                    {new Intl.DateTimeFormat("es-BO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(r.fecha))}
                  </td>
                  {tipo === "descarga" && <td>{r.archivo}</td>}
                  <td>
                    <Link
                      className="bib-button"
                      to={`${base}/recursos/${r.id}`}
                    >
                      {tipo === "descarga" ? "Abrir recurso" : "Ver nuevamente"}
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bib-empty">
          {tipo === "descarga" ? <Download size={32} /> : <Clock size={32} />}
          <h3>
            {busqueda
              ? "No encontramos coincidencias"
              : tipo === "descarga"
                ? "Tus descargas aparecerán aquí"
                : "Tu historial comienza con una consulta"}
          </h3>
          <p>
            {busqueda
              ? "Prueba con otro título o categoría."
              : "Explora la biblioteca y abre un documento para empezar."}
          </p>
          <Link className="bib-button" to={`${base}?vista=todos`}>
            Explorar recursos
          </Link>
        </div>
      )}

      {paginas > 1 && (
        <div className="bib-actions">
          <button
            className="bib-button"
            disabled={pagina <= 1 || cargando}
            onClick={() => setPagina((p) => p - 1)}
          >
            Anterior
          </button>
          <span>
            Página {pagina} de {paginas}
          </span>
          <button
            className="bib-button"
            disabled={pagina >= paginas || cargando}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
      <p>
        Registro personal guardado en tu cuenta. La búsqueda se aplica a la
        página actual.
      </p>
    </section>
  );
}
