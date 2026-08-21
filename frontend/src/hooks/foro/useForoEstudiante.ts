import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useAuth,
} from '../../auth/AuthContext';

export type EstadoForoEstudiante =
  | 'BORRADOR'
  | 'PROGRAMADO'
  | 'ABIERTO'
  | 'VENCIDO'
  | 'CERRADO'
  | 'CALIFICANDO'
  | 'CALIFICADO'
  | 'NOTAS_PUBLICADAS'
  | 'ANULADO'
  | string;

export type AutorForoEstudiante = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  fotoPerfilUrl?: string | null;
};

export type ArchivoForoEstudiante = {
  id: number;
  nombreOriginal?: string;
  nombre?: string;
  url?: string;
  urlPublica?: string;
  ruta?: string;
  mimeType?: string;
  tamanioBytes?: number;
};

export type ComentarioForoEstudiante = {
  id: number;
  autorId: number;
  contenido: string;
  publicadoEn: string;
  editadoEn?: string | null;
  estaOculto?: boolean;
  autor: AutorForoEstudiante;
  archivos?: ArchivoForoEstudiante[];
  respuestas?: ComentarioForoEstudiante[];
};

export type RespuestaForoEstudiante = {
  id: number;
  autorId: number;
  titulo: string;
  contenido: string;
  estado: string;
  publicadoEn: string;
  editadoEn?: string | null;
  entregadaTarde?: boolean;
  estaBloqueada?: boolean;
  autor: AutorForoEstudiante;
  archivos?: ArchivoForoEstudiante[];
  comentarios?: ComentarioForoEstudiante[];
  grupoCurso?: {
    id: number;
    nombre: string;
    color?: string | null;
  } | null;
  equipoAfinidad?: {
    id: number;
    nombre: string;
  } | null;
};

export type DinamicaGrupalForoEstudiante =
  | 'NINGUNA'
  | 'REPRESENTANTE_UNICO'
  | 'PARTICIPACION_DISTRIBUIDA'
  | 'COLABORACION_ABIERTA'
  | string;

export type MiParticipacionForoEstudiante = {
  estudianteId:
    number;

  modalidad:
    'INDIVIDUAL' |
    'GRUPAL' |
    string;

  origenGrupo:
    'NINGUNO' |
    'PLATAFORMA' |
    'AFINIDAD' |
    string;

  dinamicaGrupal:
    DinamicaGrupalForoEstudiante;

  componente:
    'CONTINUA' |
    'PROCESUAL' |
    string |
    null;

  grupo: {
    id:
      number;

    nombre:
      string;

    color?:
      string | null;
  } | null;

  integrantes: Array<{
    estudianteId:
      number;

    esRepresentante:
      boolean;

    estudiante: {
      id:
        number;

      nombres:
        string;

      apellidoPaterno:
        string;

      apellidoMaterno?:
        string | null;

      fotoPerfilUrl?:
        string | null;
    };
  }>;

  representante: {
    id:
      number;

    nombres:
      string;

    apellidoPaterno:
      string;

    apellidoMaterno?:
      string | null;

    fotoPerfilUrl?:
      string | null;
  } | null;

  esRepresentante:
    boolean;

  puedeCrearRespuestaPrincipal:
    boolean;

  comentarios: {
    puedeComentar:
      boolean;

    /* Compatibilidad con la versión anterior del contrato. */
    soloGrupoPropio:
      boolean;

    puedeComentarGrupoPropio?:
      boolean;

    puedeComentarOtrosGrupos?:
      boolean;
  };
};

