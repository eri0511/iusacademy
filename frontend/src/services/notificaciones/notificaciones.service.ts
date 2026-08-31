import type {
  RespuestaContarNoLeidas,
  RespuestaEliminarNotificacion,
  RespuestaListarNotificaciones,
  RespuestaMarcarTodasLeidas,
} from '../../types/notificaciones/notificacion.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

type MetodoHttp =
  | 'GET'
  | 'PATCH'
  | 'DELETE';

type OpcionesPeticion = {
  method?: MetodoHttp;
  token: string;
  signal?: AbortSignal;
};

function obtenerMensajeError(
  datos:
    Record<
      string,
      unknown
    >,
  mensajePredeterminado:
    string,
): string {
  const mensaje =
    datos.message;

  if (
    Array.isArray(mensaje)
  ) {
    return mensaje.join(
      '. ',
    );
  }

  if (
    typeof mensaje ===
      'string' &&
    mensaje.trim()
  ) {
    return mensaje;
  }

  if (
    typeof datos.mensaje ===
      'string' &&
    datos.mensaje.trim()
  ) {
    return datos.mensaje;
  }

  return mensajePredeterminado;
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
        },
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
      datos as Record<
        string,
        unknown
      >;

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

export function listarNotificaciones(
  token:
    string,
  esLeida?:
    boolean,
  pagina =
    '1',
  signal?:
    AbortSignal,
): Promise<RespuestaListarNotificaciones> {
  const parametros =
    new URLSearchParams({
      pagina,
      limite: '20',
    });

  if (
    esLeida !==
    undefined
  ) {
    parametros.set(
      'esLeida',
      String(
        esLeida,
      ),
    );
  }

  return peticionApi<RespuestaListarNotificaciones>(
    `/notificaciones?${parametros.toString()}`,
    {
      token,
      signal,
    },
  );
}

export function contarNoLeidas(
  token:
    string,
  signal?:
    AbortSignal,
): Promise<RespuestaContarNoLeidas> {
  return peticionApi<RespuestaContarNoLeidas>(
    '/notificaciones/no-leidas/conteo',
    {
      token,
      signal,
    },
  );
}

export function marcarNotificacionLeida(
  id:
    number,
  token:
    string,
): Promise<unknown> {
  return peticionApi<unknown>(
    `/notificaciones/${id}/leida`,
    {
      method:
        'PATCH',
      token,
    },
  );
}

export function marcarTodasNotificacionesLeidas(
  token:
    string,
): Promise<RespuestaMarcarTodasLeidas> {
  return peticionApi<RespuestaMarcarTodasLeidas>(
    '/notificaciones/leer-todas',
    {
      method:
        'PATCH',
      token,
    },
  );
}

export function eliminarNotificacion(
  id:
    number,
  token:
    string,
): Promise<RespuestaEliminarNotificacion> {
  return peticionApi<RespuestaEliminarNotificacion>(
    `/notificaciones/${id}`,
    {
      method:
        'DELETE',
      token,
    },
  );
}
