import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Download,
  Eye,
  FileText,
  RotateCcw,
  Search,
} from "lucide-react";
import { useBiblioteca } from "../../contexts/BibliotecaContext";
import type { ActividadBiblioteca } from "../../utils/biblioteca/actividadBiblioteca";
import { categorias } from "../../types/biblioteca/biblioteca.types";

type RegistroActividad = ActividadBiblioteca & {
  registroId: number;
};

type RegistroMostrado = RegistroActividad & {
  cantidad: number;
};

type Orden = "recientes" | "antiguos" | "az" | "za";

type CategoriaKey = keyof typeof categorias;

function obtenerNombreCategoria(categoria: string) {
  if (categoria in categorias) {
    return categorias[categoria as CategoriaKey];
  }

  return "Recurso jurídico";
}

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function obtenerExtension(archivo?: string | null) {
  if (!archivo) return "—";

  const limpio = archivo.split("?")[0];
  const partes = limpio.split(".");

  if (partes.length < 2) return "Archivo";

  return partes.pop()?.toUpperCase() || "Archivo";
}

function formatearFecha(fecha: string) {
  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return {
      fecha: "Fecha no disponible",
      hora: "",
    };
  }

  return {
    fecha: new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(valor),
    hora: new Intl.DateTimeFormat("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(valor),
  };
}

function obtenerGrupoFecha(fecha: string) {
  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "Anteriores";
  }

  const ahora = new Date();

  const hoy = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
  ).getTime();

  const fechaRegistro = new Date(
    valor.getFullYear(),
    valor.getMonth(),
    valor.getDate(),
  ).getTime();

  const diferenciaDias = Math.floor(
    (hoy - fechaRegistro) / (1000 * 60 * 60 * 24),
  );

  if (diferenciaDias === 0) return "Hoy";
  if (diferenciaDias > 0 && diferenciaDias <= 7) return "Esta semana";

  return "Anteriores";
}

