import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Save,
  UsersRound,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../auth/AuthContext';

import AulaEmptyState from '../../../components/aula/AulaEmptyState';
import AulaLoadingOverlay from '../../../components/aula/AulaLoadingOverlay';
import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import useRevisionEntregaTareaDocente from '../../../hooks/tareas/useRevisionEntregaTareaDocente';

import type {
  ArchivoEntregaDocente,
} from '../../../types/tareas/tarea-docente-seguimiento.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function fecha(
  valor?:
    string | null,
) {
  if (!valor) {
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
    new Date(
      valor,
    ),
  );
}

function bytes(
  valor:
    number,
) {
  if (
    valor <
    1024 *
      1024
  ) {
    return `${(
      valor /
      1024
    ).toFixed(1)} KB`;
  }

  return `${(
    valor /
    1024 /
    1024
  ).toFixed(2)} MB`;
}

function esImagen(
  archivo:
    ArchivoEntregaDocente,
) {
  return archivo.mimeType.startsWith(
    'image/',
  );
}

function esPdf(
  archivo:
    ArchivoEntregaDocente,
) {
  return (
    archivo.mimeType ===
      'application/pdf' ||
    archivo.extension
      .toLowerCase() ===
      'pdf'
  );
}

function normalizarNumero(
  valor:
    string,
  permiteNegativo =
    false,
) {
  let resultado =
    valor
      .replace(
        ',',
        '.',
      )
      .replace(
        permiteNegativo
          ? /[^0-9.-]/g
          : /[^0-9.]/g,
        '',
      );

  if (
    permiteNegativo
  ) {
    resultado =
      resultado.replace(
        /(?!^)-/g,
        '',
      );
  } else {
    resultado =
      resultado.replace(
        /-/g,
        '',
      );
  }

  const partes =
    resultado.split(
      '.',
    );

  if (
    partes.length >
    2
  ) {
    resultado =
      `${partes.shift()}.${partes.join('')}`;
  }

  return resultado;
}

