import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoCurso,
  EstadoMateria,
  Rol,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ActualizarCursoDto,
} from './dto/actualizar-curso.dto';

import {
  CrearCursoDto,
} from './dto/crear-curso.dto';

@Injectable()
export class CursosService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private readonly seleccionCurso = {
    id: true,
    materiaId: true,
    docenteId: true,
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
        estado: true,
      },
    },

    docente: {
      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        rol: true,
        estaActivo: true,
        cuentaActivada: true,
        fotoPerfilUrl: true,
      },
    },
  };

  async obtenerTodos() {
    return this.prisma.curso.findMany({
      select:
        this.seleccionCurso,

      orderBy: [
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
  }

  async obtenerPorId(
    id: number,
  ) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id,
        },

        select:
          this.seleccionCurso,
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe',
      );
    }

    return curso;
  }

  private async validarMateria(
    materiaId: number,
  ) {
    const materia =
      await this.prisma.materia.findUnique({
        where: {
          id:
            materiaId,
        },

        select: {
          id: true,
          nombre: true,
          codigo: true,
          semestre: true,
          estado: true,
        },
      });

    if (!materia) {
      throw new NotFoundException(
        'La materia seleccionada no existe',
      );
    }

    if (
      materia.estado !==
      EstadoMateria.ACTIVA
    ) {
      throw new BadRequestException(
        'No se puede utilizar una materia inactiva',
      );
    }

    return materia;
  }

  private async validarDocente(
    docenteId: number,
  ) {
    const docente =
      await this.prisma.usuario.findUnique({
        where: {
          id:
            docenteId,
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
          fotoPerfilUrl: true,
        },
      });

    if (!docente) {
      throw new NotFoundException(
        'El docente seleccionado no existe',
      );
    }

    if (
      docente.rol !==
      Rol.DOCENTE
    ) {
      throw new BadRequestException(
        'El usuario seleccionado no tiene el rol DOCENTE',
      );
    }

    if (!docente.estaActivo) {
      throw new BadRequestException(
        'El docente seleccionado se encuentra desactivado',
      );
    }

    if (!docente.cuentaActivada) {
      throw new BadRequestException(
        'La cuenta del docente todavía no fue activada',
      );
    }

    return docente;
  }

  async crear(
    datos: CrearCursoDto,
  ) {
    const materia =
      await this.validarMateria(
        datos.materiaId,
      );

    await this.validarDocente(
      datos.docenteId,
    );

    if (
      datos.semestre !==
      materia.semestre
    ) {
      throw new BadRequestException(
        `El semestre debe coincidir con el de la materia: ${materia.semestre}`,
      );
    }

    const gestion =
      datos.gestion.trim();

    const paralelo =
      datos.paralelo
        .trim()
        .toUpperCase();

    const duplicado =
      await this.prisma.curso.findFirst({
        where: {
          materiaId:
            datos.materiaId,

          gestion,

          paralelo,
        },

        select: {
          id: true,
        },
      });

    if (duplicado) {
      throw new ConflictException(
        'Ya existe un curso de esta materia para la misma gestión y paralelo',
      );
    }

    const curso =
      await this.prisma.curso.create({
        data: {
          materiaId:
            datos.materiaId,

          docenteId:
            datos.docenteId,

          gestion,

          paralelo,

          semestre:
            datos.semestre,

          cupoMaximo:
            datos.cupoMaximo ??
            null,

          estado:
            EstadoCurso.ACTIVO,

          finalizadoEn:
            null,
        },

        select:
          this.seleccionCurso,
      });

    return {
      mensaje:
        'Curso creado correctamente',

      curso,
    };
  }

  async actualizar(
    id: number,
    datos: ActualizarCursoDto,
  ) {
    const cursoActual =
      await this.prisma.curso.findUnique({
        where: {
          id,
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
        },
      });

    if (!cursoActual) {
      throw new NotFoundException(
        'El curso no existe',
      );
    }

    if (
      cursoActual.estado ===
      EstadoCurso.FINALIZADO
    ) {
      throw new BadRequestException(
        'Los cursos finalizados se conservan únicamente como historial y no pueden editarse',
      );
    }

    const materiaId =
      datos.materiaId ??
      cursoActual.materiaId;

    const docenteId =
      datos.docenteId ??
      cursoActual.docenteId;

    const gestion =
      datos.gestion
        ?.trim() ??
      cursoActual.gestion;

    const paralelo =
      datos.paralelo
        ?.trim()
        .toUpperCase() ??
      cursoActual.paralelo;

    const semestre =
      datos.semestre ??
      cursoActual.semestre;

    const materia =
      await this.validarMateria(
        materiaId,
      );

    await this.validarDocente(
      docenteId,
    );

    if (
      semestre !==
      materia.semestre
    ) {
      throw new BadRequestException(
        `El semestre debe coincidir con el de la materia: ${materia.semestre}`,
      );
    }

    const duplicado =
      await this.prisma.curso.findFirst({
        where: {
          materiaId,
          gestion,
          paralelo,

          id: {
            not:
              id,
          },
        },

        select: {
          id: true,
        },
      });

    if (duplicado) {
      throw new ConflictException(
        'Ya existe otro curso de esta materia para la misma gestión y paralelo',
      );
    }

    const curso =
      await this.prisma.curso.update({
        where: {
          id,
        },

        data: {
          materiaId,
          docenteId,
          gestion,
          paralelo,
          semestre,

          ...(datos.cupoMaximo !==
          undefined
            ? {
                cupoMaximo:
                  datos.cupoMaximo,
              }
            : {}),
        },

        select:
          this.seleccionCurso,
      });

    return {
      mensaje:
        'Curso actualizado correctamente',

      curso,
    };
  }

  async cambiarEstado(
    id: number,
    estado: EstadoCurso,
  ) {
    const cursoActual =
      await this.prisma.curso.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          estado: true,
          finalizadoEn: true,
        },
      });

    if (!cursoActual) {
      throw new NotFoundException(
        'El curso no existe',
      );
    }

    if (
      cursoActual.estado ===
      EstadoCurso.FINALIZADO
    ) {
      throw new BadRequestException(
        'Un curso finalizado es histórico y su estado no puede modificarse',
      );
    }

    if (
      cursoActual.estado ===
      estado
    ) {
      return {
        mensaje:
          `El curso ya se encuentra en estado ${estado}`,

        curso:
          await this.obtenerPorId(
            id,
          ),
      };
    }

    const curso =
      await this.prisma.curso.update({
        where: {
          id,
        },

        data: {
          estado,

          finalizadoEn:
            estado ===
            EstadoCurso.FINALIZADO
              ? new Date()
              : null,
        },

        select:
          this.seleccionCurso,
      });

    let mensaje =
      'Estado del curso actualizado correctamente';

    if (
      estado ===
      EstadoCurso.ACTIVO
    ) {
      mensaje =
        'Curso reactivado correctamente';
    }

    if (
      estado ===
      EstadoCurso.INACTIVO
    ) {
      mensaje =
        'Curso desactivado correctamente';
    }

    if (
      estado ===
      EstadoCurso.FINALIZADO
    ) {
      mensaje =
        'Curso finalizado y almacenado como historial correctamente';
    }

    return {
      mensaje,
      curso,
    };
  }
}