export type DetalleForoEstudiante = {
  id: number;
  titulo: string;
  contenido: string;
  objetivo?: string | null;
  instrucciones?: string | null;
  estado: EstadoForoEstudiante;
  estaFijado?: boolean;
  esCalificable?: boolean;
  fechaApertura?: string | null;
  fechaLimite?: string | null;
  fechaCierre?: string | null;
  modalidadParticipacion: 'INDIVIDUAL' | 'GRUPAL' | string;
  origenGrupo?: 'NINGUNO' | 'PLATAFORMA' | 'AFINIDAD' | string | null;
  dinamicaGrupal?: DinamicaGrupalForoEstudiante;
  permitirComentarios: boolean;
  permitirEditarRespuestas?: boolean;
  permitirEliminarRespuestas?: boolean;
  permitirEditarComentarios?: boolean;
  permitirEliminarComentarios?: boolean;
  visibilidadRespuestas?: string;
  minimoComentariosPorEstudiante?: number | null;
  maximoComentariosPorEstudiante?: number | null;
  penalizarIncumplimientoComentarios?: boolean;
  tipoPenalizacionComentarios?:
    | 'NINGUNA'
    | 'PUNTOS_FIJOS'
    | 'PORCENTAJE'
    | string;
  valorPenalizacionComentarios?: number | string | null;
  palabrasMinimasRespuesta?: number | null;
  palabrasMaximasRespuesta?: number | null;
  palabrasMinimasComentario?: number | null;
  palabrasMaximasComentario?: number | null;
  permitirRetrasos?: boolean;
  fechaMaximaRetraso?: string | null;
  tipoDescuentoRetraso?:
    | 'NINGUNO'
    | 'PUNTOS_FIJOS'
    | 'PORCENTAJE'
    | 'POR_HORA'
    | 'POR_DIA'
    | 'NOTA_MAXIMA'
    | string;
  valorDescuentoRetraso?: number | string | null;
  permitirAdjuntosTema?: boolean;
  permitirAdjuntosRespuesta?: boolean;
  permitirAdjuntosComentario?: boolean;
  exigirAdjuntoRespuesta?: boolean;
  permitirDescargaAdjuntos?: boolean;
  extensionesPermitidas?: string[];
  maximoArchivosRespuesta?: number;
  maximoArchivosComentario?: number;
  tamanioMaximoArchivoMb?: number;
  cantidadMinimaIntegrantes?: number | null;
  cantidadMaximaIntegrantes?: number | null;
  requiereRepresentante?: boolean;
  bloquearEquipoAlResponder?: boolean;
  tipoEvaluacion?: string;
  modalidadNota?: string;
  porcentajeNotaGrupal?: number | null;
  porcentajeNotaIndividual?: number | null;
  archivos?: ArchivoForoEstudiante[];
  actividadCalificable?: {
    id: number;
    componente?: 'CONTINUA' | 'PROCESUAL' | string | null;
    estado?: string;
    puntajeMaximo?: number | string | null;
  } | null;

  miParticipacion?:
    MiParticipacionForoEstudiante |
    null;
};

export type EstudianteDisponibleAfinidad = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  correo?: string | null;
  fotoPerfilUrl?: string | null;
};

export type IntegranteEquipoAfinidad = {
  id: number;
  estudianteId: number;
  esRepresentante: boolean;
  estudiante: EstudianteDisponibleAfinidad;
};

export type EquipoAfinidad = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  estado: string;
  creadorId?: number;
  integrantes: IntegranteEquipoAfinidad[];
};

export type DisponibilidadAfinidad = {
  yaTieneEquipo: boolean;
  equipo: {
    id: number;
    nombre: string;
  } | null;
  minimoIntegrantes: number;
  maximoIntegrantes: number;
  estudiantes: EstudianteDisponibleAfinidad[];
};

export type NotaPublicadaForo = {
  publicada?: boolean;
  notaFinal?: number | string | null;
  notaBase?: number | string | null;
  descuentoRetraso?: number | string | null;
  descuentoComentarios?: number | string | null;
  ajusteIndividual?: number | string | null;
  notaGrupal?: number | string | null;
  notaIndividual?: number | string | null;
  retroalimentacion?: string | null;
  estado?: string;
  puntajeMaximo?: number | string | null;
  [clave: string]: unknown;
};

export type RespuestaNotaPublicadaForo = {
  foro: {
    id: number;
    titulo: string;
    notasPublicadasEn?: string | null;
  };

  calificacion:
    NotaPublicadaForo;
};


type ErrorApi = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function obtenerMensaje(
  valor: unknown,
  predeterminado: string,
): string {
  if (
    !valor ||
    typeof valor !== 'object'
  ) {
    return predeterminado;
  }

  const datos =
    valor as ErrorApi;

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
    datos.message ??
    datos.mensaje ??
    datos.error ??
    predeterminado
  );
}

