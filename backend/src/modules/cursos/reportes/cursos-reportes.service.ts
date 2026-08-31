import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

import { EstadoCurso } from '../../../generated/prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

type CursoReporte = {
  id: number;
  gestion: string;
  paralelo: string;
  semestre: number;
  cupoMaximo: number | null;
  estado: EstadoCurso;
  finalizadoEn: Date | null;
  creadoEn: Date;
  actualizadoEn: Date;

  materia: {
    nombre: string;
    codigo: string;
  };

  docente: {
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    correo: string;
  };
};

type ResumenCursos = {
  total: number;
  activos: number;
  inactivos: number;
  finalizados: number;
};

const COLORES = {
  naranja: '#F18B4B',
  naranjaOscuro: '#C46A2C',
  naranjaClaro: '#FFF0DF',
  crema: '#FFFDF9',
  cremaSuave: '#FFF8EF',
  azulOscuro: '#0F172A',
  gris: '#64748B',
  grisClaro: '#E5E7EB',
  verde: '#15803D',
  verdeClaro: '#ECFDF3',
  morado: '#7C3AED',
  moradoClaro: '#F5F3FF',
  rojo: '#DC2626',
  blanco: '#FFFFFF',
};

@Injectable()
export class CursosReportesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly seleccionReporte = {
    id: true,
    gestion: true,
    paralelo: true,
    semestre: true,
    cupoMaximo: true,
    estado: true,
    finalizadoEn: true,
    creadoEn: true,
    actualizadoEn: true,

    materia: {
      select: {
        nombre: true,
        codigo: true,
      },
    },

