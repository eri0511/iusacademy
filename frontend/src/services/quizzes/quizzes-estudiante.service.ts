import type {
  LobbyQuizEstudiante,
  MiResultadoQuizEstudiante,
  QuizDetalleEstudiante,
  RankingFinalQuizEstudiante,
  QuizListadoEstudiante,
  RespuestaAccionQuizEstudiante,
  RespuestaPreguntaQuizEstudiante,
} from '../../types/quizzes/quizzes-estudiante.types';

import type {
  AvatarQuizCodigo,
} from '../../types/quizzes/avatar-quiz.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

function auth(
  token:
    string,
) {
  return {
    Authorization:
      `Bearer ${token}`,
  };
}

async function leerError(
  respuesta:
    Response,

  fallback:
    string,
) {
  try {
    const cuerpo =
      await respuesta.json();

    const mensaje =
      cuerpo?.message ??
      cuerpo?.mensaje ??
      cuerpo?.error;

    if (
      Array.isArray(
        mensaje,
      )
    ) {
      return mensaje.join(
        '. ',
      );
    }

    return mensaje ||
      fallback;
  } catch {
    return fallback;
  }
}

export async function listarQuizzesEstudiante(
  cursoId:
    number,

  token:
    string,
): Promise<QuizListadoEstudiante[]> {
  const respuesta =
    await fetch(
      `${API_URL}/quizzes/cursos/${cursoId}`,
      {
        cache:
          'no-store',

        headers: {
          ...auth(
            token,
          ),

          'Cache-Control':
            'no-cache',

          Pragma:
            'no-cache',
        },
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar los quizzes.',
      ),
    );
  }

  return respuesta.json();
}

export async function obtenerQuizEstudiante(
  cursoId:
    number,

  quizId:
    number,

  token:
    string,
): Promise<QuizDetalleEstudiante> {
  const respuesta =
    await fetch(
      `${API_URL}/quizzes/cursos/${cursoId}/${quizId}`,
      {
        cache:
          'no-store',

        headers: {
          ...auth(
            token,
          ),

          'Cache-Control':
            'no-cache',

          Pragma:
            'no-cache',
        },
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible abrir el Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function unirseQuizEstudiante(
  cursoId:
    number,

  quizId:
    number,

  token:
    string,
): Promise<RespuestaAccionQuizEstudiante> {
  const respuesta =
    await fetch(
      `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/unirse`,
      {
        method:
          'POST',

        headers:
          auth(
            token,
          ),
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible ingresar a la sala.',
      ),
    );
  }

  return respuesta.json();
}

export async function marcarListoQuizEstudiante(
  cursoId:
    number,

  quizId:
    number,

  token:
    string,
): Promise<RespuestaAccionQuizEstudiante> {
  const respuesta =
    await fetch(
      `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/listo`,
      {
        method:
          'POST',

        headers:
          auth(
            token,
          ),
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible marcarte como listo.',
      ),
    );
  }

  return respuesta.json();
}


export async function obtenerLobbyQuizEstudiante(
  cursoId:
    number,

  quizId:
    number,

  token:
    string,
): Promise<LobbyQuizEstudiante> {
  const respuesta =
    await fetch(
      `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/lobby`,
      {
        cache:
          'no-store',

        headers: {
          ...auth(
            token,
          ),

          'Cache-Control':
            'no-cache',

          Pragma:
            'no-cache',
        },
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar la sala de espera.',
      ),
    );
  }

  return respuesta.json();
}

export async function seleccionarAvatarQuizEstudiante(
  cursoId:
    number,

  quizId:
    number,

  token:
    string,

  avatarCodigo:
    AvatarQuizCodigo |
    null,
) {
  const respuesta =
    await fetch(
      `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/avatar`,
      {
        method:
          'PATCH',

        headers: {
          ...auth(
            token,
          ),

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            avatarCodigo,
          }),
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible actualizar tu avatar.',
      ),
    );
  }

  return respuesta.json();
}

export async function heartbeatQuizEstudiante(
  cursoId:
    number,

  quizId:
    number,

  token:
    string,
) {
  const respuesta =
    await fetch(
      `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/heartbeat`,
      {
        method:
          'POST',

        headers:
          auth(
            token,
          ),
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible actualizar tu presencia.',
      ),
    );
  }

  return respuesta.json();
}

export async function responderPreguntaQuizEstudiante(
  cursoId:
    number,

  quizId:
    number,

  token:
    string,

  preguntaId:
    number,

  opcionIds:
    number[],
): Promise<RespuestaPreguntaQuizEstudiante> {
  const respuesta =
    await fetch(
      `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/responder`,
      {
        method:
          'POST',

        headers: {
          ...auth(
            token,
          ),

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            preguntaId,
            opcionIds,
          }),
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible registrar tu respuesta.',
      ),
    );
  }

  return respuesta.json();
}

export async function obtenerMiResultadoQuizEstudiante(
  cursoId:
    number,

  quizId:
    number,

  token:
    string,
): Promise<MiResultadoQuizEstudiante> {
  const respuesta =
    await fetch(
      `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/mi-resultado`,
      {
        cache:
          'no-store',

        headers: {
          ...auth(
            token,
          ),

          'Cache-Control':
            'no-cache',

          Pragma:
            'no-cache',
        },
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar tu resultado.',
      ),
    );
  }

  return respuesta.json();
}

export async function obtenerRankingFinalQuizEstudiante(
  cursoId:
    number,

  quizId:
    number,

  token:
    string,
): Promise<RankingFinalQuizEstudiante> {
  const respuesta =
    await fetch(
      `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/ranking-final`,
      {
        cache:
          'no-store',

        headers: {
          ...auth(
            token,
          ),

          'Cache-Control':
            'no-cache',

          Pragma:
            'no-cache',
        },
      },
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar el ranking final.',
      ),
    );
  }

  return respuesta.json();
}
