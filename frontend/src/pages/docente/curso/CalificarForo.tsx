import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  MessageSquareText,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../auth/AuthContext';

import AulaModal from '../../../components/aula/AulaModal';
import AvatarUsuario from '../../../components/shared/AvatarUsuario';
import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import useCalificarForo, {
  type ArchivoPanelForo,
  type EstudiantePanelForo,
} from '../../../hooks/foro/useCalificarForo';

type FormatoReporte =
  | 'PDF'
  | 'EXCEL'
  | 'CSV';

type ToastActual = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje?: string;
};

type CalificarForoProps = {
  cursoId?: number;
  foroId?: number;
  integrado?: boolean;
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const numero = (
  valor: unknown,
) => {
  const resultado =
    Number(
      valor ??
        0,
    );

  return Number.isFinite(
    resultado,
  )
    ? resultado
    : 0;
};

const limitar = (
  valor: number,
  maximo = 100,
) =>
  Math.max(
    0,
    Math.min(
      maximo,
      valor,
    ),
  );


const nombreArchivo = (
  archivo: ArchivoPanelForo,
) =>
  archivo.nombreOriginal ||
  `Archivo #${archivo.id}`;

const urlArchivo = (
  archivo: ArchivoPanelForo,
) => {
  const ubicacion =
    archivo.urlPublica ||
    archivo.ruta ||
    null;

  if (!ubicacion) {
    return null;
  }

  if (
    ubicacion.startsWith(
      'http://',
    ) ||
    ubicacion.startsWith(
      'https://',
    )
  ) {
    return ubicacion;
  }

  return `${API_URL}${
    ubicacion.startsWith(
      '/',
    )
      ? ubicacion
      : `/${ubicacion}`
  }`;
};

const etiquetaArchivo = (
  archivo: ArchivoPanelForo,
) => {
  const mime =
    archivo.mimeType?.toLowerCase() ??
    '';

  const extension =
    archivo.extension?.toLowerCase() ??
    '';

  if (
    mime.startsWith(
      'image/',
    ) ||
    [
      'jpg',
      'jpeg',
      'png',
      'webp',
      'gif',
    ].includes(
      extension,
    )
  ) {
    return 'Ver imagen';
  }

  if (
    mime ===
      'application/pdf' ||
    extension ===
      'pdf'
  ) {
    return 'Ver PDF';
  }

  return 'Abrir archivo';
};

const tamanioArchivo = (
  bytes?: number | null,
) => {
  const valor =
    Number(
      bytes ??
        0,
    );

  if (
    !Number.isFinite(
      valor,
    ) ||
    valor <=
      0
  ) {
    return null;
  }

  if (
    valor <
    1024 * 1024
  ) {
    return `${(
      valor /
      1024
    ).toFixed(
      1,
    )} KB`;
  }

  return `${(
    valor /
    1024 /
    1024
  ).toFixed(
    2,
  )} MB`;
};

function ArchivosRespuesta({
  archivos,
}: {
  archivos?: ArchivoPanelForo[];
}) {
  if (
    !archivos ||
    archivos.length ===
      0
  ) {
    return null;
  }

  return (
    <div className="cf-answer-files">
      <div className="cf-answer-files__title">
        <FileText
          size={14}
        />
        <strong>
          Archivos adjuntos
        </strong>
        <span>
          {archivos.length}
        </span>
      </div>

      <div className="cf-answer-files__list">
        {archivos.map(
          (
            archivo,
          ) => {
            const url =
              urlArchivo(
                archivo,
              );

            const tamanio =
              tamanioArchivo(
                archivo.tamanioBytes,
              );

            return (
              <article
                key={archivo.id}
                className="cf-answer-file"
              >
                <div className="cf-answer-file__info">
                  <FileText
                    size={16}
                  />

                  <span>
                    <strong>
                      {nombreArchivo(
                        archivo,
                      )}
                    </strong>
                    <small>
                      {[
                        archivo.extension?.toUpperCase(),
                        tamanio,
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(
                          ' · ',
                        ) ||
                        'Archivo adjunto'}
                    </small>
                  </span>
                </div>

                <div className="cf-answer-file__actions">
                  {url ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            url,
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                      >
                        <Eye
                          size={13}
                        />
                        {etiquetaArchivo(
                          archivo,
                        )}
                      </button>

                      {archivo.permiteDescarga !==
                        false && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          download={nombreArchivo(
                            archivo,
                          )}
                        >
                          <Download
                            size={13}
                          />
                          Descargar
                        </a>
                      )}
                    </>
                  ) : (
                    <span className="cf-answer-file__missing">
                      Archivo sin URL disponible
                    </span>
                  )}
                </div>
              </article>
            );
          },
        )}
      </div>
    </div>
  );
}

const nombreCompleto = (
  item: EstudiantePanelForo,
) =>
  [
    item.estudiante.nombres,
    item.estudiante.apellidoPaterno,
    item.estudiante.apellidoMaterno,
  ]
    .filter(
      Boolean,
    )
    .join(
      ' ',
    );

const estadoBonito = (
  estado?: string,
) =>
  ({
    PENDIENTE:
      'Pendiente',
    BORRADOR:
      'Pendiente individual',
    CALIFICADA:
      'Calificada',
    PUBLICADA:
      'Publicada',
    ANULADA:
      'Anulada',
  })[
    estado ??
      'PENDIENTE'
  ] ??
  estado ??
  'Pendiente';

const formatoFecha = (
  valor?: string | null,
) => {
  if (!valor) {
    return '—';
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
    fecha,
  );
};

