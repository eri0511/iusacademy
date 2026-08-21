import {
  AlertCircle,
  BarChart3,
  BookOpenText,
  CalendarClock,
  Eye,
  MessageCircle,
  MessageSquareText,
  Paperclip,
  Pin,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
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

import useForosCurso from '../../../hooks/foro/useForosCurso';

import type {
  EstadoForo,
  FiltrosForo,
  ForoListado,
} from '../../../types/foro/foro.types';

type FiltroRapido =
  | 'TODOS'
  | 'ABIERTOS'
  | 'PROGRAMADOS'
  | 'CERRADOS'
  | 'NOVEDADES';

const estadoPorFiltro:
  Partial<
    Record<
      FiltroRapido,
      EstadoForo
    >
  > = {
    ABIERTOS:
      'ABIERTO',
    PROGRAMADOS:
      'PROGRAMADO',
    CERRADOS:
      'CERRADO',
  };

const etiquetasEstado:
  Record<
    EstadoForo,
    string
  > = {
    BORRADOR:
      'Borrador',
    PROGRAMADO:
      'Programado',
    ABIERTO:
      'Abierto',
    VENCIDO:
      'Vencido',
    CERRADO:
      'Cerrado',
    CALIFICANDO:
      'Calificando',
    CALIFICADO:
      'Calificado',
    NOTAS_PUBLICADAS:
      'Notas publicadas',
    ANULADO:
      'Anulado',
  };

function textoPlano(
  html:
    string,
) {
  return html
    .replace(
      /<[^>]*>/g,
      ' ',
    )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim();
}

function fechaCompacta(
  fecha?: string | null,
): string {
  if (!fecha) {
    return 'Sin fecha';
  }

  const valor =
    new Date(
      fecha,
    );

  if (
    Number.isNaN(
      valor.getTime(),
    )
  ) {
    return 'Sin fecha';
  }

  const fechaTexto =
    new Intl.DateTimeFormat(
      'es-BO',
      {
        day:
          '2-digit',
        month:
          'short',
      },
    ).format(
      valor,
    );

  const horaTexto =
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
      valor,
    );

  return `${fechaTexto} · ${horaTexto}`;
}

function obtenerFechaReferencia(
  foro:
    ForoListado,
): {
  etiqueta:
    string;
  fecha:
    string;
} {
  if (
    foro.estado ===
    'PROGRAMADO'
  ) {
    return {
      etiqueta:
        'Abre',
      fecha:
        fechaCompacta(
          foro.fechaApertura,
        ),
    };
  }

  if (
    foro.estado ===
      'CERRADO' ||
    foro.estado ===
      'CALIFICANDO' ||
    foro.estado ===
      'CALIFICADO' ||
    foro.estado ===
      'NOTAS_PUBLICADAS'
  ) {
    return {
      etiqueta:
        'Cerró',
      fecha:
        fechaCompacta(
          foro.fechaCierre,
        ),
    };
  }

  if (
    foro.estado ===
      'VENCIDO'
  ) {
    return {
      etiqueta:
        'Venció',
      fecha:
        fechaCompacta(
          foro.fechaLimite,
        ),
    };
  }

  return {
    etiqueta:
      'Vence',
    fecha:
      fechaCompacta(
        foro.fechaLimite,
      ),
  };
}

function etiquetaComponente(
  componente?:
    string | null,
): string | null {
  if (!componente) {
    return null;
  }

  if (
    componente ===
    'CONTINUA'
  ) {
    return 'Continua';
  }

  if (
    componente ===
    'PROCESUAL'
  ) {
    return 'Procesual';
  }

  return componente
    .toLowerCase()
    .replaceAll(
      '_',
      ' ',
    )
    .replace(
      /^\w/,
      (
        letra,
      ) =>
        letra.toUpperCase(),
    );
}

function etiquetaModalidad(
  modalidad:
    ForoListado['modalidadParticipacion'],
): string {
  return modalidad ===
    'GRUPAL'
    ? 'Grupal'
    : 'Individual';
}

