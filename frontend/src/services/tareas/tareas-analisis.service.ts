export type EvidenciaAnalisisEntrega = {
  indice_fragmento?: number;
  texto_fragmento?: string;
  seccion?: string;
  peso_seccion?: number;
  fuente_id_externo?: string;
  fuente_tipo?: string;
  fuente_titulo?: string;
  fuente_autorizada?: boolean;
  texto_coincidente?: string;
  similitud_semantica?: number;
  similitud_lexica?: number;
  similitud_combinada?: number;
  [clave: string]: unknown;
};

export type ResultadoAnalisisEntrega = {
  documento_id_externo?: string;
  total_fragmentos?: number;
  total_fuentes_evaluadas?: number;
  total_evidencias?: number;
  similitud_maxima?: number;
  similitud_promedio?: number;
  evidencias?: EvidenciaAnalisisEntrega[];
  [clave: string]: unknown;
};

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

async function leerCuerpo(
  respuesta: Response,
): Promise<unknown> {
  const tipoContenido =
    respuesta.headers.get(
      'content-type',
    );

  if (
    tipoContenido?.includes(
      'application/json',
    )
  ) {
    return respuesta
      .json()
      .catch(() => null);
  }

  const texto =
    await respuesta.text();

  return texto || null;
}

function obtenerMensajeError(
  cuerpo: unknown,
  predeterminado: string,
) {
  if (
    cuerpo &&
    typeof cuerpo === 'object'
  ) {
    const valor =
      cuerpo as {
        message?: string | string[];
        mensaje?: string;
        error?: string;
      };

    if (
      Array.isArray(
        valor.message,
      )
    ) {
      return valor.message.join(
        '. ',
      );
    }

    return (
      valor.message ||
      valor.mensaje ||
      valor.error ||
      predeterminado
    );
  }

  if (
    typeof cuerpo === 'string' &&
    cuerpo.trim()
  ) {
    return cuerpo.trim();
  }

  return predeterminado;
}

export async function analizarEntregaTarea(
  accessToken: string,
  cursoId: number,
  tareaId: number,
  entregaId: number,
): Promise<ResultadoAnalisisEntrega> {
  const respuesta =
    await fetch(
      `${API_URL}/tareas/docente/cursos/${cursoId}/${tareaId}/entregas/${entregaId}/analisis-ia`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          'Content-Type':
            'application/json',
        },
      },
    );

  const cuerpo =
    await leerCuerpo(
      respuesta,
    );

  if (!respuesta.ok) {
    throw new Error(
      obtenerMensajeError(
        cuerpo,
        'No fue posible ejecutar el análisis de la entrega.',
      ),
    );
  }

  if (
    !cuerpo ||
    typeof cuerpo !== 'object'
  ) {
    throw new Error(
      'El motor de análisis no devolvió una respuesta válida.',
    );
  }

  return cuerpo as ResultadoAnalisisEntrega;
}
