import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccionHistorialForo,
  EstadoEquipoForo,
  EstadoInscripcion,
  ModalidadParticipacionForo,
  OrigenGrupoForo,
  Rol,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { AgregarIntegranteEquipoDto } from './dto/agregar-integrante-equipo.dto';

import { CambiarEstadoEquipoDto } from './dto/cambiar-estado-equipo.dto';

import { CambiarRepresentanteEquipoDto } from './dto/cambiar-representante-equipo.dto';

import { CrearEquipoAfinidadDto } from './dto/crear-equipo-afinidad.dto';

import { ForoReglasService } from '../foro/foro-reglas.service';

import type { UsuarioAutenticado } from '../foro/interfaces/usuario-autenticado.interface';

@Injectable()
export class EquiposAfinidadService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly reglas: ForoReglasService,
  ) {}

  private async validarForoAfinidad(cursoId: number, foroId: number) {
    const foro = await this.reglas.obtenerForo(cursoId, foroId);

    if (
      foro.modalidadParticipacion !== ModalidadParticipacionForo.GRUPAL ||
      foro.origenGrupo !== OrigenGrupoForo.AFINIDAD
    ) {
      throw new BadRequestException(
        'Este foro no utiliza equipos por afinidad',
      );
    }

    return foro;
  }

  private async validarEstudiantesCurso(
    cursoId: number,
    estudiantesIds: number[],
  ) {
    const unicos = [...new Set(estudiantesIds)];

    const total = await this.prisma.inscripcionCurso.count({
      where: {
        cursoId,
        estudianteId: {
          in: unicos,
        },
        estado: EstadoInscripcion.ACTIVA,
        estudiante: {
          rol: Rol.ESTUDIANTE,
          estaActivo: true,
        },
      },
    });

    if (total !== unicos.length) {
      throw new BadRequestException(
        'Uno o más integrantes no pertenecen al curso',
      );
    }

    return unicos;
  }

  private async validarSinOtroEquipo(
    foroId: number,
    estudiantesIds: number[],
    excluirEquipoId?: number,
  ) {
    const existentes = await this.prisma.integranteEquipoForo.findMany({
      where: {
        estudianteId: {
          in: estudiantesIds,
        },
        estaActivo: true,
        equipo: {
          temaId: foroId,
          estaActivo: true,
          ...(excluirEquipoId
            ? {
                id: {
                  not: excluirEquipoId,
                },
              }
            : {}),
        },
      },

      select: {
        estudianteId: true,

        estudiante: {
          select: {
            nombres: true,
            apellidoPaterno: true,
          },
        },
      },
    });

    if (existentes.length > 0) {
      const nombres = existentes
        .map(
          (item) =>
            `${item.estudiante.nombres} ${item.estudiante.apellidoPaterno}`,
        )
        .join(', ');

      throw new BadRequestException(
        `Uno o más estudiantes ya pertenecen a otro equipo de este foro: ${nombres}`,
      );
    }
  }

  async listarEstudiantesDisponibles(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    await this.reglas.validarInscripcion(usuario, cursoId);

    const foro = await this.validarForoAfinidad(cursoId, foroId);

    const equipoActual = await this.prisma.equipoAfinidadForo.findFirst({
      where: {
        temaId: foro.id,
        cursoId,
        estaActivo: true,
        integrantes: {
          some: {
            estudianteId: usuario.id,
            estaActivo: true,
          },
        },
      },

      select: {
        id: true,
        nombre: true,
      },
    });

    if (equipoActual) {
      return {
        yaTieneEquipo: true,

        equipo: equipoActual,

        minimoIntegrantes: foro.cantidadMinimaIntegrantes ?? 2,

        maximoIntegrantes: foro.cantidadMaximaIntegrantes ?? 100,

        estudiantes: [],
      };
    }

    const ocupados = await this.prisma.integranteEquipoForo.findMany({
      where: {
        estaActivo: true,

        equipo: {
          temaId: foro.id,
          cursoId,
          estaActivo: true,
        },
      },

      select: {
        estudianteId: true,
      },
    });

    const ocupadosIds = [...new Set(ocupados.map((item) => item.estudianteId))];

    const estudiantes = await this.prisma.inscripcionCurso.findMany({
      where: {
        cursoId,

        estado: EstadoInscripcion.ACTIVA,

        estudianteId: {
          notIn: [usuario.id, ...ocupadosIds],
        },

        estudiante: {
          rol: Rol.ESTUDIANTE,
          estaActivo: true,
        },
      },

      orderBy: [
        {
          estudiante: {
            apellidoPaterno: 'asc',
          },
        },
        {
          estudiante: {
            nombres: 'asc',
          },
        },
      ],

      select: {
        estudiante: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            correo: true,
            fotoPerfilUrl: true,
          },
        },
      },
    });

    return {
      yaTieneEquipo: false,

      equipo: null,

      minimoIntegrantes: foro.cantidadMinimaIntegrantes ?? 2,

      maximoIntegrantes: foro.cantidadMaximaIntegrantes ?? 100,

      estudiantes: estudiantes.map((item) => item.estudiante),
    };
  }

  async crearEquipo(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: CrearEquipoAfinidadDto,
  ) {
    await this.reglas.validarInscripcion(usuario, cursoId);

    const foro = await this.reglas.obtenerForo(cursoId, foroId);

    this.reglas.validarForoDisponible(foro);

    if (
      foro.modalidadParticipacion !== ModalidadParticipacionForo.GRUPAL ||
      foro.origenGrupo !== OrigenGrupoForo.AFINIDAD
    ) {
      throw new BadRequestException(
        'Este foro no utiliza equipos por afinidad',
      );
    }

    const integrantesIds = await this.validarEstudiantesCurso(cursoId, [
      usuario.id,
      ...datos.integrantesIds,
    ]);

    const minimo = foro.cantidadMinimaIntegrantes ?? 2;

    const maximo = foro.cantidadMaximaIntegrantes ?? 100;

    if (integrantesIds.length < minimo || integrantesIds.length > maximo) {
      const regla =
        minimo === maximo
          ? `exactamente ${minimo}`
          : `entre ${minimo} y ${maximo}`;

      throw new BadRequestException(
        `El equipo debe tener ${regla} integrantes`,
      );
    }

    await this.validarSinOtroEquipo(foro.id, integrantesIds);

    /*
     * Regla IusAcademy:
     * en grupos por afinidad, quien crea el equipo
     * se convierte obligatoriamente en su representante.
     *
     * Se conserva representanteId en el DTO por compatibilidad
     * temporal con el frontend, pero no se permite señalar
     * a otra persona como representante durante la creación.
     */
    if (
      datos.representanteId !== undefined &&
      datos.representanteId !== usuario.id
    ) {
      throw new BadRequestException(
        'El creador del grupo por afinidad debe ser su representante',
      );
    }

    const representanteId = usuario.id;

    /*
     * Los equipos por afinidad son decisión de los estudiantes.
     * No requieren aprobación docente.
     */
    const estado = EstadoEquipoForo.APROBADO;

    return this.prisma.$transaction(async (transaccion) => {
      const equiposExistentes = await transaccion.equipoAfinidadForo.findMany({
        where: {
          temaId: foro.id,
          cursoId,
          estaActivo: true,
        },

        select: {
          nombre: true,
        },
      });

      const numerosUsados = new Set(
        equiposExistentes
          .map((item) => {
            const coincidencia = /^Grupo\s+(\d+)$/i.exec(item.nombre.trim());

            return coincidencia ? Number(coincidencia[1]) : null;
          })
          .filter(
            (numero): numero is number =>
              Number.isInteger(numero) && (numero ?? 0) > 0,
          ),
      );

      let numeroGrupo = 1;

      while (numerosUsados.has(numeroGrupo)) {
        numeroGrupo += 1;
      }

      const nombreEquipo = `Grupo ${numeroGrupo}`;

      const equipo = await transaccion.equipoAfinidadForo.create({
        data: {
          temaId: foro.id,
          cursoId,
          creadorId: usuario.id,
          nombre: nombreEquipo,
          descripcion: datos.descripcion?.trim() || null,
          estado,
          aprobadoEn: new Date(),
          integrantes: {
            create: integrantesIds.map((estudianteId) => ({
              estudianteId,
              esRepresentante: estudianteId === representanteId,
            })),
          },
        },

        include: {
          integrantes: true,
        },
      });

      await transaccion.historialForoCurso.create({
        data: {
          temaId: foro.id,
          equipoId: equipo.id,
          actorId: usuario.id,
          accion: AccionHistorialForo.EQUIPO_CREADO,
          detalle: {
            integrantesIds,
            representanteId,
            estado,
          },
        },
      });

      return {
        mensaje: 'Equipo por afinidad creado correctamente',
        equipo,
      };
    });
  }

  private async obtenerEquipoGestionable(
    usuario: UsuarioAutenticado,
    cursoId: number,
    equipoId: number,
  ) {
    const equipo = await this.prisma.equipoAfinidadForo.findFirst({
      where: {
        id: equipoId,
        cursoId,
        estaActivo: true,
      },

      include: {
        tema: true,
        integrantes: {
          where: {
            estaActivo: true,
          },
        },
      },
    });

    if (!equipo) {
      throw new NotFoundException('El equipo no existe');
    }

    const esDocente =
      usuario.rol === Rol.DOCENTE &&
      (await this.prisma.curso.count({
        where: {
          id: cursoId,
          docenteId: usuario.id,
        },
      })) > 0;

    const esCreador = equipo.creadorId === usuario.id;

    if (!esDocente && !esCreador) {
      throw new ForbiddenException('No puedes administrar este equipo');
    }

    if (
      equipo.estado === EstadoEquipoForo.BLOQUEADO ||
      equipo.tema.estaCerrado
    ) {
      throw new BadRequestException('El equipo ya está bloqueado');
    }

    return {
      equipo,
      esDocente,
    };
  }

  async agregarIntegrante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    equipoId: number,
    datos: AgregarIntegranteEquipoDto,
  ) {
    const { equipo } = await this.obtenerEquipoGestionable(
      usuario,
      cursoId,
      equipoId,
    );

    await this.validarEstudiantesCurso(cursoId, [datos.estudianteId]);

    await this.validarSinOtroEquipo(
      equipo.temaId,
      [datos.estudianteId],
      equipo.id,
    );

    const activos = equipo.integrantes.filter(
      (integrante) => integrante.estaActivo,
    );

    const maximo = equipo.tema.cantidadMaximaIntegrantes ?? 100;

    if (activos.length >= maximo) {
      throw new BadRequestException(
        'El equipo alcanzó el máximo de integrantes',
      );
    }

    await this.prisma.$transaction(async (transaccion) => {
      await transaccion.integranteEquipoForo.upsert({
        where: {
          equipoId_estudianteId: {
            equipoId: equipo.id,
            estudianteId: datos.estudianteId,
          },
        },

        create: {
          equipoId: equipo.id,
          estudianteId: datos.estudianteId,
          esRepresentante: datos.esRepresentante ?? false,
        },

        update: {
          estaActivo: true,
          retiradoEn: null,
          agregadoEn: new Date(),
          esRepresentante: datos.esRepresentante ?? false,
        },
      });

      if (datos.esRepresentante) {
        await transaccion.integranteEquipoForo.updateMany({
          where: {
            equipoId: equipo.id,
            estudianteId: {
              not: datos.estudianteId,
            },
          },

          data: {
            esRepresentante: false,
          },
        });
      }

      await transaccion.historialForoCurso.create({
        data: {
          temaId: equipo.temaId,
          equipoId: equipo.id,
          actorId: usuario.id,
          accion: AccionHistorialForo.INTEGRANTE_AGREGADO,
          detalle: {
            estudianteId: datos.estudianteId,
          },
        },
      });
    });

    return {
      mensaje: 'Integrante agregado correctamente',
    };
  }

  async retirarIntegrante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    equipoId: number,
    estudianteId: number,
  ) {
    const { equipo } = await this.obtenerEquipoGestionable(
      usuario,
      cursoId,
      equipoId,
    );

    const integrante = equipo.integrantes.find(
      (item) => item.estudianteId === estudianteId && item.estaActivo,
    );

    if (!integrante) {
      throw new NotFoundException('El estudiante no pertenece al equipo');
    }

    const minimo = equipo.tema.cantidadMinimaIntegrantes ?? 2;

    if (
      equipo.integrantes.filter((item) => item.estaActivo).length - 1 <
      minimo
    ) {
      throw new BadRequestException(
        `El equipo debe conservar al menos ${minimo} integrantes`,
      );
    }

    await this.prisma.$transaction(async (transaccion) => {
      await transaccion.integranteEquipoForo.update({
        where: {
          id: integrante.id,
        },

        data: {
          estaActivo: false,
          retiradoEn: new Date(),
          esRepresentante: false,
        },
      });

      await transaccion.historialForoCurso.create({
        data: {
          temaId: equipo.temaId,
          equipoId: equipo.id,
          actorId: usuario.id,
          accion: AccionHistorialForo.INTEGRANTE_RETIRADO,
          detalle: {
            estudianteId,
          },
        },
      });
    });

    return {
      mensaje: 'Integrante retirado correctamente',
    };
  }

  async cambiarRepresentante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    equipoId: number,
    datos: CambiarRepresentanteEquipoDto,
  ) {
    const { equipo } = await this.obtenerEquipoGestionable(
      usuario,
      cursoId,
      equipoId,
    );

    const integrante = equipo.integrantes.find(
      (item) => item.estudianteId === datos.estudianteId && item.estaActivo,
    );

    if (!integrante) {
      throw new BadRequestException(
        'El representante debe ser un integrante activo',
      );
    }

    await this.prisma.$transaction(async (transaccion) => {
      await transaccion.integranteEquipoForo.updateMany({
        where: {
          equipoId: equipo.id,
        },

        data: {
          esRepresentante: false,
        },
      });

      await transaccion.integranteEquipoForo.update({
        where: {
          id: integrante.id,
        },

        data: {
          esRepresentante: true,
        },
      });

      await transaccion.historialForoCurso.create({
        data: {
          temaId: equipo.temaId,
          equipoId: equipo.id,
          actorId: usuario.id,
          accion: AccionHistorialForo.REPRESENTANTE_ASIGNADO,
          detalle: {
            estudianteId: datos.estudianteId,
          },
        },
      });
    });

    return {
      mensaje: 'Representante actualizado correctamente',
    };
  }

  async cambiarEstado(
    usuario: UsuarioAutenticado,
    cursoId: number,
    equipoId: number,
    datos: CambiarEstadoEquipoDto,
  ) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede aprobar o rechazar equipos',
      );
    }

    const curso = await this.prisma.curso.findFirst({
      where: {
        id: cursoId,
        docenteId: usuario.id,
      },

      select: {
        id: true,
      },
    });

    if (!curso) {
      throw new ForbiddenException(
        'El curso no pertenece al docente autenticado',
      );
    }

    const estadosPermitidos: EstadoEquipoForo[] = [
      EstadoEquipoForo.APROBADO,
      EstadoEquipoForo.RECHAZADO,
    ];

    if (!estadosPermitidos.includes(datos.estado)) {
      throw new BadRequestException('Solo puedes aprobar o rechazar un equipo');
    }

    const equipo = await this.prisma.equipoAfinidadForo.findFirst({
      where: {
        id: equipoId,
        cursoId,
        estaActivo: true,
      },
    });

    if (!equipo) {
      throw new NotFoundException('El equipo no existe');
    }

    const accion =
      datos.estado === EstadoEquipoForo.APROBADO
        ? AccionHistorialForo.EQUIPO_APROBADO
        : AccionHistorialForo.EQUIPO_RECHAZADO;

    const actualizado = await this.prisma.$transaction(async (transaccion) => {
      const registro = await transaccion.equipoAfinidadForo.update({
        where: {
          id: equipo.id,
        },

        data: {
          estado: datos.estado,
          aprobadoEn:
            datos.estado === EstadoEquipoForo.APROBADO ? new Date() : null,
        },
      });

      await transaccion.historialForoCurso.create({
        data: {
          temaId: equipo.temaId,
          equipoId: equipo.id,
          actorId: usuario.id,
          accion,
        },
      });

      return registro;
    });

    return {
      mensaje:
        datos.estado === EstadoEquipoForo.APROBADO
          ? 'Equipo aprobado correctamente'
          : 'Equipo rechazado correctamente',
      equipo: actualizado,
    };
  }

  async listarEquipos(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    if (usuario.rol === Rol.ESTUDIANTE) {
      await this.reglas.validarInscripcion(usuario, cursoId);
    }

    return this.prisma.equipoAfinidadForo.findMany({
      where: {
        temaId: foroId,
        cursoId,
        estaActivo: true,
        ...(usuario.rol === Rol.ESTUDIANTE
          ? {
              integrantes: {
                some: {
                  estudianteId: usuario.id,
                  estaActivo: true,
                },
              },
            }
          : {}),
      },

      orderBy: {
        creadoEn: 'asc',
      },

      include: {
        creador: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
          },
        },
        integrantes: {
          where: {
            estaActivo: true,
          },
          include: {
            estudiante: {
              select: {
                id: true,
                nombres: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                fotoPerfilUrl: true,
              },
            },
          },
        },
      },
    });
  }
}
