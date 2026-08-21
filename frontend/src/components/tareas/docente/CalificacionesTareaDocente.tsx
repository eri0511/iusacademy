import {
  Award,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Search,
  Send,
  UsersRound,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useParams,
} from 'react-router-dom';

import {
  useAuth,
} from '../../../auth/AuthContext';

import AulaModal from '../../aula/AulaModal';
import AvatarUsuario from '../../shared/AvatarUsuario';
import Toast, {
  type TipoToast,
} from '../../shared/Toast';

import type {
  PanelEvaluacionTarea,
} from '../../../types/tareas/tarea-docente-seguimiento.types';

type Props = {
  panel:
    PanelEvaluacionTarea;

  procesando:
    boolean;

  onPublicar:
    () => Promise<void>;

  onCalificar:
    (
      entregaId:
        number,
    ) => void;
};

type Filtro =
  | 'TODOS'
  | 'PENDIENTES'
  | 'CALIFICADOS'
  | 'SIN_ENTREGA';

type FormatoReporte =
  | 'PDF'
  | 'EXCEL'
  | 'CSV';

type EstudianteCurso = {
  inscripcionId:
    number;

  estadoInscripcion:
    string;

  estudiante: {
    id:
      number;

    nombres:
      string;

    apellidoPaterno:
      string;

    apellidoMaterno?:
      string | null;

    correo:
      string;

    fotoPerfilUrl?:
      string | null;
  };
};

type CalificacionCruda = {
  estudianteId?:
    number;

  notaBase?:
    number | string | null;

  descuentoRetraso?:
    number | string | null;

  notaFinal?:
    number | string | null;

  estado?:
    string | null;
};

type FilaPanelCalificacion = {
  estudiante: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno?: string | null;
    correo: string;
    fotoPerfilUrl?: string | null;
  };

  grupo:
    | {
        id: number;
        nombre: string;
        tipo: string;
      }
    | null;

  entrega:
    | {
        id: number;
        estado: string;
        enviadaEn?: string | null;
        entregadaTarde?: boolean;
      }
    | null;

  calificacion:
    | CalificacionCruda
    | null;
};

