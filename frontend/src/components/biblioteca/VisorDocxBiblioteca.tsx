import { useEffect, useRef, useState } from "react";
import { Download, FileText} from "lucide-react";
import { renderAsync } from "docx-preview";

type Props = {
  url: string;
  nombre: string;
  onCerrar: () => void;
};

export default function VisorDocxBiblioteca({
  url,
  nombre,
}: Props) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const contenedor = contenedorRef.current;

    if (!contenedor) return;

    contenedor.innerHTML = "";
    setCargando(true);
    setError("");

    async function cargarDocumento() {
      try {
        const respuesta = await fetch(url, {
          signal: controller.signal,
        });

        if (!respuesta.ok) {
          throw new Error("No se pudo cargar el documento.");
        }

        const blob = await respuesta.blob();

        if (controller.signal.aborted || !contenedorRef.current) {
          return;
        }

        contenedorRef.current.innerHTML = "";

        await renderAsync(blob, contenedorRef.current, undefined, {
          className: "bib-docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });

        if (!controller.signal.aborted) {
          setCargando(false);
        }
      } catch (e) {
        if (controller.signal.aborted) return;

        setCargando(false);
        setError(
          e instanceof Error
            ? e.message
            : "No se pudo generar la vista previa del documento.",
        );
      }
    }

    void cargarDocumento();

    return () => {
      controller.abort();

      if (contenedor) {
        contenedor.innerHTML = "";
      }
    };
  }, [url]);

  return (
    <>
      <section className="bib-docx-viewer">
        <header className="bib-docx-viewer__header">
          <div className="bib-docx-viewer__title">
            <span className="bib-docx-viewer__icon">
              <FileText size={21} strokeWidth={2} />
            </span>

            <div className="bib-docx-viewer__title-text">
              <span>Vista previa del documento</span>
              <strong title={nombre}>{nombre}</strong>
            </div>
          </div>
        </header>

        <div className="bib-docx-viewer__body">
          {cargando && (
            <div className="bib-docx-viewer__state">
              <span className="bib-docx-viewer__state-icon">
                <FileText size={26} />
              </span>
              <strong>Cargando documento...</strong>
              <p>Preparando la vista previa del archivo Word.</p>
            </div>
          )}

          {error && (
            <div className="bib-docx-viewer__state">
              <span className="bib-docx-viewer__state-icon">
                <FileText size={26} />
              </span>
              <strong>No se pudo mostrar el documento</strong>
              <p>{error}</p>

              <a
                className="bib-docx-viewer__fallback"
                href={url}
                download={nombre}
              >
                <Download size={17} />
                Descargar archivo
              </a>
            </div>
          )}

          <div
            ref={contenedorRef}
            className={`bib-docx-viewer__document ${
              cargando || error ? "bib-docx-viewer__document--hidden" : ""
            }`}
          />
        </div>
      </section>

      <style>{styles}</style>
    </>
  );
}

