import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccionHistorialForo,
  EstadoCalificacion,
  EstadoRespuestaForo,
  Prisma,
  TipoEvaluacionForo,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ActualizarComentarioForoDto,
} from './dto/actualizar-comentario-foro.dto';

import {
  CrearComentarioForoDto,
} from './dto/crear-comentario-foro.dto';

import {
  ForoReglasService,
} from './foro-reglas.service';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

@Injectable()
export class ForoComentariosService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly reglas:
      ForoReglasService,
  ) {}

  private async recalificarParticipacion(
    transaccion:
      Prisma.TransactionClient,
    foroId:
      number,
    estudianteId:
      number,
  ) {
    const foro =
      await transaccion.temaForoCurso.findUnique({
        where: {
          id:
            foroId,
        },

        include: {
          actividadCalificable:
            true,
        },
      });

    if (
      !foro ||
      !foro.actividadCalificable ||
      foro.minimoComentariosPorEstudiante <=
        0 ||
      (
        foro.tipoEvaluacion !==
          TipoEvaluacionForo.AUTOMATICA &&
        !foro.calificacionAutomaticaAlCumplir
      )
    ) {
      return;
    }

    const evaluacionComentarios =
      await this.reglas.evaluarComentariosParaCalificacion(
        foro.id,
        estudianteId,
        100,
        transaccion,
      );

    if (
      evaluacionComentarios.esRepresentante ||
      !evaluacionComentarios.aplicaRequisito ||
      !evaluacionComentarios.cumplio
    ) {
      return;
    }

    const respuesta =
      await transaccion.respuestaForoCurso.findFirst({
        where: {
          temaId:
            foro.id,
          estaActiva:
            true,
          estado: {
            not:
              EstadoRespuestaForo.ANULADA,
          },
          OR: [
            {
              autorId:
                estudianteId,
            },
            {
              grupoCurso: {
                integrantes: {
                  some: {
                    estudianteId,
                    estaActivo:
                      true,
                  },
                },
              },
            },
            {
              equipoAfinidad: {
                integrantes: {
                  some: {
                    estudianteId,
                    estaActivo:
                      true,
                  },
                },
              },
            },
          ],
        },
      });

    if (!respuesta) {
      return;
    }

    const descuento =
      Number(
        respuesta.descuentoCalculado,
      );

    await transaccion.calificacionEstudiante.upsert({
      where: {
        actividadId_estudianteId: {
          actividadId:
            foro.actividadCalificable.id,
          estudianteId,
        },
      },

      create: {
        actividadId:
          foro.actividadCalificable.id,
        estudianteId,
        respuestaForoId:
          respuesta.id,
        grupoCursoId:
          respuesta.grupoCursoId,
        equipoAfinidadId:
          respuesta.equipoAfinidadId,
        notaBase:
          new Prisma.Decimal(
            100,
          ),
        descuentoRetraso:
          new Prisma.Decimal(
            descuento,
          ),
        descuentoComentarios:
          new Prisma.Decimal(
            0,
          ),
        notaFinal:
          new Prisma.Decimal(
            Math.max(
              0,
              100 -
              descuento,
            ),
          ),
        estado:
          EstadoCalificacion.CALIFICADA,
        calificadaEn:
          new Date(),
      },

      update: {
        respuestaForoId:
          respuesta.id,
        notaBase:
          new Prisma.Decimal(
            100,
          ),
        descuentoRetraso:
          new Prisma.Decimal(
            descuento,
          ),
        descuentoComentarios:
          new Prisma.Decimal(
            0,
          ),
        notaFinal:
          new Prisma.Decimal(
            Math.max(
              0,
              100 -
              descuento,
            ),
          ),
        estado:
          EstadoCalificacion.CALIFICADA,
        calificadaEn:
          new Date(),
        publicadaEn:
          null,
      },
    });
  }

  async crear(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    respuestaId:
      number,
    datos:
      CrearComentarioForoDto,
  ) {
    await this.reglas.validarInscripcion(
      usuario,
      cursoId,
    );

    const respuesta =
      await this.prisma.respuestaForoCurso.findFirst({
        where: {
          id:
            respuestaId,
          estaActiva:
            true,
          tema: {
            cursoId,
            estaActivo:
              true,
          },
        },

        include: {
          tema:
            true,
        },
      });

    if (!respuesta) {
      throw new NotFoundException(
        'La respuesta no existe',
      );
    }

    this.reglas.validarForoDisponible(
      respuesta.tema,
    );

    if (
      !respuesta.tema.permitirComentarios
    ) {
      throw new BadRequestException(
        'Este foro no permite comentarios',
      );
    }

    /*
     * Las reglas grupales se validan en backend.
     *
     * REPRESENTANTE_UNICO:
     *   solo el representante participa directamente.
     *
     * PARTICIPACION_DISTRIBUIDA:
     *   cada integrante comenta únicamente la respuesta
     *   principal de su propio grupo/equipo.
     *
     * COLABORACION_ABIERTA:
     *   cada integrante puede comentar también respuestas
     *   principales de otros grupos/equipos.
     */
    await this.reglas.validarPermisoComentarioGrupal(
      respuesta.tema,
      {
        grupoCursoId:
          respuesta.grupoCursoId,

        equipoAfinidadId:
          respuesta.equipoAfinidadId,
      },
      usuario.id,
    );

    this.reglas.validarCantidadPalabras(
      datos.contenido,
      respuesta.tema.palabrasMinimasComentario,
      respuesta.tema.palabrasMaximasComentario,
      'comentario',
    );

    if (
      respuesta.tema.maximoComentariosPorEstudiante !==
      null
    ) {
      const total =
        await this.prisma.comentarioRespuestaForo.count({
          where: {
            autorId:
              usuario.id,
            estaActivo:
              true,
            respuesta: {
              temaId:
                respuesta.temaId,
            },
          },
        });

      if (
        total >=
        respuesta.tema.maximoComentariosPorEstudiante
      ) {
        throw new BadRequestException(
          'Alcanzaste el máximo de comentarios permitido',
        );
      }
    }

    if (
      datos.comentarioPadreId
    ) {
      const padre =
        await this.prisma.comentarioRespuestaForo.findFirst({
          where: {
            id:
              datos.comentarioPadreId,
            respuestaId:
              respuesta.id,
            estaActivo:
              true,
          },

          select: {
            id:
              true,
          },
        });

      if (!padre) {
        throw new BadRequestException(
          'El comentario padre no pertenece a esta respuesta',
        );
      }
    }

    return this.prisma.$transaction(
      async (
        transaccion,
      ) => {
        const comentario =
          await transaccion.comentarioRespuestaForo.create({
            data: {
              respuestaId:
                respuesta.id,
              autorId:
                usuario.id,
              comentarioPadreId:
                datos.comentarioPadreId ??
                null,
              contenido:
                datos.contenido.trim(),
            },
          });

        await transaccion.historialForoCurso.create({
          data: {
            temaId:
              respuesta.temaId,
            respuestaId:
              respuesta.id,
            comentarioId:
              comentario.id,
            actorId:
              usuario.id,
            accion:
              AccionHistorialForo.COMENTARIO_CREADO,
          },
        });

        await this.recalificarParticipacion(
          transaccion,
          respuesta.temaId,
          usuario.id,
        );

        return {
          mensaje:
            'Comentario publicado correctamente',
          comentario,
        };
      },
    );
  }

  private async obtenerComentarioEditable(
    usuario:
      UsuarioAutenticado,
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
          estaActivo:
            true,
          respuesta: {
            tema: {
              cursoId,
              estaActivo:
                true,
            },
          },
        },

        include: {
          respuesta: {
            include: {
              tema:
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

    this.reglas.validarForoDisponible(
      comentario.respuesta.tema,
    );

    if (
      comentario.estaBloqueado ||
      comentario.autorId !==
        usuario.id
    ) {
      throw new ForbiddenException(
        'No puedes modificar este comentario',
      );
    }

    return comentario;
  }

  async actualizar(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    comentarioId:
      number,
    datos:
      ActualizarComentarioForoDto,
  ) {
    await this.reglas.validarInscripcion(
      usuario,
      cursoId,
    );

    const comentario =
      await this.obtenerComentarioEditable(
        usuario,
        cursoId,
        comentarioId,
      );

    if (
      !comentario.respuesta.tema.permitirEditarComentarios
    ) {
      throw new ForbiddenException(
        'El docente no permite editar comentarios en este foro',
      );
    }

    this.reglas.validarCantidadPalabras(
      datos.contenido,
      comentario.respuesta.tema.palabrasMinimasComentario,
      comentario.respuesta.tema.palabrasMaximasComentario,
      'comentario',
    );

    const actualizado =
      await this.prisma.$transaction(
        async (
          transaccion,
        ) => {
          const registro =
            await transaccion.comentarioRespuestaForo.update({
              where: {
                id:
                  comentario.id,
              },

              data: {
                contenido:
                  datos.contenido.trim(),
                editadoEn:
                  new Date(),
              },
            });

          await transaccion.historialForoCurso.create({
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
                AccionHistorialForo.COMENTARIO_EDITADO,
            },
          });

          return registro;
        },
      );

    return {
      mensaje:
        'Comentario actualizado correctamente',
      comentario:
        actualizado,
    };
  }

  async eliminar(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    comentarioId:
      number,
  ) {
    await this.reglas.validarInscripcion(
      usuario,
      cursoId,
    );

    const comentario =
      await this.obtenerComentarioEditable(
        usuario,
        cursoId,
        comentarioId,
      );

    if (
      !comentario.respuesta.tema.permitirEliminarComentarios
    ) {
      throw new ForbiddenException(
        'El docente no permite eliminar comentarios en este foro',
      );
    }

    await this.prisma.$transaction(
      async (
        transaccion,
      ) => {
        await transaccion.comentarioRespuestaForo.update({
          where: {
            id:
              comentario.id,
          },

          data: {
            estaActivo:
              false,
            eliminadoEn:
              new Date(),
          },
        });

        await transaccion.historialForoCurso.create({
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
              AccionHistorialForo.COMENTARIO_ANULADO,
          },
        });
      },
    );

    return {
      mensaje:
        'Comentario eliminado correctamente',
    };
  }
}
