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

export type SesionEdicionAutor = {
  autorId: number;
  autorNombre: string;
  segundosActivos: number;
  cantidadPegados: number;
  ultimoLatidoEn: string;
};

export async function registrarSesionEdicion(
  cursoId: number,
  tareaId: number,
  entregaId: number,
  segundosActivos: number,
  cantidadPegados: number,
  token: string,
): Promise<{ ok: boolean }> {
  const respuesta = await fetch(
    `${API_URL}/tareas/estudiante/cursos/${cursoId}/${tareaId}/entregas/${entregaId}/sesiones`,
    {
      method: 'POST',
      headers: {
        ...auth(token),
        'Content-Type':
          'application/json',
      },
      body:
        JSON.stringify({
          segundosActivos:
            Math.max(
              0,
              Math.round(
                segundosActivos,
              ),
            ),
          cantidadPegados:
            Math.max(
              0,
              Math.round(
                cantidadPegados,
              ),
            ),
        }),
    },
  );

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new Error(
      mensajeError(cuerpo as ErrorApi | null) ?? 'No fue posible registrar la sesión de edición.',
    );
  }

  return (await respuesta.json()) as { ok: boolean };
}

export async function obtenerSesionesEntrega(
  cursoId: number,
  tareaId: number,
  entregaId: number,
  token: string,
): Promise<SesionEdicionAutor[]> {
  const respuesta = await fetch(
    `${API_URL}/tareas/docente/cursos/${cursoId}/${tareaId}/entregas/${entregaId}/sesiones`,
    {
      method: 'GET',
      headers:
        auth(token),
    },
  );

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new Error(
      mensajeError(cuerpo as ErrorApi | null) ?? 'No fue posible cargar las sesiones de edición.',
    );
  }

  const datos = (await respuesta.json()) as {
    sesiones: SesionEdicionAutor[];
  };

  return datos.sesiones ?? [];
}
