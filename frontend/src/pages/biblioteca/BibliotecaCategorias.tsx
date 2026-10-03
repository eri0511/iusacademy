import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  FileCheck2,
  FilePenLine,
  FileText,
  FolderOpen,
  Gavel,
  GraduationCap,
  Landmark,
  Scale,
  ScrollText,
  Search,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import {
  mensajeError,
  useBiblioteca,
} from '../../contexts/BibliotecaContext';

import {
  categorias,
  type Categoria,
  type ResumenBiblioteca,
} from '../../types/biblioteca/biblioteca.types';

/* =========================================================
   CONFIGURACIÓN VISUAL DE LAS 11 CATEGORÍAS
========================================================= */

type CategoriaTone =
  | 'orange'
  | 'purple'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'pink'
  | 'teal'
  | 'indigo'
  | 'amber'
  | 'rose'
  | 'slate';

type CategoriaVisual = {
  categoria: Categoria;
  descripcion: string;
  tono: CategoriaTone;
  Icon: LucideIcon;
};

const categoriasVisuales: CategoriaVisual[] = [
  {
    categoria: 'MEMORIAL',
    descripcion:
      'Memoriales y escritos jurídicos utilizados en distintos trámites y procesos.',
    tono: 'orange',
    Icon: FilePenLine,
  },
  {
    categoria: 'CONTRATO',
    descripcion:
      'Modelos y documentos contractuales para diferentes actos y relaciones jurídicas.',
    tono: 'purple',
    Icon: FileCheck2,
  },
  {
    categoria: 'DEMANDA',
    descripcion:
      'Modelos de demandas y documentos para el inicio de procesos judiciales.',
    tono: 'blue',
    Icon: Scale,
  },
  {
    categoria: 'JURISPRUDENCIA',
    descripcion:
      'Criterios, resoluciones y precedentes emitidos por órganos jurisdiccionales.',
    tono: 'green',
    Icon: Gavel,
  },
  {
    categoria: 'CODIGO',
    descripcion:
      'Códigos jurídicos y cuerpos normativos disponibles para consulta.',
    tono: 'yellow',
    Icon: BookOpen,
  },
  {
    categoria: 'LEY',
    descripcion:
      'Leyes y disposiciones normativas vigentes disponibles en la biblioteca.',
    tono: 'pink',
    Icon: Landmark,
  },
  {
    categoria: 'SENTENCIA',
    descripcion:
      'Sentencias y resoluciones judiciales para consulta y análisis jurídico.',
    tono: 'teal',
    Icon: ScrollText,
  },
  {
    categoria: 'DOCTRINA',
    descripcion:
      'Material doctrinal, estudios y contenidos de autores especializados.',
    tono: 'indigo',
    Icon: GraduationCap,
  },
  {
    categoria: 'GUIA',
    descripcion:
      'Guías y materiales de orientación para apoyar el aprendizaje jurídico.',
    tono: 'amber',
    Icon: FolderOpen,
  },
  {
    categoria: 'CASO_PRACTICO',
    descripcion:
      'Casos prácticos para analizar y aplicar conocimientos jurídicos.',
    tono: 'rose',
    Icon: ShieldCheck,
  },
  {
    categoria: 'OTRO',
    descripcion:
      'Otros recursos jurídicos y académicos disponibles en la biblioteca.',
    tono: 'slate',
    Icon: FileText,
  },
];

/* =========================================================
   COMPONENTE
========================================================= */