export default function RevisarEntregaTarea() {
  const {
    cursoId:
      cursoIdParam,
    tareaId:
      tareaIdParam,
    entregaId:
      entregaIdParam,
  } =
    useParams();

  const cursoId =
    Number(
      cursoIdParam,
    );

  const tareaId =
    Number(
      tareaIdParam,
    );

  const entregaId =
    Number(
      entregaIdParam,
    );

  const navigate =
    useNavigate();

  const {
    accessToken,
  } =
    useAuth();

  const revision =
    useRevisionEntregaTareaDocente(
      cursoId,
      tareaId,
      entregaId,
    );

  const [
    notaBase,
    setNotaBase,
  ] =
    useState(
      '',
    );

  const [
    retroalimentacion,
    setRetroalimentacion,
  ] =
    useState(
      '',
    );

  const [
    ajustes,
    setAjustes,
  ] =
    useState<
      Record<
        number,
        string
      >
    >(
      {},
    );

  const [
    archivoActivoId,
    setArchivoActivoId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    urls,
    setUrls,
  ] =
    useState<
      Record<
        number,
        string
      >
    >(
      {},
    );

  const [
    cargandoVista,
    setCargandoVista,
  ] =
    useState<number | null>(
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

  const datos =
    revision.datos;

  const archivosVista =
    useMemo(
      () =>
        (
          datos?.entrega.archivos ??
          []
        ).filter(
          (
            archivo,
          ) =>
            esImagen(
              archivo,
            ) ||
            esPdf(
              archivo,
            ),
        ),
      [
        datos?.entrega.archivos,
      ],
    );

  const archivoActivo =
    archivosVista.find(
      (
        archivo,
      ) =>
        archivo.id ===
        archivoActivoId,
    ) ??
    archivosVista[0] ??
    null;

  const indiceArchivoActivo =
    archivoActivo
      ? archivosVista.findIndex(
          (
            archivo,
          ) =>
            archivo.id ===
            archivoActivo.id,
        )
      : -1;

  const puedeIrAnterior =
    indiceArchivoActivo >
    0;

  const puedeIrSiguiente =
    indiceArchivoActivo >=
      0 &&
    indiceArchivoActivo <
      archivosVista.length -
        1;

  const irArchivoAnterior =
    () => {
      if (
        !puedeIrAnterior
      ) {
        return;
      }

      setArchivoActivoId(
        archivosVista[
          indiceArchivoActivo -
            1
        ].id,
      );
    };

  const irArchivoSiguiente =
    () => {
      if (
        !puedeIrSiguiente
      ) {
        return;
      }

      setArchivoActivoId(
        archivosVista[
          indiceArchivoActivo +
            1
        ].id,
      );
    };

  useEffect(
    () => {
      if (
        !datos
      ) {
        return;
      }

      const calificacion =
        datos.entrega.calificaciones[0] ??
        null;

      setNotaBase(
        calificacion
          ? String(
              calificacion.notaBase,
            )
          : '',
      );

      setRetroalimentacion(
        calificacion?.retroalimentacion ??
        '',
      );

      const nuevos:
        Record<
          number,
          string
        > =
        {};

      if (
        datos.sujeto.tipo ===
        'GRUPO'
      ) {
        for (
          const integrante
          of datos.sujeto.integrantes
        ) {
          const nota =
            datos.entrega.calificaciones.find(
              (
                item,
              ) =>
                item.estudianteId ===
                integrante.estudiante.id,
            );

          nuevos[
            integrante.estudiante.id
          ] =
            String(
              nota?.ajusteIndividual ??
              0,
            );
        }
      }

      setAjustes(
        nuevos,
      );

      setArchivoActivoId(
        archivosVista[0]?.id ??
        null,
      );
    },
    [
      archivosVista,
      datos,
    ],
  );

  useEffect(
    () => {
      if (
        !accessToken ||
        archivosVista.length ===
          0
      ) {
        return;
      }

      let cancelado =
        false;

      const cargarArchivos =
        async () => {
          for (
            const archivo
            of archivosVista
          ) {
            if (
              urls[
                archivo.id
              ]
            ) {
              continue;
            }

            setCargandoVista(
              archivo.id,
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
                !respuesta.ok ||
                cancelado
              ) {
                continue;
              }

              const blob =
                await respuesta.blob();

              if (
                cancelado
              ) {
                return;
              }

              const url =
                URL.createObjectURL(
                  blob,
                );

              setUrls(
                (
                  actuales,
                ) => ({
                  ...actuales,

                  [
                    archivo.id
                  ]:
                    url,
                }),
              );
            } finally {
              if (
                !cancelado
              ) {
                setCargandoVista(
                  null,
                );
              }
            }
          }
        };

      void cargarArchivos();

      return () => {
        cancelado =
          true;
      };
    },
    [
      accessToken,
      archivosVista,
      urls,
    ],
  );

  useEffect(
    () => () => {
      Object.values(
        urls,
      ).forEach(
        (
          url,
        ) =>
          URL.revokeObjectURL(
            url,
          ),
      );
    },
    [
      urls,
    ],
  );

  const volver =
    () =>
      navigate(
        `/docente/cursos/${cursoId}/tareas/${tareaId}`,
      );

  const descargar =
    async (
      archivo:
        ArchivoEntregaDocente,
    ) => {
      if (
        !accessToken
      ) {
        return;
      }

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
          throw new Error(
            'No fue posible descargar el archivo.',
          );
        }

        const blob =
          await respuesta.blob();

        const url =
          URL.createObjectURL(
            blob,
          );

        const enlace =
          document.createElement(
            'a',
          );

        enlace.href =
          url;

        enlace.download =
          archivo.nombreOriginal;

        enlace.click();

        URL.revokeObjectURL(
          url,
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

  const guardar =
    async () => {
      if (
        !datos
      ) {
        return;
      }

      const nota =
        Number(
          notaBase,
        );

      if (
        notaBase.trim() ===
          '' ||
        !Number.isFinite(
          nota,
        ) ||
        nota <
          0 ||
        nota >
          datos.tarea.puntajeMaximo
      ) {
        mostrarToast(
          'advertencia',
          'Revisa la nota',
          `Ingresa un valor entre 0 y ${datos.tarea.puntajeMaximo}.`,
        );

        return;
      }

      const ajustesIndividuales =
        datos.tarea.modalidadNota ===
          'GRUPAL_E_INDIVIDUAL' &&
        datos.sujeto.tipo ===
          'GRUPO'
          ? datos.sujeto.integrantes.map(
              (
                integrante,
              ) => ({
                estudianteId:
                  integrante.estudiante.id,

                ajuste:
                  Number(
                    ajustes[
                      integrante.estudiante.id
                    ] ??
                    0,
                  ),
              }),
            )
          : undefined;

      try {
        await revision.calificar({
          notaBase:
            nota,

          ajustesIndividuales,

          retroalimentacion,
        });

        mostrarToast(
          'exito',
          'Calificación guardada',
          datos.sujeto.tipo ===
          'GRUPO'
            ? 'La calificación se actualizó para los integrantes correspondientes.'
            : 'La calificación del estudiante se actualizó correctamente.',
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se pudo guardar',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  if (
    !Number.isFinite(
      cursoId,
    ) ||
    !Number.isFinite(
      tareaId,
    ) ||
    !Number.isFinite(
      entregaId,
    )
  ) {
    return (
      <AulaEmptyState
        titulo="Ruta inválida"
        descripcion="No fue posible identificar la entrega que deseas revisar."
        icono={AlertTriangle}
      />
    );
  }

  if (
    revision.cargando
  ) {
    return (
      <AulaLoadingOverlay
        visible
        texto="Cargando entrega..."
      />
    );
  }

  if (
    revision.error ||
    !datos
  ) {
    return (
      <div className="rtd-error-page">
        <AulaEmptyState
          titulo="No fue posible abrir la entrega"
          descripcion={
            revision.error ||
            'Actualiza la página e inténtalo nuevamente.'
          }
          icono={AlertTriangle}
        />

        <button
          type="button"
          className="rtd-btn rtd-btn--secondary"
          onClick={
            volver
          }
        >
          <ArrowLeft
            size={15}
          />

          Volver
        </button>

        <style>
          {styles}
        </style>
      </div>
    );
  }

  const descuento =
    datos.entrega.descuentoCalculado;

  const notaNumerica =
    Number(
      notaBase ||
      0,
    );

  const modalidadMixta =
    datos.tarea.modalidadNota ===
    'GRUPAL_E_INDIVIDUAL';

  const finalGrupal =
    Math.max(
      0,
      Math.min(
        datos.tarea.puntajeMaximo,
        notaNumerica -
        descuento,
      ),
    );

  return (
    <section className="rtd-page">
      <header className="rtd-header">
        <div className="rtd-header__left">
          <button
            type="button"
            className="rtd-back"
            onClick={
              volver
            }
          >
            <ArrowLeft
              size={16}
            />
          </button>

          <div>
            <span className="rtd-eyebrow">
              Revisión de entrega
            </span>

            <h1>
              {
                datos.sujeto.nombre
              }
            </h1>

            <p>
              {
                datos.tarea.titulo
              }
            </p>
          </div>
        </div>

        <div className="rtd-header__chips">
          <span className="rtd-chip">
            {datos.sujeto.tipo ===
            'GRUPO' ? (
              <UsersRound
                size={13}
              />
            ) : (
              <FileText
                size={13}
              />
            )}

            {datos.sujeto.tipo ===
            'GRUPO'
              ? 'Entrega grupal'
              : 'Entrega individual'}
          </span>

          <span className="rtd-chip rtd-chip--success">
            <CheckCircle2
              size={13}
            />
            {
              datos.entrega.estado
            }
          </span>
        </div>
      </header>

      {datos.sujeto.tipo ===
        'GRUPO' && (
        <section className="rtd-group-card">
          <header>
            <div>
              <span className="rtd-section-eyebrow">
                Integrantes del grupo
              </span>

              <h2>
                {
                  datos.sujeto.nombre
                }
              </h2>

              <p>
                {datos.sujeto.integrantes.length}{' '}
                {datos.sujeto.integrantes.length ===
                1
                  ? 'estudiante'
                  : 'estudiantes'}
                {' · '}
                {
                  datos.sujeto.origen ===
                  'PLATAFORMA'
                    ? 'Grupo de plataforma'
                    : 'Equipo por afinidad'
                }
              </p>
            </div>

            {datos.sujeto.representante && (
              <span className="rtd-representative">
                Representante:{' '}
                <strong>
                  {
                    datos.sujeto.representante.nombres
                  }{' '}
                  {
                    datos.sujeto.representante.apellidoPaterno
                  }
                </strong>
              </span>
            )}
          </header>

          <div className="rtd-group-members">
            {datos.sujeto.integrantes.map(
              (
                integrante,
              ) => (
                <article
                  key={
                    integrante.estudiante.id
                  }
                >
                  <span className="rtd-member-avatar">
                    {
                      integrante.estudiante.nombres
                        .trim()
                        .charAt(
                          0,
                        )
                        .toUpperCase()
                    }
                    {
                      integrante.estudiante.apellidoPaterno
                        .trim()
                        .charAt(
                          0,
                        )
                        .toUpperCase()
                    }
                  </span>

                  <div>
                    <strong>
                      {
                        integrante.estudiante.nombres
                      }{' '}
                      {
                        integrante.estudiante.apellidoPaterno
                      }
                    </strong>

                    <small>
                      {integrante.esRepresentante
                        ? 'Representante'
                        : 'Integrante'}
                    </small>
                  </div>

                  {integrante.esRepresentante && (
                    <span className="rtd-member-role">
                      <Crown
                        size={12}
                      />
                      Representante
                    </span>
                  )}
                </article>
              ),
            )}
          </div>
        </section>
      )}

      <div className="rtd-layout">
        <main className="rtd-evidence">
          <section className="rtd-meta">
            <article>
              <small>
                Estado
              </small>

              <strong>
                {
                  datos.entrega.estado
                }
              </strong>
            </article>

            <article>
              <small>
                Entregada
              </small>

              <strong>
                {
                  fecha(
                    datos.entrega.enviadaEn,
                  )
                }
              </strong>
            </article>

            <article
              className={
                datos.entrega.entregadaTarde
                  ? 'is-late'
                  : 'is-ok'
              }
            >
              <small>
                Retraso
              </small>

              <strong>
                {datos.entrega.entregadaTarde
                  ? `${datos.entrega.minutosRetraso} min`
                  : 'A tiempo'}
              </strong>
            </article>
          </section>

          {datos.entrega.contenido && (
            <section className="rtd-written">
              <span className="rtd-section-eyebrow">
                Respuesta escrita
              </span>

              <p>
                {
                  datos.entrega.contenido
                }
              </p>
            </section>
          )}

          <section className="rtd-viewer-card">
            <header>
              <div>
                <span className="rtd-section-eyebrow">
                  Evidencia
                </span>

                <h2>
                  Vista previa
                </h2>

                {archivoActivo && (
                  <p className="rtd-active-file-name">
                    {
                      archivoActivo.nombreOriginal
                    }
                  </p>
                )}
              </div>

              <div className="rtd-viewer-count">
                <strong>
                  {archivoActivo &&
                  indiceArchivoActivo >=
                    0
                    ? indiceArchivoActivo +
                      1
                    : 0}
                </strong>
                <span>
                  de {
                    archivosVista.length
                  } visibles
                </span>
              </div>
            </header>

            {archivosVista.length >
            0 && (
              <div className="rtd-file-switcher">
                <div className="rtd-file-switcher__nav">
                  <button
                    type="button"
                    aria-label="Archivo anterior"
                    title="Archivo anterior"
                    disabled={
                      !puedeIrAnterior
                    }
                    onClick={
                      irArchivoAnterior
                    }
                  >
                    <ChevronLeft
                      size={16}
                    />
                  </button>

                  <span>
                    {archivosVista.length >
                    1
                      ? 'Cambiar evidencia'
                      : 'Evidencia disponible'}
                  </span>

                  <button
                    type="button"
                    aria-label="Archivo siguiente"
                    title="Archivo siguiente"
                    disabled={
                      !puedeIrSiguiente
                    }
                    onClick={
                      irArchivoSiguiente
                    }
                  >
                    <ChevronRight
                      size={16}
                    />
                  </button>
                </div>

                <div className="rtd-tabs">
                  {archivosVista.map(
                    (
                      archivo,
                      indice,
                    ) => (
                      <button
                        key={
                          archivo.id
                        }
                        type="button"
                        className={
                          archivoActivo?.id ===
                          archivo.id
                            ? 'active'
                            : ''
                        }
                        onClick={() =>
                          setArchivoActivoId(
                            archivo.id,
                          )
                        }
                      >
                        <span className="rtd-tab-index">
                          {
                            indice +
                            1
                          }
                        </span>

                        {esImagen(
                          archivo,
                        ) ? (
                          <ImageIcon
                            size={14}
                          />
                        ) : (
                          <FileText
                            size={14}
                          />
                        )}

                        <span className="rtd-tab-name">
                          {
                            archivo.nombreOriginal
                          }
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="rtd-preview">
              {!archivoActivo ? (
                <div className="rtd-preview-empty">
                  <FileText
                    size={30}
                  />

                  <strong>
                    Sin vista previa
                  </strong>

                  <p>
                    La entrega no contiene imágenes o PDF. Revisa los archivos descargables debajo.
                  </p>
                </div>
              ) : cargandoVista ===
                archivoActivo.id &&
                !urls[
                  archivoActivo.id
                ] ? (
                <Loader2
                  size={28}
                  className="rtd-spin"
                />
              ) : urls[
                  archivoActivo.id
                ] &&
                esImagen(
                  archivoActivo,
                ) ? (
                <img
                  src={
                    urls[
                      archivoActivo.id
                    ]
                  }
                  alt={
                    archivoActivo.nombreOriginal
                  }
                />
              ) : urls[
                  archivoActivo.id
                ] &&
                esPdf(
                  archivoActivo,
                ) ? (
                <iframe
                  src={
                    urls[
                      archivoActivo.id
                    ]
                  }
                  title={
                    archivoActivo.nombreOriginal
                  }
                />
              ) : (
                <div className="rtd-preview-empty">
                  <AlertTriangle
                    size={27}
                  />

                  <strong>
                    No fue posible cargar la vista previa
                  </strong>
                </div>
              )}
            </div>
          </section>

          <section className="rtd-files">
            <header>
              <div>
                <span className="rtd-section-eyebrow">
                  Archivos
                </span>

                <h2>
                  Evidencias adjuntas
                </h2>
              </div>
            </header>

            {datos.entrega.archivos.length ===
            0 ? (
              <p className="rtd-muted">
                La entrega no contiene archivos adjuntos.
              </p>
            ) : (
              <div className="rtd-file-list">
                {datos.entrega.archivos.map(
                  (
                    archivo,
                  ) => (
                    <article
                      key={
                        archivo.id
                      }
                      className={
                        archivoActivo?.id ===
                        archivo.id
                          ? 'is-active'
                          : ''
                      }
                      onClick={() => {
                        if (
                          esImagen(
                            archivo,
                          ) ||
                          esPdf(
                            archivo,
                          )
                        ) {
                          setArchivoActivoId(
                            archivo.id,
                          );
                        }
                      }}
                    >
                      <span className="rtd-file-icon">
                        {esImagen(
                          archivo,
                        ) ? (
                          <ImageIcon
                            size={18}
                          />
                        ) : (
                          <FileText
                            size={18}
                          />
                        )}
                      </span>

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
                            bytes(
                              archivo.tamanioBytes,
                            )
                          }
                        </small>
                      </div>

                      {archivo.permiteDescarga && (
                        <button
                          type="button"
                          title="Descargar archivo"
                          onClick={() =>
                            void descargar(
                              archivo,
                            )
                          }
                        >
                          <Download
                            size={15}
                          />
                        </button>
                      )}
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </main>

        <aside className="rtd-grade">
          <div className="rtd-grade__sticky">
            <header>
              <span className="rtd-section-eyebrow">
                Evaluación
              </span>

              <h2>
                Calificar entrega
              </h2>

              <p>
                La evidencia permanece visible mientras registras la nota.
              </p>
            </header>

            <label className="rtd-field">
              <span>
                Nota base
              </span>

              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={
                  notaBase
                }
                placeholder="0"
                onChange={(
                  evento,
                ) =>
                  setNotaBase(
                    normalizarNumero(
                      evento.target.value,
                    ),
                  )
                }
              />

              <small>
                Puntaje máximo: {
                  datos.tarea.puntajeMaximo
                }
              </small>
            </label>

            {datos.entrega.entregadaTarde && (
              <section className="rtd-delay">
                <small>
                  Descuento por retraso
                </small>

                <strong>
                  -{
                    descuento.toFixed(
                      2,
                    )
                  } pts
                </strong>

                <p>
                  Calculado automáticamente según la configuración de la tarea.
                </p>
              </section>
            )}

            {modalidadMixta &&
              datos.sujeto.tipo ===
                'GRUPO' && (
              <section className="rtd-individual">
                <header>
                  <span>
                    Componente individual
                  </span>

                  <strong>
                    Ajustes por integrante
                  </strong>
                </header>

                <div>
                  {datos.sujeto.integrantes.map(
                    (
                      integrante,
                    ) => {
                      const ajuste =
                        Number(
                          ajustes[
                            integrante.estudiante.id
                          ] ??
                          0,
                        );

                      const final =
                        Math.max(
                          0,
                          Math.min(
                            datos.tarea.puntajeMaximo,
                            notaNumerica -
                            descuento +
                            ajuste,
                          ),
                        );

                      return (
                        <label
                          key={
                            integrante.estudiante.id
                          }
                          className="rtd-member"
                        >
                          <span>
                            <strong>
                              {
                                integrante.estudiante.nombres
                              }{' '}
                              {
                                integrante.estudiante.apellidoPaterno
                              }
                            </strong>

                            <small>
                              Final estimada: {
                                final.toFixed(
                                  2,
                                )
                              }
                            </small>
                          </span>

                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              ajustes[
                                integrante.estudiante.id
                              ] ??
                              '0'
                            }
                            onChange={(
                              evento,
                            ) =>
                              setAjustes(
                                (
                                  actuales,
                                ) => ({
                                  ...actuales,

                                  [
                                    integrante.estudiante.id
                                  ]:
                                    normalizarNumero(
                                      evento.target.value,
                                      true,
                                    ),
                                }),
                              )
                            }
                          />
                        </label>
                      );
                    },
                  )}
                </div>
              </section>
            )}

            {!modalidadMixta && (
              <section className="rtd-final">
                <span>
                  Nota final estimada
                </span>

                <strong>
                  {
                    finalGrupal.toFixed(
                      2,
                    )
                  }
                </strong>
              </section>
            )}

            <label className="rtd-field">
              <span>
                Retroalimentación
              </span>

              <textarea
                rows={7}
                maxLength={4000}
                value={
                  retroalimentacion
                }
                placeholder="Escribe observaciones para el estudiante o grupo..."
                onChange={(
                  evento,
                ) =>
                  setRetroalimentacion(
                    evento.target.value,
                  )
                }
              />
            </label>

            {datos.sujeto.tipo ===
              'GRUPO' &&
              !modalidadMixta && (
              <div className="rtd-info">
                La nota base se replica a todos los integrantes del grupo.
              </div>
            )}

            <div className="rtd-actions">
              <button
                type="button"
                className="rtd-btn rtd-btn--secondary"
                disabled={
                  revision.guardando
                }
                onClick={
                  volver
                }
              >
                <ArrowLeft
                  size={15}
                />
                Volver
              </button>

              <button
                type="button"
                className="rtd-btn rtd-btn--primary"
                disabled={
                  revision.guardando
                }
                onClick={() =>
                  void guardar()
                }
              >
                {revision.guardando ? (
                  <Loader2
                    size={15}
                    className="rtd-spin"
                  />
                ) : (
                  <Save
                    size={15}
                  />
                )}

                Guardar calificación
              </button>
            </div>
          </div>
        </aside>
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
  .rtd-error-page {
    display: grid;
    justify-items: center;
    gap: 12px;
    padding: 20px 0;
  }

  .rtd-page {
    display: grid;
    gap: 13px;
    min-width: 0;
    padding-bottom: 36px;
    color: var(--app-text);
  }

  .rtd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 18px;
    border: 1px solid var(--app-border);
    border-radius: 18px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .rtd-header__left {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .rtd-back {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    flex: 0 0 40px;
    padding: 0;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    cursor: pointer;
  }

  .rtd-eyebrow,
  .rtd-section-eyebrow {
    display: block;
    color: var(--app-accent-dark);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .rtd-header h1 {
    margin: 2px 0 0;
    font-size: var(--app-font-title);
    font-weight: var(--app-font-black);
  }

  .rtd-header p {
    margin: 3px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .rtd-header__chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .rtd-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border-radius: 999px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
  }

  .rtd-chip--success {
    color: var(--app-success);
    background: var(--app-success-bg);
  }

  .rtd-group-card {
    overflow: hidden;

    border: 1px solid var(--app-border);
    border-radius: 16px;

    background: var(--app-surface);

    box-shadow: var(--app-shadow-sm);
  }

  .rtd-group-card > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;

    padding: 12px 14px;

    border-bottom: 1px solid var(--app-border-soft);

    background: var(--app-surface-alt);
  }

  .rtd-group-card h2,
  .rtd-group-card p {
    margin: 0;
  }

  .rtd-group-card h2 {
    margin-top: 2px;

    font-size: var(--app-font-section);
    font-weight: var(--app-font-black);
  }

  .rtd-group-card p {
    margin-top: 3px;

    color: var(--app-text-muted);

    font-size: var(--app-font-xs);
  }

  .rtd-representative {
    padding: 6px 9px;

    border-radius: 999px;

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);

    font-size: var(--app-font-xs);

    white-space: nowrap;
  }

  .rtd-representative strong {
    font-weight: var(--app-font-black);
  }

  .rtd-group-members {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );

    gap: 8px;

    padding: 10px 12px 12px;
  }

  .rtd-group-members article {
    min-width: 0;

    display: grid;
    grid-template-columns:
      38px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;

    padding: 9px 10px;

    border: 1px solid var(--app-border-soft);
    border-radius: 11px;

    background: var(--app-surface-alt);
  }

  .rtd-member-avatar {
    width: 36px;
    height: 36px;

    display: grid;
    place-items: center;

    border-radius: 10px;

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);

    font-size: var(--app-font-xs);
    font-weight: var(--app-font-black);
  }

  .rtd-group-members article > div {
    min-width: 0;
  }

  .rtd-group-members article > div strong,
  .rtd-group-members article > div small {
    display: block;

    overflow: hidden;

    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .rtd-group-members article > div strong {
    font-size: var(--app-font-sm);
  }

  .rtd-group-members article > div small {
    margin-top: 2px;

    color: var(--app-text-muted);

    font-size: var(--app-font-xs);
  }

  .rtd-member-role {
    display: inline-flex;
    align-items: center;
    gap: 5px;

    padding: 5px 7px;

    border-radius: 999px;

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);

    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
  }

  .rtd-layout {
    display: grid;
    grid-template-columns:
      minmax(0, 1.55fr)
      minmax(320px, .68fr);
    gap: 14px;
    align-items: start;
  }

  .rtd-evidence {
    min-width: 0;
    display: grid;
    gap: 12px;
  }

  .rtd-meta {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .rtd-meta article {
    min-height: 61px;
    padding: 9px 11px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface);
  }

  .rtd-meta article.is-ok {
    border-color: var(--app-success-border);
    background: var(--app-success-bg);
  }

  .rtd-meta article.is-late {
    border-color: var(--app-danger-border);
    background: var(--app-danger-bg);
  }

  .rtd-meta small,
  .rtd-meta strong {
    display: block;
  }

  .rtd-meta small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .rtd-meta strong {
    margin-top: 4px;
    font-size: var(--app-font-md);
  }

  .rtd-written,
  .rtd-viewer-card,
  .rtd-files,
  .rtd-grade__sticky {
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .rtd-written {
    padding: 13px 15px;
  }

  .rtd-written p {
    margin: 6px 0 0;
    white-space: pre-wrap;
    color: var(--app-text-secondary);
    font-size: var(--app-font-body);
    line-height: var(--app-line-normal);
  }

  .rtd-viewer-card,
  .rtd-files {
    overflow: hidden;
  }

  .rtd-viewer-card > header,
  .rtd-files > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--app-border-soft);
    background: var(--app-surface-alt);
  }

  .rtd-viewer-card h2,
  .rtd-files h2,
  .rtd-grade h2 {
    margin: 2px 0 0;
    font-size: var(--app-font-section);
    font-weight: var(--app-font-black);
  }

  .rtd-active-file-name {
    margin: 4px 0 0;

    max-width: 520px;

    overflow: hidden;

    color: var(--app-text-muted);

    font-size: var(--app-font-xs);

    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .rtd-viewer-count {
    min-width: 82px;

    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 4px;

    color: var(--app-text-muted);

    font-size: var(--app-font-xs);
  }

  .rtd-viewer-count strong {
    color: var(--app-accent-dark);

    font-size: var(--app-font-md);
    font-weight: var(--app-font-black);
  }

  .rtd-file-switcher {
    border-bottom: 1px solid var(--app-border-soft);

    background: var(--app-surface);
  }

  .rtd-file-switcher__nav {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;

    padding: 7px 10px 0;

    color: var(--app-text-muted);

    font-size: var(--app-font-xs);
    font-weight: var(--app-font-semibold);
  }

  .rtd-file-switcher__nav button {
    width: 29px;
    height: 29px;

    display: grid;
    place-items: center;

    padding: 0;

    border: 1px solid var(--app-border);
    border-radius: 8px;

    color: var(--app-text-secondary);

    background: var(--app-surface-alt);

    cursor: pointer;
  }

  .rtd-file-switcher__nav button:hover:not(:disabled) {
    border-color: var(--app-border-strong);

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);
  }

  .rtd-file-switcher__nav button:disabled {
    opacity: .35;

    cursor: not-allowed;
  }

  .rtd-tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding: 8px 10px;
    border-bottom: 0;
  }

  .rtd-tabs button {
    max-width: 235px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    padding: 7px 9px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface);
    font: inherit;
    font-size: var(--app-font-xs);
    cursor: pointer;
  }

  .rtd-tabs button.active {
    border-color: var(--app-accent);
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .rtd-tab-index {
    min-width: 20px;
    height: 20px;

    display: grid;
    place-items: center;

    flex: 0 0 20px;

    border-radius: 999px;

    color: var(--app-text-muted);

    background: var(--app-surface-alt);

    font-size: 10px;
    font-weight: var(--app-font-black);
  }

  .rtd-tabs button.active
  .rtd-tab-index {
    color: #fff;

    background: var(--app-accent);
  }

  .rtd-tab-name {
    overflow: hidden;

    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .rtd-preview {
    min-height: 650px;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--app-surface-alt);
  }

  .rtd-preview img {
    width: 100%;
    min-height: 420px;
    max-height: 78vh;
    object-fit: contain;
    background: var(--app-surface);
  }

  .rtd-preview iframe {
    width: 100%;
    height: 78vh;
    min-height: 650px;
    border: 0;
    background: #fff;
  }

  .rtd-preview-empty {
    max-width: 430px;
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 30px;
    color: var(--app-text-muted);
    text-align: center;
  }

  .rtd-preview-empty strong {
    color: var(--app-text);
    font-size: var(--app-font-section);
  }

  .rtd-preview-empty p {
    margin: 0;
    font-size: var(--app-font-sm);
  }

  .rtd-file-list {
    display: grid;
    padding: 8px 12px 12px;
  }

  .rtd-file-list article {
    display: grid;
    grid-template-columns:
      36px minmax(0, 1fr) 34px;
    align-items: center;
    gap: 9px;
    padding: 8px 0;
    border-bottom: 1px solid var(--app-border-soft);
  }

  .rtd-file-list article:last-child {
    border-bottom: 0;
  }

  .rtd-file-list article {
    border-radius: 9px;

    transition:
      background .15s ease,
      border-color .15s ease;
  }

  .rtd-file-list article:hover {
    background: var(--app-accent-softer);
  }

  .rtd-file-list article.is-active {
    padding-left: 8px;
    padding-right: 8px;

    border: 1px solid var(--app-border-strong);

    background: var(--app-accent-soft);
  }

  .rtd-file-icon {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-accent-soft);
  }

  .rtd-file-list article > div {
    min-width: 0;
  }

  .rtd-file-list strong,
  .rtd-file-list small {
    display: block;
  }

  .rtd-file-list strong {
    overflow: hidden;
    font-size: var(--app-font-sm);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .rtd-file-list small {
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .rtd-file-list button {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid var(--app-border);
    border-radius: 9px;
    color: var(--app-accent-dark);
    background: var(--app-surface-alt);
    cursor: pointer;
  }

  .rtd-grade {
    min-width: 0;
  }

  .rtd-grade__sticky {
    position: sticky;
    top: 16px;
    display: grid;
    gap: 12px;
    padding: 14px;
  }

  .rtd-grade__sticky > header p {
    margin: 4px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .rtd-field {
    display: grid;
    gap: 5px;
  }

  .rtd-field > span {
    color: var(--app-text-secondary);
    font-size: var(--app-font-sm);
    font-weight: var(--app-font-bold);
  }

  .rtd-field > small {
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .rtd-field input,
  .rtd-field textarea,
  .rtd-member input {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 11px;
    border: 1px solid var(--app-input-border);
    border-radius: 10px;
    outline: none;
    color: var(--app-text);
    background: var(--app-input-bg);
    font: inherit;
    font-size: var(--app-font-body);
  }

  .rtd-field textarea {
    resize: vertical;
  }

  .rtd-delay {
    display: grid;
    gap: 3px;
    padding: 10px 11px;
    border: 1px solid var(--app-danger-border);
    border-radius: 11px;
    background: var(--app-danger-bg);
  }

  .rtd-delay small {
    color: var(--app-danger-strong);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
  }

  .rtd-delay strong {
    color: var(--app-danger);
    font-size: var(--app-font-section);
  }

  .rtd-delay p {
    margin: 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .rtd-final {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    background: var(--app-surface-alt);
  }

  .rtd-final span {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .rtd-final strong {
    color: var(--app-accent-dark);
    font-size: var(--app-font-title);
  }

  .rtd-individual {
    overflow: hidden;
    border: 1px solid var(--app-purple-border);
    border-radius: 12px;
    background: var(--app-purple-bg);
  }

  .rtd-individual > header {
    padding: 10px 11px;
    border-bottom: 1px solid var(--app-purple-border);
  }

  .rtd-individual > header span,
  .rtd-individual > header strong {
    display: block;
  }

  .rtd-individual > header span {
    color: var(--app-purple);
    font-size: var(--app-font-xs);
    font-weight: var(--app-font-bold);
    text-transform: uppercase;
  }

  .rtd-individual > header strong {
    margin-top: 2px;
    font-size: var(--app-font-md);
  }

  .rtd-individual > div {
    padding: 5px 9px 8px;
  }

  .rtd-member {
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      84px;
    align-items: center;
    gap: 8px;
    padding: 7px 1px;
    border-bottom: 1px solid var(--app-purple-border);
  }

  .rtd-member:last-child {
    border-bottom: 0;
  }

  .rtd-member > span strong,
  .rtd-member > span small {
    display: block;
  }

  .rtd-member > span strong {
    font-size: var(--app-font-sm);
  }

  .rtd-member > span small {
    margin-top: 2px;
    color: var(--app-text-muted);
    font-size: var(--app-font-xs);
  }

  .rtd-member input {
    padding: 7px 8px;
    text-align: right;
  }

  .rtd-info {
    padding: 9px 10px;
    border: 1px solid var(--app-info-border);
    border-radius: 10px;
    color: var(--app-info-strong);
    background: var(--app-info-bg);
    font-size: var(--app-font-sm);
  }

  .rtd-actions {
    display: grid;
    grid-template-columns:
      auto minmax(0, 1fr);
    gap: 7px;
    padding-top: 2px;
  }

  .rtd-btn {
    min-height: 39px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 10px;
    font: inherit;
    font-size: var(--app-font-md);
    font-weight: var(--app-font-bold);
    cursor: pointer;
  }

  .rtd-btn--secondary {
    border: 1px solid var(--app-border);
    color: var(--app-text-secondary);
    background: var(--app-surface);
  }

  .rtd-btn--primary {
    border: 1px solid var(--app-accent);
    color: #fff;
    background: var(--app-accent);
  }

  .rtd-btn:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .rtd-muted {
    margin: 0;
    padding: 14px;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .rtd-spin {
    animation: rtd-spin .8s linear infinite;
  }

  @keyframes rtd-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 980px) {
    .rtd-group-members {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .rtd-layout {
      grid-template-columns: 1fr;
    }

    .rtd-grade__sticky {
      position: static;
    }

    .rtd-preview,
    .rtd-preview iframe {
      min-height: 520px;
    }
  }

  @media (max-width: 680px) {
    .rtd-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .rtd-header__chips {
      justify-content: flex-start;
    }

    .rtd-meta {
      grid-template-columns: 1fr;
    }

    .rtd-group-card > header {
      align-items: flex-start;
      flex-direction: column;
    }

    .rtd-group-members {
      grid-template-columns: 1fr;
    }

    .rtd-preview,
    .rtd-preview iframe {
      min-height: 420px;
    }
  }
`;