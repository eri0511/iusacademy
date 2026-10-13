import type { Dispatch, SetStateAction } from "react";
import { categorias, vigencias } from "../../types/biblioteca/biblioteca.types";
import type {
  Categoria,
  Ficha,
  Vigencia,
} from "../../types/biblioteca/biblioteca.types";

type Props = {
  ficha: Ficha;
  etiquetasTexto: string;
  deshabilitado?: boolean;
  setFicha: Dispatch<SetStateAction<Ficha>>;
  setEtiquetasTexto: Dispatch<SetStateAction<string>>;
};

export default function BibliotecaFormularioInformacion({
  ficha,
  etiquetasTexto,
  deshabilitado = false,
  setFicha,
  setEtiquetasTexto,
}: Props) {
  return (
    <div className="bib-recurso-form__grid">
      <label className="bib-recurso-form__wide">
        <span>Título <b>*</b></span>
        <input
          value={ficha.titulo}
          maxLength={200}
          disabled={deshabilitado}
          placeholder="Ej. Demanda de usucapión"
          onChange={(e) => setFicha((actual) => ({ ...actual, titulo: e.target.value }))}
        />
      </label>

      <label>
        <span>Categoría <b>*</b></span>
        <select
          value={ficha.categoria}
          disabled={deshabilitado}
          onChange={(e) =>
            setFicha((actual) => ({
              ...actual,
              categoria: e.target.value as Categoria,
            }))
          }
        >
          {Object.entries(categorias).map(([clave, etiqueta]) => (
            <option key={clave} value={clave}>{etiqueta}</option>
          ))}
        </select>
      </label>

      <label>
        <span>Tema <b>*</b></span>
        <input
          value={ficha.tema}
          maxLength={120}
          disabled={deshabilitado}
          placeholder="Ej. Derecho Civil"
          onChange={(e) => setFicha((actual) => ({ ...actual, tema: e.target.value }))}
        />
      </label>

      <label className="bib-recurso-form__wide">
        <span>Descripción <b>*</b></span>
        <textarea
          value={ficha.descripcion}
          maxLength={5000}
          rows={4}
          disabled={deshabilitado}
          placeholder="Describe brevemente el contenido y utilidad del recurso..."
          onChange={(e) =>
            setFicha((actual) => ({ ...actual, descripcion: e.target.value }))
          }
        />
        <small>{ficha.descripcion.length} / 5000</small>
      </label>

      <label className="bib-recurso-form__wide">
        <span>Finalidad</span>
        <textarea
          value={ficha.finalidad ?? ""}
          maxLength={3000}
          rows={2}
          disabled={deshabilitado}
          placeholder="¿Para qué puede utilizarse este recurso?"
          onChange={(e) =>
            setFicha((actual) => ({ ...actual, finalidad: e.target.value }))
          }
        />
      </label>

      <label>
        <span>Autor / institución</span>
        <input
          value={ficha.autorInstitucion ?? ""}
          maxLength={250}
          disabled={deshabilitado}
          placeholder="Ej. Tribunal Supremo de Justicia"
          onChange={(e) =>
            setFicha((actual) => ({ ...actual, autorInstitucion: e.target.value }))
          }
        />
      </label>

      <label>
        <span>Fecha del documento</span>
        <input
          type="date"
          value={ficha.fechaDocumento ?? ""}
          disabled={deshabilitado}
          onChange={(e) =>
            setFicha((actual) => ({ ...actual, fechaDocumento: e.target.value }))
          }
        />
      </label>

      <label className="bib-recurso-form__wide">
        <span>Fuente</span>
        <input
          value={ficha.fuente ?? ""}
          maxLength={1000}
          disabled={deshabilitado}
          placeholder="Fuente oficial o referencia bibliográfica"
          onChange={(e) =>
            setFicha((actual) => ({ ...actual, fuente: e.target.value }))
          }
        />
      </label>

      <label>
        <span>Número de norma</span>
        <input
          value={ficha.numeroNorma ?? ""}
          maxLength={100}
          disabled={deshabilitado}
          placeholder="Ej. Ley N.º 439"
          onChange={(e) =>
            setFicha((actual) => ({ ...actual, numeroNorma: e.target.value }))
          }
        />
      </label>

      <label>
        <span>Número de resolución</span>
        <input
          value={ficha.numeroResolucion ?? ""}
          maxLength={100}
          disabled={deshabilitado}
          placeholder="Ej. SCP 0123/2026"
          onChange={(e) =>
            setFicha((actual) => ({ ...actual, numeroResolucion: e.target.value }))
          }
        />
      </label>

      <label>
        <span>Tribunal</span>
        <input
          value={ficha.tribunal ?? ""}
          maxLength={250}
          disabled={deshabilitado}
          placeholder="Ej. Tribunal Constitucional Plurinacional"
          onChange={(e) =>
            setFicha((actual) => ({ ...actual, tribunal: e.target.value }))
          }
        />
      </label>

      <label>
        <span>Vigencia jurídica</span>
        <select
          value={ficha.vigencia}
          disabled={deshabilitado}
          onChange={(e) =>
            setFicha((actual) => ({
              ...actual,
              vigencia: e.target.value as Vigencia,
            }))
          }
        >
          {Object.entries(vigencias).map(([clave, etiqueta]) => (
            <option key={clave} value={clave}>{etiqueta}</option>
          ))}
        </select>
      </label>

      <label className="bib-recurso-form__wide">
        <span>Palabras clave</span>
        <input
          value={etiquetasTexto}
          disabled={deshabilitado}
          placeholder="civil, demanda, usucapión, proceso"
          onChange={(e) => setEtiquetasTexto(e.target.value)}
        />
        <small>Separa las palabras clave con comas.</small>
      </label>

      <label className="bib-recurso-form__wide">
        <span>Observación de vigencia</span>
        <textarea
          value={ficha.observacionVigencia ?? ""}
          maxLength={2000}
          rows={2}
          disabled={deshabilitado}
          placeholder="Información adicional sobre vigencia, modificaciones o derogación..."
          onChange={(e) =>
            setFicha((actual) => ({
              ...actual,
              observacionVigencia: e.target.value,
            }))
          }
        />
      </label>

      <label className="bib-recurso-form__check bib-recurso-form__wide">
        <input
          type="checkbox"
          checked={ficha.destacado}
          disabled={deshabilitado}
          onChange={(e) =>
            setFicha((actual) => ({ ...actual, destacado: e.target.checked }))
          }
        />
        <span>
          <strong>Destacar recurso</strong>
          <small>El recurso tendrá mayor visibilidad dentro de la biblioteca.</small>
        </span>
      </label>
    </div>
  );
}
