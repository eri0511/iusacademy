import {
  AlertCircle,
  Archive,
  BellRing,
  CalendarClock,
  Clock3,
  Megaphone,
  Pin,
  RefreshCw,
  X,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import {
  useAuth,
} from '../../../auth/AuthContext';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaLoadingOverlay from '../../../components/aula/AulaLoadingOverlay';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import AulaToolbar, {
  type OpcionAulaToolbar,
} from '../../../components/aula/AulaToolbar';
import DetallePublicacionPanel from '../../../components/curso/DetallePublicacionPanel';
import PublicacionCard from '../../../components/curso/PublicacionCard';

import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import {
  obtenerConfiguracionTipoPublicacion,
} from '../../../config/publicacionesCurso.config';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import useTablonCurso from '../../../hooks/useTablonCurso';

import type {
  ComentarioPublicacion,
  PublicacionCurso,
} from '../../../types/comunicacion-curso.types';

type FiltroTablon =
  | 'TODOS'
  | 'FIJADA'
  | 'URGENTE'
  | 'PROXIMA'
  | 'GENERAL'
  | 'FINALIZADA';

type ToastActual = {
  visible:
    boolean;

  tipo:
    TipoToast;

  titulo:
    string;

  mensaje?:
    string;
};

export default function TablonCursoEstudiante() {
  const {
    aula,
    curso:
      cursoAula,
    hitoSeleccionado,
  } =
    useAulaContext();

  const {
    sesion,
  } =
    useAuth();

  const usuarioActualId =
    sesion?.usuario?.id;

  const {
    curso,
    hito,
    publicaciones,
    publicacionesOrganizadas,
    cargando,
    actualizando,
    tieneContenido,
    error,
    comentarioProcesandoId,
    comentarios,
    cargandoComentarios,
    cargarTablon,
    cargarComentarios,
    comentar,
    editarComentario,
    retirarComentario,
    cerrarComentarios,
    limpiarError,
  } =
    useTablonCurso({
      cursoId:
        cursoAula.id,

      hitoId:
        hitoSeleccionado?.id ??
        0,

      /*
       * El hook ya recibe el rol real del aula.
       * El backend/hook debe devolver al estudiante únicamente
       * publicaciones visibles para estudiantes.
       */
      rol:
        aula.usuario.rol,

      cargarAutomaticamente:
        hitoSeleccionado !==
        null,
    });

  const [
    filtroTablon,
    setFiltroTablon,
  ] =
    useState<FiltroTablon>(
      'TODOS',
    );

  const [
    publicacionDetalle,
    setPublicacionDetalle,
  ] =
    useState<PublicacionCurso | null>(
      null,
    );

  const [
    comentarioTexto,
    setComentarioTexto,
  ] =
    useState(
      '',
    );

  const [
    comentarioEditando,
    setComentarioEditando,
  ] =
    useState<ComentarioPublicacion | null>(
      null,
    );

  const [
    textoEdicionComentario,
    setTextoEdicionComentario,
  ] =
    useState(
      '',
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastActual>({
      visible:
        false,

      tipo:
        'exito',

      titulo:
        '',
    });

  /*
   * Si el comentario modifica internamente la publicación o el hook
   * refresca el tablón, usamos siempre la versión más reciente.
   */
  const publicacionDetalleActual =
    useMemo(
      () => {
        if (
          !publicacionDetalle
        ) {
          return null;
        }

        return (
          publicaciones.find(
            (
              publicacion,
            ) =>
              publicacion.id ===
              publicacionDetalle.id,
          ) ??
          publicacionDetalle
        );
      },
      [
        publicacionDetalle,
        publicaciones,
      ],
    );

  /*
   * Seguridad visual extra:
   * aun cuando el hook/backend ya filtra para ESTUDIANTE,
   * esta vista nunca muestra publicaciones marcadas como ocultas.
   */
  const configuracionDetalle =
    useMemo(
      () =>
        publicacionDetalleActual
          ? obtenerConfiguracionTipoPublicacion(
              publicacionDetalleActual.tipo,
            )
          : null,
      [
        publicacionDetalleActual,
      ],
    );

  const publicacionesVisibles =
    useMemo(
      () =>
        publicacionesOrganizadas.filter(
          (
            publicacion,
          ) =>
            publicacion.visibleParaEstudiantes !==
            false,
        ),
      [
        publicacionesOrganizadas,
      ],
    );

  const conteosFiltros =
    useMemo(
      () => ({
        TODOS:
          publicacionesVisibles.length,

        FIJADA:
          publicacionesVisibles.filter(
            (
              publicacion,
            ) =>
              publicacion.grupoTemporal ===
              'FIJADA',
          ).length,

        URGENTE:
          publicacionesVisibles.filter(
            (
              publicacion,
            ) =>
              publicacion.grupoTemporal ===
              'URGENTE',
          ).length,

        PROXIMA:
          publicacionesVisibles.filter(
            (
              publicacion,
            ) =>
              publicacion.grupoTemporal ===
              'PROXIMA',
          ).length,

        GENERAL:
          publicacionesVisibles.filter(
            (
              publicacion,
            ) =>
              publicacion.grupoTemporal ===
              'GENERAL',
          ).length,

        FINALIZADA:
          publicacionesVisibles.filter(
            (
              publicacion,
            ) =>
              publicacion.grupoTemporal ===
              'FINALIZADA',
          ).length,
      }),
      [
        publicacionesVisibles,
      ],
    );

  const opcionesToolbar =
    useMemo<
      OpcionAulaToolbar<FiltroTablon>[]
    >(
      () => [
        {
          id:
            'TODOS',

          texto:
            'Todos',

          icono:
            BellRing,

          contador:
            conteosFiltros.TODOS,
        },

        {
          id:
            'FIJADA',

          texto:
            'Destacados',

          icono:
            Pin,

          contador:
            conteosFiltros.FIJADA,
        },

        {
          id:
            'URGENTE',

          texto:
            'Urgentes',

          icono:
            Clock3,

          contador:
            conteosFiltros.URGENTE,
        },

        {
          id:
            'PROXIMA',

          texto:
            'Próximos',

          icono:
            CalendarClock,

          contador:
            conteosFiltros.PROXIMA,
        },

        {
          id:
            'GENERAL',

          texto:
            'Generales',

          icono:
            Megaphone,

          contador:
            conteosFiltros.GENERAL,
        },

        {
          id:
            'FINALIZADA',

          texto:
            'Finalizados',

          icono:
            Archive,

          contador:
            conteosFiltros.FINALIZADA,
        },
      ],
      [
        conteosFiltros,
      ],
    );

  const publicacionesFiltradas =
    useMemo(
      () =>
        publicacionesVisibles
          .filter(
            (
              publicacion,
            ) =>
              filtroTablon ===
                'TODOS' ||
              publicacion.grupoTemporal ===
                filtroTablon,
          )
          .sort(
            (
              publicacionA,
              publicacionB,
            ) => {
              if (
                publicacionA.estaFijada !==
                publicacionB.estaFijada
              ) {
                return publicacionA.estaFijada
                  ? -1
                  : 1;
              }

              const fechaA =
                new Date(
                  publicacionA.publicadoEn,
                ).getTime();

              const fechaB =
                new Date(
                  publicacionB.publicadoEn,
                ).getTime();

              return fechaB -
                fechaA;
            },
          ),
      [
        filtroTablon,
        publicacionesVisibles,
      ],
    );

  const mostrarToast = (
    tipo:
      TipoToast,
    titulo:
      string,
    mensaje?:
      string,
  ) => {
    setToast({
      visible:
        true,

      tipo,

      titulo,

      mensaje,
    });
  };

  const abrirDetalle =
    async (
      publicacion:
        PublicacionCurso,
    ) => {
      setPublicacionDetalle(
        publicacion,
      );

      setComentarioTexto(
        '',
      );

      setComentarioEditando(
        null,
      );

      setTextoEdicionComentario(
        '',
      );

      /*
       * Solo se consultan comentarios cuando el docente habilitó
       * la participación para esta publicación.
       *
       * Si están cerrados:
       * - el estudiante ve el comunicado;
       * - no se consulta el hilo;
       * - no aparece textarea para comentar.
       */
      if (
        !publicacion.comentariosHabilitados
      ) {
        cerrarComentarios();

        return;
      }

      try {
        await cargarComentarios(
          publicacion.id,
        );
      } catch {
        /*
         * useTablonCurso conserva el error.
         */
      }
    };

  const enviarComentario =
    async () => {
      if (
        !publicacionDetalleActual ||
        !publicacionDetalleActual
          .comentariosHabilitados ||
        !comentarioTexto.trim()
      ) {
        return;
      }

      try {
        await comentar(
          publicacionDetalleActual.id,
          {
            contenido:
              comentarioTexto.trim(),
          },
        );

        setComentarioTexto(
          '',
        );

        mostrarToast(
          'exito',
          'Comentario publicado',
          'Tu comentario se agregó correctamente al comunicado.',
        );
      } catch (
        problema
      ) {
        mostrarToast(
          'error',
          'No se pudo publicar',
          problema instanceof
            Error
            ? problema.message
            : 'No fue posible publicar el comentario.',
        );
      }
    };

  const editarComentarioPropio =
    async (
      comentarioId:
        number,
      contenido:
        string,
    ) => {
      if (
        !publicacionDetalleActual ||
        !publicacionDetalleActual
          .comentariosHabilitados
      ) {
        return;
      }

      try {
        await editarComentario(
          publicacionDetalleActual.id,
          comentarioId,
          {
            contenido,
          },
        );

        setComentarioEditando(
          null,
        );

        setTextoEdicionComentario(
          '',
        );

        mostrarToast(
          'exito',
          'Comentario actualizado',
          'Los cambios del comentario se guardaron correctamente.',
        );
      } catch (
        problema
      ) {
        mostrarToast(
          'error',
          'No se pudo actualizar',
          problema instanceof
            Error
            ? problema.message
            : 'No fue posible actualizar el comentario.',
        );
      }
    };

  const retirarComentarioPropio =
    async (
      comentarioId:
        number,
    ) => {
      if (
        !publicacionDetalleActual ||
        !publicacionDetalleActual
          .comentariosHabilitados
      ) {
        return;
      }

      try {
        await retirarComentario(
          publicacionDetalleActual.id,
          comentarioId,
        );

        mostrarToast(
          'exito',
          'Comentario retirado',
          'El comentario dejó de mostrarse en la publicación.',
        );
      } catch (
        problema
      ) {
        mostrarToast(
          'error',
          'No se pudo retirar',
          problema instanceof
            Error
            ? problema.message
            : 'No fue posible retirar el comentario.',
        );
      }
    };

  if (
    !hitoSeleccionado
  ) {
    return (
      <AulaEmptyState
        titulo="Selecciona un hito"
        descripcion="Elige H1, H2, H3, H4 o H5 para revisar los comunicados del tablón."
        icono={
          BellRing
        }
      />
    );
  }

  if (
    cargando &&
    !tieneContenido
  ) {
    return (
      <section className="tablon-estudiante">
        <AulaSkeleton
          cantidad={
            4
          }
          variante="lista"
        />

        <style>
          {styles}
        </style>
      </section>
    );
  }

  return (
    <section
      className={`tablon-estudiante ${
        actualizando
          ? 'actualizando'
          : ''
      }`}
    >
      <AulaLoadingOverlay
        visible={
          actualizando
        }
        texto={`Actualizando ${hitoSeleccionado.codigo}…`}
      />

      <AulaHeader
        icono={
          BellRing
        }
        etiqueta="Comunicados del curso"
        titulo={`Tablón · ${hitoSeleccionado.codigo}`}
        descripcion="Consulta avisos, recordatorios, materiales y novedades publicadas por tu docente."
        informacion={
          <>
            {curso?.materia.nombre ??
              cursoAula.materia.nombre}
            {' · '}
            {hito?.nombre ??
              hitoSeleccionado.nombre}
          </>
        }
        acciones={[
          {
            texto:
              'Actualizar tablón',

            icono:
              RefreshCw,

            variante:
              'secundaria' as const,

            deshabilitada:
              actualizando,

            onClick:
              () => {
                void cargarTablon(
                  false,
                );
              },
          },
        ]}
      />

      {error && (
        <div className="tablon-estudiante__error">
          <AlertCircle
            size={
              17
            }
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            aria-label="Cerrar error"
            onClick={
              limpiarError
            }
          >
            <X
              size={
                15
              }
            />
          </button>
        </div>
      )}

      <AulaToolbar
        opciones={
          opcionesToolbar
        }
        opcionActiva={
          filtroTablon
        }
        ariaLabel="Filtrar comunicados del tablón"
        onCambiar={
          setFiltroTablon
        }
      />

      <div
        className={`tablon-estudiante__contenido ${
          publicacionDetalleActual
            ? 'con-detalle'
            : ''
        }`}
      >
        <main className="tablon-estudiante__muro">
          {publicacionesFiltradas.length ===
          0 ? (
            <AulaEmptyState
              titulo={
                filtroTablon !==
                  'TODOS'
                  ? 'No hay comunicados en esta categoría'
                  : 'Todavía no hay comunicados'
              }
              descripcion={
                filtroTablon !==
                  'TODOS'
                  ? 'Selecciona otra categoría para revisar los comunicados disponibles.'
                  : `Tu docente todavía no publicó comunicados visibles para ${hitoSeleccionado.codigo}.`
              }
              icono={
                BellRing
              }
            />
          ) : (
            <div className="tablon-estudiante__lista">
              <div className="tablon-estudiante__resumen">
                <div>
                  <strong>
                    {publicacionesFiltradas.length}
                    {' '}
                    {publicacionesFiltradas.length ===
                    1
                      ? 'comunicado'
                      : 'comunicados'}
                  </strong>

                  <span>
                    Publicados por el docente
                  </span>
                </div>

                <small>
                  Los destacados aparecen primero
                </small>
              </div>

              <div className="publicaciones-estudiante">
                {publicacionesFiltradas.map(
                  (
                    publicacion,
                  ) => (
                    <PublicacionCard
                      key={
                        publicacion.id
                      }
                      publicacion={
                        publicacion
                      }

                      /*
                       * Nunca mostramos menú de administración
                       * al estudiante.
                       */
                      puedeAdministrar={
                        false
                      }

                      procesando={
                        false
                      }

                      onAbrir={() =>
                        void abrirDetalle(
                          publicacion,
                        )
                      }

                      /*
                       * PublicacionCard requiere estas props por su
                       * interfaz compartida, pero con puedeAdministrar=false
                       * nunca se muestran ni se ejecutan.
                       */
                      onEditar={() => undefined}
                      onFijar={() => undefined}
                      onCambiarComentarios={() => undefined}
                      onCambiarVisibilidad={() => undefined}
                      onRetirar={() => undefined}
                    />
                  ),
                )}
              </div>
            </div>
          )}
        </main>

        {publicacionDetalleActual && (
          <div
            className={`tablon-estudiante__detalle tablon-estudiante__detalle--${
              configuracionDetalle?.tono ??
              'azul'
            }`}
          >
            <DetallePublicacionPanel
              publicacion={
                publicacionDetalleActual
              }

            comentarios={
              publicacionDetalleActual
                .comentariosHabilitados
                ? comentarios
                : null
            }

            cargandoComentarios={
              publicacionDetalleActual
                .comentariosHabilitados &&
              cargandoComentarios
            }

            comentarioTexto={
              comentarioTexto
            }

            setComentarioTexto={
              setComentarioTexto
            }

            comentarioEditando={
              comentarioEditando
            }

            setComentarioEditando={
              setComentarioEditando
            }

            textoEdicionComentario={
              textoEdicionComentario
            }

            setTextoEdicionComentario={
              setTextoEdicionComentario
            }

            usuarioActualId={
              usuarioActualId
            }

            /*
             * El estudiante puede administrar únicamente
             * sus propios comentarios según las reglas del
             * DetallePublicacionPanel. Nunca la publicación.
             */
            puedeAdministrar={
              false
            }

            comentarioProcesandoId={
              comentarioProcesandoId
            }

            onCerrar={() => {
              setPublicacionDetalle(
                null,
              );

              setComentarioTexto(
                '',
              );

              setComentarioEditando(
                null,
              );

              setTextoEdicionComentario(
                '',
              );

              cerrarComentarios();
            }}

            onEnviarComentario={() =>
              void enviarComentario()
            }

            onEditarComentario={
              editarComentarioPropio
            }

              onRetirarComentario={
                retirarComentarioPropio
              }
            />
          </div>
        )}
      </div>

      <Toast
        visible={
          toast.visible
        }
        tipo={
          toast.tipo
        }
        titulo={
          toast.titulo
        }
        mensaje={
          toast.mensaje
        }
        onCerrar={() =>
          setToast(
            (
              actual,
            ) => ({
              ...actual,

              visible:
                false,
            }),
          )
        }
      />

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .tablon-estudiante {
    position: relative;
    display: grid;
    gap: 17px;
    min-width: 0;
  }

  .tablon-estudiante.actualizando
  .tablon-estudiante__lista {
    opacity: .58;
    pointer-events: none;
  }

  .tablon-estudiante__error {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 12px 14px;
    border: 1px solid var(--app-danger-border);
    border-radius: 14px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
    font-size: 12px;
  }

  .tablon-estudiante__error span {
    flex: 1;
  }

  .tablon-estudiante__error button {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    padding: 0;
    border: none;
    border-radius: 8px;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }

  .tablon-estudiante__contenido {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    align-items: start;
    min-width: 0;
  }

  .tablon-estudiante__contenido.con-detalle {
    grid-template-columns:
      minmax(
        0,
        1.35fr
      )
      minmax(
        390px,
        .65fr
      );
  }

  .tablon-estudiante__muro {
    min-width: 0;
  }

  .tablon-estudiante__lista {
    display: grid;
    gap: 13px;
    min-width: 0;
  }

  .tablon-estudiante__resumen {
    min-height: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 4px;
  }

  .tablon-estudiante__resumen > div {
    display: grid;
    gap: 2px;
  }

  .tablon-estudiante__resumen strong {
    color: var(--app-text);
    font-size: 12px;
  }

  .tablon-estudiante__resumen span,
  .tablon-estudiante__resumen small {
    color: var(--app-text-muted);
    font-size: 9px;
  }

  .publicaciones-estudiante {
    display: grid;
    grid-template-columns:
      repeat(
        auto-fill,
        minmax(
          285px,
          340px
        )
      );
    gap: 14px;
    align-items: stretch;
    justify-content: start;
  }

  .tablon-estudiante__contenido.con-detalle
  .publicaciones-estudiante {
    grid-template-columns:
      repeat(
        auto-fill,
        minmax(
          270px,
          1fr
        )
      );
  }


  /*
   * El detalle hereda el mismo tono visual del tipo de publicación.
   * Si la tarjeta es azul, al abrirla los elementos de acento continúan
   * azules; lo mismo ocurre con verde, rojo, morado, etc.
   */
  .tablon-estudiante__detalle {
    --detalle-tipo-acento: #2563eb;
    --detalle-tipo-suave: #dbeafe;
    min-width: 0;
  }

  .tablon-estudiante__detalle--azul {
    --detalle-tipo-acento: #2563eb;
    --detalle-tipo-suave: #dbeafe;
  }

  .tablon-estudiante__detalle--verde {
    --detalle-tipo-acento: #15803d;
    --detalle-tipo-suave: #dcfce7;
  }

  .tablon-estudiante__detalle--rojo {
    --detalle-tipo-acento: #dc2626;
    --detalle-tipo-suave: #fee2e2;
  }

  .tablon-estudiante__detalle--morado {
    --detalle-tipo-acento: #7c3aed;
    --detalle-tipo-suave: #ede9fe;
  }

  .tablon-estudiante__detalle--naranja {
    --detalle-tipo-acento: #ea580c;
    --detalle-tipo-suave: #ffedd5;
  }

  .tablon-estudiante__detalle--celeste {
    --detalle-tipo-acento: #0284c7;
    --detalle-tipo-suave: #e0f2fe;
  }

  .tablon-estudiante__detalle--gris {
    --detalle-tipo-acento: #475569;
    --detalle-tipo-suave: #e2e8f0;
  }

  .tablon-estudiante__detalle--indigo {
    --detalle-tipo-acento: #4f46e5;
    --detalle-tipo-suave: #e0e7ff;
  }

  .tablon-estudiante__detalle--amarillo {
    --detalle-tipo-acento: #ca8a04;
    --detalle-tipo-suave: #fef9c3;
  }

  .tablon-estudiante__detalle--rosa {
    --detalle-tipo-acento: #db2777;
    --detalle-tipo-suave: #fce7f3;
  }

  .tablon-estudiante__detalle .detalle-panel {
    border-top: none;
  }

  .tablon-estudiante__detalle .detalle-panel__header {
    background:
      linear-gradient(
        135deg,
        var(--app-surface),
        color-mix(
          in srgb,
          var(--detalle-tipo-suave) 48%,
          var(--app-surface)
        )
      );
  }

  .tablon-estudiante__detalle .comentarios-icono {
    color:
      var(--detalle-tipo-acento);
    background:
      var(--detalle-tipo-suave);
  }

  .tablon-estudiante__detalle .detalle-recurso > span {
    color:
      var(--detalle-tipo-acento);
    background:
      var(--detalle-tipo-suave);
  }

  .tablon-estudiante__detalle .detalle-panel__compositor button {
    background:
      linear-gradient(
        135deg,
        var(--detalle-tipo-acento),
        color-mix(
          in srgb,
          var(--detalle-tipo-acento) 82%,
          #000
        )
      );
  }

  .tablon-estudiante__detalle .detalle-badge.fijada {
    color:
      var(--detalle-tipo-acento);
    background:
      var(--detalle-tipo-suave);
  }

  @media (
    max-width: 1120px
  ) {
    .tablon-estudiante__contenido.con-detalle {
      grid-template-columns:
        1fr;
    }

    .tablon-estudiante__contenido.con-detalle
    .publicaciones-estudiante {
      grid-template-columns:
        repeat(
          auto-fill,
          minmax(
            270px,
            340px
          )
        );
    }
  }

  @media (
    max-width: 760px
  ) {
    .publicaciones-estudiante,
    .tablon-estudiante__contenido.con-detalle
    .publicaciones-estudiante {
      grid-template-columns:
        1fr;
    }

    .tablon-estudiante__resumen {
      align-items:
        flex-start;
      flex-direction:
        column;
      gap:
        3px;
    }
  }

  @media (
    max-width: 520px
  ) {
  }

  @media (
    prefers-reduced-motion:
      reduce
  ) {
    .tablon-estudiante *,
    .tablon-estudiante *::before,
    .tablon-estudiante *::after {
      transition:
        none !important;
      animation:
        none !important;
    }
  }
`;