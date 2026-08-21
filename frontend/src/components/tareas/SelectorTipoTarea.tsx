import {
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  Check,
  FileText,
  Files,
  Gavel,
  Mic2,
  Puzzle,
  UsersRound,
} from 'lucide-react';

import type {
  LucideIcon,
} from 'lucide-react';

import {
  useMemo,
} from 'react';

import type {
  TipoTarea,
} from '../../types/tareas/tareas.types';

type Opcion = {
  tipo: TipoTarea;
  titulo: string;
  descripcion: string;
  detalle: string;
  icono: LucideIcon;
  distintivo?: string;
};

const opciones: Opcion[] = [
  {
    tipo: 'ENTREGA_ARCHIVOS',
    titulo: 'Entrega de archivos',
    descripcion: 'Informes, PDF, Word, imágenes o presentaciones.',
    detalle: 'Ideal para trabajos preparados fuera de IusAcademy que deben entregarse como evidencia digital.',
    icono: Files,
  },
  {
    tipo: 'RESPUESTA_ESCRITA',
    titulo: 'Respuesta escrita',
    descripcion: 'El estudiante redacta directamente dentro de IusAcademy.',
    detalle: 'Útil para análisis, argumentación jurídica, reflexiones, respuestas extensas y resolución escrita.',
    icono: FileText,
  },
  {
    tipo: 'DOCUMENTO_COLABORATIVO',
    titulo: 'Documento colaborativo',
    descripcion: 'El grupo redacta junto con historial y seguimiento de autoría.',
    detalle: 'Preparado para edición grupal, historial de versiones, aportes por estudiante y exportación PDF.',
    icono: UsersRound,
    distintivo: 'Avanzada',
  },
  {
    tipo: 'REDACCION_JURIDICA',
    titulo: 'Redacción jurídica',
    descripcion: 'Memoriales, demandas, recursos y documentos jurídicos guiados.',
    detalle: 'Experiencia especializada de IusAcademy para construir documentos jurídicos dentro de la plataforma.',
    icono: Gavel,
    distintivo: 'IusAcademy',
  },
  {
    tipo: 'EXPOSICION',
    titulo: 'Exposición',
    descripcion: 'Material de apoyo, presentación oral y evidencia docente.',
    detalle: 'Permite organizar una exposición individual o grupal y registrar posteriormente su realización.',
    icono: Mic2,
  },
  {
    tipo: 'CASO_PRACTICO',
    titulo: 'Caso práctico',
    descripcion: 'Resolución estructurada de hechos y problemas jurídicos.',
    detalle: 'Pensada para analizar hechos, identificar problemas jurídicos y desarrollar una solución fundamentada.',
    icono: BriefcaseBusiness,
  },
  {
    tipo: 'MIXTA',
    titulo: 'Actividad mixta',
    descripcion: 'Combina varias evidencias dentro de una sola tarea.',
    detalle: 'Permite reunir, por ejemplo, un informe, una redacción interna y una exposición en una sola actividad.',
    icono: Puzzle,
    distintivo: 'Flexible',
  },
  {
    tipo: 'PRESENCIAL',
    titulo: 'Actividad presencial',
    descripcion: 'La evidencia principal es registrada directamente por el docente.',
    detalle: 'Para actividades realizadas presencialmente que deben quedar registradas y eventualmente calificadas.',
    icono: BookOpenText,
  },
];

type Props = {
  valor: TipoTarea;

  modo?:
    | 'compacto'
    | 'catalogo';

  onCambiar: (
    tipo:
      TipoTarea,
  ) => void;

  onAbrirCatalogo?:
    () => void;
};

