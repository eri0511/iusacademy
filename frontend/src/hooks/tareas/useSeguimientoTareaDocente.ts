import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useAuth,
} from '../../auth/AuthContext';

import type {
  PanelEvaluacionTarea,
  RespuestaHistorialTarea,
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

function mensajeError(
  valor:
    unknown,
  fallback:
    string,
) {
  if (
    valor &&
    typeof valor ===
      'object'
  ) {
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

  return fallback;
}

export default function useSeguimientoTareaDocente(
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
    panel,
    setPanel,
  ] =
    useState<PanelEvaluacionTarea | null>(
      null,
    );

  const [
    historial,
    setHistorial,
  ] =
    useState<RespuestaHistorialTarea | null>(
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
      },
      [
        accessToken,
      ],
    );

  const cargarPanel =
    useCallback(
      async (
        mostrarCarga =
          true,
      ) => {
        validar();

        if (
          mostrarCarga
        ) {
          setCargando(
            true,
          );
        }

        try {
          const respuesta =
            await fetch(
              `${API_URL}/tareas/docente/cursos/${cursoId}/${tareaId}/evaluacion`,
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
              mensajeError(
                cuerpo,
                'No fue posible cargar las calificaciones.',
              ),
            );
          }

          setPanel(
            cuerpo as PanelEvaluacionTarea,
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
              : 'No fue posible cargar las calificaciones.',
          );
        } finally {
          if (
            mostrarCarga
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
        tareaId,
        validar,
      ],
    );

  const cargarHistorial =
    useCallback(
      async () => {
        validar();

        const respuesta =
          await fetch(
            `${API_URL}/tareas/docente/cursos/${cursoId}/${tareaId}/historial`,
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
          await leerJson(
            respuesta,
          );

        if (
          !respuesta.ok
        ) {
          throw new Error(
            mensajeError(
              cuerpo,
              'No fue posible cargar el historial.',
            ),
          );
        }

        setHistorial(
          cuerpo as RespuestaHistorialTarea,
        );
      },
      [
        accessToken,
        cursoId,
        tareaId,
        validar,
      ],
    );

  const calificar =
    useCallback(
      async (
        entregaId:
          number,
        datos: {
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
        validar();

        setProcesando(
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
                    datos,
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
              mensajeError(
                cuerpo,
                'No fue posible guardar la calificación.',
              ),
            );
          }

          await Promise.all([
            cargarPanel(
              false,
            ),
            cargarHistorial(),
          ]);

          return cuerpo;
        } finally {
          setProcesando(
            false,
          );
        }
      },
      [
        accessToken,
        cargarHistorial,
        cargarPanel,
        cursoId,
        tareaId,
        validar,
      ],
    );

  const publicar =
    useCallback(
      async () => {
        validar();

        setProcesando(
          true,
        );

        try {
          const respuesta =
            await fetch(
              `${API_URL}/tareas/docente/cursos/${cursoId}/${tareaId}/calificaciones/publicar`,
              {
                method:
                  'POST',

                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
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
              mensajeError(
                cuerpo,
                'No fue posible publicar las notas.',
              ),
            );
          }

          await Promise.all([
            cargarPanel(
              false,
            ),
            cargarHistorial(),
          ]);

          return cuerpo;
        } finally {
          setProcesando(
            false,
          );
        }
      },
      [
        accessToken,
        cargarHistorial,
        cargarPanel,
        cursoId,
        tareaId,
        validar,
      ],
    );

  useEffect(
    () => {
      void cargarPanel(
        true,
      );

      void cargarHistorial()
        .catch(
          () =>
            undefined,
        );
    },
    [
      cargarHistorial,
      cargarPanel,
    ],
  );

  return {
    panel,
    historial,
    cargando,
    procesando,
    error,
    cargarPanel,
    cargarHistorial,
    calificar,
    publicar,
  };
}