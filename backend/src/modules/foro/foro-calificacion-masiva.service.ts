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
  EstadoInscripcion,
  Prisma,
  Rol,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import {
  AccionMasivaCalificacionForo,
  CalificarForoMasivamenteDto,
  FiltroMasivoCalificacionForo,
} from './dto/calificar-foro-masivamente.dto';

import { ForoReglasService } from './foro-reglas.service';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

type EstudianteObjetivo = {
  estudianteId: number;

  respuestaId: number | null;

  grupoCursoId: number | null;

  equipoAfinidadId: number | null;

  entregadaTarde: boolean;

  descuentoCalculado: number;

  calificacion: {
    id: number;

    notaBase: Prisma.Decimal;

    descuentoRetraso: Prisma.Decimal;

    descuentoComentarios: Prisma.Decimal;

    ajusteIndividual: Prisma.Decimal;

    notaFinal: Prisma.Decimal;

    retroalimentacion: string | null;

    estado: EstadoCalificacion;
  } | null;
};

@Injectable()
export class ForoCalificacionMasivaService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly reglas: ForoReglasService,
  ) {}

  private validarDocente(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException(
        'Solo el docente puede aplicar calificaciones masivas',
      );
    }
  }

  private limitarNota(valor: number) {
    return Math.max(0, Math.min(100, valor));
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

    const estadosPermitidos: EstadoForo[] = [
      EstadoForo.CERRADO,
      EstadoForo.CALIFICANDO,
      EstadoForo.CALIFICADO,
    ];

    if (!estadosPermitidos.includes(foro.estado)) {
      throw new BadRequestException(
        'El foro debe estar cerrado o en proceso de calificación',
      );
    }

    return foro;
  }

  private validarPeticion(datos: CalificarForoMasivamenteDto) {
    if (
      datos.filtro === FiltroMasivoCalificacionForo.SELECCIONADOS &&
      (!datos.estudiantesIds || datos.estudiantesIds.length === 0)
    ) {
      throw new BadRequestException('Debes seleccionar al menos un estudiante');
    }

    const accionesConValor: AccionMasivaCalificacionForo[] = [
      AccionMasivaCalificacionForo.ASIGNAR_NOTA,
      AccionMasivaCalificacionForo.APLICAR_DESCUENTO,
      AccionMasivaCalificacionForo.APLICAR_AJUSTE,
    ];

    if (accionesConValor.includes(datos.accion) && datos.valor === undefined) {
      throw new BadRequestException(
        'Debes proporcionar el valor que se aplicará',
      );
    }

    if (
      datos.accion === AccionMasivaCalificacionForo.AGREGAR_RETROALIMENTACION &&
      !datos.retroalimentacion?.trim()
    ) {
      throw new BadRequestException(
        'Debes escribir la retroalimentación que se aplicará',
      );
    }

    if (
      datos.accion === AccionMasivaCalificacionForo.APLICAR_DESCUENTO &&
      (datos.valor! < 0 || datos.valor! > 100)
    ) {
      throw new BadRequestException('El descuento debe estar entre 0 y 100');
    }

    if (
      datos.accion === AccionMasivaCalificacionForo.ASIGNAR_NOTA &&
      (datos.valor! < 0 || datos.valor! > 100)
    ) {
      throw new BadRequestException('La nota debe estar entre 0 y 100');
    }
  }

  private async construirObjetivos(
    cursoId: number,
    foroId: number,
    actividadId: number,
  ) {
    const inscripciones = await this.prisma.inscripcionCurso.findMany({
      where: {
        cursoId,

        estado: EstadoInscripcion.ACTIVA,

        estudiante: {
          estaActivo: true,

          rol: Rol.ESTUDIANTE,
        },
      },

      select: {
        estudianteId: true,
      },
    });

    const respuestas = await this.prisma.respuestaForoCurso.findMany({
      where: {
        temaId: foroId,

        estaActiva: true,
      },

      include: {
        grupoCurso: {
          include: {
            integrantes: {
              where: {
                estaActivo: true,
              },

              select: {
                estudianteId: true,
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
              },
            },
          },
        },
      },
    });

    const calificaciones = await this.prisma.calificacionEstudiante.findMany({
      where: {
        actividadId,
      },

      select: {
        id: true,

        estudianteId: true,

        notaBase: true,

        descuentoRetraso: true,

        descuentoComentarios: true,

        ajusteIndividual: true,

        notaFinal: true,

        retroalimentacion: true,

        estado: true,
      },
    });

    return inscripciones.map((inscripcion): EstudianteObjetivo => {
      const respuesta =
        respuestas.find(
          (item) =>
            item.autorId === inscripcion.estudianteId ||
            item.grupoCurso?.integrantes.some(
              (integrante) =>
                integrante.estudianteId === inscripcion.estudianteId,
            ) ||
            item.equipoAfinidad?.integrantes.some(
              (integrante) =>
                integrante.estudianteId === inscripcion.estudianteId,
            ),
        ) ?? null;

      const calificacion =
        calificaciones.find(
          (item) => item.estudianteId === inscripcion.estudianteId,
        ) ?? null;

      return {
        estudianteId: inscripcion.estudianteId,

        respuestaId: respuesta?.id ?? null,

        grupoCursoId: respuesta?.grupoCursoId ?? null,

        equipoAfinidadId: respuesta?.equipoAfinidadId ?? null,

        entregadaTarde: respuesta?.entregadaTarde ?? false,

        descuentoCalculado: respuesta
          ? Number(respuesta.descuentoCalculado)
          : 0,

        calificacion,
      };
    });
  }

  private filtrarObjetivos(
    objetivos: EstudianteObjetivo[],
    datos: CalificarForoMasivamenteDto,
  ) {
    switch (datos.filtro) {
      case FiltroMasivoCalificacionForo.SELECCIONADOS:
        return objetivos.filter((item) =>
          datos.estudiantesIds!.includes(item.estudianteId),
        );

      case FiltroMasivoCalificacionForo.PENDIENTES:
        return objetivos.filter(
          (item) =>
            !item.calificacion ||
            item.calificacion.estado === EstadoCalificacion.PENDIENTE ||
            item.calificacion.estado === EstadoCalificacion.BORRADOR,
        );

      case FiltroMasivoCalificacionForo.TARDIOS:
        return objetivos.filter((item) => item.entregadaTarde);

      case FiltroMasivoCalificacionForo.SIN_RESPUESTA:
        return objetivos.filter((item) => !item.respuestaId);

      case FiltroMasivoCalificacionForo.CALIFICADOS:
        return objetivos.filter(
          (item) =>
            item.calificacion?.estado === EstadoCalificacion.CALIFICADA ||
            item.calificacion?.estado === EstadoCalificacion.PUBLICADA,
        );

      case FiltroMasivoCalificacionForo.TODOS:
      default:
        return objetivos;
    }
  }

  private calcularValores(
    objetivo: EstudianteObjetivo,
    datos: CalificarForoMasivamenteDto,
  ) {
    let notaBase = objetivo.calificacion
      ? Number(objetivo.calificacion.notaBase)
      : 0;

    let descuento = objetivo.calificacion
      ? Number(objetivo.calificacion.descuentoRetraso)
      : objetivo.descuentoCalculado;

    let descuentoComentarios = objetivo.calificacion
      ? Number(objetivo.calificacion.descuentoComentarios)
      : 0;

    let ajuste = objetivo.calificacion
      ? Number(objetivo.calificacion.ajusteIndividual)
      : 0;

    let retroalimentacion = objetivo.calificacion?.retroalimentacion ?? null;

    switch (datos.accion) {
      case AccionMasivaCalificacionForo.ASIGNAR_NOTA:
        notaBase = datos.valor!;
        break;

      case AccionMasivaCalificacionForo.APLICAR_DESCUENTO:
        descuento = datos.valor!;
        break;

      case AccionMasivaCalificacionForo.APLICAR_AJUSTE:
        ajuste = datos.valor!;
        break;

      case AccionMasivaCalificacionForo.ASIGNAR_CERO:
        notaBase = 0;

        descuento = 0;

        descuentoComentarios = 0;

        ajuste = 0;
        break;

      case AccionMasivaCalificacionForo.AGREGAR_RETROALIMENTACION:
        retroalimentacion = datos.retroalimentacion!.trim();
        break;
    }

    const notaFinal = this.limitarNota(
      notaBase - descuento - descuentoComentarios + ajuste,
    );

    return {
      notaBase,

      descuento,

      descuentoComentarios,

      ajuste,

      notaFinal,

      retroalimentacion,
    };
  }

  async aplicar(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: CalificarForoMasivamenteDto,
  ) {
    this.validarPeticion(datos);

    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    const actividad = foro.actividadCalificable!;

    const objetivos = await this.construirObjetivos(
      cursoId,
      foro.id,
      actividad.id,
    );

    const seleccionados = this.filtrarObjetivos(objetivos, datos);

    if (seleccionados.length === 0) {
      throw new BadRequestException(
        'No hay estudiantes que coincidan con el filtro seleccionado',
      );
    }

    const fecha = new Date();

    const resultado = await this.prisma.$transaction(
      async (tx) => {
        const registros: {
          estudianteId: number;

          calificacionId: number;

          notaFinal: number;
        }[] = [];

        for (const objetivo of seleccionados) {
          const valoresBase = this.calcularValores(objetivo, datos);

          const evaluacionComentarios =
            await this.reglas.evaluarComentariosParaCalificacion(
              foro.id,
              objetivo.estudianteId,
              valoresBase.notaBase,
              tx,
            );

          const valores = {
            ...valoresBase,
            descuentoComentarios: evaluacionComentarios.descuentoComentarios,
            notaFinal: this.limitarNota(
              valoresBase.notaBase -
                valoresBase.descuento -
                evaluacionComentarios.descuentoComentarios +
                valoresBase.ajuste,
            ),
          };

          const calificacion = await tx.calificacionEstudiante.upsert({
            where: {
              actividadId_estudianteId: {
                actividadId: actividad.id,

                estudianteId: objetivo.estudianteId,
              },
            },

            create: {
              actividadId: actividad.id,

              estudianteId: objetivo.estudianteId,

              calificadorId: usuario.id,

              respuestaForoId: objetivo.respuestaId,

              grupoCursoId: objetivo.grupoCursoId,

              equipoAfinidadId: objetivo.equipoAfinidadId,

              notaBase: new Prisma.Decimal(valores.notaBase),

              descuentoRetraso: new Prisma.Decimal(valores.descuento),

              descuentoComentarios: new Prisma.Decimal(
                valores.descuentoComentarios,
              ),

              ajusteIndividual: new Prisma.Decimal(valores.ajuste),

              notaFinal: new Prisma.Decimal(valores.notaFinal),

              retroalimentacion: valores.retroalimentacion,

              estado: EstadoCalificacion.CALIFICADA,

              calificadaEn: fecha,
            },

            update: {
              calificadorId: usuario.id,

              respuestaForoId: objetivo.respuestaId,

              grupoCursoId: objetivo.grupoCursoId,

              equipoAfinidadId: objetivo.equipoAfinidadId,

              notaBase: new Prisma.Decimal(valores.notaBase),

              descuentoRetraso: new Prisma.Decimal(valores.descuento),

              descuentoComentarios: new Prisma.Decimal(
                valores.descuentoComentarios,
              ),

              ajusteIndividual: new Prisma.Decimal(valores.ajuste),

              notaFinal: new Prisma.Decimal(valores.notaFinal),

              retroalimentacion: valores.retroalimentacion,

              estado: EstadoCalificacion.CALIFICADA,

              calificadaEn: fecha,

              publicadaEn: null,

              anuladaEn: null,
            },
          });

          await tx.historialCalificacion.create({
            data: {
              actividadId: actividad.id,

              calificacionId: calificacion.id,

              actorId: usuario.id,

              accion: AccionHistorialCalificacion.CALIFICACION_ACTUALIZADA,

              detalle: {
                accionMasiva: datos.accion,

                filtro: datos.filtro,

                estudianteId: objetivo.estudianteId,

                valor: datos.valor ?? null,

                descuentoComentarios: valores.descuentoComentarios,

                notaFinal: valores.notaFinal,
              },
            },
          });

          registros.push({
            estudianteId: objetivo.estudianteId,

            calificacionId: calificacion.id,

            notaFinal: valores.notaFinal,
          });
        }

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
            id: actividad.id,
          },

          data: {
            estado: EstadoActividadCalificable.CALIFICANDO,
          },
        });

        await tx.historialForoCurso.create({
          data: {
            temaId: foro.id,

            actorId: usuario.id,

            accion: AccionHistorialForo.CALIFICACION_GUARDADA,

            detalle: {
              accion: 'CALIFICACION_MASIVA',

              tipo: datos.accion,

              filtro: datos.filtro,

              totalAfectados: registros.length,

              estudiantesIds: registros.map((item) => item.estudianteId),
            },
          },
        });

        return registros;
      },
      {
        timeout: 30000,
      },
    );

    return {
      mensaje: 'Acción masiva aplicada correctamente',

      accion: datos.accion,

      filtro: datos.filtro,

      totalAfectados: resultado.length,

      resultados: resultado,
    };
  }

  async previsualizar(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: CalificarForoMasivamenteDto,
  ) {
    this.validarPeticion(datos);

    const foro = await this.obtenerForoDocente(usuario, cursoId, foroId);

    const actividad = foro.actividadCalificable!;

    const objetivos = await this.construirObjetivos(
      cursoId,
      foro.id,
      actividad.id,
    );

    const seleccionados = this.filtrarObjetivos(objetivos, datos);

    return {
      accion: datos.accion,

      filtro: datos.filtro,

      totalAfectados: seleccionados.length,

      estudiantes: seleccionados.map((objetivo) => {
        const valores = this.calcularValores(objetivo, datos);

        return {
          estudianteId: objetivo.estudianteId,

          tieneRespuesta: Boolean(objetivo.respuestaId),

          entregadaTarde: objetivo.entregadaTarde,

          notaAnterior: objetivo.calificacion
            ? Number(objetivo.calificacion.notaFinal)
            : null,

          notaNueva: valores.notaFinal,

          descuentoNuevo: valores.descuento,

          descuentoComentariosNuevo: valores.descuentoComentarios,

          ajusteNuevo: valores.ajuste,
        };
      }),
    };
  }
}
