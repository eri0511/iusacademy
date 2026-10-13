import { ExternalLink, FileText, X } from "lucide-react";

type Props = {
  url: string;
  nombre: string;
  onCerrar: () => void;
};

export default function VisorPdfBiblioteca({
  url,
  nombre,
  onCerrar,
}: Props) {
  return (
    <>
      <section className="bib-pdf-viewer">
        <header className="bib-pdf-viewer__header">
          <div className="bib-pdf-viewer__title">
            <span className="bib-pdf-viewer__icon">
              <FileText size={19} />
            </span>

            <div>
              <span>Vista previa del documento</span>
              <strong>{nombre}</strong>
            </div>
          </div>

          <div className="bib-pdf-viewer__actions">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir PDF en otra pestaña"
            >
              <ExternalLink size={17} />
              <span>Abrir aparte</span>
            </a>

            <button
              type="button"
              aria-label="Cerrar visor"
              title="Cerrar vista previa"
              onClick={onCerrar}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="bib-pdf-viewer__body">
          <iframe
            src={`${url}#toolbar=1&navpanes=0&view=FitH`}
            title={`Vista previa de ${nombre}`}
          />
        </div>
      </section>

      <style>{styles}</style>
    </>
  );
}

const styles = `
  .bib-pdf-viewer {
    width: 100%;
    overflow: hidden;
    background: var(--app-surface-raised, #ffffff);
    border: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  }

  .bib-pdf-viewer__header {
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px;
    background: #ffffff;
    border-bottom: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));
  }

  .bib-pdf-viewer__title {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bib-pdf-viewer__icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    color: var(--app-accent-700, #d86827);
    background: var(--app-accent-50, #fff5ec);
    border-radius: 12px;
  }

  .bib-pdf-viewer__title > div {
    min-width: 0;
  }

  .bib-pdf-viewer__title span {
    display: block;
    margin-bottom: 3px;
    color: var(--app-text-soft, #64748b);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .bib-pdf-viewer__title strong {
    display: block;
    overflow: hidden;
    color: var(--app-text, #0f172a);
    font-size: 13px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bib-pdf-viewer__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .bib-pdf-viewer__actions a,
  .bib-pdf-viewer__actions button {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 12px;
    border: 1px solid var(--app-border, rgba(241, 139, 75, 0.2));
    border-radius: 11px;
    background: var(--app-accent-50, #fff5ec);
    color: var(--app-accent-700, #d86827);
    font: inherit;
    font-size: 11px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
    transition:
      background 160ms ease,
      border-color 160ms ease,
      transform 160ms ease;
  }

  .bib-pdf-viewer__actions a:hover,
  .bib-pdf-viewer__actions button:hover {
    background: var(--app-accent-100, #ffe9d6);
    border-color: var(--app-border-strong, rgba(241, 139, 75, 0.36));
    transform: translateY(-1px);
  }

  .bib-pdf-viewer__body {
    height: min(72vh, 780px);
    min-height: 560px;
    padding: 10px;
    background: #f5f6f8;
  }

  .bib-pdf-viewer__body iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 12px;
    background: #ffffff;
  }

  @media (max-width: 700px) {
    .bib-pdf-viewer__header {
      align-items: flex-start;
    }

    .bib-pdf-viewer__actions a span {
      display: none;
    }

    .bib-pdf-viewer__body {
      height: 68vh;
      min-height: 440px;
      padding: 6px;
    }
  }
`;