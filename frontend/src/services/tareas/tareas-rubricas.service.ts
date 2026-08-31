import type {
  CalificacionRubricaEntrega,
  CalificarRubricaDatos,
  CrearRubricaDatos,
  RubricaTarea,
} from '../../types/tareas/rubricas.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

export function rubricaPredeterminada(): CrearRubricaDatos {
  return {
    nombre: 'Rúbrica predeterminada IusAcademy',
    origen: 'MANUAL',
    ponderacionMax: 100,
    criterios: [
      {
        orden: 0,
        nombre: 'Dominio y comprensión',
        descripcion: 'Comprende y desarrolla correctamente la actividad.',
        peso: 40,
        niveles: [
          { orden: 0, etiqueta: 'Inicial', puntos: 50, descripcion: 'Presenta dificultades importantes.' },
          { orden: 1, etiqueta: 'Logrado', puntos: 75, descripcion: 'Cumple adecuadamente.' },
          { orden: 2, etiqueta: 'Excelente', puntos: 100, descripcion: 'Demuestra dominio completo.' },
        ],
      },
      {
        orden: 1,
        nombre: 'Calidad y fundamentación',
        descripcion: 'La respuesta está fundamentada y responde a la consigna.',
        peso: 35,
        niveles: [
          { orden: 0, etiqueta: 'Inicial', puntos: 50, descripcion: 'Fundamentación insuficiente.' },
          { orden: 1, etiqueta: 'Logrado', puntos: 75, descripcion: 'Fundamentación adecuada.' },
          { orden: 2, etiqueta: 'Excelente', puntos: 100, descripcion: 'Fundamentación sólida y pertinente.' },
        ],
      },
      {
        orden: 2,
        nombre: 'Presentación y cumplimiento',
        descripcion: 'Cumple el formato, requisitos y presenta el trabajo con claridad.',
        peso: 25,
        niveles: [
          { orden: 0, etiqueta: 'Inicial', puntos: 50, descripcion: 'Cumple parcialmente.' },
          { orden: 1, etiqueta: 'Logrado', puntos: 75, descripcion: 'Cumple lo solicitado.' },
          { orden: 2, etiqueta: 'Excelente', puntos: 100, descripcion: 'Presentación clara y completa.' },
        ],
      },
    ],
  };
}

type ErrorApi = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};

function auth(
  token:
    string,
) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function leerError(
  respuesta:
    Response,
  defecto:
    string,
) {
  const data =
    await respuesta
      .json()
      .catch(
        () =>
          ({} as ErrorApi),
      );

  const error =
    data as ErrorApi;

  if (
    Array.isArray(
      error.message,
    )
  ) {
    return error.message.join(
      '. ',
    );
  }

  if (
    typeof error.message ===
      'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    typeof error.mensaje ===
      'string' &&
    error.mensaje.trim()
  ) {
    return error.mensaje;
  }

  return defecto;
}

async function enviar(
  ruta:
    string,
  opciones:
    RequestInit,
): Promise<Response> {
  const respuesta =
    await fetch(
      ruta,
      opciones,
    );

  if (
    !respuesta.ok
  ) {
    throw new Error(
      await leerError(
        respuesta,
        'No se pudo completar la operación',
      ),
    );
  }

  return respuesta;
}

export async function obtenerRubricaTarea(
  cursoId:
    number,
  tareaId:
    number,
  token:
    string,
): Promise<RubricaTarea | null> {
  const respuesta =
    await enviar(
      `${API_URL}/tareas/rubricas/docente/cursos/${cursoId}/${tareaId}`,
      {
        headers:
          auth(
            token,
          ),
      },
    );

  return (await respuesta.json()) as RubricaTarea | null;
}

export async function crearRubricaTarea(
  cursoId:
    number,
  tareaId:
    number,
  datos:
    CrearRubricaDatos,
  token:
    string,
): Promise<RubricaTarea> {
  const respuesta =
    await enviar(
      `${API_URL}/tareas/rubricas/docente/cursos/${cursoId}/${tareaId}`,
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
          JSON.stringify(
            datos,
          ),
      },
    );

  return (await respuesta.json()) as RubricaTarea;
}

export async function eliminarRubricaTarea(
  cursoId:
    number,
  tareaId:
    number,
  token:
    string,
): Promise<void> {
  await enviar(
    `${API_URL}/tareas/rubricas/docente/cursos/${cursoId}/${tareaId}`,
    {
      method:
        'DELETE',
      headers:
        auth(
          token,
        ),
    },
  );
}

export async function importarRubricaExcel(
  cursoId:
    number,
  tareaId:
    number,
  archivo:
    File,
  token:
    string,
): Promise<CrearRubricaDatos> {
  const form =
    new FormData();

  form.append(
    'archivo',
    archivo,
  );

  const respuesta =
    await enviar(
      `${API_URL}/tareas/rubricas/docente/cursos/${cursoId}/${tareaId}/importar-excel`,
      {
        method:
          'POST',
        headers:
          auth(
            token,
          ),
        body:
          form,
      },
    );

  return (await respuesta.json()) as CrearRubricaDatos;
}

export async function obtenerEvaluacionRubricaEntrega(
  cursoId:
    number,
  tareaId:
    number,
  entregaId:
    number,
  token:
    string,
): Promise<CalificacionRubricaEntrega | null> {
  const respuesta =
    await enviar(
      `${API_URL}/tareas/rubricas/docente/cursos/${cursoId}/${tareaId}/evaluaciones/${entregaId}`,
      {
        headers:
          auth(
            token,
          ),
      },
    );

  return (await respuesta.json()) as CalificacionRubricaEntrega | null;
}

export async function calificarEntregaConRubrica(
  cursoId:
    number,
  tareaId:
    number,
  entregaId:
    number,
  datos:
    CalificarRubricaDatos,
  token:
    string,
): Promise<void> {
  await enviar(
    `${API_URL}/tareas/rubricas/docente/cursos/${cursoId}/${tareaId}/evaluar/${entregaId}`,
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
        JSON.stringify(
          datos,
        ),
    },
  );
}
