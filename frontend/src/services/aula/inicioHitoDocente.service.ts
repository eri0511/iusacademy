import type {
  InicioHitoDocenteRespuesta,
} from '../../types/aula/inicioHitoDocente.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

type ErrorApi = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};

async function obtenerMensajeError(
  respuesta: Response,
) {
  const datos =
    await respuesta
      .json()
      .catch(
        () => ({} as ErrorApi),
      );

  const error =
    datos as ErrorApi;

  if (
    Array.isArray(
      error.message,
    )
  ) {
    return error.message.join(
      '. ',
    );
  }

  return error.message ||
    error.mensaje ||
    error.error ||
    'No fue posible cargar el resumen del hito.';
}

export async function obtenerInicioHitoDocente(
  cursoId: number,
  hitoId: number,
  token: string,
): Promise<InicioHitoDocenteRespuesta> {
  const respuesta =
    await fetch(
      `${API_URL}/aula/cursos/${cursoId}/hitos/${hitoId}/inicio-docente`,
      {
        headers: {
          Accept:
            'application/json',
          Authorization:
            `Bearer ${token}`,
        },
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await obtenerMensajeError(
        respuesta,
      ),
    );
  }

  return respuesta.json();
}
