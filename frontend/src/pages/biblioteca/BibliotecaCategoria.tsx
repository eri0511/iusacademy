import { useEffect, useMemo, useState } from 'react';

import {

  Link,

  Navigate,

  useParams,

  useSearchParams,

} from 'react-router-dom';

import {

  ArrowLeft,

  BookOpen,

  BriefcaseBusiness,

  FileCheck2,

  FilePenLine,

  FileText,

  Gavel,

  GraduationCap,

  Landmark,

  RotateCcw,

  Scale,

  Search,

  ScrollText,

  Shapes,

} from 'lucide-react';

import {

  mensajeError,

  useBiblioteca,

} from '../../contexts/BibliotecaContext';

import {

  categorias,

  type Catalogo,

  type Categoria,

} from '../../types/biblioteca/biblioteca.types';

import { TarjetaRecurso } from '../../components/biblioteca/TarjetaRecurso';

type CategoriaVisual = {

  descripcion: string;

  Icon: React.ComponentType<{

    size?: number;

    strokeWidth?: number;

  }>;

};

const visuales: Record<Categoria, CategoriaVisual> = {

  MEMORIAL: {

    descripcion:

      'Memoriales y escritos jurídicos utilizados en distintos trámites y procesos.',

    Icon: FilePenLine,

  },

  CONTRATO: {

    descripcion:

      'Modelos y documentos contractuales para diferentes actos y relaciones jurídicas.',

    Icon: FileCheck2,

  },

  DEMANDA: {

    descripcion:

      'Modelos de demandas y documentos para el inicio de procesos judiciales.',

    Icon: Scale,

  },

  JURISPRUDENCIA: {

    descripcion:

      'Criterios, precedentes y resoluciones relevantes para el análisis jurídico.',

    Icon: Gavel,

  },

  CODIGO: {

    descripcion:

      'Códigos y cuerpos normativos organizados para consulta jurídica.',

    Icon: BookOpen,

  },

  LEY: {

    descripcion:

      'Leyes y disposiciones normativas aplicables en el ámbito jurídico.',

    Icon: Landmark,

  },

  SENTENCIA: {

    descripcion:

      'Sentencias y resoluciones emitidas por autoridades y tribunales competentes.',

    Icon: ScrollText,

  },

  DOCTRINA: {

    descripcion:

      'Libros, estudios y aportes de autores especializados en Derecho.',

    Icon: GraduationCap,

  },

  GUIA: {

    descripcion:

      'Guías prácticas y materiales de orientación para el aprendizaje jurídico.',

    Icon: FileText,

  },

  CASO_PRACTICO: {

    descripcion:

      'Casos prácticos para aplicar conocimientos jurídicos a situaciones concretas.',

    Icon: BriefcaseBusiness,

  },

  OTRO: {

    descripcion:

      'Otros documentos y materiales jurídicos complementarios de consulta.',

    Icon: Shapes,

  },

};

function esCategoria(value: string | undefined): value is Categoria {

  return Boolean(value && value in categorias);

}

