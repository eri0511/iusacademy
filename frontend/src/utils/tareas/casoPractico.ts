import {
  contarPalabras,
  nuevoIdCita,
} from './respuestaEscrita';

import type {
  CitaJuridica,
} from './respuestaEscrita';

export type ParteCaso = {
  id?: number;
  rol: string;
  nombre: string;
  perfil?: string;
};

export type DocumentoCaso = {
  id?: number;
  titulo: string;
  contenido: string;
};

export type PreguntaCaso = {
  id?: number;
  enunciado: string;
  pista?: string;
};

export type ConfiguracionCasoPractico = {
  tituloCaso: string;
  contexto: string;
  partes: ParteCaso[];
  documentos: DocumentoCaso[];
  preguntas: PreguntaCaso[];
  minPalabras: number;
  maxPalabras: number;
  estructuraGuiada: boolean;
  exigirCitas: boolean;
  minCitas: number;
};

export type RespuestaCasoEstado = {
  version: 1;
  formato: 'CASO_PRACTICO';
  contexto: string;
  partes: Array<{
    rol: string;
    nombre: string;
    perfil?: string;
  }>;
  respuestas: Array<{
    id: number;
    enunciado: string;
    respuesta: string;
  }>;
  conclusion: string;
  citas: CitaJuridica[];
};

export type RespuestaCasoItem = RespuestaCasoEstado['respuestas'][number];

export function configCasoInicial():
  ConfiguracionCasoPractico {
  return {
    tituloCaso: '',
    contexto: '',
    partes: [
      {
        id: nuevoIdCita(),
        rol: 'Demandante',
        nombre: '',
        perfil: '',
      },
      {
        id: nuevoIdCita(),
        rol: 'Demandado',
        nombre: '',
        perfil: '',
      },
    ],
    documentos: [],
    preguntas: [
      {
        id: nuevoIdCita(),
        enunciado: '',
        pista: '',
      },
    ],
    minPalabras: 250,
    maxPalabras: 1200,
    estructuraGuiada: true,
    exigirCitas: true,
    minCitas: 2,
  };
}

function leerArreglo<
  T extends object,
>(
  configuracion:
    Record<string, unknown>,
  clave:
    string,
  esValido:
    (
      item:
        unknown,
    ) => boolean,
): Partial<T>[] {
  const valor =
    configuracion[clave];

  if (
    !Array.isArray(
      valor,
    )
  ) {
    return [];
  }

  return valor.filter(
    esValido,
  ) as Partial<T>[];
}

function asignarIds<T extends { id?: number }>(
  items:
    Partial<T>[],
): T[] {
  return items.map(
    (
      item,
      indice,
    ) => ({
      ...(item as T),
      id:
        typeof item.id ===
          'number' &&
        Number.isFinite(
          item.id,
        )
          ? item.id
          : indice +
              1,
    }),
  );
}

