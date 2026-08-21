import {
  AlertCircle,
  Award,
  CalendarClock,
  CheckCircle2,
  FilePenLine,
  FileText,
  Files,
  ListChecks,
  Presentation,
  RefreshCw,
  Scale,
  Users,
  Workflow,
  X,
} from 'lucide-react';

import type {
  ComponentType,
  CSSProperties,
} from 'react';

import {
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaLoadingOverlay from '../../../components/aula/AulaLoadingOverlay';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import AulaToolbar, {
  type OpcionAulaToolbar,
} from '../../../components/aula/AulaToolbar';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import useTareasEstudiante from '../../../hooks/tareas/useTareasEstudiante';

import type {
  TareaCurso,
  TipoTarea,
} from '../../../types/tareas/tareas.types';

type Filtro =
  | 'TODAS'
  | 'DISPONIBLES'
  | 'PROXIMAS'
  | 'FINALIZADAS';

type TipoVisual = {
  nombre:
    string;
  color:
    string;
  fondo:
    string;
  icono:
    ComponentType<{
      size?: number;
    }>;
};

const tipos:
  Record<
    TipoTarea,
    TipoVisual
  > = {
    ENTREGA_ARCHIVOS: {
      nombre:
        'Entrega de archivos',
      color:
        '#f97316',
      fondo:
        '#fff7ed',
      icono:
        Files,
    },

    RESPUESTA_ESCRITA: {
      nombre:
        'Respuesta escrita',
      color:
        '#2563eb',
      fondo:
        '#eff6ff',
      icono:
        FilePenLine,
    },

    DOCUMENTO_COLABORATIVO: {
      nombre:
        'Documento colaborativo',
      color:
        '#7c3aed',
      fondo:
        '#f5f3ff',
      icono:
        Workflow,
    },

    REDACCION_JURIDICA: {
      nombre:
        'Redacción jurídica',
      color:
        '#dc2626',
      fondo:
        '#fef2f2',
      icono:
        Scale,
    },

    EXPOSICION: {
      nombre:
        'Exposición',
      color:
        '#d97706',
      fondo:
        '#fffbeb',
      icono:
        Presentation,
    },

    CASO_PRACTICO: {
      nombre:
        'Caso práctico',
      color:
        '#16a34a',
      fondo:
        '#f0fdf4',
      icono:
        ListChecks,
    },

    MIXTA: {
      nombre:
        'Actividad mixta',
      color:
        '#0f766e',
      fondo:
        '#f0fdfa',
      icono:
        Workflow,
    },

    PRESENCIAL: {
      nombre:
        'Presencial',
      color:
        '#64748b',
      fondo:
        '#f8fafc',
      icono:
        CheckCircle2,
    },
  };

const estados = {
  BORRADOR:
    'Borrador',
  PROGRAMADA:
    'Programada',
  DISPONIBLE:
    'Disponible',
  CERRADA:
    'Finalizada',
  ANULADA:
    'Anulada',
} as const;

function fechaCompacta(
  valor?:
    string | null,
) {
  if (!valor) {
    return 'Sin fecha';
  }

  const objeto =
    new Date(
      valor,
    );

  if (
    Number.isNaN(
      objeto.getTime(),
    )
  ) {
    return 'Sin fecha';
  }

  const fecha =
    new Intl.DateTimeFormat(
      'es-BO',
      {
        day:
          '2-digit',
        month:
          'short',
      },
    ).format(
      objeto,
    );

  const hora =
    new Intl.DateTimeFormat(
      'es-BO',
      {
        hour:
          '2-digit',
        minute:
          '2-digit',
        hour12:
          false,
      },
    ).format(
      objeto,
    );

  return `${fecha} · ${hora}`;
}

function etiquetaComponente(
  valor:
    TareaCurso['componente'],
) {
  if (
    valor ===
    'CONTINUA'
  ) {
    return 'Continua';
  }

  if (
    valor ===
    'PROCESUAL'
  ) {
    return 'Procesual';
  }

  return null;
}

function fechaReferencia(
  tarea:
    TareaCurso,
) {
  if (
    tarea.estado ===
      'PROGRAMADA'
  ) {
    return {
      etiqueta:
        'Abre',
      valor:
        fechaCompacta(
          tarea.fechaApertura,
        ),
    };
  }

  if (
    tarea.estado ===
      'CERRADA'
  ) {
    return {
      etiqueta:
        'Finalizó',
      valor:
        fechaCompacta(
          tarea.fechaCierre,
        ),
    };
  }

  return {
    etiqueta:
      tarea.permitirRetrasos
        ? 'Límite'
        : 'Vence',
    valor:
      fechaCompacta(
        tarea.fechaLimite,
      ),
  };
}

function TareaCard({
  tarea,
  onAbrir,
}: {
  tarea:
    TareaCurso;
  onAbrir:
    () => void;
}) {
  const tipo =
    tipos[
      tarea.tipo
    ];

  const Icono =
    tipo.icono;

  const referencia =
    fechaReferencia(
      tarea,
    );

  const componente =
    etiquetaComponente(
      tarea.componente,
    );

  const estilo =
    {
      '--te-color':
        tipo.color,
      '--te-fondo':
        tipo.fondo,
    } as CSSProperties;

  return (
    <article
      className="te-card"
      style={
        estilo
      }
    >
      <button
        type="button"
        className="te-card__cuerpo"
        onClick={
          onAbrir
        }
      >
        <div className="te-card__etiquetas">
          <span
            className={`te-estado te-estado--${tarea.estado.toLowerCase()}`}
          >
            {
              estados[
                tarea.estado
              ]
            }
          </span>

          {tarea.esCalificable && (
            <span className="te-chip te-chip--nota">
              <Award
                size={12}
              />
              Calificable
            </span>
          )}

          {componente && (
            <span
              className={`te-chip te-chip--componente te-chip--${tarea.componente?.toLowerCase()}`}
            >
              <Award
                size={12}
              />
              {
                componente
              }
            </span>
          )}

          <span className="te-chip te-chip--tipo">
            <Icono
              size={12}
            />
            {
              tipo.nombre
            }
          </span>

          <span className="te-chip">
            <Users
              size={12}
            />
            {tarea.modalidad ===
              'GRUPAL'
              ? 'Grupal'
              : 'Individual'}
          </span>
        </div>

        <h3>
          {
            tarea.titulo
          }
        </h3>

        <p>
          {tarea.descripcion ||
            'Consulta las instrucciones y condiciones de esta actividad.'}
        </p>

        <div className="te-card__meta">
          <span>
            {
              tarea.hito.nombre
            }
          </span>

          {tarea.esCalificable && (
            <span>
              {Number(
                tarea.puntajeMaximo,
              )} pts
            </span>
          )}

          {tarea.permitirRetrasos && (
            <span>
              Acepta retrasos
            </span>
          )}
        </div>

        <div className="te-card__pie">
          <div className="te-card__fechas">
            <span>
              <small>
                Apertura
              </small>

              <strong>
                {fechaCompacta(
                  tarea.fechaApertura,
                )}
              </strong>
            </span>

            <span>
              <small>
                Límite
              </small>

              <strong>
                {fechaCompacta(
                  tarea.fechaLimite,
                )}
              </strong>
            </span>
          </div>

          <span className="te-card__referencia">
            <CalendarClock
              size={14}
            />

            <span>
              <small>
                {
                  referencia.etiqueta
                }
              </small>

              <strong>
                {
                  referencia.valor
                }
              </strong>
            </span>
          </span>
        </div>
      </button>
    </article>
  );
}

export default function TareasCursoEstudiante() {
  const navigate =
    useNavigate();

  const {
    curso,
    hitoSeleccionado,
  } =
    useAulaContext();

  const [
    filtro,
    setFiltro,
  ] =
    useState<Filtro>(
      'TODAS',
    );

  const {
    tareas,
    cargando,
    actualizando,
    error,
    cargar,
    limpiarError,
  } =
    useTareasEstudiante({
      cursoId:
        curso.id,
      hitoId:
        hitoSeleccionado?.id,
    });

  const filtradas =
    useMemo(
      () =>
        tareas.filter(
          (
            tarea,
          ) => {
            if (
              filtro ===
                'DISPONIBLES'
            ) {
              return tarea.estado ===
                'DISPONIBLE';
            }

            if (
              filtro ===
                'PROXIMAS'
            ) {
              return tarea.estado ===
                'PROGRAMADA';
            }

            if (
              filtro ===
                'FINALIZADAS'
            ) {
              return tarea.estado ===
                'CERRADA';
            }

            return true;
          },
        ),
      [
        filtro,
        tareas,
      ],
    );

  const opciones:
    OpcionAulaToolbar<Filtro>[] = [
      {
        id:
          'TODAS',
        texto:
          'Todas',
        icono:
          FileText,
        contador:
          tareas.length,
      },
      {
        id:
          'DISPONIBLES',
        texto:
          'Disponibles',
        icono:
          CheckCircle2,
        contador:
          tareas.filter(
            (
              tarea,
            ) =>
              tarea.estado ===
              'DISPONIBLE',
          ).length,
      },
      {
        id:
          'PROXIMAS',
        texto:
          'Próximas',
        icono:
          CalendarClock,
        contador:
          tareas.filter(
            (
              tarea,
            ) =>
              tarea.estado ===
              'PROGRAMADA',
          ).length,
      },
      {
        id:
          'FINALIZADAS',
        texto:
          'Finalizadas',
        icono:
          X,
        contador:
          tareas.filter(
            (
              tarea,
            ) =>
              tarea.estado ===
              'CERRADA',
          ).length,
      },
    ];

  return (
    <section className="te-page">
      <AulaHeader
        icono={
          FileText
        }
        etiqueta="Actividades académicas"
        titulo="Tareas"
        descripcion="Consulta las actividades asignadas por tu docente y revisa sus instrucciones, fechas y modalidad."
        informacion={
          hitoSeleccionado
            ? `Mostrando tareas de ${hitoSeleccionado.nombre}.`
            : 'Selecciona un hito para consultar sus tareas.'
        }
        acciones={[
          {
            texto:
              'Actualizar',
            icono:
              RefreshCw,
            variante:
              'secundaria',
            deshabilitada:
              actualizando,
            onClick: () =>
              void cargar(),
          },
        ]}
      />

      <AulaToolbar
        opciones={
          opciones
        }
        opcionActiva={
          filtro
        }
        ariaLabel="Estados de las tareas"
        onCambiar={
          setFiltro
        }
      />

      {error && (
        <div
          className="te-error"
          role="alert"
        >
          <AlertCircle
            size={18}
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={
              limpiarError
            }
          >
            <X
              size={15}
            />
          </button>
        </div>
      )}

      <div className="te-resultados">
        <AulaLoadingOverlay
          visible={
            actualizando
          }
          texto="Actualizando tareas…"
        />

        {cargando ? (
          <AulaSkeleton
            cantidad={4}
            variante="tarjetas"
          />
        ) : filtradas.length ===
          0 ? (
          <AulaEmptyState
            icono={
              FileText
            }
            titulo={
              filtro ===
                'TODAS'
                ? 'Todavía no hay tareas'
                : 'No hay tareas en esta categoría'
            }
            descripcion={
              filtro ===
                'TODAS'
                ? 'Las actividades publicadas por tu docente aparecerán aquí.'
                : 'Puedes cambiar el filtro para consultar otras actividades.'
            }
            accionTexto={
              filtro !==
                'TODAS'
                ? 'Ver todas'
                : undefined
            }
            onAccion={
              filtro !==
                'TODAS'
                ? () =>
                    setFiltro(
                      'TODAS',
                    )
                : undefined
            }
          />
        ) : (
          <div className="te-grid">
            {filtradas.map(
              (
                tarea,
              ) => (
                <TareaCard
                  key={
                    tarea.id
                  }
                  tarea={
                    tarea
                  }
                  onAbrir={() =>
                    navigate(
                      String(
                        tarea.id,
                      ),
                    )
                  }
                />
              ),
            )}
          </div>
        )}
      </div>

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .te-page {
    display: grid;
    gap: 14px;
    min-width: 0;
    color: var(--app-text);
  }

  .te-error {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 12px 14px;
    border: 1px solid var(--app-danger-border);
    border-radius: 14px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
    font-size: 11px;
  }

  .te-error span {
    flex: 1;
  }

  .te-error button {
    display: grid;
    place-items: center;
    padding: 4px;
    border: 0;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }

  .te-resultados {
    position: relative;
    min-height: 180px;
  }

  .te-grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 13px;
  }

  .te-card {
    --te-color:
      var(--app-accent);
    --te-fondo:
      var(--app-accent-soft);

    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-left:
      4px solid
      var(--te-color);
    border-radius: 19px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition:
      transform .16s ease,
      border-color .16s ease,
      box-shadow .16s ease;
  }

  .te-card:hover {
    transform: translateY(-2px);
    border-color: var(--app-border-strong);
    border-left-color: var(--te-color);
    box-shadow: var(--app-shadow-md);
  }

  .te-card__cuerpo {
    width: 100%;
    display: block;
    padding: 17px;
    border: 0;
    color: inherit;
    background: transparent;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .te-card__etiquetas {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .te-estado,
  .te-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: 9px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  .te-estado--programada {
    color: #1d4ed8;
    background: #dbeafe;
  }

  .te-estado--disponible {
    color: #047857;
    background: #d1fae5;
  }

  .te-estado--cerrada {
    color: #b42318;
    background: #fee4e2;
  }

  .te-chip--nota {
    color: #6d28d9;
    background: #ede9fe;
  }

  .te-chip--componente {
    border:
      1px solid
      transparent;
  }

  .te-chip--continua {
    color: #047857;
    background: #ecfdf5;
    border-color: #a7f3d0;
  }

  .te-chip--procesual {
    color: #1d4ed8;
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  .te-chip--tipo {
    color: var(--te-color);
    background: var(--te-fondo);
  }

  .te-card h3 {
    margin: 14px 0 6px;
    color: var(--app-text);
    font-size: 16px;
    line-height: 1.25;
  }

  .te-card p {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: var(--app-text-soft);
    font-size: 11px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .te-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px 12px;
    margin-top: 12px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .te-card__meta span + span::before {
    content: "•";
    margin-right: 12px;
  }

  .te-card__pie {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--app-border-soft);
  }

  .te-card__fechas {
    min-width: 0;
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 10px 18px;
  }

  .te-card__fechas > span,
  .te-card__referencia > span {
    display: grid;
    gap: 1px;
  }

  .te-card__fechas small,
  .te-card__referencia small {
    color: var(--app-text-muted);
    font-size: 8px;
    font-weight: 750;
  }

  .te-card__fechas strong,
  .te-card__referencia strong {
    color: var(--app-text-secondary);
    font-size: 9px;
    font-weight: 850;
    white-space: nowrap;
  }

  .te-card__referencia {
    min-width: 116px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
    flex-shrink: 0;
    color: var(--te-color);
  }

  .te-card__referencia > span {
    text-align: right;
  }

  @media (
    max-width:
      850px
  ) {
    .te-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (
    max-width:
      600px
  ) {
    .te-card__pie {
      align-items: stretch;
      flex-direction: column;
    }

    .te-card__referencia {
      min-width: 0;
      justify-content: flex-start;
    }

    .te-card__referencia > span {
      text-align: left;
    }
  }
`;