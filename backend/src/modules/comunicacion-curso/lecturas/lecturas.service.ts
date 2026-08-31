import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EstadoInscripcion } from '../../../generated/prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LecturasService {
  constructor(private readonly prisma: PrismaService) {}

  private async obtenerPublicacionActiva(
    cursoId: number,

    publicacionId: number,
  ) {
    const publicacion = await this.prisma.publicacionCurso.findFirst({
      where: {
        id: publicacionId,

        cursoId,

        estaActiva: true,
      },

      select: {
        id: true,
        cursoId: true,
        titulo: true,
        publicadoEn: true,

        curso: {
          select: {
            id: true,
            docenteId: true,
            estado: true,

            materia: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
              },
            },
          },
        },
      },
    });

    if (!publicacion) {
      throw new NotFoundException('La publicación no existe o fue retirada');
    }

    return publicacion;
  }

  private async verificarInscripcionActiva(
    estudianteId: number,

    cursoId: number,
  ) {
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
      },
    });

    if (!inscripcion) {
      throw new ForbiddenException(
        'No estás inscrito activamente en este curso',
      );
    }

    return inscripcion;
  }

  async registrarLectura(
    estudianteId: number,

    cursoId: number,

    publicacionId: number,
  ) {
    await this.verificarInscripcionActiva(estudianteId, cursoId);

    await this.obtenerPublicacionActiva(cursoId, publicacionId);

    const lectura = await this.prisma.lecturaPublicacion.upsert({
      where: {
        publicacionId_usuarioId: {
          publicacionId,
          usuarioId: estudianteId,
        },
      },

      create: {
        publicacionId,

        usuarioId: estudianteId,

        leidoEn: new Date(),
      },

      update: {
        leidoEn: new Date(),
      },

      select: {
        id: true,
        publicacionId: true,
        usuarioId: true,
        leidoEn: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });

    return {
      mensaje: 'Lectura registrada correctamente',

      lectura,
    };
  }

  async obtenerLecturas(
    docenteId: number,

    cursoId: number,

    publicacionId: number,
  ) {
    const publicacion = await this.obtenerPublicacionActiva(
      cursoId,
      publicacionId,
    );

    if (publicacion.curso.docenteId !== docenteId) {
      throw new ForbiddenException(
        'No tienes permiso para consultar las lecturas de este curso',
      );
    }

    const [totalEstudiantes, lecturas] = await this.prisma.$transaction([
      this.prisma.inscripcionCurso.count({
        where: {
          cursoId,

          estado: EstadoInscripcion.ACTIVA,
        },
      }),

      this.prisma.lecturaPublicacion.findMany({
        where: {
          publicacionId,

          usuario: {
            inscripcionesComoEstudiante: {
              some: {
                cursoId,

                estado: EstadoInscripcion.ACTIVA,
              },
            },
          },
        },

        select: {
          id: true,
          leidoEn: true,
          creadoEn: true,
          actualizadoEn: true,

          usuario: {
            select: {
              id: true,
              nombres: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              correo: true,
              fotoPerfilUrl: true,
              ultimoAccesoEn: true,
              estaActivo: true,
              cuentaActivada: true,
            },
          },
        },

        orderBy: {
          leidoEn: 'desc',
        },
      }),
    ]);

    const totalLecturas = lecturas.length;

    const totalPendientes = Math.max(totalEstudiantes - totalLecturas, 0);

    const porcentajeLectura =
      totalEstudiantes === 0
        ? 0
        : Number(((totalLecturas / totalEstudiantes) * 100).toFixed(2));

    return {
      publicacion: {
        id: publicacion.id,

        titulo: publicacion.titulo,

        publicadoEn: publicacion.publicadoEn,
      },

      resumen: {
        totalEstudiantes,
        totalLecturas,
        totalPendientes,
        porcentajeLectura,
      },

      lecturas,
    };
  }
}
