const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

async function subir(
  ruta: string,
  archivo: File,
  token: string,
) {
  const datos = new FormData();
  datos.append('archivo', archivo);

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: datos,
  });

  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      typeof cuerpo?.message === 'string'
        ? cuerpo.message
        : 'No fue posible subir el archivo.',
    );
  }

  return cuerpo;
}

export function subirArchivoConsigna(
  cursoId: number,
  tareaId: number,
  archivo: File,
  token: string,
) {
  return subir(
    `/archivos/tareas/cursos/${cursoId}/${tareaId}`,
    archivo,
    token,
  );
}

export async function eliminarArchivoConsigna(
  archivoId: number,
  token: string,
) {
  const respuesta = await fetch(`${API_URL}/archivos/${archivoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    throw new Error(
      typeof cuerpo?.message === 'string'
        ? cuerpo.message
        : 'No fue posible eliminar el archivo.',
    );
  }
}
