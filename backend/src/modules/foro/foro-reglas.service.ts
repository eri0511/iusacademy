import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DinamicaGrupalForo,
  EstadoForo,
  EstadoInscripcion,
  EstadoRespuestaForo,
  ModalidadParticipacionForo,
  OrigenGrupoForo,
  Prisma,
  Rol,
  TipoDescuentoRetraso,
  TipoPenalizacionComentarios,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

@Injectable()
export class ForoReglasService {
  constructor(private readonly prisma: PrismaService) {}

  contarPalabras(contenido: string) {
    return contenido.trim().split(/\s+/).filter(Boolean).length;
  }

  validarCantidadPalabras(
    contenido: string,
    minimo: number | null,
    maximo: number | null,
    tipo: 'respuesta' | 'comentario',
  ) {
    const total = this.contarPalabras(contenido);

    if (minimo !== null && total < minimo) {
      throw new BadRequestException(
        `El ${tipo} debe tener al menos ${minimo} palabras`,
      );
    }

    if (maximo !== null && total > maximo) {
      throw new BadRequestException(
        `El ${tipo} no puede superar ${maximo} palabras`,
      );
    }

    return total;
  }

  async validarInscripcion(usuario: UsuarioAutenticado, cursoId: number) {
    if (usuario.rol !== Rol.ESTUDIANTE) {
      throw new ForbiddenException('Esta acción corresponde a un estudiante');
    }

    const inscripcion = await this.prisma.inscripcionCurso.findFirst({
      where: {
        cursoId,
        estudianteId: usuario.id,
        estado: EstadoInscripcion.ACTIVA,
        estudiante: {
          estaActivo: true,
        },
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

    return inscripcion;
  }

  async obtenerForo(cursoId: number, foroId: number) {
    const foro = await this.prisma.temaForoCurso.findFirst({
      where: {
        id: foroId,
        cursoId,
        estaActivo: true,
      },

      include: {
        actividadCalificable: true,
      },
    });

    if (!foro) {
      throw new NotFoundException('El foro no existe');
    }

    return foro;
  }

  validarForoDisponible(
    foro: {
      estado: EstadoForo;

      estaCerrado: boolean;

      fechaApertura: Date | null;

      fechaLimite: Date | null;

      fechaCierre: Date | null;

      permitirRetrasos: boolean;

      fechaMaximaRetraso: Date | null;
    },
    ahora = new Date(),
  ) {
    if (
      foro.estado === EstadoForo.BORRADOR ||
      foro.estado === EstadoForo.PROGRAMADO ||
      foro.estado === EstadoForo.ANULADO
    ) {
      throw new BadRequestException('El foro todavía no está disponible');
    }

    if (foro.fechaApertura && ahora < foro.fechaApertura) {
      throw new BadRequestException('El foro todavía no ha iniciado');
    }

    const estadosCerrados: EstadoForo[] = [
      EstadoForo.CERRADO,
      EstadoForo.CALIFICANDO,
      EstadoForo.CALIFICADO,
      EstadoForo.NOTAS_PUBLICADAS,
    ];

    if (foro.estaCerrado || estadosCerrados.includes(foro.estado)) {
      throw new BadRequestException('El foro está cerrado');
    }

    const limiteFinal = foro.permitirRetrasos
      ? (foro.fechaMaximaRetraso ?? foro.fechaCierre)
      : (foro.fechaLimite ?? foro.fechaCierre);

    if (limiteFinal && ahora > limiteFinal) {
      throw new BadRequestException(
        'El plazo para participar en el foro terminó',
      );
    }
  }

  calcularRetraso(
    foro: {
      fechaLimite: Date | null;

      permitirRetrasos: boolean;

      tipoDescuentoRetraso: TipoDescuentoRetraso;

      valorDescuentoRetraso: Prisma.Decimal | null;
    },
    fecha: Date,
  ) {
    if (!foro.fechaLimite || fecha <= foro.fechaLimite) {
      return {
        entregadaTarde: false,
        minutosRetraso: 0,
        descuento: 0,
      };
    }

    if (!foro.permitirRetrasos) {
      throw new BadRequestException('El foro no permite respuestas tardías');
    }

    const minutos = Math.max(
      1,
      Math.ceil((fecha.getTime() - foro.fechaLimite.getTime()) / 60000),
    );

    const valor = foro.valorDescuentoRetraso
      ? Number(foro.valorDescuentoRetraso)
      : 0;

    let descuento = 0;

    switch (foro.tipoDescuentoRetraso) {
      case TipoDescuentoRetraso.PUNTOS_FIJOS:
        descuento = valor;
        break;

      case TipoDescuentoRetraso.PORCENTAJE:
        descuento = valor;
        break;

      case TipoDescuentoRetraso.POR_HORA:
        descuento = Math.ceil(minutos / 60) * valor;
        break;

      case TipoDescuentoRetraso.POR_DIA:
        descuento = Math.ceil(minutos / 1440) * valor;
        break;

      case TipoDescuentoRetraso.NOTA_MAXIMA:
        descuento = Math.max(0, 100 - valor);
        break;

      default:
        descuento = 0;
    }

    return {
      entregadaTarde: true,
      minutosRetraso: minutos,
      descuento: Math.min(100, Math.max(0, descuento)),
    };
  }

  obtenerEstadoRespuesta(entregadaTarde: boolean) {
    return entregadaTarde
      ? EstadoRespuestaForo.TARDIA
      : EstadoRespuestaForo.PUBLICADA;
  }

  validarModalidadIds(
    foro: {
      modalidadParticipacion: ModalidadParticipacionForo;

      origenGrupo: OrigenGrupoForo;
    },
    grupoCursoId: number | undefined,
    equipoAfinidadId: number | undefined,
  ) {
    if (foro.modalidadParticipacion === ModalidadParticipacionForo.INDIVIDUAL) {
      if (grupoCursoId || equipoAfinidadId) {
        throw new BadRequestException(
          'Un foro individual no acepta identificadores de grupo',
        );
      }

      return;
    }

    if (foro.origenGrupo === OrigenGrupoForo.PLATAFORMA && !grupoCursoId) {
      throw new BadRequestException('Debes seleccionar tu grupo de plataforma');
    }

    if (foro.origenGrupo === OrigenGrupoForo.AFINIDAD && !equipoAfinidadId) {
      throw new BadRequestException('Debes seleccionar tu equipo por afinidad');
    }
  }

  async obtenerGrupoPlataforma(
    foro: {
      conjuntoGrupoId: number | null;

      requiereRepresentante: boolean;

      dinamicaGrupal: DinamicaGrupalForo;
    },
    grupoCursoId: number,
    estudianteId: number,
    exigirRepresentante = false,
  ) {
    if (!foro.conjuntoGrupoId) {
      throw new BadRequestException(
        'El foro no tiene un conjunto de grupos configurado',
      );
    }

    const grupo = await this.prisma.grupoCurso.findFirst({
      where: {
        id: grupoCursoId,
        conjuntoId: foro.conjuntoGrupoId,
        estaActivo: true,
        integrantes: {
          some: {
            estudianteId,
            estaActivo: true,
          },
        },
      },

      include: {
        integrantes: {
          where: {
            estaActivo: true,
          },

          select: {
            estudianteId: true,
            esRepresentante: true,
          },
        },
      },
    });

    if (!grupo) {
      throw new ForbiddenException('No perteneces al grupo seleccionado');
    }

    const integrante = grupo.integrantes.find(
      (item) => item.estudianteId === estudianteId,
    );

    /*
     * En IusAcademy una actividad grupal siempre tiene
     * una sola respuesta principal por grupo.
     *
     * REPRESENTANTE_UNICO:
     *   solo el representante responde.
     *
     * PARTICIPACION_DISTRIBUIDA:
     *   el representante responde y los integrantes
     *   complementan mediante comentarios de su grupo.
     *
     * COLABORACION_ABIERTA:
     *   el representante responde y los integrantes
     *   comentan respuestas de OTROS grupos, no la propia.
     *
     * Por ello la creación/borrador/publicación de la
     * respuesta principal siempre exige representante.
     */
    if (exigirRepresentante && !integrante?.esRepresentante) {
      throw new ForbiddenException(
        'Solo el representante del grupo puede publicar la respuesta principal',
      );
    }

    return grupo;
  }

  async obtenerEquipoAfinidad(
    foroId: number,
    equipoId: number,
    estudianteId: number,
    requiereRepresentante: boolean,
    dinamica: DinamicaGrupalForo,
    exigirRepresentante = false,
  ) {
    const equipo = await this.prisma.equipoAfinidadForo.findFirst({
      where: {
        id: equipoId,
        temaId: foroId,
        estaActivo: true,
        estado: {
          in: ['APROBADO', 'BLOQUEADO'],
        },
        integrantes: {
          some: {
            estudianteId,
            estaActivo: true,
          },
        },
      },

      include: {
        integrantes: {
          where: {
            estaActivo: true,
          },

          select: {
            estudianteId: true,
            esRepresentante: true,
          },
        },
      },
    });

    if (!equipo) {
      throw new ForbiddenException(
        'No perteneces a un equipo aprobado para este foro',
      );
    }

    const integrante = equipo.integrantes.find(
      (item) => item.estudianteId === estudianteId,
    );

    if (exigirRepresentante && !integrante?.esRepresentante) {
      throw new ForbiddenException(
        'Solo el representante del equipo puede publicar la respuesta principal',
      );
    }

    return equipo;
  }

  async validarPermisoComentarioGrupal(
    foro: {
      id: number;

      modalidadParticipacion: ModalidadParticipacionForo;

      origenGrupo: OrigenGrupoForo;

      dinamicaGrupal: DinamicaGrupalForo;

      conjuntoGrupoId: number | null;
    },
    respuesta: {
      grupoCursoId: number | null;

      equipoAfinidadId: number | null;
    },
    estudianteId: number,
  ) {
    if (foro.modalidadParticipacion === ModalidadParticipacionForo.INDIVIDUAL) {
      return;
    }

    if (foro.dinamicaGrupal === DinamicaGrupalForo.NINGUNA) {
      throw new ForbiddenException(
        'El foro no tiene una dinámica grupal válida',
      );
    }

    if (foro.origenGrupo === OrigenGrupoForo.PLATAFORMA) {
      if (!foro.conjuntoGrupoId || !respuesta.grupoCursoId) {
        throw new ForbiddenException(
          'La respuesta no pertenece a un grupo válido del foro',
        );
      }

      const grupoEstudiante = await this.prisma.grupoCurso.findFirst({
        where: {
          conjuntoId: foro.conjuntoGrupoId,
          estaActivo: true,
          integrantes: {
            some: {
              estudianteId,
              estaActivo: true,
            },
          },
        },

        include: {
          integrantes: {
            where: {
              estudianteId,
              estaActivo: true,
            },

            select: {
              esRepresentante: true,
            },
          },
        },
      });

      if (!grupoEstudiante) {
        throw new ForbiddenException('No perteneces a un grupo de este foro');
      }

      if (foro.dinamicaGrupal === DinamicaGrupalForo.REPRESENTANTE_UNICO) {
        throw new ForbiddenException(
          'En esta dinámica la participación se realiza únicamente mediante la respuesta principal del representante',
        );
      }

      if (
        foro.dinamicaGrupal === DinamicaGrupalForo.PARTICIPACION_DISTRIBUIDA
      ) {
        if (grupoEstudiante.id !== respuesta.grupoCursoId) {
          throw new ForbiddenException(
            'Solo puedes comentar la respuesta principal de tu propio grupo',
          );
        }

        return;
      }

      if (foro.dinamicaGrupal === DinamicaGrupalForo.COLABORACION_ABIERTA) {
        /*
         * Colaboración abierta en IusAcademy:
         * los integrantes participan comentando respuestas
         * principales de OTROS grupos.
         *
         * La respuesta principal del grupo propio ya representa
         * la participación interna de ese equipo, por lo que no
         * se habilitan comentarios sobre ella en esta dinámica.
         */
        if (grupoEstudiante.id === respuesta.grupoCursoId) {
          throw new ForbiddenException(
            'En colaboración abierta debes comentar respuestas de otros grupos',
          );
        }

        return;
      }

      throw new ForbiddenException(
        'No tienes permiso para comentar esta respuesta',
      );
    }

    if (foro.origenGrupo === OrigenGrupoForo.AFINIDAD) {
      if (!respuesta.equipoAfinidadId) {
        throw new ForbiddenException(
          'La respuesta no pertenece a un equipo por afinidad válido',
        );
      }

      const equipoEstudiante = await this.prisma.equipoAfinidadForo.findFirst({
        where: {
          temaId: foro.id,
          estaActivo: true,
          estado: {
            in: ['APROBADO', 'BLOQUEADO'],
          },
          integrantes: {
            some: {
              estudianteId,
              estaActivo: true,
            },
          },
        },

        include: {
          integrantes: {
            where: {
              estudianteId,
              estaActivo: true,
            },

            select: {
              esRepresentante: true,
            },
          },
        },
      });

      if (!equipoEstudiante) {
        throw new ForbiddenException(
          'No perteneces a un equipo por afinidad de este foro',
        );
      }

      if (foro.dinamicaGrupal === DinamicaGrupalForo.REPRESENTANTE_UNICO) {
        throw new ForbiddenException(
          'En esta dinámica la participación se realiza únicamente mediante la respuesta principal del representante',
        );
      }

      if (
        foro.dinamicaGrupal === DinamicaGrupalForo.PARTICIPACION_DISTRIBUIDA
      ) {
        if (equipoEstudiante.id !== respuesta.equipoAfinidadId) {
          throw new ForbiddenException(
            'Solo puedes comentar la respuesta principal de tu propio equipo',
          );
        }

        return;
      }

      if (foro.dinamicaGrupal === DinamicaGrupalForo.COLABORACION_ABIERTA) {
        if (equipoEstudiante.id === respuesta.equipoAfinidadId) {
          throw new ForbiddenException(
            'En colaboración abierta debes comentar respuestas de otros equipos',
          );
        }

        return;
      }

      throw new ForbiddenException(
        'No tienes permiso para comentar esta respuesta',
      );
    }

    throw new ForbiddenException(
      'El foro grupal no tiene un origen de grupo válido',
    );
  }

  async evaluarComentariosParaCalificacion(
    foroId: number,
    estudianteId: number,
    notaBase: number,
    transaccion?: Prisma.TransactionClient,
  ) {
    const cliente = transaccion ?? this.prisma;

    const foro = await cliente.temaForoCurso.findUnique({
      where: { id: foroId },
      select: {
        id: true,
        modalidadParticipacion: true,
        origenGrupo: true,
        dinamicaGrupal: true,
        conjuntoGrupoId: true,
        minimoComentariosPorEstudiante: true,
        penalizarIncumplimientoComentarios: true,
        tipoPenalizacionComentarios: true,
        valorPenalizacionComentarios: true,
      },
    });

    const base = {
      aplicaRequisito: false,
      esRepresentante: false,
      comentariosValidos: 0,
      minimoRequerido: 0,
      cumplio: true,
      penalizacionConfigurada: false,
      descuentoComentarios: 0,
    };

    if (
      !foro ||
      foro.modalidadParticipacion !== ModalidadParticipacionForo.GRUPAL ||
      foro.minimoComentariosPorEstudiante <= 0 ||
      (foro.dinamicaGrupal !== DinamicaGrupalForo.PARTICIPACION_DISTRIBUIDA &&
        foro.dinamicaGrupal !== DinamicaGrupalForo.COLABORACION_ABIERTA)
    ) {
      return base;
    }

    let grupoCursoId: number | null = null;
    let equipoAfinidadId: number | null = null;
    let esRepresentante = false;

    if (
      foro.origenGrupo === OrigenGrupoForo.PLATAFORMA &&
      foro.conjuntoGrupoId
    ) {
      const grupo = await cliente.grupoCurso.findFirst({
        where: {
          conjuntoId: foro.conjuntoGrupoId,
          estaActivo: true,
          integrantes: {
            some: { estudianteId, estaActivo: true },
          },
        },
        select: {
          id: true,
          integrantes: {
            where: { estudianteId, estaActivo: true },
            select: { esRepresentante: true },
          },
        },
      });

      if (!grupo) return base;

      grupoCursoId = grupo.id;
      esRepresentante = Boolean(grupo.integrantes[0]?.esRepresentante);
    } else if (foro.origenGrupo === OrigenGrupoForo.AFINIDAD) {
      const equipo = await cliente.equipoAfinidadForo.findFirst({
        where: {
          temaId: foro.id,
          estaActivo: true,
          estado: { in: ['APROBADO', 'BLOQUEADO'] },
          integrantes: {
            some: { estudianteId, estaActivo: true },
          },
        },
        select: {
          id: true,
          integrantes: {
            where: { estudianteId, estaActivo: true },
            select: { esRepresentante: true },
          },
        },
      });

      if (!equipo) return base;

      equipoAfinidadId = equipo.id;
      esRepresentante = Boolean(equipo.integrantes[0]?.esRepresentante);
    } else {
      return base;
    }

    if (esRepresentante) {
      return {
        ...base,
        esRepresentante: true,
        minimoRequerido: foro.minimoComentariosPorEstudiante,
      };
    }

    const filtroRespuesta =
      foro.dinamicaGrupal === DinamicaGrupalForo.PARTICIPACION_DISTRIBUIDA
        ? foro.origenGrupo === OrigenGrupoForo.PLATAFORMA
          ? { grupoCursoId }
          : { equipoAfinidadId }
        : foro.origenGrupo === OrigenGrupoForo.PLATAFORMA
          ? { grupoCursoId: { not: grupoCursoId } }
          : { equipoAfinidadId: { not: equipoAfinidadId } };

    const comentariosValidos = await cliente.comentarioRespuestaForo.count({
      where: {
        autorId: estudianteId,
        estaActivo: true,
        estaOculto: false,
        respuesta: {
          temaId: foro.id,
          estaActiva: true,
          estado: { not: EstadoRespuestaForo.ANULADA },
          ...filtroRespuesta,
        },
      },
    });

    const cumplio = comentariosValidos >= foro.minimoComentariosPorEstudiante;

    const penalizacionConfigurada =
      foro.penalizarIncumplimientoComentarios &&
      foro.tipoPenalizacionComentarios !==
        TipoPenalizacionComentarios.NINGUNA &&
      foro.valorPenalizacionComentarios !== null;

    let descuentoComentarios = 0;

    if (!cumplio && penalizacionConfigurada) {
      const valor = Number(foro.valorPenalizacionComentarios);

      descuentoComentarios =
        foro.tipoPenalizacionComentarios ===
        TipoPenalizacionComentarios.PORCENTAJE
          ? (Math.max(0, notaBase) * valor) / 100
          : valor;
    }

    return {
      aplicaRequisito: true,
      esRepresentante: false,
      comentariosValidos,
      minimoRequerido: foro.minimoComentariosPorEstudiante,
      cumplio,
      penalizacionConfigurada,
      descuentoComentarios: Math.max(0, Math.min(100, descuentoComentarios)),
    };
  }
}
