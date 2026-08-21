import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useAuth,
} from '../../auth/AuthContext';

import type {
  DetalleForo,
  EstadisticasForo,
  HistorialForo,
  PanelCalificacionesForo,
  RespuestaForo,
  ResumenLecturasForo,
} from '../../types/foro/foro-detalle.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

const obtenerMensaje = (
  valor: unknown,
  mensajePredeterminado: string,
): string => {
  if (
    !valor ||
    typeof valor !== 'object'
  ) {
    return mensajePredeterminado;
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
    mensajePredeterminado
  );
};

export default function useDetalleForo(
  cursoId: number,
  foroId: number,
) {
  const {
    accessToken,
    sesion,
  } = useAuth();

  const [
    foro,
    setForo,
  ] =
    useState<DetalleForo | null>(
      null,
    );

  const [
    respuestas,
    setRespuestas,
  ] =
    useState<RespuestaForo[]>(
      [],
    );

  const [
    lecturas,
    setLecturas,
  ] =
    useState<ResumenLecturasForo | null>(
      null,
    );

  const [
    estadisticas,
    setEstadisticas,
  ] =
    useState<EstadisticasForo | null>(
      null,
    );

  const [
    calificaciones,
    setCalificaciones,
  ] =
    useState<PanelCalificacionesForo | null>(
      null,
    );

  const [
    historial,
    setHistorial,
  ] =
    useState<HistorialForo>(
      [],
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

  const crearHeaders =
    useCallback(
      (
        incluirJson =
          false,
      ): Record<string, string> => ({
        Authorization:
          `Bearer ${accessToken}`,

        ...(incluirJson
          ? {
              'Content-Type':
                'application/json',
            }
          : {}),
      }),
      [
        accessToken,
      ],
    );

  const pedir =
    useCallback(
      async <T,>(
        ruta: string,
        opciones?: RequestInit,
      ): Promise<T> => {
        const respuesta =
          await fetch(
            `${API_URL}${ruta}`,
            {
              ...opciones,

              cache:
                'no-store',

              headers: {
                ...crearHeaders(
                  Boolean(
                    opciones?.body,
                  ),
                ),

                'Cache-Control':
                  'no-cache',

                Pragma:
                  'no-cache',

                ...(opciones?.headers ??
                  {}),
              },
            },
          );

        const cuerpo:
          unknown =
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
        crearHeaders,
      ],
    );

  const cargaEnCurso =
    useRef(
      false,
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
          foroId <= 0 ||
          cargaEnCurso.current
        ) {
          return;
        }

        cargaEnCurso.current =
          true;

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

        const marcaTiempo =
          Date.now();

        try {
          const detalleForo =
            await pedir<DetalleForo>(
              `/foro/cursos/${cursoId}/${foroId}?_=${marcaTiempo}`,
            );

          setForo(
            detalleForo,
          );

          const esDocente =
            sesion?.usuario?.rol ===
            'DOCENTE';

          const esCalificable =
            Boolean(
              detalleForo.esCalificable &&
                detalleForo.actividadCalificable,
            );

          const promesaRespuestas =
            pedir<RespuestaForo[]>(
              `/foro/cursos/${cursoId}/${foroId}/respuestas?_=${marcaTiempo}`,
            );

          const promesaLecturas:
            Promise<ResumenLecturasForo | null> =
            esDocente
              ? pedir<ResumenLecturasForo>(
                  `/foro/cursos/${cursoId}/${foroId}/lecturas/resumen?_=${marcaTiempo}`,
                ).catch(
                  () =>
                    null,
                )
              : Promise.resolve(
                  null,
                );

          const promesaEstadisticas:
            Promise<EstadisticasForo | null> =
            esDocente
              ? pedir<EstadisticasForo>(
                  `/foro/cursos/${cursoId}/${foroId}/estadisticas?_=${marcaTiempo}`,
                ).catch(
                  () =>
                    null,
                )
              : Promise.resolve(
                  null,
                );

          const promesaPanel:
            Promise<PanelCalificacionesForo | null> =
            esDocente &&
            esCalificable
              ? pedir<PanelCalificacionesForo>(
                  `/foro/cursos/${cursoId}/${foroId}/calificaciones/panel?_=${marcaTiempo}`,
                ).catch(
                  () =>
                    null,
                )
              : Promise.resolve(
                  null,
                );

          const promesaHistorial:
            Promise<HistorialForo> =
            esDocente
              ? pedir<HistorialForo>(
                  `/foro/cursos/${cursoId}/${foroId}/historial?_=${marcaTiempo}`,
                ).catch(
                  () =>
                    [],
                )
              : Promise.resolve(
                  [],
                );

          const [
            respuestasForo,
            resumenLecturas,
            estadisticasForo,
            panelCalificaciones,
            historialForo,
          ] =
            await Promise.all([
              promesaRespuestas,
              promesaLecturas,
              promesaEstadisticas,
              promesaPanel,
              promesaHistorial,
            ]);

          setRespuestas(
            Array.isArray(
              respuestasForo,
            )
              ? respuestasForo
              : [],
          );

          setLecturas(
            resumenLecturas,
          );

          setEstadisticas(
            estadisticasForo,
          );

          setCalificaciones(
            panelCalificaciones,
          );

          setHistorial(
            Array.isArray(
              historialForo,
            )
              ? historialForo
              : [],
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
          cargaEnCurso.current =
            false;

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
        sesion?.usuario?.rol,
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

  const ejecutar =
    useCallback(
      async (
        ruta:
          string,

        metodo:
          | 'PATCH'
          | 'DELETE'
          | 'POST' =
          'PATCH',

        cuerpo?:
          unknown,
      ) => {
        setProcesando(
          true,
        );

        setError(
          null,
        );

        try {
          await pedir(
            ruta,
            {
              method:
                metodo,

              body:
                cuerpo ===
                undefined
                  ? undefined
                  : JSON.stringify(
                      cuerpo,
                    ),
            },
          );

          await cargar(
            true,
          );
        } catch (
          causa
        ) {
          setError(
            causa instanceof
              Error
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
        pedir,
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

  const cambiarEstado =
    useCallback(
      (
        estado:
          string,
      ) =>
        ejecutar(
          `/foro/cursos/${cursoId}/${foroId}/estado`,
          'PATCH',
          {
            estado,
          },
        ),
      [
        cursoId,
        foroId,
        ejecutar,
      ],
    );

  const cambiarFijado =
    useCallback(
      (
        estaFijado:
          boolean,
      ) =>
        ejecutar(
          `/foro/cursos/${cursoId}/${foroId}/fijado`,
          'PATCH',
          {
            estaFijado,
          },
        ),
      [
        cursoId,
        foroId,
        ejecutar,
      ],
    );

  const moderarRespuesta =
    useCallback(
      (
        respuestaId:
          number,

        ocultar:
          boolean,
      ) =>
        ejecutar(
          `/foro/cursos/${cursoId}/respuestas/${respuestaId}/moderar`,
          'PATCH',
          {
            ocultar,
          },
        ),
      [
        cursoId,
        ejecutar,
      ],
    );

  const bloquearRespuesta =
    useCallback(
      (
        respuestaId:
          number,

        bloquear:
          boolean,
      ) =>
        ejecutar(
          `/foro/cursos/${cursoId}/respuestas/${respuestaId}/bloqueo`,
          'PATCH',
          {
            bloquear,
          },
        ),
      [
        cursoId,
        ejecutar,
      ],
    );

  const moderarComentario =
    useCallback(
      (
        comentarioId:
          number,

        ocultar:
          boolean,
      ) =>
        ejecutar(
          `/foro/cursos/${cursoId}/comentarios/${comentarioId}/moderar`,
          'PATCH',
          {
            ocultar,
          },
        ),
      [
        cursoId,
        ejecutar,
      ],
    );

  const eliminarForo =
    useCallback(
      () =>
        ejecutar(
          `/foro/cursos/${cursoId}/${foroId}`,
          'DELETE',
        ),
      [
        cursoId,
        foroId,
        ejecutar,
      ],
    );

  const publicarNotas =
    useCallback(
      () =>
        ejecutar(
          `/foro/cursos/${cursoId}/${foroId}/calificaciones/publicar`,
          'PATCH',
          {
            permitirPendientes:
              false,
          },
        ),
      [
        cursoId,
        foroId,
        ejecutar,
      ],
    );

  const reabrirNotas =
    useCallback(
      () =>
        ejecutar(
          `/foro/cursos/${cursoId}/${foroId}/calificaciones/reabrir`,
          'PATCH',
          {
            motivo:
              'Reapertura solicitada desde el detalle del foro',
          },
        ),
      [
        cursoId,
        foroId,
        ejecutar,
      ],
    );

  return {
    foro,
    respuestas,
    lecturas,
    estadisticas,
    calificaciones,
    historial,
    cargando,
    procesando,
    error,
    cargar,
    limpiarError,
    cambiarEstado,
    cambiarFijado,
    moderarRespuesta,
    bloquearRespuesta,
    moderarComentario,
    eliminarForo,
    publicarNotas,
    reabrirNotas,
  };
}