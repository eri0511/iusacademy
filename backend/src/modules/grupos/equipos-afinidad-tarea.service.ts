import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoEquipoAfinidadTarea,
  EstadoInscripcion,
  EstadoTarea,
  ModalidadTarea,
  OrigenGrupoTarea,
  Rol,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { AgregarIntegranteEquipoDto } from './dto/agregar-integrante-equipo.dto';

import { CambiarEstadoEquipoTareaDto } from './dto/cambiar-estado-equipo-tarea.dto';

import { CambiarRepresentanteEquipoDto } from './dto/cambiar-representante-equipo.dto';

import { CrearEquipoAfinidadTareaDto } from './dto/crear-equipo-afinidad-tarea.dto';

type UsuarioAutenticado = {
  id: number;

  correo: string;

  rol: Rol;
};

type ConfiguracionGrupoTarea = {
  cantidadMinimaIntegrantes?: unknown;

  cantidadMaximaIntegrantes?: unknown;
};

@Injectable()
export class EquiposAfinidadTareaService {
  constructor(private readonly prisma: PrismaService) {}

  /*
   * ============================================================
   * VALIDACIONES GENERALES
   * ============================================================
   */

  private async obtenerTareaAfinidad(cursoId: number, tareaId: number) {
    const tarea = await this.prisma.tareaCurso.findFirst({
      where: {
        id: tareaId,

        cursoId,

        estaActiva: true,
      },

      select: {
        id: true,

        cursoId: true,

        titulo: true,

        estado: true,

        estaCerrada: true,

        modalidad: true,

        origenGrupo: true,

        configuracionTipo: true,

        fechaApertura: true,

        fechaLimite: true,

        fechaCierre: true,

        permitirRetrasos: true,

        fechaMaximaRetraso: true,
      },
    });

    if (!tarea) {
      throw new NotFoundException('La tarea no existe');
    }

    if (
      tarea.modalidad !== ModalidadTarea.GRUPAL ||
      tarea.origenGrupo !== OrigenGrupoTarea.AFINIDAD
    ) {
      throw new BadRequestException(
        'Esta tarea no utiliza grupos por afinidad',
      );
    }

    return tarea;
  }

  private obtenerLimites(configuracionTipo: unknown) {
    const configuracion =
      configuracionTipo &&
      typeof configuracionTipo === 'object' &&
      !Array.isArray(configuracionTipo)
        ? (configuracionTipo as ConfiguracionGrupoTarea)
        : {};

    const minimoValor = Number(configuracion.cantidadMinimaIntegrantes ?? 2);

    const maximoValor = Number(configuracion.cantidadMaximaIntegrantes ?? 100);

    const minimo =
      Number.isFinite(minimoValor) && minimoValor > 0
        ? Math.floor(minimoValor)
        : 2;

    const maximoBase =
      Number.isFinite(maximoValor) && maximoValor > 0
        ? Math.floor(maximoValor)
        : 100;

    const maximo = Math.max(minimo, maximoBase);

    return {
      minimo,
      maximo,
    };
  }

  private async validarAccesoCurso(
    usuario: UsuarioAutenticado,
    cursoId: number,
  ) {
    if (usuario.rol === Rol.DOCENTE) {
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

      return;
    }

    if (usuario.rol === Rol.ESTUDIANTE) {
      const inscripcion = await this.prisma.inscripcionCurso.findFirst({
        where: {
          cursoId,

          estudianteId: usuario.id,

          estado: EstadoInscripcion.ACTIVA,
        },

        select: {
          id: true,
        },
      });

      if (!inscripcion) {
        throw new ForbiddenException('No perteneces a este curso');
      }

      return;
    }

    throw new ForbiddenException(
      'No tienes permisos para administrar equipos de esta tarea',
    );
  }

