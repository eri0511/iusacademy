import {
  CalendarDays,
  Eye,
  EyeOff,
  MessageCircle,
  MessageSquareOff,
  Pin,
} from 'lucide-react';

import {
  useMemo,
} from 'react';

import AulaDropdown from '../aula/AulaDropdown';

import {
  obtenerConfiguracionTipoPublicacion,
} from '../../config/publicacionesCurso.config';

import type {
  PublicacionCurso,
} from '../../types/aula/comunicacion-curso.types';


type PublicacionCardProps = {
  publicacion:
    PublicacionCurso;

  puedeAdministrar:
    boolean;

  procesando:
    boolean;

  onAbrir:
    () => void;

  onEditar:
    () => void;

  onFijar:
    () => void;

  onCambiarComentarios:
    () => void;

  onCambiarVisibilidad:
    () => void;

  onRetirar:
    () => void;
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
      hour:
        '2-digit',
      minute:
        '2-digit',
    },
  ).format(
    new Date(
      fecha,
    ),
  );
}

function etiquetaPrioridad(
  prioridad:
    PublicacionCurso['prioridad'],
): string {
  switch (
    prioridad
  ) {
    case 'URGENTE':
      return 'Urgente';

    case 'ALTA':
      return 'Prioridad alta';

    case 'MEDIA':
      return 'Prioridad media';

    default:
      return 'Prioridad normal';
  }
}

export default function PublicacionCard({
  publicacion,
  puedeAdministrar,
  procesando,
  onAbrir,
  onEditar,
  onFijar,
  onCambiarComentarios,
  onCambiarVisibilidad,
  onRetirar,
}: PublicacionCardProps) {
  const configuracion =
    useMemo(
      () =>
        obtenerConfiguracionTipoPublicacion(
          publicacion.tipo,
        ),
      [
        publicacion.tipo,
      ],
    );

  const Icono =
    configuracion.icono;

  return (
    <>
      <article
        className={`publicacion-muro publicacion-muro--${configuracion.tono} ${
          publicacion.estaFijada
            ? 'fijada'
            : ''
        } ${
          !publicacion.visibleParaEstudiantes
            ? 'oculta'
            : ''
        }`}
      >
        <button
          type="button"
          className="publicacion-muro__abrir"
          onClick={
            onAbrir
          }
        >
          <div className="publicacion-muro__top">
            <span className="publicacion-muro__tipo">
              <Icono
                size={17}
              />

              {configuracion.etiqueta}
            </span>

            {publicacion.estaFijada && (
              <span className="publicacion-muro__fijada">
                <Pin
                  size={14}
                />
              </span>
            )}
          </div>

          <h3>
            {publicacion.titulo}
          </h3>

          {publicacion.fechaEventoInicio && (
            <div className="publicacion-muro__fecha">
              <CalendarDays
                size={16}
              />

              <span>
                {formatearFecha(
                  publicacion.fechaEventoInicio,
                )}
              </span>
            </div>
          )}

          {publicacion.lugar && (
            <span className="publicacion-muro__lugar">
              {publicacion.lugar}
            </span>
          )}

          {!publicacion.fechaEventoInicio && (
            <div className="publicacion-muro__fecha publicada">
              <CalendarDays
                size={16}
              />

              <span>
                Publicado
                {' '}
                {formatearFecha(
                  publicacion.publicadoEn,
                )}
              </span>
            </div>
          )}

          <div className="publicacion-muro__pie">
            <div className="publicacion-muro__estados">
              <span
                className={`estado ${
                  publicacion.visibleParaEstudiantes
                    ? 'visible'
                    : 'oculta'
                }`}
              >
                {publicacion.visibleParaEstudiantes ? (
                  <Eye
                    size={12}
                  />
                ) : (
                  <EyeOff
                    size={12}
                  />
                )}

                {publicacion.visibleParaEstudiantes
                  ? 'Visible'
                  : 'No visible'}
              </span>

              <span
                className={`estado comentarios ${
                  publicacion.comentariosHabilitados
                    ? 'abiertos'
                    : 'cerrados'
                }`}
              >
                {publicacion.comentariosHabilitados ? (
                  <MessageCircle
                    size={12}
                  />
                ) : (
                  <MessageSquareOff
                    size={12}
                  />
                )}

                {publicacion.comentariosHabilitados
                  ? 'Comentarios'
                  : 'Sin comentarios'}
              </span>

              <span
                className={`publicacion-muro__prioridad prioridad-${publicacion.prioridad.toLowerCase()}`}
              >
                {etiquetaPrioridad(
                  publicacion.prioridad,
                )}
              </span>
            </div>
          </div>
        </button>

        {puedeAdministrar && (
          <AulaDropdown
            triggerClassName="publicacion-muro__opciones"
            ariaLabel="Opciones de publicación"
            deshabilitado={
              procesando
            }
            opciones={[
              {
                texto:
                  'Editar publicación',
                onClick:
                  onEditar,
              },
              {
                texto:
                  publicacion.estaFijada
                    ? 'Desfijar del tablón'
                    : 'Fijar en el tablón',
                onClick:
                  onFijar,
              },
              {
                texto:
                  publicacion.comentariosHabilitados
                    ? 'Cerrar comentarios'
                    : 'Habilitar comentarios',
                onClick:
                  onCambiarComentarios,
              },
              {
                texto:
                  publicacion.visibleParaEstudiantes
                    ? 'Ocultar para estudiantes'
                    : 'Hacer visible',
                onClick:
                  onCambiarVisibilidad,
              },
              {
                texto:
                  'Retirar publicación',
                peligro:
                  true,
                separadorAntes:
                  true,
                onClick:
                  onRetirar,
              },
            ]}
          />
        )}
      </article>

      <style>
        {styles}
      </style>
    </>
  );
}

