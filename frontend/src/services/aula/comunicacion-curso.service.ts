import type {
  ActualizarComentarioDatos,
  ActualizarPublicacionDatos,
  ActualizarRespuestaForoDatos,
  ActualizarTemaForoDatos,
  CrearComentarioDatos,
  CrearPublicacionDatos,
  CrearRespuestaForoDatos,
  CrearTemaForoDatos,
  RespuestaComentarioAccion,
  RespuestaComentarios,
  RespuestaDetalleTemaForo,
  RespuestaErrorApi,
  RespuestaLecturasPublicacion,
  RespuestaPublicacionAccion,
  RespuestaRegistrarLectura,
  RespuestaRespuestaForoAccion,
  RespuestaTablonAula,
  RespuestaTemaForoAccion,
  RespuestaTemasForo,
} from '../../types/aula/comunicacion-curso.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

type MetodoHttp =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

type OpcionesPeticion = {
  method?: MetodoHttp;
  token: string;
  body?: unknown;
  signal?: AbortSignal;
};

function obtenerMensajeError(
  datos:
    RespuestaErrorApi,
  mensajePredeterminado:
    string,
): string {
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
    mensajePredeterminado
  );
}

async function peticionApi<T>(
  ruta:
    string,
  opciones:
    OpcionesPeticion,
): Promise<T> {
  const {
    method =
      'GET',
    token,
    body,
    signal,
  } = opciones;

  const respuesta =
    await fetch(
      `${API_URL}${ruta}`,
      {
        method,

        signal,

        headers: {
          Accept:
            'application/json',

          Authorization:
            `Bearer ${token}`,

          ...(body !==
          undefined
            ? {
                'Content-Type':
                  'application/json',
              }
            : {}),
        },

        ...(body !==
        undefined
          ? {
              body:
                JSON.stringify(
                  body,
                ),
            }
          : {}),
      },
    );

  const datos =
    await respuesta
      .json()
      .catch(
        () => ({}),
      );

  if (!respuesta.ok) {
    const errorApi =
      datos as
        RespuestaErrorApi;

    const error =
      new Error(
        obtenerMensajeError(
          errorApi,
          'No fue posible completar la solicitud.',
        ),
      );

    Object.assign(
      error,
      {
        status:
          respuesta.status,

        datos:
          errorApi,
      },
    );

    throw error;
  }

  return datos as T;
}

/*
 * =========================================================
 * TABLÓN COMPARTIDO POR HITO
 * =========================================================
 */

export function obtenerTablonAula(
  cursoId:
    number,
  hitoId:
    number,
  token:
    string,
  signal?:
    AbortSignal,
): Promise<RespuestaTablonAula> {
  return peticionApi<RespuestaTablonAula>(
    `/aula/cursos/${cursoId}/hitos/${hitoId}/tablon`,
    {
      token,
      signal,
    },
  );
}

export function crearPublicacion(
  cursoId:
    number,
  hitoId:
    number,
  datos:
    CrearPublicacionDatos,
  token:
    string,
): Promise<RespuestaPublicacionAccion> {
  return peticionApi<RespuestaPublicacionAccion>(
    `/aula/cursos/${cursoId}/hitos/${hitoId}/tablon`,
    {
      method:
        'POST',

      token,
      body:
        datos,
    },
  );
}

export function actualizarPublicacion(
  cursoId:
    number,
  hitoId:
    number,
  publicacionId:
    number,
  datos:
    ActualizarPublicacionDatos,
  token:
    string,
): Promise<RespuestaPublicacionAccion> {
  return peticionApi<RespuestaPublicacionAccion>(
    `/aula/cursos/${cursoId}/hitos/${hitoId}/tablon/${publicacionId}`,
    {
      method:
        'PUT',

      token,
      body:
        datos,
    },
  );
}

export function cambiarFijadoPublicacion(
  cursoId:
    number,
  hitoId:
    number,
  publicacionId:
    number,
  estaFijada:
    boolean,
  token:
    string,
): Promise<RespuestaPublicacionAccion> {
  return peticionApi<RespuestaPublicacionAccion>(
    `/aula/cursos/${cursoId}/hitos/${hitoId}/tablon/${publicacionId}/fijar`,
    {
      method:
        'PATCH',

      token,

      body: {
        estaFijada,
      },
    },
  );
}

