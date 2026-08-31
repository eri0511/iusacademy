import { ForbiddenException, Injectable } from '@nestjs/common';

import {
  ComponenteEvaluacion,
  EstadoActividadCalificable,
  EstadoCalificacion,
  EstadoForo,
  EstadoQuiz,
  EstadoTarea,
  Rol,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { AulaCursoService } from './aula-curso.service';

type UsuarioAutenticado = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  rol: Rol;
};

type ResumenComponente = {
  promedioSobre100: number;
  aporteExacto: number;
  notaFinal: number;
  maximo: number;
  actividadesPublicadas: number;
};

@Injectable()
export class AulaInicioEstudianteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aulaCursoService: AulaCursoService,
  ) {}

  private redondear(valor: number, decimales = 2) {
    return Number(valor.toFixed(decimales));
  }

  private promedio(valores: number[]) {
    if (valores.length === 0) {
      return 0;
    }

    return (
      valores.reduce((acumulado, valor) => acumulado + valor, 0) /
      valores.length
    );
  }

  private construirResumenComponente(
    notas: number[],
    maximo: number,
  ): ResumenComponente {
    const promedioSobre100 = this.promedio(notas);

    const aporteExacto = (promedioSobre100 * maximo) / 100;

    return {
      promedioSobre100: this.redondear(promedioSobre100),
      aporteExacto: this.redondear(aporteExacto),
      notaFinal: Math.round(aporteExacto),
      maximo,
      actividadesPublicadas: notas.length,
    };
  }

  async obtenerInicioEstudiante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    hitoId: number,
  ) {
    if (usuario.rol !== Rol.ESTUDIANTE) {
      throw new ForbiddenException(
        'Solo el estudiante puede consultar este resumen del hito',
      );
    }

    const hitoCurso = await this.aulaCursoService.obtenerHitoCurso(
      usuario,
      cursoId,
      hitoId,
    );

    const ahora = new Date();

    const [publicaciones, foros, tareas, quizzes, actividades] =
      await Promise.all([
        this.prisma.publicacionCurso.count({
          where: {
            cursoId,
            hitoId,
            estaActiva: true,
            eliminadoEn: null,
          },
        }),

        this.prisma.temaForoCurso.findMany({
          where: {
            cursoId,
            hitoId,
            estaActivo: true,
            eliminadoEn: null,
            estado: {
              notIn: [EstadoForo.BORRADOR, EstadoForo.ANULADO],
            },
          },
          select: {
            id: true,
            titulo: true,
            fechaApertura: true,
            fechaLimite: true,
            fechaCierre: true,
            estado: true,
            visibleAntesDeApertura: true,
          },
        }),

        this.prisma.tareaCurso.findMany({
          where: {
            cursoId,
            hitoId,
            estaActiva: true,
            eliminadoEn: null,
            estado: {
              notIn: [EstadoTarea.BORRADOR, EstadoTarea.ANULADA],
            },
          },
          select: {
            id: true,
            titulo: true,
            fechaLimite: true,
            fechaCierre: true,
            estado: true,
          },
        }),

        this.prisma.quizCurso.findMany({
          where: {
            cursoId,
            hitoId,
            estado: {
              notIn: [EstadoQuiz.BORRADOR, EstadoQuiz.CANCELADO],
            },
          },
          select: {
            id: true,
            titulo: true,
            cierreProgramado: true,
            estado: true,
          },
        }),

        this.prisma.actividadCalificable.findMany({
          where: {
            cursoId,
            hitoId,
            participaEnPromedio: true,
            visibleParaEstudiantes: true,
            estado: {
              not: EstadoActividadCalificable.ANULADA,
            },
          },
          orderBy: {
            orden: 'asc',
          },
          select: {
            id: true,
            titulo: true,
            origen: true,
            componente: true,
            foroId: true,
            tareaId: true,
            quizId: true,
            calificaciones: {
              where: {
                estudianteId: usuario.id,
                estado: EstadoCalificacion.PUBLICADA,
              },
              select: {
                notaFinal: true,
                publicadaEn: true,
              },
            },
          },
        }),
      ]);

    const forosVisibles = foros.filter(
      (foro) =>
        foro.estado !== EstadoForo.PROGRAMADO ||
        foro.visibleAntesDeApertura ||
        foro.fechaApertura <= ahora,
    );

    const notasContinua = actividades.flatMap((actividad) =>
      actividad.componente === ComponenteEvaluacion.CONTINUA &&
      actividad.calificaciones[0]
        ? [Number(actividad.calificaciones[0].notaFinal)]
        : [],
    );

    const notasProcesual = actividades.flatMap((actividad) =>
      actividad.componente === ComponenteEvaluacion.PROCESUAL &&
      actividad.calificaciones[0]
        ? [Number(actividad.calificaciones[0].notaFinal)]
        : [],
    );

    const continua = this.construirResumenComponente(
      notasContinua,
      hitoCurso.hito.puntajeContinua,
    );

    const procesual = this.construirResumenComponente(
      notasProcesual,
      hitoCurso.hito.puntajeProcesual,
    );

    const aporteTotalExacto = this.redondear(
      continua.aporteExacto + procesual.aporteExacto,
    );

    const proximasActividades = [
      ...forosVisibles.flatMap((foro) => {
        const fecha = foro.fechaLimite ?? foro.fechaCierre;

        return fecha && fecha >= ahora
          ? [
              {
                id: `FORO-${foro.id}`,
                origen: 'FORO' as const,
                referenciaId: foro.id,
                titulo: foro.titulo,
                fecha,
                estado: foro.estado,
              },
            ]
          : [];
      }),
      ...tareas.flatMap((tarea) => {
        const fecha = tarea.fechaLimite ?? tarea.fechaCierre;

        return fecha && fecha >= ahora
          ? [
              {
                id: `TAREA-${tarea.id}`,
                origen: 'TAREA' as const,
                referenciaId: tarea.id,
                titulo: tarea.titulo,
                fecha,
                estado: tarea.estado,
              },
            ]
          : [];
      }),
      ...quizzes.flatMap((quiz) =>
        quiz.cierreProgramado && quiz.cierreProgramado >= ahora
          ? [
              {
                id: `QUIZ-${quiz.id}`,
                origen: 'QUIZ' as const,
                referenciaId: quiz.id,
                titulo: quiz.titulo,
                fecha: quiz.cierreProgramado,
                estado: quiz.estado,
              },
            ]
          : [],
      ),
    ]
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .slice(0, 6);

    const calificacionesRecientes = actividades
      .flatMap((actividad) => {
        const calificacion = actividad.calificaciones[0];

        if (!calificacion) {
          return [];
        }

        return [
          {
            id: actividad.id,
            titulo: actividad.titulo,
            origen: actividad.origen,
            componente: actividad.componente,
            foroId: actividad.foroId,
            tareaId: actividad.tareaId,
            quizId: actividad.quizId,
            nota: Number(calificacion.notaFinal),
            publicadaEn: calificacion.publicadaEn,
          },
        ];
      })
      .sort(
        (a, b) =>
          (b.publicadaEn?.getTime() ?? 0) - (a.publicadaEn?.getTime() ?? 0),
      )
      .slice(0, 5);

    return {
      hito: hitoCurso.hito,

      resumen: {
        publicaciones,
        foros: forosVisibles.length,
        tareas: tareas.length,
        quizzes: quizzes.length,
        actividades: forosVisibles.length + tareas.length + quizzes.length,
        calificacionesPublicadas: notasContinua.length + notasProcesual.length,
        aporteAcumulado: aporteTotalExacto,
        notaAcumulada: Math.round(aporteTotalExacto),
        maximoHito: hitoCurso.hito.puntajeTotal,
      },

      rendimiento: {
        continua,
        procesual,
        total: {
          aporteExacto: aporteTotalExacto,
          notaFinal: Math.round(aporteTotalExacto),
          maximo: hitoCurso.hito.puntajeTotal,
        },
      },

      proximoVencimiento: proximasActividades[0] ?? null,

      proximasActividades,
      calificacionesRecientes,
    };
  }
}
