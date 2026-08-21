import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ComponenteEvaluacion,
  EstadoActividadCalificable,
  EstadoCalificacion,
  EstadoCurso,
  EstadoInscripcion,
  Prisma,
  Rol,
  TipoOrigenActividad,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ActualizarActividadCalificableDto,
} from './dto/actualizar-actividad-calificable.dto';

import {
  CrearActividadCalificableDto,
} from './dto/crear-actividad-calificable.dto';

import {
  GuardarCalificacionDto,
} from './dto/guardar-calificacion.dto';

import {
  PublicarCalificacionesDto,
} from './dto/publicar-calificaciones.dto';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

@Injectable()
export class CalificacionesService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private validarDocente(
    usuario:
      UsuarioAutenticado,
  ) {
    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Solo el docente puede administrar calificaciones',
      );
    }
  }

  private validarEstudiante(
    usuario:
      UsuarioAutenticado,
  ) {
    if (
      usuario.rol !==
      Rol.ESTUDIANTE
    ) {
      throw new ForbiddenException(
        'Solo el estudiante puede consultar sus propias calificaciones',
      );
    }
  }

  private async obtenerCursoDocente(
    docenteId:
      number,
    cursoId:
      number,
  ) {
    const curso =
      await this.prisma.curso.findFirst({
        where: {
          id:
            cursoId,
          docenteId,
        },

        select: {
          id:
            true,
          estado:
            true,
          planificacionId:
            true,
          materia: {
            select: {
              id:
                true,
              nombre:
                true,
              codigo:
                true,
            },
          },
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe o no pertenece al docente autenticado',
      );
    }

    if (
      curso.estado ===
      EstadoCurso.FINALIZADO
    ) {
      throw new BadRequestException(
        'No puedes modificar calificaciones de un curso finalizado',
      );
    }

    return curso;
  }

  private async validarHitoCurso(
    planificacionId:
      number | null,
    hitoId:
      number,
  ) {
    if (
      !planificacionId
    ) {
      throw new BadRequestException(
        'El curso no tiene una planificación académica asignada',
      );
    }

    const hito =
      await this.prisma.hitoAcademico.findFirst({
        where: {
          id:
            hitoId,
          planificacionId,
        },

        select: {
          id:
            true,
          numero:
            true,
          codigo:
            true,
          nombre:
            true,
          puntajeContinua:
            true,
          puntajeProcesual:
            true,
          fechaInicio:
            true,
          fechaFin:
            true,
        },
      });

    if (!hito) {
      throw new BadRequestException(
        'El hito no pertenece a la planificación del curso',
      );
    }

    return hito;
  }

  private obtenerPuntajeMaximoComponente(
    componente:
      ComponenteEvaluacion,
    hito: {
      puntajeContinua:
        number;

      puntajeProcesual:
        number;
    },
  ) {
    return componente ===
      ComponenteEvaluacion.CONTINUA
      ? hito.puntajeContinua
      : hito.puntajeProcesual;
  }

  private limitarNotaSobre100(
    valor:
      number,
  ) {
    return Math.max(
      0,
      Math.min(
        100,
        valor,
      ),
    );
  }

  private calcularNotaFinalActividad(
    datos:
      GuardarCalificacionDto,
  ) {
    const notaBase =
      this.limitarNotaSobre100(
        datos.notaBase,
      );

    const descuento =
      Math.max(
        0,
        datos.descuentoRetraso ??
        0,
      );

    const ajuste =
      datos.ajusteIndividual ??
      0;

    return this.limitarNotaSobre100(
      notaBase -
      descuento +
      ajuste,
    );
  }

  private convertirPromedio(
    promedioSobre100:
      number,
    puntajeMaximo:
      number,
  ) {
    const notaExacta =
      (
        promedioSobre100 *
        puntajeMaximo
      ) /
      100;

    return {
      notaExacta:
        Number(
          notaExacta.toFixed(
            4,
          ),
        ),

      notaRedondeada:
        Math.round(
          notaExacta,
        ),
    };
  }

  private async obtenerActividadDocente(
    docenteId:
      number,
    cursoId:
      number,
    actividadId:
      number,
  ) {
    const actividad =
      await this.prisma.actividadCalificable.findFirst({
        where: {
          id:
            actividadId,
          cursoId,
          curso: {
            docenteId,
          },
        },

        include: {
          hito:
            true,
        },
      });

    if (!actividad) {
      throw new NotFoundException(
        'La actividad calificable no existe',
      );
    }

    return actividad;
  }

  async crearActividad(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    datos:
      CrearActividadCalificableDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const curso =
      await this.obtenerCursoDocente(
        usuario.id,
        cursoId,
      );

    const hito =
      await this.validarHitoCurso(
        curso.planificacionId,
        datos.hitoId,
      );

    const actividad =
      await this.prisma.actividadCalificable.create({
        data: {
          cursoId,
          hitoId:
            hito.id,
          creadorId:
            usuario.id,
          origen:
            datos.origen,
          componente:
            datos.componente,
          titulo:
            datos.titulo.trim(),
          descripcion:
            datos.descripcion?.trim() ||
            null,
          puntajeMaximo:
            new Prisma.Decimal(
              100,
            ),
          participaEnPromedio:
            datos.participaEnPromedio ??
            true,
          orden:
            datos.orden ??
            0,
          visibleParaEstudiantes:
            datos.visibleParaEstudiantes ??
            false,
          estado:
            EstadoActividadCalificable.BORRADOR,
        },
      });

    await this.prisma.historialCalificacion.create({
      data: {
        actividadId:
          actividad.id,
        actorId:
          usuario.id,
        accion:
          'ACTIVIDAD_CREADA',
        detalle: {
          origen:
            datos.origen,
          componente:
            datos.componente,
          hitoId:
            hito.id,
        },
      },
    });

    return {
      mensaje:
        'Actividad calificable creada correctamente',
      actividad,
      conversion: {
        componente:
          datos.componente,
        puntajeMaximo:
          this.obtenerPuntajeMaximoComponente(
            datos.componente,
            hito,
          ),
      },
    };
  }

  async actualizarActividad(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    actividadId:
      number,
    datos:
      ActualizarActividadCalificableDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const actividad =
      await this.obtenerActividadDocente(
        usuario.id,
        cursoId,
        actividadId,
      );

    const actualizada =
      await this.prisma.actividadCalificable.update({
        where: {
          id:
            actividad.id,
        },

        data: {
          ...(datos.titulo !==
          undefined
            ? {
                titulo:
                  datos.titulo.trim(),
              }
            : {}),
          ...(datos.descripcion !==
          undefined
            ? {
                descripcion:
                  datos.descripcion.trim() ||
                  null,
              }
            : {}),
          ...(datos.componente !==
          undefined
            ? {
                componente:
                  datos.componente,
              }
            : {}),
          ...(datos.estado !==
          undefined
            ? {
                estado:
                  datos.estado,
              }
            : {}),
          ...(datos.orden !==
          undefined
            ? {
                orden:
                  datos.orden,
              }
            : {}),
          ...(datos.participaEnPromedio !==
          undefined
            ? {
                participaEnPromedio:
                  datos.participaEnPromedio,
              }
            : {}),
          ...(datos.visibleParaEstudiantes !==
          undefined
            ? {
                visibleParaEstudiantes:
                  datos.visibleParaEstudiantes,
              }
            : {}),
        },
      });

    await this.prisma.historialCalificacion.create({
      data: {
        actividadId:
          actividad.id,
        actorId:
          usuario.id,
        accion:
          'ACTIVIDAD_ACTUALIZADA',
        detalle: {
          campos:
            Object.keys(
              datos,
            ),
        },
      },
    });

    return {
      mensaje:
        'Actividad actualizada correctamente',
      actividad:
        actualizada,
    };
  }

  async obtenerLibroDocente(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    const curso =
      await this.obtenerCursoDocente(
        usuario.id,
        cursoId,
      );

    const estudiantes =
      await this.prisma.inscripcionCurso.findMany({
        where: {
          cursoId,
          estado:
            EstadoInscripcion.ACTIVA,
          estudiante: {
            estaActivo:
              true,
            rol:
              Rol.ESTUDIANTE,
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
      });

    const actividades =
      await this.prisma.actividadCalificable.findMany({
        where: {
          cursoId,
        },

        orderBy: [
          {
            hito: {
              numero:
                'asc',
            },
          },
          {
            componente:
              'asc',
          },
          {
            orden:
              'asc',
          },
          {
            creadoEn:
              'asc',
          },
        ],

        include: {
          hito: {
            select: {
              id:
                true,
              numero:
                true,
              codigo:
                true,
              nombre:
                true,
              puntajeContinua:
                true,
              puntajeProcesual:
                true,
            },
          },
          calificaciones: {
            select: {
              id:
                true,
              estudianteId:
                true,
              notaBase:
                true,
              descuentoRetraso:
                true,
              ajusteIndividual:
                true,
              notaFinal:
                true,
              retroalimentacion:
                true,
              estado:
                true,
              publicadaEn:
                true,
            },
          },
        },
      });

    return {
      curso,
      estudiantes:
        estudiantes.map(
          (
            registro,
          ) =>
            registro.estudiante,
        ),
      actividades,
    };
  }

  async guardarCalificacion(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    actividadId:
      number,
    estudianteId:
      number,
    datos:
      GuardarCalificacionDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const actividad =
      await this.obtenerActividadDocente(
        usuario.id,
        cursoId,
        actividadId,
      );

    if (
      actividad.estado ===
        EstadoActividadCalificable.ANULADA
    ) {
      throw new BadRequestException(
        'No puedes calificar una actividad anulada',
      );
    }

    const inscripcion =
      await this.prisma.inscripcionCurso.findFirst({
        where: {
          cursoId,
          estudianteId,
          estado:
            EstadoInscripcion.ACTIVA,
        },

        select: {
          id:
            true,
        },
      });

    if (!inscripcion) {
      throw new BadRequestException(
        'El estudiante no tiene una inscripción activa en el curso',
      );
    }

    const notaFinal =
      this.calcularNotaFinalActividad(
        datos,
      );

    const calificacion =
      await this.prisma.calificacionEstudiante.upsert({
        where: {
          actividadId_estudianteId: {
            actividadId,
            estudianteId,
          },
        },

        create: {
          actividadId,
          estudianteId,
          calificadorId:
            usuario.id,
          notaBase:
            new Prisma.Decimal(
              datos.notaBase,
            ),
          descuentoRetraso:
            new Prisma.Decimal(
              datos.descuentoRetraso ??
              0,
            ),
          ajusteIndividual:
            new Prisma.Decimal(
              datos.ajusteIndividual ??
              0,
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
            new Date(),
        },

        update: {
          calificadorId:
            usuario.id,
          notaBase:
            new Prisma.Decimal(
              datos.notaBase,
            ),
          descuentoRetraso:
            new Prisma.Decimal(
              datos.descuentoRetraso ??
              0,
            ),
          ajusteIndividual:
            new Prisma.Decimal(
              datos.ajusteIndividual ??
              0,
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
            new Date(),
          publicadaEn:
            null,
        },
      });

    await this.prisma.historialCalificacion.create({
      data: {
        actividadId,
        calificacionId:
          calificacion.id,
        actorId:
          usuario.id,
        accion:
          'CALIFICACION_ACTUALIZADA',
        detalle: {
          estudianteId,
          notaBase:
            datos.notaBase,
          descuentoRetraso:
            datos.descuentoRetraso ??
            0,
          ajusteIndividual:
            datos.ajusteIndividual ??
            0,
          notaFinal,
        },
      },
    });

    return {
      mensaje:
        'Calificación guardada correctamente',
      calificacion,
    };
  }

  async publicarCalificaciones(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    actividadId:
      number,
    datos:
      PublicarCalificacionesDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const actividad =
      await this.obtenerActividadDocente(
        usuario.id,
        cursoId,
        actividadId,
      );

    const fecha =
      new Date();

    const resultado =
      await this.prisma.$transaction(
        async (
          transaccion,
        ) => {
          const actualizadas =
            await transaccion.calificacionEstudiante.updateMany({
              where: {
                actividadId:
                  actividad.id,
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
              },
            });

          if (
            datos.publicarActividad !==
            false
          ) {
            await transaccion.actividadCalificable.update({
              where: {
                id:
                  actividad.id,
              },

              data: {
                estado:
                  EstadoActividadCalificable.PUBLICADA,
                visibleParaEstudiantes:
                  true,
                publicadaEn:
                  fecha,
              },
            });
          }

          await transaccion.historialCalificacion.create({
            data: {
              actividadId:
                actividad.id,
              actorId:
                usuario.id,
              accion:
                'CALIFICACIONES_PUBLICADAS',
              detalle: {
                total:
                  actualizadas.count,
              },
            },
          });

          return actualizadas;
        },
      );

    return {
      mensaje:
        'Calificaciones publicadas correctamente',
      totalPublicadas:
        resultado.count,
    };
  }

  private construirResumenPorHito(
    actividades: Array<{
      componente:
        ComponenteEvaluacion;

      participaEnPromedio:
        boolean;

      estado:
        EstadoActividadCalificable;

      hito: {
        id:
          number;

        numero:
          number;

        codigo:
          string;

        nombre:
          string;

        puntajeContinua:
          number;

        puntajeProcesual:
          number;
      } | null;

      calificaciones: Array<{
        notaFinal:
          Prisma.Decimal;

        estado:
          EstadoCalificacion;
      }>;
    }>,
  ) {
    const mapa =
      new Map<
        number,
        {
          hito: NonNullable<
            typeof actividades[number]['hito']
          >;

          continua:
            number[];

          procesual:
            number[];
        }
      >();

    for (
      const actividad of
      actividades
    ) {
      if (
        !actividad.hito ||
        !actividad.participaEnPromedio ||
        actividad.estado ===
          EstadoActividadCalificable.ANULADA
      ) {
        continue;
      }

      const calificacion =
        actividad.calificaciones.find(
          (
            item,
          ) =>
            item.estado ===
            EstadoCalificacion.PUBLICADA,
        );

      if (!calificacion) {
        continue;
      }

      const actual =
        mapa.get(
          actividad.hito.id,
        ) ?? {
          hito:
            actividad.hito,
          continua:
            [],
          procesual:
            [],
        };

      const nota =
        Number(
          calificacion.notaFinal,
        );

      if (
        actividad.componente ===
        ComponenteEvaluacion.CONTINUA
      ) {
        actual.continua.push(
          nota,
        );
      } else {
        actual.procesual.push(
          nota,
        );
      }

      mapa.set(
        actividad.hito.id,
        actual,
      );
    }

    const hitos =
      [
        ...mapa.values(),
      ]
        .sort(
          (
            a,
            b,
          ) =>
            a.hito.numero -
            b.hito.numero,
        )
        .map(
          (
            item,
          ) => {
            const promedioContinua =
              item.continua.length >
              0
                ? item.continua.reduce(
                    (
                      suma,
                      nota,
                    ) =>
                      suma +
                      nota,
                    0,
                  ) /
                  item.continua.length
                : 0;

            const promedioProcesual =
              item.procesual.length >
              0
                ? item.procesual.reduce(
                    (
                      suma,
                      nota,
                    ) =>
                      suma +
                      nota,
                    0,
                  ) /
                  item.procesual.length
                : 0;

            const continua =
              this.convertirPromedio(
                promedioContinua,
                item.hito.puntajeContinua,
              );

            const procesual =
              this.convertirPromedio(
                promedioProcesual,
                item.hito.puntajeProcesual,
              );

            return {
              hito:
                item.hito,

              continua: {
                actividades:
                  item.continua.length,
                promedioSobre100:
                  Number(
                    promedioContinua.toFixed(
                      4,
                    ),
                  ),
                maximo:
                  item.hito.puntajeContinua,
                ...continua,
              },

              procesual: {
                actividades:
                  item.procesual.length,
                promedioSobre100:
                  Number(
                    promedioProcesual.toFixed(
                      4,
                    ),
                  ),
                maximo:
                  item.hito.puntajeProcesual,
                ...procesual,
              },

              totalHito:
                continua.notaRedondeada +
                procesual.notaRedondeada,

              maximoHito:
                item.hito.puntajeContinua +
                item.hito.puntajeProcesual,
            };
          },
        );

    return {
      hitos,
      notaFinal:
        hitos.reduce(
          (
            suma,
            hito,
          ) =>
            suma +
            hito.totalHito,
          0,
        ),
      maximoFinal:
        hitos.reduce(
          (
            suma,
            hito,
          ) =>
            suma +
            hito.maximoHito,
          0,
        ),
    };
  }

  async obtenerMisCalificaciones(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
  ) {
    this.validarEstudiante(
      usuario,
    );

    const inscripcion =
      await this.prisma.inscripcionCurso.findFirst({
        where: {
          cursoId,
          estudianteId:
            usuario.id,
          estado:
            EstadoInscripcion.ACTIVA,
        },

        select: {
          id:
            true,
          curso: {
            select: {
              id:
                true,
              materia: {
                select: {
                  nombre:
                    true,
                  codigo:
                    true,
                },
              },
            },
          },
        },
      });

    if (!inscripcion) {
      throw new NotFoundException(
        'No tienes una inscripción activa en este curso',
      );
    }

    const actividades =
      await this.prisma.actividadCalificable.findMany({
        where: {
          cursoId,
          visibleParaEstudiantes:
            true,
          estado:
            EstadoActividadCalificable.PUBLICADA,
        },

        orderBy: [
          {
            hito: {
              numero:
                'asc',
            },
          },
          {
            componente:
              'asc',
          },
          {
            orden:
              'asc',
          },
        ],

        include: {
          hito: {
            select: {
              id:
                true,
              numero:
                true,
              codigo:
                true,
              nombre:
                true,
              puntajeContinua:
                true,
              puntajeProcesual:
                true,
            },
          },
          calificaciones: {
            where: {
              estudianteId:
                usuario.id,
              estado:
                EstadoCalificacion.PUBLICADA,
            },

            select: {
              id:
                true,
              notaBase:
                true,
              descuentoRetraso:
                true,
              ajusteIndividual:
                true,
              notaFinal:
                true,
              retroalimentacion:
                true,
              estado:
                true,
              publicadaEn:
                true,
            },
          },
        },
      });

    return {
      curso:
        inscripcion.curso,
      actividades,
      resumen:
        this.construirResumenPorHito(
          actividades,
        ),
    };
  }

  async obtenerResumenEstudianteDocente(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    estudianteId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerCursoDocente(
      usuario.id,
      cursoId,
    );

    const actividades =
      await this.prisma.actividadCalificable.findMany({
        where: {
          cursoId,
        },

        orderBy: [
          {
            hito: {
              numero:
                'asc',
            },
          },
          {
            componente:
              'asc',
          },
          {
            orden:
              'asc',
          },
        ],

        include: {
          hito: {
            select: {
              id:
                true,
              numero:
                true,
              codigo:
                true,
              nombre:
                true,
              puntajeContinua:
                true,
              puntajeProcesual:
                true,
            },
          },
          calificaciones: {
            where: {
              estudianteId,
            },

            select: {
              notaFinal:
                true,
              estado:
                true,
            },
          },
        },
      });

    return this.construirResumenPorHito(
      actividades,
    );
  }
}