export function cambiarComentariosPublicacion(
  cursoId:
    number,
  hitoId:
    number,
  publicacionId:
    number,
  comentariosHabilitados:
    boolean,
  token:
    string,
): Promise<RespuestaPublicacionAccion> {
  return peticionApi<RespuestaPublicacionAccion>(
    `/aula/cursos/${cursoId}/hitos/${hitoId}/tablon/${publicacionId}/comentarios`,
    {
      method:
        'PATCH',

      token,

      body: {
        comentariosHabilitados,
      },
    },
  );
}

export function cambiarVisibilidadPublicacion(
  cursoId:
    number,
  hitoId:
    number,
  publicacionId:
    number,
  visibleParaEstudiantes:
    boolean,
  token:
    string,
): Promise<RespuestaPublicacionAccion> {
  return peticionApi<RespuestaPublicacionAccion>(
    `/aula/cursos/${cursoId}/hitos/${hitoId}/tablon/${publicacionId}/visibilidad`,
    {
      method:
        'PATCH',

      token,

      body: {
        visibleParaEstudiantes,
      },
    },
  );
}

export function eliminarPublicacion(
  cursoId:
    number,
  hitoId:
    number,
  publicacionId:
    number,
  token:
    string,
): Promise<RespuestaPublicacionAccion> {
  return peticionApi<RespuestaPublicacionAccion>(
    `/aula/cursos/${cursoId}/hitos/${hitoId}/tablon/${publicacionId}`,
    {
      method:
        'DELETE',

      token,
    },
  );
}

/*
 * =========================================================
 * COMENTARIOS
 * =========================================================
 */

export function obtenerComentarios(
  cursoId:
    number,
  publicacionId:
    number,
  token:
    string,
  signal?:
    AbortSignal,
): Promise<RespuestaComentarios> {
  return peticionApi<RespuestaComentarios>(
    `/cursos/${cursoId}/tablon/${publicacionId}/comentarios`,
    {
      token,
      signal,
    },
  );
}

export function crearComentario(
  cursoId:
    number,
  publicacionId:
    number,
  datos:
    CrearComentarioDatos,
  token:
    string,
): Promise<RespuestaComentarioAccion> {
  return peticionApi<RespuestaComentarioAccion>(
    `/cursos/${cursoId}/tablon/${publicacionId}/comentarios`,
    {
      method:
        'POST',

      token,
      body:
        datos,
    },
  );
}

export function actualizarComentario(
  cursoId:
    number,
  publicacionId:
    number,
  comentarioId:
    number,
  datos:
    ActualizarComentarioDatos,
  token:
    string,
): Promise<RespuestaComentarioAccion> {
  return peticionApi<RespuestaComentarioAccion>(
    `/cursos/${cursoId}/tablon/${publicacionId}/comentarios/${comentarioId}`,
    {
      method:
        'PUT',

      token,
      body:
        datos,
    },
  );
}

export function eliminarComentario(
  cursoId:
    number,
  publicacionId:
    number,
  comentarioId:
    number,
  token:
    string,
): Promise<RespuestaComentarioAccion> {
  return peticionApi<RespuestaComentarioAccion>(
    `/cursos/${cursoId}/tablon/${publicacionId}/comentarios/${comentarioId}`,
    {
      method:
        'DELETE',

      token,
    },
  );
}

/*
 * =========================================================
 * LECTURAS
 * =========================================================
 */

export function registrarLecturaPublicacion(
  cursoId:
    number,
  publicacionId:
    number,
  token:
    string,
): Promise<RespuestaRegistrarLectura> {
  return peticionApi<RespuestaRegistrarLectura>(
    `/estudiante/cursos/${cursoId}/tablon/${publicacionId}/leer`,
    {
      method:
        'POST',

      token,
    },
  );
}

export function obtenerLecturasPublicacion(
  cursoId:
    number,
  publicacionId:
    number,
  token:
    string,
  signal?:
    AbortSignal,
): Promise<RespuestaLecturasPublicacion> {
  return peticionApi<RespuestaLecturasPublicacion>(
    `/docente/cursos/${cursoId}/tablon/${publicacionId}/lecturas`,
    {
      token,
      signal,
    },
  );
}

/*
 * =========================================================
 * FORO ACADÉMICO
 * =========================================================
 */

export function obtenerTemasForo(
  cursoId:
    number,
  token:
    string,
  signal?:
    AbortSignal,
): Promise<RespuestaTemasForo> {
  return peticionApi<RespuestaTemasForo>(
    `/cursos/${cursoId}/foro`,
    {
      token,
      signal,
    },
  );
}

