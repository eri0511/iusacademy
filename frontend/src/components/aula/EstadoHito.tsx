import {
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';

import type {
  HitoAula,
} from '../../types/aula/aulaCurso.types';

type EstadoHitoProps = {
  hito: HitoAula;
  compacto?: boolean;
};

function formatearFecha(
  fecha:
    string,
): string {
  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric',
    },
  ).format(
    new Date(
      fecha,
    ),
  );
}

export default function EstadoHito({
  hito,
  compacto =
    false,
}: EstadoHitoProps) {
  const configuracion = {
    FINALIZADO: {
      texto:
        'Finalizado',

      icono:
        CheckCircle2,
    },

    EN_CURSO: {
      texto:
        'En curso',

      icono:
        Sparkles,
    },

    PROXIMO: {
      texto:
        'Próximo',

      icono:
        Clock3,
    },

    PENDIENTE: {
      texto:
        'Pendiente',

      icono:
        LockKeyhole,
    },
  }[
    hito.estado
  ];

  const Icono =
    configuracion.icono;

  if (
    compacto
  ) {
    return (
      <span
        className={`estado-hito compacto ${hito.estado.toLowerCase()}`}
      >
        <Icono
          size={13}
        />

        {configuracion.texto}

        <style>
          {styles}
        </style>
      </span>
    );
  }

  return (
    <article
      className={`estado-hito tarjeta ${hito.estado.toLowerCase()}`}
    >
      <div className="estado-hito__icono">
        <Icono
          size={22}
        />
      </div>

      <div>
        <span>
          {configuracion.texto}
        </span>

        <strong>
          {hito.codigo}
          {' · '}
          {hito.nombre}
        </strong>

        <small>
          {formatearFecha(
            hito.fechaInicio,
          )}
          {' — '}
          {formatearFecha(
            hito.fechaFin,
          )}
        </small>
      </div>

      <style>
        {styles}
      </style>
    </article>
  );
}

const styles = `
  .estado-hito.compacto {
    width: fit-content;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 850;
  }

  .estado-hito.tarjeta {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 14px;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
  }

  .estado-hito__icono {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 13px;
  }

  .estado-hito.tarjeta span,
  .estado-hito.tarjeta strong,
  .estado-hito.tarjeta small {
    display: block;
  }

  .estado-hito.tarjeta span {
    font-size: 9px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .estado-hito.tarjeta strong {
    margin-top: 3px;
    color: var(--app-text);
    font-size: 13px;
  }

  .estado-hito.tarjeta small {
    margin-top: 4px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .estado-hito.en_curso {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .estado-hito.proximo {
    color: var(--app-warning-strong);
    background: var(--app-warning-bg);
  }

  .estado-hito.finalizado {
    color: var(--app-purple);
    background: var(--app-purple-bg);
  }

  .estado-hito.pendiente {
    color: var(--app-text-muted);
    background: var(--app-surface-disabled);
  }

  .estado-hito__icono {
    background: var(--app-surface);
  }
`;