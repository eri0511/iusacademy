import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import FormularioRecursoBiblioteca from "../../components/biblioteca/FormularioRecursoBiblioteca";
import BibliotecaCatalogo from "./BibliotecaCatalogo";
import { useBiblioteca } from "../../contexts/BibliotecaContext";

export default function BibliotecaEditor() {
  const { id } = useParams();
  const { base } = useBiblioteca();
  const navigate = useNavigate();
  const panel = useRef<HTMLDialogElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const cerrar = useCallback(() => {
    if (!ocupado)
      navigate(id ? `${base}/recursos/${id}` : base, { replace: true });
  }, [base, id, navigate, ocupado]);
  useEffect(() => {
    const el = panel.current;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    el?.showModal();
    return () => {
      el?.close();
      document.body.style.overflow = overflowAnterior;
    };
  }, [id]);
  return (
    <>
      <BibliotecaCatalogo />
      <dialog
        className="bib-create-panel bib-create-dialog"
        ref={panel}
        onCancel={(e) => {
          e.preventDefault();
          cerrar();
        }}
        aria-describedby="bib-create-description"
        aria-labelledby="bib-create-title"
      >
        <header className="bib-create-panel-header">
          <div>
            <span className="bib-eyebrow">
              {id ? "EDITAR DOCUMENTO" : "NUEVO DOCUMENTO"}
            </span>
            <h2 id="bib-create-title">
              {id ? "Editar recurso jurídico" : "Crear recurso jurídico"}
            </h2>
            <p id="bib-create-description">
              Completa la información y agrega el documento o su enlace de
              consulta.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar formulario"
            disabled={ocupado}
            onClick={cerrar}
          >
            <X size={18} />
          </button>
        </header>
        <FormularioRecursoBiblioteca
          integrado
          onCancelar={cerrar}
          onOcupadoChange={setOcupado}
        />
      </dialog>
      <style>{styles}</style>
    </>
  );
}
const styles = `
.bib-create-panel {
  position: relative;
  overflow: hidden;
  margin-bottom: 26px;
  padding: 26px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-xl, 28px);
  background: var(--app-surface-raised);
  box-shadow: var(--app-shadow);
  outline: none;
}
.bib-create-panel::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--app-accent),
    var(--app-accent-dark),
    transparent
  );
}
.bib-create-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}
.bib-create-panel-header h2 {
  font-size: var(--app-font-page-title, 24px);
  margin: 10px 0;
  font-weight: var(--app-font-black, 900);
}
.bib-create-panel-header p {
  margin: 0;
  font-size: var(--app-font-body, 12.5px);
}
.bib-create-panel-header > button {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: var(--app-accent-soft);
  color: var(--app-accent-dark);
  border-radius: var(--app-radius-sm, 12px);
}
.bib-create-panel-header > button svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.bib .bib-create-panel .bib-resource-form {
  padding: 0;
  margin: 0;
  border: 0;
  box-shadow: none;
  background: transparent;
  overflow: visible;
}
.bib-create-panel .bib-form-sections {
  display: none;
}
.bib-create-panel .bib-form-section {
  padding: 18px 0;
}
.bib-create-panel .bib-form-section:first-of-type {
  padding-top: 0;
}
.bib-create-panel .bib-form-section-title h3 {
  font-size: var(--app-font-section, 14px);
}
.bib-create-panel .bib-form-footer {
  position: static;
  background: transparent;
  padding: 22px 0 0;
}
.bib-create-panel .bib-form-footer button {
  border-radius: 999px;
  padding: 12px 20px;
}
.bib-create-panel .bib-form-footer .primary {
  box-shadow: var(--app-shadow-sm);
}
.bib-create-panel .bib-field {
  color: var(--app-text-secondary);
  font-size: var(--app-font-body, 12.5px);
  letter-spacing: 0;
}
.bib-create-panel .bib-field input,
.bib-create-panel .bib-field select,
.bib-create-panel .bib-field textarea {
  min-height: 44px;
  border-radius: var(--app-radius-md, 16px);
  background: var(--app-input-bg);
  border-color: var(--app-input-border);
  font-size: var(--app-font-body, 12.5px);
}
@media (max-width: 700px) {
  .bib-create-panel {
    padding: 19px;
    border-radius: 20px;
  }
  .bib-create-panel-header h2 {
    font-size: var(--app-font-title, 19px);
  }
  .bib-create-panel .bib-form-footer-hint {
    width: 100%;
  }
  .bib-create-panel .bib-form-footer button {
    flex: 1;
  }
}

.bib-create-panel {
  padding: 21px 24px;
  border-radius: 23px;
  background: var(--app-surface);
  margin-bottom: 18px;
}
.bib-create-panel::before {
  background: linear-gradient(
    90deg,
    var(--app-accent),
    color-mix(in srgb, var(--app-accent) 45%, var(--app-warning-bg)),
    transparent 80%
  );
}
.bib-create-panel-header {
  margin-bottom: 22px;
}
.bib-create-panel-header h2 {
  font-size: 19px;
  font-weight: 850;
  margin: 5px 0 0;
}
.bib-create-panel-header p {
  font-size: 13px;
  margin: 5px 0 0;
}
.bib-create-panel .bib-form-section-title {
  display: none;
}
.bib-create-panel .bib-form-content {
  gap: 22px;
}
.bib-create-panel .bib-form-section {
  border: 0;
  padding: 0;
  gap: 18px;
}
.bib-create-panel #bib-form-informacion {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.bib-create-panel #bib-form-informacion > .bib-form-grid {
  display: contents;
}
.bib-create-panel .bib-field {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  gap: 7px;
  color: var(--app-text-secondary);
}
.bib-create-panel .bib-field input,
.bib-create-panel .bib-field select {
  min-height: 46px;
  padding: 12px 14px;
  font-size: 12.5px;
  border-radius: 14px;
}
.bib-create-panel .bib-field textarea {
  padding: 12px 14px;
  font-size: 12.5px;
  border-radius: 14px;
  min-height: 85px;
}
.bib-create-panel .bib-reference-details {
  display: block;
  padding: 0;
}
.bib-create-panel .bib-reference-details > summary {
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  color: var(--app-accent-dark);
  padding: 10px 0;
}
.bib-create-panel .bib-reference-details[open] > .bib-field,
.bib-create-panel .bib-reference-details[open] > .bib-form-grid,
.bib-create-panel .bib-reference-details[open] > .bib-fieldset {
  margin-top: 16px;
}
.bib-create-panel #bib-form-documentos > p {
  display: none;
}
.bib-create-panel .bib-create-attachments .bib-checkbox {
  margin: 0;
  padding: 18px 20px;
  border: 1px solid var(--app-warning-border);
  border-left: 4px solid var(--app-accent);
  border-radius: 16px;
  background: var(--app-warning-bg);
  color: var(--app-warning-strong);
  font-size: 12px;
  font-weight: 700;
}
.bib-create-panel .bib-create-attachments > small {
  color: var(--app-text-soft);
  font-size: 11px;
  margin-top: -8px;
}
.bib-create-panel .bib-form-footer {
  padding: 0;
  gap: 10px;
}
.bib-create-panel .bib-form-footer-hint {
  display: none;
}
.bib-create-panel .bib-form-footer button {
  padding: 12px 18px;
  min-height: 43px;
  font-size: 12px;
}
@media (max-width: 700px) {
  .bib-create-panel {
    padding: 20px;
  }
  .bib-create-panel #bib-form-informacion {
    grid-template-columns: 1fr;
  }
  .bib-create-panel .bib-form-footer button {
    flex: initial;
  }
}

.bib-create-dialog {
  position: fixed;
  inset: 0;
  width: min(940px, calc(100% - 40px));
  max-width: 940px;
  max-height: 90dvh;
  margin: auto;
  padding: 0;
  overflow: auto;
  overscroll-behavior: contain;
  color: var(--app-text);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-modal);
}
.bib-create-dialog::backdrop {
  background: var(--app-overlay);
  backdrop-filter: blur(3px);
}
.bib-create-dialog .bib-create-panel-header {
  position: sticky;
  top: 0;
  z-index: 3;
  background: var(--app-surface);
  margin: 0;
  padding: 21px 24px;
  border-bottom: 1px solid var(--app-border);
}
.bib-create-dialog .bib-resource-form {
  padding: 20px 24px 0 !important;
}
.bib-create-dialog .bib-form-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: var(--app-surface);
  padding: 18px 0;
  border-top: 1px solid var(--app-border);
}
.bib-create-dialog .bib-material-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface-raised);
  min-width: 0;
}
.bib-material-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--app-text);
}
.bib-material-heading svg {
  color: var(--app-accent-dark);
}
@media (max-width: 700px) {
  .bib-create-dialog {
    width: calc(100% - 18px);
    max-height: 94dvh;
    padding: 0;
  }
  .bib-create-dialog .bib-resource-form {
    padding: 18px 18px 0 !important;
  }
  .bib-create-dialog .bib-create-panel-header {
    padding: 18px;
  }
}

/* Configuración y materiales: mismo lenguaje visual que Recursos. */
.bib-create-dialog #bib-form-informacion {
  padding: 17px;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface-alt);
  gap: 12px;
}
.bib-create-dialog #bib-form-informacion > .bib-form-section-title {
  display: block;
  grid-column: 1/-1;
  margin-bottom: 4px;
}
.bib-create-dialog #bib-form-informacion > .bib-form-section-title > span {
  display: none;
}
.bib-create-dialog #bib-form-informacion h3 {
  margin: 0;
  color: var(--app-text);
  font-size: var(--app-font-section);
  font-weight: 900;
}
.bib-create-dialog #bib-form-informacion .bib-form-section-title p {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 11px;
}
.bib-create-dialog .bib-field {
  font-size: 11px;
  font-weight: 700;
}
.bib-create-dialog .bib-field input,
.bib-create-dialog .bib-field select,
.bib-create-dialog .bib-field textarea {
  border-radius: 12px;
  font-size: var(--app-font-body);
}
.bib-create-dialog .bib-reference-details {
  padding: 0 17px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface-alt);
}
.bib-create-dialog .bib-reference-details[open] {
  padding-bottom: 17px;
}
.bib-create-dialog .bib-material-column {
  padding: 17px;
  gap: 14px;
  border-radius: 18px;
  background: var(--app-surface-raised);
}
.bib-material-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.bib-material-heading {
  min-width: 0;
  display: flex;
  gap: 10px;
  align-items: center;
}
.bib-material-heading > div {
  display: grid;
  gap: 4px;
}
.bib-material-heading strong {
  font-size: 13px;
  font-weight: 900;
}
.bib-material-heading small {
  font-size: 10.5px;
  font-weight: 400;
  color: var(--app-text-muted);
}
.bib-material-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 12px;
  background: var(--app-accent-soft);
  color: var(--app-accent-dark);
}
.bib-create-dialog .bib-add-material {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  padding: 9px 11px;
  min-height: 34px;
  border: 1px solid var(--app-border-strong);
  border-radius: 10px;
  background: var(--app-accent-soft);
  color: var(--app-accent-dark);
  font-size: 11px;
  font-weight: 800;
}
.bib-add-material:hover {
  background: var(--app-accent-softer);
}
.bib-add-material:focus-within {
  outline: 2px solid var(--app-input-focus);
  outline-offset: 3px;
}
.bib-material-empty,
.bib-material-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  min-height: 144px;
  padding: 20px 14px;
  border: 1px dashed var(--app-border-strong);
  border-radius: 14px;
  background: var(--app-surface-alt);
}
.bib-material-empty svg,
.bib-material-preview svg {
  color: var(--app-accent-dark);
}
.bib-material-empty strong,
.bib-material-preview strong {
  font-size: 12px;
  overflow-wrap: anywhere;
  max-width: 100%;
}
.bib-material-empty span,
.bib-material-preview span {
  font-size: 10.5px;
  color: var(--app-text-soft);
  line-height: 1.5;
}
.bib-material-preview {
  border-style: solid;
  border-color: var(--app-success-border);
  background: var(--app-success-bg);
}
.bib-material-preview svg {
  color: var(--app-success);
}
@media (max-width: 700px) {
  .bib-material-header {
    flex-wrap: wrap;
  }
  .bib-create-dialog #bib-form-informacion {
    padding: 14px;
  }
  .bib-material-empty,
  .bib-material-preview {
    min-height: 120px;
  }
}
`;