    docente: {
      select: {
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
      },
    },
  };

  private nombreDocente(curso: CursoReporte): string {
    return [
      curso.docente.nombres,
      curso.docente.apellidoPaterno,
      curso.docente.apellidoMaterno,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private formatearFecha(fecha: Date | null): string {
    if (!fecha) {
      return 'No registrada';
    }

    return new Intl.DateTimeFormat('es-BO', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/La_Paz',
    }).format(fecha);
  }

  private obtenerEtiquetaEstado(estado: EstadoCurso): string {
    if (estado === EstadoCurso.ACTIVO) {
      return 'Activo';
    }

    if (estado === EstadoCurso.INACTIVO) {
      return 'Inactivo';
    }

    return 'Finalizado';
  }

  private obtenerColorEstado(estado: EstadoCurso): {
    texto: string;
    fondo: string;
  } {
    if (estado === EstadoCurso.ACTIVO) {
      return {
        texto: COLORES.verde,
        fondo: COLORES.verdeClaro,
      };
    }

    if (estado === EstadoCurso.INACTIVO) {
      return {
        texto: COLORES.gris,
        fondo: '#F3F4F6',
      };
    }

    return {
      texto: COLORES.morado,
      fondo: COLORES.moradoClaro,
    };
  }

  private calcularResumen(cursos: CursoReporte[]): ResumenCursos {
    return {
      total: cursos.length,

      activos: cursos.filter((curso) => curso.estado === EstadoCurso.ACTIVO)
        .length,

      inactivos: cursos.filter((curso) => curso.estado === EstadoCurso.INACTIVO)
        .length,

      finalizados: cursos.filter(
        (curso) => curso.estado === EstadoCurso.FINALIZADO,
      ).length,
    };
  }

  private documentoABuffer(documento: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const fragmentos: Buffer[] = [];

      documento.on('data', (fragmento: Buffer) => {
        fragmentos.push(fragmento);
      });

      documento.on('end', () => {
        resolve(Buffer.concat(fragmentos));
      });

      documento.on('error', reject);

      documento.end();
    });
  }

  private crearDocumento(titulo: string, subtitulo: string) {
    const documento = new PDFDocument({
      size: 'A4',

      margin: 44,

      bufferPages: true,

      info: {
        Title: titulo,

        Author: 'IusAcademy',

        Subject: subtitulo,

        Creator: 'IusAcademy',
      },
    });

    this.dibujarEncabezadoPrincipal(documento, titulo, subtitulo);

    return documento;
  }

  private dibujarEncabezadoPrincipal(
    documento: PDFKit.PDFDocument,
    titulo: string,
    subtitulo: string,
  ) {
    const ancho = documento.page.width;

    documento.rect(0, 0, ancho, 112).fill(COLORES.cremaSuave);

    documento.rect(0, 0, 7, 112).fill(COLORES.naranja);

    documento.roundedRect(44, 29, 48, 48, 14).fill(COLORES.naranjaClaro);

    documento
      .fillColor(COLORES.naranjaOscuro)
      .font('Helvetica-Bold')
      .fontSize(17)
      .text('IA', 58, 45, {
        width: 20,

        align: 'center',

        lineBreak: false,
      });

    documento
      .fillColor(COLORES.naranjaOscuro)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('IUSACADEMY', 108, 30, {
        characterSpacing: 1.7,

        lineBreak: false,
      });

    documento
      .fillColor(COLORES.azulOscuro)
      .font('Helvetica-Bold')
      .fontSize(21)
      .text(titulo, 108, 47, {
        width: ancho - 152,

        lineBreak: false,
      });

    documento
      .fillColor(COLORES.gris)
      .font('Helvetica')
      .fontSize(9.5)
      .text(subtitulo, 108, 75, {
        width: ancho - 152,

        lineBreak: false,
      });

    documento.y = 136;
  }

  private dibujarEncabezadoContinuacion(
    documento: PDFKit.PDFDocument,
    titulo: string,
  ) {
    documento.rect(0, 0, documento.page.width, 54).fill(COLORES.cremaSuave);

    documento.rect(0, 0, 6, 54).fill(COLORES.naranja);

    documento
      .fillColor(COLORES.naranjaOscuro)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('IUSACADEMY', 44, 15, {
        characterSpacing: 1.4,

        lineBreak: false,
      });

    documento
      .fillColor(COLORES.azulOscuro)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(titulo, 44, 29, {
        lineBreak: false,
      });

    documento.y = 76;
  }

  private dibujarPiePagina(
    documento: PDFKit.PDFDocument,
    pagina?: number,
    totalPaginas?: number,
  ) {
    const y = documento.page.height - 31;

    const yOriginal = documento.y;

    const margenInferiorOriginal = documento.page.margins.bottom;

    /*
     * PDFKit crea una página nueva cuando se escribe
     * por debajo del margen inferior. Para evitar páginas
     * vacías, desactivamos temporalmente ese margen mientras
     * dibujamos el pie.
     */
    documento.page.margins.bottom = 0;

    documento.save();

    documento
      .moveTo(44, y - 10)
      .lineTo(documento.page.width - 44, y - 10)
      .strokeColor(COLORES.grisClaro)
      .lineWidth(1)
      .stroke();

    documento
      .fillColor(COLORES.gris)
      .font('Helvetica')
      .fontSize(7.5)
      .text('IusAcademy - Especializados en Área Civil', 44, y, {
        width: 260,

        lineBreak: false,
      });

    documento.text(
      pagina && totalPaginas
        ? `Página ${pagina} de ${totalPaginas}`
        : `Generado el ${this.formatearFecha(new Date())}`,
      documento.page.width - 210,
      y,
      {
        width: 166,

        align: 'right',

        lineBreak: false,
      },
    );

    documento.restore();

    documento.page.margins.bottom = margenInferiorOriginal;

    documento.y = yOriginal;
  }

  private agregarPiesTodasLasPaginas(documento: PDFKit.PDFDocument) {
    const rango = documento.bufferedPageRange();

    for (let indice = 0; indice < rango.count; indice += 1) {
      documento.switchToPage(indice);

      this.dibujarPiePagina(documento, indice + 1, rango.count);
    }
  }

  private asegurarEspacio(
    documento: PDFKit.PDFDocument,
    altoNecesario: number,
    tituloContinuacion: string,
  ) {
    const limite = documento.page.height - 64;

    if (documento.y + altoNecesario > limite) {
      documento.addPage();

      this.dibujarEncabezadoContinuacion(documento, tituloContinuacion);
    }
  }

  private dibujarTituloSeccion(documento: PDFKit.PDFDocument, titulo: string) {
    documento
      .fillColor(COLORES.naranjaOscuro)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(titulo.toUpperCase(), 44, documento.y, {
        characterSpacing: 1,

        lineBreak: false,
      });

    documento.y += 23;
  }

  private dibujarDato(
    documento: PDFKit.PDFDocument,
    etiqueta: string,
    valor: string,
    x: number,
    y: number,
    ancho: number,
  ) {
    documento
      .roundedRect(x, y, ancho, 56, 11)
      .fillAndStroke(COLORES.crema, '#F2DCC5');

    documento
      .fillColor(COLORES.gris)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text(etiqueta.toUpperCase(), x + 12, y + 11, {
        width: ancho - 24,

        characterSpacing: 0.5,

        lineBreak: false,
      });

    documento
      .fillColor(COLORES.azulOscuro)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(valor, x + 12, y + 29, {
        width: ancho - 24,

        height: 18,

        ellipsis: true,
      });
  }

  private dibujarTarjetaCurso(
    documento: PDFKit.PDFDocument,
    curso: CursoReporte,
    numero: number,
  ) {
    documento.addPage();

    this.dibujarEncabezadoPrincipal(
      documento,
      `Ficha del curso ${numero}`,
      'Detalle académico completo del curso registrado',
    );

    const estado = this.obtenerColorEstado(curso.estado);

    documento
      .roundedRect(44, 142, documento.page.width - 88, 74, 16)
      .fill(COLORES.cremaSuave);

    documento
      .fillColor(COLORES.naranjaOscuro)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(`CURSO ${numero}`, 60, 157, {
        lineBreak: false,
      });

    documento
      .fillColor(COLORES.azulOscuro)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(curso.materia.nombre, 60, 176, {
        width: documento.page.width - 225,
        lineBreak: false,
        ellipsis: true,
      });

    documento
      .roundedRect(documento.page.width - 158, 163, 96, 28, 14)
      .fill(estado.fondo);

    documento
      .fillColor(estado.texto)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(
        this.obtenerEtiquetaEstado(curso.estado),
        documento.page.width - 150,
        173,
        {
          width: 80,
          align: 'center',
          lineBreak: false,
        },
      );

    /*
     * El encabezado de la ficha termina en Y=216.
     * Reubicamos el cursor debajo de esa tarjeta para que
     * el título de la primera sección no se superponga.
     */
    documento.y = 244;

    const anchoColumna = (documento.page.width - 100) / 2;

    this.dibujarTituloSeccion(documento, 'Información académica');

    let y = documento.y + 4;

    this.dibujarDato(
      documento,
      'Materia',
      curso.materia.nombre,
      44,
      y,
      anchoColumna,
    );

    this.dibujarDato(
      documento,
      'Código',
      curso.materia.codigo,
      56 + anchoColumna,
      y,
      anchoColumna,
    );

    y += 68;

    this.dibujarDato(documento, 'Gestión', curso.gestion, 44, y, anchoColumna);

    this.dibujarDato(
      documento,
      'Paralelo',
      curso.paralelo,
      56 + anchoColumna,
      y,
      anchoColumna,
    );

    y += 68;

    this.dibujarDato(
      documento,
      'Semestre',
      `${curso.semestre}.º semestre`,
      44,
      y,
      anchoColumna,
    );

    this.dibujarDato(
      documento,
      'Cupo máximo',
      curso.cupoMaximo
        ? `${curso.cupoMaximo} estudiantes`
        : 'Sin límite definido',
      56 + anchoColumna,
      y,
      anchoColumna,
    );

    documento.y = y + 78;

    this.dibujarTituloSeccion(documento, 'Docente asignado');

    y = documento.y + 4;

    this.dibujarDato(
      documento,
      'Nombre completo',
      this.nombreDocente(curso),
      44,
      y,
      anchoColumna,
    );

    this.dibujarDato(
      documento,
      'Correo institucional',
      curso.docente.correo,
      56 + anchoColumna,
      y,
      anchoColumna,
    );

    documento.y = y + 78;

    this.dibujarTituloSeccion(documento, 'Fechas del registro');

    const anchoFecha = (documento.page.width - 112) / 3;

    y = documento.y + 4;

    this.dibujarDato(
      documento,
      'Fecha de creación',
      this.formatearFecha(curso.creadoEn),
      44,
      y,
      anchoFecha,
    );

    this.dibujarDato(
      documento,
      'Última actualización',
      this.formatearFecha(curso.actualizadoEn),
      52 + anchoFecha,
      y,
      anchoFecha,
    );

    this.dibujarDato(
      documento,
      'Fecha de finalización',
      this.formatearFecha(curso.finalizadoEn),
      60 + anchoFecha * 2,
      y,
      anchoFecha,
    );

    documento.y = y + 82;

    documento
      .roundedRect(44, documento.y, documento.page.width - 88, 54, 12)
      .fill(
        curso.estado === EstadoCurso.FINALIZADO
          ? COLORES.moradoClaro
          : COLORES.cremaSuave,
      );

    documento
      .fillColor(
        curso.estado === EstadoCurso.FINALIZADO
          ? COLORES.morado
          : COLORES.naranjaOscuro,
      )
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('OBSERVACIÓN', 58, documento.y + 11, {
        lineBreak: false,
      });

    documento
      .fillColor(COLORES.gris)
      .font('Helvetica')
      .fontSize(8.7)
      .text(
        curso.estado === EstadoCurso.FINALIZADO
          ? 'Este curso se conserva como historial académico y no puede editarse, reactivarse ni reutilizarse para otra gestión.'
          : 'Este curso permanece disponible dentro de la gestión académica conforme a su estado actual.',
        58,
        documento.y + 27,
        {
          width: documento.page.width - 116,
        },
      );
  }

  async generarPdfCurso(id: number): Promise<Buffer> {
    const curso = await this.prisma.curso.findUnique({
      where: {
        id,
      },

      select: this.seleccionReporte,
    });

    if (!curso) {
      throw new NotFoundException('El curso no existe');
    }

    if (curso.estado !== EstadoCurso.FINALIZADO) {
      throw new BadRequestException(
        'La ficha histórica solo está disponible para cursos finalizados',
      );
    }

    const documento = this.crearDocumento(
      'Ficha histórica del curso',
      'Registro académico consolidado y de solo lectura',
    );

    documento
      .roundedRect(44, documento.y, documento.page.width - 88, 52, 14)
      .fill(COLORES.moradoClaro);

    documento
      .fillColor(COLORES.morado)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(curso.materia.nombre, 60, documento.y + 13, {
        width: documento.page.width - 210,

        lineBreak: false,

        ellipsis: true,
      });

    documento
      .fillColor(COLORES.gris)
      .font('Helvetica')
      .fontSize(9)
      .text(
        `${curso.materia.codigo} - ${curso.gestion} - Paralelo ${curso.paralelo}`,
        60,
        documento.y + 31,
        {
          lineBreak: false,
        },
      );

    documento.y += 74;

    this.dibujarTituloSeccion(documento, 'Información académica');

    const anchoColumna = (documento.page.width - 100) / 2;

    let y = documento.y;

    this.dibujarDato(
      documento,
      'Materia',
      curso.materia.nombre,
      44,
      y,
      anchoColumna,
    );

    this.dibujarDato(
      documento,
      'Código',
      curso.materia.codigo,
      56 + anchoColumna,
      y,
      anchoColumna,
    );

    y += 68;

    this.dibujarDato(documento, 'Gestión', curso.gestion, 44, y, anchoColumna);

    this.dibujarDato(
      documento,
      'Paralelo',
      curso.paralelo,
      56 + anchoColumna,
      y,
      anchoColumna,
    );

    y += 68;

    this.dibujarDato(
      documento,
      'Semestre',
      `${curso.semestre}.º semestre`,
      44,
      y,
      anchoColumna,
    );

    this.dibujarDato(
      documento,
      'Cupo máximo',
      curso.cupoMaximo
        ? `${curso.cupoMaximo} estudiantes`
        : 'Sin límite definido',
      56 + anchoColumna,
      y,
      anchoColumna,
    );

    documento.y = y + 78;

    this.dibujarTituloSeccion(documento, 'Docente asignado');

    y = documento.y;

    this.dibujarDato(
      documento,
      'Nombre completo',
      this.nombreDocente(curso),
      44,
      y,
      anchoColumna,
    );

    this.dibujarDato(
      documento,
      'Correo institucional',
      curso.docente.correo,
      56 + anchoColumna,
      y,
      anchoColumna,
    );

    documento.y = y + 78;

    this.dibujarTituloSeccion(documento, 'Fechas del registro');

    y = documento.y;

    this.dibujarDato(
      documento,
      'Fecha de creación',
      this.formatearFecha(curso.creadoEn),
      44,
      y,
      anchoColumna,
    );

    this.dibujarDato(
      documento,
      'Fecha de finalización',
      this.formatearFecha(curso.finalizadoEn),
      56 + anchoColumna,
      y,
      anchoColumna,
    );

    documento.y = y + 76;

    documento
      .roundedRect(44, documento.y, documento.page.width - 88, 54, 12)
      .fill(COLORES.cremaSuave);

    documento
      .fillColor(COLORES.naranjaOscuro)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('OBSERVACIÓN', 58, documento.y + 11, {
        lineBreak: false,
      });

    documento
      .fillColor(COLORES.gris)
      .font('Helvetica')
      .fontSize(9)
      .text(
        'Este curso se conserva como historial académico y no puede editarse, reactivarse ni reutilizarse para una nueva gestión.',
        58,
        documento.y + 27,
        {
          width: documento.page.width - 116,
        },
      );

    this.agregarPiesTodasLasPaginas(documento);

    return this.documentoABuffer(documento);
  }

  async generarPdfGeneral(): Promise<Buffer> {
    const cursos = (await this.prisma.curso.findMany({
      select: this.seleccionReporte,

      orderBy: [
        {
          gestion: 'desc',
        },
        {
          semestre: 'asc',
        },
        {
          paralelo: 'asc',
        },
      ],
    })) as CursoReporte[];

    const resumen = this.calcularResumen(cursos);

    const documento = this.crearDocumento(
      'Reporte general de cursos',
      'Detalle completo de los cursos registrados en IusAcademy',
    );

    const tarjetas = [
      {
        titulo: 'Total',
        valor: resumen.total,
        texto: COLORES.naranjaOscuro,
        fondo: COLORES.naranjaClaro,
      },
      {
        titulo: 'Activos',
        valor: resumen.activos,
        texto: COLORES.verde,
        fondo: COLORES.verdeClaro,
      },
      {
        titulo: 'Inactivos',
        valor: resumen.inactivos,
        texto: COLORES.gris,
        fondo: '#F3F4F6',
      },
      {
        titulo: 'Finalizados',
        valor: resumen.finalizados,
        texto: COLORES.morado,
        fondo: COLORES.moradoClaro,
      },
    ];

    const anchoTarjeta = (documento.page.width - 112) / 4;

    const yTarjetas = documento.y;

    tarjetas.forEach((tarjeta, indice) => {
      const x = 44 + indice * (anchoTarjeta + 8);

      documento
        .roundedRect(x, yTarjetas, anchoTarjeta, 58, 12)
        .fill(tarjeta.fondo);

      documento
        .fillColor(tarjeta.texto)
        .font('Helvetica-Bold')
        .fontSize(19)
        .text(String(tarjeta.valor), x + 12, yTarjetas + 11, {
          lineBreak: false,
        });

      documento
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(tarjeta.titulo, x + 12, yTarjetas + 39, {
          lineBreak: false,
        });
    });

    documento.y = yTarjetas + 82;

    documento
      .roundedRect(44, documento.y, documento.page.width - 88, 82, 14)
      .fill(COLORES.cremaSuave);

    documento
      .fillColor(COLORES.naranjaOscuro)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('CONTENIDO DEL REPORTE', 60, documento.y + 16, {
        lineBreak: false,
      });

    documento
      .fillColor(COLORES.gris)
      .font('Helvetica')
      .fontSize(9.5)
      .text(
        cursos.length === 1
          ? 'La página siguiente contiene la ficha académica detallada del curso registrado.'
          : `Las siguientes ${cursos.length} páginas contienen una ficha académica detallada por cada curso registrado.`,
        60,
        documento.y + 38,
        {
          width: documento.page.width - 120,

          lineGap: 3,
        },
      );

    documento.y += 104;

    if (cursos.length === 0) {
      documento
        .fillColor(COLORES.gris)
        .font('Helvetica')
        .fontSize(10)
        .text('No existen cursos registrados.', 44, documento.y);
    } else {
      cursos.forEach((curso, indice) => {
        this.dibujarTarjetaCurso(documento, curso, indice + 1);
      });
    }

    this.agregarPiesTodasLasPaginas(documento);

    return this.documentoABuffer(documento);
  }

  async generarExcelGeneral(): Promise<Buffer> {
    const cursos = (await this.prisma.curso.findMany({
      select: this.seleccionReporte,

      orderBy: [
        {
          gestion: 'desc',
        },
        {
          semestre: 'asc',
        },
        {
          paralelo: 'asc',
        },
      ],
    })) as CursoReporte[];

    const resumen = this.calcularResumen(cursos);

    const libro = new ExcelJS.Workbook();

    libro.creator = 'IusAcademy';

    libro.created = new Date();

    const hojaResumen = libro.addWorksheet('Resumen');

    hojaResumen.columns = [
      {
        key: 'concepto',
        width: 28,
      },
      {
        key: 'valor',
        width: 24,
      },
    ];

    hojaResumen.mergeCells('A1:B2');

    const titulo = hojaResumen.getCell('A1');

    titulo.value = 'IusAcademy - Reporte general de cursos';

    titulo.font = {
      bold: true,

      size: 17,

      color: {
        argb: 'FF0F172A',
      },
    };

    titulo.alignment = {
      vertical: 'middle',

      horizontal: 'center',
    };

    titulo.fill = {
      type: 'pattern',

      pattern: 'solid',

      fgColor: {
        argb: 'FFFFF0DF',
      },
    };

    hojaResumen.addRow({});

    [
      ['Fecha de generación', this.formatearFecha(new Date())],
      ['Total de cursos', resumen.total],
      ['Cursos activos', resumen.activos],
      ['Cursos inactivos', resumen.inactivos],
      ['Cursos finalizados', resumen.finalizados],
    ].forEach((fila) => {
      hojaResumen.addRow({
        concepto: fila[0],

        valor: fila[1],
      });
    });

    hojaResumen.eachRow((fila, numero) => {
      if (numero >= 4) {
        fila.getCell(1).font = {
          bold: true,

          color: {
            argb: 'FFC46A2C',
          },
        };

        fila.eachCell((celda) => {
          celda.border = {
            top: {
              style: 'thin',

              color: {
                argb: 'FFF2DCC5',
              },
            },

            left: {
              style: 'thin',

              color: {
                argb: 'FFF2DCC5',
              },
            },

            bottom: {
              style: 'thin',

              color: {
                argb: 'FFF2DCC5',
              },
            },

            right: {
              style: 'thin',

              color: {
                argb: 'FFF2DCC5',
              },
            },
          };
        });
      }
    });

    const hojaCursos = libro.addWorksheet('Cursos', {
      views: [
        {
          state: 'frozen',

          ySplit: 1,
        },
      ],
    });

    hojaCursos.columns = [
      {
        header: 'ID',
        key: 'id',
        width: 9,
      },
      {
        header: 'Materia',
        key: 'materia',
        width: 32,
      },
      {
        header: 'Código',
        key: 'codigo',
        width: 16,
      },
      {
        header: 'Docente',
        key: 'docente',
        width: 32,
      },
      {
        header: 'Correo docente',
        key: 'correo',
        width: 38,
      },
      {
        header: 'Gestión',
        key: 'gestion',
        width: 14,
      },
      {
        header: 'Paralelo',
        key: 'paralelo',
        width: 12,
      },
      {
        header: 'Semestre',
        key: 'semestre',
        width: 12,
      },
      {
        header: 'Cupo máximo',
        key: 'cupoMaximo',
        width: 15,
      },
      {
        header: 'Estado',
        key: 'estado',
        width: 16,
      },
      {
        header: 'Creado en',
        key: 'creadoEn',
        width: 24,
      },
      {
        header: 'Finalizado en',
        key: 'finalizadoEn',
        width: 24,
      },
    ];

    cursos.forEach((curso) => {
      hojaCursos.addRow({
        id: curso.id,

        materia: curso.materia.nombre,

        codigo: curso.materia.codigo,

        docente: this.nombreDocente(curso),

        correo: curso.docente.correo,

        gestion: curso.gestion,

        paralelo: curso.paralelo,

        semestre: curso.semestre,

        cupoMaximo: curso.cupoMaximo ?? 'Sin límite',

        estado: this.obtenerEtiquetaEstado(curso.estado),

        creadoEn: this.formatearFecha(curso.creadoEn),

        finalizadoEn: curso.finalizadoEn
          ? this.formatearFecha(curso.finalizadoEn)
          : '',
      });
    });

    const cabecera = hojaCursos.getRow(1);

    cabecera.height = 28;

    cabecera.eachCell((celda) => {
      celda.font = {
        bold: true,

        color: {
          argb: 'FFFFFFFF',
        },
      };

      celda.fill = {
        type: 'pattern',

        pattern: 'solid',

        fgColor: {
          argb: 'FFF18B4B',
        },
      };

      celda.alignment = {
        vertical: 'middle',

        horizontal: 'center',
      };
    });

    hojaCursos.autoFilter = {
      from: 'A1',

      to: 'L1',
    };

    hojaCursos.eachRow((fila, numero) => {
      if (numero === 1) {
        return;
      }

      fila.height = 24;

      fila.eachCell((celda) => {
        celda.alignment = {
          vertical: 'middle',

          wrapText: true,
        };

        celda.border = {
          bottom: {
            style: 'hair',

            color: {
              argb: 'FFE5E7EB',
            },
          },
        };
      });

      if (numero % 2 === 0) {
        fila.eachCell((celda) => {
          celda.fill = {
            type: 'pattern',

            pattern: 'solid',

            fgColor: {
              argb: 'FFFFFCF8',
            },
          };
        });
      }
    });

    const resultado = await libro.xlsx.writeBuffer();

    return Buffer.from(resultado);
  }
}
