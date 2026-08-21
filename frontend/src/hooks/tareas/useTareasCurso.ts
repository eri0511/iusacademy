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
  RespuestaListadoTareas,
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

type Opciones = {
  cursoId:
    number;

  hitoId?:
    number | null;
};

export default function useTareasCurso({
  cursoId,
  hitoId,
}: Opciones) {
  const {
    accessToken,
  } =
    useAuth();

  const [
    tareas,
    setTareas,
  ] =
    useState<TareaCurso[]>(
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
    actualizando,
    setActualizando,
  ] =
    useState(
      false,
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

  const validarSesion =
    useCallback(
      () => {
        if (
          !accessToken
        ) {
          throw new Error(
            'Tu sesión terminó. Inicia sesión nuevamente.',
          );
        }
      },
      [
        accessToken,
      ],
    );

  const cargar =
    useCallback(
      async (
        mostrarCargaCompleta =
          true,
      ) => {
        validarSesion();

        if (
          mostrarCargaCompleta &&
          tareas.length ===
            0
        ) {
          setCargando(
            true,
          );
        } else {
          setActualizando(
            true,
          );
        }

        setError(
          null,
        );

        try {
          const parametros =
            new URLSearchParams();

          if (
            hitoId
          ) {
            parametros.set(
              'hitoId',
              String(
                hitoId,
              ),
            );
          }

          const query =
            parametros.toString();

          const url =
            `${API_URL}/tareas/docente/cursos/${cursoId}${
              query
                ? `?${query}`
                : ''
            }`;

          const respuesta =
            await fetch(
              url,
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
                'No fue posible cargar las tareas.',
              ),
            );
          }

          const datos =
            cuerpo as RespuestaListadoTareas;

          setTareas(
            Array.isArray(
              datos.tareas,
            )
              ? datos.tareas
              : [],
          );
        } catch (
          causa
        ) {
          const mensaje =
            causa instanceof Error
              ? causa.message
              : 'No fue posible cargar las tareas.';

          setError(
            mensaje,
          );
        } finally {
          setCargando(
            false,
          );

          setActualizando(
            false,
          );
        }
      },
      [
        accessToken,
        cursoId,
        hitoId,
        tareas.length,
        validarSesion,
      ],
    );

  useEffect(
    () => {
      if (
        !accessToken ||
        !cursoId ||
        !hitoId
      ) {
        setCargando(
          false,
        );

        return;
      }

      void cargar(
        true,
      );
    },
    [
      accessToken,
      cursoId,
      hitoId,
      cargar,
    ],
  );

  const ejecutar =
    useCallback(
      async <T,>(
        ruta:
          string,

        metodo:
          'POST'
          | 'PUT'
          | 'PATCH'
          | 'DELETE',

        cuerpo?:
          unknown,
      ): Promise<T> => {
        validarSesion();

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

          return datos as T;
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
        validarSesion,
      ],
    );

  const crear =
    useCallback(
      async (
        datos:
          CrearTareaDatos,
      ) => {
        const respuesta =
          await ejecutar<RespuestaTarea>(
            `/tareas/cursos/${cursoId}`,
            'POST',
            datos,
          );

        await cargar(
          false,
        );

        return respuesta;
      },
      [
        cargar,
        cursoId,
        ejecutar,
      ],
    );

  const obtener =
    useCallback(
      async (
        tareaId:
          number,
      ) => {
        validarSesion();

        setProcesando(
          true,
        );

        setError(
          null,
        );

        try {
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

          return (
            cuerpo as RespuestaTarea
          ).tarea;
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
          setProcesando(
            false,
          );
        }
      },
      [
        accessToken,
        cursoId,
        validarSesion,
      ],
    );

  const actualizar =
    useCallback(
      async (
        tareaId:
          number,

        datos:
          Omit<
            CrearTareaDatos,
            'hitoId' | 'publicar'
          >,
      ) => {
        const respuesta =
          await ejecutar<RespuestaTarea>(
            `/tareas/cursos/${cursoId}/${tareaId}`,
            'PUT',
            datos,
          );

        await cargar(
          false,
        );

        return respuesta;
      },
      [
        cargar,
        cursoId,
        ejecutar,
      ],
    );

  const accionSimple =
    useCallback(
      async (
        tareaId:
          number,

        accion:
          'publicar'
          | 'cerrar'
          | 'reabrir',
      ) => {
        const respuesta =
          await ejecutar<RespuestaTarea>(
            `/tareas/cursos/${cursoId}/${tareaId}/${accion}`,
            'PATCH',
          );

        await cargar(
          false,
        );

        return respuesta;
      },
      [
        cargar,
        cursoId,
        ejecutar,
      ],
    );

  const anular =
    useCallback(
      async (
        tareaId:
          number,
      ) => {
        const respuesta =
          await ejecutar<RespuestaTarea>(
            `/tareas/cursos/${cursoId}/${tareaId}`,
            'DELETE',
          );

        await cargar(
          false,
        );

        return respuesta;
      },
      [
        cargar,
        cursoId,
        ejecutar,
      ],
    );

  return {
    tareas,

    cargando,

    actualizando,

    procesando,

    error,

    cargar,

    crear,

    obtener,

    actualizar,

    publicar:
      (
        id:
          number,
      ) =>
        accionSimple(
          id,
          'publicar',
        ),

    cerrar:
      (
        id:
          number,
      ) =>
        accionSimple(
          id,
          'cerrar',
        ),

    reabrir:
      (
        id:
          number,
      ) =>
        accionSimple(
          id,
          'reabrir',
        ),

    anular,

    limpiarError:
      () =>
        setError(
          null,
        ),
  };
}