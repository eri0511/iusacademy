import { UserRound, UsersRound } from "lucide-react";

export type ModalidadParticipacionForo = "INDIVIDUAL" | "GRUPAL";

type SelectorTipoForoProps = {
  valor: ModalidadParticipacionForo;
  onChange: (modalidad: ModalidadParticipacionForo) => void;
};

export default function SelectorTipoForo({
  valor,
  onChange,
}: SelectorTipoForoProps) {
  return (
    <div
      className="selector-tipo-foro"
      role="radiogroup"
      aria-label="Modalidad de participación"
    >
      <button
        type="button"
        role="radio"
        aria-checked={valor === "INDIVIDUAL"}
        className={valor === "INDIVIDUAL" ? "activo" : ""}
        onClick={() => onChange("INDIVIDUAL")}
      >
        <UserRound size={19} />

        <strong>Individual</strong>

        <small>Cada estudiante publica su propia respuesta.</small>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={valor === "GRUPAL"}
        className={valor === "GRUPAL" ? "activo" : ""}
        onClick={() => onChange("GRUPAL")}
      >
        <UsersRound size={19} />

        <strong>Grupal</strong>

        <small>La participación se organiza por equipos.</small>
      </button>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .selector-tipo-foro {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;
  }

  .selector-tipo-foro button {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 3px 9px;
    padding: 13px;
    border: 1px solid var(--app-border);
    border-radius: 13px;
    color: var(--app-text);
    background: var(--app-surface-alt);
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.2s,
      background 0.2s,
      transform 0.2s;
  }

  .selector-tipo-foro button:hover {
    transform: translateY(-1px);
    border-color: var(--app-border-strong);
  }

  .selector-tipo-foro button svg {
    grid-row: 1 / 3;
    color: var(--app-text-muted);
  }

  .selector-tipo-foro button strong {
    font-size: 11px;
  }

  .selector-tipo-foro button small {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .selector-tipo-foro button.activo {
    border-color: var(--app-accent);
    background: var(--app-accent-soft);
  }

  .selector-tipo-foro button.activo svg {
    color: var(--app-accent-dark);
  }

  @media (max-width: 640px) {
    .selector-tipo-foro {
      grid-template-columns: 1fr;
    }
  }
`;