export default function BibliotecaCategoria() {

  const { categoria } = useParams();

  const { api, base } = useBiblioteca();

  const [params, setParams] = useSearchParams();

  const [datos, setDatos] = useState<Catalogo | null>(null);

  const [anios, setAnios] = useState<number[]>([]);

  const [busqueda, setBusqueda] = useState(params.get('q') ?? '');

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState('');

  const categoriaValida = esCategoria(categoria)

    ? categoria

    : null;

  const visual = categoriaValida

    ? visuales[categoriaValida]

    : null;

  useEffect(() => {

    setBusqueda(params.get('q') ?? '');

  }, [params]);

  useEffect(() => {

    const controller = new AbortController();

    api

      .get<{ temas: string[]; anios: number[] }>(

        '/filtros',

        controller.signal,

      )

      .then((respuesta) => {

        setAnios(respuesta.anios);

      })

      .catch(() => {});

    return () => controller.abort();

  }, [api]);

  useEffect(() => {

    if (!categoriaValida) {

      return;

    }

    const controller = new AbortController();

    setCargando(true);

    setError('');

    const query = new URLSearchParams();

    query.set('categoria', categoriaValida);

    const q = params.get('q');

    const anio = params.get('anio');

    const orden = params.get('orden');

    if (q) {

      query.set('q', q);

    }

    if (anio) {

      query.set('anio', anio);

    }

    if (orden) {

      query.set('orden', orden);

    }

    api

      .get<Catalogo>(

        `/recursos?${query.toString()}`,

        controller.signal,

      )

      .then(setDatos)

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

  }, [api, categoriaValida, params]);

  const total = datos?.total ?? 0;

  const tituloResultado = useMemo(() => {

    if (!categoriaValida) {

      return '';

    }

    return categorias[categoriaValida];

  }, [categoriaValida]);

  const filtrosActivos = Boolean(

    params.get('q') ||

      params.get('anio') ||

      (params.get('orden') &&

        params.get('orden') !== 'recientes'),

  );

  if (!categoriaValida || !visual) {

    return (

      <Navigate

        to={`${base}/categorias`}

        replace

      />

    );

  }

  const Icon = visual.Icon;

  function cambiarFiltro(

    key: string,

    value: string,

  ) {

    const nuevos = new URLSearchParams(params);

    if (value) {

      nuevos.set(key, value);

    } else {

      nuevos.delete(key);

    }

    setParams(nuevos);

  }

  function buscar(e: React.FormEvent) {

    e.preventDefault();

    const nuevos = new URLSearchParams(params);

    const texto = busqueda.trim();

    if (texto) {

      nuevos.set('q', texto);

    } else {

      nuevos.delete('q');

    }

    setParams(nuevos);

  }

  function limpiarFiltros() {

    setBusqueda('');

    setParams({});

  }

  return (

    <>

      <style>{styles}</style>

      <div className="bib-category-page">

        <section

          className="bib-category-header"

        >

          <div className="bib-category-header-icon">

            <Icon

              size={30}

              strokeWidth={2}

            />

          </div>

          <div className="bib-category-header-copy">

            <h1>{tituloResultado}</h1>

            <p>{visual.descripcion}</p>

          </div>

          <div className="bib-category-header-actions">

            <Link

              to={`${base}/categorias`}

              className="bib-category-back"

            >

              <ArrowLeft size={17} strokeWidth={2} />

              Todas las categorías

            </Link>

            <span className="bib-category-count">

              {total}{' '}

              {total === 1

                ? 'recurso'

                : 'recursos'}

            </span>

          </div>

        </section>

        <form

          className="bib-category-filters"

          onSubmit={buscar}

        >

          <label className="bib-category-search">

            <Search

              size={20}

              strokeWidth={2}

            />

            <input

              type="search"

              value={busqueda}

              onChange={(e) =>

                setBusqueda(e.target.value)

              }

              placeholder={`Buscar en ${tituloResultado.toLowerCase()}...`}

            />

          </label>

          <select

            value={params.get('anio') ?? ''}

            onChange={(e) =>

              cambiarFiltro(

                'anio',

                e.target.value,

              )

            }

          >

            <option value="">

              Todos los años

            </option>

            {anios.map((anio) => (

              <option

                key={anio}

                value={anio}

              >

                {anio}

              </option>

            ))}

          </select>

          <select

            value={

              params.get('orden') ??

              'recientes'

            }

            onChange={(e) =>

              cambiarFiltro(

                'orden',

                e.target.value,

              )

            }

          >

            <option value="recientes">

              Más recientes

            </option>

            <option value="titulo">

              Título A-Z

            </option>

            <option value="antiguos">

              Más antiguos

            </option>

          </select>

          {filtrosActivos && (

            <button

              type="button"

              className="bib-category-clear"

              onClick={limpiarFiltros}

            >

              <RotateCcw

                size={17}

                strokeWidth={2}

              />

              Limpiar

            </button>

          )}

          <button

            type="submit"

            className="bib-category-search-button"

          >

            <Search

              size={17}

              strokeWidth={2}

            />

            Buscar

          </button>

        </form>

        <section className="bib-category-results">

          {cargando ? (

            <div className="bib-category-loading-grid">

              {Array.from({ length: 3 }).map(

                (_, index) => (

                  <div

                    key={index}

                    className="bib-category-skeleton"

                  />

                ),

              )}

            </div>

          ) : error ? (

            <div className="bib-category-empty">

              <div className="bib-category-empty-icon">

                <Search size={28} />

              </div>

              <h3>

                No pudimos cargar los recursos

              </h3>

              <p>{error}</p>

            </div>

          ) : datos?.recursos.length ? (

            <div className="bib-category-resource-grid">

              {datos.recursos.map((recurso) => (

                <TarjetaRecurso
                  key={recurso.id}
                  recurso={recurso}
                  compacta
                />

              ))}

            </div>

          ) : filtrosActivos ? (

            <div className="bib-category-empty">

              <div

                className="bib-category-empty-icon"

              >

                <Search

                  size={29}

                  strokeWidth={2}

                />

              </div>

              <h3>

                No encontramos resultados

              </h3>

              <p>

                No hay recursos de {tituloResultado}{' '}

                que coincidan con los filtros

                seleccionados.

              </p>

              <button

                type="button"

                className="bib-category-empty-button"

                onClick={limpiarFiltros}

              >

                <RotateCcw

                  size={16}

                  strokeWidth={2}

                />

                Limpiar filtros

              </button>

            </div>

          ) : (

            <div className="bib-category-empty">

              <div

                className="bib-category-empty-icon"

              >

                <Icon

                  size={30}

                  strokeWidth={2}

                />

              </div>

              <h3>

                Aún no hay recursos en{' '}

                {tituloResultado}

              </h3>

              <p>

                Cuando se agreguen nuevos recursos

                jurídicos a esta categoría,

                aparecerán aquí.

              </p>

            </div>

          )}

        </section>

      </div>

    </>

  );

}

