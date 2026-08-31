const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

type ErrorApi = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};

function auth(
  token:
    string,
): Record<string, string> {
  return {
    Authorization:
      `Bearer ${token}`,
  };
}

function mensajeError(
  cuerpo:
    ErrorApi | null,
): string | undefined {
  if (
    !cuerpo
  ) {
    return undefined;
  }

  if (
    Array.isArray(
      cuerpo.message,
    )
  ) {
    return (
      cuerpo.message as string[]
    ).join(
      ', ',
    );
  }

  return (
    cuerpo.mensaje ??
    cuerpo.message ??
    cuerpo.error
  );
}

export type EstudiantePresencialRoster = {
  estudianteId: number;
  representante: boolean;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string | null;
  fotoPerfilUrl: string | null;
  calificacion: {
    notaBase: number;
    notaFinal: number;
    estado: string;
    retroalimentacion: string | null;
  } | null;
};

export type GrupoPresencialRoster = {
  id: number;
  nombre: string;
  orden: number;
  estudiantes: EstudiantePresencialRoster[];
};

export type RosterPresencial = {
  tareaId: number;
  modalidadNota: string;
  puntajeMaximo: number | null;
  actividadCalificable: {
    id: number;
    estado: string;
    puntaje: number | null;
  } | null;
  grupos: GrupoPresencialRoster[];
};

export type RegistroPresencialEstudiante = {
  estudianteId: number;
  notaBase: number;
  observacion?: string;
};

export async function obtenerRosterPresencial(
  cursoId: number,
  tareaId: number,
  token: string,
): Promise<RosterPresencial> {
  const respuesta = await fetch(
    `${API_URL}/tareas/docente/cursos/${cursoId}/${tareaId}/presencial/roster`,
    {
      method: 'GET',
      headers:
        auth(token),
    },
  );

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new Error(
      mensajeError(cuerpo as ErrorApi | null) ?? 'No fue posible cargar el registro presencial.',
    );
  }

  return (await respuesta.json()) as RosterPresencial;
}

export async function registrarPresencial(
  cursoId: number,
  tareaId: number,
  estudiantes: RegistroPresencialEstudiante[],
  token: string,
): Promise<{ actualizados: number }> {
  const respuesta = await fetch(
    `${API_URL}/tareas/docente/cursos/${cursoId}/${tareaId}/presencial/registrar`,
    {
      method: 'POST',
      headers: {
        ...auth(token),
        'Content-Type':
          'application/json',
      },
      body:
        JSON.stringify({
          estudiantes,
        }),
    },
  );

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new Error(
      mensajeError(cuerpo as ErrorApi | null) ?? 'No fue posible registrar la evidencia.',
    );
  }

  return (await respuesta.json()) as { actualizados: number };
}
