import {
  LoaderCircle,
} from 'lucide-react';

type AulaLoadingOverlayProps = {
  visible: boolean;
  texto?: string;
};

export default function AulaLoadingOverlay({
  visible,
  texto =
    'Actualizando contenido…',
}: AulaLoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="aula-loading-overlay"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="aula-loading-overlay__pill">
        <LoaderCircle
          size={15}
          className="spin"
        />

        <span>
          {texto}
        </span>
      </div>

      <style>
        {styles}
      </style>
    </div>
  );
}

const styles = `
  .aula-loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 90;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 10px;
    pointer-events: none;
    background:
      linear-gradient(
        180deg,
        color-mix(
          in srgb,
          var(--app-surface) 22%,
          transparent
        ),
        transparent 120px
      );
  }

  .aula-loading-overlay__pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 11px;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    color: var(--app-accent-dark);
    background:
      color-mix(
        in srgb,
        var(--app-surface) 94%,
        transparent
      );
    box-shadow: var(--app-shadow-sm);
    backdrop-filter: blur(12px);
    font-size: 9px;
    font-weight: 800;
  }

  .spin {
    animation: spin .8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (
    prefers-reduced-motion:
    reduce
  ) {
    .spin {
      animation: none;
    }
  }
`;