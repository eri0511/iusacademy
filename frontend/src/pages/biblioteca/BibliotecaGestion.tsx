import ReporteItem from "../../components/biblioteca/ReporteItem";
import BibliotecaRecursoModal from "../../components/biblioteca/BibliotecaRecursoModal";
import type { DatosContenidoPendiente } from "../../components/biblioteca/BibliotecaRecursoModal";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Archive,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  FileText,
  History,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";

import {
  mensajeError,
  useBiblioteca,
} from "../../contexts/BibliotecaContext";

import {
  fecha,
  nombre,
} from "../../utils/biblioteca/biblioteca.utils";

import {
  categorias,
} from "../../types/biblioteca/biblioteca.types";

import type {
  Catalogo,
  Estado,
  Ficha,
  Historial,
  Permiso,
  Persona,
  Recurso,
  Reporte,
} from "../../types/biblioteca/biblioteca.types";

type TabGestion =
  | "recursos"
  | "reportes"
  | "permisos"
  | "historial";

type ModalRecurso = "crear" | "editar" | null;

type ResumenGestion = {
  total: number;
  publicados: number;
  borradores: number;
  archivados: number;
};

const FICHA_INICIAL: Ficha = {
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

function etiquetaEstado(estado: Estado) {
  if (estado === "PUBLICADO") return "Publicado";
  if (estado === "BORRADOR") return "Borrador";
  return "Archivado";
}

function inicialesRecurso(titulo: string) {
  return titulo
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase())
    .join("");
}

function obtenerFormato(recurso: Recurso) {
  const contenidos = recurso.contenidos ?? [];

  if (!contenidos.length) {
    return "Sin contenido";
  }

  const tieneArchivo = contenidos.some(
    (contenido) => contenido.tipo === "ARCHIVO",
  );

  const tieneEnlace = contenidos.some(
    (contenido) => contenido.tipo === "ENLACE",
  );

  if (tieneArchivo && tieneEnlace) {
    return "Mixto";
  }

  if (tieneEnlace) {
    return "Enlace";
  }

  const primeraVersion = contenidos
    .find((contenido) => contenido.tipo === "ARCHIVO")
    ?.versiones?.[0];

  return primeraVersion?.extension?.toUpperCase() || "Archivo";
}

function fichaDesdeRecurso(recurso: Recurso): Ficha {
  return {
    titulo: recurso.titulo ?? "",
    descripcion: recurso.descripcion ?? "",
    finalidad: recurso.finalidad ?? "",
    categoria: recurso.categoria,
    tema: recurso.tema ?? "",
    etiquetas: recurso.etiquetas ?? [],
    autorInstitucion: recurso.autorInstitucion ?? "",
    fuente: recurso.fuente ?? "",
    fechaDocumento: recurso.fechaDocumento
      ? recurso.fechaDocumento.slice(0, 10)
      : "",
    numeroNorma: recurso.numeroNorma ?? "",
    tribunal: recurso.tribunal ?? "",
    numeroResolucion: recurso.numeroResolucion ?? "",
    vigencia: recurso.vigencia,
    observacionVigencia:
      recurso.observacionVigencia ?? "",
    destacado: recurso.destacado ?? false,
  };
}

function limpiarFicha(ficha: Ficha): Ficha {
  return {
    ...ficha,
    titulo: ficha.titulo.trim(),
    descripcion: ficha.descripcion.trim(),
    finalidad:
      ficha.finalidad?.trim() || undefined,
    tema: ficha.tema.trim(),

    etiquetas: ficha.etiquetas
      .map((etiqueta) => etiqueta.trim())
      .filter(Boolean),

    autorInstitucion:
      ficha.autorInstitucion?.trim() || undefined,

    fuente:
      ficha.fuente?.trim() || undefined,

    fechaDocumento:
      ficha.fechaDocumento || undefined,

    numeroNorma:
      ficha.numeroNorma?.trim() || undefined,

    tribunal:
      ficha.tribunal?.trim() || undefined,

    numeroResolucion:
      ficha.numeroResolucion?.trim() || undefined,

    observacionVigencia:
      ficha.observacionVigencia?.trim() || undefined,
  };
}

