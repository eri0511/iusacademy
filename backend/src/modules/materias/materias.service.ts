import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoMateria,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ActualizarMateriaDto,
} from './dto/actualizar-materia.dto';

import {
  CrearMateriaDto,
} from './dto/crear-materia.dto';

@Injectable()
export class MateriasService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async obtenerTodas() {
    return this.prisma.materia.findMany({
      orderBy: [
        {
          semestre: 'asc',
        },
        {
          nombre: 'asc',
        },
      ],
    });
  }

  async obtenerPorId(
    id: number,
  ) {
    const materia =
      await this.prisma.materia.findUnique({
        where: {
          id,
        },
      });

    if (!materia) {
      throw new NotFoundException(
        'La materia no existe',
      );
    }

    return materia;
  }

  async crear(
    datos: CrearMateriaDto,
  ) {
    const nombreNormalizado =
      datos.nombre.trim();

    const codigoNormalizado =
      datos.codigo
        .trim()
        .toUpperCase();

    const materiaExistente =
      await this.prisma.materia.findUnique({
        where: {
          codigo:
            codigoNormalizado,
        },
      });

    if (materiaExistente) {
      throw new ConflictException(
        'Ya existe una materia con ese código',
      );
    }

    const materia =
      await this.prisma.materia.create({
        data: {
          nombre:
            nombreNormalizado,

          codigo:
            codigoNormalizado,

          semestre:
            datos.semestre,

          descripcion:
            datos.descripcion
              ?.trim() ||
            null,
        },
      });

    return {
      mensaje:
        'Materia creada correctamente',

      materia,
    };
  }

  async actualizar(
    id: number,
    datos: ActualizarMateriaDto,
  ) {
    await this.obtenerPorId(id);

    const codigoNormalizado =
      datos.codigo
        ?.trim()
        .toUpperCase();

    if (codigoNormalizado) {
      const materiaConMismoCodigo =
        await this.prisma.materia.findFirst({
          where: {
            codigo:
              codigoNormalizado,

            id: {
              not: id,
            },
          },
        });

      if (materiaConMismoCodigo) {
        throw new ConflictException(
          'Ya existe otra materia con ese código',
        );
      }
    }

    const materia =
      await this.prisma.materia.update({
        where: {
          id,
        },

        data: {
          ...(datos.nombre !==
          undefined
            ? {
                nombre:
                  datos.nombre.trim(),
              }
            : {}),

          ...(codigoNormalizado !==
          undefined
            ? {
                codigo:
                  codigoNormalizado,
              }
            : {}),

          ...(datos.semestre !==
          undefined
            ? {
                semestre:
                  datos.semestre,
              }
            : {}),

          ...(datos.descripcion !==
          undefined
            ? {
                descripcion:
                  datos.descripcion.trim() ||
                  null,
              }
            : {}),
        },
      });

    return {
      mensaje:
        'Materia actualizada correctamente',

      materia,
    };
  }

  async cambiarEstado(
    id: number,
    estado: EstadoMateria,
  ) {
    const materiaActual =
      await this.obtenerPorId(id);

    if (
      materiaActual.estado ===
      estado
    ) {
      return {
        mensaje:
          estado ===
          EstadoMateria.ACTIVA
            ? 'La materia ya se encuentra activa'
            : 'La materia ya se encuentra inactiva',

        materia:
          materiaActual,
      };
    }

    const materia =
      await this.prisma.materia.update({
        where: {
          id,
        },

        data: {
          estado,
        },
      });

    return {
      mensaje:
        estado ===
        EstadoMateria.ACTIVA
          ? 'Materia reactivada correctamente'
          : 'Materia desactivada correctamente',

      materia,
    };
  }
}