import {
  AlertCircle,
  AlarmClock,
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  Eye,
  File,
  Files,
  Loader2,
  GraduationCap,
  Info,
  Lock,
  Plus,
  Presentation,
  RefreshCw,
  ShieldCheck,
  Users,
  UsersRound,
} from 'lucide-react';

import type {
  CSSProperties,
} from 'react';

import {
  useEffect,
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

import Toast, {
  type TipoToast,
} from '../../../components/shared/Toast';

import EstadoTemporalTareaEstudiante, {
  type EstadoTemporalTarea,
} from '../../../components/tareas/EstadoTemporalTareaEstudiante';

import ExperienciaTareaEstudiante from '../../../components/tareas/ExperienciaTareaEstudiante';

import {
  visualTipoTarea,
} from '../../../config/tareasVisual.config';

import FormarEquipoAfinidadTareaModal, {
  type EstudianteDisponibleAfinidadTarea,
} from '../../../components/tareas/FormarEquipoAfinidadTareaModal';

import type {
  ContextoGrupoEntregaTarea,
  EquipoAfinidadTarea,
} from '../../../types/tareas/entregas.types';

import {
  useAuth,
} from '../../../auth/AuthContext';

import type {
  ResponsableEntregaGrupo,
  TareaCurso,
} from '../../../types/tareas/tareas.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';


type ArchivoDocente =
  TareaCurso['archivos'][number];

type ToastArchivo = {
  visible: boolean;
  tipo: TipoToast;
  titulo: string;
  mensaje?: string;
};

function esPdfDocente(
  archivo:
    ArchivoDocente,
) {
  return (
    archivo.mimeType ===
      'application/pdf' ||
    archivo.extension
      .toLowerCase() ===
      'pdf'
  );
}


function etiquetaComponente(
  valor:
    TareaCurso['componente'],
) {
  if (
    valor ===
    'CONTINUA'
  ) {
    return 'Continua';
  }

  if (
    valor ===
    'PROCESUAL'
  ) {
    return 'Procesual';
  }

  return 'No definida';
}

function nombreRepresentante(
  contexto:
    ContextoGrupoEntregaTarea | null,
) {
  if (
    !contexto?.representante
  ) {
    return 'Sin representante';
  }

  return `${contexto.representante.nombres} ${contexto.representante.apellidoPaterno}`;
}

function fecha(
  valor?:
    string | null,
) {
  if (!valor) {
    return 'Sin definir';
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
    objeto,
  );
}

function textoConfiguracion<
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

function numeroConfiguracion(
  tarea:
    TareaCurso,
  clave:
    string,
  predeterminado:
    number,
) {
  const valor =
    tarea.configuracionTipo?.[
      clave
    ];

  return typeof valor ===
      'number' &&
    Number.isFinite(
      valor,
    )
    ? valor
    : predeterminado;
}


function mensajeApi(
  valor:
    unknown,
  fallback:
    string,
) {
  if (
    !valor ||
    typeof valor !==
      'object'
  ) {
    return fallback;
  }

  const datos =
    valor as {
      message?: string | string[];
      mensaje?: string;
      error?: string;
    };

  if (
    Array.isArray(
      datos.message,
    )
  ) {
    return datos.message.join(
      '. ',
    );
  }

  return (
    datos.message ||
    datos.mensaje ||
    datos.error ||
    fallback
  );
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

export default function DetalleTareaEstudiante() {
  const navigate =
    useNavigate();

  const {
    accessToken,
  } =
    useAuth();

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

  const [
    tarea,
    setTarea,
  ] =
    useState<TareaCurso | null>(
      null,
    );

  const [
    extension,
    setExtension,
  ] =
    useState<{
      id:
        number;

      motivo:
        string | null;

      fechaAperturaExtendida:
        string | null;

      fechaLimiteExtendida:
        string | null;

      fechaMaximaRetrasoExtendida:
        string | null;
    } | null>(
      null,
    );

  const [
    calificacion,
    setCalificacion,
  ] = useState<{
    notaBase: number | string;
    descuentoRetraso: number | string;
    ajusteIndividual: number | string;
    notaFinal: number | string;
    retroalimentacion: string | null;
    calificadaEn: string | null;
    publicadaEn: string | null;
  } | null>(null);

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    modalDetalle,
    setModalDetalle,
  ] =
    useState(
      false,
    );

  const [
    estadoTemporal,
    setEstadoTemporal,
  ] =
    useState<EstadoTemporalTarea>({
      disponible: false,
      tardia: false,
      cerrada: false,
      antesApertura: false,
    });

  const [
    contextoGrupo,
    setContextoGrupo,
  ] =
    useState<ContextoGrupoEntregaTarea | null>(
      null,
    );

  const [
    equipoAfinidad,
    setEquipoAfinidad,
  ] =
    useState<EquipoAfinidadTarea | null>(
      null,
    );

  const [
    cargandoEquipo,
    setCargandoEquipo,
  ] =
    useState(
      false,
    );

  const [
    modalEquipo,
    setModalEquipo,
  ] =
    useState(
      false,
    );

  const [
    estudiantesAfinidad,
    setEstudiantesAfinidad,
  ] =
    useState<EstudianteDisponibleAfinidadTarea[]>(
      [],
    );

  const [
    minimoEquipo,
    setMinimoEquipo,
  ] =
    useState(
      2,
    );

  const [
    maximoEquipo,
    setMaximoEquipo,
  ] =
    useState(
      5,
    );

  const [
    procesandoEquipo,
    setProcesandoEquipo,
  ] =
    useState(
      false,
    );

  const [
    errorEquipo,
    setErrorEquipo,
  ] =
    useState<string | null>(
      null,
    );

  const [
    versionEntrega,
    setVersionEntrega,
  ] =
    useState(
      0,
    );


  const [
    archivoAbriendoId,
    setArchivoAbriendoId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    toastArchivo,
    setToastArchivo,
  ] =
    useState<ToastArchivo>({
      visible: false,
      tipo: 'informacion',
      titulo: '',
    });

  useEffect(
    () => {
      if (
        !accessToken ||
        !idCurso ||
        !idTarea
      ) {
        setCargando(
          false,
        );
        return;
      }

      const cargar =
        async () => {
          setCargando(
            true,
          );

          setError(
            null,
          );

          try {
            const respuesta =
              await fetch(
                `${API_URL}/tareas/estudiante/cursos/${idCurso}/${idTarea}`,
                {
                  cache:
                    'no-store',

                  headers: {
                    Authorization:
                      `Bearer ${accessToken}`,
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
                'No fue posible abrir la tarea.',
              );
            }

            setTarea(
              (
                cuerpo as {
                  tarea:
                    TareaCurso;
                }
              ).tarea,
            );

            setExtension(
              (
                cuerpo as {
                  extension?:
                    typeof extension;
                }
              ).extension ??
                null,
            );

            setCalificacion(
              (
                cuerpo as {
                  calificacion?: typeof calificacion;
                }
              ).calificacion ?? null,
            );
          } catch (
            causa
          ) {
            setError(
              causa instanceof Error
                ? causa.message
                : 'No fue posible abrir la tarea.',
            );
          } finally {
            setCargando(
              false,
            );
          }
        };

      void cargar();
    },
    [
      accessToken,
      idCurso,
      idTarea,
    ],
  );



  const cargarMiEquipoAfinidad =
    async (
      tareaActual:
        TareaCurso,
    ) => {
      if (
        !accessToken ||
        tareaActual.modalidad !==
          'GRUPAL' ||
        tareaActual.origenGrupo !==
          'AFINIDAD'
      ) {
        setEquipoAfinidad(
          null,
        );

        return;
      }

      setCargandoEquipo(
        true,
      );

      setErrorEquipo(
        null,
      );

      try {
        const respuesta =
          await fetch(
            `${API_URL}/tareas/cursos/${tareaActual.cursoId}/${tareaActual.id}/equipos-afinidad/mi-equipo`,
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
          throw new Error(
            mensajeApi(
              cuerpo,
              'No fue posible consultar tu equipo.',
            ),
          );
        }

        const datos =
          cuerpo as {
            equipo:
              EquipoAfinidadTarea | null;

            minimoIntegrantes:
              number;

            maximoIntegrantes:
              number;
          };

        setEquipoAfinidad(
          datos.equipo,
        );

        setMinimoEquipo(
          datos.minimoIntegrantes,
        );

        setMaximoEquipo(
          datos.maximoIntegrantes,
        );
      } catch (
        causa
      ) {
        setErrorEquipo(
          causa instanceof Error
            ? causa.message
            : 'No fue posible consultar tu equipo.',
        );
      } finally {
        setCargandoEquipo(
          false,
        );
      }
    };

  useEffect(
    () => {
      if (
        !tarea
      ) {
        return;
      }

      void cargarMiEquipoAfinidad(
        tarea,
      );
    },
    [
      accessToken,
      tarea,
    ],
  );

  const abrirFormacionEquipo =
    async () => {
      if (
        !tarea ||
        !accessToken
      ) {
        return;
      }

      setProcesandoEquipo(
        true,
      );

      setErrorEquipo(
        null,
      );

      try {
        const respuesta =
          await fetch(
            `${API_URL}/tareas/cursos/${tarea.cursoId}/${tarea.id}/equipos-afinidad/estudiantes-disponibles`,
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
          throw new Error(
            mensajeApi(
              cuerpo,
              'No fue posible consultar los estudiantes disponibles.',
            ),
          );
        }

        const datos =
          cuerpo as {
            yaTieneEquipo:
              boolean;

            equipo:
              {
                id:
                  number;

                nombre:
                  string;
              } | null;

            minimoIntegrantes:
              number;

            maximoIntegrantes:
              number;

            estudiantes:
              EstudianteDisponibleAfinidadTarea[];
          };

        setMinimoEquipo(
          datos.minimoIntegrantes,
        );

        setMaximoEquipo(
          datos.maximoIntegrantes,
        );

        if (
          datos.yaTieneEquipo
        ) {
          await cargarMiEquipoAfinidad(
            tarea,
          );

          setVersionEntrega(
            (
              actual,
            ) =>
              actual +
              1,
          );

          return;
        }

        setEstudiantesAfinidad(
          datos.estudiantes,
        );

        setModalEquipo(
          true,
        );
      } catch (
        causa
      ) {
        setErrorEquipo(
          causa instanceof Error
            ? causa.message
            : 'No fue posible preparar la formación del equipo.',
        );
      } finally {
        setProcesandoEquipo(
          false,
        );
      }
    };

  const crearEquipoAfinidad =
    async (
      integrantesIds:
        number[],
    ) => {
      if (
        !tarea ||
        !accessToken
      ) {
        return;
      }

      setProcesandoEquipo(
        true,
      );

      setErrorEquipo(
        null,
      );

      try {
        const respuesta =
          await fetch(
            `${API_URL}/tareas/cursos/${tarea.cursoId}/${tarea.id}/equipos-afinidad`,
            {
              method:
                'POST',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,

                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  integrantesIds,
                }),
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
          throw new Error(
            mensajeApi(
              cuerpo,
              'No fue posible crear el equipo.',
            ),
          );
        }

        setModalEquipo(
          false,
        );

        setEstudiantesAfinidad(
          [],
        );

        await cargarMiEquipoAfinidad(
          tarea,
        );

        setVersionEntrega(
          (
            actual,
          ) =>
            actual +
            1,
        );
      } catch (
        causa
      ) {
        const mensaje =
          causa instanceof Error
            ? causa.message
            : 'No fue posible crear el equipo.';

        setErrorEquipo(
          mensaje,
        );

        throw new Error(
          mensaje,
        );
      } finally {
        setProcesandoEquipo(
          false,
        );
      }
    };


  const abrirArchivoDocente =
    async (
      archivo:
        ArchivoDocente,
    ) => {
      if (
        !accessToken
      ) {
        setToastArchivo({
          visible: true,
          tipo: 'error',
          titulo: 'Sesión no disponible',
          mensaje:
            'Tu sesión terminó. Inicia sesión nuevamente.',
        });

        return;
      }

      if (
        !esPdfDocente(
          archivo,
        )
      ) {
        setToastArchivo({
          visible: true,
          tipo: 'informacion',
          titulo: 'Vista previa no disponible',
          mensaje:
            'Por ahora la vista directa está habilitada para archivos PDF.',
        });

        return;
      }

      const ventana =
        window.open(
          '',
          '_blank',
        );

      if (
        !ventana
      ) {
        setToastArchivo({
          visible: true,
          tipo: 'advertencia',
          titulo: 'No se pudo abrir el archivo',
          mensaje:
            'El navegador no permitió crear una nueva pestaña. Intenta nuevamente.',
        });

        return;
      }

      ventana.opener =
        null;

      ventana.document.title =
        archivo.nombreOriginal;

      ventana.document.body.innerHTML = `
        <div style="
          min-height: 100vh;
          display: grid;
          place-items: center;
          margin: 0;
          padding: 24px;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
          color: #475569;
          background: #fffaf4;
        ">
          <div style="text-align: center;">
            <strong style="display: block; color: #0f172a; font-size: 16px; margin-bottom: 6px;">
              Cargando archivo…
            </strong>
            <span style="font-size: 13px;">
              ${archivo.nombreOriginal}
            </span>
          </div>
        </div>
      `;

      setArchivoAbriendoId(
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
          !respuesta.ok
        ) {
          const cuerpo =
            await respuesta
              .json()
              .catch(
                () =>
                  null,
              );

          throw new Error(
            mensajeApi(
              cuerpo,
              'No fue posible abrir el archivo.',
            ),
          );
        }

        const blob =
          await respuesta.blob();

        const pdf =
          blob.type ===
            'application/pdf'
            ? blob
            : new Blob(
                [
                  blob,
                ],
                {
                  type:
                    'application/pdf',
                },
              );

        const url =
          URL.createObjectURL(
            pdf,
          );

        ventana.document.open();
        ventana.document.write(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${archivo.nombreOriginal
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')}</title>
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        background: #111827;
      }

      body {
        overflow: hidden;
      }

      iframe {
        width: 100%;
        height: 100%;
        border: 0;
        display: block;
        background: #ffffff;
      }
    </style>
  </head>
  <body>
    <iframe
      src="${url}"
      title="${archivo.nombreOriginal
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')}"
    ></iframe>
  </body>
</html>`);
        ventana.document.close();

        const liberarUrl =
          () => {
            URL.revokeObjectURL(
              url,
            );
          };

        ventana.addEventListener(
          'beforeunload',
          liberarUrl,
          { once: true },
        );
      } catch (
        causa
      ) {
        ventana.close();

        setToastArchivo({
          visible: true,
          tipo: 'error',
          titulo: 'No se pudo abrir el archivo',
          mensaje:
            causa instanceof Error
              ? causa.message
              : 'No fue posible abrir el PDF.',
        });
      } finally {
        setArchivoAbriendoId(
          null,
        );
      }
    };

  if (
    cargando
  ) {
    return (
      <section className="dte-page">
        <AulaSkeleton
          cantidad={4}
          variante="tarjetas"
        />

        <style>
          {styles}
        </style>
      </section>
    );
  }

  if (
    !tarea
  ) {
    return (
      <section className="dte-page">
        <AulaEmptyState
          icono={
            AlertCircle
          }
          titulo="No fue posible abrir la tarea"
          descripcion={
            error ||
            'La actividad todavía no está disponible.'
          }
          accionTexto="Volver a tareas"
          onAccion={() =>
            navigate(
              `/estudiante/cursos/${idCurso}/tareas`,
            )
          }
        />

        <style>
          {styles}
        </style>
      </section>
    );
  }

  const tipo =
    visualTipoTarea[
      tarea.tipo
    ];

  const Icono =
    tipo.icono;

  const estilo =
    {
      '--dte-color':
        'var(--app-accent)',
      '--dte-fondo':
        'var(--app-accent-soft)',
    } as CSSProperties;

  const responsable =
    tarea.origenGrupo ===
      'AFINIDAD'
      ? 'SOLO_REPRESENTANTE'
      : textoConfiguracion<ResponsableEntregaGrupo>(
          tarea,
          'responsableEntregaGrupo',
          [
            'SOLO_REPRESENTANTE',
            'CUALQUIER_INTEGRANTE',
          ],
          'SOLO_REPRESENTANTE',
        );

  const minimo =
    numeroConfiguracion(
      tarea,
      'cantidadMinimaIntegrantes',
      2,
    );

  const maximo =
    numeroConfiguracion(
      tarea,
      'cantidadMaximaIntegrantes',
      5,
    );

  const componenteEvaluacion =
    etiquetaComponente(
      tarea.componente,
    );

  const representanteEquipoAfinidad =
    equipoAfinidad?.integrantes.find(
      (
        integrante,
      ) =>
        integrante.esRepresentante,
    );

  const representanteNombre =
    representanteEquipoAfinidad
      ? `${representanteEquipoAfinidad.estudiante.nombres} ${representanteEquipoAfinidad.estudiante.apellidoPaterno}`
      : nombreRepresentante(
          contextoGrupo,
        );

  return (
    <section
      className="dte-page"
      style={
        estilo
      }
    >
      <AulaHeader
        icono={
          Icono
        }
        etiqueta={`Tarea · ${tarea.hito.codigo}`}
        titulo={
          tarea.titulo
        }
        descripcion={
          tarea.descripcion ||
          tipo.descripcionEstudiante
        }
        informacion={`Apertura: ${fecha(
          tarea.fechaApertura,
        )} · Límite: ${fecha(
          tarea.fechaLimite,
        )}`}
        acciones={[
          {
            texto:
              'Volver a tareas',
            icono:
              ArrowLeft,
            onClick: () =>
              navigate(
                `/estudiante/cursos/${idCurso}/tareas`,
              ),
          },
          {
            texto:
              'Detalles',
            icono:
              Info,
            variante:
              'primaria',
            onClick: () =>
              setModalDetalle(
                true,
              ),
          },
        ]}
      />

      {extension && (
        <div className="dte-extension">
          <AlarmClock
            size={20}
          />

          <div>
            <strong>
              Tu plazo fue ampliado
            </strong>

            <span>
              {
                extension.fechaLimiteExtendida
                  ? `Nueva fecha límite: ${fecha(extension.fechaLimiteExtendida)}`
                  : 'El docente amplió el plazo de esta tarea para ti.'
              }
              {
                extension.motivo
                  ? ` · ${extension.motivo}`
                  : ''
              }
            </span>
          </div>
        </div>
      )}

      {calificacion && (
        <section className="dte-calificacion-publicada">
          <div className="dte-calificacion-publicada__encabezado">
            <Award size={20} />
            <div>
              <strong>Calificación publicada</strong>
              <span>El docente ya publicó el resultado de esta tarea.</span>
            </div>
            <b>
              {Number(calificacion.notaFinal).toFixed(2)} /{' '}
              {Number(tarea.puntajeMaximo).toFixed(2)}
            </b>
          </div>

          {calificacion.retroalimentacion?.trim() && (
            <div className="dte-calificacion-publicada__retroalimentacion">
              <strong>Retroalimentación del docente</strong>
              <p>{calificacion.retroalimentacion}</p>
            </div>
          )}
        </section>
      )}

      <EstadoTemporalTareaEstudiante
        tarea={
          tarea
        }
        onEstado={
          setEstadoTemporal
        }
      />

      <section className="dte-actividad">
        <div className="dte-actividad__top">
          <span className="dte-chip dte-chip--tipo">
            <Icono
              size={13}
            />
            {
              tipo.nombre
            }
          </span>

          <span className="dte-chip">
            <Users
              size={13}
            />
            {tarea.modalidad ===
              'GRUPAL'
              ? 'Grupal'
              : 'Individual'}
          </span>

          {tarea.esCalificable && (
            <span className="dte-chip dte-chip--nota">
              <Award
                size={13}
              />
              {Number(
                tarea.puntajeMaximo,
              )} pts
            </span>
          )}

          {tarea.componente && (
            <span
              className={`dte-chip dte-chip--componente dte-chip--${tarea.componente.toLowerCase()}`}
            >
              <GraduationCap
                size={13}
              />
              {
                componenteEvaluacion
              }
            </span>
          )}
        </div>

        {tarea.tipo === 'EXPOSICION' && (
          <section className="dte-sala-exposicion">
            <div>
              <span className="dte-sala-exposicion__icon">
                <Presentation size={20} />
              </span>
              <div>
                <strong>Sala de exposición</strong>
                <small>
                  Sigue las diapositivas en vivo, revisa tu turno y participa con preguntas durante la jornada.
                </small>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/estudiante/cursos/${cursoId}/tareas/${tareaId}/exposicion`)}
            >
              <Presentation size={16} />
              Entrar a la sala
            </button>
          </section>
        )}

        <h2>
          Actividad
        </h2>

        <p className="dte-actividad__descripcion">
          {tarea.descripcion ||
            tipo.descripcionEstudiante}
        </p>

        {tarea.instrucciones && (
          <aside className="dte-instrucciones">
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
          <section className="dte-archivos">
            <div className="dte-seccion-titulo">
              <div>
                <strong>
                  Archivos del docente
                </strong>

                <small>
                  Material disponible para esta actividad.
                </small>
              </div>

              <span>
                {
                  tarea.archivos.length
                }
              </span>
            </div>

            <div className="dte-archivos__grid">
              {tarea.archivos.map(
                (
                  archivo,
                ) => (
                  <article
                    key={
                      archivo.id
                    }
                    className={
                      esPdfDocente(
                        archivo,
                      )
                        ? 'dte-archivo-card dte-archivo-card--abrible'
                        : 'dte-archivo-card'
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

                    <div className="dte-archivo-card__acciones">
                      {esPdfDocente(
                        archivo,
                      ) && (
                        <button
                          type="button"
                          title="Abrir PDF"
                          disabled={
                            archivoAbriendoId ===
                            archivo.id
                          }
                          onClick={() =>
                            void abrirArchivoDocente(
                              archivo,
                            )
                          }
                        >
                          {archivoAbriendoId ===
                          archivo.id ? (
                            <Loader2
                              size={14}
                              className="dte-spin"
                            />
                          ) : (
                            <Eye
                              size={14}
                            />
                          )}

                          <span>
                            Abrir
                          </span>
                        </button>
                      )}

                      {!archivo.permiteDescarga && (
                        <span
                          className="dte-archivo-card__bloqueo"
                          title="Descarga no permitida"
                        >
                          <Lock
                            size={14}
                          />
                        </span>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>

            <p className="dte-archivo-aviso">
              <Info
                size={14}
              />
              Los archivos adjuntos forman parte del material de la actividad.
            </p>
          </section>
        )}
      </section>

      {tarea.modalidad ===
        'GRUPAL' && (
        <section className="dte-grupo">
          <div className="dte-grupo__cabecera">
            <div className="dte-grupo__identidad">
              <span>
                <UsersRound
                  size={20}
                />
              </span>

              <div>
                <small>
                  Trabajo grupal
                </small>

                <strong>
                  {tarea.origenGrupo ===
                    'AFINIDAD'
                    ? equipoAfinidad?.nombre ||
                      'Grupo por afinidad'
                    : tarea.conjuntoGrupo?.nombre ||
                      'Grupo de plataforma'}
                </strong>

                <p>
                  {tarea.origenGrupo ===
                    'AFINIDAD'
                    ? equipoAfinidad
                      ? `${equipoAfinidad.integrantes.length} ${
                          equipoAfinidad.integrantes.length ===
                          1
                            ? 'integrante'
                            : 'integrantes'
                        }`
                      : `Forma un equipo de ${minimo} a ${maximo} integrantes para realizar la tarea.`
                    : 'Trabajarás con el grupo asignado por el docente.'}
                </p>
              </div>
            </div>

            {tarea.origenGrupo ===
              'AFINIDAD' &&
            !equipoAfinidad && (
              <div className="dte-grupo__accion">
                <span>
                  Sin equipo
                </span>

                <button
                  type="button"
                  disabled={
                    cargandoEquipo ||
                    procesandoEquipo ||
                    estadoTemporal.cerrada
                  }
                  onClick={() =>
                    void abrirFormacionEquipo()
                  }
                >
                  {cargandoEquipo ||
                  procesandoEquipo ? (
                    <RefreshCw
                      size={15}
                      className="dte-spin"
                    />
                  ) : (
                    <Plus
                      size={15}
                    />
                  )}

                  Crear equipo
                </button>
              </div>
            )}

            {tarea.origenGrupo ===
              'AFINIDAD' &&
            equipoAfinidad && (
              <span className="dte-grupo__estado dte-grupo__estado--ok">
                <CheckCircle2
                  size={14}
                />
                Equipo conformado
              </span>
            )}
          </div>

          {tarea.origenGrupo ===
            'AFINIDAD' &&
          equipoAfinidad && (
            <div className="dte-equipo-afinidad">
              <div className="dte-equipo-afinidad__integrantes">
                {equipoAfinidad.integrantes.map(
                  (
                    integrante,
                  ) => (
                    <div
                      key={
                        integrante.estudianteId
                      }
                      className="dte-equipo-afinidad__integrante"
                    >
                      <span className="dte-equipo-avatar">
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
                          {integrante.esRepresentante
                            ? 'Representante'
                            : 'Integrante'}
                        </small>
                      </span>

                      {integrante.esRepresentante && (
                        <Crown
                          size={15}
                        />
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {errorEquipo && (
            <div className="dte-equipo-error">
              <AlertCircle
                size={15}
              />

              <span>
                {
                  errorEquipo
                }
              </span>
            </div>
          )}

          <div className="dte-grupo__resumen">
            <div>
              <ShieldCheck
                size={16}
              />

              <span>
                <small>
                  Entrega
                </small>

                <strong>
                  {responsable ===
                  'SOLO_REPRESENTANTE'
                    ? 'Representante'
                    : 'Cualquier integrante'}
                </strong>
              </span>
            </div>

            <div>
              <Crown
                size={16}
              />

              <span>
                <small>
                  Representante
                </small>

                <strong>
                  {equipoAfinidad ||
                  contextoGrupo
                    ? representanteNombre
                    : tarea.origenGrupo ===
                        'AFINIDAD'
                      ? 'Se asignará al crear el equipo'
                      : 'Cargando…'}
                </strong>
              </span>
            </div>

            {tarea.origenGrupo ===
              'AFINIDAD' && (
              <div>
                <Users
                  size={16}
                />

                <span>
                  <small>
                    Integrantes
                  </small>

                  <strong>
                    {equipoAfinidad
                      ? equipoAfinidad.integrantes.length
                      : `${minimo} a ${maximo}`}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {!(
        tarea.modalidad ===
          'GRUPAL' &&
        tarea.origenGrupo ===
          'AFINIDAD' &&
        !equipoAfinidad
      ) && (
        <ExperienciaTareaEstudiante
          key={
            versionEntrega
          }
          tarea={
            tarea
          }
          disponible={
            estadoTemporal.disponible
          }
          tardia={
            estadoTemporal.tardia
          }
          onContextoGrupo={
            setContextoGrupo
          }
        />
      )}

      {tarea.modalidad ===
        'GRUPAL' &&
      tarea.origenGrupo ===
        'AFINIDAD' &&
      !equipoAfinidad && (
        <div className="dte-entrega-bloqueada">
          <Lock
            size={16}
          />

          <span>
            La entrega se habilitará automáticamente cuando formes tu equipo.
          </span>
        </div>
      )}

      <FormarEquipoAfinidadTareaModal
        abierto={
          modalEquipo
        }
        estudiantes={
          estudiantesAfinidad
        }
        minimoIntegrantes={
          minimoEquipo
        }
        maximoIntegrantes={
          maximoEquipo
        }
        procesando={
          procesandoEquipo
        }
        onCerrar={() => {
          if (
            procesandoEquipo
          ) {
            return;
          }

          setModalEquipo(
            false,
          );

          setErrorEquipo(
            null,
          );
        }}
        onConfirmar={
          crearEquipoAfinidad
        }
      />

      <AulaModal
        abierto={
          modalDetalle
        }
        ancho="amplio"
        titulo="Detalles de la tarea"
        etiqueta="Información importante"
        descripcion="Revisa fechas, modalidad y requisitos antes de realizar la actividad."
        icono={
          Info
        }
        onCerrar={() =>
          setModalDetalle(
            false,
          )
        }
      >
        <div className="dte-detalles">
          <article>
            <CalendarDays />
            <div>
              <small>
                Apertura
              </small>
              <strong>
                {fecha(
                  tarea.fechaApertura,
                )}
              </strong>
            </div>
          </article>

          <article>
            <Clock3 />
            <div>
              <small>
                Fecha límite
              </small>
              <strong>
                {fecha(
                  tarea.fechaLimite,
                )}
              </strong>
            </div>
          </article>

          <article>
            <Lock />
            <div>
              <small>
                Cierre definitivo
              </small>
              <strong>
                {fecha(
                  tarea.permitirRetrasos &&
                  tarea.fechaMaximaRetraso
                    ? tarea.fechaMaximaRetraso
                    : tarea.fechaCierre,
                )}
              </strong>
            </div>
          </article>

          <article>
            <Users />
            <div>
              <small>
                Modalidad
              </small>
              <strong>
                {tarea.modalidad ===
                  'GRUPAL'
                  ? 'Grupal'
                  : 'Individual'}
              </strong>
            </div>
          </article>

          <article>
            <Files />
            <div>
              <small>
                Archivos
              </small>
              <strong>
                {tarea.capacidades.includes(
                  'ARCHIVOS',
                )
                  ? `${tarea.maximoArchivos} archivo(s), hasta ${tarea.tamanioMaximoArchivoMb} MB`
                  : 'No requeridos'}
              </strong>
            </div>
          </article>

          <article>
            <Award />
            <div>
              <small>
                Puntuación
              </small>
              <strong>
                {tarea.esCalificable
                  ? `${Number(
                      tarea.puntajeMaximo,
                    )} puntos`
                  : 'No calificable'}
              </strong>
            </div>
          </article>

          <article>
            <GraduationCap />
            <div>
              <small>
                Evaluación
              </small>
              <strong>
                {
                  componenteEvaluacion
                }
              </strong>
            </div>
          </article>

          {tarea.modalidad ===
            'GRUPAL' && (
            <>
              <article>
                <ShieldCheck />
                <div>
                  <small>
                    Entrega grupal
                  </small>
                  <strong>
                    {responsable ===
                    'SOLO_REPRESENTANTE'
                      ? 'Representante'
                      : 'Cualquier integrante'}
                  </strong>
                </div>
              </article>

              <article>
                <Crown />
                <div>
                  <small>
                    Representante
                  </small>
                  <strong>
                    {
                      contextoGrupo
                        ? representanteNombre
                        : 'Cargando…'
                    }
                  </strong>
                </div>
              </article>
            </>
          )}
        </div>
      </AulaModal>

      <Toast
        visible={
          toastArchivo.visible
        }
        tipo={
          toastArchivo.tipo
        }
        titulo={
          toastArchivo.titulo
        }
        mensaje={
          toastArchivo.mensaje
        }
        onCerrar={() =>
          setToastArchivo(
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
  .dte-page {
    --dte-color:
      var(--app-accent);
    --dte-fondo:
      var(--app-accent-soft);

    display: grid;
    gap: 14px;
    min-width: 0;
    padding-bottom: 34px;
    color: var(--app-text);
  }

  .dte-extension {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--app-accent) 35%, var(--app-border));
    border-radius: 14px;
    color: var(--app-text);
    background: var(--app-accent-soft);
  }

  .dte-extension > svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--app-accent-dark);
  }

  .dte-extension div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dte-extension strong {
    font-size: 14px;
    font-weight: 800;
  }

  .dte-extension span {
    color: var(--app-text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .dte-calificacion-publicada {
    display: grid;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid color-mix(in srgb, #16a34a 35%, var(--app-border));
    border-radius: 16px;
    background: color-mix(in srgb, #16a34a 8%, var(--app-surface));
  }

  .dte-calificacion-publicada__encabezado {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 11px;
  }

  .dte-calificacion-publicada__encabezado > svg {
    color: #16a34a;
  }

  .dte-calificacion-publicada__encabezado div {
    display: grid;
    gap: 2px;
  }

  .dte-calificacion-publicada__encabezado strong {
    font-size: 14px;
  }

  .dte-calificacion-publicada__encabezado span {
    color: var(--app-text-muted);
    font-size: 12px;
  }

  .dte-calificacion-publicada__encabezado b {
    color: #15803d;
    font-size: 18px;
    white-space: nowrap;
  }

  .dte-calificacion-publicada__retroalimentacion {
    padding: 11px 12px;
    border-radius: 11px;
    background: var(--app-surface);
  }

  .dte-calificacion-publicada__retroalimentacion strong {
    font-size: 12px;
  }

  .dte-calificacion-publicada__retroalimentacion p {
    margin: 5px 0 0;
    color: var(--app-text-muted);
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  @media (max-width: 560px) {
    .dte-calificacion-publicada__encabezado {
      grid-template-columns: auto 1fr;
    }

    .dte-calificacion-publicada__encabezado b {
      grid-column: 2;
    }
  }

  .dte-temporal {
    display: grid;
    grid-template-columns:
      44px
      minmax(
        0,
        1fr
      )
      auto;
    align-items: center;
    gap: 11px;
    padding: 11px 14px;
    border: 1px solid var(--app-border);
    border-radius: 16px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dte-temporal__icono {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: var(--dte-color);
    background: var(--dte-fondo);
  }

  .dte-temporal > div {
    display: grid;
    gap: 2px;
  }

  .dte-temporal small {
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
  }

  .dte-temporal strong {
    font-size: var(--app-font-section);
  }

  .dte-temporal p {
    margin: 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
  }

  .dte-temporal__estado {
    padding: 7px 10px;
    border-radius: 999px;
    color: var(--dte-color);
    background: var(--dte-fondo);
    font-size: var(--app-font-body);
    font-weight: 850;
  }

  .dte-temporal.is-late {
    border-color: var(--app-warning-border);
  }

  .dte-temporal.is-late
  .dte-temporal__estado {
    color: var(--app-warning);
    background: var(--app-warning-bg);
  }

  .dte-actividad,
  .dte-grupo,
  .dte-experiencia {
    padding: 22px 24px;
    border: 1px solid var(--app-border);
    border-radius: 20px;
    background: var(--app-surface);
    box-shadow: var(--app-shadow-sm);
  }

  .dte-actividad {
    border-top:
      3px solid
      var(--dte-color);
  }

  .dte-actividad__top {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .dte-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 9px;
    border-radius: 999px;
    color: var(--app-text-secondary);
    background: var(--app-surface-alt);
    font-size: var(--app-font-sm);
    font-weight: 850;
  }

  .dte-chip--tipo {
    color: var(--dte-color);
    background: var(--dte-fondo);
  }

  .dte-chip--nota {
    color: #6d28d9;
    background: #ede9fe;
  }

  .dte-chip--componente {
    border:
      1px solid
      transparent;
  }

  .dte-chip--continua {
    color: #047857;
    background: #ecfdf5;
    border-color: #a7f3d0;
  }

  .dte-chip--procesual {
    color: #1d4ed8;
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  .dte-actividad h2 {
    margin: 16px 0 8px;
    font-size: var(--app-font-title);
  }

  .dte-actividad__descripcion {
    margin: 0;
    color: var(--app-text-secondary);
    font-size: var(--app-font-section);
    line-height: 1.7;
  }

  .dte-instrucciones {
    margin-top: 16px;
    padding: 13px 15px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--dte-color) 22%,
        var(--app-border)
      );
    border-left:
      4px solid
      var(--dte-color);
    border-radius: 12px;
    background:
      color-mix(
        in srgb,
        var(--dte-fondo) 65%,
        var(--app-surface)
      );
  }

  .dte-instrucciones strong {
    color: var(--dte-color);
    font-size: var(--app-font-section);
  }

  .dte-instrucciones p {
    margin: 5px 0 0;
    color: var(--app-text-secondary);
    white-space: pre-wrap;
    font-size: var(--app-font-body);
    line-height: 1.55;
  }

  .dte-archivos {
    display: grid;
    gap: 10px;
    margin-top: 17px;
  }

  .dte-seccion-titulo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .dte-seccion-titulo > div {
    display: grid;
    gap: 2px;
  }

  .dte-seccion-titulo strong {
    font-size: var(--app-font-body);
  }

  .dte-seccion-titulo small {
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
  }

  .dte-seccion-titulo > span {
    min-width: 29px;
    padding: 5px 7px;
    border-radius: 999px;
    color: var(--dte-color);
    background: var(--dte-fondo);
    font-size: var(--app-font-sm);
    font-weight: 850;
    text-align: center;
  }

  .dte-archivos__grid {
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

  .dte-archivos__grid article {
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

  .dte-archivo-card--abrible {
    transition:
      border-color .16s ease,
      box-shadow .16s ease,
      background .16s ease;
  }

  .dte-archivo-card--abrible:hover {
    border-color:
      color-mix(
        in srgb,
        var(--dte-color) 38%,
        var(--app-border)
      );
    background:
      color-mix(
        in srgb,
        var(--dte-fondo) 28%,
        var(--app-surface-alt)
      );
  }

  .dte-archivo-card__acciones {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }

  .dte-archivo-card__acciones button {
    min-height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 0 9px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--dte-color) 35%,
        var(--app-border)
      );
    border-radius: 9px;
    color: var(--dte-color);
    background: var(--app-surface);
    font: inherit;
    font-size: 10px;
    font-weight: 850;
    cursor: pointer;
  }

  .dte-archivo-card__acciones button:hover:not(:disabled) {
    border-color: var(--dte-color);
    background: var(--dte-fondo);
  }

  .dte-archivo-card__acciones button:disabled {
    opacity: .55;
    cursor: wait;
  }

  .dte-archivo-card__bloqueo {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    color: var(--app-text-muted);
    background: var(--app-surface);
  }

  .dte-archivos__grid article > span {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: var(--dte-color);
    background: var(--dte-fondo);
  }

  .dte-archivos__grid article > div {
    min-width: 0;
    display: grid;
    gap: 2px;
  }

  .dte-archivos__grid strong {
    overflow: hidden;
    font-size: var(--app-font-md);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dte-archivos__grid small {
    color: var(--app-text-muted);
    font-size: var(--app-font-section);
  }

  .dte-archivo-aviso {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-section);
    line-height: var(--app-line-normal);
  }

  .dte-grupo {
    display: grid;
    gap: 12px;
  }

  .dte-grupo__cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .dte-grupo__identidad {
    min-width: 0;

    display: grid;
    grid-template-columns:
      46px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 11px;
  }

  .dte-grupo__identidad > span {
    width: 46px;
    height: 46px;

    display: grid;
    place-items: center;

    border-radius: 13px;

    color: var(--dte-color);

    background: var(--dte-fondo);
  }

  .dte-grupo__identidad small {
    color: var(--dte-color);

    font-size: var(--app-font-section);
    font-weight: 850;
    text-transform: uppercase;
  }

  .dte-grupo__identidad strong {
    display: block;

    margin-top: 2px;

    font-size: var(--app-font-section);
  }

  .dte-grupo__identidad p {
    margin: 3px 0 0;

    color: var(--app-text-muted);

    font-size: var(--app-font-body);
  }

  .dte-grupo__accion {
    display: flex;
    align-items: center;
    gap: 9px;

    flex-shrink: 0;
  }

  .dte-grupo__accion > span,
  .dte-grupo__estado {
    display: inline-flex;
    align-items: center;
    gap: 5px;

    padding: 6px 9px;

    border-radius: 999px;

    font-size: var(--app-font-sm);
    font-weight: 850;
  }

  .dte-grupo__accion > span {
    color: var(--app-warning);

    background: var(--app-warning-bg);
  }

  .dte-grupo__estado--ok {
    color: var(--app-success);

    background: var(--app-success-bg);
  }

  .dte-grupo__accion button {
    min-height: 38px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;

    padding: 8px 13px;

    border: 1px solid var(--app-accent);
    border-radius: 11px;

    color: #fff;

    background: var(--app-accent);

    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 850;

    cursor: pointer;
  }

  .dte-grupo__accion button:disabled {
    opacity: .5;

    cursor: not-allowed;
  }

  .dte-equipo-afinidad {
    overflow: hidden;

    border: 1px solid var(--app-border-soft);
    border-radius: 13px;

    background: var(--app-surface-alt);
  }

  .dte-equipo-afinidad__integrantes {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(
          0,
          1fr
        )
      );

    gap: 7px;

    padding: 9px;
  }

  .dte-equipo-afinidad__integrante {
    min-width: 0;

    display: grid;
    grid-template-columns:
      36px
      minmax(
        0,
        1fr
      )
      auto;
    align-items: center;
    gap: 8px;

    padding: 8px 9px;

    border: 1px solid var(--app-border-soft);
    border-radius: 10px;

    background: var(--app-surface);
  }

  .dte-equipo-avatar {
    width: 36px;
    height: 36px;

    display: grid;
    place-items: center;

    border-radius: 10px;

    color: var(--dte-color);

    background: var(--dte-fondo);

    font-size: var(--app-font-sm);
    font-weight: 900;
  }

  .dte-equipo-afinidad__integrante > span:nth-child(2) {
    min-width: 0;
  }

  .dte-equipo-afinidad__integrante strong,
  .dte-equipo-afinidad__integrante small {
    display: block;

    overflow: hidden;

    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dte-equipo-afinidad__integrante strong {
    font-size: var(--app-font-md);
  }

  .dte-equipo-afinidad__integrante small {
    margin-top: 2px;

    color: var(--app-text-muted);

    font-size: var(--app-font-sm);
  }

  .dte-equipo-afinidad__integrante > svg {
    color: #d97706;
  }

  .dte-grupo__resumen {
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

    padding-top: 1px;
  }

  .dte-grupo__resumen > div {
    min-width: 0;

    display: grid;
    grid-template-columns:
      32px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 8px;

    padding: 9px 10px;

    border: 1px solid var(--app-border-soft);
    border-radius: 11px;

    background: var(--app-surface-alt);
  }

  .dte-grupo__resumen svg {
    color: var(--dte-color);
  }

  .dte-grupo__resumen > div:nth-child(2) svg {
    color: #d97706;
  }

  .dte-grupo__resumen small,
  .dte-grupo__resumen strong {
    display: block;
  }

  .dte-grupo__resumen small {
    color: var(--app-text-muted);

    font-size: var(--app-font-sm);
  }

  .dte-grupo__resumen strong {
    margin-top: 2px;

    overflow: hidden;

    font-size: var(--app-font-md);

    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .dte-equipo-error {
    display: flex;
    align-items: flex-start;
    gap: 7px;

    padding: 9px 10px;

    border: 1px solid var(--app-danger-border);
    border-radius: 10px;

    color: var(--app-danger);

    background: var(--app-danger-bg);

    font-size: var(--app-font-sm);
  }

  .dte-entrega-bloqueada {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;

    padding: 10px 12px;

    border: 1px solid var(--app-border-soft);
    border-radius: 12px;

    color: var(--app-text-muted);

    background: var(--app-surface-alt);

    font-size: var(--app-font-sm);
  }

  .dte-entrega-bloqueada svg {
    color: var(--app-accent-dark);
  }

  .dte-spin {
    animation:
      dteSpin
      .8s
      linear
      infinite;
  }

  @keyframes dteSpin {
    to {
      transform: rotate(360deg);
    }
  }

  .dte-experiencia {
    display: grid;
    gap: 13px;
  }

  .dte-experiencia > header {
    display: grid;
    grid-template-columns:
      46px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 11px;
  }

  .dte-experiencia > header > span {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: var(--dte-color);
    background: var(--dte-fondo);
  }

  .dte-experiencia header small,
  .dte-experiencia header strong {
    display: block;
  }

  .dte-experiencia header small {
    color: var(--dte-color);
    font-size: var(--app-font-section);
    font-weight: 850;
    text-transform: uppercase;
  }

  .dte-experiencia header strong {
    margin-top: 2px;
    font-size: var(--app-font-section);
  }

  .dte-experiencia header p {
    margin: 3px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-body);
  }

  .dte-componentes {
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

  .dte-componentes article {
    padding: 10px 11px;
    border: 1px solid var(--app-border);
    border-radius: 11px;
    background: var(--app-surface-alt);
  }

  .dte-componentes article > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .dte-componentes strong {
    font-size: var(--app-font-md);
  }

  .dte-componentes article span {
    color: #047857;
    font-size: var(--app-font-xs);
    font-weight: 850;
  }

  .dte-componentes p {
    margin: 4px 0 0;
    color: var(--app-text-muted);
    font-size: var(--app-font-sm);
    line-height: var(--app-line-normal);
  }

  .dte-entrega-placeholder {
    display: grid;
    grid-template-columns:
      38px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 10px;
    padding: 12px 13px;
    border: 1px dashed var(--dte-color);
    border-radius: 13px;
    color: var(--dte-color);
    background:
      color-mix(
        in srgb,
        var(--dte-fondo) 62%,
        var(--app-surface)
      );
  }

  .dte-entrega-placeholder strong {
    color: var(--app-text);
    font-size: var(--app-font-section);
  }

  .dte-entrega-placeholder p {
    margin: 3px 0 0;
    color: var(--app-text-secondary);
    font-size: var(--app-font-sm);
    line-height: 1.5;
  }

  .dte-detalles {
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

  .dte-detalles article {
    min-height: 70px;
    display: grid;
    grid-template-columns:
      38px
      minmax(
        0,
        1fr
      );
    align-items: center;
    gap: 9px;
    padding: 11px 12px;
    border: 1px solid var(--app-border);
    border-radius: 12px;
    background: var(--app-surface-alt);
  }

  .dte-detalles article > svg {
    width: 38px;
    height: 38px;
    padding: 9px;
    box-sizing: border-box;
    border-radius: 10px;
    color: var(--dte-color);
    background: var(--dte-fondo);
  }

  .dte-detalles small,
  .dte-detalles strong {
    display: block;
  }

  .dte-detalles small {
    color: var(--app-text-muted);
    font-size: var(--app-font-section);
  }

  .dte-detalles strong {
    margin-top: 2px;
    font-size: var(--app-font-md);
  }


  .dte-sala-exposicion {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 20px;
    padding: 14px 15px;
    border: 1px solid rgba(241, 139, 75, .28);
    border-radius: 16px;
    background: linear-gradient(135deg, var(--app-accent-soft), var(--app-surface));
  }

  .dte-sala-exposicion > div {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }

  .dte-sala-exposicion__icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 12px;
    color: var(--app-accent-dark);
    background: #fff;
  }

  .dte-sala-exposicion strong,
  .dte-sala-exposicion small {
    display: block;
  }

  .dte-sala-exposicion strong {
    font-size: 13px;
  }

  .dte-sala-exposicion small {
    margin-top: 3px;
    color: var(--app-text-secondary);
    font-size: 11px;
    line-height: 1.45;
  }

  .dte-sala-exposicion button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    flex: 0 0 auto;
    min-height: 40px;
    padding: 9px 12px;
    border: 1px solid var(--app-accent);
    border-radius: 12px;
    color: #fff;
    background: var(--app-accent);
    font-weight: 900;
    cursor: pointer;
  }

  .dte-sala-exposicion button:hover {
    border-color: var(--app-accent-hover);
    background: var(--app-accent-hover);
  }

  @media (
    max-width:
      720px
  ) {
    .dte-temporal {
      grid-template-columns:
        44px
        minmax(
          0,
          1fr
        );
    }

    .dte-temporal__estado {
      grid-column:
        1 / -1;
      text-align: center;
    }

    .dte-archivos__grid,
    .dte-componentes,
    .dte-detalles,
    .dte-equipo-afinidad__integrantes,
    .dte-grupo__resumen {
      grid-template-columns: 1fr;
    }

    .dte-sala-exposicion {
      align-items: stretch;
      flex-direction: column;
    }

    .dte-sala-exposicion button {
      width: 100%;
    }

    .dte-grupo__cabecera {
      align-items: stretch;
      flex-direction: column;
    }

    .dte-grupo__accion {
      justify-content: space-between;
    }

    .dte-grupo__accion button {
      flex: 1;
    }
  }
`;
