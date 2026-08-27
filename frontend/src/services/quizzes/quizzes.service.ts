import type {
  AnalisisDataset,
  BorradorPreguntaQuiz,
  CrearQuizDatos,
  DatasetQuiz,
  DetalleResultadoEstudianteQuiz,
  EstadoEnVivoQuiz,
  FragmentoQuiz,
  FuenteQuiz,
  LobbyQuiz,
  QuizCurso,
  ResultadoBusquedaDataset,
  ResultadoDocenteQuiz,
  DificultadQuiz,
  TipoPreguntaQuiz,
} from '../../types/quizzes/quizzes.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

type ErrorApi = {
  message?: string | string[];
};

async function leerError(
  respuesta: Response,
  defecto: string,
) {
  const data = await respuesta
    .json()
    .catch(() => ({} as ErrorApi));

  const mensaje = (data as ErrorApi).message;

  if (Array.isArray(mensaje)) {
    return mensaje.join('. ');
  }

  if (
    typeof mensaje === 'string' &&
    mensaje.trim()
  ) {
    return mensaje;
  }

  return defecto;
}

function auth(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function json(token: string) {
  return {
    ...auth(token),
    'Content-Type': 'application/json',
  };
}

export async function listarQuizzes(
  cursoId: number,
  token: string,
): Promise<QuizCurso[]> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar los Quizzes.',
      ),
    );
  }

  const data = await respuesta.json();

  return Array.isArray(data)
    ? data
    : [];
}

export async function obtenerQuiz(
  cursoId: number,
  quizId: number,
  token: string,
): Promise<QuizCurso> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar el Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function crearQuiz(
  cursoId: number,
  token: string,
  datos: CrearQuizDatos,
): Promise<QuizCurso> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}`,
    {
      method: 'POST',
      headers: json(token),
      body: JSON.stringify(datos),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible crear el Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function actualizarQuiz(
  cursoId: number,
  quizId: number,
  token: string,
  datos: Partial<CrearQuizDatos>,
): Promise<QuizCurso> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}`,
    {
      method: 'PATCH',
      headers: json(token),
      body: JSON.stringify(datos),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible actualizar el Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function listarDatasetsQuiz(
  cursoId: number,
  token: string,
): Promise<DatasetQuiz[]> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/datasets`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar los PDF disponibles para Quizzes.',
      ),
    );
  }

  const data = await respuesta.json();

  return Array.isArray(data)
    ? data
    : [];
}

export async function analizarDatasetQuiz(
  cursoId: number,
  versionId: number,
  token: string,
): Promise<AnalisisDataset> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/datasets/${versionId}/analizar`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible analizar el PDF.',
      ),
    );
  }

  return respuesta.json();
}

export async function buscarDatasetQuiz(
  cursoId: number,
  versionId: number,
  token: string,
  q: string,
  tipo: string,
): Promise<ResultadoBusquedaDataset[]> {
  const params = new URLSearchParams();
  params.set('q', q);
  params.set('tipo', tipo);
  params.set('limite', '30');

  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/datasets/${versionId}/buscar?${params.toString()}`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible buscar dentro del PDF.',
      ),
    );
  }

  const data = await respuesta.json();

  return Array.isArray(data?.resultados)
    ? data.resultados
    : [];
}

export async function agregarFuenteQuiz(
  cursoId: number,
  quizId: number,
  versionId: number,
  token: string,
): Promise<FuenteQuiz> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/fuentes`,
    {
      method: 'POST',
      headers: json(token),
      body: JSON.stringify({
        versionId,
      }),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible agregar el PDF al Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function seleccionarFragmentosQuiz(
  cursoId: number,
  quizId: number,
  fuenteId: number,
  token: string,
  fragmentos: ResultadoBusquedaDataset[],
): Promise<FragmentoQuiz[]> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/fuentes/${fuenteId}/fragmentos/seleccionar`,
    {
      method: 'POST',
      headers: json(token),
      body: JSON.stringify({
        fragmentos: fragmentos.map(
          (
            fragmento,
            indice,
          ) => ({
            tituloReferencia:
              fragmento.titulo,
            tipoReferencia:
              fragmento.tipo,
            texto:
              fragmento.texto,
            orden:
              indice,
          }),
        ),
      }),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible guardar los fragmentos seleccionados.',
      ),
    );
  }

  return respuesta.json();
}

export async function generarBorradorQuiz(
  cursoId: number,
  quizId: number,
  token: string,
  datos: {
    fragmentoIds: number[];
    cantidad: number;
    dificultad: DificultadQuiz;
    tipos: TipoPreguntaQuiz[];
  },
): Promise<BorradorPreguntaQuiz[]> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/generar-borrador`,
    {
      method: 'POST',
      headers: json(token),
      body: JSON.stringify(datos),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible generar el borrador de preguntas.',
      ),
    );
  }

  const data = await respuesta.json();

  return Array.isArray(data?.preguntas)
    ? data.preguntas
    : [];
}

