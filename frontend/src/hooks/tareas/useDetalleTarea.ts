import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useAuth,
} from '../../auth/AuthContext';

import type {
  CrearTareaDatos,
  RespuestaTarea,
  TareaCurso,
} from '../../types/tareas/tareas.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function obtenerMensajeError(
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

async function leerJson(
  respuesta:
    Response,
) {
  return respuesta
    .json()
    .catch(
      () =>
        null,
    );
}

export default function useDetalleTarea(
  cursoId:
    number,
  tareaId:
    number,
) {
  const {
    accessToken,
  } =
    useAuth();

  const [
    tarea,
    setTarea,
  ] =
    useState<TareaCurso | null>(
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

  const validar =
    useCallback(
      () => {
        if (
          !accessToken
        ) {
          throw new Error(
            'Tu sesión terminó. Inicia sesión nuevamente.',
          );
        }

        if (
          !cursoId ||
          !tareaId
        ) {
          throw new Error(
            'La tarea solicitada no es válida.',
          );
        }
      },
      [
        accessToken,
        cursoId,
        tareaId,
      ],
    );

  const cargar =
    useCallback(
      async () => {
        try {
          validar();

          setError(
            null,
          );

          const respuesta =
            await fetch(
              `${API_URL}/tareas/docente/cursos/${cursoId}/${tareaId}`,
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
            await leerJson(
              respuesta,
            );

          if (
            !respuesta.ok
          ) {
            throw new Error(
              obtenerMensajeError(
                cuerpo,
                'No fue posible abrir la tarea.',
              ),
            );
          }

          const detalle =
            (
              cuerpo as RespuestaTarea
            ).tarea;

          setTarea(
            detalle,
          );

          return detalle;
        } catch (
          causa
        ) {
          const mensaje =
            causa instanceof Error
              ? causa.message
              : 'No fue posible abrir la tarea.';

          setError(
            mensaje,
          );

          throw causa instanceof Error
            ? causa
            : new Error(
                mensaje,
              );
        } finally {
          setCargando(
            false,
          );
        }
      },
      [
        accessToken,
        cursoId,
        tareaId,
        validar,
      ],
    );

  useEffect(
    () => {
      void cargar().catch(
        () =>
          undefined,
      );
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
          'PUT'
          | 'PATCH'
          | 'DELETE',
        cuerpo?:
          unknown,
      ) => {
        validar();

        setProcesando(
          true,
        );

        setError(
          null,
        );

        try {
          const respuesta =
            await fetch(
              `${API_URL}${ruta}`,
              {
                method:
                  metodo,

                cache:
                  'no-store',

                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,

                  ...(cuerpo !==
                  undefined
                    ? {
                        'Content-Type':
                          'application/json',
                      }
                    : {}),

                  'Cache-Control':
                    'no-cache',

                  Pragma:
                    'no-cache',
                },

                ...(cuerpo !==
                undefined
                  ? {
                      body:
                        JSON.stringify(
                          cuerpo,
                        ),
                    }
                  : {}),
              },
            );

          const datos =
            await leerJson(
              respuesta,
            );

          if (
            !respuesta.ok
          ) {
            throw new Error(
              obtenerMensajeError(
                datos,
                'No fue posible completar la operación.',
              ),
            );
          }

          const respuestaTarea =
            datos as RespuestaTarea;

          if (
            respuestaTarea.tarea
          ) {
            setTarea(
              respuestaTarea.tarea,
            );
          } else {
            await cargar();
          }

          return respuestaTarea;
        } catch (
          causa
        ) {
          const mensaje =
            causa instanceof Error
              ? causa.message
              : 'No fue posible completar la operación.';

          setError(
            mensaje,
          );

          throw causa instanceof Error
            ? causa
            : new Error(
                mensaje,
              );
        } finally {
          setProcesando(
            false,
          );
        }
      },
      [
        accessToken,
        cargar,
        cursoId,
        tareaId,
        validar,
      ],
    );

  const actualizar =
    useCallback(
      async (
        datos:
          Omit<
            CrearTareaDatos,
            'hitoId' | 'publicar'
          >,
      ) =>
        ejecutar(
          `/tareas/cursos/${cursoId}/${tareaId}`,
          'PUT',
          datos,
        ),
      [
        cursoId,
        ejecutar,
        tareaId,
      ],
    );

  const publicar =
    useCallback(
      () =>
        ejecutar(
          `/tareas/cursos/${cursoId}/${tareaId}/publicar`,
          'PATCH',
        ),
      [
        cursoId,
        ejecutar,
        tareaId,
      ],
    );

  const cerrar =
    useCallback(
      () =>
        ejecutar(
          `/tareas/cursos/${cursoId}/${tareaId}/cerrar`,
          'PATCH',
        ),
      [
        cursoId,
        ejecutar,
        tareaId,
      ],
    );

  const reabrir =
    useCallback(
      () =>
        ejecutar(
          `/tareas/cursos/${cursoId}/${tareaId}/reabrir`,
          'PATCH',
        ),
      [
        cursoId,
        ejecutar,
        tareaId,
      ],
    );

  const anular =
    useCallback(
      () =>
        ejecutar(
          `/tareas/cursos/${cursoId}/${tareaId}`,
          'DELETE',
        ),
      [
        cursoId,
        ejecutar,
        tareaId,
      ],
    );

  return {
    tarea,
    cargando,
    procesando,
    error,
    cargar,
    actualizar,
    publicar,
    cerrar,
    reabrir,
    anular,
    limpiarError:
      () =>
        setError(
          null,
        ),
  };
}