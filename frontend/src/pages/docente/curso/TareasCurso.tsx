import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileText,
  LockKeyhole,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  UsersRound,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../auth/AuthContext';

import AulaDropdown, {
  type OpcionAulaDropdown,
} from '../../../components/aula/AulaDropdown';
import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaLoadingOverlay from '../../../components/aula/AulaLoadingOverlay';
import AulaModal from '../../../components/aula/AulaModal';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import AulaToolbar, {
  type OpcionAulaToolbar,
} from '../../../components/aula/AulaToolbar';
import FormularioTareaInteligente from '../../../components/tareas/FormularioTareaInteligente';
import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import {
  useAulaContext,
} from '../../../contexts/AulaContext';

import useTareasCurso from '../../../hooks/tareas/useTareasCurso';

import type {
  CrearTareaDatos,
  EstadoTarea,
  TareaCurso,
  TipoTarea,
} from '../../../types/tareas/tareas.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

type Filtro =
  | 'TODAS'
  | 'BORRADORES'
  | 'PROGRAMADAS'
  | 'DISPONIBLES'
  | 'CERRADAS';

const etiquetasEstado: Record<EstadoTarea, string> = {
  BORRADOR: 'Borrador',
  PROGRAMADA: 'Programada',
  DISPONIBLE: 'Disponible',
  CERRADA: 'Cerrada',
  ANULADA: 'Anulada',
};

const nombresTipo: Record<TipoTarea, string> = {
  ENTREGA_ARCHIVOS: 'Entrega de archivos',
  RESPUESTA_ESCRITA: 'Respuesta escrita',
  DOCUMENTO_COLABORATIVO: 'Documento colaborativo',
  REDACCION_JURIDICA: 'Redacción jurídica',
  EXPOSICION: 'Exposición',
  CASO_PRACTICO: 'Caso práctico',
  MIXTA: 'Actividad mixta',
  PRESENCIAL: 'Presencial',
};

function fechaCompacta(
  valor:
    string | null,
) {
  if (!valor) {
    return 'Sin fecha';
  }

  const fecha =
    new Date(
      valor,
    );

  if (
    Number.isNaN(
      fecha.getTime(),
    )
  ) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',
      month:
        'short',
      hour:
        '2-digit',
      minute:
        '2-digit',
      hour12:
        false,
    },
  ).format(
    fecha,
  );
}

function obtenerFechaReferenciaTarea(
  tarea:
    TareaCurso,
): {
  etiqueta:
    string;
  fecha:
    string;
} {
  if (
    tarea.estado ===
      'BORRADOR'
  ) {
    return {
      etiqueta:
        'Prevista',
      fecha:
        fechaCompacta(
          tarea.fechaApertura,
        ),
    };
  }

  if (
    tarea.estado ===
      'PROGRAMADA'
  ) {
    return {
      etiqueta:
        'Abre',
      fecha:
        fechaCompacta(
          tarea.fechaApertura,
        ),
    };
  }

  if (
    tarea.estado ===
      'CERRADA' ||
    tarea.estado ===
      'ANULADA'
  ) {
    return {
      etiqueta:
        tarea.estado ===
          'ANULADA'
          ? 'Anulada'
          : 'Cerró',
      fecha:
        fechaCompacta(
          tarea.fechaCierre,
        ),
    };
  }

  return {
    etiqueta:
      'Vence',
    fecha:
      fechaCompacta(
        tarea.fechaLimite,
      ),
  };
}

