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

import { TareasEvaluacionService } from './tareas-evaluacion.service';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

type FilaResumenTarea = Record<string, ValorCeldaReporte> & {
  estudiantes: number;

  calificadas: number;

  pendientes: number;

  sinEntrega: number;

  puntajeMaximo: number;
};

type FilaCalificacionPdf = Record<string, ValorCeldaReporte> & {
  estudiante: string;

  grupo: string;

  entrega: string;

  notaBase: number | null;

  descuento: number | null;

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

  grupo: string;

  entrega: string;

  notaBase: number | null;

  descuento: number | null;

  ajuste: number | null;

  notaFinal: number | null;

  estado: string;

  retroalimentacion: string;
};

type FilaReporteTarea =
  | FilaResumenTarea
  | FilaCalificacionPdf
  | FilaRetroalimentacionPdf
  | FilaCalificacionCompleta;

@Injectable()
export class TareasReportesService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly evaluacionService: TareasEvaluacionService,

    private readonly reportesVerificacionService: ReportesVerificacionService,
  ) {}

  async generarCalificaciones(
    usuario: UsuarioAutenticado,

    cursoId: number,

    tareaId: number,

    formatoSolicitado: string,
  ): Promise<ArchivoReporteGenerado> {
    const formato = this.normalizarFormato(formatoSolicitado);

    const panel = await this.evaluacionService.obtenerPanel(
      usuario,
      cursoId,
      tareaId,
    );

    if (!panel.tarea.esCalificable) {
      throw new BadRequestException('La tarea no es calificable.');
    }

    const puntajeMaximo = Number(panel.tarea.puntajeMaximo ?? 100);

    const esGrupal = panel.tarea.modalidad === 'GRUPAL';

    const nombreGenerador = await this.obtenerNombreGenerador(usuario);

    const filasCompletas: FilaCalificacionCompleta[] = panel.calificaciones.map(
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

          grupo: esGrupal ? (item.grupo?.nombre ?? 'Sin grupo') : '—',

          entrega: !item.entrega
            ? 'No presentó'
            : item.entrega.entregadaTarde || item.entrega.estado === 'TARDIA'
              ? 'Fuera de plazo'
              : 'A tiempo',

          notaBase: this.numeroONull(calificacion?.notaBase),

          descuento: this.numeroONull(calificacion?.descuentoRetraso),

          ajuste: this.numeroONull(calificacion?.ajusteIndividual),

          notaFinal: this.numeroONull(calificacion?.notaFinal),

          estado: this.etiqueta(calificacion?.estado ?? 'PENDIENTE'),

          retroalimentacion: calificacion?.retroalimentacion?.trim() || '—',
        };
      },
    );

    const sinEntrega = panel.calificaciones.filter(
      (item) => !item.entrega,
    ).length;

    const resumen: FilaResumenTarea = {
      estudiantes: panel.resumen.totalEstudiantes,

      calificadas: panel.resumen.calificadas,

      pendientes: Math.max(
        0,
        panel.resumen.totalEstudiantes - panel.resumen.calificadas,
      ),

      sinEntrega,

      puntajeMaximo,
    };

    const definicion: DefinicionReporte<FilaReporteTarea> = {
      metadatos: {
        titulo: 'Calificaciones de la tarea',

        subtitulo: panel.tarea.titulo,

        descripcion:
          'Resumen académico de entregas, calificaciones y retroalimentación de la tarea.',

        generadoPor: nombreGenerador,

        filtros: {
          Estado: this.etiqueta(panel.tarea.estado),

          'Estado de notas': this.etiqueta(
            panel.tarea.estadoActividadCalificable ?? 'PENDIENTE',
          ),

          Modalidad: this.etiqueta(panel.tarea.modalidad),

          Componente: this.etiqueta(panel.tarea.componente),
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
          ? this.construirSeccionesPdf(resumen, filasCompletas, esGrupal)
          : this.construirSeccionesDatos(resumen, filasCompletas, esGrupal),
    };

    return this.reportesVerificacionService.generarVerificable(
      formato,
      definicion,
      {
        tipo: 'TAREA_CALIFICACIONES',

        generadoPorId: usuario.id,

        filtros: {
          cursoId,
          tareaId,

          estado: String(panel.tarea.estado),

          estadoActividadCalificable: String(
            panel.tarea.estadoActividadCalificable ?? 'PENDIENTE',
          ),

          modalidad: String(panel.tarea.modalidad),

          componente: String(panel.tarea.componente),
        },
      },
      `calificaciones-tarea-${tareaId}-iusacademy`,
    );
  }

  private construirSeccionesPdf(
    resumen: FilaResumenTarea,

    filas: FilaCalificacionCompleta[],

    esGrupal: boolean,
  ): DefinicionReporte<FilaReporteTarea>['secciones'] {
    const detalle: FilaCalificacionPdf[] = filas.map((fila) => ({
      estudiante: fila.estudiante,

      grupo: fila.grupo,

      entrega: fila.entrega,

      notaBase: fila.notaBase,

      descuento: fila.descuento,

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

    const columnasDetalle: NonNullable<
      DefinicionReporte<FilaReporteTarea>['secciones']
    >[number]['columnas'] = [
      {
        clave: 'estudiante',

        etiqueta: 'Estudiante',

        tipo: TipoDatoReporte.TEXTO,

        ancho: esGrupal ? 1.85 : 2.1,
      },

      ...(esGrupal
        ? [
            {
              clave: 'grupo',

              etiqueta: 'Grupo',

              tipo: TipoDatoReporte.TEXTO,

              ancho: 1.1,

              alineacion: AlineacionReporte.CENTRO,
            },
          ]
        : []),

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

        ancho: 0.8,

        alineacion: AlineacionReporte.DERECHA,
      },

      {
        clave: 'descuento',

        etiqueta: 'Desc.',

        tipo: TipoDatoReporte.DECIMAL,

        ancho: 0.8,

        alineacion: AlineacionReporte.DERECHA,
      },

      {
        clave: 'ajuste',

        etiqueta: 'Ajuste',

        tipo: TipoDatoReporte.DECIMAL,

        ancho: 0.8,

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

        ancho: 1.05,

        alineacion: AlineacionReporte.CENTRO,
      },
    ];

    return [
      {
        id: 'resumen',

        titulo: 'Resumen general',

        filas: [resumen],

        mostrarNumeroFila: false,

        columnas: this.columnasResumen(),
      },

      {
        id: 'calificaciones',

        titulo: 'Detalle de calificaciones',

        descripcion: `${resumen.calificadas} calificados · ${resumen.pendientes} pendientes · ${resumen.sinEntrega} sin entrega`,

        mostrarEncabezado: true,

        mostrarNumeroFila: true,

        columnas: columnasDetalle,

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
    resumen: FilaResumenTarea,

    filas: FilaCalificacionCompleta[],

    esGrupal: boolean,
  ): DefinicionReporte<FilaReporteTarea>['secciones'] {
    const columnasDetalle: NonNullable<
      DefinicionReporte<FilaReporteTarea>['secciones']
    >[number]['columnas'] = [
      {
        clave: 'estudiante',

        etiqueta: 'Estudiante',

        tipo: TipoDatoReporte.TEXTO,

        ancho: 1.6,
      },

      {
        clave: 'correo',

        etiqueta: 'Correo',

        tipo: TipoDatoReporte.TEXTO,

        ancho: 1.8,
      },

      ...(esGrupal
        ? [
            {
              clave: 'grupo',

              etiqueta: 'Grupo',

              tipo: TipoDatoReporte.TEXTO,

              ancho: 1.1,

              alineacion: AlineacionReporte.CENTRO,
            },
          ]
        : []),

      {
        clave: 'entrega',

        etiqueta: 'Entrega',

        tipo: TipoDatoReporte.TEXTO,

        ancho: 1.05,

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

        tipo: TipoDatoReporte.TEXTO,

        ancho: 0.9,

        alineacion: AlineacionReporte.CENTRO,
      },

      {
        clave: 'retroalimentacion',

        etiqueta: 'Retroalimentación',

        tipo: TipoDatoReporte.TEXTO,

        ancho: 2,
      },
    ];

    return [
      {
        id: 'resumen',

        titulo: 'Resumen general',

        filas: [resumen],

        mostrarNumeroFila: false,

        columnas: this.columnasResumen(),
      },

      {
        id: 'calificaciones',

        titulo: 'Detalle de calificaciones',

        descripcion: `${resumen.calificadas} calificados · ${resumen.pendientes} pendientes · ${resumen.sinEntrega} sin entrega`,

        mostrarEncabezado: true,

        mostrarNumeroFila: true,

        columnas: columnasDetalle,

        filas,
      },
    ];
  }

  private columnasResumen(): NonNullable<
    DefinicionReporte<FilaReporteTarea>['secciones']
  >[number]['columnas'] {
    return [
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
        clave: 'sinEntrega',

        etiqueta: 'Sin entrega',

        tipo: TipoDatoReporte.NUMERO,

        alineacion: AlineacionReporte.CENTRO,
      },

      {
        clave: 'puntajeMaximo',

        etiqueta: 'Puntaje máximo',

        tipo: TipoDatoReporte.NUMERO,

        alineacion: AlineacionReporte.CENTRO,
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
    const texto =
      valor === null || valor === undefined
        ? '—'
        : typeof valor === 'string' ||
            typeof valor === 'number' ||
            typeof valor === 'boolean' ||
            typeof valor === 'bigint'
          ? String(valor)
          : '—';

    return texto
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./, (caracter) => caracter.toUpperCase());
  }

  private normalizarFormato(formato: string): FormatoReporte {
    const valor = formato.trim().toUpperCase() as FormatoReporte;

    if (Object.values(FormatoReporte).includes(valor)) {
      return valor;
    }

    throw new BadRequestException(
      'Formato no disponible. Use PDF, EXCEL o CSV.',
    );
  }
}