export default function SelectorTipoTarea({
  valor,
  modo = 'compacto',
  onCambiar,
  onAbrirCatalogo,
}: Props) {
  const seleccionada =
    useMemo(
      () =>
        opciones.find(
          (
            opcion,
          ) =>
            opcion.tipo ===
            valor,
        ) ??
        opciones[0],
      [
        valor,
      ],
    );

  const IconoSeleccionado =
    seleccionada.icono;

  if (
    modo ===
      'catalogo'
  ) {
    return (
      <div className="selector-tarea-modal">
        <div className="selector-tarea-modal__introduccion">
          <strong>
            ¿Qué harán tus estudiantes?
          </strong>

          <span>
            Selecciona una opción. Volverás automáticamente a la configuración de la tarea.
          </span>
        </div>

        <div className="selector-tarea-modal__grid">
          {opciones.map(
            (
              opcion,
            ) => {
              const Icono =
                opcion.icono;

              const activo =
                valor ===
                opcion.tipo;

              return (
                <button
                  key={opcion.tipo}
                  type="button"
                  className={`selector-tarea-modal__opcion ${activo ? 'activo' : ''}`}
                  onClick={() =>
                    onCambiar(
                      opcion.tipo,
                    )
                  }
                >
                  <span className="selector-tarea-modal__opcion-icono">
                    <Icono
                      size={22}
                    />
                  </span>

                  <span className="selector-tarea-modal__opcion-contenido">
                    <span className="selector-tarea-modal__opcion-titulo">
                      <strong>
                        {
                          opcion.titulo
                        }
                      </strong>

                      {opcion.distintivo && (
                        <em>
                          {
                            opcion.distintivo
                          }
                        </em>
                      )}
                    </span>

                    <small>
                      {
                        opcion.descripcion
                      }
                    </small>

                    <p>
                      {
                        opcion.detalle
                      }
                    </p>
                  </span>

                  {activo && (
                    <span
                      className="selector-tarea-modal__seleccionada"
                      aria-label="Actividad seleccionada"
                      title="Actividad seleccionada"
                    >
                      <Check
                        size={16}
                        strokeWidth={2.8}
                      />
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>

        <style>
          {styles}
        </style>
      </div>
    );
  }

  return (
    <>
      <div className="selector-tarea-compacto">
        <div className="selector-tarea-compacto__etiqueta">
          Tipo de actividad
        </div>

        <button
          type="button"
          className="selector-tarea-compacto__boton"
          onClick={
            onAbrirCatalogo
          }
        >
          <span className="selector-tarea-compacto__icono">
            <IconoSeleccionado
              size={21}
            />
          </span>

          <span className="selector-tarea-compacto__texto">
            <span className="selector-tarea-compacto__titulo">
              <strong>
                {
                  seleccionada.titulo
                }
              </strong>

              {seleccionada.distintivo && (
                <em>
                  {
                    seleccionada.distintivo
                  }
                </em>
              )}
            </span>

            <small>
              {
                seleccionada.descripcion
              }
            </small>
          </span>

          <span className="selector-tarea-compacto__accion">
            Cambiar

            <ArrowRight
              size={15}
            />
          </span>
        </button>
      </div>

      <style>
        {styles}
      </style>
    </>
  );
}

const styles = `
.selector-tarea-compacto {
    display: grid;
    gap: 6px;
  }

  .selector-tarea-compacto__etiqueta {
    color: var(--app-text-secondary);
    font-size: 11px;
    font-weight: 850;
  }

  .selector-tarea-compacto__boton {
    width: 100%;
    min-width: 0;
    min-height: 72px;

    display: grid;
    grid-template-columns:
      44px
      minmax(0, 1fr)
      auto;
    align-items: center;
    gap: 12px;

    padding: 11px 13px;

    border:
      1px solid
      var(--app-border-strong);
    border-radius: 13px;

    color: var(--app-text);
    background: var(--app-surface-alt);

    font: inherit;
    text-align: left;

    cursor: pointer;

    transition:
      border-color .16s ease,
      background .16s ease,
      box-shadow .16s ease;
  }

  .selector-tarea-compacto__boton:hover {
    border-color: var(--app-accent);

    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 34%,
        var(--app-surface)
      );

    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(--app-accent) 9%,
        transparent
      );
  }

  .selector-tarea-compacto__icono {
    width: 44px;
    height: 44px;

    display: grid;
    place-items: center;

    border:
      1px solid
      color-mix(
        in srgb,
        var(--app-accent) 28%,
        var(--app-border)
      );
    border-radius: 12px;

    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .selector-tarea-compacto__texto {
    min-width: 0;

    display: grid;
    gap: 4px;
  }

  .selector-tarea-compacto__titulo {
    min-width: 0;

    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
  }

  .selector-tarea-compacto__titulo strong {
    color: var(--app-text);
    font-size: 13px;
    font-weight: 850;
    line-height: 1.25;
  }

  .selector-tarea-compacto__titulo em,
  .selector-tarea-modal__opcion-titulo em {
    display: inline-flex;
    align-items: center;

    min-height: 20px;

    padding:
      2px
      7px;

    border-radius: 999px;

    color: var(--app-accent-dark);
    background: var(--app-accent-soft);

    font-size: 9px;
    font-style: normal;
    font-weight: 850;
    line-height: 1;
  }

  .selector-tarea-compacto__texto small {
    color: var(--app-text-muted);
    font-size: 10.5px;
    line-height: 1.4;
  }

  .selector-tarea-compacto__accion {
    display: inline-flex;
    align-items: center;
    gap: 5px;

    color: var(--app-accent-dark);

    font-size: 10.5px;
    font-weight: 850;

    white-space: nowrap;
  }

  .selector-tarea-modal {
    width: 100%;
    min-width: 0;

    display: grid;
    gap: 12px;

    color: var(--app-text);
  }

  .selector-tarea-modal__introduccion {
    display: grid;
    gap: 4px;

    padding:
      1px
      2px
      2px;
  }

  .selector-tarea-modal__introduccion strong {
    color: var(--app-text);
    font-size: 13.5px;
    font-weight: 850;
    line-height: 1.25;
  }

  .selector-tarea-modal__introduccion span {
    color: var(--app-text-muted);
    font-size: 11px;
    line-height: 1.45;
  }

  .selector-tarea-modal__grid {
    width: 100%;
    min-width: 0;

    display: grid;
    grid-template-columns:
      repeat(
        4,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px;

    overflow: visible;

    padding:
      2px
      1px
      3px;
  }

  .selector-tarea-modal__opcion {
    position: relative;

    min-width: 0;
    min-height: 150px;

    display: grid;
    grid-template-rows:
      auto
      minmax(
        0,
        1fr
      );
    align-content: start;
    gap: 9px;

    padding:
      13px
      13px
      12px;

    border:
      1px solid
      var(--app-border);
    border-radius: 15px;

    color: var(--app-text);
    background: var(--app-surface-alt);

    font: inherit;
    text-align: left;

    cursor: pointer;

    transition:
      border-color .16s ease,
      background .16s ease,
      transform .16s ease,
      box-shadow .16s ease;
  }

  .selector-tarea-modal__opcion:hover {
    transform:
      translateY(
        -1px
      );

    border-color:
      color-mix(
        in srgb,
        var(--app-accent) 52%,
        var(--app-border)
      );

    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 25%,
        var(--app-surface)
      );

    box-shadow:
      0 8px 22px
      rgba(
        15,
        23,
        42,
        .045
      );
  }

  .selector-tarea-modal__opcion.activo {
    border-color: var(--app-accent);

    background:
      color-mix(
        in srgb,
        var(--app-accent-soft) 76%,
        var(--app-surface)
      );

    box-shadow:
      inset
      0
      0
      0
      1px
      var(--app-accent);
  }

  .selector-tarea-modal__opcion-icono {
    width: 43px;
    height: 43px;

    display: grid;
    place-items: center;

    border:
      1px solid
      color-mix(
        in srgb,
        var(--app-accent) 24%,
        var(--app-border)
      );
    border-radius: 12px;

    color: var(--app-accent-dark);
    background: var(--app-surface);
  }

  .selector-tarea-modal__opcion.activo
  .selector-tarea-modal__opcion-icono {
    border-color:
      color-mix(
        in srgb,
        var(--app-accent) 42%,
        var(--app-border)
      );

    background:
      color-mix(
        in srgb,
        var(--app-surface) 70%,
        var(--app-accent-soft)
      );
  }

  .selector-tarea-modal__opcion-contenido {
    min-width: 0;

    display: grid;
    align-content: start;
    gap: 5px;
  }

  .selector-tarea-modal__opcion-titulo {
    min-width: 0;

    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;

    /*
     * Reservamos un poco de espacio para el check
     * de la opción seleccionada.
     */
    padding-right: 25px;
  }

  .selector-tarea-modal__opcion-titulo strong {
    color: var(--app-text);
    font-size: 13px;
    font-weight: 850;
    line-height: 1.25;
  }

  .selector-tarea-modal__opcion-contenido small {
    color: var(--app-text-secondary);

    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
  }

  .selector-tarea-modal__opcion-contenido p {
    margin:
      1px
      0
      0;

    color: var(--app-text-muted);

    font-size: 10px;
    font-weight: 450;
    line-height: 1.42;
  }


  .selector-tarea-modal__seleccionada {
    position: absolute;
    top: 11px;
    right: 11px;

    width: 27px;
    height: 27px;

    display: grid;
    place-items: center;

    border:
      1px solid
      color-mix(
        in srgb,
        var(--app-accent) 42%,
        var(--app-border)
      );
    border-radius: 50%;

    color: #fff;
    background: var(--app-accent);

    box-shadow:
      0 5px 12px
      color-mix(
        in srgb,
        var(--app-accent) 20%,
        transparent
      );
  }

  @media (
    max-width:
      1180px
  ) {
    .selector-tarea-modal__grid {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .selector-tarea-modal__opcion {
      min-height: 130px;

      grid-template-columns:
        44px
        minmax(
          0,
          1fr
        );
      grid-template-rows:
        auto;

      gap: 10px;
    }
  }

  @media (
    max-width:
      720px
  ) {
    .selector-tarea-modal__grid {
      grid-template-columns:
        1fr;
    }

    .selector-tarea-modal__opcion {
      min-height: 0;
    }
  }

  @media (
    max-width:
      520px
  ) {
    .selector-tarea-compacto__boton {
      grid-template-columns:
        40px
        minmax(
          0,
          1fr
        );
    }

    .selector-tarea-compacto__icono {
      width: 40px;
      height: 40px;
    }

    .selector-tarea-compacto__accion {
      grid-column:
        1 / -1;

      justify-content: flex-end;
    }

    .selector-tarea-modal__opcion {
      grid-template-columns:
        40px
        minmax(
          0,
          1fr
        );

      padding: 11px;
    }

    .selector-tarea-modal__opcion-icono {
      width: 40px;
      height: 40px;
    }

    .selector-tarea-modal__opcion-titulo strong {
      font-size: 12.5px;
    }

    .selector-tarea-modal__opcion-contenido small {
      font-size: 10.5px;
    }

    .selector-tarea-modal__opcion-contenido p {
      font-size: 9.5px;
    }
  }

  @media (
    prefers-reduced-motion:
      reduce
  ) {
    .selector-tarea-modal__opcion {
      transition: none;
    }

    .selector-tarea-modal__opcion:hover {
      transform: none;
    }
  }
`;