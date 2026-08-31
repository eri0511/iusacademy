import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccionHistorialForo,
  EstadoCalificacion,
  EstadoRespuestaForo,
  ModalidadParticipacionForo,
  OrigenGrupoForo,
  Prisma,
  Rol,
  TipoEvaluacionForo,
  VisibilidadRespuestasForo,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { ActualizarRespuestaForoDto } from './dto/actualizar-respuesta-foro.dto';

import { CrearRespuestaForoDto } from './dto/crear-respuesta-foro.dto';

import { GuardarBorradorRespuestaForoDto } from './dto/guardar-borrador-respuesta-foro.dto';

import { ForoReglasService } from './foro-reglas.service';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

@Injectable()
export class ForoRespuestasService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly reglas: ForoReglasService,
  ) {}

  private async resolverParticipacion(
    usuario: UsuarioAutenticado,
    foro: Awaited<ReturnType<ForoReglasService['obtenerForo']>>,
    grupoCursoId?: number,
    equipoAfinidadId?: number,
  ) {
    this.reglas.validarModalidadIds(foro, grupoCursoId, equipoAfinidadId);

    if (foro.modalidadParticipacion === ModalidadParticipacionForo.INDIVIDUAL) {
      return {
        grupoCursoId: null,
        equipoAfinidadId: null,
        estudiantesIds: [usuario.id],
      };
    }

    if (foro.origenGrupo === OrigenGrupoForo.PLATAFORMA) {
      const grupo = await this.reglas.obtenerGrupoPlataforma(
        foro,
        grupoCursoId!,
        usuario.id,
        true,
      );

      return {
        grupoCursoId: grupo.id,
        equipoAfinidadId: null,
        estudiantesIds: grupo.integrantes.map(
          (integrante) => integrante.estudianteId,
        ),
      };
    }

    const equipo = await this.reglas.obtenerEquipoAfinidad(
      foro.id,
      equipoAfinidadId!,
      usuario.id,
      foro.requiereRepresentante,
      foro.dinamicaGrupal,
      true,
    );

    return {
      grupoCursoId: null,
      equipoAfinidadId: equipo.id,
      estudiantesIds: equipo.integrantes.map(
        (integrante) => integrante.estudianteId,
      ),
    };
  }

  private construirFiltroParticipacion(
    usuarioId: number,
    grupoCursoId: number | null,
    equipoAfinidadId: number | null,
  ): Prisma.RespuestaForoCursoWhereInput {
    if (grupoCursoId) {
      return {
        grupoCursoId,
      };
    }

    if (equipoAfinidadId) {
      return {
        equipoAfinidadId,
      };
    }

    return {
      autorId: usuarioId,
    };
  }

  async guardarBorrador(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: GuardarBorradorRespuestaForoDto,
  ) {
    await this.reglas.validarInscripcion(usuario, cursoId);

    const foro = await this.reglas.obtenerForo(cursoId, foroId);

    this.reglas.validarForoDisponible(foro);

    const participacion = await this.resolverParticipacion(
      usuario,
      foro,
      datos.grupoCursoId,
      datos.equipoAfinidadId,
    );

    const filtroParticipacion = this.construirFiltroParticipacion(
      usuario.id,
      participacion.grupoCursoId,
      participacion.equipoAfinidadId,
    );

    const respuestaPublicada = await this.prisma.respuestaForoCurso.findFirst({
      where: {
        temaId: foro.id,
        estaActiva: true,
        ...filtroParticipacion,
        estado: {
          notIn: [EstadoRespuestaForo.BORRADOR, EstadoRespuestaForo.ANULADA],
        },
      },
      select: {
        id: true,
      },
    });

    if (respuestaPublicada) {
      throw new BadRequestException(
        'Ya existe una respuesta publicada para esta participación',
      );
    }

    const borradorExistente = await this.prisma.respuestaForoCurso.findFirst({
      where: {
        temaId: foro.id,
        estaActiva: true,
        estado: EstadoRespuestaForo.BORRADOR,
        ...filtroParticipacion,
      },
    });

    const titulo = datos.titulo?.trim() ?? borradorExistente?.titulo ?? '';

    const contenido =
      datos.contenido?.trim() ?? borradorExistente?.contenido ?? '';

    if (
      foro.palabrasMaximasRespuesta !== null &&
      this.reglas.contarPalabras(contenido) > foro.palabrasMaximasRespuesta
    ) {
      throw new BadRequestException(
        `El borrador no puede superar ${foro.palabrasMaximasRespuesta} palabras`,
      );
    }

    const borrador = await this.prisma.$transaction(async (transaccion) => {
      const registro = borradorExistente
        ? await transaccion.respuestaForoCurso.update({
            where: {
              id: borradorExistente.id,
            },
            data: {
              titulo,
              contenido,
              editadoEn: new Date(),
            },
          })
        : await transaccion.respuestaForoCurso.create({
            data: {
              temaId: foro.id,
              autorId: usuario.id,
              grupoCursoId: participacion.grupoCursoId,
              equipoAfinidadId: participacion.equipoAfinidadId,
              titulo,
              contenido,
              estado: EstadoRespuestaForo.BORRADOR,
              esRespuestaGrupal:
                foro.modalidadParticipacion ===
                ModalidadParticipacionForo.GRUPAL,
              entregadaTarde: false,
              minutosRetraso: 0,
              descuentoCalculado: new Prisma.Decimal(0),
              publicadoEn: null,
            },
          });

      await transaccion.historialForoCurso.create({
        data: {
          temaId: foro.id,
          respuestaId: registro.id,
          actorId: usuario.id,
          accion: AccionHistorialForo.BORRADOR_GUARDADO,
          detalle: {
            actualizado: Boolean(borradorExistente),
          },
        },
      });

      return registro;
    });

    return {
      mensaje: 'Borrador guardado correctamente',
      respuesta: borrador,
    };
  }

  async obtenerMiBorrador(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    await this.reglas.validarInscripcion(usuario, cursoId);

    await this.reglas.obtenerForo(cursoId, foroId);

    const borrador = await this.prisma.respuestaForoCurso.findFirst({
      where: {
        temaId: foroId,
        estado: EstadoRespuestaForo.BORRADOR,
        estaActiva: true,
        OR: [
          {
            autorId: usuario.id,
          },
          {
            grupoCurso: {
              integrantes: {
                some: {
                  estudianteId: usuario.id,
                  estaActivo: true,
                },
              },
            },
          },
          {
            equipoAfinidad: {
              integrantes: {
                some: {
                  estudianteId: usuario.id,
                  estaActivo: true,
                },
              },
            },
          },
        ],
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
      borrador,
    };
  }

  private async crearCalificacionAutomatica(
    transaccion: Prisma.TransactionClient,
    foro: {
      id: number;

      actividadCalificable: {
        id: number;
      } | null;

      tipoEvaluacion: TipoEvaluacionForo;

      calificacionAutomaticaAlCumplir: boolean;

      minimoComentariosPorEstudiante: number;
    },
    respuestaId: number,
    grupoCursoId: number | null,
    equipoAfinidadId: number | null,
    estudiantesIds: number[],
    descuento: number,
  ) {
    if (
      !foro.actividadCalificable ||
      (foro.tipoEvaluacion !== TipoEvaluacionForo.AUTOMATICA &&
        !foro.calificacionAutomaticaAlCumplir)
    ) {
      return;
    }

    for (const estudianteId of estudiantesIds) {
      const evaluacionComentarios =
        await this.reglas.evaluarComentariosParaCalificacion(
          foro.id,
          estudianteId,
          100,
          transaccion,
        );

      if (
        evaluacionComentarios.aplicaRequisito &&
        !evaluacionComentarios.esRepresentante &&
        !evaluacionComentarios.cumplio
      ) {
        continue;
      }

      const notaFinal = Math.max(0, 100 - descuento);

      await transaccion.calificacionEstudiante.upsert({
        where: {
          actividadId_estudianteId: {
            actividadId: foro.actividadCalificable.id,
            estudianteId,
          },
        },

        create: {
          actividadId: foro.actividadCalificable.id,
          estudianteId,
          respuestaForoId: respuestaId,
          grupoCursoId,
          equipoAfinidadId,
          notaBase: new Prisma.Decimal(100),
          descuentoRetraso: new Prisma.Decimal(descuento),
          descuentoComentarios: new Prisma.Decimal(0),
          ajusteIndividual: new Prisma.Decimal(0),
          notaFinal: new Prisma.Decimal(notaFinal),
          estado: EstadoCalificacion.CALIFICADA,
          calificadaEn: new Date(),
        },

        update: {
          respuestaForoId: respuestaId,
          grupoCursoId,
          equipoAfinidadId,
          notaBase: new Prisma.Decimal(100),
          descuentoRetraso: new Prisma.Decimal(descuento),
          descuentoComentarios: new Prisma.Decimal(0),
          notaFinal: new Prisma.Decimal(notaFinal),
          estado: EstadoCalificacion.CALIFICADA,
          calificadaEn: new Date(),
          publicadaEn: null,
        },
      });
    }
  }

  async crear(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: CrearRespuestaForoDto,
  ) {
    await this.reglas.validarInscripcion(usuario, cursoId);

    const foro = await this.reglas.obtenerForo(cursoId, foroId);

    this.reglas.validarForoDisponible(foro);

    this.reglas.validarCantidadPalabras(
      datos.contenido,
      foro.palabrasMinimasRespuesta,
      foro.palabrasMaximasRespuesta,
      'respuesta',
    );

    this.reglas.validarModalidadIds(
      foro,
      datos.grupoCursoId,
      datos.equipoAfinidadId,
    );

    const ahora = new Date();

    const retraso = this.reglas.calcularRetraso(foro, ahora);

    let grupoCursoId: number | null = null;

    let equipoAfinidadId: number | null = null;

    let estudiantesIds: number[] = [usuario.id];

    if (
      foro.modalidadParticipacion === ModalidadParticipacionForo.GRUPAL &&
      foro.origenGrupo === OrigenGrupoForo.PLATAFORMA
    ) {
      const grupo = await this.reglas.obtenerGrupoPlataforma(
        foro,
        datos.grupoCursoId!,
        usuario.id,
        true,
      );

      grupoCursoId = grupo.id;

      estudiantesIds = grupo.integrantes.map(
        (integrante) => integrante.estudianteId,
      );

      const existente = await this.prisma.respuestaForoCurso.findFirst({
        where: {
          temaId: foro.id,
          grupoCursoId: grupo.id,
          estaActiva: true,
          estado: {
            not: EstadoRespuestaForo.ANULADA,
          },
        },

        select: {
          id: true,
        },
      });

      if (existente) {
        throw new BadRequestException(
          'Tu grupo ya publicó una respuesta principal',
        );
      }
    }

    if (
      foro.modalidadParticipacion === ModalidadParticipacionForo.GRUPAL &&
      foro.origenGrupo === OrigenGrupoForo.AFINIDAD
    ) {
      const equipo = await this.reglas.obtenerEquipoAfinidad(
        foro.id,
        datos.equipoAfinidadId!,
        usuario.id,
        foro.requiereRepresentante,
        foro.dinamicaGrupal,
        true,
      );

      equipoAfinidadId = equipo.id;

      estudiantesIds = equipo.integrantes.map(
        (integrante) => integrante.estudianteId,
      );

      const existente = await this.prisma.respuestaForoCurso.findFirst({
        where: {
          temaId: foro.id,
          equipoAfinidadId: equipo.id,
          estaActiva: true,
          estado: {
            not: EstadoRespuestaForo.ANULADA,
          },
        },

        select: {
          id: true,
        },
      });

      if (existente) {
        throw new BadRequestException(
          'Tu equipo ya publicó una respuesta principal',
        );
      }
    }

    if (foro.modalidadParticipacion === ModalidadParticipacionForo.INDIVIDUAL) {
      const existente = await this.prisma.respuestaForoCurso.findFirst({
        where: {
          temaId: foro.id,
          autorId: usuario.id,
          estaActiva: true,
          estado: {
            not: EstadoRespuestaForo.ANULADA,
          },
        },

        select: {
          id: true,
        },
      });

      if (existente) {
        throw new BadRequestException(
          'Ya publicaste una respuesta principal en este foro',
        );
      }
    }

    return this.prisma.$transaction(async (transaccion) => {
      const respuesta = await transaccion.respuestaForoCurso.create({
        data: {
          temaId: foro.id,
          autorId: usuario.id,
          grupoCursoId,
          equipoAfinidadId,
          titulo: datos.titulo.trim(),
          contenido: datos.contenido.trim(),
          estado: this.reglas.obtenerEstadoRespuesta(retraso.entregadaTarde),
          esRespuestaGrupal:
            foro.modalidadParticipacion === ModalidadParticipacionForo.GRUPAL,
          entregadaTarde: retraso.entregadaTarde,
          minutosRetraso: retraso.minutosRetraso,
          descuentoCalculado: new Prisma.Decimal(retraso.descuento),
          publicadoEn: ahora,
        },
      });

      if (equipoAfinidadId && foro.bloquearEquipoAlResponder) {
        await transaccion.equipoAfinidadForo.update({
          where: {
            id: equipoAfinidadId,
          },

          data: {
            estado: 'BLOQUEADO',
            bloqueadoEn: ahora,
          },
        });
      }

      await transaccion.historialForoCurso.create({
        data: {
          temaId: foro.id,
          respuestaId: respuesta.id,
          actorId: usuario.id,
          accion: AccionHistorialForo.RESPUESTA_CREADA,
          detalle: {
            grupoCursoId,
            equipoAfinidadId,
            entregadaTarde: retraso.entregadaTarde,
            minutosRetraso: retraso.minutosRetraso,
            descuento: retraso.descuento,
          },
        },
      });

      await this.crearCalificacionAutomatica(
        transaccion,
        foro,
        respuesta.id,
        grupoCursoId,
        equipoAfinidadId,
        estudiantesIds,
        retraso.descuento,
      );

      return {
        mensaje: 'Respuesta publicada correctamente',
        respuesta,
      };
    });
  }

  private async obtenerRespuestaEditable(
    usuario: UsuarioAutenticado,
    cursoId: number,
    respuestaId: number,
  ) {
    const respuesta = await this.prisma.respuestaForoCurso.findFirst({
      where: {
        id: respuestaId,
        estaActiva: true,
        tema: {
          cursoId,
          estaActivo: true,
        },
      },

      include: {
        tema: {
          include: {
            actividadCalificable: true,
          },
        },
        grupoCurso: {
          include: {
            integrantes: {
              where: {
                estudianteId: usuario.id,
                estaActivo: true,
              },
            },
          },
        },
        equipoAfinidad: {
          include: {
            integrantes: {
              where: {
                estudianteId: usuario.id,
                estaActivo: true,
              },
            },
          },
        },
      },
    });

    if (!respuesta) {
      throw new NotFoundException('La respuesta no existe');
    }

    this.reglas.validarForoDisponible(respuesta.tema);

    const esAutor = respuesta.autorId === usuario.id;

    /*
     * La respuesta principal pertenece al representante que la publicó.
     * COLABORACION_ABIERTA amplía los permisos de comentario,
     * pero nunca los permisos de edición de la respuesta principal.
     */
    if (!esAutor) {
      throw new ForbiddenException(
        'Solo el representante que publicó la respuesta puede modificarla',
      );
    }

    return respuesta;
  }

  async actualizarBorrador(
    usuario: UsuarioAutenticado,
    cursoId: number,
    respuestaId: number,
    datos: GuardarBorradorRespuestaForoDto,
  ) {
    await this.reglas.validarInscripcion(usuario, cursoId);

    const respuesta = await this.obtenerRespuestaEditable(
      usuario,
      cursoId,
      respuestaId,
    );

    if (respuesta.estado !== EstadoRespuestaForo.BORRADOR) {
      throw new BadRequestException(
        'La respuesta ya fue publicada y no es un borrador',
      );
    }

    const contenido = datos.contenido?.trim() ?? respuesta.contenido;

    if (
      respuesta.tema.palabrasMaximasRespuesta !== null &&
      this.reglas.contarPalabras(contenido) >
        respuesta.tema.palabrasMaximasRespuesta
    ) {
      throw new BadRequestException(
        `El borrador no puede superar ${respuesta.tema.palabrasMaximasRespuesta} palabras`,
      );
    }

    const borrador = await this.prisma.$transaction(async (transaccion) => {
      const registro = await transaccion.respuestaForoCurso.update({
        where: {
          id: respuesta.id,
        },
        data: {
          ...(datos.titulo !== undefined
            ? {
                titulo: datos.titulo.trim(),
              }
            : {}),
          ...(datos.contenido !== undefined
            ? {
                contenido,
              }
            : {}),
          editadoEn: new Date(),
        },
      });

      await transaccion.historialForoCurso.create({
        data: {
          temaId: respuesta.temaId,
          respuestaId: respuesta.id,
          actorId: usuario.id,
          accion: AccionHistorialForo.BORRADOR_GUARDADO,
          detalle: {
            campos: Object.keys(datos),
          },
        },
      });

      return registro;
    });

    return {
      mensaje: 'Borrador actualizado correctamente',
      respuesta: borrador,
    };
  }

  async publicarBorrador(
    usuario: UsuarioAutenticado,
    cursoId: number,
    respuestaId: number,
  ) {
    await this.reglas.validarInscripcion(usuario, cursoId);

    const respuesta = await this.obtenerRespuestaEditable(
      usuario,
      cursoId,
      respuestaId,
    );

    if (respuesta.estado !== EstadoRespuestaForo.BORRADOR) {
      throw new BadRequestException('La respuesta ya fue publicada');
    }

    if (!respuesta.titulo.trim() || !respuesta.contenido.trim()) {
      throw new BadRequestException(
        'Completa el título y el contenido antes de publicar',
      );
    }

    this.reglas.validarCantidadPalabras(
      respuesta.contenido,
      respuesta.tema.palabrasMinimasRespuesta,
      respuesta.tema.palabrasMaximasRespuesta,
      'respuesta',
    );

    const filtroParticipacion = this.construirFiltroParticipacion(
      usuario.id,
      respuesta.grupoCursoId,
      respuesta.equipoAfinidadId,
    );

    const publicadaExistente = await this.prisma.respuestaForoCurso.findFirst({
      where: {
        id: {
          not: respuesta.id,
        },
        temaId: respuesta.temaId,
        estaActiva: true,
        ...filtroParticipacion,
        estado: {
          notIn: [EstadoRespuestaForo.BORRADOR, EstadoRespuestaForo.ANULADA],
        },
      },
      select: {
        id: true,
      },
    });

    if (publicadaExistente) {
      throw new BadRequestException(
        'Ya existe una respuesta publicada para esta participación',
      );
    }

    const ahora = new Date();

    const retraso = this.reglas.calcularRetraso(respuesta.tema, ahora);

    let estudiantesIds: number[] = [usuario.id];

    if (respuesta.grupoCursoId) {
      const integrantes = await this.prisma.integranteGrupoCurso.findMany({
        where: {
          grupoId: respuesta.grupoCursoId,
          estaActivo: true,
        },
        select: {
          estudianteId: true,
        },
      });

      estudiantesIds = integrantes.map((integrante) => integrante.estudianteId);
    }

    if (respuesta.equipoAfinidadId) {
      const integrantes = await this.prisma.integranteEquipoForo.findMany({
        where: {
          equipoId: respuesta.equipoAfinidadId,
          estaActivo: true,
        },
        select: {
          estudianteId: true,
        },
      });

      estudiantesIds = integrantes.map((integrante) => integrante.estudianteId);
    }

    const publicada = await this.prisma.$transaction(async (transaccion) => {
      const registro = await transaccion.respuestaForoCurso.update({
        where: {
          id: respuesta.id,
        },
        data: {
          estado: this.reglas.obtenerEstadoRespuesta(retraso.entregadaTarde),
          entregadaTarde: retraso.entregadaTarde,
          minutosRetraso: retraso.minutosRetraso,
          descuentoCalculado: new Prisma.Decimal(retraso.descuento),
          publicadoEn: ahora,
          editadoEn: ahora,
        },
      });

      if (
        respuesta.equipoAfinidadId &&
        respuesta.tema.bloquearEquipoAlResponder
      ) {
        await transaccion.equipoAfinidadForo.update({
          where: {
            id: respuesta.equipoAfinidadId,
          },
          data: {
            estado: 'BLOQUEADO',
            bloqueadoEn: ahora,
          },
        });
      }

      await transaccion.historialForoCurso.create({
        data: {
          temaId: respuesta.temaId,
          respuestaId: respuesta.id,
          actorId: usuario.id,
          accion: AccionHistorialForo.BORRADOR_PUBLICADO,
          detalle: {
            entregadaTarde: retraso.entregadaTarde,
            minutosRetraso: retraso.minutosRetraso,
            descuento: retraso.descuento,
          },
        },
      });

      await this.crearCalificacionAutomatica(
        transaccion,
        respuesta.tema,
        respuesta.id,
        respuesta.grupoCursoId,
        respuesta.equipoAfinidadId,
        estudiantesIds,
        retraso.descuento,
      );

      return registro;
    });

    return {
      mensaje: 'Borrador publicado correctamente',
      respuesta: publicada,
    };
  }

  async actualizar(
    usuario: UsuarioAutenticado,
    cursoId: number,
    respuestaId: number,
    datos: ActualizarRespuestaForoDto,
  ) {
    await this.reglas.validarInscripcion(usuario, cursoId);

    const respuesta = await this.obtenerRespuestaEditable(
      usuario,
      cursoId,
      respuestaId,
    );

    if (respuesta.estado === EstadoRespuestaForo.BORRADOR) {
      throw new BadRequestException(
        'Utiliza la ruta de borradores para modificar esta respuesta',
      );
    }

    if (!respuesta.tema.permitirEditarRespuestas) {
      throw new ForbiddenException(
        'El docente no permite editar respuestas en este foro',
      );
    }

    const contenido = datos.contenido ?? respuesta.contenido;

    this.reglas.validarCantidadPalabras(
      contenido,
      respuesta.tema.palabrasMinimasRespuesta,
      respuesta.tema.palabrasMaximasRespuesta,
      'respuesta',
    );

    const actualizada = await this.prisma.$transaction(async (transaccion) => {
      const registro = await transaccion.respuestaForoCurso.update({
        where: {
          id: respuesta.id,
        },

        data: {
          ...(datos.titulo !== undefined
            ? {
                titulo: datos.titulo.trim(),
              }
            : {}),
          ...(datos.contenido !== undefined
            ? {
                contenido: datos.contenido.trim(),
              }
            : {}),
          editadoEn: new Date(),
        },
      });

      await transaccion.historialForoCurso.create({
        data: {
          temaId: respuesta.temaId,
          respuestaId: respuesta.id,
          actorId: usuario.id,
          accion: AccionHistorialForo.RESPUESTA_EDITADA,
          detalle: {
            campos: Object.keys(datos),
          },
        },
      });

      return registro;
    });

    return {
      mensaje: 'Respuesta actualizada correctamente',
      respuesta: actualizada,
    };
  }

  async eliminar(
    usuario: UsuarioAutenticado,
    cursoId: number,
    respuestaId: number,
  ) {
    await this.reglas.validarInscripcion(usuario, cursoId);

    const respuesta = await this.obtenerRespuestaEditable(
      usuario,
      cursoId,
      respuestaId,
    );

    if (
      respuesta.estado !== EstadoRespuestaForo.BORRADOR &&
      !respuesta.tema.permitirEliminarRespuestas
    ) {
      throw new ForbiddenException(
        'El docente no permite eliminar respuestas en este foro',
      );
    }

    const fecha = new Date();

    await this.prisma.$transaction(async (transaccion) => {
      await transaccion.respuestaForoCurso.update({
        where: {
          id: respuesta.id,
        },

        data: {
          estado: EstadoRespuestaForo.ANULADA,
          estaActiva: false,
          eliminadoEn: fecha,
        },
      });

      await transaccion.calificacionEstudiante.updateMany({
        where: {
          respuestaForoId: respuesta.id,
          estado: {
            not: EstadoCalificacion.PUBLICADA,
          },
        },

        data: {
          estado: EstadoCalificacion.ANULADA,
          anuladaEn: fecha,
        },
      });

      await transaccion.historialForoCurso.create({
        data: {
          temaId: respuesta.temaId,
          respuestaId: respuesta.id,
          actorId: usuario.id,
          accion: AccionHistorialForo.RESPUESTA_ANULADA,
        },
      });
    });

    return {
      mensaje: 'Respuesta retirada correctamente',
    };
  }

  async listar(usuario: UsuarioAutenticado, cursoId: number, foroId: number) {
    const foro = await this.reglas.obtenerForo(cursoId, foroId);

    if (usuario.rol === Rol.ESTUDIANTE) {
      await this.reglas.validarInscripcion(usuario, cursoId);

      if (
        foro.visibilidadRespuestas ===
        VisibilidadRespuestasForo.DESPUES_DE_RESPONDER
      ) {
        const participo = await this.prisma.respuestaForoCurso.findFirst({
          where: {
            temaId: foro.id,
            estaActiva: true,
            OR: [
              {
                autorId: usuario.id,
              },
              {
                grupoCurso: {
                  integrantes: {
                    some: {
                      estudianteId: usuario.id,
                      estaActivo: true,
                    },
                  },
                },
              },
              {
                equipoAfinidad: {
                  integrantes: {
                    some: {
                      estudianteId: usuario.id,
                      estaActivo: true,
                    },
                  },
                },
              },
            ],
            estado: {
              notIn: [
                EstadoRespuestaForo.BORRADOR,
                EstadoRespuestaForo.ANULADA,
              ],
            },
          },

          select: {
            id: true,
          },
        });

        if (!participo) {
          return [];
        }
      }

      if (
        foro.visibilidadRespuestas === VisibilidadRespuestasForo.AL_CERRAR &&
        !foro.estaCerrado
      ) {
        return [];
      }
    }

    return this.prisma.respuestaForoCurso.findMany({
      where: {
        temaId: foro.id,
        estaActiva: true,
        estado: {
          notIn: [
            EstadoRespuestaForo.BORRADOR,
            EstadoRespuestaForo.OCULTA,
            EstadoRespuestaForo.ANULADA,
          ],
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
        grupoCurso: {
          select: {
            id: true,
            nombre: true,
            color: true,
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
        equipoAfinidad: {
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
        archivos: {
          where: {
            estaActivo: true,
          },
        },
        comentarios: {
          where: {
            estaActivo: true,
            estaOculto: false,
            comentarioPadreId: null,
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
                fotoPerfilUrl: true,
              },
            },
            respuestas: {
              where: {
                estaActivo: true,
                estaOculto: false,
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
                    fotoPerfilUrl: true,
                  },
                },
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
  }
}
