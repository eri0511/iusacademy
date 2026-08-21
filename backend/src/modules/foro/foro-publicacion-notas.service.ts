import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  AccionHistorialCalificacion,
  AccionHistorialForo,
  EstadoActividadCalificable,
  EstadoCalificacion,
  EstadoForo,
  EstadoInscripcion,
  Rol,
} from "../../generated/prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

import { PublicarNotasForoDto } from "./dto/publicar-notas-foro.dto";

import { ReabrirNotasForoDto } from "./dto/reabrir-notas-foro.dto";

import type { UsuarioAutenticado } from "./interfaces/usuario-autenticado.interface";

@Injectable()
export class ForoPublicacionNotasService {
  constructor(private readonly prisma: PrismaService) {}

  private validarDocente(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        "Solo el docente puede publicar las notas del foro",
      );
    }
  }

  private async obtenerForoDocente(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    this.validarDocente(usuario);

    const foro = await this.prisma.temaForoCurso.findFirst({
      where: {
        id: foroId,

        cursoId,

        curso: {
          docenteId: usuario.id,
        },

        estaActivo: true,
      },

      include: {
        actividadCalificable: true,
      },
    });

    if (!foro) {
      throw new NotFoundException(
        "El foro no existe o no pertenece al docente autenticado",
      );
    }

    if (!foro.actividadCalificable) {
      throw new BadRequestException(
        "El foro no tiene una actividad calificable asociada",
      );
    }

    return foro;
  }

  private async obtenerResumenPublicacion(
    cursoId: number,
    actividadId: number,
  ) {
    const totalEstudiantes = await this.prisma.inscripcionCurso.count({
      where: {
        cursoId,

        estado: EstadoInscripcion.ACTIVA,

        estudiante: {
          estaActivo: true,

          rol: Rol.ESTUDIANTE,
        },
      },
    });

    const calificaciones = await this.prisma.calificacionEstudiante.findMany({
      where: {
        actividadId,
      },

      select: {
        id: true,

        estudianteId: true,

        estado: true,

        notaFinal: true,
      },
    });

    const calificadas = calificaciones.filter(
      (item) =>
        item.estado === EstadoCalificacion.CALIFICADA ||
        item.estado === EstadoCalificacion.PUBLICADA,
    );

    const publicadas = calificaciones.filter(
      (item) => item.estado === EstadoCalificacion.PUBLICADA,
    );

    return {
      totalEstudiantes,

      totalRegistradas: calificaciones.length,

      totalCalificadas: calificadas.length,

      totalPublicadas: publicadas.length,

      pendientes: Math.max(0, totalEstudiantes - calificadas.length),

      calificaciones,

      calificadas,
    };
  }

  async previsualizarPublicacion(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    const actividad = foro.actividadCalificable!;

    const resumen = await this.obtenerResumenPublicacion(cursoId, actividad.id);

    const puedePublicar =
      resumen.totalCalificadas > 0 &&
      resumen.pendientes === 0 &&
      foro.estado !== EstadoForo.ANULADO;

    return {
      foro: {
        id: foro.id,

        titulo: foro.titulo,

        estado: foro.estado,
      },

      actividad: {
        id: actividad.id,

        estado: actividad.estado,
      },

      resumen: {
        totalEstudiantes: resumen.totalEstudiantes,

        totalCalificadas: resumen.totalCalificadas,

        totalPublicadas: resumen.totalPublicadas,

        pendientes: resumen.pendientes,
      },

      puedePublicar,

      advertencias: [
        ...(resumen.totalCalificadas === 0
          ? ["Todavía no existen calificaciones listas para publicar."]
          : []),

        ...(resumen.pendientes > 0
          ? [
              `Existen ${resumen.pendientes} estudiantes pendientes de calificación.`,
            ]
          : []),

        ...(foro.estado === EstadoForo.ANULADO
          ? ["El foro está anulado y no puede publicar notas."]
          : []),
      ],
    };
  }

  private async publicarInternamente(
    foroId:
      number,

    actividadId:
      number,

    actorId:
      number,

    pendientes:
      number,

    permitirPendientes:
      boolean,
  ) {
    const fecha =
      new Date();

    const resultado =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          const actualizadas =
            await tx.calificacionEstudiante.updateMany({
              where: {
                actividadId,

                estado: {
                  in: [
                    EstadoCalificacion.CALIFICADA,
                    EstadoCalificacion.BORRADOR,
                  ],
                },
              },

              data: {
                estado:
                  EstadoCalificacion.PUBLICADA,

                publicadaEn:
                  fecha,

                anuladaEn:
                  null,
              },
            });

          await tx.temaForoCurso.update({
            where: {
              id:
                foroId,
            },

            data: {
              estado:
                EstadoForo.NOTAS_PUBLICADAS,

              estaCerrado:
                true,

              notasPublicadasEn:
                fecha,

              editadoEn:
                fecha,
            },
          });

          await tx.actividadCalificable.update({
            where: {
              id:
                actividadId,
            },

            data: {
              estado:
                EstadoActividadCalificable.PUBLICADA,

              visibleParaEstudiantes:
                true,

              publicadaEn:
                fecha,

              cerradaEn:
                fecha,
            },
          });

          await tx.historialForoCurso.create({
            data: {
              temaId:
                foroId,

              actorId,

              accion:
                AccionHistorialForo.NOTAS_PUBLICADAS,

              detalle: {
                totalPublicadas:
                  actualizadas.count,

                pendientesAlPublicar:
                  pendientes,

                permitirPendientes,

                publicadaEn:
                  fecha.toISOString(),
              },
            },
          });

          await tx.historialCalificacion.create({
            data: {
              actividadId,

              actorId,

              accion:
                AccionHistorialCalificacion.CALIFICACIONES_PUBLICADAS,

              detalle: {
                foroId,

                totalPublicadas:
                  actualizadas.count,

                pendientesAlPublicar:
                  pendientes,

                publicadaEn:
                  fecha.toISOString(),
              },
            },
          });

          return actualizadas;
        },
      );

    return {
      fecha,
      actualizadas:
        resultado.count,
    };
  }

  async publicarAutomaticamenteSiCompleto(
    foroId:
      number,
  ) {
    const foro =
      await this.prisma.temaForoCurso.findUnique({
        where: {
          id:
            foroId,
        },

        include: {
          actividadCalificable:
            true,

          curso:
            true,
        },
      });

    if (
      !foro ||
      !foro.estaActivo ||
      !foro.esCalificable ||
      !foro.actividadCalificable ||
      foro.estado ===
        EstadoForo.ANULADO ||
      foro.estado ===
        EstadoForo.NOTAS_PUBLICADAS
    ) {
      return {
        publicado:
          false,
      };
    }

    const resumen =
      await this.obtenerResumenPublicacion(
        foro.cursoId,
        foro.actividadCalificable.id,
      );

    if (
      resumen.totalCalificadas ===
        0 ||
      resumen.pendientes >
        0
    ) {
      return {
        publicado:
          false,

        pendientes:
          resumen.pendientes,
      };
    }

    const resultado =
      await this.publicarInternamente(
        foro.id,
        foro.actividadCalificable.id,
        foro.autorId,
        resumen.pendientes,
        false,
      );

    return {
      publicado:
        true,

      totalPublicadas:
        resultado.actualizadas,

      notasPublicadasEn:
        resultado.fecha,
    };
  }

  async publicarNotas(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: PublicarNotasForoDto,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    const actividad = foro.actividadCalificable!;

    const estadosPermitidos: EstadoForo[] = [
      EstadoForo.CERRADO,
      EstadoForo.CALIFICANDO,
      EstadoForo.CALIFICADO,
    ];

    if (!estadosPermitidos.includes(foro.estado)) {
      throw new BadRequestException(
        "El foro debe estar cerrado o en proceso de calificación para publicar notas",
      );
    }

    const resumen = await this.obtenerResumenPublicacion(cursoId, actividad.id);

    if (resumen.totalCalificadas === 0) {
      throw new BadRequestException(
        "No existen calificaciones listas para publicar",
      );
    }

    const permitirPendientes = datos.permitirPendientes ?? false;

    if (resumen.pendientes > 0 && !permitirPendientes) {
      throw new BadRequestException(
        `No puedes publicar mientras existan ${resumen.pendientes} estudiantes pendientes`,
      );
    }

    const resultado =
      await this.publicarInternamente(
        foro.id,
        actividad.id,
        usuario.id,
        resumen.pendientes,
        permitirPendientes,
      );

    return {
      mensaje: "Notas del foro publicadas correctamente",

      totalPublicadas:
        resultado.actualizadas,

      pendientes:
        resumen.pendientes,

      foro: {
        id: foro.id,

        estado: EstadoForo.NOTAS_PUBLICADAS,

        notasPublicadasEn:
          resultado.fecha,
      },

      actividad: {
        id: actividad.id,

        estado: EstadoActividadCalificable.PUBLICADA,

        visibleParaEstudiantes: true,
      },
    };
  }

  async reabrirNotas(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: ReabrirNotasForoDto,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    const actividad = foro.actividadCalificable!;

    if (foro.estado !== EstadoForo.NOTAS_PUBLICADAS) {
      throw new BadRequestException(
        "Solo puedes reabrir notas que ya fueron publicadas",
      );
    }

    const motivo = datos.motivo.trim();

    if (!motivo) {
      throw new BadRequestException("Debes indicar el motivo de la reapertura");
    }

    const fecha = new Date();

    const resultado = await this.prisma.$transaction(async (tx) => {
      const actualizadas = await tx.calificacionEstudiante.updateMany({
        where: {
          actividadId: actividad.id,

          estado: EstadoCalificacion.PUBLICADA,
        },

        data: {
          estado: EstadoCalificacion.CALIFICADA,

          publicadaEn: null,
        },
      });

      await tx.temaForoCurso.update({
        where: {
          id: foro.id,
        },

        data: {
          estado: EstadoForo.CALIFICANDO,

          notasPublicadasEn: null,

          editadoEn: fecha,
        },
      });

      await tx.actividadCalificable.update({
        where: {
          id: actividad.id,
        },

        data: {
          estado: EstadoActividadCalificable.CALIFICANDO,

          visibleParaEstudiantes: false,

          publicadaEn: null,
        },
      });

      await tx.historialForoCurso.create({
        data: {
          temaId: foro.id,

          actorId: usuario.id,

          accion: AccionHistorialForo.FORO_ACTUALIZADO,

          detalle: {
            accion: "REAPERTURA_DE_NOTAS",

            motivo,

            totalReabiertas: actualizadas.count,

            reabiertaEn: fecha.toISOString(),
          },
        },
      });

      await tx.historialCalificacion.create({
        data: {
          actividadId: actividad.id,

          actorId: usuario.id,

          accion: AccionHistorialCalificacion.CALIFICACION_ACTUALIZADA,

          detalle: {
            foroId: foro.id,

            accion: "REAPERTURA_DE_NOTAS",

            motivo,

            totalReabiertas: actualizadas.count,

            reabiertaEn: fecha.toISOString(),
          },
        },
      });

      return actualizadas;
    });

    return {
      mensaje: "Notas reabiertas correctamente",

      totalReabiertas: resultado.count,

      foro: {
        id: foro.id,

        estado: EstadoForo.CALIFICANDO,
      },

      actividad: {
        id: actividad.id,

        estado: EstadoActividadCalificable.CALIFICANDO,

        visibleParaEstudiantes: false,
      },
    };
  }

  async obtenerNotasPublicadasEstudiante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    if (usuario.rol !== Rol.ESTUDIANTE) {
      throw new ForbiddenException("Esta consulta corresponde al estudiante");
    }

    const inscripcion = await this.prisma.inscripcionCurso.findFirst({
      where: {
        cursoId,

        estudianteId: usuario.id,

        estado: EstadoInscripcion.ACTIVA,
      },

      select: {
        id: true,
      },
    });

    if (!inscripcion) {
      throw new ForbiddenException(
        "No tienes una inscripción activa en este curso",
      );
    }

    const foro = await this.prisma.temaForoCurso.findFirst({
      where: {
        id: foroId,

        cursoId,

        estado: EstadoForo.NOTAS_PUBLICADAS,

        estaActivo: true,
      },

      include: {
        actividadCalificable: true,
      },
    });

    if (
      !foro ||
      !foro.actividadCalificable ||
      !foro.actividadCalificable.visibleParaEstudiantes
    ) {
      throw new NotFoundException(
        "Las notas del foro todavía no están disponibles",
      );
    }

    const calificacion = await this.prisma.calificacionEstudiante.findFirst({
      where: {
        actividadId: foro.actividadCalificable.id,

        estudianteId: usuario.id,

        estado: EstadoCalificacion.PUBLICADA,
      },

      include: {
        respuestaForo: {
          include: {
            archivos: {
              where: {
                estaActivo: true,
              },
            },
          },
        },

        evaluacionesCriterios: {
          include: {
            criterio: true,
          },
        },
      },
    });

    if (!calificacion) {
      throw new NotFoundException(
        "No tienes una nota publicada para este foro",
      );
    }

    return {
      foro: {
        id: foro.id,

        titulo: foro.titulo,

        notasPublicadasEn: foro.notasPublicadasEn,
      },

      calificacion,
    };
  }
}