import {
  contarPalabras,
  nuevoIdCita,
} from './respuestaEscrita';

import type {
  CitaJuridica,
} from './respuestaEscrita';

export type OrdenTurnosExposicion =
  | 'MANUAL'
  | 'AZAR'
  | 'REGISTRO';

export type CriterioExposicion = {
  id?: number;
  titulo: string;
  descripcion: string;
  peso: number;
};

export type SeccionGuionTipo = {
  id?: number;
  titulo: string;
  consigna: string;
};

export type ConfiguracionExposicion = {
  duracionPorExpositorMin: number;
  pausaEntreTurnosMin: number;
  ordenTurnos: OrdenTurnosExposicion;
  estructuraGuiada: boolean;
  secciones: SeccionGuionTipo[];
  minPalabras: number;
  maxPalabras: number;
  exigirEnlacePresentacion: boolean;
  exigirCitas: boolean;
  minCitas: number;
  criterios: CriterioExposicion[];
};

export type ChecklistExposicionTipo = {
  id: number;
  texto: string;
  cumplido: boolean;
};

export type RespuestaExposicionEstado = {
  version: 1;
  formato: 'EXPOSICION';
  tema: string;
  secciones: Array<{
    id: number;
    titulo: string;
    consigna: string;
    contenido: string;
  }>;
  citas: CitaJuridica[];
  enlacePresentacion: string;
  checklist: ChecklistExposicionTipo[];
  preparacionConfirmada: boolean;
};

export const ORDENES_TURNO:
  Array<{
    valor: OrdenTurnosExposicion;
    texto: string;
    descripcion: string;
  }> = [
    {
      valor: 'REGISTRO',
      texto: 'Por orden de inscripción',
      descripcion: 'Exponen en el orden en que se registren las entregas.',
    },
    {
      valor: 'AZAR',
      texto: 'Sorteo',
      descripcion: 'El docente sorteará el orden el día de la exposición.',
    },
    {
      valor: 'MANUAL',
      texto: 'Orden a definir en aula',
      descripcion: 'El docente define el orden de forma directa.',
    },
  ];

export function ordenTurnoCompleto(
  orden:
    unknown,
): OrdenTurnosExposicion {
  return ORDENES_TURNO.some(
    (
      opcion,
    ) =>
      opcion.valor ===
      orden,
  )
    ? orden as OrdenTurnosExposicion
    : 'MANUAL';
}

export function checklistExposicionInicial():
  ChecklistExposicionTipo[] {
  return [
    {
      id:
        nuevoIdCita(),
      texto:
        'Elaboré el material de apoyo (diapositivas, PDF u otro).',
      cumplido:
        false,
    },
    {
      id:
        nuevoIdCita(),
      texto:
        'Ensayé la exposición en voz alta y cronometré el tiempo.',
      cumplido:
        false,
    },
    {
      id:
        nuevoIdCita(),
      texto:
        'Identifiqué las fuentes y normas que sustentan el tema.',
      cumplido:
        false,
    },
    {
      id:
        nuevoIdCita(),
      texto:
        'Preparé al menos una respuesta posible para las preguntas del auditorio.',
      cumplido:
        false,
    },
  ];
}

export function criteriosExposicionInicial():
  CriterioExposicion[] {
  return [
    {
      id: 1,
      titulo:
        'Dominio del tema',
      descripcion:
        'Precisión, profundidad y seguridad al exponer.',
      peso: 30,
    },
    {
      id: 2,
      titulo:
        'Estructura y organización',
      descripcion:
        'Introducción, desarrollo y conclusión claramente identificables.',
      peso: 20,
    },
    {
      id: 3,
      titulo:
        'Material de apoyo',
      descripcion:
        'Calidad, pertinencia y resolución del material presentado.',
      peso: 15,
    },
    {
      id: 4,
      titulo:
        'Manejo del tiempo',
      descripcion:
        'Ajuste a la duración prevista y ritmo adecuado.',
      peso: 15,
    },
    {
      id: 5,
      titulo:
        'Comunicación y preguntas',
      descripcion:
        'Claridad verbal, contacto con el auditorio y respuestas.',
      peso: 20,
    },
  ];
}

