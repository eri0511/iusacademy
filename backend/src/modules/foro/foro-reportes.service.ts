import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import {
  AlineacionReporte,
  ArchivoReporteGenerado,
  DefinicionReporte,
  FormatoReporte,
  OrientacionReporte,
  ReportesVerificacionService,
  TipoDatoReporte,
  ValorCeldaReporte,
} from '../reportes';

import { ForoCalificacionService } from './foro-calificacion.service';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

type FilaResumenForo = Record<string, ValorCeldaReporte> & {
  estudiantes: number;
  calificadas: number;
  pendientes: number;
  sinRespuesta: number;
  puntajeMaximo: number;
};

type FilaCalificacionPdf = Record<string, ValorCeldaReporte> & {
  estudiante: string;
  participacion: string;
  entrega: string;
  notaBase: number | null;
  descuento: number | null;
  descuentoComentarios: number | null;
  ajuste: number | null;
  notaFinal: number | null;
  estado: string;
};

type FilaRetroalimentacionPdf = Record<string, ValorCeldaReporte> & {
  estudiante: string;
  retroalimentacion: string;
};

type FilaCalificacionCompleta = Record<string, ValorCeldaReporte> & {
  estudiante: string;
  correo: string;
  participacion: string;
  entrega: string;
  notaBase: number | null;
  descuento: number | null;
  descuentoComentarios: number | null;
  ajuste: number | null;
  notaFinal: number | null;
  estado: string;
  retroalimentacion: string;
};

type FilaReporteForo =
  | FilaResumenForo
  | FilaCalificacionPdf
  | FilaRetroalimentacionPdf
  | FilaCalificacionCompleta;

