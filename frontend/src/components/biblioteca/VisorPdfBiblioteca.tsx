import { ExternalLink, X, FileText } from "lucide-react";
type Props = { url: string; nombre: string; onCerrar: () => void };
export default function VisorPdfBiblioteca({ url, nombre, onCerrar }: Props) {
  return (
    <section className="bib-panel bib-reader">
      <div className="bib-section-heading">
        <h3>
          <FileText size={18} />
          {nombre}
        </h3>
        <button aria-label="Cerrar visor" onClick={onCerrar}>
          <X size={16} />
        </button>
      </div>
      <iframe
        src={`${url}#toolbar=1&navpanes=1`}
        title={`Vista previa de ${nombre}`}
      />
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink size={15} /> Abrir PDF en otra pestaña
      </a>
    </section>
  );
}
