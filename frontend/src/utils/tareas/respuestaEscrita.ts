export type AreaDerechoCivil =
  | 'OBLIGACIONES'
  | 'CONTRATOS'
  | 'FAMILIA'
  | 'SUCESIONES'
  | 'DERECHOS_REALES'
  | 'LIBRE';

export type CitaJuridica = {
  id: number;
  tipo:
    | 'NORMA'
    | 'JURISPRUDENCIA'
    | 'DOCTRINA';
  referencia: string;
  fundamento: string;
};

export type BancoNormativoItem = {
  id?: number;
  norma: string;
  detalle: string;
};

export type ConfiguracionRespuestaEscrita = {
  areaDerecho: AreaDerechoCivil;
  minPalabras: number;
  maxPalabras: number;
  estructuraGuiada: boolean;
  exigirCitas: boolean;
  minCitas: number;
  bancoNormativo: BancoNormativoItem[];
};

export type RespuestaEscritaEstado = {
  version: 1;
  formato: 'RESPUESTA_ESCRITA';
  secciones: Record<
    string,
    string
  >;
  citas: CitaJuridica[];
};

export type SeccionRespuestaEscrita = {
  clave: string;
  titulo: string;
  consigna: string;
};

export const SECCIONES_RESPUESTA_ESCRITA:
  SeccionRespuestaEscrita[] =
  [
    {
      clave:
        'relacionJuridica',
      titulo:
        'Relación jurídica y pretensión',
      consigna:
        'Identifica a las partes, el vínculo jurídico que las une y qué se solicita.',
    },
    {
      clave:
        'normas',
      titulo:
        'Fundamento normativo',
      consigna:
        'Cita los artículos aplicables del Código Civil boliviano y, si corresponde, jurisprudencia o doctrina.',
    },
    {
      clave:
        'argumentacion',
      titulo:
        'Análisis y argumentación',
      consigna:
        'Subsume los hechos en la norma y desarrolla la argumentación jurídica.',
    },
    {
      clave:
        'conclusion',
      titulo:
        'Conclusión',
      consigna:
        'Cierra con una postura fundamentada y jurídicamente sostenible.',
    },
  ];

export const AREAS_DERECHO_CIVIL:
  Array<{
    valor: AreaDerechoCivil;
    texto: string;
    descripcion: string;
  }> = [
    {
      valor:
        'OBLIGACIONES',
      texto:
        'Obligaciones',
      descripcion:
        'Fuentes, efectos e incumplimiento; responsabilidad civil.',
    },
    {
      valor:
        'CONTRATOS',
      texto:
        'Contratos',
      descripcion:
        'Formación, requisitos, efectos, nulidad y extinción contractual.',
    },
    {
      valor:
        'FAMILIA',
      texto:
        'Familia y procesos familiares',
      descripcion:
        'Matrimonio, divorcio, filiación y alimentos (Ley N° 603).',
    },
    {
      valor:
        'SUCESIONES',
      texto:
        'Sucesiones',
      descripcion:
        'Sucesión intestada y testamentaria, legítima y colación.',
    },
    {
      valor:
        'DERECHOS_REALES',
      texto:
        'Derechos reales',
      descripcion:
        'Propiedad, posesión, registro y desmembramientos del dominio.',
    },
    {
      valor:
        'LIBRE',
      texto:
        'Libre',
      descripcion:
        'Sin área predeterminada; el docente define su propio banco normativo.',
    },
  ];

export const TIPOS_CITA_JURIDICA:
  Array<{
    valor: CitaJuridica['tipo'];
    texto: string;
  }> = [
    {
      valor:
        'NORMA',
      texto:
        'Norma',
    },
    {
      valor:
        'JURISPRUDENCIA',
      texto:
        'Jurisprudencia',
    },
    {
      valor:
        'DOCTRINA',
      texto:
        'Doctrina',
    },
  ];

let siguienteId =
  1;

export function nuevoIdCita():
  number {
  siguienteId +=
    1;

  return siguienteId;
}

export function htmlATextoPlano(
  html:
    string,
): string {
  return html
    .replace(
      /<br\s*\/?\s*>/gi,
      ' ',
    )
    .replace(
      /<\/p>/gi,
      ' ',
    )
    .replace(
      /<\/div>/gi,
      ' ',
    )
    .replace(
      /<\/li>/gi,
      ' ',
    )
    .replace(
      /<[^>]+>/g,
      ' ',
    )
    .replace(
      /&nbsp;/gi,
      ' ',
    )
    .replace(
      /&amp;/gi,
      '&',
    )
    .replace(
      /&lt;/gi,
      '<',
    )
    .replace(
      /&gt;/gi,
      '>',
    )
    .replace(
      /&quot;/gi,
      '"',
    )
    .replace(
      /&#039;/gi,
      "'",
    )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim();
}

export function contarPalabras(
  texto:
    string,
): number {
  const limpio =
    htmlATextoPlano(
      texto,
    );

  if (
    !limpio
  ) {
    return 0;
  }

  return limpio.split(
    ' ',
  ).length;
}

export function nuevaRespuestaEscrita():
  RespuestaEscritaEstado {
  return {
    version:
      1,
    formato:
      'RESPUESTA_ESCRITA',
    secciones: {
      respuesta:
        '',
    },
    citas: [],
  };
}

export function serializarRespuestaEscrita(
  estado:
    RespuestaEscritaEstado,
): string {
  return JSON.stringify(
    estado,
  );
}

