import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccionHistorialCalificacion,
  AccionHistorialForo,
  ComponenteEvaluacion,
  DinamicaGrupalForo,
  EstadoActividadCalificable,
  EstadoForo,
  EstadoInscripcion,
  ModalidadNotaForo,
  ModalidadParticipacionForo,
  OrigenGrupoForo,
  Prisma,
  Rol,
  TipoDescuentoRetraso,
  TipoEvaluacionForo,
  TipoPenalizacionComentarios,
  TipoOrigenActividad,
  VisibilidadRespuestasForo,
} from '../../generated/prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { ActualizarForoDto } from './dto/actualizar-foro.dto';

import { CambiarEstadoForoDto } from './dto/cambiar-estado-foro.dto';

import { CrearForoDto } from './dto/crear-foro.dto';

import type { ListarForosQueryDto } from './dto/listar-foros-query.dto';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

import { ForoCierreAutomaticoService } from './foro-cierre-automatico.service';

@Injectable()
export class ForoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cierreAutomatico: ForoCierreAutomaticoService,
  ) {}

  private validarDocente(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException('Solo el docente puede administrar foros');
    }
  }

  private validarRolConsulta(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE && usuario.rol !== Rol.ESTUDIANTE) {
      throw new ForbiddenException(
        'No tienes permisos para consultar este foro',
      );
    }
  }

  private normalizarTexto(valor: string | undefined) {
    const normalizado = valor?.trim();

    return normalizado || null;
  }

  private normalizarExtensiones(extensiones: string[] | undefined) {
    const permitidas = new Set([
      'pdf',
      'doc',
      'docx',
      'jpg',
      'jpeg',
      'png',
      'webp',
    ]);

    const resultado = (
      extensiones ?? ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp']
    )
      .map((extension) => extension.trim().toLowerCase().replace(/^\./, ''))
      .filter((extension) => permitidas.has(extension));

    if (resultado.length === 0) {
      throw new BadRequestException(
        'Debes proporcionar al menos una extensión permitida válida',
      );
    }

    return [...new Set(resultado)];
  }

  private validarFechas(
    fechaApertura: Date,
    fechaLimite: Date,
    fechaCierre: Date,
    permitirRetrasos: boolean,
    fechaMaximaRetraso: Date | null,
    opciones?: {
      validarContraAhora?: boolean;
      toleranciaMs?: number;
    },
  ) {
    const validarContraAhora = opciones?.validarContraAhora ?? false;

    if (validarContraAhora) {
      const toleranciaMs = opciones?.toleranciaMs ?? 60_000;

      const ahora = Date.now();

      if (fechaApertura.getTime() < ahora - toleranciaMs) {
        throw new BadRequestException(
          'La fecha de apertura no puede estar en el pasado',
        );
      }

      if (fechaLimite.getTime() <= ahora) {
        throw new BadRequestException(
          'La fecha límite debe estar en el futuro',
        );
      }

      if (fechaCierre.getTime() <= ahora) {
        throw new BadRequestException(
          'La fecha de cierre debe estar en el futuro',
        );
      }

      if (
        permitirRetrasos &&
        fechaMaximaRetraso &&
        fechaMaximaRetraso.getTime() <= ahora
      ) {
        throw new BadRequestException(
          'La fecha máxima de retraso debe estar en el futuro',
        );
      }
    }

    if (fechaLimite <= fechaApertura) {
      throw new BadRequestException(
        'La fecha límite debe ser posterior a la fecha de apertura',
      );
    }

    if (fechaCierre < fechaLimite) {
      throw new BadRequestException(
        'La fecha de cierre no puede ser anterior a la fecha límite',
      );
    }

    if (permitirRetrasos) {
      if (!fechaMaximaRetraso) {
        throw new BadRequestException(
          'Debes indicar la fecha máxima para entregas tardías',
        );
      }

      if (fechaMaximaRetraso < fechaLimite) {
        throw new BadRequestException(
          'La fecha máxima de retraso debe ser igual o posterior a la fecha límite',
        );
      }

      if (fechaCierre < fechaMaximaRetraso) {
        throw new BadRequestException(
          'La fecha de cierre debe ser igual o posterior a la fecha máxima de retraso',
        );
      }
    }
  }

  private validarRangos(datos: {
    cantidadMinimaIntegrantes?: number | null;

    cantidadMaximaIntegrantes?: number | null;

    minimoComentariosPorEstudiante?: number;

    maximoComentariosPorEstudiante?: number | null;

    palabrasMinimasRespuesta?: number | null;

    palabrasMaximasRespuesta?: number | null;

    palabrasMinimasComentario?: number | null;

    palabrasMaximasComentario?: number | null;
  }) {
    if (
      datos.cantidadMinimaIntegrantes &&
      datos.cantidadMaximaIntegrantes &&
      datos.cantidadMinimaIntegrantes > datos.cantidadMaximaIntegrantes
    ) {
      throw new BadRequestException(
        'La cantidad mínima de integrantes no puede superar la máxima',
      );
    }

    if (
      datos.maximoComentariosPorEstudiante !== null &&
      datos.maximoComentariosPorEstudiante !== undefined &&
      (datos.minimoComentariosPorEstudiante ?? 0) >
        datos.maximoComentariosPorEstudiante
    ) {
      throw new BadRequestException(
        'El mínimo de comentarios no puede superar el máximo',
      );
    }

    if (
      datos.palabrasMinimasRespuesta &&
      datos.palabrasMaximasRespuesta &&
      datos.palabrasMinimasRespuesta > datos.palabrasMaximasRespuesta
    ) {
      throw new BadRequestException(
        'El mínimo de palabras de la respuesta no puede superar el máximo',
      );
    }

    if (
      datos.palabrasMinimasComentario &&
      datos.palabrasMaximasComentario &&
      datos.palabrasMinimasComentario > datos.palabrasMaximasComentario
    ) {
      throw new BadRequestException(
        'El mínimo de palabras del comentario no puede superar el máximo',
      );
    }
  }

  private validarPorcentajesNota(
    modalidadNota: ModalidadNotaForo,
    porcentajeGrupal: number | null,
    porcentajeIndividual: number | null,
  ) {
    if (modalidadNota === ModalidadNotaForo.GRUPAL_E_INDIVIDUAL) {
      if (porcentajeGrupal === null || porcentajeIndividual === null) {
        throw new BadRequestException(
          'Debes indicar los porcentajes grupal e individual',
        );
      }

      const total = porcentajeGrupal + porcentajeIndividual;

      if (Math.abs(total - 100) > 0.001) {
        throw new BadRequestException(
          'Los porcentajes grupal e individual deben sumar 100',
        );
      }
    }
  }

  private validarConfiguracionGrupal(datos: {
    modalidadParticipacion: ModalidadParticipacionForo;

    origenGrupo: OrigenGrupoForo;

    dinamicaGrupal: DinamicaGrupalForo;

    conjuntoGrupoId?: number | null;
  }) {
    if (
      datos.modalidadParticipacion === ModalidadParticipacionForo.INDIVIDUAL
    ) {
      if (
        datos.origenGrupo !== OrigenGrupoForo.NINGUNO ||
        datos.dinamicaGrupal !== DinamicaGrupalForo.NINGUNA
      ) {
        throw new BadRequestException(
          'Un foro individual debe usar origen NINGUNO y dinámica NINGUNA',
        );
      }

      return;
    }

    if (datos.origenGrupo === OrigenGrupoForo.NINGUNO) {
      throw new BadRequestException(
        'Un foro grupal debe usar grupos de plataforma o grupos por afinidad',
      );
    }

    if (datos.dinamicaGrupal === DinamicaGrupalForo.NINGUNA) {
      throw new BadRequestException(
        'Debes seleccionar una dinámica para el foro grupal',
      );
    }

    if (
      datos.origenGrupo === OrigenGrupoForo.PLATAFORMA &&
      !datos.conjuntoGrupoId
    ) {
      throw new BadRequestException(
        'Debes seleccionar un conjunto de grupos de la plataforma',
      );
    }
  }

  private validarPenalizacionComentarios(datos: {
    esCalificable: boolean;
    modalidadParticipacion: ModalidadParticipacionForo;
    dinamicaGrupal: DinamicaGrupalForo;
    minimoComentariosPorEstudiante: number;
    penalizarIncumplimientoComentarios: boolean;
    tipoPenalizacionComentarios: TipoPenalizacionComentarios;
    valorPenalizacionComentarios: number | null;
  }) {
    if (!datos.penalizarIncumplimientoComentarios) return;

    if (!datos.esCalificable) {
      throw new BadRequestException(
        'La penalización por comentarios solo puede utilizarse en un foro calificable',
      );
    }

    if (datos.modalidadParticipacion !== ModalidadParticipacionForo.GRUPAL) {
      throw new BadRequestException(
        'La penalización por comentarios solo corresponde a foros grupales',
      );
    }

    if (
      datos.dinamicaGrupal !== DinamicaGrupalForo.PARTICIPACION_DISTRIBUIDA &&
      datos.dinamicaGrupal !== DinamicaGrupalForo.COLABORACION_ABIERTA
    ) {
      throw new BadRequestException(
        'La penalización por comentarios requiere una dinámica basada en aportes',
      );
    }

    if (datos.minimoComentariosPorEstudiante <= 0) {
      throw new BadRequestException(
        'Debes exigir al menos un comentario por integrante para aplicar esta penalización',
      );
    }

    if (
      datos.tipoPenalizacionComentarios === TipoPenalizacionComentarios.NINGUNA
    ) {
      throw new BadRequestException(
        'Selecciona si la penalización será por puntos fijos o por porcentaje',
      );
    }

    if (
      datos.valorPenalizacionComentarios === null ||
      datos.valorPenalizacionComentarios <= 0 ||
      datos.valorPenalizacionComentarios > 100
    ) {
      throw new BadRequestException(
        'El valor de la penalización por comentarios debe estar entre 0.01 y 100',
      );
    }
  }

  private async obtenerCursoDocente(docenteId: number, cursoId: number) {
    const curso = await this.prisma.curso.findFirst({
      where: {
        id: cursoId,

        docenteId,
      },

      select: {
        id: true,

        planificacionId: true,

        estado: true,

        materia: {
          select: {
            nombre: true,

            codigo: true,
          },
        },
      },
    });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe o no pertenece al docente autenticado',
      );
    }

    return curso;
  }

  private async obtenerHitoCurso(
    planificacionId: number | null,
    hitoId: number,
  ) {
    if (!planificacionId) {
      throw new BadRequestException(
        'El curso no tiene una planificación académica asignada',
      );
    }

    const hito = await this.prisma.hitoAcademico.findFirst({
      where: {
        id: hitoId,

        planificacionId,
      },

      select: {
        id: true,

        numero: true,

        codigo: true,

        nombre: true,

        puntajeContinua: true,

        puntajeProcesual: true,
      },
    });

    if (!hito) {
      throw new BadRequestException(
        'El hito no pertenece a la planificación del curso',
      );
    }

    return hito;
  }

  private async validarConjuntoPlataforma(
    cursoId: number,
    hitoId: number,
    conjuntoGrupoId: number | null | undefined,
  ) {
    if (!conjuntoGrupoId) {
      return null;
    }

    const conjunto = await this.prisma.conjuntoGrupoCurso.findFirst({
      where: {
        id: conjuntoGrupoId,

        cursoId,

        estaActivo: true,

        OR: [
          {
            hitoId: null,
          },
          {
            hitoId,
          },
        ],
      },

      select: {
        id: true,

        nombre: true,

        alcance: true,

        hitoId: true,

        estaBloqueado: true,

        grupos: {
          where: {
            estaActivo: true,
          },

          select: {
            id: true,
          },
        },
      },
    });

    if (!conjunto) {
      throw new BadRequestException(
        'El conjunto seleccionado no pertenece al curso o al hito actual',
      );
    }

    if (conjunto.grupos.length === 0) {
      throw new BadRequestException(
        'El conjunto seleccionado todavía no tiene grupos configurados',
      );
    }

    return conjunto;
  }

  private calcularEstadoInicial(fechaApertura: Date) {
    return fechaApertura <= new Date()
      ? EstadoForo.ABIERTO
      : EstadoForo.PROGRAMADO;
  }

  async crearForo(
    usuario: UsuarioAutenticado,
    cursoId: number,
    datos: CrearForoDto,
  ) {
    this.validarDocente(usuario);

    const curso = await this.obtenerCursoDocente(usuario.id, cursoId);

    const hito = await this.obtenerHitoCurso(
      curso.planificacionId,
      datos.hitoId,
    );

    this.validarConfiguracionGrupal(datos);

    this.validarRangos(datos);

    const esCalificable = datos.esCalificable ?? false;

    if (esCalificable) {
      if (!datos.componente || !datos.tipoEvaluacion || !datos.modalidadNota) {
        throw new BadRequestException(
          'Un foro calificable requiere componente, tipo de evaluación y modalidad de nota',
        );
      }

      this.validarPorcentajesNota(
        datos.modalidadNota,
        datos.porcentajeNotaGrupal ?? null,
        datos.porcentajeNotaIndividual ?? null,
      );
    }

    const penalizarComentarios =
      datos.penalizarIncumplimientoComentarios ?? false;

    const tipoPenalizacionComentarios = penalizarComentarios
      ? (datos.tipoPenalizacionComentarios ??
        TipoPenalizacionComentarios.NINGUNA)
      : TipoPenalizacionComentarios.NINGUNA;

    const valorPenalizacionComentarios =
      penalizarComentarios && datos.valorPenalizacionComentarios !== undefined
        ? datos.valorPenalizacionComentarios
        : null;

    this.validarPenalizacionComentarios({
      esCalificable,
      modalidadParticipacion: datos.modalidadParticipacion,
      dinamicaGrupal: datos.dinamicaGrupal,
      minimoComentariosPorEstudiante: datos.minimoComentariosPorEstudiante ?? 0,
      penalizarIncumplimientoComentarios: penalizarComentarios,
      tipoPenalizacionComentarios,
      valorPenalizacionComentarios,
    });

    const fechaApertura = new Date(datos.fechaApertura);

    const fechaLimite = new Date(datos.fechaLimite);

    const fechaCierre = new Date(datos.fechaCierre);

    const permitirRetrasos = datos.permitirRetrasos ?? false;

    const fechaMaximaRetraso = datos.fechaMaximaRetraso
      ? new Date(datos.fechaMaximaRetraso)
      : null;

    this.validarFechas(
      fechaApertura,
      fechaLimite,
      fechaCierre,
      permitirRetrasos,
      fechaMaximaRetraso,
      {
        validarContraAhora: true,

        /*
         * Evita rechazar por unos segundos una apertura elegida como
         * "ahora" mientras el formulario viaja del navegador al servidor.
         */
        toleranciaMs: 60_000,
      },
    );

    const conjunto =
      datos.origenGrupo === OrigenGrupoForo.PLATAFORMA
        ? await this.validarConjuntoPlataforma(
            cursoId,
            hito.id,
            datos.conjuntoGrupoId,
          )
        : null;

    const extensiones = this.normalizarExtensiones(datos.extensionesPermitidas);

    const estadoInicial = this.calcularEstadoInicial(fechaApertura);

    const resultado = await this.prisma.$transaction(async (transaccion) => {
      const foro = await transaccion.temaForoCurso.create({
        data: {
          cursoId,

          autorId: usuario.id,

          hitoId: hito.id,

          conjuntoGrupoId: conjunto?.id ?? null,

          titulo: datos.titulo.trim(),

          contenido: datos.contenido.trim(),

          instrucciones: this.normalizarTexto(datos.instrucciones),

          objetivo: this.normalizarTexto(datos.objetivo),

          esCalificable,

          modalidadParticipacion: datos.modalidadParticipacion,

          origenGrupo: datos.origenGrupo,

          dinamicaGrupal: datos.dinamicaGrupal,

          cantidadMinimaIntegrantes: datos.cantidadMinimaIntegrantes ?? null,

          cantidadMaximaIntegrantes: datos.cantidadMaximaIntegrantes ?? null,

          requiereAprobacionEquipos: datos.requiereAprobacionEquipos ?? false,

          requiereRepresentante: datos.requiereRepresentante ?? false,

          bloquearEquipoAlResponder: datos.bloquearEquipoAlResponder ?? true,

          permitirComentarios: datos.permitirComentarios ?? true,

          permitirEditarRespuestas: datos.permitirEditarRespuestas ?? true,

          permitirEliminarRespuestas: datos.permitirEliminarRespuestas ?? false,

          permitirEditarComentarios: datos.permitirEditarComentarios ?? true,

          permitirEliminarComentarios:
            datos.permitirEliminarComentarios ?? false,

          minimoComentariosPorEstudiante:
            datos.minimoComentariosPorEstudiante ?? 0,

          maximoComentariosPorEstudiante:
            datos.maximoComentariosPorEstudiante ?? null,

          penalizarIncumplimientoComentarios: penalizarComentarios,

          tipoPenalizacionComentarios,

          valorPenalizacionComentarios:
            valorPenalizacionComentarios !== null
              ? new Prisma.Decimal(valorPenalizacionComentarios)
              : null,

          palabrasMinimasRespuesta: datos.palabrasMinimasRespuesta ?? null,

          palabrasMaximasRespuesta: datos.palabrasMaximasRespuesta ?? null,

          palabrasMinimasComentario: datos.palabrasMinimasComentario ?? null,

          palabrasMaximasComentario: datos.palabrasMaximasComentario ?? null,

          tipoEvaluacion: datos.tipoEvaluacion ?? TipoEvaluacionForo.MANUAL,

          modalidadNota: datos.modalidadNota ?? ModalidadNotaForo.INDIVIDUAL,

          puntajeMaximo: new Prisma.Decimal(100),

          porcentajeNotaGrupal:
            datos.porcentajeNotaGrupal !== undefined
              ? new Prisma.Decimal(datos.porcentajeNotaGrupal)
              : null,

          porcentajeNotaIndividual:
            datos.porcentajeNotaIndividual !== undefined
              ? new Prisma.Decimal(datos.porcentajeNotaIndividual)
              : null,

          calificacionAutomaticaAlCumplir:
            datos.tipoEvaluacion === TipoEvaluacionForo.AUTOMATICA
              ? true
              : (datos.calificacionAutomaticaAlCumplir ?? false),

          fechaApertura,

          fechaLimite,

          fechaCierre,

          visibleAntesDeApertura: datos.visibleAntesDeApertura ?? true,

          fechaVencimiento: fechaLimite,

          permitirRetrasos,

          fechaMaximaRetraso,

          tipoDescuentoRetraso: permitirRetrasos
            ? (datos.tipoDescuentoRetraso ?? TipoDescuentoRetraso.NINGUNO)
            : TipoDescuentoRetraso.NINGUNO,

          valorDescuentoRetraso:
            permitirRetrasos && datos.valorDescuentoRetraso !== undefined
              ? new Prisma.Decimal(datos.valorDescuentoRetraso)
              : null,

          visibilidadRespuestas:
            datos.visibilidadRespuestas ??
            VisibilidadRespuestasForo.DESDE_EL_INICIO,

          permitirAdjuntosTema: datos.permitirAdjuntosTema ?? true,

          permitirAdjuntosRespuesta: datos.permitirAdjuntosRespuesta ?? false,

          permitirAdjuntosComentario: datos.permitirAdjuntosComentario ?? false,

          exigirAdjuntoRespuesta: datos.exigirAdjuntoRespuesta ?? false,

          permitirDescargaAdjuntos: datos.permitirDescargaAdjuntos ?? true,

          maximoArchivosTema: datos.maximoArchivosTema ?? 5,

          maximoArchivosRespuesta: datos.maximoArchivosRespuesta ?? 3,

          maximoArchivosComentario: datos.maximoArchivosComentario ?? 1,

          tamanioMaximoArchivoMb: datos.tamanioMaximoArchivoMb ?? 10,

          extensionesPermitidas: extensiones,

          estado: estadoInicial,

          estaCerrado: false,
        },
      });

      const actividad = esCalificable
        ? await transaccion.actividadCalificable.create({
            data: {
              cursoId,

              hitoId: hito.id,

              creadorId: usuario.id,

              foroId: foro.id,

              origen: TipoOrigenActividad.FORO,

              componente: datos.componente!,

              titulo: datos.titulo.trim(),

              descripcion:
                this.normalizarTexto(datos.instrucciones) ??
                datos.contenido.trim().slice(0, 1200),

              puntajeMaximo: new Prisma.Decimal(100),

              participaEnPromedio: datos.participaEnPromedio ?? true,

              estado:
                estadoInicial === EstadoForo.ABIERTO
                  ? EstadoActividadCalificable.ACTIVA
                  : EstadoActividadCalificable.BORRADOR,

              visibleParaEstudiantes: estadoInicial === EstadoForo.ABIERTO,
            },
          })
        : null;

      await transaccion.historialForoCurso.create({
        data: {
          temaId: foro.id,

          actorId: usuario.id,

          accion: AccionHistorialForo.FORO_CREADO,

          detalle: {
            hitoId: hito.id,

            componente: datos.componente,

            modalidadParticipacion: datos.modalidadParticipacion,

            origenGrupo: datos.origenGrupo,

            conjuntoGrupoId: conjunto?.id ?? null,

            visibleAntesDeApertura: datos.visibleAntesDeApertura ?? true,
          },
        },
      });

      if (actividad) {
        await transaccion.historialCalificacion.create({
          data: {
            actividadId: actividad.id,

            actorId: usuario.id,

            accion: AccionHistorialCalificacion.ACTIVIDAD_CREADA,

            detalle: {
              foroId: foro.id,

              hitoId: hito.id,

              componente: datos.componente,
            },
          },
        });
      }

      return {
        foro,

        actividad,
      };
    });

    return {
      mensaje: 'Foro creado correctamente',

      ...resultado,

      hito,

      conjunto: conjunto
        ? {
            id: conjunto.id,

            nombre: conjunto.nombre,

            totalGrupos: conjunto.grupos.length,
          }
        : null,
    };
  }

  private async construirMiParticipacionEstudiante(
    estudianteId: number,
    foro: {
      id: number;

      modalidadParticipacion: ModalidadParticipacionForo;

      origenGrupo: OrigenGrupoForo;

      dinamicaGrupal: DinamicaGrupalForo;

      conjuntoGrupoId: number | null;

      permitirComentarios: boolean;

      actividadCalificable?: {
        componente: ComponenteEvaluacion;
      } | null;
    },
  ) {
    const componente = foro.actividadCalificable?.componente ?? null;

    const permisosComentarios = (grupoPropioDisponible: boolean) => {
      const base = {
        puedeComentar: false,

        soloGrupoPropio: false,

        puedeComentarGrupoPropio: false,

        puedeComentarOtrosGrupos: false,
      };

      if (
        !foro.permitirComentarios ||
        foro.modalidadParticipacion !== ModalidadParticipacionForo.GRUPAL ||
        !grupoPropioDisponible
      ) {
        return base;
      }

      if (
        foro.dinamicaGrupal === DinamicaGrupalForo.PARTICIPACION_DISTRIBUIDA
      ) {
        return {
          puedeComentar: true,

          soloGrupoPropio: true,

          puedeComentarGrupoPropio: true,

          puedeComentarOtrosGrupos: false,
        };
      }

      if (foro.dinamicaGrupal === DinamicaGrupalForo.COLABORACION_ABIERTA) {
        return {
          puedeComentar: true,

          /*
           * Se mantiene por compatibilidad con clientes anteriores,
           * pero los permisos precisos están en los dos campos nuevos.
           */
          soloGrupoPropio: false,

          puedeComentarGrupoPropio: false,

          puedeComentarOtrosGrupos: true,
        };
      }

      return base;
    };

    if (foro.modalidadParticipacion === ModalidadParticipacionForo.INDIVIDUAL) {
      return {
        estudianteId,

        modalidad: ModalidadParticipacionForo.INDIVIDUAL,

        origenGrupo: OrigenGrupoForo.NINGUNO,

        dinamicaGrupal: DinamicaGrupalForo.NINGUNA,

        componente,

        grupo: null,

        integrantes: [],

        representante: null,

        esRepresentante: false,

        puedeCrearRespuestaPrincipal: true,

        comentarios: {
          puedeComentar: foro.permitirComentarios,

          soloGrupoPropio: false,

          puedeComentarGrupoPropio: foro.permitirComentarios,

          puedeComentarOtrosGrupos: false,
        },
      };
    }

    if (foro.origenGrupo === OrigenGrupoForo.PLATAFORMA) {
      if (!foro.conjuntoGrupoId) {
        return {
          estudianteId,

          modalidad: foro.modalidadParticipacion,

          origenGrupo: foro.origenGrupo,

          dinamicaGrupal: foro.dinamicaGrupal,

          componente,

          grupo: null,

          integrantes: [],

          representante: null,

          esRepresentante: false,

          puedeCrearRespuestaPrincipal: false,

          comentarios: permisosComentarios(false),
        };
      }

      const grupo = await this.prisma.grupoCurso.findFirst({
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

        select: {
          id: true,

          nombre: true,

          color: true,

          integrantes: {
            where: {
              estaActivo: true,
            },

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
      });

      if (!grupo) {
        return {
          estudianteId,

          modalidad: foro.modalidadParticipacion,

          origenGrupo: foro.origenGrupo,

          dinamicaGrupal: foro.dinamicaGrupal,

          componente,

          grupo: null,

          integrantes: [],

          representante: null,

          esRepresentante: false,

          puedeCrearRespuestaPrincipal: false,

          comentarios: permisosComentarios(false),
        };
      }

      const integranteActual = grupo.integrantes.find(
        (integrante) => integrante.estudianteId === estudianteId,
      );

      const integranteRepresentante = grupo.integrantes.find(
        (integrante) => integrante.esRepresentante,
      );

      const representante = integranteRepresentante?.estudiante ?? null;

      return {
        estudianteId,

        modalidad: foro.modalidadParticipacion,

        origenGrupo: foro.origenGrupo,

        dinamicaGrupal: foro.dinamicaGrupal,

        grupo: {
          id: grupo.id,

          nombre: grupo.nombre,

          color: grupo.color,
        },

        integrantes: grupo.integrantes.map((integrante) => ({
          estudianteId: integrante.estudianteId,

          esRepresentante: integrante.esRepresentante,

          estudiante: integrante.estudiante,
        })),

        representante,

        esRepresentante: Boolean(integranteActual?.esRepresentante),

        puedeCrearRespuestaPrincipal: Boolean(
          integranteActual?.esRepresentante,
        ),

        comentarios: permisosComentarios(true),
      };
    }

    if (foro.origenGrupo === OrigenGrupoForo.AFINIDAD) {
      const equipo = await this.prisma.equipoAfinidadForo.findFirst({
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

        select: {
          id: true,

          nombre: true,

          integrantes: {
            where: {
              estaActivo: true,
            },

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
      });

      if (!equipo) {
        return {
          estudianteId,

          modalidad: foro.modalidadParticipacion,

          origenGrupo: foro.origenGrupo,

          dinamicaGrupal: foro.dinamicaGrupal,

          componente,

          grupo: null,

          integrantes: [],

          representante: null,

          esRepresentante: false,

          puedeCrearRespuestaPrincipal: false,

          comentarios: permisosComentarios(false),
        };
      }

      const integranteActual = equipo.integrantes.find(
        (integrante) => integrante.estudianteId === estudianteId,
      );

      const integranteRepresentante = equipo.integrantes.find(
        (integrante) => integrante.esRepresentante,
      );

      return {
        estudianteId,

        modalidad: foro.modalidadParticipacion,

        origenGrupo: foro.origenGrupo,

        dinamicaGrupal: foro.dinamicaGrupal,

        grupo: {
          id: equipo.id,

          nombre: equipo.nombre,

          color: null,
        },

        integrantes: equipo.integrantes.map((integrante) => ({
          estudianteId: integrante.estudianteId,

          esRepresentante: integrante.esRepresentante,

          estudiante: integrante.estudiante,
        })),

        representante: integranteRepresentante?.estudiante ?? null,

        esRepresentante: Boolean(integranteActual?.esRepresentante),

        puedeCrearRespuestaPrincipal: Boolean(
          integranteActual?.esRepresentante,
        ),

        comentarios: permisosComentarios(true),
      };
    }

    return {
      estudianteId,

      modalidad: foro.modalidadParticipacion,

      origenGrupo: foro.origenGrupo,

      dinamicaGrupal: foro.dinamicaGrupal,

      grupo: null,

      integrantes: [],

      representante: null,

      esRepresentante: false,

      puedeCrearRespuestaPrincipal: false,

      comentarios: permisosComentarios(false),
    };
  }

  async listarForos(
    usuario: UsuarioAutenticado,
    cursoId: number,
    filtros: ListarForosQueryDto = {},
  ) {
    this.validarRolConsulta(usuario);

    await this.cierreAutomatico.procesarCicloForos();

    if (usuario.rol === Rol.DOCENTE) {
      await this.obtenerCursoDocente(usuario.id, cursoId);
    } else {
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
        throw new NotFoundException(
          'No tienes una inscripción activa en este curso',
        );
      }
    }

    const ahora = new Date();

    const foros = await this.prisma.temaForoCurso.findMany({
      where: {
        cursoId,

        estaActivo: true,

        ...(filtros.hitoId
          ? {
              hitoId: filtros.hitoId,
            }
          : {}),

        ...(filtros.estado
          ? {
              estado: filtros.estado,
            }
          : {}),

        ...(filtros.autorId
          ? {
              autorId: filtros.autorId,
            }
          : {}),

        ...(filtros.grupoId
          ? {
              conjuntoGrupoId: filtros.grupoId,
            }
          : {}),

        ...(filtros.busqueda
          ? {
              OR: [
                {
                  titulo: {
                    contains: filtros.busqueda,
                    mode: 'insensitive',
                  },
                },
                {
                  contenido: {
                    contains: filtros.busqueda,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),

        ...(usuario.rol === Rol.ESTUDIANTE
          ? {
              AND: [
                {
                  estado: {
                    notIn: [EstadoForo.BORRADOR, EstadoForo.ANULADO],
                  },
                },
                {
                  OR: [
                    {
                      visibleAntesDeApertura: true,
                    },
                    {
                      fechaApertura: {
                        lte: ahora,
                      },
                    },
                  ],
                },
              ],
            }
          : {}),
      },

      /*
       * Prisma devuelve una base estable por creación.
       * La prioridad pedagógica final se aplica después del findMany,
       * porque necesitamos combinar estado + fechas + fijado.
       */
      orderBy: [
        {
          creadoEn: 'desc',
        },
      ],

      include: {
        hito: {
          select: {
            id: true,

            numero: true,

            codigo: true,

            nombre: true,
          },
        },

        autor: {
          select: {
            id: true,

            nombres: true,

            apellidoPaterno: true,

            apellidoMaterno: true,

            fotoPerfilUrl: true,
          },
        },

        conjuntoGrupo: {
          select: {
            id: true,

            nombre: true,

            alcance: true,
          },
        },

        actividadCalificable: {
          select: {
            id: true,

            componente: true,

            participaEnPromedio: true,

            estado: true,
          },
        },

        _count: {
          select: {
            respuestas: true,

            equiposAfinidad: true,

            archivos: true,
          },
        },
      },
    });

    const prioridadEstado = (estado: EstadoForo) => {
      const prioridades: Record<EstadoForo, number> = {
        ABIERTO: 1,

        PROGRAMADO: 2,

        VENCIDO: 3,

        CALIFICANDO: 4,

        CERRADO: 5,

        CALIFICADO: 6,

        NOTAS_PUBLICADAS: 7,

        BORRADOR: 8,

        ANULADO: 9,
      };

      return prioridades[estado];
    };

    const tiempo = (fecha: Date | null | undefined, respaldo: Date) =>
      fecha?.getTime() ?? respaldo.getTime();

    return [...foros].sort((a, b) => {
      /*
       * 1. Los foros fijados siempre van primero.
       *    Dentro de los fijados se siguen aplicando las mismas
       *    reglas de estado y fechas.
       */
      if (a.estaFijado !== b.estaFijado) {
        return a.estaFijado ? -1 : 1;
      }

      const prioridadA = prioridadEstado(a.estado);

      const prioridadB = prioridadEstado(b.estado);

      if (prioridadA !== prioridadB) {
        return prioridadA - prioridadB;
      }

      /*
       * 2. ABIERTOS:
       *    el que vence antes aparece primero.
       */
      if (a.estado === EstadoForo.ABIERTO && b.estado === EstadoForo.ABIERTO) {
        return (
          tiempo(a.fechaLimite, a.creadoEn) - tiempo(b.fechaLimite, b.creadoEn)
        );
      }

      /*
       * 3. PROGRAMADOS:
       *    el que abre antes aparece primero.
       */
      if (
        a.estado === EstadoForo.PROGRAMADO &&
        b.estado === EstadoForo.PROGRAMADO
      ) {
        return (
          tiempo(a.fechaApertura, a.creadoEn) -
          tiempo(b.fechaApertura, b.creadoEn)
        );
      }

      /*
       * 4. VENCIDOS:
       *    si todavía existe un cierre definitivo/retraso,
       *    el más próximo queda primero.
       */
      if (a.estado === EstadoForo.VENCIDO && b.estado === EstadoForo.VENCIDO) {
        return (
          tiempo(a.fechaCierre, a.creadoEn) - tiempo(b.fechaCierre, b.creadoEn)
        );
      }

      /*
       * 5. Estados finalizados o de calificación:
       *    se muestran del más reciente al más antiguo.
       */
      const estadosFinalizados: EstadoForo[] = [
        EstadoForo.CERRADO,
        EstadoForo.CALIFICANDO,
        EstadoForo.CALIFICADO,
        EstadoForo.NOTAS_PUBLICADAS,
      ];

      if (
        estadosFinalizados.includes(a.estado) &&
        estadosFinalizados.includes(b.estado)
      ) {
        return (
          tiempo(b.fechaCierre, b.actualizadoEn) -
          tiempo(a.fechaCierre, a.actualizadoEn)
        );
      }

      /*
       * 6. Desempate general:
       *    el más recientemente creado primero.
       */
      return b.creadoEn.getTime() - a.creadoEn.getTime();
    });
  }

  async obtenerDetalle(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
  ) {
    this.validarRolConsulta(usuario);

    await this.cierreAutomatico.procesarCicloForos();

    if (usuario.rol === Rol.DOCENTE) {
      await this.obtenerCursoDocente(usuario.id, cursoId);
    } else {
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
        throw new NotFoundException(
          'No tienes una inscripción activa en este curso',
        );
      }
    }

    const foro = await this.prisma.temaForoCurso.findFirst({
      where: {
        id: foroId,

        cursoId,

        estaActivo: true,
      },

      include: {
        hito: true,

        autor: {
          select: {
            id: true,

            nombres: true,

            apellidoPaterno: true,

            apellidoMaterno: true,

            fotoPerfilUrl: true,
          },
        },

        conjuntoGrupo: {
          include: {
            grupos: {
              where: {
                estaActivo: true,
              },

              select: {
                id: true,

                nombre: true,

                color: true,

                _count: {
                  select: {
                    integrantes: true,
                  },
                },
              },
            },
          },
        },

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

        archivos: {
          where: {
            estaActivo: true,
          },

          orderBy: {
            creadoEn: 'asc',
          },
        },

        _count: {
          select: {
            respuestas: true,

            equiposAfinidad: true,
          },
        },
      },
    });

    if (!foro) {
      throw new NotFoundException('El foro no existe');
    }

    if (
      usuario.rol === Rol.ESTUDIANTE &&
      (foro.estado === EstadoForo.BORRADOR ||
        foro.estado === EstadoForo.ANULADO ||
        (!foro.visibleAntesDeApertura &&
          foro.fechaApertura &&
          foro.fechaApertura > new Date()))
    ) {
      throw new ForbiddenException('El foro todavía no está disponible');
    }

    if (usuario.rol !== Rol.ESTUDIANTE) {
      return foro;
    }

    const miParticipacion = await this.construirMiParticipacionEstudiante(
      usuario.id,
      foro,
    );

    return {
      ...foro,

      miParticipacion,
    };
  }

  async actualizarForo(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: ActualizarForoDto,
  ) {
    this.validarDocente(usuario);

    await this.obtenerCursoDocente(usuario.id, cursoId);

    const foroActual = await this.prisma.temaForoCurso.findFirst({
      where: {
        id: foroId,

        cursoId,

        autorId: usuario.id,

        estaActivo: true,
      },

      include: {
        actividadCalificable: {
          include: {
            rubrica: {
              select: {
                id: true,
              },
            },

            _count: {
              select: {
                calificaciones: true,
              },
            },
          },
        },

        _count: {
          select: {
            respuestas: true,
          },
        },
      },
    });

    if (!foroActual) {
      throw new NotFoundException('El foro no existe');
    }

    const estadosNoEditables: EstadoForo[] = [
      EstadoForo.CERRADO,
      EstadoForo.CALIFICANDO,
      EstadoForo.CALIFICADO,
      EstadoForo.NOTAS_PUBLICADAS,
      EstadoForo.ANULADO,
    ];

    if (
      foroActual.estaCerrado ||
      estadosNoEditables.includes(foroActual.estado)
    ) {
      throw new BadRequestException(
        'El foro ya no puede editarse en su estado actual',
      );
    }

    const esCalificable = datos.esCalificable ?? foroActual.esCalificable;

    const componente =
      datos.componente ?? foroActual.actividadCalificable?.componente;

    if (esCalificable && !componente) {
      throw new BadRequestException(
        'Debes indicar el componente de evaluación para convertir el foro en calificable',
      );
    }

    if (
      !esCalificable &&
      foroActual.actividadCalificable &&
      (foroActual.actividadCalificable.rubrica ||
        foroActual.actividadCalificable._count.calificaciones > 0)
    ) {
      throw new BadRequestException(
        'No puedes convertir el foro en no calificable porque ya tiene rúbrica o calificaciones registradas',
      );
    }

    const modalidad =
      datos.modalidadParticipacion ?? foroActual.modalidadParticipacion;

    const origen = datos.origenGrupo ?? foroActual.origenGrupo;

    const dinamica = datos.dinamicaGrupal ?? foroActual.dinamicaGrupal;

    const conjuntoId =
      datos.conjuntoGrupoId !== undefined
        ? datos.conjuntoGrupoId
        : foroActual.conjuntoGrupoId;

    this.validarConfiguracionGrupal({
      modalidadParticipacion: modalidad,

      origenGrupo: origen,

      dinamicaGrupal: dinamica,

      conjuntoGrupoId: conjuntoId,
    });

    this.validarRangos({
      cantidadMinimaIntegrantes:
        datos.cantidadMinimaIntegrantes !== undefined
          ? datos.cantidadMinimaIntegrantes
          : foroActual.cantidadMinimaIntegrantes,

      cantidadMaximaIntegrantes:
        datos.cantidadMaximaIntegrantes !== undefined
          ? datos.cantidadMaximaIntegrantes
          : foroActual.cantidadMaximaIntegrantes,

      minimoComentariosPorEstudiante:
        datos.minimoComentariosPorEstudiante ??
        foroActual.minimoComentariosPorEstudiante,

      maximoComentariosPorEstudiante:
        datos.maximoComentariosPorEstudiante !== undefined
          ? datos.maximoComentariosPorEstudiante
          : foroActual.maximoComentariosPorEstudiante,

      palabrasMinimasRespuesta:
        datos.palabrasMinimasRespuesta !== undefined
          ? datos.palabrasMinimasRespuesta
          : foroActual.palabrasMinimasRespuesta,

      palabrasMaximasRespuesta:
        datos.palabrasMaximasRespuesta !== undefined
          ? datos.palabrasMaximasRespuesta
          : foroActual.palabrasMaximasRespuesta,

      palabrasMinimasComentario:
        datos.palabrasMinimasComentario !== undefined
          ? datos.palabrasMinimasComentario
          : foroActual.palabrasMinimasComentario,

      palabrasMaximasComentario:
        datos.palabrasMaximasComentario !== undefined
          ? datos.palabrasMaximasComentario
          : foroActual.palabrasMaximasComentario,
    });

    const modalidadNota = datos.modalidadNota ?? foroActual.modalidadNota;

    const porcentajeGrupal =
      datos.porcentajeNotaGrupal !== undefined
        ? datos.porcentajeNotaGrupal
        : foroActual.porcentajeNotaGrupal
          ? Number(foroActual.porcentajeNotaGrupal)
          : null;

    const porcentajeIndividual =
      datos.porcentajeNotaIndividual !== undefined
        ? datos.porcentajeNotaIndividual
        : foroActual.porcentajeNotaIndividual
          ? Number(foroActual.porcentajeNotaIndividual)
          : null;

    if (esCalificable) {
      this.validarPorcentajesNota(
        modalidadNota,
        porcentajeGrupal,
        porcentajeIndividual,
      );
    }

    const penalizarComentariosActualizado =
      datos.penalizarIncumplimientoComentarios !== undefined
        ? datos.penalizarIncumplimientoComentarios
        : foroActual.penalizarIncumplimientoComentarios;

    const tipoPenalizacionComentariosActualizado =
      penalizarComentariosActualizado
        ? (datos.tipoPenalizacionComentarios ??
          foroActual.tipoPenalizacionComentarios)
        : TipoPenalizacionComentarios.NINGUNA;

    const valorPenalizacionComentariosActualizado =
      penalizarComentariosActualizado
        ? datos.valorPenalizacionComentarios !== undefined
          ? datos.valorPenalizacionComentarios
          : foroActual.valorPenalizacionComentarios
            ? Number(foroActual.valorPenalizacionComentarios)
            : null
        : null;

    this.validarPenalizacionComentarios({
      esCalificable,
      modalidadParticipacion: modalidad,
      dinamicaGrupal: dinamica,
      minimoComentariosPorEstudiante:
        datos.minimoComentariosPorEstudiante ??
        foroActual.minimoComentariosPorEstudiante,
      penalizarIncumplimientoComentarios: penalizarComentariosActualizado,
      tipoPenalizacionComentarios: tipoPenalizacionComentariosActualizado,
      valorPenalizacionComentarios: valorPenalizacionComentariosActualizado,
    });

    const fechaApertura = datos.fechaApertura
      ? new Date(datos.fechaApertura)
      : foroActual.fechaApertura;

    const fechaLimite = datos.fechaLimite
      ? new Date(datos.fechaLimite)
      : foroActual.fechaLimite;

    const fechaCierre = datos.fechaCierre
      ? new Date(datos.fechaCierre)
      : foroActual.fechaCierre;

    const permitirRetrasos =
      datos.permitirRetrasos ?? foroActual.permitirRetrasos;

    const fechaMaximaRetraso =
      datos.fechaMaximaRetraso !== undefined
        ? datos.fechaMaximaRetraso
          ? new Date(datos.fechaMaximaRetraso)
          : null
        : foroActual.fechaMaximaRetraso;

    if (!fechaApertura || !fechaLimite || !fechaCierre) {
      throw new BadRequestException(
        'El foro debe tener fechas de apertura, límite y cierre',
      );
    }

    this.validarFechas(
      fechaApertura,
      fechaLimite,
      fechaCierre,
      permitirRetrasos,
      fechaMaximaRetraso,
    );

    const estadosTemporalesEditables: EstadoForo[] = [
      EstadoForo.PROGRAMADO,
      EstadoForo.ABIERTO,
    ];

    const estadoTrasEditarFechas = estadosTemporalesEditables.includes(
      foroActual.estado,
    )
      ? this.calcularEstadoInicial(fechaApertura)
      : foroActual.estado;

    const conjunto =
      origen === OrigenGrupoForo.PLATAFORMA
        ? await this.validarConjuntoPlataforma(
            cursoId,
            foroActual.hitoId!,
            conjuntoId,
          )
        : null;

    const extensiones = datos.extensionesPermitidas
      ? this.normalizarExtensiones(datos.extensionesPermitidas)
      : foroActual.extensionesPermitidas;

    const actualizado = await this.prisma.$transaction(async (transaccion) => {
      const foro = await transaccion.temaForoCurso.update({
        where: {
          id: foroId,
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

          ...(datos.instrucciones !== undefined
            ? {
                instrucciones: this.normalizarTexto(datos.instrucciones),
              }
            : {}),

          ...(datos.objetivo !== undefined
            ? {
                objetivo: this.normalizarTexto(datos.objetivo ?? undefined),
              }
            : {}),

          esCalificable,

          modalidadParticipacion: modalidad,

          origenGrupo: origen,

          dinamicaGrupal: dinamica,

          conjuntoGrupoId: conjunto?.id ?? null,

          ...(datos.cantidadMinimaIntegrantes !== undefined
            ? {
                cantidadMinimaIntegrantes: datos.cantidadMinimaIntegrantes,
              }
            : {}),

          ...(datos.cantidadMaximaIntegrantes !== undefined
            ? {
                cantidadMaximaIntegrantes: datos.cantidadMaximaIntegrantes,
              }
            : {}),

          ...(datos.requiereAprobacionEquipos !== undefined
            ? {
                requiereAprobacionEquipos: datos.requiereAprobacionEquipos,
              }
            : {}),

          ...(datos.requiereRepresentante !== undefined
            ? {
                requiereRepresentante: datos.requiereRepresentante,
              }
            : {}),

          ...(datos.bloquearEquipoAlResponder !== undefined
            ? {
                bloquearEquipoAlResponder: datos.bloquearEquipoAlResponder,
              }
            : {}),

          ...(datos.permitirComentarios !== undefined
            ? {
                permitirComentarios: datos.permitirComentarios,
              }
            : {}),

          ...(datos.permitirEditarRespuestas !== undefined
            ? {
                permitirEditarRespuestas: datos.permitirEditarRespuestas,
              }
            : {}),

          ...(datos.permitirEliminarRespuestas !== undefined
            ? {
                permitirEliminarRespuestas: datos.permitirEliminarRespuestas,
              }
            : {}),

          ...(datos.permitirEditarComentarios !== undefined
            ? {
                permitirEditarComentarios: datos.permitirEditarComentarios,
              }
            : {}),

          ...(datos.permitirEliminarComentarios !== undefined
            ? {
                permitirEliminarComentarios: datos.permitirEliminarComentarios,
              }
            : {}),

          ...(datos.minimoComentariosPorEstudiante !== undefined
            ? {
                minimoComentariosPorEstudiante:
                  datos.minimoComentariosPorEstudiante,
              }
            : {}),

          ...(datos.maximoComentariosPorEstudiante !== undefined
            ? {
                maximoComentariosPorEstudiante:
                  datos.maximoComentariosPorEstudiante,
              }
            : {}),

          penalizarIncumplimientoComentarios: penalizarComentariosActualizado,

          tipoPenalizacionComentarios: tipoPenalizacionComentariosActualizado,

          valorPenalizacionComentarios:
            valorPenalizacionComentariosActualizado !== null
              ? new Prisma.Decimal(valorPenalizacionComentariosActualizado)
              : null,

          ...(datos.palabrasMinimasRespuesta !== undefined
            ? {
                palabrasMinimasRespuesta: datos.palabrasMinimasRespuesta,
              }
            : {}),

          ...(datos.palabrasMaximasRespuesta !== undefined
            ? {
                palabrasMaximasRespuesta: datos.palabrasMaximasRespuesta,
              }
            : {}),

          ...(datos.palabrasMinimasComentario !== undefined
            ? {
                palabrasMinimasComentario: datos.palabrasMinimasComentario,
              }
            : {}),

          ...(datos.palabrasMaximasComentario !== undefined
            ? {
                palabrasMaximasComentario: datos.palabrasMaximasComentario,
              }
            : {}),

          ...(datos.tipoEvaluacion !== undefined
            ? {
                tipoEvaluacion: datos.tipoEvaluacion,
              }
            : {}),

          modalidadNota,

          porcentajeNotaGrupal:
            porcentajeGrupal !== null
              ? new Prisma.Decimal(porcentajeGrupal)
              : null,

          porcentajeNotaIndividual:
            porcentajeIndividual !== null
              ? new Prisma.Decimal(porcentajeIndividual)
              : null,

          ...(datos.calificacionAutomaticaAlCumplir !== undefined
            ? {
                calificacionAutomaticaAlCumplir:
                  datos.calificacionAutomaticaAlCumplir,
              }
            : {}),

          fechaApertura,

          fechaLimite,

          fechaCierre,

          ...(datos.visibleAntesDeApertura !== undefined
            ? {
                visibleAntesDeApertura: datos.visibleAntesDeApertura,
              }
            : {}),

          estado: estadoTrasEditarFechas,

          estaCerrado: false,

          fechaVencimiento: fechaLimite,

          permitirRetrasos,

          fechaMaximaRetraso,

          tipoDescuentoRetraso: permitirRetrasos
            ? (datos.tipoDescuentoRetraso ?? foroActual.tipoDescuentoRetraso)
            : TipoDescuentoRetraso.NINGUNO,

          valorDescuentoRetraso: permitirRetrasos
            ? datos.valorDescuentoRetraso !== undefined
              ? datos.valorDescuentoRetraso !== null
                ? new Prisma.Decimal(datos.valorDescuentoRetraso)
                : null
              : foroActual.valorDescuentoRetraso
            : null,

          ...(datos.visibilidadRespuestas !== undefined
            ? {
                visibilidadRespuestas: datos.visibilidadRespuestas,
              }
            : {}),

          ...(datos.permitirAdjuntosTema !== undefined
            ? {
                permitirAdjuntosTema: datos.permitirAdjuntosTema,
              }
            : {}),

          ...(datos.permitirAdjuntosRespuesta !== undefined
            ? {
                permitirAdjuntosRespuesta: datos.permitirAdjuntosRespuesta,
              }
            : {}),

          ...(datos.permitirAdjuntosComentario !== undefined
            ? {
                permitirAdjuntosComentario: datos.permitirAdjuntosComentario,
              }
            : {}),

          ...(datos.exigirAdjuntoRespuesta !== undefined
            ? {
                exigirAdjuntoRespuesta: datos.exigirAdjuntoRespuesta,
              }
            : {}),

          ...(datos.permitirDescargaAdjuntos !== undefined
            ? {
                permitirDescargaAdjuntos: datos.permitirDescargaAdjuntos,
              }
            : {}),

          ...(datos.maximoArchivosTema !== undefined
            ? {
                maximoArchivosTema: datos.maximoArchivosTema,
              }
            : {}),

          ...(datos.maximoArchivosRespuesta !== undefined
            ? {
                maximoArchivosRespuesta: datos.maximoArchivosRespuesta,
              }
            : {}),

          ...(datos.maximoArchivosComentario !== undefined
            ? {
                maximoArchivosComentario: datos.maximoArchivosComentario,
              }
            : {}),

          ...(datos.tamanioMaximoArchivoMb !== undefined
            ? {
                tamanioMaximoArchivoMb: datos.tamanioMaximoArchivoMb,
              }
            : {}),

          extensionesPermitidas: extensiones,

          editadoEn: new Date(),
        },
      });

      if (esCalificable && foroActual.actividadCalificable) {
        await transaccion.actividadCalificable.update({
          where: {
            id: foroActual.actividadCalificable.id,
          },

          data: {
            componente: componente!,

            ...(datos.titulo !== undefined
              ? {
                  titulo: datos.titulo.trim(),
                }
              : {}),

            ...(datos.instrucciones !== undefined
              ? {
                  descripcion: this.normalizarTexto(datos.instrucciones),
                }
              : {}),

            ...(datos.participaEnPromedio !== undefined
              ? {
                  participaEnPromedio: datos.participaEnPromedio,
                }
              : {}),

            estado:
              estadoTrasEditarFechas === EstadoForo.ABIERTO ||
              estadoTrasEditarFechas === EstadoForo.VENCIDO
                ? EstadoActividadCalificable.ACTIVA
                : EstadoActividadCalificable.BORRADOR,

            visibleParaEstudiantes:
              estadoTrasEditarFechas === EstadoForo.ABIERTO ||
              estadoTrasEditarFechas === EstadoForo.VENCIDO,
          },
        });
      } else if (esCalificable && !foroActual.actividadCalificable) {
        const actividad = await transaccion.actividadCalificable.create({
          data: {
            cursoId,

            hitoId: foroActual.hitoId,

            creadorId: usuario.id,

            foroId,

            origen: TipoOrigenActividad.FORO,

            componente: componente!,

            titulo: datos.titulo?.trim() ?? foroActual.titulo,

            descripcion:
              datos.instrucciones !== undefined
                ? this.normalizarTexto(datos.instrucciones)
                : (foroActual.instrucciones ??
                  foroActual.contenido.slice(0, 1200)),

            puntajeMaximo: new Prisma.Decimal(100),

            participaEnPromedio: datos.participaEnPromedio ?? true,

            estado:
              estadoTrasEditarFechas === EstadoForo.ABIERTO ||
              estadoTrasEditarFechas === EstadoForo.VENCIDO
                ? EstadoActividadCalificable.ACTIVA
                : EstadoActividadCalificable.BORRADOR,

            visibleParaEstudiantes:
              estadoTrasEditarFechas === EstadoForo.ABIERTO ||
              estadoTrasEditarFechas === EstadoForo.VENCIDO,
          },
        });

        await transaccion.historialCalificacion.create({
          data: {
            actividadId: actividad.id,

            actorId: usuario.id,

            accion: AccionHistorialCalificacion.ACTIVIDAD_CREADA,

            detalle: {
              foroId,

              motivo: 'Foro convertido en calificable',
            },
          },
        });
      } else if (!esCalificable && foroActual.actividadCalificable) {
        await transaccion.actividadCalificable.delete({
          where: {
            id: foroActual.actividadCalificable.id,
          },
        });
      }

      await transaccion.historialForoCurso.create({
        data: {
          temaId: foroId,

          actorId: usuario.id,

          accion: AccionHistorialForo.FORO_ACTUALIZADO,

          detalle: {
            campos: Object.keys(datos),

            ...(datos.visibleAntesDeApertura !== undefined
              ? {
                  visibleAntesDeApertura: datos.visibleAntesDeApertura,
                }
              : {}),
          },
        },
      });

      return foro;
    });

    return {
      mensaje: 'Foro actualizado correctamente',

      foro: actualizado,
    };
  }

  private validarTransicionEstado(actual: EstadoForo, siguiente: EstadoForo) {
    const permitidas: Record<EstadoForo, EstadoForo[]> = {
      BORRADOR: [
        EstadoForo.PROGRAMADO,
        EstadoForo.ABIERTO,
        EstadoForo.CERRADO,
        EstadoForo.ANULADO,
      ],

      PROGRAMADO: [
        EstadoForo.ABIERTO,
        EstadoForo.BORRADOR,
        EstadoForo.CERRADO,
        EstadoForo.ANULADO,
      ],

      ABIERTO: [EstadoForo.VENCIDO, EstadoForo.CERRADO, EstadoForo.ANULADO],

      VENCIDO: [EstadoForo.CERRADO, EstadoForo.ABIERTO, EstadoForo.ANULADO],

      CERRADO: [EstadoForo.CALIFICANDO, EstadoForo.ABIERTO],

      CALIFICANDO: [EstadoForo.CALIFICADO, EstadoForo.CERRADO],

      CALIFICADO: [EstadoForo.NOTAS_PUBLICADAS, EstadoForo.CALIFICANDO],

      NOTAS_PUBLICADAS: [EstadoForo.CALIFICADO],

      ANULADO: [],
    };

    if (!permitidas[actual].includes(siguiente)) {
      throw new BadRequestException(
        `No se puede cambiar el foro de ${actual} a ${siguiente}`,
      );
    }
  }

  async cambiarEstado(
    usuario: UsuarioAutenticado,
    cursoId: number,
    foroId: number,
    datos: CambiarEstadoForoDto,
  ) {
    this.validarDocente(usuario);

    await this.obtenerCursoDocente(usuario.id, cursoId);

    const foro = await this.prisma.temaForoCurso.findFirst({
      where: {
        id: foroId,

        cursoId,

        autorId: usuario.id,

        estaActivo: true,
      },

      include: {
        actividadCalificable: true,
      },
    });

    if (!foro) {
      throw new NotFoundException('El foro no existe');
    }

    this.validarTransicionEstado(foro.estado, datos.estado);

    const fecha = new Date();

    const accion =
      datos.estado === EstadoForo.ABIERTO
        ? foro.estado === EstadoForo.CERRADO
          ? AccionHistorialForo.FORO_REABIERTO
          : AccionHistorialForo.FORO_ABIERTO
        : datos.estado === EstadoForo.CERRADO
          ? AccionHistorialForo.FORO_CERRADO
          : datos.estado === EstadoForo.ANULADO
            ? AccionHistorialForo.FORO_ANULADO
            : AccionHistorialForo.FORO_ACTUALIZADO;

    const estadosCerrados: EstadoForo[] = [
      EstadoForo.CERRADO,
      EstadoForo.CALIFICANDO,
      EstadoForo.CALIFICADO,
      EstadoForo.NOTAS_PUBLICADAS,
    ];

    const actualizado = await this.prisma.$transaction(async (transaccion) => {
      const resultado = await transaccion.temaForoCurso.update({
        where: {
          id: foro.id,
        },

        data: {
          estado: datos.estado,

          estaCerrado: estadosCerrados.includes(datos.estado),

          ...(datos.estado === EstadoForo.ANULADO
            ? {
                estaActivo: false,

                eliminadoEn: fecha,
              }
            : {}),

          ...(datos.estado === EstadoForo.NOTAS_PUBLICADAS
            ? {
                notasPublicadasEn: fecha,
              }
            : {}),
        },
      });

      if (foro.actividadCalificable) {
        const estadoActividad =
          datos.estado === EstadoForo.ABIERTO ||
          datos.estado === EstadoForo.VENCIDO
            ? EstadoActividadCalificable.ACTIVA
            : datos.estado === EstadoForo.CERRADO
              ? EstadoActividadCalificable.CERRADA
              : datos.estado === EstadoForo.CALIFICANDO
                ? EstadoActividadCalificable.CALIFICANDO
                : datos.estado === EstadoForo.CALIFICADO
                  ? EstadoActividadCalificable.CALIFICADA
                  : datos.estado === EstadoForo.NOTAS_PUBLICADAS
                    ? EstadoActividadCalificable.PUBLICADA
                    : datos.estado === EstadoForo.ANULADO
                      ? EstadoActividadCalificable.ANULADA
                      : EstadoActividadCalificable.BORRADOR;

        await transaccion.actividadCalificable.update({
          where: {
            id: foro.actividadCalificable.id,
          },

          data: {
            estado: estadoActividad,

            visibleParaEstudiantes:
              datos.estado !== EstadoForo.BORRADOR &&
              datos.estado !== EstadoForo.PROGRAMADO &&
              datos.estado !== EstadoForo.ANULADO,

            ...(estadoActividad === EstadoActividadCalificable.CERRADA
              ? {
                  cerradaEn: fecha,
                }
              : {}),

            ...(estadoActividad === EstadoActividadCalificable.PUBLICADA
              ? {
                  publicadaEn: fecha,
                }
              : {}),
          },
        });
      }

      await transaccion.historialForoCurso.create({
        data: {
          temaId: foro.id,

          actorId: usuario.id,

          accion,

          detalle: {
            estadoAnterior: foro.estado,

            estadoNuevo: datos.estado,
          },
        },
      });

      return resultado;
    });

    const foroFinal =
      datos.estado === EstadoForo.CERRADO
        ? await this.cierreAutomatico.cerrarYProcesar(foro.id)
        : actualizado;

    return {
      mensaje: 'Estado del foro actualizado correctamente',

      foro: foroFinal ?? actualizado,
    };
  }
}
