import { jsPDF } from 'jspdf';

import {
  parsearDocumentoColaborativo,
  totalPalabrasDocumento,
  estadisticasAutores,
  colorAutor,
  eventosPegadoPorAutor,
} from './documentoColaborativo';

import type {
  EstadisticasAutor,
} from './documentoColaborativo';

export type SesionEdicionPdf = {
  autorId: number;
  autorNombre: string;
  segundosActivos: number;
  cantidadPegados: number;
  ultimoLatidoEn: string;
};

function formatearDuracion(
  segundos:
    number,
): string {
  const total =
    Math.max(
      0,
      Math.round(
        segundos,
      ),
    );

  const horas =
    Math.floor(
      total /
        3600,
    );

  const minutos =
    Math.floor(
      (total %
        3600) /
        60,
    );

  const secs =
    total %
    60;

  if (
    horas >
    0
  ) {
    return `${horas}h ${minutos}m`;
  }

  if (
    minutos >
    0
  ) {
    return `${minutos}m ${secs}s`;
  }

  return `${secs}s`;
}

const margen =
  50;

const anchoUtil =
  595.28 -
  margen *
    2;

function textoEnPagina(
  doc: jsPDF,
  texto:
    string,
  x:
    number,
  y:
    number,
  opciones?: {
    color?: [number, number, number];
    fondo?: [number, number, number];
    fuente?:
      | 'helvetica'
      | 'times'
      | 'courier';
    estilo?:
      | 'normal'
      | 'bold'
      | 'italic'
      | 'bolditalic';
    tamano?: number;
    alineado?: 'left' | 'center' | 'right';
    salto?: 'line' | 'none';
    maximoAncho?: number;
    x?: number;
  },
) {
  doc.setFont(
    opciones?.fuente ?? 'helvetica',
    opciones?.estilo ?? 'normal',
  );

  doc.setFontSize(
    opciones?.tamano ?? 11,
  );

  if (
    opciones?.color
  ) {
    doc.setTextColor(
      opciones.color[0],
      opciones.color[1],
      opciones.color[2],
    );
  }

  if (
    opciones?.fondo
  ) {
    doc.setFillColor(
      opciones.fondo[0],
      opciones.fondo[1],
      opciones.fondo[2],
    );
  }

  const maximo =
    opciones?.maximoAncho ??
    anchoUtil;

  doc.text(
    texto,
    opciones?.x ?? x,
    y,
    {
      maxWidth:
        maximo,
      align:
        opciones?.alineado ?? 'left',
    },
  );

  return (
    opciones?.salto ===
    'none'
      ? y
      : y +
        (
          opciones?.tamano ??
          11
        ) *
          0.45
  );
}

function filaAutor(
  doc: jsPDF,
  autor:
    EstadisticasAutor,
  color:
    [number, number, number],
  x:
    number,
  y:
    number,
  totalPalabras:
    number,
  metricas?: {
    segundosActivos?: number;
    cantidadPegados?: number;
  },
) {
  const curso =
    y;


  doc.setFillColor(
    color[0],
    color[1],
    color[2],
  );

  doc.circle(
    x + 3,
    curso + 4,
    2.5,
    'F',
  );

  doc.setTextColor(
    40,
    40,
    40,
  );

  doc.setFont(
    'helvetica',
    'bold',
  );

  doc.setFontSize(
    10,
  );

  doc.text(
    autor.autorNombre,
    x + 9,
    curso + 6,
  );

  const porcentaje =
    totalPalabras >
      0
      ? (
        autor.totalPalabras /
        totalPalabras *
        100
      ).toFixed(
        1,
      ) +
        '%'
      : '0%';

  doc.setFont(
    'helvetica',
    'normal',
  );

  doc.setFontSize(
    9,
  );

  doc.setTextColor(
    100,
    100,
    100,
  );

  let linea =
    `${autor.bloquesCreados} bloque(s) · ${autor.totalPalabras} palabra(s) · ${porcentaje}`;

  if (
    metricas
  ) {
    const partes:
      string[] =
      [];

    if (
      typeof metricas.segundosActivos ===
        'number'
    ) {
      partes.push(
        `Tiempo activo: ${formatearDuracion(metricas.segundosActivos)}`,
      );
    }

    if (
      typeof metricas.cantidadPegados ===
        'number'
    ) {
      partes.push(
        `${metricas.cantidadPegados} pegado(s) detectado(s)`,
      );
    }

    if (
      partes.length >
      0
    ) {
      linea =
        `${linea} | ${partes.join(' · ')}`;
    }
  }

  doc.text(
    linea,
    x + 9,
    curso + 13,
    {
      maxWidth:
        x ===
        margen
          ? anchoUtil -
            9
          : anchoUtil -
            9,
    },
  );

  doc.setDrawColor(
    220,
    220,
    220,
  );

  doc.line(
    x,
    curso + 18,
    x + anchoUtil,
    curso + 18,
  );

  return (
    curso +
    28
  );
}

function garantizarEspacio(
  doc: jsPDF,
  altoPaginaMaximo:
    number,
  y:
    number,
): number {
  if (
    y <=
    altoPaginaMaximo
  ) {
    return y;
  }

  doc.addPage();

  return margen;
}