const styles = `
  .bib-docx-viewer {
    width: 100%;
    min-width: 0;
    overflow: hidden;
    background: var(--app-surface-raised, #ffffff);
    border: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  }

  .bib-docx-viewer__header {
    min-height: 78px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 14px 18px;
    background: #ffffff;
    border-bottom: 1px solid var(--app-border-soft, rgba(148, 163, 184, 0.18));
  }

  .bib-docx-viewer__title {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .bib-docx-viewer__icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 50px;
    color: var(--app-accent-700, #d86827);
    background: var(--app-accent-50, #fff5ec);
    border: 1px solid var(--app-border, rgba(241, 139, 75, 0.2));
    border-radius: 14px;
  }

  .bib-docx-viewer__icon svg {
    display: block;
    color: var(--app-accent-700, #d86827);
    stroke: currentColor;
  }

  .bib-docx-viewer__title-text {
    min-width: 0;
  }

  .bib-docx-viewer__title-text > span {
    display: block;
    margin-bottom: 5px;
    color: var(--app-text-secondary, #475569);
    font-size: 12px;
    font-weight: 800;
  }

  .bib-docx-viewer__title-text > strong {
    display: block;
    max-width: min(560px, 50vw);
    overflow: hidden;
    color: var(--app-text, #0f172a);
    font-size: 14px;
    font-weight: 850;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bib-docx-viewer__actions {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-shrink: 0;
  }

  .bib-docx-viewer__actions a,
  .bib-docx-viewer__actions button {
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 16px;
    border: 1px solid var(--app-border-strong, rgba(241, 139, 75, 0.36));
    border-radius: 12px;
    background: var(--app-accent-50, #fff5ec);
    color: var(--app-accent-700, #d86827);
    font: inherit;
    font-size: 12px;
    font-weight: 850;
    text-decoration: none;
    cursor: pointer;
    transition:
      background 160ms ease,
      border-color 160ms ease,
      transform 160ms ease;
  }

  .bib-docx-viewer__actions button {
    width: 44px;
    padding: 0;
  }

  .bib-docx-viewer__actions a:hover,
  .bib-docx-viewer__actions button:hover {
    background: var(--app-accent-100, #ffe9d6);
    border-color: var(--app-accent, #f18b4b);
    transform: translateY(-1px);
  }

  .bib-docx-viewer__body {
    position: relative;
    width: 100%;
    min-width: 0;
    height: min(74vh, 820px);
    min-height: 560px;
    overflow-x: hidden;
    overflow-y: auto;
    background: #eef0f3;
    scrollbar-gutter: stable;
  }

  .bib-docx-viewer__document {
    width: 100%;
    min-width: 0;
    padding: 28px 20px 40px;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .bib-docx-viewer__document--hidden {
    visibility: hidden;
    height: 0;
    padding: 0;
    overflow: hidden;
  }

  .bib-docx-viewer__document .docx-wrapper {
    width: 100% !important;
    min-width: 0 !important;
    display: flex !important;
    flex-direction: column;
    align-items: center !important;
    gap: 24px;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    background: transparent !important;
  }

  .bib-docx-viewer__document .docx-wrapper > section.docx {
    width: min(100%, 816px) !important;
    min-width: 0 !important;
    max-width: 816px !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.12) !important;
  }

  .bib-docx-viewer__document .docx {
    max-width: 100% !important;
  }

  .bib-docx-viewer__document img,
  .bib-docx-viewer__document svg,
  .bib-docx-viewer__document canvas {
    max-width: 100% !important;
  }

  .bib-docx-viewer__document table {
    max-width: 100%;
  }

  .bib-docx-viewer__state {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
    background: #ffffff;
  }

  .bib-docx-viewer__state-icon {
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    margin-bottom: 18px;
    color: var(--app-accent-700, #d86827);
    background: var(--app-accent-50, #fff5ec);
    border-radius: 20px;
  }

  .bib-docx-viewer__state strong {
    color: var(--app-text, #0f172a);
    font-size: 18px;
    font-weight: 850;
  }

  .bib-docx-viewer__state p {
    max-width: 480px;
    margin: 8px 0 0;
    color: var(--app-text-soft, #64748b);
    font-size: 13px;
    line-height: 1.6;
  }

  .bib-docx-viewer__fallback {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 18px;
    padding: 0 16px;
    color: var(--app-accent-700, #d86827);
    background: var(--app-accent-50, #fff5ec);
    border: 1px solid var(--app-border-strong, rgba(241, 139, 75, 0.36));
    border-radius: 12px;
    font-size: 12px;
    font-weight: 850;
    text-decoration: none;
  }

  @media (max-width: 900px) {
    .bib-docx-viewer__document {
      padding: 20px 12px 32px;
    }

    .bib-docx-viewer__document .docx-wrapper > section.docx {
      max-width: 100% !important;
    }
  }

  @media (max-width: 700px) {
    .bib-docx-viewer__header {
      align-items: flex-start;
      padding: 12px;
    }

    .bib-docx-viewer__icon {
      width: 44px;
      height: 44px;
      flex-basis: 44px;
    }

    .bib-docx-viewer__title-text > strong {
      max-width: 44vw;
    }

    .bib-docx-viewer__actions a {
      width: 44px;
      padding: 0;
    }

    .bib-docx-viewer__actions a span {
      display: none;
    }

    .bib-docx-viewer__body {
      height: 68vh;
      min-height: 440px;
    }

    .bib-docx-viewer__document {
      padding: 14px 6px 24px;
    }
  }
`;