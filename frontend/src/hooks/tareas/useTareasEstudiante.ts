import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useAuth,
} from '../../auth/AuthContext';

import type {
  RespuestaListadoTareas,
  RespuestaTarea,
  TareaCurso,
} from '../../types/tareas/tareas.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function mensajeError(
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

async function jsonSeguro(
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

export default function useTareasEstudiante({
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
        cargaCompleta =
          false,
      ) => {
        validarSesion();

        if (
          cargaCompleta ||
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

          const respuesta =
            await fetch(
              `${API_URL}/tareas/estudiante/cursos/${cursoId}${
                query
                  ? `?${query}`
                  : ''
              }`,
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
            await jsonSeguro(
              respuesta,
            );

          if (
            !respuesta.ok
          ) {
            throw new Error(
              mensajeError(
                cuerpo,
                'No fue posible cargar tus tareas.',
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
          setError(
            causa instanceof Error
              ? causa.message
              : 'No fue posible cargar tus tareas.',
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

  const obtener =
    useCallback(
      async (
        tareaId:
          number,
      ): Promise<TareaCurso> => {
        validarSesion();

        const respuesta =
          await fetch(
            `${API_URL}/tareas/estudiante/cursos/${cursoId}/${tareaId}`,
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
          await jsonSeguro(
            respuesta,
          );

        if (
          !respuesta.ok
        ) {
          throw new Error(
            mensajeError(
              cuerpo,
              'No fue posible abrir la tarea.',
            ),
          );
        }

        return (
          cuerpo as RespuestaTarea
        ).tarea;
      },
      [
        accessToken,
        cursoId,
        validarSesion,
      ],
    );

  return {
    tareas,
    cargando,
    actualizando,
    error,
    cargar,
    obtener,
    limpiarError:
      () =>
        setError(
          null,
        ),
  };
}