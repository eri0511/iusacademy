import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoCurso,
  EstadoInscripcion,
  Rol,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

type UsuarioAutenticado = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  rol: Rol;
};

type EstadoTemporalHito =
  | 'FINALIZADO'
  | 'EN_CURSO'
  | 'PROXIMO'
  | 'PENDIENTE';

@Injectable()
export class AulaCursoService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private obtenerEstadoTemporalHito(
    fechaInicio:
      Date,

    fechaFin:
      Date,

    ahora =
      new Date(),
  ): EstadoTemporalHito {
    if (
      ahora >
      fechaFin
    ) {
      return 'FINALIZADO';
    }

    if (
      ahora >=
        fechaInicio &&
      ahora <=
        fechaFin
    ) {
      return 'EN_CURSO';
    }

    return 'PROXIMO';
  }

  private construirPermisos(
    rol:
      Rol,
  ) {
    const esDocente =
      rol ===
      Rol.DOCENTE;

    return {
      puedeAdministrar:
        esDocente,

      puedePublicar:
        esDocente,

      puedeCrearForos:
        esDocente,

      puedeCrearTareas:
        esDocente,

      puedeCrearQuizzes:
        esDocente,

      puedeCalificar:
        esDocente,

      puedeVerEstudiantes:
        esDocente,

      puedeComentar:
        rol ===
          Rol.DOCENTE ||
        rol ===
          Rol.ESTUDIANTE,

      puedeResponderForos:
        rol ===
          Rol.DOCENTE ||
        rol ===
          Rol.ESTUDIANTE,

      puedeEntregarTareas:
        rol ===
        Rol.ESTUDIANTE,

      puedeResolverQuizzes:
        rol ===
        Rol.ESTUDIANTE,

      puedeVerPropiasCalificaciones:
        rol ===
        Rol.ESTUDIANTE,
    };
  }

  private async verificarAccesoCurso(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,
  ) {
    if (
      usuario.rol !==
        Rol.DOCENTE &&
      usuario.rol !==
        Rol.ESTUDIANTE
    ) {
      throw new ForbiddenException(
        'Tu rol no tiene acceso al aula virtual',
      );
    }

    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id:
            cursoId,
        },

        select: {
          id: true,
          materiaId: true,
          docenteId: true,
          planificacionId: true,
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
              estado: true,
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

          planificacion: {
            select: {
              id: true,
              gestion: true,
              descripcion: true,
              estaActiva: true,

              hitos: {
                orderBy: {
                  numero:
                    'asc',
                },

                select: {
                  id: true,
                  numero: true,
                  codigo: true,
                  nombre: true,
                  descripcion: true,
                  fechaInicio: true,
                  fechaFin: true,
                  puntajeTotal: true,
                  puntajeContinua: true,
                  puntajeProcesual: true,
                },
              },
            },
          },

          _count: {
            select: {
              inscripciones: {
                where: {
                  estado:
                    EstadoInscripcion.ACTIVA,
                },
              },
            },
          },
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso solicitado no existe',
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
          'No tienes permiso para ingresar a un curso asignado a otro docente',
        );
      }

      return {
        curso,
        inscripcion:
          null,
      };
    }

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
          id: true,
          estado: true,
          inscritoEn: true,
          retiradoEn: true,
        },
      });

    if (!inscripcion) {
      throw new ForbiddenException(
        'No estás inscrito activamente en este curso',
      );
    }

    return {
      curso,
      inscripcion,
    };
  }

  private async asociarPlanificacionSiCorresponde(
    cursoId:
      number,

    gestion:
      string,

    planificacionId:
      number | null,
  ) {
    if (
      planificacionId !==
      null
    ) {
      return;
    }

    const planificacion =
      await this.prisma.planificacionAcademica.findUnique({
        where: {
          gestion,
        },

        select: {
          id: true,
        },
      });

    if (!planificacion) {
      return;
    }

    await this.prisma.curso.update({
      where: {
        id:
          cursoId,
      },

      data: {
        planificacionId:
          planificacion.id,
      },
    });
  }

  private construirPlanificacion(
    planificacion:
      {
        id: number;
        gestion: string;
        descripcion: string | null;
        estaActiva: boolean;

        hitos: {
          id: number;
          numero: number;
          codigo: string;
          nombre: string;
          descripcion: string | null;
          fechaInicio: Date;
          fechaFin: Date;
          puntajeTotal: number;
          puntajeContinua: number;
          puntajeProcesual: number;
        }[];
      } |
      null,
  ) {
    if (!planificacion) {
      return {
        tienePlanificacion:
          false,

        id:
          null,

        gestion:
          null,

        descripcion:
          null,

        estaActiva:
          false,

        hitoActualId:
          null,

        proximoHitoId:
          null,

        estado:
          'SIN_PLANIFICACION' as const,

        hitos:
          [],
      };
    }

    const ahora =
      new Date();

    const hitos =
      planificacion.hitos.map(
        (
          hito,
        ) => ({
          ...hito,

          estado:
            this.obtenerEstadoTemporalHito(
              hito.fechaInicio,
              hito.fechaFin,
              ahora,
            ),
        }),
      );

    const hitoActual =
      hitos.find(
        (
          hito,
        ) =>
          hito.estado ===
          'EN_CURSO',
      ) ??
      null;

    const proximoHito =
      hitos.find(
        (
          hito,
        ) =>
          hito.estado ===
          'PROXIMO',
      ) ??
      null;

    const todosFinalizados =
      hitos.length >
        0 &&
      hitos.every(
        (
          hito,
        ) =>
          hito.estado ===
          'FINALIZADO',
      );

    return {
      tienePlanificacion:
        true,

      id:
        planificacion.id,

      gestion:
        planificacion.gestion,

      descripcion:
        planificacion.descripcion,

      estaActiva:
        planificacion.estaActiva,

      hitoActualId:
        hitoActual?.id ??
        null,

      proximoHitoId:
        proximoHito?.id ??
        null,

      estado:
        hitoActual
          ? 'EN_CURSO' as const
          : proximoHito
            ? 'PROXIMA' as const
            : todosFinalizados
              ? 'FINALIZADA' as const
              : 'SIN_HITOS' as const,

      hitos,
    };
  }

  async obtenerAulaCurso(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,
  ) {
    let acceso =
      await this.verificarAccesoCurso(
        usuario,
        cursoId,
      );

    if (
      acceso.curso.planificacionId ===
      null
    ) {
      await this.asociarPlanificacionSiCorresponde(
        acceso.curso.id,
        acceso.curso.gestion,
        acceso.curso.planificacionId,
      );

      acceso =
        await this.verificarAccesoCurso(
          usuario,
          cursoId,
        );
    }

    const curso =
      acceso.curso;

    const estudiantesInscritos =
      curso._count.inscripciones;

    return {
      usuario: {
        id:
          usuario.id,

        rol:
          usuario.rol,

        nombres:
          usuario.nombres,

        apellidoPaterno:
          usuario.apellidoPaterno,
      },

      permisos:
        this.construirPermisos(
          usuario.rol,
        ),

      inscripcion:
        acceso.inscripcion,

      curso: {
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

        docente:
          curso.docente,

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

        estaDisponible:
          curso.estado ===
          EstadoCurso.ACTIVO,
      },

      planificacion:
        this.construirPlanificacion(
          curso.planificacion,
        ),
    };
  }

  async obtenerHitosCurso(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,
  ) {
    const aula =
      await this.obtenerAulaCurso(
        usuario,
        cursoId,
      );

    return {
      curso: {
        id:
          aula.curso.id,

        gestion:
          aula.curso.gestion,

        paralelo:
          aula.curso.paralelo,

        estado:
          aula.curso.estado,

        materia:
          aula.curso.materia,
      },

      permisos:
        aula.permisos,

      planificacion:
        aula.planificacion,
    };
  }

  async obtenerHitoCurso(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    hitoId:
      number,
  ) {
    const aula =
      await this.obtenerAulaCurso(
        usuario,
        cursoId,
      );

    if (
      !aula.planificacion
        .tienePlanificacion
    ) {
      throw new NotFoundException(
        'La gestión del curso todavía no tiene una planificación académica',
      );
    }

    const hito =
      aula.planificacion.hitos.find(
        (
          elemento,
        ) =>
          elemento.id ===
          hitoId,
      );

    if (!hito) {
      throw new NotFoundException(
        'El hito no pertenece a la planificación académica de este curso',
      );
    }

    return {
      curso: {
        id:
          aula.curso.id,

        gestion:
          aula.curso.gestion,

        paralelo:
          aula.curso.paralelo,

        estado:
          aula.curso.estado,

        materia:
          aula.curso.materia,

        docente:
          aula.curso.docente,
      },

      permisos:
        aula.permisos,

      planificacion: {
        id:
          aula.planificacion.id,

        gestion:
          aula.planificacion.gestion,

        estaActiva:
          aula.planificacion.estaActiva,

        estado:
          aula.planificacion.estado,

        hitoActualId:
          aula.planificacion.hitoActualId,

        proximoHitoId:
          aula.planificacion.proximoHitoId,
      },

      hito,
    };
  }
}