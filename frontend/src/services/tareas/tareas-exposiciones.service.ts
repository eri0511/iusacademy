import type {
  AnalisisExposicion,
  ConfigurarJornadaExposicionDatos,
  EstadoPreguntaExposicion,
  PreguntaExposicion,
  SalaExposicionDocente,
  SalaExposicionEstudiante,
} from '../../types/tareas/exposiciones.types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ErrorApi = {
  message?: string | string[];
  mensaje?: string;
  error?: string;
};

async function leerJson(respuesta: Response) {
  return respuesta.json().catch(() => null);
}

function mensajeError(cuerpo: unknown, fallback: string) {
  if (!cuerpo || typeof cuerpo !== 'object') return fallback;
  const datos = cuerpo as ErrorApi;
  if (Array.isArray(datos.message)) return datos.message.join('. ');
  return datos.message || datos.mensaje || datos.error || fallback;
}

async function solicitud<T>(
  ruta: string,
  accessToken: string,
  opciones: RequestInit = {},
): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      ...(opciones.headers ?? {}),
    },
  });

  const cuerpo = await leerJson(respuesta);
  if (!respuesta.ok) {
    throw new Error(mensajeError(cuerpo, 'No fue posible completar la operación.'));
  }

  return cuerpo as T;
}

export function obtenerSalaExposicionDocente(
  accessToken: string,
  cursoId: number,
  tareaId: number,
) {
  return solicitud<SalaExposicionDocente | null>(
    `/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/sala`,
    accessToken,
  );
}

export function obtenerSalaExposicionEstudiante(
  accessToken: string,
  cursoId: number,
  tareaId: number,
) {
  return solicitud<SalaExposicionEstudiante | null>(
    `/tareas/estudiante/cursos/${cursoId}/${tareaId}/exposicion/sala`,
    accessToken,
  );
}

export function configurarJornadaExposicion(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  datos: ConfigurarJornadaExposicionDatos,
) {
  return solicitud<SalaExposicionDocente>(
    `/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas`,
    accessToken,
    { method: 'POST', body: JSON.stringify(datos) },
  );
}

export function reordenarTurnosExposicion(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  jornadaId: number,
  entregaIds: number[],
) {
  return solicitud<SalaExposicionDocente>(
    `/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/orden`,
    accessToken,
    { method: 'PATCH', body: JSON.stringify({ entregaIds }) },
  );
}

export function iniciarJornadaExposicion(accessToken: string, cursoId: number, tareaId: number, jornadaId: number) {
  return solicitud<SalaExposicionDocente>(`/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/iniciar`, accessToken, { method: 'PATCH' });
}

export function finalizarJornadaExposicion(accessToken: string, cursoId: number, tareaId: number, jornadaId: number) {
  return solicitud<SalaExposicionDocente>(`/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/finalizar`, accessToken, { method: 'PATCH' });
}

export function iniciarTurnoExposicion(accessToken: string, cursoId: number, tareaId: number, jornadaId: number, turnoId: number) {
  return solicitud<SalaExposicionDocente>(`/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/turnos/${turnoId}/iniciar`, accessToken, { method: 'PATCH' });
}

export function pausarTurnoExposicion(accessToken: string, cursoId: number, tareaId: number, jornadaId: number, turnoId: number) {
  return solicitud<SalaExposicionDocente>(`/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/turnos/${turnoId}/pausar`, accessToken, { method: 'PATCH' });
}

export function reanudarTurnoExposicion(accessToken: string, cursoId: number, tareaId: number, jornadaId: number, turnoId: number) {
  return solicitud<SalaExposicionDocente>(`/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/turnos/${turnoId}/reanudar`, accessToken, { method: 'PATCH' });
}

export function finalizarTurnoExposicion(accessToken: string, cursoId: number, tareaId: number, jornadaId: number, turnoId: number) {
  return solicitud<SalaExposicionDocente>(`/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/turnos/${turnoId}/finalizar`, accessToken, { method: 'PATCH' });
}

export function actualizarDiapositivaExposicion(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  jornadaId: number,
  turnoId: number,
  diapositiva: number,
) {
  return solicitud<{ id: number; diapositivaActual: number; actualizadoEn: string }>(
    `/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/turnos/${turnoId}/diapositiva`,
    accessToken,
    { method: 'PATCH', body: JSON.stringify({ diapositiva }) },
  );
}

export function tomarControlPresentacionEstudiante(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  jornadaId: number,
  turnoId: number,
) {
  return solicitud<{
    id: number;
    presentadorId: number;
    diapositivaActual: number;
    actualizadoEn: string;
  }>(
    `/tareas/estudiante/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/turnos/${turnoId}/presentar`,
    accessToken,
    { method: 'PATCH' },
  );
}

export function actualizarDiapositivaExposicionEstudiante(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  jornadaId: number,
  turnoId: number,
  diapositiva: number,
) {
  return solicitud<{
    id: number;
    presentadorId: number | null;
    diapositivaActual: number;
    actualizadoEn: string;
  }>(
    `/tareas/estudiante/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/turnos/${turnoId}/diapositiva`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ diapositiva }),
    },
  );
}

export function crearPreguntaExposicion(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  turnoId: number,
  contenido: string,
) {
  return solicitud<PreguntaExposicion>(
    `/tareas/estudiante/cursos/${cursoId}/${tareaId}/exposicion/turnos/${turnoId}/preguntas`,
    accessToken,
    { method: 'POST', body: JSON.stringify({ contenido }) },
  );
}

export function votarPreguntaExposicion(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  preguntaId: number,
) {
  return solicitud<{ votada: boolean }>(
    `/tareas/estudiante/cursos/${cursoId}/${tareaId}/exposicion/preguntas/${preguntaId}/voto`,
    accessToken,
    { method: 'POST' },
  );
}

export function quitarVotoPreguntaExposicion(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  preguntaId: number,
) {
  return solicitud<{ votada: boolean }>(
    `/tareas/estudiante/cursos/${cursoId}/${tareaId}/exposicion/preguntas/${preguntaId}/voto`,
    accessToken,
    { method: 'DELETE' },
  );
}

export function actualizarPreguntaExposicion(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  preguntaId: number,
  datos: { estado?: EstadoPreguntaExposicion; destacada?: boolean },
) {
  return solicitud<PreguntaExposicion>(
    `/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/preguntas/${preguntaId}`,
    accessToken,
    { method: 'PATCH', body: JSON.stringify(datos) },
  );
}

export async function obtenerArchivoExposicionBlob(
  accessToken: string,
  archivoId: number,
) {
  const respuesta = await fetch(`${API_URL}/archivos/${archivoId}/descargar`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!respuesta.ok) {
    const cuerpo = await leerJson(respuesta);
    throw new Error(mensajeError(cuerpo, 'No se pudo cargar la presentación.'));
  }

  return respuesta.blob();
}


export function obtenerAnalisisExposicion(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  jornadaId: number,
  turnoId: number,
) {
  return solicitud<AnalisisExposicion | null>(
    `/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/turnos/${turnoId}/analisis`,
    accessToken,
  );
}

export function generarAnalisisExposicion(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  jornadaId: number,
  turnoId: number,
) {
  return solicitud<AnalisisExposicion>(
    `/tareas/docente/cursos/${cursoId}/${tareaId}/exposicion/jornadas/${jornadaId}/turnos/${turnoId}/analisis`,
    accessToken,
    { method: 'POST' },
  );
}
