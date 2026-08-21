import {
  AlertTriangle,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';

type SinPlanificacionProps = {
  gestion: string;
  puedeAdministrar?: boolean;
  recargando?: boolean;
  onRecargar?: () => void;
};

export default function SinPlanificacion({
  gestion,
  puedeAdministrar =
    false,
  recargando =
    false,
  onRecargar,
}: SinPlanificacionProps) {
  return (
    <section className="sin-planificacion">
      <div className="sin-planificacion__icono">
        <CalendarDays
          size={31}
        />
      </div>

      <span className="sin-planificacion__eyebrow">
        Planificación no disponible
      </span>

      <h2>
        La gestión
        {' '}
        {gestion}
        {' '}
        todavía no tiene hitos
      </h2>

      <p>
        La administración debe configurar las fechas de H1 a H5 antes de habilitar la organización académica del aula.
      </p>

      <div className="sin-planificacion__aviso">
        <AlertTriangle
          size={18}
        />

        <span>
          {puedeAdministrar
            ? 'Mientras tanto puedes revisar la información general y los estudiantes del curso.'
            : 'Las actividades estarán disponibles cuando la planificación sea registrada.'}
        </span>
      </div>

      {onRecargar && (
        <button
          type="button"
          disabled={
            recargando
          }
          onClick={
            onRecargar
          }
        >
          <RefreshCw
            size={17}
            className={
              recargando
                ? 'spin'
                : ''
            }
          />

          Comprobar nuevamente
        </button>
      )}

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .sin-planificacion {
    min-height: 310px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 35px;
    border: 1px solid var(--app-warning-border);
    border-radius: 23px;
    color: var(--app-text);
    background:
      linear-gradient(
        145deg,
        var(--app-warning-bg),
        var(--app-surface)
      );
    text-align: center;
    box-shadow: var(--app-shadow-sm);
  }

  .sin-planificacion__icono {
    width: 68px;
    height: 68px;
    display: grid;
    place-items: center;
    margin-bottom: 14px;
    border-radius: 21px;
    color: var(--app-warning-strong);
    background: var(--app-surface);
  }

  .sin-planificacion__eyebrow {
    color: var(--app-warning-strong);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .sin-planificacion h2 {
    max-width: 620px;
    margin: 7px 0 0;
    color: var(--app-text);
    font-size: 22px;
  }

  .sin-planificacion > p {
    max-width: 650px;
    margin: 9px 0 0;
    color: var(--app-text-soft);
    font-size: 12px;
    line-height: 1.65;
  }

  .sin-planificacion__aviso {
    max-width: 650px;
    display: flex;
    align-items: center;
    gap: 9px;
    margin-top: 17px;
    padding: 11px 13px;
    border: 1px solid var(--app-warning-border);
    border-radius: 13px;
    color: var(--app-warning-strong);
    background: var(--app-surface);
    font-size: 10px;
    text-align: left;
  }

  .sin-planificacion button {
    min-height: 41px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 18px;
    padding: 9px 15px;
    border: 1px solid var(--app-border-strong);
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-surface);
    font-family: inherit;
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
  }

  .sin-planificacion button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .spin {
    animation: spin .8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;