export default function CalificarForo({
  cursoId: cursoIdProp,
  foroId: foroIdProp,
  integrado = false,
}: CalificarForoProps = {}) {
  const navigate =
    useNavigate();

  const {
    sesion,
  } =
    useAuth();

  const accessToken =
    sesion?.accessToken ??
    '';

  const {
    cursoId,
    temaId,
  } =
    useParams();

  const idCurso =
    cursoIdProp ??
    Number(
      cursoId,
    );

  const idForo =
    foroIdProp ??
    Number(
      temaId,
    );

  const {
    panel,
    cargando,
    procesando,
    error,
    cargar,
    limpiarError,
    guardarCalificacion,
    guardarCalificacionGrupo,
    publicarNotas,
    reabrirNotas,
  } =
    useCalificarForo(
      idCurso,
      idForo,
    );

  const [
    busqueda,
    setBusqueda,
  ] =
    useState(
      '',
    );

  const [
    filtro,
    setFiltro,
  ] =
    useState(
      'TODOS',
    );

  const [
    seleccionado,
    setSeleccionado,
  ] =
    useState<EstudiantePanelForo | null>(
      null,
    );

  const [
    notaBase,
    setNotaBase,
  ] =
    useState(
      '',
    );

  const [
    notaIndividual,
    setNotaIndividual,
  ] =
    useState(
      '',
    );

  const [
    ajuste,
    setAjuste,
  ] =
    useState(
      '0',
    );

  const [
    retroalimentacion,
    setRetroalimentacion,
  ] =
    useState(
      '',
    );

  const [
    modalReportesAbierto,
    setModalReportesAbierto,
  ] =
    useState(
      false,
    );

  const [
    descargandoReporte,
    setDescargandoReporte,
  ] =
    useState<FormatoReporte | null>(
      null,
    );

  const [
    confirmacion,
    setConfirmacion,
  ] =
    useState<'PUBLICAR' | 'REABRIR' | null>(
      null,
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

  const mostrarToast = (
    tipo: TipoToast,
    titulo: string,
    mensaje?: string,
  ) =>
    setToast({
      visible:
        true,
      tipo,
      titulo,
      mensaje,
    });

  useEffect(
    () => {
      if (!error) {
        return;
      }

      mostrarToast(
        'error',
        'No se pudieron cargar las calificaciones',
        error,
      );

      limpiarError();
    },
    [
      error,
      limpiarError,
    ],
  );

  const puntajeMaximo =
    numero(
      panel?.actividad.puntajeMaximo,
    ) ||
    100;

  const modalidadNota =
    panel?.foro.modalidadNota ??
    'INDIVIDUAL';

  const esGrupal =
    panel?.foro.modalidadParticipacion ===
    'GRUPAL';

  const notaGrupal =
    modalidadNota ===
      'GRUPAL';

  const notaMixta =
    modalidadNota ===
      'GRUPAL_E_INDIVIDUAL';

  const notasPublicadas =
    panel?.actividad.estado ===
      'PUBLICADA' ||
    panel?.foro.estado ===
      'NOTAS_PUBLICADAS';

  const porcentajeGrupal =
    numero(
      panel?.foro.porcentajeNotaGrupal ??
        50,
    );

  const porcentajeIndividual =
    numero(
      panel?.foro.porcentajeNotaIndividual ??
        100 - porcentajeGrupal,
    );

  const estudiantes =
    useMemo(
      () => {
        const termino =
          busqueda
            .trim()
            .toLocaleLowerCase();

        return (
          panel?.estudiantes ??
          []
        ).filter(
          (
            item,
          ) => {
            const coincideTexto =
              !termino ||
              nombreCompleto(
                item,
              )
                .toLocaleLowerCase()
                .includes(
                  termino,
                ) ||
              item.estudiante.correo
                ?.toLocaleLowerCase()
                .includes(
                  termino,
                );

            const estado =
              item.estado ??
              item.calificacion?.estado ??
              'PENDIENTE';

            const coincideFiltro =
              filtro ===
                'TODOS' ||
              (
                filtro ===
                  'PENDIENTES' &&
                [
                  'PENDIENTE',
                  'BORRADOR',
                ].includes(
                  estado,
                )
              ) ||
              (
                filtro ===
                  'CALIFICADOS' &&
                [
                  'CALIFICADA',
                  'PUBLICADA',
                ].includes(
                  estado,
                )
              ) ||
              (
                filtro ===
                  'SIN_RESPUESTA' &&
                !item.tieneRespuesta
              );

            return Boolean(
              coincideTexto &&
              coincideFiltro,
            );
          },
        );
      },
      [
        panel,
        busqueda,
        filtro,
      ],
    );

  const cantidadPendientes =
    useMemo(
      () =>
        (
          panel?.estudiantes ??
          []
        ).filter(
          (
            item,
          ) =>
            [
              'PENDIENTE',
              'BORRADOR',
            ].includes(
              item.estado ??
                item.calificacion?.estado ??
                'PENDIENTE',
            ),
        ).length,
      [
        panel,
      ],
    );

  const cantidadCalificados =
    useMemo(
      () =>
        (
          panel?.estudiantes ??
          []
        ).filter(
          (
            item,
          ) =>
            [
              'CALIFICADA',
              'PUBLICADA',
            ].includes(
              item.estado ??
                item.calificacion?.estado ??
                'PENDIENTE',
            ),
        ).length,
      [
        panel,
      ],
    );

  const cantidadSinRespuesta =
    useMemo(
      () =>
        (
          panel?.estudiantes ??
          []
        ).filter(
          (
            item,
          ) =>
            !item.tieneRespuesta,
        ).length,
      [
        panel,
      ],
    );

  const integrantesGrupo =
    useMemo(
      () => {
        if (
          !seleccionado?.grupo
        ) {
          return seleccionado
            ? [
                seleccionado,
              ]
            : [];
        }

        return (
          panel?.estudiantes ??
          []
        ).filter(
          (
            item,
          ) =>
            item.grupo?.id ===
              seleccionado.grupo?.id &&
            item.grupo?.origen ===
              seleccionado.grupo?.origen,
        );
      },
      [
        panel,
        seleccionado,
      ],
    );

  const resumenComentariosGrupo =
    useMemo(
      () => {
        const conRegla =
          integrantesGrupo.filter(
            (
              item,
            ) =>
              item.participacionComentarios?.aplicaRequisito,
          );

        const exentos =
          conRegla.filter(
            (
              item,
            ) =>
              item.participacionComentarios?.esRepresentante,
          ).length;

        const cumplidos =
          conRegla.filter(
            (
              item,
            ) =>
              !item.participacionComentarios?.esRepresentante &&
              item.participacionComentarios?.cumplio,
          ).length;

        const pendientes =
          conRegla.filter(
            (
              item,
            ) =>
              !item.participacionComentarios?.esRepresentante &&
              !item.participacionComentarios?.cumplio,
          ).length;

        return {
          exentos,
          cumplidos,
          pendientes,
        };
      },
      [
        integrantesGrupo,
      ],
    );

  const abrirCalificacion = (
    item: EstudiantePanelForo,
  ) => {
    setSeleccionado(
      item,
    );

    const notaGrupalGuardada =
      item.calificacion?.notaGrupal ??
      item.calificacion?.notaBase;

    setNotaBase(
      notaGrupalGuardada ===
        null ||
      notaGrupalGuardada ===
        undefined
        ? ''
        : String(
            notaGrupalGuardada,
          ),
    );

    const individualGuardada =
      item.calificacion?.notaIndividual ??
      (
        notaMixta
          ? item.calificacion?.ajusteIndividual
          : null
      );

    setNotaIndividual(
      individualGuardada ===
        null ||
      individualGuardada ===
        undefined
        ? ''
        : String(
            individualGuardada,
          ),
    );

    setAjuste(
      notaMixta
        ? '0'
        : String(
            item.calificacion?.ajusteIndividual ??
              0,
          ),
    );

    setRetroalimentacion(
      item.calificacion?.retroalimentacion ??
        '',
    );
  };

  const calcularBaseAcademica = (
    grupal: number,
    individual: number,
  ) => {
    if (
      !notaMixta
    ) {
      return limitar(
        grupal,
        puntajeMaximo,
      );
    }

    return limitar(
      (
        grupal *
          porcentajeGrupal +
        individual *
          porcentajeIndividual
      ) /
        100,
      puntajeMaximo,
    );
  };

  const descuentoComentariosPara = (
    item: EstudiantePanelForo,
    base: number,
  ) => {
    const participacion =
      item.participacionComentarios;

    if (
      !participacion?.aplicaRequisito ||
      participacion.esRepresentante ||
      participacion.cumplio ||
      !participacion.penalizacionConfigurada
    ) {
      return 0;
    }

    const valor =
      numero(
        panel?.foro.valorPenalizacionComentarios,
      );

    if (
      panel?.foro.tipoPenalizacionComentarios ===
      'PORCENTAJE'
    ) {
      return limitar(
        base *
          valor /
          100,
        puntajeMaximo,
      );
    }

    return limitar(
      valor,
      puntajeMaximo,
    );
  };

  const calcularFinalPara = (
    item: EstudiantePanelForo,
    grupalEntrada = numero(
      notaBase,
    ),
    individualEntrada?: number,
  ) => {
    const individual =
      notaMixta
        ? individualEntrada ??
          numero(
            item.calificacion?.notaIndividual ??
              item.calificacion?.ajusteIndividual,
          )
        : 0;

    const base =
      calcularBaseAcademica(
        grupalEntrada,
        individual,
      );

    const retraso =
      numero(
        item.calificacion?.descuentoRetraso ??
          item.respuesta?.descuentoCalculado,
      );

    const comentarios =
      descuentoComentariosPara(
        item,
        base,
      );

    const ajusteReal =
      notaMixta
        ? 0
        : item.estudiante.id ===
            seleccionado?.estudiante.id
          ? numero(
              ajuste,
            )
          : numero(
              item.calificacion?.ajusteIndividual,
            );

    return limitar(
      base -
        retraso -
        comentarios +
        ajusteReal,
      puntajeMaximo,
    );
  };

  const finalSeleccionado =
    seleccionado
      ? calcularFinalPara(
          seleccionado,
          numero(
            notaBase,
          ),
          numero(
            notaIndividual,
          ),
        )
      : 0;

  const guardar =
    async () => {
      if (
        !seleccionado
      ) {
        return;
      }

      const valorBase =
        numero(
          notaBase,
        );

      if (
        notaBase ===
          '' ||
        valorBase <
          0 ||
        valorBase >
          puntajeMaximo
      ) {
        mostrarToast(
          'advertencia',
          notaGrupal ||
            notaMixta
            ? 'Revisa la nota grupal'
            : 'Revisa la nota',
          `La nota debe estar entre 0 y ${puntajeMaximo}.`,
        );
        return;
      }

      if (
        notaMixta &&
        (
          notaIndividual ===
            '' ||
          numero(
            notaIndividual,
          ) <
            0 ||
          numero(
            notaIndividual,
          ) >
            puntajeMaximo
        )
      ) {
        mostrarToast(
          'advertencia',
          'Revisa la nota individual',
          `La nota individual debe estar entre 0 y ${puntajeMaximo}.`,
        );
        return;
      }

      try {
        if (
          notaGrupal
        ) {
          if (
            !seleccionado.grupo
          ) {
            throw new Error(
              'No se pudo identificar el grupo del estudiante.',
            );
          }

          await guardarCalificacionGrupo(
            seleccionado.grupo,
            {
              notaBase:
                valorBase,
              retroalimentacion:
                retroalimentacion.trim() ||
                undefined,
            },
          );

          setSeleccionado(
            null,
          );

          mostrarToast(
            'exito',
            'Calificación grupal guardada',
            `La nota base se aplicó a ${integrantesGrupo.length} integrante(s). Las penalizaciones individuales se calcularon automáticamente.`,
          );
          return;
        }

        if (
          notaMixta
        ) {
          if (
            !seleccionado.grupo
          ) {
            throw new Error(
              'No se pudo identificar el grupo del estudiante.',
            );
          }

          await guardarCalificacionGrupo(
            seleccionado.grupo,
            {
              notaBase:
                valorBase,
              retroalimentacion:
                retroalimentacion.trim() ||
                undefined,
            },
          );

          await guardarCalificacion(
            seleccionado.estudiante.id,
            {
              notaBase:
                valorBase,
              notaIndividual:
                numero(
                  notaIndividual,
                ),
              retroalimentacion:
                retroalimentacion.trim() ||
                undefined,
            },
          );

          setSeleccionado(
            null,
          );

          mostrarToast(
            'exito',
            'Calificación mixta guardada',
            `Se actualizó el componente grupal (${porcentajeGrupal}%) y el componente individual de ${nombreCompleto(seleccionado)} (${porcentajeIndividual}%).`,
          );
          return;
        }

        await guardarCalificacion(
          seleccionado.estudiante.id,
          {
            notaBase:
              valorBase,
            ajusteIndividual:
              numero(
                ajuste,
              ),
            retroalimentacion:
              retroalimentacion.trim() ||
              undefined,
          },
        );

        setSeleccionado(
          null,
        );

        mostrarToast(
          'exito',
          'Calificación guardada',
          'La nota, las penalizaciones automáticas y la retroalimentación fueron actualizadas.',
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

  const confirmarAccion =
    async () => {
      try {
        if (
          confirmacion ===
          'PUBLICAR'
        ) {
          await publicarNotas();

          mostrarToast(
            'exito',
            'Notas publicadas',
            'Los estudiantes ya pueden consultar sus calificaciones.',
          );
        } else if (
          confirmacion ===
          'REABRIR'
        ) {
          await reabrirNotas();

          mostrarToast(
            'exito',
            'Calificaciones reabiertas',
            'Ya puedes modificar las notas nuevamente.',
          );
        }

        setConfirmacion(
          null,
        );
      } catch (
        causa
      ) {
        mostrarToast(
          'error',
          'No se completó la acción',
          causa instanceof Error
            ? causa.message
            : undefined,
        );
      }
    };

  const descargarReporte =
    async (
      formato: FormatoReporte,
    ) => {
      if (
        !accessToken ||
        descargandoReporte
      ) {
        return;
      }

      try {
        setDescargandoReporte(
          formato,
        );

        const respuesta =
          await fetch(
            `${API_URL}/foro/cursos/${idCurso}/${idForo}/calificaciones/exportar/${formato}`,
            {
              method:
                'GET',
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          );

        const tipoContenido =
          respuesta.headers.get(
            'content-type',
          );

        if (
          !respuesta.ok
        ) {
          const datos =
            tipoContenido?.includes(
              'application/json',
            )
              ? await respuesta
                  .json()
                  .catch(
                    () => ({}),
                  )
              : {};

          const dato =
            datos as {
              message?: string | string[];
            };

          throw new Error(
            Array.isArray(
              dato.message,
            )
              ? dato.message.join(
                  ' ',
                )
              : dato.message ||
                  `No fue posible generar el reporte ${formato}.`,
          );
        }

        const archivo =
          await respuesta.blob();

        const url =
          URL.createObjectURL(
            archivo,
          );

        const enlace =
          document.createElement(
            'a',
          );

        enlace.href =
          url;

        const extensiones: Record<FormatoReporte, string> = {
          PDF:
            'pdf',
          EXCEL:
            'xlsx',
          CSV:
            'csv',
        };

        enlace.download =
          `calificaciones-foro-${idForo}-iusacademy.${extensiones[formato]}`;

        document.body.appendChild(
          enlace,
        );
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(
          url,
        );

        setModalReportesAbierto(
          false,
        );

        mostrarToast(
          'exito',
          'Reporte descargado',
          `El reporte ${formato} fue generado correctamente.`,
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
      } finally {
        setDescargandoReporte(
          null,
        );
      }
    };

  if (
    cargando &&
    !panel
  ) {
    return (
      <div className="cf-estado">
        <span className="cf-spinner" />
        Cargando calificaciones…
        <style>
          {styles}
        </style>
      </div>
    );
  }

  return (
    <section
      className={`cf-pagina ${
        integrado
          ? 'cf-pagina--integrada'
          : ''
      }`}
    >
      {!integrado && (
        <header className="cf-header">
          <div className="cf-header__content">
            <div className="cf-header__icon">
              <BookOpenCheck
                size={25}
              />
            </div>

            <div>
              <button
                type="button"
                className="cf-volver"
                onClick={() =>
                  navigate(
                    `/docente/cursos/${idCurso}/foro/${idForo}`,
                  )
                }
              >
                <ArrowLeft
                  size={16}
                />
                Volver al foro
              </button>

              <span className="cf-eyebrow">
                Gestión académica
              </span>

              <h2>
                Calificaciones del foro
              </h2>

              <p>
                Califica según la modalidad configurada y revisa la participación real de cada integrante.
              </p>
            </div>
          </div>

          <div className="cf-header__acciones">
            <button
              type="button"
              className="cf-btn cf-btn--principal"
              onClick={() =>
                setModalReportesAbierto(
                  true,
                )
              }
            >
              <FileText
                size={16}
              />
              Reportes
            </button>

            <button
              type="button"
              className="cf-btn cf-btn--secundario"
              disabled={procesando}
              onClick={() =>
                void cargar()
              }
            >
              <RotateCcw
                size={16}
              />
              Actualizar
            </button>
          </div>
        </header>
      )}

      {integrado && (
        <header className="cf-subview-title-card">
          <div className="cf-title-identity">
            <span className="cf-title-icon">
              <BookOpenCheck
                size={20}
              />
            </span>

            <div>
              <span className="cf-eyebrow">
                Evaluación del foro
              </span>
              <h3>
                Calificaciones
              </h3>
              <p>
                {modalidadNota ===
                'GRUPAL'
                  ? 'Una nota base por grupo, con penalizaciones individuales automáticas.'
                  : modalidadNota ===
                      'GRUPAL_E_INDIVIDUAL'
                    ? `Nota mixta: ${porcentajeGrupal}% grupal y ${porcentajeIndividual}% individual.`
                    : 'Evaluación individual por estudiante.'}
              </p>
            </div>
          </div>

          <div className="cf-mini-actions">
            <button
              type="button"
              onClick={() =>
                setModalReportesAbierto(
                  true,
                )
              }
            >
              <FileText
                size={14}
              />
              Reportes
            </button>

            <button
              type="button"
              disabled={procesando}
              onClick={() =>
                void cargar()
              }
            >
              <RotateCcw
                size={14}
              />
              Actualizar
            </button>

            {notasPublicadas
              ? (
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() =>
                      setConfirmacion(
                        'REABRIR',
                      )
                    }
                  >
                    <RotateCcw
                      size={14}
                    />
                    Reabrir
                  </button>
                )
              : (
                  <button
                    type="button"
                    disabled={
                      cantidadCalificados ===
                        0 ||
                      procesando
                    }
                    onClick={() =>
                      setConfirmacion(
                        'PUBLICAR',
                      )
                    }
                  >
                    <Send
                      size={14}
                    />
                    Publicar
                  </button>
                )}
          </div>
        </header>
      )}

      <section className="cf-summary-grid">
        <article className="cf-summary-card">
          <UsersRound
            size={20}
          />
          <div>
            <strong>
              {panel?.resumen.totalEstudiantes ??
                0}
            </strong>
            <span>
              Estudiantes
            </span>
          </div>
        </article>

        <article className="cf-summary-card">
          <Clock3
            size={20}
          />
          <div>
            <strong>
              {cantidadPendientes}
            </strong>
            <span>
              Pendientes
            </span>
          </div>
        </article>

        <article className="cf-summary-card">
          <CheckCircle2
            size={20}
          />
          <div>
            <strong>
              {cantidadCalificados}
            </strong>
            <span>
              Calificados
            </span>
          </div>
        </article>

        <article className="cf-summary-card">
          <BookOpenCheck
            size={20}
          />
          <div>
            <strong>
              {puntajeMaximo}
            </strong>
            <span>
              Puntaje máximo
            </span>
          </div>
        </article>
      </section>

      <section className="cf-rules-strip">
        <span>
          <strong>
            Modalidad:
          </strong>
          {' '}
          {modalidadNota ===
          'GRUPAL_E_INDIVIDUAL'
            ? 'Grupal + individual'
            : modalidadNota ===
                'GRUPAL'
              ? 'Grupal'
              : 'Individual'}
        </span>

        {panel?.foro.minimoComentariosPorEstudiante ? (
          <span>
            <strong>
              Comentarios:
            </strong>
            {' '}
            mínimo {panel.foro.minimoComentariosPorEstudiante}
          </span>
        ) : null}

        {panel?.foro.penalizarIncumplimientoComentarios ? (
          <span>
            <strong>
              Penalización:
            </strong>
            {' '}
            {panel.foro.tipoPenalizacionComentarios ===
            'PORCENTAJE'
              ? `${numero(panel.foro.valorPenalizacionComentarios)}%`
              : `${numero(panel.foro.valorPenalizacionComentarios)} puntos`}
          </span>
        ) : null}

        {panel?.foro.fechaMaximaRetraso ? (
          <span>
            <strong>
              Cierre definitivo:
            </strong>
            {' '}
            {formatoFecha(
              panel.foro.fechaMaximaRetraso,
            )}
          </span>
        ) : null}
      </section>

      <section className="cf-users-card">
        <div className="cf-filter-bar">
          <div className="cf-filters">
            {[
              [
                'TODOS',
                'Todos',
                panel?.resumen.totalEstudiantes ??
                  0,
              ],
              [
                'PENDIENTES',
                'Pendientes',
                cantidadPendientes,
              ],
              [
                'CALIFICADOS',
                'Calificados',
                cantidadCalificados,
              ],
              [
                'SIN_RESPUESTA',
                'Sin respuesta',
                cantidadSinRespuesta,
              ],
            ].map(
              (
                item,
              ) => (
                <button
                  key={String(
                    item[0],
                  )}
                  type="button"
                  className={
                    filtro ===
                    item[0]
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setFiltro(
                      String(
                        item[0],
                      ),
                    )
                  }
                >
                  {item[1]}
                  <span>
                    {item[2]}
                  </span>
                </button>
              ),
            )}
          </div>

          <label className="cf-search-box">
            <Search
              size={16}
            />
            <input
              value={busqueda}
              onChange={(
                event,
              ) =>
                setBusqueda(
                  event.target.value,
                )
              }
              placeholder="Buscar por nombre o correo..."
            />
          </label>
        </div>
      </section>

      <section className="cf-table-section">
        {estudiantes.length ===
        0
          ? (
              <div className="cf-state-card">
                No se encontraron estudiantes con estos filtros.
              </div>
            )
          : (
              <div className="cf-table-wrapper">
                <table className="cf-table">
                  <thead>
                    <tr>
                      <th>
                        Estudiante
                      </th>
                      {esGrupal && (
                        <th>
                          Grupo
                        </th>
                      )}
                      <th>
                        Participación
                      </th>
                      <th>
                        Entrega
                      </th>
                      <th>
                        Nota
                      </th>
                      <th>
                        Estado
                      </th>
                      <th>
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {estudiantes.map(
                      (
                        item,
                      ) => {
                        const estado =
                          item.estado ??
                          item.calificacion?.estado ??
                          'PENDIENTE';

                        const participacion =
                          item.participacionComentarios;

                        return (
                          <tr
                            key={item.estudiante.id}
                          >
                            <td>
                              <div className="cf-user-cell">
                                <AvatarUsuario
                                  fotoPerfilUrl={item.estudiante.fotoPerfilUrl}
                                  nombres={item.estudiante.nombres}
                                  apellidoPaterno={item.estudiante.apellidoPaterno}
                                  size={42}
                                  className="cf-table-avatar"
                                />
                                <div>
                                  <strong>
                                    {nombreCompleto(
                                      item,
                                    )}
                                  </strong>
                                  <span>
                                    {item.estudiante.correo}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {esGrupal && (
                              <td>
                                {item.grupo
                                  ? (
                                      <span className="cf-group-badge">
                                        <UsersRound
                                          size={12}
                                        />
                                        {item.grupo.nombre}
                                      </span>
                                    )
                                  : (
                                      <span className="cf-muted">
                                        Sin grupo
                                      </span>
                                    )}
                              </td>
                            )}

                            <td>
                              {participacion?.esRepresentante
                                ? (
                                    <span className="cf-participacion cf-participacion--rep">
                                      <ShieldCheck
                                        size={13}
                                      />
                                      Representante
                                    </span>
                                  )
                                : participacion?.aplicaRequisito
                                  ? (
                                      <span
                                        className={`cf-participacion ${
                                          participacion.cumplio
                                            ? 'is-ok'
                                            : 'is-fail'
                                        }`}
                                      >
                                        <MessageSquareText
                                          size={13}
                                        />
                                        {participacion.comentariosValidos}/{participacion.minimoRequerido}
                                        {' '}
                                        comentarios
                                      </span>
                                    )
                                  : item.tieneRespuesta
                                    ? (
                                        <span className="cf-participacion is-ok">
                                          <CheckCircle2
                                            size={13}
                                          />
                                          Participó
                                        </span>
                                      )
                                    : (
                                        <span className="cf-muted">
                                          Sin participación
                                        </span>
                                      )}
                            </td>

                            <td>
                              {item.entregadaTarde
                                ? (
                                    <span className="cf-badge is-danger">
                                      Tardía
                                    </span>
                                  )
                                : item.tieneRespuesta
                                  ? (
                                      <span className="cf-badge is-success">
                                        A tiempo
                                      </span>
                                    )
                                  : (
                                      <span className="cf-muted">
                                        —
                                      </span>
                                    )}
                            </td>

                            <td>
                              <strong className="cf-nota">
                                {item.calificacion?.notaFinal ===
                                  null ||
                                item.calificacion?.notaFinal ===
                                  undefined
                                  ? '—'
                                  : `${numero(item.calificacion.notaFinal).toFixed(2)}/${puntajeMaximo}`}
                              </strong>
                            </td>

                            <td>
                              <span className={`cf-grade-state is-${estado.toLowerCase()}`}>
                                {estadoBonito(
                                  estado,
                                )}
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="cf-action-button"
                                onClick={() =>
                                  abrirCalificacion(
                                    item,
                                  )
                                }
                              >
                                <Eye
                                  size={14}
                                />
                                {notasPublicadas
                                  ? 'Ver detalle'
                                  : notaGrupal
                                    ? item.calificacion
                                      ? 'Revisar grupo'
                                      : 'Calificar grupo'
                                    : item.calificacion
                                      ? 'Revisar'
                                      : 'Calificar'}
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
      </section>

      <AulaModal
        abierto={Boolean(
          seleccionado,
        )}
        titulo={
          seleccionado
            ? notaGrupal ||
              notaMixta
              ? seleccionado.grupo?.nombre ??
                nombreCompleto(
                  seleccionado,
                )
              : nombreCompleto(
                  seleccionado,
                )
            : 'Calificar'
        }
        etiqueta={
          notasPublicadas
            ? 'Calificación publicada'
            : notaMixta
              ? 'Calificación grupal e individual'
              : notaGrupal
                ? 'Calificación grupal'
                : 'Calificación individual'
        }
        descripcion={
          notasPublicadas
            ? 'La nota ya fue publicada y se muestra en modo de solo lectura.'
            : notaMixta
              ? `El componente grupal vale ${porcentajeGrupal}% y el individual ${porcentajeIndividual}%.`
              : notaGrupal
                ? 'La nota base se replica al grupo; retrasos y comentarios se descuentan por estudiante.'
                : 'Revisa el aporte y las penalizaciones automáticas antes de guardar.'
        }
        ancho="amplio"
        bloqueado={procesando}
        onCerrar={() =>
          setSeleccionado(
            null,
          )
        }
        footer={
          notasPublicadas
            ? (
                <button
                  className="cf-btn cf-btn--secundario"
                  onClick={() =>
                    setSeleccionado(
                      null,
                    )
                  }
                >
                  Cerrar
                </button>
              )
            : (
                <>
                  <button
                    className="cf-btn cf-btn--secundario"
                    disabled={procesando}
                    onClick={() =>
                      setSeleccionado(
                        null,
                      )
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    className="cf-btn cf-btn--principal"
                    disabled={procesando}
                    onClick={() =>
                      void guardar()
                    }
                  >
                    <Save
                      size={16}
                    />
                    {procesando
                      ? 'Guardando…'
                      : notaGrupal
                        ? 'Guardar nota del grupo'
                        : notaMixta
                          ? 'Guardar nota mixta'
                          : 'Guardar calificación'}
                  </button>
                </>
              )
        }
      >
        {seleccionado && (
          <div className="cf-editor">
            {(notaGrupal ||
              notaMixta) && (
              <section className="cf-group-context">
                <div className="cf-section-head">
                  <div>
                    <span className="cf-eyebrow">
                      Evidencia grupal
                    </span>
                    <h3>
                      Respuesta principal
                    </h3>
                  </div>

                  <span className="cf-group-badge">
                    <UsersRound
                      size={13}
                    />
                    {seleccionado.grupo?.nombre ??
                      'Grupo'}
                  </span>
                </div>

                {seleccionado.respuesta
                  ? (
                      <div className="cf-main-answer">
                        <strong>
                          {seleccionado.respuesta.titulo ||
                            'Respuesta principal'}
                        </strong>
                        <p>
                          {seleccionado.respuesta.contenido ||
                            'La respuesta no contiene texto.'}
                        </p>
                        <small>
                          Publicada por{' '}
                          {seleccionado.respuesta.autor
                            ? `${seleccionado.respuesta.autor.nombres} ${seleccionado.respuesta.autor.apellidoPaterno}`
                            : 'el representante'}
                          {' · '}
                          {seleccionado.respuesta._count?.archivos ??
                            0}{' '}
                          archivo(s)
                        </small>

                        <ArchivosRespuesta
                          archivos={seleccionado.respuesta.archivos}
                        />
                      </div>
                    )
                  : (
                      <div className="cf-empty-small">
                        El grupo todavía no tiene una respuesta principal.
                      </div>
                    )}
              </section>
            )}

            {(notaGrupal ||
              notaMixta) && (
              <section className="cf-members-section">
                <div className="cf-section-head">
                  <div>
                    <span className="cf-eyebrow">
                      Participación individual
                    </span>
                    <h3>
                      Integrantes y comentarios
                    </h3>
                  </div>

                  <span className="cf-count-pill">
                    {integrantesGrupo.length}{' '}
                    integrante(s)
                  </span>
                </div>

                <div className="cf-members-list">
                  {integrantesGrupo.map(
                    (
                      integrante,
                    ) => {
                      const participacion =
                        integrante.participacionComentarios;

                      const individualGuardada =
                        integrante.estudiante.id ===
                          seleccionado.estudiante.id
                          ? numero(
                              notaIndividual,
                            )
                          : numero(
                              integrante.calificacion?.notaIndividual ??
                                integrante.calificacion?.ajusteIndividual,
                            );

                      const base =
                        calcularBaseAcademica(
                          numero(
                            notaBase,
                          ),
                          individualGuardada,
                        );

                      const descuentoComentario =
                        descuentoComentariosPara(
                          integrante,
                          base,
                        );

                      const descuentoRetraso =
                        numero(
                          integrante.calificacion?.descuentoRetraso ??
                            integrante.respuesta?.descuentoCalculado,
                        );

                      return (
                        <article
                          key={integrante.estudiante.id}
                          className={`cf-member-card ${
                            integrante.estudiante.id ===
                            seleccionado.estudiante.id
                              ? 'is-selected'
                              : ''
                          }`}
                        >
                          <div className="cf-member-card__head">
                            <AvatarUsuario
                              fotoPerfilUrl={integrante.estudiante.fotoPerfilUrl}
                              nombres={integrante.estudiante.nombres}
                              apellidoPaterno={integrante.estudiante.apellidoPaterno}
                              size={38}
                            />

                            <div className="cf-member-name">
                              <strong>
                                {nombreCompleto(
                                  integrante,
                                )}
                              </strong>
                              <span>
                                {participacion?.esRepresentante
                                  ? 'Representante del grupo'
                                  : 'Integrante'}
                              </span>
                            </div>

                            <div className="cf-member-final">
                              <span>
                                Nota estimada
                              </span>
                              <strong>
                                {calcularFinalPara(
                                  integrante,
                                  numero(
                                    notaBase,
                                  ),
                                  individualGuardada,
                                ).toFixed(
                                  2,
                                )}
                              </strong>
                            </div>
                          </div>

                          <div className="cf-member-statuses">
                            {participacion?.esRepresentante
                              ? (
                                  <span className="is-exempt">
                                    <ShieldCheck
                                      size={12}
                                    />
                                    Exento del comentario mínimo
                                  </span>
                                )
                              : participacion?.aplicaRequisito
                                ? (
                                    <span
                                      className={
                                        participacion.cumplio
                                          ? 'is-ok'
                                          : 'is-fail'
                                      }
                                    >
                                      <MessageSquareText
                                        size={12}
                                      />
                                      {participacion.comentariosValidos}/{participacion.minimoRequerido}{' '}
                                      comentarios
                                    </span>
                                  )
                                : null}

                            {descuentoComentario >
                            0 && (
                              <span className="is-penalty">
                                -{descuentoComentario.toFixed(
                                  2,
                                )}{' '}
                                por comentarios
                              </span>
                            )}

                            {descuentoRetraso >
                            0 && (
                              <span className="is-penalty">
                                -{descuentoRetraso.toFixed(
                                  2,
                                )}{' '}
                                por retraso
                              </span>
                            )}
                          </div>

                          {participacion?.comentarios &&
                          participacion.comentarios.length >
                            0
                            ? (
                                <div className="cf-comments-preview">
                                  {participacion.comentarios.map(
                                    (
                                      comentario,
                                    ) => (
                                      <div
                                        key={comentario.id}
                                      >
                                        <p>
                                          {comentario.contenido}
                                        </p>
                                        <small>
                                          {comentario.respuesta.grupoNombre
                                            ? `En ${comentario.respuesta.grupoNombre}`
                                            : 'Comentario del foro'}
                                          {' · '}
                                          {formatoFecha(
                                            comentario.publicadoEn,
                                          )}
                                        </small>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )
                            : !participacion?.esRepresentante &&
                                participacion?.aplicaRequisito
                              ? (
                                  <div className="cf-no-comments">
                                    No tiene comentarios válidos para esta dinámica.
                                  </div>
                                )
                              : null}
                        </article>
                      );
                    },
                  )}
                </div>
              </section>
            )}

            {!notaGrupal &&
              !notaMixta && (
                <section className="cf-individual-evidence">
                  <div className="cf-section-head">
                    <div>
                      <span className="cf-eyebrow">
                        Participación
                      </span>
                      <h3>
                        Respuesta del estudiante
                      </h3>
                    </div>
                  </div>

                  {seleccionado.respuesta
                    ? (
                        <div className="cf-main-answer">
                          <strong>
                            {seleccionado.respuesta.titulo ||
                              'Respuesta principal'}
                          </strong>
                          <p>
                            {seleccionado.respuesta.contenido ||
                              'La respuesta no contiene texto.'}
                          </p>
                          <small>
                            {seleccionado.respuesta._count?.comentarios ??
                              0}{' '}
                            comentarios ·{' '}
                            {seleccionado.respuesta._count?.archivos ??
                              0}{' '}
                            archivos
                          </small>

                          <ArchivosRespuesta
                            archivos={seleccionado.respuesta.archivos}
                          />
                        </div>
                      )
                    : (
                        <div className="cf-empty-small">
                          El estudiante no tiene una respuesta publicada.
                        </div>
                      )}

                  {seleccionado.participacionComentarios?.comentarios?.length
                    ? (
                        <div className="cf-comments-preview cf-comments-preview--individual">
                          {seleccionado.participacionComentarios.comentarios.map(
                            (
                              comentario,
                            ) => (
                              <div
                                key={comentario.id}
                              >
                                <p>
                                  {comentario.contenido}
                                </p>
                                <small>
                                  {formatoFecha(
                                    comentario.publicadoEn,
                                  )}
                                </small>
                              </div>
                            ),
                          )}
                        </div>
                      )
                    : null}
                </section>
              )}

            <section className={`cf-grade-editor ${notasPublicadas ? 'is-readonly' : ''}`}>
              <div className="cf-section-head">
                <div>
                  <span className="cf-eyebrow">
                    Evaluación
                  </span>
                  <h3>
                    {notaMixta
                      ? 'Componentes de la nota'
                      : notaGrupal
                        ? 'Nota base del grupo'
                        : 'Nota del estudiante'}
                  </h3>
                </div>
              </div>

              {notasPublicadas
                ? (
                    <div className="cf-readonly-grid">
                      {notaMixta && (
                        <>
                          <div>
                            <span>
                              Grupal ({porcentajeGrupal}%)
                            </span>
                            <strong>
                              {numero(
                                seleccionado.calificacion?.notaGrupal ??
                                  seleccionado.calificacion?.notaBase,
                              ).toFixed(
                                2,
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Individual ({porcentajeIndividual}%)
                            </span>
                            <strong>
                              {numero(
                                seleccionado.calificacion?.notaIndividual ??
                                  seleccionado.calificacion?.ajusteIndividual,
                              ).toFixed(
                                2,
                              )}
                            </strong>
                          </div>
                        </>
                      )}

                      {!notaMixta && (
                        <div>
                          <span>
                            Nota base
                          </span>
                          <strong>
                            {numero(
                              seleccionado.calificacion?.notaBase,
                            ).toFixed(
                              2,
                            )}
                          </strong>
                        </div>
                      )}

                      <div>
                        <span>
                          Retraso
                        </span>
                        <strong>
                          -{numero(
                            seleccionado.calificacion?.descuentoRetraso,
                          ).toFixed(
                            2,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Comentarios
                        </span>
                        <strong>
                          -{numero(
                            seleccionado.calificacion?.descuentoComentarios,
                          ).toFixed(
                            2,
                          )}
                        </strong>
                      </div>

                      {!notaMixta &&
                      !notaGrupal && (
                        <div>
                          <span>
                            Ajuste
                          </span>
                          <strong>
                            {numero(
                              seleccionado.calificacion?.ajusteIndividual,
                            ).toFixed(
                              2,
                            )}
                          </strong>
                        </div>
                      )}

                      <div className="is-final">
                        <span>
                          Nota final
                        </span>
                        <strong>
                          {numero(
                            seleccionado.calificacion?.notaFinal,
                          ).toFixed(
                            2,
                          )}{' '}
                          / {puntajeMaximo}
                        </strong>
                      </div>
                    </div>
                  )
                : (
                    <>
                      <div className="cf-input-grid">
                        <label>
                          <span>
                            {notaGrupal ||
                            notaMixta
                              ? 'Nota grupal'
                              : 'Nota base'}
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={puntajeMaximo}
                            step="0.01"
                            value={notaBase}
                            onChange={(
                              event,
                            ) =>
                              setNotaBase(
                                event.target.value,
                              )
                            }
                          />
                          {notaMixta && (
                            <small>
                              Pesa {porcentajeGrupal}% de la nota.
                            </small>
                          )}
                        </label>

                        {notaMixta && (
                          <label>
                            <span>
                              Nota individual de {seleccionado.estudiante.nombres}
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={puntajeMaximo}
                              step="0.01"
                              value={notaIndividual}
                              onChange={(
                                event,
                              ) =>
                                setNotaIndividual(
                                  event.target.value,
                                )
                              }
                            />
                            <small>
                              Pesa {porcentajeIndividual}% de la nota.
                            </small>
                          </label>
                        )}

                        {!notaMixta &&
                        !notaGrupal && (
                          <label>
                            <span>
                              Ajuste individual
                            </span>
                            <input
                              type="number"
                              min={-puntajeMaximo}
                              max={puntajeMaximo}
                              step="0.01"
                              value={ajuste}
                              onChange={(
                                event,
                              ) =>
                                setAjuste(
                                  event.target.value,
                                )
                              }
                            />
                            <small>
                              Opcional: corrección manual positiva o negativa.
                            </small>
                          </label>
                        )}
                      </div>

                      <div className="cf-auto-discounts">
                        {numero(
                          seleccionado.calificacion?.descuentoRetraso ??
                            seleccionado.respuesta?.descuentoCalculado,
                        ) >
                          0 && (
                          <div>
                            <Clock3
                              size={15}
                            />
                            <span>
                              <strong>
                                Retraso
                              </strong>
                              <small>
                                Descuento automático por entrega tardía.
                              </small>
                            </span>
                            <b>
                              -{numero(
                                seleccionado.calificacion?.descuentoRetraso ??
                                  seleccionado.respuesta?.descuentoCalculado,
                              ).toFixed(
                                2,
                              )}
                            </b>
                          </div>
                        )}

                        {notaGrupal &&
                        panel?.foro.penalizarIncumplimientoComentarios
                          ? (
                              <div className="cf-group-comment-summary">
                                <MessageSquareText
                                  size={15}
                                />
                                <span>
                                  <strong>
                                    Revisión de comentarios del grupo
                                  </strong>
                                  <small>
                                    {resumenComentariosGrupo.cumplidos} cumple(n) ·{' '}
                                    {resumenComentariosGrupo.pendientes} con penalización ·{' '}
                                    {resumenComentariosGrupo.exentos} exento(s).
                                    Los descuentos se aplican individualmente.
                                  </small>
                                </span>
                              </div>
                            )
                          : seleccionado.participacionComentarios?.aplicaRequisito &&
                              !seleccionado.participacionComentarios.esRepresentante
                            ? seleccionado.participacionComentarios.cumplio
                              ? (
                                  <div className="is-ok">
                                    <CheckCircle2
                                      size={15}
                                    />
                                    <span>
                                      <strong>
                                        Comentarios cumplidos
                                      </strong>
                                      <small>
                                        {seleccionado.participacionComentarios.comentariosValidos}/{seleccionado.participacionComentarios.minimoRequerido}{' '}
                                        comentarios válidos.
                                      </small>
                                    </span>
                                  </div>
                                )
                              : (
                                  <div className="is-fail">
                                    <MessageSquareText
                                      size={15}
                                    />
                                    <span>
                                      <strong>
                                        Comentarios incompletos
                                      </strong>
                                      <small>
                                        {seleccionado.participacionComentarios.comentariosValidos}/{seleccionado.participacionComentarios.minimoRequerido}{' '}
                                        comentarios. La penalización se calcula automáticamente.
                                      </small>
                                    </span>
                                    <b>
                                      -{descuentoComentariosPara(
                                        seleccionado,
                                        calcularBaseAcademica(
                                          numero(
                                            notaBase,
                                          ),
                                          numero(
                                            notaIndividual,
                                          ),
                                        ),
                                      ).toFixed(
                                        2,
                                      )}
                                    </b>
                                  </div>
                                )
                            : seleccionado.participacionComentarios?.esRepresentante
                              ? (
                                  <div className="is-exempt">
                                    <ShieldCheck
                                      size={15}
                                    />
                                    <span>
                                      <strong>
                                        Representante exento
                                      </strong>
                                      <small>
                                        No se aplica la penalización por comentarios mínimos.
                                      </small>
                                    </span>
                                  </div>
                                )
                              : null}
                      </div>

                      <div className="cf-final-box">
                        <span>
                          Nota final estimada
                        </span>
                        <strong>
                          {finalSeleccionado.toFixed(
                            2,
                          )}{' '}
                          / {puntajeMaximo}
                        </strong>
                      </div>
                    </>
                  )}

              <label className="cf-feedback">
                <span>
                  Retroalimentación
                </span>
                <textarea
                  maxLength={3000}
                  rows={4}
                  disabled={notasPublicadas}
                  value={
                    notasPublicadas
                      ? seleccionado.calificacion?.retroalimentacion ??
                        ''
                      : retroalimentacion
                  }
                  onChange={(
                    event,
                  ) =>
                    setRetroalimentacion(
                      event.target.value,
                    )
                  }
                  placeholder="Observaciones para el estudiante o grupo…"
                />
              </label>
            </section>
          </div>
        )}
      </AulaModal>

      <AulaModal
        abierto={modalReportesAbierto}
        titulo="Exportar calificaciones"
        etiqueta="Reportes generales"
        descripcion="Selecciona el formato del reporte académico del foro."
        ancho="mediano"
        bloqueado={Boolean(
          descargandoReporte,
        )}
        onCerrar={() =>
          setModalReportesAbierto(
            false,
          )
        }
      >
        <div className="cf-report-options">
          {([
            [
              'PDF',
              FileText,
              'Informe institucional verificable con QR.',
            ],
            [
              'EXCEL',
              FileSpreadsheet,
              'Detalle editable de las calificaciones.',
            ],
            [
              'CSV',
              FileSpreadsheet,
              'Formato ligero para análisis de datos.',
            ],
          ] as const).map(
            (
              [
                formato,
                Icono,
                descripcion,
              ],
            ) => (
              <button
                key={formato}
                type="button"
                className="cf-report-option"
                disabled={Boolean(
                  descargandoReporte,
                )}
                onClick={() =>
                  void descargarReporte(
                    formato,
                  )
                }
              >
                <Icono
                  size={22}
                />
                <span>
                  <strong>
                    {formato}
                  </strong>
                  <small>
                    {descripcion}
                  </small>
                </span>
                <Download
                  size={16}
                />
              </button>
            ),
          )}

          {descargandoReporte && (
            <div className="cf-report-loading">
              <span className="cf-spinner" />
              Generando {descargandoReporte}…
            </div>
          )}
        </div>
      </AulaModal>

      <AulaModal
        abierto={Boolean(
          confirmacion,
        )}
        titulo={
          confirmacion ===
          'PUBLICAR'
            ? 'Publicar calificaciones'
            : 'Reabrir calificaciones'
        }
        etiqueta="Confirmación"
        descripcion={
          confirmacion ===
          'PUBLICAR'
            ? 'Los estudiantes podrán consultar sus notas.'
            : 'Las notas dejarán de estar publicadas mientras realizas correcciones.'
        }
        ancho="compacto"
        bloqueado={procesando}
        onCerrar={() =>
          setConfirmacion(
            null,
          )
        }
        footer={
          <>
            <button
              className="cf-btn cf-btn--secundario"
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
              className="cf-btn cf-btn--principal"
              disabled={procesando}
              onClick={() =>
                void confirmarAccion()
              }
            >
              {procesando
                ? 'Procesando…'
                : 'Confirmar'}
            </button>
          </>
        }
      >
        <p className="cf-confirmacion">
          Esta acción quedará registrada en el historial del foro.
        </p>
      </AulaModal>

      <Toast
        {...toast}
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
.cf-pagina {
  width: 100%;
  min-width: 0;
  display: grid;
  gap: 14px;
  color: var(--app-text);
}

.cf-estado,
.cf-state-card {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: var(--app-text-soft);
  font-size: 11px;
}

.cf-spinner {
  width: 17px;
  height: 17px;
  border: 2px solid var(--app-border);
  border-top-color: var(--app-accent);
  border-radius: 999px;
  animation: cfSpin .8s linear infinite;
}

@keyframes cfSpin {
  to { transform: rotate(360deg); }
}

.cf-header,
.cf-subview-title-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
}

.cf-header__content,
.cf-title-identity {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.cf-header__icon,
.cf-title-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 15px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.cf-header h2,
.cf-subview-title-card h3,
.cf-section-head h3 {
  margin: 4px 0 0;
  color: var(--app-text);
  font-weight: 850;
}

.cf-header h2 { font-size: 22px; }
.cf-subview-title-card h3 { font-size: 17px; }
.cf-section-head h3 { font-size: 15px; }

.cf-header p,
.cf-subview-title-card p {
  margin: 5px 0 0;
  color: var(--app-text-soft);
  font-size: 10px;
  line-height: 1.5;
}

.cf-eyebrow {
  display: block;
  color: var(--app-accent-dark);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.cf-volver {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 0 0 6px;
  padding: 0;
  border: 0;
  color: var(--app-text-muted);
  background: transparent;
  font: inherit;
  font-size: 9px;
  cursor: pointer;
}

.cf-header__acciones,
.cf-mini-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  justify-content: flex-end;
}

.cf-mini-actions button {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 11px;
  border: 1px solid var(--app-border-strong);
  border-radius: 999px;
  color: var(--app-text-secondary);
  background: var(--app-surface-alt);
  font: inherit;
  font-size: 9px;
  font-weight: 750;
  cursor: pointer;
}

.cf-btn {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 999px;
  font: inherit;
  font-size: 9.5px;
  font-weight: 800;
  cursor: pointer;
}

.cf-btn:disabled,
.cf-mini-actions button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.cf-btn--principal {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, var(--app-accent), var(--app-accent-hover));
}

.cf-btn--secundario {
  border: 1px solid var(--app-border-strong);
  color: var(--app-text-secondary);
  background: var(--app-surface-alt);
}

.cf-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.cf-summary-card {
  min-height: 68px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 17px;
  background: var(--app-surface);
}

.cf-summary-card > svg {
  color: var(--app-accent-dark);
}

.cf-summary-card strong {
  display: block;
  color: var(--app-text);
  font-size: 19px;
  line-height: 1;
}

.cf-summary-card span {
  display: block;
  margin-top: 4px;
  color: var(--app-text-muted);
  font-size: 9px;
}

.cf-rules-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 9px 12px;
  border: 1px solid var(--app-border-soft);
  border-radius: 14px;
  background: var(--app-surface-alt);
}

.cf-rules-strip span {
  padding: 5px 8px;
  border-radius: 999px;
  color: var(--app-text-soft);
  background: var(--app-surface);
  font-size: 8.5px;
}

.cf-rules-strip strong {
  color: var(--app-text-secondary);
}

.cf-users-card {
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 17px;
  background: var(--app-surface);
}

.cf-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cf-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cf-filters button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid var(--app-input-border);
  border-radius: 999px;
  color: var(--app-text-soft);
  background: var(--app-surface);
  font: inherit;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
}

.cf-filters button.active {
  border-color: var(--app-accent);
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.cf-filters button span {
  min-width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--app-accent-softer);
  font-size: 8px;
}

.cf-search-box {
  min-width: 250px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  border: 1px solid var(--app-input-border);
  border-radius: 12px;
  color: var(--app-text-muted);
  background: var(--app-input-bg);
}

.cf-search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  color: var(--app-text);
  background: transparent;
  font: inherit;
  font-size: 9.5px;
}

.cf-table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--app-border);
  border-radius: 17px;
  background: var(--app-surface);
}

.cf-table {
  width: 100%;
  min-width: 940px;
  border-collapse: collapse;
}

.cf-table th,
.cf-table td {
  padding: 10px 11px;
  border-bottom: 1px solid var(--app-border-soft);
  text-align: left;
  vertical-align: middle;
}

.cf-table th {
  color: var(--app-text-soft);
  background: var(--app-accent-soft);
  font-size: 8.5px;
  font-weight: 850;
  text-transform: uppercase;
}

.cf-table td {
  color: var(--app-text-secondary);
  font-size: 9.5px;
}

.cf-table tbody tr:last-child td { border-bottom: 0; }
.cf-table tbody tr:hover { background: var(--app-accent-softer); }

.cf-user-cell {
  min-width: 220px;
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 9px;
}

.cf-table-avatar {
  position: relative;
  display: grid !important;
  place-items: center !important;
  flex: 0 0 auto;
  align-self: center;
  line-height: 1;
}

.cf-table-avatar .ius-avatar__surface {
  position: relative;
  display: grid !important;
  place-items: center !important;
  width: 100%;
  height: 100%;
}

.cf-table-avatar .ius-avatar__initials {
  position: absolute !important;
  inset: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 0 !important;
  transform: none !important;
  line-height: 1 !important;
}

.cf-user-cell > div:last-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.cf-user-cell strong {
  display: block;
  color: var(--app-text);
  font-size: 10px;
}

.cf-user-cell span {
  display: block;
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 8.5px;
}

.cf-group-badge,
.cf-count-pill,
.cf-badge,
.cf-grade-state,
.cf-participacion {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 750;
}

.cf-group-badge {
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
}

.cf-count-pill {
  color: var(--app-text-soft);
  background: var(--app-surface-alt);
}

.cf-badge.is-success,
.cf-participacion.is-ok,
.cf-grade-state.is-calificada,
.cf-grade-state.is-publicada {
  color: var(--app-success);
  background: var(--app-success-bg);
}

.cf-badge.is-danger,
.cf-participacion.is-fail {
  color: var(--app-danger);
  background: var(--app-danger-bg);
}

.cf-participacion--rep {
  color: var(--app-info);
  background: var(--app-info-bg);
}

.cf-grade-state.is-pendiente,
.cf-grade-state.is-borrador {
  color: var(--app-warning-strong);
  background: var(--app-warning-bg);
}

.cf-nota {
  color: var(--app-text);
  font-size: 10px;
}

.cf-action-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border: 1px solid var(--app-border-strong);
  border-radius: 999px;
  color: var(--app-accent-dark);
  background: var(--app-surface-alt);
  font: inherit;
  font-size: 8.5px;
  font-weight: 750;
  cursor: pointer;
}

.cf-muted {
  color: var(--app-text-muted);
  font-size: 8.5px;
}

.cf-editor {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(310px, .8fr);
  gap: 14px;
  align-items: start;
  max-height: min(64vh, 650px);
  overflow-y: auto;
  padding-right: 5px;
  scrollbar-gutter: stable;
}

.cf-editor::-webkit-scrollbar {
  width: 7px;
}

.cf-editor::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: var(--app-border-strong);
}

.cf-group-context,
.cf-members-section,
.cf-individual-evidence,
.cf-grade-editor {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 17px;
  background: var(--app-surface);
}

.cf-group-context,
.cf-members-section,
.cf-individual-evidence {
  grid-column: 1;
}

.cf-grade-editor {
  grid-column: 2;
  grid-row: 1 / span 3;
  position: sticky;
  top: 0;
}

.cf-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.cf-main-answer {
  padding: 11px 12px;
  border: 1px solid var(--app-border-soft);
  border-radius: 13px;
  background: var(--app-surface-alt);
}

.cf-main-answer strong {
  color: var(--app-text);
  font-size: 10.5px;
}

.cf-main-answer p {
  margin: 6px 0;
  color: var(--app-text-secondary);
  font-size: 9.5px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.cf-main-answer small,
.cf-empty-small,
.cf-no-comments {
  color: var(--app-text-muted);
  font-size: 8px;
}

.cf-answer-files {
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px dashed var(--app-border-strong);
}

.cf-answer-files__title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--app-text-secondary);
}

.cf-answer-files__title strong {
  font-size: 8.5px;
}

.cf-answer-files__title span {
  min-width: 19px;
  height: 19px;
  display: grid;
  place-items: center;
  margin-left: auto;
  border-radius: 999px;
  color: var(--app-accent-dark);
  background: var(--app-accent-soft);
  font-size: 7.5px;
  font-weight: 800;
}

.cf-answer-files__list {
  display: grid;
  gap: 6px;
  margin-top: 7px;
}

.cf-answer-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 9px;
  border: 1px solid var(--app-border-soft);
  border-radius: 11px;
  background: var(--app-surface);
}

.cf-answer-file__info {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--app-accent-dark);
}

.cf-answer-file__info > span {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.cf-answer-file__info strong {
  overflow: hidden;
  color: var(--app-text);
  font-size: 8.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cf-answer-file__info small {
  color: var(--app-text-muted);
  font-size: 7px;
}

.cf-answer-file__actions {
  display: flex;
  flex-shrink: 0;
  gap: 5px;
}

.cf-answer-file__actions button,
.cf-answer-file__actions a {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 8px;
  border: 1px solid var(--app-border-strong);
  border-radius: 9px;
  color: var(--app-accent-dark);
  background: var(--app-surface-alt);
  font: inherit;
  font-size: 7.5px;
  font-weight: 750;
  text-decoration: none;
  cursor: pointer;
}

.cf-answer-file__actions button:hover,
.cf-answer-file__actions a:hover {
  border-color: var(--app-accent);
  background: var(--app-accent-soft);
}

.cf-answer-file__missing {
  color: var(--app-danger);
  font-size: 7.5px;
}

.cf-members-list {
  display: grid;
  gap: 8px;
}

.cf-member-card {
  padding: 10px;
  border: 1px solid var(--app-border-soft);
  border-radius: 13px;
  background: var(--app-surface-alt);
}

.cf-member-card.is-selected {
  border-color: color-mix(in srgb, var(--app-accent) 45%, var(--app-border));
  background: var(--app-accent-softer);
}

.cf-member-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cf-member-name {
  min-width: 0;
  flex: 1;
}

.cf-member-name strong {
  display: block;
  color: var(--app-text);
  font-size: 9.5px;
}

.cf-member-name span {
  display: block;
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 7.5px;
}

.cf-member-final {
  min-width: 72px;
  display: grid;
  justify-items: end;
  gap: 1px;
}

.cf-member-final span {
  color: var(--app-text-muted);
  font-size: 7px;
  font-weight: 650;
}

.cf-member-final strong {
  color: var(--app-accent-dark);
  font-size: 13px;
}

.cf-member-statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.cf-member-statuses > span,
.cf-auto-discounts > div {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 7px;
  border-radius: 10px;
  font-size: 7.8px;
}

.is-ok {
  color: var(--app-success) !important;
  background: var(--app-success-bg) !important;
}

.is-fail,
.is-penalty {
  color: var(--app-danger) !important;
  background: var(--app-danger-bg) !important;
}

.is-exempt {
  color: var(--app-info) !important;
  background: var(--app-info-bg) !important;
}

.cf-comments-preview {
  display: grid;
  gap: 5px;
  margin-top: 8px;
}

.cf-comments-preview > div {
  padding: 7px 8px;
  border-left: 3px solid var(--app-accent);
  border-radius: 0 9px 9px 0;
  background: var(--app-surface);
}

.cf-comments-preview p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 8.5px;
  line-height: 1.45;
}

.cf-comments-preview small {
  display: block;
  margin-top: 4px;
  color: var(--app-text-muted);
  font-size: 7px;
}

.cf-comments-preview--individual {
  margin-top: 10px;
}

.cf-input-grid {
  display: grid;
  gap: 10px;
}

.cf-input-grid label,
.cf-feedback {
  display: grid;
  gap: 5px;
  color: var(--app-text-secondary);
  font-size: 8.5px;
  font-weight: 700;
}

.cf-input-grid input,
.cf-feedback textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--app-input-border);
  border-radius: 11px;
  outline: 0;
  color: var(--app-text);
  background: var(--app-input-bg);
  font: inherit;
}

.cf-input-grid input {
  height: 38px;
  padding: 0 10px;
}

.cf-feedback textarea {
  padding: 9px 10px;
  resize: vertical;
  line-height: 1.5;
}

.cf-input-grid input:focus,
.cf-feedback textarea:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-input-ring);
}

.cf-input-grid small {
  color: var(--app-text-muted);
  font-size: 7.5px;
  font-weight: 500;
}

.cf-auto-discounts {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.cf-auto-discounts > div {
  width: 100%;
  box-sizing: border-box;
  color: var(--app-text-soft);
  background: var(--app-surface-alt);
}

.cf-auto-discounts span {
  min-width: 0;
  display: grid;
  flex: 1;
}

.cf-auto-discounts strong {
  color: inherit;
  font-size: 8px;
}

.cf-auto-discounts small {
  margin-top: 2px;
  color: inherit;
  opacity: .82;
  font-size: 7px;
}

.cf-auto-discounts b {
  font-size: 9px;
}

.cf-group-comment-summary {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 10px !important;
  border: 1px solid color-mix(in srgb, var(--app-info) 28%, var(--app-border));
  border-radius: 11px !important;
  color: var(--app-info) !important;
  background: var(--app-info-bg) !important;
}

.cf-group-comment-summary > span {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.cf-group-comment-summary strong {
  color: var(--app-text);
  font-size: 8.5px;
}

.cf-group-comment-summary small {
  color: var(--app-text-secondary);
  font-size: 7.4px;
  line-height: 1.45;
}

.cf-final-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 11px;
  padding: 10px 11px;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, var(--app-accent), var(--app-accent-hover));
}

.cf-final-box span {
  font-size: 8px;
  font-weight: 700;
}

.cf-final-box strong {
  font-size: 14px;
}

.cf-feedback {
  margin-top: 11px;
}

.cf-readonly-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.cf-readonly-grid > div {
  padding: 9px;
  border-radius: 11px;
  background: var(--app-surface-alt);
}

.cf-readonly-grid span {
  display: block;
  color: var(--app-text-muted);
  font-size: 7.5px;
}

.cf-readonly-grid strong {
  display: block;
  margin-top: 3px;
  color: var(--app-text);
  font-size: 11px;
}

.cf-readonly-grid .is-final {
  grid-column: 1 / -1;
  background: var(--app-accent-soft);
}

.cf-report-options {
  display: grid;
  gap: 8px;
}

.cf-report-option {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border: 1px solid var(--app-border);
  border-radius: 13px;
  color: var(--app-text-secondary);
  background: var(--app-surface-alt);
  text-align: left;
  cursor: pointer;
}

.cf-report-option span {
  display: grid;
}

.cf-report-option strong {
  color: var(--app-text);
  font-size: 9px;
}

.cf-report-option small {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 7.5px;
}

.cf-report-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 8px;
  color: var(--app-text-muted);
  font-size: 8px;
}

.cf-confirmacion {
  margin: 0;
  color: var(--app-text-soft);
  font-size: 9px;
  line-height: 1.5;
}

@media (max-width: 1050px) {
  .cf-editor {
    grid-template-columns: 1fr;
  }

  .cf-grade-editor {
    grid-column: 1;
    grid-row: auto;
    position: static;
  }
}

@media (max-width: 680px) {
  .cf-answer-file {
    align-items: stretch;
    flex-direction: column;
  }

  .cf-answer-file__actions {
    width: 100%;
  }

  .cf-answer-file__actions button,
  .cf-answer-file__actions a {
    flex: 1;
  }
}

@media (max-width: 900px) {
  .cf-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cf-filter-bar,
  .cf-header,
  .cf-subview-title-card {
    align-items: stretch;
    flex-direction: column;
  }

  .cf-search-box {
    min-width: 0;
  }
}

@media (max-width: 560px) {
  .cf-summary-grid {
    grid-template-columns: 1fr;
  }

  .cf-header__content,
  .cf-title-identity {
    align-items: flex-start;
  }
}
`;
