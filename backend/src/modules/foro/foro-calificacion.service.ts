import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccionHistorialCalificacion,
  AccionHistorialForo,
  EstadoActividadCalificable,
  EstadoCalificacion,
  EstadoForo,
  ModalidadNotaForo,
  ModalidadParticipacionForo,
  OrigenGrupoForo,
  Prisma,
  Rol,
  TipoEvaluacionForo,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { GuardarCalificacionForoDto } from './dto/guardar-calificacion-foro.dto';

import { ForoReglasService } from './foro-reglas.service';

import { GuardarCriterioRubricaForoDto } from './dto/guardar-criterio-rubrica-foro.dto';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

@Injectable()
export class ForoCalificacionService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly reglas: ForoReglasService,
  ) {}

  private validarDocente(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException('Solo el docente puede calificar el foro');
    }
  }

  private limitarNota(valor: number) {
    return Math.max(0, Math.min(100, valor));
  }

  private calcularNotaFinal(
    notaBase: number,
    descuentoRetraso: number,
    descuentoComentarios: number,
    ajusteIndividual: number,
  ) {
    return this.limitarNota(
      this.limitarNota(notaBase) -
        Math.max(0, descuentoRetraso) -
        Math.max(0, descuentoComentarios) +
        ajusteIndividual,
    );
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
        actividadCalificable: {
          include: {
            rubrica: {
              include: {
                criterios: {
                  where: {
                    estaActivo: true,
                  },

                  orderBy: {
                    orden: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!foro) {
      throw new NotFoundException(
        'El foro no existe o no pertenece al docente autenticado',
      );
    }

    if (!foro.actividadCalificable) {
      throw new BadRequestException(
        'El foro no tiene una actividad calificable asociada',
      );
    }

    return foro;
  }

  private validarEstadoCalificable(estado: EstadoForo) {
    const permitidos: EstadoForo[] = [
      EstadoForo.CERRADO,
      EstadoForo.CALIFICANDO,
      EstadoForo.CALIFICADO,
    ];

    if (!permitidos.includes(estado)) {
      throw new BadRequestException(
        'El foro debe estar cerrado o en proceso de calificación',
      );
    }
  }

  private validarPeriodoRetrasoFinalizado(foro: {
    estado: EstadoForo;
    permitirRetrasos: boolean;
    fechaLimite: Date | null;
    fechaMaximaRetraso: Date | null;
    fechaCierre: Date | null;
  }) {
    /*
     * Si el docente cerró el foro manualmente, el estado persistido
     * prevalece sobre una fecha futura de retraso. Desde CERRADO,
     * CALIFICANDO o CALIFICADO ya no se aceptan nuevas entregas y
     * la evaluación puede modificarse mientras las notas no estén
     * publicadas.
     */
    if (
      foro.estado === EstadoForo.CERRADO ||
      foro.estado === EstadoForo.CALIFICANDO ||
      foro.estado === EstadoForo.CALIFICADO
    ) {
      return;
    }

    if (!foro.permitirRetrasos) {
      return;
    }

    const ahora = new Date();

    const cierreEfectivo =
      foro.fechaMaximaRetraso ?? foro.fechaCierre ?? foro.fechaLimite;

    if (cierreEfectivo && ahora <= cierreEfectivo) {
      throw new BadRequestException(
        'El periodo de entregas con retraso todavía está abierto. Podrás calificar cuando finalice el cierre definitivo.',
      );
    }
  }

  private async validarEstudianteCurso(cursoId: number, estudianteId: number) {
    const inscripcion = await this.prisma.inscripcionCurso.findFirst({
      where: {
        cursoId,

        estudianteId,

        estado: 'ACTIVA',
      },

      select: {
        id: true,
      },
    });

    if (!inscripcion) {
      throw new BadRequestException(
        'El estudiante no tiene una inscripción activa en el curso',
      );
    }
  }

  private async obtenerRespuestaEstudiante(
    foroId: number,
    estudianteId: number,
  ) {
    return this.prisma.respuestaForoCurso.findFirst({
      where: {
        temaId: foroId,

        estaActiva: true,

        OR: [
          {
            autorId: estudianteId,
          },
          {
            grupoCurso: {
              integrantes: {
                some: {
                  estudianteId,

                  estaActivo: true,
                },
              },
            },
          },
          {
            equipoAfinidad: {
              integrantes: {
                some: {
                  estudianteId,

                  estaActivo: true,
                },
              },
            },
          },
        ],
      },

      orderBy: {
        publicadoEn: 'asc',
      },
    });
  }

  private calcularBaseMixta(
    foro: {
      modalidadNota: ModalidadNotaForo;
      porcentajeNotaGrupal: Prisma.Decimal | null;
      porcentajeNotaIndividual: Prisma.Decimal | null;
    },
    notaGrupal: number,
    notaIndividual: number,
  ) {
    if (foro.modalidadNota !== ModalidadNotaForo.GRUPAL_E_INDIVIDUAL) {
      return this.limitarNota(notaGrupal);
    }

    const porcentajeGrupal =
      foro.porcentajeNotaGrupal !== null
        ? Number(foro.porcentajeNotaGrupal)
        : 50;

    const porcentajeIndividual =
      foro.porcentajeNotaIndividual !== null
        ? Number(foro.porcentajeNotaIndividual)
        : 100 - porcentajeGrupal;

    return this.limitarNota(
      (this.limitarNota(notaGrupal) * porcentajeGrupal +
        this.limitarNota(notaIndividual) * porcentajeIndividual) /
        100,
    );
  }

  private obtenerDescuentoRetraso(
    respuesta: {
      descuentoCalculado?: Prisma.Decimal | null;
    } | null,
    respaldo = 0,
  ) {
    if (
      respuesta?.descuentoCalculado !== undefined &&
      respuesta.descuentoCalculado !== null
    ) {
      return Math.max(0, Number(respuesta.descuentoCalculado));
    }

    return Math.max(0, respaldo);
  }

  private async obtenerContextoGrupo(
    foro: any,
    origen: string,
    grupoId: number,
  ) {
    if (foro.modalidadParticipacion !== ModalidadParticipacionForo.GRUPAL) {
      throw new BadRequestException(
        'Este foro no utiliza participación grupal',
      );
    }

    if (origen === OrigenGrupoForo.PLATAFORMA) {
      if (
        foro.origenGrupo !== OrigenGrupoForo.PLATAFORMA ||
        !foro.conjuntoGrupoId
      ) {
        throw new BadRequestException(
          'El foro no utiliza grupos de plataforma',
        );
      }

      const grupo = await this.prisma.grupoCurso.findFirst({
        where: {
          id: grupoId,
          conjuntoId: foro.conjuntoGrupoId,
          estaActivo: true,
        },
        include: {
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
                  correo: true,
                  fotoPerfilUrl: true,
                },
              },
            },
          },
        },
      });

      if (!grupo) {
        throw new NotFoundException(
          'El grupo no existe o no pertenece a este foro',
        );
      }

      const respuesta = await this.prisma.respuestaForoCurso.findFirst({
        where: {
          temaId: foro.id,
          grupoCursoId: grupo.id,
          estaActiva: true,
        },
        orderBy: {
          publicadoEn: 'asc',
        },
      });

      return {
        origen: OrigenGrupoForo.PLATAFORMA,
        grupo: {
          id: grupo.id,
          nombre: grupo.nombre,
          color: grupo.color ?? null,
        },
        integrantes: grupo.integrantes,
        respuesta,
      };
    }

    if (origen === OrigenGrupoForo.AFINIDAD) {
      if (foro.origenGrupo !== OrigenGrupoForo.AFINIDAD) {
        throw new BadRequestException('El foro no utiliza grupos por afinidad');
      }

      const equipo = await this.prisma.equipoAfinidadForo.findFirst({
        where: {
          id: grupoId,
          temaId: foro.id,
          estaActivo: true,
        },
        include: {
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
                  correo: true,
                  fotoPerfilUrl: true,
                },
              },
            },
          },
        },
      });

      if (!equipo) {
        throw new NotFoundException(
          'El equipo no existe o no pertenece a este foro',
        );
      }

      const respuesta = await this.prisma.respuestaForoCurso.findFirst({
        where: {
          temaId: foro.id,
          equipoAfinidadId: equipo.id,
          estaActiva: true,
        },
        orderBy: {
          publicadoEn: 'asc',
        },
      });

      return {
        origen: OrigenGrupoForo.AFINIDAD,
        grupo: {
          id: equipo.id,
          nombre: equipo.nombre,
          color: null,
        },
        integrantes: equipo.integrantes,
        respuesta,
      };
    }

    throw new BadRequestException('Origen de grupo no válido');
  }

  private async actualizarEstadoCalificacion(
    tx: Prisma.TransactionClient,
    foro: any,
  ) {
    if (foro.estado === EstadoForo.CERRADO) {
      await tx.temaForoCurso.update({
        where: {
          id: foro.id,
        },
        data: {
          estado: EstadoForo.CALIFICANDO,
        },
      });

      await tx.actividadCalificable.update({
        where: {
          id: foro.actividadCalificable!.id,
        },
        data: {
          estado: EstadoActividadCalificable.CALIFICANDO,
        },
      });
    }
  }

  async obtenerPanel(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    const estudiantes = await this.prisma.inscripcionCurso.findMany({
      where: {
        cursoId,
        estado: 'ACTIVA',
        estudiante: {
          estaActivo: true,
          rol: Rol.ESTUDIANTE,
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
    });

    const respuestas = await this.prisma.respuestaForoCurso.findMany({
      where: {
        temaId: foro.id,
        estaActiva: true,
      },
      include: {
        autor: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            fotoPerfilUrl: true,
          },
        },
        grupoCurso: {
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
        },
        equipoAfinidad: {
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
        },
        _count: {
          select: {
            comentarios: true,
            archivos: true,
          },
        },
      },
    });

    const comentarios = await this.prisma.comentarioRespuestaForo.findMany({
      where: {
        estaActivo: true,
        estaOculto: false,
        respuesta: {
          temaId: foro.id,
          estaActiva: true,
        },
      },
      orderBy: {
        publicadoEn: 'asc',
      },
      include: {
        autor: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            fotoPerfilUrl: true,
          },
        },
        respuesta: {
          select: {
            id: true,
            grupoCursoId: true,
            equipoAfinidadId: true,
            grupoCurso: {
              select: {
                id: true,
                nombre: true,
              },
            },
            equipoAfinidad: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        _count: {
          select: {
            archivos: true,
          },
        },
      },
    });

    const calificaciones = await this.prisma.calificacionEstudiante.findMany({
      where: {
        actividadId: foro.actividadCalificable!.id,
      },
    });

    /*
     * Para foros con grupos de PLATAFORMA, la composición oficial
     * proviene del conjunto asignado al foro y no de las respuestas.
     * Así también aparecen en calificaciones los grupos que aún no
     * publicaron una respuesta principal.
     */
    const gruposPlataforma =
      foro.modalidadParticipacion === ModalidadParticipacionForo.GRUPAL &&
      foro.origenGrupo === OrigenGrupoForo.PLATAFORMA &&
      foro.conjuntoGrupoId
        ? await this.prisma.grupoCurso.findMany({
            where: {
              conjuntoId: foro.conjuntoGrupoId,
              estaActivo: true,
            },
            orderBy: {
              orden: 'asc',
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
          })
        : [];

    const grupoPlataformaPorEstudiante = new Map<
      number,
      (typeof gruposPlataforma)[number]
    >();

    for (const grupo of gruposPlataforma) {
      for (const integrante of grupo.integrantes) {
        grupoPlataformaPorEstudiante.set(integrante.estudianteId, grupo);
      }
    }

    const porEstudiante = await Promise.all(
      estudiantes.map(async (registro) => {
        const estudiante = registro.estudiante;

        const grupoPlataformaAsignado =
          grupoPlataformaPorEstudiante.get(estudiante.id) ?? null;

        const respuesta =
          respuestas.find(
            (item) =>
              item.autorId === estudiante.id ||
              (grupoPlataformaAsignado &&
                item.grupoCursoId === grupoPlataformaAsignado.id) ||
              item.grupoCurso?.integrantes.some(
                (integrante) => integrante.estudianteId === estudiante.id,
              ) ||
              item.equipoAfinidad?.integrantes.some(
                (integrante) => integrante.estudianteId === estudiante.id,
              ),
          ) ?? null;

        const calificacion =
          calificaciones.find((item) => item.estudianteId === estudiante.id) ??
          null;

        const integrantePlataforma =
          grupoPlataformaAsignado?.integrantes.find(
            (integrante) => integrante.estudianteId === estudiante.id,
          ) ??
          respuesta?.grupoCurso?.integrantes.find(
            (integrante) => integrante.estudianteId === estudiante.id,
          );

        const integranteAfinidad = respuesta?.equipoAfinidad?.integrantes.find(
          (integrante) => integrante.estudianteId === estudiante.id,
        );

        const esRepresentante = Boolean(
          integrantePlataforma?.esRepresentante ??
          integranteAfinidad?.esRepresentante,
        );

        const grupo = grupoPlataformaAsignado
          ? {
              id: grupoPlataformaAsignado.id,
              nombre: grupoPlataformaAsignado.nombre,
              color: grupoPlataformaAsignado.color ?? null,
              origen: 'PLATAFORMA',
            }
          : respuesta?.grupoCurso
            ? {
                id: respuesta.grupoCurso.id,
                nombre: respuesta.grupoCurso.nombre,
                color: respuesta.grupoCurso.color ?? null,
                origen: 'PLATAFORMA',
              }
            : respuesta?.equipoAfinidad
              ? {
                  id: respuesta.equipoAfinidad.id,
                  nombre: respuesta.equipoAfinidad.nombre,
                  color: null,
                  origen: 'AFINIDAD',
                }
              : null;

        const notaGrupal = calificacion ? Number(calificacion.notaBase) : 0;

        const notaIndividual =
          foro.modalidadNota === ModalidadNotaForo.GRUPAL_E_INDIVIDUAL &&
          calificacion
            ? Number(calificacion.ajusteIndividual)
            : null;

        const baseParaComentarios =
          foro.modalidadNota === ModalidadNotaForo.GRUPAL_E_INDIVIDUAL
            ? this.calcularBaseMixta(foro, notaGrupal, notaIndividual ?? 0)
            : calificacion
              ? Number(calificacion.notaBase)
              : 100;

        const evaluacionComentarios =
          await this.reglas.evaluarComentariosParaCalificacion(
            foro.id,
            estudiante.id,
            baseParaComentarios,
          );

        const comentariosAutor = comentarios.filter(
          (comentario) => comentario.autorId === estudiante.id,
        );

        const comentariosValidosDetalle = comentariosAutor.filter(
          (comentario) => {
            if (
              !evaluacionComentarios.aplicaRequisito ||
              evaluacionComentarios.esRepresentante ||
              !grupo
            ) {
              return true;
            }

            if (foro.dinamicaGrupal === 'PARTICIPACION_DISTRIBUIDA') {
              return grupo.origen === 'PLATAFORMA'
                ? comentario.respuesta.grupoCursoId === grupo.id
                : comentario.respuesta.equipoAfinidadId === grupo.id;
            }

            if (foro.dinamicaGrupal === 'COLABORACION_ABIERTA') {
              return grupo.origen === 'PLATAFORMA'
                ? comentario.respuesta.grupoCursoId !== grupo.id
                : comentario.respuesta.equipoAfinidadId !== grupo.id;
            }

            return true;
          },
        );

        const calificacionPanel = calificacion
          ? {
              ...calificacion,
              notaGrupal:
                foro.modalidadNota === ModalidadNotaForo.INDIVIDUAL
                  ? null
                  : Number(calificacion.notaBase),
              notaIndividual:
                foro.modalidadNota === ModalidadNotaForo.GRUPAL_E_INDIVIDUAL
                  ? Number(calificacion.ajusteIndividual)
                  : null,
            }
          : null;

        return {
          estudiante,
          respuesta,
          grupo,
          esRepresentante,
          calificacion: calificacionPanel,
          estado: calificacion?.estado ?? EstadoCalificacion.PENDIENTE,
          entregadaTarde: respuesta?.entregadaTarde ?? false,
          tieneRespuesta: Boolean(respuesta),
          participacionComentarios: {
            aplicaRequisito: evaluacionComentarios.aplicaRequisito,
            esRepresentante:
              evaluacionComentarios.esRepresentante || esRepresentante,
            comentariosValidos: evaluacionComentarios.comentariosValidos,
            minimoRequerido: evaluacionComentarios.minimoRequerido,
            cumplio: evaluacionComentarios.cumplio,
            penalizacionConfigurada:
              evaluacionComentarios.penalizacionConfigurada,
            descuentoComentarios: calificacion
              ? Number(calificacion.descuentoComentarios)
              : evaluacionComentarios.descuentoComentarios,
            comentarios: comentariosValidosDetalle.map((comentario) => ({
              id: comentario.id,
              contenido: comentario.contenido,
              publicadoEn: comentario.publicadoEn,
              autor: comentario.autor,
              respuesta: {
                id: comentario.respuesta.id,
                grupoId:
                  comentario.respuesta.grupoCursoId ??
                  comentario.respuesta.equipoAfinidadId ??
                  null,
                grupoNombre:
                  comentario.respuesta.grupoCurso?.nombre ??
                  comentario.respuesta.equipoAfinidad?.nombre ??
                  null,
              },
              archivos: comentario._count.archivos,
            })),
          },
        };
      }),
    );

    const pendientes = porEstudiante.filter(
      (item) =>
        item.estado === EstadoCalificacion.PENDIENTE ||
        item.estado === EstadoCalificacion.BORRADOR,
    ).length;

    const calificadas = porEstudiante.filter(
      (item) =>
        item.estado === EstadoCalificacion.CALIFICADA ||
        item.estado === EstadoCalificacion.PUBLICADA,
    ).length;

    const tardias = porEstudiante.filter((item) => item.entregadaTarde).length;

    const sinRespuesta = porEstudiante.filter(
      (item) => !item.tieneRespuesta,
    ).length;

    return {
      foro: {
        id: foro.id,
        titulo: foro.titulo,
        estado: foro.estado,
        tipoEvaluacion: foro.tipoEvaluacion,
        modalidadNota: foro.modalidadNota,
        modalidadParticipacion: foro.modalidadParticipacion,
        origenGrupo: foro.origenGrupo,
        dinamicaGrupal: foro.dinamicaGrupal,
        requiereRepresentante: foro.requiereRepresentante,
        porcentajeNotaGrupal:
          foro.porcentajeNotaGrupal !== null
            ? Number(foro.porcentajeNotaGrupal)
            : null,
        porcentajeNotaIndividual:
          foro.porcentajeNotaIndividual !== null
            ? Number(foro.porcentajeNotaIndividual)
            : null,
        permitirRetrasos: foro.permitirRetrasos,
        tipoDescuentoRetraso: foro.tipoDescuentoRetraso,
        valorDescuentoRetraso: foro.valorDescuentoRetraso
          ? Number(foro.valorDescuentoRetraso)
          : null,
        penalizarIncumplimientoComentarios:
          foro.penalizarIncumplimientoComentarios,
        tipoPenalizacionComentarios: foro.tipoPenalizacionComentarios,
        valorPenalizacionComentarios: foro.valorPenalizacionComentarios
          ? Number(foro.valorPenalizacionComentarios)
          : null,
        minimoComentariosPorEstudiante: foro.minimoComentariosPorEstudiante,
        fechaLimite: foro.fechaLimite,
        fechaMaximaRetraso: foro.fechaMaximaRetraso,
        fechaCierre: foro.fechaCierre,
      },
      actividad: {
        id: foro.actividadCalificable!.id,
        componente: foro.actividadCalificable!.componente,
        estado: foro.actividadCalificable!.estado,
        puntajeMaximo: Number(foro.actividadCalificable!.puntajeMaximo),
      },
      resumen: {
        totalEstudiantes: porEstudiante.length,
        pendientes,
        calificadas,
        tardias,
        sinRespuesta,
      },
      estudiantes: porEstudiante,
    };
  }

  async guardarCalificacion(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    estudianteId: number,
    datos: GuardarCalificacionForoDto,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    this.validarEstadoCalificable(foro.estado);

    this.validarPeriodoRetrasoFinalizado(foro);

    if (foro.modalidadNota === ModalidadNotaForo.GRUPAL) {
      throw new BadRequestException(
        'La nota de este foro es grupal. Califica el grupo una sola vez.',
      );
    }

    await this.validarEstudianteCurso(cursoId, estudianteId);

    const respuesta = await this.obtenerRespuestaEstudiante(
      foro.id,
      estudianteId,
    );

    const calificacionActual =
      await this.prisma.calificacionEstudiante.findUnique({
        where: {
          actividadId_estudianteId: {
            actividadId: foro.actividadCalificable!.id,
            estudianteId,
          },
        },
      });

    const descuentoRetraso = this.obtenerDescuentoRetraso(
      respuesta,
      calificacionActual
        ? Number(calificacionActual.descuentoRetraso)
        : (datos.descuentoRetraso ?? 0),
    );

    const esMixta =
      foro.modalidadNota === ModalidadNotaForo.GRUPAL_E_INDIVIDUAL;

    const notaGrupal = esMixta
      ? calificacionActual
        ? Number(calificacionActual.notaBase)
        : datos.notaBase
      : datos.notaBase;

    const notaIndividual = esMixta
      ? (datos.notaIndividual ?? datos.ajusteIndividual ?? 0)
      : 0;

    const baseAcademica = esMixta
      ? this.calcularBaseMixta(foro, notaGrupal, notaIndividual)
      : datos.notaBase;

    const evaluacionComentarios =
      await this.reglas.evaluarComentariosParaCalificacion(
        foro.id,
        estudianteId,
        baseAcademica,
      );

    const descuentoComentarios = evaluacionComentarios.descuentoComentarios;

    const ajusteReal = esMixta ? 0 : (datos.ajusteIndividual ?? 0);

    const notaFinal = this.calcularNotaFinal(
      baseAcademica,
      descuentoRetraso,
      descuentoComentarios,
      ajusteReal,
    );

    const calificacion = await this.prisma.$transaction(async (tx) => {
      const ahora = new Date();

      const registro = await tx.calificacionEstudiante.upsert({
        where: {
          actividadId_estudianteId: {
            actividadId: foro.actividadCalificable!.id,
            estudianteId,
          },
        },
        create: {
          actividadId: foro.actividadCalificable!.id,
          estudianteId,
          calificadorId: usuario.id,
          respuestaForoId: respuesta?.id ?? null,
          grupoCursoId: respuesta?.grupoCursoId ?? null,
          equipoAfinidadId: respuesta?.equipoAfinidadId ?? null,
          notaBase: new Prisma.Decimal(esMixta ? notaGrupal : datos.notaBase),
          descuentoRetraso: new Prisma.Decimal(descuentoRetraso),
          descuentoComentarios: new Prisma.Decimal(descuentoComentarios),
          ajusteIndividual: new Prisma.Decimal(
            esMixta ? notaIndividual : ajusteReal,
          ),
          notaFinal: new Prisma.Decimal(notaFinal),
          retroalimentacion: datos.retroalimentacion?.trim() || null,
          estado: EstadoCalificacion.CALIFICADA,
          calificadaEn: ahora,
        },
        update: {
          calificadorId: usuario.id,
          respuestaForoId: respuesta?.id ?? null,
          grupoCursoId: respuesta?.grupoCursoId ?? null,
          equipoAfinidadId: respuesta?.equipoAfinidadId ?? null,
          notaBase: new Prisma.Decimal(esMixta ? notaGrupal : datos.notaBase),
          descuentoRetraso: new Prisma.Decimal(descuentoRetraso),
          descuentoComentarios: new Prisma.Decimal(descuentoComentarios),
          ajusteIndividual: new Prisma.Decimal(
            esMixta ? notaIndividual : ajusteReal,
          ),
          notaFinal: new Prisma.Decimal(notaFinal),
          retroalimentacion: datos.retroalimentacion?.trim() || null,
          estado: EstadoCalificacion.CALIFICADA,
          calificadaEn: ahora,
          publicadaEn: null,
          anuladaEn: null,
        },
      });

      await tx.historialCalificacion.create({
        data: {
          actividadId: foro.actividadCalificable!.id,
          calificacionId: registro.id,
          actorId: usuario.id,
          accion: AccionHistorialCalificacion.CALIFICACION_ACTUALIZADA,
          detalle: {
            foroId: foro.id,
            estudianteId,
            modalidadNota: foro.modalidadNota,
            notaBase: datos.notaBase,
            notaGrupal: esMixta ? notaGrupal : null,
            notaIndividual: esMixta ? notaIndividual : null,
            baseAcademica,
            descuentoRetraso,
            descuentoComentarios,
            comentariosValidos: evaluacionComentarios.comentariosValidos,
            minimoComentariosRequerido: evaluacionComentarios.minimoRequerido,
            ajusteIndividual: esMixta ? 0 : ajusteReal,
            notaFinal,
          },
        },
      });

      await tx.historialForoCurso.create({
        data: {
          temaId: foro.id,
          respuestaId: respuesta?.id ?? null,
          actorId: usuario.id,
          accion: AccionHistorialForo.CALIFICACION_GUARDADA,
          detalle: {
            estudianteId,
            calificacionId: registro.id,
            modalidadNota: foro.modalidadNota,
            notaFinal,
          },
        },
      });

      await this.actualizarEstadoCalificacion(tx, foro);

      return registro;
    });

    return {
      mensaje: esMixta
        ? 'Componente individual guardado correctamente'
        : 'Calificación guardada correctamente',
      calificacion,
    };
  }

  async guardarCalificacionGrupo(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    origen: string,
    grupoId: number,
    datos: GuardarCalificacionForoDto,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    this.validarEstadoCalificable(foro.estado);

    this.validarPeriodoRetrasoFinalizado(foro);

    if (
      foro.modalidadNota !== ModalidadNotaForo.GRUPAL &&
      foro.modalidadNota !== ModalidadNotaForo.GRUPAL_E_INDIVIDUAL
    ) {
      throw new BadRequestException(
        'Este foro no utiliza una modalidad de nota grupal',
      );
    }

    const contexto = await this.obtenerContextoGrupo(foro, origen, grupoId);

    if (contexto.integrantes.length === 0) {
      throw new BadRequestException('El grupo no tiene integrantes activos');
    }

    const esMixta =
      foro.modalidadNota === ModalidadNotaForo.GRUPAL_E_INDIVIDUAL;

    const resultado = await this.prisma.$transaction(async (tx) => {
      const ahora = new Date();

      const actualizadas: Prisma.CalificacionEstudianteGetPayload<{}>[] = [];

      for (const integrante of contexto.integrantes) {
        const estudianteId = integrante.estudianteId;

        const actual = await tx.calificacionEstudiante.findUnique({
          where: {
            actividadId_estudianteId: {
              actividadId: foro.actividadCalificable!.id,
              estudianteId,
            },
          },
        });

        const notaIndividual =
          esMixta && actual ? Number(actual.ajusteIndividual) : 0;

        const baseAcademica = esMixta
          ? this.calcularBaseMixta(foro, datos.notaBase, notaIndividual)
          : datos.notaBase;

        const evaluacionComentarios =
          await this.reglas.evaluarComentariosParaCalificacion(
            foro.id,
            estudianteId,
            baseAcademica,
            tx,
          );

        const descuentoComentarios = evaluacionComentarios.descuentoComentarios;

        const descuentoRetraso = this.obtenerDescuentoRetraso(
          contexto.respuesta,
          actual ? Number(actual.descuentoRetraso) : 0,
        );

        const ajuste = esMixta
          ? 0
          : actual
            ? Number(actual.ajusteIndividual)
            : 0;

        const notaFinal = this.calcularNotaFinal(
          baseAcademica,
          descuentoRetraso,
          descuentoComentarios,
          ajuste,
        );

        const estado = esMixta
          ? actual?.estado === EstadoCalificacion.CALIFICADA ||
            actual?.estado === EstadoCalificacion.PUBLICADA
            ? EstadoCalificacion.CALIFICADA
            : EstadoCalificacion.BORRADOR
          : EstadoCalificacion.CALIFICADA;

        const registro = await tx.calificacionEstudiante.upsert({
          where: {
            actividadId_estudianteId: {
              actividadId: foro.actividadCalificable!.id,
              estudianteId,
            },
          },
          create: {
            actividadId: foro.actividadCalificable!.id,
            estudianteId,
            calificadorId: usuario.id,
            respuestaForoId: contexto.respuesta?.id ?? null,
            grupoCursoId:
              contexto.origen === OrigenGrupoForo.PLATAFORMA
                ? contexto.grupo.id
                : null,
            equipoAfinidadId:
              contexto.origen === OrigenGrupoForo.AFINIDAD
                ? contexto.grupo.id
                : null,
            notaBase: new Prisma.Decimal(datos.notaBase),
            descuentoRetraso: new Prisma.Decimal(descuentoRetraso),
            descuentoComentarios: new Prisma.Decimal(descuentoComentarios),
            ajusteIndividual: new Prisma.Decimal(
              esMixta ? notaIndividual : ajuste,
            ),
            notaFinal: new Prisma.Decimal(notaFinal),
            retroalimentacion:
              datos.retroalimentacion?.trim() ||
              actual?.retroalimentacion ||
              null,
            estado,
            calificadaEn:
              estado === EstadoCalificacion.CALIFICADA ? ahora : null,
          },
          update: {
            calificadorId: usuario.id,
            respuestaForoId: contexto.respuesta?.id ?? null,
            grupoCursoId:
              contexto.origen === OrigenGrupoForo.PLATAFORMA
                ? contexto.grupo.id
                : null,
            equipoAfinidadId:
              contexto.origen === OrigenGrupoForo.AFINIDAD
                ? contexto.grupo.id
                : null,
            notaBase: new Prisma.Decimal(datos.notaBase),
            descuentoRetraso: new Prisma.Decimal(descuentoRetraso),
            descuentoComentarios: new Prisma.Decimal(descuentoComentarios),
            ajusteIndividual: new Prisma.Decimal(
              esMixta ? notaIndividual : ajuste,
            ),
            notaFinal: new Prisma.Decimal(notaFinal),
            retroalimentacion:
              datos.retroalimentacion?.trim() ||
              actual?.retroalimentacion ||
              null,
            estado,
            calificadaEn:
              estado === EstadoCalificacion.CALIFICADA ? ahora : null,
            publicadaEn: null,
            anuladaEn: null,
          },
        });

        await tx.historialCalificacion.create({
          data: {
            actividadId: foro.actividadCalificable!.id,
            calificacionId: registro.id,
            actorId: usuario.id,
            accion: AccionHistorialCalificacion.CALIFICACION_ACTUALIZADA,
            detalle: {
              foroId: foro.id,
              estudianteId,
              grupoId: contexto.grupo.id,
              origenGrupo: contexto.origen,
              modalidadNota: foro.modalidadNota,
              notaGrupal: datos.notaBase,
              notaIndividual: esMixta ? notaIndividual : null,
              baseAcademica,
              descuentoRetraso,
              descuentoComentarios,
              comentariosValidos: evaluacionComentarios.comentariosValidos,
              minimoComentariosRequerido: evaluacionComentarios.minimoRequerido,
              notaFinal,
            },
          },
        });

        actualizadas.push(registro);
      }

      await tx.historialForoCurso.create({
        data: {
          temaId: foro.id,
          respuestaId: contexto.respuesta?.id ?? null,
          actorId: usuario.id,
          accion: AccionHistorialForo.CALIFICACION_GUARDADA,
          detalle: {
            grupal: true,
            grupoId: contexto.grupo.id,
            grupoNombre: contexto.grupo.nombre,
            origenGrupo: contexto.origen,
            modalidadNota: foro.modalidadNota,
            notaGrupal: datos.notaBase,
            cantidadIntegrantes: contexto.integrantes.length,
            reemplazaNotaGrupalAnterior: true,
            integrantes: contexto.integrantes.map(
              (integrante) => integrante.estudianteId,
            ),
          },
        },
      });

      await this.actualizarEstadoCalificacion(tx, foro);

      return actualizadas;
    });

    return {
      mensaje: esMixta
        ? 'Componente grupal actualizado para todos los integrantes. Se conservaron los componentes individuales y se recalcularon las notas finales.'
        : 'Nota grupal actualizada correctamente para todos los integrantes. La nota anterior fue reemplazada y se recalcularon las penalizaciones individuales.',
      grupo: contexto.grupo,
      calificaciones: resultado,
    };
  }

  async guardarCriterioRubrica(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    estudianteId: number,
    criterioId: number,
    datos: GuardarCriterioRubricaForoDto,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    this.validarEstadoCalificable(foro.estado);

    if (foro.tipoEvaluacion !== TipoEvaluacionForo.RUBRICA) {
      throw new BadRequestException(
        'Este foro no utiliza evaluación por rúbrica',
      );
    }

    const criterio = foro.actividadCalificable!.rubrica?.criterios.find(
      (item) => item.id === criterioId,
    );

    if (!criterio) {
      throw new NotFoundException(
        'El criterio no pertenece a la rúbrica del foro',
      );
    }

    if (datos.puntajeObtenido > Number(criterio.puntajeMaximo)) {
      throw new BadRequestException(
        `El puntaje no puede superar ${criterio.puntajeMaximo}`,
      );
    }

    const calificacion = await this.prisma.calificacionEstudiante.findUnique({
      where: {
        actividadId_estudianteId: {
          actividadId: foro.actividadCalificable!.id,

          estudianteId,
        },
      },
    });

    if (!calificacion) {
      throw new BadRequestException(
        'Primero debes crear la calificación del estudiante',
      );
    }

    const evaluacion = await this.prisma.evaluacionCriterioRubrica.upsert({
      where: {
        calificacionId_criterioId: {
          calificacionId: calificacion.id,

          criterioId: criterio.id,
        },
      },

      create: {
        calificacionId: calificacion.id,

        criterioId: criterio.id,

        puntajeObtenido: new Prisma.Decimal(datos.puntajeObtenido),

        observacion: datos.observacion?.trim() || null,
      },

      update: {
        puntajeObtenido: new Prisma.Decimal(datos.puntajeObtenido),

        observacion: datos.observacion?.trim() || null,
      },
    });

    const evaluaciones = await this.prisma.evaluacionCriterioRubrica.findMany({
      where: {
        calificacionId: calificacion.id,
      },

      select: {
        puntajeObtenido: true,
      },
    });

    const notaBase = evaluaciones.reduce(
      (suma, item) => suma + Number(item.puntajeObtenido),
      0,
    );

    const notaFinal = this.limitarNota(
      notaBase -
        Number(calificacion.descuentoRetraso) -
        Number(calificacion.descuentoComentarios) +
        Number(calificacion.ajusteIndividual),
    );

    await this.prisma.calificacionEstudiante.update({
      where: {
        id: calificacion.id,
      },

      data: {
        notaBase: new Prisma.Decimal(notaBase),

        notaFinal: new Prisma.Decimal(notaFinal),

        estado: EstadoCalificacion.CALIFICADA,

        calificadaEn: new Date(),
      },
    });

    return {
      mensaje: 'Criterio de rúbrica guardado correctamente',

      evaluacion,

      notaBase,

      notaFinal,
    };
  }

  async obtenerCalificacionEstudiante(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    estudianteId: number,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    const calificacion = await this.prisma.calificacionEstudiante.findUnique({
      where: {
        actividadId_estudianteId: {
          actividadId: foro.actividadCalificable!.id,

          estudianteId,
        },
      },

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

        respuestaForo: {
          include: {
            archivos: {
              where: {
                estaActivo: true,
              },
            },

            comentarios: {
              where: {
                estaActivo: true,

                estaOculto: false,
              },

              include: {
                autor: {
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

        evaluacionesCriterios: {
          include: {
            criterio: true,
          },
        },
      },
    });

    if (!calificacion) {
      throw new NotFoundException(
        'El estudiante todavía no tiene una calificación registrada',
      );
    }

    return calificacion;
  }
}
