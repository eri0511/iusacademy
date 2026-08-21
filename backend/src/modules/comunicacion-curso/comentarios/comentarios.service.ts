import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoCurso,
  EstadoInscripcion,
  Rol,
} from '../../../generated/prisma/client';

import {
  PrismaService,
} from '../../../prisma/prisma.service';

import {
  ActualizarComentarioDto,
} from '../dto/actualizar-comentario.dto';

import {
  CrearComentarioDto,
} from '../dto/crear-comentario.dto';

type UsuarioAutenticado = {
  id: number;
  correo: string;
  rol: Rol;
};

@Injectable()
export class ComentariosService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private readonly seleccionComentario = {
    id: true,
    publicacionId: true,
    autorId: true,
    contenido: true,
    estaActivo: true,
    publicadoEn: true,
    editadoEn: true,
    eliminadoEn: true,
    creadoEn: true,
    actualizadoEn: true,

    autor: {
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        fotoPerfilUrl: true,
        rol: true,
      },
    },
  } as const;

  private async obtenerCurso(
    cursoId: number,
  ) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id:
            cursoId,
        },

        select: {
          id: true,
          docenteId: true,
          gestion: true,
          paralelo: true,
          semestre: true,
          estado: true,
          finalizadoEn: true,

          materia: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe',
      );
    }

    return curso;
  }

  private async verificarAccesoCurso(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,
  ) {
    const curso =
      await this.obtenerCurso(
        cursoId,
      );

    if (
      usuario.rol ===
      Rol.DOCENTE
    ) {
      if (
        curso.docenteId !==
        usuario.id
      ) {
        throw new ForbiddenException(
          'No tienes permiso para acceder a este curso',
        );
      }

      return {
        curso,
        esDocente:
          true,
      };
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
            id: true,
            estado: true,
            inscritoEn: true,
          },
        });

      if (!inscripcion) {
        throw new ForbiddenException(
          'No estás inscrito activamente en este curso',
        );
      }

      return {
        curso,
        esDocente:
          false,

        inscripcion,
      };
    }

    throw new ForbiddenException(
      'Tu rol no tiene acceso a los comentarios del curso',
    );
  }

  private validarCursoEditable(
    estado:
      EstadoCurso,
  ) {
    if (
      estado ===
      EstadoCurso.FINALIZADO
    ) {
      throw new BadRequestException(
        'El curso está finalizado y se conserva únicamente como historial',
      );
    }

    if (
      estado !==
      EstadoCurso.ACTIVO
    ) {
      throw new BadRequestException(
        'El curso debe estar activo para participar en los comentarios',
      );
    }
  }

  private async obtenerPublicacionActiva(
    cursoId:
      number,

    publicacionId:
      number,
  ) {
    const publicacion =
      await this.prisma.publicacionCurso.findFirst({
        where: {
          id:
            publicacionId,

          cursoId,

          estaActiva:
            true,
        },

        select: {
          id: true,
          cursoId: true,
          autorId: true,
          titulo: true,
          estaActiva: true,
          comentariosHabilitados: true,
        },
      });

    if (!publicacion) {
      throw new NotFoundException(
        'La publicación no existe o fue retirada',
      );
    }

    return publicacion;
  }

  private async obtenerComentarioActivo(
    publicacionId:
      number,

    comentarioId:
      number,
  ) {
    const comentario =
      await this.prisma.comentarioPublicacion.findFirst({
        where: {
          id:
            comentarioId,

          publicacionId,

          estaActivo:
            true,
        },

        select:
          this.seleccionComentario,
      });

    if (!comentario) {
      throw new NotFoundException(
        'El comentario no existe o fue retirado',
      );
    }

    return comentario;
  }

  async obtenerComentarios(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    publicacionId:
      number,
  ) {
    await this.verificarAccesoCurso(
      usuario,
      cursoId,
    );

    const publicacion =
      await this.obtenerPublicacionActiva(
        cursoId,
        publicacionId,
      );

    const comentarios =
      await this.prisma.comentarioPublicacion.findMany({
        where: {
          publicacionId,

          estaActivo:
            true,
        },

        select:
          this.seleccionComentario,

        orderBy: {
          publicadoEn:
            'asc',
        },
      });

    return {
      publicacion: {
        id:
          publicacion.id,

        titulo:
          publicacion.titulo,

        comentariosHabilitados:
          publicacion.comentariosHabilitados,
      },

      total:
        comentarios.length,

      comentarios,
    };
  }

  async crearComentario(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    publicacionId:
      number,

    datos:
      CrearComentarioDto,
  ) {
    const acceso =
      await this.verificarAccesoCurso(
        usuario,
        cursoId,
      );

    this.validarCursoEditable(
      acceso.curso.estado,
    );

    const publicacion =
      await this.obtenerPublicacionActiva(
        cursoId,
        publicacionId,
      );

    if (
      !publicacion.comentariosHabilitados
    ) {
      throw new BadRequestException(
        'Los comentarios se encuentran deshabilitados en esta publicación',
      );
    }

    const comentario =
      await this.prisma.comentarioPublicacion.create({
        data: {
          publicacionId,

          autorId:
            usuario.id,

          contenido:
            datos.contenido,

          estaActivo:
            true,

          publicadoEn:
            new Date(),

          editadoEn:
            null,

          eliminadoEn:
            null,
        },

        select:
          this.seleccionComentario,
      });

    return {
      mensaje:
        'Comentario publicado correctamente',

      comentario,
    };
  }

  async actualizarComentario(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    publicacionId:
      number,

    comentarioId:
      number,

    datos:
      ActualizarComentarioDto,
  ) {
    const acceso =
      await this.verificarAccesoCurso(
        usuario,
        cursoId,
      );

    this.validarCursoEditable(
      acceso.curso.estado,
    );

    const publicacion =
      await this.obtenerPublicacionActiva(
        cursoId,
        publicacionId,
      );

    if (
      !publicacion.comentariosHabilitados
    ) {
      throw new BadRequestException(
        'Los comentarios se encuentran deshabilitados en esta publicación',
      );
    }

    const comentarioActual =
      await this.obtenerComentarioActivo(
        publicacionId,
        comentarioId,
      );

    const puedeEditar =
      comentarioActual.autorId ===
      usuario.id;

    if (!puedeEditar) {
      throw new ForbiddenException(
        'Solo puedes editar tus propios comentarios',
      );
    }

    const comentario =
      await this.prisma.comentarioPublicacion.update({
        where: {
          id:
            comentarioId,
        },

        data: {
          contenido:
            datos.contenido,

          editadoEn:
            new Date(),
        },

        select:
          this.seleccionComentario,
      });

    return {
      mensaje:
        'Comentario actualizado correctamente',

      comentario,
    };
  }

  async eliminarComentario(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    publicacionId:
      number,

    comentarioId:
      number,
  ) {
    const acceso =
      await this.verificarAccesoCurso(
        usuario,
        cursoId,
      );

    this.validarCursoEditable(
      acceso.curso.estado,
    );

    await this.obtenerPublicacionActiva(
      cursoId,
      publicacionId,
    );

    const comentarioActual =
      await this.obtenerComentarioActivo(
        publicacionId,
        comentarioId,
      );

    const esAutor =
      comentarioActual.autorId ===
      usuario.id;

    const esDocentePropietario =
      usuario.rol ===
        Rol.DOCENTE &&
      acceso.curso.docenteId ===
        usuario.id;

    if (
      !esAutor &&
      !esDocentePropietario
    ) {
      throw new ForbiddenException(
        'No tienes permiso para retirar este comentario',
      );
    }

    const comentario =
      await this.prisma.comentarioPublicacion.update({
        where: {
          id:
            comentarioId,
        },

        data: {
          estaActivo:
            false,

          eliminadoEn:
            new Date(),
        },

        select:
          this.seleccionComentario,
      });

    return {
      mensaje:
        esAutor
          ? 'Comentario retirado correctamente'
          : 'Comentario moderado y retirado correctamente',

      comentario,
    };
  }
}