function ForoCardEstudiante({
  foro,
  onAbrir,
}: {
  foro:
    ForoListado;
  onAbrir:
    () => void;
}) {
  const nombreAutor =
    `${foro.autor.nombres} ${foro.autor.apellidoPaterno}`.trim();

  const fechaReferencia =
    obtenerFechaReferencia(
      foro,
    );

  const componente =
    etiquetaComponente(
      foro.actividadCalificable?.componente,
    );

  const modalidad =
    etiquetaModalidad(
      foro.modalidadParticipacion,
    );

  return (
    <article className="foro-est-card">
      <button
        type="button"
        className="foro-est-card__cuerpo"
        onClick={
          onAbrir
        }
      >
        <div className="foro-est-card__encabezado">
          <div className="foro-est-card__etiquetas">
            <span
              className={`foro-est-estado foro-est-estado--${foro.estado.toLowerCase()}`}
            >
              {
                etiquetasEstado[
                  foro.estado
                ]
              }
            </span>

            {foro.esCalificable && (
              <span className="foro-est-chip foro-est-chip--nota">
                <BarChart3
                  size={12}
                />
                Calificable
              </span>
            )}

            {componente && (
              <span className="foro-est-chip foro-est-chip--componente">
                {componente}
              </span>
            )}

            <span className="foro-est-chip foro-est-chip--modalidad">
              <Users
                size={12}
              />
              {modalidad}
            </span>

            {foro.estaFijado && (
              <span className="foro-est-chip foro-est-chip--fijado">
                <Pin
                  size={12}
                />
                Fijado
              </span>
            )}
          </div>
        </div>

        <h3>
          {foro.titulo}
        </h3>

        <p>
          {textoPlano(
            foro.contenido,
          ) ||
            'Sin descripción.'}
        </p>

        <div className="foro-est-card__meta">
          <span>
            Por
            {' '}
            {nombreAutor}
          </span>

          {foro.hito && (
            <span>
              {foro.hito.nombre}
            </span>
          )}

        </div>

        <div className="foro-est-card__pie">
          <div className="foro-est-card__indicadores">
            <span>
              <MessageSquareText
                size={15}
              />

              <strong>
                {
                  foro.indicadores
                    .cantidadRespuestas
                }
              </strong>

              respuestas
            </span>

            <span>
              <MessageCircle
                size={15}
              />

              <strong>
                {
                  foro.indicadores
                    .cantidadComentarios
                }
              </strong>

              comentarios
            </span>

            <span>
              <Users
                size={15}
              />

              <strong>
                {
                  foro.indicadores
                    .cantidadParticipantes
                }
              </strong>

              participantes
            </span>

            <span>
              <Eye
                size={15}
              />

              <strong>
                {
                  foro.indicadores
                    .cantidadLectores
                }
              </strong>

              lecturas
            </span>

            {(foro._count?.archivos ??
              0) >
              0 && (
              <span>
                <Paperclip
                  size={15}
                />

                <strong>
                  {
                    foro._count
                      ?.archivos
                  }
                </strong>

                archivos
              </span>
            )}
          </div>

          <span className="foro-est-card__vencimiento">
            <CalendarClock
              size={14}
            />

            <span>
              <small>
                {
                  fechaReferencia.etiqueta
                }
              </small>

              <strong>
                {
                  fechaReferencia.fecha
                }
              </strong>
            </span>
          </span>
        </div>

      </button>
    </article>
  );
}

