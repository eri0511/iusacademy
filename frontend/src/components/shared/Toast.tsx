import {
  useEffect,
} from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  Info,
  X,
} from 'lucide-react';

export type TipoToast =
  | 'exito'
  | 'error'
  | 'advertencia'
  | 'informacion';

type ToastProps = {
  visible:
    boolean;

  tipo:
    TipoToast;

  titulo:
    string;

  mensaje?:
    string;

  duracion?:
    number;

  onCerrar:
    () => void;
};

export default function Toast({
  visible,
  tipo,
  titulo,
  mensaje,
  duracion = 5000,
  onCerrar,
}: ToastProps) {
  useEffect(
    () => {
      if (
        !visible
      ) {
        return;
      }

      const temporizador =
        window.setTimeout(
          () => {
            onCerrar();
          },
          duracion,
        );

      return () => {
        window.clearTimeout(
          temporizador,
        );
      };
    },
    [
      visible,
      duracion,
      onCerrar,
    ],
  );

  if (
    !visible
  ) {
    return null;
  }

  const icono =
    tipo ===
      'exito'
      ? (
        <CheckCircle2
          size={22}
        />
      )
      : tipo ===
          'error'
        ? (
          <CircleX
            size={22}
          />
        )
        : tipo ===
            'advertencia'
          ? (
            <AlertTriangle
              size={22}
            />
          )
          : (
            <Info
              size={22}
            />
          );

  return (
    <div
      className={`toast-compartido toast-${tipo}`}
      role={
        tipo ===
          'error'
          ? 'alert'
          : 'status'
      }
      aria-live={
        tipo ===
          'error'
          ? 'assertive'
          : 'polite'
      }
    >
      <div className="toast-compartido__icono">
        {icono}
      </div>

      <div className="toast-compartido__contenido">
        <strong>
          {titulo}
        </strong>

        {mensaje && (
          <p>
            {mensaje}
          </p>
        )}
      </div>

      <button
        type="button"
        className="toast-compartido__cerrar"
        onClick={
          onCerrar
        }
        aria-label="Cerrar notificación"
      >
        <X
          size={16}
        />
      </button>

      <div
        className="toast-compartido__progreso"
        style={{
          animationDuration:
            `${duracion}ms`,
        }}
      />

      <style>
        {styles}
      </style>
    </div>
  );
}