const styles = `
  .publicacion-muro {
    --tipo-acento: #2563eb;
    --tipo-suave: #dbeafe;

    position: relative;
    min-height: 172px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 21px;
    background:
      linear-gradient(
        145deg,
        var(--app-surface),
        color-mix(
          in srgb,
          var(--tipo-suave) 34%,
          var(--app-surface)
        )
      );
    box-shadow: var(--app-shadow-sm);
    transition:
      transform .18s ease,
      box-shadow .18s ease,
      border-color .18s ease;
  }

  .publicacion-muro:hover {
    transform: translateY(-3px);
    border-color: var(--tipo-acento);
    box-shadow:
      0 18px 38px
      color-mix(
        in srgb,
        var(--tipo-acento) 14%,
        transparent
      );
  }

  .publicacion-muro.fijada {
    grid-column: span 1;
    min-height: 172px;
  }

  .publicacion-muro.oculta {
    border-style: dashed;
  }

  .publicacion-muro::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    z-index: 2;
    height: 5px;
    background:
      linear-gradient(
        90deg,
        var(--tipo-acento),
        color-mix(
          in srgb,
          var(--tipo-acento) 76%,
          #ffffff
        )
      );
  }

  .publicacion-muro__abrir {
    width: 100%;
    min-height: inherit;
    display: flex;
    flex-direction: column;
    padding: 18px 16px 15px;
    border: none;
    color: inherit;
    background: transparent;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }

  .publicacion-muro__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-right: 38px;
  }

  .publicacion-muro__tipo {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--tipo-acento);
    background: var(--tipo-suave);
    font-size: 9px;
    font-weight: 850;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .publicacion-muro__fijada {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--tipo-acento);
    background: var(--tipo-suave);
  }

  .publicacion-muro h3 {
    margin: 15px 0 0;
    color: var(--app-text);
    font-size: 18px;
    line-height: 1.17;
  }


  .publicacion-muro__fecha {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    width: fit-content;
    margin-top: 13px;
    padding: 8px 10px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--tipo-acento) 25%,
        var(--app-border)
      );
    border-radius: 13px;
    color: var(--tipo-acento);
    background: var(--app-surface);
    font-size: 11px;
    font-weight: 800;
  }

  .publicacion-muro__lugar {
    margin-top: 7px;
    color: var(--app-text-muted);
    font-size: 8px;
  }


  .publicacion-muro__autor strong {
    color: var(--app-text);
    font-size: 9px;
  }

  .publicacion-muro__autor small {
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: 7px;
  }

  .publicacion-muro__pie {
    margin-top: auto;
    padding-top: 13px;
  }

  .publicacion-muro__estados {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    white-space: nowrap;
  }

  .publicacion-muro .estado,
  .publicacion-muro__prioridad {
    min-width: 0;
    min-height: 27px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 8px;
    overflow: hidden;
    border: 1px solid transparent;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 800;
    line-height: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .publicacion-muro .estado {
    flex: 0 1 auto;
  }

  .publicacion-muro__prioridad {
    flex: 0 1 auto;
    margin-left: auto;
  }

  .publicacion-muro .estado.visible {
    color: var(--app-success);
    border-color: var(--app-success-border);
    background: var(--app-success-bg);
  }

  .publicacion-muro .estado.oculta {
    color: var(--app-danger);
    border-color: var(--app-danger-border);
    background: var(--app-danger-bg);
  }

  .publicacion-muro .estado.comentarios.abiertos {
    color: #2563eb;
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  .publicacion-muro .estado.comentarios.cerrados {
    color: var(--app-text-muted);
    border-color: var(--app-border-soft);
    background: var(--app-accent-softer);
  }

  .prioridad-informativa {
    color: var(--app-text-secondary);
    border-color: var(--app-border-soft);
    background: var(--app-surface-alt);
  }

  .prioridad-media {
    color: #a16207;
    border-color: #fde68a;
    background: #fef9c3;
  }

  .prioridad-alta {
    color: #c2410c;
    border-color: #fed7aa;
    background: #ffedd5;
  }

  .prioridad-urgente {
    color: #dc2626;
    border-color: #fecaca;
    background: #fee2e2;
  }

  .publicacion-muro__opciones {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 4;
  }

  .publicacion-muro--azul {
    --tipo-acento: #2563eb;
    --tipo-suave: #dbeafe;
  }

  .publicacion-muro--verde {
    --tipo-acento: #15803d;
    --tipo-suave: #dcfce7;
  }

  .publicacion-muro--rojo {
    --tipo-acento: #dc2626;
    --tipo-suave: #fee2e2;
  }

  .publicacion-muro--morado {
    --tipo-acento: #7c3aed;
    --tipo-suave: #ede9fe;
  }

  .publicacion-muro--naranja {
    --tipo-acento: #ea580c;
    --tipo-suave: #ffedd5;
  }

  .publicacion-muro--celeste {
    --tipo-acento: #0284c7;
    --tipo-suave: #e0f2fe;
  }

  .publicacion-muro--gris {
    --tipo-acento: #475569;
    --tipo-suave: #e2e8f0;
  }

  .publicacion-muro--indigo {
    --tipo-acento: #4f46e5;
    --tipo-suave: #e0e7ff;
  }

  .publicacion-muro--amarillo {
    --tipo-acento: #ca8a04;
    --tipo-suave: #fef9c3;
  }

  .publicacion-muro--rosa {
    --tipo-acento: #db2777;
    --tipo-suave: #fce7f3;
  }

  @media (max-width: 700px) {
    .publicacion-muro.fijada {
      grid-column: span 1;
    }

    .publicacion-muro__pie {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 420px) {
    .publicacion-muro__estados {
      gap: 4px;
    }

    .publicacion-muro .estado,
    .publicacion-muro__prioridad {
      padding: 6px;
      font-size: 7px;
    }
  }
`;