export default function ForoCursoEstudiante() {
  const navigate =
    useNavigate();

  const {
    curso,
    hitoSeleccionado,
  } =
    useAulaContext();

  const [
    filtroRapido,
    setFiltroRapido,
  ] =
    useState<FiltroRapido>(
      'TODOS',
    );


  const filtros =
    useMemo<FiltrosForo>(
      () => ({
        busqueda:
          '',
        estado:
          estadoPorFiltro[
            filtroRapido
          ] ??
          '',
        lectura:
          filtroRapido ===
          'NOVEDADES'
            ? 'CON_NOVEDADES'
            : '',
        orden:
          'ULTIMA_ACTIVIDAD_DESC',
        pagina:
          1,
        limite:
          100,
        hitoId:
          hitoSeleccionado?.id,
      }),
      [
        filtroRapido,
        hitoSeleccionado?.id,
      ],
    );

  const {
    foros,
    cargando,
    actualizando,
    error,
    cargarForos,
    limpiarError,
  } =
    useForosCurso(
      curso.id,
      filtros,
    );

  const opciones:
    OpcionAulaToolbar<FiltroRapido>[] = [
      {
        id:
          'TODOS',
        texto:
          'Todos',
        icono:
          BookOpenText,
      },
      {
        id:
          'ABIERTOS',
        texto:
          'Abiertos',
        icono:
          MessageSquareText,
      },
      {
        id:
          'PROGRAMADOS',
        texto:
          'Próximos',
        icono:
          CalendarClock,
      },
      {
        id:
          'CERRADOS',
        texto:
          'Finalizados',
        icono:
          X,
      },
      {
        id:
          'NOVEDADES',
        texto:
          'Con novedades',
        icono:
          AlertCircle,
      },
    ];

  const cambiarFiltro =
    (
      valor:
        FiltroRapido,
    ) => {
      setFiltroRapido(
        valor,
      );
    };

  const [
    refrescandoAutomaticamente,
    setRefrescandoAutomaticamente,
  ] =
    useState(
      false,
    );

  const refrescarSilenciosamente =
    useCallback(
      async () => {
        if (
          cargando ||
          actualizando ||
          refrescandoAutomaticamente ||
          document.visibilityState !==
            'visible'
        ) {
          return;
        }

        setRefrescandoAutomaticamente(
          true,
        );

        try {
          await cargarForos();
        } finally {
          setRefrescandoAutomaticamente(
            false,
          );
        }
      },
      [
        actualizando,
        cargando,
        cargarForos,
        refrescandoAutomaticamente,
      ],
    );

  useEffect(
    () => {
      const intervalo =
        window.setInterval(
          () => {
            void refrescarSilenciosamente();
          },
          5000,
        );

      const alVolver =
        () => {
          void refrescarSilenciosamente();
        };

      window.addEventListener(
        'focus',
        alVolver,
      );

      document.addEventListener(
        'visibilitychange',
        alVolver,
      );

      return () => {
        window.clearInterval(
          intervalo,
        );

        window.removeEventListener(
          'focus',
          alVolver,
        );

        document.removeEventListener(
          'visibilitychange',
          alVolver,
        );
      };
    },
    [
      refrescarSilenciosamente,
    ],
  );

  return (
    <section className="foro-estudiante">
      <AulaHeader
        icono={
          MessageSquareText
        }
        etiqueta="Aprendizaje colaborativo"
        titulo="Foros"
        descripcion="Participa en los debates jurídicos, responde a las actividades y conversa con tus compañeros."
        informacion={
          hitoSeleccionado
            ? `Mostrando actividades de ${hitoSeleccionado.nombre}.`
            : 'Selecciona un hito para consultar sus foros.'
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
              actualizando ||
              refrescandoAutomaticamente,
            onClick: () =>
              void cargarForos(),
          },
        ]}
      />

      <AulaToolbar
        opciones={
          opciones
        }
        opcionActiva={
          filtroRapido
        }
        ariaLabel="Estados de los foros"
        onCambiar={
          cambiarFiltro
        }
      />

      {error && (
        <div
          className="foro-est-error"
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

      <div className="foro-est-resultados">
        <AulaLoadingOverlay
          visible={
            actualizando &&
            !refrescandoAutomaticamente
          }
          texto="Actualizando foros…"
        />

        {cargando ? (
          <AulaSkeleton
            cantidad={4}
            variante="tarjetas"
          />
        ) : foros.length ===
          0 ? (
          <AulaEmptyState
            icono={
              MessageSquareText
            }
            titulo={
              filtroRapido !==
              'TODOS'
                ? 'No encontramos foros'
                : 'Todavía no hay foros'
            }
            descripcion={
              filtroRapido !==
              'TODOS'
                ? 'No hay foros en esta categoría.'
                : 'Los foros publicados por tu docente aparecerán aquí.'
            }
            accionTexto={
              filtroRapido !==
              'TODOS'
                ? 'Ver todos'
                : undefined
            }
            onAccion={
              filtroRapido !==
              'TODOS'
                ? () =>
                    cambiarFiltro(
                      'TODOS',
                    )
                : undefined
            }
          />
        ) : (
          <div className="foro-est-grid">
            {foros.map(
              (
                foro,
              ) => (
                <ForoCardEstudiante
                  key={
                    foro.id
                  }
                  foro={
                    foro
                  }
                  onAbrir={() =>
                    navigate(
                      String(
                        foro.id,
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
  .foro-estudiante {
    display: grid;
    gap: 14px;
    min-width: 0;
    color: var(--app-text);
  }

  .foro-est-error {
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

  .foro-est-error span {
    flex: 1;
  }

  .foro-est-error button {
    display: grid;
    place-items: center;
    padding: 4px;
    border: 0;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }

  .foro-est-resultados {
    position: relative;
    min-height: 180px;
  }

  .foro-est-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 13px;
  }

  .foro-est-card {
    position: relative;
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-left: 4px solid var(--app-accent);
    border-radius: 19px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
    transition:
      transform .16s ease,
      border-color .16s ease,
      box-shadow .16s ease;
  }

  .foro-est-card:hover {
    transform: translateY(-2px);
    border-color: var(--app-border-strong);
    box-shadow: var(--app-shadow-md);
  }


  .foro-est-card__cuerpo {
    width: 100%;
    display: block;
    padding: 17px;
    border: 0;
    text-align: left;
    color: inherit;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }

  .foro-est-card__encabezado {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .foro-est-card__etiquetas {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .foro-est-estado,
  .foro-est-chip {
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

  .foro-est-estado--abierto {
    color: #047857;
    background: #d1fae5;
  }

  .foro-est-estado--programado {
    color: #1d4ed8;
    background: #dbeafe;
  }

  .foro-est-estado--vencido {
    color: #b45309;
    background: #ffedd5;
  }

  .foro-est-estado--cerrado,
  .foro-est-estado--anulado {
    color: #b42318;
    background: #fee4e2;
  }

  .foro-est-estado--borrador {
    color: #a16207;
    background: #fef3c7;
  }

  .foro-est-estado--calificando {
    color: #9a3412;
    background: #ffedd5;
  }

  .foro-est-estado--calificado {
    color: #5b21b6;
    background: #ede9fe;
  }

  .foro-est-estado--notas_publicadas {
    color: #0369a1;
    background: #e0f2fe;
  }

  .foro-est-chip--nota {
    color: #6d28d9;
    background: #ede9fe;
  }

  .foro-est-chip--componente {
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .foro-est-chip--modalidad {
    color: #475569;
    background: #f1f5f9;
  }

  .foro-est-chip--fijado {
    color: #b45309;
    background: #fff7ed;
  }

  .foro-est-card h3 {
    margin: 14px 0 6px;
    font-size: 16px;
    line-height: 1.25;
  }

  .foro-est-card p {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: var(--app-text-soft);
    font-size: 11px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .foro-est-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px 12px;
    margin-top: 12px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .foro-est-card__meta span + span::before {
    content: "•";
    margin-right: 12px;
  }

  .foro-est-card__pie {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--app-border-soft);
  }

  .foro-est-card__indicadores {
    min-width: 0;
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 8px 13px;
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .foro-est-card__indicadores span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .foro-est-card__indicadores strong {
    color: var(--app-text-secondary);
  }

  .foro-est-card__vencimiento {
    min-width: 116px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
    flex-shrink: 0;
    color: var(--app-accent-dark);
  }

  .foro-est-card__vencimiento > span {
    display: grid;
    gap: 1px;
    text-align: right;
  }

  .foro-est-card__vencimiento small {
    color: var(--app-text-muted);
    font-size: 8px;
    font-weight: 750;
    line-height: 1.1;
  }

  .foro-est-card__vencimiento strong {
    color: var(--app-text-secondary);
    font-size: 9px;
    font-weight: 850;
    line-height: 1.2;
    white-space: nowrap;
  }


  @media (max-width: 850px) {
    .foro-est-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .foro-est-card__pie {
      align-items: stretch;
      flex-direction: column;
    }

    .foro-est-card__vencimiento {
      min-width: 0;
      justify-content: flex-start;
    }

    .foro-est-card__vencimiento > span {
      text-align: left;
    }

  }
`;