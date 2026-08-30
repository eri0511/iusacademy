import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  File,
  FilePenLine,
  FileText,
  Files,
  History,
  Info,
  Laptop,
  Lock,
  MonitorUp,
  Presentation,
  RefreshCw,
  Scale,
  Settings2,
  ShieldCheck,
  Trash2,
  TableProperties,
  Users,
  UsersRound,
  Workflow,
} from 'lucide-react';

import type {
  ComponentType,
  CSSProperties,
  ReactNode,
} from 'react';

import {
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaHeader from '../../../components/aula/AulaHeader';
import AulaModal from '../../../components/aula/AulaModal';
import AulaSkeleton from '../../../components/aula/AulaSkeleton';
import FormularioTareaInteligente from '../../../components/tareas/FormularioTareaInteligente';
import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import useDetalleTarea from '../../../hooks/tareas/useDetalleTarea';
import useSeguimientoTareaDocente from '../../../hooks/tareas/useSeguimientoTareaDocente';

import CalificacionesTareaDocente from '../../../components/tareas/docente/CalificacionesTareaDocente';
import EquiposTareaDocente from '../../../components/tareas/docente/EquiposTareaDocente';
import HistorialTareaDocente from '../../../components/tareas/docente/HistorialTareaDocente';


import type {
  CrearTareaDatos,
  ResponsableEntregaGrupo,
  TareaCurso,
  TipoTarea,
} from '../../../types/tareas/tareas.types';

type Pestana =
  | 'actividad'
  | 'equipos'
  | 'calificaciones'
  | 'historial';

type ConfiguracionTipoVisual = {
  nombre:
    string;
  descripcion:
    string;
  icono:
    ComponentType<{
      size?: number;
    }>;
  color:
    string;
  fondo:
    string;
};

type Confirmacion = {
  titulo:
    string;
  descripcion:
    string;
  textoConfirmar:
    string;
  peligro?:
    boolean;
  accion:
    () => Promise<unknown>;
};

const configuracionTipos:
  Record<
    TipoTarea,
    ConfiguracionTipoVisual
  > = {
    ENTREGA_ARCHIVOS: {
      nombre:
        'Entrega de archivos',
      descripcion:
        'Actividad orientada a informes, documentos, imágenes y evidencias adjuntas.',
      icono:
        Files,
      color:
        '#f97316',
      fondo:
        '#fff7ed',
    },

    RESPUESTA_ESCRITA: {
      nombre:
        'Respuesta escrita',
      descripcion:
        'Desarrollo individual mediante el editor interno de IusAcademy.',
      icono:
        FilePenLine,
      color:
        '#2563eb',
      fondo:
        '#eff6ff',
    },

    DOCUMENTO_COLABORATIVO: {
      nombre:
        'Documento colaborativo',
      descripcion:
        'Construcción conjunta con autoría, historial y seguimiento de contribuciones.',
      icono:
        Workflow,
      color:
        '#7c3aed',
      fondo:
        '#f5f3ff',
    },

    REDACCION_JURIDICA: {
      nombre:
        'Redacción jurídica',
      descripcion:
        'Producción guiada de memoriales, demandas, contratos y otros documentos jurídicos.',
      icono:
        Scale,
      color:
        '#dc2626',
      fondo:
        '#fef2f2',
    },

    EXPOSICION: {
      nombre:
        'Exposición',
      descripcion:
        'Actividad para presentaciones, material de apoyo y evaluación de exposición.',
      icono:
        Presentation,
      color:
        '#d97706',
      fondo:
        '#fffbeb',
    },

    CASO_PRACTICO: {
      nombre:
        'Caso práctico',
      descripcion:
        'Resolución estructurada de problemas jurídicos y aplicación de conceptos.',
      icono:
        BookOpenCheck,
      color:
        '#16a34a',
      fondo:
        '#f0fdf4',
    },

    MIXTA: {
      nombre:
        'Actividad mixta',
      descripcion:
        'Combina varios componentes y evidencias dentro de una sola actividad.',
      icono:
        Workflow,
      color:
        '#0f766e',
      fondo:
        '#f0fdfa',
    },

    PRESENCIAL: {
      nombre:
        'Actividad presencial',
      descripcion:
        'Evidencia registrada principalmente por el docente para una actividad realizada en aula.',
      icono:
        MonitorUp,
      color:
        '#64748b',
      fondo:
        '#f8fafc',
    },
  };

const etiquetasEstado = {
  BORRADOR:
    'Borrador',
  PROGRAMADA:
    'Programada',
  DISPONIBLE:
    'Disponible',
  CERRADA:
    'Cerrada',
  ANULADA:
    'Anulada',
} as const;

function fecha(
  valor?:
    string | null,
) {
  if (!valor) {
    return 'Sin definir';
  }

  const fechaValor =
    new Date(
      valor,
    );

  if (
    Number.isNaN(
      fechaValor.getTime(),
    )
  ) {
    return 'Sin definir';
  }

  return new Intl.DateTimeFormat(
    'es-BO',
    {
      day:
        '2-digit',
      month:
        '2-digit',
      year:
        'numeric',
      hour:
        '2-digit',
      minute:
        '2-digit',
      hour12:
        false,
    },
  ).format(
    fechaValor,
  );
}

function etiqueta(
  valor?:
    string | null,
) {
  if (!valor) {
    return '—';
  }

  return valor
    .replaceAll(
      '_',
      ' ',
    )
    .toLowerCase()
    .replace(
      /^./,
      (
        letra,
      ) =>
        letra.toUpperCase(),
    );
}

function tiempoRestante(
  tarea:
    TareaCurso,
) {
  if (
    tarea.estado ===
      'BORRADOR'
  ) {
    return 'Pendiente de publicación';
  }

  if (
    tarea.estado ===
      'CERRADA'
  ) {
    return 'Actividad finalizada';
  }

  if (
    tarea.estado ===
      'ANULADA'
  ) {
    return 'Actividad anulada';
  }

  const destino =
    tarea.permitirRetrasos &&
    tarea.fechaMaximaRetraso
      ? tarea.fechaMaximaRetraso
      : tarea.fechaCierre ||
        tarea.fechaLimite;

  const diferencia =
    new Date(
      destino,
    ).getTime() -
    Date.now();

  if (
    diferencia <=
    0
  ) {
    return 'Plazo finalizado';
  }

  const total =
    Math.floor(
      diferencia /
      1000,
    );

  const dias =
    Math.floor(
      total /
      86400,
    );

  const horas =
    Math.floor(
      (
        total %
        86400
      ) /
      3600,
    );

  const minutos =
    Math.floor(
      (
        total %
        3600
      ) /
      60,
    );

  if (
    dias >
    0
  ) {
    return `Restan ${dias} d ${horas} h ${minutos} min`;
  }

  if (
    horas >
    0
  ) {
    return `Restan ${horas} h ${minutos} min`;
  }

  return `Restan ${minutos} min`;
}



function obtenerTextoConfiguracion<
  T extends string,
>(
  tarea:
    TareaCurso,
  clave:
    string,
  valores:
    readonly T[],
  predeterminado:
    T,
): T {
  const valor =
    tarea.configuracionTipo?.[
      clave
    ];

  return typeof valor ===
      'string' &&
    valores.includes(
      valor as T,
    )
    ? valor as T
    : predeterminado;
}

function tamanioArchivo(
  bytes:
    number,
) {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  const kb =
    bytes /
    1024;

  if (
    kb <
    1024
  ) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(
    kb /
    1024
  ).toFixed(1)} MB`;
}

function BloqueExperiencia({
  tarea,
}: {
  tarea:
    TareaCurso;
}) {
  const tipo =
    configuracionTipos[
      tarea.tipo
    ];

  const Icono =
    tipo.icono;

  const componentes =
    tarea.componentes;

  const renderComponentes =
    componentes.length >
    0;

  return (
    <section className="dt-experiencia">
      <header className="dt-experiencia__header">
        <span
          className="dt-experiencia__icono"
          style={{
            color:
              tipo.color,
            background:
              tipo.fondo,
          }}
        >
          <Icono
            size={22}
          />
        </span>

        <div>
          <span className="dt-eyebrow">
            Experiencia de aprendizaje
          </span>

          <h3>
            {tipo.nombre}
          </h3>

          <p>
            {tipo.descripcion}
          </p>
        </div>
      </header>

      {tarea.tipo ===
        'ENTREGA_ARCHIVOS' && (
        <div className="dt-experiencia__mensaje">
          <Files
            size={18}
          />

          <div>
            <strong>
              Evidencia documental
            </strong>

            <p>
              El estudiante entregará los archivos permitidos por la configuración de la tarea.
            </p>
          </div>
        </div>
      )}

      {tarea.tipo ===
        'RESPUESTA_ESCRITA' && (
        <div className="dt-experiencia__mensaje">
          <FilePenLine
            size={18}
          />

          <div>
            <strong>
              Desarrollo dentro de IusAcademy
            </strong>

            <p>
              La respuesta se construirá mediante el editor interno y quedará asociada al estudiante.
            </p>
          </div>
        </div>
      )}

      {tarea.tipo ===
        'DOCUMENTO_COLABORATIVO' && (
        <div className="dt-experiencia__mensaje dt-experiencia__mensaje--destacado">
          <Workflow
            size={18}
          />

          <div>
            <strong>
              Colaboración avanzada
            </strong>

            <p>
              Esta actividad está preparada para autoría por fragmentos, historial de versiones, contribuciones por estudiante y exportación PDF.
            </p>
          </div>
        </div>
      )}

      {tarea.tipo ===
        'REDACCION_JURIDICA' && (
        <div className="dt-experiencia__mensaje">
          <Scale
            size={18}
          />

          <div>
            <strong>
              Producción jurídica guiada
            </strong>

            <p>
              La actividad está orientada a redactar documentos jurídicos dentro del editor según las consignas definidas por el docente.
            </p>
          </div>
        </div>
      )}

      {tarea.tipo ===
        'EXPOSICION' && (
        <div className="dt-experiencia__mensaje">
          <Presentation
            size={18}
          />

          <div>
            <strong>
              Presentación y material de apoyo
            </strong>

            <p>
              La actividad puede exigir material de exposición y posteriormente registrar observaciones de la presentación.
            </p>
          </div>
        </div>
      )}

      {tarea.tipo ===
        'CASO_PRACTICO' && (
        <div className="dt-experiencia__mensaje">
          <BookOpenCheck
            size={18}
          />

          <div>
            <strong>
              Resolución de caso
            </strong>

            <p>
              El estudiante deberá analizar el supuesto planteado y desarrollar la respuesta según la estructura configurada.
            </p>
          </div>
        </div>
      )}

      {tarea.tipo ===
        'MIXTA' && (
        <div className="dt-experiencia__mensaje dt-experiencia__mensaje--destacado">
          <Workflow
            size={18}
          />

          <div>
            <strong>
              Actividad compuesta
            </strong>

            <p>
              Los bloques visibles se determinan por los componentes elegidos durante la creación de la tarea.
            </p>
          </div>
        </div>
      )}

      {tarea.tipo ===
        'PRESENCIAL' && (
        <div className="dt-experiencia__mensaje">
          <Laptop
            size={18}
          />

          <div>
            <strong>
              Registro principalmente docente
            </strong>

            <p>
              No se fuerza una entrega digital; la evidencia y la evaluación se registrarán según la dinámica presencial.
            </p>
          </div>
        </div>
      )}

      {renderComponentes && (
        <div className="dt-componentes">
          <div className="dt-subtitulo">
            <div>
              <strong>
                Componentes configurados
              </strong>

              <small>
                Estructura específica de esta actividad.
              </small>
            </div>

            <span>
              {componentes.length}
            </span>
          </div>

          <div className="dt-componentes__grid">
            {componentes.map(
              (
                componente,
              ) => (
                <article
                  key={
                    componente.id
                  }
                >
                  <div>
                    <strong>
                      {
                        componente.titulo
                      }
                    </strong>

                    <span>
                      {
                        etiqueta(
                          componente.tipo,
                        )
                      }
                    </span>
                  </div>

                  <p>
                    {
                      componente.descripcion ||
                      'Sin descripción adicional.'
                    }
                  </p>

                  {componente.obligatorio && (
                    <small>
                      <CheckCircle2
                        size={13}
                      />
                      Obligatorio
                    </small>
                  )}
                </article>
              ),
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function DetalleDato({
  nombre,
  valor,
  tipo,
}: {
  nombre:
    string;
  valor:
    ReactNode;
  tipo?:
    'si' | 'no';
}) {
  return (
    <div className="dt-dato">
      <span>
        {nombre}
      </span>

      <strong
        className={
          tipo
            ? `is-${tipo}`
            : ''
        }
      >
        {tipo && (
          <i>
            {tipo ===
            'si'
              ? '✓'
              : '×'}
          </i>
        )}

        {valor}
      </strong>
    </div>
  );
}

function DetalleSeccion({
  icono,
  titulo,
  children,
}: {
  icono:
    ReactNode;
  titulo:
    string;
  children:
    ReactNode;
}) {
  return (
    <section className="dt-detalle-seccion">
      <div className="dt-detalle-seccion__titulo">
        <span>
          {icono}
        </span>

        <h4>
          {titulo}
        </h4>
      </div>

      <div className="dt-detalle-seccion__datos">
        {children}
      </div>
    </section>
  );
}

export default function DetalleTarea() {
  const navigate =
    useNavigate();

  const {
    cursoId,
    tareaId,
  } =
    useParams();

  const idCurso =
    Number(
      cursoId,
    );

  const idTarea =
    Number(
      tareaId,
    );

  const detalle =
    useDetalleTarea(
      idCurso,
      idTarea,
    );

  const seguimiento =
    useSeguimientoTareaDocente(
      idCurso,
      idTarea,
    );

  const [
    pestana,
    setPestana,
  ] =
    useState<Pestana>(
      'actividad',
    );

  const [
    editorAbierto,
    setEditorAbierto,
  ] =
    useState(
      false,
    );

  const [
    detalleAbierto,
    setDetalleAbierto,
  ] =
    useState(
      false,
    );

  const [
    confirmacion,
    setConfirmacion,
  ] =
    useState<Confirmacion | null>(
      null,
    );

  const [
    toast,
    setToast,
  ] =
    useState<{
      visible:
        boolean;
      tipo:
        TipoToast;
      titulo:
        string;
      mensaje?:
        string;
    }>({
      visible:
        false,
      tipo:
        'informacion',
      titulo:
        '',
    });

  const mostrarToast =
    (
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

  const tarea =
    detalle.tarea;

  const pestañas =
    useMemo(
      () => {
        if (!tarea) {
          return [];
        }

        return [
          {
            id:
              'actividad' as const,
            texto:
              'Actividad',
            icono:
              FileText,
          },
          ...(tarea.modalidad ===
          'GRUPAL'
            ? [
                {
                  id:
                    'equipos' as const,
                  texto:
                    'Equipos',
                  icono:
                    UsersRound,
                },
              ]
            : []),
          ...(tarea.esCalificable
            ? [
                {
                  id:
                    'calificaciones' as const,
                  texto:
                    'Calificaciones',
                  icono:
                    TableProperties,
                },
              ]
            : []),
          {
            id:
              'historial' as const,
            texto:
              'Historial',
            icono:
              History,
          },
        ];
      },
      [
        tarea,
      ],
    );

  if (
    detalle.cargando
  ) {
    return (
      <div className="dt-loading">
        <AulaSkeleton
          cantidad={5}
          variante="tarjetas"
        />

        <style>
          {styles}
        </style>
      </div>
    );
  }

  if (
    !tarea
  ) {
    return (
      <div className="dt-error-page">
        <AulaEmptyState
          titulo="No fue posible abrir la tarea"
          descripcion={
            detalle.error ||
            'La actividad no está disponible o ya no pertenece a este curso.'
          }
          icono={AlertCircle}
          accionTexto="Volver a tareas"
          onAccion={() =>
            navigate(
              `/docente/cursos/${idCurso}/tareas`,
            )
          }
        />

        <style>
          {styles}
        </style>
      </div>
    );
  }

  const tipo =
    configuracionTipos[
      tarea.tipo
    ];

  const IconoTipo =
    tipo.icono;

  const cierreReferencia =
    tarea.permitirRetrasos &&
    tarea.fechaMaximaRetraso
      ? tarea.fechaMaximaRetraso
      : tarea.fechaCierre;

  const responsableEntrega =
    obtenerTextoConfiguracion<ResponsableEntregaGrupo>(
      tarea,
      'responsableEntregaGrupo',
      [
        'SOLO_REPRESENTANTE',
        'CUALQUIER_INTEGRANTE',
      ],
      'SOLO_REPRESENTANTE',
    );

  const volver =
    () =>
      navigate(
        `/docente/cursos/${idCurso}/tareas`,
      );

  const guardarEdicion =
    async (
      datos:
        CrearTareaDatos,
      publicarAhora:
        boolean,
    ) => {
      const {
        hitoId: _,
        publicar: __,
        ...actualizacion
      } =
        datos;

      void _;
      void __;

      await detalle.actualizar(
        actualizacion,
      );

      if (
        publicarAhora &&
        tarea.estado ===
          'BORRADOR'
      ) {
        await detalle.publicar();
      }

      await Promise.all([
        seguimiento.cargarPanel(
          false,
        ),
        seguimiento.cargarHistorial()
          .catch(
            () =>
              undefined,
          ),
      ]);

      setEditorAbierto(
        false,
      );

      mostrarToast(
        'exito',
        'Tarea actualizada',
        'La configuración se guardó correctamente.',
      );
    };

  const ejecutarConfirmacion =
    async () => {
      if (!confirmacion) {
        return;
      }

      try {
        await confirmacion.accion();

        await Promise.all([
          seguimiento.cargarPanel(
            false,
          ),
          seguimiento.cargarHistorial()
            .catch(
              () =>
                undefined,
            ),
        ]);

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
          'No se pudo completar la operación',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const estiloTipo =
    {
      '--dt-type-color':
        tipo.color,
      '--dt-type-bg':
        tipo.fondo,
    } as CSSProperties;

  return (
    <div
      className="dt-page"
      style={
        estiloTipo
      }
    >
      <AulaHeader
        icono={
          IconoTipo
        }
        etiqueta={`Tarea · ${tarea.hito.codigo}`}
        titulo={
          tarea.titulo
        }
        descripcion={
          tarea.descripcion ||
          tipo.descripcion
        }
        informacion={`Límite: ${fecha(tarea.fechaLimite)} · Cierre: ${fecha(cierreReferencia)}`}
        acciones={[
          {
            texto:
              'Volver a tareas',
            icono:
              ArrowLeft,
            onClick:
              volver,
          },
          {
            texto:
              'Detalle',
            icono:
              Info,
            variante:
              'primaria',
            onClick:
              () =>
                setDetalleAbierto(
                  true,
                ),
          },
          {
            texto:
              'Actualizar',
            icono:
              RefreshCw,
            deshabilitada:
              detalle.procesando,
            onClick:
              () =>
                void detalle.cargar(),
          },
        ]}
      />

      <section
        className={`dt-countdown ${
          tarea.estado ===
            'CERRADA' ||
          tarea.estado ===
            'ANULADA'
            ? 'is-finished'
            : ''
        }`}
      >
        <Clock3 />

        <div>
          <small>
            {tarea.estado ===
              'BORRADOR'
              ? 'Estado de publicación'
              : tarea.estado ===
                  'CERRADA' ||
                tarea.estado ===
                  'ANULADA'
                ? 'Estado de la tarea'
                : 'Cierre definitivo'}
          </small>

          <strong>
            {tarea.estado ===
              'BORRADOR'
              ? 'Borrador'
              : tarea.estado ===
                  'ANULADA'
                ? 'Actividad anulada'
                : tarea.estado ===
                    'CERRADA'
                  ? 'Actividad cerrada'
                  : fecha(
                      cierreReferencia,
                    )}
          </strong>
        </div>

        <span>
          {tiempoRestante(
            tarea,
          )}
        </span>
      </section>

      <nav className="dt-tabs">
        {pestañas.map(
          (
            item,
          ) => {
            const Icono =
              item.icono;

            return (
              <button
                key={
                  item.id
                }
                type="button"
                className={
                  pestana ===
                  item.id
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setPestana(
                    item.id,
                  )
                }
              >
                <Icono
                  size={16}
                />

                {
                  item.texto
                }
              </button>
            );
          },
        )}
      </nav>

      {pestana ===
        'actividad' && (
        <div className="dt-grid">
          <main className="dt-main">
            <article className="dt-enunciado">
              <div className="dt-enunciado__badges">
                <span
                  className={`dt-estado dt-estado--${tarea.estado.toLowerCase()}`}
                >
                  {
                    etiquetasEstado[
                      tarea.estado
                    ]
                  }
                </span>

                <span className="dt-chip dt-chip--tipo">
                  <IconoTipo
                    size={13}
                  />

                  {
                    tipo.nombre
                  }
                </span>

                <span className="dt-chip">
                  <Users
                    size={13}
                  />

                  {tarea.modalidad ===
                  'GRUPAL'
                    ? 'Grupal'
                    : 'Individual'}
                </span>

                {tarea.esCalificable && (
                  <span className="dt-chip dt-chip--nota">
                    <Award
                      size={13}
                    />

                    {Number(
                      tarea.puntajeMaximo,
                    )} pts
                  </span>
                )}
              </div>

              <h3>
                Actividad principal
              </h3>

              <p className="dt-enunciado__descripcion">
                {tarea.descripcion ||
                  'Esta actividad no tiene una descripción adicional.'}
              </p>

              {tarea.instrucciones && (
                <aside className="dt-instrucciones">
                  <strong>
                    Instrucciones
                  </strong>

                  <p>
                    {
                      tarea.instrucciones
                    }
                  </p>
                </aside>
              )}

              {tarea.archivos.length >
                0 && (
                <section className="dt-archivos-docente">
                  <div className="dt-subtitulo">
                    <div>
                      <strong>
                        Archivos del docente
                      </strong>

                      <small>
                        Material asociado a la actividad.
                      </small>
                    </div>

                    <span>
                      {
                        tarea.archivos.length
                      }
                    </span>
                  </div>

                  <div className="dt-archivos-docente__grid">
                    {tarea.archivos.map(
                      (
                        archivo,
                      ) => (
                        <article
                          key={
                            archivo.id
                          }
                        >
                          <span>
                            <File
                              size={18}
                            />
                          </span>

                          <div>
                            <strong>
                              {
                                archivo.nombreOriginal
                              }
                            </strong>

                            <small>
                              {archivo.extension.toUpperCase()} · {tamanioArchivo(
                                archivo.tamanioBytes,
                              )}
                            </small>
                          </div>

                          {!archivo.permiteDescarga && (
                            <Lock
                              size={14}
                            />
                          )}
                        </article>
                      ),
                    )}
                  </div>

                  <p className="dt-archivos-docente__nota">
                    <Info
                      size={14}
                    />
                    Consulta aquí el material adjunto que acompaña las instrucciones de la actividad.
                  </p>
                </section>
              )}
            </article>

            <BloqueExperiencia
              tarea={
                tarea
              }
            />
          </main>

          <aside className="dt-side">
            <section className="dt-side-card">
              <div className="dt-side-head">
                <span>
                  <Settings2
                    size={17}
                  />
                </span>

                <div>
                  <h3>
                    Administrar tarea
                  </h3>

                  <p>
                    Acciones y configuración
                  </p>
                </div>
              </div>

              <div className="dt-side-actions">
                <button
                  type="button"
                  onClick={() =>
                    setEditorAbierto(
                      true,
                    )
                  }
                >
                  <Edit3 />

                  <span>
                    <strong>
                      Editar configuración
                    </strong>

                    <small>
                      Ajustar opciones de la tarea
                    </small>
                  </span>
                </button>

                {tarea.estado ===
                  'BORRADOR' && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmacion({
                        titulo:
                          'Publicar tarea',
                        descripcion:
                          'La tarea quedará publicada y se mostrará a los estudiantes según las fechas configuradas.',
                        textoConfirmar:
                          'Publicar',
                        accion:
                          detalle.publicar,
                      })
                    }
                  >
                    <Eye />

                    <span>
                      <strong>
                        Publicar tarea
                      </strong>

                      <small>
                        Hacer visible según su programación
                      </small>
                    </span>
                  </button>
                )}

                {(
                  tarea.estado ===
                    'PROGRAMADA' ||
                  tarea.estado ===
                    'DISPONIBLE'
                ) && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmacion({
                        titulo:
                          'Cerrar tarea',
                        descripcion:
                          'Los estudiantes ya no podrán realizar nuevas entregas ni modificar las existentes.',
                        textoConfirmar:
                          'Cerrar tarea',
                        accion:
                          detalle.cerrar,
                      })
                    }
                  >
                    <Lock />

                    <span>
                      <strong>
                        Cerrar tarea
                      </strong>

                      <small>
                        Finalizar disponibilidad
                      </small>
                    </span>
                  </button>
                )}

                {tarea.estado ===
                  'CERRADA' && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmacion({
                        titulo:
                          'Reabrir tarea',
                        descripcion:
                          'La tarea volverá a habilitarse de acuerdo con las fechas configuradas.',
                        textoConfirmar:
                          'Reabrir',
                        accion:
                          detalle.reabrir,
                      })
                    }
                  >
                    <RefreshCw />

                    <span>
                      <strong>
                        Reabrir tarea
                      </strong>

                      <small>
                        Recalcular disponibilidad
                      </small>
                    </span>
                  </button>
                )}

                {tarea.estado !==
                  'ANULADA' && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() =>
                      setConfirmacion({
                        titulo:
                          'Anular tarea',
                        descripcion:
                          'La tarea se retirará del aula y dejará de estar disponible para los estudiantes.',
                        textoConfirmar:
                          'Anular tarea',
                        peligro:
                          true,
                        accion:
                          async () => {
                            await detalle.anular();

                            volver();
                          },
                      })
                    }
                  >
                    <Trash2 />

                    <span>
                      <strong>
                        Anular tarea
                      </strong>

                      <small>
                        Retirar del aula
                      </small>
                    </span>
                  </button>
                )}
              </div>
            </section>

            <section className="dt-side-card">
              <div className="dt-side-head">
                <span>
                  <CalendarDays
                    size={17}
                  />
                </span>

                <div>
                  <h3>
                    Programación
                  </h3>

                  <p>
                    Estado y fechas principales
                  </p>
                </div>
              </div>

              <div className={`dt-status dt-status--${tarea.estado.toLowerCase()}`}>
                <div>
                  <small>
                    Estado
                  </small>

                  <strong>
                    {
                      etiquetasEstado[
                        tarea.estado
                      ]
                    }
                  </strong>
                </div>

                <span />
              </div>

              <div className="dt-status-data">
                <div>
                  <CalendarDays />

                  <span>
                    <small>
                      Apertura
                    </small>

                    <strong>
                      {fecha(
                        tarea.fechaApertura,
                      )}
                    </strong>
                  </span>
                </div>

                <div>
                  <Clock3 />

                  <span>
                    <small>
                      Fecha límite
                    </small>

                    <strong>
                      {fecha(
                        tarea.fechaLimite,
                      )}
                    </strong>
                  </span>
                </div>

                <div>
                  <Lock />

                  <span>
                    <small>
                      Cierre definitivo
                    </small>

                    <strong>
                      {fecha(
                        cierreReferencia,
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}

      {pestana ===
        'equipos' &&
        tarea.modalidad ===
          'GRUPAL' && (
        <div className="dt-equipos-vista">
          {seguimiento.cargando ? (
            <AulaSkeleton
              cantidad={3}
              variante="tarjetas"
            />
          ) : seguimiento.panel ? (
            <EquiposTareaDocente
              panel={
                seguimiento.panel
              }
            />
          ) : (
            <AulaEmptyState
              titulo="No fue posible cargar los equipos"
              descripcion={
                seguimiento.error ||
                'Actualiza la página para volver a intentarlo.'
              }
              icono={UsersRound}
            />
          )}
        </div>
      )}

      {pestana ===
        'calificaciones' &&
        tarea.esCalificable && (
        <div className="dt-calificaciones-vista">
          {seguimiento.panel ? (
            <CalificacionesTareaDocente
              panel={
                seguimiento.panel
              }
              procesando={
                seguimiento.procesando
              }
              onCalificar={(
                entregaId,
              ) =>
                navigate(
                  `/docente/cursos/${idCurso}/tareas/${idTarea}/entregas/${entregaId}`,
                )
              }
              onPublicar={async () => {
                try {
                  await seguimiento.publicar();

                  mostrarToast(
                    'exito',
                    'Notas publicadas',
                    'Los estudiantes ya pueden consultar sus calificaciones.',
                  );
                } catch (
                  causa
                ) {
                  mostrarToast(
                    'error',
                    'No se pudieron publicar las notas',
                    causa instanceof Error
                      ? causa.message
                      : undefined,
                  );

                  throw causa;
                }
              }}
            />
          ) : (
            <AulaSkeleton
              cantidad={4}
              variante="tarjetas"
            />
          )}
        </div>
      )}

      {pestana ===
        'historial' && (
        <section className="dt-panel">
          <header className="dt-panel__header">
            <span>
              <History
                size={21}
              />
            </span>

            <div>
              <span className="dt-eyebrow">
                Historial
              </span>

              <h3>
                Movimientos de la tarea
              </h3>

              <p>
                Entregas, ediciones, archivos y movimientos de calificación registrados para esta actividad.
              </p>
            </div>
          </header>

          <HistorialTareaDocente
            historial={
              seguimiento.historial
            }
          />
        </section>
      )}

      {detalleAbierto && (
        <AulaModal
          abierto={
            detalleAbierto
          }
          titulo="Detalle completo"
          etiqueta="Configuración de la tarea"
          descripcion="Consulta las reglas, fechas y criterios aplicados a esta actividad."
          icono={Settings2}
          ancho="amplio"
          onCerrar={() =>
            setDetalleAbierto(
              false,
            )
          }
          footer={
            <div className="dt-modal-footer">
              <button
                type="button"
                className="secundario"
                onClick={() =>
                  setDetalleAbierto(
                    false,
                  )
                }
              >
                Cerrar
              </button>

              <button
                type="button"
                className="primario"
                onClick={() => {
                  setDetalleAbierto(
                    false,
                  );
                  setEditorAbierto(
                    true,
                  );
                }}
              >
                <Edit3
                  size={15}
                />
                Editar configuración
              </button>
            </div>
          }
        >
          <div className="dt-detalle-modal">
            <section className="dt-detalle-resumen">
              <span
                className={`dt-estado dt-estado--${tarea.estado.toLowerCase()}`}
              >
                {
                  etiquetasEstado[
                    tarea.estado
                  ]
                }
              </span>

              <h3>
                {
                  tarea.titulo
                }
              </h3>

              <p>
                {
                  tarea.descripcion ||
                  tipo.descripcion
                }
              </p>
            </section>

            <div className="dt-detalle-grid">
              <DetalleSeccion
                icono={
                  <CalendarDays />
                }
                titulo="Programación"
              >
                <DetalleDato
                  nombre="Apertura"
                  valor={fecha(
                    tarea.fechaApertura,
                  )}
                />

                <DetalleDato
                  nombre="Fecha límite"
                  valor={fecha(
                    tarea.fechaLimite,
                  )}
                />

                <DetalleDato
                  nombre="Cierre definitivo"
                  valor={fecha(
                    cierreReferencia,
                  )}
                />

                <DetalleDato
                  nombre="Retrasos"
                  valor={
                    tarea.permitirRetrasos
                      ? 'Permitidos'
                      : 'No permitidos'
                  }
                  tipo={
                    tarea.permitirRetrasos
                      ? 'si'
                      : 'no'
                  }
                />
              </DetalleSeccion>

              <DetalleSeccion
                icono={
                  <Users />
                }
                titulo="Participación"
              >
                <DetalleDato
                  nombre="Modalidad"
                  valor={etiqueta(
                    tarea.modalidad,
                  )}
                />

                <DetalleDato
                  nombre="Origen de grupos"
                  valor={etiqueta(
                    tarea.origenGrupo,
                  )}
                />

                {tarea.modalidad ===
                  'GRUPAL' && (
                  <DetalleDato
                    nombre="Quién entrega"
                    valor={
                      responsableEntrega ===
                      'SOLO_REPRESENTANTE'
                        ? 'Solo el representante'
                        : 'Cualquier integrante'
                    }
                  />
                )}

                <DetalleDato
                  nombre="Edición de entrega"
                  valor={
                    tarea.permitirEditarEntrega
                      ? 'Permitida'
                      : 'No permitida'
                  }
                  tipo={
                    tarea.permitirEditarEntrega
                      ? 'si'
                      : 'no'
                  }
                />
              </DetalleSeccion>

              <DetalleSeccion
                icono={
                  <Files />
                }
                titulo="Evidencias"
              >
                <DetalleDato
                  nombre="Exigir editor"
                  valor={
                    tarea.exigirContenidoEditor
                      ? 'Sí'
                      : 'No'
                  }
                  tipo={
                    tarea.exigirContenidoEditor
                      ? 'si'
                      : 'no'
                  }
                />

                <DetalleDato
                  nombre="Exigir archivo"
                  valor={
                    tarea.exigirArchivo
                      ? 'Sí'
                      : 'No'
                  }
                  tipo={
                    tarea.exigirArchivo
                      ? 'si'
                      : 'no'
                  }
                />

                {tarea.capacidades.includes(
                  'ARCHIVOS',
                ) && (
                  <>
                    <DetalleDato
                      nombre="Máximo de archivos"
                      valor={
                        tarea.maximoArchivos
                      }
                    />

                    <DetalleDato
                      nombre="Tamaño máximo"
                      valor={`${tarea.tamanioMaximoArchivoMb} MB`}
                    />
                  </>
                )}
              </DetalleSeccion>

              <DetalleSeccion
                icono={
                  <Award />
                }
                titulo="Evaluación"
              >
                <DetalleDato
                  nombre="Calificable"
                  valor={
                    tarea.esCalificable
                      ? 'Sí'
                      : 'No'
                  }
                  tipo={
                    tarea.esCalificable
                      ? 'si'
                      : 'no'
                  }
                />

                {tarea.esCalificable && (
                  <>
                    <DetalleDato
                      nombre="Componente"
                      valor={etiqueta(
                        tarea.componente,
                      )}
                    />

                    <DetalleDato
                      nombre="Puntaje"
                      valor={`${Number(
                        tarea.puntajeMaximo,
                      )} puntos`}
                    />

                    <DetalleDato
                      nombre="Modalidad de nota"
                      valor={etiqueta(
                        tarea.modalidadNota,
                      )}
                    />
                  </>
                )}
              </DetalleSeccion>
            </div>
          </div>
        </AulaModal>
      )}

      {editorAbierto && (
        <FormularioTareaInteligente
          abierto={
            editorAbierto
          }
          cursoId={
            idCurso
          }
          hitoId={
            tarea.hitoId
          }
          hitoCodigo={
            tarea.hito.codigo
          }
          tareaEditar={
            tarea
          }
          guardando={
            detalle.procesando
          }
          onCerrar={() =>
            setEditorAbierto(
              false,
            )
          }
          onGuardar={
            guardarEdicion
          }
        />
      )}

      <AulaModal
        abierto={
          Boolean(
            confirmacion,
          )
        }
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
            : ShieldCheck
        }
        ancho="compacto"
        bloqueado={
          detalle.procesando
        }
        onCerrar={() =>
          setConfirmacion(
            null,
          )
        }
        footer={
          <div className="dt-modal-footer">
            <button
              type="button"
              className="secundario"
              disabled={
                detalle.procesando
              }
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
              disabled={
                detalle.procesando
              }
              onClick={() =>
                void ejecutarConfirmacion()
              }
            >
              {detalle.procesando
                ? 'Procesando…'
                : confirmacion?.textoConfirmar}
            </button>
          </div>
        }
      >
        <div className="dt-confirmacion">
          <Info
            size={22}
          />

          <p>
            Confirma la acción para aplicar el cambio a esta tarea.
          </p>
        </div>
      </AulaModal>

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
    </div>
  );
}

const styles = `

.dt-equipos-vista,
.dt-calificaciones-vista {
  display: grid;
  gap: 12px;
  min-width: 0;
}


  .dt-page {
    display: grid;
    gap: 18px;
    padding-bottom: 34px;
    color: var(--app-text);
  }

  .dt-loading,
  .dt-error-page {
    display: grid;
    gap: 16px;
    padding-bottom: 34px;
  }

  .dt-page .aula-header {
    border-left:
      5px solid
      var(--dt-type-color);
  }

  .dt-countdown {
    display: grid;
    grid-template-columns:
      44px
      minmax(
        0,
        1fr
      )
      auto;
    align-items: center;
    gap: 12px;
    min-height: 62px;
    padding: 11px 14px;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dt-countdown > svg {
    width: 20px;
    height: 20px;
    padding: 10px;
    box-sizing: content-box;
    border-radius: 12px;
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
  }

  .dt-countdown > div {
    display: grid;
    gap: 2px;
  }

  .dt-countdown small {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    font-weight: 650;
  }

  .dt-countdown strong {
    color: var(--app-text);
    font-size: var(--app-font-md);
    font-weight: 850;
  }

  .dt-countdown > span {
    min-height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    padding: 6px 11px;
    border-radius: 999px;
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
    font-size: var(--app-font-xs);
    font-weight: 850;
    white-space: nowrap;
  }

  .dt-countdown.is-finished > span {
    color: #475569;
    background: #eef2f7;
  }

  .dt-tabs {
    display: grid;
    grid-template-columns:
      repeat(
        auto-fit,
        minmax(
          145px,
          1fr
        )
      );
    gap: 10px;
    padding: 11px;
    border: 1px solid var(--app-border);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dt-tabs button {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 13px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 800;
    cursor: pointer;
  }

  .dt-tabs button:hover:not(.active) {
    border-color: var(--dt-type-color);
    color: var(--dt-type-color);
    background: var(--app-surface);
  }

  .dt-tabs button.active {
    border-color: var(--dt-type-color);
    color: #fff;
    background: var(--dt-type-color);
    box-shadow:
      0 10px 22px
      color-mix(
        in srgb,
        var(--dt-type-color) 22%,
        transparent
      );
  }

  .dt-grid {
    display: grid;
    grid-template-columns:
      minmax(
        0,
        1fr
      )
      290px;
    gap: 20px;
    align-items: start;
  }

  .dt-main {
    display: grid;
    gap: 16px;
  }

  .dt-enunciado,
  .dt-experiencia,
  .dt-side-card,
  .dt-panel {
    border: 1px solid var(--app-border-soft);
    border-radius: 21px;
    background: var(--app-surface);
    box-shadow:
      0 10px 30px
      rgba(
        15,
        23,
        42,
        .05
      );
  }

  .dt-enunciado {
    position: relative;
    padding: 24px 26px 26px;
    border-top:
      3px solid
      var(--dt-type-color);
  }

  .dt-enunciado__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .dt-estado,
  .dt-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 9px;
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: var(--app-font-xs);
    font-weight: 850;
    letter-spacing: .035em;
    text-transform: uppercase;
  }

  .dt-estado--borrador {
    color: #a16207;
    background: #fef3c7;
  }

  .dt-estado--programada {
    color: #1d4ed8;
    background: #dbeafe;
  }

  .dt-estado--disponible {
    color: #047857;
    background: #d1fae5;
  }

  .dt-estado--cerrada,
  .dt-estado--anulada {
    color: #b42318;
    background: #fee4e2;
  }

  .dt-chip--tipo {
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
  }

  .dt-chip--nota {
    color: #6d28d9;
    background: #ede9fe;
  }

  .dt-enunciado h3 {
    margin: 19px 0 9px;
    font-size: var(--app-font-title);
    letter-spacing: -.035em;
  }

  .dt-enunciado__descripcion {
    margin: 0;
    color: var(--app-text-secondary);
    white-space: pre-wrap;
    font-size: var(--app-font-body);
    line-height: 1.72;
  }

  .dt-instrucciones {
    margin-top: 20px;
    padding: 15px 17px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--dt-type-color) 20%,
        var(--app-border)
      );
    border-left:
      4px solid
      var(--dt-type-color);
    border-radius: 13px;
    background:
      color-mix(
        in srgb,
        var(--dt-type-bg) 72%,
        var(--app-surface)
      );
  }

  .dt-instrucciones strong {
    color: var(--dt-type-color);
    font-size: var(--app-font-md);
  }

  .dt-instrucciones p {
    margin: 6px 0 0;
    color: var(--app-text-secondary);
    white-space: pre-wrap;
    font-size: var(--app-font-md);
    line-height: 1.6;
  }

  .dt-subtitulo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .dt-subtitulo > div {
    display: grid;
    gap: 2px;
  }

  .dt-subtitulo strong {
    font-size: var(--app-font-md);
  }

  .dt-subtitulo small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dt-subtitulo > span {
    min-width: 31px;
    padding: 5px 8px;
    border-radius: 999px;
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
    font-size: var(--app-font-xs);
    font-weight: 850;
    text-align: center;
  }

  .dt-archivos-docente {
    display: grid;
    gap: 10px;
    margin-top: 18px;
  }

  .dt-archivos-docente__grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 8px;
  }

  .dt-archivos-docente__grid article {
    min-width: 0;
    display: grid;
    grid-template-columns:
      38px
      minmax(
        0,
        1fr
      )
      auto;
    align-items: center;
    gap: 9px;
    padding: 9px 10px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    background: var(--app-surface-alt);
  }

  .dt-archivos-docente__grid article > span {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
  }

  .dt-archivos-docente__grid article > div {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .dt-archivos-docente__grid strong {
    overflow: hidden;
    font-size: var(--app-font-sm);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dt-archivos-docente__grid small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dt-archivos-docente__nota {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    line-height: 1.45;
  }

  .dt-experiencia {
    padding: 20px;
  }

  .dt-experiencia__header {
    display: grid;
    grid-template-columns:
      48px
      minmax(
        0,
        1fr
      );
    gap: 12px;
    align-items: center;
  }

  .dt-experiencia__icono {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 14px;
  }

  .dt-eyebrow {
    display: block;
    color: var(--dt-type-color);
    font-size: var(--app-font-xs);
    font-weight: 900;
    letter-spacing: .075em;
    text-transform: uppercase;
  }

  .dt-experiencia__header h3,
  .dt-experiencia__header p {
    margin: 0;
  }

  .dt-experiencia__header h3 {
    margin-top: 2px;
    font-size: var(--app-font-section);
  }

  .dt-experiencia__header p {
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    line-height: 1.45;
  }

  .dt-experiencia__mensaje {
    display: grid;
    grid-template-columns:
      36px
      minmax(
        0,
        1fr
      );
    gap: 9px;
    align-items: center;
    margin-top: 15px;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-left:
      4px solid
      var(--dt-type-color);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .dt-experiencia__mensaje > svg {
    color: var(--dt-type-color);
  }

  .dt-experiencia__mensaje strong {
    font-size: var(--app-font-sm);
  }

  .dt-experiencia__mensaje p {
    margin: 2px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    line-height: 1.45;
  }

  .dt-experiencia__mensaje--destacado {
    background:
      color-mix(
        in srgb,
        var(--dt-type-bg) 72%,
        var(--app-surface)
      );
  }

  .dt-componentes {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }

  .dt-componentes__grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 9px;
  }

  .dt-componentes__grid article {
    min-width: 0;
    padding: 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .dt-componentes__grid article > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .dt-componentes__grid strong {
    font-size: var(--app-font-sm);
  }

  .dt-componentes__grid article > div > span {
    color: var(--dt-type-color);
    font-size: var(--app-font-xs);
    font-weight: 800;
  }

  .dt-componentes__grid p {
    margin: 5px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    line-height: 1.45;
  }

  .dt-componentes__grid small {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 8px;
    color: #047857;
    font-size: var(--app-font-xs);
    font-weight: 800;
  }

  .dt-side {
    position: sticky;
    top: 16px;
    display: grid;
    gap: 14px;
  }

  .dt-side-card {
    overflow: hidden;
  }

  .dt-side-head {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 15px 16px;
    border-bottom: 1px solid var(--app-border-soft);
    background:
      linear-gradient(
        135deg,
        color-mix(
          in srgb,
          var(--dt-type-bg) 55%,
          var(--app-surface)
        ),
        var(--app-surface)
      );
  }

  .dt-side-head > span {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    flex: 0 0 36px;
    border-radius: 11px;
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
  }

  .dt-side-head h3,
  .dt-side-head p {
    margin: 0;
  }

  .dt-side-head h3 {
    font-size: var(--app-font-md);
  }

  .dt-side-head p {
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dt-side-actions {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 8px;
    padding: 12px;
  }

  .dt-side-actions button {
    min-height: 54px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 10px;
    border: 1px solid var(--app-border-strong);
    border-radius: 12px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .dt-side-actions button:hover {
    border-color: var(--dt-type-color);
    background:
      color-mix(
        in srgb,
        var(--dt-type-bg) 55%,
        var(--app-surface)
      );
  }

  .dt-side-actions button > svg {
    width: 17px;
    flex: 0 0 17px;
    color: var(--dt-type-color);
  }

  .dt-side-actions button > span {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .dt-side-actions button strong {
    font-size: var(--app-font-sm);
  }

  .dt-side-actions button small {
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dt-side-actions button.danger {
    grid-column: 1 / -1;
    border-color:
      color-mix(
        in srgb,
        var(--app-danger) 28%,
        var(--app-border)
      );
  }

  .dt-side-actions button.danger > svg,
  .dt-side-actions button.danger strong {
    color: var(--app-danger);
  }

  .dt-status {
    margin: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .dt-status > div {
    display: grid;
    gap: 2px;
  }

  .dt-status small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dt-status strong {
    color: #047857;
    font-size: var(--app-font-sm);
  }

  .dt-status > span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #22a06b;
    box-shadow:
      0 0 0 4px
      color-mix(
        in srgb,
        #22a06b 12%,
        transparent
      );
  }

  .dt-status--borrador strong,
  .dt-status--programada strong {
    color: #1d4ed8;
  }

  .dt-status--borrador > span,
  .dt-status--programada > span {
    background: #3b82f6;
  }

  .dt-status--cerrada strong,
  .dt-status--anulada strong {
    color: var(--app-danger);
  }

  .dt-status--cerrada > span,
  .dt-status--anulada > span {
    background: var(--app-danger);
  }

  .dt-status-data {
    display: grid;
    padding: 0 13px 12px;
  }

  .dt-status-data > div {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 9px 2px;
    border-top: 1px dashed var(--app-border);
  }

  .dt-status-data > div:first-child {
    border-top: 0;
  }

  .dt-status-data svg {
    width: 15px;
    height: 15px;
    margin-top: 1px;
    color: var(--app-text-muted);
  }

  .dt-status-data span {
    display: grid;
    gap: 2px;
  }

  .dt-status-data small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dt-status-data strong {
    color: var(--app-text-secondary);
    font-size: var(--app-font-xs);
    line-height: 1.4;
  }

  .dt-panel {
    display: grid;
    gap: 14px;
    padding: 20px;
  }

  .dt-panel__header {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .dt-panel__header > span {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex: 0 0 44px;
    border-radius: 12px;
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
  }

  .dt-panel__header h3,
  .dt-panel__header p {
    margin: 0;
  }

  .dt-panel__header h3 {
    margin-top: 2px;
    font-size: var(--app-font-section);
  }

  .dt-panel__header p {
    margin-top: 3px;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dt-equipo-metricas {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );
    gap: 9px;
  }

  .dt-equipo-metricas article {
    min-width: 0;
    min-height: 82px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .dt-equipo-metricas article > svg {
    width: 38px;
    height: 38px;
    padding: 9px;
    box-sizing: border-box;
    border-radius: 11px;
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
  }

  .dt-equipo-metricas article > div {
    display: grid;
    align-content: center;
    gap: 3px;
  }

  .dt-equipo-metricas small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
    text-transform: uppercase;
  }

  .dt-equipo-metricas strong {
    font-size: var(--app-font-md);
  }

  .dt-regla-grupal {
    display: grid;
    grid-template-columns:
      34px
      minmax(
        0,
        1fr
      );
    gap: 9px;
    align-items: center;
    padding: 11px 13px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--dt-type-color) 25%,
        var(--app-border)
      );
    border-left:
      4px solid
      var(--dt-type-color);
    border-radius: 13px;
    background:
      color-mix(
        in srgb,
        var(--dt-type-bg) 62%,
        var(--app-surface)
      );
  }

  .dt-regla-grupal > svg {
    color: var(--dt-type-color);
  }

  .dt-regla-grupal strong {
    font-size: var(--app-font-sm);
  }

  .dt-regla-grupal p {
    margin: 2px 0 0;
    color: var(--app-text-secondary);
    font-size: var(--app-font-xs);
    line-height: 1.5;
  }

  .dt-grupo-plataforma {
    padding: 13px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .dt-grupo-plataforma > div {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .dt-grupo-plataforma > div > span {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
  }

  .dt-grupo-plataforma small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dt-grupo-plataforma strong {
    display: block;
    margin-top: 2px;
    font-size: var(--app-font-md);
  }

  .dt-grupo-plataforma p {
    margin: 3px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dt-pesos {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 9px;
  }

  .dt-pesos > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 13px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .dt-pesos span {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dt-pesos strong {
    color: var(--dt-type-color);
    font-size: var(--app-font-section);
  }

  .dt-history {
    max-width: 760px;
    display: grid;
  }

  .dt-history > div {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 11px 4px;
    border-bottom: 1px solid var(--app-border);
  }

  .dt-history > div > svg {
    width: 28px;
    height: 28px;
    padding: 6px;
    box-sizing: border-box;
    border-radius: 9px;
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
  }

  .dt-history span {
    display: grid;
    gap: 2px;
  }

  .dt-history strong {
    font-size: var(--app-font-sm);
  }

  .dt-history small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dt-modal-footer {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .dt-modal-footer button {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 13px;
    border-radius: 10px;
    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 850;
    cursor: pointer;
  }

  .dt-modal-footer .secundario {
    border: 1px solid var(--app-border-strong);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .dt-modal-footer .primario {
    border: 1px solid var(--dt-type-color);
    color: #fff;
    background: var(--dt-type-color);
  }

  .dt-modal-footer .peligro {
    border: 1px solid var(--app-danger);
    color: #fff;
    background: var(--app-danger);
  }

  .dt-confirmacion {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    padding: 8px 2px;
  }

  .dt-confirmacion > svg {
    color: var(--dt-type-color);
  }

  .dt-confirmacion p {
    margin: 0;
    color: var(--app-text-secondary);
    font-size: var(--app-font-sm);
    line-height: 1.55;
  }

  .dt-detalle-modal {
    display: grid;
    gap: 12px;
  }

  .dt-detalle-resumen {
    padding: 14px 15px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--dt-type-color) 20%,
        var(--app-border)
      );
    border-radius: 14px;
    background:
      color-mix(
        in srgb,
        var(--dt-type-bg) 64%,
        var(--app-surface)
      );
  }

  .dt-detalle-resumen h3 {
    margin: 9px 0 3px;
    font-size: var(--app-font-section);
  }

  .dt-detalle-resumen p {
    margin: 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dt-detalle-grid {
    display: grid;
    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );
    gap: 10px;
  }

  .dt-detalle-seccion {
    padding: 13px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    background: var(--app-surface-alt);
  }

  .dt-detalle-seccion__titulo {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .dt-detalle-seccion__titulo > span {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    color: var(--dt-type-color);
    background: var(--dt-type-bg);
  }

  .dt-detalle-seccion__titulo svg {
    width: 15px;
  }

  .dt-detalle-seccion__titulo h4 {
    margin: 0;
    font-size: var(--app-font-md);
  }

  .dt-detalle-seccion__datos {
    display: grid;
  }

  .dt-dato {
    min-height: 33px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    border-top: 1px dashed var(--app-border);
  }

  .dt-dato:first-child {
    border-top: 0;
  }

  .dt-dato > span {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .dt-dato strong {
    max-width: 58%;
    color: var(--app-text-secondary);
    font-size: var(--app-font-xs);
    text-align: right;
  }

  .dt-dato strong i {
    width: 16px;
    height: 16px;
    display: inline-grid;
    place-items: center;
    margin-right: 4px;
    border-radius: 50%;
    font-style: normal;
  }

  .dt-dato strong.is-si i {
    color: #17824c;
    background: #e3f7ec;
  }

  .dt-dato strong.is-no i {
    color: var(--app-danger);
    background:
      color-mix(
        in srgb,
        var(--app-danger) 10%,
        var(--app-surface)
      );
  }

  @media (
    max-width:
      950px
  ) {
    .dt-grid {
      grid-template-columns: 1fr;
    }

    .dt-side {
      position: static;
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

  }

  @media (
    max-width:
      700px
  ) {
    .dt-side,
    .dt-componentes__grid,
    .dt-archivos-docente__grid,
    .dt-equipo-metricas,
    .dt-pesos,
    .dt-detalle-grid {
      grid-template-columns: 1fr;
    }

    .dt-countdown {
      grid-template-columns:
        40px
        minmax(
          0,
          1fr
        );
    }

    .dt-countdown > span {
      grid-column:
        1 / -1;
      width: 100%;
      margin: 0;
      box-sizing: border-box;
    }

    .dt-enunciado {
      padding: 20px;
    }
  }
`;