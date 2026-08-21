type ConfigSwitchForoProps = {
  activo: boolean;
  titulo: string;
  descripcion?: string;
  deshabilitado?: boolean;
  onChange: (activo: boolean) => void;
};

export default function ConfigSwitchForo({
  activo,
  titulo,
  descripcion,
  deshabilitado = false,
  onChange,
}: ConfigSwitchForoProps) {
  return (
    <label
      className={`crear-foro-switch ${deshabilitado ? "deshabilitado" : ""}`}
    >
      <span>
        <strong>{titulo}</strong>

        {descripcion && <small>{descripcion}</small>}
      </span>

      <input
        type="checkbox"
        checked={activo}
        disabled={deshabilitado}
        onChange={(evento) => onChange(evento.target.checked)}
      />

      <i aria-hidden="true">
        <b />
      </i>

      <style>{styles}</style>
    </label>
  );
}

const styles = `
  .crear-foro-switch {
    min-height: 49px;
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
    text-transform: none !important;
    letter-spacing: 0 !important;
    cursor: pointer;
  }

  .crear-foro-switch > span {
    display: grid;
    gap: 2px;
  }

  .crear-foro-switch strong {
    font-size: 10px;
  }

  .crear-foro-switch small {
    color: var(--app-text-muted);
    font-size: 9px;
    font-weight: 500;
  }

  .crear-foro-switch input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .crear-foro-switch i {
    width: 38px;
    height: 21px;
    flex: 0 0 auto;
    padding: 2px;
    border-radius: 20px;
    background: var(--app-border-strong);
    transition: 0.2s;
  }

  .crear-foro-switch i b {
    display: block;
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 4px #00000022;
    transition: 0.2s;
  }

  .crear-foro-switch input:checked + i {
    background: var(--app-accent);
  }

  .crear-foro-switch input:checked + i b {
    transform: translateX(17px);
  }

  .crear-foro-switch.deshabilitado {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;
