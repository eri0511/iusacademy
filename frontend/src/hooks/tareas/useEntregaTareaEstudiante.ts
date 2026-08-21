import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useAuth,
} from '../../auth/AuthContext';

import type {
  TareaCurso,
} from '../../types/tareas/tareas.types';

import type {
  ArchivoEntregaTarea,
  ContextoGrupoEntregaTarea,
  EntregaTarea,
  EquipoAfinidadTarea,
  PermisosEntregaTarea,
  RespuestaGuardarEntregaTarea,
  RespuestaMiEntregaTarea,
  RespuestaMiEquipoAfinidadTarea,
} from '../../types/tareas/entregas.types';

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
  tarea:
    TareaCurso;
};

export default function useEntregaTareaEstudiante({
  tarea,
}: Opciones) {
  const {
    accessToken,
  } =
    useAuth();

  const [
    entrega,
    setEntrega,
  ] =
    useState<EntregaTarea | null>(
      null,
    );

  const [
    permisos,
    setPermisos,
  ] =
    useState<PermisosEntregaTarea>({
      puedeModificar:
        false,

      esGrupal:
        tarea.modalidad ===
        'GRUPAL',
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
    requiereEquipoAfinidad,
    setRequiereEquipoAfinidad,
  ] =
    useState(
      false,
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
    guardandoAutomatico,
    setGuardandoAutomatico,
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

  const cargarEquipoAfinidad =
    useCallback(
      async () => {
        if (
          tarea.modalidad !==
            'GRUPAL' ||
          tarea.origenGrupo !==
            'AFINIDAD'
        ) {
          setEquipoAfinidad(
            null,
          );

          setRequiereEquipoAfinidad(
            false,
          );

          return true;
        }

        validarSesion();

        const respuesta =
          await fetch(
            `${API_URL}/tareas/cursos/${tarea.cursoId}/${tarea.id}/equipos-afinidad/mi-equipo`,
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
              'No fue posible consultar tu equipo.',
            ),
          );
        }

        const datos =
          cuerpo as RespuestaMiEquipoAfinidadTarea;

        setEquipoAfinidad(
          datos.equipo,
        );

        const necesita =
          !datos.equipo;

        setRequiereEquipoAfinidad(
          necesita,
        );

        return !necesita;
      },
      [
        accessToken,
        tarea.cursoId,
        tarea.id,
        tarea.modalidad,
        tarea.origenGrupo,
        validarSesion,
      ],
    );

  const cargar =
    useCallback(
      async (
        mostrarCarga =
          true,
      ) => {
        validarSesion();

        if (
          mostrarCarga
        ) {
          setCargando(
            true,
          );
        }

        setError(
          null,
        );

        try {
          const tieneContexto =
            await cargarEquipoAfinidad();

          if (
            !tieneContexto
          ) {
            setEntrega(
              null,
            );

            setPermisos({
              puedeModificar:
                false,

              esGrupal:
                true,
            });

            setContextoGrupo(
              null,
            );

            return null;
          }

          const respuesta =
            await fetch(
              `${API_URL}/tareas/estudiante/cursos/${tarea.cursoId}/${tarea.id}/entrega`,
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
                'No fue posible consultar tu entrega.',
              ),
            );
          }

          const datos =
            cuerpo as RespuestaMiEntregaTarea;

          setEntrega(
            datos.entrega,
          );

          setPermisos(
            datos.permisos,
          );

          setContextoGrupo(
            datos.contextoGrupo ??
            null,
          );

          return datos.entrega;
        } catch (
          causa
        ) {
          const mensaje =
            causa instanceof Error
              ? causa.message
              : 'No fue posible consultar tu entrega.';

          setError(
            mensaje,
          );

          throw causa instanceof Error
            ? causa
            : new Error(
                mensaje,
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
        cargarEquipoAfinidad,
        tarea.cursoId,
        tarea.id,
        validarSesion,
      ],
    );

  useEffect(
    () => {
      void cargar(
        true,
      ).catch(
        () =>
          undefined,
      );
    },
    [
      cargar,
    ],
  );

  const preparar =
    useCallback(
      async (
        contenido?:
          string,
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
              `${API_URL}/tareas/estudiante/cursos/${tarea.cursoId}/${tarea.id}/entrega`,
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
                    ...(contenido !==
                    undefined
                      ? {
                          contenido,
                        }
                      : {}),
                  }),
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
                'No fue posible preparar la entrega.',
              ),
            );
          }

          const datos =
            cuerpo as RespuestaGuardarEntregaTarea;

          setEntrega(
            datos.entrega,
          );

          return datos.entrega;
        } catch (
          causa
        ) {
          const mensaje =
            causa instanceof Error
              ? causa.message
              : 'No fue posible preparar la entrega.';

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
        tarea.cursoId,
        tarea.id,
        validarSesion,
      ],
    );

  const autoguardar =
    useCallback(
      async (
        contenido?:
          string,
      ) => {
        validarSesion();

        setGuardandoAutomatico(
          true,
        );

        setError(
          null,
        );

        try {
          const respuesta =
            await fetch(
              `${API_URL}/tareas/estudiante/cursos/${tarea.cursoId}/${tarea.id}/entrega`,
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
                    ...(contenido !==
                    undefined
                      ? {
                          contenido,
                        }
                      : {}),
                  }),
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
                'No fue posible guardar el borrador automáticamente.',
              ),
            );
          }

          const datos =
            cuerpo as RespuestaGuardarEntregaTarea;

          setEntrega(
            datos.entrega,
          );

          return datos.entrega;
        } catch (
          causa
        ) {
          const mensaje =
            causa instanceof Error
              ? causa.message
              : 'No fue posible guardar el borrador automáticamente.';

          setError(
            mensaje,
          );

          throw causa instanceof Error
            ? causa
            : new Error(
                mensaje,
              );
        } finally {
          setGuardandoAutomatico(
            false,
          );
        }
      },
      [
        accessToken,
        tarea.cursoId,
        tarea.id,
        validarSesion,
      ],
    );

  const subirArchivo =
    useCallback(
      async (
        entregaId:
          number,
        archivo:
          File,
      ) => {
        validarSesion();

        const formData =
          new FormData();

        formData.append(
          'archivo',
          archivo,
        );

        const respuesta =
          await fetch(
            `${API_URL}/archivos/tareas/cursos/${tarea.cursoId}/entregas/${entregaId}`,
            {
              method:
                'POST',

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },

              body:
                formData,
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
              `No fue posible subir ${archivo.name}.`,
            ),
          );
        }

        return cuerpo;
      },
      [
        accessToken,
        tarea.cursoId,
        validarSesion,
      ],
    );

  const subirArchivos =
    useCallback(
      async (
        entregaId:
          number,
        archivos:
          File[],
      ) => {
        if (
          archivos.length ===
          0
        ) {
          return;
        }

        setProcesando(
          true,
        );

        setError(
          null,
        );

        try {
          for (
            const archivo
            of archivos
          ) {
            await subirArchivo(
              entregaId,
              archivo,
            );
          }

          await cargar(
            false,
          );
        } catch (
          causa
        ) {
          const mensaje =
            causa instanceof Error
              ? causa.message
              : 'No fue posible subir los archivos.';

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
        cargar,
        subirArchivo,
      ],
    );

  const enviar =
    useCallback(
      async (
        entregaId:
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
              `${API_URL}/tareas/estudiante/cursos/${tarea.cursoId}/${tarea.id}/entregas/${entregaId}/enviar`,
              {
                method:
                  'PATCH',

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
              obtenerMensajeError(
                cuerpo,
                'No fue posible entregar la tarea.',
              ),
            );
          }

          const datos =
            cuerpo as RespuestaGuardarEntregaTarea;

          setEntrega(
            datos.entrega,
          );

          await cargar(
            false,
          );

          return datos.entrega;
        } catch (
          causa
        ) {
          const mensaje =
            causa instanceof Error
              ? causa.message
              : 'No fue posible entregar la tarea.';

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
        tarea.cursoId,
        tarea.id,
        validarSesion,
      ],
    );

  const eliminarArchivo =
    useCallback(
      async (
        archivoId:
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
              `${API_URL}/archivos/${archivoId}`,
              {
                method:
                  'DELETE',

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
              obtenerMensajeError(
                cuerpo,
                'No fue posible eliminar el archivo.',
              ),
            );
          }

          await cargar(
            false,
          );
        } catch (
          causa
        ) {
          const mensaje =
            causa instanceof Error
              ? causa.message
              : 'No fue posible eliminar el archivo.';

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
        validarSesion,
      ],
    );

  const descargarArchivo =
    useCallback(
      async (
        archivo:
          ArchivoEntregaTarea,
      ) => {
        validarSesion();

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
            await leerJson(
              respuesta,
            );

          throw new Error(
            obtenerMensajeError(
              cuerpo,
              'No fue posible descargar el archivo.',
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

        enlace.href =
          url;

        enlace.download =
          archivo.nombreOriginal;

        document.body.appendChild(
          enlace,
        );

        enlace.click();

        enlace.remove();

        URL.revokeObjectURL(
          url,
        );
      },
      [
        accessToken,
        validarSesion,
      ],
    );

  return {
    entrega,
    permisos,
    contextoGrupo,
    equipoAfinidad,
    requiereEquipoAfinidad,
    cargando,
    procesando,
    guardandoAutomatico,
    error,
    cargar,
    preparar,
    autoguardar,
    subirArchivos,
    enviar,
    eliminarArchivo,
    descargarArchivo,
    limpiarError:
      () =>
        setError(
          null,
        ),
  };
}