export default function useForoEstudiante(
  cursoId: number,
  foroId: number,
) {
  const {
    accessToken,
  } = useAuth();

  const [
    foro,
    setForo,
  ] =
    useState<DetalleForoEstudiante | null>(
      null,
    );

  const [
    respuestas,
    setRespuestas,
  ] =
    useState<RespuestaForoEstudiante[]>(
      [],
    );

  const [
    equipo,
    setEquipo,
  ] =
    useState<EquipoAfinidad | null>(
      null,
    );

  const [
    disponibilidad,
    setDisponibilidad,
  ] =
    useState<DisponibilidadAfinidad | null>(
      null,
    );

  const [
    nota,
    setNota,
  ] =
    useState<NotaPublicadaForo | null>(
      null,
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(
      true,
    );

  const [
    procesando,
    setProcesando,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const pedir =
    useCallback(
      async <T,>(
        ruta: string,
        opciones?: RequestInit,
      ): Promise<T> => {
        const esFormData =
          typeof FormData !== 'undefined' &&
          opciones?.body instanceof FormData;

        const respuesta =
          await fetch(
            `${API_URL}${ruta}`,
            {
              ...opciones,

              cache:
                'no-store',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                ...(opciones?.body && !esFormData
                  ? {
                      'Content-Type':
                        'application/json',
                    }
                  : {}),
                'Cache-Control':
                  'no-cache',

                Pragma:
                  'no-cache',

                ...(opciones?.headers ??
                  {}),
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
            obtenerMensaje(
              cuerpo,
              'No fue posible completar la operación.',
            ),
          );
        }

        return cuerpo as T;
      },
      [
        accessToken,
      ],
    );

  const cargarEquipo =
    useCallback(
      async (
        detalle:
          DetalleForoEstudiante,
      ) => {
        const usaAfinidad =
          detalle.modalidadParticipacion ===
            'GRUPAL' &&
          detalle.origenGrupo ===
            'AFINIDAD';

        if (
          !usaAfinidad
        ) {
          setEquipo(
            null,
          );
          setDisponibilidad(
            null,
          );
          return;
        }

        const equipos =
          await pedir<EquipoAfinidad[]>(
            `/foro/cursos/${cursoId}/${foroId}/equipos`,
          ).catch(
            () =>
              [],
          );

        setEquipo(
          Array.isArray(
            equipos,
          ) &&
          equipos.length >
            0
            ? equipos[0]
            : null,
        );

        const disponibles =
          await pedir<DisponibilidadAfinidad>(
            `/foro/cursos/${cursoId}/${foroId}/equipos/estudiantes-disponibles`,
          ).catch(
            () =>
              null,
          );

        setDisponibilidad(
          disponibles,
        );
      },
      [
        cursoId,
        foroId,
        pedir,
      ],
    );

  const cargar =
    useCallback(
      async (
        silencioso =
          false,
      ) => {
        if (
          !accessToken ||
          cursoId <= 0 ||
          foroId <= 0
        ) {
          setCargando(
            false,
          );
          return;
        }

        try {
          if (
            !silencioso
          ) {
            setCargando(
              true,
            );

            setError(
              null,
            );
          }

          const detalle =
            await pedir<DetalleForoEstudiante>(
              `/foro/cursos/${cursoId}/${foroId}?_=${Date.now()}`,
            );

          setForo(
            detalle,
          );

          /*
           * Una recarga silenciosa puede ocurrir justo cuando el foro pasa
           * de PROGRAMADO a ABIERTO. Si una consulta anterior dejó un error
           * como "todavía no está disponible", al obtener correctamente el
           * detalle debemos eliminarlo aunque esta carga sea silenciosa.
           */
          setError(
            null,
          );

          const [
            respuestasForo,
            notaPublicada,
          ] =
            await Promise.all([
              pedir<RespuestaForoEstudiante[]>(
                `/foro/cursos/${cursoId}/${foroId}/respuestas?_=${Date.now()}`,
              ).catch(
                () =>
                  [],
              ),

              detalle.esCalificable &&
              detalle.estado ===
                'NOTAS_PUBLICADAS'
                ? pedir<RespuestaNotaPublicadaForo>(
                    `/foro/estudiante/cursos/${cursoId}/${foroId}/calificacion?_=${Date.now()}`,
                  ).catch(
                    () =>
                      null,
                  )
                : Promise.resolve(
                    null,
                  ),
            ]);

          setRespuestas(
            Array.isArray(
              respuestasForo,
            )
              ? respuestasForo
              : [],
          );

          setNota(
            notaPublicada?.calificacion ??
            null,
          );

          await cargarEquipo(
            detalle,
          );

          if (
            !silencioso
          ) {
            void pedir(
              `/foro/cursos/${cursoId}/${foroId}/lectura`,
              {
                method:
                  'POST',
              },
            ).catch(
              () =>
                undefined,
            );
          }
        } catch (
          causa
        ) {
          /*
           * Si ya tenemos el foro renderizado, una consulta silenciosa
           * transitoria no debe dejar una alerta roja permanente.
           * Conservamos la información válida y el siguiente refresco
           * volverá a intentar sincronizar.
           */
          if (
            !silencioso
          ) {
            setError(
              causa instanceof Error
                ? causa.message
                : 'No fue posible cargar el foro.',
            );
          }
        } finally {
          if (
            !silencioso
          ) {
            setCargando(
              false,
            );
          }
        }
      },
      [
        accessToken,
        cursoId,
        foroId,
        pedir,
        cargarEquipo,
      ],
    );

  useEffect(
    () => {
      void cargar(
        false,
      );
    },
    [
      cargar,
    ],
  );

  useEffect(
    () => {
      const refrescar =
        () => {
          if (
            document.visibilityState !==
              'visible'
          ) {
            return;
          }

          void cargar(
            true,
          );
        };

      const intervalo =
        window.setInterval(
          refrescar,
          5000,
        );

      window.addEventListener(
        'focus',
        refrescar,
      );

      document.addEventListener(
        'visibilitychange',
        refrescar,
      );

      return () => {
        window.clearInterval(
          intervalo,
        );

        window.removeEventListener(
          'focus',
          refrescar,
        );

        document.removeEventListener(
          'visibilitychange',
          refrescar,
        );
      };
    },
    [
      cargar,
    ],
  );

  const usaAfinidad =
    useMemo(
      () =>
        foro?.modalidadParticipacion ===
          'GRUPAL' &&
        foro?.origenGrupo ===
          'AFINIDAD',
      [
        foro,
      ],
    );

  const miParticipacion =
    useMemo(
      () =>
        foro?.miParticipacion ??
        null,
      [
        foro,
      ],
    );

  const puedeComentarRespuesta =
    useCallback(
      (
        respuesta:
          RespuestaForoEstudiante,
      ) => {
        if (
          !foro?.permitirComentarios
        ) {
          return false;
        }

        if (
          foro.modalidadParticipacion ===
          'INDIVIDUAL'
        ) {
          return true;
        }

        if (
          !miParticipacion?.comentarios
            .puedeComentar ||
          !miParticipacion.grupo
        ) {
          return false;
        }

        const esGrupoPropio =
          miParticipacion.origenGrupo ===
            'PLATAFORMA'
            ? respuesta.grupoCurso?.id ===
              miParticipacion.grupo.id
            : miParticipacion.origenGrupo ===
                'AFINIDAD'
              ? respuesta.equipoAfinidad?.id ===
                miParticipacion.grupo.id
              : false;

        if (
          miParticipacion.dinamicaGrupal ===
          'REPRESENTANTE_UNICO'
        ) {
          return false;
        }

        if (
          miParticipacion.dinamicaGrupal ===
          'PARTICIPACION_DISTRIBUIDA'
        ) {
          return esGrupoPropio;
        }

        if (
          miParticipacion.dinamicaGrupal ===
          'COLABORACION_ABIERTA'
        ) {
          /*
           * Regla definitiva:
           * colaboración abierta significa intervenir en
           * respuestas de OTROS grupos.
           */
          return !esGrupoPropio;
        }

        /*
         * Fallback para contratos antiguos del backend.
         */
        if (
          miParticipacion.comentarios
            .puedeComentarGrupoPropio ===
          true
        ) {
          return esGrupoPropio;
        }

        if (
          miParticipacion.comentarios
            .puedeComentarOtrosGrupos ===
          true
        ) {
          return !esGrupoPropio;
        }

        if (
          miParticipacion.comentarios
            .soloGrupoPropio
        ) {
          return esGrupoPropio;
        }

        return false;
      },
      [
        foro,
        miParticipacion,
      ],
    );

  const ejecutar =
    useCallback(
      async <T,>(
        accion:
          () => Promise<T>,
      ): Promise<T> => {
        try {
          setProcesando(
            true,
          );
          setError(
            null,
          );

          const resultado =
            await accion();

          await cargar();

          return resultado;
        } catch (
          causa
        ) {
          setError(
            causa instanceof Error
              ? causa.message
              : 'No fue posible completar la operación.',
          );
          throw causa;
        } finally {
          setProcesando(
            false,
          );
        }
      },
      [
        cargar,
      ],
    );

  const crearEquipo =
    useCallback(
      async (
        integrantesIds:
          number[],
      ) =>
        ejecutar(
          () =>
            pedir(
              `/foro/cursos/${cursoId}/${foroId}/equipos`,
              {
                method:
                  'POST',

                body:
                  JSON.stringify({
                    integrantesIds,
                  }),
              },
            ),
        ),
      [
        cursoId,
        foroId,
        pedir,
        ejecutar,
      ],
    );

  const publicarRespuesta =
    useCallback(
      async (
        titulo:
          string,
        contenido:
          string,
        archivos:
          File[] = [],
      ) => {
        if (
          foro?.modalidadParticipacion ===
            'GRUPAL'
        ) {
          if (
            usaAfinidad &&
            !equipo
          ) {
            throw new Error(
              'Primero debes formar tu grupo por afinidad.',
            );
          }

          if (
            !miParticipacion?.grupo
          ) {
            throw new Error(
              'No se pudo identificar tu grupo para este foro.',
            );
          }

          if (
            !miParticipacion
              .puedeCrearRespuestaPrincipal
          ) {
            throw new Error(
              'Solo el representante del grupo puede publicar la respuesta principal.',
            );
          }
        }

        if (
          foro?.exigirAdjuntoRespuesta &&
          archivos.length === 0
        ) {
          throw new Error(
            'Debes adjuntar al menos un archivo antes de publicar la respuesta.',
          );
        }

        return ejecutar(
          async () => {
            const creada =
              await pedir<{
                mensaje?: string;
                respuesta: {
                  id: number;
                };
              }>(
                `/foro/cursos/${cursoId}/${foroId}/respuestas`,
                {
                  method:
                    'POST',
                  body:
                    JSON.stringify({
                      titulo,
                      contenido,

                      ...(miParticipacion
                        ?.origenGrupo ===
                          'PLATAFORMA' &&
                      miParticipacion.grupo
                        ? {
                            grupoCursoId:
                              miParticipacion
                                .grupo.id,
                          }
                        : {}),

                      ...(miParticipacion
                        ?.origenGrupo ===
                          'AFINIDAD' &&
                      miParticipacion.grupo
                        ? {
                            equipoAfinidadId:
                              miParticipacion
                                .grupo.id,
                          }
                        : usaAfinidad &&
                            equipo
                          ? {
                              equipoAfinidadId:
                                equipo.id,
                            }
                          : {}),
                    }),
                },
              );

            const respuestaId =
              Number(
                creada?.respuesta?.id,
              );

            if (
              !Number.isFinite(
                respuestaId,
              ) ||
              respuestaId <= 0
            ) {
              throw new Error(
                'La respuesta se creó, pero no se pudo identificar para adjuntar los archivos.',
              );
            }

            const archivosFallidos:
              string[] = [];

            for (
              const archivo of archivos
            ) {
              const formulario =
                new FormData();

              formulario.append(
                'archivo',
                archivo,
              );

              try {
                await pedir(
                  `/archivos/foro/cursos/${cursoId}/respuestas/${respuestaId}`,
                  {
                    method:
                      'POST',
                    body:
                      formulario,
                  },
                );
              } catch {
                archivosFallidos.push(
                  archivo.name,
                );
              }
            }

            return {
              respuestaId,
              archivosFallidos,
            };
          },
        );
      },
      [
        foro,
        usaAfinidad,
        equipo,
        miParticipacion,
        cursoId,
        foroId,
        pedir,
        ejecutar,
      ],
    );

  const crearComentario =
    useCallback(
      async (
        respuestaId:
          number,
        contenido:
          string,
        comentarioPadreId?:
          number,
      ) =>
        ejecutar(
          () =>
            pedir(
              `/foro/cursos/${cursoId}/respuestas/${respuestaId}/comentarios`,
              {
                method:
                  'POST',
                body:
                  JSON.stringify({
                    contenido,
                    ...(comentarioPadreId
                      ? {
                          comentarioPadreId,
                        }
                      : {}),
                  }),
              },
            ),
        ),
      [
        cursoId,
        pedir,
        ejecutar,
      ],
    );

  const limpiarError =
    useCallback(
      () => {
        setError(
          null,
        );
      },
      [],
    );

  return {
    foro,
    respuestas,
    equipo,
    disponibilidad,
    nota,
    usaAfinidad,
    miParticipacion,
    puedeComentarRespuesta,
    cargando,
    procesando,
    error,
    cargar,
    crearEquipo,
    publicarRespuesta,
    crearComentario,
    limpiarError,
  };
}