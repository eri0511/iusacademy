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
  Scale,
  Search,
} from 'lucide-react';
import {
  mensajeError,
  useBiblioteca,
} from '../../contexts/BibliotecaContext';
import type {
  Catalogo,
  Recurso,
  ResumenBiblioteca,
} from '../../types/biblioteca/biblioteca.types';
import {
  gruposBiblioteca,
  grupoPorId,
} from '../../types/biblioteca/biblioteca.visual';
import { TarjetaRecurso } from '../../components/biblioteca/TarjetaRecurso';

const icons = [
  Scale,
  BookOpen,
  Gavel,
  GraduationCap,
  FileText,
  FileText,
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

  const grupo = grupoPorId(params.get('grupo'));

  const esHome =
    !grupo &&
    !params.get('vista') &&
    !params.get('q') &&
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
    const controller = new AbortController();

    setCargando(true);
    setError('');

    const clean = new URLSearchParams(params);

    clean.delete('vista');
    clean.delete('grupo');
    clean.delete('categoria');

    const cargar = async () => {
      if (grupo) {
        const resultados = await Promise.all(
          grupo.categorias.map((categoria) =>
            api.get<Catalogo>(
              `/recursos?${new URLSearchParams({
                ...Object.fromEntries(clean),
                categoria,
                limite: '50',
              }).toString()}`,
              controller.signal,
            ),
          ),
        );

        const recursos = resultados.flatMap(
          (resultado) => resultado.recursos,
        );

        setDatos({
          recursos,
          total: resultados.reduce(
            (total, resultado) => total + resultado.total,
            0,
          ),
          pagina: 1,
          paginas: 1,
        });
      } else {
        if (esHome) {
          clean.set('limite', '4');
        }

        setDatos(
          await api.get<Catalogo>(
            `/recursos?${clean.toString()}`,
            controller.signal,
          ),
        );
      }
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
  }, [api, params, grupo?.id, esHome]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        gruposBiblioteca.map((item) => [
          item.id,
          item.categorias.reduce(
            (total, categoria) =>
              total +
              (resumen?.categorias.find(
                (dato) => dato.categoria === categoria,
              )?.total ?? 0),
            0,
          ),
        ]),
      ),
    [resumen],
  );

  function setFilter(key: string, value: string) {
    const nuevos = new URLSearchParams(params);

    if (value) {
      nuevos.set(key, value);
    } else {
      nuevos.delete(key);
    }

    if (!grupo) {
      nuevos.set('vista', 'todos');
    }

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
          <section className="bib-home-stats">
            <Stat
              variant="orange"
              icon={BookOpen}
              value={resumen?.totalRecursos ?? 0}
              label="Recursos disponibles"
            />

            <Stat
              variant="yellow"
              icon={FileText}
              value={gruposBiblioteca.length}
              label="Categorías"
            />

            <Stat
              variant="blue"
              icon={Download}
              value={resumen?.descargasPersonales ?? 0}
              label="Descargas totales"
            />

            <Stat
              variant="pink"
              icon={Heart}
              value={resumen?.favoritosPersonales ?? 0}
              label="Recursos favoritos"
            />
          </section>

          <form className="bib-home-search" onSubmit={buscar}>
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

            <button type="submit" className="bib-home-search__submit">
              <Search size={15} strokeWidth={2} />
              Buscar
            </button>
          </form>

          <section className="bib-home-block">
            <div className="bib-home-heading bib-home-heading--plain">
              <div>
                <h2>Categorías principales</h2>
              </div>

              <Link to={`${base}/categorias`}>
                Ver todas
                <span>→</span>
              </Link>
            </div>

            <div className="bib-home-categories-card">
              <div className="bib-home-categories">
                {gruposBiblioteca.map((item, index) => {
                  const Icon = icons[index];

                  return (
                    <Link
                      key={item.id}
                      to={`${base}?grupo=${item.id}`}
                      className={`bib-home-category tone-${item.tono}`}
                    >
                      <div className="bib-home-category__icon">
                        <Icon size={29} strokeWidth={1.9} />
                      </div>

                      <strong>{item.nombre}</strong>

                      <span>{counts[item.id] ?? 0} recursos</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bib-home-block">
            <div className="bib-home-heading bib-home-heading--plain">
              <div>
                <h2>Recursos recientes</h2>
              </div>

              <Link to={`${base}?vista=todos`}>
                Ver todos los recursos
                <span>→</span>
              </Link>
            </div>

            {renderRecursos(
              cargando,
              error,
              datos?.recursos ?? [],
              true,
              true,
            )}
          </section>
        </div>

        <style>{homeStyles}</style>
      </>
    );
  }

  return (
    <>
      <section
        className={`bib-category-hero tone-${grupo?.tono ?? 'orange'}`}
      >
        <div className="bib-category-hero-icon">
          {grupo?.nombre === 'Legislación' ? (
            <Scale size={38} />
          ) : (
            <BookOpen size={38} />
          )}
        </div>

        <div>
          <h1>{grupo?.nombre ?? 'Todos los recursos'}</h1>

          <p>
            {grupo?.descripcion ??
              'Explora todos los recursos disponibles en la biblioteca virtual.'}
          </p>

          {grupo && (
            <div className="bib-hero-pills">
              <span>
                {counts[grupo.id] ?? datos?.total ?? 0} recursos
              </span>
              <span>Documentos digitales</span>
            </div>
          )}
        </div>
      </section>

      <form className="bib-filter-strip" onSubmit={buscar}>
        <label>
          <Search size={19} />

          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título, autor o palabra clave..."
          />
        </label>

        <select
          value={params.get('formato') ?? ''}
          onChange={(e) => setFilter('formato', e.target.value)}
        >
          <option value="">Tipo de documento</option>
          <option value="pdf">PDF</option>
          <option value="doc">DOC</option>
          <option value="docx">DOCX</option>
          <option value="enlace">Enlace</option>
        </select>

        <select
          value={params.get('anio') ?? ''}
          onChange={(e) => setFilter('anio', e.target.value)}
        >
          <option value="">Año</option>

          {anios.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>

        <select
          value={params.get('orden') ?? 'recientes'}
          onChange={(e) => setFilter('orden', e.target.value)}
        >
          <option value="recientes">Más recientes</option>
          <option value="titulo">Título A-Z</option>
          <option value="antiguos">Más antiguos</option>
        </select>

        <button type="submit">
          <Filter size={17} />
          Filtrar
        </button>
      </form>

      <section className="bib-home-section">
        <div className="bib-section-title">
          <h2>{grupo?.nombre ?? 'Recursos'}</h2>
          <span>{datos?.total ?? 0} recursos</span>
        </div>

        {renderRecursos(
          cargando,
          error,
          datos?.recursos ?? [],
        )}
      </section>
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

    background: var(--app-surface, #fffdf9);
    border: 1px solid var(--app-border, rgba(241,139,75,.20));
    border-radius: 20px;

    box-shadow: var(
      --app-shadow-sm,
      0 6px 20px rgba(15,23,42,.035)
    );

    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  .bib-home-stat:hover {
    transform: translateY(-2px);
    border-color: var(--app-border-strong, rgba(241,139,75,.34));
    box-shadow: 0 10px 26px rgba(15,23,42,.055);
  }

  .bib-home-stat__icon {
    width: 54px;
    height: 54px;
    flex: 0 0 54px;

    display: grid;
    place-items: center;

    border-radius: 16px;
  }

  .bib-home-stat--orange .bib-home-stat__icon {
    color: #e66c22;
    background: #fff0e4;
  }

  .bib-home-stat--yellow .bib-home-stat__icon {
    color: #d98b00;
    background: #fff6da;
  }

  .bib-home-stat--blue .bib-home-stat__icon {
    color: #5366eb;
    background: #eef0ff;
  }

  .bib-home-stat--pink .bib-home-stat__icon {
    color: #df3561;
    background: #ffedf3;
  }

  .bib-home-stat strong {
    display: block;
    margin: 0;

    color: var(--app-text, #0f172a);

    font-size: 27px;
    font-weight: 850;
    line-height: 1;
  }

  .bib-home-stat p {
    margin: 7px 0 0 !important;

    color: var(--app-text-secondary, #475569);

    font-size: 12px !important;
    line-height: 1.25 !important;
  }

  .bib-home-search {
    width: 100%;
    padding: 8px 10px 8px 16px;

    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;

    background: var(--app-surface, #fffdf9);
    border: 1px solid var(--app-border, rgba(241,139,75,.20));
    border-radius: 20px;

    box-shadow: var(
      --app-shadow-sm,
      0 6px 20px rgba(15,23,42,.03)
    );

    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  .bib-home-search:focus-within {
    border-color: var(--app-border-strong, rgba(241,139,75,.42));
    box-shadow:
      0 0 0 4px rgba(241,139,75,.08),
      0 9px 24px rgba(15,23,42,.04);
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
    color: var(--app-accent, #f18b4b);
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

    color: var(--app-text, #0f172a);
    font: inherit;
    font-size: 13px;
    font-weight: 650;
  }

  .bib-home-search__input-wrap input::placeholder {
    color: var(--app-text-muted, #94a3b8);
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

    color: var(--app-text-soft, #64748b);
    background: var(--app-surface-alt, #fffaf4);
    border: 1px solid var(--app-border-soft, rgba(148,163,184,.18));
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
    color: #d8611b;
    background: var(--app-accent-soft, #fff3e9);
    border-color: var(--app-border, rgba(241,139,75,.20));
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
    background: linear-gradient(
      135deg,
      var(--app-accent, #f18b4b),
      #ef6b1d
    );
    border: 0;
    border-radius: 13px;

    font: inherit;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;

    box-shadow: 0 5px 14px rgba(239,107,29,.14);

    transition:
      transform 150ms ease,
      box-shadow 150ms ease,
      filter 150ms ease;
  }

  .bib-home-search__submit:hover {
    transform: translateY(-1px);
    filter: saturate(1.04);
    box-shadow: 0 8px 18px rgba(239,107,29,.18);
  }

  .bib-home-block {
    width: 100%;
    min-width: 0;
  }

  /* Segunda card independiente: contiene únicamente las categorías. */
  .bib-home-categories-card {
    width: 100%;
    padding: 7px;

    background: var(--app-surface, #fffdf9);
    border: 1px solid var(--app-border, rgba(241,139,75,.20));
    border-radius: 20px;

    box-shadow: var(
      --app-shadow-sm,
      0 6px 20px rgba(15,23,42,.03)
    );
  }

  /* El encabezado y las categorías son dos cards blancas separadas. */
  .bib-home-heading {
    min-height: 76px;
    margin-bottom: 12px;
    padding: 16px 20px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;

    background: var(--app-surface, #fffdf9);
    border: 1px solid var(--app-border, rgba(241,139,75,.20));
    border-radius: 18px;

    box-shadow: var(
      --app-shadow-sm,
      0 6px 20px rgba(15,23,42,.03)
    );
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

    color: #c75b1b;
    background: #ffffff;
    border: 1px solid var(--app-border, rgba(241,139,75,.24));
    border-radius: 12px;

    box-shadow: 0 4px 12px rgba(15,23,42,.025);
  }

  .bib-home-heading--plain > a:hover {
    background: #fffaf4;
    border-color: var(--app-border-strong, rgba(241,139,75,.36));
    transform: translateY(-1px);
    box-shadow: 0 7px 16px rgba(15,23,42,.045);
  }

  .bib-home-heading h2 {
    margin: 0;

    color: var(--app-text, #0f172a);

    font-size: 19px;
    font-weight: 850;
    line-height: 1.15;
  }

  .bib-home-heading p {
    margin: 5px 0 0 !important;

    color: var(--app-text-secondary, #475569);

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

    color: #d8611b;

    background: #fff7ef;
    border: 1px solid rgba(241,139,75,.30);
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
    background: #ffefe2;
    border-color: rgba(241,139,75,.46);
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
    --tone: #e86f27;
    --tone-bg: #fff0e5;

    min-width: 0;
    min-height: 112px;
    padding: 13px 8px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;

    color: var(--app-text, #0f172a) !important;
    background: var(--tone-bg);

    border: 1px solid rgba(255,255,255,.68);
    border-radius: 18px;

    text-align: center;
    text-decoration: none !important;

    box-shadow: 0 4px 14px rgba(15,23,42,.025);

    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      filter 160ms ease;
  }

  .bib-home-category:hover {
    transform: translateY(-3px);
    filter: saturate(1.04);
    box-shadow: 0 9px 22px rgba(15,23,42,.06);
  }

  .bib-home-category__icon {
    width: 38px;
    height: 38px;

    display: grid;
    place-items: center;

    color: var(--tone);
    background: rgba(255,255,255,.52);
    border: 1px solid rgba(255,255,255,.72);
    border-radius: 14px;

    transition:
      transform 170ms ease,
      background 170ms ease,
      box-shadow 170ms ease;
  }

  .bib-home-category:hover .bib-home-category__icon {
    transform: translateY(-2px) scale(1.04);
    background: rgba(255,255,255,.78);
    box-shadow: 0 6px 16px rgba(15,23,42,.05);
  }

  .bib-home-category strong {
    max-width: 100%;

    font-size: 12px;
    font-weight: 800;
    line-height: 1.25;
  }

  .bib-home-category > span {
    color: var(--app-text-secondary, #475569);
    font-size: 10.5px;
  }

  .bib-home-category.tone-orange {
    --tone: #e86f27;
    --tone-bg: #fff0e5;
  }

  .bib-home-category.tone-purple {
    --tone: #7c3aed;
    --tone-bg: #f3edff;
  }

  .bib-home-category.tone-blue {
    --tone: #2f7de1;
    --tone-bg: #eaf4ff;
  }

  .bib-home-category.tone-green {
    --tone: #20a567;
    --tone-bg: #eafaef;
  }

  .bib-home-category.tone-yellow {
    --tone: #d87908;
    --tone-bg: #fff7df;
  }

  .bib-home-category.tone-pink {
    --tone: #dc2d60;
    --tone-bg: #ffedf2;
  }

  .bib-home .bib-resource-grid {
    width: 100%;

    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 10px !important;
  }

  .bib-home .bib-loading,
  .bib-home .bib-empty {
    padding: 38px 22px;

    background: var(--app-surface, #fffdf9);
    border: 1px solid var(--app-border, rgba(241,139,75,.20));
    border-radius: 18px;

    color: var(--app-text-secondary, #475569);
    text-align: center;
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

    background: var(--app-surface, #fffdf9);
    border: 1px solid var(--app-border, rgba(241,139,75,.20));
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

    background: #f3eee8;
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
        rgba(255,255,255,.75),
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

    border-top: 1px solid var(--app-border-soft, rgba(148,163,184,.18));
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

    color: var(--app-accent, #f18b4b);
    background: var(--app-accent-soft, #fff3e9);
    border: 1px solid var(--app-border, rgba(241,139,75,.20));
    border-radius: 16px;
  }

  .bib-empty h3 {
    margin: 0;
    color: var(--app-text, #0f172a);
    font-size: 14px;
    font-weight: 850;
  }

  .bib-empty p {
    max-width: 460px;
    margin: 0 !important;
    color: var(--app-text-secondary, #475569);
    font-size: 11.5px !important;
    line-height: 1.5 !important;
  }

  .bib-empty--error > svg {
    color: #dc2d60;
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