export default function BibliotecaCategorias() {
  const { api, base } = useBiblioteca();

  const [resumen, setResumen] =
    useState<ResumenBiblioteca | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  /* =======================================================
     CARGAR RESUMEN
  ======================================================= */

  useEffect(() => {
    const controller = new AbortController();

    setCargando(true);
    setError('');

    api
      .get<ResumenBiblioteca>('/resumen', controller.signal)
      .then((data) => {
        setResumen(data);
      })
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
  }, [api]);

  /* =======================================================
     TOTAL POR CATEGORÍA
  ======================================================= */

  function obtenerTotal(categoria: Categoria) {
    return (
      resumen?.categorias.find(
        (item) => item.categoria === categoria,
      )?.total ?? 0
    );
  }

  /* =======================================================
     FILTRADO
  ======================================================= */

  const categoriasFiltradas = useMemo(() => {
    const termino = busqueda
      .trim()
      .toLocaleLowerCase('es');

    if (!termino) {
      return categoriasVisuales;
    }

    return categoriasVisuales.filter((item) => {
      const nombre = categorias[item.categoria];

      const contenido =
        `${nombre} ${item.descripcion}`.toLocaleLowerCase(
          'es',
        );

      return contenido.includes(termino);
    });
  }, [busqueda]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="bib-categories-page">

      {/* ===================================================
          ENCABEZADO
      =================================================== */}

      <section className="bib-categories-section-head">
        <div>
          <h2>Categorías disponibles</h2>

          <p>
            Selecciona una categoría para explorar sus recursos.
          </p>
        </div>

        <span className="bib-categories-count">
          {categoriasFiltradas.length}{' '}
          {categoriasFiltradas.length === 1
            ? 'categoría'
            : 'categorías'}
        </span>
      </section>

      {/* ===================================================
          BUSCADOR
      =================================================== */}

      <section className="bib-categories-search-card">
        <div className="bib-categories-search">
          <Search size={21} strokeWidth={2} />

          <input
            type="search"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
            placeholder="Buscar una categoría..."
            aria-label="Buscar una categoría"
          />

          {busqueda && (
            <button
              type="button"
              className="bib-categories-search-clear"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>
      </section>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="bib-categories-message bib-categories-message-error">
          <FileText size={25} />

          <div>
            <strong>
              No se pudieron cargar las cantidades
            </strong>

            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ===================================================
          CONTENIDO
      =================================================== */}

      {cargando ? (
        <div className="bib-categories-grid">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                className="bib-category-skeleton"
                key={`categoria-skeleton-${index}`}
              >
                <div className="bib-category-skeleton-icon" />

                <div className="bib-category-skeleton-content">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ),
          )}
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <div className="bib-categories-empty">
          <div className="bib-categories-empty-icon">
            <Search size={27} />
          </div>

          <h3>No encontramos esa categoría</h3>

          <p>
            Prueba escribiendo otro nombre o término
            relacionado.
          </p>

          <button
            type="button"
            onClick={() => setBusqueda('')}
          >
            Ver todas las categorías
          </button>
        </div>
      ) : (
        <div className="bib-categories-grid">
          {categoriasFiltradas.map((item) => {
            const {
              categoria,
              descripcion,
              tono,
              Icon,
            } = item;

            const nombre = categorias[categoria];
            const total = obtenerTotal(categoria);

            return (
              <Link
                key={categoria}
                to={`${base}?categoria=${encodeURIComponent(
                  categoria,
                )}`}
                className={`bib-category-card tone-${tono}`}
              >
                <div className="bib-category-card-icon">
                  <Icon
                    size={33}
                    strokeWidth={2}
                  />
                </div>

                <div className="bib-category-card-content">
                  <div className="bib-category-card-title">
                    <h3>{nombre}</h3>

                    <span>
                      {total}{' '}
                      {total === 1
                        ? 'recurso'
                        : 'recursos'}
                    </span>
                  </div>

                  <p>{descripcion}</p>

                  <div className="bib-category-card-link">
                    <strong>
                      Explorar recursos
                    </strong>

                    <ChevronRight
                      size={16}
                      strokeWidth={2.4}
                    />
                  </div>
                </div>

                <div className="bib-category-card-arrow">
                  <ChevronRight
                    size={21}
                    strokeWidth={2.3}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style>{categoriasStyles}</style>
    </div>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const categoriasStyles = `
  .bib-categories-page {
    width: 100%;
    min-width: 0;

    display: grid;
    gap: 18px;

    padding-bottom: 28px;

    color: var(--app-text, #0f172a);
  }

  /* =======================================================
     CABECERA
  ======================================================= */

  .bib-categories-section-head {
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;

    padding: 19px 22px;

    background:
      linear-gradient(
        135deg,
        rgba(255, 255, 255, 1) 0%,
        rgba(255, 253, 249, 0.98) 100%
      );

    border: 1px solid
      var(--app-border, rgba(241, 139, 75, 0.2));

    border-radius: 20px;

    box-shadow:
      0 8px 24px rgba(15, 23, 42, 0.028);

    box-sizing: border-box;
  }

  .bib-categories-section-head h2 {
    margin: 0;

    color: var(--app-text, #0f172a);

    font-size: 21px;
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: -0.025em;
  }

  .bib-categories-section-head p {
    margin: 5px 0 0;

    color:
      var(--app-text-secondary, #475569);

    font-size: 13px;
    line-height: 1.45;
  }

  .bib-categories-count {
    flex: 0 0 auto;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    min-height: 38px;

    padding: 0 16px;

    color:
      var(--app-accent-700, #d86827);

    background: #fff8f1;

    border:
      1px solid rgba(241, 139, 75, 0.3);

    border-radius: 999px;

    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.9);

    font-size: 12px;
    font-weight: 900;

    white-space: nowrap;
  }

  /* =======================================================
     BUSCADOR
  ======================================================= */

  .bib-categories-search-card {
    width: 100%;

    padding: 10px 18px;

    background:
      var(--app-surface-raised, #ffffff);

    border:
      1px solid
      var(--app-border, rgba(241, 139, 75, 0.2));

    border-radius: 20px;

    box-shadow:
      0 8px 22px rgba(15, 23, 42, 0.025);

    box-sizing: border-box;

    transition:
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  .bib-categories-search-card:focus-within {
    border-color:
      rgba(241, 139, 75, 0.42);

    box-shadow:
      0 8px 24px rgba(15, 23, 42, 0.03),
      0 0 0 3px rgba(241, 139, 75, 0.07);
  }

  .bib-categories-search {
    width: 100%;
    min-height: 44px;

    display: flex;
    align-items: center;
    gap: 12px;

    color:
      var(--app-accent-600, #ea7a35);
  }

  .bib-categories-search input {
    width: 100%;
    min-width: 0;

    padding: 10px 0;

    color:
      var(--app-text, #0f172a);

    background: transparent;

    border: 0;
    outline: none;

    font: inherit;
    font-size: 14px;
    font-weight: 600;
  }

  .bib-categories-search input::placeholder {
    color: #94a3b8;
    opacity: 1;
  }

  .bib-categories-search input::-webkit-search-cancel-button {
    display: none;
  }

  .bib-categories-search-clear {
    width: 34px;
    height: 34px;

    flex: 0 0 34px;

    display: grid;
    place-items: center;

    padding: 0;

    color:
      var(--app-text-soft, #64748b);

    background: #fff8f1;

    border:
      1px solid rgba(241, 139, 75, 0.18);

    border-radius: 11px;

    font-size: 21px;
    line-height: 1;

    cursor: pointer;

    transition:
      color 160ms ease,
      background 160ms ease,
      transform 160ms ease;
  }

  .bib-categories-search-clear:hover {
    color:
      var(--app-accent-700, #d86827);

    background: #fff1e6;

    transform: translateY(-1px);
  }

  /* =======================================================
     GRID
  ======================================================= */

  .bib-categories-grid {
    width: 100%;

    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));

    gap: 15px;
  }

  /* =======================================================
     CARD
  ======================================================= */

  .bib-category-card {
    --category-color: #ea7a35;
    --category-soft: #fff1e7;

    position: relative;

    min-width: 0;
    min-height: 172px;

    display: grid;

    grid-template-columns:
      64px minmax(0, 1fr) 38px;

    align-items: center;

    gap: 16px;

    padding: 22px;

    color:
      var(--app-text, #0f172a);

    text-decoration: none;

    background:
      var(--category-soft);

    border:
      1px solid
      color-mix(
        in srgb,
        var(--category-color) 24%,
        transparent
      );

    border-radius: 22px;

    box-shadow:
      0 10px 25px rgba(15, 23, 42, 0.025);

    overflow: hidden;

    box-sizing: border-box;

    isolation: isolate;

    transition:
      transform 180ms ease,
      box-shadow 180ms ease,
      border-color 180ms ease;
  }

  /* brillo decorativo inferior */

  .bib-category-card::before {
    content: '';

    position: absolute;

    left: 24px;
    right: 24px;
    bottom: 0;

    height: 2px;

    background:
      linear-gradient(
        90deg,
        transparent,
        var(--category-color),
        transparent
      );

    opacity: 0;

    transition:
      opacity 180ms ease;

    z-index: 2;
  }

  /* círculo decorativo */

  .bib-category-card::after {
    content: '';

    position: absolute;

    right: -34px;
    bottom: -46px;

    width: 125px;
    height: 125px;

    background:
      rgba(255, 255, 255, 0.23);

    border-radius: 50%;

    pointer-events: none;

    z-index: -1;
  }

  .bib-category-card:hover {
    transform:
      translateY(-4px);

    border-color:
      color-mix(
        in srgb,
        var(--category-color) 46%,
        transparent
      );

    box-shadow:
      0 17px 35px rgba(15, 23, 42, 0.065),
      0 0 0 1px
        color-mix(
          in srgb,
          var(--category-color) 5%,
          transparent
        );
  }

  .bib-category-card:hover::before {
    opacity: 0.42;
  }

  /* =======================================================
     ICONO
  ======================================================= */

  .bib-category-card-icon {
    position: relative;
    z-index: 1;

    width: 64px;
    height: 64px;

    display: grid;
    place-items: center;

    color:
      var(--category-color);

    background:
      rgba(255, 255, 255, 0.72);

    border:
      1px solid
      color-mix(
        in srgb,
        var(--category-color) 17%,
        white
      );

    border-radius: 18px;

    box-shadow:
      inset 0 1px 0
        rgba(255, 255, 255, 0.9),
      0 5px 12px
        rgba(15, 23, 42, 0.025);

    transition:
      transform 180ms ease,
      background 180ms ease;
  }

  .bib-category-card:hover
  .bib-category-card-icon {
    transform:
      translateY(-2px)
      scale(1.035);

    background:
      rgba(255, 255, 255, 0.88);
  }

  /* =======================================================
     CONTENIDO
  ======================================================= */

  .bib-category-card-content {
    position: relative;
    z-index: 1;

    min-width: 0;
  }

  .bib-category-card-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    gap: 8px;

    margin-bottom: 8px;
  }

  .bib-category-card-title h3 {
    margin: 0;

    color:
      var(--app-text, #0f172a);

    font-size: 17px;
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  /* contador individual */

  .bib-category-card-title span {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    min-height: 23px;

    padding: 0 9px;

    color:
      var(--category-color);

    background:
      rgba(255, 255, 255, 0.78);

    border:
      1px solid
      color-mix(
        in srgb,
        var(--category-color) 15%,
        white
      );

    border-radius: 999px;

    box-shadow:
      inset 0 1px 0
        rgba(255, 255, 255, 0.85);

    font-size: 10px;
    font-weight: 900;

    white-space: nowrap;
  }

  .bib-category-card-content > p {
    min-height: 39px;

    margin: 0;

    color:
      var(--app-text-secondary, #475569);

    font-size: 12.5px;
    line-height: 1.55;
  }

  /* =======================================================
     EXPLORAR
  ======================================================= */

  .bib-category-card-link {
    display: inline-flex;
    align-items: center;

    gap: 4px;

    margin-top: 10px;

    color:
      var(--category-color);

    font-size: 12px;
    font-weight: 900;
  }

  .bib-category-card-link svg {
    transition:
      transform 160ms ease;
  }

  .bib-category-card:hover
  .bib-category-card-link svg {
    transform:
      translateX(3px);
  }

  /* =======================================================
     FLECHA DERECHA
  ======================================================= */

  .bib-category-card-arrow {
    position: relative;
    z-index: 1;

    width: 38px;
    height: 38px;

    display: grid;
    place-items: center;

    color:
      var(--category-color);

    background:
      rgba(255, 255, 255, 0.74);

    border:
      1px solid
      color-mix(
        in srgb,
        var(--category-color) 15%,
        white
      );

    border-radius: 50%;

    box-shadow:
      0 4px 10px
        rgba(15, 23, 42, 0.025);

    transition:
      transform 160ms ease,
      background 160ms ease,
      box-shadow 160ms ease;
  }

  .bib-category-card:hover
  .bib-category-card-arrow {
    transform:
      translateX(4px);

    background:
      rgba(255, 255, 255, 0.94);

    box-shadow:
      0 5px 12px
        rgba(15, 23, 42, 0.05);
  }

  /* =======================================================
     TONOS DE LAS 11 CATEGORÍAS
  ======================================================= */

  .bib-category-card.tone-orange {
    --category-color: #ea6d22;
    --category-soft: #fff0e5;
  }

  .bib-category-card.tone-purple {
    --category-color: #7c3aed;
    --category-soft: #f2ebff;
  }

  .bib-category-card.tone-blue {
    --category-color: #2f80ed;
    --category-soft: #e8f2ff;
  }

  .bib-category-card.tone-green {
    --category-color: #18a86b;
    --category-soft: #e9f9f0;
  }

  .bib-category-card.tone-yellow {
    --category-color: #d97706;
    --category-soft: #fff6dc;
  }

  .bib-category-card.tone-pink {
    --category-color: #e91e63;
    --category-soft: #ffedf3;
  }

  .bib-category-card.tone-teal {
    --category-color: #0f9f9a;
    --category-soft: #e8f8f7;
  }

  .bib-category-card.tone-indigo {
    --category-color: #6366f1;
    --category-soft: #eeefff;
  }

  .bib-category-card.tone-amber {
    --category-color: #d88a00;
    --category-soft: #fff4d9;
  }

  .bib-category-card.tone-rose {
    --category-color: #e5486d;
    --category-soft: #ffedf1;
  }

  .bib-category-card.tone-slate {
    --category-color: #64748b;
    --category-soft: #f1f5f9;
  }

  /* =======================================================
     ERROR
  ======================================================= */

  .bib-categories-message {
    display: flex;
    align-items: flex-start;

    gap: 12px;

    padding: 15px 18px;

    border-radius: 16px;
  }

  .bib-categories-message-error {
    color: #b42318;

    background: #fff5f4;

    border: 1px solid #fecaca;
  }

  .bib-categories-message strong {
    display: block;

    margin-bottom: 3px;

    font-size: 13px;
    font-weight: 900;
  }

  .bib-categories-message p {
    margin: 0;

    font-size: 12px;
    line-height: 1.45;
  }

  /* =======================================================
     SIN RESULTADOS
  ======================================================= */

  .bib-categories-empty {
    min-height: 245px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding: 30px;

    text-align: center;

    background:
      var(--app-surface-raised, #ffffff);

    border:
      1px solid
      var(--app-border, rgba(241, 139, 75, 0.2));

    border-radius: 22px;
  }

  .bib-categories-empty-icon {
    width: 54px;
    height: 54px;

    display: grid;
    place-items: center;

    margin-bottom: 13px;

    color:
      var(--app-accent-600, #ea7a35);

    background: #fff2e7;

    border-radius: 16px;
  }

  .bib-categories-empty h3 {
    margin: 0;

    color:
      var(--app-text, #0f172a);

    font-size: 17px;
    font-weight: 900;
  }

  .bib-categories-empty p {
    margin: 7px 0 16px;

    color:
      var(--app-text-secondary, #475569);

    font-size: 13px;
  }

  .bib-categories-empty button {
    min-height: 38px;

    padding: 0 15px;

    color:
      var(--app-accent-700, #d86827);

    background: #fff8f1;

    border:
      1px solid rgba(241, 139, 75, 0.28);

    border-radius: 12px;

    font: inherit;
    font-size: 12px;
    font-weight: 900;

    cursor: pointer;
  }

  /* =======================================================
     SKELETON
  ======================================================= */

  .bib-category-skeleton {
    min-height: 172px;

    display: grid;

    grid-template-columns:
      64px minmax(0, 1fr);

    align-items: center;

    gap: 16px;

    padding: 22px;

    background:
      rgba(255, 255, 255, 0.62);

    border:
      1px solid rgba(241, 139, 75, 0.12);

    border-radius: 22px;

    box-sizing: border-box;

    overflow: hidden;
  }

  .bib-category-skeleton-icon,
  .bib-category-skeleton-content span {
    background:
      linear-gradient(
        90deg,
        rgba(226, 232, 240, 0.55) 25%,
        rgba(248, 250, 252, 0.95) 50%,
        rgba(226, 232, 240, 0.55) 75%
      );

    background-size: 200% 100%;

    animation:
      bibCategoryShimmer
      1.35s
      infinite
      linear;
  }

  .bib-category-skeleton-icon {
    width: 64px;
    height: 64px;

    border-radius: 18px;
  }

  .bib-category-skeleton-content {
    display: grid;
    gap: 10px;
  }

  .bib-category-skeleton-content span {
    display: block;

    height: 12px;

    border-radius: 999px;
  }

  .bib-category-skeleton-content
  span:nth-child(1) {
    width: 46%;
    height: 16px;
  }

  .bib-category-skeleton-content
  span:nth-child(2) {
    width: 90%;
  }

  .bib-category-skeleton-content
  span:nth-child(3) {
    width: 65%;
  }

  @keyframes bibCategoryShimmer {
    from {
      background-position: 200% 0;
    }

    to {
      background-position: -200% 0;
    }
  }

  /* =======================================================
     RESPONSIVE
  ======================================================= */

  @media (max-width: 1180px) {
    .bib-categories-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .bib-categories-page {
      gap: 14px;
    }

    .bib-categories-section-head {
      align-items: flex-start;

      padding: 17px 18px;
    }

    .bib-categories-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 520px) {
    .bib-categories-search-card {
      padding: 8px 14px;
    }

    .bib-categories-section-head {
      flex-direction: column;

      gap: 12px;
    }

    .bib-category-card {
      grid-template-columns:
        54px minmax(0, 1fr);

      gap: 13px;

      min-height: 155px;

      padding: 18px;
    }

    .bib-category-card-icon {
      width: 54px;
      height: 54px;

      border-radius: 16px;
    }

    .bib-category-card-arrow {
      display: none;
    }

    .bib-category-card-title {
      align-items: flex-start;
      flex-direction: column;

      gap: 5px;
    }

    .bib-category-card-content > p {
      min-height: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bib-category-card,
    .bib-category-card-icon,
    .bib-category-card-arrow,
    .bib-category-card-link svg,
    .bib-categories-search-clear,
    .bib-categories-search-card {
      transition: none !important;
    }

    .bib-category-skeleton-icon,
    .bib-category-skeleton-content span {
      animation: none !important;
    }
  }
`;