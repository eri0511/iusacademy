import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EstadoInscripcion } from '../../../generated/prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

import {
  AlineacionReporte,
  ArchivoReporteGenerado,
  DefinicionReporte,
  FormatoReporte,
  OrientacionReporte,
  ReportesVerificacionService,
  TipoDatoReporte,
  ValorCeldaReporte,
} from '../../reportes';

type UsuarioAutenticado = {
  id: number;
  correo: string;
};

type FilaResumenEstudiantes = Record<string, ValorCeldaReporte> & {
  inscritos: number;
  cuposDisponibles: number | string;
  ocupacion: number | string;
  nuevosSemana: number;
  conexionReciente: number;
};

type FilaEstudiante = Record<string, ValorCeldaReporte> & {
  estudiante: string;
  correo: string;
  ultimaConexion: Date | null;
  inscripcion: Date;
  estado: string;
};

@Injectable()
export class DocenteEstudiantesReportesService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly reportesVerificacionService: ReportesVerificacionService,
  ) {}

  private normalizarFormato(formatoSolicitado: string): FormatoReporte {
    const formato = formatoSolicitado.trim().toUpperCase() as FormatoReporte;

    if (Object.values(FormatoReporte).includes(formato)) {
      return formato;
    }

    throw new BadRequestException(
      'Formato no disponible. Use PDF, EXCEL o CSV.',
    );
  }

  private estaConexionReciente(fecha: Date | null): boolean {
    if (!fecha) {
      return false;
    }

    return Date.now() - fecha.getTime() <= 15 * 60 * 1000;
  }

  private esInscripcionReciente(fecha: Date): boolean {
    return Date.now() - fecha.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }

  async generarReporte(
    usuario: UsuarioAutenticado,

    cursoId: number,

    formatoSolicitado: string,
  ): Promise<ArchivoReporteGenerado> {
    const formato = this.normalizarFormato(formatoSolicitado);

    const curso = await this.prisma.curso.findFirst({
      where: {
        id: cursoId,

        docenteId: usuario.id,
      },

      select: {
        id: true,

        gestion: true,

        paralelo: true,

        semestre: true,

        cupoMaximo: true,

        estado: true,

        materia: {
          select: {
            nombre: true,

            codigo: true,
          },
        },
      },
    });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe o no está asignado al docente autenticado.',
      );
    }

    const [docente, inscripciones] = await Promise.all([
      this.prisma.usuario.findUnique({
        where: {
          id: usuario.id,
        },

        select: {
          nombres: true,

          apellidoPaterno: true,
        },
      }),

      this.prisma.inscripcionCurso.findMany({
        where: {
          cursoId,

          estado: EstadoInscripcion.ACTIVA,
        },

        orderBy: [
          {
            estudiante: {
              apellidoPaterno: 'asc',
            },
          },

          {
            estudiante: {
              nombres: 'asc',
            },
          },
        ],

        select: {
          inscritoEn: true,

          estudiante: {
            select: {
              nombres: true,

              apellidoPaterno: true,

              apellidoMaterno: true,

              correo: true,

              ultimoAccesoEn: true,
            },
          },
        },
      }),
    ]);

    const total = inscripciones.length;

    const cuposDisponibles =
      curso.cupoMaximo === null ? null : Math.max(curso.cupoMaximo - total, 0);

    const ocupacion =
      curso.cupoMaximo === null || curso.cupoMaximo <= 0
        ? null
        : Math.min(Math.round((total / curso.cupoMaximo) * 100), 100);

    const nuevosSemana = inscripciones.filter((item) =>
      this.esInscripcionReciente(item.inscritoEn),
    ).length;

    const conexionReciente = inscripciones.filter((item) =>
      this.estaConexionReciente(item.estudiante.ultimoAccesoEn),
    ).length;

    const resumen: FilaResumenEstudiantes = {
      inscritos: total,

      cuposDisponibles: cuposDisponibles ?? 'Sin límite',

      ocupacion: ocupacion === null ? 'Sin límite' : `${ocupacion}%`,

      nuevosSemana,

      conexionReciente,
    };

    const filas: FilaEstudiante[] = inscripciones.map((item) => ({
      estudiante: [
        item.estudiante.nombres,
        item.estudiante.apellidoPaterno,
        item.estudiante.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(' '),

      correo: item.estudiante.correo,

      ultimaConexion: item.estudiante.ultimoAccesoEn,

      inscripcion: item.inscritoEn,

      estado: 'Inscrito',
    }));

    const generadoPor =
      [docente?.nombres, docente?.apellidoPaterno]
        .filter(Boolean)
        .join(' ')
        .trim() || usuario.correo;

    const filtros: Record<string, string | number> = {
      Curso: curso.id,

      Materia: curso.materia.nombre,

      Código: curso.materia.codigo,

      Gestión: curso.gestion,

      Paralelo: curso.paralelo,

      Semestre: curso.semestre,
    };

    const definicion: DefinicionReporte<
      FilaResumenEstudiantes | FilaEstudiante
    > = {
      metadatos: {
        titulo: 'Estudiantes inscritos',

        subtitulo: `${curso.materia.nombre} · ${curso.materia.codigo}`,

        descripcion: `Directorio académico del curso · Gestión ${curso.gestion} · Paralelo ${curso.paralelo}`,

        institucion: 'UNIFRANZ',

        aplicacion: 'IusAcademy',

        generadoPor,

        filtros,

        textoPie: 'IusAcademy · Gestión académica del curso · UNIFRANZ',
      },

      opciones: {
        orientacion: OrientacionReporte.HORIZONTAL,

        incluirQr: true,

        incluirFiltros: true,

        incluirFechaHora: true,

        nombreHojaExcel: 'Estudiantes',

        incluirBomCsv: true,
      },

      secciones: [
        {
          id: 'resumen',

          titulo: 'Resumen del curso',

          filas: [resumen],

          mostrarNumeroFila: false,

          columnas: [
            {
              clave: 'inscritos',

              etiqueta: 'Inscritos',

              tipo: TipoDatoReporte.NUMERO,

              alineacion: AlineacionReporte.CENTRO,
            },

            {
              clave: 'cuposDisponibles',

              etiqueta: 'Cupos disponibles',

              alineacion: AlineacionReporte.CENTRO,
            },

            {
              clave: 'ocupacion',

              etiqueta: 'Ocupación',

              alineacion: AlineacionReporte.CENTRO,
            },

            {
              clave: 'nuevosSemana',

              etiqueta: 'Nuevos esta semana',

              tipo: TipoDatoReporte.NUMERO,

              alineacion: AlineacionReporte.CENTRO,
            },

            {
              clave: 'conexionReciente',

              etiqueta: 'Con conexión reciente',

              tipo: TipoDatoReporte.NUMERO,

              alineacion: AlineacionReporte.CENTRO,
            },
          ],
        },

        {
          id: 'estudiantes',

          titulo: 'Directorio de estudiantes',

          descripcion: `${total} estudiante(s) inscrito(s) actualmente en el curso.`,

          filas,

          mostrarNumeroFila: true,

          columnas: [
            {
              clave: 'estudiante',

              etiqueta: 'Estudiante',

              ancho: 1.55,
            },

            {
              clave: 'correo',

              etiqueta: 'Correo',

              ancho: 1.65,
            },

            {
              clave: 'ultimaConexion',

              etiqueta: 'Última conexión',

              tipo: TipoDatoReporte.FECHA_HORA,

              ancho: 1.15,
            },

            {
              clave: 'inscripcion',

              etiqueta: 'Inscripción',

              tipo: TipoDatoReporte.FECHA_HORA,

              ancho: 1.15,
            },

            {
              clave: 'estado',

              etiqueta: 'Estado',

              ancho: 0.75,

              alineacion: AlineacionReporte.CENTRO,
            },
          ],
        },
      ],
    };

    return this.reportesVerificacionService.generarVerificable(
      formato,
      definicion,
      {
        tipo: 'DOCENTE_ESTUDIANTES_CURSO',

        generadoPorId: usuario.id,

        filtros,
      },
      `estudiantes-curso-${curso.id}-iusacademy`,
    );
  }
}