@Injectable()
export class ForoReportesService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly calificacionService: ForoCalificacionService,

    private readonly reportesVerificacionService: ReportesVerificacionService,
  ) {}

  async generarCalificaciones(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    formatoSolicitado: string,
  ): Promise<ArchivoReporteGenerado> {
    const formato = this.normalizarFormato(formatoSolicitado);

    const panel = await this.calificacionService.obtenerPanel(
      usuario,
      cursoId,
      foroId,
    );

    const puntajeMaximo = Number(panel.actividad.puntajeMaximo ?? 100);

    const nombreGenerador = await this.obtenerNombreGenerador(usuario);

    const filasCompletas: FilaCalificacionCompleta[] = panel.estudiantes.map(
      (item) => {
        const calificacion = item.calificacion;

        return {
          estudiante: [
            item.estudiante.nombres,
            item.estudiante.apellidoPaterno,
            item.estudiante.apellidoMaterno,
          ]
            .filter(Boolean)
            .join(' '),

          correo: item.estudiante.correo ?? '—',

          participacion: item.tieneRespuesta ? 'Participó' : 'Sin respuesta',

          entrega: !item.tieneRespuesta
            ? '—'
            : item.entregadaTarde
              ? 'Fuera de plazo'
              : 'A tiempo',

          notaBase: this.numeroONull(calificacion?.notaBase),

          descuento: this.numeroONull(calificacion?.descuentoRetraso),

          descuentoComentarios: this.numeroONull(
            calificacion?.descuentoComentarios,
          ),

          ajuste: this.numeroONull(calificacion?.ajusteIndividual),

          notaFinal: this.numeroONull(calificacion?.notaFinal),

          estado: this.etiqueta(item.estado),

          retroalimentacion: calificacion?.retroalimentacion?.trim() || '—',
        };
      },
    );

    const resumen: FilaResumenForo = {
      estudiantes: panel.resumen.totalEstudiantes,

      calificadas: panel.resumen.calificadas,

      pendientes: panel.resumen.pendientes,

      sinRespuesta: panel.resumen.sinRespuesta,

      puntajeMaximo,
    };

    const definicion: DefinicionReporte<FilaReporteForo> = {
      metadatos: {
        titulo: 'Calificaciones del foro',

        subtitulo: panel.foro.titulo,

        descripcion:
          'Resumen académico de participación, entrega y resultados obtenidos por los estudiantes en el foro.',

        generadoPor: nombreGenerador,

        filtros: {
          Estado: this.etiqueta(panel.foro.estado),

          Evaluación: this.etiqueta(panel.foro.tipoEvaluacion),

          'Modalidad de nota': this.etiqueta(panel.foro.modalidadNota),
        },

        textoPie: 'IusAcademy · Formación jurídica por competencias · UNIFRANZ',
      },

      opciones: {
        orientacion: OrientacionReporte.HORIZONTAL,

        incluirQr: true,

        incluirFiltros: true,

        incluirFechaHora: true,

        nombreHojaExcel: 'Calificaciones',

        incluirBomCsv: true,
      },

      secciones:
        formato === FormatoReporte.PDF
          ? this.construirSeccionesPdf(
              resumen,
              filasCompletas,
              panel.resumen.calificadas,
              panel.resumen.pendientes,
              panel.resumen.sinRespuesta,
            )
          : this.construirSeccionesDatos(
              resumen,
              filasCompletas,
              panel.resumen.calificadas,
              panel.resumen.pendientes,
              panel.resumen.sinRespuesta,
            ),
    };

    return this.reportesVerificacionService.generarVerificable(
      formato,
      definicion,
      {
        tipo: 'FORO_CALIFICACIONES',

        generadoPorId: usuario.id,

        filtros: {
          cursoId,
          foroId,

          estado: String(panel.foro.estado),

          tipoEvaluacion: String(panel.foro.tipoEvaluacion),

          modalidadNota: String(panel.foro.modalidadNota),
        },
      },
      `calificaciones-foro-${foroId}-iusacademy`,
    );
  }

  private construirSeccionesPdf(
    resumen: FilaResumenForo,

    filas: FilaCalificacionCompleta[],

    calificadas: number,

    pendientes: number,

    sinRespuesta: number,
  ): DefinicionReporte<FilaReporteForo>['secciones'] {
    const detalle: FilaCalificacionPdf[] = filas.map((fila) => ({
      estudiante: fila.estudiante,

      participacion: fila.participacion,

      entrega: fila.entrega,

      notaBase: fila.notaBase,

      descuento: fila.descuento,

      descuentoComentarios: fila.descuentoComentarios,

      ajuste: fila.ajuste,

      notaFinal: fila.notaFinal,

      estado: fila.estado,
    }));

    const retroalimentaciones: FilaRetroalimentacionPdf[] = filas.map(
      (fila) => ({
        estudiante: fila.estudiante,

        retroalimentacion: fila.retroalimentacion,
      }),
    );

    return [
      {
        id: 'resumen',

        titulo: 'Resumen general',

        filas: [resumen],

        mostrarNumeroFila: false,

        columnas: [
          {
            clave: 'estudiantes',

            etiqueta: 'Estudiantes',

            tipo: TipoDatoReporte.NUMERO,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'calificadas',

            etiqueta: 'Calificados',

            tipo: TipoDatoReporte.NUMERO,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'pendientes',

            etiqueta: 'Pendientes',

            tipo: TipoDatoReporte.NUMERO,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'sinRespuesta',

            etiqueta: 'Sin respuesta',

            tipo: TipoDatoReporte.NUMERO,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'puntajeMaximo',

            etiqueta: 'Puntaje máximo',

            tipo: TipoDatoReporte.NUMERO,

            alineacion: AlineacionReporte.CENTRO,
          },
        ],
      },
      {
        id: 'calificaciones',

        titulo: 'Detalle de calificaciones',

        descripcion: `${calificadas} calificados · ${pendientes} pendientes · ${sinRespuesta} sin respuesta`,

        mostrarEncabezado: true,

        mostrarNumeroFila: true,

        columnas: [
          {
            clave: 'estudiante',

            etiqueta: 'Estudiante',

            tipo: TipoDatoReporte.TEXTO,

            ancho: 2.05,
          },
          {
            clave: 'participacion',

            etiqueta: 'Participación',

            tipo: TipoDatoReporte.TEXTO,

            ancho: 1.2,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'entrega',

            etiqueta: 'Entrega',

            tipo: TipoDatoReporte.TEXTO,

            ancho: 1.1,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'notaBase',

            etiqueta: 'Base',

            tipo: TipoDatoReporte.DECIMAL,

            ancho: 0.82,

            alineacion: AlineacionReporte.DERECHA,
          },
          {
            clave: 'descuento',

            etiqueta: 'Desc.',

            tipo: TipoDatoReporte.DECIMAL,

            ancho: 0.82,

            alineacion: AlineacionReporte.DERECHA,
          },
          {
            clave: 'ajuste',

            etiqueta: 'Ajuste',

            tipo: TipoDatoReporte.DECIMAL,

            ancho: 0.82,

            alineacion: AlineacionReporte.DERECHA,
          },
          {
            clave: 'notaFinal',

            etiqueta: 'Final',

            tipo: TipoDatoReporte.DECIMAL,

            ancho: 0.9,

            alineacion: AlineacionReporte.DERECHA,
          },
          {
            clave: 'estado',

            etiqueta: 'Estado',

            tipo: TipoDatoReporte.TEXTO,

            ancho: 1.1,

            alineacion: AlineacionReporte.CENTRO,
          },
        ],

        filas: detalle,
      },
      {
        id: 'retroalimentacion',

        titulo: 'Retroalimentación',

        descripcion: 'Observaciones registradas para cada estudiante.',

        mostrarEncabezado: true,

        mostrarNumeroFila: true,

        columnas: [
          {
            clave: 'estudiante',

            etiqueta: 'Estudiante',

            tipo: TipoDatoReporte.TEXTO,

            ancho: 2.1,
          },
          {
            clave: 'retroalimentacion',

            etiqueta: 'Retroalimentación',

            tipo: TipoDatoReporte.TEXTO,

            ancho: 5.9,
          },
        ],

        filas: retroalimentaciones,
      },
    ];
  }

  private construirSeccionesDatos(
    resumen: FilaResumenForo,

    filas: FilaCalificacionCompleta[],

    calificadas: number,

    pendientes: number,

    sinRespuesta: number,
  ): DefinicionReporte<FilaReporteForo>['secciones'] {
    return [
      {
        id: 'resumen',

        titulo: 'Resumen general',

        filas: [resumen],

        mostrarNumeroFila: false,

        columnas: [
          {
            clave: 'estudiantes',

            etiqueta: 'Estudiantes',

            tipo: TipoDatoReporte.NUMERO,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'calificadas',

            etiqueta: 'Calificados',

            tipo: TipoDatoReporte.NUMERO,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'pendientes',

            etiqueta: 'Pendientes',

            tipo: TipoDatoReporte.NUMERO,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'sinRespuesta',

            etiqueta: 'Sin respuesta',

            tipo: TipoDatoReporte.NUMERO,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'puntajeMaximo',

            etiqueta: 'Puntaje máximo',

            tipo: TipoDatoReporte.NUMERO,

            alineacion: AlineacionReporte.CENTRO,
          },
        ],
      },
      {
        id: 'calificaciones',

        titulo: 'Detalle de calificaciones',

        descripcion: `${calificadas} calificados · ${pendientes} pendientes · ${sinRespuesta} sin respuesta`,

        mostrarEncabezado: true,

        mostrarNumeroFila: true,

        columnas: [
          {
            clave: 'estudiante',

            etiqueta: 'Estudiante',

            ancho: 1.6,
          },
          {
            clave: 'correo',

            etiqueta: 'Correo',

            ancho: 1.8,
          },
          {
            clave: 'participacion',

            etiqueta: 'Participación',

            ancho: 1.05,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'entrega',

            etiqueta: 'Entrega',

            ancho: 1,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'notaBase',

            etiqueta: 'Base',

            tipo: TipoDatoReporte.DECIMAL,

            ancho: 0.75,

            alineacion: AlineacionReporte.DERECHA,
          },
          {
            clave: 'descuento',

            etiqueta: 'Desc.',

            tipo: TipoDatoReporte.DECIMAL,

            ancho: 0.75,

            alineacion: AlineacionReporte.DERECHA,
          },
          {
            clave: 'ajuste',

            etiqueta: 'Ajuste',

            tipo: TipoDatoReporte.DECIMAL,

            ancho: 0.75,

            alineacion: AlineacionReporte.DERECHA,
          },
          {
            clave: 'notaFinal',

            etiqueta: 'Final',

            tipo: TipoDatoReporte.DECIMAL,

            ancho: 0.8,

            alineacion: AlineacionReporte.DERECHA,
          },
          {
            clave: 'estado',

            etiqueta: 'Estado',

            ancho: 0.9,

            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'retroalimentacion',

            etiqueta: 'Retroalimentación',

            ancho: 2,
          },
        ],

        filas,
      },
    ];
  }

  private async obtenerNombreGenerador(
    usuario: UsuarioAutenticado,
  ): Promise<string> {
    const datos = await this.prisma.usuario.findUnique({
      where: {
        id: usuario.id,
      },

      select: {
        nombres: true,

        apellidoPaterno: true,
      },
    });

    const nombre = [datos?.nombres, datos?.apellidoPaterno]
      .filter(Boolean)
      .join(' ')
      .trim();

    return nombre || usuario.correo;
  }

  private numeroONull(valor: unknown): number | null {
    if (valor === null || valor === undefined) {
      return null;
    }

    const resultado = Number(valor);

    return Number.isFinite(resultado) ? resultado : null;
  }

  private etiqueta(valor: unknown): string {
    return String(valor ?? '—')
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (caracter) => caracter.toUpperCase());
  }

  private normalizarFormato(formato: string): FormatoReporte {
    const valor = formato.trim().toUpperCase();

    if (
      valor === FormatoReporte.PDF ||
      valor === FormatoReporte.EXCEL ||
      valor === FormatoReporte.CSV
    ) {
      return valor;
    }

    throw new BadRequestException(
      'Formato no disponible. Use PDF, EXCEL o CSV.',
    );
  }
}
