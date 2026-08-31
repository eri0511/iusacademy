import {
  contarPalabras,
} from './respuestaEscrita';

import type {
  CitaJuridica,
} from './respuestaEscrita';

export type TipoPiezaJuridica =
  | 'DEMANDA'
  | 'MEMORIAL'
  | 'DICTAMEN'
  | 'CONTRATO'
  | 'INFORME'
  | 'OTRO';

export type SeccionRedaccionTipo = {
  id?: number;
  titulo: string;
  consigna: string;
};

export type ConfiguracionRedaccionJuridica = {
  tipoPieza: TipoPiezaJuridica;
  secciones: SeccionRedaccionTipo[];
  minPalabras: number;
  maxPalabras: number;
  estructuraGuiada: boolean;
  exigirCitas: boolean;
  minCitas: number;
};

export type RespuestaRedaccionEstado = {
  version: 1;
  formato: 'REDACCION_JURIDICA';
  tipoPieza: TipoPiezaJuridica;
  tituloDocumento: string;
  secciones: Array<{
    id: number;
    titulo: string;
    consigna: string;
    contenido: string;
  }>;
  citas: CitaJuridica[];
};

export const TIPOS_PIEZA_JURIDICA:
  Array<{
    valor: TipoPiezaJuridica;
    texto: string;
    descripcion: string;
  }> = [
    {
      valor: 'DEMANDA',
      texto: 'Demanda',
      descripcion: 'Pieza procesal de acción (Código Procesal Civil).',
    },
    {
      valor: 'MEMORIAL',
      texto: 'Memorial',
      descripcion: 'Solicitud o alegato dirigido a la autoridad judicial.',
    },
    {
      valor: 'DICTAMEN',
      texto: 'Dictamen',
      descripcion: 'Opinión técnico-jurídica fundamentada.',
    },
    {
      valor: 'CONTRATO',
      texto: 'Contrato',
      descripcion: 'Instrumento negocial con cláusulas y formalidades.',
    },
    {
      valor: 'INFORME',
      texto: 'Informe',
      descripcion: 'Exposición ordenada sobre hechos y derecho.',
    },
    {
      valor: 'OTRO',
      texto: 'Pieza libre',
      descripcion: 'El docente define su propia estructura.',
    },
  ];

export function seccionesPorPieza(
  tipo:
    TipoPiezaJuridica,
): SeccionRedaccionTipo[] {
  switch (
    tipo
  ) {
    case 'DEMANDA':
      return [
        {
          titulo:
            'Encabezamiento y autoridad competente',
          consigna:
            'Señala el juzgado o tribunal, la vía procesal y la materia.',
        },
        {
          titulo:
            'Identificación de las partes',
          consigna:
            'Precisa demandante y demandado con sus generales de ley y domicilios.',
        },
        {
          titulo:
            'Objeto de la demanda',
          consigna:
            'Expresa con claridad qué se pide y con qué alcance.',
        },
        {
          titulo:
            'Fundamentos de hecho',
          consigna:
            'Narra cronológicamente los hechos relevantes.',
        },
        {
          titulo:
            'Fundamentos de derecho',
          consigna:
            'Cita las normas y jurisprudencia aplicables al caso.',
        },
        {
          titulo:
            'Petitorio',
          consigna:
            'Formula las peticiones concretas en numerales.',
        },
        {
          titulo:
            'Otrosíes y firma',
          consigna:
            'Acompaña pruebas, señala domicilio procesal y suscribe.',
        },
      ];

    case 'MEMORIAL':
      return [
        {
          titulo:
            'Autoridad a la que se dirige',
          consigna:
            'Identifica el juzgado o tribunal y la referencia del proceso.',
        },
        {
          titulo:
            'Exposición de la solicitud',
          consigna:
            'Desarrolla los fundamentos de hecho y de derecho de la petición.',
        },
        {
          titulo:
            'Petitorio',
          consigna:
            'Concluye con las peticiones concretas.',
        },
        {
          titulo:
            'Otrosíes y firma',
          consigna:
            'Aporta datos complementarios y suscribe.',
        },
      ];

    case 'DICTAMEN':
      return [
        {
          titulo:
            'Hechos y antecedentes',
          consigna:
            'Describe el objeto del dictamen y los antecedentes relevantes.',
        },
        {
          titulo:
            'Problema jurídico',
          consigna:
            'Formula con precisión la cuestión jurídica a resolver.',
        },
        {
          titulo:
            'Análisis normativo y jurisprudencial',
          consigna:
            'Desarrolla el marco legal, doctrina y precedentes aplicables.',
        },
        {
          titulo:
            'Conclusión del dictamen',
          consigna:
            'Emite la opinión técnico-jurídica final fundamentada.',
        },
      ];

    case 'CONTRATO':
      return [
        {
          titulo:
            'Partes contratantes',
          consigna:
            'Identifica a las partes, su calidad, generales y comparecencia.',
        },
        {
          titulo:
            'Objeto del contrato',
          consigna:
            'Determina la prestación y el bien o servicio contratado.',
        },
        {
          titulo:
            'Obligaciones de las partes',
          consigna:
            'Detalla derechos y obligaciones de cada contratante.',
        },
        {
          titulo:
            'Precio, plazo y forma de pago',
          consigna:
            'Precisa la contraprestación, los plazos y los medios de pago.',
        },
        {
          titulo:
            'Nulidades, penalidades y resolución',
          consigna:
            'Incluye cláusulas sobre incumplimiento, inimputabilidad y extinción.',
        },
        {
          titulo:
            'Formalidades y firma',
          consigna:
            'Consigna el lugar, la fecha y las firmas.',
        },
      ];

    case 'INFORME':
      return [
        {
          titulo:
            'Introducción y alcance',
          consigna:
            'Explica el objeto del informe y su alcance.',
        },
        {
          titulo:
            'Hechos constatados',
          consigna:
            'Relata los hechos verificados y la documentación revisada.',
        },
        {
          titulo:
            'Análisis normativo aplicable',
          consigna:
            'Desarrolla las normas y criterios que sustentan el análisis.',
        },
        {
          titulo:
            'Recomendaciones y conclusión',
          consigna:
            'Cierra con conclusiones y recomendaciones concretas.',
        },
      ];

    case 'OTRO':
      return [
        {
          titulo:
            'Introducción',
          consigna:
            'Presenta el propósito del documento.',
        },
        {
          titulo:
            'Desarrollo',
          consigna:
            'Expone el contenido jurídico de la pieza.',
        },
        {
          titulo:
            'Conclusión',
          consigna:
            'Cierra con la postura o petición final.',
        },
      ];
  }
}

