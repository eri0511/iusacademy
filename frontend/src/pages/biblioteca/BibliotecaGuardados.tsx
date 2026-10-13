import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bookmark,
  FolderHeart,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  mensajeError,
  useBiblioteca,
} from "../../contexts/BibliotecaContext";
import type {
  Coleccion,
  Recurso,
} from "../../types/biblioteca/biblioteca.types";
import { TarjetaRecurso } from "../../components/biblioteca/TarjetaRecurso";
type VistaFavoritos = "todos" | "colecciones" | "recientes";
type TonoColeccion = "orange" | "purple" | "blue" | "green" | "yellow" | "pink";
const TONOS_COLECCION: TonoColeccion[] = [
  "orange",
  "purple",
  "blue",
  "green",
  "yellow",
  "pink",
];
function tonoColeccion(id: number): TonoColeccion {
  return TONOS_COLECCION[Math.abs(id) % TONOS_COLECCION.length];
}
export default function BibliotecaGuardados() {
  const { api, base, avisar } = useBiblioteca();
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<VistaFavoritos>("todos");
  const [favoritos, setFavoritos] = useState<Recurso[]>([]);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [modalColeccion, setModalColeccion] = useState(false);
  const [nombreColeccion, setNombreColeccion] = useState("");
  const [editar, setEditar] = useState<number | null>(null);
  const [editarNombre, setEditarNombre] = useState("");
  const [menuColeccion, setMenuColeccion] = useState<number | null>(null);
  const [coleccionActiva, setColeccionActiva] = useState<number | null>(null);
  const [coleccionEliminar, setColeccionEliminar] = useState<Coleccion | null>(null);
  const cargar = useCallback(async () => {
    try {
      const [respuestaFavoritos, respuestaColecciones] = await Promise.all([
        api.get<{ recurso: Recurso }[]>("/favoritos"),
        api.get<Coleccion[]>("/colecciones"),
      ]);
      setFavoritos(
        respuestaFavoritos.map((item) => ({
          ...item.recurso,
          esFavorito: true,
        })),
      );
      setColecciones(respuestaColecciones);
      setError("");
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [api]);
  useEffect(() => {
    void cargar();
  }, [cargar]);
  async function accion(fn: () => Promise<unknown>) {
    setOcupado(true);
    try {
      await fn();
      await cargar();
    } catch (e) {
      avisar(mensajeError(e), true);
    } finally {
      setOcupado(false);
    }
  }
  const textoBusqueda = busqueda.trim().toLocaleLowerCase("es");
  const favoritosFiltrados = useMemo(() => {
    const lista = favoritos.filter((recurso) => {
      if (!textoBusqueda) return true;
      return `${recurso.titulo} ${recurso.tema} ${
        recurso.autorInstitucion ?? ""
      }`
        .toLocaleLowerCase("es")
        .includes(textoBusqueda);
    });
    if (vista === "recientes") {
      return [...lista].sort(
        (a, b) =>
          new Date(b.actualizadoEn).getTime() -
          new Date(a.actualizadoEn).getTime(),
      );
    }
    return lista;
  }, [favoritos, textoBusqueda, vista]);
  const coleccionesFiltradas = useMemo(() => {
    if (!textoBusqueda) return colecciones;
    return colecciones.filter((coleccion) => {
      const recursos = coleccion.recursos
        .map(({ recurso }) => recurso.titulo)
        .join(" ");
      return `${coleccion.nombre} ${
        coleccion.descripcion ?? ""
      } ${recursos}`
        .toLocaleLowerCase("es")
        .includes(textoBusqueda);
    });
  }, [colecciones, textoBusqueda]);
  const coleccionSeleccionada =
    coleccionActiva === null
      ? null
      : colecciones.find(
          (coleccion) => coleccion.id === coleccionActiva,
        ) ?? null;
  function abrirCrearColeccion() {
    setNombreColeccion("");
    setModalColeccion(true);
    setMenuColeccion(null);
  }
  function cerrarCrearColeccion() {
    if (ocupado) return;
    setModalColeccion(false);
    setNombreColeccion("");
  }
  function comenzarEdicion(coleccion: Coleccion) {
    setEditar(coleccion.id);
    setEditarNombre(coleccion.nombre);
    setMenuColeccion(null);
  }
  async function crearColeccion() {
    const nombre = nombreColeccion.trim();
    if (nombre.length < 2) return;
    await accion(async () => {
      await api.send("/colecciones", "POST", { nombre });
      setModalColeccion(false);
      setNombreColeccion("");
    });
  }
  async function guardarNombreColeccion(coleccion: Coleccion) {
    const nombre = editarNombre.trim();
    if (nombre.length < 2) return;
    await accion(async () => {
      await api.send(`/colecciones/${coleccion.id}`, "PATCH", {
        nombre,
        descripcion: coleccion.descripcion ?? "",
      });
      setEditar(null);
      setEditarNombre("");
    });
  }
  function solicitarEliminarColeccion(coleccion: Coleccion) {
    setColeccionEliminar(coleccion);
    setMenuColeccion(null);
  }
  async function confirmarEliminarColeccion() {
    if (!coleccionEliminar) return;
    const id = coleccionEliminar.id;
    await accion(async () => {
      await api.send(`/colecciones/${id}`, "DELETE");
      if (coleccionActiva === id) {
        setColeccionActiva(null);
      }
      setColeccionEliminar(null);
      setMenuColeccion(null);
    });
  }
  function seleccionarColeccion(id: number) {
    setVista("colecciones");
    setColeccionActiva(id);
    setBusqueda("");
  }
  return (
    <>
      <div className="bib-guardados">
        {/* HEADER */}
        <header className="bib-guardados__header">
          <div className="bib-guardados__icono">
            <FolderHeart size={26} strokeWidth={1.9} />
          </div>
          <div>
            <h1>Mis favoritos</h1>
            <p>
              Organiza y consulta los recursos que has guardado en la
              biblioteca.
            </p>
          </div>
        </header>
        {/* FILTROS */}
        <section className="bib-guardados__controles">
          <div
            className="bib-guardados__tabs"
            role="tablist"
            aria-label="Filtrar favoritos"
          >
            <button
              type="button"
              className={vista === "todos" ? "activo" : ""}
              onClick={() => {
                setVista("todos");
                setColeccionActiva(null);
              }}
            >
              Todos
              <span>{favoritos.length}</span>
            </button>
            <button
              type="button"
              className={vista === "colecciones" ? "activo" : ""}
              onClick={() => setVista("colecciones")}
            >
              Mis colecciones
              <span>{colecciones.length}</span>
            </button>
            <button
              type="button"
              className={vista === "recientes" ? "activo" : ""}
              onClick={() => {
                setVista("recientes");
                setColeccionActiva(null);
              }}
            >
              Recientes
            </button>
          </div>
          <div className="bib-guardados__acciones-superiores">
            <label className="bib-guardados__buscador">
              <Search size={18} strokeWidth={1.8} />
              <input
                type="search"
                aria-label={
                  vista === "colecciones"
                    ? "Buscar en mis colecciones"
                    : "Buscar en mis favoritos"
                }
                placeholder={
                  vista === "colecciones"
                    ? "Buscar en mis colecciones..."
                    : "Buscar en mis favoritos..."
                }
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="bib-guardados__crear"
              onClick={abrirCrearColeccion}
            >
              <Plus size={18} strokeWidth={2} />
              Crear colección
            </button>
          </div>
        </section>
        {/* ERROR */}
        {error && (
          <div className="bib-guardados__estado" role="alert">
            <FolderHeart size={30} />
            <strong>No pudimos cargar tus guardados</strong>
            <p>{error}</p>
            <button type="button" onClick={() => void cargar()}>
              Reintentar
            </button>
          </div>
        )}
        {/* TODOS */}
        {!error && vista === "todos" && (
          <main className="bib-guardados__contenido">
            {/* COLECCIONES DESTACADAS */}
            <section className="bib-guardados__bloque">
              <div className="bib-guardados__titulo-seccion">
                <div>
                  <h2>Mis colecciones</h2>
                  <p>
                    Organiza tus recursos favoritos en listas personales.
                  </p>
                </div>
                {colecciones.length > 0 && (
                  <button
                    type="button"
                    className="bib-guardados__ver-todas"
                    onClick={() => setVista("colecciones")}
                  >
                    Ver todas
                  </button>
                )}
              </div>
              {cargando ? (
                <div className="bib-guardados__colecciones-resumen">
                  {[1, 2, 3].map((item) => (
                    <div
                      className="bib-guardados__skeleton bib-guardados__skeleton--coleccion"
                      key={item}
                    />
                  ))}
                </div>
              ) : colecciones.length ? (
                <div className="bib-guardados__colecciones-resumen">
                  <button
                    type="button"
                    className="bib-coleccion-resumen bib-coleccion-resumen--todos"
                    onClick={() => {
                      setVista("todos");
                      setColeccionActiva(null);
                    }}
                  >
                    <span className="bib-coleccion-resumen__icono">
                      <FolderHeart size={26} strokeWidth={1.8} />
                    </span>
                    <span className="bib-coleccion-resumen__info">
                      <strong>Todos mis favoritos</strong>
                      <small>
                        {favoritos.length}{" "}
                        {favoritos.length === 1
                          ? "recurso"
                          : "recursos"}
                      </small>
                      <em>Todos tus recursos guardados</em>
                    </span>
                  </button>
                  {colecciones.slice(0, 4).map((coleccion) => (
                    <button
                      type="button"
                      className={`bib-coleccion-resumen tone-${tonoColeccion(coleccion.id)}`}
                      key={coleccion.id}
                      onClick={() =>
                        seleccionarColeccion(coleccion.id)
                      }
                    >
                      <span className="bib-coleccion-resumen__icono">
                        <FolderHeart size={26} strokeWidth={1.8} />
                      </span>
                      <span className="bib-coleccion-resumen__info">
                        <strong>{coleccion.nombre}</strong>
                        <small>
                          {coleccion.recursos.length}{" "}
                          {coleccion.recursos.length === 1
                            ? "recurso"
                            : "recursos"}
                        </small>
                        <em>
                          {coleccion.descripcion?.trim() ||
                            "Colección personal"}
                        </em>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  className="bib-guardados__coleccion-vacia"
                  onClick={abrirCrearColeccion}
                >
                  <span>
                    <Plus size={20} />
                  </span>
                  <div>
                    <strong>Crea tu primera colección</strong>
                    <small>
                      Organiza tus recursos por materia, proyecto o tema.
                    </small>
                  </div>
                </button>
              )}
            </section>
            {/* FAVORITOS */}
            <section className="bib-guardados__bloque">
              <div className="bib-guardados__titulo-seccion">
                <div>
                  <h2>Todos mis favoritos</h2>
                  <p>
                    {favoritos.length}{" "}
                    {favoritos.length === 1
                      ? "recurso guardado"
                      : "recursos guardados"}
                    .
                  </p>
                </div>
              </div>
              {cargando ? (
                <div className="bib-guardados__recursos-grid">
                  {[1, 2, 3].map((item) => (
                    <div
                      className="bib-guardados__skeleton recurso"
                      key={item}
                    />
                  ))}
                </div>
              ) : favoritosFiltrados.length ? (
                <div className="bib-guardados__recursos-grid">
                  {favoritosFiltrados.map((recurso) => (
                    <TarjetaRecurso
                      key={recurso.id}
                      recurso={recurso}
                      alGuardar={() => void cargar()}
                      compacta
                    />
                  ))}
                </div>
              ) : (
                <div className="bib-guardados__estado">
                  <Bookmark size={32} />
                  <strong>
                    {busqueda
                      ? "No encontramos favoritos"
                      : "Todavía no tienes favoritos"}
                  </strong>
                  <p>
                    {busqueda
                      ? "Prueba con otro título, tema o autor."
                      : "Marca con el corazón los recursos que quieras consultar después."}
                  </p>
                  {!busqueda && (
                    <Link to={base}>Explorar biblioteca</Link>
                  )}
                </div>
              )}
            </section>
          </main>
        )}
        {/* COLECCIONES */}
        {!error && vista === "colecciones" && (
          <main className="bib-guardados__contenido">
            <div className="bib-guardados__titulo-seccion">
              <div>
                <h2>Mis colecciones</h2>
                <p>
                  Organiza tus recursos en listas personales.
                </p>
              </div>
              <span>
                {colecciones.length}{" "}
                {colecciones.length === 1
                  ? "colección"
                  : "colecciones"}
              </span>
            </div>
            {cargando ? (
              <div className="bib-guardados__colecciones-grid">
                {[1, 2, 3].map((item) => (
                  <div
                    className="bib-guardados__skeleton"
                    key={item}
                  />
                ))}
              </div>
            ) : coleccionesFiltradas.length ? (
              <div className="bib-guardados__colecciones-grid">
                {coleccionesFiltradas.map((coleccion) => (
                  <article
                    className={`bib-coleccion-card tone-${tonoColeccion(coleccion.id)} ${
                      coleccionActiva === coleccion.id
                        ? "activa"
                        : ""
                    }`}
                    key={coleccion.id}
                  >
                    <button
                      type="button"
                      className="bib-coleccion-card__principal"
                      onClick={() =>
                        setColeccionActiva(coleccion.id)
                      }
                    >
                      <span className="bib-coleccion-card__icono">
                        <FolderHeart
                          size={27}
                          strokeWidth={1.8}
                        />
                      </span>
                      <span className="bib-coleccion-card__info">
                        <strong>{coleccion.nombre}</strong>
                        <small>
                          {coleccion.recursos.length}{" "}
                          {coleccion.recursos.length === 1
                            ? "recurso"
                            : "recursos"}
                        </small>
                        <em>
                          {coleccion.descripcion?.trim() ||
                            "Colección personal"}
                        </em>
                      </span>
                    </button>
                    <div className="bib-coleccion-card__menu-wrap">
                      <button
                        type="button"
                        className="bib-coleccion-card__menu"
                        aria-label={`Opciones de ${coleccion.nombre}`}
                        onClick={() =>
                          setMenuColeccion((actual) =>
                            actual === coleccion.id
                              ? null
                              : coleccion.id,
                          )
                        }
                      >
                        <MoreVertical size={18} />
                      </button>
                      {menuColeccion === coleccion.id && (
                        <div className="bib-coleccion-card__popover">
                          <button
                            type="button"
                            onClick={() =>
                              comenzarEdicion(coleccion)
                            }
                          >
                            <Pencil size={15} />
                            Renombrar
                          </button>
                          <button
                            type="button"
                            className="peligro"
                            onClick={() =>
                              solicitarEliminarColeccion(coleccion)
                            }
                            disabled={ocupado}
                          >
                            <Trash2 size={15} />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bib-guardados__estado">
                <FolderHeart size={32} />
                <strong>
                  {busqueda
                    ? "No encontramos colecciones"
                    : "Todavía no tienes colecciones"}
                </strong>
                <p>
                  {busqueda
                    ? "Prueba con otro nombre o término de búsqueda."
                    : "Crea una colección para organizar tus recursos favoritos."}
                </p>
                {!busqueda && (
                  <button
                    type="button"
                    onClick={abrirCrearColeccion}
                  >
                    <Plus size={17} />
                    Crear colección
                  </button>
                )}
              </div>
            )}
            {coleccionSeleccionada && (
              <section className="bib-guardados__coleccion-detalle">
                <div className="bib-guardados__titulo-seccion">
                  <div>
                    <h2>{coleccionSeleccionada.nombre}</h2>
                    <p>
                      {coleccionSeleccionada.recursos.length}{" "}
                      {coleccionSeleccionada.recursos.length === 1
                        ? "recurso guardado"
                        : "recursos guardados"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="bib-guardados__cerrar-detalle"
                    onClick={() => setColeccionActiva(null)}
                  >
                    <X size={17} />
                    Cerrar
                  </button>
                </div>
                {coleccionSeleccionada.recursos.length ? (
                  <div className="bib-guardados__recursos-grid">
                    {coleccionSeleccionada.recursos.map(({ recurso }) => (
                      <TarjetaRecurso
                        key={recurso.id}
                        recurso={recurso}
                        alGuardar={() => void cargar()}
                        compacta
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bib-guardados__estado bib-guardados__estado--pequeno">
                    <Bookmark size={27} />
                    <strong>
                      Esta colección está vacía
                    </strong>
                    <p>
                      Guarda recursos desde la biblioteca para
                      verlos aquí.
                    </p>
                    <Link to={base}>
                      Explorar biblioteca
                    </Link>
                  </div>
                )}
              </section>
            )}
          </main>
        )}
        {/* RECIENTES */}
        {!error && vista === "recientes" && (
          <main className="bib-guardados__contenido">
            <div className="bib-guardados__titulo-seccion">
              <div>
                <h2>Guardados recientemente</h2>
                <p>
                  Tus recursos favoritos ordenados por actividad
                  reciente.
                </p>
              </div>
            </div>
            {cargando ? (
              <div className="bib-guardados__recursos-grid">
                {[1, 2, 3].map((item) => (
                  <div
                    className="bib-guardados__skeleton recurso"
                    key={item}
                  />
                ))}
              </div>
            ) : favoritosFiltrados.length ? (
              <div className="bib-guardados__recursos-grid">
                {favoritosFiltrados.map((recurso) => (
                  <TarjetaRecurso
                    key={recurso.id}
                    recurso={recurso}
                    alGuardar={() => void cargar()}
                    compacta
                  />
                ))}
              </div>
            ) : (
              <div className="bib-guardados__estado">
                <Bookmark size={32} />
                <strong>No encontramos favoritos</strong>
                <p>
                  No existen recursos que coincidan con la
                  búsqueda.
                </p>
              </div>
            )}
          </main>
        )}
      </div>
      {/* MODAL CREAR COLECCIÓN */}
      {modalColeccion && (
        <div
          className="bib-guardados-modal"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarCrearColeccion();
            }
          }}
        >
          <section
            className="bib-guardados-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-crear-coleccion"
          >
            <div className="bib-guardados-modal__cabecera">
              <div>
                <span className="bib-guardados-modal__icono">
                  <FolderHeart size={22} />
                </span>
                <div>
                  <h2 id="titulo-crear-coleccion">
                    Nueva colección
                  </h2>
                  <p>
                    Crea una lista para organizar tus recursos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={cerrarCrearColeccion}
              >
                <X size={19} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void crearColeccion();
              }}
            >
              <label>
                Nombre de la colección
                <input
                  autoFocus
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Ej.: Para mi proyecto"
                  value={nombreColeccion}
                  onChange={(e) =>
                    setNombreColeccion(e.target.value)
                  }
                />
              </label>
              <div className="bib-guardados-modal__acciones">
                <button
                  type="button"
                  className="secundario"
                  onClick={cerrarCrearColeccion}
                  disabled={ocupado}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primario"
                  disabled={ocupado}
                >
                  <Plus size={17} />
                  {ocupado
                    ? "Creando..."
                    : "Crear colección"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {/* MODAL RENOMBRAR COLECCIÓN */}
      {editar !== null && (() => {
        const coleccion = colecciones.find((item) => item.id === editar);
        if (!coleccion) return null;
        return (
          <div
            className="bib-guardados-modal"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !ocupado) {
                setEditar(null);
                setEditarNombre("");
              }
            }}
          >
            <section
              className="bib-guardados-modal__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-renombrar-coleccion"
            >
              <div className="bib-guardados-modal__cabecera">
                <div>
                  <span className="bib-guardados-modal__icono">
                    <Pencil size={21} />
                  </span>
                  <div>
                    <h2 id="titulo-renombrar-coleccion">Renombrar colección</h2>
                    <p>Cambia el nombre sin modificar los recursos guardados.</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar"
                  disabled={ocupado}
                  onClick={() => {
                    setEditar(null);
                    setEditarNombre("");
                  }}
                >
                  <X size={19} />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void guardarNombreColeccion(coleccion);
                }}
              >
                <label>
                  Nombre de la colección
                  <input
                    autoFocus
                    required
                    minLength={2}
                    maxLength={100}
                    value={editarNombre}
                    onChange={(e) => setEditarNombre(e.target.value)}
                  />
                </label>
                <div className="bib-guardados-modal__acciones">
                  <button
                    type="button"
                    className="secundario"
                    disabled={ocupado}
                    onClick={() => {
                      setEditar(null);
                      setEditarNombre("");
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="primario"
                    disabled={ocupado || editarNombre.trim().length < 2}
                  >
                    <Pencil size={16} />
                    {ocupado ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        );
      })()}
      {/* MODAL ELIMINAR COLECCIÓN */}
      {coleccionEliminar && (
        <div
          className="bib-guardados-modal"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !ocupado) {
              setColeccionEliminar(null);
            }
          }}
        >
          <section
            className="bib-guardados-modal__panel"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-eliminar-coleccion"
          >
            <div className="bib-guardados-modal__cabecera">
              <div>
                <span className="bib-guardados-modal__icono bib-guardados-modal__icono--peligro">
                  <AlertTriangle size={22} />
                </span>
                <div>
                  <h2 id="titulo-eliminar-coleccion">Eliminar colección</h2>
                  <p>Los recursos seguirán disponibles en la biblioteca.</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                disabled={ocupado}
                onClick={() => setColeccionEliminar(null)}
              >
                <X size={19} />
              </button>
            </div>
            <div className="bib-guardados-modal__confirmacion">
              <p>
                ¿Deseas eliminar la colección{" "}
                <strong>“{coleccionEliminar.nombre}”</strong>?
              </p>
              <div className="bib-guardados-modal__acciones">
                <button
                  type="button"
                  className="secundario"
                  disabled={ocupado}
                  onClick={() => setColeccionEliminar(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="peligro"
                  disabled={ocupado}
                  onClick={() => void confirmarEliminarColeccion()}
                >
                  <Trash2 size={16} />
                  {ocupado ? "Eliminando..." : "Eliminar colección"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      <style>{bibliotecaGuardadosStyles}</style>
    </>
  );
}
const bibliotecaGuardadosStyles = `
  .bib-guardados {
    width: 100%;
    min-width: 0;
    display: grid;
    gap: 18px;
  }
  /\* =========================
     HEADER
     ========================= \*/
  .bib-guardados__header {
    min-height: 96px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border);
    border-radius: 20px;
    box-shadow: var(--app-shadow-sm);
  }
  .bib-guardados__header h1,
  .bib-guardados__header p,
  .bib-guardados__titulo-seccion h2,
  .bib-guardados__titulo-seccion p {
    margin: 0;
  }
  .bib-guardados__header h1 {
    color: var(--app-text);
    font-size: clamp(22px, 2vw, 28px);
    font-weight: 850;
    line-height: 1.15;
  }
  .bib-guardados__header p {
    margin-top: 6px;
    color: var(--app-text-secondary);
    font-size: 13px;
    line-height: 1.45;
  }
  .bib-guardados__icono {
    width: 50px;
    height: 50px;
    display: grid;
    flex: 0 0 50px;
    place-items: center;
    color: var(--app-accent);
    background: var(--app-accent-50);
    border: 1px solid var(--app-border-strong);
    border-radius: 15px;
  }
  /\* =========================
     CONTROLES
     ========================= \*/
  .bib-guardados__controles {
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border-soft);
    border-radius: 17px;
    box-shadow: var(--app-shadow-sm);
  }
  .bib-guardados__tabs,
  .bib-guardados__acciones-superiores {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .bib-guardados__tabs button {
    min-height: 42px;
    padding: 0 17px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    font: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: 150ms ease;
  }
  .bib-guardados__tabs button:hover {
    color: var(--app-accent-700);
    border-color: var(--app-border-strong);
  }
  .bib-guardados__tabs button.activo {
    color: #fff;
    background: var(--app-accent);
    border-color: var(--app-accent);
    box-shadow: var(--app-shadow-sm);
  }
  /\* CONTADOR SIN CÍRCULO \*/
  .bib-guardados__tabs button span {
    min-width: auto;
    height: auto;
    padding: 0;
    display: inline;
    color: inherit;
    background: transparent;
    border-radius: 0;
    font-size: 10px;
    font-weight: 850;
    opacity: 0.82;
  }
  .bib-guardados__buscador {
    width: min(360px, 30vw);
    min-width: 220px;
    height: 42px;
    padding: 0 13px;
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--app-text-muted);
    background: var(--app-surface);
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
    transition: 150ms ease;
  }
  .bib-guardados__buscador:focus-within {
    color: var(--app-accent);
    border-color: var(--app-border-strong);
    box-shadow: 0 0 0 3px var(--app-accent-50);
  }
  .bib-guardados__buscador input {
    width: 100%;
    min-width: 0;
    color: var(--app-text);
    background: transparent;
    border: 0;
    outline: 0;
    font: inherit;
    font-size: 12px;
  }
  .bib-guardados__buscador input::placeholder {
    color: var(--app-text-muted);
  }
  .bib-guardados__crear {
    height: 42px;
    padding: 0 17px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: #fff;
    background: var(--app-accent);
    border: 0;
    border-radius: 12px;
    box-shadow: var(--app-shadow-sm);
    font: inherit;
    font-size: 11.5px;
    font-weight: 850;
    white-space: nowrap;
    cursor: pointer;
    transition: 150ms ease;
  }
  .bib-guardados__crear:hover {
    background: var(--app-accent-600);
    transform: translateY(-1px);
  }
  /\* =========================
     CONTENIDO
     ========================= \*/
  .bib-guardados__contenido {
    min-width: 0;
    display: grid;
    gap: 24px;
  }
  .bib-guardados__bloque {
    min-width: 0;
    display: grid;
    gap: 12px;
  }
  .bib-guardados__titulo-seccion {
    min-height: 48px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }
  .bib-guardados__titulo-seccion h2 {
    color: var(--app-text);
    font-size: 19px;
    font-weight: 850;
    line-height: 1.2;
  }
  .bib-guardados__titulo-seccion p,
  .bib-guardados__titulo-seccion > span {
    margin-top: 4px;
    color: var(--app-text-soft);
    font-size: 11px;
    font-weight: 600;
  }
  .bib-guardados__ver-todas {
    padding: 7px 10px;
    color: var(--app-accent-700);
    background: transparent;
    border: 0;
    border-radius: 9px;
    font: inherit;
    font-size: 10.5px;
    font-weight: 850;
    cursor: pointer;
  }
  .bib-guardados__ver-todas:hover {
    background: var(--app-accent-50);
  }
  /\* =========================
     COLECCIONES RESUMEN
     ========================= \*/
  .bib-guardados__colecciones-resumen {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 10px;
  }
  .bib-coleccion-resumen {
    min-width: 0;
    min-height: 96px;
    padding: 14px;
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr);
    align-items: center;
    gap: 11px;
    text-align: left;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border-soft);
    border-radius: 15px;
    font: inherit;
    cursor: pointer;
    transition: 160ms ease;
  }
  .bib-coleccion-resumen:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow-sm);
  }
  .bib-coleccion-resumen__icono {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    color: var(--app-accent-700);
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.88);
    border-radius: 13px;
  }
  .bib-coleccion-resumen__info {
    min-width: 0;
    display: grid;
    gap: 3px;
  }
  .bib-coleccion-resumen__info strong {
    overflow: hidden;
    color: var(--app-text);
    font-size: 11.5px;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bib-coleccion-resumen__info small {
    color: var(--app-text-secondary);
    font-size: 9.5px;
    font-weight: 700;
  }
  .bib-coleccion-resumen__info em {
    overflow: hidden;
    color: var(--app-text-soft);
    font-size: 9px;
    font-style: normal;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bib-coleccion-resumen--todos {
    background: #fff5ec;
    border-color: rgba(241, 139, 75, 0.38);
  }
  .bib-coleccion-resumen.tone-orange,
  .bib-coleccion-card.tone-orange {
    --coleccion-color: #e86f27;
    --coleccion-bg: #fff0e5;
    --coleccion-border: #f7cfb5;
  }
  .bib-coleccion-resumen.tone-purple,
  .bib-coleccion-card.tone-purple {
    --coleccion-color: #7c3aed;
    --coleccion-bg: #f3edff;
    --coleccion-border: #ddcffb;
  }
  .bib-coleccion-resumen.tone-blue,
  .bib-coleccion-card.tone-blue {
    --coleccion-color: #2f7de1;
    --coleccion-bg: #eaf4ff;
    --coleccion-border: #c9defa;
  }
  .bib-coleccion-resumen.tone-green,
  .bib-coleccion-card.tone-green {
    --coleccion-color: #20a567;
    --coleccion-bg: #eafaef;
    --coleccion-border: #c9ecd1;
  }
  .bib-coleccion-resumen.tone-yellow,
  .bib-coleccion-card.tone-yellow {
    --coleccion-color: #d87908;
    --coleccion-bg: #fff7df;
    --coleccion-border: #f5dfab;
  }
  .bib-coleccion-resumen.tone-pink,
  .bib-coleccion-card.tone-pink {
    --coleccion-color: #dc2d60;
    --coleccion-bg: #ffedf2;
    --coleccion-border: #f8cad7;
  }
  .bib-coleccion-resumen[class\*="tone-"] {
    background: var(--coleccion-bg);
    border-color: var(--coleccion-border);
  }
  .bib-coleccion-resumen[class\*="tone-"] .bib-coleccion-resumen__icono {
    color: var(--coleccion-color);
    background: rgba(255, 255, 255, 0.72);
    border-color: rgba(255, 255, 255, 0.9);
  }
  .bib-coleccion-resumen--nueva {
    background: var(--app-surface);
    border-style: dashed;
    border-color: var(--app-border-strong);
  }
  .bib-coleccion-resumen--nueva .bib-coleccion-resumen__icono {
    color: var(--app-accent);
    background: var(--app-accent-50);
    border-color: var(--app-border);
  }
  .bib-guardados__coleccion-vacia {
    width: 100%;
    min-height: 88px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--app-text-secondary);
    text-align: left;
    background: var(--app-surface-raised);
    border: 1px dashed var(--app-border-strong);
    border-radius: 15px;
    font: inherit;
    cursor: pointer;
  }
  .bib-guardados__coleccion-vacia > span {
    width: 42px;
    height: 42px;
    display: grid;
    flex: 0 0 42px;
    place-items: center;
    color: var(--app-accent);
    background: var(--app-accent-50);
    border-radius: 12px;
  }
  .bib-guardados__coleccion-vacia div {
    display: grid;
    gap: 3px;
  }
  .bib-guardados__coleccion-vacia strong {
    color: var(--app-text);
    font-size: 11.5px;
  }
  .bib-guardados__coleccion-vacia small {
    color: var(--app-text-soft);
    font-size: 9.5px;
  }
  /\* =========================
     COLECCIONES COMPLETAS
     ========================= \*/
  .bib-guardados__colecciones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
    gap: 12px;
  }
  .bib-coleccion-card {
    position: relative;
    min-width: 0;
    min-height: 118px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 34px;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border);
    border-radius: 17px;
    box-shadow: var(--app-shadow-sm);
    transition: 150ms ease;
  }
  .bib-coleccion-card[class\*="tone-"] {
    background: var(--coleccion-bg);
    border-color: var(--coleccion-border);
  }
  .bib-coleccion-card[class\*="tone-"] .bib-coleccion-card__icono {
    color: var(--coleccion-color);
    background: rgba(255, 255, 255, 0.72);
    border-color: rgba(255, 255, 255, 0.9);
  }
  .bib-coleccion-card[class\*="tone-"].activa {
    background: var(--coleccion-bg);
    border-color: var(--coleccion-color);
  }
  .bib-coleccion-card:hover,
  .bib-coleccion-card.activa {
    border-color: var(--app-border-strong);
    box-shadow: var(--app-shadow);
    transform: translateY(-2px);
  }
  .bib-coleccion-card.activa:not([class\*="tone-"]) {
    background: var(--app-accent-50);
  }
  .bib-coleccion-card__principal {
    min-width: 0;
    padding: 17px 8px 17px 17px;
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    align-items: center;
    gap: 13px;
    text-align: left;
    background: transparent;
    border: 0;
    font: inherit;
    cursor: pointer;
  }
  .bib-coleccion-card__icono {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    color: var(--app-accent-700);
    background: var(--app-accent-50);
    border: 1px solid var(--app-border);
    border-radius: 14px;
  }
  .bib-coleccion-card.activa .bib-coleccion-card__icono {
    background: var(--app-surface-raised);
  }
  .bib-coleccion-card__info {
    min-width: 0;
    display: grid;
    gap: 4px;
  }
  .bib-coleccion-card__info strong {
    overflow: hidden;
    color: var(--app-text);
    font-size: 12.5px;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bib-coleccion-card__info small {
    color: var(--app-text-secondary);
    font-size: 10px;
    font-weight: 700;
  }
  .bib-coleccion-card__info em {
    overflow: hidden;
    color: var(--app-text-soft);
    font-size: 9.5px;
    font-style: normal;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bib-coleccion-card__menu-wrap {
    position: relative;
    padding-top: 10px;
  }
  .bib-coleccion-card__menu {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    color: var(--app-text-soft);
    background: transparent;
    border: 0;
    border-radius: 9px;
    cursor: pointer;
  }
  .bib-coleccion-card__menu:hover {
    color: var(--app-accent-700);
    background: var(--app-accent-50);
  }
  .bib-coleccion-card__popover {
    position: absolute;
    z-index: 15;
    top: 42px;
    right: 8px;
    width: 145px;
    padding: 6px;
    display: grid;
    gap: 3px;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border-soft);
    border-radius: 11px;
    box-shadow: var(--app-shadow);
  }
  .bib-coleccion-card__popover button {
    min-height: 34px;
    padding: 0 9px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--app-text-secondary);
    background: transparent;
    border: 0;
    border-radius: 8px;
    font: inherit;
    font-size: 10.5px;
    font-weight: 750;
    cursor: pointer;
  }
  .bib-coleccion-card__popover button:hover {
    background: var(--app-surface-alt);
  }
  .bib-coleccion-card__popover button.peligro {
    color: var(--app-danger);
  }
  /\* =========================
     RECURSOS
     ========================= \*/
  .bib-guardados__recursos-grid {
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: stretch;
    gap: 14px;
  }
  /\* =========================
     DETALLE COLECCIÓN
     ========================= \*/
  .bib-guardados__coleccion-detalle {
    margin-top: 6px;
    padding: 18px;
    display: grid;
    gap: 14px;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border);
    border-radius: 18px;
    box-shadow: var(--app-shadow-sm);
  }
  .bib-guardados__cerrar-detalle {
    min-height: 36px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    border: 1px solid var(--app-border-soft);
    border-radius: 10px;
    font: inherit;
    font-size: 10.5px;
    font-weight: 800;
    cursor: pointer;
  }
  .bib-guardados__lista-coleccion {
    display: grid;
    gap: 8px;
  }
  .bib-guardados__recurso-coleccion {
    min-width: 0;
    padding: 12px 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    background: var(--app-surface);
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
  }
  .bib-guardados__recurso-coleccion > div {
    min-width: 0;
    display: grid;
    gap: 3px;
  }
  .bib-guardados__recurso-coleccion a {
    overflow: hidden;
    color: var(--app-text);
    font-size: 11.5px;
    font-weight: 800;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bib-guardados__recurso-coleccion a:hover {
    color: var(--app-accent-700);
  }
  .bib-guardados__recurso-coleccion span {
    color: var(--app-text-soft);
    font-size: 9.5px;
  }
  .bib-guardados__recurso-coleccion button {
    padding: 7px 10px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
    border: 1px solid var(--app-danger-border);
    border-radius: 9px;
    font: inherit;
    font-size: 9.5px;
    font-weight: 800;
    cursor: pointer;
  }
  .bib-guardados__editar {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .bib-guardados__editar input {
    min-width: 0;
    flex: 1;
    height: 39px;
    padding: 0 12px;
    color: var(--app-text);
    background: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: 10px;
    outline: 0;
    font: inherit;
    font-size: 11px;
  }
  .bib-guardados__editar button,
  .bib-guardados__estado button,
  .bib-guardados__estado a {
    min-height: 38px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #fff;
    background: var(--app-accent);
    border: 0;
    border-radius: 10px;
    font: inherit;
    font-size: 10.5px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
  }
  .bib-guardados__editar button.secundario {
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    border: 1px solid var(--app-border-soft);
  }
  /\* =========================
     ESTADOS
     ========================= \*/
  .bib-guardados__estado {
    min-height: 220px;
    padding: 28px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 8px;
    color: var(--app-text-soft);
    text-align: center;
    background: var(--app-surface-raised);
    border: 1px dashed var(--app-border-strong);
    border-radius: 18px;
  }
  .bib-guardados__estado svg {
    color: var(--app-accent);
  }
  .bib-guardados__estado strong {
    color: var(--app-text);
    font-size: 13px;
  }
  .bib-guardados__estado p {
    max-width: 440px;
    margin: 0 0 5px;
    color: var(--app-text-soft);
    font-size: 10.5px;
    line-height: 1.5;
  }
  .bib-guardados__estado--pequeno {
    min-height: 170px;
  }
  /\* =========================
     SKELETON
     ========================= \*/
  .bib-guardados__skeleton {
    min-height: 118px;
    border-radius: 17px;
    background:
      linear-gradient(
        90deg,
        var(--app-surface-alt) 25%,
        var(--app-surface-raised) 50%,
        var(--app-surface-alt) 75%
      );
    background-size: 200% 100%;
    animation: bib-guardados-cargando 1.25s infinite;
  }
  .bib-guardados__skeleton--coleccion {
    min-height: 96px;
    border-radius: 15px;
  }
  .bib-guardados__skeleton.recurso {
    min-height: 250px;
  }
  @keyframes bib-guardados-cargando {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
  /\* =========================
     MODAL
     ========================= \*/
  .bib-guardados-modal {
    position: fixed;
    z-index: 1000;
    inset: 0;
    padding: 20px;
    display: grid;
    place-items: center;
    background: rgba(15, 23, 42, 0.34);
    backdrop-filter: blur(3px);
  }
  .bib-guardados-modal__panel {
    width: min(470px, 100%);
    overflow: hidden;
    background: var(--app-surface-raised);
    border: 1px solid var(--app-border);
    border-radius: 19px;
    box-shadow: 0 22px 60px rgba(15, 23, 42, 0.18);
  }
  .bib-guardados-modal__cabecera {
    padding: 18px 19px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--app-border-soft);
  }
  .bib-guardados-modal__cabecera > div {
    display: flex;
    align-items: center;
    gap: 11px;
  }
  .bib-guardados-modal__icono {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    color: var(--app-accent);
    background: var(--app-accent-50);
    border: 1px solid var(--app-border);
    border-radius: 12px;
  }
  .bib-guardados-modal__cabecera h2,
  .bib-guardados-modal__cabecera p {
    margin: 0;
  }
  .bib-guardados-modal__cabecera h2 {
    color: var(--app-text);
    font-size: 16px;
    font-weight: 850;
  }
  .bib-guardados-modal__cabecera p {
    margin-top: 4px;
    color: var(--app-text-soft);
    font-size: 10.5px;
  }
  .bib-guardados-modal__cabecera > button {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    color: var(--app-text-soft);
    background: transparent;
    border: 0;
    border-radius: 9px;
    cursor: pointer;
  }
  .bib-guardados-modal__cabecera > button:hover {
    background: var(--app-surface-alt);
  }
  .bib-guardados-modal form {
    padding: 18px 19px 19px;
    display: grid;
    gap: 18px;
  }
  .bib-guardados-modal label {
    display: grid;
    gap: 7px;
    color: var(--app-text-secondary);
    font-size: 10.5px;
    font-weight: 800;
  }
  .bib-guardados-modal input {
    width: 100%;
    height: 42px;
    padding: 0 12px;
    box-sizing: border-box;
    color: var(--app-text);
    background: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: 11px;
    outline: 0;
    font: inherit;
    font-size: 11.5px;
  }
  .bib-guardados-modal input:focus {
    border-color: var(--app-border-strong);
    box-shadow: 0 0 0 3px var(--app-accent-50);
  }
  .bib-guardados-modal__acciones {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .bib-guardados-modal__acciones button {
    min-height: 39px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 10px;
    font: inherit;
    font-size: 10.5px;
    font-weight: 850;
    cursor: pointer;
  }
  .bib-guardados-modal__acciones .secundario {
    color: var(--app-text-secondary);
    background: var(--app-surface);
    border: 1px solid var(--app-border-soft);
  }
  .bib-guardados-modal__acciones .primario {
    color: #fff;
    background: var(--app-accent);
    border: 1px solid var(--app-accent);
  }
  /\* =========================
     RESPONSIVE
     ========================= \*/
  @media (max-width: 1100px) {
    .bib-guardados__colecciones-resumen {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 980px) {
    .bib-guardados__controles {
      align-items: stretch;
      flex-direction: column;
    }
    .bib-guardados__acciones-superiores {
      width: 100%;
    }
    .bib-guardados__buscador {
      width: auto;
      flex: 1;
    }
    .bib-guardados__colecciones-resumen {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 680px) {
    .bib-guardados__header {
      padding: 17px;
      border-radius: 17px;
    }
    .bib-guardados__controles {
      padding: 11px;
    }
    .bib-guardados__tabs {
      overflow-x: auto;
      padding-bottom: 2px;
    }
    .bib-guardados__tabs button {
      flex: 0 0 auto;
    }
    .bib-guardados__acciones-superiores {
      align-items: stretch;
      flex-direction: column;
    }
    .bib-guardados__buscador {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }
    .bib-guardados__crear {
      width: 100%;
    }
    .bib-guardados__colecciones-resumen,
    .bib-guardados__colecciones-grid,
    .bib-guardados__recursos-grid {
      grid-template-columns: 1fr;
    }
    .bib-guardados__titulo-seccion {
      align-items: flex-start;
      flex-direction: column;
    }
    .bib-guardados__editar {
      align-items: stretch;
      flex-direction: column;
    }
  }
  .bib-guardados__ver-todas {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }
  .bib-guardados__ver-todas span {
    transition: transform 150ms ease;
  }
  .bib-guardados__ver-todas:hover span {
    transform: translateX(3px);
  }
  .bib-guardados-modal__confirmacion {
    padding: 18px 19px 19px;
    display: grid;
    gap: 20px;
  }
  .bib-guardados-modal__confirmacion > p {
    margin: 0;
    color: var(--app-text-secondary);
    font-size: 12px;
    line-height: 1.6;
  }
  .bib-guardados-modal__confirmacion > p strong {
    color: var(--app-text);
    font-weight: 850;
  }
  .bib-guardados-modal__icono--peligro {
    color: var(--app-danger);
    background: #fff1f2;
    border-color: #fecdd3;
  }
  .bib-guardados-modal__acciones .peligro {
    color: #fff;
    background: var(--app-danger);
    border: 1px solid var(--app-danger);
  }
  .bib-guardados-modal__acciones .peligro:hover {
    filter: brightness(0.96);
  }
  .bib-guardados-modal__acciones button:disabled,
  .bib-guardados-modal__cabecera > button:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }
`;
