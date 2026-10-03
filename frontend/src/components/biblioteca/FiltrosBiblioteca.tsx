import { X } from "lucide-react";
import { categorias } from "../../types/biblioteca/biblioteca.types";

type Props = {
  params: URLSearchParams;
  temas: string[];
  anios: number[];
  limpiar: () => void;
  filtrar: (clave: string, valor: string) => void;
  dentroDeCategoria?: boolean;
};

export default function FiltrosBiblioteca({
  params,
  temas,
  anios,
  limpiar,
  filtrar,
  dentroDeCategoria = false,
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form className="bib-filter-bar" onSubmit={handleSubmit}>
      <div className="bib-filter-group">
        <label htmlFor="bib-search" className="bib-filter-label">
          Buscar
        </label>
        <div className="bib-search-input-wrapper">
          <svg
            className="bib-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            id="bib-search"
            type="search"
            placeholder="Título, descripción, tema…"
            value={params.get("q") ?? ""}
            onChange={(e) => filtrar("q", e.target.value)}
          />
        </div>
      </div>

      {!dentroDeCategoria && (
        <div className="bib-filter-group">
          <label htmlFor="bib-categoria" className="bib-filter-label">
            Categoría
          </label>
          <select
            id="bib-categoria"
            value={params.get("categoria") ?? ""}
            onChange={(e) => filtrar("categoria", e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {Object.entries(categorias).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bib-filter-group">
        <label htmlFor="bib-tema" className="bib-filter-label">
          Tema
        </label>
        <select
          id="bib-tema"
          value={params.get("tema") ?? ""}
          onChange={(e) => filtrar("tema", e.target.value)}
        >
          <option value="">Todos los temas</option>
          {temas.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="bib-filter-group">
        <label htmlFor="bib-formato" className="bib-filter-label">
          Formato
        </label>
        <select
          id="bib-formato"
          value={params.get("formato") ?? ""}
          onChange={(e) => filtrar("formato", e.target.value)}
        >
          <option value="">Todos los formatos</option>
          <option value="pdf">PDF</option>
          <option value="docx">Word · DOCX</option>
          <option value="doc">Word · DOC</option>
          <option value="enlace">Enlace</option>
        </select>
      </div>

      <div className="bib-filter-group">
        <label htmlFor="bib-anio" className="bib-filter-label">
          Año
        </label>
        <select
          id="bib-anio"
          value={params.get("anio") ?? ""}
          onChange={(e) => filtrar("anio", e.target.value)}
        >
          <option value="">Todos los años</option>
          {anios.map((a) => (
            <option key={a} value={String(a)}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="bib-filter-group">
        <label htmlFor="bib-orden" className="bib-filter-label">
          Orden
        </label>
        <select
          id="bib-orden"
          value={params.get("orden") ?? "recientes"}
          onChange={(e) => filtrar("orden", e.target.value)}
        >
          <option value="recientes">Más recientes</option>
          <option value="titulo">Título: A–Z</option>
          <option value="antiguos">Más antiguos</option>
        </select>
      </div>

      {params.size > 0 && (
        <button type="button" className="bib-filter-clear" onClick={limpiar}>
          <X size={14} /> Limpiar filtros
        </button>
      )}
    </form>
  );
}