function etiquetaComponenteTarea(
  componente?:
    string | null,
) {
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

function TareaCard({
  tarea,
  procesando,
  onAbrir,
  onEditar,
  onPublicar,
  onCerrar,
  onReabrir,
  onAnular,
}: {
  tarea: TareaCurso;
  procesando: boolean;
  onAbrir: () => void;
  onEditar: () => void;
  onPublicar: () => void;
  onCerrar: () => void;
  onReabrir: () => void;
  onAnular: () => void;
}) {
  const opciones: OpcionAulaDropdown[] = [
    {
      texto: 'Editar tarea',
      onClick: onEditar,
    },
    ...(tarea.estado ===
    'BORRADOR'
      ? [
          {
            texto: 'Publicar tarea',
            onClick: onPublicar,
          },
        ]
      : []),
    ...(tarea.estado ===
      'PROGRAMADA' ||
    tarea.estado ===
      'DISPONIBLE'
      ? [
          {
            texto: 'Cerrar tarea',
            separadorAntes: true,
            onClick: onCerrar,
          },
        ]
      : []),
    ...(tarea.estado ===
    'CERRADA'
      ? [
          {
            texto: 'Reabrir tarea',
            separadorAntes: true,
            onClick: onReabrir,
          },
        ]
      : []),
    ...(tarea.estado !==
    'ANULADA'
      ? [
          {
            texto: 'Anular tarea',
            peligro: true,
            separadorAntes: true,
            onClick: onAnular,
          },
        ]
      : []),
  ];

  const fechaReferencia =
    obtenerFechaReferenciaTarea(
      tarea,
    );

  const componente =
    etiquetaComponenteTarea(
      tarea.componente,
    );

  const modalidad =
    tarea.modalidad ===
      'GRUPAL'
      ? 'Grupal'
      : 'Individual';

  return (
    <article
      className={`tarea-card tarea-card--${tarea.tipo.toLowerCase()}`}
    >
      <div className="tarea-card__menu">
        <AulaDropdown
          opciones={opciones}
          titulo="Opciones de la tarea"
          ariaLabel={`Abrir opciones de ${tarea.titulo}`}
          deshabilitado={procesando}
          triggerClassName="tarea-card__menu-trigger"
        />
      </div>

      <button
        type="button"
        className="tarea-card__cuerpo"
        onClick={onAbrir}
      >
        <div className="tarea-card__encabezado">
          <div className="tarea-card__etiquetas">
            <span
              className={`tarea-estado tarea-estado--${tarea.estado.toLowerCase()}`}
            >
              {etiquetasEstado[tarea.estado]}
            </span>

            {tarea.esCalificable && (
              <span className="tarea-chip tarea-chip--nota">
                <CheckCircle2
                  size={12}
                />
                Calificable
              </span>
            )}

            {componente && (
              <span className="tarea-chip tarea-chip--componente">
                {componente}
              </span>
            )}

            <span className="tarea-chip tarea-chip--modalidad">
              <UsersRound
                size={12}
              />
              {modalidad}
            </span>

            <span className="tarea-chip tarea-chip--tipo">
              <FileText
                size={12}
              />
              {nombresTipo[tarea.tipo]}
            </span>

            {tarea.capacidades.includes(
              'EDICION_COLABORATIVA',
            ) && (
              <span className="tarea-chip tarea-chip--colaborativa">
                <Edit3
                  size={12}
                />
                Colaborativa
              </span>
            )}
          </div>
        </div>

        <h3>
          {tarea.titulo}
        </h3>

        <p>
          {tarea.descripcion ||
            'Sin descripción adicional.'}
        </p>

        <div className="tarea-card__meta">
          <span>
            {nombresTipo[
              tarea.tipo
            ]}
          </span>

          <span>
            {Number(
              tarea.puntajeMaximo,
            )} pts
          </span>

          {tarea.origenGrupo ===
            'PLATAFORMA' &&
            tarea.conjuntoGrupo && (
              <span>
                {
                  tarea.conjuntoGrupo.nombre
                }
              </span>
            )}
        </div>

        <div className="tarea-card__pie">
          <div className="tarea-card__fechas-secundarias">
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

          <span className="tarea-card__vencimiento">
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

export default function TareasCurso() {
  const navigate =
    useNavigate();

  const {
    accessToken,
  } =
    useAuth();

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

  const [
    formularioAbierto,
    setFormularioAbierto,
  ] =
    useState(
      false,
    );

  const [
    tareaEditar,
    setTareaEditar,
  ] =
    useState<TareaCurso | null>(
      null,
    );

  const [
    confirmacion,
    setConfirmacion,
  ] =
    useState<{
      titulo: string;
      descripcion: string;
      detalle: string;
      textoBoton: string;
      accion: () => Promise<void>;
      peligro?: boolean;
    } | null>(
      null,
    );

  const [
    toast,
    setToast,
  ] =
    useState<{
      visible: boolean;
      tipo: TipoToast;
      titulo: string;
      mensaje?: string;
    }>({
      visible: false,
      tipo: 'informacion',
      titulo: '',
    });

  const {
    tareas,
    cargando,
    actualizando,
    procesando,
    error,
    cargar,
    crear,
    obtener,
    actualizar,
    publicar,
    cerrar,
    reabrir,
    anular,
    limpiarError,
  } =
    useTareasCurso({
      cursoId:
        curso.id,
      hitoId:
        hitoSeleccionado?.id ??
        null,
    });

  const tareasVisibles =
    useMemo(
      () =>
        tareas.filter(
          (
            tarea,
          ) => {
            if (
              filtro ===
              'TODAS'
            ) {
              return tarea.estado !==
                'ANULADA';
            }

            if (
              filtro ===
              'BORRADORES'
            ) {
              return tarea.estado ===
                'BORRADOR';
            }

            if (
              filtro ===
              'PROGRAMADAS'
            ) {
              return tarea.estado ===
                'PROGRAMADA';
            }

            if (
              filtro ===
              'DISPONIBLES'
            ) {
              return tarea.estado ===
                'DISPONIBLE';
            }

            return tarea.estado ===
              'CERRADA';
          },
        ),
      [
        filtro,
        tareas,
      ],
    );

  const contadores =
    useMemo(
      () => ({
        todas:
          tareas.filter(
            (
              tarea,
            ) =>
              tarea.estado !==
              'ANULADA',
          ).length,
        borradores:
          tareas.filter(
            (
              tarea,
            ) =>
              tarea.estado ===
              'BORRADOR',
          ).length,
        programadas:
          tareas.filter(
            (
              tarea,
            ) =>
              tarea.estado ===
              'PROGRAMADA',
          ).length,
        disponibles:
          tareas.filter(
            (
              tarea,
            ) =>
              tarea.estado ===
              'DISPONIBLE',
          ).length,
        cerradas:
          tareas.filter(
            (
              tarea,
            ) =>
              tarea.estado ===
              'CERRADA',
          ).length,
      }),
      [
        tareas,
      ],
    );

  const opcionesToolbar: OpcionAulaToolbar<Filtro>[] = [
    {
      id: 'TODAS',
      texto: 'Todas',
      contador:
        contadores.todas,
    },
    {
      id: 'BORRADORES',
      texto: 'Borradores',
      contador:
        contadores.borradores,
    },
    {
      id: 'PROGRAMADAS',
      texto: 'Programadas',
      contador:
        contadores.programadas,
    },
    {
      id: 'DISPONIBLES',
      texto: 'Disponibles',
      contador:
        contadores.disponibles,
    },
    {
      id: 'CERRADAS',
      texto: 'Cerradas',
      contador:
        contadores.cerradas,
    },
  ];

  const mostrarToast = (
    tipo:
      TipoToast,
    titulo:
      string,
    mensaje?:
      string,
  ) => {
    setToast({
      visible: true,
      tipo,
      titulo,
      mensaje,
    });
  };

  const abrirNueva = () => {
    setTareaEditar(
      null,
    );
    setFormularioAbierto(
      true,
    );
  };

  const abrirEditar =
    async (
      tarea:
        TareaCurso,
    ) => {
      try {
        const detalle =
          await obtener(
            tarea.id,
          );

        setTareaEditar(
          detalle,
        );
        setFormularioAbierto(
          true,
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo abrir la tarea',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const guardarFormulario =
    async (
      datos:
        CrearTareaDatos,
      publicarAhora:
        boolean,
    ) => {
      try {
        if (
          tareaEditar
        ) {
          const {
            hitoId: _,
            publicar: __,
            ...actualizacion
          } =
            datos;

          await actualizar(
            tareaEditar.id,
            actualizacion,
          );

          if (
            publicarAhora &&
            tareaEditar.estado ===
              'BORRADOR'
          ) {
            await publicar(
              tareaEditar.id,
            );
          }

          mostrarToast(
            'exito',
            'Tarea actualizada',
            'Los cambios se guardaron correctamente.',
          );
        } else {
          await crear({
            ...datos,
            publicar:
              publicarAhora,
          });

          mostrarToast(
            'exito',
            publicarAhora
              ? 'Tarea publicada'
              : 'Borrador guardado',
            publicarAhora
              ? 'La actividad ya forma parte del hito seleccionado.'
              : 'Podrás continuar configurándola antes de publicarla.',
          );
        }

        setFormularioAbierto(
          false,
        );
        setTareaEditar(
          null,
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo guardar la tarea',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
        throw causa;
      }
    };

  const verificarPuedeAnular =
    async (
      tarea:
        TareaCurso,
    ) => {
      if (
        !accessToken
      ) {
        throw new Error(
          'Tu sesión terminó. Inicia sesión nuevamente.',
        );
      }

      const respuesta =
        await fetch(
          `${API_URL}/tareas/docente/cursos/${curso.id}/${tarea.id}/evaluacion`,
          {
            cache:
              'no-store',

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              'Cache-Control':
                'no-cache',

              Pragma:
                'no-cache',
            },
          },
        );

      const cuerpo =
        await respuesta
          .json()
          .catch(
            () =>
              null,
          );

      if (
        !respuesta.ok
      ) {
        const mensaje =
          cuerpo &&
          typeof cuerpo ===
            'object'
            ? (
                cuerpo as {
                  message?:
                    string | string[];

                  mensaje?:
                    string;
                }
              )
            : null;

        const detalle =
          Array.isArray(
            mensaje?.message,
          )
            ? mensaje?.message.join(
                '. ',
              )
            : mensaje?.message ||
              mensaje?.mensaje;

        throw new Error(
          detalle ||
          'No fue posible comprobar si la tarea puede anularse.',
        );
      }

      const resumen =
        cuerpo &&
        typeof cuerpo ===
          'object'
          ? (
              cuerpo as {
                resumen?: {
                  totalEntregas?:
                    number;
                };
              }
            ).resumen
          : null;

      const totalEntregas =
        Number(
          resumen?.totalEntregas ??
          0,
        );

      return {
        puedeAnular:
          totalEntregas ===
          0,

        totalEntregas,
      };
    };

  const solicitarAnulacion =
    async (
      tarea:
        TareaCurso,
    ) => {
      try {
        const validacion =
          await verificarPuedeAnular(
            tarea,
          );

        if (
          !validacion.puedeAnular
        ) {
          mostrarToast(
            'advertencia',
            'No se puede anular la tarea',
            validacion.totalEntregas ===
            1
              ? 'Ya existe una entrega registrada. Para conservar el trabajo del estudiante, la tarea no puede anularse.'
              : `Ya existen ${validacion.totalEntregas} entregas registradas. Para conservar el trabajo de los estudiantes, la tarea no puede anularse.`,
          );

          return;
        }

        confirmarAccion(
          'Anular tarea',
          `¿Quieres anular “${tarea.titulo}”?`,
          'Esta acción solo está disponible mientras ningún estudiante haya realizado una entrega. La tarea dejará de formar parte de las actividades activas del hito.',
          'Anular tarea',
          async () => {
            /*
             * Volvemos a comprobar justo antes de anular para evitar
             * que aparezca una entrega entre la apertura del modal
             * y la confirmación del docente.
             */
            const segundaValidacion =
              await verificarPuedeAnular(
                tarea,
              );

            if (
              !segundaValidacion.puedeAnular
            ) {
              throw new Error(
                'La tarea ya tiene una entrega registrada y no puede anularse.',
              );
            }

            await anular(
              tarea.id,
            );
          },
          true,
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo comprobar la tarea',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const confirmarAccion = (
    titulo:
      string,
    descripcion:
      string,
    detalle:
      string,
    textoBoton:
      string,
    accion:
      () => Promise<void>,
    peligro =
      false,
  ) => {
    setConfirmacion({
      titulo,
      descripcion,
      detalle,
      textoBoton,
      accion,
      peligro,
    });
  };

  const ejecutarConfirmacion =
    async () => {
      if (!confirmacion) {
        return;
      }

      try {
        await confirmacion.accion();
        setConfirmacion(
          null,
        );
        mostrarToast(
          'exito',
          'Tarea actualizada',
          'La operación se realizó correctamente.',
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo completar la acción',
          causa instanceof Error
            ? causa.message
            : 'Inténtalo nuevamente.',
        );
      }
    };

  if (
    !hitoSeleccionado
  ) {
    return (
      <AulaEmptyState
        titulo="Selecciona un hito"
        descripcion="Las tareas se organizan según el hito académico seleccionado en el aula."
        icono={ClipboardList}
      />
    );
  }

  return (
    <section className="tareas-curso">
      <AulaHeader
        icono={ClipboardList}
        etiqueta={`Tareas · ${hitoSeleccionado.codigo}`}
        titulo="Actividades del hito"
        descripcion="Diseña actividades tradicionales, colaborativas y jurídicas sin salir del aula virtual."
        informacion={`${hitoSeleccionado.nombre} · ${contadores.todas} actividad${contadores.todas === 1 ? '' : 'es'}`}
        acciones={[
          {
            texto: 'Crear tarea',
            icono: Plus,
            variante: 'primaria',
            deshabilitada: procesando,
            onClick: abrirNueva,
          },
          {
            texto: 'Actualizar',
            icono: RefreshCw,
            variante: 'secundaria',
            deshabilitada: actualizando || procesando,
            onClick: () =>
              void cargar(
                false,
              ),
          },
        ]}
      />

      <AulaToolbar
        opciones={opcionesToolbar}
        opcionActiva={filtro}
        ariaLabel="Estados de las tareas"
        onCambiar={setFiltro}
      />

      {error && (
        <div className="tareas-curso__error">
          <span>
            {error}
          </span>
          <button
            type="button"
            onClick={() => {
              limpiarError();
              void cargar(
                true,
              );
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="tareas-curso__contenido">
        <AulaLoadingOverlay
          visible={
            actualizando ||
            procesando
          }
          texto="Actualizando tareas…"
        />

        {cargando ? (
          <AulaSkeleton
            cantidad={4}
            variante="tarjetas"
          />
        ) : tareasVisibles.length ===
          0 ? (
          <AulaEmptyState
            titulo={
              filtro ===
              'TODAS'
                ? 'Todavía no hay tareas en este hito'
                : 'No hay tareas en esta categoría'
            }
            descripcion={
              filtro ===
              'TODAS'
                ? 'Crea una actividad y elige entre entregas de archivos, redacción jurídica, colaboración, exposición, casos prácticos y más.'
                : 'Cambia el filtro o crea una nueva actividad para este hito.'
            }
            icono={ClipboardList}
            accionTexto={
              filtro ===
              'TODAS'
                ? 'Crear primera tarea'
                : undefined
            }
            onAccion={
              filtro ===
              'TODAS'
                ? abrirNueva
                : undefined
            }
          />
        ) : (
          <div className="tareas-curso__grid">
            {tareasVisibles.map(
              (
                tarea,
              ) => (
                <TareaCard
                  key={tarea.id}
                  tarea={tarea}
                  procesando={procesando}
                  onAbrir={() =>
                    navigate(
                      String(
                        tarea.id,
                      ),
                    )
                  }
                  onEditar={() =>
                    void abrirEditar(
                      tarea,
                    )
                  }
                  onPublicar={() =>
                    confirmarAccion(
                      'Publicar tarea',
                      `¿Quieres publicar “${tarea.titulo}”?`,
                      'La tarea quedará visible según las fechas configuradas. Si la apertura todavía no llegó, permanecerá programada.',
                      'Publicar tarea',
                      () =>
                        publicar(
                          tarea.id,
                        ).then(
                          () =>
                            undefined,
                        ),
                    )
                  }
                  onCerrar={() =>
                    confirmarAccion(
                      'Cerrar tarea',
                      `¿Quieres cerrar manualmente “${tarea.titulo}” ahora?`,
                      'Aunque todavía quede tiempo, la tarea dejará de aceptar nuevas entregas y modificaciones. Las entregas ya realizadas se conservarán para revisión y calificación.',
                      'Cerrar tarea',
                      () =>
                        cerrar(
                          tarea.id,
                        ).then(
                          () =>
                            undefined,
                        ),
                    )
                  }
                  onReabrir={() =>
                    confirmarAccion(
                      'Reabrir tarea',
                      `¿Quieres reabrir “${tarea.titulo}”?`,
                      'La tarea volverá a habilitarse únicamente si sus fechas actuales lo permiten. Su estado se actualizará de acuerdo con la configuración vigente.',
                      'Reabrir tarea',
                      () =>
                        reabrir(
                          tarea.id,
                        ).then(
                          () =>
                            undefined,
                        ),
                    )
                  }
                  onAnular={() =>
                    void solicitarAnulacion(
                      tarea,
                    )
                  }
                />
              ),
            )}
          </div>
        )}
      </div>

      <FormularioTareaInteligente
        abierto={formularioAbierto}
        cursoId={curso.id}
        hitoId={hitoSeleccionado.id}
        hitoCodigo={hitoSeleccionado.codigo}
        tareaEditar={tareaEditar}
        guardando={procesando}
        onCerrar={() => {
          if (
            procesando
          ) {
            return;
          }
          setFormularioAbierto(
            false,
          );
          setTareaEditar(
            null,
          );
        }}
        onGuardar={guardarFormulario}
      />

      <AulaModal
        abierto={Boolean(
          confirmacion,
        )}
        titulo={
          confirmacion?.titulo ??
          'Confirmar acción'
        }
        etiqueta="Tareas"
        descripcion={
          confirmacion?.descripcion
        }
        icono={
          confirmacion?.peligro
            ? Trash2
            : LockKeyhole
        }
        ancho="compacto"
        bloqueado={procesando}
        onCerrar={() =>
          setConfirmacion(
            null,
          )
        }
        footer={
          <div className="tareas-confirmacion__footer">
            <button
              type="button"
              className="secundario"
              disabled={procesando}
              onClick={() =>
                setConfirmacion(
                  null,
                )
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              className={
                confirmacion?.peligro
                  ? 'peligro'
                  : 'primario'
              }
              disabled={procesando}
              onClick={() =>
                void ejecutarConfirmacion()
              }
            >
              {confirmacion?.peligro ? (
                <Trash2
                  size={14}
                />
              ) : confirmacion?.titulo.includes(
                  'Reabrir',
                ) ? (
                <RotateCcw
                  size={14}
                />
              ) : (
                <Send
                  size={14}
                />
              )}
              {
                confirmacion?.textoBoton ??
                'Confirmar'
              }
            </button>
          </div>
        }
      >
        <div className="tareas-confirmacion__cuerpo">
          <CalendarClock
            size={24}
          />

          <div>
            <strong>
              {confirmacion?.titulo ===
              'Cerrar tarea'
                ? 'Cierre manual anticipado'
                : 'Revisa la acción antes de continuar'}
            </strong>

            <p>
              {
                confirmacion?.detalle ??
                'Revisa la información antes de continuar con esta acción.'
              }
            </p>
          </div>
        </div>
      </AulaModal>

      <Toast
        visible={toast.visible}
        tipo={toast.tipo}
        titulo={toast.titulo}
        mensaje={toast.mensaje}
        onCerrar={() =>
          setToast(
            (
              actual,
            ) => ({
              ...actual,
              visible: false,
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
  .tareas-curso { position: relative; display: grid; gap: 14px; color: var(--app-text); }
  .tareas-curso__contenido { position: relative; min-height: 220px; }
  .tareas-curso__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .tareas-curso__error { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 13px; border: 1px solid var(--app-danger-border); border-radius: 12px; color: var(--app-danger); background: var(--app-danger-bg); font-size: 10px; }
  .tareas-curso__error button { padding: 7px 10px; border: 0; border-radius: 8px; color: #fff; background: var(--app-danger); font: inherit; font-size: 9px; font-weight: 800; cursor: pointer; }

  .tarea-card {
    position: relative;
    min-width: 0;
    overflow: hidden;

    border:
      1px solid
      var(--app-border);
    border-left:
      4px solid
      var(--app-accent);
    border-radius: 19px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);

    transition:
      transform .16s ease,
      border-color .16s ease,
      box-shadow .16s ease;
  }


  /*
   * ============================================================
   * IDENTIDAD VISUAL POR TIPO DE TAREA
   * ============================================================
   *
   * Solo coloreamos:
   * - la línea vertical izquierda;
   * - el chip que identifica el tipo.
   *
   * El resto del card mantiene la identidad visual de IusAcademy.
   */
  .tarea-card--entrega_archivos {
    --tarea-tipo-color:
      #f97316;
    --tarea-tipo-fondo:
      #fff7ed;
  }

  .tarea-card--respuesta_escrita {
    --tarea-tipo-color:
      #2563eb;
    --tarea-tipo-fondo:
      #eff6ff;
  }

  .tarea-card--documento_colaborativo {
    --tarea-tipo-color:
      #7c3aed;
    --tarea-tipo-fondo:
      #f5f3ff;
  }

  .tarea-card--redaccion_juridica {
    --tarea-tipo-color:
      #dc2626;
    --tarea-tipo-fondo:
      #fef2f2;
  }

  .tarea-card--exposicion {
    --tarea-tipo-color:
      #d97706;
    --tarea-tipo-fondo:
      #fffbeb;
  }

  .tarea-card--caso_practico {
    --tarea-tipo-color:
      #16a34a;
    --tarea-tipo-fondo:
      #f0fdf4;
  }

  .tarea-card--mixta {
    --tarea-tipo-color:
      #0f766e;
    --tarea-tipo-fondo:
      #f0fdfa;
  }

  .tarea-card--presencial {
    --tarea-tipo-color:
      #64748b;
    --tarea-tipo-fondo:
      #f8fafc;
  }

  .tarea-card {
    border-left-color:
      var(
        --tarea-tipo-color,
        var(--app-accent)
      );
  }

  .tarea-card:hover {
    transform:
      translateY(
        -2px
      );

    border-color:
      var(--app-border-strong);

    border-left-color:
      var(
        --tarea-tipo-color,
        var(--app-accent)
      );

    box-shadow:
      var(--app-shadow-md);
  }

  .tarea-card__menu {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 4;
  }

  .tarea-card__menu-trigger {
    width: 34px;
    height: 34px;

    border-color:
      var(--app-border);

    background:
      color-mix(
        in srgb,
        var(--app-surface) 92%,
        transparent
      );

    box-shadow:
      0 7px 18px
      rgba(
        15,
        23,
        42,
        .08
      );
  }

  .tarea-card__cuerpo {
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

  .tarea-card__cuerpo:focus-visible {
    outline:
      3px solid
      color-mix(
        in srgb,
        var(--tarea-tipo-color) 25%,
        transparent
      );

    outline-offset:
      -3px;

    border-radius:
      17px;
  }

  .tarea-card__encabezado {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    padding-right: 42px;
  }

  .tarea-card__etiquetas {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tarea-estado,
  .tarea-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    padding:
      5px
      8px;

    border-radius:
      999px;

    color:
      var(--app-text-secondary);

    background:
      var(--app-surface-alt);

    font-size:
      9px;

    font-weight:
      850;

    text-transform:
      uppercase;

    letter-spacing:
      .04em;
  }

  .tarea-estado--programada {
    color:
      #1d4ed8;

    background:
      #dbeafe;
  }

  .tarea-estado--disponible {
    color:
      #047857;

    background:
      #d1fae5;
  }

  .tarea-estado--cerrada,
  .tarea-estado--anulada {
    color:
      #b42318;

    background:
      #fee4e2;
  }

  .tarea-estado--borrador {
    color:
      #a16207;

    background:
      #fef3c7;
  }

  .tarea-chip--nota {
    color:
      #6d28d9;

    background:
      #ede9fe;
  }

  .tarea-chip--componente {
    color:
      var(--app-accent-dark);

    background:
      var(--app-accent-soft);
  }

  .tarea-chip--modalidad {
    color:
      #475569;

    background:
      #f1f5f9;
  }

  .tarea-chip--tipo {
    color:
      var(
        --tarea-tipo-color,
        var(--app-accent-dark)
      );

    background:
      var(
        --tarea-tipo-fondo,
        var(--app-accent-soft)
      );
  }

  .tarea-chip--colaborativa {
    color:
      #0369a1;

    background:
      #e0f2fe;
  }

  .tarea-card h3 {
    margin:
      14px
      0
      6px;

    color:
      var(--app-text);

    font-size:
      16px;

    font-weight:
      900;

    line-height:
      1.25;
  }

  .tarea-card p {
    display:
      -webkit-box;

    margin: 0;

    overflow:
      hidden;

    color:
      var(--app-text-soft);

    font-size:
      11px;

    line-height:
      1.55;

    -webkit-box-orient:
      vertical;

    -webkit-line-clamp:
      2;
  }

  .tarea-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap:
      7px
      12px;

    margin-top:
      12px;

    color:
      var(--app-text-muted);

    font-size:
      9px;
  }

  .tarea-card__meta span + span::before {
    content:
      "•";

    margin-right:
      12px;
  }

  .tarea-card__pie {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 14px;

    margin-top:
      14px;

    padding-top:
      12px;

    border-top:
      1px solid
      var(--app-border-soft);
  }

  .tarea-card__fechas-secundarias {
    min-width: 0;
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap:
      10px
      18px;
  }

  .tarea-card__fechas-secundarias > span {
    display: grid;
    gap: 1px;
  }

  .tarea-card__fechas-secundarias small {
    color:
      var(--app-text-muted);

    font-size:
      8px;

    font-weight:
      750;

    line-height:
      1.1;
  }

  .tarea-card__fechas-secundarias strong {
    color:
      var(--app-text-secondary);

    font-size:
      9px;

    font-weight:
      850;

    line-height:
      1.2;

    white-space:
      nowrap;
  }

  .tarea-card__vencimiento {
    min-width:
      116px;

    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      flex-end;

    gap:
      7px;

    flex-shrink:
      0;

    color:
      var(--app-accent-dark);
  }

  .tarea-card__vencimiento > span {
    display:
      grid;

    gap:
      1px;

    text-align:
      right;
  }

  .tarea-card__vencimiento small {
    color:
      var(--app-text-muted);

    font-size:
      8px;

    font-weight:
      750;

    line-height:
      1.1;
  }

  .tarea-card__vencimiento strong {
    color:
      var(--app-text-secondary);

    font-size:
      9px;

    font-weight:
      850;

    line-height:
      1.2;

    white-space:
      nowrap;
  }

  .tareas-confirmacion__footer { width: 100%; display: flex; justify-content: flex-end; gap: 8px; }
  .tareas-confirmacion__footer button { min-height: 38px; display: inline-flex; align-items: center; gap: 6px; padding: 8px 11px; border-radius: 10px; font: inherit; font-size: 9px; font-weight: 850; cursor: pointer; }
  .tareas-confirmacion__footer .secundario { border: 1px solid var(--app-border-strong); color: var(--app-text-secondary); background: var(--app-surface); }
  .tareas-confirmacion__footer .primario { border: 0; color: #fff; background: linear-gradient(135deg, var(--app-accent), var(--app-accent-hover)); }
  .tareas-confirmacion__footer .peligro { border: 0; color: #fff; background: var(--app-danger); }
  .tareas-confirmacion__cuerpo {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    padding: 2px 1px;
    color: var(--app-accent-dark);
  }

  .tareas-confirmacion__cuerpo > svg {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .tareas-confirmacion__cuerpo > div {
    min-width: 0;
  }

  .tareas-confirmacion__cuerpo strong {
    display: block;
    margin-bottom: 4px;
    color: var(--app-text);
    font-size: var(--app-font-sm);
    font-weight: var(--app-font-black);
  }

  .tareas-confirmacion__cuerpo p {
    margin: 0;
    color: var(--app-text-soft);
    font-size: var(--app-font-sm);
    line-height: 1.5;
  }

  @media (max-width: 760px) {
    .tareas-curso__grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 520px) {
    .tarea-card__pie {
      align-items:
        flex-start;

      flex-direction:
        column;
    }

    .tarea-card__vencimiento {
      min-width:
        0;

      justify-content:
        flex-start;
    }

    .tarea-card__vencimiento > span {
      text-align:
        left;
    }
  }
`;