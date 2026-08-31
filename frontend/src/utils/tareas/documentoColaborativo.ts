export type BloqueDocumento = {
  id: string;
  contenido: string;
  html: string;
  autorId: number;
  autorNombre: string;
  creadoEn: string;
  actualizadoEn: string;
};

export type ConfiguracionDocumentoColaborativo = {
  minBloques: number;
  maxBloques: number;
  minPalabrasPorBloque: number;
  maxPalabrasPorBloque: number;
  totalMinPalabras: number;
  totalMaxPalabras: number;
  exigirAutores: boolean;
  minAutores: number;
};

export type DocumentoColaborativoEstado = {
  formato: 'DOCUMENTO_COLABORATIVO';
  version: 2;
  titulo: string;
  bloques: BloqueDocumento[];
  versiones: VersionDocumento[];
  eventosPegado: EventoPegado[];
};

export type EventoPegado = {
  id: string;
  autorId: number;
  autorNombre: string;
  pegadoEn: string;
  caracteres: number;
};

export type VersionDocumento = {
  id: string;
  nombre: string;
  guardadoEn: string;
  autorId: number;
  autorNombre: string;
  snapshot: BloqueDocumento[];
};

export type EstadisticasAutor = {
  autorId: number;
  autorNombre: string;
  bloquesCreados: number;
  bloquesEditados: number;
  totalPalabras: number;
  ultimaEdicion: string;
};

const nuevosIdBloque =
  (): string =>
    `bloque-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

const nuevosIdVersion =
  (): string =>
    `v-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

export const configDocumentoColaborativoInicial =
  (): ConfiguracionDocumentoColaborativo => ({
    minBloques: 3,
    maxBloques: 30,
    minPalabrasPorBloque: 10,
    maxPalabrasPorBloque: 500,
    totalMinPalabras: 150,
    totalMaxPalabras: 5000,
    exigirAutores: true,
    minAutores: 2,
  });

export const nuevoEstadoDocumento =
  (
    titulo:
      string,
    usuario:
      | {
          id: number;
          nombre: string;
        }
      | null,
  ): DocumentoColaborativoEstado => ({
    formato:
      'DOCUMENTO_COLABORATIVO',
    version: 2,
    titulo,
    bloques: [
      {
        id: nuevosIdBloque(),
        contenido: '',
        html: '',
        autorId:
          usuario?.id ?? 0,
        autorNombre:
          usuario?.nombre ?? 'Sin autor',
        creadoEn:
          new Date().toISOString(),
        actualizadoEn:
          new Date().toISOString(),
      },
    ],
    versiones: [],
    eventosPegado: [],
  });

export const escaparHtml =
  (
    texto:
      string,
  ): string =>
    texto
      .replace(
        /&/g,
        '&amp;',
      )
      .replace(
        /</g,
        '&lt;',
      )
      .replace(
        />/g,
        '&gt;',
      )
      .replace(
        /"/g,
        '&quot;',
      )
      .replace(
        /'/g,
        '&#39;',
      );

export const planoAHtml =
  (
    texto:
      string,
  ): string =>
    escaparHtml(
      texto,
    ).replace(
      /\n/g,
      '<br>',
    );

export const htmlAPlano =
  (
    html:
      string,
  ): string => {
    const contenedor =
      document.createElement(
        'div',
      );

    contenedor.innerHTML =
      html;

    let texto =
      contenedor.textContent ??
      '';

    texto =
      texto.replace(
        /\s+/g,
        ' ',
      );

    return texto.trim();
  };

