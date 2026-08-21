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

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  GuardarEntregaTareaDto,
} from './dto/guardar-entrega-tarea.dto';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

type ResponsableEntregaGrupo =
  | 'SOLO_REPRESENTANTE'
  | 'CUALQUIER_INTEGRANTE';

type ConfiguracionTipoTarea = {
  responsableEntregaGrupo?:
    unknown;

  cantidadMinimaIntegrantes?:
    unknown;

  cantidadMaximaIntegrantes?:
    unknown;
};

type IntegranteContextoGrupo = {
  estudianteId:
    number;

  esRepresentante:
    boolean;

  estudiante: {
    id:
      number;

    nombres:
      string;

    apellidoPaterno:
      string;

    apellidoMaterno:
      string | null;

    fotoPerfilUrl:
      string | null;
  };
};

type ContextoGrupoEntrega = {
  tipo:
    'PLATAFORMA'
    | 'AFINIDAD';

  id:
    number;

  nombre:
    string;

  responsable:
    ResponsableEntregaGrupo;

  esRepresentanteActual:
    boolean;

  representante:
    IntegranteContextoGrupo['estudiante'] | null;

  integrantes:
    IntegranteContextoGrupo[];
};

type ContextoEntrega = {
  esGrupal:
    boolean;

  estudianteId:
    number | null;

  grupoCursoId:
    number | null;

  equipoAfinidadTareaId:
    number | null;

  puedeModificar:
    boolean;

  integrantesIds:
    number[];

  grupo:
    ContextoGrupoEntrega | null;
};

