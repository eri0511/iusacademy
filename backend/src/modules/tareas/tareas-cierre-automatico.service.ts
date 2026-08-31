import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  EstadoInscripcion,
  EstadoTarea,
  Rol,
  TipoNotificacion,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { NotificacionesService } from '../notificaciones/notificaciones.service';

import { TareasEntregasService } from './tareas-entregas.service';

import { TareasService } from './tareas.service';

import { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

/**
 * Cierre automático de tareas.
 *
 * Cuando una tarea alcanza su fecha de cierre efectiva sin que el
 * docente la cierre manualmente, este servicio:
 *   1. Entrega automáticamente los borradores válidos que el/los
 *      estudiante(s) dejaron a medio preparar (no se pierde trabajo).
 *   2. Cierra la tarea oficialmente (lo que además registra ceros
 *      para quienes no entregaron), de la misma forma que `cerrar()`.
 *
 * Sigue el patrón existente de `ForoCierreAutomaticoService`
 * (setInterval + OnModuleInit/OnModuleDestroy).
 */
@Injectable()
export class TareasCierreAutomaticoService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(TareasCierreAutomaticoService.name);

  private temporizador?: NodeJS.Timeout;

  private ejecutando = false;

  constructor(
    private readonly prisma: PrismaService,

    private readonly tareas: TareasService,

    private readonly entregas: TareasEntregasService,

    private readonly notificacionesService: NotificacionesService,
  ) {}

  onModuleInit() {
    void this.procesarCicloTareas();

    this.temporizador = setInterval(
      () => void this.procesarCicloTareas(),
      60_000,
    );
  }

  onModuleDestroy() {
    if (this.temporizador) {
      clearInterval(this.temporizador);
    }
  }

  private fechaCierreEfectiva(tarea: {
    permitirRetrasos: boolean;

    fechaMaximaRetraso: Date | null;

    fechaCierre: Date;

    fechaLimite: Date;
  }) {
    return tarea.permitirRetrasos
      ? (tarea.fechaMaximaRetraso ?? tarea.fechaCierre)
      : tarea.fechaLimite;
  }

  async procesarCicloTareas() {
    if (this.ejecutando) {
      return;
    }

    this.ejecutando = true;

    try {
      const ahora = new Date();

      const candidatas = await this.prisma.tareaCurso.findMany({
        where: {
          estaActiva: true,

          estaCerrada: false,

          estado: {
            in: [EstadoTarea.PROGRAMADA, EstadoTarea.DISPONIBLE],
          },

          OR: [
            {
              fechaCierre: {
                lte: ahora,
              },
            },
            {
              fechaMaximaRetraso: {
                lte: ahora,
              },
            },
            {
              fechaLimite: {
                lte: ahora,
              },
            },
          ],
        },

        select: {
          id: true,

          cursoId: true,

          titulo: true,

          autorId: true,

          permitirRetrasos: true,

          fechaMaximaRetraso: true,

          fechaCierre: true,

          fechaLimite: true,
        },
      });

      for (const tarea of candidatas) {
        const cierre = this.fechaCierreEfectiva(tarea);

        if (cierre > ahora) {
          continue;
        }

        await this.cerrarYProcesar(tarea);
      }

      await this.enviarAvisosPorVencer(ahora);
    } catch (error) {
      this.logger.error(
        'No se pudo procesar el cierre automático de las tareas',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ejecutando = false;
    }
  }

  private actualDocente(deTarea: UsuarioAutenticado): UsuarioAutenticado {
    return {
      id: deTarea.id,

      correo: deTarea.correo,

      rol: Rol.DOCENTE,
    };
  }

  async cerrarYProcesar(tarea: {
    id: number;

    cursoId: number;

    titulo: string;

    autorId: number;
  }) {
    try {
      await this.entregas.enviarBorradoresAutomaticamente(tarea.id);

      const autor = await this.prisma.usuario.findUnique({
        where: {
          id: tarea.autorId,
        },

        select: {
          id: true,

          correo: true,

          rol: true,
        },
      });

      if (!autor) {
        return;
      }

      await this.tareas.cerrar(
        this.actualDocente(autor),
        tarea.cursoId,
        tarea.id,
      );

      const inscripciones = await this.prisma.inscripcionCurso.findMany({
        where: {
          cursoId: tarea.cursoId,

          estado: EstadoInscripcion.ACTIVA,

          estudiante: {
            estaActivo: true,
            rol: Rol.ESTUDIANTE,
          },
        },

        select: {
          estudianteId: true,
        },
      });

      await this.notificacionesService.crearMuchas(
        inscripciones.map((inscripcion) => ({
          destinatarioId: inscripcion.estudianteId,

          tipo: TipoNotificacion.TAREA_VENCIDA,

          titulo: `Tarea vencida: ${tarea.titulo}`,

          cuerpo:
            'La tarea venció y fue cerrada. Revisa el estado de tu entrega.',

          enlace: `/estudiante/cursos/${tarea.cursoId}/tareas/${tarea.id}`,
        })),
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo cerrar automáticamente la tarea ${tarea.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async enviarAvisosPorVencer(ahora: Date) {
    const limiteAviso = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    const porVencer = await this.prisma.tareaCurso.findMany({
      where: {
        estaActiva: true,

        estaCerrada: false,

        estado: {
          in: [EstadoTarea.PROGRAMADA, EstadoTarea.DISPONIBLE],
        },

        fechaLimite: {
          gte: ahora,

          lte: limiteAviso,
        },
      },

      select: {
        id: true,

        cursoId: true,

        titulo: true,
      },
    });

    for (const tarea of porVencer) {
      const enlace = `/estudiante/cursos/${tarea.cursoId}/tareas/${tarea.id}`;

      const [inscripciones, yaNotificados] = await Promise.all([
        this.prisma.inscripcionCurso.findMany({
          where: {
            cursoId: tarea.cursoId,

            estado: EstadoInscripcion.ACTIVA,

            estudiante: {
              estaActivo: true,
              rol: Rol.ESTUDIANTE,
            },
          },

          select: {
            estudianteId: true,
          },
        }),

        this.prisma.notificacion.findMany({
          where: {
            tipo: TipoNotificacion.TAREA_POR_VENCER,

            enlace,
          },

          select: {
            destinatarioId: true,
          },
        }),
      ]);

      const ya = new Set(
        yaNotificados.map((notificacion) => notificacion.destinatarioId),
      );

      const pendientes = inscripciones
        .map((inscripcion) => inscripcion.estudianteId)
        .filter((estudianteId) => !ya.has(estudianteId));

      if (pendientes.length > 0) {
        await this.notificacionesService.crearMuchas(
          pendientes.map((destinatarioId) => ({
            destinatarioId,

            tipo: TipoNotificacion.TAREA_POR_VENCER,

            titulo: `La tarea "${tarea.titulo}" vence pronto`,

            cuerpo: 'Te queda menos de 24 horas para entregar la tarea.',

            enlace,
          })),
        );
      }
    }
  }
}
