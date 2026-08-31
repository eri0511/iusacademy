import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EstadoActividadCalificable,
  EstadoCalificacion,
  EstadoEntregaTarea,
  EstadoEquipoAfinidadTarea,
  EstadoInscripcion,
  ModalidadTarea,
  OrigenGrupoTarea,
  Rol,
  TipoDescuentoRetraso,
  TipoTarea,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { GuardarEntregaTareaDto } from './dto/guardar-entrega-tarea.dto';

import { RegistrarSesionEdicionDto } from './dto/registrar-sesion-edicion.dto';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

type ResponsableEntregaGrupo = 'SOLO_REPRESENTANTE' | 'CUALQUIER_INTEGRANTE';

type ConfiguracionTipoTarea = {
  responsableEntregaGrupo?: unknown;

  cantidadMinimaIntegrantes?: unknown;

  cantidadMaximaIntegrantes?: unknown;
};

type IntegranteContextoGrupo = {
  estudianteId: number;

  esRepresentante: boolean;

  estudiante: {
    id: number;

    nombres: string;

    apellidoPaterno: string;

    apellidoMaterno: string | null;

    fotoPerfilUrl: string | null;
  };
};

type ContextoGrupoEntrega = {
  tipo: 'PLATAFORMA' | 'AFINIDAD';

  id: number;

  nombre: string;

  responsable: ResponsableEntregaGrupo;

  esRepresentanteActual: boolean;

  representante: IntegranteContextoGrupo['estudiante'] | null;

  integrantes: IntegranteContextoGrupo[];
};

type ContextoEntrega = {
  esGrupal: boolean;

  estudianteId: number | null;

  grupoCursoId: number | null;

  equipoAfinidadTareaId: number | null;

  puedeModificar: boolean;

  integrantesIds: number[];

  grupo: ContextoGrupoEntrega | null;
};

@Injectable()
export class TareasEntregasService {
  constructor(private readonly prisma: PrismaService) {}

  /*
   * ============================================================
   * VALIDACIONES GENERALES
   * ============================================================
   */