export function parsearRespuestaEscrita(
  texto?:
    string | null,
): RespuestaEscritaEstado | null {
  if (
    !texto
  ) {
    return null;
  }

  try {
    const analizado =
      JSON.parse(
        texto,
      ) as Partial<RespuestaEscritaEstado>;

    if (
      analizado?.formato !==
        'RESPUESTA_ESCRITA' ||
      analizado.version !==
        1 ||
      !analizado.secciones ||
      typeof analizado.secciones !==
        'object'
    ) {
      return null;
    }

    const seccionesAnalizadas =
      analizado.secciones as Record<
        string,
        unknown
      >;

    const respuestaDirecta =
      seccionesAnalizadas[
        'respuesta'
      ];

    const secciones:
      Record<
        string,
        string
      > =
        typeof respuestaDirecta ===
          'string'
          ? {
              respuesta:
                respuestaDirecta,
            }
          : {};

    if (
      typeof respuestaDirecta !==
        'string'
    ) {
      SECCIONES_RESPUESTA_ESCRITA.forEach(
        (
          seccion,
        ) => {
          const valor =
            seccionesAnalizadas[
              seccion.clave
            ];

          secciones[
            seccion.clave
          ] =
            typeof valor ===
              'string'
              ? valor
              : '';
        },
      );
    }

    const citas =
      Array.isArray(
        analizado.citas,
      )
        ? (
          analizado.citas as Partial<CitaJuridica>[]
        )
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
                    cita.id ??
                    indice +
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
        'RESPUESTA_ESCRITA',
      secciones,
      citas,
    };
  } catch {
    return null;
  }
}

export function compilarRespuestaEscrita(
  estado:
    RespuestaEscritaEstado,
): string {
  const bloques:
    string[] =
    [];

  const respuesta =
    htmlATextoPlano(
      estado.secciones[
        'respuesta'
      ] ??
        '',
    );

  if (
    respuesta
  ) {
    bloques.push(
      respuesta,
    );
  } else {
    SECCIONES_RESPUESTA_ESCRITA.forEach(
      (
        seccion,
      ) => {
        const texto =
          htmlATextoPlano(
            estado.secciones[
              seccion.clave
            ] ??
              '',
          );

        if (
          texto
        ) {
          bloques.push(
            `${seccion.titulo}
${texto}`,
          );
        }
      },
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
          `• ${cita.referencia}${cita.fundamento.trim() ? `
   ${cita.fundamento.trim()}` : ''}`,
      );

    bloques.push(
      `Fuentes citadas\n${citas.join('\n')}`,
    );
  }

  return bloques.join(
    '\n\n',
  );
}

export function palabrasPorSeccion(
  estado:
    RespuestaEscritaEstado,
): Record<
  string,
  number
> {
  if (
    typeof estado.secciones[
      'respuesta'
    ] ===
      'string'
  ) {
    return {
      respuesta:
        contarPalabras(
          estado.secciones[
            'respuesta'
          ] ??
            '',
        ),
    };
  }

  const resultado:
    Record<
      string,
      number
    > =
      {};

  SECCIONES_RESPUESTA_ESCRITA.forEach(
    (
      seccion,
    ) => {
      resultado[
        seccion.clave
      ] =
        contarPalabras(
          estado.secciones[
            seccion.clave
          ] ??
            '',
        );
    },
  );

  return resultado;
}

export function totalPalabrasRespuesta(
  estado:
    RespuestaEscritaEstado,
): number {
  return Object.values(
    estado.secciones,
  ).reduce(
    (
      suma,
      texto,
    ) =>
      suma +
      contarPalabras(
        texto,
      ),
    0,
  );
}

export function completarAreaDerecho(
  area:
    AreaDerechoCivil,
): AreaDerechoCivil {
  return AREAS_DERECHO_CIVIL.some(
    (
      opcion,
    ) =>
      opcion.valor ===
      area,
  )
    ? area
    : 'LIBRE';
}

export function leerConfiguracionRespuesta(
  configuracion:
    Record<
      string,
      unknown
    > | null,
): ConfiguracionRespuestaEscrita | null {
  const objeto =
    configuracion?.[
      'respuestaEscrita'
    ];

  if (
    !objeto ||
    typeof objeto !==
      'object'
  ) {
    return null;
  }

  const dato =
    objeto as Partial<ConfiguracionRespuestaEscrita>;

  const bancoNormativo =
    Array.isArray(
      dato.bancoNormativo,
    )
      ? (
        dato.bancoNormativo as Partial<BancoNormativoItem>[]
      )
          .filter(
            (
              item,
            ) =>
              item &&
              typeof item.norma ===
                'string' &&
              item.norma.trim(),
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
              norma:
                item.norma ??
                '',
              detalle:
                item.detalle ??
                '',
            }),
          )
      : [];

  const minPalabras =
    typeof dato.minPalabras ===
        'number' &&
      dato.minPalabras >
        0
      ? Math.floor(
          dato.minPalabras,
        )
      : 200;

  const maxPalabras =
    typeof dato.maxPalabras ===
        'number' &&
      dato.maxPalabras >
        0
      ? Math.floor(
          dato.maxPalabras,
        )
      : 1200;

  return {
    areaDerecho:
      completarAreaDerecho(
        dato.areaDerecho ??
          'LIBRE',
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
      typeof dato.estructuraGuiada ===
        'boolean'
        ? dato.estructuraGuiada
        : true,
    exigirCitas:
      typeof dato.exigirCitas ===
        'boolean'
        ? dato.exigirCitas
        : false,
    minCitas:
      typeof dato.minCitas ===
          'number' &&
        dato.minCitas >
          0
        ? Math.floor(
            dato.minCitas,
          )
        : 1,
    bancoNormativo,
  };
}