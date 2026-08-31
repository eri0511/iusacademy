import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccionHistorialForo,
  EstadoActividadCalificable,
  EstadoForo,
  Prisma,
  Rol,
  TipoDescuentoRetraso,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { CambiarFijadoForoDto } from './dto/cambiar-fijado-foro.dto';

import { ExtenderPlazoForoDto } from './dto/extender-plazo-foro.dto';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

@Injectable()
export class ForoCicloVidaService {
  constructor(private readonly prisma: PrismaService) {}

  private validarDocente(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede administrar el ciclo de vida del foro',
      );
    }
  }

  private async obtenerForoDocente(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    this.validarDocente(usuario);

    const foro = await this.prisma.temaForoCurso.findFirst({
      where: {
        id: foroId,

        cursoId,

        curso: {
          docenteId: usuario.id,
        },

        estaActivo: true,
      },

      include: {
        actividadCalificable: true,

        _count: {
          select: {
            respuestas: true,
          },
        },
      },
    });

    if (!foro) {
      throw new NotFoundException(
        'El foro no existe o no pertenece al docente autenticado',
      );
    }

    return foro;
  }

  private validarEstadoModificable(estado: EstadoForo) {
    const estadosBloqueados: EstadoForo[] = [
      EstadoForo.CALIFICANDO,
      EstadoForo.CALIFICADO,
      EstadoForo.NOTAS_PUBLICADAS,
      EstadoForo.ANULADO,
    ];

    if (estadosBloqueados.includes(estado)) {
      throw new BadRequestException(
        'El foro no puede modificar sus plazos en el estado actual',
      );
    }
  }

  private resolverEstadoPorFechas(
    foro: {
      estado: EstadoForo;

      fechaApertura: Date | null;

      fechaLimite: Date | null;

      fechaCierre: Date | null;

      fechaMaximaRetraso: Date | null;

      permitirRetrasos: boolean;
    },
    ahora: Date,
  ) {
    const limiteParticipacion = foro.permitirRetrasos
      ? (foro.fechaMaximaRetraso ?? foro.fechaCierre ?? foro.fechaLimite)
      : (foro.fechaLimite ?? foro.fechaCierre);

    /*
     * CALIFICANDO puede haber quedado guardado prematuramente por una
     * versión anterior del cierre automático. Si todavía existe una
     * ventana válida de entrega tardía, recuperamos el estado VENCIDO
     * para que los estudiantes puedan seguir participando.
     */
    const retrasoActivo =
      foro.permitirRetrasos &&
      foro.fechaLimite !== null &&
      ahora > foro.fechaLimite &&
      limiteParticipacion !== null &&
      ahora <= limiteParticipacion;

    const estadosProtegidos: EstadoForo[] = [
      EstadoForo.CALIFICADO,
      EstadoForo.NOTAS_PUBLICADAS,
      EstadoForo.ANULADO,
    ];

    if (
      estadosProtegidos.includes(foro.estado) ||
      (foro.estado === EstadoForo.CALIFICANDO && !retrasoActivo)
    ) {
      return foro.estado;
    }

    if (foro.fechaApertura && ahora < foro.fechaApertura) {
      return EstadoForo.PROGRAMADO;
    }

    if (foro.fechaCierre && ahora >= foro.fechaCierre) {
      return EstadoForo.CERRADO;
    }

    if (limiteParticipacion && ahora > limiteParticipacion) {
      return EstadoForo.CERRADO;
    }

    if (foro.fechaLimite && ahora > foro.fechaLimite) {
      return foro.permitirRetrasos ? EstadoForo.VENCIDO : EstadoForo.CERRADO;
    }

    return EstadoForo.ABIERTO;
  }

  private estadoActividadDesdeForo(estado: EstadoForo) {
    switch (estado) {
      case EstadoForo.ABIERTO:
      case EstadoForo.VENCIDO:
        return EstadoActividadCalificable.ACTIVA;

      case EstadoForo.CERRADO:
        return EstadoActividadCalificable.CERRADA;

      case EstadoForo.CALIFICANDO:
        return EstadoActividadCalificable.CALIFICANDO;

      case EstadoForo.CALIFICADO:
        return EstadoActividadCalificable.CALIFICADA;

      case EstadoForo.NOTAS_PUBLICADAS:
        return EstadoActividadCalificable.PUBLICADA;

      case EstadoForo.ANULADO:
        return EstadoActividadCalificable.ANULADA;

      default:
        return EstadoActividadCalificable.BORRADOR;
    }
  }

  async cambiarFijado(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: CambiarFijadoForoDto,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    if (foro.estaFijado === datos.estaFijado) {
      return {
        mensaje: datos.estaFijado
          ? 'El foro ya se encuentra fijado'
          : 'El foro ya se encuentra sin fijar',

        foro,
      };
    }

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const registro = await tx.temaForoCurso.update({
        where: {
          id: foro.id,
        },

        data: {
          estaFijado: datos.estaFijado,

          editadoEn: new Date(),
        },
      });

      await tx.historialForoCurso.create({
        data: {
          temaId: foro.id,

          actorId: usuario.id,

          accion: AccionHistorialForo.FORO_ACTUALIZADO,

          detalle: {
            accion: datos.estaFijado ? 'FIJADO' : 'DESFIJADO',

            valorAnterior: foro.estaFijado,

            valorNuevo: datos.estaFijado,
          },
        },
      });

      return registro;
    });

    return {
      mensaje: datos.estaFijado
        ? 'Foro fijado correctamente'
        : 'Foro desfijado correctamente',

      foro: actualizado,
    };
  }

  async extenderPlazo(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: ExtenderPlazoForoDto,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    this.validarEstadoModificable(foro.estado);

    const fechaLimite = new Date(datos.fechaLimite);

    const fechaCierre = new Date(datos.fechaCierre);

    const permitirRetrasos = datos.permitirRetrasos ?? foro.permitirRetrasos;

    const fechaMaximaRetraso = datos.fechaMaximaRetraso
      ? new Date(datos.fechaMaximaRetraso)
      : permitirRetrasos
        ? foro.fechaMaximaRetraso
        : null;

    if (foro.fechaApertura && fechaLimite <= foro.fechaApertura) {
      throw new BadRequestException(
        'La nueva fecha límite debe ser posterior a la apertura',
      );
    }

    if (fechaCierre < fechaLimite) {
      throw new BadRequestException(
        'La fecha de cierre no puede ser anterior a la fecha límite',
      );
    }

    if (permitirRetrasos) {
      if (!fechaMaximaRetraso) {
        throw new BadRequestException(
          'Debes indicar una fecha máxima para entregas tardías',
        );
      }

      if (fechaMaximaRetraso < fechaLimite) {
        throw new BadRequestException(
          'La fecha máxima de retraso debe ser igual o posterior a la fecha límite',
        );
      }

      if (fechaCierre < fechaMaximaRetraso) {
        throw new BadRequestException(
          'La fecha de cierre debe ser igual o posterior a la fecha máxima de retraso',
        );
      }
    }

    const estadoCalculado = this.resolverEstadoPorFechas(
      {
        ...foro,

        fechaLimite,

        fechaCierre,

        fechaMaximaRetraso,

        permitirRetrasos,
      },
      new Date(),
    );

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const registro = await tx.temaForoCurso.update({
        where: {
          id: foro.id,
        },

        data: {
          fechaLimite,

          fechaVencimiento: fechaLimite,

          fechaCierre,

          permitirRetrasos,

          fechaMaximaRetraso,

          tipoDescuentoRetraso: permitirRetrasos
            ? (datos.tipoDescuentoRetraso ?? foro.tipoDescuentoRetraso)
            : TipoDescuentoRetraso.NINGUNO,

          valorDescuentoRetraso: permitirRetrasos
            ? datos.valorDescuentoRetraso !== undefined
              ? new Prisma.Decimal(datos.valorDescuentoRetraso)
              : foro.valorDescuentoRetraso
            : null,

          estado: estadoCalculado,

          estaCerrado: estadoCalculado === EstadoForo.CERRADO,

          editadoEn: new Date(),
        },
      });

      if (foro.actividadCalificable) {
        await tx.actividadCalificable.update({
          where: {
            id: foro.actividadCalificable.id,
          },

          data: {
            estado: this.estadoActividadDesdeForo(estadoCalculado),

            visibleParaEstudiantes:
              estadoCalculado !== EstadoForo.BORRADOR &&
              estadoCalculado !== EstadoForo.PROGRAMADO &&
              estadoCalculado !== EstadoForo.ANULADO,

            cerradaEn:
              estadoCalculado === EstadoForo.CERRADO ? new Date() : null,
          },
        });
      }

      await tx.historialForoCurso.create({
        data: {
          temaId: foro.id,

          actorId: usuario.id,

          accion: AccionHistorialForo.PLAZO_EXTENDIDO,

          detalle: {
            fechaLimiteAnterior: foro.fechaLimite?.toISOString() ?? null,

            fechaLimiteNueva: fechaLimite.toISOString(),

            fechaCierreAnterior: foro.fechaCierre?.toISOString() ?? null,

            fechaCierreNueva: fechaCierre.toISOString(),

            permitirRetrasos,

            fechaMaximaRetraso: fechaMaximaRetraso?.toISOString() ?? null,

            estadoAnterior: foro.estado,

            estadoNuevo: estadoCalculado,
          },
        },
      });

      return registro;
    });

    return {
      mensaje: 'Plazo del foro actualizado correctamente',

      foro: actualizado,
    };
  }

  async sincronizarEstado(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    const estadoCalculado = this.resolverEstadoPorFechas(foro, new Date());

    if (estadoCalculado === foro.estado) {
      return {
        mensaje: 'El estado del foro ya está actualizado',

        estado: foro.estado,

        foro,
      };
    }

    const ahora = new Date();

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const registro = await tx.temaForoCurso.update({
        where: {
          id: foro.id,
        },

        data: {
          estado: estadoCalculado,

          estaCerrado: estadoCalculado === EstadoForo.CERRADO,
        },
      });

      if (foro.actividadCalificable) {
        await tx.actividadCalificable.update({
          where: {
            id: foro.actividadCalificable.id,
          },

          data: {
            estado: this.estadoActividadDesdeForo(estadoCalculado),

            visibleParaEstudiantes:
              estadoCalculado !== EstadoForo.BORRADOR &&
              estadoCalculado !== EstadoForo.PROGRAMADO &&
              estadoCalculado !== EstadoForo.ANULADO,

            ...(estadoCalculado === EstadoForo.CERRADO
              ? {
                  cerradaEn: ahora,
                }
              : {}),
          },
        });
      }

      await tx.historialForoCurso.create({
        data: {
          temaId: foro.id,

          actorId: usuario.id,

          accion:
            estadoCalculado === EstadoForo.CERRADO
              ? AccionHistorialForo.FORO_CERRADO
              : estadoCalculado === EstadoForo.ABIERTO
                ? AccionHistorialForo.FORO_ABIERTO
                : AccionHistorialForo.FORO_ACTUALIZADO,

          detalle: {
            accion: 'SINCRONIZACION_POR_FECHAS',

            estadoAnterior: foro.estado,

            estadoNuevo: estadoCalculado,
          },
        },
      });

      return registro;
    });

    return {
      mensaje: 'Estado del foro sincronizado correctamente',

      estadoAnterior: foro.estado,

      estadoNuevo: estadoCalculado,

      foro: actualizado,
    };
  }
}