  private validarEstudiante(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.ESTUDIANTE) {
      throw new ForbiddenException(
        'Solo los estudiantes pueden realizar entregas',
      );
    }
  }

  private async validarInscripcion(usuarioId: number, cursoId: number) {
    const inscripcion = await this.prisma.inscripcionCurso.findFirst({
      where: {
        cursoId,

        estudianteId: usuarioId,

        estado: EstadoInscripcion.ACTIVA,
      },

      select: {
        id: true,
      },
    });

    if (!inscripcion) {
      throw new ForbiddenException(
        'No tienes una inscripción activa en este curso',
      );
    }
  }

  private async obtenerTarea(cursoId: number, tareaId: number) {
    const tarea = await this.prisma.tareaCurso.findFirst({
      where: {
        id: tareaId,

        cursoId,

        estaActiva: true,

        estado: {
          notIn: ['BORRADOR', 'ANULADA'],
        },
      },

      select: {
        id: true,

        cursoId: true,

        tipo: true,

        modalidad: true,

        origenGrupo: true,

        conjuntoGrupoId: true,

        configuracionTipo: true,

        capacidades: true,

        exigirContenidoEditor: true,

        exigirArchivo: true,

        maximoArchivos: true,

        tamanioMaximoArchivoMb: true,

        extensionesPermitidas: true,

        permitirEditarEntrega: true,

        fechaApertura: true,

        fechaLimite: true,

        fechaCierre: true,

        permitirRetrasos: true,

        fechaMaximaRetraso: true,

        tipoDescuentoRetraso: true,

        valorDescuentoRetraso: true,

        esCalificable: true,

        estado: true,

        estaCerrada: true,

        actividadCalificable: {
          select: {
            id: true,

            estado: true,
          },
        },
      },
    });

    if (!tarea) {
      throw new NotFoundException('La tarea no existe o no está disponible');
    }

    return tarea;
  }

  private obtenerConfiguracion(configuracion: unknown): ConfiguracionTipoTarea {
    if (
      configuracion &&
      typeof configuracion === 'object' &&
      !Array.isArray(configuracion)
    ) {
      return configuracion;
    }

    return {};
  }

  private obtenerResponsable(configuracion: unknown): ResponsableEntregaGrupo {
    const datos = this.obtenerConfiguracion(configuracion);

    if (datos.responsableEntregaGrupo === 'CUALQUIER_INTEGRANTE') {
      return 'CUALQUIER_INTEGRANTE';
    }

    return 'SOLO_REPRESENTANTE';
  }

  private obtenerLimitesAfinidad(configuracion: unknown) {
    const datos = this.obtenerConfiguracion(configuracion);

    const minimoLeido = Number(datos.cantidadMinimaIntegrantes ?? 2);

    const maximoLeido = Number(datos.cantidadMaximaIntegrantes ?? 100);

    const minimo =
      Number.isFinite(minimoLeido) && minimoLeido > 0
        ? Math.floor(minimoLeido)
        : 2;

    const maximoBase =
      Number.isFinite(maximoLeido) && maximoLeido > 0
        ? Math.floor(maximoLeido)
        : 100;

    return {
      minimo,
      maximo: Math.max(minimo, maximoBase),
    };
  }

  /*
   * ============================================================
   * CONTEXTO INDIVIDUAL / GRUPAL
   * ============================================================
   */

  private async resolverContexto(
    usuario: UsuarioAutenticado,
    tarea: Awaited<ReturnType<TareasEntregasService['obtenerTarea']>>,
  ): Promise<ContextoEntrega> {
    if (tarea.modalidad === ModalidadTarea.INDIVIDUAL) {
      return {
        esGrupal: false,

        estudianteId: usuario.id,

        grupoCursoId: null,

        equipoAfinidadTareaId: null,

        puedeModificar: true,

        integrantesIds: [usuario.id],

        grupo: null,
      };
    }

    const responsable = this.obtenerResponsable(tarea.configuracionTipo);

    /*
     * ==========================================================
     * GRUPOS DE PLATAFORMA
     * ==========================================================
     */
    if (tarea.origenGrupo === OrigenGrupoTarea.PLATAFORMA) {
      if (!tarea.conjuntoGrupoId) {
        throw new BadRequestException(
          'La tarea grupal no tiene un conjunto de grupos configurado',
        );
      }

      const integrante = await this.prisma.integranteGrupoCurso.findFirst({
        where: {
          conjuntoId: tarea.conjuntoGrupoId,

          estudianteId: usuario.id,

          estaActivo: true,

          grupo: {
            estaActivo: true,
          },
        },

        select: {
          grupoId: true,

          esRepresentante: true,

          grupo: {
            select: {
              id: true,

              nombre: true,

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

                select: {
                  estudianteId: true,

                  esRepresentante: true,

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
          },
        },
      });

      if (!integrante) {
        throw new ForbiddenException(
          'No perteneces a un grupo válido para esta tarea',
        );
      }

      const integrantesIds = integrante.grupo.integrantes.map(
        (item) => item.estudianteId,
      );

      if (integrantesIds.length === 0) {
        throw new BadRequestException('El grupo no tiene integrantes activos');
      }

      return {
        esGrupal: true,

        estudianteId: null,

        grupoCursoId: integrante.grupoId,

        equipoAfinidadTareaId: null,

        puedeModificar:
          responsable === 'CUALQUIER_INTEGRANTE' || integrante.esRepresentante,

        integrantesIds,

        grupo: {
          tipo: 'PLATAFORMA',

          id: integrante.grupo.id,

          nombre: integrante.grupo.nombre,

          responsable,

          esRepresentanteActual: integrante.esRepresentante,

          representante:
            integrante.grupo.integrantes.find(
              (miembro) => miembro.esRepresentante,
            )?.estudiante ?? null,

          integrantes: integrante.grupo.integrantes,
        },
      };
    }

    /*
     * ==========================================================
     * EQUIPOS POR AFINIDAD
     * ==========================================================
     */
    if (tarea.origenGrupo === OrigenGrupoTarea.AFINIDAD) {
      const integrante = await this.prisma.integranteEquipoTarea.findFirst({
        where: {
          estudianteId: usuario.id,

          estaActivo: true,

          equipo: {
            tareaId: tarea.id,

            cursoId: tarea.cursoId,

            estaActivo: true,

            /*
             * BLOQUEADO sigue siendo válido para consultar o
             * reeditar una entrega cuando la tarea lo permite.
             * El bloqueo congela la composición del equipo,
             * no elimina su pertenencia.
             */
            estado: {
              in: [
                EstadoEquipoAfinidadTarea.ACTIVO,
                EstadoEquipoAfinidadTarea.BLOQUEADO,
              ],
            },
          },
        },

        select: {
          esRepresentante: true,

          equipoId: true,

          equipo: {
            select: {
              id: true,

              nombre: true,

              estado: true,

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

                select: {
                  estudianteId: true,

                  esRepresentante: true,

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
          },
        },
      });

      if (!integrante) {
        throw new BadRequestException(
          'Debes formar o integrar un equipo por afinidad antes de realizar la entrega',
        );
      }

      const integrantesIds = integrante.equipo.integrantes.map(
        (item) => item.estudianteId,
      );

      const { minimo, maximo } = this.obtenerLimitesAfinidad(
        tarea.configuracionTipo,
      );

      if (integrantesIds.length < minimo || integrantesIds.length > maximo) {
        const regla =
          minimo === maximo
            ? `exactamente ${minimo}`
            : `entre ${minimo} y ${maximo}`;

        throw new BadRequestException(
          `El equipo debe tener ${regla} integrantes antes de realizar la entrega`,
        );
      }

      return {
        esGrupal: true,

        estudianteId: null,

        grupoCursoId: null,

        equipoAfinidadTareaId: integrante.equipoId,

        puedeModificar:
          responsable === 'CUALQUIER_INTEGRANTE' || integrante.esRepresentante,

        integrantesIds,

        grupo: {
          tipo: 'AFINIDAD',

          id: integrante.equipo.id,

          nombre: integrante.equipo.nombre,

          responsable,

          esRepresentanteActual: integrante.esRepresentante,

          representante:
            integrante.equipo.integrantes.find(
              (miembro) => miembro.esRepresentante,
            )?.estudiante ?? null,

          integrantes: integrante.equipo.integrantes,
        },
      };
    }

    throw new BadRequestException(
      'La tarea grupal no tiene un origen de grupos válido',
    );
  }

  /*
   * ============================================================
   * PERÍODO DE ENTREGA
   * ============================================================
   */

  private async validarPeriodo(
    tarea: Awaited<ReturnType<TareasEntregasService['obtenerTarea']>>,

    estudianteId?: number,
  ) {
    if (tarea.tipo === TipoTarea.PRESENCIAL) {
      throw new BadRequestException(
        'Esta actividad presencial no admite una entrega digital del estudiante',
      );
    }

    const ahora = new Date();

    let fechaApertura = tarea.fechaApertura;

    let fechaLimite = tarea.fechaLimite;

    let cierreEfectivo = tarea.permitirRetrasos
      ? (tarea.fechaMaximaRetraso ?? tarea.fechaCierre)
      : tarea.fechaLimite;

    if (estudianteId) {
      const extension = await this.obtenerExtensionActiva(
        tarea.id,
        estudianteId,
      );

      if (extension) {
        if (extension.fechaAperturaExtendida) {
          fechaApertura = extension.fechaAperturaExtendida;
        }

        if (extension.fechaLimiteExtendida) {
          fechaLimite = extension.fechaLimiteExtendida;
        }

        if (extension.fechaMaximaRetrasoExtendida) {
          cierreEfectivo = extension.fechaMaximaRetrasoExtendida;
        } else if (extension.fechaLimiteExtendida) {
          cierreEfectivo = extension.fechaLimiteExtendida;
        }
      }
    }

    if (ahora < fechaApertura) {
      throw new BadRequestException('La tarea todavía no está abierta');
    }

    if (tarea.estaCerrada) {
      throw new BadRequestException('La tarea está cerrada');
    }

    if (ahora > cierreEfectivo) {
      throw new BadRequestException('El período de entrega terminó');
    }

    if (ahora > fechaLimite && !tarea.permitirRetrasos) {
      throw new BadRequestException('La fecha límite de entrega ya venció');
    }

    return ahora;
  }

  /**
   * Devuelve la extensión de plazo activa más reciente de un estudiante
   * para una tarea, o null si no existe.
   */
  private async obtenerExtensionActiva(
    tareaId: number,

    estudianteId: number,
  ) {
    const extension = await this.prisma.extensionPlazoTarea.findFirst({
      where: {
        tareaId,

        activo: true,

        beneficiarios: {
          some: {
            estudianteId,
          },
        },
      },

      orderBy: {
        creadoEn: 'desc',
      },

      select: {
        id: true,

        fechaAperturaExtendida: true,

        fechaLimiteExtendida: true,

        fechaMaximaRetrasoExtendida: true,
      },
    });

    return extension;
  }

  /*
   * ============================================================
   * BÚSQUEDA DE UNA ENTREGA
   * ============================================================
   */

  private construirWhereEntrega(tareaId: number, contexto: ContextoEntrega) {
    if (contexto.estudianteId) {
      return {
        tareaId,

        estudianteId: contexto.estudianteId,

        estaActiva: true,
      };
    }

    if (contexto.grupoCursoId) {
      return {
        tareaId,

        grupoCursoId: contexto.grupoCursoId,

        estaActiva: true,
      };
    }

    return {
      tareaId,

      equipoAfinidadTareaId: contexto.equipoAfinidadTareaId!,

      estaActiva: true,
    };
  }

  private async buscarEntrega(tareaId: number, contexto: ContextoEntrega) {
    return this.prisma.entregaTarea.findFirst({
      where: this.construirWhereEntrega(tareaId, contexto),

      include: {
        archivos: {
          where: {
            estaActivo: true,
          },

          orderBy: {
            creadoEn: 'asc',
          },
        },

        autorEntrega: {
          select: {
            id: true,

            nombres: true,

            apellidoPaterno: true,
          },
        },
      },
    });
  }

  private asegurarPuedeModificar(contexto: ContextoEntrega) {
    if (!contexto.puedeModificar) {
      throw new ForbiddenException(
        'Solo el representante del grupo puede registrar o modificar la entrega',
      );
    }
  }

  private asegurarEdicionPermitida(
    tarea: Awaited<ReturnType<TareasEntregasService['obtenerTarea']>>,
    entrega: Awaited<ReturnType<TareasEntregasService['buscarEntrega']>>,
  ) {
    if (!entrega) {
      return;
    }

    if (
      entrega.estado === EstadoEntregaTarea.BLOQUEADA ||
      entrega.estado === EstadoEntregaTarea.ANULADA
    ) {
      throw new BadRequestException('La entrega ya no puede modificarse');
    }

    if (entrega.enviadaEn && !tarea.permitirEditarEntrega) {
      throw new BadRequestException(
        'La tarea no permite editar una entrega ya enviada',
      );
    }
  }

  /*
   * ============================================================
   * RETRASO
   * ============================================================
   */

  private calcularRetraso(
    tarea: Awaited<ReturnType<TareasEntregasService['obtenerTarea']>>,
    enviadaEn: Date,

    fechaLimiteEfectiva?: Date,
  ) {
    const fechaLimite = fechaLimiteEfectiva ?? tarea.fechaLimite;

    if (enviadaEn <= fechaLimite) {
      return {
        entregadaTarde: false,

        minutosRetraso: 0,

        descuentoCalculado: 0,
      };
    }

    const minutosRetraso = Math.max(
      1,
      Math.ceil((enviadaEn.getTime() - fechaLimite.getTime()) / 60000),
    );

    const valor = Number(tarea.valorDescuentoRetraso ?? 0);

    let descuento = 0;

    switch (tarea.tipoDescuentoRetraso) {
      case TipoDescuentoRetraso.PUNTOS_FIJOS:
      case TipoDescuentoRetraso.PORCENTAJE:
        descuento = valor;
        break;

      case TipoDescuentoRetraso.POR_HORA:
        descuento = Math.ceil(minutosRetraso / 60) * valor;
        break;

      case TipoDescuentoRetraso.POR_DIA:
        descuento = Math.ceil(minutosRetraso / 1440) * valor;
        break;

      case TipoDescuentoRetraso.NOTA_MAXIMA:
        descuento = Math.max(0, 100 - valor);
        break;

      default:
        descuento = 0;
    }

    return {
      entregadaTarde: true,

      minutosRetraso,

      descuentoCalculado: Math.min(100, Math.max(0, descuento)),
    };
  }

  /*
   * ============================================================
   * CALIFICACIONES
   * ============================================================
   */

  private async sincronizarCalificaciones(
    tarea: Awaited<ReturnType<TareasEntregasService['obtenerTarea']>>,
    entregaId: number,
    integrantesIds: number[],
    descuentoRetraso: number,
  ) {
    if (!tarea.esCalificable || !tarea.actividadCalificable) {
      return;
    }

    if (
      tarea.actividadCalificable.estado === EstadoActividadCalificable.ANULADA
    ) {
      return;
    }

    await this.prisma.$transaction(
      integrantesIds.map((estudianteId) =>
        this.prisma.calificacionEstudiante.upsert({
          where: {
            actividadId_estudianteId: {
              actividadId: tarea.actividadCalificable!.id,

              estudianteId,
            },
          },

          create: {
            actividadId: tarea.actividadCalificable!.id,

            estudianteId,

            entregaTareaId: entregaId,

            descuentoRetraso,

            estado: EstadoCalificacion.PENDIENTE,
          },

          update: {
            entregaTareaId: entregaId,

            descuentoRetraso,

            /*
             * Si las notas ya fueron publicadas no debemos volver
             * a cambiar su estado únicamente porque el estudiante
             * reenvió una entrega permitida.
             */
            ...(tarea.actividadCalificable!.estado ===
            EstadoActividadCalificable.PUBLICADA
              ? {}
              : {
                  estado: EstadoCalificacion.PENDIENTE,
                }),
          },
        }),
      ),
    );
  }

  /*
   * ============================================================
   * ESTUDIANTE — CONSULTAR MI ENTREGA
   * ============================================================
   */

  async obtenerMiEntrega(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    this.validarEstudiante(usuario);

    await this.validarInscripcion(usuario.id, cursoId);

    const tarea = await this.obtenerTarea(cursoId, tareaId);

    const contexto = await this.resolverContexto(usuario, tarea);

    const entrega = await this.buscarEntrega(tarea.id, contexto);

    return {
      entrega,

      permisos: {
        puedeModificar: contexto.puedeModificar,

        esGrupal: contexto.esGrupal,
      },

      contextoGrupo: contexto.grupo,
    };
  }

  async registrarSesionEdicion(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    entregaId: number,
    datos: RegistrarSesionEdicionDto,
  ) {
    this.validarEstudiante(usuario);

    await this.validarInscripcion(usuario.id, cursoId);

    const tarea = await this.obtenerTarea(cursoId, tareaId);

    await this.validarPeriodo(tarea, usuario.id);

    const contexto = await this.resolverContexto(usuario, tarea);

    const entrega = await this.buscarEntrega(tarea.id, contexto);

    if (!entrega || entrega.id !== entregaId) {
      throw new NotFoundException(
        'La entrega no está disponible para registrar la sesión',
      );
    }

    const existente = await this.prisma.sesionEdicionTarea.findFirst({
      where: {
        entregaTareaId: entrega.id,
        autorId: usuario.id,
      },
    });

    const ahora = new Date();

    if (existente) {
      await this.prisma.sesionEdicionTarea.update({
        where: {
          id: existente.id,
        },
        data: {
          segundosActivos: {
            increment: datos.segundosActivos,
          },
          cantidadPegados: {
            increment: datos.cantidadPegados,
          },
          ultimoLatidoEn: ahora,
        },
      });
    } else {
      await this.prisma.sesionEdicionTarea.create({
        data: {
          entregaTareaId: entrega.id,
          autorId: usuario.id,
          segundosActivos: datos.segundosActivos,
          cantidadPegados: datos.cantidadPegados,
          ultimoLatidoEn: ahora,
        },
      });
    }

    return {
      ok: true,
    };
  }

  async obtenerSesionesEntrega(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    entregaId: number,
  ) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede consultar las sesiones de edición',
      );
    }

    const curso = await this.prisma.curso.findUnique({
      where: {
        id: cursoId,
      },

      select: {
        docenteId: true,
      },
    });

    if (!curso || curso.docenteId !== usuario.id) {
      throw new ForbiddenException('No tienes acceso a este curso');
    }

    const tarea = await this.prisma.tareaCurso.findFirst({
      where: {
        id: tareaId,

        cursoId,

        estaActiva: true,
      },

      select: {
        id: true,
      },
    });

    if (!tarea) {
      throw new NotFoundException('La tarea no existe');
    }

    const entrega = await this.prisma.entregaTarea.findFirst({
      where: {
        id: entregaId,
        tareaId: tarea.id,
      },
      include: {
        sesionesEdicion: {
          include: {
            autor: {
              select: {
                id: true,
                nombres: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
              },
            },
          },
          orderBy: {
            segundosActivos: 'desc',
          },
        },
      },
    });

    if (!entrega) {
      throw new NotFoundException('Entrega no encontrada');
    }

    return {
      sesiones: entrega.sesionesEdicion.map((sesion) => ({
        autorId: sesion.autorId,
        autorNombre: [
          sesion.autor.nombres,
          sesion.autor.apellidoPaterno,
          sesion.autor.apellidoMaterno ?? '',
        ]
          .filter(Boolean)
          .join(' '),
        segundosActivos: sesion.segundosActivos,
        cantidadPegados: sesion.cantidadPegados,
        ultimoLatidoEn: sesion.ultimoLatidoEn,
      })),
    };
  }

  /*
   * ============================================================
   * ESTUDIANTE — PREPARAR / GUARDAR BORRADOR
   * ============================================================
   */

  async preparar(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    datos: GuardarEntregaTareaDto,
  ) {
    this.validarEstudiante(usuario);

    await this.validarInscripcion(usuario.id, cursoId);

    const tarea = await this.obtenerTarea(cursoId, tareaId);

    await this.validarPeriodo(tarea, usuario.id);

    const contexto = await this.resolverContexto(usuario, tarea);

    this.asegurarPuedeModificar(contexto);

    const existente = await this.buscarEntrega(tarea.id, contexto);

    this.asegurarEdicionPermitida(tarea, existente);

    if (existente) {
      const actualizado = await this.prisma.entregaTarea.update({
        where: {
          id: existente.id,
        },

        data: {
          autorEntregaId: usuario.id,

          ...(datos.contenido !== undefined
            ? {
                contenido: datos.contenido,
              }
            : {}),

          /*
           * Una entrega enviada conserva su estado hasta que
           * vuelva a confirmarse. editadaEn deja trazabilidad
           * de la modificación.
           */
          ...(existente.enviadaEn
            ? {
                editadaEn: new Date(),
              }
            : {}),
        },

        include: {
          archivos: {
            where: {
              estaActivo: true,
            },

            orderBy: {
              creadoEn: 'asc',
            },
          },
        },
      });

      return {
        mensaje: 'Entrega preparada correctamente',

        entrega: actualizado,
      };
    }

    const creada = await this.prisma.entregaTarea.create({
      data: {
        tareaId: tarea.id,

        autorEntregaId: usuario.id,

        estudianteId: contexto.estudianteId,

        grupoCursoId: contexto.grupoCursoId,

        equipoAfinidadTareaId: contexto.equipoAfinidadTareaId,

        contenido: datos.contenido,

        esGrupal: contexto.esGrupal,

        estado: EstadoEntregaTarea.BORRADOR,
      },

      include: {
        archivos: {
          where: {
            estaActivo: true,
          },
        },
      },
    });

    return {
      mensaje: 'Entrega preparada correctamente',

      entrega: creada,
    };
  }

  /*
   * ============================================================
   * ESTUDIANTE — ENVIAR ENTREGA OFICIAL
   * ============================================================
   */

  private async validarRespuestaJuridica(
    tarea: {
      tipo: string;
      configuracionTipo: unknown;
    },
    contenido: string,
  ) {
    if (tarea.tipo !== 'RESPUESTA_ESCRITA') {
      return;
    }

    const configuracion = tarea.configuracionTipo;

    const configuracionRespuesta =
      configuracion &&
      typeof configuracion === 'object' &&
      !Array.isArray(configuracion)
        ? (configuracion as Record<string, unknown>)['respuestaEscrita']
        : null;

    if (!configuracionRespuesta || typeof configuracionRespuesta !== 'object') {
      return;
    }

    const config = configuracionRespuesta as Record<string, unknown>;

    let estado: {
      secciones?: Record<string, unknown>;
      citas?: Array<Record<string, unknown>>;
    } | null = null;

    try {
      const analizado = JSON.parse(contenido) as {
        formato?: unknown;
        secciones?: unknown;
        citas?: unknown;
      };

      if (
        analizado?.formato === 'RESPUESTA_ESCRITA' &&
        analizado.secciones &&
        typeof analizado.secciones === 'object'
      ) {
        estado = {
          secciones: analizado.secciones as Record<string, unknown>,

          citas: Array.isArray(analizado.citas)
            ? (analizado.citas as Array<Record<string, unknown>>).filter(
                (cita) => cita && typeof cita === 'object',
              )
            : [],
        };
      }
    } catch {
      estado = null;
    }

    if (!estado) {
      throw new BadRequestException(
        'La respuesta debe tener el formato de respuesta jurídica guiada',
      );
    }

    const seccionesConTexto = estado.secciones ?? {};

    const estructuraGuiada =
      config['estructuraGuiada'] === false ? false : true;

    if (estructuraGuiada) {
      const faltan = [
        'relacionJuridica',
        'normas',
        'argumentacion',
        'conclusion',
      ].some((clave) => {
        const texto = seccionesConTexto[clave];

        return typeof texto !== 'string' || !texto.trim();
      });

      if (faltan) {
        throw new BadRequestException(
          'Debes completar todas las secciones de la respuesta jurídica',
        );
      }
    }

    const contarPalabras = (texto: string) => {
      const limpio = texto.replace(/\s+/g, ' ').trim();

      return limpio ? limpio.split(' ').length : 0;
    };

    const total = Object.values(seccionesConTexto).reduce<number>(
      (suma, texto) =>
        suma + contarPalabras(typeof texto === 'string' ? texto : ''),
      0,
    );

    const minPalabras =
      typeof config['minPalabras'] === 'number'
        ? Math.floor(config['minPalabras'])
        : 0;

    const maxPalabras =
      typeof config['maxPalabras'] === 'number'
        ? Math.floor(config['maxPalabras'])
        : 0;

    if (minPalabras > 0 && total < minPalabras) {
      throw new BadRequestException(
        `La respuesta tiene ${total} palabras; el mínimo es ${minPalabras}`,
      );
    }

    if (maxPalabras > 0 && total > maxPalabras) {
      throw new BadRequestException(
        `La respuesta supera el máximo de ${maxPalabras} palabras`,
      );
    }

    const exigirCitas = config['exigirCitas'] === true;

    if (exigirCitas) {
      const citasCompletas = (estado.citas ?? []).filter(
        (cita) =>
          typeof cita['referencia'] === 'string' && cita['referencia'].trim(),
      ).length;

      const minCitas =
        typeof config['minCitas'] === 'number'
          ? Math.floor(config['minCitas'])
          : 1;

      if (citasCompletas < minCitas) {
        throw new BadRequestException(
          `Debes citar al menos ${minCitas} fuente(s) jurídica(s)`,
        );
      }
    }
  }

  private async validarCasoPractico(
    tarea: {
      tipo: string;
      configuracionTipo: unknown;
    },
    contenido: string,
  ) {
    if (tarea.tipo !== 'CASO_PRACTICO') {
      return;
    }

    const configuracion = tarea.configuracionTipo;

    const configuracionCaso =
      configuracion &&
      typeof configuracion === 'object' &&
      !Array.isArray(configuracion)
        ? (configuracion as Record<string, unknown>)['casoPractico']
        : null;

    if (!configuracionCaso || typeof configuracionCaso !== 'object') {
      return;
    }

    const config = configuracionCaso as Record<string, unknown>;

    let estado: {
      respuestas?: Array<{
        respuesta?: string;
      }>;
      conclusion?: string;
    } | null;

    try {
      const analizado = JSON.parse(contenido) as {
        formato?: unknown;
        respuestas?: unknown;
        conclusion?: unknown;
      };

      estado =
        analizado.formato === 'CASO_PRACTICO'
          ? {
              respuestas: Array.isArray(analizado.respuestas)
                ? (
                    analizado.respuestas as Array<Record<string, unknown>>
                  ).filter(
                    (respuesta) => respuesta && typeof respuesta === 'object',
                  )
                : [],

              conclusion:
                typeof analizado.conclusion === 'string'
                  ? analizado.conclusion
                  : '',
            }
          : null;
    } catch {
      estado = null;
    }

    if (!estado) {
      throw new BadRequestException(
        'La resolución debe tener el formato de caso práctico guiado',
      );
    }

    const estructuraGuiada =
      config['estructuraGuiada'] === false ? false : true;

    if (estructuraGuiada) {
      const faltan = (estado.respuestas ?? []).some(
        (respuesta) =>
          typeof respuesta.respuesta !== 'string' ||
          !respuesta.respuesta.trim(),
      );

      if (faltan) {
        throw new BadRequestException(
          'Debes responder todas las preguntas del caso',
        );
      }
    }

    const contarPalabras = (texto: string) => {
      const limpio = texto.replace(/\s+/g, ' ').trim();

      return limpio ? limpio.split(' ').length : 0;
    };

    const total =
      (estado.respuestas ?? []).reduce<number>(
        (suma, respuesta) => suma + contarPalabras(respuesta.respuesta ?? ''),
        0,
      ) + contarPalabras(estado.conclusion ?? '');

    const minPalabras =
      typeof config['minPalabras'] === 'number'
        ? Math.floor(config['minPalabras'])
        : 0;

    const maxPalabras =
      typeof config['maxPalabras'] === 'number'
        ? Math.floor(config['maxPalabras'])
        : 0;

    if (minPalabras > 0 && total < minPalabras) {
      throw new BadRequestException(
        `La resolución tiene ${total} palabras; el mínimo es ${minPalabras}`,
      );
    }

    if (maxPalabras > 0 && total > maxPalabras) {
      throw new BadRequestException(
        `La resolución supera el máximo de ${maxPalabras} palabras`,
      );
    }

    const exigirCitas = config['exigirCitas'] === true;

    if (exigirCitas) {
      let citasCompletas = 0;

      try {
        const revisado = JSON.parse(contenido) as {
          citas?: Array<Record<string, unknown>>;
        };

        citasCompletas = Array.isArray(revisado.citas)
          ? revisado.citas.filter(
              (cita) =>
                typeof cita['referencia'] === 'string' &&
                cita['referencia'].trim(),
            ).length
          : 0;
      } catch {
        citasCompletas = 0;
      }

      const minCitas =
        typeof config['minCitas'] === 'number'
          ? Math.floor(config['minCitas'])
          : 1;

      if (citasCompletas < minCitas) {
        throw new BadRequestException(
          `Debes citar al menos ${minCitas} fuente(s) jurídica(s)`,
        );
      }
    }
  }

  private async validarRedaccionJuridica(
    tarea: {
      tipo: string;
      configuracionTipo: unknown;
    },
    contenido: string,
  ) {
    if (tarea.tipo !== 'REDACCION_JURIDICA') {
      return;
    }

    const configuracion = tarea.configuracionTipo;

    const configuracionRedaccion =
      configuracion &&
      typeof configuracion === 'object' &&
      !Array.isArray(configuracion)
        ? (configuracion as Record<string, unknown>)['redaccionJuridica']
        : null;

    if (!configuracionRedaccion || typeof configuracionRedaccion !== 'object') {
      return;
    }

    const config = configuracionRedaccion as Record<string, unknown>;

    let estado: {
      secciones?: Array<{
        contenido?: string;
      }>;
    } | null;

    try {
      const analizado = JSON.parse(contenido) as {
        formato?: unknown;
        secciones?: unknown;
      };

      estado =
        analizado.formato === 'REDACCION_JURIDICA'
          ? {
              secciones: Array.isArray(analizado.secciones)
                ? (
                    analizado.secciones as Array<Record<string, unknown>>
                  ).filter((seccion) => seccion && typeof seccion === 'object')
                : [],
            }
          : null;
    } catch {
      estado = null;
    }

    if (!estado) {
      throw new BadRequestException(
        'La pieza debe tener el formato de redacción jurídica guiada',
      );
    }

    const estructuraGuiada =
      config['estructuraGuiada'] === false ? false : true;

    if (estructuraGuiada) {
      const faltan = (estado.secciones ?? []).some(
        (seccion) =>
          typeof seccion.contenido !== 'string' || !seccion.contenido.trim(),
      );

      if (faltan) {
        throw new BadRequestException(
          'Debes redactar todas las secciones del documento',
        );
      }
    }

    const contarPalabras = (texto: string) => {
      const limpio = texto.replace(/\s+/g, ' ').trim();

      return limpio ? limpio.split(' ').length : 0;
    };

    const total = (estado.secciones ?? []).reduce<number>(
      (suma, seccion) => suma + contarPalabras(seccion.contenido ?? ''),
      0,
    );

    const minPalabras =
      typeof config['minPalabras'] === 'number'
        ? Math.floor(config['minPalabras'])
        : 0;

    const maxPalabras =
      typeof config['maxPalabras'] === 'number'
        ? Math.floor(config['maxPalabras'])
        : 0;

    if (minPalabras > 0 && total < minPalabras) {
      throw new BadRequestException(
        `La pieza tiene ${total} palabras; el mínimo es ${minPalabras}`,
      );
    }

    if (maxPalabras > 0 && total > maxPalabras) {
      throw new BadRequestException(
        `La pieza supera el máximo de ${maxPalabras} palabras`,
      );
    }

    const exigirCitas = config['exigirCitas'] === true;

    if (exigirCitas) {
      let citasCompletas = 0;

      try {
        const revisado = JSON.parse(contenido) as {
          citas?: Array<Record<string, unknown>>;
        };

        citasCompletas = Array.isArray(revisado.citas)
          ? revisado.citas.filter(
              (cita) =>
                typeof cita['referencia'] === 'string' &&
                cita['referencia'].trim(),
            ).length
          : 0;
      } catch {
        citasCompletas = 0;
      }

      const minCitas =
        typeof config['minCitas'] === 'number'
          ? Math.floor(config['minCitas'])
          : 1;

      if (citasCompletas < minCitas) {
        throw new BadRequestException(
          `Debes citar al menos ${minCitas} fuente(s) jurídica(s)`,
        );
      }
    }
  }

  private async validarExposicion(
    tarea: {
      tipo: string;
      configuracionTipo: unknown;
    },
    contenido: string,
  ) {
    if (tarea.tipo !== 'EXPOSICION') {
      return;
    }

    const configuracion = tarea.configuracionTipo;

    const configuracionExposicion =
      configuracion &&
      typeof configuracion === 'object' &&
      !Array.isArray(configuracion)
        ? (configuracion as Record<string, unknown>)['exposicion']
        : null;

    if (
      !configuracionExposicion ||
      typeof configuracionExposicion !== 'object'
    ) {
      return;
    }

    const config = configuracionExposicion as Record<string, unknown>;

    let estado: {
      secciones?: Array<{
        contenido?: string;
      }>;
      enlacePresentacion?: unknown;
    } | null;

    try {
      const analizado = JSON.parse(contenido) as {
        formato?: unknown;
        secciones?: unknown;
        enlacePresentacion?: unknown;
      };

      estado =
        analizado.formato === 'EXPOSICION'
          ? {
              secciones: Array.isArray(analizado.secciones)
                ? (
                    analizado.secciones as Array<Record<string, unknown>>
                  ).filter((seccion) => seccion && typeof seccion === 'object')
                : [],
              enlacePresentacion: analizado.enlacePresentacion,
            }
          : null;
    } catch {
      estado = null;
    }

    if (!estado) {
      throw new BadRequestException(
        'La exposición debe tener el formato de kit guiado',
      );
    }

    const estructuraGuiada =
      config['estructuraGuiada'] === false ? false : true;

    if (estructuraGuiada) {
      const faltan = (estado.secciones ?? []).some(
        (seccion) =>
          typeof seccion.contenido !== 'string' || !seccion.contenido.trim(),
      );

      if (faltan) {
        throw new BadRequestException(
          'Debes preparar todas las secciones del guión',
        );
      }
    }

    const contarPalabras = (texto: string) => {
      const limpio = texto.replace(/\s+/g, ' ').trim();

      return limpio ? limpio.split(' ').length : 0;
    };

    const total = (estado.secciones ?? []).reduce<number>(
      (suma, seccion) => suma + contarPalabras(seccion.contenido ?? ''),
      0,
    );

    const minPalabras =
      typeof config['minPalabras'] === 'number'
        ? Math.floor(config['minPalabras'])
        : 0;

    const maxPalabras =
      typeof config['maxPalabras'] === 'number'
        ? Math.floor(config['maxPalabras'])
        : 0;

    if (minPalabras > 0 && total < minPalabras) {
      throw new BadRequestException(
        `El guión tiene ${total} palabras; el mínimo es ${minPalabras}`,
      );
    }

    if (maxPalabras > 0 && total > maxPalabras) {
      throw new BadRequestException(
        `El guión supera el máximo de ${maxPalabras} palabras`,
      );
    }

    const exigirEnlace = config['exigirEnlacePresentacion'] === true;

    if (exigirEnlace) {
      const enlace =
        typeof estado.enlacePresentacion === 'string'
          ? estado.enlacePresentacion.trim()
          : '';

      const esUrlValida =
        enlace.length > 0 &&
        /^https?:\/\//i.test(enlace) &&
        (() => {
          try {
            const url = new URL(enlace);

            return Boolean(url.hostname);
          } catch {
            return false;
          }
        })();

      if (!esUrlValida) {
        throw new BadRequestException(
          'Debes adjuntar un enlace de presentación válido (http/https)',
        );
      }
    }

    const exigirCitas = config['exigirCitas'] === true;

    if (exigirCitas) {
      let citasCompletas = 0;

      try {
        const revisado = JSON.parse(contenido) as {
          citas?: Array<Record<string, unknown>>;
        };

        citasCompletas = Array.isArray(revisado.citas)
          ? revisado.citas.filter(
              (cita) =>
                typeof cita['referencia'] === 'string' &&
                cita['referencia'].trim(),
            ).length
          : 0;
      } catch {
        citasCompletas = 0;
      }

      const minCitas =
        typeof config['minCitas'] === 'number'
          ? Math.floor(config['minCitas'])
          : 1;

      if (citasCompletas < minCitas) {
        throw new BadRequestException(
          `Debes citar al menos ${minCitas} fuente(s) jurídica(s)`,
        );
      }
    }
  }

  private async validarMIXTA(
    tarea: {
      tipo: string;
      componentes: Array<{
        id: number;
        tipo: string;
        titulo: string;
        obligatorio: boolean;
        configuracion: Record<string, unknown> | null;
      }>;
    },
    contenido: string,
  ) {
    if (tarea.tipo !== 'MIXTA') {
      return;
    }

    let estado: {
      formato?: unknown;
      componentes?: unknown;
    } | null;

    try {
      estado = JSON.parse(contenido) as {
        formato?: unknown;
        componentes?: unknown;
      };

      if (
        estado.formato !== 'MIXTA' ||
        !estado.componentes ||
        typeof estado.componentes !== 'object' ||
        Array.isArray(estado.componentes)
      ) {
        estado = null;
      }
    } catch {
      estado = null;
    }

    if (!estado) {
      throw new BadRequestException(
        'La entrega mixta debe tener el formato MIXTA guiado',
      );
    }

    const mapaContenidos = estado.componentes as Record<string, unknown>;

    for (const componente of tarea.componentes) {
      if (!componente.obligatorio) {
        continue;
      }

      if (componente.tipo === 'ARCHIVOS' || componente.tipo === 'PRESENCIAL') {
        continue;
      }

      const contenidoC =
        typeof mapaContenidos[String(componente.id)] === 'string'
          ? (mapaContenidos[String(componente.id)] as string).trim()
          : '';

      if (!contenidoC) {
        throw new BadRequestException(
          `El componente obligatorio "${componente.titulo}" debe tener contenido`,
        );
      }
    }
  }

  private async validarDocumentoColaborativo(
    tarea: {
      tipo: string;
      configuracionTipo: unknown;
    },
    contenido: string,
  ) {
    if (tarea.tipo !== 'DOCUMENTO_COLABORATIVO') {
      return;
    }

    const configuracion = tarea.configuracionTipo;

    const configData =
      configuracion &&
      typeof configuracion === 'object' &&
      !Array.isArray(configuracion)
        ? (configuracion as Record<string, unknown>)['documentoColaborativo']
        : null;

    let estado: {
      formato?: unknown;
      version?: unknown;
      bloques?: unknown;
      bloquesArr?: Array<Record<string, unknown>>;
    };

    try {
      const analizado = JSON.parse(contenido) as {
        formato?: unknown;
        version?: unknown;
        bloques?: unknown;
      };

      if (
        analizado.formato !== 'DOCUMENTO_COLABORATIVO' ||
        !Array.isArray(analizado.bloques)
      ) {
        throw new Error('formato');
      }

      estado = {
        formato: analizado.formato,
        version: analizado.version,
        bloques: analizado.bloques,
        bloquesArr: (
          analizado.bloques as Array<Record<string, unknown>>
        ).filter((b) => b && typeof b === 'object'),
      };
    } catch {
      throw new BadRequestException(
        'El documento colaborativo debe tener el formato guiado',
      );
    }

    const bloques = estado.bloquesArr ?? [];

    if (bloques.length === 0) {
      throw new BadRequestException(
        'El documento colaborativo debe tener al menos un bloque',
      );
    }

    const contarPalabras = (texto: unknown) => {
      if (typeof texto !== 'string') {
        return 0;
      }

      const limpio = texto.replace(/\s+/g, ' ').trim();

      return limpio ? limpio.split(' ').length : 0;
    };

    const total = bloques.reduce<number>(
      (suma, bloque) => suma + contarPalabras(bloque['contenido']),
      0,
    );

    const config =
      configData && typeof configData === 'object'
        ? (configData as Record<string, unknown>)
        : null;

    const totalMin =
      typeof config?.['totalMinPalabras'] === 'number'
        ? config['totalMinPalabras']
        : 0;

    const totalMax =
      typeof config?.['totalMaxPalabras'] === 'number'
        ? config['totalMaxPalabras']
        : 0;

    if (totalMin > 0 && total < totalMin) {
      throw new BadRequestException(
        `El documento tiene ${total} palabras; el mínimo es ${totalMin}`,
      );
    }

    if (totalMax > 0 && total > totalMax) {
      throw new BadRequestException(
        `El documento supera el máximo de ${totalMax} palabras`,
      );
    }

    const exigirAutores = config?.['exigirAutores'] !== false;

    if (exigirAutores) {
      const autores = new Set(
        bloques
          .map((bloque) => bloque['autorId'])
          .filter((id) => typeof id === 'number'),
      ).size;

      const minAutores =
        typeof config?.['minAutores'] === 'number' ? config['minAutores'] : 2;

      if (autores < minAutores) {
        throw new BadRequestException(
          `El documento requiere la participación de al menos ${minAutores} autor(es)`,
        );
      }
    }
  }

  async enviar(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
    entregaId: number,
  ) {
    this.validarEstudiante(usuario);

    await this.validarInscripcion(usuario.id, cursoId);

    const tarea = await this.obtenerTarea(cursoId, tareaId);

    const ahora = await this.validarPeriodo(tarea, usuario.id);

    const contexto = await this.resolverContexto(usuario, tarea);

    this.asegurarPuedeModificar(contexto);

    const entrega = await this.buscarEntrega(tarea.id, contexto);

    if (!entrega || entrega.id !== entregaId) {
      throw new NotFoundException(
        'La entrega no existe o no pertenece a tu actividad',
      );
    }

    this.asegurarEdicionPermitida(tarea, entrega);

    if (tarea.exigirContenidoEditor && !entrega.contenido?.trim()) {
      throw new BadRequestException(
        'Debes completar el contenido de la entrega',
      );
    }

    this.validarRespuestaJuridica(tarea, entrega.contenido ?? '');

    this.validarCasoPractico(tarea, entrega.contenido ?? '');

    this.validarRedaccionJuridica(tarea, entrega.contenido ?? '');

    this.validarExposicion(tarea, entrega.contenido ?? '');

    this.validarMIXTA(tarea, entrega.contenido ?? '');

    this.validarDocumentoColaborativo(tarea, entrega.contenido ?? '');

    if (tarea.exigirArchivo && entrega.archivos.length === 0) {
      throw new BadRequestException('Debes adjuntar al menos un archivo');
    }

    if (entrega.archivos.length > tarea.maximoArchivos) {
      throw new BadRequestException(
        `La tarea permite como máximo ${tarea.maximoArchivos} archivo(s)`,
      );
    }

    const extensionEnvio = await this.obtenerExtensionActiva(
      tarea.id,
      usuario.id,
    );

    const retraso = this.calcularRetraso(
      tarea,
      ahora,
      extensionEnvio?.fechaLimiteExtendida ?? undefined,
    );

    const actualizada = await this.prisma.$transaction(async (tx) => {
      const guardada = await tx.entregaTarea.update({
        where: {
          id: entrega.id,
        },

        data: {
          autorEntregaId: usuario.id,

          estado: retraso.entregadaTarde
            ? EstadoEntregaTarea.TARDIA
            : EstadoEntregaTarea.ENTREGADA,

          entregadaTarde: retraso.entregadaTarde,

          minutosRetraso: retraso.minutosRetraso,

          descuentoCalculado: retraso.descuentoCalculado,

          enviadaEn: ahora,

          editadaEn: entrega.enviadaEn ? ahora : null,
        },

        include: {
          archivos: {
            where: {
              estaActivo: true,
            },

            orderBy: {
              creadoEn: 'asc',
            },
          },
        },
      });

      /*
       * La primera entrega oficial congela la composición de
       * un equipo por afinidad. BLOQUEADO significa que ya no
       * se pueden cambiar integrantes/representante, pero la
       * entrega puede reeditarse si TareaCurso lo permite.
       */
      if (contexto.equipoAfinidadTareaId) {
        await tx.equipoAfinidadTarea.update({
          where: {
            id: contexto.equipoAfinidadTareaId,
          },

          data: {
            estado: EstadoEquipoAfinidadTarea.BLOQUEADO,

            bloqueadoEn: ahora,
          },
        });
      }

      return guardada;
    });

    await this.sincronizarCalificaciones(
      tarea,
      actualizada.id,
      contexto.integrantesIds,
      retraso.descuentoCalculado,
    );

    return {
      mensaje: retraso.entregadaTarde
        ? 'Tarea entregada con retraso'
        : 'Tarea entregada correctamente',

      entrega: actualizada,
    };
  }

  /*
   * ============================================================
   * ENVÍO AUTOMÁTICO AL CIERRE
   * ============================================================
   */

  /**
   * Recupera una tarea sin validar rol/sesión, para procesos internos
   * (cierre automático). Mantiene la misma forma que `obtenerTarea`.
   */
  private async obtenerTareaGlobal(tareaId: number) {
    const tarea = await this.prisma.tareaCurso.findFirst({
      where: {
        id: tareaId,

        estaActiva: true,
      },

      select: {
        id: true,

        cursoId: true,

        tipo: true,

        modalidad: true,

        origenGrupo: true,

        conjuntoGrupoId: true,

        configuracionTipo: true,

        capacidades: true,

        exigirContenidoEditor: true,

        exigirArchivo: true,

        maximoArchivos: true,

        tamanioMaximoArchivoMb: true,

        extensionesPermitidas: true,

        permitirEditarEntrega: true,

        fechaApertura: true,

        fechaLimite: true,

        fechaCierre: true,

        permitirRetrasos: true,

        fechaMaximaRetraso: true,

        tipoDescuentoRetraso: true,

        valorDescuentoRetraso: true,

        esCalificable: true,

        estado: true,

        estaCerrada: true,

        actividadCalificable: {
          select: {
            id: true,

            estado: true,
          },
        },
      },
    });

    if (!tarea) {
      return null;
    }

    return tarea;
  }

  /**
   * Resuelve los ids de los estudiantes que deben asociarse a una
   * entrega (individual → propietario; grupal/afinidad → integrantes activos).
   */
  private async resolverIntegrantesEntrega(entrega: {
    estudianteId: number | null;

    grupoCursoId: number | null;

    equipoAfinidadTareaId: number | null;
  }) {
    if (entrega.estudianteId) {
      return [entrega.estudianteId];
    }

    if (entrega.grupoCursoId) {
      const grupo = await this.prisma.grupoCurso.findUnique({
        where: {
          id: entrega.grupoCursoId,
        },

        select: {
          integrantes: {
            where: {
              estaActivo: true,
            },

            select: {
              estudianteId: true,
            },
          },
        },
      });

      return grupo?.integrantes.map((item) => item.estudianteId) ?? [];
    }

    if (entrega.equipoAfinidadTareaId) {
      const equipo = await this.prisma.equipoAfinidadTarea.findUnique({
        where: {
          id: entrega.equipoAfinidadTareaId,
        },

        select: {
          integrantes: {
            where: {
              estaActivo: true,
            },

            select: {
              estudianteId: true,
            },
          },
        },
      });

      return equipo?.integrantes.map((item) => item.estudianteId) ?? [];
    }

    return [];
  }

  /**
   * Envía automáticamente las entregas en BORRADOR de una tarea vencida.
   * Solo se envía un borrador si cumple todas las validaciones de contenido
   * y archivos del tipo de tarea; los que no las cumplen quedan pendientes
   * (se cuentan como no entregados al cierre).
   */
  async enviarBorradoresAutomaticamente(tareaId: number) {
    const tarea = await this.obtenerTareaGlobal(tareaId);

    if (!tarea) {
      return {
        enviadas: [] as number[],
      };
    }

    const borradores = await this.prisma.entregaTarea.findMany({
      where: {
        tareaId,

        estaActiva: true,

        estado: EstadoEntregaTarea.BORRADOR,

        contenido: {
          not: null,
        },
      },

      include: {
        archivos: {
          where: {
            estaActivo: true,
          },
        },
      },
    });

    const ahora = new Date();

    const enviadas: number[] = [];

    for (const borrador of borradores) {
      const contenido = borrador.contenido ?? '';

      let cumple = true;

      try {
        if (tarea.tipo === TipoTarea.PRESENCIAL) {
          cumple = false;
        } else if (tarea.exigirContenidoEditor && !contenido.trim()) {
          cumple = false;
        } else {
          await this.validarRespuestaJuridica(tarea, contenido);

          await this.validarCasoPractico(tarea, contenido);

          await this.validarRedaccionJuridica(tarea, contenido);

          await this.validarExposicion(tarea, contenido);

          await this.validarMIXTA(tarea, contenido);

          await this.validarDocumentoColaborativo(tarea, contenido);

          if (tarea.exigirArchivo && borrador.archivos.length === 0) {
            cumple = false;
          } else if (borrador.archivos.length > tarea.maximoArchivos) {
            cumple = false;
          }
        }
      } catch {
        cumple = false;
      }

      if (!cumple) {
        continue;
      }

      const integrantesIds = await this.resolverIntegrantesEntrega(borrador);

      if (integrantesIds.length === 0) {
        continue;
      }

      let fechaLimiteEfectiva: Date | undefined;

      const beneficiario =
        await this.prisma.extensionPlazoBeneficiario.findFirst({
          where: {
            estudianteId: {
              in: integrantesIds,
            },

            extension: {
              tareaId,

              activo: true,
            },
          },

          orderBy: {
            extension: {
              creadoEn: 'desc',
            },
          },

          select: {
            extension: {
              select: {
                fechaLimiteExtendida: true,
              },
            },
          },
        });

      if (beneficiario?.extension.fechaLimiteExtendida) {
        fechaLimiteEfectiva = beneficiario.extension.fechaLimiteExtendida;
      }

      const retraso = this.calcularRetraso(tarea, ahora, fechaLimiteEfectiva);

      const actualizada = await this.prisma.$transaction(async (tx) => {
        const guardada = await tx.entregaTarea.update({
          where: {
            id: borrador.id,
          },

          data: {
            estado: retraso.entregadaTarde
              ? EstadoEntregaTarea.TARDIA
              : EstadoEntregaTarea.ENTREGADA,

            entregadaTarde: retraso.entregadaTarde,

            minutosRetraso: retraso.minutosRetraso,

            descuentoCalculado: retraso.descuentoCalculado,

            enviadaEn: ahora,

            editadaEn: borrador.enviadaEn ? ahora : null,
          },
        });

        if (borrador.equipoAfinidadTareaId) {
          await tx.equipoAfinidadTarea.update({
            where: {
              id: borrador.equipoAfinidadTareaId,
            },

            data: {
              estado: EstadoEquipoAfinidadTarea.BLOQUEADO,

              bloqueadoEn: ahora,
            },
          });
        }

        return guardada;
      });

      await this.sincronizarCalificaciones(
        tarea,
        actualizada.id,
        integrantesIds,
        retraso.descuentoCalculado,
      );

      enviadas.push(borrador.id);
    }

    return {
      enviadas,
    };
  }

  /*
   * ============================================================
   * DOCENTE — LISTAR ENTREGAS
   * ============================================================
   */

  async listarDocente(
    usuario: UsuarioAutenticado,
    cursoId: number,
    tareaId: number,
  ) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede revisar las entregas',
      );
    }

    const curso = await this.prisma.curso.findUnique({
      where: {
        id: cursoId,
      },

      select: {
        docenteId: true,
      },
    });

    if (!curso || curso.docenteId !== usuario.id) {
      throw new ForbiddenException('No tienes acceso a este curso');
    }

    const tarea = await this.prisma.tareaCurso.findFirst({
      where: {
        id: tareaId,

        cursoId,

        estaActiva: true,
      },

      select: {
        id: true,
      },
    });

    if (!tarea) {
      throw new NotFoundException('La tarea no existe');
    }

    const entregas = await this.prisma.entregaTarea.findMany({
      where: {
        tareaId,

        estaActiva: true,
      },

      include: {
        autorEntrega: {
          select: {
            id: true,

            nombres: true,

            apellidoPaterno: true,
          },
        },

        estudiante: {
          select: {
            id: true,

            nombres: true,

            apellidoPaterno: true,
          },
        },

        grupoCurso: {
          select: {
            id: true,

            nombre: true,
          },
        },

        equipoAfinidadTarea: {
          select: {
            id: true,

            nombre: true,

            estado: true,

            integrantes: {
              where: {
                estaActivo: true,
              },

              select: {
                esRepresentante: true,

                estudiante: {
                  select: {
                    id: true,

                    nombres: true,

                    apellidoPaterno: true,
                  },
                },
              },
            },
          },
        },

        archivos: {
          where: {
            estaActivo: true,
          },

          orderBy: {
            creadoEn: 'asc',
          },
        },
      },

      orderBy: [
        {
          enviadaEn: 'desc',
        },
        {
          creadoEn: 'desc',
        },
      ],
    });

    return {
      total: entregas.length,

      entregas,
    };
  }
}
