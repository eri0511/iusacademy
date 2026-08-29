import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  PrismaService,
} from '../../prisma/prisma.service';

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
  CalificacionesService,
} from './calificaciones.service';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

type FilaReporteLibro = Record<string, ValorCeldaReporte>;

@Injectable()
export class CalificacionesReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calificacionesService: CalificacionesService,
    private readonly reportesVerificacionService: ReportesVerificacionService,
  ) {}

  async generarLibro(
    usuario: UsuarioAutenticado,
    cursoId: number,
    hitoId: number,
    formatoSolicitado: string,
  ): Promise<ArchivoReporteGenerado> {
    const formato = this.normalizarFormato(formatoSolicitado);

    const libro =
      await this.calificacionesService.obtenerLibroDocente(
        usuario,
        cursoId,
        hitoId,
      );

    const generador =
      await this.prisma.usuario.findUnique({
        where: {
          id: usuario.id,
        },
        select: {
          nombres: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
        },
      });

    const nombreGenerador = generador
      ? [
          generador.nombres,
          generador.apellidoPaterno,
          generador.apellidoMaterno,
        ]
          .filter(Boolean)
          .join(' ')
      : 'Docente';

    const actividadesContinua =
      libro.actividades.filter(
        (actividad) =>
          actividad.componente === 'CONTINUA' &&
          actividad.estado !== 'ANULADA',
      );

    const actividadesProcesual =
      libro.actividades.filter(
        (actividad) =>
          actividad.componente === 'PROCESUAL' &&
          actividad.estado !== 'ANULADA',
      );

    const construirSeccion = (
      id: string,
      titulo: string,
      actividades: typeof libro.actividades,
      componente: 'CONTINUA' | 'PROCESUAL',
    ) => {
      const filas: FilaReporteLibro[] =
        libro.estudiantes.map((estudiante) => {
          const fila: FilaReporteLibro = {
            estudiante: [
              estudiante.apellidoPaterno,
              estudiante.apellidoMaterno,
              estudiante.nombres,
            ]
              .filter(Boolean)
              .join(' '),
            correo: estudiante.correo,
          };

          for (const actividad of actividades) {
            const calificacion =
              actividad.calificaciones.find(
                (item) => item.estudianteId === estudiante.id,
              );

            fila[`actividad_${actividad.id}`] = calificacion
              ? this.dosDecimales(calificacion.notaFinal)
              : 'Pend.';
          }

          const resumen =
            componente === 'CONTINUA'
              ? estudiante.continua
              : estudiante.procesual;

          fila.promedio = this.dosDecimales(
            resumen.promedioSobre100,
          );
          fila.aporte = this.dosDecimales(
            resumen.notaExacta,
          );
          fila.aporteMaximo = resumen.maximo;
          fila.notaFinal = resumen.notaRedondeada;
          fila.notaFinalMaximo = resumen.maximo;
          fila.estado =
            resumen.actividadesCalificadas === 0
              ? 'Sin calificaciones'
              : resumen.actividadesPendientes > 0
                ? 'En seguimiento'
                : 'Completo';

          return fila;
        });

      return {
        id,
        titulo,
        descripcion:
          'Promedio y aporte mantienen dos decimales. La nota final es el aporte redondeado al entero más cercano. “Pend.” indica que todavía no existe una calificación registrada.',
        mostrarEncabezado: true,
        mostrarNumeroFila: true,
        columnas: [
          {
            clave: 'estudiante',
            etiqueta: 'Estudiante',
            tipo: TipoDatoReporte.TEXTO,
            ancho: 1.9,
          },
          {
            clave: 'correo',
            etiqueta: 'Correo',
            tipo: TipoDatoReporte.TEXTO,
            ancho: 1.7,
          },
          ...actividades.map((actividad) => ({
            clave: `actividad_${actividad.id}`,
            etiqueta: `${this.etiquetaOrigen(actividad.origen)} · ${actividad.titulo}`,
            tipo: TipoDatoReporte.TEXTO,
            ancho: 1.05,
            alineacion: AlineacionReporte.CENTRO,
          })),
          {
            clave: 'promedio',
            etiqueta: 'Promedio /100',
            tipo: TipoDatoReporte.DECIMAL,
            ancho: .85,
            alineacion: AlineacionReporte.DERECHA,
          },
          {
            clave: 'aporte',
            etiqueta: 'Aporte exacto',
            tipo: TipoDatoReporte.DECIMAL,
            ancho: .85,
            alineacion: AlineacionReporte.DERECHA,
          },
          {
            clave: 'aporteMaximo',
            etiqueta: 'Sobre',
            tipo: TipoDatoReporte.NUMERO,
            ancho: .55,
            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'notaFinal',
            etiqueta: 'Nota final',
            tipo: TipoDatoReporte.NUMERO,
            ancho: .75,
            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'notaFinalMaximo',
            etiqueta: 'Sobre',
            tipo: TipoDatoReporte.NUMERO,
            ancho: .55,
            alineacion: AlineacionReporte.CENTRO,
          },
          {
            clave: 'estado',
            etiqueta: 'Seguimiento',
            tipo: TipoDatoReporte.TEXTO,
            ancho: .95,
            alineacion: AlineacionReporte.CENTRO,
          },
        ],
        filas,
      };
    };

    const resumenGeneral: FilaReporteLibro[] = [
      {
        componente: 'Continua',
        actividades: actividadesContinua.length,
        puntaje: libro.hito.puntajeContinua,
        estudiantes: libro.estudiantes.length,
      },
      {
        componente: 'Procesual',
        actividades: actividadesProcesual.length,
        puntaje: libro.hito.puntajeProcesual,
        estudiantes: libro.estudiantes.length,
      },
    ];

    const definicion: DefinicionReporte<FilaReporteLibro> = {
      metadatos: {
        titulo: 'Libro de calificaciones',
        subtitulo: `${libro.curso.materia.nombre} · ${libro.hito.codigo}`,
        descripcion:
          'Consolidado docente de evaluación continua y procesual del hito académico seleccionado.',
        generadoPor: nombreGenerador,
        filtros: {
          Curso: libro.curso.materia.codigo,
          Materia: libro.curso.materia.nombre,
          Hito: libro.hito.codigo,
          Estudiantes: libro.estudiantes.length,
          'Puntaje continua': libro.hito.puntajeContinua,
          'Puntaje procesual': libro.hito.puntajeProcesual,
        },
        textoPie:
          'IusAcademy · Formación jurídica por competencias · UNIFRANZ',
      },
      opciones: {
        orientacion: OrientacionReporte.HORIZONTAL,
        incluirQr: true,
        incluirFiltros: true,
        incluirFechaHora: true,
        nombreHojaExcel: 'Libro calificaciones',
        incluirBomCsv: true,
      },
      secciones: [
        {
          id: 'resumen',
          titulo: 'Resumen del hito',
          mostrarNumeroFila: false,
          columnas: [
            {
              clave: 'componente',
              etiqueta: 'Componente',
              tipo: TipoDatoReporte.TEXTO,
              ancho: 1.5,
            },
            {
              clave: 'actividades',
              etiqueta: 'Actividades',
              tipo: TipoDatoReporte.NUMERO,
              alineacion: AlineacionReporte.CENTRO,
            },
            {
              clave: 'puntaje',
              etiqueta: 'Puntaje',
              tipo: TipoDatoReporte.NUMERO,
              alineacion: AlineacionReporte.CENTRO,
            },
            {
              clave: 'estudiantes',
              etiqueta: 'Estudiantes',
              tipo: TipoDatoReporte.NUMERO,
              alineacion: AlineacionReporte.CENTRO,
            },
          ],
          filas: resumenGeneral,
        },
        construirSeccion(
          'continua',
          'Evaluación continua',
          actividadesContinua,
          'CONTINUA',
        ),
        construirSeccion(
          'procesual',
          'Evaluación procesual',
          actividadesProcesual,
          'PROCESUAL',
        ),
      ],
    };

    return this.reportesVerificacionService.generarVerificable(
      formato,
      definicion,
      {
        tipo: 'LIBRO_CALIFICACIONES_HITO',
        generadoPorId: usuario.id,
        filtros: {
          cursoId,
          hitoId,
          hito: libro.hito.codigo,
          formato,
        },
      },
      `libro-calificaciones-${libro.hito.codigo.toLowerCase()}-iusacademy`,
    );
  }

  private normalizarFormato(
    formatoSolicitado: string,
  ): FormatoReporte {
    const formato = formatoSolicitado
      .trim()
      .toUpperCase();

    if (
      formato === FormatoReporte.PDF ||
      formato === FormatoReporte.EXCEL ||
      formato === FormatoReporte.CSV
    ) {
      return formato as FormatoReporte;
    }

    throw new BadRequestException(
      'Formato no disponible. Use PDF, EXCEL o CSV.',
    );
  }

  private dosDecimales(valor: unknown): number {
    const numero = Number(valor ?? 0);
    return Number.isFinite(numero)
      ? Number(numero.toFixed(2))
      : 0;
  }

  private etiquetaOrigen(valor: unknown): string {
    if (valor === 'FORO') return 'Foro';
    if (valor === 'TAREA') return 'Tarea';
    if (valor === 'QUIZ') return 'Quiz';
    return String(valor ?? 'Actividad');
  }
}