export function obtenerTemaForoPorId(
  cursoId:
    number,
  temaId:
    number,
  token:
    string,
  signal?:
    AbortSignal,
): Promise<RespuestaDetalleTemaForo> {
  return peticionApi<RespuestaDetalleTemaForo>(
    `/cursos/${cursoId}/foro/${temaId}`,
    {
      token,
      signal,
    },
  );
}

export function crearTemaForo(
  cursoId:
    number,
  datos:
    CrearTemaForoDatos,
  token:
    string,
): Promise<RespuestaTemaForoAccion> {
  return peticionApi<RespuestaTemaForoAccion>(
    `/cursos/${cursoId}/foro`,
    {
      method:
        'POST',

      token,
      body:
        datos,
    },
  );
}

export function actualizarTemaForo(
  cursoId:
    number,
  temaId:
    number,
  datos:
    ActualizarTemaForoDatos,
  token:
    string,
): Promise<RespuestaTemaForoAccion> {
  return peticionApi<RespuestaTemaForoAccion>(
    `/cursos/${cursoId}/foro/${temaId}`,
    {
      method:
        'PUT',

      token,
      body:
        datos,
    },
  );
}

export function eliminarTemaForo(
  cursoId:
    number,
  temaId:
    number,
  token:
    string,
): Promise<RespuestaTemaForoAccion> {
  return peticionApi<RespuestaTemaForoAccion>(
    `/cursos/${cursoId}/foro/${temaId}`,
    {
      method:
        'DELETE',

      token,
    },
  );
}

export function cambiarFijadoTemaForo(
  cursoId:
    number,
  temaId:
    number,
  estaFijado:
    boolean,
  token:
    string,
): Promise<RespuestaTemaForoAccion> {
  return peticionApi<RespuestaTemaForoAccion>(
    `/docente/cursos/${cursoId}/foro/${temaId}/fijar`,
    {
      method:
        'PATCH',

      token,

      body: {
        estaFijado,
      },
    },
  );
}

export function cambiarCerradoTemaForo(
  cursoId:
    number,
  temaId:
    number,
  estaCerrado:
    boolean,
  token:
    string,
): Promise<RespuestaTemaForoAccion> {
  return peticionApi<RespuestaTemaForoAccion>(
    `/docente/cursos/${cursoId}/foro/${temaId}/cerrar`,
    {
      method:
        'PATCH',

      token,

      body: {
        estaCerrado,
      },
    },
  );
}

/*
 * =========================================================
 * RESPUESTAS DEL FORO
 * =========================================================
 */

export function crearRespuestaForo(
  cursoId:
    number,
  temaId:
    number,
  datos:
    CrearRespuestaForoDatos,
  token:
    string,
): Promise<RespuestaRespuestaForoAccion> {
  return peticionApi<RespuestaRespuestaForoAccion>(
    `/cursos/${cursoId}/foro/${temaId}/respuestas`,
    {
      method:
        'POST',

      token,
      body:
        datos,
    },
  );
}

export function actualizarRespuestaForo(
  cursoId:
    number,
  temaId:
    number,
  respuestaId:
    number,
  datos:
    ActualizarRespuestaForoDatos,
  token:
    string,
): Promise<RespuestaRespuestaForoAccion> {
  return peticionApi<RespuestaRespuestaForoAccion>(
    `/cursos/${cursoId}/foro/${temaId}/respuestas/${respuestaId}`,
    {
      method:
        'PUT',

      token,
      body:
        datos,
    },
  );
}

export function eliminarRespuestaForo(
  cursoId:
    number,
  temaId:
    number,
  respuestaId:
    number,
  token:
    string,
): Promise<RespuestaRespuestaForoAccion> {
  return peticionApi<RespuestaRespuestaForoAccion>(
    `/cursos/${cursoId}/foro/${temaId}/respuestas/${respuestaId}`,
    {
      method:
        'DELETE',

      token,
    },
  );
}

/*
 * =========================================================
 * UTILIDADES
 * =========================================================
 */

export function esErrorSesionVencida(
  error:
    unknown,
): boolean {
  if (
    !(error instanceof Error)
  ) {
    return false;
  }

  const errorConEstado =
    error as
      Error & {
        status?: number;
      };

  return (
    errorConEstado.status ===
      401
  );
}

export function obtenerMensajeErrorServicio(
  error:
    unknown,
  mensajePredeterminado =
    'Ocurrió un error inesperado.',
): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return mensajePredeterminado;
}