import { useState } from "react";
import { Link } from "react-router-dom";
import { useBiblioteca } from "../../contexts/BibliotecaContext";
import { fecha, nombre } from "../../utils/biblioteca/biblioteca.utils";
import type { Reporte } from "../../types/biblioteca/biblioteca.types";
export default function ReporteItem({
  reporte,
  ocupado,
  atender,
}: {
  reporte: Reporte;
  ocupado: boolean;
  atender: (estado: Reporte["estado"], respuesta: string) => Promise<void>;
}) {
  const { base } = useBiblioteca();
  const [estado, setEstado] = useState(reporte.estado);
  const [respuesta, setRespuesta] = useState(reporte.respuesta ?? "");
  return (
    <form
      className="bib-panel bib-stack"
      onSubmit={(e) => {
        e.preventDefault();
        void atender(estado, respuesta);
      }}
    >
      <div className="bib-section-heading">
        <Link to={`${base}/recursos/${reporte.recurso.id}`}>
          <strong>{reporte.recurso.titulo}</strong>
        </Link>
        <span className="bib-badge">{reporte.estado.replaceAll("_", " ")}</span>
      </div>
      <p className="bib-preserve">{reporte.motivo}</p>
      <small>
        {nombre(reporte.usuario)} · {fecha(reporte.creadoEn)}
      </small>
      <div className="bib-form-grid">
        <label className="bib-field">
          Estado
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as Reporte["estado"])}
          >
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_REVISION">En revisión</option>
            <option value="RESUELTO">Resuelto</option>
            <option value="DESCARTADO">Descartado</option>
          </select>
        </label>
        <label className="bib-field">
          Respuesta
          <textarea
            required
            minLength={3}
            maxLength={2000}
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
          />
        </label>
      </div>
      <button type="submit" disabled={ocupado}>
        Guardar atención
      </button>
    </form>
  );
}