export function leerConfiguracionCaso(
  configuracion:
    Record<
      string,
      unknown
    > | null,
): ConfiguracionCasoPractico | null {
  const objeto =
    configuracion?.[
      'casoPractico'
    ];

  if (
    !objeto ||
    typeof objeto !==
      'object' ||
    Array.isArray(
      objeto,
    )
  ) {
    return null;
  }

  const dato =
    objeto as Record<string, unknown>;

  const numero =
    (
      clave:
        string,
      predeterminado:
        number,
    ) =>
      typeof dato[
        clave
      ] ===
          'number' &&
        Number.isFinite(
          dato[
            clave
          ],
        )
        ? Math.floor(
            dato[
              clave
            ] as number,
          )
        : predeterminado;

  const texto =
    (
      clave:
        string,
    ) =>
      typeof dato[
        clave
      ] ===
        'string'
        ? (
            dato[
              clave
            ] as string
          ).trim()
        : '';

  const minPalabras =
    numero(
      'minPalabras',
      250,
    );

  const maxPalabras =
    numero(
      'maxPalabras',
      1200,
    );

  const partes =
    asignarIds<ParteCaso>(
      leerArreglo<ParteCaso>(
        dato,
        'partes',
        (
          item,
        ) =>
          Boolean(
            item &&
              typeof item ===
                'object',
          ),
      ).map(
        (
          parte,
        ) => ({
          rol:
            typeof parte.rol ===
              'string'
              ? parte.rol
              : '',
          nombre:
            typeof parte.nombre ===
              'string'
              ? parte.nombre
              : '',
          perfil:
            typeof parte.perfil ===
              'string'
              ? parte.perfil
              : '',
        }),
      ),
    );

  const documentos =
    asignarIds<DocumentoCaso>(
      leerArreglo<DocumentoCaso>(
        dato,
        'documentos',
        (
          item,
        ) =>
          Boolean(
            item &&
              typeof item ===
                'object',
          ),
      ).map(
        (
          documento,
        ) => ({
          titulo:
            typeof documento.titulo ===
              'string'
              ? documento.titulo
              : '',
          contenido:
            typeof documento.contenido ===
              'string'
              ? documento.contenido
              : '',
        }),
      ),
    );

  const preguntas =
    asignarIds<PreguntaCaso>(
      leerArreglo<PreguntaCaso>(
        dato,
        'preguntas',
        (
          item,
        ) =>
          Boolean(
            item &&
              typeof item ===
                'object' &&
              (
                item as Record<string, unknown>
              ).enunciado,
          ),
      ).map(
        (
          pregunta,
        ) => ({
          enunciado:
            typeof pregunta.enunciado ===
              'string'
              ? pregunta.enunciado
              : '',
          pista:
            typeof pregunta.pista ===
              'string'
              ? pregunta.pista
              : '',
        }),
      ),
    );

  return {
    tituloCaso:
      texto(
        'tituloCaso',
      ),
    contexto:
      texto(
        'contexto',
      ),
    partes,
    documentos,
    preguntas,
    minPalabras:
      Math.max(
        1,
        Math.min(
          minPalabras,
          maxPalabras,
        ),
      ),
    maxPalabras:
      Math.max(
        minPalabras,
        maxPalabras,
      ),
    estructuraGuiada:
      typeof dato[
        'estructuraGuiada'
      ] ===
        'boolean'
        ? (
            dato[
              'estructuraGuiada'
            ] as boolean
          )
        : true,
    exigirCitas:
      typeof dato[
        'exigirCitas'
      ] ===
        'boolean'
        ? (
            dato[
              'exigirCitas'
            ] as boolean
          )
        : false,
    minCitas:
      numero(
        'minCitas',
        1,
      ),
  };
}

export function nuevaRespuestaCaso(
  config:
    ConfiguracionCasoPractico,
): RespuestaCasoEstado {
  return {
    version:
      1,
    formato:
      'CASO_PRACTICO',
    contexto:
      config.contexto,
    partes:
      config.partes.map(
        (
          parte,
        ) => ({
          rol:
            parte.rol,
          nombre:
            parte.nombre,
          perfil:
            parte.perfil,
        }),
      ),
    respuestas:
      config.preguntas.map(
        (
          pregunta,
        ) => ({
          id:
            pregunta.id ??
            0,
          enunciado:
            pregunta.enunciado,
          respuesta:
            '',
        }),
      ),
    conclusion:
      '',
    citas: [],
  };
}

export function serializarRespuestaCaso(
  estado:
    RespuestaCasoEstado,
): string {
  return JSON.stringify(
    estado,
  );
}