@Injectable()
export class TareasEntregasService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  /*
   * ============================================================
   * VALIDACIONES GENERALES
   * ============================================================
   */

  private validarEstudiante(
    usuario:
      UsuarioAutenticado,
  ) {
    if (
      usuario.rol !==
      Rol.ESTUDIANTE
    ) {
      throw new ForbiddenException(
        'Solo los estudiantes pueden realizar entregas',
      );
    }
  }

  private async validarInscripcion(
    usuarioId:
      number,
    cursoId:
      number,
  ) {
    const inscripcion =
      await this.prisma.inscripcionCurso.findFirst({
        where: {
          cursoId,

          estudianteId:
            usuarioId,

          estado:
            EstadoInscripcion.ACTIVA,
        },

        select: {
          id:
            true,
        },
      });

    if (!inscripcion) {
      throw new ForbiddenException(
        'No tienes una inscripción activa en este curso',
      );
    }
  }

  private async obtenerTarea(
    cursoId:
      number,
    tareaId:
      number,
  ) {
    const tarea =
      await this.prisma.tareaCurso.findFirst({
        where: {
          id:
            tareaId,

          cursoId,

          estaActiva:
            true,

          estado: {
            notIn: [
              'BORRADOR',
              'ANULADA',
            ],
          },
        },

        select: {
          id:
            true,

          cursoId:
            true,

          tipo:
            true,

          modalidad:
            true,

          origenGrupo:
            true,

          conjuntoGrupoId:
            true,

          configuracionTipo:
            true,

          capacidades:
            true,

          exigirContenidoEditor:
            true,

          exigirArchivo:
            true,

          maximoArchivos:
            true,

          tamanioMaximoArchivoMb:
            true,

          extensionesPermitidas:
            true,

          permitirEditarEntrega:
            true,

          fechaApertura:
            true,

          fechaLimite:
            true,

          fechaCierre:
            true,

          permitirRetrasos:
            true,

          fechaMaximaRetraso:
            true,

          tipoDescuentoRetraso:
            true,

          valorDescuentoRetraso:
            true,

          esCalificable:
            true,

          estado:
            true,

          estaCerrada:
            true,

          actividadCalificable: {
            select: {
              id:
                true,

              estado:
                true,
            },
          },
        },
      });

    if (!tarea) {
      throw new NotFoundException(
        'La tarea no existe o no está disponible',
      );
    }

    return tarea;
  }

  private obtenerConfiguracion(
    configuracion:
      unknown,
  ): ConfiguracionTipoTarea {
    if (
      configuracion &&
      typeof configuracion ===
        'object' &&
      !Array.isArray(
        configuracion,
      )
    ) {
      return configuracion as ConfiguracionTipoTarea;
    }

    return {};
  }

  private obtenerResponsable(
    configuracion:
      unknown,
  ): ResponsableEntregaGrupo {
    const datos =
      this.obtenerConfiguracion(
        configuracion,
      );

    if (
      datos.responsableEntregaGrupo ===
      'CUALQUIER_INTEGRANTE'
    ) {
      return 'CUALQUIER_INTEGRANTE';
    }

    return 'SOLO_REPRESENTANTE';
  }

  private obtenerLimitesAfinidad(
    configuracion:
      unknown,
  ) {
    const datos =
      this.obtenerConfiguracion(
        configuracion,
      );

    const minimoLeido =
      Number(
        datos.cantidadMinimaIntegrantes ??
        2,
      );

    const maximoLeido =
      Number(
        datos.cantidadMaximaIntegrantes ??
        100,
      );

    const minimo =
      Number.isFinite(
        minimoLeido,
      ) &&
      minimoLeido >
        0
        ? Math.floor(
            minimoLeido,
          )
        : 2;

    const maximoBase =
      Number.isFinite(
        maximoLeido,
      ) &&
      maximoLeido >
        0
        ? Math.floor(
            maximoLeido,
          )
        : 100;

    return {
      minimo,
      maximo:
        Math.max(
          minimo,
          maximoBase,
        ),
    };
  }

  /*
   * ============================================================
   * CONTEXTO INDIVIDUAL / GRUPAL
   * ============================================================
   */

  private async resolverContexto(
    usuario:
      UsuarioAutenticado,
    tarea:
      Awaited<
        ReturnType<
          TareasEntregasService['obtenerTarea']
        >
      >,
  ): Promise<ContextoEntrega> {
    if (
      tarea.modalidad ===
      ModalidadTarea.INDIVIDUAL
    ) {
      return {
        esGrupal:
          false,

        estudianteId:
          usuario.id,

        grupoCursoId:
          null,

        equipoAfinidadTareaId:
          null,

        puedeModificar:
          true,

        integrantesIds: [
          usuario.id,
        ],

        grupo:
          null,
      };
    }

    const responsable =
      this.obtenerResponsable(
        tarea.configuracionTipo,
      );

    /*
     * ==========================================================
     * GRUPOS DE PLATAFORMA
     * ==========================================================
     */
    if (
      tarea.origenGrupo ===
      OrigenGrupoTarea.PLATAFORMA
    ) {
      if (
        !tarea.conjuntoGrupoId
      ) {
        throw new BadRequestException(
          'La tarea grupal no tiene un conjunto de grupos configurado',
        );
      }

      const integrante =
        await this.prisma.integranteGrupoCurso.findFirst({
          where: {
            conjuntoId:
              tarea.conjuntoGrupoId,

            estudianteId:
              usuario.id,

            estaActivo:
              true,

            grupo: {
              estaActivo:
                true,
            },
          },

          select: {
            grupoId:
              true,

            esRepresentante:
              true,

            grupo: {
              select: {
                id:
                  true,

                nombre:
                  true,

                integrantes: {
                  where: {
                    estaActivo:
                      true,
                  },

                  orderBy: [
                    {
                      esRepresentante:
                        'desc',
                    },
                    {
                      estudiante: {
                        apellidoPaterno:
                          'asc',
                      },
                    },
                  ],

                  select: {
                    estudianteId:
                      true,

                    esRepresentante:
                      true,

                    estudiante: {
                      select: {
                        id:
                          true,

                        nombres:
                          true,

                        apellidoPaterno:
                          true,

                        apellidoMaterno:
                          true,

                        fotoPerfilUrl:
                          true,
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

      const integrantesIds =
        integrante.grupo.integrantes.map(
          (
            item,
          ) =>
            item.estudianteId,
        );

      if (
        integrantesIds.length ===
        0
      ) {
        throw new BadRequestException(
          'El grupo no tiene integrantes activos',
        );
      }

      return {
        esGrupal:
          true,

        estudianteId:
          null,

        grupoCursoId:
          integrante.grupoId,

        equipoAfinidadTareaId:
          null,

        puedeModificar:
          responsable ===
            'CUALQUIER_INTEGRANTE' ||
          integrante.esRepresentante,

        integrantesIds,

        grupo: {
          tipo:
            'PLATAFORMA',

          id:
            integrante.grupo.id,

          nombre:
            integrante.grupo.nombre,

          responsable,

          esRepresentanteActual:
            integrante.esRepresentante,

          representante:
            integrante.grupo.integrantes.find(
              (
                miembro,
              ) =>
                miembro.esRepresentante,
            )?.estudiante ??
            null,

          integrantes:
            integrante.grupo.integrantes,
        },
      };
    }

    /*
     * ==========================================================
     * EQUIPOS POR AFINIDAD
     * ==========================================================
     */
    if (
      tarea.origenGrupo ===
      OrigenGrupoTarea.AFINIDAD
    ) {
      const integrante =
        await this.prisma.integranteEquipoTarea.findFirst({
          where: {
            estudianteId:
              usuario.id,

            estaActivo:
              true,

            equipo: {
              tareaId:
                tarea.id,

              cursoId:
                tarea.cursoId,

              estaActivo:
                true,

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
            esRepresentante:
              true,

            equipoId:
              true,

            equipo: {
              select: {
                id:
                  true,

                nombre:
                  true,

                estado:
                  true,

                integrantes: {
                  where: {
                    estaActivo:
                      true,
                  },

                  orderBy: [
                    {
                      esRepresentante:
                        'desc',
                    },
                    {
                      estudiante: {
                        apellidoPaterno:
                          'asc',
                      },
                    },
                  ],

                  select: {
                    estudianteId:
                      true,

                    esRepresentante:
                      true,

                    estudiante: {
                      select: {
                        id:
                          true,

                        nombres:
                          true,

                        apellidoPaterno:
                          true,

                        apellidoMaterno:
                          true,

                        fotoPerfilUrl:
                          true,
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

      const integrantesIds =
        integrante.equipo.integrantes.map(
          (
            item,
          ) =>
            item.estudianteId,
        );

      const {
        minimo,
        maximo,
      } =
        this.obtenerLimitesAfinidad(
          tarea.configuracionTipo,
        );

      if (
        integrantesIds.length <
          minimo ||
        integrantesIds.length >
          maximo
      ) {
        const regla =
          minimo ===
          maximo
            ? `exactamente ${minimo}`
            : `entre ${minimo} y ${maximo}`;

        throw new BadRequestException(
          `El equipo debe tener ${regla} integrantes antes de realizar la entrega`,
        );
      }

      return {
        esGrupal:
          true,

        estudianteId:
          null,

        grupoCursoId:
          null,

        equipoAfinidadTareaId:
          integrante.equipoId,

        puedeModificar:
          responsable ===
            'CUALQUIER_INTEGRANTE' ||
          integrante.esRepresentante,

        integrantesIds,

        grupo: {
          tipo:
            'AFINIDAD',

          id:
            integrante.equipo.id,

          nombre:
            integrante.equipo.nombre,

          responsable,

          esRepresentanteActual:
            integrante.esRepresentante,

          representante:
            integrante.equipo.integrantes.find(
              (
                miembro,
              ) =>
                miembro.esRepresentante,
            )?.estudiante ??
            null,

          integrantes:
            integrante.equipo.integrantes,
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

  private validarPeriodo(
    tarea:
      Awaited<
        ReturnType<
          TareasEntregasService['obtenerTarea']
        >
      >,
  ) {
    if (
      tarea.tipo ===
      TipoTarea.PRESENCIAL
    ) {
      throw new BadRequestException(
        'Esta actividad presencial no admite una entrega digital del estudiante',
      );
    }

    const ahora =
      new Date();

    if (
      ahora <
      tarea.fechaApertura
    ) {
      throw new BadRequestException(
        'La tarea todavía no está abierta',
      );
    }

    if (
      tarea.estaCerrada
    ) {
      throw new BadRequestException(
        'La tarea está cerrada',
      );
    }

    const cierreEfectivo =
      tarea.permitirRetrasos
        ? tarea.fechaMaximaRetraso ??
          tarea.fechaCierre
        : tarea.fechaLimite;

    if (
      ahora >
      cierreEfectivo
    ) {
      throw new BadRequestException(
        'El período de entrega terminó',
      );
    }

    if (
      ahora >
        tarea.fechaLimite &&
      !tarea.permitirRetrasos
    ) {
      throw new BadRequestException(
        'La fecha límite de entrega ya venció',
      );
    }

    return ahora;
  }

  /*
   * ============================================================
   * BÚSQUEDA DE UNA ENTREGA
   * ============================================================
   */

  private construirWhereEntrega(
    tareaId:
      number,
    contexto:
      ContextoEntrega,
  ) {
    if (
      contexto.estudianteId
    ) {
      return {
        tareaId,

        estudianteId:
          contexto.estudianteId,

        estaActiva:
          true,
      };
    }

    if (
      contexto.grupoCursoId
    ) {
      return {
        tareaId,

        grupoCursoId:
          contexto.grupoCursoId,

        estaActiva:
          true,
      };
    }

    return {
      tareaId,

      equipoAfinidadTareaId:
        contexto.equipoAfinidadTareaId!,

      estaActiva:
        true,
    };
  }

  private async buscarEntrega(
    tareaId:
      number,
    contexto:
      ContextoEntrega,
  ) {
    return this.prisma.entregaTarea.findFirst({
      where:
        this.construirWhereEntrega(
          tareaId,
          contexto,
        ),

      include: {
        archivos: {
          where: {
            estaActivo:
              true,
          },

          orderBy: {
            creadoEn:
              'asc',
          },
        },

        autorEntrega: {
          select: {
            id:
              true,

            nombres:
              true,

            apellidoPaterno:
              true,
          },
        },
      },
    });
  }

  private asegurarPuedeModificar(
    contexto:
      ContextoEntrega,
  ) {
    if (
      !contexto.puedeModificar
    ) {
      throw new ForbiddenException(
        'Solo el representante del grupo puede registrar o modificar la entrega',
      );
    }
  }

  private asegurarEdicionPermitida(
    tarea:
      Awaited<
        ReturnType<
          TareasEntregasService['obtenerTarea']
        >
      >,
    entrega:
      Awaited<
        ReturnType<
          TareasEntregasService['buscarEntrega']
        >
      >,
  ) {
    if (!entrega) {
      return;
    }

    if (
      entrega.estado ===
        EstadoEntregaTarea.BLOQUEADA ||
      entrega.estado ===
        EstadoEntregaTarea.ANULADA
    ) {
      throw new BadRequestException(
        'La entrega ya no puede modificarse',
      );
    }

    if (
      entrega.enviadaEn &&
      !tarea.permitirEditarEntrega
    ) {
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
    tarea:
      Awaited<
        ReturnType<
          TareasEntregasService['obtenerTarea']
        >
      >,
    enviadaEn:
      Date,
  ) {
    if (
      enviadaEn <=
      tarea.fechaLimite
    ) {
      return {
        entregadaTarde:
          false,

        minutosRetraso:
          0,

        descuentoCalculado:
          0,
      };
    }

    const minutosRetraso =
      Math.max(
        1,
        Math.ceil(
          (
            enviadaEn.getTime() -
            tarea.fechaLimite.getTime()
          ) /
            60000,
        ),
      );

    const valor =
      Number(
        tarea.valorDescuentoRetraso ??
        0,
      );

    let descuento =
      0;

    switch (
      tarea.tipoDescuentoRetraso
    ) {
      case TipoDescuentoRetraso.PUNTOS_FIJOS:
      case TipoDescuentoRetraso.PORCENTAJE:
        descuento =
          valor;
        break;

      case TipoDescuentoRetraso.POR_HORA:
        descuento =
          Math.ceil(
            minutosRetraso /
            60,
          ) *
          valor;
        break;

      case TipoDescuentoRetraso.POR_DIA:
        descuento =
          Math.ceil(
            minutosRetraso /
            1440,
          ) *
          valor;
        break;

      case TipoDescuentoRetraso.NOTA_MAXIMA:
        descuento =
          Math.max(
            0,
            100 -
            valor,
          );
        break;

      default:
        descuento =
          0;
    }

    return {
      entregadaTarde:
        true,

      minutosRetraso,

      descuentoCalculado:
        Math.min(
          100,
          Math.max(
            0,
            descuento,
          ),
        ),
    };
  }

  /*
   * ============================================================
   * CALIFICACIONES
   * ============================================================
   */

  private async sincronizarCalificaciones(
    tarea:
      Awaited<
        ReturnType<
          TareasEntregasService['obtenerTarea']
        >
      >,
    entregaId:
      number,
    integrantesIds:
      number[],
    descuentoRetraso:
      number,
  ) {
    if (
      !tarea.esCalificable ||
      !tarea.actividadCalificable
    ) {
      return;
    }

    if (
      tarea.actividadCalificable.estado ===
      EstadoActividadCalificable.ANULADA
    ) {
      return;
    }

    await this.prisma.$transaction(
      integrantesIds.map(
        (
          estudianteId,
        ) =>
          this.prisma.calificacionEstudiante.upsert({
            where: {
              actividadId_estudianteId: {
                actividadId:
                  tarea.actividadCalificable!.id,

                estudianteId,
              },
            },

            create: {
              actividadId:
                tarea.actividadCalificable!.id,

              estudianteId,

              entregaTareaId:
                entregaId,

              descuentoRetraso,

              estado:
                EstadoCalificacion.PENDIENTE,
            },

            update: {
              entregaTareaId:
                entregaId,

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
                    estado:
                      EstadoCalificacion.PENDIENTE,
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
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    this.validarEstudiante(
      usuario,
    );

    await this.validarInscripcion(
      usuario.id,
      cursoId,
    );

    const tarea =
      await this.obtenerTarea(
        cursoId,
        tareaId,
      );

    const contexto =
      await this.resolverContexto(
        usuario,
        tarea,
      );

    const entrega =
      await this.buscarEntrega(
        tarea.id,
        contexto,
      );

    return {
      entrega,

      permisos: {
        puedeModificar:
          contexto.puedeModificar,

        esGrupal:
          contexto.esGrupal,
      },

      contextoGrupo:
        contexto.grupo,
    };
  }

  /*
   * ============================================================
   * ESTUDIANTE — PREPARAR / GUARDAR BORRADOR
   * ============================================================
   */

  async preparar(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
    datos:
      GuardarEntregaTareaDto,
  ) {
    this.validarEstudiante(
      usuario,
    );

    await this.validarInscripcion(
      usuario.id,
      cursoId,
    );

    const tarea =
      await this.obtenerTarea(
        cursoId,
        tareaId,
      );

    this.validarPeriodo(
      tarea,
    );

    const contexto =
      await this.resolverContexto(
        usuario,
        tarea,
      );

    this.asegurarPuedeModificar(
      contexto,
    );

    const existente =
      await this.buscarEntrega(
        tarea.id,
        contexto,
      );

    this.asegurarEdicionPermitida(
      tarea,
      existente,
    );

    if (
      existente
    ) {
      const actualizado =
        await this.prisma.entregaTarea.update({
          where: {
            id:
              existente.id,
          },

          data: {
            autorEntregaId:
              usuario.id,

            ...(datos.contenido !==
            undefined
              ? {
                  contenido:
                    datos.contenido,
                }
              : {}),

            /*
             * Una entrega enviada conserva su estado hasta que
             * vuelva a confirmarse. editadaEn deja trazabilidad
             * de la modificación.
             */
            ...(existente.enviadaEn
              ? {
                  editadaEn:
                    new Date(),
                }
              : {}),
          },

          include: {
            archivos: {
              where: {
                estaActivo:
                  true,
              },

              orderBy: {
                creadoEn:
                  'asc',
              },
            },
          },
        });

      return {
        mensaje:
          'Entrega preparada correctamente',

        entrega:
          actualizado,
      };
    }

    const creada =
      await this.prisma.entregaTarea.create({
        data: {
          tareaId:
            tarea.id,

          autorEntregaId:
            usuario.id,

          estudianteId:
            contexto.estudianteId,

          grupoCursoId:
            contexto.grupoCursoId,

          equipoAfinidadTareaId:
            contexto.equipoAfinidadTareaId,

          contenido:
            datos.contenido,

          esGrupal:
            contexto.esGrupal,

          estado:
            EstadoEntregaTarea.BORRADOR,
        },

        include: {
          archivos: {
            where: {
              estaActivo:
                true,
            },
          },
        },
      });

    return {
      mensaje:
        'Entrega preparada correctamente',

      entrega:
        creada,
    };
  }

  /*
   * ============================================================
   * ESTUDIANTE — ENVIAR ENTREGA OFICIAL
   * ============================================================
   */

  async enviar(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
    entregaId:
      number,
  ) {
    this.validarEstudiante(
      usuario,
    );

    await this.validarInscripcion(
      usuario.id,
      cursoId,
    );

    const tarea =
      await this.obtenerTarea(
        cursoId,
        tareaId,
      );

    const ahora =
      this.validarPeriodo(
        tarea,
      );

    const contexto =
      await this.resolverContexto(
        usuario,
        tarea,
      );

    this.asegurarPuedeModificar(
      contexto,
    );

    const entrega =
      await this.buscarEntrega(
        tarea.id,
        contexto,
      );

    if (
      !entrega ||
      entrega.id !==
        entregaId
    ) {
      throw new NotFoundException(
        'La entrega no existe o no pertenece a tu actividad',
      );
    }

    this.asegurarEdicionPermitida(
      tarea,
      entrega,
    );

    if (
      tarea.exigirContenidoEditor &&
      !entrega.contenido?.trim()
    ) {
      throw new BadRequestException(
        'Debes completar el contenido de la entrega',
      );
    }

    if (
      tarea.exigirArchivo &&
      entrega.archivos.length ===
        0
    ) {
      throw new BadRequestException(
        'Debes adjuntar al menos un archivo',
      );
    }

    if (
      entrega.archivos.length >
      tarea.maximoArchivos
    ) {
      throw new BadRequestException(
        `La tarea permite como máximo ${tarea.maximoArchivos} archivo(s)`,
      );
    }

    const retraso =
      this.calcularRetraso(
        tarea,
        ahora,
      );

    const actualizada =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          const guardada =
            await tx.entregaTarea.update({
              where: {
                id:
                  entrega.id,
              },

              data: {
                autorEntregaId:
                  usuario.id,

                estado:
                  retraso.entregadaTarde
                    ? EstadoEntregaTarea.TARDIA
                    : EstadoEntregaTarea.ENTREGADA,

                entregadaTarde:
                  retraso.entregadaTarde,

                minutosRetraso:
                  retraso.minutosRetraso,

                descuentoCalculado:
                  retraso.descuentoCalculado,

                enviadaEn:
                  ahora,

                editadaEn:
                  entrega.enviadaEn
                    ? ahora
                    : null,
              },

              include: {
                archivos: {
                  where: {
                    estaActivo:
                      true,
                  },

                  orderBy: {
                    creadoEn:
                      'asc',
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
          if (
            contexto.equipoAfinidadTareaId
          ) {
            await tx.equipoAfinidadTarea.update({
              where: {
                id:
                  contexto.equipoAfinidadTareaId,
              },

              data: {
                estado:
                  EstadoEquipoAfinidadTarea.BLOQUEADO,

                bloqueadoEn:
                  ahora,
              },
            });
          }

          return guardada;
        },
      );

    await this.sincronizarCalificaciones(
      tarea,
      actualizada.id,
      contexto.integrantesIds,
      retraso.descuentoCalculado,
    );

    return {
      mensaje:
        retraso.entregadaTarde
          ? 'Tarea entregada con retraso'
          : 'Tarea entregada correctamente',

      entrega:
        actualizada,
    };
  }

  /*
   * ============================================================
   * DOCENTE — LISTAR ENTREGAS
   * ============================================================
   */

  async listarDocente(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    tareaId:
      number,
  ) {
    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Solo el docente puede revisar las entregas',
      );
    }

    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id:
            cursoId,
        },

        select: {
          docenteId:
            true,
        },
      });

    if (
      !curso ||
      curso.docenteId !==
        usuario.id
    ) {
      throw new ForbiddenException(
        'No tienes acceso a este curso',
      );
    }

    const tarea =
      await this.prisma.tareaCurso.findFirst({
        where: {
          id:
            tareaId,

          cursoId,

          estaActiva:
            true,
        },

        select: {
          id:
            true,
        },
      });

    if (!tarea) {
      throw new NotFoundException(
        'La tarea no existe',
      );
    }

    const entregas =
      await this.prisma.entregaTarea.findMany({
        where: {
          tareaId,

          estaActiva:
            true,
        },

        include: {
          autorEntrega: {
            select: {
              id:
                true,

              nombres:
                true,

              apellidoPaterno:
                true,
            },
          },

          estudiante: {
            select: {
              id:
                true,

              nombres:
                true,

              apellidoPaterno:
                true,
            },
          },

          grupoCurso: {
            select: {
              id:
                true,

              nombre:
                true,
            },
          },

          equipoAfinidadTarea: {
            select: {
              id:
                true,

              nombre:
                true,

              estado:
                true,

              integrantes: {
                where: {
                  estaActivo:
                    true,
                },

                select: {
                  esRepresentante:
                    true,

                  estudiante: {
                    select: {
                      id:
                        true,

                      nombres:
                        true,

                      apellidoPaterno:
                        true,
                    },
                  },
                },
              },
            },
          },

          archivos: {
            where: {
              estaActivo:
                true,
            },

            orderBy: {
              creadoEn:
                'asc',
            },
          },
        },

        orderBy: [
          {
            enviadaEn:
              'desc',
          },
          {
            creadoEn:
              'desc',
          },
        ],
      });

    return {
      total:
        entregas.length,

      entregas,
    };
  }
}
