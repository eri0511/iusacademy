import type {
  LibroCalificacionesDocente,
  MisCalificacionesRespuesta,
} from '../../types/calificaciones/calificaciones.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

export type FormatoReporteCalificaciones =
  | 'PDF'
  | 'EXCEL'
  | 'CSV';

type ErrorApi = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};

function auth(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function leerError(
  respuesta: Response,
  defecto: string,
) {
  const data =
    await respuesta
      .json()
      .catch(() => ({} as ErrorApi));

  const error = data as ErrorApi;

  if (Array.isArray(error.message)) {
    return error.message.join('. ');
  }

  if (
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    typeof error.mensaje === 'string' &&
    error.mensaje.trim()
  ) {
    return error.mensaje;
  }

  return defecto;
}

export async function obtenerLibroCalificacionesDocente(
  cursoId: number,
  hitoId: number,
  token: string,
): Promise<LibroCalificacionesDocente> {
  const respuesta = await fetch(
    `${API_URL}/calificaciones/cursos/${cursoId}/libro?hitoId=${hitoId}`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar el libro de calificaciones.',
      ),
    );
  }

  return respuesta.json();
}

export async function obtenerMisCalificaciones(
  cursoId: number,
  hitoId: number,
  token: string,
): Promise<MisCalificacionesRespuesta> {
  const respuesta = await fetch(
    `${API_URL}/calificaciones/estudiante/cursos/${cursoId}?hitoId=${hitoId}`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        'No fue posible cargar tus calificaciones.',
      ),
    );
  }

  return respuesta.json();
}

export async function descargarLibroCalificaciones(
  cursoId: number,
  hitoId: number,
  formato: FormatoReporteCalificaciones,
  token: string,
) {
  const respuesta = await fetch(
    `${API_URL}/calificaciones/cursos/${cursoId}/libro/exportar/${formato}?hitoId=${hitoId}`,
    {
      headers: auth(token),
    },
  );

  if (!respuesta.ok) {
    throw new Error(
      await leerError(
        respuesta,
        `No fue posible generar el reporte ${formato}.`,
      ),
    );
  }

  const archivo = await respuesta.blob();
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');

  const disposition =
    respuesta.headers.get('content-disposition') ?? '';
  const coincidencia =
    disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);

  const extension =
    formato === 'PDF'
      ? 'pdf'
      : formato === 'EXCEL'
        ? 'xlsx'
        : 'csv';

  enlace.href = url;
  enlace.download = coincidencia?.[1]
    ? decodeURIComponent(coincidencia[1].replace(/\"/g, ''))
    : `libro-calificaciones-hito-${hitoId}-iusacademy.${extension}`;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