export const parsearDocumentoColaborativo =
  (
    contenido:
      string,
  ): DocumentoColaborativoEstado | null => {
    if (
      !contenido
    ) {
      return null;
    }

    try {
      const parsed =
        JSON.parse(
          contenido,
        ) as {
          formato?: unknown;
          version?: unknown;
          titulo?: unknown;
          bloques?: unknown;
          versiones?: unknown;
          eventosPegado?: unknown;
        };

      if (
        parsed.formato ===
          'DOCUMENTO_COLABORATIVO' &&
        (parsed.version ===
          1 ||
          parsed.version ===
            2) &&
        Array.isArray(
          parsed.bloques,
        )
      ) {
        const bloques =
          parsed.bloques.filter(
            (
              b: unknown,
            ) =>
              b &&
              typeof b ===
                'object' &&
              'id' in
                (b as Record<string, unknown>) &&
              'contenido' in
                (b as Record<string, unknown>),
          ) as Array<
            BloqueDocumento & {
              html?: unknown;
            }
          >;

        return {
          formato:
            'DOCUMENTO_COLABORATIVO',
          version: 2,
          titulo:
            typeof parsed.titulo ===
              'string'
              ? parsed.titulo
              : 'Documento',
          bloques:
            bloques.map(
              (
                b,
              ) => ({
                ...b,
                html:
                  typeof b.html ===
                    'string' &&
                  b.html
                    ? b.html
                    : planoAHtml(
                        b.contenido ??
                          '',
                      ),
              }),
            ),
          versiones:
            Array.isArray(
              parsed.versiones,
            )
              ? (parsed.versiones as VersionDocumento[]).filter(
                  (
                    v: unknown,
                  ) =>
                    v &&
                    typeof v ===
                      'object' &&
                    'id' in
                      (v as Record<string, unknown>),
                ).map(
                  (
                    v,
                  ) => ({
                    ...v,
                    snapshot:
                      v.snapshot.map(
                        (
                          b,
                        ) => ({
                          ...b,
                          html:
                            typeof (
                              b as BloqueDocumento & {
                                html?: unknown;
                              }
                            ).html ===
                              'string' &&
                            (
                              b as BloqueDocumento & {
                                html?: unknown;
                              }
                            ).html
                              ? (
                                  b as BloqueDocumento & {
                                    html?: unknown;
                                  }
                                ).html
                              : planoAHtml(
                                  b.contenido ??
                                    '',
                                ),
                        }),
                      ),
                  }),
                )
              : [],
          eventosPegado:
            Array.isArray(
              parsed.eventosPegado,
            )
              ? (parsed.eventosPegado as EventoPegado[]).filter(
                  (
                    e: unknown,
                  ) =>
                    e &&
                    typeof e ===
                      'object' &&
                    'id' in
                      (e as Record<string, unknown>),
                )
              : [],
        };
      }
    } catch {
      // no-op
    }

    return null;
  };

export const serializarDocumento =
  (
    estado:
      DocumentoColaborativoEstado,
  ): string =>
    JSON.stringify(
      estado,
    );

export const agregarBloque =
  (
    estado:
      DocumentoColaborativoEstado,
    usuario:
      | {
          id: number;
          nombre: string;
        }
      | null,
    indiceRef?:
      number,
  ): DocumentoColaborativoEstado => {
    const nuevoBloque: BloqueDocumento = {
      id: nuevosIdBloque(),
      contenido: '',
      html: '',
      autorId:
        usuario?.id ?? 0,
      autorNombre:
        usuario?.nombre ?? 'Sin autor',
      creadoEn:
        new Date().toISOString(),
      actualizadoEn:
        new Date().toISOString(),
    };

    const bloques =
      [
        ...estado.bloques,
      ];

    const indice =
      typeof indiceRef ===
        'number' &&
      indiceRef >=
        0 &&
      indiceRef <=
        bloques.length
        ? indiceRef
        : bloques.length;

    bloques.splice(
      indice,
      0,
      nuevoBloque,
    );

    return {
      ...estado,
      bloques,
    };
  };

export const eliminarBloque =
  (
    estado:
      DocumentoColaborativoEstado,
    bloqueId:
      string,
  ): DocumentoColaborativoEstado => ({
    ...estado,
    bloques:
      estado.bloques.filter(
        (
          b,
        ) =>
          b.id !==
          bloqueId,
      ),
  });

export const actualizarBloque =
  (
    estado:
      DocumentoColaborativoEstado,
    bloqueId:
      string,
    html:
      string,
  ): DocumentoColaborativoEstado => ({
    ...estado,
    bloques:
      estado.bloques.map(
        (
          b,
        ) =>
          b.id ===
          bloqueId
            ? {
                ...b,
                html,
                contenido:
                  htmlAPlano(
                    html,
                  ),
                actualizadoEn:
                  new Date().toISOString(),
              }
            : b,
      ),
  });

