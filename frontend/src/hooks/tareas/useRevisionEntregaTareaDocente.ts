import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useAuth,
} from '../../auth/AuthContext';

import type {
  RevisionEntregaTareaDocente,
} from '../../types/tareas/tarea-docente-seguimiento.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

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

function obtenerMensaje(
  cuerpo:
    unknown,
  predeterminado:
    string,
) {
  if (
    cuerpo &&
    typeof cuerpo ===
      'object'
  ) {
    const valor =
      cuerpo as {
        message?:
          string | string[];

        mensaje?:
          string;

        error?:
          string;
      };

    if (
      Array.isArray(
        valor.message,
      )
    ) {
      return valor.message.join(
        '. ',
      );
    }

    return (
      valor.message ||
      valor.mensaje ||
      valor.error ||
      predeterminado
    );
  }

  return predeterminado;
}

export default function useRevisionEntregaTareaDocente(
  cursoId:
    number,
  tareaId:
    number,
  entregaId:
    number,
) {
  const {
    accessToken,
  } =
    useAuth();

  const [
    datos,
    setDatos,
  ] =
    useState<RevisionEntregaTareaDocente | null>(
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
    guardando,
    setGuardando,
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
      async () => {
        validarSesion();

        setCargando(
          true,
        );

        try {
          const respuesta =
            await fetch(
              `${API_URL}/tareas/docente/cursos/${cursoId}/${tareaId}/entregas/${entregaId}/revision`,
              {
                cache:
                  'no-store',

                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,

                  'Cache-Control':
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
              obtenerMensaje(
                cuerpo,
                'No fue posible cargar la entrega.',
              ),
            );
          }

          setDatos(
            cuerpo as RevisionEntregaTareaDocente,
          );

          setError(
            null,
          );
        } catch (
          causa
        ) {
          setError(
            causa instanceof Error
              ? causa.message
              : 'No fue posible cargar la entrega.',
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
        entregaId,
        tareaId,
        validarSesion,
      ],
    );

  const calificar =
    useCallback(
      async (
        payload: {
          notaBase:
            number;

          ajustesIndividuales?:
            Array<{
              estudianteId:
                number;

              ajuste:
                number;
            }>;

          retroalimentacion?:
            string;
        },
      ) => {
        validarSesion();

        setGuardando(
          true,
        );

        try {
          const respuesta =
            await fetch(
              `${API_URL}/tareas/docente/cursos/${cursoId}/${tareaId}/entregas/${entregaId}/calificacion`,
              {
                method:
                  'PATCH',

                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,

                  'Content-Type':
                    'application/json',
                },

                body:
                  JSON.stringify(
                    payload,
                  ),
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
              obtenerMensaje(
                cuerpo,
                'No fue posible guardar la calificación.',
              ),
            );
          }

          await cargar();

          return cuerpo;
        } finally {
          setGuardando(
            false,
          );
        }
      },
      [
        accessToken,
        cargar,
        cursoId,
        entregaId,
        tareaId,
        validarSesion,
      ],
    );

  useEffect(
    () => {
      void cargar();
    },
    [
      cargar,
    ],
  );

  return {
    datos,
    cargando,
    guardando,
    error,
    cargar,
    calificar,
  };
}
