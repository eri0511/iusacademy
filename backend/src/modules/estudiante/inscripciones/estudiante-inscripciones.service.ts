import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoCurso,
  EstadoInscripcion,
  Rol,
} from '../../../generated/prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

import { InscribirseCursoDto } from './dto/inscribirse-curso.dto';

@Injectable()
export class EstudianteInscripcionesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Comprueba que el usuario autenticado exista,
   * esté activo, tenga su cuenta activada
   * y posea el rol de estudiante.
   */
  private async obtenerEstudiante(estudianteId: number) {
    const estudiante = await this.prisma.usuario.findUnique({
      where: {
        id: estudianteId,
      },

      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        rol: true,
        estaActivo: true,
        cuentaActivada: true,
      },
    });

    if (!estudiante) {
      throw new NotFoundException('El estudiante autenticado no existe');
    }

    if (estudiante.rol !== Rol.ESTUDIANTE) {
      throw new BadRequestException(
        'El usuario autenticado no tiene el rol de estudiante',
      );
    }

    if (!estudiante.estaActivo) {
      throw new BadRequestException(
        'La cuenta del estudiante se encuentra desactivada',
      );
    }

    if (!estudiante.cuentaActivada) {
      throw new BadRequestException(
        'Debes activar tu cuenta antes de inscribirte a un curso',
      );
    }

    return estudiante;
  }

  /**
   * Inscribe al estudiante mediante el código
   * generado por el docente.
   *
   * Valida:
   * - que el estudiante exista y esté activo;
   * - que el código exista;
   * - que el código esté activo;
   * - que el código no haya expirado;
   * - que el curso esté activo;
   * - que existan cupos;
   * - que no haya una inscripción activa duplicada;
   * - que no esté inscrito en la misma materia,
   *   gestión y otro paralelo.
   *
   * Si el estudiante estuvo retirado anteriormente
   * del mismo curso, la inscripción se reactiva.
   */
  async inscribirseCurso(estudianteId: number, datos: InscribirseCursoDto) {
    await this.obtenerEstudiante(estudianteId);

    const fechaActual = new Date();

    const curso = await this.prisma.curso.findUnique({
      where: {
        codigoInscripcion: datos.codigo,
      },

      select: {
        id: true,
        materiaId: true,
        docenteId: true,
        gestion: true,
        paralelo: true,
        semestre: true,
        cupoMaximo: true,
        estado: true,

        codigoInscripcion: true,

        codigoInscripcionActivo: true,

        codigoGeneradoEn: true,

        codigoExpiraEn: true,

        materia: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            semestre: true,
            descripcion: true,
          },
        },

        docente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            fotoPerfilUrl: true,
          },
        },

        _count: {
          select: {
            inscripciones: {
              where: {
                estado: EstadoInscripcion.ACTIVA,
              },
            },
          },
        },
      },
    });

    if (!curso) {
      throw new NotFoundException(
        'El código de inscripción no corresponde a ningún curso',
      );
    }

    if (curso.estado !== EstadoCurso.ACTIVO) {
      throw new BadRequestException(
        curso.estado === EstadoCurso.FINALIZADO
          ? 'El curso ya fue finalizado'
          : 'El curso no se encuentra activo',
      );
    }

    if (!curso.codigoInscripcionActivo) {
      throw new BadRequestException(
        'El código de inscripción se encuentra desactivado',
      );
    }

    if (
      curso.codigoExpiraEn &&
      curso.codigoExpiraEn.getTime() <= fechaActual.getTime()
    ) {
      throw new BadRequestException('El código de inscripción ha expirado');
    }

    /**
     * Verifica si el estudiante ya tiene
     * una inscripción en este mismo curso.
     */
    const inscripcionExistente = await this.prisma.inscripcionCurso.findUnique({
      where: {
        cursoId_estudianteId: {
          cursoId: curso.id,

          estudianteId,
        },
      },

      select: {
        id: true,
        estado: true,
        inscritoEn: true,
        retiradoEn: true,
      },
    });

    if (inscripcionExistente?.estado === EstadoInscripcion.ACTIVA) {
      throw new ConflictException('Ya estás inscrito en este curso');
    }

    /**
     * Impide que el estudiante se inscriba
     * en la misma materia y gestión,
     * aunque corresponda a otro paralelo.
     *
     * Las inscripciones retiradas no bloquean.
     */
    const inscripcionMismaMateria =
      await this.prisma.inscripcionCurso.findFirst({
        where: {
          estudianteId,

          estado: EstadoInscripcion.ACTIVA,

          curso: {
            id: {
              not: curso.id,
            },

            materiaId: curso.materia.id,

            gestion: curso.gestion,

            estado: EstadoCurso.ACTIVO,
          },
        },

        select: {
          id: true,

          curso: {
            select: {
              id: true,
              gestion: true,
              paralelo: true,

              materia: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
      });

    if (inscripcionMismaMateria) {
      throw new ConflictException(
        `Ya estás inscrito en ${inscripcionMismaMateria.curso.materia.nombre} ` +
          `en el paralelo ${inscripcionMismaMateria.curso.paralelo}, ` +
          `gestión ${inscripcionMismaMateria.curso.gestion}`,
      );
    }

    /**
     * Primera validación del cupo.
     */
    if (
      curso.cupoMaximo !== null &&
      curso._count.inscripciones >= curso.cupoMaximo
    ) {
      throw new BadRequestException(
        'El curso ya alcanzó el cupo máximo de estudiantes',
      );
    }

    const inscripcion = await this.prisma.$transaction(async (transaccion) => {
      /**
       * Repite la validación de misma materia
       * dentro de la transacción.
       */
      const mismaMateriaActual = await transaccion.inscripcionCurso.findFirst({
        where: {
          estudianteId,

          estado: EstadoInscripcion.ACTIVA,

          curso: {
            id: {
              not: curso.id,
            },

            materiaId: curso.materia.id,

            gestion: curso.gestion,

            estado: EstadoCurso.ACTIVO,
          },
        },

        select: {
          curso: {
            select: {
              gestion: true,
              paralelo: true,

              materia: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
      });

      if (mismaMateriaActual) {
        throw new ConflictException(
          `Ya estás inscrito en ${mismaMateriaActual.curso.materia.nombre} ` +
            `en el paralelo ${mismaMateriaActual.curso.paralelo}, ` +
            `gestión ${mismaMateriaActual.curso.gestion}`,
        );
      }

      /**
       * Repite la validación del curso,
       * código y vigencia dentro de la transacción.
       *
       * Esto evita que el código sea desactivado
       * o renovado durante el proceso de inscripción.
       */
      const cursoActual = await transaccion.curso.findUnique({
        where: {
          id: curso.id,
        },

        select: {
          id: true,
          estado: true,
          cupoMaximo: true,

          codigoInscripcion: true,

          codigoInscripcionActivo: true,

          codigoExpiraEn: true,
        },
      });

      if (!cursoActual) {
        throw new NotFoundException('El curso ya no se encuentra disponible');
      }

      if (cursoActual.estado !== EstadoCurso.ACTIVO) {
        throw new BadRequestException('El curso dejó de estar activo');
      }

      if (cursoActual.codigoInscripcion !== datos.codigo) {
        throw new BadRequestException(
          'El código de inscripción fue renovado. Solicita el nuevo código al docente',
        );
      }

      if (!cursoActual.codigoInscripcionActivo) {
        throw new BadRequestException(
          'El código de inscripción fue desactivado',
        );
      }

      if (
        cursoActual.codigoExpiraEn &&
        cursoActual.codigoExpiraEn.getTime() <= Date.now()
      ) {
        throw new BadRequestException('El código de inscripción ha expirado');
      }

      /**
       * Repite el conteo para reducir
       * el riesgo de superar el cupo.
       */
      if (cursoActual.cupoMaximo !== null) {
        const cantidadActual = await transaccion.inscripcionCurso.count({
          where: {
            cursoId: curso.id,

            estado: EstadoInscripcion.ACTIVA,
          },
        });

        if (cantidadActual >= cursoActual.cupoMaximo) {
          throw new BadRequestException(
            'El curso ya alcanzó el cupo máximo de estudiantes',
          );
        }
      }

      /**
       * Si anteriormente se retiró
       * del mismo curso, reactiva
       * la inscripción existente.
       */
      if (inscripcionExistente) {
        return transaccion.inscripcionCurso.update({
          where: {
            id: inscripcionExistente.id,
          },

          data: {
            estado: EstadoInscripcion.ACTIVA,

            inscritoEn: fechaActual,

            retiradoEn: null,
          },

          select: {
            id: true,
            estado: true,
            inscritoEn: true,
            retiradoEn: true,
            creadoEn: true,
            actualizadoEn: true,
          },
        });
      }

      /**
       * Crea una inscripción nueva.
       */
      return transaccion.inscripcionCurso.create({
        data: {
          cursoId: curso.id,

          estudianteId,

          estado: EstadoInscripcion.ACTIVA,

          inscritoEn: fechaActual,

          retiradoEn: null,
        },

        select: {
          id: true,
          estado: true,
          inscritoEn: true,
          retiradoEn: true,
          creadoEn: true,
          actualizadoEn: true,
        },
      });
    });

    return {
      mensaje: inscripcionExistente
        ? 'Te reinscribiste al curso correctamente'
        : 'Te inscribiste al curso correctamente',

      inscripcion: {
        id: inscripcion.id,

        estado: inscripcion.estado,

        inscritoEn: inscripcion.inscritoEn,

        retiradoEn: inscripcion.retiradoEn,

        creadoEn: inscripcion.creadoEn,

        actualizadoEn: inscripcion.actualizadoEn,
      },

      curso: {
        id: curso.id,

        gestion: curso.gestion,

        paralelo: curso.paralelo,

        semestre: curso.semestre,

        cupoMaximo: curso.cupoMaximo,

        estado: curso.estado,

        materia: curso.materia,

        docente: curso.docente,
      },
    };
  }

  /**
   * Devuelve los cursos en los que el estudiante
   * tiene una inscripción activa.
   */
  async obtenerMisCursos(estudianteId: number) {
    await this.obtenerEstudiante(estudianteId);

    const inscripciones = await this.prisma.inscripcionCurso.findMany({
      where: {
        estudianteId,

        estado: EstadoInscripcion.ACTIVA,
      },

      select: {
        id: true,
        estado: true,
        inscritoEn: true,
        retiradoEn: true,
        creadoEn: true,
        actualizadoEn: true,

        curso: {
          select: {
            id: true,
            gestion: true,
            paralelo: true,
            semestre: true,
            cupoMaximo: true,
            estado: true,
            finalizadoEn: true,
            creadoEn: true,
            actualizadoEn: true,

            materia: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                semestre: true,
                descripcion: true,
              },
            },

            docente: {
              select: {
                id: true,
                nombres: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                fotoPerfilUrl: true,
              },
            },

            _count: {
              select: {
                inscripciones: {
                  where: {
                    estado: EstadoInscripcion.ACTIVA,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: [
        {
          curso: {
            estado: 'asc',
          },
        },

        {
          inscritoEn: 'desc',
        },
      ],
    });

    return {
      total: inscripciones.length,

      cursos: inscripciones.map((inscripcion) => {
        const estudiantesInscritos = inscripcion.curso._count.inscripciones;

        return {
          inscripcionId: inscripcion.id,

          estadoInscripcion: inscripcion.estado,

          inscritoEn: inscripcion.inscritoEn,

          retiradoEn: inscripcion.retiradoEn,

          id: inscripcion.curso.id,

          gestion: inscripcion.curso.gestion,

          paralelo: inscripcion.curso.paralelo,

          semestre: inscripcion.curso.semestre,

          cupoMaximo: inscripcion.curso.cupoMaximo,

          estado: inscripcion.curso.estado,

          finalizadoEn: inscripcion.curso.finalizadoEn,

          creadoEn: inscripcion.curso.creadoEn,

          actualizadoEn: inscripcion.curso.actualizadoEn,

          materia: inscripcion.curso.materia,

          docente: inscripcion.curso.docente,

          estudiantesInscritos,

          cuposDisponibles:
            inscripcion.curso.cupoMaximo === null
              ? null
              : Math.max(
                  inscripcion.curso.cupoMaximo - estudiantesInscritos,
                  0,
                ),
        };
      }),
    };
  }

  /**
   * Devuelve el detalle de un curso únicamente
   * si el estudiante tiene una inscripción activa.
   *
   * Esto evita que un estudiante cambie el ID
   * de la URL para ingresar a un curso ajeno.
   */
  async obtenerMiCursoPorId(estudianteId: number, cursoId: number) {
    await this.obtenerEstudiante(estudianteId);

    const inscripcion = await this.prisma.inscripcionCurso.findFirst({
      where: {
        estudianteId,

        cursoId,

        estado: EstadoInscripcion.ACTIVA,
      },

      select: {
        id: true,
        estado: true,
        inscritoEn: true,
        retiradoEn: true,
        creadoEn: true,
        actualizadoEn: true,

        curso: {
          select: {
            id: true,
            gestion: true,
            paralelo: true,
            semestre: true,
            cupoMaximo: true,
            estado: true,
            finalizadoEn: true,
            creadoEn: true,
            actualizadoEn: true,

            materia: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                semestre: true,
                descripcion: true,
              },
            },

            docente: {
              select: {
                id: true,
                nombres: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                fotoPerfilUrl: true,
              },
            },

            _count: {
              select: {
                inscripciones: {
                  where: {
                    estado: EstadoInscripcion.ACTIVA,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!inscripcion) {
      throw new NotFoundException(
        'No estás inscrito activamente en este curso',
      );
    }

    const curso = inscripcion.curso;

    const estudiantesInscritos = curso._count.inscripciones;

    return {
      inscripcion: {
        id: inscripcion.id,

        estado: inscripcion.estado,

        inscritoEn: inscripcion.inscritoEn,

        retiradoEn: inscripcion.retiradoEn,

        creadoEn: inscripcion.creadoEn,

        actualizadoEn: inscripcion.actualizadoEn,
      },

      curso: {
        id: curso.id,

        gestion: curso.gestion,

        paralelo: curso.paralelo,

        semestre: curso.semestre,

        cupoMaximo: curso.cupoMaximo,

        estado: curso.estado,

        finalizadoEn: curso.finalizadoEn,

        creadoEn: curso.creadoEn,

        actualizadoEn: curso.actualizadoEn,

        materia: curso.materia,

        docente: curso.docente,

        estudiantesInscritos,

        cuposDisponibles:
          curso.cupoMaximo === null
            ? null
            : Math.max(curso.cupoMaximo - estudiantesInscritos, 0),
      },
    };
  }
}
