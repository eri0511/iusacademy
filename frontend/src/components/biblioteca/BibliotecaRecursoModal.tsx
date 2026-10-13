import { Check, FileText, Info, Link2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Ficha, Recurso } from "../../types/biblioteca/biblioteca.types";
import BibliotecaFormularioInformacion from "./BibliotecaFormularioInformacion";
import BibliotecaFormularioDocumento from "./BibliotecaFormularioDocumento";
import type {
  ArchivoPendienteBiblioteca,
  EnlacePendienteBiblioteca,
} from "./BibliotecaFormularioDocumento";

export type DatosContenidoPendiente = {
  archivos: ArchivoPendienteBiblioteca[];
  enlaces: EnlacePendienteBiblioteca[];
};

type Props = {
  abierto: boolean;
  modo: "crear" | "editar";
  ficha: Ficha;
  etiquetasTexto: string;
  recurso?: Recurso | null;
  ocupado?: boolean;
  setFicha: Dispatch<SetStateAction<Ficha>>;
  setEtiquetasTexto: Dispatch<SetStateAction<string>>;
  onCerrar: () => void;
  onGuardar: (contenido: DatosContenidoPendiente) => Promise<void> | void;
  onContenidoActualizado?: () => Promise<void> | void;
};

export default function BibliotecaRecursoModal({
  abierto,
  modo,
  ficha,
  etiquetasTexto,
  recurso,
  ocupado = false,
  setFicha,
  setEtiquetasTexto,
  onCerrar,
  onGuardar,
  onContenidoActualizado,
}: Props) {
  const [tab, setTab] = useState<"informacion" | "documento">("informacion");
  const [archivos, setArchivos] = useState<ArchivoPendienteBiblioteca[]>([]);
  const [enlaces, setEnlaces] = useState<EnlacePendienteBiblioteca[]>([]);

  useEffect(() => {
    if (abierto) {
      setTab("informacion");
      setArchivos([]);
      setEnlaces([]);
    }
  }, [abierto, modo, recurso?.id]);

  if (!abierto) return null;

  return (
    <div
      className="bib-recurso-modal"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !ocupado) onCerrar();
      }}
    >
      <section className="bib-recurso-modal__panel" role="dialog" aria-modal="true">
        <header className="bib-recurso-modal__header">
          <div className="bib-recurso-modal__heading">
            <span className="bib-recurso-modal__eyebrow">
              {modo === "crear" ? "NUEVO RECURSO" : "EDITAR RECURSO"}
            </span>
            <h2>{modo === "crear" ? "Agregar nuevo recurso" : "Editar recurso"}</h2>
            <p>Completa la información jurídica, documental y descriptiva del recurso.</p>
          </div>
          <button type="button" aria-label="Cerrar" disabled={ocupado} onClick={onCerrar}>
            <X size={21} />
          </button>
        </header>

        <nav className="bib-recurso-modal__tabs" aria-label="Secciones del recurso">
          <button
            type="button"
            className={tab === "informacion" ? "active" : ""}
            onClick={() => setTab("informacion")}
          >
            <Info size={16} /> Información
          </button>
          <button
            type="button"
            className={tab === "documento" ? "active" : ""}
            onClick={() => setTab("documento")}
          >
            <Link2 size={16} /> Documento / Enlace
            {(archivos.length + enlaces.length) > 0 && (
              <b>{archivos.length + enlaces.length}</b>
            )}
          </button>
        </nav>

        <div className="bib-recurso-modal__body">
          {tab === "informacion" ? (
            <BibliotecaFormularioInformacion
              ficha={ficha}
              etiquetasTexto={etiquetasTexto}
              deshabilitado={ocupado}
              setFicha={setFicha}
              setEtiquetasTexto={setEtiquetasTexto}
            />
          ) : (
            <>
              <div className="bib-recurso-modal__section-title">
                <span><FileText size={18} /></span>
                <div>
                  <strong>Documento / Enlace</strong>
                  <small>
                    Administra archivos y enlaces asociados al recurso desde el mismo formulario.
                  </small>
                </div>
              </div>
              <BibliotecaFormularioDocumento
                recurso={recurso}
                archivos={archivos}
                enlaces={enlaces}
                deshabilitado={ocupado}
                onArchivos={setArchivos}
                onEnlaces={setEnlaces}
                onContenidoActualizado={onContenidoActualizado}
              />
            </>
          )}
        </div>

        <footer className="bib-recurso-modal__footer">
          <button type="button" className="secondary" disabled={ocupado} onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="primary"
            disabled={ocupado}
            onClick={() => void onGuardar({ archivos, enlaces })}
          >
            <Check size={17} />
            {ocupado
              ? "Guardando..."
              : modo === "crear"
                ? "Crear recurso"
                : "Guardar cambios"}
          </button>
        </footer>
      </section>
      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .bib-recurso-modal {
    position: fixed;
    z-index: 1100;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(15, 23, 42, .44);
    backdrop-filter: blur(4px);
  }
  .bib-recurso-modal__panel {
    width: min(1040px, 100%);
    max-height: calc(100vh - 48px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--app-surface, #fffdf9);
    border: 1px solid var(--app-border, rgba(241,139,75,.2));
    border-radius: 24px;
    box-shadow: 0 28px 80px rgba(15,23,42,.22);
  }
  .bib-recurso-modal__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    padding: 24px 28px 18px;
    background: var(--app-surface-alt, #fffaf4);
    border-bottom: 1px solid var(--app-border, rgba(241,139,75,.2));
  }
  .bib-recurso-modal__eyebrow {
    color: var(--app-accent-700, #d86827);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .12em;
  }
  .bib-recurso-modal__heading h2 {
    margin: 5px 0 5px;
    color: var(--app-text, #0f172a);
    font-size: 25px;
    font-weight: 850;
  }
  .bib-recurso-modal__heading p {
    margin: 0;
    color: var(--app-text-secondary, #475569);
    font-size: 11px;
  }
  .bib-recurso-modal__header > button {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    flex: 0 0 40px;
    color: var(--app-text-soft, #64748b);
    background: #fff;
    border: 1px solid var(--app-border-soft, rgba(148,163,184,.18));
    border-radius: 12px;
    cursor: pointer;
  }
  .bib-recurso-modal__tabs {
    display: flex;
    gap: 8px;
    padding: 8px 28px;
    background: #fff;
    border-bottom: 1px solid var(--app-border-soft, rgba(148,163,184,.18));
  }
  .bib-recurso-modal__tabs button {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 0 14px;
    color: var(--app-text-secondary, #475569);
    background: #fff;
    border: 1px solid var(--app-border-soft, rgba(148,163,184,.18));
    border-radius: 11px;
    font: inherit;
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
  }
  .bib-recurso-modal__tabs button.active {
    color: #fff;
    background: var(--app-accent, #f18b4b);
    border-color: var(--app-accent, #f18b4b);
    box-shadow: 0 5px 14px rgba(241,139,75,.2);
  }
  .bib-recurso-modal__tabs button b {
    min-width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    padding: 0 5px;
    border-radius: 999px;
    background: rgba(255,255,255,.2);
    font-size: 8px;
  }
  .bib-recurso-modal__body {
    overflow-y: auto;
    padding: 22px 28px 26px;
  }
  .bib-recurso-modal__section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
  }
  .bib-recurso-modal__section-title > span {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    color: var(--app-accent, #f18b4b);
    background: var(--app-accent-50, #fff5ec);
    border: 1px solid var(--app-border, rgba(241,139,75,.2));
    border-radius: 12px;
  }
  .bib-recurso-modal__section-title strong,
  .bib-recurso-modal__section-title small {
    display: block;
  }
  .bib-recurso-modal__section-title strong {
    color: var(--app-text, #0f172a);
    font-size: 12px;
  }
  .bib-recurso-modal__section-title small {
    margin-top: 3px;
    color: var(--app-text-soft, #64748b);
    font-size: 9px;
  }
  .bib-recurso-form__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 13px;
  }
  .bib-recurso-form__grid label {
    display: grid;
    gap: 6px;
  }
  .bib-recurso-form__wide { grid-column: 1 / -1; }
  .bib-recurso-form__grid label > span,
  .bib-material-card label > span {
    color: var(--app-text-secondary, #475569);
    font-size: 10px;
    font-weight: 850;
  }
  .bib-recurso-form__grid label > span b { color: var(--app-danger, #ef4444); }
  .bib-recurso-form__grid input,
  .bib-recurso-form__grid select,
  .bib-recurso-form__grid textarea,
  .bib-material-card input {
    box-sizing: border-box;
    width: 100%;
    padding: 10px 11px;
    color: var(--app-text, #0f172a);
    background: var(--app-surface, #fffdf9);
    border: 1px solid var(--app-border-strong, rgba(241,139,75,.36));
    border-radius: 11px;
    outline: 0;
    font: inherit;
    font-size: 11px;
  }
  .bib-recurso-form__grid input,
  .bib-recurso-form__grid select { min-height: 42px; }
  .bib-recurso-form__grid textarea { resize: vertical; line-height: 1.5; }
  .bib-recurso-form__grid input:focus,
  .bib-recurso-form__grid select:focus,
  .bib-recurso-form__grid textarea:focus,
  .bib-material-card input:focus {
    border-color: var(--app-accent, #f18b4b);
    box-shadow: 0 0 0 3px var(--app-accent-50, #fff5ec);
  }
  .bib-recurso-form__grid small {
    color: var(--app-text-muted, #94a3b8);
    font-size: 8px;
  }
  .bib-recurso-form__check {
    grid-template-columns: auto 1fr !important;
    align-items: center;
    padding: 12px;
    background: var(--app-surface-alt, #fffaf4);
    border: 1px solid var(--app-border, rgba(241,139,75,.2));
    border-radius: 12px;
  }
  .bib-recurso-form__check input {
    width: 18px;
    height: 18px;
    accent-color: var(--app-accent, #f18b4b);
  }
  .bib-recurso-form__check > span {
    display: grid;
    gap: 2px;
  }
  .bib-recurso-form__check strong { color: var(--app-text, #0f172a); font-size: 10px; }
  .bib-materiales__existentes {
    display: grid;
    gap: 10px;
    margin-bottom: 14px;
    padding: 13px;
    background: var(--app-surface-alt, #fffaf4);
    border: 1px solid var(--app-border, rgba(241,139,75,.2));
    border-radius: 14px;
  }
  .bib-materiales__existentes > div:first-child strong,
  .bib-materiales__existentes > div:first-child span { display: block; }
  .bib-materiales__existentes strong { color: var(--app-text, #0f172a); font-size: 11px; }
  .bib-materiales__existentes span { margin-top: 2px; color: var(--app-text-soft, #64748b); font-size: 9px; }
  .bib-materiales__chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .bib-materiales__chips span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 8px;
    color: var(--app-accent-700, #d86827);
    background: #fff;
    border: 1px solid var(--app-border, rgba(241,139,75,.2));
    border-radius: 999px;
    font-size: 8px;
    font-weight: 750;
  }
  .bib-materiales__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .bib-materiales__col {
    min-width: 0;
    padding: 14px;
    background: var(--app-surface-alt, #fffaf4);
    border: 1px solid var(--app-border, rgba(241,139,75,.2));
    border-radius: 16px;
  }
  .bib-materiales__col > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }
  .bib-materiales__title {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }
  .bib-materiales__icon,
  .bib-material-card__icon {
    display: grid;
    place-items: center;
    color: var(--app-accent, #f18b4b);
    background: #fff;
    border: 1px solid var(--app-border, rgba(241,139,75,.2));
    border-radius: 10px;
  }
  .bib-materiales__icon { width: 40px; height: 40px; flex: 0 0 40px; }
  .bib-materiales__title strong,
  .bib-materiales__title span { display: block; }
  .bib-materiales__title strong { color: var(--app-text, #0f172a); font-size: 11px; }
  .bib-materiales__title div > span { margin-top: 2px; color: var(--app-text-soft, #64748b); font-size: 8px; }
  .bib-materiales__add {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 0 10px;
    color: var(--app-accent-700, #d86827);
    background: #fff;
    border: 1px solid var(--app-border-strong, rgba(241,139,75,.36));
    border-radius: 9px;
    font: inherit;
    font-size: 9px;
    font-weight: 850;
    cursor: pointer;
  }
  label.bib-materiales__add input { display: none; }
  .bib-materiales__empty {
    min-height: 170px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 7px;
    padding: 18px;
    color: var(--app-text-muted, #94a3b8);
    text-align: center;
    background: rgba(255,255,255,.55);
    border: 1px dashed var(--app-border-strong, rgba(241,139,75,.36));
    border-radius: 13px;
  }
  .bib-materiales__empty strong { color: var(--app-text, #0f172a); font-size: 10px; }
  .bib-materiales__empty span { max-width: 270px; font-size: 8px; line-height: 1.5; }
  .bib-materiales__list { display: grid; gap: 9px; max-height: 360px; overflow-y: auto; }
  .bib-material-card {
    display: grid;
    gap: 9px;
    padding: 11px;
    background: #fff;
    border: 1px solid var(--app-border-soft, rgba(148,163,184,.18));
    border-radius: 12px;
  }
  .bib-material-card__top {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
  }
  .bib-material-card__icon { width: 36px; height: 36px; }
  .bib-material-card__top strong,
  .bib-material-card__top span { display: block; }
  .bib-material-card__top strong {
    overflow: hidden;
    color: var(--app-text, #0f172a);
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bib-material-card__top div > span { margin-top: 2px; color: var(--app-text-muted, #94a3b8); font-size: 8px; }
  .bib-material-card__top button {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    color: #dc2626;
    background: #fff7f7;
    border: 1px solid #fecaca;
    border-radius: 9px;
    cursor: pointer;
  }
  .bib-material-card label { display: grid; gap: 5px; }
  .bib-recurso-modal__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 28px;
    background: var(--app-surface-alt, #fffaf4);
    border-top: 1px solid var(--app-border, rgba(241,139,75,.2));
  }
  .bib-recurso-modal__footer button {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 15px;
    border-radius: 11px;
    font: inherit;
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
  }
  .bib-recurso-modal__footer .secondary {
    color: var(--app-text-secondary, #475569);
    background: #fff;
    border: 1px solid var(--app-border-soft, rgba(148,163,184,.18));
  }
  .bib-recurso-modal__footer .primary {
    color: #fff;
    background: var(--app-accent, #f18b4b);
    border: 1px solid var(--app-accent, #f18b4b);
  }

  .bib-recurso-form__grid {
    padding: 16px;
    background:
      linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,250,244,.72));
    border: 1px solid var(--app-border, rgba(241,139,75,.2));
    border-radius: 17px;
    box-shadow: 0 10px 28px rgba(148, 89, 48, .045);
  }
  .bib-recurso-form__grid label:not(.bib-recurso-form__check) {
    align-content: start;
    padding: 10px;
    background: rgba(255,255,255,.72);
    border: 1px solid var(--app-border-soft, rgba(148,163,184,.18));
    border-radius: 12px;
  }
  .bib-recurso-form__grid label:not(.bib-recurso-form__check):focus-within {
    background: #fff;
    border-color: var(--app-border-strong, rgba(241,139,75,.36));
    box-shadow: 0 5px 18px rgba(241,139,75,.08);
  }
  .bib-recurso-form__grid input,
  .bib-recurso-form__grid select {
    min-height: 44px !important;
    background: #fff !important;
  }
  .bib-recurso-form__grid textarea {
    background: #fff !important;
  }
  .bib-materiales__actuales {
    margin-bottom: 16px;
    padding: 15px;
    background: linear-gradient(135deg, #fffaf4, #fff);
    border: 1px solid var(--app-border, rgba(241,139,75,.2));
    border-radius: 16px;
  }
  .bib-materiales__actuales-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 11px;
  }
  .bib-materiales__actuales-head strong,
  .bib-materiales__actuales-head span { display: block; }
  .bib-materiales__actuales-head strong { color: var(--app-text); font-size: 11px; }
  .bib-materiales__actuales-head span {
    max-width: 650px;
    margin-top: 3px;
    color: var(--app-text-soft);
    font-size: 8px;
    line-height: 1.45;
  }
  .bib-materiales__actuales-head > b {
    min-width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    color: var(--app-accent-700);
    background: var(--app-accent-50);
    border-radius: 9px;
    font-size: 10px;
  }
  .bib-contenidos-actuales { display: grid; gap: 8px; }
  .bib-contenido-actual {
    display: grid;
    grid-template-columns: 44px minmax(0,1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 11px;
    background: #fff;
    border: 1px solid var(--app-border-soft);
    border-radius: 13px;
  }
  .bib-contenido-actual__icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    color: #2563eb;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 12px;
  }
  .bib-contenido-actual__icon.enlace {
    color: var(--app-accent-700);
    background: var(--app-accent-50);
    border-color: var(--app-border);
  }
  .bib-contenido-actual__title {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .bib-contenido-actual__title strong { color: var(--app-text); font-size: 10px; }
  .bib-contenido-actual__title > span {
    padding: 3px 6px;
    color: var(--app-text-soft);
    background: var(--app-surface-disabled);
    border-radius: 999px;
    font-size: 7px;
    font-weight: 850;
  }
  .bib-contenido-actual__copy p {
    margin: 3px 0 5px;
    overflow: hidden;
    color: var(--app-text-secondary);
    font-size: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bib-contenido-actual__url { max-width: 560px; }
  .bib-version-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
    color: var(--app-text-muted);
    font-size: 8px;
  }
  .bib-version-meta > span:not(.bib-version-badge) {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .bib-version-badge {
    padding: 3px 7px;
    color: var(--app-accent-700);
    background: var(--app-accent-50);
    border: 1px solid var(--app-border);
    border-radius: 999px;
    font-weight: 900;
  }
  .bib-contenido-actual__actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .bib-contenido-actual__actions button {
    min-height: 32px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0 9px;
    color: var(--app-accent-700) !important;
    background: #fff !important;
    border: 1px solid var(--app-border) !important;
    border-radius: 9px;
    font: inherit;
    font-size: 8px;
    font-weight: 850;
    cursor: pointer;
  }
  .bib-contenido-actual__actions button:hover:not(:disabled) {
    color: var(--app-accent-700) !important;
    background: var(--app-accent-50) !important;
    border-color: var(--app-border-strong) !important;
  }
  .bib-contenido-actual__actions button.primary {
    color: #fff !important;
    background: var(--app-accent) !important;
    border-color: var(--app-accent) !important;
  }
  .bib-contenido-actual__actions button.primary:hover:not(:disabled) {
    color: #fff !important;
    background: var(--app-accent-600) !important;
    border-color: var(--app-accent-600) !important;
  }
  .bib-materiales__empty-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    color: var(--app-accent);
    background: var(--app-accent-50);
    border: 1px solid var(--app-border);
    border-radius: 14px;
  }
  .bib-version-modal {
    position: fixed;
    z-index: 1250;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(15,23,42,.48);
    backdrop-filter: blur(4px);
  }
  .bib-version-modal > section {
    width: min(650px, 100%);
    max-height: calc(100vh - 40px);
    overflow: hidden;
    background: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: 20px;
    box-shadow: 0 28px 80px rgba(15,23,42,.24);
  }
  .bib-version-modal header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 19px 21px;
    background: var(--app-surface-alt);
    border-bottom: 1px solid var(--app-border);
  }
  .bib-version-modal header span {
    color: var(--app-accent-700);
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .1em;
  }
  .bib-version-modal header h3 {
    margin: 4px 0 3px;
    color: var(--app-text);
    font-size: 19px;
  }
  .bib-version-modal header p {
    margin: 0;
    color: var(--app-text-secondary);
    font-size: 9px;
  }
  .bib-version-modal header button {
    width: 35px;
    height: 35px;
    display: grid;
    place-items: center;
    color: var(--app-text-soft) !important;
    background: #fff !important;
    border: 1px solid var(--app-border-soft) !important;
    border-radius: 10px;
    cursor: pointer;
  }
  .bib-version-modal__body {
    max-height: 460px;
    overflow-y: auto;
    padding: 17px 21px;
  }
  .bib-version-list { display: grid; gap: 8px; }
  .bib-version-list article {
    display: grid;
    grid-template-columns: 45px minmax(0,1fr);
    gap: 10px;
    padding: 11px;
    background: #fff;
    border: 1px solid var(--app-border-soft);
    border-radius: 12px;
  }
  .bib-version-list article.current {
    background: var(--app-accent-50);
    border-color: var(--app-border-strong);
  }
  .bib-version-list__number {
    width: 45px;
    height: 45px;
    display: grid;
    place-items: center;
    color: var(--app-accent-700);
    background: #fff;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    font-size: 11px;
    font-weight: 900;
  }
  .bib-version-list__title {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .bib-version-list__title strong { color: var(--app-text); font-size: 10px; }
  .bib-version-list__title b {
    padding: 3px 6px;
    color: #047857;
    background: #ecfdf5;
    border-radius: 999px;
    font-size: 7px;
  }
  .bib-version-list p {
    margin: 4px 0;
    color: var(--app-text-secondary);
    font-size: 9px;
  }
  .bib-version-list small {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--app-text-muted);
    font-size: 8px;
  }
  .bib-version-list small i { font-style: normal; }
  .bib-version-empty {
    padding: 30px;
    color: var(--app-text-soft);
    text-align: center;
    font-size: 10px;
  }
  .bib-version-form { display: grid; gap: 12px; }
  .bib-version-notice {
    display: flex;
    gap: 9px;
    padding: 11px;
    color: var(--app-accent-700);
    background: var(--app-accent-50);
    border: 1px solid var(--app-border);
    border-radius: 12px;
  }
  .bib-version-notice strong,
  .bib-version-notice span { display: block; }
  .bib-version-notice strong { font-size: 9px; }
  .bib-version-notice span { margin-top: 2px; color: var(--app-text-soft); font-size: 8px; }
  .bib-version-form label { display: grid; gap: 6px; }
  .bib-version-form label > span { color: var(--app-text-secondary); font-size: 9px; font-weight: 850; }
  .bib-version-form label b { color: var(--app-danger); }
  .bib-version-form input,
  .bib-version-form textarea {
    box-sizing: border-box;
    width: 100%;
    padding: 10px 11px;
    color: var(--app-text);
    background: #fff;
    border: 1px solid var(--app-border-strong);
    border-radius: 10px;
    font: inherit;
    font-size: 10px;
  }
  .bib-version-modal footer {
    display: flex;
    justify-content: flex-end;
    gap: 7px;
    padding: 12px 21px;
    background: var(--app-surface-alt);
    border-top: 1px solid var(--app-border);
  }
  .bib-version-modal footer button {
    min-height: 37px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0 12px;
    color: var(--app-text-secondary) !important;
    background: #fff !important;
    border: 1px solid var(--app-border-soft) !important;
    border-radius: 9px;
    font: inherit;
    font-size: 9px;
    font-weight: 850;
    cursor: pointer;
  }
  .bib-version-modal footer button.primary {
    color: #fff !important;
    background: var(--app-accent) !important;
    border-color: var(--app-accent) !important;
  }
  .bib-version-modal footer button.primary:hover:not(:disabled) {
    color: #fff !important;
    background: var(--app-accent-600) !important;
    border-color: var(--app-accent-600) !important;
  }

  @media (max-width: 760px) {
    .bib-recurso-modal { padding: 10px; }
    .bib-recurso-modal__panel { max-height: calc(100vh - 20px); }
    .bib-recurso-form__grid,
    .bib-materiales__grid { grid-template-columns: 1fr; }
    .bib-recurso-form__wide { grid-column: auto; }
    .bib-recurso-modal__header,
    .bib-recurso-modal__body,
    .bib-recurso-modal__footer { padding-left: 16px; padding-right: 16px; }
    .bib-recurso-modal__tabs { padding-left: 16px; padding-right: 16px; overflow-x: auto; }
  }
`;
