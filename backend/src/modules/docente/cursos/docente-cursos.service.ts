import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  randomInt,
} from 'node:crypto';

import {
  EstadoCurso,
  EstadoInscripcion,
} from '../../../generated/prisma/client';

import {
  PrismaService,
} from '../../../prisma/prisma.service';

import {
  GenerarCodigoInscripcionDto,
} from './dto/generar-codigo-inscripcion.dto';

@Injectable()
export class DocenteCursosService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private readonly caracteresCodigo =
    'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  private readonly longitudCodigo =
    6;

  private readonly diasVigenciaPredeterminados =
    7;

  /**
   * Comprueba que el curso exista y pertenezca
   * al docente autenticado.
   *
   * Esta validación evita que un docente pueda
   * cambiar el ID de la URL para acceder al curso
   * de otro docente.
   */
  private async obtenerCursoDelDocente(
    docenteId: number,
    cursoId: number,
  ) {
    const curso =
      await this.prisma.curso.findFirst({
        where: {
          id:
            cursoId,

          docenteId,
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
          finalizadoEn: true,

          codigoInscripcion:
            true,

          codigoInscripcionActivo:
            true,

          codigoGeneradoEn:
            true,

          codigoExpiraEn:
            true,

          creadoEn: true,
          actualizadoEn: true,

          materia: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              semestre: true,
              estado: true,
            },
          },
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe o no está asignado al docente autenticado',
      );
    }

    return curso;
  }

  /**
   * Indica si el código todavía puede utilizarse.
   */
  private codigoEstaVigente(
    codigoInscripcion:
      string | null,

    codigoInscripcionActivo:
      boolean,

    codigoExpiraEn:
      Date | null,
  ): boolean {
    if (
      !codigoInscripcion ||
      !codigoInscripcionActivo
    ) {
      return false;
    }

    if (
      codigoExpiraEn &&
      codigoExpiraEn.getTime() <=
        Date.now()
    ) {
      return false;
    }

    return true;
  }

  /**
   * Genera un código legible evitando caracteres
   * que suelen confundirse:
   *
   * O, 0, I, 1 y L.
   */
  private generarCodigoAleatorio():
    string {
    let codigo =
      '';

    for (
      let indice = 0;
      indice <
      this.longitudCodigo;
      indice += 1
    ) {
      const posicion =
        randomInt(
          0,
          this.caracteresCodigo
            .length,
        );

      codigo +=
        this.caracteresCodigo[
          posicion
        ];
    }

    return codigo;
  }

  /**
   * Busca un código que todavía no exista
   * en ningún otro curso.
   */
  private async generarCodigoUnico():
    Promise<string> {
    const cantidadMaximaIntentos =
      20;

    for (
      let intento = 0;
      intento <
      cantidadMaximaIntentos;
      intento += 1
    ) {
      const codigo =
        this.generarCodigoAleatorio();

      const cursoExistente =
        await this.prisma.curso.findUnique({
          where: {
            codigoInscripcion:
              codigo,
          },

          select: {
            id: true,
          },
        });

      if (!cursoExistente) {
        return codigo;
      }
    }

    throw new ServiceUnavailableException(
      'No fue posible generar un código único. Inténtalo nuevamente',
    );
  }

  /**
   * Lista únicamente los cursos que están
   * asignados al docente autenticado.
   */
  async obtenerMisCursos(
    docenteId: number,
  ) {
    const cursos =
      await this.prisma.curso.findMany({
        where: {
          docenteId,
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
          finalizadoEn: true,

          codigoInscripcion:
            true,

          codigoInscripcionActivo:
            true,

          codigoGeneradoEn:
            true,

          codigoExpiraEn:
            true,

          creadoEn: true,
          actualizadoEn: true,

          materia: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              semestre: true,
              estado: true,
            },
          },

          _count: {
            select: {
              inscripciones: {
                where: {
                  estado:
                    EstadoInscripcion
                      .ACTIVA,
                },
              },
            },
          },
        },

        orderBy: [
          {
            estado:
              'asc',
          },

          {
            gestion:
              'desc',
          },

          {
            semestre:
              'asc',
          },

          {
            paralelo:
              'asc',
          },
        ],
      });

    return cursos.map(
      (
        curso,
      ) => {
        const codigoVigente =
          this.codigoEstaVigente(
            curso.codigoInscripcion,
            curso.codigoInscripcionActivo,
            curso.codigoExpiraEn,
          );

        return {
          id:
            curso.id,

          materiaId:
            curso.materiaId,

          docenteId:
            curso.docenteId,

          gestion:
            curso.gestion,

          paralelo:
            curso.paralelo,

          semestre:
            curso.semestre,

          cupoMaximo:
            curso.cupoMaximo,

          estado:
            curso.estado,

          finalizadoEn:
            curso.finalizadoEn,

          creadoEn:
            curso.creadoEn,

          actualizadoEn:
            curso.actualizadoEn,

          materia:
            curso.materia,

          codigoInscripcion:
            curso.codigoInscripcion,

          codigoInscripcionActivo:
            curso
              .codigoInscripcionActivo,

          codigoGeneradoEn:
            curso.codigoGeneradoEn,

          codigoExpiraEn:
            curso.codigoExpiraEn,

          codigoVigente,

          estudiantesInscritos:
            curso._count
              .inscripciones,

          cuposDisponibles:
            curso.cupoMaximo ===
            null
              ? null
              : Math.max(
                  curso.cupoMaximo -
                    curso._count
                      .inscripciones,
                  0,
                ),
        };
      },
    );
  }

  /**
   * Devuelve el detalle de un curso asignado
   * al docente autenticado.
   */
  async obtenerMiCursoPorId(
    docenteId: number,
    cursoId: number,
  ) {
    await this.obtenerCursoDelDocente(
      docenteId,
      cursoId,
    );

    const curso =
      await this.prisma.curso.findFirst({
        where: {
          id:
            cursoId,

          docenteId,
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
          finalizadoEn: true,

          codigoInscripcion:
            true,

          codigoInscripcionActivo:
            true,

          codigoGeneradoEn:
            true,

          codigoExpiraEn:
            true,

          creadoEn: true,
          actualizadoEn: true,

          materia: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              semestre: true,
              descripcion: true,
              estado: true,
            },
          },

          _count: {
            select: {
              inscripciones: {
                where: {
                  estado:
                    EstadoInscripcion
                      .ACTIVA,
                },
              },
            },
          },
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe o no está asignado al docente autenticado',
      );
    }

    const estudiantesInscritos =
      curso._count.inscripciones;

    const codigoVigente =
      this.codigoEstaVigente(
        curso.codigoInscripcion,
        curso.codigoInscripcionActivo,
        curso.codigoExpiraEn,
      );

    return {
      id:
        curso.id,

      materiaId:
        curso.materiaId,

      docenteId:
        curso.docenteId,

      gestion:
        curso.gestion,

      paralelo:
        curso.paralelo,

      semestre:
        curso.semestre,

      cupoMaximo:
        curso.cupoMaximo,

      estado:
        curso.estado,

      finalizadoEn:
        curso.finalizadoEn,

      creadoEn:
        curso.creadoEn,

      actualizadoEn:
        curso.actualizadoEn,

      materia:
        curso.materia,

      codigoInscripcion:
        curso.codigoInscripcion,

      codigoInscripcionActivo:
        curso.codigoInscripcionActivo,

      codigoGeneradoEn:
        curso.codigoGeneradoEn,

      codigoExpiraEn:
        curso.codigoExpiraEn,

      codigoVigente,

      estudiantesInscritos,

      cuposDisponibles:
        curso.cupoMaximo ===
        null
          ? null
          : Math.max(
              curso.cupoMaximo -
                estudiantesInscritos,
              0,
            ),
    };
  }

  /**
   * Genera un código nuevo.
   *
   * Si ya existía otro código, se reemplaza y
   * deja de ser válido inmediatamente.
   */
  async generarCodigoInscripcion(
    docenteId: number,
    cursoId: number,
    datos:
      GenerarCodigoInscripcionDto,
  ) {
    const curso =
      await this.obtenerCursoDelDocente(
        docenteId,
        cursoId,
      );

    if (
      curso.estado !==
      EstadoCurso.ACTIVO
    ) {
      if (
        curso.estado ===
        EstadoCurso.FINALIZADO
      ) {
        throw new BadRequestException(
          'No se puede generar un código para un curso finalizado',
        );
      }

      throw new BadRequestException(
        'No se puede generar un código para un curso inactivo',
      );
    }

    const diasVigencia =
      datos.diasVigencia ??
      this
        .diasVigenciaPredeterminados;

    const codigo =
      await this.generarCodigoUnico();

    const fechaActual =
      new Date();

    const fechaExpiracion =
      new Date(
        fechaActual,
      );

    fechaExpiracion.setDate(
      fechaExpiracion.getDate() +
        diasVigencia,
    );

    const cursoActualizado =
      await this.prisma.curso.update({
        where: {
          id:
            cursoId,
        },

        data: {
          codigoInscripcion:
            codigo,

          codigoInscripcionActivo:
            true,

          codigoGeneradoEn:
            fechaActual,

          codigoExpiraEn:
            fechaExpiracion,
        },

        select: {
          id: true,
          gestion: true,
          paralelo: true,
          estado: true,

          codigoInscripcion:
            true,

          codigoInscripcionActivo:
            true,

          codigoGeneradoEn:
            true,

          codigoExpiraEn:
            true,

          materia: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
      });

    return {
      mensaje:
        'Código de inscripción generado correctamente',

      diasVigencia,

      codigoVigente:
        true,

      curso:
        cursoActualizado,
    };
  }

  /**
   * Desactiva el código sin eliminarlo.
   *
   * Se conserva para mostrar su último valor,
   * pero ya no podrá utilizarse para inscribirse.
   */
  async desactivarCodigoInscripcion(
    docenteId: number,
    cursoId: number,
  ) {
    const curso =
      await this.obtenerCursoDelDocente(
        docenteId,
        cursoId,
      );

    if (
      !curso.codigoInscripcion
    ) {
      throw new BadRequestException(
        'El curso todavía no tiene un código de inscripción',
      );
    }

    if (
      !curso
        .codigoInscripcionActivo
    ) {
      return {
        mensaje:
          'El código de inscripción ya se encuentra desactivado',

        curso: {
          id:
            curso.id,

          codigoInscripcion:
            curso
              .codigoInscripcion,

          codigoInscripcionActivo:
            false,

          codigoGeneradoEn:
            curso
              .codigoGeneradoEn,

          codigoExpiraEn:
            curso
              .codigoExpiraEn,

          codigoVigente:
            false,
        },
      };
    }

    const cursoActualizado =
      await this.prisma.curso.update({
        where: {
          id:
            cursoId,
        },

        data: {
          codigoInscripcionActivo:
            false,
        },

        select: {
          id: true,

          codigoInscripcion:
            true,

          codigoInscripcionActivo:
            true,

          codigoGeneradoEn:
            true,

          codigoExpiraEn:
            true,
        },
      });

    return {
      mensaje:
        'Código de inscripción desactivado correctamente',

      curso: {
        ...cursoActualizado,

        codigoVigente:
          false,
      },
    };
  }

  /**
   * Lista los estudiantes que actualmente
   * tienen una inscripción activa.
   */
  async obtenerEstudiantesCurso(
    docenteId: number,
    cursoId: number,
  ) {
    const curso =
      await this.obtenerCursoDelDocente(
        docenteId,
        cursoId,
      );

    const inscripciones =
      await this.prisma
        .inscripcionCurso
        .findMany({
          where: {
            cursoId,

            estado:
              EstadoInscripcion
                .ACTIVA,
          },

          select: {
            id: true,
            estado: true,
            inscritoEn: true,
            retiradoEn: true,
            creadoEn: true,
            actualizadoEn: true,

            estudiante: {
              select: {
                id: true,
                nombres: true,
                apellidoPaterno:
                  true,

                apellidoMaterno:
                  true,

                correo: true,

                fotoPerfilUrl:
                  true,

                ultimoAccesoEn:
                  true,
              },
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
        });

    return {
      curso: {
        id:
          curso.id,

        gestion:
          curso.gestion,

        paralelo:
          curso.paralelo,

        semestre:
          curso.semestre,

        cupoMaximo:
          curso.cupoMaximo,

        estado:
          curso.estado,

        materia:
          curso.materia,
      },

      total:
        inscripciones.length,

      estudiantes:
        inscripciones.map(
          (
            inscripcion,
          ) => ({
            inscripcionId:
              inscripcion.id,

            estadoInscripcion:
              inscripcion.estado,

            inscritoEn:
              inscripcion.inscritoEn,

            retiradoEn:
              inscripcion.retiradoEn,

            estudiante:
              inscripcion.estudiante,
          }),
        ),
    };
  }
}