export function exportarDocumentoColaborativoPdf(
  contenido:
    string,
  incluirReporteAutores?:
    boolean,
  nombreArchivo?:
    string,
  sesiones?:
    SesionEdicionPdf[],
): boolean {
  const estado =
    parsearDocumentoColaborativo(
      contenido,
    );

  if (
    !estado
  ) {
    return false;
  }

  const doc =
    new jsPDF({
      orientation:
        'portrait',
      unit:
        'pt',
      format:
        'a4',
    });

  let y =
    margen;

  const alto =
    doc.internal.pageSize
      .getHeight();

  const altoLimite =
    alto -
    50;

  const colorTitulo:
    [number, number, number] =
    [
      40,
      40,
      60,
    ];

  y =
    textoEnPagina(
      doc,
      estado.titulo,
      margen,
      y,
      {
        color: colorTitulo,
        fuente:
          'helvetica',
        estilo:
          'bold',
        tamano: 18,
      },
    );

  const total =
    totalPalabrasDocumento(
      estado,
    );

  y =
    textoEnPagina(
      doc,
      `${estado.bloques.length} bloque(s) · ${total} palabra(s)`,
      margen,
      y,
      {
        color: [
          120,
          120,
          120,
        ],
        tamano: 10,
      },
    );

  y +=
    4;

  doc.setDrawColor(
    180,
    180,
    180,
  );

  doc.line(
    margen,
    y,
    margen + anchoUtil,
    y,
  );

  y +=
    12;

  const idsAutores =
    [
      ...new Set(
        estado.bloques.map(
          (
            b,
          ) =>
            b.autorId,
        ),
      ),
    ];

  for (
    const bloque
    of estado.bloques
  ) {
    if (
      !bloque.contenido.trim()
    ) {
      continue;
    }

    const colorHex =
      colorAutor(
        bloque.autorId,
        idsAutores,
      );

    const r =
      parseInt(
        colorHex.slice(
          1,
          3,
        ),
        16,
      );

    const g =
      parseInt(
        colorHex.slice(
          3,
          5,
        ),
        16,
      );

    const b =
      parseInt(
        colorHex.slice(
          5,
          7,
        ),
        16,
      );

    y =
      garantizarEspacio(
        doc,
        altoLimite,
        y,
      );

    const texto =
      bloque.contenido;

    doc.setFillColor(
      r,
      g,
      b,
    );

    doc.setDrawColor(
      r,
      g,
      b,
    );

    doc.roundedRect(
      margen - 4,
      y - 6,
      3,
      14,
      1.5,
      1.5,
      'F',
    );

    y =
      textoEnPagina(
        doc,
        texto,
        margen,
        y,
        {
          color: [
            40,
            40,
            45,
          ],
          fuente:
            'helvetica',
          tamano: 11,
          alineado:
            'left',
          maximoAncho:
            anchoUtil,
        },
      );

    y +=
      2;

    const autor =
      estado.bloques.find(
        (
          b,
        ) =>
          b.id ===
          bloque.id,
      );

    y =
      textoEnPagina(
        doc,
        autor?.autorNombre ??
          bloque.autorNombre,
        margen,
        y,
        {
          color: [
            r,
            g,
            b,
          ],
          fuente:
            'helvetica',
          estilo:
            'bold',
          tamano: 9,
        },
      );

    y +=
      10;
  }

  if (
    incluirReporteAutores
  ) {
    y +=
      6;

    y =
      garantizarEspacio(
        doc,
        altoLimite,
        y,
      );

    y =
      textoEnPagina(
        doc,
        'Contribución por autor',
        margen,
        y,
        {
          color: colorTitulo,
          fuente:
            'helvetica',
          estilo:
            'bold',
          tamano: 13,
        },
      );

    y +=
      4;

    const autores =
      estadisticasAutores(
        estado,
      );

    const metricasMap =
      new Map<
        number,
        {
          segundosActivos?: number;
          cantidadPegados?: number;
        }
      >();

    if (
      sesiones
    ) {
      for (
        const sesion
        of sesiones
      ) {
        metricasMap.set(
          sesion.autorId,
          {
            segundosActivos:
              sesion.segundosActivos,
            cantidadPegados:
              sesion.cantidadPegados,
          },
        );
      }
    }

    const pegadoPorAutor =
      eventosPegadoPorAutor(
        estado,
      );

    for (
      const pegado
      of pegadoPorAutor
    ) {
      if (
        !metricasMap.has(
          pegado.autorId,
        )
      ) {
        metricasMap.set(
          pegado.autorId,
          {
            cantidadPegados:
              pegado.cantidad,
          },
        );
      }
    }

    for (
      const autor
      of autores
    ) {
      const colorHex =
        colorAutor(
          autor.autorId,
          idsAutores,
        );

      const color:
        [number, number, number] =
        [
          parseInt(
            colorHex.slice(
              1,
              3,
            ),
            16,
          ),
          parseInt(
            colorHex.slice(
              3,
              5,
            ),
            16,
          ),
          parseInt(
            colorHex.slice(
              5,
              7,
            ),
            16,
          ),
        ];

      y =
        garantizarEspacio(
          doc,
          altoLimite,
          y,
        );

      y =
        filaAutor(
          doc,
          autor,
          color,
          margen,
          y,
          total,
          metricasMap.get(
            autor.autorId,
          ),
        );
    }
  }

  doc.save(
    nombreArchivo ??
      `${estado.titulo || 'documento'}.pdf`,
  );

  return true;
}
