import type {
  ActualizarConjuntoGrupoDatos,
  ActualizarGrupoCursoDatos,
  AsignarEstudiantesGrupoDatos,
  CambiarRepresentanteGrupoDatos,
  ConjuntoGrupoResumen,
  CrearConjuntoGrupoDatos,
  CrearGrupoCursoDatos,
  HistorialGrupoCurso,
  ImportarConjuntoGrupoDatos,
  MoverEstudianteGrupoDatos,
  PrevisualizarDistribucionDatos,
  RespuestaAccionGrupo,
  RespuestaDetalleConjunto,
  RespuestaErrorApi,
  RespuestaPrevisualizacionGrupos,
  ValidacionesCreacionGrupos,
} from '../../types/grupos/grupos.types';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:4001';

type OpcionesPeticion = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token: string;
  body?: unknown;
};

function obtenerMensajeError(
  datos: RespuestaErrorApi | null,
): string {
  if (!datos) {
    return 'No fue posible completar la solicitud';
  }

  if (Array.isArray(datos.message)) {
    return datos.message.join(', ');
  }

  return (
    datos.message ??
    datos.mensaje ??
    datos.error ??
    'No fue posible completar la solicitud'
  );
}

async function peticionApi<T>(
  ruta: string,
  opciones: OpcionesPeticion,
): Promise<T> {
  const respuesta =
    await fetch(
      `${API_URL}${ruta}`,
      {
        method:
          opciones.method ??
          'GET',

        headers: {
          Authorization:
            `Bearer ${opciones.token}`,

          ...(opciones.body !==
          undefined
            ? {
                'Content-Type':
                  'application/json',
              }
            : {}),
        },

        ...(opciones.body !==
        undefined
          ? {
              body:
                JSON.stringify(
                  opciones.body,
                ),
            }
          : {}),
      },
    );

  if (!respuesta.ok) {
    let datos:
      RespuestaErrorApi | null;

    try {
      datos =
        await respuesta.json() as
          RespuestaErrorApi;
    } catch {
      datos =
        null;
    }

    throw new Error(
      obtenerMensajeError(
        datos,
      ),
    );
  }

  if (
    respuesta.status ===
    204
  ) {
    return undefined as T;
  }

  return respuesta.json() as
    Promise<T>;
}

export function obtenerValidacionesCreacionGrupos(
  cursoId: number,
  token: string,
): Promise<ValidacionesCreacionGrupos> {
  return peticionApi<ValidacionesCreacionGrupos>(
    `/docente/cursos/${cursoId}/grupos/validaciones`,
    {
      token,
    },
  );
}

export function previsualizarDistribucionGrupos(
  cursoId: number,
  datos: PrevisualizarDistribucionDatos,
  token: string,
): Promise<RespuestaPrevisualizacionGrupos> {
  return peticionApi<RespuestaPrevisualizacionGrupos>(
    `/docente/cursos/${cursoId}/grupos/previsualizar`,
    {
      method:
        'POST',
      token,
      body:
        datos,
    },
  );
}

export function obtenerConjuntosGrupos(
  cursoId: number,
  token: string,
  hitoId?: number,
): Promise<ConjuntoGrupoResumen[]> {
  const consulta =
    hitoId
      ? `?hitoId=${hitoId}`
      : '';

  return peticionApi<ConjuntoGrupoResumen[]>(
    `/docente/cursos/${cursoId}/grupos${consulta}`,
    {
      token,
    },
  );
}

export function obtenerDetalleConjuntoGrupo(
  cursoId: number,
  conjuntoId: number,
  token: string,
): Promise<RespuestaDetalleConjunto> {
  return peticionApi<RespuestaDetalleConjunto>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}`,
    {
      token,
    },
  );
}

export function crearConjuntoGrupo(
  cursoId: number,
  datos: CrearConjuntoGrupoDatos,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos`,
    {
      method:
        'POST',
      token,
      body:
        datos,
    },
  );
}

export function actualizarConjuntoGrupo(
  cursoId: number,
  conjuntoId: number,
  datos: ActualizarConjuntoGrupoDatos,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}`,
    {
      method:
        'PUT',
      token,
      body:
        datos,
    },
  );
}

export function cambiarBloqueoConjuntoGrupo(
  cursoId: number,
  conjuntoId: number,
  estaBloqueado: boolean,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}/bloqueo`,
    {
      method:
        'PATCH',
      token,
      body: {
        estaBloqueado,
      },
    },
  );
}

export function eliminarConjuntoGrupo(
  cursoId: number,
  conjuntoId: number,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}`,
    {
      method:
        'DELETE',
      token,
    },
  );
}

export function importarConjuntoGrupo(
  cursoId: number,
  datos: ImportarConjuntoGrupoDatos,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/importar`,
    {
      method:
        'POST',
      token,
      body:
        datos,
    },
  );
}

export function obtenerHistorialConjuntoGrupo(
  cursoId: number,
  conjuntoId: number,
  token: string,
): Promise<HistorialGrupoCurso[]> {
  return peticionApi<HistorialGrupoCurso[]>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}/historial`,
    {
      token,
    },
  );
}

export function crearGrupoCurso(
  cursoId: number,
  conjuntoId: number,
  datos: CrearGrupoCursoDatos,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}/grupos`,
    {
      method:
        'POST',
      token,
      body:
        datos,
    },
  );
}

export function actualizarGrupoCurso(
  cursoId: number,
  conjuntoId: number,
  grupoId: number,
  datos: ActualizarGrupoCursoDatos,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}/grupos/${grupoId}`,
    {
      method:
        'PUT',
      token,
      body:
        datos,
    },
  );
}

export function eliminarGrupoCurso(
  cursoId: number,
  conjuntoId: number,
  grupoId: number,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}/grupos/${grupoId}`,
    {
      method:
        'DELETE',
      token,
    },
  );
}

export function asignarEstudiantesGrupo(
  cursoId: number,
  conjuntoId: number,
  grupoId: number,
  datos: AsignarEstudiantesGrupoDatos,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}/grupos/${grupoId}/estudiantes`,
    {
      method:
        'POST',
      token,
      body:
        datos,
    },
  );
}

export function moverEstudianteGrupo(
  cursoId: number,
  conjuntoId: number,
  grupoOrigenId: number,
  datos: MoverEstudianteGrupoDatos,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}/grupos/${grupoOrigenId}/mover`,
    {
      method:
        'PATCH',
      token,
      body:
        datos,
    },
  );
}

export function cambiarRepresentanteGrupo(
  cursoId: number,
  conjuntoId: number,
  grupoId: number,
  datos: CambiarRepresentanteGrupoDatos,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}/grupos/${grupoId}/representante`,
    {
      method:
        'PATCH',
      token,
      body:
        datos,
    },
  );
}

export function retirarEstudianteGrupo(
  cursoId: number,
  conjuntoId: number,
  grupoId: number,
  estudianteId: number,
  token: string,
): Promise<RespuestaAccionGrupo> {
  return peticionApi<RespuestaAccionGrupo>(
    `/docente/cursos/${cursoId}/grupos/${conjuntoId}/grupos/${grupoId}/estudiantes/${estudianteId}`,
    {
      method:
        'DELETE',
      token,
    },
  );
}