export default function BibliotecaActividad({
  tipo,
}: {
  tipo: "consulta" | "descarga";
}) {
  const { api, base } = useBiblioteca();

  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("TODAS");
  const [formatoSeleccionado, setFormatoSeleccionado] = useState("TODOS");
  const [anioSeleccionado, setAnioSeleccionado] = useState("TODOS");
  const [orden, setOrden] = useState<Orden>("recientes");

  const [registros, setRegistros] = useState<RegistroActividad[]>([]);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPagina(1);
    setBusqueda("");
    setCategoriaSeleccionada("TODAS");
    setFormatoSeleccionado("TODOS");
    setAnioSeleccionado("TODOS");
    setOrden("recientes");
  }, [tipo]);

  useEffect(() => {
    const controller = new AbortController();

    setCargando(true);
    setError("");

    api
      .get<{
        items: RegistroActividad[];
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
        if (!controller.signal.aborted) {
          setError(
            e instanceof Error
              ? e.message
              : "No se pudo cargar el registro",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      });

    return () => controller.abort();
  }, [api, tipo, pagina]);

  /*
   * Agrupa todos los eventos por recurso.
   *
   * Ejemplo:
   * - 6 descargas del mismo recurso = 1 fila con "6 descargas".
   * - 5 consultas del mismo recurso = 1 fila con "5 visitas".
   *
   * La fecha que se conserva es siempre la actividad más reciente.
   */
  const registrosMostrados = useMemo<RegistroMostrado[]>(() => {
    const mapa = new Map<number, RegistroMostrado>();

    registros.forEach((registro) => {
      const existente = mapa.get(registro.id);

      if (!existente) {
        mapa.set(registro.id, {
          ...registro,
          cantidad: 1,
        });
        return;
      }

      const fechaExistente = new Date(existente.fecha).getTime();
      const fechaActual = new Date(registro.fecha).getTime();
      const cantidadActualizada = existente.cantidad + 1;

      if (
        !Number.isNaN(fechaActual) &&
        (Number.isNaN(fechaExistente) || fechaActual > fechaExistente)
      ) {
        mapa.set(registro.id, {
          ...registro,
          cantidad: cantidadActualizada,
        });
        return;
      }

      mapa.set(registro.id, {
        ...existente,
        cantidad: cantidadActualizada,
      });
    });

    return Array.from(mapa.values());
  }, [registros]);

  const categoriasDisponibles = useMemo(() => {
    return registrosMostrados
      .map((registro) => registro.categoria)
      .filter(
        (categoria, index, arreglo) =>
          Boolean(categoria) && arreglo.indexOf(categoria) === index,
      );
  }, [registrosMostrados]);

  const formatosDisponibles = useMemo(() => {
    return registrosMostrados
      .map((registro) => obtenerExtension(registro.archivo))
      .filter(
        (formato, index, arreglo) =>
          formato !== "—" &&
          formato !== "Archivo" &&
          arreglo.indexOf(formato) === index,
      );
  }, [registrosMostrados]);

  const aniosDisponibles = useMemo(() => {
    return registrosMostrados
      .map((registro) => {
        const fecha = new Date(registro.fecha);

        if (Number.isNaN(fecha.getTime())) {
          return null;
        }

        return fecha.getFullYear();
      })
      .filter((anio): anio is number => anio !== null)
      .filter((anio, index, arreglo) => arreglo.indexOf(anio) === index)
      .sort((a, b) => b - a);
  }, [registrosMostrados]);

  const resultados = useMemo(() => {
    const textoBusqueda = normalizar(busqueda.trim());

    const filtrados = registrosMostrados.filter((registro) => {
      const nombreCategoria = obtenerNombreCategoria(registro.categoria);
      const extension = obtenerExtension(registro.archivo);
      const fecha = new Date(registro.fecha);

      const coincideBusqueda =
        !textoBusqueda ||
        normalizar(
          `${registro.titulo} ${registro.archivo ?? ""} ${nombreCategoria}`,
        ).includes(textoBusqueda);

      const coincideCategoria =
        categoriaSeleccionada === "TODAS" ||
        registro.categoria === categoriaSeleccionada;

      const coincideFormato =
        formatoSeleccionado === "TODOS" ||
        extension === formatoSeleccionado;

      const coincideAnio =
        anioSeleccionado === "TODOS" ||
        (!Number.isNaN(fecha.getTime()) &&
          String(fecha.getFullYear()) === anioSeleccionado);

      return (
        coincideBusqueda &&
        coincideCategoria &&
        coincideFormato &&
        coincideAnio
      );
    });

    return [...filtrados].sort((a, b) => {
      if (orden === "az") {
        return a.titulo.localeCompare(b.titulo, "es");
      }

      if (orden === "za") {
        return b.titulo.localeCompare(a.titulo, "es");
      }

      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();

      if (orden === "antiguos") {
        return fechaA - fechaB;
      }

      return fechaB - fechaA;
    });
  }, [
    registrosMostrados,
    busqueda,
    categoriaSeleccionada,
    formatoSeleccionado,
    anioSeleccionado,
    orden,
  ]);

  const totalPdf = useMemo(() => {
    return registrosMostrados.filter(
      (registro) => obtenerExtension(registro.archivo) === "PDF",
    ).length;
  }, [registrosMostrados]);

  const totalDocx = useMemo(() => {
    return registrosMostrados.filter((registro) => {
      const extension = obtenerExtension(registro.archivo);

      return extension === "DOCX" || extension === "DOC";
    }).length;
  }, [registrosMostrados]);

  /*
   * Esta estadística usa los eventos originales, no los agrupados.
   * Así:
   * - 1 recurso descargado 6 veces = 6 descargas este mes.
   * - 1 recurso consultado 5 veces = 5 consultas este mes.
   */
  const registrosEsteMes = useMemo(() => {
    const ahora = new Date();

    return registros.filter((registro) => {
      const fecha = new Date(registro.fecha);

      if (Number.isNaN(fecha.getTime())) {
        return false;
      }

      return (
        fecha.getMonth() === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      );
    }).length;
  }, [registros]);

  const grupos = useMemo(() => {
    const agrupados: Record<string, RegistroMostrado[]> = {
      Hoy: [],
      "Esta semana": [],
      Anteriores: [],
    };

    resultados.forEach((registro) => {
      agrupados[obtenerGrupoFecha(registro.fecha)].push(registro);
    });

    return agrupados;
  }, [resultados]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaSeleccionada("TODAS");
    setFormatoSeleccionado("TODOS");
    setAnioSeleccionado("TODOS");
    setOrden("recientes");
  };

  const hayFiltros =
    busqueda.trim() !== "" ||
    categoriaSeleccionada !== "TODAS" ||
    formatoSeleccionado !== "TODOS" ||
    anioSeleccionado !== "TODOS" ||
    orden !== "recientes";

  return (
    <>
      <section className="bib-actividad">
        <header className="bib-actividad__header">
          <div className="bib-actividad__titulo">
            <div className="bib-actividad__titulo-icono">
              {tipo === "descarga" ? (
                <Download size={29} />
              ) : (
                <Clock size={29} />
              )}
            </div>

            <div>
              <h1>
                {tipo === "descarga"
                  ? "Mis descargas"
                  : "Historial de visualización"}
              </h1>

              <p>
                {tipo === "descarga"
                  ? "Consulta y organiza los recursos que has descargado desde la biblioteca."
                  : "Revisa los recursos que has consultado recientemente."}
              </p>
            </div>
          </div>

          <label className="bib-actividad__buscador">
            <Search size={19} />

            <input
              aria-label={
                tipo === "descarga"
                  ? "Buscar en mis descargas"
                  : "Buscar en mi historial"
              }
              placeholder={
                tipo === "descarga"
                  ? "Buscar en mis descargas..."
                  : "Buscar en mi historial..."
              }
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>
        </header>

        <div className="bib-actividad__estadisticas">
          <article className="bib-actividad__stat">
            <div className="bib-actividad__stat-icono bib-actividad__stat-icono--naranja">
              {tipo === "descarga" ? (
                <Download size={23} />
              ) : (
                <Eye size={23} />
              )}
            </div>

            <div>
              <strong>{registrosMostrados.length}</strong>
              <span>
                {tipo === "descarga"
                  ? "Documentos descargados"
                  : "Recursos consultados"}
              </span>
            </div>
          </article>

          <article className="bib-actividad__stat">
            <div className="bib-actividad__stat-icono bib-actividad__stat-icono--azul">
              <CalendarDays size={23} />
            </div>

            <div>
              <strong>{registrosEsteMes}</strong>
              <span>
                {tipo === "descarga"
                  ? "Descargas este mes"
                  : "Consultas este mes"}
              </span>
            </div>
          </article>

          <article className="bib-actividad__stat">
            <div className="bib-actividad__stat-icono bib-actividad__stat-icono--rojo">
              <FileText size={23} />
            </div>

            <div>
              <strong>{totalPdf}</strong>
              <span>Archivos PDF</span>
            </div>
          </article>

          <article className="bib-actividad__stat">
            <div className="bib-actividad__stat-icono bib-actividad__stat-icono--azul">
              <FileText size={23} />
            </div>

            <div>
              <strong>{totalDocx}</strong>
              <span>Archivos DOCX</span>
            </div>
          </article>
        </div>

        <div className="bib-actividad__filtros">
          <select
            aria-label="Filtrar por categoría"
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          >
            <option value="TODAS">Todas las categorías</option>

            {categoriasDisponibles.map((categoria) => (
              <option key={categoria} value={categoria}>
                {obtenerNombreCategoria(categoria)}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por formato"
            value={formatoSeleccionado}
            onChange={(e) => setFormatoSeleccionado(e.target.value)}
          >
            <option value="TODOS">Todos los formatos</option>

            {formatosDisponibles.map((formato) => (
              <option key={formato} value={formato}>
                {formato}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por año"
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(e.target.value)}
          >
            <option value="TODOS">Todos los años</option>

            {aniosDisponibles.map((anio) => (
              <option key={anio} value={String(anio)}>
                {anio}
              </option>
            ))}
          </select>

          <select
            aria-label="Ordenar registros"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="az">Título A-Z</option>
            <option value="za">Título Z-A</option>
          </select>

          {hayFiltros && (
            <button
              type="button"
              className="bib-actividad__limpiar"
              onClick={limpiarFiltros}
            >
              <RotateCcw size={16} />
              Limpiar
            </button>
          )}
        </div>

        {error && (
          <div className="bib-actividad__estado bib-actividad__estado--error">
            <p role="alert">{error}</p>
          </div>
        )}

        {cargando ? (
          <div className="bib-actividad__estado">
            <div className="bib-actividad__estado-icono">
              {tipo === "descarga" ? (
                <Download size={27} />
              ) : (
                <Clock size={27} />
              )}
            </div>

            <p role="status">Cargando registros...</p>
          </div>
        ) : error ? null : resultados.length ? (
          <div className="bib-actividad__tabla-contenedor">
            <table className="bib-actividad__tabla">
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th>Categoría</th>

                  {tipo === "descarga" && <th>Formato</th>}

                  <th>
                    {tipo === "descarga"
                      ? "Última descarga"
                      : "Última visualización"}
                  </th>

                  <th>
                    {tipo === "descarga"
                      ? "Descargas"
                      : "Visualizaciones"}
                  </th>

                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {(["Hoy", "Esta semana", "Anteriores"] as const).map(
                  (grupo) => {
                    const items = grupos[grupo];

                    if (!items.length) {
                      return null;
                    }

                    return (
                      <GrupoActividad
                        key={grupo}
                        nombre={grupo}
                        registros={items}
                        tipo={tipo}
                        base={base}
                      />
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bib-actividad__vacio">
            <div className="bib-actividad__vacio-icono">
              {tipo === "descarga" ? (
                <Download size={32} />
              ) : (
                <Clock size={32} />
              )}
            </div>

            <h3>
              {hayFiltros
                ? "No encontramos coincidencias"
                : tipo === "descarga"
                  ? "Tus descargas aparecerán aquí"
                  : "Tu historial comienza con una consulta"}
            </h3>

            <p>
              {hayFiltros
                ? "Prueba cambiando o limpiando los filtros."
                : tipo === "descarga"
                  ? "Cuando descargues un recurso desde la biblioteca, aparecerá automáticamente en esta sección."
                  : "Cuando abras un recurso de la biblioteca, podrás encontrarlo nuevamente desde esta sección."}
            </p>

            {hayFiltros ? (
              <button
                type="button"
                className="bib-actividad__principal"
                onClick={limpiarFiltros}
              >
                <RotateCcw size={17} />
                Limpiar filtros
              </button>
            ) : (
              <Link
                className="bib-actividad__principal"
                to={`${base}?vista=todos`}
              >
                Explorar recursos
                <ArrowUpRight size={17} />
              </Link>
            )}
          </div>
        )}

        {paginas > 1 && (
          <div className="bib-actividad__paginacion">
            <button
              type="button"
              disabled={pagina <= 1 || cargando}
              onClick={() => setPagina((actual) => actual - 1)}
            >
              Anterior
            </button>

            <span>
              Página <strong>{pagina}</strong> de {paginas}
            </span>

            <button
              type="button"
              disabled={pagina >= paginas || cargando}
              onClick={() => setPagina((actual) => actual + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>

      <style>{ESTILOS}</style>
    </>
  );
}

function GrupoActividad({
  nombre,
  registros,
  tipo,
  base,
}: {
  nombre: string;
  registros: RegistroMostrado[];
  tipo: "consulta" | "descarga";
  base: string;
}) {
  const columnas = tipo === "descarga" ? 6 : 5;

  return (
    <>
      <tr className="bib-actividad__grupo">
        <td colSpan={columnas}>
          <strong>{nombre}</strong>
          <span>{registros.length}</span>
        </td>
      </tr>

      {registros.map((registro) => {
        const categoria = obtenerNombreCategoria(registro.categoria);
        const extension = obtenerExtension(registro.archivo);
        const fecha = formatearFecha(registro.fecha);

        return (
          <tr key={registro.id}>
            <td>
              <div className="bib-actividad__recurso">
                <div
                  className={`bib-actividad__archivo ${
                    extension === "PDF"
                      ? "bib-actividad__archivo--pdf"
                      : "bib-actividad__archivo--doc"
                  }`}
                >
                  <FileText size={21} />

                  {extension !== "—" && (
                    <small>
                      {extension === "Archivo" ? "DOC" : extension}
                    </small>
                  )}
                </div>

                <div className="bib-actividad__recurso-info">
                  <strong>{registro.titulo}</strong>

                  {registro.archivo && (
                    <span title={registro.archivo}>
                      {registro.archivo}
                    </span>
                  )}
                </div>
              </div>
            </td>

            <td>
              <span className="bib-actividad__categoria">
                {categoria}
              </span>
            </td>

            {tipo === "descarga" && (
              <td>
                <span className="bib-actividad__formato">
                  {extension}
                </span>
              </td>
            )}

            <td>
              <div className="bib-actividad__fecha">
                <CalendarDays size={16} />

                <div>
                  <strong>{fecha.fecha}</strong>
                  {fecha.hora && <span>{fecha.hora}</span>}
                </div>
              </div>
            </td>

            <td>
              <span className="bib-actividad__cantidad">
                {tipo === "descarga" ? (
                  <Download size={14} />
                ) : (
                  <Eye size={14} />
                )}

                {registro.cantidad}{" "}
                {tipo === "descarga"
                  ? registro.cantidad === 1
                    ? "descarga"
                    : "descargas"
                  : registro.cantidad === 1
                    ? "visita"
                    : "visitas"}
              </span>
            </td>

            <td>
              <div className="bib-actividad__acciones">
                <Link
                  className="bib-actividad__accion"
                  to={`${base}/recursos/${registro.id}`}
                >
                  <Eye size={16} />

                  {tipo === "descarga"
                    ? "Vista previa"
                    : "Ver nuevamente"}
                </Link>

                {tipo === "descarga" && (
                  <Link
                    className="bib-actividad__accion bib-actividad__accion--descarga"
                    to={`${base}/recursos/${registro.id}`}
                  >
                    <Download size={16} />
                    Descargar nuevamente
                  </Link>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

const ESTILOS = `
  .bib-actividad {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .bib-actividad__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 20px 22px;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border-soft);
    border-radius: 20px;
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.04);
  }

  .bib-actividad__titulo {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .bib-actividad__titulo-icono {
    width: 58px;
    height: 58px;
    flex: 0 0 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--app-accent);
    background: var(--app-accent-50);
    border: 1px solid var(--app-border);
    border-radius: 17px;
  }

  .bib-actividad__titulo h1 {
    margin: 0;
    color: var(--app-text);
    font-size: 27px;
    line-height: 1.15;
    font-weight: 800;
  }

  .bib-actividad__titulo p {
    margin: 6px 0 0;
    color: var(--app-text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }

  .bib-actividad__buscador {
    width: min(370px, 100%);
    height: 46px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 15px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    border: 1px solid var(--app-border-soft);
    border-radius: 13px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .bib-actividad__buscador:focus-within {
    border-color: var(--app-border-strong);
    box-shadow: 0 0 0 3px var(--app-accent-50);
  }

  .bib-actividad__buscador input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    color: var(--app-text);
    background: transparent;
    font: inherit;
    font-size: 13px;
  }

  .bib-actividad__buscador input::placeholder {
    color: var(--app-text-muted);
  }

  .bib-actividad__estadisticas {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .bib-actividad__stat {
    min-height: 82px;
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 14px 16px;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border-soft);
    border-radius: 16px;
    box-shadow: 0 7px 22px rgba(15, 23, 42, 0.03);
  }

  .bib-actividad__stat-icono {
    width: 47px;
    height: 47px;
    flex: 0 0 47px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 13px;
  }

  .bib-actividad__stat-icono--naranja {
    color: var(--app-accent);
    background: var(--app-accent-50);
  }

  .bib-actividad__stat-icono--azul {
    color: #2563eb;
    background: #eff6ff;
  }

  .bib-actividad__stat-icono--rojo {
    color: #ef4444;
    background: #fff1f2;
  }

  .bib-actividad__stat strong {
    display: block;
    margin-bottom: 4px;
    color: var(--app-text);
    font-size: 23px;
    line-height: 1;
    font-weight: 800;
  }

  .bib-actividad__stat span {
    color: var(--app-text-secondary);
    font-size: 11px;
    line-height: 1.35;
  }

  .bib-actividad__filtros {
    display: grid;
    grid-template-columns:
      minmax(165px, 1.15fr)
      minmax(140px, 0.9fr)
      minmax(130px, 0.8fr)
      minmax(150px, 0.95fr)
      auto;
    gap: 9px;
    align-items: center;
    padding: 11px 13px;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border-soft);
    border-radius: 15px;
  }

  .bib-actividad__filtros select {
    width: 100%;
    height: 41px;
    padding: 0 35px 0 12px;
    outline: none;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    border: 1px solid var(--app-border-soft);
    border-radius: 10px;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .bib-actividad__filtros select:focus {
    border-color: var(--app-border-strong);
    box-shadow: 0 0 0 3px var(--app-accent-50);
  }

  .bib-actividad__limpiar {
    height: 41px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 14px;
    color: var(--app-accent-700);
    background: var(--app-accent-50);
    border: 1px solid var(--app-border);
    border-radius: 10px;
    font: inherit;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .bib-actividad__limpiar:hover {
    background: var(--app-accent-100);
    border-color: var(--app-border-strong);
  }

  .bib-actividad__tabla-contenedor {
    width: 100%;
    overflow-x: auto;
    background: #fffdf9;
    border: 1px solid rgba(241, 139, 75, 0.22);
    border-radius: 17px;
    box-shadow: 0 8px 26px rgba(15, 23, 42, 0.035);
  }

  .bib-actividad__tabla {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;
    background: #fffdf9;
  }

  .bib-actividad__tabla th {
    padding: 13px 14px;
    color: #475569;
    background: #fff0df;
    border-bottom: 1px solid rgba(241, 139, 75, 0.28);
    text-align: left;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }

  .bib-actividad__tabla td {
    padding: 11px 14px;
    color: #475569;
    background: #fffdf9;
    border-bottom: 1px solid rgba(241, 139, 75, 0.14);
    vertical-align: middle;
    font-size: 11px;
    transition:
      background 0.18s ease,
      box-shadow 0.18s ease;
  }

  .bib-actividad__tabla tbody > tr:not(.bib-actividad__grupo):nth-of-type(even) td {
    background: #fffaf4;
  }

  .bib-actividad__tabla tbody > tr:not(.bib-actividad__grupo):hover td {
    background: #fff1e7;
  }

  .bib-actividad__tabla tbody > tr:not(.bib-actividad__grupo):hover td:first-child {
    box-shadow: inset 4px 0 0 #f18b4b;
  }

  .bib-actividad__tabla tbody > tr:last-child td {
    border-bottom: 0;
  }

  .bib-actividad__grupo td {
    padding: 8px 14px;
    color: #0f172a;
    background: #ffead8 !important;
    border-top: 1px solid rgba(241, 139, 75, 0.18);
    border-bottom: 1px solid rgba(241, 139, 75, 0.24);
  }

  .bib-actividad__grupo:hover td {
    background: #ffead8 !important;
  }

  .bib-actividad__grupo strong {
    font-size: 11px;
    font-weight: 800;
  }

  .bib-actividad__grupo span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    margin-left: 7px;
    padding: 0 6px;
    color: #d86827;
    background: #fffdf9;
    border: 1px solid rgba(241, 139, 75, 0.3);
    border-radius: 999px;
    font-size: 9px;
    font-weight: 800;
  }

  .bib-actividad__recurso {
    min-width: 245px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .bib-actividad__archivo {
    width: 43px;
    height: 47px;
    flex: 0 0 43px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    border-radius: 10px;
  }

  .bib-actividad__archivo--pdf {
    color: #ef4444;
    background: #fff1f2;
    border: 1px solid #fecdd3;
  }

  .bib-actividad__archivo--doc {
    color: #2563eb;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
  }

  .bib-actividad__archivo small {
    font-size: 7px;
    line-height: 1;
    font-weight: 900;
  }

  .bib-actividad__recurso-info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .bib-actividad__recurso-info strong {
    color: var(--app-text);
    font-size: 12px;
    line-height: 1.3;
  }

  .bib-actividad__recurso-info span {
    max-width: 270px;
    overflow: hidden;
    color: var(--app-text-soft);
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 9px;
  }

  .bib-actividad__categoria {
    display: inline-flex;
    align-items: center;
    min-height: 23px;
    padding: 3px 9px;
    color: #d86827;
    background: #fff5ec;
    border: 1px solid rgba(241, 139, 75, 0.28);
    border-radius: 999px;
    white-space: nowrap;
    font-size: 9px;
    font-weight: 800;
  }

  .bib-actividad__formato {
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 700;
  }

  .bib-actividad__fecha {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--app-accent);
    white-space: nowrap;
  }

  .bib-actividad__fecha > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .bib-actividad__fecha strong {
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 700;
  }

  .bib-actividad__fecha span {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .bib-actividad__cantidad {
    min-height: 27px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 4px 9px;
    color: #d86827;
    background: #fff5ec;
    border: 1px solid rgba(241, 139, 75, 0.26);
    border-radius: 999px;
    white-space: nowrap;
    font-size: 9px;
    font-weight: 800;
  }

  .bib-actividad__acciones {
    display: flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }

  .bib-actividad__accion {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 11px;
    color: #d86827;
    background: #fffdf9;
    border: 1px solid rgba(241, 139, 75, 0.42);
    border-radius: 10px;
    text-decoration: none;
    font-size: 10px;
    font-weight: 800;
    transition:
      transform 0.15s ease,
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .bib-actividad__accion:hover {
    transform: translateY(-1px);
    background: #fff5ec;
    border-color: rgba(241, 139, 75, 0.65);
  }

  .bib-actividad__accion--descarga {
    background: #fffaf4;
  }

  .bib-actividad__accion--descarga:hover {
    background: #ffe9d6;
  }

  .bib-actividad__estado,
  .bib-actividad__vacio {
    padding: 42px 24px;
    text-align: center;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border-soft);
    border-radius: 17px;
  }

  .bib-actividad__estado {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 9px;
    color: var(--app-text-secondary);
  }

  .bib-actividad__estado p {
    margin: 0;
    font-size: 13px;
  }

  .bib-actividad__estado-icono {
    width: 54px;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--app-accent);
    background: var(--app-accent-50);
    border-radius: 15px;
  }

  .bib-actividad__estado--error {
    color: var(--app-danger);
  }

  .bib-actividad__vacio {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .bib-actividad__vacio-icono {
    width: 62px;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 13px;
    color: var(--app-accent);
    background: var(--app-accent-50);
    border: 1px solid var(--app-border);
    border-radius: 17px;
  }

  .bib-actividad__vacio h3 {
    margin: 0;
    color: var(--app-text);
    font-size: 18px;
    font-weight: 800;
  }

  .bib-actividad__vacio p {
    max-width: 510px;
    margin: 7px auto 17px;
    color: var(--app-text-secondary);
    font-size: 12px;
    line-height: 1.6;
  }

  .bib-actividad__principal {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 17px;
    color: #ffffff;
    background: var(--app-accent);
    border: 0;
    border-radius: 10px;
    text-decoration: none;
    font: inherit;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .bib-actividad__principal:hover {
    background: var(--app-accent-600);
  }

  .bib-actividad__paginacion {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 13px;
    padding-top: 3px;
    color: var(--app-text-secondary);
    font-size: 11px;
  }

  .bib-actividad__paginacion button {
    min-height: 36px;
    padding: 0 14px;
    color: var(--app-accent-700);
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border);
    border-radius: 9px;
    font: inherit;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }

  .bib-actividad__paginacion button:hover:not(:disabled) {
    background: var(--app-accent-50);
  }

  .bib-actividad__paginacion button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (max-width: 1180px) {
    .bib-actividad__estadisticas {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .bib-actividad__filtros {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .bib-actividad__limpiar {
      width: 100%;
    }
  }

  @media (max-width: 760px) {
    .bib-actividad__header {
      align-items: stretch;
      flex-direction: column;
    }

    .bib-actividad__buscador {
      width: 100%;
    }

    .bib-actividad__estadisticas,
    .bib-actividad__filtros {
      grid-template-columns: 1fr;
    }

    .bib-actividad__titulo {
      align-items: flex-start;
    }

    .bib-actividad__titulo h1 {
      font-size: 23px;
    }

    .bib-actividad__titulo-icono {
      width: 52px;
      height: 52px;
      flex-basis: 52px;
    }
  }
`;