export const registrarPegado =
  (
    estado:
      DocumentoColaborativoEstado,
    autorId:
      number,
    autorNombre:
      string,
    caracteres:
      number,
  ): DocumentoColaborativoEstado => {
    if (
      !autorId ||
      caracteres <=
        0
    ) {
      return estado;
    }

    const evento: EventoPegado = {
      id: `pegado-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      autorId,
      autorNombre,
      pegadoEn:
        new Date().toISOString(),
      caracteres,
    };

    return {
      ...estado,
      eventosPegado: [
        ...estado.eventosPegado,
        evento,
      ].slice(
        -500,
      ),
    };
  };

export const moverBloque =
  (
    estado:
      DocumentoColaborativoEstado,
    bloqueId:
      string,
    direccion:
      | 'arriba'
      | 'abajo',
  ): DocumentoColaborativoEstado => {
    const bloques =
      [
        ...estado.bloques,
      ];

    const indice =
      bloques.findIndex(
        (
          b,
        ) =>
          b.id ===
          bloqueId,
      );

    if (
      indice <
      0
    ) {
      return estado;
    }

    const nuevoIndice =
      direccion ===
        'arriba'
        ? indice -
          1
        : indice +
          1;

    if (
      nuevoIndice <
        0 ||
      nuevoIndice >=
        bloques.length
    ) {
      return estado;
    }

    const [bloque] =
      bloques.splice(
        indice,
        1,
      );

    bloques.splice(
      nuevoIndice,
      0,
      bloque,
    );

    return {
      ...estado,
      bloques,
    };
  };

export const guardarVersion =
  (
    estado:
      DocumentoColaborativoEstado,
    usuario:
      | {
          id: number;
          nombre: string;
        }
      | null,
    nombre?:
      string,
  ): DocumentoColaborativoEstado => {
    const version: VersionDocumento = {
      id: nuevosIdVersion(),
      nombre:
        nombre ??
        `Versión ${estado.versiones.length + 1}`,
      guardadoEn:
        new Date().toISOString(),
      autorId:
        usuario?.id ?? 0,
      autorNombre:
        usuario?.nombre ?? 'Sistema',
      snapshot:
        estado.bloques.map(
          (
            b,
          ) => ({
            ...b,
          }),
        ),
    };

    return {
      ...estado,
      versiones: [
        ...estado.versiones,
        version,
      ],
    };
  };

export const restaurarVersion =
  (
    estado:
      DocumentoColaborativoEstado,
    versionId:
      string,
  ):
    | DocumentoColaborativoEstado
    | null => {
    const version =
      estado.versiones.find(
        (
          v,
        ) =>
          v.id ===
          versionId,
      );

    if (
      !version
    ) {
      return null;
    }

    return {
      ...estado,
      bloques:
        version.snapshot.map(
          (
            b,
          ) => ({
            ...b,
          }),
        ),
    };
  };

export const contarPalabras =
  (
    texto:
      string,
  ): number => {
    const limpio =
      texto
        .replace(
          /\s+/g,
          ' ',
        )
        .trim();

    return limpio
      ? limpio.split(
          ' ',
        ).length
      : 0;
  };

export const totalPalabrasDocumento =
  (
    estado:
      DocumentoColaborativoEstado,
  ): number =>
    estado.bloques.reduce(
      (
        suma,
        b,
      ) =>
        suma +
        contarPalabras(
          b.contenido,
        ),
      0,
    );

export const estadisticasAutores =
  (
    estado:
      DocumentoColaborativoEstado,
  ): EstadisticasAutor[] => {
    const mapa =
      new Map<
        number,
        EstadisticasAutor
      >();

    for (
      const bloque
      of estado.bloques
    ) {
      let stats =
        mapa.get(
          bloque.autorId,
        );

      if (
        !stats
      ) {
        stats = {
          autorId:
            bloque.autorId,
          autorNombre:
            bloque.autorNombre,
          bloquesCreados: 0,
          bloquesEditados: 0,
          totalPalabras: 0,
          ultimaEdicion:
            bloque.creadoEn,
        };

        mapa.set(
          bloque.autorId,
          stats,
        );
      }

      stats.bloquesCreados += 1;

      stats.totalPalabras +=
        contarPalabras(
          bloque.contenido,
        );

      const fechaActualizacion =
        bloque.actualizadoEn;

      if (
        fechaActualizacion >
          stats.ultimaEdicion
      ) {
        stats.ultimaEdicion =
          fechaActualizacion;
      }

      if (
        bloque.actualizadoEn !==
        bloque.creadoEn
      ) {
        stats.bloquesEditados += 1;
      }
    }

    return Array.from(
      mapa.values(),
    ).sort(
      (
        a,
        b,
      ) =>
        b.totalPalabras -
        a.totalPalabras,
    );
  };

export const leerConfiguracionDocumentoColaborativo =
  (
    configuracionTipo:
      Record<
        string,
        unknown
      >
      | null,
  ):
    | ConfiguracionDocumentoColaborativo
    | null => {
    if (
      !configuracionTipo
    ) {
      return null;
    }

    const raw =
      configuracionTipo[
        'documentoColaborativo'
      ];

    if (
      !raw ||
      typeof raw !==
        'object'
    ) {
      return null;
    }

    const config =
      raw as Record<
        string,
        unknown
      >;

    return {
      minBloques:
        typeof config[
          'minBloques'
        ] ===
          'number'
          ? (config[
              'minBloques'
            ] as number)
          : 3,
      maxBloques:
        typeof config[
          'maxBloques'
        ] ===
          'number'
          ? (config[
              'maxBloques'
            ] as number)
          : 30,
      minPalabrasPorBloque:
        typeof config[
          'minPalabrasPorBloque'
        ] ===
          'number'
          ? (config[
              'minPalabrasPorBloque'
            ] as number)
          : 10,
      maxPalabrasPorBloque:
        typeof config[
          'maxPalabrasPorBloque'
        ] ===
          'number'
          ? (config[
              'maxPalabrasPorBloque'
            ] as number)
          : 500,
      totalMinPalabras:
        typeof config[
          'totalMinPalabras'
        ] ===
          'number'
          ? (config[
              'totalMinPalabras'
            ] as number)
          : 150,
      totalMaxPalabras:
        typeof config[
          'totalMaxPalabras'
        ] ===
          'number'
          ? (config[
              'totalMaxPalabras'
            ] as number)
          : 5000,
      exigirAutores:
        config[
          'exigirAutores'
        ] !==
        false,
      minAutores:
        typeof config[
          'minAutores'
        ] ===
          'number'
          ? (config[
              'minAutores'
            ] as number)
          : 2,
    };
  };

export const coloresAutores =
  [
    '#2563eb',
    '#dc2626',
    '#16a34a',
    '#9333ea',
    '#ea580c',
    '#0891b2',
    '#c026d3',
    '#65a30d',
  ];

export const eventosPegadoPorAutor =
  (
    estado:
      DocumentoColaborativoEstado,
  ): Array<{
    autorId: number;
    autorNombre: string;
    cantidad: number;
    caracteres: number;
  }> => {
    const mapa =
      new Map<
        number,
        {
          autorId: number;
          autorNombre: string;
          cantidad: number;
          caracteres: number;
        }
      >();

    for (
      const evento
      of estado.eventosPegado
    ) {
      const datos =
        mapa.get(
          evento.autorId,
        ) ?? {
          autorId:
            evento.autorId,
          autorNombre:
            evento.autorNombre,
          cantidad: 0,
          caracteres: 0,
        };

      datos.cantidad +=
        1;

      datos.caracteres +=
        evento.caracteres;

      mapa.set(
        evento.autorId,
        datos,
      );
    }

    return Array.from(
      mapa.values(),
    ).sort(
      (
        a,
        b,
      ) =>
        b.cantidad -
        a.cantidad,
    );
  };

export const colorAutor =
  (
    autorId:
      number,
    autores:
      number[],
  ): string => {
    const indice =
      autores.indexOf(
        autorId,
      );

    return coloresAutores[
      indice %
        coloresAutores.length
    ] ??
      coloresAutores[0];
  };
