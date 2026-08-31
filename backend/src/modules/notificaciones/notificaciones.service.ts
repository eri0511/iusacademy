import { Injectable, NotFoundException } from '@nestjs/common';

import { TipoNotificacion } from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { ListarNotificacionesQueryDto } from './dto/listar-notificaciones-query.dto';

export type CrearNotificacionParams = {
  destinatarioId: number;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo?: string;
  enlace?: string;
};

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(params: CrearNotificacionParams) {
    return this.prisma.notificacion.create({
      data: {
        destinatarioId: params.destinatarioId,

        tipo: params.tipo,

        titulo: params.titulo,

        cuerpo: params.cuerpo,

        enlace: params.enlace,
      },
    });
  }

  async crearMuchas(params: CrearNotificacionParams[]) {
    if (params.length === 0) {
      return [];
    }

    return this.prisma.notificacion.createMany({
      data: params.map((p) => ({
        destinatarioId: p.destinatarioId,

        tipo: p.tipo,

        titulo: p.titulo,

        cuerpo: p.cuerpo,

        enlace: p.enlace,
      })),
    });
  }

  async listar(
    destinatarioId: number,

    filtros: ListarNotificacionesQueryDto,
  ) {
    const pagina = filtros.pagina ?? 1;

    const limite = filtros.limite ?? 20;

    const where: {
      destinatarioId: number;

      esLeida?: boolean;
    } = {
      destinatarioId,
    };

    if (filtros.esLeida !== undefined) {
      where.esLeida = filtros.esLeida;
    }

    const [notificaciones, total, noLeidas] = await this.prisma.$transaction([
      this.prisma.notificacion.findMany({
        where,

        orderBy: {
          creadoEn: 'desc',
        },

        skip: (pagina - 1) * limite,

        take: limite,

        select: {
          id: true,
          tipo: true,
          titulo: true,
          cuerpo: true,
          enlace: true,
          esLeida: true,
          leidaEn: true,
          creadoEn: true,
        },
      }),

      this.prisma.notificacion.count({
        where,
      }),

      this.prisma.notificacion.count({
        where: {
          destinatarioId,
          esLeida: false,
        },
      }),
    ]);

    return {
      notificaciones,

      total,

      noLeidas,

      pagina,

      limite,

      totalPaginas: Math.ceil(total / limite),
    };
  }

  async contarNoLeidas(destinatarioId: number) {
    const noLeidas = await this.prisma.notificacion.count({
      where: {
        destinatarioId,
        esLeida: false,
      },
    });

    return {
      noLeidas,
    };
  }

  async marcarLeida(
    destinatarioId: number,

    id: number,
  ) {
    const notificacion = await this.prisma.notificacion.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        destinatarioId: true,
      },
    });

    if (!notificacion || notificacion.destinatarioId !== destinatarioId) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.prisma.notificacion.update({
      where: {
        id,
      },

      data: {
        esLeida: true,

        leidaEn: new Date(),
      },
    });
  }

  async marcarTodasLeidas(destinatarioId: number) {
    const resultado = await this.prisma.notificacion.updateMany({
      where: {
        destinatarioId,

        esLeida: false,
      },

      data: {
        esLeida: true,

        leidaEn: new Date(),
      },
    });

    return {
      actualizadas: resultado.count,
    };
  }

  async eliminar(
    destinatarioId: number,

    id: number,
  ) {
    const notificacion = await this.prisma.notificacion.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        destinatarioId: true,
      },
    });

    if (!notificacion || notificacion.destinatarioId !== destinatarioId) {
      throw new NotFoundException('Notificación no encontrada');
    }

    await this.prisma.notificacion.delete({
      where: {
        id,
      },
    });

    return {
      eliminada: true,
    };
  }
}