export async function guardarPreguntaQuiz(
  cursoId: number,
  quizId: number,
  token: string,
  pregunta: BorradorPreguntaQuiz,
) {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/preguntas`,
    {
      method: 'POST',
      headers: json(token),
      body: JSON.stringify(pregunta),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible guardar una de las preguntas.',
      ),
    );
  }

  return respuesta.json();
}

export async function publicarSalaQuiz(
  cursoId: number,
  quizId: number,
  token: string,
) {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/publicar-sala`,
    {
      method: 'POST',
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible publicar la sala del Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function obtenerLobbyQuiz(
  cursoId: number,
  quizId: number,
  token: string,
): Promise<LobbyQuiz> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/lobby`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar el lobby del Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function iniciarQuiz(
  cursoId: number,
  quizId: number,
  token: string,
): Promise<QuizCurso> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/iniciar`,
    {
      method: 'POST',
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible iniciar el Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function activarQuiz(
  cursoId: number,
  quizId: number,
  token: string,
): Promise<QuizCurso> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/activar`,
    {
      method: 'POST',
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible activar el Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function pausarQuiz(
  cursoId: number,
  quizId: number,
  token: string,
): Promise<QuizCurso> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/pausar`,
    {
      method: 'POST',
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible pausar el Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function reanudarQuiz(
  cursoId: number,
  quizId: number,
  token: string,
): Promise<QuizCurso> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/reanudar`,
    {
      method: 'POST',
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible reanudar el Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function siguientePreguntaQuiz(
  cursoId: number,
  quizId: number,
  token: string,
): Promise<QuizCurso | ResultadoDocenteQuiz> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/siguiente-pregunta`,
    {
      method: 'POST',
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible avanzar a la siguiente pregunta.',
      ),
    );
  }

  return respuesta.json();
}

export async function finalizarQuiz(
  cursoId: number,
  quizId: number,
  token: string,
): Promise<ResultadoDocenteQuiz> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/finalizar`,
    {
      method: 'POST',
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible finalizar el Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function obtenerResultadosQuiz(
  cursoId: number,
  quizId: number,
  token: string,
): Promise<ResultadoDocenteQuiz> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/resultados`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar los resultados del Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function publicarResultadosQuiz(
  cursoId: number,
  quizId: number,
  token: string,
) {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/resultados/publicar`,
    {
      method: 'POST',
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible publicar los resultados.',
      ),
    );
  }

  return respuesta.json();
}

export async function eliminarQuiz(
  cursoId: number,
  quizId: number,
  token: string,
) {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}`,
    {
      method: 'DELETE',
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible eliminar el borrador.',
      ),
    );
  }

  return respuesta.json();
}

export async function eliminarPreguntaQuiz(
  cursoId: number,
  quizId: number,
  preguntaId: number,
  token: string,
) {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/preguntas/${preguntaId}`,
    {
      method: 'DELETE',
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible retirar una pregunta guardada.',
      ),
    );
  }

  return respuesta.json();
}

export async function obtenerEstadoEnVivoQuiz(
  cursoId: number,
  quizId: number,
  token: string,
): Promise<EstadoEnVivoQuiz> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/estado-en-vivo`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar el estado en vivo del Quiz.',
      ),
    );
  }

  return respuesta.json();
}

export async function obtenerDetalleResultadoEstudianteQuiz(
  cursoId: number,
  quizId: number,
  estudianteId: number,
  token: string,
): Promise<DetalleResultadoEstudianteQuiz> {
  const respuesta = await fetch(
    `${API_URL}/quizzes/cursos/${cursoId}/${quizId}/resultados/${estudianteId}`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar el detalle del estudiante.',
      ),
    );
  }

  return respuesta.json();
}
