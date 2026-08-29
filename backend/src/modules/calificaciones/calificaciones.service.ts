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
    hitoId:
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

    const hito =
      await this.validarHitoCurso(
        curso.planificacionId,
        hitoId,
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
          hitoId:
            hito.id,
        },

        orderBy: [
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

    const actividadesNormalizadas =
      actividades.map(
        (
          actividad,
        ) => ({
          id:
            actividad.id,
          titulo:
            actividad.titulo,
          descripcion:
            actividad.descripcion,
          foroId:
            actividad.foroId,
          tareaId:
            actividad.tareaId,
          quizId:
            actividad.quizId,
          origen:
            actividad.origen,
          componente:
            actividad.componente,
          estado:
            actividad.estado,
          participaEnPromedio:
            actividad.participaEnPromedio,
          visibleParaEstudiantes:
            actividad.visibleParaEstudiantes,
          orden:
            actividad.orden,
          calificaciones:
            actividad.calificaciones.map(
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
          resumen: (() => {
            const calificacionesValidas =
              actividad.calificaciones.filter(
                (item) =>
                  item.estado ===
                    EstadoCalificacion.CALIFICADA ||
                  item.estado ===
                    EstadoCalificacion.PUBLICADA,
              );

            const publicadas =
              calificacionesValidas.filter(
                (item) =>
                  item.estado ===
                  EstadoCalificacion.PUBLICADA,
              ).length;

            const promedio =
              calificacionesValidas.length > 0
                ? calificacionesValidas.reduce(
                    (suma, item) =>
                      suma + Number(item.notaFinal),
                    0,
                  ) / calificacionesValidas.length
                : 0;

            return {
              totalEstudiantes:
                estudiantes.length,
              calificadas:
                calificacionesValidas.length,
              publicadas,
              pendientes:
                Math.max(
                  0,
                  estudiantes.length -
                    calificacionesValidas.length,
                ),
              promedio:
                Number(promedio.toFixed(2)),
            };
          })(),
        }),
      );

    const calcularResumen = (
      estudianteId:
        number,
      componente:
        ComponenteEvaluacion,
    ) => {
      const actividadesComponente =
        actividades.filter(
          (
            actividad,
          ) =>
            actividad.componente ===
              componente &&
            actividad.participaEnPromedio &&
            actividad.estado !==
              EstadoActividadCalificable.ANULADA,
        );

      const notas:
        number[] =
        [];

      for (
        const actividad of
        actividadesComponente
      ) {
        const calificacion =
          actividad.calificaciones.find(
            (
              item,
            ) =>
              item.estudianteId ===
                estudianteId &&
              (
                item.estado ===
                  EstadoCalificacion.CALIFICADA ||
                item.estado ===
                  EstadoCalificacion.PUBLICADA
              ),
          );

        if (calificacion) {
          notas.push(
            Number(
              calificacion.notaFinal,
            ),
          );
        }
      }

      const promedioSobre100 =
        notas.length >
        0
          ? notas.reduce(
              (
                suma,
                nota,
              ) =>
                suma +
                nota,
              0,
            ) /
            notas.length
          : 0;

      const maximo =
        this.obtenerPuntajeMaximoComponente(
          componente,
          hito,
        );

      return {
        actividadesTotales:
          actividadesComponente.length,
        actividadesCalificadas:
          notas.length,
        actividadesPendientes:
          Math.max(
            0,
            actividadesComponente.length -
              notas.length,
          ),
        promedioSobre100:
          Number(
            promedioSobre100.toFixed(
              2,
            ),
          ),
        promedioRedondeado:
          Math.round(
            promedioSobre100,
          ),
        maximo,
        ...this.convertirPromedio(
          promedioSobre100,
          maximo,
        ),
      };
    };

    return {
      curso,
      hito,
      actividades:
        actividadesNormalizadas,
      estudiantes:
        estudiantes.map(
          (
            registro,
          ) => ({
            ...registro.estudiante,
            continua:
              calcularResumen(
                registro.estudiante.id,
                ComponenteEvaluacion.CONTINUA,
              ),
            procesual:
              calcularResumen(
                registro.estudiante.id,
                ComponenteEvaluacion.PROCESUAL,
              ),
          }),
        ),
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
    hitoId:
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
              planificacionId:
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

    const hito =
      await this.validarHitoCurso(
        inscripcion.curso.planificacionId,
        hitoId,
      );

    const actividades =
      await this.prisma.actividadCalificable.findMany({
        where: {
          cursoId,
          hitoId:
            hito.id,
          visibleParaEstudiantes:
            true,
          estado:
            EstadoActividadCalificable.PUBLICADA,
        },

        orderBy: [
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

    const construirComponente = (
      componente:
        ComponenteEvaluacion,
    ) => {
      const lista =
        actividades
          .filter(
            (
              actividad,
            ) =>
              actividad.componente ===
              componente,
          )
          .map(
            (
              actividad,
            ) => {
              const calificacion =
                actividad.calificaciones[0] ??
                null;

              return {
                id:
                  actividad.id,
                titulo:
                  actividad.titulo,
                descripcion:
                  actividad.descripcion,
                foroId:
                  actividad.foroId,
                tareaId:
                  actividad.tareaId,
                quizId:
                  actividad.quizId,
                origen:
                  actividad.origen,
                componente:
                  actividad.componente,
                estado:
                  actividad.estado,
                participaEnPromedio:
                  actividad.participaEnPromedio,
                calificacion:
                  calificacion
                    ? {
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
                      }
                    : null,
              };
            },
          );

      const notas =
        lista
          .filter(
            (
              actividad,
            ) =>
              actividad.participaEnPromedio &&
              actividad.calificacion,
          )
          .map(
            (
              actividad,
            ) =>
              actividad.calificacion!
                .notaFinal,
          );

      const promedioSobre100 =
        notas.length >
        0
          ? notas.reduce(
              (
                suma,
                nota,
              ) =>
                suma +
                nota,
              0,
            ) /
            notas.length
          : 0;

      const maximo =
        this.obtenerPuntajeMaximoComponente(
          componente,
          hito,
        );

      return {
        actividades:
          lista,
        resumen: {
          actividadesCalificadas:
            notas.length,
          promedioSobre100:
            Number(
              promedioSobre100.toFixed(
                2,
              ),
            ),
          promedioRedondeado:
            Math.round(
              promedioSobre100,
            ),
          maximo,
          ...this.convertirPromedio(
            promedioSobre100,
            maximo,
          ),
        },
      };
    };

    const continua =
      construirComponente(
        ComponenteEvaluacion.CONTINUA,
      );

    const procesual =
      construirComponente(
        ComponenteEvaluacion.PROCESUAL,
      );

    return {
      curso: {
        id:
          inscripcion.curso.id,
        materia:
          inscripcion.curso.materia,
      },
      hito,
      continua,
      procesual,
      totalHitoExacto:
        Number(
          (
            continua.resumen.notaExacta +
            procesual.resumen.notaExacta
          ).toFixed(2),
        ),
      totalHito:
        Math.round(
          continua.resumen.notaExacta +
          procesual.resumen.notaExacta,
        ),
      maximoHito:
        hito.puntajeContinua +
        hito.puntajeProcesual,
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
