import type {
  AulaCursoRespuesta,
  ErrorApiAula,
  HitoCursoRespuesta,
  HitosCursoRespuesta,
} from '../../types/aula/aulaCurso.types';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

function obtenerMensajeError(
  datos:
    ErrorApiAula,
  predeterminado:
    string,
): string {
  if (
    Array.isArray(
      datos.message,
    )
  ) {
    return datos.message.join(
      ' ',
    );
  }

  return (
    datos.message ||
    datos.mensaje ||
    datos.error ||
    predeterminado
  );
}

async function realizarPeticion<T>(
  ruta:
    string,
  accessToken:
    string,
): Promise<T> {
  if (
    !accessToken
  ) {
    throw new Error(
      'No existe una sesión válida.',
    );
  }

  const respuesta =
    await fetch(
      `${API_URL}${ruta}`,
      {
        method:
          'GET',

        headers: {
          Accept:
            'application/json',

          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    );

  const datos =
    await respuesta
      .json()
      .catch(
        () => ({}),
      );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      obtenerMensajeError(
        datos as ErrorApiAula,
        'No fue posible cargar la información del aula.',
      ),
    );
  }

  return datos as T;
}

export async function obtenerAulaCurso(
  cursoId:
    number,
  accessToken:
    string,
): Promise<AulaCursoRespuesta> {
  return realizarPeticion<AulaCursoRespuesta>(
    `/aula/cursos/${cursoId}`,
    accessToken,
  );
}

export async function obtenerHitosCurso(
  cursoId:
    number,
  accessToken:
    string,
): Promise<HitosCursoRespuesta> {
  return realizarPeticion<HitosCursoRespuesta>(
    `/aula/cursos/${cursoId}/hitos`,
    accessToken,
  );
}

export async function obtenerHitoCurso(
  cursoId:
    number,
  hitoId:
    number,
  accessToken:
    string,
): Promise<HitoCursoRespuesta> {
  return realizarPeticion<HitoCursoRespuesta>(
    `/aula/cursos/${cursoId}/hitos/${hitoId}`,
    accessToken,
  );
}