export default function BibliotecaGestion() {
  const {
    api,
    base,
    capacidades,
    avisar,
  } = useBiblioteca();

  const [tab, setTab] =
    useState<TabGestion>("recursos");

  const [catalogo, setCatalogo] =
    useState<Catalogo | null>(null);

  const [estado, setEstado] =
    useState<Estado>("PUBLICADO");

  const [q, setQ] = useState("");
  const [buscar, setBuscar] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] =
    useState("");

  const [pagina, setPagina] = useState(1);

  const [permisos, setPermisos] =
    useState<Permiso[]>([]);

  const [docentes, setDocentes] =
    useState<Persona[]>([]);

  const [docenteId, setDocenteId] =
    useState("");

  const [reportes, setReportes] =
    useState<Reporte[]>([]);

  const [historial, setHistorial] =
    useState<Historial[]>([]);

  const [resumen, setResumen] =
    useState<ResumenGestion>({
      total: 0,
      publicados: 0,
      borradores: 0,
      archivados: 0,
    });

  const [error, setError] = useState("");
  const [cargando, setCargando] =
    useState(true);

  const [ocupado, setOcupado] =
    useState(false);

  const [modalRecurso, setModalRecurso] =
    useState<ModalRecurso>(null);

  const [recursoEditando, setRecursoEditando] =
    useState<Recurso | null>(null);

  const [ficha, setFicha] =
    useState<Ficha>(FICHA_INICIAL);

  const [etiquetasTexto, setEtiquetasTexto] =
    useState("");

  const [confirmacion, setConfirmacion] =
    useState<{
      titulo: string;
      descripcion: string;
      confirmar: () => Promise<void>;
      peligro?: boolean;
    } | null>(null);

  const cargarResumen = useCallback(async () => {
    try {
      const [
        publicados,
        borradores,
        archivados,
      ] = await Promise.all([
        api.get<Catalogo>(
          "/recursos?estado=PUBLICADO&pagina=1&limite=1",
        ),
        api.get<Catalogo>(
          "/recursos?estado=BORRADOR&pagina=1&limite=1",
        ),
        api.get<Catalogo>(
          "/recursos?estado=ARCHIVADO&pagina=1&limite=1",
        ),
      ]);

      setResumen({
        total:
          publicados.total +
          borradores.total +
          archivados.total,

        publicados: publicados.total,
        borradores: borradores.total,
        archivados: archivados.total,
      });
    } catch {
      // El resumen no bloquea la gestión.
    }
  }, [api]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      if (tab === "recursos") {
        const params = new URLSearchParams({
          estado,
          pagina: String(pagina),
          limite: "12",
        });

        if (buscar.trim()) {
          params.set("q", buscar.trim());
        }

        if (categoriaFiltro) {
          params.set(
            "categoria",
            categoriaFiltro,
          );
        }

        const respuesta =
          await api.get<Catalogo>(
            `/recursos?${params.toString()}`,
          );

        setCatalogo(respuesta);
      } else if (tab === "permisos") {
        const [
          permisosRespuesta,
          docentesRespuesta,
        ] = await Promise.all([
          api.get<Permiso[]>("/permisos"),
          api.get<Persona[]>("/docentes"),
        ]);

        setPermisos(permisosRespuesta);
        setDocentes(docentesRespuesta);
      } else if (tab === "reportes") {
        setReportes(
          await api.get<Reporte[]>(
            `/reportes?pagina=${pagina}`,
          ),
        );
      } else {
        setHistorial(
          await api.get<Historial[]>(
            `/historial?pagina=${pagina}`,
          ),
        );
      }
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [
    api,
    tab,
    estado,
    pagina,
    buscar,
    categoriaFiltro,
  ]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    void cargarResumen();
  }, [cargarResumen]);

  async function accion(
    fn: () => Promise<unknown>,
    mensaje: string,
  ) {
    setOcupado(true);

    try {
      await fn();

      await Promise.all([
        cargar(),
        cargarResumen(),
      ]);

      avisar(mensaje);
    } catch (e) {
      avisar(mensajeError(e), true);
    } finally {
      setOcupado(false);
    }
  }

  function cambiarTab(nuevoTab: TabGestion) {
    setTab(nuevoTab);
    setPagina(1);
  }

  function abrirCrear() {
    setRecursoEditando(null);
    setFicha(FICHA_INICIAL);
    setEtiquetasTexto("");
    setModalRecurso("crear");
  }

  async function abrirEditar(
    recurso: Recurso,
  ) {
    setOcupado(true);

    try {
      const detalle =
        await api.get<Recurso>(
          `/recursos/${recurso.id}`,
        );

      setRecursoEditando(detalle);
      setFicha(fichaDesdeRecurso(detalle));

      setEtiquetasTexto(
        (detalle.etiquetas ?? []).join(", "),
      );

      setModalRecurso("editar");
    } catch (e) {
      avisar(mensajeError(e), true);
    } finally {
      setOcupado(false);
    }
  }

  function cerrarModalRecurso() {
    if (ocupado) return;

    setModalRecurso(null);
    setRecursoEditando(null);
    setFicha(FICHA_INICIAL);
    setEtiquetasTexto("");
  }

  async function guardarRecurso(
    contenido: DatosContenidoPendiente,
  ) {
    if (ficha.titulo.trim().length < 3) {
      avisar(
        "El título debe tener al menos 3 caracteres.",
        true,
      );
      return;
    }

    if (
      ficha.descripcion.trim().length < 10
    ) {
      avisar(
        "La descripción debe tener al menos 10 caracteres.",
        true,
      );
      return;
    }

    if (ficha.tema.trim().length < 2) {
      avisar(
        "El tema debe tener al menos 2 caracteres.",
        true,
      );
      return;
    }

    const datos = limpiarFicha({
      ...ficha,

      etiquetas: etiquetasTexto
        .split(",")
        .map((etiqueta) =>
          etiqueta.trim(),
        )
        .filter(Boolean)
        .slice(0, 20),
    });

    setOcupado(true);

    try {
      let recursoId =
        recursoEditando?.id;

      if (modalRecurso === "crear") {
        const creado =
          await api.send<Recurso>(
            "/recursos",
            "POST",
            datos,
          );

        recursoId = creado.id;
      } else if (recursoEditando) {
        await api.send(
          `/recursos/${recursoEditando.id}`,
          "PATCH",
          datos,
        );
      }

      if (!recursoId) {
        throw new Error(
          "No se pudo determinar el recurso creado.",
        );
      }

      for (const item of contenido.archivos) {
        const form = new FormData();

        form.set(
          "archivo",
          item.archivo,
        );

        form.set(
          "titulo",
          item.titulo.trim() ||
            item.archivo.name.replace(
              /\.[^/.]+$/,
              "",
            ),
        );

        if (ficha.fechaDocumento) {
          form.set(
            "fechaDocumento",
            ficha.fechaDocumento,
          );
        }

        await api.send(
          `/recursos/${recursoId}/archivos`,
          "POST",
          form,
        );
      }

      for (const item of contenido.enlaces) {
        if (
          !item.titulo.trim() ||
          !item.urlExterna.trim()
        ) {
          continue;
        }

        await api.send(
          `/recursos/${recursoId}/enlaces`,
          "POST",
          {
            titulo: item.titulo.trim(),
            urlExterna:
              item.urlExterna.trim(),
          },
        );
      }

      avisar(
        modalRecurso === "crear"
          ? "Recurso creado correctamente"
          : "Recurso actualizado correctamente",
      );

      setModalRecurso(null);
      setRecursoEditando(null);
      setFicha(FICHA_INICIAL);
      setEtiquetasTexto("");

      await Promise.all([
        cargar(),
        cargarResumen(),
      ]);
    } catch (e) {
      avisar(mensajeError(e), true);
    } finally {
      setOcupado(false);
    }
  }

  function pedirCambioEstado(
    recurso: Recurso,
    nuevoEstado: Estado,
  ) {
    const verbo =
      nuevoEstado === "PUBLICADO"
        ? "publicar"
        : nuevoEstado === "BORRADOR"
          ? "mover a borradores"
          : "archivar";

    setConfirmacion({
      titulo:
        nuevoEstado === "ARCHIVADO"
          ? "Archivar recurso"
          : "Cambiar estado del recurso",

      descripcion:
        `¿Deseas ${verbo} “${recurso.titulo}”?`,

      peligro:
        nuevoEstado === "ARCHIVADO",

      confirmar: async () => {
        await accion(
          () =>
            api.send(
              `/recursos/${recurso.id}/estado`,
              "PATCH",
              {
                estado: nuevoEstado,
              },
            ),

          nuevoEstado === "PUBLICADO"
            ? "Recurso publicado"
            : nuevoEstado === "BORRADOR"
              ? "Recurso movido a borradores"
              : "Recurso archivado",
        );

        setConfirmacion(null);
      },
    });
  }

  function pedirRevocarPermiso(
    permiso: Permiso,
  ) {
    setConfirmacion({
      titulo: "Revocar permiso",

      descripcion:
        `¿Deseas retirar el permiso de gestión de biblioteca a ${nombre(
          permiso.docente,
        )}?`,

      peligro: true,

      confirmar: async () => {
        await accion(
          () =>
            api.send(
              `/permisos/${permiso.docenteId}`,
              "DELETE",
            ),
          "Permiso retirado",
        );

        setConfirmacion(null);
      },
    });
  }

  const docentesDisponibles =
    useMemo(
      () =>
        docentes.filter(
          (docente) =>
            !permisos.some(
              (permiso) =>
                permiso.docenteId ===
                  docente.id &&
                permiso.estaActivo,
            ),
        ),
      [docentes, permisos],
    );

  return (
    <>
      <section className="bib-admin">
        {/* CABECERA */}

        <header className="bib-admin__hero">
          <div className="bib-admin__hero-icon">
            <BookOpen size={28} />
          </div>

          <div className="bib-admin__hero-copy">
            <h1>
              Administración de biblioteca
            </h1>

            <p>
              Gestiona los recursos jurídicos,
              reportes y permisos de publicación
              de IusAcademy.
            </p>
          </div>
        </header>

        {/* ESTADÍSTICAS */}

        <div className="bib-admin__stats">
          <StatCard
            icon={<BookOpen size={23} />}
            value={resumen.total}
            label="Total de recursos"
            tone="orange"
          />

          <StatCard
            icon={<Check size={23} />}
            value={resumen.publicados}
            label="Publicados"
            tone="green"
          />

          <StatCard
            icon={<Edit3 size={22} />}
            value={resumen.borradores}
            label="Borradores"
            tone="yellow"
          />

          <StatCard
            icon={<Archive size={22} />}
            value={resumen.archivados}
            label="Archivados"
            tone="gray"
          />
        </div>

        {/* TABS */}

        <nav
          className="bib-admin__tabs"
          aria-label="Opciones de administración"
        >
          <button
            type="button"
            className={
              tab === "recursos"
                ? "active"
                : ""
            }
            onClick={() =>
              cambiarTab("recursos")
            }
          >
            <FileText size={17} />
            Recursos
          </button>

          <button
            type="button"
            className={
              tab === "reportes"
                ? "active"
                : ""
            }
            onClick={() =>
              cambiarTab("reportes")
            }
          >
            <ShieldCheck size={17} />
            Reportes
          </button>

          {capacidades.puedeDelegar && (
            <>
              <button
                type="button"
                className={
                  tab === "permisos"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  cambiarTab("permisos")
                }
              >
                <Users size={17} />
                Permisos docentes
              </button>

              <button
                type="button"
                className={
                  tab === "historial"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  cambiarTab("historial")
                }
              >
                <History size={17} />
                Historial general
              </button>
            </>
          )}
        </nav>

        {/* RECURSOS */}

        {tab === "recursos" && (
          <section className="bib-admin__resources-section">
            <div className="bib-admin__toolbar">
              <form
                className="bib-admin__search"
                onSubmit={(event) => {
                  event.preventDefault();
                  setBuscar(q);
                  setPagina(1);
                }}
              >
                <Search size={18} />

                <input
                  value={q}
                  placeholder="Buscar recursos..."
                  aria-label="Buscar recursos"
                  onChange={(event) =>
                    setQ(event.target.value)
                  }
                />

                <button type="submit">
                  Buscar
                </button>
              </form>

              <select
                value={categoriaFiltro}
                aria-label="Filtrar por categoría"
                onChange={(event) => {
                  setCategoriaFiltro(
                    event.target.value,
                  );
                  setPagina(1);
                }}
              >
                <option value="">
                  Todas las categorías
                </option>

                {Object.entries(
                  categorias,
                ).map(
                  ([clave, etiqueta]) => (
                    <option
                      key={clave}
                      value={clave}
                    >
                      {etiqueta}
                    </option>
                  ),
                )}
              </select>

              <select
                value={estado}
                aria-label="Filtrar por estado"
                onChange={(event) => {
                  setEstado(
                    event.target.value as Estado,
                  );
                  setPagina(1);
                }}
              >
                <option value="PUBLICADO">
                  Publicados
                </option>

                <option value="BORRADOR">
                  Borradores
                </option>

                <option value="ARCHIVADO">
                  Archivados
                </option>
              </select>

              {capacidades.puedeGestionar && (
                <button
                  type="button"
                  className="bib-admin__primary bib-admin__primary--small"
                  onClick={abrirCrear}
                >
                  <Plus size={17} />
                  Nuevo recurso
                </button>
              )}
            </div>

            {error && (
              <EstadoMensaje
                texto={error}
                error
                reintentar={() =>
                  void cargar()
                }
              />
            )}

            {cargando ? (
              <EstadoMensaje
                texto="Cargando recursos..."
              />
            ) : !error &&
              catalogo?.recursos.length ? (
              <>
                <div className="bib-admin__table-wrap">
                  <table className="bib-admin__table">
                    <thead>
                      <tr>
                        <th>RECURSO</th>
                        <th>CATEGORÍA</th>
                        <th>
                          AUTOR / INSTITUCIÓN
                        </th>
                        <th>FORMATO</th>
                        <th>ESTADO</th>
                        <th>ACTUALIZADO</th>
                        <th>ACCIONES</th>
                      </tr>
                    </thead>

                    <tbody>
                      {catalogo.recursos.map(
                        (recurso) => (
                          <tr key={recurso.id}>
                            <td>
                              <div className="bib-admin__resource">
                                <span className="table-avatar">
                                  {inicialesRecurso(
                                    recurso.titulo,
                                  ) || "R"}
                                </span>

                                <div>
                                  <strong>
                                    {recurso.titulo}
                                  </strong>

                                  <span>
                                    {recurso.tema}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="bib-admin__category">
                                {
                                  categorias[
                                    recurso
                                      .categoria
                                  ]
                                }
                              </span>
                            </td>

                            <td>
                              <div className="bib-admin__author">
                                <strong>
                                  {recurso.autorInstitucion ||
                                    "IusAcademy"}
                                </strong>

                                <span>
                                  {recurso.fuente ||
                                    "Biblioteca jurídica"}
                                </span>
                              </div>
                            </td>

                            <td>
                              <span className="bib-admin__format">
                                {obtenerFormato(
                                  recurso,
                                )}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`bib-admin__status bib-admin__status--${recurso.estado.toLowerCase()}`}
                              >
                                <i />

                                {etiquetaEstado(
                                  recurso.estado,
                                )}
                              </span>
                            </td>

                            <td>
                              <div className="bib-admin__date">
                                <strong>
                                  {fecha(
                                    recurso.actualizadoEn,
                                  )}
                                </strong>
                              </div>
                            </td>

                            <td>
                              <div className="bib-admin__actions">
                                <a
                                  className="bib-admin__action-button"
                                  href={`${base}/recursos/${recurso.id}`}
                                  title="Ver recurso"
                                >
                                  <Eye size={15} />
                                  Ver
                                </a>

                                <button
                                  type="button"
                                  className="bib-admin__action-button"
                                  disabled={
                                    ocupado
                                  }
                                  onClick={() =>
                                    void abrirEditar(
                                      recurso,
                                    )
                                  }
                                >
                                  <Edit3
                                    size={15}
                                  />
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  className="bib-admin__action-button"
                                  disabled={
                                    ocupado
                                  }
                                  onClick={() =>
                                    pedirCambioEstado(
                                      recurso,
                                      recurso.estado ===
                                        "PUBLICADO"
                                        ? "BORRADOR"
                                        : "PUBLICADO",
                                    )
                                  }
                                >
                                  {recurso.estado ===
                                  "PUBLICADO" ? (
                                    <Edit3
                                      size={15}
                                    />
                                  ) : (
                                    <Upload
                                      size={15}
                                    />
                                  )}

                                  {recurso.estado ===
                                  "PUBLICADO"
                                    ? "Borrador"
                                    : "Publicar"}
                                </button>

                                <button
                                  type="button"
                                  className="bib-admin__action-button bib-admin__action-button--danger"
                                  disabled={
                                    ocupado ||
                                    recurso.estado ===
                                      "ARCHIVADO"
                                  }
                                  onClick={() =>
                                    pedirCambioEstado(
                                      recurso,
                                      "ARCHIVADO",
                                    )
                                  }
                                >
                                  <Archive
                                    size={15}
                                  />
                                  Archivar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <Paginacion
                  pagina={pagina}
                  paginas={
                    catalogo.paginas
                  }
                  anterior={() =>
                    setPagina(
                      (actual) =>
                        Math.max(
                          1,
                          actual - 1,
                        ),
                    )
                  }
                  siguiente={() =>
                    setPagina(
                      (actual) =>
                        Math.min(
                          catalogo.paginas,
                          actual + 1,
                        ),
                    )
                  }
                />
              </>
            ) : !error ? (
              <EstadoMensaje
                texto="No hay recursos con estos filtros."
                icono={
                  <FileText size={28} />
                }
              />
            ) : null}
          </section>
        )}

        {/* REPORTES */}

        {tab === "reportes" && (
          <section className="bib-admin__content-section">
            <div className="bib-admin__section-heading">
              <div>
                <span>
                  CONTROL DE CONTENIDO
                </span>

                <h2>
                  Reportes de usuarios
                </h2>

                <p>
                  Revisa las observaciones
                  enviadas sobre los recursos
                  de la biblioteca.
                </p>
              </div>
            </div>

            {error && (
              <EstadoMensaje
                texto={error}
                error
                reintentar={() =>
                  void cargar()
                }
              />
            )}

            {cargando ? (
              <EstadoMensaje
                texto="Cargando reportes..."
              />
            ) : !error &&
              reportes.length ? (
              <>
                <div className="bib-admin__report-list">
                  {reportes.map(
                    (reporte) => (
                      <ReporteItem
                        key={reporte.id}
                        reporte={reporte}
                        ocupado={ocupado}
                        atender={(
                          estadoReporte,
                          respuesta,
                        ) =>
                          accion(
                            () =>
                              api.send(
                                `/reportes/${reporte.id}`,
                                "PATCH",
                                {
                                  estado:
                                    estadoReporte,
                                  respuesta,
                                },
                              ),
                            "Reporte actualizado",
                          )
                        }
                      />
                    ),
                  )}
                </div>

                <Paginacion
                  pagina={pagina}
                  paginas={
                    reportes.length < 30
                      ? pagina
                      : pagina + 1
                  }
                  anterior={() =>
                    setPagina(
                      (actual) =>
                        Math.max(
                          1,
                          actual - 1,
                        ),
                    )
                  }
                  siguiente={() =>
                    setPagina(
                      (actual) =>
                        actual + 1,
                    )
                  }
                  bloquearSiguiente={
                    reportes.length < 30
                  }
                />
              </>
            ) : !error ? (
              <EstadoMensaje
                texto="No hay reportes en esta página."
                icono={
                  <Check size={28} />
                }
              />
            ) : null}
          </section>
        )}

        {/* PERMISOS */}

        {tab === "permisos" &&
          capacidades.puedeDelegar && (
            <section className="bib-admin__content-section">
              <div className="bib-admin__section-heading">
                <div>
                  <span>
                    CONTROL DE ACCESO
                  </span>

                  <h2>
                    Permisos docentes
                  </h2>

                  <p>
                    Autoriza a docentes para
                    gestionar el contenido de
                    la Biblioteca Jurídica.
                  </p>
                </div>
              </div>

              <div className="bib-admin__permission-add">
                <div className="bib-admin__permission-icon">
                  <UserCheck size={24} />
                </div>

                <div className="bib-admin__permission-copy">
                  <strong>
                    Delegar gestión de
                    biblioteca
                  </strong>

                  <span>
                    El docente podrá crear,
                    actualizar, publicar y
                    archivar recursos según
                    los permisos definidos
                    por el backend.
                  </span>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();

                    if (!docenteId) {
                      return;
                    }

                    void accion(
                      () =>
                        api.send(
                          `/permisos/${docenteId}`,
                          "PUT",
                        ),
                      "Permiso de gestión otorgado",
                    ).then(() =>
                      setDocenteId(""),
                    );
                  }}
                >
                  <select
                    required
                    value={docenteId}
                    aria-label="Seleccionar docente"
                    onChange={(event) =>
                      setDocenteId(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Selecciona un docente
                    </option>

                    {docentesDisponibles.map(
                      (docente) => (
                        <option
                          key={docente.id}
                          value={
                            docente.id
                          }
                        >
                          {nombre(
                            docente,
                          )}{" "}
                          ·{" "}
                          {docente.correo}
                        </option>
                      ),
                    )}
                  </select>

                  <button
                    type="submit"
                    className="bib-admin__primary"
                    disabled={
                      ocupado ||
                      !docenteId
                    }
                  >
                    <Check size={17} />
                    Otorgar permiso
                  </button>
                </form>
              </div>

              {cargando ? (
                <EstadoMensaje
                  texto="Cargando permisos..."
                />
              ) : permisos.length ? (
                <div className="bib-admin__permissions">
                  {permisos.map(
                    (permiso) => (
                      <article
                        className="bib-admin__permission-card"
                        key={permiso.id}
                      >
                        <div className="table-avatar table-avatar--small">
                          {permiso.docente.nombres
                            ?.charAt(0)
                            .toUpperCase()}

                          {permiso.docente.apellidoPaterno
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="bib-admin__permission-person">
                          <strong>
                            {nombre(
                              permiso.docente,
                            )}
                          </strong>

                          <span>
                            {
                              permiso
                                .docente
                                .correo
                            }
                          </span>
                        </div>

                        <span
                          className={`bib-admin__permission-status ${
                            permiso.estaActivo
                              ? "active"
                              : ""
                          }`}
                        >
                          <i />

                          {permiso.estaActivo
                            ? "Gestión habilitada"
                            : "Permiso revocado"}
                        </span>

                        {permiso.estaActivo && (
                          <button
                            type="button"
                            className="bib-admin__danger-button"
                            disabled={
                              ocupado
                            }
                            onClick={() =>
                              pedirRevocarPermiso(
                                permiso,
                              )
                            }
                          >
                            <Trash2
                              size={15}
                            />
                            Revocar
                          </button>
                        )}
                      </article>
                    ),
                  )}
                </div>
              ) : (
                <EstadoMensaje
                  texto="Todavía no se delegó la gestión a ningún docente."
                  icono={
                    <Users size={28} />
                  }
                />
              )}
            </section>
          )}

        {/* HISTORIAL */}

        {tab === "historial" &&
          capacidades.puedeDelegar && (
            <section className="bib-admin__content-section">
              <div className="bib-admin__section-heading">
                <div>
                  <span>AUDITORÍA</span>

                  <h2>
                    Historial de acciones
                  </h2>

                  <p>
                    Consulta las acciones
                    realizadas sobre los
                    recursos de la biblioteca.
                  </p>
                </div>
              </div>

              {cargando ? (
                <EstadoMensaje
                  texto="Cargando historial..."
                />
              ) : historial.length ? (
                <>
                  <div className="bib-admin__table-wrap">
                    <table className="bib-admin__table bib-admin__table--history">
                      <thead>
                        <tr>
                          <th>ACCIÓN</th>
                          <th>
                            REALIZADO POR
                          </th>
                          <th>FECHA</th>
                          <th>DETALLE</th>
                        </tr>
                      </thead>

                      <tbody>
                        {historial.map(
                          (item) => (
                            <tr
                              key={item.id}
                            >
                              <td>
                                <div className="bib-admin__history-action">
                                  <span>
                                    <Clock3
                                      size={
                                        16
                                      }
                                    />
                                  </span>

                                  <strong>
                                    {item.accion
                                      .replaceAll(
                                        "_",
                                        " ",
                                      )
                                      .toLocaleLowerCase(
                                        "es",
                                      )}
                                  </strong>
                                </div>
                              </td>

                              <td>
                                <div className="bib-admin__author">
                                  <strong>
                                    {nombre(
                                      item.actor,
                                    )}
                                  </strong>

                                  <span>
                                    {
                                      item
                                        .actor
                                        .correo
                                    }
                                  </span>
                                </div>
                              </td>

                              <td>
                                {fecha(
                                  item.creadoEn,
                                )}
                              </td>

                              <td>
                                <span className="bib-admin__muted">
                                  Acción
                                  registrada en
                                  la biblioteca.
                                </span>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Paginacion
                    pagina={pagina}
                    paginas={
                      historial.length <
                      30
                        ? pagina
                        : pagina + 1
                    }
                    anterior={() =>
                      setPagina(
                        (actual) =>
                          Math.max(
                            1,
                            actual - 1,
                          ),
                      )
                    }
                    siguiente={() =>
                      setPagina(
                        (actual) =>
                          actual + 1,
                      )
                    }
                    bloquearSiguiente={
                      historial.length <
                      30
                    }
                  />
                </>
              ) : (
                <EstadoMensaje
                  texto="No hay registros en esta página."
                  icono={
                    <History size={28} />
                  }
                />
              )}
            </section>
          )}
      </section>

      {/* MODAL CREAR / EDITAR */}

      <BibliotecaRecursoModal
        abierto={
          modalRecurso !== null
        }
        modo={
          modalRecurso ?? "crear"
        }
        ficha={ficha}
        etiquetasTexto={
          etiquetasTexto
        }
        recurso={recursoEditando}
        ocupado={ocupado}
        setFicha={setFicha}
        setEtiquetasTexto={
          setEtiquetasTexto
        }
        onCerrar={
          cerrarModalRecurso
        }
        onGuardar={guardarRecurso}
        onContenidoActualizado={async () => {
          if (!recursoEditando) {
            return;
          }

          const detalle =
            await api.get<Recurso>(
              `/recursos/${recursoEditando.id}`,
            );

          setRecursoEditando(detalle);

          await Promise.all([
            cargar(),
            cargarResumen(),
          ]);
        }}
      />

      {/* CONFIRMACIÓN */}

      {confirmacion && (
        <div
          className="bib-admin-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !ocupado
            ) {
              setConfirmacion(null);
            }
          }}
        >
          <section
            className="bib-admin-confirm"
            role="dialog"
            aria-modal="true"
          >
            <div
              className={`bib-admin-confirm__icon ${
                confirmacion.peligro
                  ? "danger"
                  : ""
              }`}
            >
              {confirmacion.peligro ? (
                <Archive size={25} />
              ) : (
                <ShieldCheck
                  size={25}
                />
              )}
            </div>

            <h2>
              {confirmacion.titulo}
            </h2>

            <p>
              {confirmacion.descripcion}
            </p>

            <div className="bib-admin-confirm__actions">
              <button
                type="button"
                className="bib-admin__secondary"
                disabled={ocupado}
                onClick={() =>
                  setConfirmacion(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={
                  confirmacion.peligro
                    ? "bib-admin__danger"
                    : "bib-admin__primary"
                }
                disabled={ocupado}
                onClick={() =>
                  void confirmacion.confirmar()
                }
              >
                {ocupado
                  ? "Procesando..."
                  : "Confirmar"}
              </button>
            </div>
          </section>
        </div>
      )}

      <style>{ESTILOS}</style>
    </>
  );
}

/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone:
    | "orange"
    | "green"
    | "yellow"
    | "gray";
}) {
  return (
    <article className="bib-admin__stat">
      <span
        className={`bib-admin__stat-icon bib-admin__stat-icon--${tone}`}
      >
        {icon}
      </span>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function EstadoMensaje({
  texto,
  error = false,
  icono,
  reintentar,
}: {
  texto: string;
  error?: boolean;
  icono?: React.ReactNode;
  reintentar?: () => void;
}) {
  return (
    <div
      className={`bib-admin__empty ${
        error
          ? "bib-admin__empty--error"
          : ""
      }`}
      role={
        error ? "alert" : "status"
      }
    >
      {icono}

      <p>{texto}</p>

      {reintentar && (
        <button
          type="button"
          className="bib-admin__secondary"
          onClick={reintentar}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

function Paginacion({
  pagina,
  paginas,
  anterior,
  siguiente,
  bloquearSiguiente = false,
}: {
  pagina: number;
  paginas: number;
  anterior: () => void;
  siguiente: () => void;
  bloquearSiguiente?: boolean;
}) {
  return (
    <div className="bib-admin__pagination">
      <button
        type="button"
        disabled={pagina <= 1}
        onClick={anterior}
      >
        <ChevronLeft size={16} />
        Anterior
      </button>

      <span>
        Página <strong>{pagina}</strong>

        {paginas > 0 && (
          <> de {paginas}</>
        )}
      </span>

      <button
        type="button"
        disabled={
          bloquearSiguiente ||
          (paginas > 0 &&
            pagina >= paginas)
        }
        onClick={siguiente}
      >
        Siguiente
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const ESTILOS = `
  .bib-admin {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* =====================================================
     HERO
  ===================================================== */

  .bib-admin__hero {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 22px 24px;

    background:
      var(--app-surface-raised);

    border:
      1px solid
      var(--app-border-soft);

    border-radius: 20px;

    box-shadow:
      0 8px 28px
      rgba(15, 23, 42, 0.04);
  }

  .bib-admin__hero-icon {
    width: 58px;
    height: 58px;

    flex: 0 0 58px;

    display: grid;
    place-items: center;

    color:
      var(--app-accent);

    background:
      var(--app-accent-50);

    border:
      1px solid
      var(--app-border);

    border-radius: 17px;
  }

  .bib-admin__hero-copy {
    flex: 1;
    min-width: 0;
  }

  .bib-admin__hero h1 {
    margin: 0 0 5px;

    color:
      var(--app-text);

    font-size: 27px;
    font-weight: 850;
  }

  .bib-admin__hero p {
    margin: 0;

    color:
      var(--app-text-secondary);

    font-size: 12px;
    line-height: 1.55;
  }

  /* =====================================================
     ESTADÍSTICAS
  ===================================================== */

  .bib-admin__stats {
    display: grid;

    grid-template-columns:
      repeat(4, minmax(0, 1fr));

    gap: 12px;
  }

  .bib-admin__stat {
    min-height: 88px;

    display: flex;
    align-items: center;

    gap: 13px;

    padding: 15px 17px;

    background:
      var(--app-surface-raised);

    border:
      1px solid
      var(--app-border-soft);

    border-radius: 16px;

    box-shadow:
      0 6px 20px
      rgba(15, 23, 42, 0.025);
  }

  .bib-admin__stat-icon {
    width: 47px;
    height: 47px;

    flex: 0 0 47px;

    display: grid;
    place-items: center;

    border-radius: 13px;
  }

  .bib-admin__stat-icon--orange {
    color: #ea7a35;
    background: #fff5ec;
  }

  .bib-admin__stat-icon--green {
    color: #059669;
    background: #ecfdf5;
  }

  .bib-admin__stat-icon--yellow {
    color: #d97706;
    background: #fffbeb;
  }

  .bib-admin__stat-icon--gray {
    color: #64748b;
    background: #f1f5f9;
  }

  .bib-admin__stat strong {
    display: block;

    color:
      var(--app-text);

    font-size: 23px;
    line-height: 1;
    font-weight: 850;
  }

  .bib-admin__stat span:not(
    .bib-admin__stat-icon
  ) {
    display: block;

    margin-top: 5px;

    color:
      var(--app-text-secondary);

    font-size: 11px;
  }

  /* =====================================================
     TABS
  ===================================================== */

  .bib-admin__tabs {
    display: flex;
    align-items: center;

    gap: 5px;

    padding: 5px;

    overflow-x: auto;

    background: #fffaf4;

    border:
      1px solid
      var(--app-border);

    border-radius: 13px;
  }

  .bib-admin__tabs button {
    min-height: 39px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 7px;

    padding: 0 16px;

    color:
      var(--app-text-secondary);

    background: transparent;

    border: 0;
    border-radius: 9px;

    white-space: nowrap;

    font: inherit;
    font-size: 11px;
    font-weight: 750;

    cursor: pointer;

    transition: none;
  }

  /*
    IMPORTANTE:
    hover no cambia el diseño.
  */

  .bib-admin__tabs button:hover {
    color:
      var(--app-text-secondary);

    background: transparent;
  }

  .bib-admin__tabs button.active,
  .bib-admin__tabs button.active:hover {
    color: #fff;

    background:
      var(--app-accent);

    box-shadow:
      0 4px 12px
      rgba(241, 139, 75, .20);
  }

  /* =====================================================
     RECURSOS
  ===================================================== */

  .bib-admin__resources-section {
    width: 100%;
  }

  .bib-admin__content-section {
    padding: 18px;

    background:
      var(--app-surface-raised);

    border:
      1px solid
      var(--app-border-soft);

    border-radius: 18px;

    box-shadow:
      0 7px 24px
      rgba(15, 23, 42, .03);
  }

  /* =====================================================
     TOOLBAR
  ===================================================== */

  .bib-admin__toolbar {
    display: grid;

    grid-template-columns:
      minmax(280px, 1fr)
      205px
      165px
      auto;

    gap: 10px;

    margin-bottom: 15px;
  }

  .bib-admin__search {
    height: 45px;

    display: flex;
    align-items: center;

    gap: 9px;

    padding-left: 14px;

    color:
      var(--app-text-muted);

    background:
      var(--app-surface);

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 13px;
  }

  .bib-admin__search:focus-within {
    border-color:
      var(--app-accent);

    box-shadow:
      0 0 0 3px
      var(--app-accent-50);
  }

  .bib-admin__search input {
    flex: 1;

    min-width: 0;

    border: 0;
    outline: 0;

    background:
      transparent;

    color:
      var(--app-text);

    font: inherit;
    font-size: 11px;
  }

  .bib-admin__search input::placeholder {
    color:
      var(--app-text-muted);
  }

  .bib-admin__search button {
    align-self: stretch;

    min-width: 68px;

    padding: 0 13px;

    color:
      var(--app-accent-700);

    background:
      transparent;

    border: 0;

    border-left:
      1px solid
      var(--app-border);

    border-radius:
      0 12px 12px 0;

    font: inherit;
    font-size: 10px;
    font-weight: 850;

    cursor: pointer;

    transition: none;
  }

  .bib-admin__search button:hover {
    color:
      var(--app-accent-700);

    background:
      transparent;
  }

  .bib-admin__toolbar > select,
  .bib-admin__permission-add select {
    min-height: 45px;

    padding:
      0 35px 0 13px;

    color:
      var(--app-text-secondary);

    background:
      var(--app-surface);

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 13px;

    outline: 0;

    font: inherit;
    font-size: 11px;
    font-weight: 700;
  }

  /* =====================================================
     BOTONES GENERALES
  ===================================================== */

  .bib-admin__primary,
  .bib-admin__secondary,
  .bib-admin__danger,
  .bib-admin__danger-button {
    min-height: 40px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 7px;

    padding: 0 15px;

    border-radius: 11px;

    font: inherit;
    font-size: 11px;
    font-weight: 800;

    cursor: pointer;

    transition: none;
  }

  .bib-admin__primary {
    color: #fff !important;

    background:
      var(--app-accent) !important;

    border:
      1px solid
      var(--app-accent) !important;
  }

  /*
    NO cambia al pasar el mouse.
  */

  .bib-admin__primary:hover:not(:disabled) {
    color: #fff !important;

    background:
      var(--app-accent) !important;

    border-color:
      var(--app-accent) !important;

    box-shadow: none !important;

    transform: none !important;
  }

  .bib-admin__primary--small {
    min-height: 45px;

    padding:
      0 18px;

    white-space: nowrap;
  }

  .bib-admin__secondary {
    color:
      var(--app-accent-700);

    background: #fff;

    border:
      1px solid
      var(--app-border-strong);
  }

  .bib-admin__secondary:hover:not(:disabled) {
    color:
      var(--app-accent-700);

    background: #fff;

    border-color:
      var(--app-border-strong);

    box-shadow: none;

    transform: none;
  }

  .bib-admin__danger,
  .bib-admin__danger-button {
    color: #ef4444;

    background: #fff;

    border:
      1px solid #fecaca;
  }

  .bib-admin__danger:hover:not(:disabled),
  .bib-admin__danger-button:hover:not(:disabled) {
    color: #ef4444;

    background: #fff;

    border-color: #fecaca;

    box-shadow: none;

    transform: none;
  }

  .bib-admin button:disabled {
    opacity: .5;

    cursor:
      not-allowed;
  }

  /* =====================================================
     TABLA
  ===================================================== */

  .bib-admin__table-wrap {
    width: 100%;

    overflow-x: auto;

    background:
      var(--app-surface);

    border:
      1px solid
      var(--app-border);

    border-radius: 18px;

    box-shadow:
      0 5px 20px
      rgba(15, 23, 42, .025);
  }

  .bib-admin__table {
    width: 100%;

    min-width: 1080px;

    border-collapse:
      separate;

    border-spacing: 0;
  }

  .bib-admin__table th {
    padding:
      14px 13px;

    color:
      #52647e;

    background:
      #fff0df;

    border-bottom:
      1px solid
      rgba(241, 139, 75, .28);

    text-align: left;

    font-size: 10px;
    font-weight: 850;

    white-space: nowrap;
  }

  .bib-admin__table th:first-child {
    padding-left: 18px;
  }

  .bib-admin__table td {
    padding:
      13px;

    color:
      var(--app-text-secondary);

    background:
      var(--app-surface);

    border-bottom:
      1px solid
      var(--app-border-soft);

    vertical-align:
      middle;

    font-size: 10px;

    transition: none;
  }

  .bib-admin__table td:first-child {
    padding-left: 18px;
  }

  .bib-admin__table tbody tr:last-child td {
    border-bottom: 0;
  }

  /*
    Igual que la referencia de usuarios:
    fondo consistente, sin efecto fuerte.
  */

  .bib-admin__table tbody tr:nth-child(even) td {
    background:
      var(--app-surface);
  }

  .bib-admin__table tbody tr:hover td {
    background:
      var(--app-surface);
  }

  /* =====================================================
     RECURSO
  ===================================================== */

  .bib-admin__resource {
    min-width: 230px;

    display: flex;
    align-items: center;

    gap: 11px;
  }

  .table-avatar {
    width: 46px;
    height: 46px;

    display: grid;
    place-items: center;

    flex-shrink: 0;

    overflow: hidden;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 30%;

    color:
      var(
        --app-accent-dark,
        var(--app-accent-700)
      );

    background:
      var(
        --app-accent-soft,
        var(--app-accent-50)
      );

    font-size: 12px;
    font-weight: 850;
  }

  .table-avatar--small {
    width: 42px;
    height: 42px;
  }

  .bib-admin__resource > div,
  .bib-admin__author {
    display: flex;
    flex-direction: column;

    gap: 4px;
  }

  .bib-admin__resource strong,
  .bib-admin__author strong {
    color:
      var(--app-text);

    font-size: 11px;
    font-weight: 850;
  }

  .bib-admin__resource > div > span,
  .bib-admin__author span {
    color:
      var(--app-text-soft);

    font-size: 9px;
  }

  /* =====================================================
     BADGES
  ===================================================== */

  .bib-admin__category,
  .bib-admin__format {
    display: inline-flex;
    align-items: center;

    min-height: 24px;

    padding:
      3px 9px;

    border-radius: 999px;

    white-space: nowrap;

    font-size: 9px;
    font-weight: 800;
  }

  .bib-admin__category {
    color:
      var(--app-accent-700);

    background:
      var(--app-accent-50);

    border:
      1px solid
      var(--app-border);
  }

  .bib-admin__format {
    color: #475569;

    background: #f8fafc;

    border:
      1px solid #e2e8f0;
  }

  /* =====================================================
     ESTADO
  ===================================================== */

  .bib-admin__status {
    display: inline-flex;
    align-items: center;

    gap: 6px;

    min-height: 25px;

    padding:
      3px 10px;

    border-radius: 999px;

    white-space: nowrap;

    font-size: 9px;
    font-weight: 850;
  }

  .bib-admin__status i,
  .bib-admin__permission-status i {
    width: 6px;
    height: 6px;

    border-radius: 50%;
  }

  .bib-admin__status--publicado {
    color: #047857;

    background: #ecfdf5;

    border:
      1px solid #a7f3d0;
  }

  .bib-admin__status--publicado i {
    background: #10b981;
  }

  .bib-admin__status--borrador {
    color: #b45309;

    background: #fffbeb;

    border:
      1px solid #fde68a;
  }

  .bib-admin__status--borrador i {
    background: #f59e0b;
  }

  .bib-admin__status--archivado {
    color: #64748b;

    background: #f8fafc;

    border:
      1px solid #e2e8f0;
  }

  .bib-admin__status--archivado i {
    background: #94a3b8;
  }

  .bib-admin__date {
    white-space: nowrap;
  }

  .bib-admin__date strong {
    color:
      var(--app-text-secondary);

    font-size: 10px;
  }

  /* =====================================================
     ACCIONES
  ===================================================== */

  .bib-admin__actions {
    display: grid;

    grid-template-columns:
      repeat(2, minmax(86px, 1fr));

    gap: 6px;

    min-width: 190px;
  }

  .bib-admin__action-button {
    min-height: 34px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    gap: 6px;

    padding:
      0 10px;

    color:
      var(--app-accent-700);

    background: #fff;

    border:
      1px solid
      var(--app-border-strong);

    border-radius: 10px;

    text-decoration: none;

    white-space: nowrap;

    font: inherit;
    font-size: 9px;
    font-weight: 850;

    cursor: pointer;

    transition: none;
  }

  /*
    SIN cambio visual al hover.
  */

  .bib-admin__action-button:hover:not(:disabled) {
    color:
      var(--app-accent-700) !important;

    background:
      #fff !important;

    border-color:
      var(--app-border-strong) !important;

    box-shadow:
      none !important;

    transform:
      none !important;
  }

  .bib-admin__action-button--danger {
    color:
      #ef4444 !important;

    border-color:
      #fecaca;
  }

  .bib-admin__action-button--danger:hover:not(:disabled) {
    color:
      #ef4444 !important;

    background:
      #fff !important;

    border-color:
      #fecaca !important;
  }

  /* =====================================================
     PAGINACIÓN
  ===================================================== */

  .bib-admin__pagination {
    display: flex;
    align-items: center;
    justify-content: center;

    gap: 14px;

    margin-top: 17px;

    color:
      var(--app-text-secondary);

    font-size: 10px;
  }

  .bib-admin__pagination button {
    min-height: 36px;

    display: inline-flex;
    align-items: center;

    gap: 5px;

    padding:
      0 13px;

    color:
      var(--app-accent-700);

    background: #fff;

    border:
      1px solid
      var(--app-border);

    border-radius: 10px;

    font: inherit;
    font-size: 10px;
    font-weight: 800;

    cursor: pointer;

    transition: none;
  }

  .bib-admin__pagination button:hover:not(:disabled) {
    color:
      var(--app-accent-700);

    background: #fff;

    border-color:
      var(--app-border);

    box-shadow: none;
  }

  /* =====================================================
     TÍTULOS INTERNOS
  ===================================================== */

  .bib-admin__section-heading {
    display: flex;

    align-items:
      flex-start;

    justify-content:
      space-between;

    margin-bottom: 16px;
  }

  .bib-admin__section-heading span {
    color:
      var(--app-accent-700);

    font-size: 9px;
    font-weight: 900;

    letter-spacing: .12em;
  }

  .bib-admin__section-heading h2 {
    margin:
      4px 0 5px;

    color:
      var(--app-text);

    font-size: 20px;
  }

  .bib-admin__section-heading p {
    margin: 0;

    color:
      var(--app-text-secondary);

    font-size: 11px;
  }

  /* =====================================================
     REPORTES
  ===================================================== */

  .bib-admin__report-list {
    display: flex;
    flex-direction: column;

    gap: 10px;
  }

  /* =====================================================
     PERMISOS
  ===================================================== */

  .bib-admin__permission-add {
    display: grid;

    grid-template-columns:
      auto
      minmax(200px, 1fr)
      minmax(360px, auto);

    gap: 13px;

    align-items: center;

    padding: 15px;

    margin-bottom: 14px;

    background: #fffaf4;

    border:
      1px solid
      var(--app-border);

    border-radius: 14px;
  }

  .bib-admin__permission-icon {
    width: 46px;
    height: 46px;

    display: grid;
    place-items: center;

    color:
      var(--app-accent);

    background: #fff;

    border:
      1px solid
      var(--app-border);

    border-radius: 12px;
  }

  .bib-admin__permission-copy {
    display: flex;
    flex-direction: column;

    gap: 3px;
  }

  .bib-admin__permission-copy strong {
    color:
      var(--app-text);

    font-size: 12px;
  }

  .bib-admin__permission-copy span {
    color:
      var(--app-text-secondary);

    font-size: 10px;
  }

  .bib-admin__permission-add form {
    display: flex;
    align-items: center;

    gap: 8px;
  }

  .bib-admin__permission-add form select {
    min-width: 230px;
  }

  .bib-admin__permissions {
    display: flex;
    flex-direction: column;

    gap: 8px;
  }

  .bib-admin__permission-card {
    display: grid;

    grid-template-columns:
      auto
      minmax(220px, 1fr)
      auto
      auto;

    align-items: center;

    gap: 12px;

    padding: 11px 13px;

    background:
      var(--app-surface);

    border:
      1px solid
      var(--app-border-soft);

    border-radius: 12px;
  }

  .bib-admin__permission-person {
    display: flex;
    flex-direction: column;

    gap: 3px;
  }

  .bib-admin__permission-person strong {
    color:
      var(--app-text);

    font-size: 11px;
  }

  .bib-admin__permission-person span {
    color:
      var(--app-text-soft);

    font-size: 9px;
  }

  .bib-admin__permission-status {
    display: inline-flex;
    align-items: center;

    gap: 6px;

    color: #64748b;

    font-size: 9px;
    font-weight: 800;
  }

  .bib-admin__permission-status i {
    background: #94a3b8;
  }

  .bib-admin__permission-status.active {
    color: #047857;
  }

  .bib-admin__permission-status.active i {
    background: #10b981;
  }

  /* =====================================================
     HISTORIAL
  ===================================================== */

  .bib-admin__table--history {
    min-width: 800px;
  }

  .bib-admin__history-action {
    display: flex;
    align-items: center;

    gap: 9px;
  }

  .bib-admin__history-action > span {
    width: 34px;
    height: 34px;

    display: grid;
    place-items: center;

    color:
      var(--app-accent);

    background:
      var(--app-accent-50);

    border:
      1px solid
      var(--app-border);

    border-radius: 10px;
  }

  .bib-admin__history-action strong {
    color:
      var(--app-text);

    text-transform:
      capitalize;

    font-size: 10px;
  }

  .bib-admin__muted {
    color:
      var(--app-text-muted);

    font-size: 9px;
  }

  /* =====================================================
     ESTADOS VACÍOS
  ===================================================== */

  .bib-admin__empty {
    min-height: 150px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    gap: 9px;

    color:
      var(--app-text-soft);

    text-align: center;
  }

  .bib-admin__empty p {
    margin: 0;

    font-size: 11px;
  }

  .bib-admin__empty--error {
    color:
      var(--app-danger);
  }

  /* =====================================================
     MODAL CONFIRMACIÓN
  ===================================================== */

  .bib-admin-modal {
    position: fixed;

    z-index: 1000;

    inset: 0;

    display: grid;
    place-items: center;

    padding: 24px;

    background:
      rgba(15, 23, 42, .44);

    backdrop-filter:
      blur(3px);
  }

  .bib-admin-confirm {
    width:
      min(420px, 100%);

    padding: 24px;

    text-align: center;

    background:
      var(--app-surface);

    border:
      1px solid
      var(--app-border);

    border-radius: 18px;

    box-shadow:
      0 25px 70px
      rgba(15, 23, 42, .20);
  }

  .bib-admin-confirm__icon {
    width: 55px;
    height: 55px;

    display: grid;
    place-items: center;

    margin:
      0 auto 12px;

    color:
      var(--app-accent);

    background:
      var(--app-accent-50);

    border-radius: 15px;
  }

  .bib-admin-confirm__icon.danger {
    color: #dc2626;

    background: #fff1f2;
  }

  .bib-admin-confirm h2 {
    margin: 0;

    color:
      var(--app-text);

    font-size: 18px;
  }

  .bib-admin-confirm p {
    margin:
      8px auto 19px;

    color:
      var(--app-text-secondary);

    font-size: 11px;
    line-height: 1.55;
  }

  .bib-admin-confirm__actions {
    display: flex;
    justify-content: center;

    gap: 8px;
  }

  /* =====================================================
     RESPONSIVE
  ===================================================== */

  @media (max-width: 1100px) {
    .bib-admin__stats {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .bib-admin__toolbar {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .bib-admin__permission-add {
      grid-template-columns:
        auto 1fr;
    }

    .bib-admin__permission-add form {
      grid-column:
        1 / -1;
    }
  }

  @media (max-width: 720px) {
    .bib-admin__hero {
      align-items:
        flex-start;

      flex-wrap: wrap;
    }

    .bib-admin__hero-copy {
      width:
        calc(100% - 75px);
    }

    .bib-admin__stats,
    .bib-admin__toolbar {
      grid-template-columns:
        1fr;
    }

    .bib-admin__toolbar
      .bib-admin__primary {
      width: 100%;
    }

    .bib-admin__permission-add {
      grid-template-columns:
        1fr;
    }

    .bib-admin__permission-add form {
      grid-column: auto;

      align-items: stretch;

      flex-direction: column;
    }

    .bib-admin__permission-add form select {
      width: 100%;
      min-width: 0;
    }

    .bib-admin__permission-card {
      grid-template-columns:
        auto 1fr;
    }

    .bib-admin__permission-status,
    .bib-admin__permission-card
      .bib-admin__danger-button {
      grid-column: 2;

      justify-self:
        start;
    }

    .bib-admin-modal {
      padding: 10px;
    }
  }
`;