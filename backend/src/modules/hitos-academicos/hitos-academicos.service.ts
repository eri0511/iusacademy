import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ActualizarPlanificacionDto,
} from './dto/actualizar-planificacion.dto';

import {
  CambiarEstadoPlanificacionDto,
} from './dto/cambiar-estado-planificacion.dto';

import {
  CrearPlanificacionDto,
  FechaHitoDto,
} from './dto/crear-planificacion.dto';

type DefinicionHito = {
  numero: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  puntajeTotal: number;
  puntajeContinua: number;
  puntajeProcesual: number;
  duracionMinimaDias: number;
  duracionMaximaDias: number;
};

type HitoValidado = {
  numero: number;
  fechaInicioDate: Date;
  fechaFinDate: Date;
  duracionDias: number;
};

type DatosHitoPersistencia = {
  numero: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  puntajeTotal: number;
  puntajeContinua: number;
  puntajeProcesual: number;
};

@Injectable()
export class HitosAcademicosService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private readonly definicionesHitos:
    DefinicionHito[] = [
      {
        numero:
          1,

        codigo:
          'H1',

        nombre:
          'Retroalimentación',

        descripcion:
          'Periodo inicial de diagnóstico, nivelación y retroalimentación. No genera calificación.',

        puntajeTotal:
          0,

        puntajeContinua:
          0,

        puntajeProcesual:
          0,

        duracionMinimaDias:
          7,

        duracionMaximaDias:
          14,
      },
      {
        numero:
          2,

        codigo:
          'H2',

        nombre:
          'Primer parcial',

        descripcion:
          'Primer periodo evaluativo: 15 puntos de evaluación continua y 10 puntos de evaluación procesual.',

        puntajeTotal:
          25,

        puntajeContinua:
          15,

        puntajeProcesual:
          10,

        duracionMinimaDias:
          30,

        duracionMaximaDias:
          40,
      },
      {
        numero:
          3,

        codigo:
          'H3',

        nombre:
          'Segundo parcial',

        descripcion:
          'Segundo periodo evaluativo: 15 puntos de evaluación continua y 10 puntos de evaluación procesual.',

        puntajeTotal:
          25,

        puntajeContinua:
          15,

        puntajeProcesual:
          10,

        duracionMinimaDias:
          30,

        duracionMaximaDias:
          40,
      },
      {
        numero:
          4,

        codigo:
          'H4',

        nombre:
          'Tercer parcial',

        descripcion:
          'Tercer periodo evaluativo: 15 puntos de evaluación continua y 10 puntos de evaluación procesual.',

        puntajeTotal:
          25,

        puntajeContinua:
          15,

        puntajeProcesual:
          10,

        duracionMinimaDias:
          30,

        duracionMaximaDias:
          40,
      },
      {
        numero:
          5,

        codigo:
          'H5',

        nombre:
          'Evaluación final',

        descripcion:
          'Periodo final: 15 puntos de evaluación continua y 10 puntos de evaluación procesual.',

        puntajeTotal:
          25,

        puntajeContinua:
          15,

        puntajeProcesual:
          10,

        duracionMinimaDias:
          10,

        duracionMaximaDias:
          18,
      },
    ];

  private readonly seleccionPlanificacion = {
    id: true,
    gestion: true,
    descripcion: true,
    estaActiva: true,
    creadoEn: true,
    actualizadoEn: true,

    hitos: {
      orderBy: {
        numero:
          'asc' as const,
      },

      select: {
        id: true,
        planificacionId: true,
        numero: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        fechaInicio: true,
        fechaFin: true,
        puntajeTotal: true,
        puntajeContinua: true,
        puntajeProcesual: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    },

    _count: {
      select: {
        cursos:
          true,
      },
    },
  } as const;

  private calcularDuracionDias(
    fechaInicio:
      Date,

    fechaFin:
      Date,
  ): number {
    const milisegundosPorDia =
      1000 *
      60 *
      60 *
      24;

    return (
      Math.floor(
        (
          fechaFin.getTime() -
          fechaInicio.getTime()
        ) /
          milisegundosPorDia,
      ) +
      1
    );
  }

  private validarHitos(
    hitos:
      FechaHitoDto[],
  ): {
    hitosOrdenados:
      HitoValidado[];

    advertencias:
      string[];
  } {
    if (
      hitos.length !==
      5
    ) {
      throw new BadRequestException(
        'Debes registrar exactamente los cinco hitos académicos',
      );
    }

    const numerosUnicos =
      new Set(
        hitos.map(
          (
            hito,
          ) =>
            hito.numero,
        ),
      );

    const numerosEsperados = [
      1,
      2,
      3,
      4,
      5,
    ];

    if (
      numerosUnicos.size !==
        5 ||
      !numerosEsperados.every(
        (
          numero,
        ) =>
          numerosUnicos.has(
            numero,
          ),
      )
    ) {
      throw new BadRequestException(
        'Los hitos deben corresponder exactamente a H1, H2, H3, H4 y H5',
      );
    }

    const hitosOrdenados:
      HitoValidado[] =
      [...hitos]
        .sort(
          (
            a,
            b,
          ) =>
            a.numero -
            b.numero,
        )
        .map(
          (
            hito,
          ) => {
            const fechaInicioDate =
              new Date(
                hito.fechaInicio,
              );

            const fechaFinDate =
              new Date(
                hito.fechaFin,
              );

            if (
              Number.isNaN(
                fechaInicioDate.getTime(),
              ) ||
              Number.isNaN(
                fechaFinDate.getTime(),
              )
            ) {
              throw new BadRequestException(
                `Las fechas de H${hito.numero} no son válidas`,
              );
            }

            if (
              fechaInicioDate >=
              fechaFinDate
            ) {
              throw new BadRequestException(
                `La fecha final de H${hito.numero} debe ser posterior a su fecha inicial`,
              );
            }

            return {
              numero:
                hito.numero,

              fechaInicioDate,
              fechaFinDate,

              duracionDias:
                this.calcularDuracionDias(
                  fechaInicioDate,
                  fechaFinDate,
                ),
            };
          },
        );

    for (
      let indice = 1;
      indice <
      hitosOrdenados.length;
      indice +=
        1
    ) {
      const anterior =
        hitosOrdenados[
          indice -
          1
        ];

      const actual =
        hitosOrdenados[
          indice
        ];

      if (
        actual.fechaInicioDate <=
        anterior.fechaFinDate
      ) {
        throw new BadRequestException(
          `Las fechas de H${actual.numero} se cruzan con las fechas de H${anterior.numero}`,
        );
      }
    }

    const advertencias:
      string[] = [];

    for (
      const hito of
      hitosOrdenados
    ) {
      const definicion =
        this.definicionesHitos.find(
          (
            elemento,
          ) =>
            elemento.numero ===
            hito.numero,
        );

      if (!definicion) {
        continue;
      }

      if (
        hito.duracionDias <
          definicion.duracionMinimaDias ||
        hito.duracionDias >
          definicion.duracionMaximaDias
      ) {
        advertencias.push(
          `${definicion.codigo} tiene una duración de ${hito.duracionDias} días. La duración recomendada es de ${definicion.duracionMinimaDias} a ${definicion.duracionMaximaDias} días.`,
        );
      }
    }

    return {
      hitosOrdenados,
      advertencias,
    };
  }

  private construirDatosHitos(
    hitos:
      HitoValidado[],
  ): DatosHitoPersistencia[] {
    return hitos.map(
      (
        hito,
      ) => {
        const definicion =
          this.definicionesHitos.find(
            (
              elemento,
            ) =>
              elemento.numero ===
              hito.numero,
          );

        if (!definicion) {
          throw new BadRequestException(
            `No existe una configuración para H${hito.numero}`,
          );
        }

        return {
          numero:
            definicion.numero,

          codigo:
            definicion.codigo,

          nombre:
            definicion.nombre,

          descripcion:
            definicion.descripcion,

          fechaInicio:
            hito.fechaInicioDate,

          fechaFin:
            hito.fechaFinDate,

          puntajeTotal:
            definicion.puntajeTotal,

          puntajeContinua:
            definicion.puntajeContinua,

          puntajeProcesual:
            definicion.puntajeProcesual,
        };
      },
    );
  }

  private transformarPlanificacion<
    T extends {
      hitos: {
        puntajeTotal: number;
      }[];

      _count: {
        cursos: number;
      };
    },
  >(
    planificacion:
      T,
  ) {
    const {
      _count,
      ...resto
    } =
      planificacion;

    return {
      ...resto,

      totalCursos:
        _count.cursos,

      puntajeMateria:
        planificacion.hitos.reduce(
          (
            total,
            hito,
          ) =>
            total +
            hito.puntajeTotal,
          0,
        ),
    };
  }

  private async obtenerPlanificacionPorId(
    planificacionId:
      number,
  ) {
    const planificacion =
      await this.prisma.planificacionAcademica.findUnique({
        where: {
          id:
            planificacionId,
        },

        select:
          this.seleccionPlanificacion,
      });

    if (!planificacion) {
      throw new NotFoundException(
        'La planificación académica no existe',
      );
    }

    return planificacion;
  }

  async obtenerTodas() {
    const planificaciones =
      await this.prisma.planificacionAcademica.findMany({
        select:
          this.seleccionPlanificacion,

        orderBy: {
          gestion:
            'desc',
        },
      });

    return planificaciones.map(
      (
        planificacion,
      ) =>
        this.transformarPlanificacion(
          planificacion,
        ),
    );
  }

  async obtenerPorGestion(
    gestion:
      string,
  ) {
    const gestionNormalizada =
      gestion
        .trim()
        .toUpperCase();

    const planificacion =
      await this.prisma.planificacionAcademica.findUnique({
        where: {
          gestion:
            gestionNormalizada,
        },

        select:
          this.seleccionPlanificacion,
      });

    if (!planificacion) {
      throw new NotFoundException(
        `No existe una planificación para la gestión ${gestionNormalizada}`,
      );
    }

    return this.transformarPlanificacion(
      planificacion,
    );
  }

  async crear(
    datos:
      CrearPlanificacionDto,
  ) {
    const existente =
      await this.prisma.planificacionAcademica.findUnique({
        where: {
          gestion:
            datos.gestion,
        },

        select: {
          id:
            true,
        },
      });

    if (existente) {
      throw new ConflictException(
        `La gestión ${datos.gestion} ya tiene una planificación académica`,
      );
    }

    const {
      hitosOrdenados,
      advertencias,
    } =
      this.validarHitos(
        datos.hitos,
      );

    const datosHitos =
      this.construirDatosHitos(
        hitosOrdenados,
      );

    const planificacion =
      await this.prisma.$transaction(
        async (
          transaccion,
        ) => {
          const creada =
            await transaccion.planificacionAcademica.create({
              data: {
                gestion:
                  datos.gestion,

                descripcion:
                  datos.descripcion ||
                  null,

                estaActiva:
                  true,

                hitos: {
                  create:
                    datosHitos,
                },
              },

              select:
                this.seleccionPlanificacion,
            });

          await transaccion.curso.updateMany({
            where: {
              gestion:
                datos.gestion,

              planificacionId:
                null,
            },

            data: {
              planificacionId:
                creada.id,
            },
          });

          return creada;
        },
      );

    const planificacionActualizada =
      await this.obtenerPlanificacionPorId(
        planificacion.id,
      );

    return {
      mensaje:
        'Planificación académica creada correctamente',

      advertencias,

      planificacion:
        this.transformarPlanificacion(
          planificacionActualizada,
        ),
    };
  }

  async actualizar(
    planificacionId:
      number,

    datos:
      ActualizarPlanificacionDto,
  ) {
    const actual =
      await this.obtenerPlanificacionPorId(
        planificacionId,
      );

    if (
      datos.descripcion ===
        undefined &&
      datos.hitos ===
        undefined
    ) {
      throw new BadRequestException(
        'Debes enviar una descripción o las fechas de los hitos',
      );
    }

    let advertencias:
      string[] = [];

    let datosHitos:
      DatosHitoPersistencia[] |
      null =
      null;

    if (
      datos.hitos
    ) {
      const validacion =
        this.validarHitos(
          datos.hitos,
        );

      advertencias =
        validacion.advertencias;

      datosHitos =
        this.construirDatosHitos(
          validacion.hitosOrdenados,
        );
    }

    await this.prisma.$transaction(
      async (
        transaccion,
      ) => {
        if (
          datos.descripcion !==
          undefined
        ) {
          await transaccion.planificacionAcademica.update({
            where: {
              id:
                planificacionId,
            },

            data: {
              descripcion:
                datos.descripcion ||
                null,
            },
          });
        }

        if (
          datosHitos
        ) {
          for (
            const hito of
            datosHitos
          ) {
            await transaccion.hitoAcademico.update({
              where: {
                planificacionId_numero: {
                  planificacionId,

                  numero:
                    hito.numero,
                },
              },

              data: {
                codigo:
                  hito.codigo,

                nombre:
                  hito.nombre,

                descripcion:
                  hito.descripcion,

                fechaInicio:
                  hito.fechaInicio,

                fechaFin:
                  hito.fechaFin,

                puntajeTotal:
                  hito.puntajeTotal,

                puntajeContinua:
                  hito.puntajeContinua,

                puntajeProcesual:
                  hito.puntajeProcesual,
              },
            });
          }
        }

        await transaccion.curso.updateMany({
          where: {
            gestion:
              actual.gestion,

            planificacionId:
              null,
          },

          data: {
            planificacionId,
          },
        });
      },
    );

    const planificacion =
      await this.obtenerPlanificacionPorId(
        planificacionId,
      );

    return {
      mensaje:
        'Planificación académica actualizada correctamente',

      advertencias,

      planificacion:
        this.transformarPlanificacion(
          planificacion,
        ),
    };
  }

  async cambiarEstado(
    planificacionId:
      number,

    datos:
      CambiarEstadoPlanificacionDto,
  ) {
    const actual =
      await this.obtenerPlanificacionPorId(
        planificacionId,
      );

    if (
      actual.estaActiva ===
      datos.estaActiva
    ) {
      return {
        mensaje:
          datos.estaActiva
            ? 'La planificación ya se encuentra activa'
            : 'La planificación ya se encuentra inactiva',

        planificacion:
          this.transformarPlanificacion(
            actual,
          ),
      };
    }

    const planificacion =
      await this.prisma.planificacionAcademica.update({
        where: {
          id:
            planificacionId,
        },

        data: {
          estaActiva:
            datos.estaActiva,
        },

        select:
          this.seleccionPlanificacion,
      });

    return {
      mensaje:
        datos.estaActiva
          ? 'Planificación activada correctamente'
          : 'Planificación desactivada correctamente',

      planificacion:
        this.transformarPlanificacion(
          planificacion,
        ),
    };
  }
}