export function tipoPiezaCompleto(
  tipo:
    unknown,
): TipoPiezaJuridica {
  return TIPOS_PIEZA_JURIDICA.some(
    (
      opcion,
    ) =>
      opcion.valor ===
      tipo,
  )
    ? tipo as TipoPiezaJuridica
    : 'OTRO';
}

export function configRedaccionInicial():
  ConfiguracionRedaccionJuridica {
  const secciones =
    seccionesPorPieza(
      'DEMANDA',
    ).map(
      (
        seccion,indice,
      ) => ({
        ...seccion,
        id:
          indice +
          1,
      }),
    );

  return {
    tipoPieza:
      'DEMANDA',
    secciones,
    minPalabras:
      200,
    maxPalabras:
      1500,
    estructuraGuiada:
      true,
    exigirCitas:
      true,
    minCitas:
      2,
  };
}

export function leerConfiguracionRedaccion(
  configuracion:
    Record<
      string,
      unknown
    > | null,
): ConfiguracionRedaccionJuridica | null {
  const objeto =
    configuracion?.[
      'redaccionJuridica'
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

  const tipoPieza =
    tipoPiezaCompleto(
      dato[
        'tipoPieza'
      ],
    );

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

  const minPalabras =
    numero(
      'minPalabras',
      200,
    );

  const maxPalabras =
    numero(
      'maxPalabras',
      1500,
    );

  return {
    tipoPieza,
    secciones:
      secciones.length >
        0
        ? secciones
        : seccionesPorPieza(
            tipoPieza,
          ).map(
            (
              seccion,
              indice,
            ) => ({
              ...seccion,
              id:
                indice +
                1,
            }),
          ),
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

export function nuevaRespuestaRedaccion(
  config:
    ConfiguracionRedaccionJuridica,
): RespuestaRedaccionEstado {
  return {
    version:
      1,
    formato:
      'REDACCION_JURIDICA',
    tipoPieza:
      config.tipoPieza,
    tituloDocumento:
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
  };
}

export function serializarRespuestaRedaccion(
  estado:
    RespuestaRedaccionEstado,
): string {
  return JSON.stringify(
    estado,
  );
}

export function parsearRespuestaRedaccion(
  texto?:
    string | null,
): RespuestaRedaccionEstado | null {
  if (
    !texto
  ) {
    return null;
  }

  try {
    const analizado =
      JSON.parse(
        texto,
      ) as Partial<RespuestaRedaccionEstado>;

    if (
      analizado?.formato !==
        'REDACCION_JURIDICA' ||
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

    return {
      version:
        1,
      formato:
        'REDACCION_JURIDICA',
      tipoPieza:
        tipoPiezaCompleto(
          analizado.tipoPieza,
        ),
      tituloDocumento:
        analizado.tituloDocumento ??
        '',
      secciones,
      citas,
    };
  } catch {
    return null;
  }
}

export function totalPalabrasRedaccion(
  estado:
    RespuestaRedaccionEstado,
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

export function palabrasPorSeccionRedaccion(
  estado:
    RespuestaRedaccionEstado,
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

export function compilarRedaccionTxt(
  estado:
    RespuestaRedaccionEstado,
): string {
  const lineas:
    string[] =
    [];

  const tipoPieza =
    TIPOS_PIEZA_JURIDICA.find(
      (
        opcion,
      ) =>
        opcion.valor ===
        estado.tipoPieza,
    )?.texto ??
    'Pieza jurídica';

  lineas.push(
    `[${tipoPieza.toUpperCase()}]`,
  );

  if (
    estado.tituloDocumento.trim()
  ) {
    lineas.push(
      `TÍTULO: ${estado.tituloDocumento.trim()}`,
    );
  }

  lineas.push(
    '='.repeat(
      40,
    ),
  );

  estado.secciones.forEach(
    (
      seccion,
    ) => {
      lineas.push(
        seccion.titulo
          .trim()
          .toUpperCase(),
      );

      lineas.push(
        seccion.contenido.trim() ||
          '(sin contenido)',
      );

      lineas.push(
        '',
      );
    },
  );

  if (
    estado.citas.length >
    0
  ) {
    lineas.push(
      'FUENTES CITADAS',
    );

    estado.citas.forEach(
      (
        cita,
      ) => {
        lineas.push(
          `• ${cita.referencia.trim()}${cita.fundamento.trim() ? ` — ${cita.fundamento.trim()}` : ''}`,
        );
      },
    );
  }

  return lineas.join(
    '\n',
  );
}