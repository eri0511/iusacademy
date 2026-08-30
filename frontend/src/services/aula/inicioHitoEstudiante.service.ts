import type {
  InicioHitoEstudianteRespuesta,
} from '../../types/aula/inicioHitoEstudiante.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

export async function obtenerInicioHitoEstudiante(
  cursoId: number,
  hitoId: number,
  token: string,
): Promise<InicioHitoEstudianteRespuesta> {
  const respuesta =
    await fetch(
      `${API_URL}/aula/cursos/${cursoId}/hitos/${hitoId}/inicio-estudiante`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

  if (!respuesta.ok) {
    const cuerpo =
      await respuesta.json().catch(
        () => null,
      );

    const mensaje =
      Array.isArray(cuerpo?.message)
        ? cuerpo.message.join(', ')
        : cuerpo?.message ??
          'No fue posible cargar el inicio del hito';

    throw new Error(mensaje);
  }

  return respuesta.json();
}
