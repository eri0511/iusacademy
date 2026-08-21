import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ComponenteEvaluacion,
  EstadoActividadCalificable,
  EstadoCalificacion,
  EstadoInscripcion,
  Prisma,
  Rol,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

type ActividadLibro = {
  id:
    number;

  titulo:
    string;

  origen:
    string;

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
    estudianteId:
      number;

    notaFinal:
      Prisma.Decimal;

    estado:
      EstadoCalificacion;
  }>;
};

@Injectable()
export class ForoLibroCalificacionesService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private redondear(
    valor:
      number,
  ) {
    return Math.round(
      valor,
    );
  }

  private promedio(
    valores:
      number[],
  ) {
    if (
      valores.length ===
      0
    ) {
      return 0;
    }

    return valores.reduce(
      (
        suma,
        valor,
      ) =>
        suma +
        valor,
      0,
    ) /
      valores.length;
  }

  private convertir(
    promedioSobre100:
      number,
    maximo:
      number,
  ) {
    const exacta =
      (
        promedioSobre100 *
        maximo
      ) /
      100;

    return {
      promedioSobre100:
        Number(
          promedioSobre100.toFixed(
            4,
          ),
        ),

      notaExacta:
        Number(
          exacta.toFixed(
            4,
          ),
        ),

      notaRedondeada:
        this.redondear(
          exacta,
        ),

      maximo,
    };
  }

  private async validarAccesoCurso(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
  ) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id:
            cursoId,
        },

        select: {
          id:
            true,

          docenteId:
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

          gestion:
            true,

          paralelo:
            true,

          semestre:
            true,
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe',
      );
    }

    if (
      usuario.rol ===
      Rol.DOCENTE
    ) {
      if (
        curso.docenteId !==
        usuario.id
      ) {
        throw new ForbiddenException(
          'El curso no pertenece al docente autenticado',
        );
      }

      return curso;
    }

    if (
      usuario.rol ===
      Rol.ESTUDIANTE
    ) {
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
          },
        });

      if (!inscripcion) {
        throw new ForbiddenException(
          'No tienes una inscripción activa en este curso',
        );
      }

      return curso;
    }

    throw new ForbiddenException(
      'Tu rol no tiene acceso al libro de calificaciones',
    );
  }

  private construirResumenEstudiante(
    actividades:
      ActividadLibro[],
    estudianteId:
      number,
  ) {
    const mapa =
      new Map<
        number,
        {
          hito: NonNullable<
            ActividadLibro['hito']
          >;

          continua: Array<{
            actividadId:
              number;

            titulo:
              string;

            origen:
              string;

            notaSobre100:
              number;
          }>;

          procesual: Array<{
            actividadId:
              number;

            titulo:
              string;

            origen:
              string;

            notaSobre100:
              number;
          }>;
        }
      >();

    for (
      const actividad of
      actividades
    ) {
      if (
        !actividad.hito ||
        !actividad.participaEnPromedio ||
        actividad.estado !==
          EstadoActividadCalificable.PUBLICADA
      ) {
        continue;
      }

      const calificacion =
        actividad.calificaciones.find(
          (
            item,
          ) =>
            item.estudianteId ===
              estudianteId &&
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

      const detalle = {
        actividadId:
          actividad.id,

        titulo:
          actividad.titulo,

        origen:
          actividad.origen,

        notaSobre100:
          Number(
            calificacion.notaFinal,
          ),
      };

      if (
        actividad.componente ===
        ComponenteEvaluacion.CONTINUA
      ) {
        actual.continua.push(
          detalle,
        );
      } else {
        actual.procesual.push(
          detalle,
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
              this.promedio(
                item.continua.map(
                  (
                    actividad,
                  ) =>
                    actividad.notaSobre100,
                ),
              );

            const promedioProcesual =
              this.promedio(
                item.procesual.map(
                  (
                    actividad,
                  ) =>
                    actividad.notaSobre100,
                ),
              );

            const continua =
              this.convertir(
                promedioContinua,
                item.hito.puntajeContinua,
              );

            const procesual =
              this.convertir(
                promedioProcesual,
                item.hito.puntajeProcesual,
              );

            return {
              hito: {
                id:
                  item.hito.id,

                numero:
                  item.hito.numero,

                codigo:
                  item.hito.codigo,

                nombre:
                  item.hito.nombre,
              },

              continua: {
                actividades:
                  item.continua,

                cantidadActividades:
                  item.continua.length,

                ...continua,
              },

              procesual: {
                actividades:
                  item.procesual,

                cantidadActividades:
                  item.procesual.length,

                ...procesual,
              },

              totalHito: {
                notaExacta:
                  Number(
                    (
                      continua.notaExacta +
                      procesual.notaExacta
                    ).toFixed(
                      4,
                    ),
                  ),

                notaRedondeada:
                  continua.notaRedondeada +
                  procesual.notaRedondeada,

                maximo:
                  continua.maximo +
                  procesual.maximo,
              },
            };
          },
        );

    const totalExacto =
      hitos.reduce(
        (
          suma,
          hito,
        ) =>
          suma +
          hito.totalHito.notaExacta,
        0,
      );

    const totalRedondeado =
      hitos.reduce(
        (
          suma,
          hito,
        ) =>
          suma +
          hito.totalHito.notaRedondeada,
        0,
      );

    const maximoTotal =
      hitos.reduce(
        (
          suma,
          hito,
        ) =>
          suma +
          hito.totalHito.maximo,
        0,
      );

    return {
      estudianteId,

      hitos,

      resumenFinal: {
        notaExacta:
          Number(
            totalExacto.toFixed(
              4,
            ),
          ),

        notaRedondeada:
          totalRedondeado,

        maximo:
          maximoTotal,
      },
    };
  }

  private async obtenerActividadesPublicadas(
    cursoId:
      number,
  ) {
    return this.prisma.actividadCalificable.findMany({
      where: {
        cursoId,

        participaEnPromedio:
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
            estado:
              EstadoCalificacion.PUBLICADA,
          },

          select: {
            estudianteId:
              true,

            notaFinal:
              true,

            estado:
              true,
          },
        },
      },
    });
  }

  async obtenerMiLibro(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
  ) {
    const curso =
      await this.validarAccesoCurso(
        usuario,
        cursoId,
      );

    if (
      usuario.rol !==
      Rol.ESTUDIANTE
    ) {
      throw new ForbiddenException(
        'Esta consulta corresponde al estudiante',
      );
    }

    const actividades =
      await this.obtenerActividadesPublicadas(
        cursoId,
      );

    return {
      curso,

      libro:
        this.construirResumenEstudiante(
          actividades,
          usuario.id,
        ),
    };
  }

  async obtenerLibroEstudianteDocente(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    estudianteId:
      number,
  ) {
    const curso =
      await this.validarAccesoCurso(
        usuario,
        cursoId,
      );

    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Esta consulta corresponde al docente',
      );
    }

    const estudiante =
      await this.prisma.usuario.findFirst({
        where: {
          id:
            estudianteId,

          rol:
            Rol.ESTUDIANTE,

          inscripcionesComoEstudiante: {
            some: {
              cursoId,

              estado:
                EstadoInscripcion.ACTIVA,
            },
          },
        },

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
      });

    if (!estudiante) {
      throw new NotFoundException(
        'El estudiante no pertenece al curso',
      );
    }

    const actividades =
      await this.obtenerActividadesPublicadas(
        cursoId,
      );

    return {
      curso,

      estudiante,

      libro:
        this.construirResumenEstudiante(
          actividades,
          estudiante.id,
        ),
    };
  }

  async obtenerLibroCompletoDocente(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
  ) {
    const curso =
      await this.validarAccesoCurso(
        usuario,
        cursoId,
      );

    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Esta consulta corresponde al docente',
      );
    }

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
      await this.obtenerActividadesPublicadas(
        cursoId,
      );

    const filas =
      estudiantes.map(
        (
          registro,
        ) => ({
          estudiante:
            registro.estudiante,

          libro:
            this.construirResumenEstudiante(
              actividades,
              registro.estudiante.id,
            ),
        }),
      );

    const notasFinales =
      filas.map(
        (
          fila,
        ) =>
          fila.libro.resumenFinal.notaRedondeada,
      );

    return {
      curso,

      resumen: {
        totalEstudiantes:
          filas.length,

        promedioCurso:
          notasFinales.length >
          0
            ? Number(
                this.promedio(
                  notasFinales,
                ).toFixed(
                  2,
                ),
              )
            : 0,

        notaMayor:
          notasFinales.length >
          0
            ? Math.max(
                ...notasFinales,
              )
            : 0,

        notaMenor:
          notasFinales.length >
          0
            ? Math.min(
                ...notasFinales,
              )
            : 0,
      },

      estudiantes:
        filas,
    };
  }
}
