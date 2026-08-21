import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FilePenLine,
  FileText,
  Files,
  Image as ImageIcon,
  Info,
  ListChecks,
  Loader2,
  Pencil,
  Presentation,
  Scale,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  UsersRound,
  Workflow,
} from 'lucide-react';

import type {
  ChangeEvent,
  ComponentType,
} from 'react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import AulaModal from '../aula/AulaModal';

import Toast, {
  type TipoToast,
} from '../shared/Toast';

import {
  useAuth,
} from '../../auth/AuthContext';

import useEntregaTareaEstudiante from '../../hooks/tareas/useEntregaTareaEstudiante';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

import type {
  ArchivoEntregaTarea,
  ContextoGrupoEntregaTarea,
  EstadoEntregaTarea,
} from '../../types/tareas/entregas.types';

import type {
  TareaCurso,
  TipoTarea,
} from '../../types/tareas/tareas.types';

type TipoVisual = {
  titulo:
    string;

  descripcion:
    string;

  accion:
    string;

  icono:
    ComponentType<{
      size?: number;
    }>;
};

const visual:
  Record<
    TipoTarea,
    TipoVisual
  > = {
    ENTREGA_ARCHIVOS: {
      titulo:
        'Entrega de archivos',

      descripcion:
        'Adjunta los documentos o evidencias solicitadas por el docente.',

      accion:
        'Subir archivos',

      icono:
        Files,
    },

    RESPUESTA_ESCRITA: {
      titulo:
        'Respuesta escrita',

      descripcion:
        'Desarrolla tu respuesta directamente dentro de IusAcademy.',

      accion:
        'Escribir respuesta',

      icono:
        FilePenLine,
    },

    DOCUMENTO_COLABORATIVO: {
      titulo:
        'Documento colaborativo',

      descripcion:
        'Tu equipo construirá un documento compartido con seguimiento de autoría.',

      accion:
        'Abrir documento',

      icono:
        Workflow,
    },

    REDACCION_JURIDICA: {
      titulo:
        'Redacción jurídica',

      descripcion:
        'Redacta el documento jurídico siguiendo la estructura y consignas definidas.',

      accion:
        'Iniciar redacción',

      icono:
        Scale,
    },

    EXPOSICION: {
      titulo:
        'Exposición',

      descripcion:
        'Prepara la presentación y el material de apoyo solicitado.',

      accion:
        'Subir presentación',

      icono:
        Presentation,
    },

    CASO_PRACTICO: {
      titulo:
        'Caso práctico',

      descripcion:
        'Analiza el caso y desarrolla una respuesta jurídicamente fundamentada.',

      accion:
        'Resolver caso',

      icono:
        BookOpenCheck,
    },

    MIXTA: {
      titulo:
        'Actividad mixta',

      descripcion:
        'Completa cada uno de los componentes configurados por el docente.',

      accion:
        'Comenzar actividad',

      icono:
        ListChecks,
    },

    PRESENCIAL: {
      titulo:
        'Actividad presencial',

      descripcion:
        'Esta actividad se desarrolla principalmente en aula y será registrada por el docente.',

      accion:
        'Sin entrega digital',

      icono:
        CheckCircle2,
    },
  };

const nombresEstado:
  Record<
    EstadoEntregaTarea,
    string
  > = {
    BORRADOR:
      'Borrador',

    ENTREGADA:
      'Entregada',

    TARDIA:
      'Entregada con retraso',

    BLOQUEADA:
      'Bloqueada',

    ANULADA:
      'Anulada',
  };

type Props = {
  tarea:
    TareaCurso;

  disponible:
    boolean;

  tardia:
    boolean;

  onContextoGrupo?:
    (
      contexto:
        ContextoGrupoEntregaTarea | null,
    ) => void;
};

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

function extension(
  nombre:
    string,
) {
  return (
    nombre
      .split(
        '.',
      )
      .pop()
      ?.toLowerCase() ??
    ''
  );
}

