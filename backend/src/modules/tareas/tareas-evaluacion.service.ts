import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccionHistorialCalificacion,
  EstadoActividadCalificable,
  EstadoCalificacion,
  EstadoInscripcion,
  EstadoTarea,
  ModalidadTarea,
  OrigenGrupoTarea,
  Prisma,
  Rol,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  CalificarEntregaTareaDto,
} from './dto/calificar-entrega-tarea.dto';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

@Injectable()
export class TareasEvaluacionService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private async obtenerTareaDocente(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Solo el docente puede evaluar esta tarea',
      );
    }

    const tarea =
      await this.prisma.tareaCurso.findFirst({
        where: {
          id:
            tareaId,

          cursoId,

          estaActiva:
            true,

          curso: {
            docenteId:
              usuario.id,
          },
        },

        include: {
          actividadCalificable:
            true,

          conjuntoGrupo: {
            include: {
              grupos: {
                where: {
                  estaActivo:
                    true,
                },

                orderBy: {
                  orden:
                    'asc',
                },

                include: {
                  integrantes: {
                    where: {
                      estaActivo:
                        true,
                    },

                    orderBy: [
                      {
                        esRepresentante:
                          'desc',
                      },
                      {
                        estudiante: {
                          apellidoPaterno:
                            'asc',
                        },
                      },
                    ],

                    include: {
                      estudiante: {
                        select: {
                          id:
                            true,

                          nombres:
                            true,

                          apellidoPaterno:
                            true,

                          apellidoMaterno:
                            true,

                          correo:
                            true,

                          fotoPerfilUrl:
                            true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },

          equiposAfinidad: {
            where: {
              estaActivo:
                true,
            },

            orderBy: {
              creadoEn:
                'asc',
            },

            include: {
              integrantes: {
                where: {
                  estaActivo:
                    true,
                },

                orderBy: [
                  {
                    esRepresentante:
                      'desc',
                  },
                  {
                    estudiante: {
                      apellidoPaterno:
                        'asc',
                    },
                  },
                ],

                include: {
                  estudiante: {
                    select: {
                      id:
                        true,

                      nombres:
                        true,

                      apellidoPaterno:
                        true,

                      apellidoMaterno:
                        true,

                      correo:
                        true,

                      fotoPerfilUrl:
                        true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!tarea) {
      throw new NotFoundException(
        'La tarea no existe o no pertenece al docente autenticado',
      );
    }

    return tarea;
  }

  private async obtenerEstudiantesCurso(
    cursoId:
      number,
  ) {
    const inscripciones =
      await this.prisma.inscripcionCurso.findMany({
        where: {
          cursoId,

          estado:
            EstadoInscripcion.ACTIVA,

          estudiante: {
            rol:
              Rol.ESTUDIANTE,

            estaActivo:
              true,
          },
        },

        orderBy: [
          {
            estudiante: {
              apellidoPaterno:
                'asc',
            },
          },
          {
            estudiante: {
              nombres:
                'asc',
            },
          },
        ],

        select: {
          estudiante: {
            select: {
              id:
                true,

              nombres:
                true,

              apellidoPaterno:
                true,

              apellidoMaterno:
                true,

              correo:
                true,

              fotoPerfilUrl:
                true,
            },
          },
        },
      });

    return inscripciones.map(
      (
        item,
      ) =>
        item.estudiante,
    );
  }

  private tareaEstaCerrada(
    tarea: {
      estado:
        EstadoTarea;

      estaCerrada:
        boolean;

      fechaCierre:
        Date;
    },
  ) {
    return (
      tarea.estado ===
        EstadoTarea.CERRADA ||
      tarea.estaCerrada ||
      new Date() >=
        tarea.fechaCierre
    );
  }

  private retroalimentacionAutomaticaSinEntrega(
    tarea:
      Awaited<
        ReturnType<
          TareasEvaluacionService['obtenerTareaDocente']
        >
      >,
    estudianteId:
      number,
  ) {
    if (
      tarea.modalidad ===
      ModalidadTarea.INDIVIDUAL
    ) {
      return 'No presentó la tarea.';
    }

    if (
      tarea.origenGrupo ===
      OrigenGrupoTarea.AFINIDAD
    ) {
      const equipo =
        tarea.equiposAfinidad.find(
          (
            item,
          ) =>
            item.integrantes.some(
              (
                integrante,
              ) =>
                integrante.estudiante.id ===
                estudianteId,
            ),
        );

      if (
        !equipo
      ) {
        return 'No conformó un equipo por afinidad ni presentó la tarea.';
      }

      return `El equipo ${equipo.nombre} no presentó la tarea.`;
    }

    if (
      tarea.origenGrupo ===
      OrigenGrupoTarea.PLATAFORMA
    ) {
      const grupo =
        tarea.conjuntoGrupo?.grupos.find(
          (
            item,
          ) =>
            item.integrantes.some(
              (
                integrante,
              ) =>
                integrante.estudiante.id ===
                estudianteId,
            ),
        );

      if (
        !grupo
      ) {
        return 'No tenía un grupo asignado y no presentó la tarea.';
      }

      return `El grupo ${grupo.nombre} no presentó la tarea.`;
    }

    return 'No presentó la tarea.';
  }

  async registrarCerosSinEntregaAlCierre(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    const tarea =
      await this.obtenerTareaDocente(
        usuario,
        cursoId,
        tareaId,
      );

    if (
      !tarea.esCalificable ||
      !tarea.actividadCalificable
    ) {
      return {
        creadas:
          0,
      };
    }

    if (
      !this.tareaEstaCerrada(
        tarea,
      )
    ) {
      return {
        creadas:
          0,
      };
    }

    if (
      tarea.actividadCalificable.estado ===
      EstadoActividadCalificable.PUBLICADA
    ) {
      return {
        creadas:
          0,
      };
    }

    const estudiantes =
      await this.obtenerEstudiantesCurso(
        cursoId,
      );

    if (
      estudiantes.length ===
      0
    ) {
      return {
        creadas:
          0,
      };
    }

    const existentes =
      await this.prisma.calificacionEstudiante.findMany({
        where: {
          actividadId:
            tarea.actividadCalificable.id,

          estudianteId: {
            in:
              estudiantes.map(
                (
                  estudiante,
                ) =>
                  estudiante.id,
              ),
          },
        },

        select: {
          id:
            true,

          estudianteId:
            true,

          entregaTareaId:
            true,

          estado:
            true,
        },
      });

    const existentePorEstudiante =
      new Map(
        existentes.map(
          (
            item,
          ) => [
            item.estudianteId,
            item,
          ],
        ),
      );

    const sinEntrega =
      estudiantes.filter(
        (
          estudiante,
        ) => {
          const existente =
            existentePorEstudiante.get(
              estudiante.id,
            );

          if (
            !existente
          ) {
            return true;
          }

          return (
            existente.entregaTareaId ===
              null &&
            existente.estado !==
              EstadoCalificacion.PUBLICADA
          );
        },
      );

    if (
      sinEntrega.length ===
      0
    ) {
      return {
        creadas:
          0,

        actualizadas:
          0,
      };
    }

    const ahora =
      new Date();

    let creadas =
      0;

    let actualizadas =
      0;

    await this.prisma.$transaction(
      async (
        tx,
      ) => {
        for (
          const estudiante
          of sinEntrega
        ) {
          const existente =
            existentePorEstudiante.get(
              estudiante.id,
            );

          const registro =
            await tx.calificacionEstudiante.upsert({
              where: {
                actividadId_estudianteId: {
                  actividadId:
                    tarea.actividadCalificable!.id,

                  estudianteId:
                    estudiante.id,
                },
              },

              create: {
                actividadId:
                  tarea.actividadCalificable!.id,

                estudianteId:
                  estudiante.id,

                calificadorId:
                  usuario.id,

                entregaTareaId:
                  null,

                grupoCursoId:
                  null,

                notaBase:
                  new Prisma.Decimal(
                    0,
                  ),

                descuentoRetraso:
                  new Prisma.Decimal(
                    0,
                  ),

                ajusteIndividual:
                  new Prisma.Decimal(
                    0,
                  ),

                notaFinal:
                  new Prisma.Decimal(
                    0,
                  ),

                retroalimentacion:
                  this.retroalimentacionAutomaticaSinEntrega(
                    tarea,
                    estudiante.id,
                  ),

                estado:
                  EstadoCalificacion.CALIFICADA,

                calificadaEn:
                  ahora,

                publicadaEn:
                  null,
              },

              update: {
                calificadorId:
                  usuario.id,

                entregaTareaId:
                  null,

                grupoCursoId:
                  null,

                notaBase:
                  new Prisma.Decimal(
                    0,
                  ),

                descuentoRetraso:
                  new Prisma.Decimal(
                    0,
                  ),

                ajusteIndividual:
                  new Prisma.Decimal(
                    0,
                  ),

                notaFinal:
                  new Prisma.Decimal(
                    0,
                  ),

                retroalimentacion:
                  this.retroalimentacionAutomaticaSinEntrega(
                    tarea,
                    estudiante.id,
                  ),

                estado:
                  EstadoCalificacion.CALIFICADA,

                calificadaEn:
                  ahora,

                publicadaEn:
                  null,
              },
            });

          if (
            existente
          ) {
            actualizadas +=
              1;
          } else {
            creadas +=
              1;
          }

          await tx.historialCalificacion.create({
            data: {
              actividadId:
                tarea.actividadCalificable!.id,

              calificacionId:
                registro.id,

              actorId:
                usuario.id,

              accion:
                AccionHistorialCalificacion.CALIFICACION_ACTUALIZADA,

              detalle: {
                tareaId:
                  tarea.id,

                estudianteId:
                  estudiante.id,

                notaBase:
                  0,

                descuentoRetraso:
                  0,

                ajusteIndividual:
                  0,

                notaFinal:
                  0,

                automatico:
                  true,

                motivo:
                  'SIN_ENTREGA_AL_CIERRE',

                retroalimentacion:
                  this.retroalimentacionAutomaticaSinEntrega(
                    tarea,
                    estudiante.id,
                  ),
              },
            },
          });
        }

        await tx.actividadCalificable.update({
          where: {
            id:
              tarea.actividadCalificable!.id,
          },

          data: {
            estado:
              EstadoActividadCalificable.CALIFICANDO,
          },
        });
      },
    );

    return {
      creadas,
      actualizadas,
    };
  }

  private async obtenerEntregas(
    tareaId:
      number,
  ) {
    return this.prisma.entregaTarea.findMany({
      where: {
        tareaId,

        estaActiva:
          true,
      },

      orderBy: [
        {
          enviadaEn:
            'desc',
        },
        {
          creadoEn:
            'desc',
        },
      ],

      include: {
        autorEntrega: {
          select: {
            id:
              true,

            nombres:
              true,

            apellidoPaterno:
              true,
          },
        },

        estudiante: {
          select: {
            id:
              true,

            nombres:
              true,

            apellidoPaterno:
              true,

            apellidoMaterno:
              true,

            correo:
              true,

            fotoPerfilUrl:
              true,
          },
        },

        grupoCurso: {
          select: {
            id:
              true,

            nombre:
              true,
          },
        },

        equipoAfinidadTarea: {
          select: {
            id:
              true,

            nombre:
              true,
          },
        },

        archivos: {
          where: {
            estaActivo:
              true,
          },

          orderBy: {
            creadoEn:
              'asc',
          },

          select: {
            id:
              true,

            nombreOriginal:
              true,

            mimeType:
              true,

            extension:
              true,

            tamanioBytes:
              true,

            permiteDescarga:
              true,

            creadoEn:
              true,
          },
        },

        calificaciones: {
          include: {
            estudiante: {
              select: {
                id:
                  true,

                nombres:
                  true,

                apellidoPaterno:
                  true,

                apellidoMaterno:
                  true,
              },
            },
          },
        },
      },
    });
  }

  private construirEquipos(
    tarea:
      Awaited<
        ReturnType<
          TareasEvaluacionService['obtenerTareaDocente']
        >
      >,
    entregas:
      Awaited<
        ReturnType<
          TareasEvaluacionService['obtenerEntregas']
        >
      >,
  ) {
    if (
      tarea.modalidad !==
      ModalidadTarea.GRUPAL
    ) {
      return [];
    }

    if (
      tarea.origenGrupo ===
      OrigenGrupoTarea.PLATAFORMA
    ) {
      return (
        tarea.conjuntoGrupo?.grupos ??
        []
      ).map(
        (
          grupo,
        ) => {
          const entrega =
            entregas.find(
              (
                item,
              ) =>
                item.grupoCursoId ===
                grupo.id,
            ) ??
            null;

          return {
            id:
              grupo.id,

            tipo:
              'PLATAFORMA' as const,

            nombre:
              grupo.nombre,

            estado:
              tarea.conjuntoGrupo?.estaBloqueado
                ? 'BLOQUEADO'
                : 'ACTIVO',

            entregaId:
              entrega?.id ??
              null,

            estadoEntrega:
              entrega?.estado ??
              'PENDIENTE',

            integrantes:
              grupo.integrantes.map(
                (
                  integrante,
                ) => ({
                  estudiante:
                    integrante.estudiante,

                  esRepresentante:
                    integrante.esRepresentante,
                }),
              ),
          };
        },
      );
    }

    if (
      tarea.origenGrupo ===
      OrigenGrupoTarea.AFINIDAD
    ) {
      return tarea.equiposAfinidad.map(
        (
          equipo,
        ) => {
          const entrega =
            entregas.find(
              (
                item,
              ) =>
                item.equipoAfinidadTareaId ===
                equipo.id,
            ) ??
            null;

          return {
            id:
              equipo.id,

            tipo:
              'AFINIDAD' as const,

            nombre:
              equipo.nombre,

            estado:
              equipo.estado,

            entregaId:
              entrega?.id ??
              null,

            estadoEntrega:
              entrega?.estado ??
              'PENDIENTE',

            integrantes:
              equipo.integrantes.map(
                (
                  integrante,
                ) => ({
                  estudiante:
                    integrante.estudiante,

                  esRepresentante:
                    integrante.esRepresentante,
                }),
              ),
          };
        },
      );
    }

    return [];
  }

  async obtenerPanel(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    const tarea =
      await this.obtenerTareaDocente(
        usuario,
        cursoId,
        tareaId,
      );

    if (
      this.tareaEstaCerrada(
        tarea,
      )
    ) {
      await this.registrarCerosSinEntregaAlCierre(
        usuario,
        cursoId,
        tareaId,
      );
    }

    const [
      estudiantes,
      entregas,
    ] =
      await Promise.all([
        this.obtenerEstudiantesCurso(
          cursoId,
        ),
        this.obtenerEntregas(
          tareaId,
        ),
      ]);

    const calificaciones =
      tarea.actividadCalificable
        ? await this.prisma.calificacionEstudiante.findMany({
            where: {
              actividadId:
                tarea.actividadCalificable.id,
            },

            include: {
              estudiante: {
                select: {
                  id:
                    true,

                  nombres:
                    true,

                  apellidoPaterno:
                    true,

                  apellidoMaterno:
                    true,

                  correo:
                    true,

                  fotoPerfilUrl:
                    true,
                },
              },
            },
          })
        : [];

    const calificacionPorEstudiante =
      new Map(
        calificaciones.map(
          (
            item,
          ) => [
            item.estudianteId,
            item,
          ],
        ),
      );

    const equipos =
      this.construirEquipos(
        tarea,
        entregas,
      );

    const evaluables =
      tarea.modalidad ===
      ModalidadTarea.INDIVIDUAL
        ? estudiantes.map(
            (
              estudiante,
            ) => {
              const entrega =
                entregas.find(
                  (
                    item,
                  ) =>
                    item.estudianteId ===
                    estudiante.id,
                ) ??
                null;

              const calificacion =
                calificacionPorEstudiante.get(
                  estudiante.id,
                ) ??
                null;

              return {
                clave:
                  `EST-${estudiante.id}`,

                tipo:
                  'ESTUDIANTE' as const,

                nombre:
                  `${estudiante.nombres} ${estudiante.apellidoPaterno}`,

                estudiantes: [
                  estudiante,
                ],

                entrega,

                calificacion,
              };
            },
          )
        : equipos.map(
            (
              equipo,
            ) => {
              const entrega =
                equipo.entregaId
                  ? entregas.find(
                      (
                        item,
                      ) =>
                        item.id ===
                        equipo.entregaId,
                    ) ??
                    null
                  : null;

              return {
                clave:
                  `${equipo.tipo}-${equipo.id}`,

                tipo:
                  'GRUPO' as const,

                nombre:
                  equipo.nombre,

                estudiantes:
                  equipo.integrantes.map(
                    (
                      integrante,
                    ) =>
                      integrante.estudiante,
                  ),

                integrantes:
                  equipo.integrantes,

                estadoEquipo:
                  equipo.estado,

                entrega,

                calificacion:
                  null,
              };
            },
          );

    const filasCalificaciones =
      estudiantes.map(
        (
          estudiante,
        ) => {
          const calificacion =
            calificacionPorEstudiante.get(
              estudiante.id,
            ) ??
            null;

          const equipo =
            equipos.find(
              (
                item,
              ) =>
                item.integrantes.some(
                  (
                    integrante,
                  ) =>
                    integrante.estudiante.id ===
                    estudiante.id,
                ),
            ) ??
            null;

          const entregaIndividual =
            entregas.find(
              (
                item,
              ) =>
                item.estudianteId ===
                estudiante.id,
            ) ??
            null;

          const entregaEquipo =
            equipo?.entregaId
              ? entregas.find(
                  (
                    item,
                  ) =>
                    item.id ===
                    equipo.entregaId,
                ) ??
                null
              : null;

          const entrega =
            entregaIndividual ??
            entregaEquipo ??
            entregas.find(
              (
                item,
              ) =>
                item.calificaciones.some(
                  (
                    nota,
                  ) =>
                    nota.estudianteId ===
                    estudiante.id,
                ),
            ) ??
            null;

          return {
            estudiante,

            grupo:
              equipo
                ? {
                    id:
                      equipo.id,

                    nombre:
                      equipo.nombre,

                    tipo:
                      equipo.tipo,
                  }
                : null,

            entrega: entrega
              ? {
                  id:
                    entrega.id,

                  estado:
                    entrega.estado,

                  enviadaEn:
                    entrega.enviadaEn,

                  entregadaTarde:
                    entrega.entregadaTarde,
                }
              : null,

            calificacion,
          };
        },
      );

    const totalEntregadas =
      entregas.filter(
        (
          item,
        ) =>
          item.estado ===
            'ENTREGADA' ||
          item.estado ===
            'TARDIA',
      ).length;

    const totalTardias =
      entregas.filter(
        (
          item,
        ) =>
          item.estado ===
          'TARDIA',
      ).length;

    const totalCalificadas =
      calificaciones.filter(
        (
          item,
        ) =>
          item.estado ===
            EstadoCalificacion.CALIFICADA ||
          item.estado ===
            EstadoCalificacion.PUBLICADA,
      ).length;

    const totalPublicadas =
      calificaciones.filter(
        (
          item,
        ) =>
          item.estado ===
          EstadoCalificacion.PUBLICADA,
      ).length;

    return {
      tarea: {
        id:
          tarea.id,

        titulo:
          tarea.titulo,

        modalidad:
          tarea.modalidad,

        origenGrupo:
          tarea.origenGrupo,

        modalidadNota:
          tarea.modalidadNota,

        componente:
          tarea.componente,

        puntajeMaximo:
          tarea.puntajeMaximo,

        esCalificable:
          tarea.esCalificable,

        actividadCalificableId:
          tarea.actividadCalificable?.id ??
          null,

        estadoActividadCalificable:
          tarea.actividadCalificable?.estado ??
          null,

        estado:
          tarea.estado,

        estaCerrada:
          tarea.estaCerrada,

        fechaCierre:
          tarea.fechaCierre,
      },

      resumen: {
        totalEstudiantes:
          estudiantes.length,

        totalEntregas:
          entregas.length,

        entregadas:
          totalEntregadas,

        tardias:
          totalTardias,

        pendientes:
          Math.max(
            0,
            estudiantes.length -
            (
              tarea.modalidad ===
              ModalidadTarea.INDIVIDUAL
                ? totalEntregadas
                : 0
            ),
          ),

        calificadas:
          totalCalificadas,

        publicadas:
          totalPublicadas,
      },

      evaluables,

      calificaciones:
        filasCalificaciones,

      equipos,
    };
  }

  async obtenerRevisionEntrega(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
    entregaId:
      number,
  ) {
    const tarea =
      await this.obtenerTareaDocente(
        usuario,
        cursoId,
        tareaId,
      );

    const entrega =
      await this.prisma.entregaTarea.findFirst({
        where: {
          id:
            entregaId,

          tareaId,

          estaActiva:
            true,
        },

        include: {
          autorEntrega: {
            select: {
              id:
                true,

              nombres:
                true,

              apellidoPaterno:
                true,

              apellidoMaterno:
                true,

              fotoPerfilUrl:
                true,
            },
          },

          estudiante: {
            select: {
              id:
                true,

              nombres:
                true,

              apellidoPaterno:
                true,

              apellidoMaterno:
                true,

              correo:
                true,

              fotoPerfilUrl:
                true,
            },
          },

          grupoCurso: {
            select: {
              id:
                true,

              nombre:
                true,

              integrantes: {
                where: {
                  estaActivo:
                    true,
                },

                orderBy: [
                  {
                    esRepresentante:
                      'desc',
                  },
                  {
                    estudiante: {
                      apellidoPaterno:
                        'asc',
                    },
                  },
                ],

                select: {
                  esRepresentante:
                    true,

                  estudiante: {
                    select: {
                      id:
                        true,

                      nombres:
                        true,

                      apellidoPaterno:
                        true,

                      apellidoMaterno:
                        true,

                      correo:
                        true,

                      fotoPerfilUrl:
                        true,
                    },
                  },
                },
              },
            },
          },

          equipoAfinidadTarea: {
            select: {
              id:
                true,

              nombre:
                true,

              estado:
                true,

              integrantes: {
                where: {
                  estaActivo:
                    true,
                },

                orderBy: [
                  {
                    esRepresentante:
                      'desc',
                  },
                  {
                    estudiante: {
                      apellidoPaterno:
                        'asc',
                    },
                  },
                ],

                select: {
                  esRepresentante:
                    true,

                  estudiante: {
                    select: {
                      id:
                        true,

                      nombres:
                        true,

                      apellidoPaterno:
                        true,

                      apellidoMaterno:
                        true,

                      correo:
                        true,

                      fotoPerfilUrl:
                        true,
                    },
                  },
                },
              },
            },
          },

          archivos: {
            where: {
              estaActivo:
                true,
            },

            orderBy: {
              creadoEn:
                'asc',
            },

            select: {
              id:
                true,

              nombreOriginal:
                true,

              mimeType:
                true,

              extension:
                true,

              tamanioBytes:
                true,

              permiteDescarga:
                true,

              creadoEn:
                true,
            },
          },

          calificaciones: {
            orderBy: {
              estudianteId:
                'asc',
            },

            include: {
              estudiante: {
                select: {
                  id:
                    true,

                  nombres:
                    true,

                  apellidoPaterno:
                    true,

                  apellidoMaterno:
                    true,

                  fotoPerfilUrl:
                    true,
                },
              },
            },
          },
        },
      });

    if (!entrega) {
      throw new NotFoundException(
        'La entrega no existe o no pertenece a esta tarea',
      );
    }

    const grupo =
      entrega.grupoCurso
        ? {
            id:
              entrega.grupoCurso.id,

            tipo:
              'PLATAFORMA' as const,

            nombre:
              entrega.grupoCurso.nombre,

            estado:
              'ACTIVO',

            integrantes:
              entrega.grupoCurso.integrantes,
          }
        : entrega.equipoAfinidadTarea
          ? {
              id:
                entrega.equipoAfinidadTarea.id,

              tipo:
                'AFINIDAD' as const,

              nombre:
                entrega.equipoAfinidadTarea.nombre,

              estado:
                entrega.equipoAfinidadTarea.estado,

              integrantes:
                entrega.equipoAfinidadTarea.integrantes,
            }
          : null;

    const representante =
      grupo?.integrantes.find(
        (
          integrante,
        ) =>
          integrante.esRepresentante,
      )?.estudiante ??
      null;

    const estudianteIndividual =
      entrega.estudiante ??
      null;

    return {
      tarea: {
        id:
          tarea.id,

        cursoId:
          tarea.cursoId,

        titulo:
          tarea.titulo,

        descripcion:
          tarea.descripcion,

        tipo:
          tarea.tipo,

        modalidad:
          tarea.modalidad,

        modalidadNota:
          tarea.modalidadNota,

        componente:
          tarea.componente,

        puntajeMaximo:
          Number(
            tarea.puntajeMaximo,
          ),

        esCalificable:
          tarea.esCalificable,

        configuracionTipo:
          tarea.configuracionTipo,
      },

      entrega: {
        id:
          entrega.id,

        estado:
          entrega.estado,

        contenido:
          entrega.contenido,

        esGrupal:
          entrega.esGrupal,

        entregadaTarde:
          entrega.entregadaTarde,

        minutosRetraso:
          entrega.minutosRetraso,

        descuentoCalculado:
          Number(
            entrega.descuentoCalculado ??
            0,
          ),

        enviadaEn:
          entrega.enviadaEn,

        editadaEn:
          entrega.editadaEn,

        creadoEn:
          entrega.creadoEn,

        archivos:
          entrega.archivos,

        autorEntrega:
          entrega.autorEntrega,

        calificaciones:
          entrega.calificaciones.map(
            (
              calificacion,
            ) => ({
              ...calificacion,

              notaBase:
                Number(
                  calificacion.notaBase,
                ),

              descuentoRetraso:
                Number(
                  calificacion.descuentoRetraso,
                ),

              ajusteIndividual:
                Number(
                  calificacion.ajusteIndividual,
                ),

              notaFinal:
                Number(
                  calificacion.notaFinal,
                ),
            }),
          ),
      },

      sujeto: grupo
        ? {
            tipo:
              'GRUPO' as const,

            id:
              grupo.id,

            nombre:
              grupo.nombre,

            origen:
              grupo.tipo,

            estado:
              grupo.estado,

            representante,

            integrantes:
              grupo.integrantes,
          }
        : {
            tipo:
              'ESTUDIANTE' as const,

            id:
              estudianteIndividual?.id ??
              0,

            nombre:
              estudianteIndividual
                ? `${estudianteIndividual.nombres} ${estudianteIndividual.apellidoPaterno}`
                : 'Estudiante',

            estudiante:
              estudianteIndividual,
          },
    };
  }

  async calificarEntrega(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
    entregaId:
      number,
    datos:
      CalificarEntregaTareaDto,
  ) {
    const tarea =
      await this.obtenerTareaDocente(
        usuario,
        cursoId,
        tareaId,
      );

    if (
      !tarea.esCalificable ||
      !tarea.actividadCalificable
    ) {
      throw new BadRequestException(
        'La tarea no tiene una actividad calificable asociada',
      );
    }

    if (
      tarea.actividadCalificable.estado ===
      EstadoActividadCalificable.PUBLICADA
    ) {
      throw new BadRequestException(
        'Las notas ya están publicadas. Reabre la publicación antes de modificar calificaciones.',
      );
    }

    const entrega =
      await this.prisma.entregaTarea.findFirst({
        where: {
          id:
            entregaId,

          tareaId,

          estaActiva:
            true,
        },

        include: {
          grupoCurso: {
            include: {
              integrantes: {
                where: {
                  estaActivo:
                    true,
                },

                select: {
                  estudianteId:
                    true,
                },
              },
            },
          },

          equipoAfinidadTarea: {
            include: {
              integrantes: {
                where: {
                  estaActivo:
                    true,
                },

                select: {
                  estudianteId:
                    true,
                },
              },
            },
          },
        },
      });

    if (!entrega) {
      throw new NotFoundException(
        'La entrega no existe',
      );
    }

    const estudiantesIds =
      entrega.estudianteId
        ? [
            entrega.estudianteId,
          ]
        : entrega.grupoCurso
          ? entrega.grupoCurso.integrantes.map(
              (
                item,
              ) =>
                item.estudianteId,
            )
          : entrega.equipoAfinidadTarea
            ? entrega.equipoAfinidadTarea.integrantes.map(
                (
                  item,
                ) =>
                  item.estudianteId,
              )
            : [];

    if (
      estudiantesIds.length ===
      0
    ) {
      throw new BadRequestException(
        'No fue posible determinar a quién pertenece la entrega',
      );
    }

    const descuento =
      Number(
        entrega.descuentoCalculado ??
        0,
      );

    const modalidadMixta =
      tarea.modalidadNota ===
      'GRUPAL_E_INDIVIDUAL';

    const ajustes =
      new Map<number, number>();

    if (
      modalidadMixta &&
      Array.isArray(
        datos.ajustesIndividuales,
      )
    ) {
      for (
        const item
        of datos.ajustesIndividuales
      ) {
        const estudianteId =
          Number(
            item?.estudianteId,
          );

        const ajuste =
          Number(
            item?.ajuste ??
            0,
          );

        if (
          !Number.isInteger(
            estudianteId,
          ) ||
          !estudiantesIds.includes(
            estudianteId,
          )
        ) {
          continue;
        }

        if (
          !Number.isFinite(
            ajuste,
          ) ||
          ajuste <
            -100 ||
          ajuste >
            100
        ) {
          throw new BadRequestException(
            'Los ajustes individuales deben estar entre -100 y 100',
          );
        }

        ajustes.set(
          estudianteId,
          ajuste,
        );
      }
    }

    const ahora =
      new Date();

    const resultados:
      Array<{
        estudianteId:
          number;

        ajusteIndividual:
          number;

        notaFinal:
          number;
      }> =
      [];

    await this.prisma.$transaction(
      async (
        tx,
      ) => {
        for (
          const estudianteId
          of estudiantesIds
        ) {
          const ajuste =
            modalidadMixta
              ? ajustes.get(
                  estudianteId,
                ) ??
                0
              : 0;

          const notaFinal =
            Math.max(
              0,
              Math.min(
                100,
                Number(
                  datos.notaBase,
                ) -
                descuento +
                ajuste,
              ),
            );

          const registro =
            await tx.calificacionEstudiante.upsert({
              where: {
                actividadId_estudianteId: {
                  actividadId:
                    tarea.actividadCalificable!.id,

                  estudianteId,
                },
              },

              create: {
                actividadId:
                  tarea.actividadCalificable!.id,

                estudianteId,

                calificadorId:
                  usuario.id,

                entregaTareaId:
                  entrega.id,

                grupoCursoId:
                  entrega.grupoCursoId,

                notaBase:
                  new Prisma.Decimal(
                    datos.notaBase,
                  ),

                descuentoRetraso:
                  new Prisma.Decimal(
                    descuento,
                  ),

                ajusteIndividual:
                  new Prisma.Decimal(
                    ajuste,
                  ),

                notaFinal:
                  new Prisma.Decimal(
                    notaFinal,
                  ),

                retroalimentacion:
                  datos.retroalimentacion?.trim() ||
                  null,

                estado:
                  EstadoCalificacion.CALIFICADA,

                calificadaEn:
                  ahora,

                publicadaEn:
                  null,
              },

              update: {
                calificadorId:
                  usuario.id,

                entregaTareaId:
                  entrega.id,

                grupoCursoId:
                  entrega.grupoCursoId,

                notaBase:
                  new Prisma.Decimal(
                    datos.notaBase,
                  ),

                descuentoRetraso:
                  new Prisma.Decimal(
                    descuento,
                  ),

                ajusteIndividual:
                  new Prisma.Decimal(
                    ajuste,
                  ),

                notaFinal:
                  new Prisma.Decimal(
                    notaFinal,
                  ),

                retroalimentacion:
                  datos.retroalimentacion?.trim() ||
                  null,

                estado:
                  EstadoCalificacion.CALIFICADA,

                calificadaEn:
                  ahora,

                publicadaEn:
                  null,

                anuladaEn:
                  null,
              },
            });

          resultados.push({
            estudianteId,
            ajusteIndividual:
              ajuste,
            notaFinal,
          });

          await tx.historialCalificacion.create({
            data: {
              actividadId:
                tarea.actividadCalificable!.id,

              calificacionId:
                registro.id,

              actorId:
                usuario.id,

              accion:
                AccionHistorialCalificacion.CALIFICACION_ACTUALIZADA,

              detalle: {
                tareaId:
                  tarea.id,

                entregaId:
                  entrega.id,

                estudianteId,

                notaBase:
                  datos.notaBase,

                descuentoRetraso:
                  descuento,

                ajusteIndividual:
                  ajuste,

                notaFinal,

                modalidadNota:
                  tarea.modalidadNota,

                grupal:
                  tarea.modalidad ===
                  ModalidadTarea.GRUPAL,
              },
            },
          });
        }

        await tx.actividadCalificable.update({
          where: {
            id:
              tarea.actividadCalificable!.id,
          },

          data: {
            estado:
              EstadoActividadCalificable.CALIFICANDO,
          },
        });
      },
    );

    return {
      mensaje:
        modalidadMixta &&
        estudiantesIds.length >
          1
          ? 'Calificación grupal e individual guardada correctamente'
          : estudiantesIds.length >
              1
            ? 'Calificación grupal guardada y replicada a todos los integrantes'
            : 'Calificación guardada correctamente',

      estudiantesAfectados:
        estudiantesIds.length,

      resultados,
    };
  }

  async publicarNotas(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    const tarea =
      await this.obtenerTareaDocente(
        usuario,
        cursoId,
        tareaId,
      );

    if (
      !tarea.esCalificable ||
      !tarea.actividadCalificable
    ) {
      throw new BadRequestException(
        'La tarea no tiene actividad calificable',
      );
    }

    if (
      this.tareaEstaCerrada(
        tarea,
      )
    ) {
      await this.registrarCerosSinEntregaAlCierre(
        usuario,
        cursoId,
        tareaId,
      );
    }

    const estudiantes =
      await this.obtenerEstudiantesCurso(
        cursoId,
      );

    const calificaciones =
      await this.prisma.calificacionEstudiante.findMany({
        where: {
          actividadId:
            tarea.actividadCalificable.id,

          estudianteId: {
            in:
              estudiantes.map(
                (
                  item,
                ) =>
                  item.id,
              ),
          },
        },
      });

    const listas =
      calificaciones.filter(
        (
          item,
        ) =>
          item.estado ===
            EstadoCalificacion.CALIFICADA ||
          item.estado ===
            EstadoCalificacion.PUBLICADA,
      );

    if (
      listas.length !==
      estudiantes.length
    ) {
      throw new BadRequestException(
        `Faltan ${Math.max(
          0,
          estudiantes.length -
          listas.length,
        )} estudiante(s) por calificar antes de publicar`,
      );
    }

    const ahora =
      new Date();

    await this.prisma.$transaction(
      async (
        tx,
      ) => {
        await tx.calificacionEstudiante.updateMany({
          where: {
            actividadId:
              tarea.actividadCalificable!.id,

            estado:
              EstadoCalificacion.CALIFICADA,
          },

          data: {
            estado:
              EstadoCalificacion.PUBLICADA,

            publicadaEn:
              ahora,
          },
        });

        await tx.actividadCalificable.update({
          where: {
            id:
              tarea.actividadCalificable!.id,
          },

          data: {
            estado:
              EstadoActividadCalificable.PUBLICADA,

            visibleParaEstudiantes:
              true,

            publicadaEn:
              ahora,
          },
        });

        await tx.historialCalificacion.create({
          data: {
            actividadId:
              tarea.actividadCalificable!.id,

            actorId:
              usuario.id,

            accion:
              AccionHistorialCalificacion.CALIFICACIONES_PUBLICADAS,

            detalle: {
              tareaId:
                tarea.id,

              total:
                estudiantes.length,
            },
          },
        });
      },
    );

    return {
      mensaje:
        'Notas publicadas correctamente',

      total:
        estudiantes.length,
    };
  }

  async obtenerHistorial(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    const tarea =
      await this.obtenerTareaDocente(
        usuario,
        cursoId,
        tareaId,
      );

    const entregas =
      await this.prisma.entregaTarea.findMany({
        where: {
          tareaId,

          estaActiva:
            true,
        },

        include: {
          autorEntrega: {
            select: {
              id:
                true,

              nombres:
                true,

              apellidoPaterno:
                true,
            },
          },

          estudiante: {
            select: {
              id:
                true,

              nombres:
                true,

              apellidoPaterno:
                true,
            },
          },

          grupoCurso: {
            select: {
              id:
                true,

              nombre:
                true,
            },
          },

          equipoAfinidadTarea: {
            select: {
              id:
                true,

              nombre:
                true,
            },
          },

          archivos: {
            orderBy: {
              creadoEn:
                'asc',
            },

            select: {
              id:
                true,

              nombreOriginal:
                true,

              estaActivo:
                true,

              creadoEn:
                true,
            },
          },
        },
      });

    const historialCalificaciones =
      tarea.actividadCalificable
        ? await this.prisma.historialCalificacion.findMany({
            where: {
              actividadId:
                tarea.actividadCalificable.id,
            },

            orderBy: {
              registradoEn:
                'desc',
            },

            include: {
              actor: {
                select: {
                  id:
                    true,

                  nombres:
                    true,

                  apellidoPaterno:
                    true,

                  rol:
                    true,
                },
              },
            },
          })
        : [];

    const eventosEntrega =
      entregas.flatMap(
        (
          entrega,
        ) => {
          const sujeto =
            entrega.estudiante
              ? `${entrega.estudiante.nombres} ${entrega.estudiante.apellidoPaterno}`
              : entrega.grupoCurso?.nombre ??
                entrega.equipoAfinidadTarea?.nombre ??
                'Entrega grupal';

          const eventos:
            Array<{
              id:
                string;

              tipo:
                string;

              titulo:
                string;

              descripcion:
                string;

              fecha:
                Date;
            }> =
            [
              {
                id:
                  `entrega-creada-${entrega.id}`,

                tipo:
                  'BORRADOR',

                titulo:
                  `${sujeto} inició una entrega`,

                descripcion:
                  'Se creó el borrador de la entrega.',

                fecha:
                  entrega.creadoEn,
              },
            ];

          if (
            entrega.enviadaEn
          ) {
            eventos.push({
              id:
                `entrega-enviada-${entrega.id}`,

              tipo:
                entrega.entregadaTarde
                  ? 'TARDIA'
                  : 'ENTREGA',

              titulo:
                `${sujeto} realizó la entrega`,

              descripcion:
                entrega.entregadaTarde
                  ? `Entrega tardía · ${entrega.minutosRetraso} minuto(s) de retraso.`
                  : 'Entrega registrada dentro del plazo.',

              fecha:
                entrega.enviadaEn,
            });
          }

          if (
            entrega.editadaEn
          ) {
            eventos.push({
              id:
                `entrega-editada-${entrega.id}`,

              tipo:
                'EDICION',

              titulo:
                `${sujeto} actualizó la entrega`,

              descripcion:
                'La entrega fue modificada después de su creación.',

              fecha:
                entrega.editadaEn,
            });
          }

          for (
            const archivo
            of entrega.archivos
          ) {
            eventos.push({
              id:
                `archivo-${archivo.id}`,

              tipo:
                archivo.estaActivo
                  ? 'ARCHIVO'
                  : 'ARCHIVO_RETIRADO',

              titulo:
                archivo.estaActivo
                  ? `${sujeto} adjuntó un archivo`
                  : `${sujeto} retiró un archivo`,

              descripcion:
                archivo.nombreOriginal,

              fecha:
                archivo.creadoEn,
            });
          }

          return eventos;
        },
      );

    const eventosCalificacion =
      historialCalificaciones.map(
        (
          item,
        ) => ({
          id:
            `cal-${item.id}`,

          tipo:
            item.accion,

          titulo:
            item.accion ===
            AccionHistorialCalificacion.CALIFICACIONES_PUBLICADAS
              ? 'El docente publicó las notas'
              : 'El docente actualizó una calificación',

          descripcion:
            item.detalle
              ? JSON.stringify(
                  item.detalle,
                )
              : 'Movimiento de calificación.',

          fecha:
            item.registradoEn,

          actor:
            item.actor,
        }),
      );

    return {
      total:
        eventosEntrega.length +
        eventosCalificacion.length,

      eventos:
        [
          ...eventosEntrega,
          ...eventosCalificacion,
        ].sort(
          (
            a,
            b,
          ) =>
            new Date(
              b.fecha,
            ).getTime() -
            new Date(
              a.fecha,
            ).getTime(),
        ),
    };
  }
}