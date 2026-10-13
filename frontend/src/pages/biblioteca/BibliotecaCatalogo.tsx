import { useEffect, useMemo, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import {

  BookOpen,

  Download,

  FileText,

  Filter,

  Gavel,

  GraduationCap,

  Heart,

  Landmark,

  Scale,

  ScrollText,

  Shapes,

  BriefcaseBusiness,

  FileCheck2,

  FilePenLine,

  Search,

} from 'lucide-react';

import {

  mensajeError,

  useBiblioteca,

} from '../../contexts/BibliotecaContext';

import {

  categorias,

  type Catalogo,

  type Categoria,

  type Recurso,

  type ResumenBiblioteca,

} from '../../types/biblioteca/biblioteca.types';

import { TarjetaRecurso } from '../../components/biblioteca/TarjetaRecurso';

import {

  TONO_POR_CATEGORIA,

  TONOS_CATEGORIA_CSS,

} from '../../components/biblioteca/categorias.tonos';

/* El home muestra solo 6 categorías; las otras 5 se ven en*

*   "Ver todas" → /biblioteca/categorias. */

const CATEGORIAS_HOME = 6;

const categoriasHome: Array<{

  id: Categoria;

  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;

}> = [

  { id: 'MEMORIAL', Icon: FilePenLine },

  { id: 'CONTRATO', Icon: FileCheck2 },

  { id: 'DEMANDA', Icon: Scale },

  { id: 'JURISPRUDENCIA', Icon: Gavel },

  { id: 'CODIGO', Icon: BookOpen },

  { id: 'LEY', Icon: Landmark },

  { id: 'SENTENCIA', Icon: ScrollText },

  { id: 'DOCTRINA', Icon: GraduationCap },

  { id: 'GUIA', Icon: FileText },

  { id: 'CASO_PRACTICO', Icon: BriefcaseBusiness },

  { id: 'OTRO', Icon: Shapes },

];

export default function BibliotecaCatalogo() {

  const { api, base } = useBiblioteca();

  const [params, setParams] = useSearchParams();

  const [resumen, setResumen] = useState<ResumenBiblioteca | null>(null);

  const [datos, setDatos] = useState<Catalogo | null>(null);

  const [busqueda, setBusqueda] = useState(params.get('q') ?? '');

  const [anios, setAnios] = useState<number[]>([]);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState('');

  const vistaTodos = params.get('vista') === 'todos';

  const terminoBusqueda = params.get('q')?.trim() ?? '';

  const esBusquedaHome = !vistaTodos && terminoBusqueda.length > 0;

  const esHome =

    !vistaTodos &&

    !params.get('formato') &&

    !params.get('anio');

  useEffect(() => {

    const controller = new AbortController();

    api

      .get<ResumenBiblioteca>('/resumen', controller.signal)

      .then(setResumen)

      .catch((e) => {

        if (!controller.signal.aborted) {

          setError(mensajeError(e));

        }

      });

    return () => controller.abort();

  }, [api]);

  useEffect(() => {

    const controller = new AbortController();

    api

      .get<{ temas: string[]; anios: number[] }>(

        '/filtros',

        controller.signal,

      )

      .then((respuesta) => setAnios(respuesta.anios))

      .catch(() => {});

    return () => controller.abort();

  }, [api]);

  useEffect(() => {

    setBusqueda(params.get('q') ?? '');

  }, [params]);

  useEffect(() => {

    if (vistaTodos) {

      return;

    }

    const timer = window.setTimeout(() => {

      const valor = busqueda.trim();

      if (valor === terminoBusqueda) {

        return;

      }

      const nuevos = new URLSearchParams(params);

      if (valor) {

        nuevos.set('q', valor);

      } else {

        nuevos.delete('q');

      }

      nuevos.delete('vista');

      nuevos.delete('formato');

      nuevos.delete('anio');

      nuevos.delete('orden');

      setParams(nuevos, { replace: true });

    }, 300);

    return () => window.clearTimeout(timer);

  }, [busqueda, params, setParams, terminoBusqueda, vistaTodos]);

  useEffect(() => {

    const controller = new AbortController();

    // En búsquedas sucesivas mantenemos las cards actuales visibles.
    // El skeleton solo aparece cuando todavía no existe ningún catálogo cargado.
    if (!esBusquedaHome || datos === null) {
      setCargando(true);
    }

    setError('');

    const clean = new URLSearchParams(params);

    clean.delete('vista');

    clean.delete('categoria');

    clean.delete('categorias');

    const cargar = async () => {

      if (esHome && !esBusquedaHome) {

        clean.set('limite', '4');

      } else if (esBusquedaHome) {

        clean.set('limite', '24');

      }

      setDatos(

        await api.get<Catalogo>(

          `/recursos?${clean.toString()}`,

          controller.signal,

        ),

      );

    };

    cargar()

      .catch((e) => {

        if (!controller.signal.aborted) {

          setError(mensajeError(e));

        }

      })

      .finally(() => {

        if (!controller.signal.aborted) {

          setCargando(false);

        }

      });

    return () => controller.abort();

  }, [api, params, esHome, esBusquedaHome]);

  const counts = useMemo(

    () =>

      Object.fromEntries(

        categoriasHome.map((item) => [

          item.id,

          resumen?.categorias.find(

            (dato) => dato.categoria === item.id,

          )?.total ?? 0,

        ]),

      ) as Record<Categoria, number>,

    [resumen],

  );

  function setFilter(key: string, value: string) {

    const nuevos = new URLSearchParams(params);

    if (value) {

      nuevos.set(key, value);

    } else {

      nuevos.delete(key);

    }

    nuevos.set('vista', 'todos');

    setParams(nuevos);

  }

  function buscar(e: React.FormEvent) {

    e.preventDefault();

    setFilter('q', busqueda.trim());

  }

  if (esHome) {

    return (

      <>

        <div className="bib-home">

          {!esBusquedaHome && (

            <section className="bib-home-stats">

              <Stat variant="orange" icon={BookOpen} value={resumen?.totalRecursos ?? 0} label="Recursos disponibles" />

              <Stat variant="yellow" icon={FileText} value={categoriasHome.length} label="Categorías" />

              <Stat variant="blue" icon={Download} value={resumen?.descargasPersonales ?? 0} label="Descargas totales" />

              <Stat variant="pink" icon={Heart} value={resumen?.favoritosPersonales ?? 0} label="Recursos favoritos" />

            </section>

          )}

          <div className="bib-home-search">

            <div className="bib-home-search__field">

              <Search size={19} strokeWidth={1.8} />

              <div className="bib-home-search__input-wrap">

                <input

                  value={busqueda}

                  onChange={(e) => setBusqueda(e.target.value)}

                  placeholder="Buscar por título, autor, categoría o palabra clave..."

                  aria-label="Buscar en la biblioteca jurídica"

                />

                {busqueda && (

                  <button

                    type="button"

                    className="bib-home-search__clear"

                    onClick={() => setBusqueda('')}

                    aria-label="Limpiar búsqueda"

                    title="Limpiar búsqueda"

                  >

                    ×

                  </button>

                )}

              </div>

            </div>

          </div>

          {esBusquedaHome ? (

            <section className="bib-home-block bib-home-search-results">

              <div className="bib-home-search-results__heading">

                <div>

                  <span>Resultados de búsqueda</span>

                  <h2>Coincidencias para “{terminoBusqueda}”</h2>

                </div>

                {!cargando && !error && (

                  <strong>

                    {datos?.total ?? 0} {(datos?.total ?? 0) === 1 ? 'recurso' : 'recursos'}

                  </strong>

                )}

              </div>

              {renderRecursos(
                  cargando && datos === null,
                  error,
                  datos?.recursos ?? [],
                  true,
                )}

            </section>

          ) : (

            <>

              <section className="bib-home-block">

                <div className="bib-home-heading bib-home-heading--plain">

                  <div><h2>Categorías principales</h2></div>

                  <Link to={`${base}/categorias`}>Ver todas <span>→</span></Link>

                </div>

                <div className="bib-home-categories-card">

                  <div className="bib-home-categories">

                    {categoriasHome.slice(0, CATEGORIAS_HOME).map((item) => {

                      const Icon = item.Icon;

                      return (

                        <Link

                          key={item.id}

                          to={`${base}/categorias/${encodeURIComponent(item.id)}`}

                          className={`bib-home-category tone-${TONO_POR_CATEGORIA[item.id]}`}

                        >

                          <div className="bib-home-category__icon">

                            <Icon size={29} strokeWidth={1.9} />

                          </div>

                          <strong>{categorias[item.id]}</strong>

                          <span>{counts[item.id] ?? 0} recursos</span>

                        </Link>

                      );

                    })}

                  </div>

                </div>

              </section>

              <section className="bib-home-block">

                <div className="bib-home-heading bib-home-heading--plain">

                  <div><h2>Recursos recientes</h2></div>

                  <Link to={`${base}?vista=todos`}>Ver todos los recursos <span>→</span></Link>

                </div>

                {renderRecursos(cargando, error, datos?.recursos ?? [], true, true)}

              </section>

            </>

          )}

        </div>

        <style>{homeStyles}</style>

      </>

    );

  }

  const CategoriaIcon = BookOpen;

  const tituloVista = 'Todos los recursos';

  const descripcionVista =

    'Explora todos los recursos disponibles en la biblioteca virtual.';

  return (

    <>

      <div className="bib-catalog-page">

        <section className="bib-category-hero">

          <div className="bib-category-hero__content">

            <div className="bib-category-hero-icon"><CategoriaIcon size={34} strokeWidth={1.9} /></div>

            <div className="bib-category-hero__text">

              <span className="bib-category-hero__eyebrow">Biblioteca jurídica</span>

              <h1>{tituloVista}</h1>

              <p>{descripcionVista}</p>

            </div>

          </div>

        </section>

        <form className="bib-filter-strip" onSubmit={buscar}>

          <label className="bib-filter-strip__search">

            <Search size={18} strokeWidth={1.9} />

            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={`Buscar en ${tituloVista.toLocaleLowerCase('es')}...`} />

          </label>

          <select value={params.get('formato') ?? ''} onChange={(e) => setFilter('formato', e.target.value)} aria-label="Tipo de documento">

            <option value="">Tipo de documento</option><option value="pdf">PDF</option><option value="doc">DOC</option><option value="docx">DOCX</option><option value="enlace">Enlace</option>

          </select>

          <select value={params.get('anio') ?? ''} onChange={(e) => setFilter('anio', e.target.value)} aria-label="Año">

            <option value="">Año</option>{anios.map((anio) => <option key={anio} value={anio}>{anio}</option>)}

          </select>

          <select value={params.get('orden') ?? 'recientes'} onChange={(e) => setFilter('orden', e.target.value)} aria-label="Orden">

            <option value="recientes">Más recientes</option><option value="titulo">Título A-Z</option><option value="antiguos">Más antiguos</option>

          </select>

          <button type="submit"><Filter size={16} strokeWidth={2} /> Filtrar</button>

        </form>

        <section className="bib-catalog-results">

          <div className="bib-catalog-results__heading">

            <div><span>Recursos disponibles</span><h2>{tituloVista}</h2></div>

            <strong>{datos?.total ?? 0} {(datos?.total ?? 0) === 1 ? 'recurso' : 'recursos'}</strong>

          </div>

          {renderRecursos(cargando, error, datos?.recursos ?? [])}

        </section>

      </div>

      <style>{`${homeStyles}\n${catalogStyles}`}</style>

    </>

  );

}

function renderRecursos(

  cargando: boolean,

  error: string,

  recursos: Recurso[],

  usarSkeleton = false,

  compactas = false,

) {

  if (cargando) {

    if (usarSkeleton) {

      return (

        <div

          className="bib-resource-grid bib-resource-grid--skeleton"

          aria-label="Cargando recursos"

          aria-busy="true"

        >

          {Array.from({ length: 4 }).map((_, index) => (

            <div className="bib-resource-skeleton" key={index}>

              <div className="bib-resource-skeleton__top">

                <span className="bib-skeleton bib-skeleton--file" />

                <div>

                  <span className="bib-skeleton bib-skeleton--title" />

                  <span className="bib-skeleton bib-skeleton--tag" />

                </div>

                <span className="bib-skeleton bib-skeleton--heart" />

              </div>

              <span className="bib-skeleton bib-skeleton--line" />

              <span className="bib-skeleton bib-skeleton--line-short" />

              <div className="bib-resource-skeleton__footer">

                <span className="bib-skeleton bib-skeleton--button" />

                <span className="bib-skeleton bib-skeleton--button" />

              </div>

            </div>

          ))}

        </div>

      );

    }

    return <div className="bib-loading">Cargando recursos…</div>;

  }

  if (error) {

    return (

      <div className="bib-empty bib-empty--error">

        <BookOpen size={32} strokeWidth={1.7} />

        <h3>No pudimos cargar los recursos</h3>

        <p>{error}</p>

      </div>

    );

  }

  if (!recursos.length) {

    return (

      <div className="bib-empty">

        <div className="bib-empty__icon">

          <BookOpen size={30} strokeWidth={1.7} />

        </div>

        <h3>Aún no hay recursos disponibles</h3>

        <p>

          Cuando se agreguen nuevos materiales jurídicos aparecerán aquí.

        </p>

      </div>

    );

  }

  return (

    <div className="bib-resource-grid">

      {recursos.map((recurso) => (

        <TarjetaRecurso

          key={recurso.id}

          recurso={recurso}

          compacta={compactas}

        />

      ))}

    </div>

  );

}

function Stat({

  icon: Icon,

  value,

  label,

  variant,

}: {

  icon: React.ComponentType<{

    size?: number;

    strokeWidth?: number;

  }>;

  value: number;

  label: string;

  variant: 'orange' | 'yellow' | 'blue' | 'pink';

}) {

  return (

    <article className={`bib-home-stat bib-home-stat--${variant}`}>

      <span className="bib-home-stat__icon">

        <Icon size={24} strokeWidth={1.8} />

      </span>

      <div>

        <strong>{value.toLocaleString()}</strong>

        <p>{label}</p>

      </div>

    </article>

  );

}

const homeStyles = `

  .bib-home {

    width: 100%;

    min-width: 0;

    display: grid;

    gap: 20px;

  }

  .bib-home-stats {

    width: 100%;

    display: grid;

    grid-template-columns: repeat(4, minmax(0, 1fr));

    gap: 14px;

  }

  .bib-home-stat {

    min-width: 0;

    min-height: 104px;

    padding: 18px 20px;

    display: flex;

    align-items: center;

    gap: 16px;

    background: var(--app-surface);

    border: 1px solid var(--app-border);

    border-radius: 20px;

    box-shadow: var(--app-shadow-sm);

    transition:

      transform 160ms ease,

      border-color 160ms ease,

      box-shadow 160ms ease;

  }

  .bib-home-stat:hover {

    transform: translateY(-2px);

    border-color: var(--app-border-strong);

    box-shadow: var(--app-shadow);

  }

  .bib-home-stat__icon {

    width: 54px;

    height: 54px;

    flex: 0 0 54px;

    display: grid;

    place-items: center;

    border-radius: 16px;

  }

  .bib-home-stat--orange .bib-home-stat__icon,

  .bib-home-stat--yellow .bib-home-stat__icon,

  .bib-home-stat--blue .bib-home-stat__icon,

  .bib-home-stat--pink .bib-home-stat__icon {

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);

  }

  .bib-home-stat strong {

    display: block;

    margin: 0;

    color: var(--app-text);

    font-size: 27px;

    font-weight: 850;

    line-height: 1;

  }

  .bib-home-stat p {

    margin: 7px 0 0 !important;

    color: var(--app-text-secondary);

    font-size: 12px !important;

    line-height: 1.25 !important;

  }

  .bib-home-search {

    width: 100%;

    padding: 8px 10px 8px 16px;

    display: grid;

    grid-template-columns: minmax(0, 1fr);

    align-items: center;

    gap: 8px;

    background: var(--app-surface);

    border: 1px solid var(--app-border);

    border-radius: 20px;

    box-shadow: var(--app-shadow-sm);

    transition:

      border-color 160ms ease,

      box-shadow 160ms ease,

      background 160ms ease;

  }

  .bib-home-search:focus-within {

    border-color: var(--app-border-strong);

    box-shadow:

      0 0 0 4px var(--app-input-ring),

      var(--app-shadow);

  }

  .bib-home-search__field {

    min-width: 0;

    min-height: 42px;

    display: grid;

    grid-template-columns: auto minmax(0, 1fr);

    align-items: center;

    gap: 14px;

  }

  .bib-home-search__field > svg {

    flex-shrink: 0;

    color: var(--app-accent);

  }

  .bib-home-search__input-wrap {

    position: relative;

    min-width: 0;

  }

  .bib-home-search__input-wrap input {

    width: 100%;

    min-width: 0;

    height: 42px;

    padding: 0 38px 0 0;

    border: 0;

    outline: 0;

    background: transparent;

    color: var(--app-text);

    font: inherit;

    font-size: 13px;

    font-weight: 650;

  }

  .bib-home-search__input-wrap input::placeholder {

    color: var(--app-text-muted);

    font-weight: 500;

  }

  .bib-home-search__clear {

    position: absolute;

    top: 50%;

    right: 2px;

    transform: translateY(-50%);

    width: 30px;

    height: 30px;

    padding: 0;

    display: grid;

    place-items: center;

    color: var(--app-text-soft);

    background: var(--app-surface-alt);

    border: 1px solid var(--app-border-soft);

    border-radius: 9px;

    font: inherit;

    font-size: 18px;

    line-height: 1;

    cursor: pointer;

    transition:

      color 150ms ease,

      background 150ms ease,

      border-color 150ms ease;

  }

  .bib-home-search__clear:hover {

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);

    border-color: var(--app-border);

  }

  .bib-home-search__submit {

    min-width: 102px;

    height: 42px;

    padding: 0 17px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 7px;

color: #fff;

    background: var(--app-accent);

    border: 0;

    border-radius: 13px;

    font: inherit;

    font-size: 11px;

    font-weight: 800;

    cursor: pointer;

    box-shadow: var(--app-shadow-sm);

    transition:

      transform 150ms ease,

      box-shadow 150ms ease,

      background 150ms ease;

  }

  .bib-home-search__submit:hover {

    background: var(--app-accent-hover);

    transform: translateY(-1px);

    box-shadow: var(--app-shadow);

  }

  .bib-home-block {

    width: 100%;

    min-width: 0;

  }

  /\* Segunda card independiente: contiene únicamente las categorías. \*/

  .bib-home-categories-card {

    width: 100%;

    padding: 7px;

    background: var(--app-surface);

    border: 1px solid var(--app-border);

    border-radius: 20px;

    box-shadow: var(--app-shadow-sm);

  }

  /\* El encabezado y las categorías son dos cards blancas separadas. \*/

  .bib-home-heading {

    min-height: 76px;

    margin-bottom: 12px;

    padding: 16px 20px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 18px;

    background: var(--app-surface);

    border: 1px solid var(--app-border);

    border-radius: 18px;

    box-shadow: var(--app-shadow-sm);

  }

  .bib-home-heading--plain {

    min-height: auto;

    margin-bottom: 8px;

    padding: 0 2px;

    background: transparent;

    border: 0;

    border-radius: 0;

    box-shadow: none;

  }

  .bib-home-heading--plain > a {

    min-height: 38px;

    padding: 8px 14px;

    color: var(--app-accent-dark);

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border);

    border-radius: 12px;

    box-shadow: var(--app-shadow-sm);

  }

  .bib-home-heading--plain > a:hover {

    background: var(--app-surface-alt);

    border-color: var(--app-border-strong);

    transform: translateY(-1px);

    box-shadow: var(--app-shadow);

  }

  .bib-home-heading h2 {

    margin: 0;

    color: var(--app-text);

    font-size: 19px;

    font-weight: 850;

    line-height: 1.15;

  }

  .bib-home-heading p {

    margin: 5px 0 0 !important;

    color: var(--app-text-secondary);

    font-size: 12px !important;

    line-height: 1.35 !important;

  }

  .bib-home-heading > a {

    min-height: 40px;

    flex-shrink: 0;

    padding: 0 15px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 8px;

    color: var(--app-accent-dark);

    background: var(--app-surface-alt);

    border: 1px solid var(--app-border);

    border-radius: 12px;

    text-decoration: none;

    font-size: 11.5px;

    font-weight: 800;

    transition:

      background 150ms ease,

      border-color 150ms ease,

      transform 150ms ease;

  }

  .bib-home-heading > a:hover {

    background: var(--app-accent-soft);

    border-color: var(--app-border-strong);

    transform: translateY(-1px);

  }

  .bib-home-heading > a span {

    font-size: 17px;

    transition: transform 150ms ease;

  }

  .bib-home-heading > a:hover span {

    transform: translateX(3px);

  }

  .bib-home-categories {

    width: 100%;

    display: grid;

    grid-template-columns: repeat(6, minmax(0, 1fr));

    gap: 10px;

}

  .bib-home-category {

    --category-color: var(--app-accent);

    --category-soft: var(--app-accent-soft);

    min-width: 0;

    min-height: 112px;

    padding: 13px 8px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    gap: 8px;

    color: var(--app-text) !important;

    background: var(--category-soft);

    border: 1px solid

      color-mix(

        in srgb,

        var(--category-color) 24%,

        transparent

      );

    border-radius: 18px;

    text-align: center;

    text-decoration: none !important;

    box-shadow: inset 0 1px 0 var(--app-surface-raised);

    transition:

      transform 160ms ease,

      box-shadow 160ms ease,

      border-color 160ms ease;

  }

  .bib-home-category:hover {

    transform: translateY(-3px);

    border-color:

      color-mix(

        in srgb,

        var(--category-color) 46%,

        transparent

      );

    box-shadow: var(--app-shadow-sm);

  }

  .bib-home-category__icon {

    width: 38px;

    height: 38px;

    display: grid;

    place-items: center;

    color: var(--category-color);

    background: var(--app-surface-raised);

    border: 1px solid

      color-mix(

        in srgb,

        var(--category-color) 20%,

        transparent

      );

    border-radius: 14px;

    transition:

      transform 170ms ease,

      background 170ms ease,

      box-shadow 170ms ease;

  }

  .bib-home-category:hover .bib-home-category__icon {

    transform: translateY(-2px) scale(1.04);

  }

  .bib-home-category strong {

    max-width: 100%;

    font-size: 12px;

    font-weight: 800;

    line-height: 1.25;

  }

.bib-home-category > span {

    color: var(--app-text-secondary);

    font-size: 10.5px;

  }

  /\* =======================================================

     TONOS POR CATEGORÍA

     Paleta única compartida con /biblioteca/categorias.

     Va después de .bib-home-category para que el tono

     de cada categoría prevalezca sobre el valor base.

     ======================================================= \*/

  ${TONOS_CATEGORIA_CSS}

  .bib-home .bib-resource-grid {

    width: 100%;

    display: grid !important;

    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;

    gap: 10px !important;

  }

  .bib-home .bib-loading,

  .bib-home .bib-empty {

    padding: 38px 22px;

    background: var(--app-surface);

    border: 1px solid var(--app-border);

    border-radius: 18px;

    color: var(--app-text-secondary);

    text-align: center;

  }

  .bib-home-search-results {

    display: grid;

    gap: 12px;

  }

  .bib-home-search-results__heading {

    display: flex;

    align-items: flex-end;

    justify-content: space-between;

    gap: 16px;

    padding: 2px;

  }

  .bib-home-search-results__heading span {

    display: block;

    margin-bottom: 4px;

    color: var(--app-accent-dark);

    font-size: 10px;

    font-weight: 850;

    letter-spacing: .08em;

    text-transform: uppercase;

  }

  .bib-home-search-results__heading h2 {

    margin: 0;

    color: var(--app-text);

    font-size: 20px;

    font-weight: 900;

  }

  .bib-home-search-results__heading strong {

    color: var(--app-text-secondary);

    font-size: 11.5px;

    font-weight: 800;

  }

  .bib-home .bib-home-search-results .bib-resource-grid {

    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;

    gap: 12px !important;

  }

  .bib-resource-grid--skeleton {

    pointer-events: none;

  }

  .bib-resource-skeleton {

    min-height: 104px;

    padding: 17px;

    display: flex;

    flex-direction: column;

    gap: 13px;

    background: var(--app-surface);

    border: 1px solid var(--app-border);

    border-radius: 19px;

    overflow: hidden;

  }

  .bib-resource-skeleton__top {

    display: grid;

    grid-template-columns: 50px minmax(0, 1fr) 34px;

    gap: 12px;

    align-items: start;

  }

  .bib-resource-skeleton__top > div {

    display: grid;

    gap: 9px;

    padding-top: 3px;

  }

  .bib-skeleton {

    display: block;

    position: relative;

    overflow: hidden;

    background: var(--app-surface-disabled);

    border-radius: 8px;

  }

  .bib-skeleton::after {

    content: '';

    position: absolute;

    inset: 0;

    transform: translateX(-100%);

    background:

      linear-gradient(

        90deg,

        transparent,

        var(--app-surface-raised),

        transparent

      );

    animation: bibSkeleton 1.25s ease-in-out infinite;

  }

  .bib-skeleton--file {

    width: 50px;

    height: 56px;

    border-radius: 13px;

  }

  .bib-skeleton--title {

    width: 82%;

    height: 13px;

  }

  .bib-skeleton--tag {

    width: 55%;

    height: 20px;

    border-radius: 999px;

  }

  .bib-skeleton--heart {

    width: 34px;

    height: 34px;

    border-radius: 11px;

  }

  .bib-skeleton--line {

    width: 100%;

    height: 10px;

    margin-top: 4px;

  }

  .bib-skeleton--line-short {

    width: 68%;

    height: 10px;

  }

  .bib-resource-skeleton__footer {

    margin-top: auto;

    padding-top: 13px;

    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 8px;

    border-top: 1px solid var(--app-border-soft);

  }

  .bib-skeleton--button {

    width: 100%;

    height: 40px;

    border-radius: 11px;

  }

  .bib-empty {

    min-height: 178px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    gap: 7px;

  }

  .bib-empty__icon {

    width: 52px;

    height: 52px;

    margin-bottom: 3px;

    display: grid;

    place-items: center;

    color: var(--app-accent);

    background: var(--app-accent-soft);

    border: 1px solid var(--app-border);

    border-radius: 16px;

  }

  .bib-empty h3 {

    margin: 0;

    color: var(--app-text);

    font-size: 14px;

    font-weight: 850;

  }

  .bib-empty p {

    max-width: 460px;

    margin: 0 !important;

    color: var(--app-text-secondary);

    font-size: 11.5px !important;

    line-height: 1.5 !important;

  }

  .bib-empty--error > svg {

    color: var(--app-danger);

  }

  @keyframes bibSkeleton {

    100% {

      transform: translateX(100%);

    }

  }

  @media (max-width: 1180px) {

    .bib-home-stats {

      grid-template-columns: repeat(2, minmax(0, 1fr));

    }

    .bib-home-categories {

      grid-template-columns: repeat(3, minmax(0, 1fr));

    }

    .bib-home .bib-resource-grid {

      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

    }

    .bib-home .bib-home-search-results .bib-resource-grid {

      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

    }

  }

  @media (max-width: 680px) {

    .bib-home {

      gap: 16px;

    }

    .bib-home-stats {

      gap: 10px;

    }

    .bib-home-stat {

      min-height: 88px;

      padding: 14px;

    }

    .bib-home-stat__icon {

      width: 44px;

      height: 44px;

      flex-basis: 44px;

    }

    .bib-home-stat strong {

      font-size: 21px;

    }

    .bib-home-heading {

      min-height: auto;

      align-items: flex-start;

    }

    .bib-home-heading > a {

      min-height: 36px;

      padding: 0 11px;

    }

    .bib-home-categories {

      grid-template-columns: repeat(2, minmax(0, 1fr));

    }

    .bib-home .bib-resource-grid {

      grid-template-columns: 1fr !important;

    }

    .bib-home .bib-home-search-results .bib-resource-grid {

      grid-template-columns: 1fr !important;

    }

    .bib-home-search-results__heading {

      align-items: flex-start;

      flex-direction: column;

    }

  }

  @media (max-width: 430px) {

    .bib-home-stats {

      grid-template-columns: 1fr;

    }

    .bib-home-heading {

      flex-direction: column;

    }

    .bib-home-heading > a {

      width: 100%;

    }

  }

`;

const catalogStyles = `

  .bib-catalog-page { width:100%; min-width:0; display:grid; gap:18px; padding-bottom:28px; color:var(--app-text); }

  .bib-category-hero { --tone:var(--app-accent); --tone-soft:var(--app-accent-soft); width:100%; min-width:0; min-height:142px; padding:24px 26px; display:flex; align-items:center; justify-content:space-between; gap:20px; background:var(--app-surface); border:1px solid var(--app-border); border-left:5px solid var(--tone); border-radius:22px; box-shadow:var(--app-shadow-sm); box-sizing:border-box; }

  .bib-category-hero__content { min-width:0; display:flex; align-items:center; gap:18px; }

  .bib-category-hero-icon { width:62px; height:62px; flex:0 0 62px; display:grid; place-items:center; color:var(--tone); background:var(--tone-soft); border:1px solid color-mix(in srgb,var(--tone) 22%,transparent); border-radius:18px; }

  .bib-category-hero__text { min-width:0; }

  .bib-category-hero__eyebrow { display:block; margin-bottom:6px; color:var(--app-accent-dark); font-size:10.5px; font-weight:850; letter-spacing:.13em; text-transform:uppercase; }

  .bib-category-hero h1 { margin:0; color:var(--app-text); font-size:27px; font-weight:900; line-height:1.1; letter-spacing:-.025em; }

  .bib-category-hero p { margin:7px 0 0!important; max-width:700px; color:var(--app-text-secondary); font-size:13px!important; line-height:1.5!important; }

  .bib-category-hero__back { min-height:40px; padding:0 14px; flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; gap:6px; color:var(--app-accent-dark); background:var(--app-surface-raised); border:1px solid var(--app-border); border-radius:12px; text-decoration:none; font-size:11.5px; font-weight:800; }

  .bib-filter-strip { width:100%; min-width:0; padding:9px; display:grid; grid-template-columns:minmax(260px,1fr) 160px 115px 150px auto; align-items:center; gap:8px; background:var(--app-surface); border:1px solid var(--app-border); border-radius:18px; box-shadow:var(--app-shadow-sm); }

  .bib-filter-strip__search { min-width:0; height:42px; padding:0 13px; display:flex; align-items:center; gap:10px; color:var(--app-accent); background:var(--app-surface-raised); border:1px solid var(--app-border-soft); border-radius:12px; }

  .bib-filter-strip__search input { width:100%; min-width:0; border:0; outline:0; background:transparent; color:var(--app-text); font:inherit; font-size:12.5px; }

  .bib-filter-strip select,.bib-filter-strip button { height:42px; border-radius:12px; font:inherit; font-size:11.5px; font-weight:700; }

  .bib-filter-strip select { min-width:0; padding:0 10px; color:var(--app-text-secondary); background:var(--app-surface-raised); border:1px solid var(--app-border-soft); outline:0; }

  .bib-filter-strip button { padding:0 16px; display:inline-flex; align-items:center; justify-content:center; gap:7px; color:#fff; background:var(--app-accent); border:0; cursor:pointer; }

  .bib-catalog-results { width:100%; min-width:0; display:grid; gap:12px; }

  .bib-catalog-results__heading { display:flex; align-items:end; justify-content:space-between; gap:16px; padding:0 2px; }

  .bib-catalog-results__heading span { color:var(--app-accent-dark); font-size:10px; font-weight:850; letter-spacing:.08em; text-transform:uppercase; }

  .bib-catalog-results__heading h2 { margin:3px 0 0; color:var(--app-text); font-size:20px; font-weight:900; }

  .bib-catalog-results__heading strong { color:var(--app-text-secondary); font-size:11.5px; font-weight:800; }

  .bib-catalog-results .bib-resource-grid { width:100%; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }

  .bib-catalog-results .bib-loading,.bib-catalog-results .bib-empty { padding:42px 24px; background:var(--app-surface); border:1px solid var(--app-border); border-radius:18px; color:var(--app-text-secondary); text-align:center; }

  @media(max-width:1120px){.bib-filter-strip{grid-template-columns:minmax(220px,1fr) repeat(2,130px)}.bib-filter-strip select:nth-of-type(3){display:none}.bib-catalog-results .bib-resource-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}

  @media(max-width:760px){.bib-category-hero{align-items:flex-start;flex-direction:column;padding:20px}.bib-category-hero__back{width:100%}.bib-filter-strip{grid-template-columns:1fr 1fr}.bib-filter-strip__search,.bib-filter-strip button{grid-column:1/-1}}

  @media(max-width:560px){.bib-category-hero__content{align-items:flex-start}.bib-category-hero-icon{width:52px;height:52px;flex-basis:52px;border-radius:15px}.bib-category-hero h1{font-size:23px}.bib-filter-strip{grid-template-columns:1fr}.bib-filter-strip__search,.bib-filter-strip button{grid-column:auto}.bib-catalog-results .bib-resource-grid{grid-template-columns:1fr}}

`;
