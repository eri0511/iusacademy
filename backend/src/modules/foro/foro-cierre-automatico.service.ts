import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  AccionHistorialForo,
  EstadoActividadCalificable,
  EstadoCalificacion,
  EstadoForo,
  EstadoInscripcion,
  Prisma,
  Rol,
  TipoEvaluacionForo,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { ForoPublicacionNotasService } from './foro-publicacion-notas.service';

import { ForoReglasService } from './foro-reglas.service';

@Injectable()
export class ForoCierreAutomaticoService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ForoCierreAutomaticoService.name);

  private temporizador?: NodeJS.Timeout;

  private ejecutando = false;

  constructor(
    private readonly prisma: PrismaService,

    private readonly publicacionNotas: ForoPublicacionNotasService,

    private readonly reglas: ForoReglasService,
  ) {}

  onModuleInit() {
    /*
     * Ejecutamos inmediatamente al levantar el backend.
     * Así un foro cuya hora de apertura ya pasó no queda
     * atrapado en PROGRAMADO hasta la siguiente interacción.
     */
    void this.procesarCicloForos();

    /*
     * Cinco segundos es suficientemente frecuente para que
     * el cambio PROGRAMADO -> ABIERTO se perciba prácticamente
     * en tiempo real, sin consultar la BD cada segundo.
     */
    this.temporizador = setInterval(
      () => void this.procesarCicloForos(),
      5_000,
    );
  }

  onModuleDestroy() {
    if (this.temporizador) {
      clearInterval(this.temporizador);
    }
  }

  private fechaCierreEfectiva(foro: {
    permitirRetrasos: boolean;

    fechaMaximaRetraso: Date | null;

    fechaCierre: Date | null;

    fechaLimite: Date | null;
  }) {
    return foro.permitirRetrasos
      ? (foro.fechaMaximaRetraso ?? foro.fechaCierre ?? foro.fechaLimite)
      : (foro.fechaCierre ?? foro.fechaLimite);
  }

  /*
   * Punto único del ciclo automático:
   *
   * PROGRAMADO
   *    ↓ fechaApertura
   * ABIERTO
   *    ↓ cierre efectivo
   * CERRADO / NOTAS_PUBLICADAS
   */
  async procesarCicloForos() {
    if (this.ejecutando) {
      return;
    }

    this.ejecutando = true;

    try {
      const ahora = new Date();

      await this.abrirForosProgramados(ahora);

      await this.procesarForosVencidos(ahora);
    } catch (error) {
      this.logger.error(
        'No se pudo procesar el ciclo automático de los foros',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ejecutando = false;
    }
  }

  private async abrirForosProgramados(ahora: Date) {
    const candidatos = await this.prisma.temaForoCurso.findMany({
      where: {
        estaActivo: true,

        estado: EstadoForo.PROGRAMADO,

        fechaApertura: {
          lte: ahora,
        },
      },

      select: {
        id: true,

        fechaApertura: true,

        permitirRetrasos: true,

        fechaMaximaRetraso: true,

        fechaCierre: true,

        fechaLimite: true,
      },
    });

    for (const foro of candidatos) {
      const cierre = this.fechaCierreEfectiva(foro);

      /*
       * Si también pasó el cierre, no tiene sentido abrirlo
       * durante unos milisegundos. El proceso de cierre que
       * corre inmediatamente después lo resolverá.
       */
      if (cierre && cierre <= ahora) {
        continue;
      }

      await this.abrirForo(foro.id, ahora);
    }
  }

  private async abrirForo(
    foroId: number,

    ahora: Date,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const foro = await tx.temaForoCurso.findUnique({
        where: {
          id: foroId,
        },

        include: {
          actividadCalificable: true,
        },
      });

      if (!foro || !foro.estaActivo || foro.estado !== EstadoForo.PROGRAMADO) {
        return;
      }

      /*
       * Segunda validación dentro de la transacción.
       * Evita abrir antes de tiempo si hubo una carrera.
       */
      if (foro.fechaApertura && foro.fechaApertura > ahora) {
        return;
      }

      const cierre = this.fechaCierreEfectiva(foro);

      if (cierre && cierre <= ahora) {
        return;
      }

      await tx.temaForoCurso.update({
        where: {
          id: foro.id,
        },

        data: {
          estado: EstadoForo.ABIERTO,

          estaCerrado: false,

          editadoEn: ahora,
        },
      });

      /*
       * Si el foro es calificable, la actividad asociada
       * también debe pasar a ACTIVA y hacerse visible.
       */
      if (foro.actividadCalificable) {
        await tx.actividadCalificable.update({
          where: {
            id: foro.actividadCalificable.id,
          },

          data: {
            estado: EstadoActividadCalificable.ACTIVA,

            visibleParaEstudiantes: true,

            cerradaEn: null,
          },
        });
      }

      await tx.historialForoCurso.create({
        data: {
          temaId: foro.id,

          actorId: foro.autorId,

          accion: AccionHistorialForo.FORO_ABIERTO,

          detalle: {
            automatico: true,

            motivo: 'Se alcanzó la fecha de apertura programada',
          },
        },
      });
    });
  }

  private async procesarForosVencidos(ahora: Date) {
    const candidatos = await this.prisma.temaForoCurso.findMany({
      where: {
        estaActivo: true,

        estado: {
          in: [EstadoForo.PROGRAMADO, EstadoForo.ABIERTO, EstadoForo.VENCIDO],
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

        permitirRetrasos: true,

        fechaMaximaRetraso: true,

        fechaCierre: true,

        fechaLimite: true,
      },
    });

    for (const foro of candidatos) {
      const cierre = this.fechaCierreEfectiva(foro);

      if (cierre && cierre <= ahora) {
        await this.cerrarYProcesar(foro.id);
      }
    }
  }

  async cerrarYProcesar(foroId: number) {
    const foro = await this.prisma.temaForoCurso.findUnique({
      where: {
        id: foroId,
      },

      include: {
        actividadCalificable: true,
      },
    });

    if (!foro || !foro.estaActivo || foro.estado === EstadoForo.ANULADO) {
      return null;
    }

    if (foro.estado === EstadoForo.NOTAS_PUBLICADAS) {
      return foro;
    }

    const ahora = new Date();

    if (!foro.esCalificable || !foro.actividadCalificable) {
      return this.prisma.$transaction(async (tx) => {
        await tx.temaForoCurso.update({
          where: {
            id: foro.id,
          },

          data: {
            estado: EstadoForo.CERRADO,

            estaCerrado: true,

            editadoEn: ahora,
          },
        });

        return foro;
      });
    }

    const esAutomatica =
      foro.tipoEvaluacion === TipoEvaluacionForo.AUTOMATICA ||
      foro.calificacionAutomaticaAlCumplir;

    if (esAutomatica) {
      const actividadId = foro.actividadCalificable.id;

      const inscripciones = await this.prisma.inscripcionCurso.findMany({
        where: {
          cursoId: foro.cursoId,

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

      await this.prisma.$transaction(async (tx) => {
        for (const { estudianteId } of inscripciones) {
          const respuesta = await tx.respuestaForoCurso.findFirst({
            where: {
              temaId: foro.id,
              estaActiva: true,
              OR: [
                { autorId: estudianteId },
                {
                  grupoCurso: {
                    integrantes: {
                      some: {
                        estudianteId,
                        estaActivo: true,
                      },
                    },
                  },
                },
                {
                  equipoAfinidad: {
                    integrantes: {
                      some: {
                        estudianteId,
                        estaActivo: true,
                      },
                    },
                  },
                },
              ],
            },
            orderBy: {
              publicadoEn: 'asc',
            },
          });

          const evaluacionComentarios =
            await this.reglas.evaluarComentariosParaCalificacion(
              foro.id,
              estudianteId,
              100,
              tx,
            );

          const tieneRespuesta = Boolean(respuesta);
          const cumpleComentarios =
            !evaluacionComentarios.aplicaRequisito ||
            evaluacionComentarios.esRepresentante ||
            evaluacionComentarios.cumplio;

          const permiteNotaParcial =
            evaluacionComentarios.aplicaRequisito &&
            !evaluacionComentarios.esRepresentante &&
            !evaluacionComentarios.cumplio &&
            evaluacionComentarios.penalizacionConfigurada &&
            tieneRespuesta;

          const notaBase =
            tieneRespuesta && (cumpleComentarios || permiteNotaParcial)
              ? 100
              : 0;

          const descuentoRetraso =
            notaBase > 0 && respuesta
              ? Number(respuesta.descuentoCalculado)
              : 0;

          const descuentoComentarios =
            notaBase > 0 ? evaluacionComentarios.descuentoComentarios : 0;

          const notaFinal = Math.max(
            0,
            Math.min(100, notaBase - descuentoRetraso - descuentoComentarios),
          );

          const retroalimentacion =
            notaBase === 0
              ? 'No cumplió la participación requerida dentro del plazo.'
              : descuentoComentarios > 0
                ? `Participación incompleta: realizó ${evaluacionComentarios.comentariosValidos} de ${evaluacionComentarios.minimoRequerido} comentarios requeridos.`
                : null;

          await tx.calificacionEstudiante.upsert({
            where: {
              actividadId_estudianteId: {
                actividadId,
                estudianteId,
              },
            },

            create: {
              actividadId,
              estudianteId,

              calificadorId: foro.autorId,

              respuestaForoId: respuesta?.id ?? null,

              grupoCursoId: respuesta?.grupoCursoId ?? null,

              equipoAfinidadId: respuesta?.equipoAfinidadId ?? null,

              notaBase: new Prisma.Decimal(notaBase),

              descuentoRetraso: new Prisma.Decimal(descuentoRetraso),

              descuentoComentarios: new Prisma.Decimal(descuentoComentarios),

              ajusteIndividual: new Prisma.Decimal(0),

              notaFinal: new Prisma.Decimal(notaFinal),

              retroalimentacion,

              estado: EstadoCalificacion.CALIFICADA,

              calificadaEn: ahora,
            },

            update: {
              calificadorId: foro.autorId,

              respuestaForoId: respuesta?.id ?? null,

              grupoCursoId: respuesta?.grupoCursoId ?? null,

              equipoAfinidadId: respuesta?.equipoAfinidadId ?? null,

              notaBase: new Prisma.Decimal(notaBase),

              descuentoRetraso: new Prisma.Decimal(descuentoRetraso),

              descuentoComentarios: new Prisma.Decimal(descuentoComentarios),

              ajusteIndividual: new Prisma.Decimal(0),

              notaFinal: new Prisma.Decimal(notaFinal),

              retroalimentacion,

              estado: EstadoCalificacion.CALIFICADA,

              calificadaEn: ahora,

              publicadaEn: null,

              anuladaEn: null,
            },
          });
        }

        await tx.temaForoCurso.update({
          where: {
            id: foro.id,
          },

          data: {
            estado: EstadoForo.CALIFICADO,

            estaCerrado: true,

            editadoEn: ahora,
          },
        });

        await tx.actividadCalificable.update({
          where: {
            id: actividadId,
          },

          data: {
            estado: EstadoActividadCalificable.CALIFICADA,

            cerradaEn: ahora,

            visibleParaEstudiantes: false,
          },
        });
      });

      await this.publicacionNotas.publicarAutomaticamenteSiCompleto(foro.id);

      return this.prisma.temaForoCurso.findUnique({
        where: {
          id: foro.id,
        },
      });
    }

    /*
     * FORO MANUAL
     *
     * Primero lo cerramos académicamente.
     * Luego intentamos publicar automáticamente SOLO si todos
     * los estudiantes ya tienen una nota CALIFICADA/PUBLICADA.
     */
    await this.prisma.$transaction(async (tx) => {
      await tx.temaForoCurso.update({
        where: {
          id: foro.id,
        },

        data: {
          estado: EstadoForo.CALIFICANDO,

          estaCerrado: true,

          editadoEn: ahora,
        },
      });

      await tx.actividadCalificable.update({
        where: {
          id: foro.actividadCalificable!.id,
        },

        data: {
          estado: EstadoActividadCalificable.CALIFICANDO,

          cerradaEn: ahora,

          visibleParaEstudiantes: false,
        },
      });
    });

    const publicacion =
      await this.publicacionNotas.publicarAutomaticamenteSiCompleto(foro.id);

    if (!publicacion.publicado) {
      return this.prisma.temaForoCurso.findUnique({
        where: {
          id: foro.id,
        },
      });
    }

    return this.prisma.temaForoCurso.findUnique({
      where: {
        id: foro.id,
      },
    });
  }
}