  private validarTareaEditablePorEstudiante(tarea: {
    estado: EstadoTarea;

    estaCerrada: boolean;

    fechaCierre: Date;

    permitirRetrasos: boolean;

    fechaMaximaRetraso: Date | null;
  }) {
    if (
      tarea.estado === EstadoTarea.BORRADOR ||
      tarea.estado === EstadoTarea.ANULADA
    ) {
      throw new BadRequestException('La tarea no está disponible');
    }

    const ahora = new Date();

    const cierre =
      tarea.permitirRetrasos && tarea.fechaMaximaRetraso
        ? tarea.fechaMaximaRetraso
        : tarea.fechaCierre;

    if (
      tarea.estaCerrada ||
      tarea.estado === EstadoTarea.CERRADA ||
      ahora >= cierre
    ) {
      throw new BadRequestException('La tarea ya está cerrada');
    }
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
    tareaId: number,
    estudiantesIds: number[],
    excluirEquipoId?: number,
  ) {
    const existentes = await this.prisma.integranteEquipoTarea.findMany({
      where: {
        estudianteId: {
          in: estudiantesIds,
        },

        estaActivo: true,

        equipo: {
          tareaId,

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
        `Uno o más estudiantes ya pertenecen a otro equipo de esta tarea: ${nombres}`,
      );
    }
  }

  private async obtenerEquipoGestionable(
    usuario: UsuarioAutenticado,
    cursoId: number,
    equipoId: number,
  ) {
    await this.validarAccesoCurso(usuario, cursoId);

    const equipo = await this.prisma.equipoAfinidadTarea.findFirst({
      where: {
        id: equipoId,

        cursoId,

        estaActivo: true,
      },

      include: {
        tarea: {
          select: {
            id: true,

            cursoId: true,

            estado: true,

            estaCerrada: true,

            configuracionTipo: true,

            fechaCierre: true,

            permitirRetrasos: true,

            fechaMaximaRetraso: true,
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

                correo: true,
              },
            },
          },
        },
      },
    });

    if (!equipo) {
      throw new NotFoundException('El equipo no existe');
    }

    const esDocente = usuario.rol === Rol.DOCENTE;

    const esCreador = equipo.creadorId === usuario.id;

    if (!esDocente && !esCreador) {
      throw new ForbiddenException('No puedes administrar este equipo');
    }

    if (!esDocente) {
      this.validarTareaEditablePorEstudiante(equipo.tarea);
    }

    if (
      equipo.estado === EstadoEquipoAfinidadTarea.BLOQUEADO ||
      equipo.estado === EstadoEquipoAfinidadTarea.INACTIVO
    ) {
      throw new BadRequestException('El equipo está bloqueado o inactivo');
    }

    return {
      equipo,
      esDocente,
    };
  }

  /*
   * ============================================================
   * CONSULTAS
   * ============================================================
   */