export function seccionesGuionInicial():
  SeccionGuionTipo[] {
  return [
    {
      id: 1,
      titulo:
        'Introducción y objetivo',
      consigna:
        'Presenta el tema, la tesis o el objetivo de la exposición.',
    },
    {
      id: 2,
      titulo:
        'Desarrollo',
      consigna:
        'Desarrolla los contenidos, ejemplos y casos principales.',
    },
    {
      id: 3,
      titulo:
        'Conclusión',
      consigna:
        'Cierra con las ideas centrales y una postura fundamentada.',
    },
    {
      id: 4,
      titulo:
        'Preguntas y debate',
      consigna:
        'Anticipa las posibles preguntas del auditorio y sus respuestas.',
    },
  ];
}

export function configExposicionInicial():
  ConfiguracionExposicion {
  return {
    duracionPorExpositorMin:
      10,
    pausaEntreTurnosMin:
      2,
    ordenTurnos:
      'REGISTRO',
    estructuraGuiada:
      false,
    secciones:
      seccionesGuionInicial(),
    minPalabras:
      200,
    maxPalabras:
      900,
    exigirEnlacePresentacion:
      true,
    exigirCitas:
      true,
    minCitas:
      2,
    criterios:
      criteriosExposicionInicial(),
  };
}

export function leerConfiguracionExposicion(
  configuracion:
    Record<
      string,
      unknown
    > | null,
): ConfiguracionExposicion | null {
  const objeto =
    configuracion?.[
      'exposicion'
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

  const secciones =
    Array.isArray(
      dato[
        'secciones'
      ],
    )
      ? (
        dato['secciones'] as Array<Record<string, unknown>>
      )
          .filter(
            (
              seccion,
            ) =>
              seccion &&
              typeof seccion ===
                'object' &&
              (
                seccion['titulo'] ??
                ''
              ),
          )
          .map(
            (
              seccion,
              indice,
            ) => ({
              id:
                typeof seccion[
                  'id'
                ] ===
                  'number'
                  ? seccion[
                      'id'
                    ]
                  : indice +
                      1,
              titulo:
                typeof seccion[
                  'titulo'
                ] ===
                  'string'
                  ? seccion[
                      'titulo'
                    ]
                  : '',
              consigna:
                typeof seccion[
                  'consigna'
                ] ===
                  'string'
                  ? seccion[
                      'consigna'
                    ]
                  : '',
            }),
          )
      : [];

  const criterios =
    Array.isArray(
      dato[
        'criterios'
      ],
    )
      ? (
        dato['criterios'] as Array<Record<string, unknown>>
      )
          .filter(
            (
              criterio,
            ) =>
              criterio &&
              typeof criterio ===
                'object' &&
              (
                criterio['titulo'] ??
                ''
              ),
          )
          .map(
            (
              criterio,
              indice,
            ) => ({
              id:
                typeof criterio[
                  'id'
                ] ===
                  'number'
                  ? criterio[
                      'id'
                    ]
                  : indice +
                      1,
              titulo:
                typeof criterio[
                  'titulo'
                ] ===
                  'string'
                  ? criterio[
                      'titulo'
                    ]
                  : '',
              descripcion:
                typeof criterio[
                  'descripcion'
                ] ===
                  'string'
                  ? criterio[
                      'descripcion'
                    ]
                  : '',
              peso:
                numeroPeso(
                  criterio[
                    'peso'
                  ],
                ),
            }),
          )
      : [];

  const minPalabras =
    numero(
      'minPalabras',
      200,
    );

  const maxPalabras =
    numero(
      'maxPalabras',
      900,
    );

  return {
    duracionPorExpositorMin:
      Math.max(
        1,
        numero(
          'duracionPorExpositorMin',
          10,
        ),
      ),
    pausaEntreTurnosMin:
      Math.max(
        0,
        numero(
          'pausaEntreTurnosMin',
          2,
        ),
      ),
    ordenTurnos:
      ordenTurnoCompleto(
        dato[
          'ordenTurnos'
        ],
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
        : false,
    secciones:
      secciones.length >
        0
        ? secciones
        : seccionesGuionInicial(),
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
    exigirEnlacePresentacion:
      typeof dato[
        'exigirEnlacePresentacion'
      ] ===
        'boolean'
        ? (
            dato[
              'exigirEnlacePresentacion'
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
      Math.max(
        1,
        numero(
          'minCitas',
          1,
        ),
      ),
    criterios:
      criterios.length >
        0
        ? criterios
        : criteriosExposicionInicial(),
  };
}

function numeroPeso(
  valor:
    unknown,
): number {
  if (
    typeof valor !==
      'number' ||
    !Number.isFinite(
      valor,
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      valor,
    ),
  );
}

export function nuevaRespuestaExposicion(
  config:
    ConfiguracionExposicion,
): RespuestaExposicionEstado {
  return {
    version:
      1,
    formato:
      'EXPOSICION',
    tema:
      '',
    secciones:
      config.secciones.map(
        (
          seccion,
        ) => ({
          id:
            seccion.id ??
            0,
          titulo:
            seccion.titulo,
          consigna:
            seccion.consigna,
          contenido:
            '',
        }),
      ),
    citas: [],
    enlacePresentacion:
      '',
    checklist:
      checklistExposicionInicial(),
    preparacionConfirmada:
      false,
  };
}

export function serializarRespuestaExposicion(
  estado:
    RespuestaExposicionEstado,
): string {
  return JSON.stringify(
    estado,
  );
}

export function parsearRespuestaExposicion(
  texto?:
    string | null,
): RespuestaExposicionEstado | null {
  if (
    !texto
  ) {
    return null;
  }

  try {
    const analizado =
      JSON.parse(
        texto,
      ) as Partial<RespuestaExposicionEstado>;

    if (
      analizado?.formato !==
        'EXPOSICION' ||
      analizado.version !==
        1
    ) {
      return null;
    }

    const secciones =
      Array.isArray(
        analizado.secciones,
      )
        ? analizado.secciones
            .filter(
              (
                seccion,
              ) =>
                seccion &&
                typeof seccion ===
                  'object',
            )
            .map(
              (
                seccion,
                indice,
              ) => ({
                id:
                  typeof seccion.id ===
                    'number'
                    ? seccion.id
                    : indice +
                        1,
                titulo:
                  seccion.titulo ??
                  '',
                consigna:
                  seccion.consigna ??
                  '',
                contenido:
                  typeof seccion.contenido ===
                    'string'
                    ? seccion.contenido
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

    const checklist =
      Array.isArray(
        analizado.checklist,
      )
        ? analizado.checklist
            .filter(
              (
                item,
              ) =>
                item &&
                typeof item ===
                  'object',
            )
            .map(
              (
                item,
                indice,
              ) => ({
                id:
                  typeof item.id ===
                    'number'
                    ? item.id
                    : indice +
                        1,
                texto:
                  typeof item.texto ===
                    'string'
                    ? item.texto
                    : '',
                cumplido:
                  Boolean(
                    item.cumplido,
                  ),
              }),
            )
        : [];

    return {
      version:
        1,
      formato:
        'EXPOSICION',
      tema:
        analizado.tema ??
        '',
      secciones,
      citas,
      enlacePresentacion:
        analizado.enlacePresentacion ??
        '',
      checklist:
        checklist.length >
          0
          ? checklist
          : checklistExposicionInicial(),
      preparacionConfirmada:
        Boolean(
          analizado.preparacionConfirmada,
        ),
    };
  } catch {
    return null;
  }
}

export function totalPalabrasExposicion(
  estado:
    RespuestaExposicionEstado,
): number {
  return estado.secciones.reduce(
    (
      suma,
      seccion,
    ) =>
      suma +
      contarPalabras(
        seccion.contenido,
      ),
    0,
  );
}

export function palabrasPorSeccionExposicion(
  estado:
    RespuestaExposicionEstado,
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

  estado.secciones.forEach(
    (
      seccion,
    ) => {
      resultado[
        seccion.id
      ] =
        contarPalabras(
          seccion.contenido,
        );
    },
  );

  return resultado;
}

/**
 * Velocidad de lectura heurística: ~160 palabras por minuto.
 * Ayuda al estudiante a ajustar la duración de la exposición
 * y al docente a contrastar el tiempo observado en aula.
 */
export function estimarMinutosExposicion(
  totalPalabras:
    number,
): number {
  return Math.max(
    1,
    Math.round(
      totalPalabras /
        160,
    ),
  );
}

export function esEnlacePresentacionValido(
  enlace:
    string,
): boolean {
  const texto =
    enlace.trim();

  if (
    !texto
  ) {
    return false;
  }

  try {
    const url =
      new URL(
        texto,
      );

    return (
      url.protocol ===
        'http:' ||
      url.protocol ===
        'https:'
    );
  } catch {
    return false;
  }
}

export function pesoTotalCriterios(
  criterios:
    Pick<
      CriterioExposicion,
      'peso'
    >[],
): number {
  return criterios.reduce(
    (
      suma,
      criterio,
    ) =>
      suma +
      Math.max(
        0,
        criterio.peso,
      ),
    0,
  );
}