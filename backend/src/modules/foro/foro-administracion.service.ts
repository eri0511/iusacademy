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
  EstadoForo,
  Prisma,
  Rol,
  TipoOrigenActividad,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { DuplicarForoDto } from './dto/duplicar-foro.dto';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

@Injectable()
export class ForoAdministracionService {
  constructor(private readonly prisma: PrismaService) {}

  private validarDocente(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException('Solo el docente puede administrar foros');
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

        conjuntoGrupo: true,

        _count: {
          select: {
            respuestas: true,

            equiposAfinidad: true,

            archivos: true,
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

  private calcularFechasDuplicadas(
    conservarFechas: boolean,
    foro: {
      fechaApertura: Date | null;

      fechaLimite: Date | null;

      fechaCierre: Date | null;

      fechaMaximaRetraso: Date | null;
    },
  ) {
    if (conservarFechas) {
      return {
        fechaApertura: foro.fechaApertura,

        fechaLimite: foro.fechaLimite,

        fechaCierre: foro.fechaCierre,

        fechaMaximaRetraso: foro.fechaMaximaRetraso,
      };
    }

    return {
      fechaApertura: null,

      fechaLimite: null,

      fechaCierre: null,

      fechaMaximaRetraso: null,
    };
  }

  async duplicarForo(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: DuplicarForoDto,
  ) {
    const original = await this.obtenerForoDocente(usuario, cursoId, foroId);

    const conservarFechas = datos.conservarFechas ?? false;

    const conservarGrupo = datos.conservarGrupo ?? true;

    const fechas = this.calcularFechasDuplicadas(conservarFechas, original);

    const titulo = datos.titulo?.trim() || `Copia de ${original.titulo}`;

    const resultado = await this.prisma.$transaction(async (tx) => {
      const copia = await tx.temaForoCurso.create({
        data: {
          cursoId: original.cursoId,

          autorId: usuario.id,

          hitoId: original.hitoId,

          conjuntoGrupoId: conservarGrupo ? original.conjuntoGrupoId : null,

          titulo,

          contenido: original.contenido,

          instrucciones: original.instrucciones,

          modalidadParticipacion: original.modalidadParticipacion,

          origenGrupo: conservarGrupo ? original.origenGrupo : 'NINGUNO',

          dinamicaGrupal: conservarGrupo ? original.dinamicaGrupal : 'NINGUNA',

          cantidadMinimaIntegrantes: original.cantidadMinimaIntegrantes,

          cantidadMaximaIntegrantes: original.cantidadMaximaIntegrantes,

          requiereAprobacionEquipos: original.requiereAprobacionEquipos,

          requiereRepresentante: original.requiereRepresentante,

          bloquearEquipoAlResponder: original.bloquearEquipoAlResponder,

          permitirComentarios: original.permitirComentarios,

          minimoComentariosPorEstudiante:
            original.minimoComentariosPorEstudiante,

          maximoComentariosPorEstudiante:
            original.maximoComentariosPorEstudiante,

          penalizarIncumplimientoComentarios:
            original.penalizarIncumplimientoComentarios,

          tipoPenalizacionComentarios: original.tipoPenalizacionComentarios,

          valorPenalizacionComentarios: original.valorPenalizacionComentarios,

          palabrasMinimasRespuesta: original.palabrasMinimasRespuesta,

          palabrasMaximasRespuesta: original.palabrasMaximasRespuesta,

          palabrasMinimasComentario: original.palabrasMinimasComentario,

          palabrasMaximasComentario: original.palabrasMaximasComentario,

          tipoEvaluacion: original.tipoEvaluacion,

          modalidadNota: original.modalidadNota,

          puntajeMaximo: original.puntajeMaximo,

          porcentajeNotaGrupal: original.porcentajeNotaGrupal,

          porcentajeNotaIndividual: original.porcentajeNotaIndividual,

          calificacionAutomaticaAlCumplir:
            original.calificacionAutomaticaAlCumplir,

          fechaApertura: fechas.fechaApertura,

          fechaLimite: fechas.fechaLimite,

          fechaCierre: fechas.fechaCierre,

          fechaVencimiento: fechas.fechaLimite,

          permitirRetrasos: original.permitirRetrasos,

          fechaMaximaRetraso: fechas.fechaMaximaRetraso,

          tipoDescuentoRetraso: original.tipoDescuentoRetraso,

          valorDescuentoRetraso: original.valorDescuentoRetraso,

          visibilidadRespuestas: original.visibilidadRespuestas,

          permitirAdjuntosTema: original.permitirAdjuntosTema,

          permitirAdjuntosRespuesta: original.permitirAdjuntosRespuesta,

          permitirAdjuntosComentario: original.permitirAdjuntosComentario,

          exigirAdjuntoRespuesta: original.exigirAdjuntoRespuesta,

          permitirDescargaAdjuntos: original.permitirDescargaAdjuntos,

          maximoArchivosTema: original.maximoArchivosTema,

          maximoArchivosRespuesta: original.maximoArchivosRespuesta,

          maximoArchivosComentario: original.maximoArchivosComentario,

          tamanioMaximoArchivoMb: original.tamanioMaximoArchivoMb,

          extensionesPermitidas: original.extensionesPermitidas,

          estado: EstadoForo.BORRADOR,

          estaFijado: false,

          estaCerrado: false,

          estaActivo: true,

          notasPublicadasEn: null,

          publicadoEn: new Date(),

          editadoEn: null,

          eliminadoEn: null,
        },
      });

      const actividadOriginal = original.actividadCalificable;

      const actividad = await tx.actividadCalificable.create({
        data: {
          cursoId: original.cursoId,

          hitoId: original.hitoId,

          creadorId: usuario.id,

          foroId: copia.id,

          origen: TipoOrigenActividad.FORO,

          componente: actividadOriginal?.componente ?? 'CONTINUA',

          titulo,

          descripcion:
            original.instrucciones ?? original.contenido.slice(0, 1200),

          puntajeMaximo: new Prisma.Decimal(100),

          participaEnPromedio: actividadOriginal?.participaEnPromedio ?? true,

          orden: actividadOriginal?.orden ?? 0,

          estado: EstadoActividadCalificable.BORRADOR,

          visibleParaEstudiantes: false,

          publicadaEn: null,

          cerradaEn: null,
        },
      });

      await tx.historialForoCurso.create({
        data: {
          temaId: copia.id,

          actorId: usuario.id,

          accion: AccionHistorialForo.FORO_CREADO,

          detalle: {
            foroOriginalId: original.id,

            accion: 'DUPLICADO',

            conservarFechas,

            conservarGrupo,
          },
        },
      });

      await tx.historialCalificacion.create({
        data: {
          actividadId: actividad.id,

          actorId: usuario.id,

          accion: AccionHistorialCalificacion.ACTIVIDAD_CREADA,

          detalle: {
            foroId: copia.id,

            foroOriginalId: original.id,

            accion: 'DUPLICADO',
          },
        },
      });

      return {
        foro: copia,

        actividad,
      };
    });

    return {
      mensaje: 'Foro duplicado correctamente',

      ...resultado,

      advertencia:
        'La copia no incluye respuestas, comentarios, equipos por afinidad, archivos ni calificaciones.',
    };
  }

  async eliminarForo(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    if (foro.estado === EstadoForo.NOTAS_PUBLICADAS) {
      throw new BadRequestException(
        'No puedes eliminar un foro con notas publicadas',
      );
    }

    const fecha = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.temaForoCurso.update({
        where: {
          id: foro.id,
        },

        data: {
          estaActivo: false,

          estaCerrado: true,

          estaFijado: false,

          estado: EstadoForo.ANULADO,

          eliminadoEn: fecha,
        },
      });

      if (foro.actividadCalificable) {
        await tx.actividadCalificable.update({
          where: {
            id: foro.actividadCalificable.id,
          },

          data: {
            estado: EstadoActividadCalificable.ANULADA,

            visibleParaEstudiantes: false,

            cerradaEn: fecha,
          },
        });
      }

      await tx.historialForoCurso.create({
        data: {
          temaId: foro.id,

          actorId: usuario.id,

          accion: AccionHistorialForo.FORO_ANULADO,

          detalle: {
            eliminacionLogica: true,
          },
        },
      });
    });

    return {
      mensaje: 'Foro eliminado correctamente',
    };
  }

  async obtenerHistorial(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    await this.obtenerForoDocente(usuario, cursoId, foroId);

    return this.prisma.historialForoCurso.findMany({
      where: {
        temaId: foroId,
      },

      orderBy: {
        registradoEn: 'desc',
      },

      include: {
        actor: {
          select: {
            id: true,

            nombres: true,

            apellidoPaterno: true,

            apellidoMaterno: true,

            correo: true,

            fotoPerfilUrl: true,
          },
        },

        respuesta: {
          select: {
            id: true,

            titulo: true,

            autorId: true,
          },
        },

        comentario: {
          select: {
            id: true,

            autorId: true,
          },
        },

        equipo: {
          select: {
            id: true,

            nombre: true,

            estado: true,
          },
        },
      },
    });
  }
}