export function parsearRespuestaCaso(
  texto?:
    string | null,
): RespuestaCasoEstado | null {
  if (
    !texto
  ) {
    return null;
  }

  try {
    const analizado =
      JSON.parse(
        texto,
      ) as Partial<RespuestaCasoEstado>;

    if (
      analizado?.formato !==
        'CASO_PRACTICO' ||
      analizado.version !==
        1
    ) {
      return null;
    }

    const respuestas =
      Array.isArray(
        analizado.respuestas,
      )
        ? analizado.respuestas
            .filter(
              (
                respuesta,
              ) =>
                respuesta &&
                typeof respuesta.id ===
                  'number',
            )
            .map(
              (
                respuesta,
              ) => ({
                id:
                  respuesta.id,
                enunciado:
                  respuesta.enunciado ??
                  '',
                respuesta:
                  typeof respuesta.respuesta ===
                    'string'
                    ? respuesta.respuesta
                    : '',
              }),
            )
        : [];

    const citas = Array.isArray(
      analizado.citas,
    )
      ? analizado.citas
          .filter(
            (
              cita,
            ) =>
              cita &&
              typeof cita.referencia ===
                'string',
          )
          .map(
            (
              cita,
              indice,
            ) => {
              const tipo:
                CitaJuridica['tipo'] =
                cita.tipo ===
                    'JURISPRUDENCIA' ||
                  cita.tipo ===
                    'DOCTRINA'
                  ? cita.tipo
                  : 'NORMA';

              return {
                id:
                  typeof cita.id ===
                    'number'
                    ? cita.id
                    : indice +
                        1,
                tipo,
                referencia:
                  cita.referencia ??
                  '',
                fundamento:
                  cita.fundamento ??
                  '',
              };
            },
          )
      : [];

    return {
      version:
        1,
      formato:
        'CASO_PRACTICO',
      contexto:
        analizado.contexto ??
        '',
      partes:
        Array.isArray(
          analizado.partes,
        )
          ? analizado.partes.map(
              (
                parte,
              ) => ({
                rol:
                  parte.rol ??
                  '',
                nombre:
                  parte.nombre ??
                  '',
                perfil:
                  parte.perfil,
              }),
            )
          : [],
      respuestas,
      conclusion:
        analizado.conclusion ??
        '',
      citas,
    };
  } catch {
    return null;
  }
}

export function totalPalabrasCaso(
  estado:
    RespuestaCasoEstado,
): number {
  const deRespuestas =
    estado.respuestas.reduce(
      (
        suma,
        item,
      ) =>
        suma +
        contarPalabras(
          item.respuesta,
        ),
      0,
    );

  return (
    deRespuestas +
    contarPalabras(
      estado.conclusion,
    )
  );
}

export function palabrasPorPregunta(
  estado:
    RespuestaCasoEstado,
): Record<
  number,
  number
> {
  const resultado:
    Record<
      number,
      number
    > =
      {};

  estado.respuestas.forEach(
    (
      item,
    ) => {
      resultado[
        item.id
      ] =
        contarPalabras(
          item.respuesta,
        );
    },
  );

  return resultado;
}

export function compilarRespuestaCaso(
  estado:
    RespuestaCasoEstado,
): string {
  const bloques:
    string[] =
    [];

  if (
    estado.contexto.trim()
  ) {
    bloques.push(
      `Planteamiento del caso\n${estado.contexto.trim()}`,
    );
  }

  estado.respuestas.forEach(
    (
      item,
    ) => {
      if (
        item.respuesta.trim()
      ) {
        bloques.push(
          `${item.enunciado || 'Pregunta'}\n${item.respuesta.trim()}`,
        );
      }
    },
  );

  if (
    estado.conclusion.trim()
  ) {
    bloques.push(
      `Conclusión fundamentada\n${estado.conclusion.trim()}`,
    );
  }

  if (
    estado.citas.length >
    0
  ) {
    const citas =
      estado.citas.map(
        (
          cita,
        ) =>
          `• ${cita.referencia}${cita.fundamento.trim() ? `\n   ${cita.fundamento.trim()}` : ''}`,
      );

    bloques.push(
      `Fuentes citadas\n${citas.join('\n')}`,
    );
  }

  return bloques.join(
    '\n\n',
  );
}