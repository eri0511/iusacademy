import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock3,
  CalendarClock,
  Megaphone,
  Pin,
  Archive,
  Plus,
  RefreshCw,
  Trash2,
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
import AulaToolbar, {
  type OpcionAulaToolbar,
} from '../../../components/aula/AulaToolbar';
import AulaLoadingOverlay from '../../../components/aula/AulaLoadingOverlay';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import DetallePublicacionPanel from '../../../components/curso/DetallePublicacionPanel';
import FormularioPublicacionInteligente from '../../../components/curso/FormularioPublicacionInteligente';
import PublicacionCard from '../../../components/curso/PublicacionCard';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import useTablonCurso from '../../../hooks/tablon/useTablonCurso';

import type {
  ActualizarPublicacionDatos,
  ComentarioPublicacion,
  CrearPublicacionDatos,
  PublicacionCurso,
} from '../../../types/aula/comunicacion-curso.types';

type TipoMensaje =
  | 'exito'
  | 'error';

type FiltroTablon =
  | 'TODOS'
  | 'FIJADA'
  | 'URGENTE'
  | 'PROXIMA'
  | 'GENERAL'
  | 'FINALIZADA';

export default function TablonCurso() {
  const {
    aula,
    curso:
      cursoAula,
    permisos:
      permisosAula,
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
    permisos,
    publicaciones,
    publicacionesOrganizadas,
    cargando,
    actualizando,
    tieneContenido,
    error,
    publicacionProcesandoId,
    comentarioProcesandoId,
    comentarios,
    cargandoComentarios,
    cargarTablon,
    publicar,
    editarPublicacion,
    cambiarFijado,
    cambiarComentarios,
    cambiarVisibilidad,
    retirarPublicacion,
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
    editorAbierto,
    setEditorAbierto,
  ] =
    useState(
      false,
    );

  const [
    publicacionEditando,
    setPublicacionEditando,
  ] =
    useState<PublicacionCurso | null>(
      null,
    );

  const [
    publicacionDetalle,
    setPublicacionDetalle,
  ] =
    useState<PublicacionCurso | null>(
      null,
    );

  const [
    publicacionEliminar,
    setPublicacionEliminar,
  ] =
    useState<PublicacionCurso | null>(
      null,
    );

  const [
    guardando,
    setGuardando,
  ] =
    useState(
      false,
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
    mensaje,
    setMensaje,
  ] =
    useState<{
      tipo:
        TipoMensaje;

      texto:
        string;
    } | null>(
      null,
    );

  const publicacionDetalleActual =
    useMemo(
      () => {
        if (!publicacionDetalle) {
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

  const conteosFiltros =
    useMemo(
      () => ({
        TODOS:
          publicacionesOrganizadas.length,

        FIJADA:
          publicacionesOrganizadas.filter(
            (
              publicacion,
            ) =>
              publicacion.grupoTemporal ===
              'FIJADA',
          ).length,

        URGENTE:
          publicacionesOrganizadas.filter(
            (
              publicacion,
            ) =>
              publicacion.grupoTemporal ===
              'URGENTE',
          ).length,

        PROXIMA:
          publicacionesOrganizadas.filter(
            (
              publicacion,
            ) =>
              publicacion.grupoTemporal ===
              'PROXIMA',
          ).length,

        GENERAL:
          publicacionesOrganizadas.filter(
            (
              publicacion,
            ) =>
              publicacion.grupoTemporal ===
              'GENERAL',
          ).length,

        FINALIZADA:
          publicacionesOrganizadas.filter(
            (
              publicacion,
            ) =>
              publicacion.grupoTemporal ===
              'FINALIZADA',
          ).length,
      }),
      [
        publicacionesOrganizadas,
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
        publicacionesOrganizadas
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
        publicacionesOrganizadas,
      ],
    );

  const mostrarMensaje =
    (
      tipo:
        TipoMensaje,
      texto:
        string,
    ) => {
      setMensaje({
        tipo,
        texto,
      });

      window.setTimeout(
        () =>
          setMensaje(
            null,
          ),
        3200,
      );
    };

  const abrirCrear =
    () => {
      setPublicacionEditando(
        null,
      );

      setEditorAbierto(
        true,
      );
    };

  const abrirEditar =
    (
      publicacion:
        PublicacionCurso,
    ) => {
      setPublicacionEditando(
        publicacion,
      );

      setEditorAbierto(
        true,
      );
    };

  const abrirDetalle =
    async (
      publicacion:
        PublicacionCurso,
    ) => {
      setPublicacionDetalle(
        publicacion,
      );

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
        // El hook conserva el mensaje de error.
      }
    };

  const guardarPublicacion =
    async (
      datos:
        CrearPublicacionDatos,
    ) => {
      try {
        setGuardando(
          true,
        );

        if (
          publicacionEditando
        ) {
          const {
            estaFijada,
            visibleParaEstudiantes,
            ...datosEditables
          } =
            datos;

          await editarPublicacion(
            publicacionEditando.id,
            datosEditables as ActualizarPublicacionDatos,
          );

          if (
            estaFijada !==
            publicacionEditando.estaFijada
          ) {
            await cambiarFijado(
              publicacionEditando,
            );
          }

          if (
            visibleParaEstudiantes !==
            publicacionEditando.visibleParaEstudiantes
          ) {
            await cambiarVisibilidad(
              publicacionEditando,
            );
          }

          mostrarMensaje(
            'exito',
            'Publicación actualizada correctamente.',
          );
        } else {
          await publicar(
            datos,
          );

          mostrarMensaje(
            'exito',
            'Publicación creada correctamente.',
          );
        }

        setEditorAbierto(
          false,
        );

        setPublicacionEditando(
          null,
        );
      } catch (
        problema
      ) {
        mostrarMensaje(
          'error',
          problema instanceof Error
            ? problema.message
            : 'No fue posible guardar la publicación.',
        );
      } finally {
        setGuardando(
          false,
        );
      }
    };

  const enviarComentario =
    async () => {
      if (
        !publicacionDetalleActual ||
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

        mostrarMensaje(
          'exito',
          'Comentario publicado.',
        );
      } catch (
        problema
      ) {
        mostrarMensaje(
          'error',
          problema instanceof Error
            ? problema.message
            : 'No fue posible publicar el comentario.',
        );
      }
    };

  if (
    !hitoSeleccionado
  ) {
    return (
      <AulaEmptyState
        titulo="Selecciona un hito"
        descripcion="Elige H1, H2, H3, H4 o H5 para abrir su tablón."
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
      <section className="tablon-inteligente">
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
      className={`tablon-inteligente ${
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
        icono={BellRing}
        etiqueta="Centro de avisos académicos"
        titulo={`Tablón · ${hitoSeleccionado.codigo}`}
        descripcion={
          permisosAula.puedeAdministrar
            ? 'Publica avisos, lecturas, evaluaciones y eventos importantes.'
            : 'Consulta las novedades académicas ordenadas por urgencia y fecha.'
        }
        informacion={
          <>
            {curso?.materia.nombre ?? cursoAula.materia.nombre}
            {' · '}
            {hito?.nombre ?? hitoSeleccionado.nombre}
          </>
        }
        acciones={[
          ...(permisos.puedeCrear
            ? [{
                texto: 'Nueva publicación',
                icono: Plus,
                variante: 'primaria' as const,
                onClick: abrirCrear,
              }]
            : []),
          {
            texto: 'Actualizar tablón',
            icono: RefreshCw,
            variante: 'secundaria' as const,
            deshabilitada: actualizando,
            onClick: () => { void cargarTablon(false); },
          },
        ]}
      />

      {error && (
        <div className="tablon-error">
          <AlertCircle
            size={17}
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
              size={15}
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
        ariaLabel="Filtrar publicaciones del tablón"
        onCambiar={
          setFiltroTablon
        }
      />

      <div
        className={`tablon-contenido ${
          publicacionDetalleActual
            ? 'con-detalle'
            : ''
        }`}
      >
        <main className="tablon-contenido__muro">
          {publicacionesFiltradas.length ===
          0 ? (
            <AulaEmptyState
              titulo={
                filtroTablon !==
                  'TODOS'
                  ? 'No hay publicaciones en esta categoría'
                  : 'Todavía no existen publicaciones'
              }
              descripcion={
                filtroTablon !==
                  'TODOS'
                  ? 'Selecciona otra categoría para revisar las publicaciones disponibles.'
                  : permisos.puedeCrear
                    ? `Crea el primer aviso académico para ${hitoSeleccionado.codigo}.`
                    : `El docente todavía no publicó avisos para ${hitoSeleccionado.codigo}.`
              }
              icono={
                BellRing
              }
              accionTexto={
                filtroTablon ===
                  'TODOS' &&
                permisos.puedeCrear
                  ? 'Crear publicación'
                  : undefined
              }
              onAccion={
                filtroTablon ===
                  'TODOS' &&
                permisos.puedeCrear
                  ? abrirCrear
                  : undefined
              }
            />
          ) : (
            <div className="tablon-muro-unico">
              <div className="tablon-muro-unico__resumen">
                <span>
                  {publicacionesFiltradas.length}
                  {' '}
                  {publicacionesFiltradas.length ===
                  1
                    ? 'publicación'
                    : 'publicaciones'}
                </span>

                <small>
                  Ordenadas desde la actividad más reciente
                </small>
              </div>

              <div className="publicaciones-grid">
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
                      puedeAdministrar={
                        permisos.puedeEditar
                      }
                      procesando={
                        publicacionProcesandoId ===
                        publicacion.id
                      }
                      onAbrir={() =>
                        void abrirDetalle(
                          publicacion,
                        )
                      }
                      onEditar={() =>
                        abrirEditar(
                          publicacion,
                        )
                      }
                      onFijar={() =>
                        void cambiarFijado(
                          publicacion,
                        )
                      }
                      onCambiarComentarios={() =>
                        void cambiarComentarios(
                          publicacion,
                        )
                      }
                      onCambiarVisibilidad={() =>
                        void cambiarVisibilidad(
                          publicacion,
                        )
                      }
                      onRetirar={() =>
                        setPublicacionEliminar(
                          publicacion,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </div>
          )}
        </main>

        {publicacionDetalleActual && (
          <DetallePublicacionPanel
            publicacion={
              publicacionDetalleActual
            }
            comentarios={
              comentarios
            }
            cargandoComentarios={
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
            puedeAdministrar={
              permisosAula.puedeAdministrar
            }
            comentarioProcesandoId={
              comentarioProcesandoId
            }
            onCerrar={() => {
              setPublicacionDetalle(
                null,
              );

              cerrarComentarios();
            }}
            onEnviarComentario={() =>
              void enviarComentario()
            }
            onEditarComentario={async (
              comentarioId,
              contenido,
            ) => {
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
            }}
            onRetirarComentario={async (
              comentarioId,
            ) => {
              await retirarComentario(
                publicacionDetalleActual.id,
                comentarioId,
              );
            }}
          />
        )}
      </div>

      {editorAbierto && (
        <FormularioPublicacionInteligente
          key={
            publicacionEditando?.id ??
            'nueva'
          }
          abierto
          hitoCodigo={
            hitoSeleccionado.codigo
          }
          hitoNombre={
            hitoSeleccionado.nombre
          }
          publicacionEditando={
            publicacionEditando
          }
          guardando={
            guardando
          }
          onCerrar={() => {
            setEditorAbierto(
              false,
            );

            setPublicacionEditando(
              null,
            );
          }}
          onGuardar={
            guardarPublicacion
          }
        />
      )}

      {publicacionEliminar && (
        <div className="confirmacion-backdrop">
          <section className="confirmacion-card">
            <span className="confirmacion-card__icono">
              <Trash2
                size={26}
              />
            </span>

            <h3>
              Retirar publicación
            </h3>

            <p>
              “{publicacionEliminar.titulo}” dejará de mostrarse en el Tablón.
            </p>

            <div>
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  setPublicacionEliminar(
                    null,
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="button danger"
                onClick={() =>
                  void retirarPublicacion(
                    publicacionEliminar.id,
                  ).then(
                    () => {
                      setPublicacionEliminar(
                        null,
                      );

                      mostrarMensaje(
                        'exito',
                        'Publicación retirada correctamente.',
                      );
                    },
                  )
                }
              >
                Retirar
              </button>
            </div>
          </section>
        </div>
      )}

      {mensaje && (
        <div
          className={`tablon-toast ${mensaje.tipo}`}
        >
          {mensaje.tipo ===
          'exito' ? (
            <CheckCircle2
              size={17}
            />
          ) : (
            <AlertCircle
              size={17}
            />
          )}

          {mensaje.texto}
        </div>
      )}

      <style>
        {styles}
      </style>
    </section>
  );
}

const styles = `
  .tablon-inteligente {
    position: relative;
    display: grid;
    gap: 17px;
    min-width: 0;
  }

  .tablon-inteligente.actualizando
  .tablon-muro-unico {
    opacity: .58;
    pointer-events: none;
  }

  .tablon-error {
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

  .tablon-error span { flex: 1; }

  .tablon-error button {
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

  .tablon-contenido {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    align-items: start;
    min-width: 0;
  }

  .tablon-contenido.con-detalle {
    grid-template-columns: minmax(0, 1.35fr) minmax(420px, .65fr);
  }

  .tablon-contenido__muro { min-width: 0; }

  .tablon-muro-unico {
    display: grid;
    gap: 13px;
    min-width: 0;
  }

  .tablon-muro-unico__resumen {
    min-height: 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 4px;
  }

  .tablon-muro-unico__resumen span {
    color: var(--app-text-secondary);
    font-size: 12px;
    font-weight: 800;
  }

  .tablon-muro-unico__resumen small {
    color: var(--app-text-muted);
    font-size: 10px;
  }

  .publicaciones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(285px, 340px));
    gap: 14px;
    align-items: stretch;
    justify-content: start;
  }

  .tablon-contenido.con-detalle .publicaciones-grid {
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  }

  .confirmacion-backdrop {
    position: fixed;
    inset: 0;
    z-index: 70000;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(15, 23, 42, .5);
    backdrop-filter: blur(6px);
  }

  .confirmacion-card {
    width: min(420px, 100%);
    padding: 27px;
    border: 1px solid var(--app-border);
    border-radius: 22px;
    color: var(--app-text);
    background: var(--app-surface);
    box-shadow: 0 30px 90px rgba(15, 23, 42, .28);
    text-align: center;
  }

  .confirmacion-card__icono {
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    margin: 0 auto;
    border-radius: 18px;
    color: var(--app-danger);
    background: var(--app-danger-bg);
  }

  .confirmacion-card h3 {
    margin: 14px 0 0;
    color: var(--app-text);
    font-size: 22px;
  }

  .confirmacion-card p {
    margin: 8px 0 0;
    color: var(--app-text-soft);
    font-size: 13px;
    line-height: 1.6;
  }

  .confirmacion-card > div {
    display: flex;
    justify-content: center;
    gap: 9px;
    margin-top: 18px;
  }

  .tablon-toast {
    position: fixed;
    top: 22px;
    right: 24px;
    z-index: 90000;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 14px;
    border-radius: 13px;
    font-size: 12px;
    font-weight: 800;
    box-shadow: 0 18px 50px rgba(15, 23, 42, .2);
  }

  .tablon-toast.exito { color: var(--app-success); background: var(--app-success-bg); }
  .tablon-toast.error { color: var(--app-danger); background: var(--app-danger-bg); }

  @media (max-width: 1280px) {
  }

  @media (max-width: 1120px) {
    .tablon-contenido.con-detalle { grid-template-columns: 1fr; }
    .tablon-contenido.con-detalle .publicaciones-grid { grid-template-columns: repeat(auto-fill, minmax(270px, 340px)); }
  }

  @media (max-width: 760px) {
    .publicaciones-grid,
    .tablon-contenido.con-detalle .publicaciones-grid { grid-template-columns: 1fr; }
    .tablon-muro-unico__resumen { align-items: flex-start; flex-direction: column; gap: 3px; }
  }

  @media (max-width: 520px) {
    .confirmacion-card > div { flex-direction: column-reverse; }
    .confirmacion-card .button { width: 100%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .tablon-inteligente *,
    .tablon-inteligente *::before,
    .tablon-inteligente *::after {
      transition: none !important;
      animation: none !important;
    }
  }
`;
