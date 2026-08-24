import type {
  ActualizarRecursoDatos,
  CrearRecursoDatos,
  NuevoArchivoRecurso,
  NuevoEnlaceRecurso,
  ReemplazarContenidoDatos,
  RecursoCurso,
} from '../../types/recursos/recursos.types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ErrorApi = {
  message?: string | string[];
};

async function mensajeError(respuesta: Response, defecto: string) {
  const data = await respuesta.json().catch(() => ({} as ErrorApi));
  const mensaje = (data as ErrorApi).message;

  if (Array.isArray(mensaje)) return mensaje.join('. ');
  if (typeof mensaje === 'string' && mensaje.trim()) return mensaje;
  return defecto;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function json(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function listarRecursos(cursoId: number, token: string): Promise<RecursoCurso[]> {
  const respuesta = await fetch(`${API_URL}/recursos/cursos/${cursoId}`, {
    headers: auth(token),
  });

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, 'No fue posible cargar los recursos.'));
  }

  const data = await respuesta.json();
  return Array.isArray(data?.recursos) ? data.recursos : [];
}

export async function crearRecurso(
  cursoId: number,
  token: string,
  datos: CrearRecursoDatos,
): Promise<RecursoCurso> {
  const respuesta = await fetch(`${API_URL}/recursos/cursos/${cursoId}`, {
    method: 'POST',
    headers: json(token),
    body: JSON.stringify({
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      categoria: datos.categoria,
      alcance: datos.alcance,
      uso: datos.uso,
      hitoId: datos.alcance === 'HITO' ? datos.hitoId : undefined,
      visibleParaEstudiantes: datos.visibleParaEstudiantes,
    }),
  });

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, 'No fue posible crear el recurso.'));
  }

  return (await respuesta.json()).recurso;
}

export async function actualizarRecurso(
  cursoId: number,
  recursoId: number,
  token: string,
  datos: ActualizarRecursoDatos,
): Promise<RecursoCurso> {
  const respuesta = await fetch(`${API_URL}/recursos/cursos/${cursoId}/${recursoId}`, {
    method: 'PATCH',
    headers: json(token),
    body: JSON.stringify({
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      categoria: datos.categoria,
      alcance: datos.alcance,
      uso: datos.uso,
      hitoId: datos.alcance === 'HITO' ? datos.hitoId : undefined,
      visibleParaEstudiantes: datos.visibleParaEstudiantes,
    }),
  });

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, 'No fue posible actualizar el recurso.'));
  }

  return (await respuesta.json()).recurso;
}

export async function agregarArchivoRecurso(
  cursoId: number,
  recursoId: number,
  token: string,
  datos: NuevoArchivoRecurso,
) {
  const body = new FormData();
  body.append('archivo', datos.archivo, datos.archivo.name);
  body.append('titulo', datos.titulo.trim());
  body.append('descripcion', datos.descripcion.trim());
  body.append('disponibleParaQuiz', String(datos.disponibleParaQuiz));

  const respuesta = await fetch(
    `${API_URL}/recursos/cursos/${cursoId}/${recursoId}/contenidos/archivo`,
    { method: 'POST', headers: auth(token), body },
  );

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, `No fue posible subir ${datos.archivo.name}.`));
  }

  return respuesta.json();
}

export async function agregarEnlaceRecurso(
  cursoId: number,
  recursoId: number,
  token: string,
  datos: NuevoEnlaceRecurso,
) {
  const respuesta = await fetch(
    `${API_URL}/recursos/cursos/${cursoId}/${recursoId}/contenidos/enlace`,
    {
      method: 'POST',
      headers: json(token),
      body: JSON.stringify(datos),
    },
  );

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, `No fue posible agregar el enlace ${datos.titulo}.`));
  }

  return respuesta.json();
}

export async function cambiarVisibilidadRecurso(
  cursoId: number,
  recursoId: number,
  token: string,
  visible: boolean,
) {
  const respuesta = await fetch(
    `${API_URL}/recursos/cursos/${cursoId}/${recursoId}/visibilidad`,
    {
      method: 'PATCH',
      headers: json(token),
      body: JSON.stringify({ visibleParaEstudiantes: visible }),
    },
  );

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, 'No fue posible cambiar la visibilidad.'));
  }

  return (await respuesta.json()).recurso as RecursoCurso;
}

export async function actualizarContenidoRecurso(
  cursoId: number,
  recursoId: number,
  contenidoId: number,
  token: string,
  datos: Record<string, unknown>,
) {
  const respuesta = await fetch(
    `${API_URL}/recursos/cursos/${cursoId}/${recursoId}/contenidos/${contenidoId}`,
    {
      method: 'PATCH',
      headers: json(token),
      body: JSON.stringify(datos),
    },
  );

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, 'No fue posible actualizar el contenido.'));
  }

  return respuesta.json();
}

export async function eliminarContenidoRecurso(
  cursoId: number,
  recursoId: number,
  contenidoId: number,
  token: string,
) {
  const respuesta = await fetch(
    `${API_URL}/recursos/cursos/${cursoId}/${recursoId}/contenidos/${contenidoId}`,
    { method: 'DELETE', headers: auth(token) },
  );

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, 'No fue posible retirar el contenido.'));
  }
}

export async function reemplazarContenidoRecurso(
  cursoId: number,
  recursoId: number,
  contenidoId: number,
  token: string,
  datos: ReemplazarContenidoDatos,
) {
  const body = new FormData();
  body.append('archivo', datos.archivo, datos.archivo.name);
  if (datos.motivoActualizacion.trim()) {
    body.append('motivoActualizacion', datos.motivoActualizacion.trim());
  }
  if (datos.fechaDocumento) {
    body.append('fechaDocumento', datos.fechaDocumento);
  }

  const respuesta = await fetch(
    `${API_URL}/recursos/cursos/${cursoId}/${recursoId}/contenidos/${contenidoId}/reemplazar`,
    { method: 'POST', headers: auth(token), body },
  );

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, 'No fue posible crear la nueva versión.'));
  }

  return respuesta.json();
}

export async function archivarRecurso(cursoId: number, recursoId: number, token: string) {
  const respuesta = await fetch(`${API_URL}/recursos/cursos/${cursoId}/${recursoId}`, {
    method: 'DELETE',
    headers: auth(token),
  });

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, 'No fue posible archivar el recurso.'));
  }
}

export async function obtenerArchivoBlob(archivoId: number, token: string) {
  const respuesta = await fetch(`${API_URL}/archivos/${archivoId}/descargar`, {
    headers: auth(token),
  });

  if (!respuesta.ok) {
    throw new Error(await mensajeError(respuesta, 'No fue posible abrir el archivo.'));
  }

  return respuesta.blob();
}

export async function abrirArchivo(archivoId: number, token: string) {
  const ventana = window.open('', '_blank');
  const blob = await obtenerArchivoBlob(archivoId, token);
  const url = URL.createObjectURL(blob);

  if (ventana) {
    ventana.opener = null;
    ventana.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function descargarArchivo(
  archivoId: number,
  nombre: string,
  token: string,
) {
  const blob = await obtenerArchivoBlob(archivoId, token);
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export function abrirEnlaceExterno(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