const styles = `

  .bib-category-page {

    width: 100%;

    display: flex;

    flex-direction: column;

    gap: 18px;

    box-sizing: border-box;

  }

  .bib-category-header {

    --tone: var(--app-accent);

    --tone-soft: var(--app-accent-soft);

    --tone-border: var(--app-border);

    width: 100%;

    min-height: 104px;

    display: grid;

    grid-template-columns: 56px minmax(0, 1fr) auto;

    align-items: center;

    gap: 18px;

    padding: 16px 24px;

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border);

    border-radius: 20px;

    box-shadow: var(--app-shadow-sm);

    box-sizing: border-box;

  }

  .bib-category-header-icon {

    width: 56px;

    height: 56px;

    display: grid;

    place-items: center;

    color: var(--app-accent);

    background: var(--app-accent-soft);

    border: 1px solid var(--app-border);

    border-radius: 16px;

  }

  .bib-category-header-copy {

    min-width: 0;

  }

  .bib-category-header-copy h1 {

    margin: 0;

    color: var(--app-text);

    font-size: 25px;

    font-weight: 850;

    line-height: 1.15;

    letter-spacing: -0.4px;

  }

  .bib-category-header-copy p {

    max-width: 720px;

    margin: 6px 0 0;

    color: var(--app-text-secondary);

    font-size: 13px;

    line-height: 1.5;

  }

  .bib-category-header-actions {

    display: flex;

    flex-direction: column;

    align-items: flex-end;

    gap: 8px;

  }

  .bib-category-count {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    padding: 5px 11px;

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);

    border: 1px solid var(--app-border);

    border-radius: 999px;

    font-size: 11px;

    font-weight: 800;

    line-height: 1;

    white-space: nowrap;

  }

  .bib-category-back {

    min-height: 42px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 8px;

    padding: 0 17px;

    color: var(--app-accent-dark);

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border);

    border-radius: 14px;

    font-size: 12px;

    font-weight: 800;

    text-decoration: none;

    white-space: nowrap;

    transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;

  }

  .bib-category-back:hover {

    background: var(--app-accent-soft);

    border-color: var(--app-border-strong);

    transform: translateX(-1px);

  }

  .bib-category-filters {

    width: 100%;

    display: grid;

    grid-template-columns:

      minmax(280px, 1fr)

      170px

      170px

      auto

      auto;

    align-items: center;

    gap: 10px;

    padding: 12px;

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border);

    border-radius: 20px;

    box-shadow: var(--app-shadow-sm);

    box-sizing: border-box;

  }

  .bib-category-search {

    min-width: 0;

    min-height: 48px;

    display: flex;

    align-items: center;

    gap: 11px;

    padding: 0 15px;

    color: var(--app-accent);

    background: var(--app-surface-alt);

    border: 1px solid var(--app-border-soft);

    border-radius: 14px;

    transition:

      border-color 160ms ease,

      box-shadow 160ms ease;

  }

  .bib-category-search:focus-within {

    border-color: var(--app-border-strong);

    box-shadow: 0 0 0 3px var(--app-input-ring);

  }

  .bib-category-search input {

    width: 100%;

    min-width: 0;

    padding: 0;

    color: var(--app-text);

    background: transparent;

    border: 0;

    outline: 0;

    font: inherit;

    font-size: 13px;

  }

  .bib-category-search input::placeholder {

    color: var(--app-text-muted);

  }

  .bib-category-filters select {

    min-height: 48px;

    padding: 0 36px 0 14px;

    color: var(--app-text-secondary);

    background: var(--app-surface-alt);

    border: 1px solid var(--app-border-soft);

    border-radius: 14px;

    outline: none;

    font: inherit;

    font-size: 12px;

    font-weight: 650;

    cursor: pointer;

  }

  .bib-category-filters select:focus {

    border-color: var(--app-border-strong);

    box-shadow: 0 0 0 3px var(--app-input-ring);

  }

  .bib-category-clear,

  .bib-category-search-button {

    min-height: 48px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 7px;

    padding: 0 17px;

    border-radius: 14px;

    font: inherit;

    font-size: 12px;

    font-weight: 800;

    white-space: nowrap;

    cursor: pointer;

    transition:

      transform 160ms ease,

      box-shadow 160ms ease,

      background 160ms ease;

  }

  .bib-category-clear {

    color: var(--app-text-secondary);

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border);

  }

  .bib-category-clear:hover {

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);

    transform: translateY(-1px);

  }

.bib-category-search-button {

      color: #ffffff;

      background: var(--app-accent);

      border: 1px solid transparent;

      box-shadow: var(--app-shadow-sm);

    }

  .bib-category-search-button:hover {

    transform: translateY(-1px);

    box-shadow: var(--app-shadow);

  }

  .bib-category-results {

    width: 100%;

    display: flex;

    flex-direction: column;

    gap: 18px;

  }

  .bib-category-resource-grid {

    width: 100%;

    display: grid;

    grid-template-columns: repeat(3, minmax(0, 1fr));

    gap: 18px;

  }

  .bib-category-loading-grid {

    display: grid;

    grid-template-columns: repeat(3, minmax(0, 1fr));

    gap: 18px;

  }

  .bib-category-skeleton {

    min-height: 270px;

    border-radius: 22px;

    background: linear-gradient(

      90deg,

      var(--app-surface-alt) 0%,

      var(--app-surface-raised) 50%,

      var(--app-surface-alt) 100%

    );

    background-size: 200% 100%;

    animation: bibCategorySkeleton 1.4s infinite linear;

    border: 1px solid var(--app-border-soft);

  }

  @keyframes bibCategorySkeleton {

    from {

      background-position: 200% 0;

    }

    to {

      background-position: -200% 0;

    }

  }

  .bib-category-empty {

    min-height: 245px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    padding: 35px;

    text-align: center;

    background: var(--app-surface-raised);

    border: 1px solid var(--app-border);

    border-radius: 22px;

    box-sizing: border-box;

  }

  .bib-category-empty-icon {

    --tone: var(--app-accent);

    --tone-soft: var(--app-accent-soft);

    --tone-border: var(--app-border);

    width: 62px;

    height: 62px;

    display: grid;

    place-items: center;

    margin-bottom: 15px;

    color: var(--tone);

    background: var(--tone-soft);

    border: 1px solid var(--tone-border);

    border-radius: 18px;

  }

  .bib-category-empty h3 {

    margin: 0;

    color: var(--app-text);

    font-size: 17px;

    font-weight: 820;

  }

  .bib-category-empty p {

    max-width: 440px;

    margin: 7px 0 0;

    color: var(--app-text-soft);

    font-size: 13px;

    line-height: 1.55;

  }

  .bib-category-empty-button {

    min-height: 42px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 7px;

    margin-top: 17px;

    padding: 0 16px;

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);

    border: 1px solid var(--app-border);

    border-radius: 12px;

    font: inherit;

    font-size: 12px;

    font-weight: 800;

    cursor: pointer;

    transition:

      transform 160ms ease,

      background 160ms ease;

  }

  .bib-category-empty-button:hover {

    background: var(--app-accent-soft);

    transform: translateY(-1px);

  }

  @media (max-width: 1250px) {

    .bib-category-filters {

      grid-template-columns:

        minmax(0, 1fr)

        160px

        160px

        auto;

    }

    .bib-category-search-button {

      grid-column: auto;

    }

    .bib-category-clear {

      grid-column: 1 / -1;

      justify-self: flex-end;

    }

  }

  @media (max-width: 1100px) {

    .bib-category-resource-grid,

    .bib-category-loading-grid {

      grid-template-columns: repeat(2, minmax(0, 1fr));

    }

  }

  @media (max-width: 900px) {

    .bib-category-header {

      grid-template-columns: 56px minmax(0, 1fr);

    }

    .bib-category-header-actions {

      grid-column: 2;

      align-items: flex-start;

      justify-self: flex-start;

    }

    .bib-category-filters {

      grid-template-columns: 1fr 1fr;

    }

    .bib-category-search {

      grid-column: 1 / -1;

    }

    .bib-category-clear,

    .bib-category-search-button {

      grid-column: auto;

      width: 100%;

    }

  }

  @media (max-width: 680px) {

    .bib-category-page {

      gap: 14px;

    }

    .bib-category-header {

      grid-template-columns: 1fr;

      padding: 22px;

    }

    .bib-category-header-actions {

      grid-column: auto;

      align-items: stretch;

      justify-self: stretch;

    }

    .bib-category-back {
      width: 100%;

    }

    .bib-category-filters {
      grid-template-columns: 1fr;

    }

    .bib-category-search,
    .bib-category-clear,
    .bib-category-search-button {
      grid-column: auto;

    }

    .bib-category-resource-grid,

    .bib-category-loading-grid {
      grid-template-columns: 1fr;

    }

  }

`;