function tamanio(
  bytes:
    number,
) {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 *
      1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`;
}

function fecha(
  valor?:
    string | null,
) {
  if (!valor) {
    return '—';
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
    return '—';
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
    objeto,
  );
}

function esImagen(
  archivo:
    ArchivoEntregaTarea,
) {
  return (
    archivo.mimeType.startsWith(
      'image/',
    ) ||
    [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'bmp',
    ].includes(
      archivo.extension.toLowerCase(),
    )
  );
}

function esPdf(
  archivo:
    ArchivoEntregaTarea,
) {
  return (
    archivo.mimeType ===
      'application/pdf' ||
    archivo.extension.toLowerCase() ===
      'pdf'
  );
}

function nombreTipoArchivo(
  archivo:
    ArchivoEntregaTarea,
) {
  if (
    esImagen(
      archivo,
    )
  ) {
    return 'Imagen';
  }

  if (
    esPdf(
      archivo,
    )
  ) {
    return 'Documento PDF';
  }

  if (
    [
      'doc',
      'docx',
    ].includes(
      archivo.extension.toLowerCase(),
    )
  ) {
    return 'Documento Word';
  }

  return archivo.extension
    ? archivo.extension.toUpperCase()
    : 'Archivo';
}

export default function ExperienciaTareaEstudiante({
  tarea,
  disponible,
  tardia,
  onContextoGrupo,
}: Props) {
  const {
    accessToken,
  } =
    useAuth();

  const configuracion =
    visual[
      tarea.tipo
    ];

  const Icono =
    configuracion.icono;

  const entregaApi =
    useEntregaTareaEstudiante({
      tarea,
    });

  useEffect(
    () => {
      onContextoGrupo?.(
        entregaApi.contextoGrupo,
      );
    },
    [
      entregaApi.contextoGrupo,
      onContextoGrupo,
    ],
  );

  const [
    modalEntrega,
    setModalEntrega,
  ] =
    useState(
      false,
    );

  const [
    archivoDetalle,
    setArchivoDetalle,
  ] =
    useState<ArchivoEntregaTarea | null>(
      null,
    );

  const [
    urlVistaPrevia,
    setUrlVistaPrevia,
  ] =
    useState<string | null>(
      null,
    );

  const [
    cargandoVistaPrevia,
    setCargandoVistaPrevia,
  ] =
    useState(
      false,
    );

  const [
    errorVistaPrevia,
    setErrorVistaPrevia,
  ] =
    useState<string | null>(
      null,
    );

  const [
    contenido,
    setContenido,
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
        'informacion',

      titulo:
        '',
    });

  const usaArchivos =
    tarea.capacidades.includes(
      'ARCHIVOS',
    ) ||
    tarea.tipo ===
      'ENTREGA_ARCHIVOS' ||
    tarea.tipo ===
      'EXPOSICION';

  const usaTexto =
    (
      tarea.capacidades.includes(
        'EDITOR_TEXTO',
      ) ||
      tarea.tipo ===
        'RESPUESTA_ESCRITA' ||
      tarea.tipo ===
        'REDACCION_JURIDICA' ||
      tarea.tipo ===
        'CASO_PRACTICO'
    ) &&
    tarea.tipo !==
      'DOCUMENTO_COLABORATIVO';

  const esColaborativa =
    tarea.tipo ===
      'DOCUMENTO_COLABORATIVO';

  const esPresencial =
    tarea.tipo ===
      'PRESENCIAL';

  const entregaEnviada =
    entregaApi.entrega?.estado ===
      'ENTREGADA' ||
    entregaApi.entrega?.estado ===
      'TARDIA';

  const borradorVacio =
    entregaApi.entrega?.estado ===
      'BORRADOR' &&
    !entregaApi.entrega.contenido?.trim() &&
    entregaApi.entrega.archivos.length ===
      0;

  const entregaVisible =
    borradorVacio
      ? null
      : entregaApi.entrega;

  const aceptar =
    useMemo(
      () =>
        tarea.extensionesPermitidas
          .map(
            (
              item,
            ) =>
              item.startsWith(
                '.',
              )
                ? item
                : `.${item}`,
          )
          .join(
            ',',
          ),
      [
        tarea.extensionesPermitidas,
      ],
    );

  useEffect(
    () => {
      setContenido(
        entregaApi.entrega?.contenido ??
        '',
      );
    },
    [
      entregaApi.entrega?.contenido,
      entregaApi.entrega?.id,
    ],
  );

  useEffect(
    () => {
      return () => {
        if (
          urlVistaPrevia
        ) {
          URL.revokeObjectURL(
            urlVistaPrevia,
          );
        }
      };
    },
    [
      urlVistaPrevia,
    ],
  );

  useEffect(
    () => {
      if (
        !modalEntrega ||
        !usaTexto ||
        !disponible ||
        !entregaApi.permisos.puedeModificar ||
        entregaApi.cargando ||
        entregaApi.procesando
      ) {
        return;
      }

      const contenidoServidor =
        entregaApi.entrega?.contenido ??
        '';

      if (
        contenido ===
        contenidoServidor
      ) {
        return;
      }

      const temporizador =
        window.setTimeout(
          () => {
            void entregaApi
              .autoguardar(
                contenido,
              )
              .catch(
                () =>
                  undefined,
              );
          },
          1000,
        );

      return () => {
        window.clearTimeout(
          temporizador,
        );
      };
    },
    [
      contenido,
      disponible,
      entregaApi.autoguardar,
      entregaApi.cargando,
      entregaApi.entrega?.contenido,
      entregaApi.permisos.puedeModificar,
      entregaApi.procesando,
      modalEntrega,
      usaTexto,
    ],
  );

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

  const seleccionar =
    (
      evento:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const nuevos =
        Array.from(
          evento.target.files ??
          [],
        );

      evento.currentTarget.value =
        '';

      if (
        nuevos.length ===
        0
      ) {
        return;
      }

      const maximoBytes =
        tarea.tamanioMaximoArchivoMb *
        1024 *
        1024;

      const permitidas =
        tarea.extensionesPermitidas.map(
          (
            item,
          ) =>
            item
              .replace(
                '.',
                '',
              )
              .toLowerCase(),
        );

      const invalidos =
        nuevos.filter(
          (
            archivo,
          ) =>
            !permitidas.includes(
              extension(
                archivo.name,
              ),
            ),
        );

      if (
        invalidos.length >
        0
      ) {
        mostrarToast(
          'advertencia',
          'Formato no permitido',
          `Solo puedes adjuntar: ${tarea.extensionesPermitidas.join(', ')}.`,
        );

        return;
      }

      const pesados =
        nuevos.filter(
          (
            archivo,
          ) =>
            archivo.size >
            maximoBytes,
        );

      if (
        pesados.length >
        0
      ) {
        mostrarToast(
          'advertencia',
          'Archivo demasiado grande',
          `Cada archivo puede pesar como máximo ${tarea.tamanioMaximoArchivoMb} MB.`,
        );

        return;
      }

      const existentes =
        entregaApi.entrega?.archivos.length ??
        0;

      const total =
        existentes +
        nuevos.length;

      if (
        total >
        tarea.maximoArchivos
      ) {
        mostrarToast(
          'advertencia',
          'Límite de archivos',
          `La tarea permite como máximo ${tarea.maximoArchivos} archivo(s).`,
        );

        return;
      }

      const subir =
        async () => {
          try {
            const preparada =
              await entregaApi.preparar(
                usaTexto
                  ? contenido
                  : undefined,
              );

            await entregaApi.subirArchivos(
              preparada.id,
              nuevos,
            );

            mostrarToast(
              'exito',
              'Borrador actualizado',
              nuevos.length ===
                1
                ? 'El archivo quedó guardado automáticamente.'
                : 'Los archivos quedaron guardados automáticamente.',
            );
          } catch (
            causa
          ) {
            mostrarToast(
              'error',
              'No se pudieron guardar los archivos',
              causa instanceof Error
                ? causa.message
                : undefined,
            );
          }
        };

      void subir();
    };

  const validarAntesDeGuardar =
    () => {
      if (
        tarea.exigirContenidoEditor &&
        usaTexto &&
        !contenido.trim()
      ) {
        mostrarToast(
          'advertencia',
          'Contenido obligatorio',
          'Debes completar la respuesta antes de entregar.',
        );

        return false;
      }

      const totalArchivos =
        entregaApi.entrega?.archivos.length ??
        0;

      if (
        tarea.exigirArchivo &&
        usaArchivos &&
        totalArchivos ===
          0
      ) {
        mostrarToast(
          'advertencia',
          'Archivo obligatorio',
          'Debes adjuntar al menos un archivo.',
        );

        return false;
      }

      return true;
    };

  const entregar =
    async () => {
      if (
        !validarAntesDeGuardar()
      ) {
        return;
      }

      try {
        const preparada =
          await entregaApi.preparar(
            usaTexto
              ? contenido
              : undefined,
          );

        const enviada =
          await entregaApi.enviar(
            preparada.id,
          );

        setModalEntrega(
          false,
        );

        mostrarToast(
          'exito',
          enviada.entregadaTarde
            ? 'Tarea entregada con retraso'
            : 'Tarea entregada',
          enviada.entregadaTarde
            ? 'La entrega quedó registrada y se aplicará la penalización configurada.'
            : 'Tu entrega quedó registrada correctamente.',
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo entregar la tarea',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const eliminarArchivoExistente =
    async (
      archivo:
        ArchivoEntregaTarea,
    ) => {
      try {
        await entregaApi.eliminarArchivo(
          archivo.id,
        );

        mostrarToast(
          'exito',
          'Archivo eliminado',
          `${archivo.nombreOriginal} fue retirado de la entrega.`,
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo eliminar',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const cerrarDetalleArchivo =
    () => {
      if (
        urlVistaPrevia
      ) {
        URL.revokeObjectURL(
          urlVistaPrevia,
        );
      }

      setUrlVistaPrevia(
        null,
      );

      setArchivoDetalle(
        null,
      );

      setErrorVistaPrevia(
        null,
      );

      setCargandoVistaPrevia(
        false,
      );
    };

  const abrirDetalleArchivo =
    async (
      archivo:
        ArchivoEntregaTarea,
    ) => {
      setArchivoDetalle(
        archivo,
      );

      setErrorVistaPrevia(
        null,
      );

      if (
        urlVistaPrevia
      ) {
        URL.revokeObjectURL(
          urlVistaPrevia,
        );

        setUrlVistaPrevia(
          null,
        );
      }

      if (
        !esImagen(
          archivo,
        ) &&
        !esPdf(
          archivo,
        )
      ) {
        return;
      }

      if (
        !accessToken
      ) {
        setErrorVistaPrevia(
          'Tu sesión terminó. Inicia sesión nuevamente.',
        );

        return;
      }

      setCargandoVistaPrevia(
        true,
      );

      try {
        const respuesta =
          await fetch(
            `${API_URL}/archivos/${archivo.id}/descargar`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        if (
          !respuesta.ok
        ) {
          const cuerpo =
            await respuesta
              .json()
              .catch(
                () =>
                  null,
              );

          const mensaje =
            cuerpo &&
            typeof cuerpo ===
              'object' &&
            'message' in
              cuerpo
              ? String(
                  (
                    cuerpo as {
                      message?:
                        string;
                    }
                  ).message ??
                  '',
                )
              : '';

          throw new Error(
            mensaje ||
            'No fue posible cargar la vista previa.',
          );
        }

        const blob =
          await respuesta.blob();

        setUrlVistaPrevia(
          URL.createObjectURL(
            blob,
          ),
        );
      } catch (
        causa
      ) {
        setErrorVistaPrevia(
          causa instanceof Error
            ? causa.message
            : 'No fue posible cargar la vista previa.',
        );
      } finally {
        setCargandoVistaPrevia(
          false,
        );
      }
    };

  const descargar =
    async (
      archivo:
        ArchivoEntregaTarea,
    ) => {
      try {
        await entregaApi.descargarArchivo(
          archivo,
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo descargar',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const cerrarModal =
    async () => {
      if (
        entregaApi.procesando ||
        entregaApi.guardandoAutomatico
      ) {
        return;
      }

      if (
        usaTexto &&
        entregaApi.permisos.puedeModificar
      ) {
        const contenidoServidor =
          entregaApi.entrega?.contenido ??
          '';

        if (
          contenido !==
          contenidoServidor
        ) {
          try {
            await entregaApi.autoguardar(
              contenido,
            );
          } catch (
            causa
          ) {
            mostrarToast(
              'error',
              'No se pudo guardar el borrador',
              causa instanceof Error
                ? causa.message
                : undefined,
            );

            return;
          }
        }
      }

      setModalEntrega(
        false,
      );
    };

  const abrirEntrega =
    () => {
      if (
        !disponible
      ) {
        mostrarToast(
          'advertencia',
          'La tarea no admite entregas ahora',
          'Revisa el contador para conocer el período habilitado.',
        );

        return;
      }

      if (
        !entregaApi.permisos.puedeModificar
      ) {
        mostrarToast(
          'informacion',
          'Entrega grupal',
          'La entrega oficial debe ser realizada por el representante del grupo.',
        );

        return;
      }

      setContenido(
        entregaApi.entrega?.contenido ??
        '',
      );

      setModalEntrega(
        true,
      );
    };

  const textoEstadoEntrega =
    entregaVisible
      ? nombresEstado[
          entregaVisible.estado
        ]
      : 'Pendiente';

  return (
    <section className="ete-experience">
      <header className="ete-experience__head">
        <span className="ete-experience__icon">
          <Icono
            size={22}
          />
        </span>

        <div>
          <small>
            Cómo realizarás esta tarea
          </small>

          <h3>
            {
              configuracion.titulo
            }
          </h3>

          <p>
            {
              configuracion.descripcion
            }
          </p>
        </div>
      </header>

      {tarea.componentes.length >
        0 && (
        <div className="ete-experience__components">
          {tarea.componentes.map(
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

                  {componente.obligatorio && (
                    <span>
                      Obligatorio
                    </span>
                  )}
                </div>

                <p>
                  {
                    componente.descripcion ||
                    'Componente configurado por el docente.'
                  }
                </p>
              </article>
            ),
          )}
        </div>
      )}

      {entregaApi.error && (
        <div className="ete-inline-error">
          <AlertTriangle
            size={17}
          />

          <span>
            {
              entregaApi.error
            }
          </span>
        </div>
      )}

      {entregaApi.cargando ? (
        <div className="ete-loading">
          <Loader2
            size={20}
          />

          <span>
            Consultando tu entrega…
          </span>
        </div>
      ) : entregaApi.requiereEquipoAfinidad ? (
        <section className="ete-group-required">
          <UsersRound
            size={22}
          />

          <div>
            <small>
              Trabajo por afinidad
            </small>

            <strong>
              Primero debes formar o integrar un equipo
            </strong>

            <p>
              La tarea necesita un equipo por afinidad válido antes de habilitar la entrega. Una vez conformado el equipo, esta misma pantalla mostrará la entrega grupal oficial.
            </p>
          </div>
        </section>
      ) : esPresencial ? (
        <section className="ete-delivery-card">
          <div className="ete-delivery-card__content">
            <span className="ete-delivery-card__icon">
              <CheckCircle2
                size={22}
              />
            </span>

            <div>
              <small>
                Registro de actividad
              </small>

              <strong>
                No requiere una entrega digital
              </strong>

              <p>
                El docente registrará la evidencia o evaluación correspondiente a la actividad presencial.
              </p>
            </div>
          </div>
        </section>
      ) : esColaborativa ? (
        <section className="ete-delivery-card">
          <div className="ete-delivery-card__content">
            <span className="ete-delivery-card__icon">
              <Workflow
                size={22}
              />
            </span>

            <div>
              <small>
                Documento colaborativo
              </small>

              <strong>
                Editor colaborativo reservado para la siguiente etapa
              </strong>

              <p>
                Esta experiencia no utiliza una entrega de texto genérica porque necesita autoría por fragmentos, versiones y seguimiento de contribuciones.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section
            className={`ete-delivery-card ${
              entregaEnviada
                ? 'is-delivered'
                : ''
            }`}
          >
            <div className="ete-delivery-card__content">
              <span className="ete-delivery-card__icon">
                {entregaEnviada ? (
                  <CheckCircle2
                    size={22}
                  />
                ) : (
                  <Upload
                    size={22}
                  />
                )}
              </span>

              <div>
                <small>
                  Mi entrega
                </small>

                <strong>
                  {
                    textoEstadoEntrega
                  }
                </strong>

                <p>
                  {entregaVisible?.enviadaEn
                    ? `Registrada el ${fecha(
                        entregaVisible.enviadaEn,
                      )}.`
                    : entregaApi.permisos.puedeModificar
                      ? 'Aún no realizaste la entrega oficial.'
                      : 'La entrega pertenece al grupo y debe ser registrada por el representante.'}
                </p>
              </div>
            </div>

            {entregaApi.permisos.puedeModificar && (
              <button
                type="button"
                className="ete-delivery-card__action"
                disabled={
                  !disponible ||
                  entregaApi.procesando ||
                  (
                    entregaEnviada &&
                    !tarea.permitirEditarEntrega
                  )
                }
                onClick={
                  abrirEntrega
                }
              >
                {entregaEnviada ? (
                  <Pencil
                    size={16}
                  />
                ) : (
                  <Upload
                    size={16}
                  />
                )}

                {entregaEnviada
                  ? 'Editar entrega'
                  : configuracion.accion}
              </button>
            )}
          </section>

          {entregaVisible && (
            <section className="ete-current">
              <div className="ete-current__head">
                <div>
                  <small>
                    Entrega registrada
                  </small>

                  <strong>
                    {
                      nombresEstado[
                        entregaVisible.estado
                      ]
                    }
                  </strong>
                </div>

                {entregaVisible.entregadaTarde && (
                  <span className="ete-current__late">
                    <Clock3
                      size={13}
                    />
                    Con retraso
                  </span>
                )}
              </div>

              <div className="ete-current__meta">
                <span>
                  Enviada:
                  {' '}
                  <strong>
                    {fecha(
                      entregaVisible.enviadaEn,
                    )}
                  </strong>
                </span>

                {entregaVisible.entregadaTarde && (
                  <>
                    <span>
                      Retraso:
                      {' '}
                      <strong>
                        {
                          entregaVisible.minutosRetraso
                        }
                        {' '}
                        min
                      </strong>
                    </span>

                    <span>
                      Descuento:
                      {' '}
                      <strong>
                        {
                          Number(
                            entregaVisible.descuentoCalculado,
                          )
                        }
                      </strong>
                    </span>
                  </>
                )}

                {entregaVisible.autorEntrega && (
                  <span>
                    Registró:
                    {' '}
                    <strong>
                      {
                        entregaVisible.autorEntrega.nombres
                      }
                      {' '}
                      {
                        entregaVisible.autorEntrega.apellidoPaterno
                      }
                    </strong>
                  </span>
                )}
              </div>

              {usaTexto &&
                entregaVisible.contenido && (
                <div className="ete-current__text">
                  <small>
                    Respuesta
                  </small>

                  <p>
                    {
                      entregaVisible.contenido
                    }
                  </p>
                </div>
              )}

              {entregaVisible.archivos.length >
                0 && (
                <div className="ete-current__files">
                  {entregaVisible.archivos.map(
                    (
                      archivo,
                    ) => (
                      <article
                        key={
                          archivo.id
                        }
                      >
                        <Files
                          size={17}
                        />

                        <div>
                          <strong>
                            {
                              archivo.nombreOriginal
                            }
                          </strong>

                          <small>
                            {archivo.extension.toUpperCase()}
                            {' · '}
                            {
                              tamanio(
                                archivo.tamanioBytes,
                              )
                            }
                          </small>
                        </div>

                        <div className="ete-current__file-actions">
                          <button
                            type="button"
                            className="ete-file-detail"
                            title="Ver detalles"
                            aria-label={`Ver detalles de ${archivo.nombreOriginal}`}
                            onClick={() =>
                              void abrirDetalleArchivo(
                                archivo,
                              )
                            }
                          >
                            <Eye
                              size={14}
                            />
                          </button>

                          {archivo.permiteDescarga && (
                            <button
                              type="button"
                              title="Descargar"
                              aria-label={`Descargar ${archivo.nombreOriginal}`}
                              onClick={() =>
                                void descargar(
                                  archivo,
                                )
                              }
                            >
                              <Download
                                size={14}
                              />
                            </button>
                          )}
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}

              {entregaEnviada &&
                tarea.permitirEditarEntrega &&
                !disponible && (
                <div className="ete-current__locked">
                  <ShieldCheck
                    size={15}
                  />
                  La tarea permite edición, pero el período de entrega ya terminó.
                </div>
              )}
            </section>
          )}
        </>
      )}

      <AulaModal
        abierto={
          modalEntrega
        }
        ancho="amplio"
        titulo={
          entregaEnviada
            ? 'Editar entrega'
            : configuracion.titulo
        }
        etiqueta="Mi entrega"
        descripcion={
          entregaEnviada
            ? 'Actualiza la evidencia y confirma nuevamente para registrar los cambios.'
            : 'Completa los requisitos y confirma la entrega cuando esté lista.'
        }
        icono={
          entregaEnviada
            ? Pencil
            : Icono
        }
        bloqueado={
          entregaApi.procesando ||
          entregaApi.guardandoAutomatico
        }
        onCerrar={() =>
          void cerrarModal()
        }
        footer={
          <div className="ete-modal-footer">
            <button
              type="button"
              className="ete-secondary"
              disabled={
                entregaApi.procesando ||
                entregaApi.guardandoAutomatico
              }
              onClick={() =>
                void cerrarModal()
              }
            >
              Cerrar
            </button>

            <button
              type="button"
              className="ete-primary"
              disabled={
                entregaApi.procesando ||
                entregaApi.guardandoAutomatico
              }
              onClick={() =>
                void entregar()
              }
            >
              {entregaApi.procesando ? (
                <Loader2
                  size={15}
                  className="ete-spin"
                />
              ) : (
                <Send
                  size={15}
                />
              )}

              {entregaEnviada
                ? 'Actualizar entrega'
                : tardia
                  ? 'Entregar con retraso'
                  : 'Entregar tarea'}
            </button>
          </div>
        }
      >
        <div className="ete-editor">
          <div className="ete-autosave">
            {entregaApi.guardandoAutomatico ||
            entregaApi.procesando ? (
              <>
                <Loader2
                  size={15}
                  className="ete-spin"
                />

                <div>
                  <strong>
                    Guardando borrador…
                  </strong>

                  <p>
                    Tus cambios se están almacenando automáticamente.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2
                  size={15}
                />

                <div>
                  <strong>
                    Guardado automático activado
                  </strong>

                  <p>
                    Los archivos se guardan al seleccionarlos y el texto se guarda automáticamente mientras escribes.
                  </p>
                </div>
              </>
            )}
          </div>

          {tardia && (
            <div className="ete-editor__warning">
              <AlertTriangle
                size={16}
              />

              <div>
                <strong>
                  Estás entregando fuera de la fecha límite
                </strong>

                <p>
                  El backend calculará automáticamente el retraso y la penalización configurada por el docente.
                </p>
              </div>
            </div>
          )}

          {usaTexto && (
            <label className="ete-field">
              <span>
                {tarea.tipo ===
                'REDACCION_JURIDICA'
                  ? 'Redacción jurídica'
                  : tarea.tipo ===
                      'CASO_PRACTICO'
                    ? 'Desarrollo del caso'
                    : 'Respuesta'}
                {tarea.exigirContenidoEditor
                  ? ' *'
                  : ''}
              </span>

              <textarea
                value={
                  contenido
                }
                rows={12}
                maxLength={
                  50000
                }
                placeholder="Escribe aquí tu desarrollo..."
                onChange={(
                  evento,
                ) =>
                  setContenido(
                    evento.target.value,
                  )
                }
              />

              <small>
                {
                  contenido.length
                }
                {' '}
                / 50000 caracteres
              </small>
            </label>
          )}

          {usaArchivos && (
            <section className="ete-upload">
              <div className="ete-upload__title">
                <div>
                  <strong>
                    Archivos de la entrega
                    {tarea.exigirArchivo
                      ? ' *'
                      : ''}
                  </strong>

                  <small>
                    Hasta {tarea.maximoArchivos} archivo(s) · {tarea.tamanioMaximoArchivoMb} MB cada uno.
                  </small>
                </div>

                <span>
                  {
                    entregaApi.entrega?.archivos.length ??
                    0
                  }
                  /
                  {
                    tarea.maximoArchivos
                  }
                </span>
              </div>

              {entregaApi.entrega &&
                entregaApi.entrega.archivos.length >
                  0 && (
                <div className="ete-upload__existing">
                  {entregaApi.entrega.archivos.map(
                    (
                      archivo,
                    ) => (
                      <article
                        key={
                          archivo.id
                        }
                      >
                        <Files
                          size={17}
                        />

                        <div>
                          <strong>
                            {
                              archivo.nombreOriginal
                            }
                          </strong>

                          <small>
                            {archivo.extension.toUpperCase()}
                            {' · '}
                            {
                              tamanio(
                                archivo.tamanioBytes,
                              )
                            }
                          </small>
                        </div>

                        <div className="ete-upload__file-actions">
                          <button
                            type="button"
                            title="Ver detalles"
                            onClick={() =>
                              void abrirDetalleArchivo(
                                archivo,
                              )
                            }
                          >
                            <Eye
                              size={14}
                            />
                          </button>

                          {archivo.permiteDescarga && (
                            <button
                              type="button"
                              title="Descargar"
                              onClick={() =>
                                void descargar(
                                  archivo,
                                )
                              }
                            >
                              <Download
                                size={14}
                              />
                            </button>
                          )}

                          <button
                            type="button"
                            className="danger"
                            title="Eliminar"
                            disabled={
                              entregaApi.procesando
                            }
                            onClick={() =>
                              void eliminarArchivoExistente(
                                archivo,
                              )
                            }
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}

              <label className="ete-upload__selector">
                <Upload
                  size={22}
                />

                <div>
                  <strong>
                    Seleccionar archivos
                  </strong>

                  <span>
                    {tarea.extensionesPermitidas.join(
                      ', ',
                    )}
                  </span>
                </div>

                <input
                  type="file"
                  multiple={
                    tarea.maximoArchivos >
                    1
                  }
                  accept={
                    aceptar
                  }
                  disabled={
                    entregaApi.procesando ||
                    entregaApi.guardandoAutomatico
                  }
                  onChange={
                    seleccionar
                  }
                />
              </label>

              <div className="ete-upload__rules">
                <span>
                  Formatos:
                  {' '}
                  {
                    tarea.extensionesPermitidas.join(
                      ', ',
                    )
                  }
                </span>

                <span>
                  Máximo:
                  {' '}
                  {
                    tarea.maximoArchivos
                  }
                  {' '}
                  archivo(s)
                </span>

                <span>
                  Hasta
                  {' '}
                  {
                    tarea.tamanioMaximoArchivoMb
                  }
                  {' '}
                  MB c/u
                </span>
              </div>
            </section>
          )}

          {!usaTexto &&
            !usaArchivos && (
            <div className="ete-editor__info">
              <Info
                size={16}
              />

              <p>
                Esta actividad no tiene una evidencia digital estándar configurada.
              </p>
            </div>
          )}
        </div>
      </AulaModal>

      <AulaModal
        abierto={
          archivoDetalle !==
          null
        }
        ancho="amplio"
        titulo={
          archivoDetalle?.nombreOriginal ??
          'Detalle del archivo'
        }
        etiqueta="Archivo entregado"
        descripcion="Consulta la información y la vista previa del archivo guardado en tu entrega."
        icono={
          archivoDetalle &&
          esImagen(
            archivoDetalle,
          )
            ? ImageIcon
            : FileText
        }
        onCerrar={
          cerrarDetalleArchivo
        }
        footer={
          <div className="ete-file-modal__footer">
            <button
              type="button"
              className="ete-secondary"
              onClick={
                cerrarDetalleArchivo
              }
            >
              Cerrar
            </button>

            {archivoDetalle?.permiteDescarga && (
              <button
                type="button"
                className="ete-primary"
                onClick={() =>
                  void descargar(
                    archivoDetalle,
                  )
                }
              >
                <Download
                  size={15}
                />
                Descargar
              </button>
            )}
          </div>
        }
      >
        {archivoDetalle && (
          <div className="ete-file-modal">
            <div className="ete-file-modal__meta">
              <article>
                <small>
                  Tipo
                </small>

                <strong>
                  {
                    nombreTipoArchivo(
                      archivoDetalle,
                    )
                  }
                </strong>
              </article>

              <article>
                <small>
                  Extensión
                </small>

                <strong>
                  {
                    archivoDetalle.extension.toUpperCase()
                  }
                </strong>
              </article>

              <article>
                <small>
                  Tamaño
                </small>

                <strong>
                  {
                    tamanio(
                      archivoDetalle.tamanioBytes,
                    )
                  }
                </strong>
              </article>

              <article>
                <small>
                  Guardado
                </small>

                <strong>
                  {
                    fecha(
                      archivoDetalle.creadoEn,
                    )
                  }
                </strong>
              </article>
            </div>

            <div className="ete-file-modal__preview">
              {cargandoVistaPrevia ? (
                <div className="ete-file-modal__state">
                  <Loader2
                    size={23}
                    className="ete-spin"
                  />

                  <strong>
                    Cargando vista previa…
                  </strong>

                  <p>
                    Espera un momento mientras se recupera el archivo protegido.
                  </p>
                </div>
              ) : errorVistaPrevia ? (
                <div className="ete-file-modal__state ete-file-modal__state--error">
                  <AlertTriangle
                    size={22}
                  />

                  <strong>
                    No se pudo mostrar la vista previa
                  </strong>

                  <p>
                    {
                      errorVistaPrevia
                    }
                  </p>
                </div>
              ) : esImagen(
                  archivoDetalle,
                ) &&
                urlVistaPrevia ? (
                <img
                  src={
                    urlVistaPrevia
                  }
                  alt={
                    archivoDetalle.nombreOriginal
                  }
                />
              ) : esPdf(
                  archivoDetalle,
                ) &&
                urlVistaPrevia ? (
                <iframe
                  src={
                    urlVistaPrevia
                  }
                  title={`Vista previa de ${archivoDetalle.nombreOriginal}`}
                />
              ) : (
                <div className="ete-file-modal__state">
                  <FileText
                    size={26}
                  />

                  <strong>
                    Vista previa no disponible
                  </strong>

                  <p>
                    Este formato no puede visualizarse directamente dentro de IusAcademy. Puedes descargarlo para abrirlo con la aplicación correspondiente.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
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
    </section>
  );
}

const styles = `
  .ete-experience {
    display: grid;
    gap: 14px;

    padding:
      20px
      22px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      20px;

    background:
      var(--app-surface);

    box-shadow:
      var(--app-shadow-sm);
  }

  .ete-experience__head {
    display: grid;

    grid-template-columns:
      48px
      minmax(
        0,
        1fr
      );

    align-items: center;
    gap: 11px;
  }

  .ete-experience__icon {
    width: 48px;
    height: 48px;

    display: grid;
    place-items: center;

    border-radius:
      14px;

    color:
      var(
        --dte-color,
        var(--app-accent-dark)
      );

    background:
      var(
        --dte-fondo,
        var(--app-accent-soft)
      );
  }

  .ete-experience__head small {
    color:
      var(
        --dte-color,
        var(--app-accent-dark)
      );

    font-size:
      12px;

    font-weight:
      850;

    letter-spacing:
      .06em;

    text-transform:
      uppercase;
  }

  .ete-experience__head h3 {
    margin:
      2px
      0
      0;

    font-size:
      16px;
  }

  .ete-experience__head p {
    margin:
      3px
      0
      0;

    color:
      var(--app-text-muted);

    font-size:
      11.5px;
  }

  .ete-experience__components {
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

  .ete-experience__components article {
    min-width: 0;

    padding:
      10px
      11px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      11px;

    background:
      var(--app-surface-alt);
  }

  .ete-experience__components article > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .ete-experience__components strong {
    font-size:
      11.5px;
  }

  .ete-experience__components span {
    color:
      var(--app-success);

    font-size:
      7.5px;

    font-weight:
      850;
  }

  .ete-experience__components p {
    margin:
      4px
      0
      0;

    color:
      var(--app-text-muted);

    font-size:
      10.5px;

    line-height:
      1.45;
  }

  .ete-inline-error,
  .ete-loading,
  .ete-group-required {
    display: flex;
    align-items: center;
    gap: 9px;

    padding:
      11px
      12px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      12px;

    background:
      var(--app-surface-alt);
  }

  .ete-inline-error {
    border-color:
      var(--app-danger-border);

    color:
      var(--app-danger);

    background:
      var(--app-danger-bg);

    font-size:
      12.5px;
  }

  .ete-loading {
    color:
      var(--app-text-muted);

    font-size:
      12.5px;
  }

  .ete-loading svg,
  .ete-spin {
    animation:
      eteRotar
      .8s
      linear
      infinite;
  }

  .ete-group-required {
    align-items:
      flex-start;

    border-color:
      color-mix(
        in srgb,
        var(
          --dte-color,
          var(--app-accent)
        ) 28%,
        var(--app-border)
      );

    border-left:
      4px solid
      var(
        --dte-color,
        var(--app-accent)
      );
  }

  .ete-group-required > svg {
    flex:
      0
      0
      auto;

    color:
      var(
        --dte-color,
        var(--app-accent)
      );
  }

  .ete-group-required small,
  .ete-group-required strong {
    display: block;
  }

  .ete-group-required small {
    color:
      var(
        --dte-color,
        var(--app-accent)
      );

    font-size:
      12px;

    font-weight:
      850;

    text-transform:
      uppercase;
  }

  .ete-group-required strong {
    margin-top:
      2px;

    font-size:
      12px;
  }

  .ete-group-required p {
    margin:
      3px
      0
      0;

    color:
      var(--app-text-secondary);

    font-size:
      10.5px;

    line-height:
      1.45;
  }

  .ete-delivery-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;

    padding:
      14px
      15px;

    border:
      1px solid
      color-mix(
        in srgb,
        var(
          --dte-color,
          var(--app-accent)
        ) 28%,
        var(--app-border)
      );

    border-left:
      4px solid
      var(
        --dte-color,
        var(--app-accent)
      );

    border-radius:
      14px;

    background:
      color-mix(
        in srgb,
        var(
          --dte-fondo,
          var(--app-accent-soft)
        ) 52%,
        var(--app-surface)
      );
  }

  .ete-delivery-card.is-delivered {
    border-left-color:
      var(--app-success);
  }

  .ete-delivery-card__content {
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 11px;
  }

  .ete-delivery-card__icon {
    width: 44px;
    height: 44px;

    display: grid;
    place-items: center;

    flex:
      0
      0
      44px;

    border-radius:
      13px;

    color:
      var(
        --dte-color,
        var(--app-accent-dark)
      );

    background:
      var(--app-surface);
  }

  .ete-delivery-card.is-delivered
  .ete-delivery-card__icon {
    color:
      var(--app-success);

    background:
      var(--app-success-bg);
  }

  .ete-delivery-card__content small,
  .ete-delivery-card__content strong {
    display: block;
  }

  .ete-delivery-card__content small {
    color:
      var(
        --dte-color,
        var(--app-accent-dark)
      );

    font-size:
      12px;

    font-weight:
      850;

    text-transform:
      uppercase;
  }

  .ete-delivery-card__content strong {
    margin-top:
      2px;

    color:
      var(--app-text);

    font-size:
      12.5px;
  }

  .ete-delivery-card__content p {
    margin:
      3px
      0
      0;

    color:
      var(--app-text-secondary);

    font-size:
      10.5px;

    line-height:
      1.45;
  }

  .ete-delivery-card__action,
  .ete-primary,
  .ete-secondary {
    min-height:
      38px;

    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    gap:
      6px;

    padding:
      8px
      12px;

    border-radius:
      10px;

    font:
      inherit;

    font-size:
      12.5px;

    font-weight:
      850;

    cursor:
      pointer;
  }

  .ete-delivery-card__action,
  .ete-primary {
    border:
      1px solid
      var(
        --dte-color,
        var(--app-accent)
      );

    color:
      #fff;

    background:
      var(
        --dte-color,
        var(--app-accent)
      );
  }

  .ete-secondary {
    border:
      1px solid
      var(--app-border-strong);

    color:
      var(--app-text-secondary);

    background:
      var(--app-surface);
  }


  .ete-delivery-card__action:disabled,
  .ete-primary:disabled,
  .ete-secondary:disabled {
    opacity:
      .5;

    cursor:
      not-allowed;
  }

  .ete-current {
    display: grid;
    gap: 10px;

    padding:
      13px
      14px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      13px;

    background:
      var(--app-surface-alt);
  }

  .ete-current__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .ete-current__head small,
  .ete-current__head strong {
    display: block;
  }

  .ete-current__head small {
    color:
      var(--app-text-muted);

    font-size:
      12px;
  }

  .ete-current__head strong {
    margin-top:
      2px;

    font-size:
      12.5px;
  }

  .ete-current__late {
    display:
      inline-flex;

    align-items:
      center;

    gap:
      4px;

    padding:
      5px
      8px;

    border-radius:
      999px;

    color:
      var(--app-warning);

    background:
      var(--app-warning-bg);

    font-size:
      12px;

    font-weight:
      850;
  }

  .ete-current__meta {
    display: flex;
    flex-wrap: wrap;
    gap:
      6px
      14px;

    color:
      var(--app-text-muted);

    font-size:
      10.5px;
  }

  .ete-current__meta strong {
    color:
      var(--app-text-secondary);
  }

  .ete-current__text {
    padding:
      10px
      11px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      10px;

    background:
      var(--app-surface);
  }

  .ete-current__text small {
    color:
      var(
        --dte-color,
        var(--app-accent)
      );

    font-size:
      12px;

    font-weight:
      850;
  }

  .ete-current__text p {
    margin:
      5px
      0
      0;

    color:
      var(--app-text-secondary);

    white-space:
      pre-wrap;

    font-size:
      12.5px;

    line-height:
      1.5;
  }

  .ete-current__files,
  .ete-upload__existing,
  .ete-upload__local {
    display: grid;
    gap: 7px;
  }

  .ete-current__files article,
  .ete-upload__existing article,
  .ete-upload__local article {
    display: grid;

    grid-template-columns:
      30px
      minmax(
        0,
        1fr
      )
      auto;

    align-items:
      center;

    gap:
      8px;

    padding:
      8px
      9px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      10px;

    background:
      var(--app-surface);
  }

  .ete-current__files article > svg,
  .ete-upload__existing article > svg,
  .ete-upload__local article > svg {
    color:
      var(
        --dte-color,
        var(--app-accent)
      );
  }

  .ete-current__files article > div,
  .ete-upload__existing article > div,
  .ete-upload__local article > div {
    min-width:
      0;

    display:
      grid;

    gap:
      2px;
  }

  .ete-current__files strong,
  .ete-upload__existing strong,
  .ete-upload__local strong {
    overflow:
      hidden;

    font-size:
      10.5px;

    white-space:
      nowrap;

    text-overflow:
      ellipsis;
  }

  .ete-current__files small,
  .ete-upload__existing small,
  .ete-upload__local small {
    color:
      var(--app-text-muted);

    font-size:
      7.5px;
  }

  .ete-current__files button,
  .ete-upload__file-actions button,
  .ete-upload__local article > button {
    width:
      30px;

    height:
      30px;

    display:
      grid;

    place-items:
      center;

    padding:
      0;

    border:
      1px solid
      var(--app-border);

    border-radius:
      8px;

    color:
      var(
        --dte-color,
        var(--app-accent)
      );

    background:
      var(--app-surface-alt);

    cursor:
      pointer;
  }

  .ete-current__locked {
    display: flex;
    align-items: center;
    gap: 6px;

    color:
      var(--app-text-muted);

    font-size:
      12px;
  }

  .ete-modal-footer {
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  .ete-editor {
    display: grid;
    gap: 13px;
  }

  .ete-autosave {
    display:
      flex;

    align-items:
      flex-start;

    gap:
      8px;

    padding:
      10px
      11px;

    border:
      1px solid
      color-mix(
        in srgb,
        var(--app-success) 25%,
        var(--app-border)
      );

    border-radius:
      11px;

    color:
      var(--app-success);

    background:
      color-mix(
        in srgb,
        var(--app-success-bg) 72%,
        var(--app-surface)
      );
  }

  .ete-autosave > svg {
    flex:
      0
      0
      auto;

    margin-top:
      1px;
  }

  .ete-autosave strong {
    display:
      block;

    font-size:
      12.5px;
  }

  .ete-autosave p {
    margin:
      2px
      0
      0;

    color:
      var(--app-text-secondary);

    font-size:
      10.5px;

    line-height:
      1.45;
  }

  .ete-editor__warning,
  .ete-editor__info {
    display: flex;
    align-items: flex-start;
    gap: 8px;

    padding:
      10px
      11px;

    border:
      1px solid
      var(--app-warning-border);

    border-radius:
      11px;

    color:
      var(--app-warning);

    background:
      var(--app-warning-bg);
  }

  .ete-editor__warning strong {
    font-size:
      12.5px;
  }

  .ete-editor__warning p,
  .ete-editor__info p {
    margin:
      2px
      0
      0;

    color:
      var(--app-text-secondary);

    font-size:
      10.5px;

    line-height:
      1.45;
  }

  .ete-field {
    display: grid;
    gap: 6px;
  }

  .ete-field > span {
    color:
      var(--app-text-secondary);

    font-size:
      12.5px;

    font-weight:
      850;
  }

  .ete-field textarea {
    width: 100%;

    min-height:
      220px;

    box-sizing:
      border-box;

    resize:
      vertical;

    padding:
      11px
      12px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      12px;

    outline:
      none;

    color:
      var(--app-text);

    background:
      var(--app-surface-alt);

    font:
      inherit;

    font-size:
      12px;

    line-height:
      1.55;
  }

  .ete-field textarea:focus {
    border-color:
      var(
        --dte-color,
        var(--app-accent)
      );

    box-shadow:
      0 0 0 3px
      color-mix(
        in srgb,
        var(
          --dte-color,
          var(--app-accent)
        ) 12%,
        transparent
      );
  }

  .ete-field > small {
    justify-self:
      end;

    color:
      var(--app-text-muted);

    font-size:
      7.5px;
  }

  .ete-upload {
    display: grid;
    gap: 10px;
  }

  .ete-upload__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .ete-upload__title > div {
    display: grid;
    gap: 2px;
  }

  .ete-upload__title strong {
    font-size:
      11.5px;
  }

  .ete-upload__title small {
    color:
      var(--app-text-muted);

    font-size:
      12px;
  }

  .ete-upload__title > span {
    min-width:
      34px;

    padding:
      5px
      8px;

    border-radius:
      999px;

    color:
      var(
        --dte-color,
        var(--app-accent)
      );

    background:
      var(
        --dte-fondo,
        var(--app-accent-soft)
      );

    font-size:
      12px;

    font-weight:
      850;

    text-align:
      center;
  }

  .ete-upload__selector {
    min-height:
      104px;

    display: grid;
    place-items: center;
    align-content: center;
    gap: 6px;

    padding:
      14px;

    border:
      1px dashed
      var(
        --dte-color,
        var(--app-accent)
      );

    border-radius:
      13px;

    color:
      var(
        --dte-color,
        var(--app-accent)
      );

    background:
      color-mix(
        in srgb,
        var(
          --dte-fondo,
          var(--app-accent-soft)
        ) 45%,
        var(--app-surface)
      );

    text-align:
      center;

    cursor:
      pointer;
  }

  .ete-upload__selector > div {
    display: grid;
    gap: 2px;
  }

  .ete-upload__selector strong {
    font-size:
      12px;
  }

  .ete-upload__selector span {
    color:
      var(--app-text-muted);

    font-size:
      12px;
  }

  .ete-upload__selector input {
    display:
      none;
  }

  .ete-upload__rules {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .ete-upload__rules span {
    padding:
      5px
      8px;

    border-radius:
      999px;

    color:
      var(--app-text-muted);

    background:
      var(--app-surface-alt);

    font-size:
      7.5px;
  }

  .ete-upload__file-actions {
    display: flex !important;
    align-items: center;
    gap: 5px;
  }

  .ete-upload__file-actions button.danger,
  .ete-upload__local article > button.danger {
    color:
      var(--app-danger);

    border-color:
      var(--app-danger-border);

    background:
      var(--app-danger-bg);
  }

  .ete-current__file-actions,
  .ete-file-modal__footer {
    display:
      flex;

    align-items:
      center;

    gap:
      6px;
  }

  .ete-current__file-actions button.ete-file-detail {
    color:
      var(
        --dte-color,
        var(--app-accent)
      );

    background:
      color-mix(
        in srgb,
        var(
          --dte-fondo,
          var(--app-accent-soft)
        ) 65%,
        var(--app-surface)
      );
  }

  .ete-file-modal {
    display:
      grid;

    gap:
      12px;
  }

  .ete-file-modal__meta {
    display:
      grid;

    grid-template-columns:
      repeat(
        4,
        minmax(
          0,
          1fr
        )
      );

    gap:
      8px;
  }

  .ete-file-modal__meta article {
    padding:
      10px
      11px;

    border:
      1px solid
      var(--app-border);

    border-radius:
      11px;

    background:
      var(--app-surface-alt);
  }

  .ete-file-modal__meta small,
  .ete-file-modal__meta strong {
    display:
      block;
  }

  .ete-file-modal__meta small {
    color:
      var(--app-text-muted);

    font-size:
      10px;
  }

  .ete-file-modal__meta strong {
    margin-top:
      3px;

    overflow:
      hidden;

    color:
      var(--app-text-secondary);

    font-size:
      11.5px;

    white-space:
      nowrap;

    text-overflow:
      ellipsis;
  }

  .ete-file-modal__preview {
    min-height:
      390px;

    max-height:
      58vh;

    display:
      grid;

    place-items:
      center;

    overflow:
      hidden;

    border:
      1px solid
      var(--app-border);

    border-radius:
      13px;

    background:
      var(--app-surface-alt);
  }

  .ete-file-modal__preview img {
    width:
      100%;

    height:
      100%;

    max-height:
      58vh;

    object-fit:
      contain;

    background:
      var(--app-surface);
  }

  .ete-file-modal__preview iframe {
    width:
      100%;

    height:
      58vh;

    min-height:
      390px;

    border:
      0;

    background:
      #fff;
  }

  .ete-file-modal__state {
    max-width:
      420px;

    display:
      grid;

    justify-items:
      center;

    gap:
      6px;

    padding:
      28px;

    color:
      var(--app-text-muted);

    text-align:
      center;
  }

  .ete-file-modal__state > svg {
    color:
      var(
        --dte-color,
        var(--app-accent)
      );
  }

  .ete-file-modal__state strong {
    color:
      var(--app-text);

    font-size:
      12px;
  }

  .ete-file-modal__state p {
    margin:
      0;

    color:
      var(--app-text-muted);

    font-size:
      10.5px;

    line-height:
      1.5;
  }

  .ete-file-modal__state--error > svg {
    color:
      var(--app-danger);
  }

  @media (
    max-width:
      700px
  ) {
    .ete-file-modal__meta {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .ete-file-modal__preview,
    .ete-file-modal__preview iframe {
      min-height:
        320px;
    }
  }

  @keyframes eteRotar {
    to {
      transform:
        rotate(
          360deg
        );
    }
  }

  @media (
    max-width:
      700px
  ) {
    .ete-experience__components {
      grid-template-columns:
        1fr;
    }

    .ete-delivery-card {
      align-items:
        stretch;

      flex-direction:
        column;
    }

    .ete-delivery-card__action {
      width:
        100%;
    }

    .ete-modal-footer {
      align-items:
        stretch;

      flex-direction:
        column;
    }

    .ete-modal-footer button {
      width:
        100%;
    }
  }
`;