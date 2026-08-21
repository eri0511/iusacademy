import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

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

import {
  ForoCalificacionService,
} from './foro-calificacion.service';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

type FilaResumenForo = Record<
  string,
  ValorCeldaReporte
> & {
  estudiantes: number;
  calificadas: number;
  pendientes: number;
  sinRespuesta: number;
  puntajeMaximo: number;
};

type FilaCalificacionesForo = Record<
  string,
  ValorCeldaReporte
> & {
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

@Injectable()
export class ForoReportesService {
  constructor(
    private readonly calificacionService:
      ForoCalificacionService,

    private readonly reportesVerificacionService:
      ReportesVerificacionService,
  ) {}

  async generarCalificaciones(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    formatoSolicitado: string,
  ): Promise<ArchivoReporteGenerado> {
    const formato =
      this.normalizarFormato(
        formatoSolicitado,
      );

    const panel =
      await this.calificacionService.obtenerPanel(
        usuario,
        cursoId,
        foroId,
      );

    const puntajeMaximo =
      Number(
        panel.actividad.puntajeMaximo ??
          100,
      );

    const filas:
      FilaCalificacionesForo[] =
      panel.estudiantes.map(
        (item) => {
          const calificacion =
            item.calificacion;

          return {
            estudiante: [
              item.estudiante.nombres,
              item.estudiante.apellidoPaterno,
              item.estudiante.apellidoMaterno,
            ]
              .filter(Boolean)
              .join(' '),

            correo:
              item.estudiante.correo ??
              '—',

            participacion:
              item.tieneRespuesta
                ? 'Participó'
                : 'Sin respuesta',

            entrega:
              !item.tieneRespuesta
                ? '—'
                : item.entregadaTarde
                  ? 'Fuera de plazo'
                  : 'A tiempo',

            notaBase:
              this.numeroONull(
                calificacion?.notaBase,
              ),

            descuento:
              this.numeroONull(
                calificacion?.descuentoRetraso,
              ),

            descuentoComentarios:
              this.numeroONull(
                calificacion?.descuentoComentarios,
              ),

            ajuste:
              this.numeroONull(
                calificacion?.ajusteIndividual,
              ),

            notaFinal:
              this.numeroONull(
                calificacion?.notaFinal,
              ),

            estado:
              this.etiqueta(
                item.estado,
              ),

            retroalimentacion:
              calificacion?.retroalimentacion?.trim() ||
              '—',
          };
        },
      );

    const resumen:
      FilaResumenForo = {
        estudiantes:
          panel.resumen.totalEstudiantes,

        calificadas:
          panel.resumen.calificadas,

        pendientes:
          panel.resumen.pendientes,

        sinRespuesta:
          panel.resumen.sinRespuesta,

        puntajeMaximo,
      };

    const generadoPor =
      usuario.correo;

    const definicion:
      DefinicionReporte<
        FilaResumenForo |
        FilaCalificacionesForo
      > = {
        metadatos: {
          titulo:
            'Calificaciones del foro',

          subtitulo:
            panel.foro.titulo,

          descripcion:
            `Reporte académico del foro · ${this.etiqueta(
              panel.actividad.componente,
            )} · Puntaje máximo: ${puntajeMaximo}`,

          generadoPor,

          filtros: {
            Curso:
              String(
                cursoId,
              ),

            Foro:
              String(
                foroId,
              ),

            Estado:
              this.etiqueta(
                panel.foro.estado,
              ),

            Evaluación:
              this.etiqueta(
                panel.foro.tipoEvaluacion,
              ),

            'Modalidad de nota':
              this.etiqueta(
                panel.foro.modalidadNota,
              ),
          },

          textoPie:
            'IusAcademy · Formación jurídica por competencias · UNIFRANZ',
        },

        opciones: {
          orientacion:
            OrientacionReporte.HORIZONTAL,

          incluirQr:
            true,

          incluirFiltros:
            true,

          incluirFechaHora:
            true,

          nombreHojaExcel:
            'Calificaciones',

          incluirBomCsv:
            true,
        },

        secciones: [
          {
            id:
              'resumen',

            titulo:
              'Resumen general',

            filas: [
              resumen,
            ],

            mostrarNumeroFila:
              false,

            columnas: [
              {
                clave:
                  'estudiantes',

                etiqueta:
                  'Estudiantes',

                tipo:
                  TipoDatoReporte.NUMERO,

                alineacion:
                  AlineacionReporte.CENTRO,
              },
              {
                clave:
                  'calificadas',

                etiqueta:
                  'Calificados',

                tipo:
                  TipoDatoReporte.NUMERO,

                alineacion:
                  AlineacionReporte.CENTRO,
              },
              {
                clave:
                  'pendientes',

                etiqueta:
                  'Pendientes',

                tipo:
                  TipoDatoReporte.NUMERO,

                alineacion:
                  AlineacionReporte.CENTRO,
              },
              {
                clave:
                  'sinRespuesta',

                etiqueta:
                  'Sin respuesta',

                tipo:
                  TipoDatoReporte.NUMERO,

                alineacion:
                  AlineacionReporte.CENTRO,
              },
              {
                clave:
                  'puntajeMaximo',

                etiqueta:
                  'Puntaje máximo',

                tipo:
                  TipoDatoReporte.NUMERO,

                alineacion:
                  AlineacionReporte.CENTRO,
              },
            ],
          },
          {
            id:
              'calificaciones',

            titulo:
              'Detalle de calificaciones',

            descripcion:
              `${panel.resumen.calificadas} calificados · ${panel.resumen.pendientes} pendientes · ${panel.resumen.sinRespuesta} sin respuesta`,

            mostrarEncabezado:
              true,

            mostrarNumeroFila:
              true,

            columnas: [
              {
                clave:
                  'estudiante',

                etiqueta:
                  'Estudiante',

                tipo:
                  TipoDatoReporte.TEXTO,

                ancho:
                  1.55,
              },
              {
                clave:
                  'correo',

                etiqueta:
                  'Correo',

                tipo:
                  TipoDatoReporte.TEXTO,

                ancho:
                  1.65,
              },
              {
                clave:
                  'participacion',

                etiqueta:
                  'Participación',

                tipo:
                  TipoDatoReporte.TEXTO,

                ancho:
                  1,

                alineacion:
                  AlineacionReporte.CENTRO,
              },
              {
                clave:
                  'entrega',

                etiqueta:
                  'Entrega',

                tipo:
                  TipoDatoReporte.TEXTO,

                ancho:
                  1,

                alineacion:
                  AlineacionReporte.CENTRO,
              },
              {
                clave:
                  'notaBase',

                etiqueta:
                  'Base',

                tipo:
                  TipoDatoReporte.DECIMAL,

                ancho:
                  .7,

                alineacion:
                  AlineacionReporte.DERECHA,
              },
              {
                clave:
                  'descuento',

                etiqueta:
                  'Desc.',

                tipo:
                  TipoDatoReporte.DECIMAL,

                ancho:
                  .7,

                alineacion:
                  AlineacionReporte.DERECHA,
              },
              {
                clave:
                  'ajuste',

                etiqueta:
                  'Ajuste',

                tipo:
                  TipoDatoReporte.DECIMAL,

                ancho:
                  .7,

                alineacion:
                  AlineacionReporte.DERECHA,
              },
              {
                clave:
                  'notaFinal',

                etiqueta:
                  'Final',

                tipo:
                  TipoDatoReporte.DECIMAL,

                ancho:
                  .75,

                alineacion:
                  AlineacionReporte.DERECHA,
              },
              {
                clave:
                  'estado',

                etiqueta:
                  'Estado',

                tipo:
                  TipoDatoReporte.TEXTO,

                ancho:
                  .9,

                alineacion:
                  AlineacionReporte.CENTRO,
              },
              {
                clave:
                  'retroalimentacion',

                etiqueta:
                  'Retroalimentación',

                tipo:
                  TipoDatoReporte.TEXTO,

                ancho:
                  1.9,
              },
            ],

            filas,
          },
        ],
      };

    return this.reportesVerificacionService.generarVerificable(
      formato,
      definicion,
      {
        tipo:
          'FORO_CALIFICACIONES',

        generadoPorId:
          usuario.id,

        filtros: {
          cursoId,
          foroId,

          estado:
            String(
              panel.foro.estado,
            ),

          tipoEvaluacion:
            String(
              panel.foro.tipoEvaluacion,
            ),

          modalidadNota:
            String(
              panel.foro.modalidadNota,
            ),
        },
      },
      `calificaciones-foro-${foroId}-iusacademy`,
    );
  }

  private numeroONull(
    valor: unknown,
  ): number | null {
    if (
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    const resultado =
      Number(
        valor,
      );

    return Number.isFinite(
      resultado,
    )
      ? resultado
      : null;
  }

  private etiqueta(
    valor: unknown,
  ): string {
    return String(
      valor ??
        '—',
    )
      .replaceAll(
        '_',
        ' ',
      )
      .toLowerCase()
      .replace(
        /^./,
        (
          caracter,
        ) =>
          caracter.toUpperCase(),
      );
  }

  private normalizarFormato(
    formato: string,
  ): FormatoReporte {
    const valor =
      formato
        .trim()
        .toUpperCase();

    if (
      valor === FormatoReporte.PDF ||
      valor === FormatoReporte.EXCEL ||
      valor === FormatoReporte.CSV
    ) {
      return valor as FormatoReporte;
    }

    throw new BadRequestException(
      'Formato no disponible. Use PDF, EXCEL o CSV.',
    );
  }
}