import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccionHistorialForo,
  EstadoRespuestaForo,
  Rol,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  BloquearRespuestaForoDto,
} from './dto/bloquear-respuesta-foro.dto';

import {
  ModerarComentarioForoDto,
} from './dto/moderar-comentario-foro.dto';

import {
  ModerarRespuestaForoDto,
} from './dto/moderar-respuesta-foro.dto';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

@Injectable()
export class ForoModeracionService {
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
        'Solo el docente puede moderar el foro',
      );
    }
  }

  private async validarCursoDocente(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    const curso =
      await this.prisma.curso.findFirst({
        where: {
          id:
            cursoId,

          docenteId:
            usuario.id,
        },

        select: {
          id:
            true,
        },
      });

    if (!curso) {
      throw new ForbiddenException(
        'El curso no pertenece al docente autenticado',
      );
    }

    return curso;
  }

  private async obtenerRespuesta(
    cursoId:
      number,
    respuestaId:
      number,
  ) {
    const respuesta =
      await this.prisma.respuestaForoCurso.findFirst({
        where: {
          id:
            respuestaId,

          tema: {
            cursoId,
          },
        },

        include: {
          tema: {
            select: {
              id:
                true,

              cursoId:
                true,

              estado:
                true,

              estaActivo:
                true,
            },
          },
        },
      });

    if (!respuesta) {
      throw new NotFoundException(
        'La respuesta no existe',
      );
    }

    return respuesta;
  }

  private async obtenerComentario(
    cursoId:
      number,
    comentarioId:
      number,
  ) {
    const comentario =
      await this.prisma.comentarioRespuestaForo.findFirst({
        where: {
          id:
            comentarioId,

          respuesta: {
            tema: {
              cursoId,
            },
          },
        },

        include: {
          respuesta: {
            select: {
              id:
                true,

              temaId:
                true,
            },
          },
        },
      });

    if (!comentario) {
      throw new NotFoundException(
        'El comentario no existe',
      );
    }

    return comentario;
  }

  async moderarRespuesta(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    respuestaId:
      number,
    datos:
      ModerarRespuestaForoDto,
  ) {
    await this.validarCursoDocente(
      usuario,
      cursoId,
    );

    const respuesta =
      await this.obtenerRespuesta(
        cursoId,
        respuestaId,
      );

    const estadoNuevo =
      datos.ocultar
        ? EstadoRespuestaForo.OCULTA
        : respuesta.entregadaTarde
          ? EstadoRespuestaForo.TARDIA
          : EstadoRespuestaForo.PUBLICADA;

    const actualizada =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          const registro =
            await tx.respuestaForoCurso.update({
              where: {
                id:
                  respuesta.id,
              },

              data: {
                estado:
                  estadoNuevo,

                estaActiva:
                  true,

                editadoEn:
                  new Date(),
              },
            });

          await tx.historialForoCurso.create({
            data: {
              temaId:
                respuesta.temaId,

              respuestaId:
                respuesta.id,

              actorId:
                usuario.id,

              accion:
                datos.ocultar
                  ? AccionHistorialForo.RESPUESTA_OCULTADA
                  : AccionHistorialForo.RESPUESTA_EDITADA,

              detalle: {
                accion:
                  datos.ocultar
                    ? 'OCULTAR_RESPUESTA'
                    : 'RESTAURAR_RESPUESTA',

                estadoAnterior:
                  respuesta.estado,

                estadoNuevo,
              },
            },
          });

          return registro;
        },
      );

    return {
      mensaje:
        datos.ocultar
          ? 'Respuesta ocultada correctamente'
          : 'Respuesta restaurada correctamente',

      respuesta:
        actualizada,
    };
  }

  async bloquearRespuesta(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    respuestaId:
      number,
    datos:
      BloquearRespuestaForoDto,
  ) {
    await this.validarCursoDocente(
      usuario,
      cursoId,
    );

    const respuesta =
      await this.obtenerRespuesta(
        cursoId,
        respuestaId,
      );

    const estadoNuevo =
      datos.bloquear
        ? EstadoRespuestaForo.BLOQUEADA
        : respuesta.entregadaTarde
          ? EstadoRespuestaForo.TARDIA
          : EstadoRespuestaForo.PUBLICADA;

    const actualizada =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          const registro =
            await tx.respuestaForoCurso.update({
              where: {
                id:
                  respuesta.id,
              },

              data: {
                estado:
                  estadoNuevo,

                bloqueadaEn:
                  datos.bloquear
                    ? new Date()
                    : null,
              },
            });

          await tx.historialForoCurso.create({
            data: {
              temaId:
                respuesta.temaId,

              respuestaId:
                respuesta.id,

              actorId:
                usuario.id,

              accion:
                datos.bloquear
                  ? AccionHistorialForo.RESPUESTA_BLOQUEADA
                  : AccionHistorialForo.RESPUESTA_EDITADA,

              detalle: {
                accion:
                  datos.bloquear
                    ? 'BLOQUEAR_RESPUESTA'
                    : 'DESBLOQUEAR_RESPUESTA',

                estadoAnterior:
                  respuesta.estado,

                estadoNuevo,
              },
            },
          });

          return registro;
        },
      );

    return {
      mensaje:
        datos.bloquear
          ? 'Respuesta bloqueada correctamente'
          : 'Respuesta desbloqueada correctamente',

      respuesta:
        actualizada,
    };
  }

  async moderarComentario(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    comentarioId:
      number,
    datos:
      ModerarComentarioForoDto,
  ) {
    await this.validarCursoDocente(
      usuario,
      cursoId,
    );

    const comentario =
      await this.obtenerComentario(
        cursoId,
        comentarioId,
      );

    const actualizado =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          const registro =
            await tx.comentarioRespuestaForo.update({
              where: {
                id:
                  comentario.id,
              },

              data: {
                estaOculto:
                  datos.ocultar,

                estaActivo:
                  true,

                editadoEn:
                  new Date(),
              },
            });

          await tx.historialForoCurso.create({
            data: {
              temaId:
                comentario.respuesta.temaId,

              respuestaId:
                comentario.respuestaId,

              comentarioId:
                comentario.id,

              actorId:
                usuario.id,

              accion:
                datos.ocultar
                  ? AccionHistorialForo.COMENTARIO_OCULTADO
                  : AccionHistorialForo.COMENTARIO_EDITADO,

              detalle: {
                accion:
                  datos.ocultar
                    ? 'OCULTAR_COMENTARIO'
                    : 'RESTAURAR_COMENTARIO',

                ocultoAnterior:
                  comentario.estaOculto,

                ocultoNuevo:
                  datos.ocultar,
              },
            },
          });

          return registro;
        },
      );

    return {
      mensaje:
        datos.ocultar
          ? 'Comentario ocultado correctamente'
          : 'Comentario restaurado correctamente',

      comentario:
        actualizado,
    };
  }

  async listarContenidoModerado(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    foroId:
      number,
  ) {
    await this.validarCursoDocente(
      usuario,
      cursoId,
    );

    const foro =
      await this.prisma.temaForoCurso.findFirst({
        where: {
          id:
            foroId,

          cursoId,
        },

        select: {
          id:
            true,
        },
      });

    if (!foro) {
      throw new NotFoundException(
        'El foro no existe',
      );
    }

    const [
      respuestas,
      comentarios,
    ] =
      await this.prisma.$transaction([
        this.prisma.respuestaForoCurso.findMany({
          where: {
            temaId:
              foroId,

            OR: [
              {
                estado:
                  EstadoRespuestaForo.OCULTA,
              },
              {
                estado:
                  EstadoRespuestaForo.BLOQUEADA,
              },
              {
                estaActiva:
                  false,
              },
            ],
          },

          orderBy: {
            actualizadoEn:
              'desc',
          },

          include: {
            autor: {
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
        }),

        this.prisma.comentarioRespuestaForo.findMany({
          where: {
            respuesta: {
              temaId:
                foroId,
            },

            OR: [
              {
                estaOculto:
                  true,
              },
              {
                estaActivo:
                  false,
              },
              {
                estaBloqueado:
                  true,
              },
            ],
          },

          orderBy: {
            actualizadoEn:
              'desc',
          },

          include: {
            autor: {
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

            respuesta: {
              select: {
                id:
                  true,

                titulo:
                  true,
              },
            },
          },
        }),
      ]);

    return {
      foroId,

      respuestas,

      comentarios,

      total:
        respuestas.length +
        comentarios.length,
    };
  }
}