const styles = `
  .toast-compartido {
    position: fixed;
    top: 25px;
    right: 28px;
    z-index: 99999;

    width:
      min(
        430px,
        calc(
          100vw -
          40px
        )
      );

    display: grid;
    grid-template-columns:
      42px
      minmax(
        0,
        1fr
      )
      28px;
    gap: 11px;
    align-items: flex-start;

    padding:
      15px
      15px
      18px;

    overflow: hidden;

    border-radius: 18px;

    box-shadow:
      var(
        --app-shadow-lg,
        0 18px 50px
        rgba(
          15,
          23,
          42,
          .16
        )
      );

    backdrop-filter:
      blur(
        14px
      );
    -webkit-backdrop-filter:
      blur(
        14px
      );

    animation:
      toastCompartidoEntrada
      .3s
      ease;
  }

  .toast-exito {
    border:
      1px solid
      var(
        --app-success-border,
        #bbf7d0
      );

    color:
      var(
        --app-success,
        #166534
      );

    background:
      color-mix(
        in srgb,
        var(
          --app-success-bg,
          #f0fdf4
        ) 96%,
        transparent
      );
  }

  .toast-error {
    border:
      1px solid
      var(
        --app-danger-border,
        #fecaca
      );

    color:
      var(
        --app-danger-strong,
        #b91c1c
      );

    background:
      color-mix(
        in srgb,
        var(
          --app-danger-bg,
          #fef2f2
        ) 96%,
        transparent
      );
  }

  .toast-advertencia {
    border:
      1px solid
      var(
        --app-warning-border,
        #fde68a
      );

    color:
      var(
        --app-warning-strong,
        #b45309
      );

    background:
      color-mix(
        in srgb,
        var(
          --app-warning-bg,
          #fffbeb
        ) 96%,
        transparent
      );
  }

  .toast-informacion {
    border:
      1px solid
      #bfdbfe;

    color:
      #1d4ed8;

    background:
      color-mix(
        in srgb,
        #eff6ff
        96%,
        transparent
      );
  }

  .toast-compartido__icono {
    width: 42px;
    height: 42px;

    display: grid;
    place-items: center;

    border-radius: 13px;
  }

  .toast-exito
  .toast-compartido__icono {
    color:
      var(
        --app-success,
        #16a34a
      );

    background:
      var(
        --app-success-bg,
        #dcfce7
      );
  }

  .toast-error
  .toast-compartido__icono {
    color:
      var(
        --app-danger,
        #dc2626
      );

    background:
      var(
        --app-danger-bg,
        #fee2e2
      );
  }

  .toast-advertencia
  .toast-compartido__icono {
    color:
      var(
        --app-warning,
        #d97706
      );

    background:
      var(
        --app-warning-bg,
        #fef3c7
      );
  }

  .toast-informacion
  .toast-compartido__icono {
    color:
      #2563eb;

    background:
      #dbeafe;
  }

  .toast-compartido__contenido {
    min-width: 0;
    padding-top: 1px;
  }

  .toast-compartido__contenido strong {
    display: block;

    color: inherit;

    font-size: 14px;
    font-weight: 800;
    line-height: 1.3;
  }

  .toast-compartido__contenido p {
    margin:
      4px
      0
      0;

    color:
      var(
        --app-text-soft,
        #64748b
      );

    font-size: 12px;
    line-height: 1.48;
  }

  .toast-compartido__cerrar {
    width: 28px;
    height: 28px;

    display: grid;
    place-items: center;

    padding: 0;

    border: none;
    border-radius: 9px;

    color:
      var(
        --app-text-muted,
        #94a3b8
      );

    background:
      transparent;

    cursor: pointer;

    transition:
      color
      .15s
      ease,
      background
      .15s
      ease;
  }

  .toast-compartido__cerrar:hover {
    color:
      var(
        --app-text-secondary,
        #475569
      );

    background:
      color-mix(
        in srgb,
        var(
          --app-text,
          #0f172a
        ) 6%,
        transparent
      );
  }

  .toast-compartido__progreso {
    position: absolute;
    left: 0;
    bottom: 0;

    width: 100%;
    height: 4px;

    transform-origin:
      left
      center;

    animation-name:
      toastCompartidoProgreso;

    animation-timing-function:
      linear;

    animation-fill-mode:
      forwards;
  }

  .toast-exito
  .toast-compartido__progreso {
    background:
      linear-gradient(
        90deg,
        #22c55e,
        #16a34a
      );
  }

  .toast-error
  .toast-compartido__progreso {
    background:
      linear-gradient(
        90deg,
        #ef4444,
        #dc2626
      );
  }

  .toast-advertencia
  .toast-compartido__progreso {
    background:
      linear-gradient(
        90deg,
        #f59e0b,
        #d97706
      );
  }

  .toast-informacion
  .toast-compartido__progreso {
    background:
      linear-gradient(
        90deg,
        #3b82f6,
        #2563eb
      );
  }

  html[
    data-theme='oscuro'
  ]
  .toast-exito {
    color:
      #86efac;

    background:
      rgba(
        20,
        46,
        29,
        .97
      );
  }

  html[
    data-theme='oscuro'
  ]
  .toast-error {
    color:
      #fca5a5;

    background:
      rgba(
        58,
        25,
        25,
        .97
      );
  }

  html[
    data-theme='oscuro'
  ]
  .toast-advertencia {
    color:
      #fcd34d;

    background:
      rgba(
        57,
        43,
        17,
        .97
      );
  }

  html[
    data-theme='oscuro'
  ]
  .toast-informacion {
    border-color:
      #315f95;

    color:
      #93c5fd;

    background:
      rgba(
        20,
        37,
        61,
        .97
      );
  }

  @keyframes toastCompartidoEntrada {
    from {
      opacity: 0;

      transform:
        translateX(
          30px
        );
    }

    to {
      opacity: 1;

      transform:
        translateX(
          0
        );
    }
  }

  @keyframes toastCompartidoProgreso {
    from {
      transform:
        scaleX(
          1
        );
    }

    to {
      transform:
        scaleX(
          0
        );
    }
  }

  @media (
    max-width:
      600px
  ) {
    .toast-compartido {
      top: 16px;
      right: 16px;
      left: 16px;

      width: auto;

      grid-template-columns:
        40px
        minmax(
          0,
          1fr
        )
        28px;

      padding:
        13px
        13px
        17px;
    }

    .toast-compartido__icono {
      width: 40px;
      height: 40px;
    }
  }

  @media (
    prefers-reduced-motion:
      reduce
  ) {
    .toast-compartido,
    .toast-compartido__progreso {
      animation: none;
    }
  }
`;