  async listarEstudiantesDisponibles(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    await this.validarAccesoCurso(usuario, cursoId);

    const tarea = await this.obtenerTareaAfinidad(cursoId, tareaId);

    if (usuario.rol === Rol.ESTUDIANTE) {
      this.validarTareaEditablePorEstudiante(tarea);
    }

    const { minimo, maximo } = this.obtenerLimites(tarea.configuracionTipo);

    const equipoActual =
      usuario.rol === Rol.ESTUDIANTE
        ? await this.prisma.equipoAfinidadTarea.findFirst({
            where: {
              tareaId: tarea.id,

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
          })
        : null;

    if (equipoActual) {
      return {
        yaTieneEquipo: true,

        equipo: equipoActual,

        minimoIntegrantes: minimo,

        maximoIntegrantes: maximo,

        estudiantes: [],
      };
    }

    const ocupados = await this.prisma.integranteEquipoTarea.findMany({
      where: {
        estaActivo: true,

        equipo: {
          tareaId: tarea.id,

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
          notIn:
            usuario.rol === Rol.ESTUDIANTE
              ? [usuario.id, ...ocupadosIds]
              : ocupadosIds,
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

      minimoIntegrantes: minimo,

      maximoIntegrantes: maximo,

      estudiantes: estudiantes.map((item) => item.estudiante),
    };
  }

  async listarEquipos(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    await this.validarAccesoCurso(usuario, cursoId);

    await this.obtenerTareaAfinidad(cursoId, tareaId);

    return this.prisma.equipoAfinidadTarea.findMany({
      where: {
        tareaId,

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

          orderBy: [
            {
              esRepresentante: 'desc',
            },
            {
              estudiante: {
                apellidoPaterno: 'asc',
              },
            },
          ],

          include: {
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
        },
      },
    });
  }

  async obtenerMiEquipo(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    if (usuario.rol !== Rol.ESTUDIANTE) {
      throw new ForbiddenException('Esta consulta pertenece al estudiante');
    }

    await this.validarAccesoCurso(usuario, cursoId);

    const tarea = await this.obtenerTareaAfinidad(cursoId, tareaId);

    const { minimo, maximo } = this.obtenerLimites(tarea.configuracionTipo);

    const equipo = await this.prisma.equipoAfinidadTarea.findFirst({
      where: {
        tareaId,

        cursoId,

        estaActivo: true,

        integrantes: {
          some: {
            estudianteId: usuario.id,

            estaActivo: true,
          },
        },
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

          orderBy: [
            {
              esRepresentante: 'desc',
            },
            {
              estudiante: {
                apellidoPaterno: 'asc',
              },
            },
          ],

          include: {
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
        },
      },
    });

    return {
      equipo,

      minimoIntegrantes: minimo,

      maximoIntegrantes: maximo,
    };
  }

  /*
   * ============================================================
   * CREACIÓN
   * ============================================================
   */

  async crearEquipo(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    datos: CrearEquipoAfinidadTareaDto,
  ) {
    if (usuario.rol !== Rol.ESTUDIANTE) {
      throw new ForbiddenException(
        'El equipo por afinidad debe ser creado por un estudiante',
      );
    }

    await this.validarAccesoCurso(usuario, cursoId);

    const tarea = await this.obtenerTareaAfinidad(cursoId, tareaId);

    this.validarTareaEditablePorEstudiante(tarea);

    const integrantesIds = await this.validarEstudiantesCurso(cursoId, [
      usuario.id,
      ...datos.integrantesIds,
    ]);

    const { minimo, maximo } = this.obtenerLimites(tarea.configuracionTipo);

    if (integrantesIds.length < minimo || integrantesIds.length > maximo) {
      const regla =
        minimo === maximo
          ? `exactamente ${minimo}`
          : `entre ${minimo} y ${maximo}`;

      throw new BadRequestException(
        `El equipo debe tener ${regla} integrantes`,
      );
    }

    await this.validarSinOtroEquipo(tarea.id, integrantesIds);

    if (
      datos.representanteId !== undefined &&
      datos.representanteId !== usuario.id
    ) {
      throw new BadRequestException(
        'El creador del equipo por afinidad debe ser su representante inicial',
      );
    }

    return this.prisma.$transaction(async (transaccion) => {
      const equiposExistentes = await transaccion.equipoAfinidadTarea.findMany({
        where: {
          tareaId: tarea.id,

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

      const equipo = await transaccion.equipoAfinidadTarea.create({
        data: {
          tareaId: tarea.id,

          cursoId,

          creadorId: usuario.id,

          nombre: `Grupo ${numeroGrupo}`,

          estado: EstadoEquipoAfinidadTarea.ACTIVO,

          integrantes: {
            create: integrantesIds.map((estudianteId) => ({
              estudianteId,

              esRepresentante: estudianteId === usuario.id,
            })),
          },
        },

        include: {
          integrantes: {
            include: {
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
          },
        },
      });

      return {
        mensaje: 'Equipo por afinidad creado correctamente',

        equipo,
      };
    });
  }

  /*
   * ============================================================
   * ADMINISTRACIÓN DE INTEGRANTES
   * ============================================================
   */

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
      equipo.tarea.id,
      [datos.estudianteId],
      equipo.id,
    );

    const { maximo } = this.obtenerLimites(equipo.tarea.configuracionTipo);

    if (equipo.integrantes.length >= maximo) {
      throw new BadRequestException(
        'El equipo alcanzó el máximo de integrantes',
      );
    }

    await this.prisma.$transaction(async (transaccion) => {
      await transaccion.integranteEquipoTarea.upsert({
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
        await transaccion.integranteEquipoTarea.updateMany({
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
    });

    return {
      mensaje: datos.esRepresentante
        ? 'Integrante agregado y representante actualizado correctamente'
        : 'Integrante agregado correctamente',
    };
  }

  async retirarIntegrante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    equipoId: number,
    estudianteId: number,
  ) {
    const { equipo, esDocente } = await this.obtenerEquipoGestionable(
      usuario,
      cursoId,
      equipoId,
    );

    const integrante = equipo.integrantes.find(
      (item) => item.estudianteId === estudianteId,
    );

    if (!integrante) {
      throw new NotFoundException('El estudiante no pertenece al equipo');
    }

    const { minimo } = this.obtenerLimites(equipo.tarea.configuracionTipo);

    if (equipo.integrantes.length - 1 < minimo) {
      throw new BadRequestException(
        `El equipo debe conservar al menos ${minimo} integrantes`,
      );
    }

    if (integrante.esRepresentante) {
      throw new BadRequestException(
        'Primero debes asignar otro representante antes de retirar al representante actual',
      );
    }

    if (!esDocente && estudianteId === equipo.creadorId) {
      throw new BadRequestException(
        'El creador no puede retirarse directamente del equipo; el docente puede reorganizarlo si es necesario',
      );
    }

    await this.prisma.integranteEquipoTarea.update({
      where: {
        id: integrante.id,
      },

      data: {
        estaActivo: false,

        retiradoEn: new Date(),

        esRepresentante: false,
      },
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
      (item) => item.estudianteId === datos.estudianteId,
    );

    if (!integrante) {
      throw new BadRequestException(
        'El representante debe ser un integrante activo del equipo',
      );
    }

    await this.prisma.$transaction(async (transaccion) => {
      await transaccion.integranteEquipoTarea.updateMany({
        where: {
          equipoId: equipo.id,
        },

        data: {
          esRepresentante: false,
        },
      });

      await transaccion.integranteEquipoTarea.update({
        where: {
          id: integrante.id,
        },

        data: {
          esRepresentante: true,
        },
      });
    });

    return {
      mensaje: 'Representante actualizado correctamente',
    };
  }

  /*
   * ============================================================
   * ESTADO DEL EQUIPO
   * ============================================================
   */

  async cambiarEstado(
    usuario: UsuarioAutenticado,
    cursoId: number,
    equipoId: number,
    datos: CambiarEstadoEquipoTareaDto,
  ) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede cambiar el estado de un equipo',
      );
    }

    await this.validarAccesoCurso(usuario, cursoId);

    const equipo = await this.prisma.equipoAfinidadTarea.findFirst({
      where: {
        id: equipoId,

        cursoId,

        estaActivo: true,
      },

      select: {
        id: true,

        estado: true,
      },
    });

    if (!equipo) {
      throw new NotFoundException('El equipo no existe');
    }

    const actualizado = await this.prisma.equipoAfinidadTarea.update({
      where: {
        id: equipo.id,
      },

      data: {
        estado: datos.estado,

        bloqueadoEn:
          datos.estado === EstadoEquipoAfinidadTarea.BLOQUEADO
            ? new Date()
            : null,

        estaActivo: datos.estado !== EstadoEquipoAfinidadTarea.INACTIVO,
      },
    });

    const mensaje =
      datos.estado === EstadoEquipoAfinidadTarea.BLOQUEADO
        ? 'Equipo bloqueado correctamente'
        : datos.estado === EstadoEquipoAfinidadTarea.INACTIVO
          ? 'Equipo desactivado correctamente'
          : 'Equipo activado correctamente';

    return {
      mensaje,

      equipo: actualizado,
    };
  }
}