type Fila = {
  estudianteId:
    number;

  nombres:
    string;

  apellidoPaterno:
    string;

  apellidoMaterno?:
    string | null;

  correo:
    string;

  fotoPerfilUrl?:
    string | null;

  grupo:
    string | null;

  tieneEntrega:
    boolean;

  tardia:
    boolean;

  notaBase:
    number | null;

  descuentoRetraso:
    number | null;

  notaFinal:
    number | null;

  estado:
    string;

  retroalimentacion?:
    string | null;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function numero(
  valor:
    unknown,
) {
  if (
    valor ===
      null ||
    valor ===
      undefined ||
    valor ===
      ''
  ) {
    return null;
  }

  const resultado =
    Number(
      valor,
    );

  return Number.isFinite(
    resultado,
  )
    ? resultado
    : null;
}

function nombreCompleto(
  fila:
    Fila,
) {
  return [
    fila.nombres,
    fila.apellidoPaterno,
    fila.apellidoMaterno,
  ]
    .filter(
      Boolean,
    )
    .join(
      ' ',
    );
}

function estadoBonito(
  estado:
    string,
) {
  const mapa:
    Record<
      string,
      string
    > = {
      PENDIENTE:
        'Pendiente',

      BORRADOR:
        'Pendiente',

      CALIFICADA:
        'Calificada',

      PUBLICADA:
        'Publicada',

      ANULADA:
        'Anulada',
    };

  return mapa[
    estado
  ] ??
  estado;
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
      message?:
        string | string[];

      mensaje?:
        string;

      error?:
        string;
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

export default function CalificacionesTareaDocente({
  panel,
  procesando,
  onPublicar,
  onCalificar,
}: Props) {
  const {
    sesion,
  } =
    useAuth();

  const accessToken =
    sesion?.accessToken ??
    '';

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
    estudiantesCurso,
    setEstudiantesCurso,
  ] =
    useState<EstudianteCurso[]>(
      [],
    );

  const [
    filtro,
    setFiltro,
  ] =
    useState<Filtro>(
      'TODOS',
    );

  const [
    busqueda,
    setBusqueda,
  ] =
    useState(
      '',
    );

  const [
    modalReportes,
    setModalReportes,
  ] =
    useState(
      false,
    );

  const [
    confirmandoPublicacion,
    setConfirmandoPublicacion,
  ] =
    useState(
      false,
    );

  const [
    descargando,
    setDescargando,
  ] =
    useState<FormatoReporte | null>(
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

  useEffect(
    () => {
      if (
        !accessToken ||
        !idCurso
      ) {
        return;
      }

      let cancelado =
        false;

      const cargar =
        async () => {
          try {
            const respuesta =
              await fetch(
                `${API_URL}/docente/cursos/${idCurso}/estudiantes`,
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
                  'No fue posible cargar la lista completa de estudiantes.',
                ),
              );
            }

            if (
              cancelado
            ) {
              return;
            }

            const datos =
              cuerpo as {
                estudiantes?:
                  EstudianteCurso[];
              };

            setEstudiantesCurso(
              Array.isArray(
                datos.estudiantes,
              )
                ? datos.estudiantes
                : [],
            );
          } catch (
            causa
          ) {
            if (
              cancelado
            ) {
              return;
            }

            setToast({
              visible:
                true,

              tipo:
                'error',

              titulo:
                'No se pudo completar la tabla',

              mensaje:
                causa instanceof Error
                  ? causa.message
                  : undefined,
            });
          }
        };

      void cargar();

      return () => {
        cancelado =
          true;
      };
    },
    [
      accessToken,
      idCurso,
    ],
  );

  const tarea =
    (
      panel as unknown as {
        tarea?: {
          modalidad?:
            string;

          modalidadNota?:
            string;

          puntajeMaximo?:
            number | string;

          porcentajeNotaGrupal?:
            number | string | null;

          porcentajeNotaIndividual?:
            number | string | null;

          componente?:
            string;
        };
      }
    ).tarea;

  const puntajeMaximo =
    numero(
      tarea?.puntajeMaximo,
    ) ??
    100;

  const modalidadNota =
    tarea?.modalidadNota ??
    (
      panel as unknown as {
        modalidadNota?:
          string;
      }
    ).modalidadNota ??
    'INDIVIDUAL';

  const esGrupal =
    tarea?.modalidad ===
      'GRUPAL' ||
    panel.evaluables.some(
      (
        evaluable,
      ) =>
        evaluable.tipo ===
        'GRUPO',
    );

  const porcentajeGrupal =
    numero(
      tarea?.porcentajeNotaGrupal,
    );

  const porcentajeIndividual =
    numero(
      tarea?.porcentajeNotaIndividual,
    );

  const filas =
    useMemo(
      () => {
        const filasPanel =
          (
            panel as unknown as {
              calificaciones?:
                FilaPanelCalificacion[];
            }
          ).calificaciones ??
          [];

        if (
          filasPanel.length >
          0
        ) {
          return filasPanel.map(
            (
              item,
            ): Fila => ({
              estudianteId:
                item.estudiante.id,

              nombres:
                item.estudiante.nombres,

              apellidoPaterno:
                item.estudiante.apellidoPaterno,

              apellidoMaterno:
                item.estudiante.apellidoMaterno,

              correo:
                item.estudiante.correo,

              fotoPerfilUrl:
                item.estudiante.fotoPerfilUrl,

              grupo:
                item.grupo?.nombre ??
                null,

              tieneEntrega:
                Boolean(
                  item.entrega,
                ),

              tardia:
                item.entrega?.estado ===
                  'TARDIA' ||
                item.entrega?.entregadaTarde ===
                  true,

              notaBase:
                numero(
                  item.calificacion?.notaBase,
                ),

              descuentoRetraso:
                numero(
                  item.calificacion?.descuentoRetraso,
                ),

              notaFinal:
                numero(
                  item.calificacion?.notaFinal,
                ),

              estado:
                item.calificacion?.estado ??
                'PENDIENTE',

              retroalimentacion:
                (
                  item.calificacion as
                    | (
                        CalificacionCruda & {
                          retroalimentacion?: string | null;
                        }
                      )
                    | null
                )?.retroalimentacion ??
                null,
            }),
          );
        }

        const mapa =
          new Map<
            number,
            {
              evaluable:
                PanelEvaluacionTarea['evaluables'][number];

              estudiante:
                PanelEvaluacionTarea['evaluables'][number]['estudiantes'][number];
            }
          >();

        panel.evaluables.forEach(
          (
            evaluable,
          ) => {
            evaluable.estudiantes.forEach(
              (
                estudiante,
              ) => {
                mapa.set(
                  estudiante.id,
                  {
                    evaluable,
                    estudiante,
                  },
                );
              },
            );
          },
        );

        const crearFila =
          (
            estudiante:
              EstudianteCurso['estudiante'],
          ): Fila => {
            const relacionado =
              mapa.get(
                estudiante.id,
              );

            const evaluable =
              relacionado?.evaluable;

            const entrega =
              evaluable?.entrega ??
              null;

            const calificaciones =
              (
                entrega as
                  | (
                      typeof entrega & {
                        calificaciones?:
                          CalificacionCruda[];
                      }
                    )
                  | null
              )?.calificaciones ??
              [];

            const individual =
              calificaciones.find(
                (
                  item,
                ) =>
                  item.estudianteId ===
                  estudiante.id,
              );

            const grupal =
              evaluable?.calificacion as
                | CalificacionCruda
                | null
                | undefined;

            const nota =
              individual ??
              grupal;

            return {
              estudianteId:
                estudiante.id,

              nombres:
                estudiante.nombres,

              apellidoPaterno:
                estudiante.apellidoPaterno,

              apellidoMaterno:
                estudiante.apellidoMaterno,

              correo:
                estudiante.correo,

              fotoPerfilUrl:
                estudiante.fotoPerfilUrl,

              grupo:
                evaluable?.tipo ===
                  'GRUPO'
                  ? evaluable.nombre
                  : null,

              tieneEntrega:
                Boolean(
                  entrega,
                ),

              tardia:
                entrega?.estado ===
                  'TARDIA',

              notaBase:
                numero(
                  nota?.notaBase,
                ),

              descuentoRetraso:
                numero(
                  nota?.descuentoRetraso,
                ),

              notaFinal:
                numero(
                  nota?.notaFinal,
                ),

              estado:
                nota?.estado ??
                'PENDIENTE',

              retroalimentacion:
                (
                  nota as
                    | (
                        CalificacionCruda & {
                          retroalimentacion?: string | null;
                        }
                      )
                    | null
                    | undefined
                )?.retroalimentacion ??
                null,
            };
          };

        if (
          estudiantesCurso.length >
          0
        ) {
          return estudiantesCurso
            .filter(
              (
                item,
              ) =>
                item.estadoInscripcion ===
                'ACTIVA',
            )
            .map(
              (
                item,
              ) =>
                crearFila(
                  item.estudiante,
                ),
            );
        }

        return panel.evaluables.flatMap(
          (
            evaluable,
          ) =>
            evaluable.estudiantes.map(
              (
                estudiante,
              ) =>
                crearFila({
                  id:
                    estudiante.id,

                  nombres:
                    estudiante.nombres,

                  apellidoPaterno:
                    estudiante.apellidoPaterno,

                  apellidoMaterno:
                    estudiante.apellidoMaterno,

                  correo:
                    estudiante.correo,

                  fotoPerfilUrl:
                    (
                      estudiante as typeof estudiante & {
                        fotoPerfilUrl?:
                          string | null;
                      }
                    ).fotoPerfilUrl,
                }),
            ),
        );
      },
      [
        estudiantesCurso,
        panel,
      ],
    );

  const totalEstudiantes =
    filas.length ||
    panel.resumen.totalEstudiantes;

  const totalCalificados =
    filas.filter(
      (
        fila,
      ) =>
        [
          'CALIFICADA',
          'PUBLICADA',
        ].includes(
          fila.estado,
        ) ||
        fila.notaFinal !==
          null,
    ).length;

  const totalPendientes =
    Math.max(
      0,
      totalEstudiantes -
        totalCalificados,
    );

  const totalSinEntrega =
    filas.filter(
      (
        fila,
      ) =>
        !fila.tieneEntrega,
    ).length;

  const todasCalificadas =
    totalEstudiantes >
      0 &&
    totalCalificados ===
      totalEstudiantes;

  const faltantesPorCalificar =
    Math.max(
      0,
      totalEstudiantes -
        totalCalificados,
    );

  const notasPublicadas =
    panel.tarea.estadoActividadCalificable ===
      'PUBLICADA' ||
    (
      totalEstudiantes >
        0 &&
      panel.resumen.publicadas ===
        totalEstudiantes
    );

  const visibles =
    useMemo(
      () => {
        const termino =
          busqueda
            .trim()
            .toLocaleLowerCase();

        return filas.filter(
          (
            fila,
          ) => {
            const coincideBusqueda =
              !termino ||
              nombreCompleto(
                fila,
              )
                .toLocaleLowerCase()
                .includes(
                  termino,
                ) ||
              fila.correo
                .toLocaleLowerCase()
                .includes(
                  termino,
                ) ||
              fila.grupo
                ?.toLocaleLowerCase()
                .includes(
                  termino,
                );

            const calificada =
              [
                'CALIFICADA',
                'PUBLICADA',
              ].includes(
                fila.estado,
              ) ||
              fila.notaFinal !==
                null;

            const coincideFiltro =
              filtro ===
                'TODOS' ||
              (
                filtro ===
                  'PENDIENTES' &&
                !calificada
              ) ||
              (
                filtro ===
                  'CALIFICADOS' &&
                calificada
              ) ||
              (
                filtro ===
                  'SIN_ENTREGA' &&
                !fila.tieneEntrega
              );

            return Boolean(
              coincideBusqueda &&
              coincideFiltro,
            );
          },
        );
      },
      [
        busqueda,
        filas,
        filtro,
      ],
    );

  const confirmarPublicar =
    async () => {
      try {
        await onPublicar();

        setConfirmandoPublicacion(
          false,
        );

        setToast({
          visible:
            true,

          tipo:
            'exito',

          titulo:
            'Notas publicadas',

          mensaje:
            'Los estudiantes ya pueden consultar sus calificaciones.',
        });
      } catch (
        causa
      ) {
        setToast({
          visible:
            true,

          tipo:
            'error',

          titulo:
            'No se pudieron publicar las notas',

          mensaje:
            causa instanceof Error
              ? causa.message
              : undefined,
        });
      }
    };

  const descargarReporte =
    async (
      formato:
        FormatoReporte,
    ) => {
      if (
        !accessToken ||
        !idCurso ||
        !idTarea ||
        descargando
      ) {
        return;
      }

      try {
        setDescargando(
          formato,
        );

        const respuesta =
          await fetch(
            `${API_URL}/tareas/docente/cursos/${idCurso}/${idTarea}/calificaciones/exportar/${formato}`,
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
              `No fue posible generar el reporte ${formato}.`,
            ),
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

        const extensiones:
          Record<
            FormatoReporte,
            string
          > = {
            PDF:
              'pdf',

            EXCEL:
              'xlsx',

            CSV:
              'csv',
          };

        enlace.href =
          url;

        enlace.download =
          `calificaciones-tarea-${idTarea}-iusacademy.${extensiones[formato]}`;

        document.body.appendChild(
          enlace,
        );

        enlace.click();
        enlace.remove();

        URL.revokeObjectURL(
          url,
        );

        setModalReportes(
          false,
        );

        setToast({
          visible:
            true,

          tipo:
            'exito',

          titulo:
            'Reporte descargado',

          mensaje:
            `El reporte ${formato} fue generado correctamente.`,
        });
      } catch (
        causa
      ) {
        setToast({
          visible:
            true,

          tipo:
            'error',

          titulo:
            'No se pudo generar el reporte',

          mensaje:
            causa instanceof Error
              ? causa.message
              : undefined,
        });
      } finally {
        setDescargando(
          null,
        );
      }
    };

  const descripcionModalidad =
    modalidadNota ===
      'GRUPAL_E_INDIVIDUAL' &&
    porcentajeGrupal !==
      null &&
    porcentajeIndividual !==
      null
      ? `Nota mixta: ${porcentajeGrupal}% grupal y ${porcentajeIndividual}% individual.`
      : modalidadNota ===
          'GRUPAL'
        ? 'Una nota base se replica a los integrantes de cada grupo.'
        : 'La calificación se registra de manera individual por estudiante.';

  return (
    <section className="ctd">
      <header className="ctd-title-card">
        <div className="ctd-title-identity">
          <span className="ctd-title-icon">
            <Award
              size={20}
            />
          </span>

          <div>
            <span className="ctd-eyebrow">
              Evaluación de la tarea
            </span>

            <h3>
              Calificaciones
            </h3>

            <p>
              {
                descripcionModalidad
              }
            </p>
          </div>
        </div>

        <div className="ctd-actions">
          <button
            type="button"
            onClick={() =>
              setModalReportes(
                true,
              )
            }
          >
            <FileText
              size={14}
            />
            Reportes
          </button>

          {notasPublicadas ? (
            <span className="ctd-publish-status is-published">
              <CheckCircle2
                size={14}
              />
              Notas publicadas
            </span>
          ) : (
            <>
              <button
                type="button"
                className="is-primary"
                disabled={
                  procesando ||
                  !todasCalificadas
                }
                title={
                  todasCalificadas
                    ? 'Publicar todas las calificaciones'
                    : `Faltan ${faltantesPorCalificar} estudiante(s) por calificar`
                }
                onClick={() =>
                  setConfirmandoPublicacion(
                    true,
                  )
                }
              >
                <Send
                  size={14}
                />
                Publicar
              </button>

              {todasCalificadas ? (
                <span className="ctd-publish-status is-ready">
                  <CheckCircle2
                    size={14}
                  />
                  Calificación completa
                </span>
              ) : (
                <span className="ctd-publish-status is-pending">
                  <Clock3
                    size={14}
                  />
                  Faltan {
                    faltantesPorCalificar
                  } por calificar
                </span>
              )}
            </>
          )}
        </div>
      </header>

      <section className="ctd-summary">
        <article>
          <UsersRound
            size={20}
          />

          <div>
            <strong>
              {
                totalEstudiantes
              }
            </strong>

            <span>
              Estudiantes
            </span>
          </div>
        </article>

        <article>
          <Clock3
            size={20}
          />

          <div>
            <strong>
              {
                totalPendientes
              }
            </strong>

            <span>
              Pendientes
            </span>
          </div>
        </article>

        <article>
          <CheckCircle2
            size={20}
          />

          <div>
            <strong>
              {
                totalCalificados
              }
            </strong>

            <span>
              Calificados
            </span>
          </div>
        </article>

        <article>
          <Award
            size={20}
          />

          <div>
            <strong>
              {
                puntajeMaximo
              }
            </strong>

            <span>
              Puntaje máximo
            </span>
          </div>
        </article>
      </section>

      <section className="ctd-filter-card">
        <div className="ctd-filters">
          {([
            [
              'TODOS',
              'Todos',
              totalEstudiantes,
            ],
            [
              'PENDIENTES',
              'Pendientes',
              totalPendientes,
            ],
            [
              'CALIFICADOS',
              'Calificados',
              totalCalificados,
            ],
            [
              'SIN_ENTREGA',
              'Sin entrega',
              totalSinEntrega,
            ],
          ] as const).map(
            (
              [
                id,
                texto,
                cantidad,
              ],
            ) => (
              <button
                key={
                  id
                }
                type="button"
                className={
                  filtro ===
                  id
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setFiltro(
                    id,
                  )
                }
              >
                {
                  texto
                }

                <span>
                  {
                    cantidad
                  }
                </span>
              </button>
            ),
          )}
        </div>

        <label className="ctd-search">
          <Search
            size={16}
          />

          <input
            value={
              busqueda
            }
            placeholder="Buscar por nombre, correo o grupo..."
            onChange={(
              evento,
            ) =>
              setBusqueda(
                evento.target.value,
              )
            }
          />
        </label>
      </section>

      <section className="ctd-table-wrap">
        <table className="ctd-table">
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
            {visibles.length ===
            0 ? (
              <tr>
                <td
                  colSpan={
                    esGrupal
                      ? 6
                      : 5
                  }
                  className="ctd-empty"
                >
                  No se encontraron estudiantes con estos filtros.
                </td>
              </tr>
            ) : (
              visibles.map(
                (
                  fila,
                ) => (
                  <tr
                    key={
                      fila.estudianteId
                    }
                  >
                    <td>
                      <div className="ctd-user">
                        <AvatarUsuario
                          fotoPerfilUrl={
                            fila.fotoPerfilUrl
                          }
                          nombres={
                            fila.nombres
                          }
                          apellidoPaterno={
                            fila.apellidoPaterno
                          }
                          size={
                            42
                          }
                        />

                        <div>
                          <strong>
                            {
                              nombreCompleto(
                                fila,
                              )
                            }
                          </strong>

                          <span>
                            {
                              fila.correo
                            }
                          </span>
                        </div>
                      </div>
                    </td>

                    {esGrupal && (
                      <td>
                        {fila.grupo ? (
                          <span className="ctd-group">
                            <UsersRound
                              size={12}
                            />
                            {
                              fila.grupo
                            }
                          </span>
                        ) : (
                          <span className="ctd-muted">
                            Sin grupo
                          </span>
                        )}
                      </td>
                    )}

                    <td>
                      {!fila.tieneEntrega ? (
                        <span className="ctd-muted">
                          Sin entrega
                        </span>
                      ) : fila.tardia ? (
                        <span className="ctd-badge is-late">
                          Tardía
                        </span>
                      ) : (
                        <span className="ctd-badge is-ok">
                          A tiempo
                        </span>
                      )}
                    </td>

                    <td>
                      <strong className="ctd-final">
                        {fila.notaFinal ===
                        null
                          ? '—'
                          : `${fila.notaFinal.toFixed(
                              2,
                            )}/${puntajeMaximo}`}
                      </strong>

                      {fila.tieneEntrega &&
                      fila.descuentoRetraso !==
                        null &&
                      fila.descuentoRetraso >
                        0 && (
                        <small className="ctd-note-detail">
                          Base {
                            fila.notaBase?.toFixed(
                              2,
                            ) ??
                            '0.00'
                          } · Retraso -{
                            fila.descuentoRetraso.toFixed(
                              2,
                            )
                          }
                        </small>
                      )}
                    </td>

                    <td>
                      <span
                        className={`ctd-state is-${fila.estado.toLowerCase()}`}
                      >
                        {
                          estadoBonito(
                            fila.estado,
                          )
                        }
                      </span>
                    </td>

                    <td>
                      {fila.tieneEntrega ? (
                        <button
                          type="button"
                          className="ctd-grade"
                          title="Abrir entrega y registrar calificación"
                          onClick={() => {
                            const evaluable =
                              panel.evaluables.find(
                                (
                                  item,
                                ) =>
                                  item.estudiantes.some(
                                    (
                                      estudiante,
                                    ) =>
                                      estudiante.id ===
                                      fila.estudianteId,
                                  ),
                              );

                            const entregaId =
                              evaluable?.entrega?.id;

                            if (
                              entregaId
                            ) {
                              onCalificar(
                                entregaId,
                              );
                            }
                          }}
                        >
                          <Eye
                            size={14}
                          />
                          {fila.estado ===
                            'CALIFICADA' ||
                          fila.estado ===
                            'PUBLICADA'
                            ? 'Revisar'
                            : 'Calificar'}
                        </button>
                      ) : fila.notaFinal ===
                          0 &&
                        (
                          fila.estado ===
                            'CALIFICADA' ||
                          fila.estado ===
                            'PUBLICADA'
                        ) ? (
                        <span className="ctd-no-presento">
                          No presentó
                        </span>
                      ) : (
                        <span className="ctd-muted">
                          Sin entrega
                        </span>
                      )}
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </section>

      <AulaModal
        abierto={
          modalReportes
        }
        titulo="Exportar calificaciones"
        etiqueta="Reportes de la tarea"
        descripcion="Selecciona el formato del reporte académico."
        ancho="mediano"
        bloqueado={
          Boolean(
            descargando,
          )
        }
        onCerrar={() =>
          setModalReportes(
            false,
          )
        }
      >
        <div className="ctd-report-options">
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
                key={
                  formato
                }
                type="button"
                disabled={
                  Boolean(
                    descargando,
                  )
                }
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
                    {
                      formato
                    }
                  </strong>

                  <small>
                    {
                      descripcion
                    }
                  </small>
                </span>

                <Download
                  size={16}
                />
              </button>
            ),
          )}

          {descargando && (
            <div className="ctd-report-loading">
              Generando {
                descargando
              }…
            </div>
          )}
        </div>
      </AulaModal>

      <AulaModal
        abierto={
          confirmandoPublicacion
        }
        titulo="Publicar calificaciones"
        etiqueta="Confirmación"
        descripcion="Los estudiantes podrán consultar las notas que ya fueron calificadas."
        ancho="compacto"
        bloqueado={
          procesando
        }
        onCerrar={() =>
          setConfirmandoPublicacion(
            false,
          )
        }
        footer={
          <>
            <button
              type="button"
              className="ctd-modal-secondary"
              disabled={
                procesando
              }
              onClick={() =>
                setConfirmandoPublicacion(
                  false,
                )
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              className="ctd-modal-primary"
              disabled={
                procesando
              }
              onClick={() =>
                void confirmarPublicar()
              }
            >
              {
                procesando
                  ? 'Publicando…'
                  : 'Publicar notas'
              }
            </button>
          </>
        }
      >
        <p className="ctd-confirm">
          Las calificaciones publicadas quedarán disponibles para consulta del estudiante.
        </p>
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
        {
          styles
        }
      </style>
    </section>
  );
}

const styles = `
  .ctd {
    width: 100%;
    min-width: 0;

    display: grid;
    gap: 14px;

    color: var(--app-text);
  }

  .ctd-title-card {
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

  .ctd-title-identity {
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 14px;
  }

  .ctd-title-icon {
    width: 48px;
    height: 48px;

    display: grid;
    place-items: center;

    flex: 0 0 48px;

    border-radius: 15px;

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);
  }

  .ctd-eyebrow {
    display: block;

    color: var(--app-accent-dark);

    font-size: var(--app-font-xs);
    font-weight: 900;
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .ctd-title-card h3 {
    margin: 3px 0 0;

    font-size: var(--app-font-section);
  }

  .ctd-title-card p {
    margin: 4px 0 0;

    color: var(--app-text-muted);

    font-size: var(--app-font-sm);
  }

  .ctd-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .ctd-actions button {
    min-height: 35px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    padding: 7px 12px;

    border: 1px solid var(--app-border-strong);
    border-radius: 999px;

    color: var(--app-text-secondary);

    background: var(--app-surface-alt);

    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 800;

    cursor: pointer;
  }

  .ctd-actions button.is-primary {
    border-color: var(--app-accent);

    color: #fff;

    background: var(--app-accent);
  }

  .ctd-actions button:disabled {
    opacity: .5;

    cursor: not-allowed;
  }

  .ctd-summary {
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
  }

  .ctd-summary article {
    min-height: 68px;

    display: flex;
    align-items: center;
    gap: 11px;

    padding: 12px 14px;

    border: 1px solid var(--app-border);
    border-radius: 17px;

    background: var(--app-surface);
  }

  .ctd-summary article > svg {
    color: var(--app-accent-dark);
  }

  .ctd-summary strong,
  .ctd-summary span {
    display: block;
  }

  .ctd-summary strong {
    font-size: var(--app-font-title);
    line-height: 1;
  }

  .ctd-summary span {
    margin-top: 4px;

    color: var(--app-text-muted);

    font-size: var(--app-font-sm);
  }

  .ctd-filter-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    padding: 12px;

    border: 1px solid var(--app-border);
    border-radius: 17px;

    background: var(--app-surface);
  }

  .ctd-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .ctd-filters button {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    padding: 7px 10px;

    border: 1px solid var(--app-input-border);
    border-radius: 999px;

    color: var(--app-text-soft);

    background: var(--app-surface);

    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 750;

    cursor: pointer;
  }

  .ctd-filters button.active {
    border-color: var(--app-accent);

    color: var(--app-accent-dark);

    background: var(--app-accent-soft);
  }

  .ctd-filters button span {
    min-width: 19px;
    height: 19px;

    display: grid;
    place-items: center;

    padding: 0 5px;

    border-radius: 999px;

    background: var(--app-accent-softer);

    font-size: var(--app-font-xs);
    font-weight: 850;
  }

  .ctd-search {
    min-width: 270px;

    display: flex;
    align-items: center;
    gap: 7px;

    padding: 8px 11px;

    border: 1px solid var(--app-input-border);
    border-radius: 12px;

    color: var(--app-text-muted);

    background: var(--app-input-bg);
  }

  .ctd-search input {
    width: 100%;
    min-width: 0;

    padding: 0;

    border: 0;
    outline: 0;

    color: var(--app-text);

    background: transparent;

    font: inherit;
    font-size: var(--app-font-md);
  }

  .ctd-table-wrap {
    width: 100%;

    overflow-x: auto;

    border: 1px solid var(--app-border);
    border-radius: 17px;

    background: var(--app-surface);
  }

  .ctd-table {
    width: 100%;
    min-width: 860px;

    border-collapse: collapse;
  }

  .ctd-table th,
  .ctd-table td {
    padding: 10px 11px;

    border-bottom: 1px solid var(--app-border-soft);

    text-align: left;
    vertical-align: middle;
  }

  .ctd-table th {
    color: var(--app-text-soft);

    background: var(--app-accent-soft);

    font-size: var(--app-font-xs);
    font-weight: 900;
    text-transform: uppercase;
  }

  .ctd-table td {
    color: var(--app-text-secondary);

    font-size: var(--app-font-sm);
  }

  .ctd-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .ctd-table tbody tr:hover {
    background: var(--app-accent-softer);
  }

  .ctd-user {
    min-width: 220px;

    display: flex;
    align-items: center;
    gap: 9px;
  }

  .ctd-user > .ius-avatar {
    align-self: center;
  }

  .ctd-table td:first-child {
    vertical-align: middle;
  }

  .ctd-user > div {
    min-width: 0;
  }

  .ctd-user > div:not(.ius-avatar) > strong,
  .ctd-user > div:not(.ius-avatar) > span {
    display: block;
  }

  .ctd-user > div:not(.ius-avatar) > strong {
    color: var(--app-text);

    font-size: var(--app-font-md);
  }

  .ctd-user > div:not(.ius-avatar) > span {
    margin-top: 3px;

    color: var(--app-text-muted);

    font-size: var(--app-font-xs);
  }

  .ctd-user > .ius-avatar {
    align-self: center;

    display: grid;
    place-items: center;
  }

  .ctd-user > .ius-avatar .ius-avatar__surface,
  .ctd-user > .ius-avatar .ius-avatar__initials {
    display: grid;
    place-items: center;
  }

  .ctd-user > .ius-avatar .ius-avatar__initials {
    margin: 0 !important;

    line-height: 1 !important;
    text-align: center;
  }

  .ctd-group,
  .ctd-badge,
  .ctd-state {
    display: inline-flex;
    align-items: center;
    gap: 5px;

    padding: 5px 8px;

    border-radius: 999px;

    font-size: var(--app-font-xs);
    font-weight: 800;
  }

  .ctd-group {
    color: var(--app-accent-dark);

    background: var(--app-accent-soft);
  }

  .ctd-badge.is-ok {
    color: var(--app-success);

    background: var(--app-success-bg);
  }

  .ctd-badge.is-late {
    color: var(--app-danger);

    background: var(--app-danger-bg);
  }

  .ctd-state.is-calificada,
  .ctd-state.is-publicada {
    color: var(--app-success);

    background: var(--app-success-bg);
  }

  .ctd-state.is-pendiente,
  .ctd-state.is-borrador {
    color: var(--app-warning-strong);

    background: var(--app-warning-bg);
  }

  .ctd-state.is-anulada {
    color: var(--app-danger);

    background: var(--app-danger-bg);
  }

  .ctd-final {
    color: var(--app-accent-dark);
  }

  .ctd-note-detail {
    display: block;

    margin-top: 3px;

    color: var(--app-text-muted);

    font-size: var(--app-font-xs);
    font-weight: 500;
  }

  .ctd-grade {
    min-height: 32px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;

    padding: 6px 10px;

    border: 1px solid var(--app-border-strong);
    border-radius: 999px;

    color: var(--app-accent-dark);

    background: var(--app-surface);

    font: inherit;
    font-size: var(--app-font-xs);
    font-weight: 850;

    cursor: pointer;
  }

  .ctd-grade:hover:not(:disabled) {
    border-color: var(--app-accent);

    background: var(--app-accent-soft);
  }

  .ctd-grade:disabled {
    opacity: .38;

    cursor: not-allowed;
  }

  .ctd-no-presento {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 6px 10px;

    border-radius: 999px;

    color: var(--app-danger-strong);

    background: var(--app-danger-bg);

    font-size: var(--app-font-xs);
    font-weight: 850;
  }

  .ctd-publish-status {
    min-height: 34px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    padding: 7px 11px;

    border-radius: 999px;

    font-size: var(--app-font-xs);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .02em;
  }

  .ctd-publish-status.is-pending {
    color: var(--app-warning-strong);

    background: var(--app-warning-bg);
  }

  .ctd-publish-status.is-ready {
    color: var(--app-success-strong);

    background: var(--app-success-bg);
  }

  .ctd-publish-status.is-published {
    border: 1px solid var(--app-success-border);

    color: var(--app-success-strong);

    background: var(--app-success-bg);
  }

  .ctd-muted {
    color: var(--app-text-muted);

    font-size: var(--app-font-xs);
  }

  .ctd-empty {
    height: 120px;

    color: var(--app-text-muted) !important;

    text-align: center !important;
  }

  .ctd-report-options {
    display: grid;
    gap: 8px;
  }

  .ctd-report-options > button {
    width: 100%;

    display: grid;
    grid-template-columns:
      auto
      minmax(
        0,
        1fr
      )
      auto;
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

  .ctd-report-options span {
    min-width: 0;

    display: grid;
  }

  .ctd-report-options strong {
    color: var(--app-text);

    font-size: var(--app-font-md);
  }

  .ctd-report-options small {
    margin-top: 2px;

    color: var(--app-text-muted);

    font-size: var(--app-font-xs);
  }

  .ctd-report-loading,
  .ctd-confirm {
    margin: 0;

    color: var(--app-text-muted);

    font-size: var(--app-font-sm);
  }

  .ctd-modal-secondary,
  .ctd-modal-primary {
    min-height: 38px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 8px 13px;

    border-radius: 10px;

    font: inherit;
    font-size: var(--app-font-sm);
    font-weight: 850;

    cursor: pointer;
  }

  .ctd-modal-secondary {
    border: 1px solid var(--app-border-strong);

    color: var(--app-text-secondary);

    background: var(--app-surface);
  }

  .ctd-modal-primary {
    border: 1px solid var(--app-accent);

    color: #fff;

    background: var(--app-accent);
  }

  @media (
    max-width:
      900px
  ) {
    .ctd-summary {
      grid-template-columns:
        repeat(
          2,
          minmax(
            0,
            1fr
          )
        );
    }

    .ctd-title-card,
    .ctd-filter-card {
      align-items: stretch;

      flex-direction: column;
    }

    .ctd-search {
      min-width: 0;
    }
  }

  @media (
    max-width:
      560px
  ) {
    .ctd-summary {
      grid-template-columns: 1fr;
    }

    .ctd-title-identity {
      align-items: flex-start;
    }
  }
`;