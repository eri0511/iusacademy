import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccionHistorialCalificacion,
  ComponenteEvaluacion,
  EstadoActividadCalificable,
  EstadoCalificacion,
  EstadoInscripcion,
  EstadoIntentoQuiz,
  EstadoParticipanteQuiz,
  EstadoProcesamientoDataset,
  EstadoQuiz,
  EstadoRecursoCurso,
  EstadoVersionRecurso,
  ModalidadQuiz,
  Rol,
  RitmoQuiz,
  TipoContenidoRecurso,
  TipoOrigenActividad,
  UsoRecursoCurso,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import type {
  UsuarioAutenticado,
} from '../archivos/interfaces/usuario-autenticado.interface';

import {
  ActualizarQuizDto,
} from './dto/actualizar-quiz.dto';

import {
  AgregarFragmentoQuizDto,
} from './dto/agregar-fragmento-quiz.dto';

import {
  AgregarFuenteQuizDto,
} from './dto/agregar-fuente-quiz.dto';

import {
  CrearPreguntaQuizDto,
} from './dto/crear-pregunta-quiz.dto';

import {
  CrearQuizDto,
} from './dto/crear-quiz.dto';

import {
  ResponderPreguntaQuizDto,
} from './dto/responder-pregunta-quiz.dto';

import {
  SeleccionarAvatarQuizDto,
} from './dto/seleccionar-avatar-quiz.dto';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private readonly presenciaQuizMs =
    12000;

  private limitePresencia() {
    return new Date(
      Date.now() -
        this.presenciaQuizMs,
    );
  }

  private readonly includeDetalle = {
    hito: {
      select: {
        id:
          true,

        numero:
          true,

        codigo:
          true,

        nombre:
          true,
      },
    },

    creador: {
      select: {
        id:
          true,

        nombres:
          true,

        apellidoPaterno:
          true,

        apellidoMaterno:
          true,
      },
    },

    actividadCalificable:
      true,

    fuentes: {
      orderBy: {
        orden:
          'asc' as const,
      },

      include: {
        version: {
          include: {
            archivo: {
              select: {
                id:
                  true,

                nombreOriginal:
                  true,

                extension:
                  true,

                mimeType:
                  true,

                tamanioBytes:
                  true,

                hashSha256:
                  true,

                textoExtraido:
                  true,
              },
            },

            contenido: {
              include: {
                recurso:
                  true,
              },
            },
          },
        },

        fragmentos: {
          orderBy: {
            orden:
              'asc' as const,
          },
        },
      },
    },

    preguntas: {
      where: {
        estaActiva:
          true,
      },

      orderBy: {
        orden:
          'asc' as const,
      },

      include: {
        opciones: {
          orderBy: {
            orden:
              'asc' as const,
          },
        },

        fragmento:
          true,
      },
    },
  };

  private exigirDocente(
    usuario:
      UsuarioAutenticado,
  ) {
    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Solo el docente puede administrar Quizzes',
      );
    }
  }

  private async validarCursoDocente(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,
  ) {
    this.exigirDocente(
      usuario,
    );

    const curso =
      await this.prisma.curso.findFirst({
        where: {
          id:
            cursoId,

          docenteId:
            usuario.id,
        },

        select: {
          id:
            true,

          docenteId:
            true,

          planificacionId:
            true,
        },
      });

    if (
      !curso
    ) {
      throw new NotFoundException(
        'El curso no existe o no pertenece al docente',
      );
    }

    return curso;
  }

  private async validarEstudianteCurso(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,
  ) {
    if (
      usuario.rol !==
      Rol.ESTUDIANTE
    ) {
      throw new ForbiddenException(
        'Solo los estudiantes pueden realizar esta acción',
      );
    }

    const inscripcion =
      await this.prisma.inscripcionCurso.findFirst({
        where: {
          cursoId,

          estudianteId:
            usuario.id,

          estado:
            EstadoInscripcion.ACTIVA,
        },

        select: {
          id:
            true,
        },
      });

    if (
      !inscripcion
    ) {
      throw new ForbiddenException(
        'No tienes una inscripción activa en este curso',
      );
    }
  }

  private async validarHito(
    planificacionId:
      number | null,

    hitoId:
      number,
  ) {
    if (
      !planificacionId
    ) {
      throw new BadRequestException(
        'El curso no tiene planificación académica',
      );
    }

    const hito =
      await this.prisma.hitoAcademico.findFirst({
        where: {
          id:
            hitoId,

          planificacionId,
        },

        select: {
          id:
            true,
        },
      });

    if (
      !hito
    ) {
      throw new BadRequestException(
        'El hito seleccionado no pertenece a la planificación del curso',
      );
    }

    return hito;
  }

  private validarConfiguracion(
    datos:
      CrearQuizDto |
      ActualizarQuizDto |
      {
        esCalificable:
          boolean;

        componente?:
          ComponenteEvaluacion;

        modalidad:
          ModalidadQuiz;

        aperturaProgramada?:
          string;

        cierreProgramado?:
          string;

        usarRanking:
          boolean;

        descuentoPorPuesto:
          number;
      },
  ) {
    if (
      datos.esCalificable &&
      !datos.componente
    ) {
      throw new BadRequestException(
        'Un Quiz calificable debe pertenecer a evaluación CONTINUA o PROCESUAL',
      );
    }

    if (
      !datos.esCalificable &&
      datos.componente
    ) {
      throw new BadRequestException(
        'Un Quiz de práctica no debe tener componente de evaluación',
      );
    }

    if (
      datos.modalidad ===
      ModalidadQuiz.PROGRAMADO
    ) {
      if (
        !datos.aperturaProgramada
      ) {
        throw new BadRequestException(
          'Un Quiz programado requiere fecha y hora de apertura',
        );
      }

      const apertura =
        new Date(
          datos.aperturaProgramada,
        );

      if (
        Number.isNaN(
          apertura.getTime(),
        )
      ) {
        throw new BadRequestException(
          'La fecha de apertura del Quiz no es válida',
        );
      }

      if (
        apertura <=
        new Date()
      ) {
        throw new BadRequestException(
          'La apertura programada debe ser posterior al momento actual',
        );
      }

      if (
        datos.cierreProgramado
      ) {
        const cierre =
          new Date(
            datos.cierreProgramado,
          );

        if (
          Number.isNaN(
            cierre.getTime(),
          )
        ) {
          throw new BadRequestException(
            'La fecha de cierre del Quiz no es válida',
          );
        }

        if (
          cierre <=
          apertura
        ) {
          throw new BadRequestException(
            'La fecha de cierre debe ser posterior a la apertura',
          );
        }
      }
    }

    const velocidad = datos as {
      usarPuntuacionVelocidad?: boolean;
      descuentoVelocidadPorPosicion?: number;
      puntajeMinimoVelocidad?: number;
    };

    if (
      velocidad.usarPuntuacionVelocidad &&
      (velocidad.descuentoVelocidadPorPosicion ?? 0) <= 0
    ) {
      throw new BadRequestException(
        'Si activas la puntuación por velocidad, el descuento por posición debe ser mayor a 0',
      );
    }

    if (
      (velocidad.descuentoVelocidadPorPosicion ?? 0) > 100
    ) {
      throw new BadRequestException(
        'El descuento por posición no puede superar 100 puntos',
      );
    }

    if (
      (velocidad.puntajeMinimoVelocidad ?? 0) < 0 ||
      (velocidad.puntajeMinimoVelocidad ?? 0) > 100
    ) {
      throw new BadRequestException(
        'El puntaje mínimo protegido debe estar entre 0 y 100',
      );
    }
  }

  private async buscarQuizDocente(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    await this.validarCursoDocente(
      usuario,
      cursoId,
    );

    const quiz =
      await this.prisma.quizCurso.findFirst({
        where: {
          id:
            quizId,

          cursoId,
        },

        include:
          this.includeDetalle,
      });

    if (
      !quiz
    ) {
      throw new NotFoundException(
        'El Quiz no existe',
      );
    }

    return quiz;
  }

  private obtenerTiempoPregunta(
    quiz: {
      tiempoPreguntaSegundos:
        number;

      tiempoFacilSegundos:
        number;

      tiempoMedioSegundos:
        number;

      tiempoDificilSegundos:
        number;

      modoTiempo:
        string;
    },

    pregunta: {
      tiempoSegundos:
        number | null;

      dificultad:
        string;
    },
  ) {
    if (
      pregunta.tiempoSegundos
    ) {
      return pregunta.tiempoSegundos;
    }

    if (
      quiz.modoTiempo ===
      'AUTOMATICO_DIFICULTAD'
    ) {
      if (
        pregunta.dificultad ===
        'FACIL'
      ) {
        return quiz.tiempoFacilSegundos;
      }

      if (
        pregunta.dificultad ===
        'DIFICIL'
      ) {
        return quiz.tiempoDificilSegundos;
      }

      return quiz.tiempoMedioSegundos;
    }

    return quiz.tiempoPreguntaSegundos;
  }

  private readonly avancesAutomaticos = new Set<number>();

  private async sincronizarRitmoAutomatico(quizId: number) {
    if (this.avancesAutomaticos.has(quizId)) return;
    this.avancesAutomaticos.add(quizId);

    try {
      const quiz = await this.prisma.quizCurso.findUnique({
        where: { id: quizId },
        include: {
          preguntas: {
            where: { estaActiva: true },
            orderBy: { orden: 'asc' },
          },
        },
      });

      if (
        !quiz ||
        quiz.ritmo !== RitmoQuiz.AUTOMATICO ||
        quiz.estado !== EstadoQuiz.EN_CURSO ||
        quiz.preguntaActualOrden === null
      ) return;

      const actual = quiz.preguntas.find(
        (pregunta) => pregunta.orden === quiz.preguntaActualOrden,
      );
      if (!actual) return;

      const [totalActivos, respondieron] = await Promise.all([
        this.prisma.intentoQuiz.count({
          where: { quizId, estado: EstadoIntentoQuiz.EN_CURSO },
        }),
        this.prisma.respuestaIntentoQuiz.count({
          where: {
            preguntaId: actual.id,
            intento: { quizId, estado: EstadoIntentoQuiz.EN_CURSO },
          },
        }),
      ]);

      const ahora = new Date();
      const tiempoAgotado = Boolean(
        quiz.preguntaCierraEn && ahora >= quiz.preguntaCierraEn,
      );
      const todosRespondieron = totalActivos > 0 && respondieron >= totalActivos;

      if (!tiempoAgotado && !todosRespondieron) return;

      const siguiente = quiz.preguntas.find(
        (pregunta) => pregunta.orden > actual.orden,
      );

      if (!siguiente) {
        const docenteSistema = {
          id: quiz.creadorId,
          rol: Rol.DOCENTE,
        } as UsuarioAutenticado;

        await this.finalizar(docenteSistema, quiz.cursoId, quiz.id);
        return;
      }

      const tiempo = this.obtenerTiempoPregunta(quiz, siguiente);
      const inicio = new Date();

      await this.prisma.quizCurso.updateMany({
        where: {
          id: quiz.id,
          estado: EstadoQuiz.EN_CURSO,
          preguntaActualOrden: actual.orden,
        },
        data: {
          preguntaActualOrden: siguiente.orden,
          preguntaIniciadaEn: inicio,
          preguntaCierraEn: new Date(inicio.getTime() + tiempo * 1000),
          tiempoRestantePreguntaSegundos: null,
        },
      });
    } finally {
      this.avancesAutomaticos.delete(quizId);
    }
  }

  async listar(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,
  ) {
    if (
      usuario.rol ===
      Rol.DOCENTE
    ) {
      await this.validarCursoDocente(
        usuario,
        cursoId,
      );

      return this.prisma.quizCurso.findMany({
        where: {
          cursoId,
        },

        orderBy: {
          creadoEn:
            'desc',
        },

        include:
          this.includeDetalle,
      });
    }

    await this.validarEstudianteCurso(
      usuario,
      cursoId,
    );

    return this.prisma.quizCurso.findMany({
      where: {
        cursoId,

        estado: {
          in: [
            EstadoQuiz.ESPERANDO,
            EstadoQuiz.CUENTA_REGRESIVA,
            EstadoQuiz.EN_CURSO,
            EstadoQuiz.PAUSADO,
            EstadoQuiz.FINALIZADO,
          ],
        },
      },

      orderBy: {
        creadoEn:
          'desc',
      },

      select: {
        id:
          true,

        titulo:
          true,

        descripcion:
          true,

        dificultad:
          true,

        modalidad:
          true,

        estado:
          true,

        esCalificable:
          true,

        componente:
          true,

        hito:
          true,

        aperturaProgramada:
          true,

        cierreProgramado:
          true,

        salaPublicadaEn:
          true,

        inicioEn:
          true,

        finalizadoEn:
          true,

        resultadosPublicados:
          true,

        _count: {
          select: {
            preguntas:
              true,
          },
        },
      },
    });
  }

  async listarDatasets(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,
  ) {
    await this.validarCursoDocente(
      usuario,
      cursoId,
    );

    const contenidos =
      await this.prisma.recursoContenido.findMany({
        where: {
          estaActivo:
            true,

          tipo:
            TipoContenidoRecurso.ARCHIVO,

          disponibleParaQuiz:
            true,

          recurso: {
            cursoId,

            estaActivo:
              true,

            estado:
              EstadoRecursoCurso.ACTIVO,

            uso: {
              in: [
                UsoRecursoCurso.AULA_Y_QUIZZES,
                UsoRecursoCurso.SOLO_QUIZZES,
              ],
            },
          },

          versiones: {
            some: {
              esVigente:
                true,

              estado:
                EstadoVersionRecurso.VIGENTE,

              archivo: {
                extension: {
                  equals:
                    'pdf',

                  mode:
                    'insensitive',
                },
              },
            },
          },
        },

        include: {
          recurso: {
            include: {
              hito:
                true,
            },
          },

          versiones: {
            where: {
              esVigente:
                true,

              estado:
                EstadoVersionRecurso.VIGENTE,

              estadoDataset:
                EstadoProcesamientoDataset.LISTO,
            },

            orderBy: {
              numeroVersion:
                'desc',
            },

            take:
              1,

            include: {
              archivo: {
                select: {
                  id:
                    true,

                  nombreOriginal:
                    true,

                  extension:
                    true,

                  mimeType:
                    true,

                  tamanioBytes:
                    true,

                  textoExtraido:
                    true,

                  hashSha256:
                    true,
                },
              },
            },
          },
        },

        orderBy: [
          {
            recurso: {
              titulo:
                'asc',
            },
          },

          {
            orden:
              'asc',
          },
        ],
      });

    return contenidos
      .map(
        (
          contenido,
        ) => {
          const version =
            [...contenido.versiones]
              .sort(
                (
                  a,
                  b,
                ) =>
                  b.numeroVersion -
                  a.numeroVersion,
              )[
                0
              ];

          if (
            !version
          ) {
            return null;
          }

          return {
            recursoId:
              contenido.recurso.id,

            recursoTitulo:
              contenido.recurso.titulo,

            recursoUso:
              contenido.recurso.uso,

            recursoAlcance:
              contenido.recurso.alcance,

            hito:
              contenido.recurso.hito,

            contenidoId:
              contenido.id,

            contenidoTitulo:
              contenido.titulo,

            versionId:
              version.id,

            numeroVersion:
              version.numeroVersion,

            archivo:
              version.archivo,
          };
        },
      )
      .filter(
        (
          item,
        ) =>
          item !==
          null,
      );
  }

  async crear(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    datos:
      CrearQuizDto,
  ) {
    const curso =
      await this.validarCursoDocente(
        usuario,
        cursoId,
      );

    await this.validarHito(
      curso.planificacionId,
      datos.hitoId,
    );

    this.validarConfiguracion(
      datos,
    );

    return this.prisma.$transaction(
      async (
        tx,
      ) => {
        const quiz =
          await tx.quizCurso.create({
            data: {
              cursoId,

              hitoId:
                datos.hitoId,

              creadorId:
                usuario.id,

              titulo:
                datos.titulo.trim(),

              descripcion:
                datos.descripcion?.trim() ||
                null,

              dificultad:
                datos.dificultad,

              esCalificable:
                datos.esCalificable,

              componente:
                datos.esCalificable
                  ? datos.componente
                  : null,

              modalidad:
                datos.modalidad,

              ritmo:
                datos.ritmo,

              modoTiempo:
                datos.modoTiempo,

              tiempoPreguntaSegundos:
                datos.tiempoPreguntaSegundos,

              tiempoFacilSegundos:
                datos.tiempoFacilSegundos,

              tiempoMedioSegundos:
                datos.tiempoMedioSegundos,

              tiempoDificilSegundos:
                datos.tiempoDificilSegundos,

              cantidadPreguntas:
                datos.cantidadPreguntas,

              puntajeMaximo:
                datos.puntajeMaximo,

              usarRanking:
                datos.usarRanking,

              criterioRanking:
                datos.criterioRanking,

              // El ranking final solo ordena la clasificación.
              // Ya no reduce la nota final.
              descuentoPorPuesto:
                0,

              puntajeMinimoRanking:
                0,

              // Esta configuración es independiente del ranking final.
              usarPuntuacionVelocidad:
                datos.usarPuntuacionVelocidad,

              descuentoVelocidadPorPosicion:
                datos.usarPuntuacionVelocidad
                  ? datos.descuentoVelocidadPorPosicion
                  : 0,

              puntajeMinimoVelocidad:
                datos.usarPuntuacionVelocidad
                  ? datos.puntajeMinimoVelocidad
                  : 0,

              permiteInicioConAusentes:
                datos.permiteInicioConAusentes,

              cuentaRegresivaSegundos:
                datos.cuentaRegresivaSegundos,

              aperturaProgramada:
                datos.modalidad ===
                  ModalidadQuiz.PROGRAMADO
                  ? new Date(
                      datos.aperturaProgramada!,
                    )
                  : null,

              cierreProgramado:
                datos.modalidad ===
                  ModalidadQuiz.PROGRAMADO &&
                datos.cierreProgramado
                  ? new Date(
                      datos.cierreProgramado,
                    )
                  : null,
            },
          });

        if (
          datos.esCalificable
        ) {
          await tx.actividadCalificable.create({
            data: {
              cursoId,

              hitoId:
                datos.hitoId,

              creadorId:
                usuario.id,

              quizId:
                quiz.id,

              origen:
                TipoOrigenActividad.QUIZ,

              componente:
                datos.componente!,

              titulo:
                datos.titulo.trim(),

              descripcion:
                datos.descripcion?.trim() ||
                null,

              puntajeMaximo:
                100,

              participaEnPromedio:
                true,

              estado:
                EstadoActividadCalificable.BORRADOR,

              visibleParaEstudiantes:
                false,
            },
          });
        }

        return tx.quizCurso.findUnique({
          where: {
            id:
              quiz.id,
          },

          include:
            this.includeDetalle,
        });
      },
    );
  }

  async actualizar(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,

    datos:
      ActualizarQuizDto,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.BORRADOR
    ) {
      throw new BadRequestException(
        'Solo puedes editar la configuración completa mientras el Quiz está en borrador',
      );
    }

    const curso =
      await this.validarCursoDocente(
        usuario,
        cursoId,
      );

    if (
      datos.hitoId
    ) {
      await this.validarHito(
        curso.planificacionId,
        datos.hitoId,
      );
    }

    const combinado = {
      esCalificable:
        datos.esCalificable ??
        quiz.esCalificable,

      componente:
        datos.componente ??
        quiz.componente ??
        undefined,

      modalidad:
        datos.modalidad ??
        quiz.modalidad,

      aperturaProgramada:
        datos.aperturaProgramada ??
        quiz.aperturaProgramada?.toISOString(),

      cierreProgramado:
        datos.cierreProgramado ??
        quiz.cierreProgramado?.toISOString(),

      usarRanking:
        datos.usarRanking ??
        quiz.usarRanking,

      descuentoPorPuesto:
        0,

      usarPuntuacionVelocidad:
        datos.usarPuntuacionVelocidad ??
        quiz.usarPuntuacionVelocidad,

      descuentoVelocidadPorPosicion:
        datos.descuentoVelocidadPorPosicion ??
        Number(
          quiz.descuentoVelocidadPorPosicion,
        ),

      puntajeMinimoVelocidad:
        datos.puntajeMinimoVelocidad ??
        Number(
          quiz.puntajeMinimoVelocidad,
        ),
    };

    this.validarConfiguracion(
      combinado,
    );

    return this.prisma.$transaction(
      async (
        tx,
      ) => {
        const actualizado =
          await tx.quizCurso.update({
            where: {
              id:
                quizId,
            },

            data: {
              ...datos,

              // El ranking final no descuenta nota.
              descuentoPorPuesto:
                0,

              puntajeMinimoRanking:
                0,

              usarPuntuacionVelocidad:
                combinado.usarPuntuacionVelocidad,

              descuentoVelocidadPorPosicion:
                combinado.usarPuntuacionVelocidad
                  ? combinado.descuentoVelocidadPorPosicion
                  : 0,

              puntajeMinimoVelocidad:
                combinado.usarPuntuacionVelocidad
                  ? combinado.puntajeMinimoVelocidad
                  : 0,

              titulo:
                datos.titulo?.trim(),

              descripcion:
                datos.descripcion !==
                undefined
                  ? datos.descripcion.trim() ||
                    null
                  : undefined,

              componente:
                combinado.esCalificable
                  ? combinado.componente
                  : null,

              aperturaProgramada:
                combinado.modalidad ===
                ModalidadQuiz.PROGRAMADO
                  ? combinado.aperturaProgramada
                    ? new Date(
                        combinado.aperturaProgramada,
                      )
                    : null
                  : null,

              cierreProgramado:
                combinado.modalidad ===
                  ModalidadQuiz.PROGRAMADO &&
                combinado.cierreProgramado
                  ? new Date(
                      combinado.cierreProgramado,
                    )
                  : null,
            },
          });

        if (
          combinado.esCalificable
        ) {
          await tx.actividadCalificable.upsert({
            where: {
              quizId,
            },

            create: {
              cursoId,

              hitoId:
                datos.hitoId ??
                quiz.hitoId,

              creadorId:
                usuario.id,

              quizId,

              origen:
                TipoOrigenActividad.QUIZ,

              componente:
                combinado.componente as ComponenteEvaluacion,

              titulo:
                datos.titulo?.trim() ??
                quiz.titulo,

              descripcion:
                datos.descripcion !==
                undefined
                  ? datos.descripcion.trim() ||
                    null
                  : quiz.descripcion,

              puntajeMaximo:
                100,

              participaEnPromedio:
                true,

              estado:
                EstadoActividadCalificable.BORRADOR,

              visibleParaEstudiantes:
                false,
            },

            update: {
              hitoId:
                datos.hitoId,

              componente:
                combinado.componente as ComponenteEvaluacion,

              titulo:
                datos.titulo?.trim(),

              descripcion:
                datos.descripcion !==
                undefined
                  ? datos.descripcion.trim() ||
                    null
                  : undefined,

              puntajeMaximo:
                100,
            },
          });
        } else {
          await tx.actividadCalificable.deleteMany({
            where: {
              quizId,
            },
          });
        }

        return tx.quizCurso.findUnique({
          where: {
            id:
              actualizado.id,
          },

          include:
            this.includeDetalle,
        });
      },
    );
  }

  async obtener(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    if (
      usuario.rol ===
      Rol.DOCENTE
    ) {
      return this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );
    }

    await this.validarEstudianteCurso(
      usuario,
      cursoId,
    );

    await this.sincronizarRitmoAutomatico(quizId);

    const quiz =
      await this.prisma.quizCurso.findFirst({
        where: {
          id:
            quizId,

          cursoId,

          estado: {
            notIn: [
              EstadoQuiz.BORRADOR,
              EstadoQuiz.CANCELADO,
            ],
          },
        },

        include: {
          hito:
            true,
        },
      });

    if (
      !quiz
    ) {
      throw new NotFoundException(
        'El Quiz no está disponible',
      );
    }

    const preguntaActual =
      quiz.estado ===
          EstadoQuiz.EN_CURSO &&
        quiz.preguntaActualOrden !==
          null
        ? await this.prisma.preguntaQuiz.findFirst({
            where: {
              quizId,

              orden:
                quiz.preguntaActualOrden,

              estaActiva:
                true,
            },

            select: {
              id:
                true,

              enunciado:
                true,

              tipo:
                true,

              dificultad:
                true,

              tiempoSegundos:
                true,

              orden:
                true,

              opciones: {
                orderBy: {
                  orden:
                    'asc',
                },

                select: {
                  id:
                    true,

                  texto:
                    true,

                  orden:
                    true,
                },
              },
            },
          })
        : null;

    const intento =
      await this.prisma.intentoQuiz.findUnique({
        where: {
          quizId_estudianteId: {
            quizId,

            estudianteId:
              usuario.id,
          },
        },

        select: {
          id:
            true,

          estado:
            true,
        },
      });

    const respuestaActual =
      preguntaActual &&
      intento
        ? await this.prisma.respuestaIntentoQuiz.findUnique({
            where: {
              intentoId_preguntaId: {
                intentoId:
                  intento.id,

                preguntaId:
                  preguntaActual.id,
              },
            },

            select: {
              id:
                true,

              respondidaEn:
                true,

              tiempoRespuestaMs:
                true,

              opcionesSeleccionadas: {
                select: {
                  opcionId:
                    true,
                },
              },
            },
          })
        : null;

    const participante =
      await this.prisma.participanteQuiz.findUnique({
        where: {
          quizId_estudianteId: {
            quizId,

            estudianteId:
              usuario.id,
          },
        },

        select: {
          estudianteId:
            true,

          estado:
            true,

          avatarCodigo:
            true,

          ultimaConexionEn:
            true,

          listoEn:
            true,

          inicioEn:
            true,

          finalizadoEn:
            true,
        },
      });

    return {
      id:
        quiz.id,

      titulo:
        quiz.titulo,

      descripcion:
        quiz.descripcion,

      dificultad:
        quiz.dificultad,

      modalidad:
        quiz.modalidad,

      estado:
        quiz.estado,

      esCalificable:
        quiz.esCalificable,

      componente:
        quiz.componente,

      hito:
        quiz.hito,

      cuentaRegresivaSegundos:
        quiz.cuentaRegresivaSegundos,

      aperturaProgramada:
        quiz.aperturaProgramada,

      cierreProgramado:
        quiz.cierreProgramado,

      inicioEn:
        quiz.inicioEn,

      preguntaActualOrden:
        quiz.preguntaActualOrden,

      preguntaIniciadaEn:
        quiz.preguntaIniciadaEn,

      preguntaCierraEn:
        quiz.preguntaCierraEn,

      tiempoRestantePreguntaSegundos:
        quiz.tiempoRestantePreguntaSegundos,

      tiempoTotalPreguntaSegundos:
        preguntaActual
          ? this.obtenerTiempoPregunta(quiz, preguntaActual)
          : null,

      usarPuntuacionVelocidad:
        quiz.usarPuntuacionVelocidad,

      descuentoVelocidadPorPosicion:
        Number(
          quiz.descuentoVelocidadPorPosicion,
        ),

      puntajeMinimoVelocidad:
        Number(
          quiz.puntajeMinimoVelocidad,
        ),

      resultadosPublicados:
        quiz.resultadosPublicados,

      participante,

      intento: intento
        ? {
            id:
              intento.id,

            estado:
              intento.estado,
          }
        : null,

      preguntaActual,

      respuestaActual:
        respuestaActual
          ? {
              id:
                respuestaActual.id,

              respondidoEn:
                respuestaActual.respondidaEn,

              tiempoRespuestaMs:
                respuestaActual.tiempoRespuestaMs,

              opcionIds:
                respuestaActual.opcionesSeleccionadas.map(
                  (
                    item,
                  ) =>
                    item.opcionId,
                ),
            }
          : null,
    };
  }

  async eliminar(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.BORRADOR
    ) {
      throw new BadRequestException(
        'Solo puedes eliminar un Quiz mientras está en borrador',
      );
    }

    await this.prisma.quizCurso.delete({
      where: {
        id:
          quizId,
      },
    });

    return {
      ok:
        true,

      mensaje:
        'Borrador eliminado correctamente',
    };
  }

  async agregarFuente(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,

    datos:
      AgregarFuenteQuizDto,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.BORRADOR
    ) {
      throw new BadRequestException(
        'No puedes modificar las fuentes después de publicar la sala',
      );
    }

    const existente =
      await this.prisma.fuenteQuiz.findUnique({
        where: {
          quizId_versionId: {
            quizId,

            versionId:
              datos.versionId,
          },
        },

        include: {
          version: {
            include: {
              archivo:
                true,

              contenido: {
                include: {
                  recurso:
                    true,
                },
              },
            },
          },

          fragmentos: {
            orderBy: {
              orden:
                'asc',
            },
          },
        },
      });

    if (
      existente
    ) {
      return existente;
    }

    const version =
      await this.prisma.recursoContenidoVersion.findFirst({
        where: {
          id:
            datos.versionId,

          esVigente:
            true,

          estado:
            EstadoVersionRecurso.VIGENTE,

          contenido: {
            estaActivo:
              true,

            tipo:
              TipoContenidoRecurso.ARCHIVO,

            disponibleParaQuiz:
              true,

            recurso: {
              cursoId,

              estaActivo:
                true,

              estado:
                EstadoRecursoCurso.ACTIVO,

              uso: {
                in: [
                  UsoRecursoCurso.AULA_Y_QUIZZES,
                  UsoRecursoCurso.SOLO_QUIZZES,
                ],
              },
            },
          },

          archivo: {
            extension: {
              equals:
                'pdf',

              mode:
                'insensitive',
            },
          },
        },

        include: {
          archivo:
            true,

          contenido: {
            include: {
              recurso:
                true,
            },
          },
        },
      });

    if (
      !version
    ) {
      throw new BadRequestException(
        'El PDF seleccionado no está disponible como dataset para Quizzes',
      );
    }

    const cantidad =
      await this.prisma.fuenteQuiz.count({
        where: {
          quizId,
        },
      });

    return this.prisma.fuenteQuiz.create({
      data: {
        quizId,

        versionId:
          version.id,

        orden:
          cantidad,

        tituloSnapshot:
          version.contenido.titulo,

        nombreArchivoSnapshot:
          version.archivo.nombreOriginal,

        numeroVersionSnapshot:
          version.numeroVersion,
      },

      include: {
        version: {
          include: {
            archivo:
              true,

            contenido: {
              include: {
                recurso:
                  true,
              },
            },
          },
        },

        fragmentos: {
          orderBy: {
            orden:
              'asc',
          },
        },
      },
    });
  }

  async eliminarFuente(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,

    fuenteId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.BORRADOR
    ) {
      throw new BadRequestException(
        'No puedes modificar las fuentes después de publicar la sala',
      );
    }

    await this.prisma.fuenteQuiz.deleteMany({
      where: {
        id:
          fuenteId,

        quizId,
      },
    });

    return {
      ok:
        true,
    };
  }

  async agregarFragmento(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,

    fuenteId:
      number,

    datos:
      AgregarFragmentoQuizDto,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.BORRADOR
    ) {
      throw new BadRequestException(
        'No puedes modificar los fragmentos después de publicar la sala',
      );
    }

    const fuente =
      await this.prisma.fuenteQuiz.findFirst({
        where: {
          id:
            fuenteId,

          quizId,
        },

        select: {
          id:
            true,
        },
      });

    if (
      !fuente
    ) {
      throw new NotFoundException(
        'La fuente no pertenece al Quiz',
      );
    }

    return this.prisma.fragmentoFuenteQuiz.create({
      data: {
        fuenteId,

        tituloReferencia:
          datos.tituloReferencia?.trim() ||
          null,

        tipoReferencia:
          datos.tipoReferencia?.trim() ||
          null,

        paginaInicio:
          datos.paginaInicio,

        paginaFin:
          datos.paginaFin,

        texto:
          datos.texto.trim(),

        orden:
          datos.orden ??
          0,
      },
    });
  }

  async crearPregunta(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,

    datos:
      CrearPreguntaQuizDto,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.BORRADOR
    ) {
      throw new BadRequestException(
        'No puedes modificar preguntas después de publicar la sala',
      );
    }

    const correctas =
      datos.opciones.filter(
        (
          opcion,
        ) =>
          opcion.esCorrecta,
      ).length;

    if (
      correctas ===
      0
    ) {
      throw new BadRequestException(
        'Cada pregunta debe tener al menos una respuesta correcta',
      );
    }

    if (
      datos.fragmentoId
    ) {
      const fragmento =
        await this.prisma.fragmentoFuenteQuiz.findFirst({
          where: {
            id:
              datos.fragmentoId,

            fuente: {
              quizId,
            },
          },

          select: {
            id:
              true,
          },
        });

      if (
        !fragmento
      ) {
        throw new BadRequestException(
          'El fragmento seleccionado no pertenece al Quiz',
        );
      }
    }

    return this.prisma.preguntaQuiz.create({
      data: {
        quizId,

        fragmentoId:
          datos.fragmentoId,

        enunciado:
          datos.enunciado.trim(),

        tipo:
          datos.tipo,

        dificultad:
          datos.dificultad,

        origen:
          datos.origen,

        explicacion:
          datos.explicacion?.trim() ||
          null,

        tiempoSegundos:
          datos.tiempoSegundos,

        puntaje:
          datos.puntaje,

        orden:
          datos.orden,

        opciones: {
          create:
            datos.opciones.map(
              (
                opcion,
              ) => ({
                texto:
                  opcion.texto.trim(),

                esCorrecta:
                  opcion.esCorrecta,

                orden:
                  opcion.orden,
              }),
            ),
        },
      },

      include: {
        opciones: {
          orderBy: {
            orden:
              'asc',
          },
        },
      },
    });
  }

  async eliminarPregunta(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,

    preguntaId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.BORRADOR
    ) {
      throw new BadRequestException(
        'No puedes modificar preguntas después de publicar la sala',
      );
    }

    await this.prisma.preguntaQuiz.updateMany({
      where: {
        id:
          preguntaId,

        quizId,
      },

      data: {
        estaActiva:
          false,
      },
    });

    return {
      ok:
        true,
    };
  }

  async publicarSala(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.BORRADOR
    ) {
      throw new BadRequestException(
        'El Quiz ya fue publicado',
      );
    }

    if (
      quiz.fuentes.length ===
      0
    ) {
      throw new BadRequestException(
        'Selecciona al menos un PDF como fuente del Quiz',
      );
    }

    if (
      quiz.preguntas.length ===
      0
    ) {
      throw new BadRequestException(
        'El Quiz debe tener al menos una pregunta',
      );
    }

    const ahora =
      new Date();

    if (
      quiz.modalidad ===
      ModalidadQuiz.PROGRAMADO
    ) {
      if (
        !quiz.aperturaProgramada
      ) {
        throw new BadRequestException(
          'El Quiz programado no tiene una fecha de apertura válida',
        );
      }

      if (
        quiz.aperturaProgramada <=
        ahora
      ) {
        throw new BadRequestException(
          'La apertura programada debe ser posterior al momento de publicación',
        );
      }

      if (
        quiz.cierreProgramado &&
        quiz.cierreProgramado <=
          quiz.aperturaProgramada
      ) {
        throw new BadRequestException(
          'El cierre programado debe ser posterior a la apertura',
        );
      }
    }

    return this.prisma.$transaction(
      async (
        tx,
      ) => {
        if (
          quiz.esCalificable
        ) {
          await tx.actividadCalificable.updateMany({
            where: {
              quizId,
            },

            data: {
              estado:
                EstadoActividadCalificable.ACTIVA,

              visibleParaEstudiantes:
                true,

              publicadaEn:
                ahora,
            },
          });
        }

        return tx.quizCurso.update({
          where: {
            id:
              quizId,
          },

          data: {
            estado:
              EstadoQuiz.ESPERANDO,

            salaPublicadaEn:
              ahora,
          },

          include:
            this.includeDetalle,
        });
      },
    );
  }

  async unirse(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    await this.validarEstudianteCurso(
      usuario,
      cursoId,
    );

    const quiz =
      await this.prisma.quizCurso.findFirst({
        where: {
          id:
            quizId,

          cursoId,

          estado: {
            in: [
              EstadoQuiz.ESPERANDO,
              EstadoQuiz.CUENTA_REGRESIVA,
            ],
          },
        },
      });

    if (
      !quiz
    ) {
      throw new BadRequestException(
        'La sala del Quiz no está disponible para ingresar',
      );
    }

    if (
      quiz.modalidad ===
      ModalidadQuiz.PROGRAMADO
    ) {
      const ahora =
        new Date();

      if (
        quiz.aperturaProgramada &&
        ahora <
          quiz.aperturaProgramada
      ) {
        throw new BadRequestException(
          `El Quiz estará disponible desde ${quiz.aperturaProgramada.toISOString()}`,
        );
      }

      if (
        quiz.cierreProgramado &&
        ahora >=
          quiz.cierreProgramado
      ) {
        throw new BadRequestException(
          'El periodo de ingreso a este Quiz ya finalizó',
        );
      }
    }

    return this.prisma.participanteQuiz.upsert({
      where: {
        quizId_estudianteId: {
          quizId,

          estudianteId:
            usuario.id,
        },
      },

      create: {
        quizId,

        estudianteId:
          usuario.id,

        estado:
          EstadoParticipanteQuiz.ESPERANDO,

        conectadoEn:
          new Date(),

        ultimaConexionEn:
          new Date(),
      },

      update: {
        estado:
          EstadoParticipanteQuiz.ESPERANDO,

        desconectadoEn:
          null,

        ultimaConexionEn:
          new Date(),
      },
    });
  }

  async marcarListo(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    await this.validarEstudianteCurso(
      usuario,
      cursoId,
    );

    const participante =
      await this.prisma.participanteQuiz.findUnique({
        where: {
          quizId_estudianteId: {
            quizId,

            estudianteId:
              usuario.id,
          },
        },
      });

    if (
      !participante
    ) {
      throw new BadRequestException(
        'Primero debes ingresar a la sala',
      );
    }

    return this.prisma.participanteQuiz.update({
      where: {
        id:
          participante.id,
      },

      data: {
        estado:
          EstadoParticipanteQuiz.LISTO,

        listoEn:
          new Date(),

        ultimaConexionEn:
          new Date(),
      },
    });
  }

  async seleccionarAvatar(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,

    datos:
      SeleccionarAvatarQuizDto,
  ) {
    await this.validarEstudianteCurso(
      usuario,
      cursoId,
    );

    const participante =
      await this.prisma.participanteQuiz.findUnique({
        where: {
          quizId_estudianteId: {
            quizId,

            estudianteId:
              usuario.id,
          },
        },
      });

    if (
      !participante
    ) {
      throw new BadRequestException(
        'Primero debes ingresar a la sala',
      );
    }

    return this.prisma.participanteQuiz.update({
      where: {
        id:
          participante.id,
      },

      data: {
        avatarCodigo:
          datos.avatarCodigo ??
          null,

        ultimaConexionEn:
          new Date(),
      },
    });
  }

  async heartbeat(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    await this.validarEstudianteCurso(
      usuario,
      cursoId,
    );

    const participante =
      await this.prisma.participanteQuiz.findUnique({
        where: {
          quizId_estudianteId: {
            quizId,

            estudianteId:
              usuario.id,
          },
        },
      });

    if (
      !participante
    ) {
      throw new BadRequestException(
        'No estás registrado en esta sala',
      );
    }

    return this.prisma.participanteQuiz.update({
      where: {
        id:
          participante.id,
      },

      data: {
        ultimaConexionEn:
          new Date(),

        desconectadoEn:
          null,
      },

      select: {
        id:
          true,

        estado:
          true,

        avatarCodigo:
          true,

        ultimaConexionEn:
          true,
      },
    });
  }

  async lobby(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    if (
      usuario.rol ===
      Rol.DOCENTE
    ) {
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );
    } else {
      await this.validarEstudianteCurso(
        usuario,
        cursoId,
      );

      const quiz =
        await this.prisma.quizCurso.findFirst({
          where: {
            id:
              quizId,

            cursoId,

            estado: {
              notIn: [
                EstadoQuiz.BORRADOR,
                EstadoQuiz.CANCELADO,
              ],
            },
          },

          select: {
            id:
              true,
          },
        });

      if (
        !quiz
      ) {
        throw new NotFoundException(
          'El Quiz no está disponible',
        );
      }
    }

    const totalInscritos =
      await this.prisma.inscripcionCurso.count({
        where: {
          cursoId,

          estado:
            EstadoInscripcion.ACTIVA,
        },
      });

    const participantes =
      await this.prisma.participanteQuiz.findMany({
        where: {
          quizId,
        },

        include: {
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

        orderBy: {
          conectadoEn:
            'asc',
        },
      });

    const limite =
      this.limitePresencia();

    const participantesVisuales =
      participantes.map(
        (
          participante,
        ) => {
          const conectado =
            participante.ultimaConexionEn >=
            limite;

          return {
            ...participante,

            conectado,

            estadoVisual:
              conectado
                ? participante.estado
                : EstadoParticipanteQuiz.DESCONECTADO,
          };
        },
      );

    return {
      totalInscritos,

      conectados:
        participantesVisuales.filter(
          (
            participante,
          ) =>
            participante.conectado,
        ).length,

      listos:
        participantesVisuales.filter(
          (
            participante,
          ) =>
            participante.conectado &&
            participante.estado ===
              EstadoParticipanteQuiz.LISTO,
        ).length,

      participantes:
        participantesVisuales,
    };
  }

  async iniciar(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.ESPERANDO
    ) {
      throw new BadRequestException(
        'El Quiz debe estar esperando participantes para poder iniciarlo',
      );
    }

    const totalInscritos =
      await this.prisma.inscripcionCurso.count({
        where: {
          cursoId,

          estado:
            EstadoInscripcion.ACTIVA,
        },
      });

    const listos =
      await this.prisma.participanteQuiz.count({
        where: {
          quizId,

          estado:
            EstadoParticipanteQuiz.LISTO,

          ultimaConexionEn: {
            gte:
              this.limitePresencia(),
          },
        },
      });

    if (
      !quiz.permiteInicioConAusentes &&
      listos <
        totalInscritos
    ) {
      throw new BadRequestException(
        'Todavía faltan estudiantes por ingresar o marcarse como listos',
      );
    }

    if (
      listos ===
      0
    ) {
      throw new BadRequestException(
        'No hay estudiantes listos para iniciar el Quiz',
      );
    }

    const ahora =
      new Date();

    const cuentaRegresivaHasta =
      new Date(
        ahora.getTime() +
          quiz.cuentaRegresivaSegundos *
            1000,
      );

    const participantes =
      await this.prisma.participanteQuiz.findMany({
        where: {
          quizId,

          estado:
            EstadoParticipanteQuiz.LISTO,
        },

        select: {
          id:
            true,

          estudianteId:
            true,
        },
      });

    await this.prisma.$transaction(
      async (
        tx,
      ) => {
        await tx.participanteQuiz.updateMany({
          where: {
            quizId,

            estado:
              EstadoParticipanteQuiz.LISTO,
          },

          data: {
            estado:
              EstadoParticipanteQuiz.EN_CURSO,

            inicioEn:
              cuentaRegresivaHasta,
          },
        });

        for (
          const participante
          of participantes
        ) {
          await tx.intentoQuiz.upsert({
            where: {
              quizId_estudianteId: {
                quizId,

                estudianteId:
                  participante.estudianteId,
              },
            },

            create: {
              quizId,

              estudianteId:
                participante.estudianteId,

              participanteId:
                participante.id,

              estado:
                EstadoIntentoQuiz.EN_CURSO,

              iniciadoEn:
                cuentaRegresivaHasta,
            },

            update: {
              estado:
                EstadoIntentoQuiz.EN_CURSO,

              iniciadoEn:
                cuentaRegresivaHasta,

              finalizadoEn:
                null,

              anuladoEn:
                null,
            },
          });
        }

        await tx.quizCurso.update({
          where: {
            id:
              quizId,
          },

          data: {
            estado:
              EstadoQuiz.CUENTA_REGRESIVA,

            inicioEn:
              cuentaRegresivaHasta,

            preguntaActualOrden:
              null,

            preguntaIniciadaEn:
              null,

            preguntaCierraEn:
              null,

            tiempoRestantePreguntaSegundos:
              null,
          },
        });
      },
    );

    return this.buscarQuizDocente(
      usuario,
      cursoId,
      quizId,
    );
  }

  async activarEnCurso(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.CUENTA_REGRESIVA
    ) {
      throw new BadRequestException(
        'El Quiz no está en cuenta regresiva',
      );
    }

    if (
      quiz.inicioEn &&
      new Date() <
        quiz.inicioEn
    ) {
      throw new BadRequestException(
        'La cuenta regresiva todavía no terminó',
      );
    }

    const pregunta =
      quiz.preguntas[
        0
      ];

    if (
      !pregunta
    ) {
      throw new BadRequestException(
        'El Quiz no tiene preguntas',
      );
    }

    const tiempo =
      this.obtenerTiempoPregunta(
        quiz,
        pregunta,
      );

    const ahora =
      new Date();

    return this.prisma.quizCurso.update({
      where: {
        id:
          quizId,
      },

      data: {
        estado:
          EstadoQuiz.EN_CURSO,

        preguntaActualOrden:
          pregunta.orden,

        preguntaIniciadaEn:
          ahora,

        preguntaCierraEn:
          new Date(
            ahora.getTime() +
              tiempo *
                1000,
          ),

        tiempoRestantePreguntaSegundos:
          null,
      },

      include:
        this.includeDetalle,
    });
  }

  async pausar(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.EN_CURSO
    ) {
      throw new BadRequestException(
        'Solo puedes pausar un Quiz que está en curso',
      );
    }

    const ahora =
      new Date();

    const restante =
      quiz.preguntaCierraEn
        ? Math.max(
            0,
            Math.ceil(
              (
                quiz.preguntaCierraEn.getTime() -
                ahora.getTime()
              ) /
                1000,
            ),
          )
        : 0;

    return this.prisma.quizCurso.update({
      where: {
        id:
          quizId,
      },

      data: {
        estado:
          EstadoQuiz.PAUSADO,

        tiempoRestantePreguntaSegundos:
          restante,

        preguntaCierraEn:
          null,
      },

      include:
        this.includeDetalle,
    });
  }

  async reanudar(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.PAUSADO
    ) {
      throw new BadRequestException(
        'El Quiz no está pausado',
      );
    }

    const restante =
      quiz.tiempoRestantePreguntaSegundos ??
      0;

    if (
      restante <=
      0
    ) {
      throw new BadRequestException(
        'La pregunta ya no tiene tiempo restante',
      );
    }

    const ahora =
      new Date();

    return this.prisma.quizCurso.update({
      where: {
        id:
          quizId,
      },

      data: {
        estado:
          EstadoQuiz.EN_CURSO,

        preguntaIniciadaEn:
          ahora,

        preguntaCierraEn:
          new Date(
            ahora.getTime() +
              restante *
                1000,
          ),

        tiempoRestantePreguntaSegundos:
          null,
      },

      include:
        this.includeDetalle,
    });
  }

  async estadoEnVivo(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    await this.sincronizarRitmoAutomatico(
      quizId,
    );

    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    const estadosValidos:
      EstadoQuiz[] = [
        EstadoQuiz.CUENTA_REGRESIVA,
        EstadoQuiz.EN_CURSO,
        EstadoQuiz.PAUSADO,
        EstadoQuiz.FINALIZADO,
      ];

    if (
      !estadosValidos.includes(
        quiz.estado,
      )
    ) {
      throw new BadRequestException(
        'El Quiz todavía no tiene una sesión activa',
      );
    }

    const [
      participantes,
      intentos,
    ] =
      await Promise.all([
        this.prisma.participanteQuiz.findMany({
          where: {
            quizId,
          },

          include: {
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

          orderBy: {
            conectadoEn:
              'asc',
          },
        }),

        this.prisma.intentoQuiz.findMany({
          where: {
            quizId,
          },

          include: {
            respuestas:
              true,
          },
        }),
      ]);

    const preguntasActivas =
      quiz.preguntas.filter(
        (
          pregunta,
        ) =>
          pregunta.estaActiva,
      );

    const puntajeTotalPreguntas =
      preguntasActivas.reduce(
        (
          suma,
          pregunta,
        ) =>
          suma +
          Number(
            pregunta.puntaje,
          ),
        0,
      );

    const intentoPorEstudiante =
      new Map(
        intentos.map(
          (
            intento,
          ) => [
            intento.estudianteId,
            intento,
          ],
        ),
      );

    const ahora =
      new Date();

    const ranking =
      participantes
        .map(
          (
            participante,
          ) => {
            const intento =
              intentoPorEstudiante.get(
                participante.estudianteId,
              );

            const respuestas =
              intento?.respuestas ??
              [];

            const puntajeBruto =
              respuestas.reduce(
                (
                  suma,
                  respuesta,
                ) =>
                  suma +
                  Number(
                    respuesta.puntajeObtenido,
                  ),
                0,
              );

            const respuestasCorrectas =
              respuestas.filter(
                (
                  respuesta,
                ) =>
                  respuesta.esCorrecta ===
                  true,
              ).length;

            const respuestasIncorrectas =
              respuestas.filter(
                (
                  respuesta,
                ) =>
                  respuesta.esCorrecta ===
                  false,
              ).length;

            const respuestasOmitidas =
              quiz.estado ===
              EstadoQuiz.FINALIZADO
                ? Math.max(
                    0,
                    preguntasActivas.length -
                      respuestas.length,
                  )
                : 0;

            const tiempoAcumuladoMs =
              respuestas.reduce(
                (
                  suma,
                  respuesta,
                ) =>
                  suma +
                  Math.max(
                    0,
                    respuesta.tiempoRespuestaMs ??
                      0,
                  ),
                0,
              );

            const notaActual =
              puntajeTotalPreguntas >
              0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      (
                        puntajeBruto /
                        puntajeTotalPreguntas
                      ) *
                        100,
                    ),
                  )
                : 0;

            const conectado =
              participante.ultimaConexionEn >=
              this.limitePresencia();

            return {
              estudianteId:
                participante.estudianteId,

              nombres:
                participante.estudiante.nombres,

              apellidoPaterno:
                participante.estudiante.apellidoPaterno,

              apellidoMaterno:
                participante.estudiante.apellidoMaterno,

              fotoPerfilUrl:
                participante.estudiante.fotoPerfilUrl,

              conectado,

              estadoParticipante:
                participante.estado,

              puntajeActual:
                Number(
                  puntajeBruto.toFixed(
                    2,
                  ),
                ),

              notaActual:
                Number(
                  notaActual.toFixed(
                    2,
                  ),
                ),

              respuestasCorrectas,

              respuestasIncorrectas,

              respuestasOmitidas,

              tiempoAcumuladoMs,

              posicion:
                0,
            };
          },
        )
        .sort(
          (
            a,
            b,
          ) => {
            if (
              b.puntajeActual !==
              a.puntajeActual
            ) {
              return (
                b.puntajeActual -
                a.puntajeActual
              );
            }

            if (
              b.respuestasCorrectas !==
              a.respuestasCorrectas
            ) {
              return (
                b.respuestasCorrectas -
                a.respuestasCorrectas
              );
            }

            return (
              a.tiempoAcumuladoMs -
              b.tiempoAcumuladoMs
            );
          },
        )
        .map(
          (
            item,
            indice,
          ) => ({
            ...item,

            posicion:
              indice +
              1,
          }),
        );

    const totalParticipantes =
      participantes.length;

    if (
      quiz.preguntaActualOrden ===
        null
    ) {
      return {
        quizId,

        estado:
          quiz.estado,

        preguntaActualOrden:
          null,

        totalPreguntas:
          preguntasActivas.length,

        totalParticipantes,

        respondieron:
          0,

        correctas:
          0,

        incorrectas:
          0,

        pendientes:
          totalParticipantes,

        preguntaCierraEn:
          quiz.preguntaCierraEn,

        tiempoRestanteSegundos:
          null,

        ranking,
      };
    }

    const pregunta =
      preguntasActivas.find(
        (
          item,
        ) =>
          item.orden ===
          quiz.preguntaActualOrden,
      );

    if (
      !pregunta
    ) {
      throw new NotFoundException(
        'No se encontró la pregunta activa del Quiz',
      );
    }

    const [
      respondieron,
      correctas,
      incorrectas,
    ] =
      await Promise.all([
        this.prisma.respuestaIntentoQuiz.count({
          where: {
            preguntaId:
              pregunta.id,

            intento: {
              quizId,
            },
          },
        }),

        this.prisma.respuestaIntentoQuiz.count({
          where: {
            preguntaId:
              pregunta.id,

            esCorrecta:
              true,

            intento: {
              quizId,
            },
          },
        }),

        this.prisma.respuestaIntentoQuiz.count({
          where: {
            preguntaId:
              pregunta.id,

            esCorrecta:
              false,

            intento: {
              quizId,
            },
          },
        }),
      ]);

    const tiempoRestanteSegundos =
      quiz.estado ===
        EstadoQuiz.PAUSADO
        ? quiz.tiempoRestantePreguntaSegundos ??
          0
        : quiz.preguntaCierraEn
          ? Math.max(
              0,
              Math.ceil(
                (
                  quiz.preguntaCierraEn.getTime() -
                  ahora.getTime()
                ) /
                  1000,
              ),
            )
          : null;

    return {
      quizId,

      estado:
        quiz.estado,

      preguntaActualOrden:
        quiz.preguntaActualOrden,

      preguntaId:
        pregunta.id,

      totalPreguntas:
        preguntasActivas.length,

      totalParticipantes,

      respondieron,

      correctas,

      incorrectas,

      pendientes:
        Math.max(
          0,
          totalParticipantes -
            respondieron,
        ),

      preguntaCierraEn:
        quiz.preguntaCierraEn,

      tiempoRestanteSegundos,

      ranking,
    };
  }

  async siguientePregunta(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
        EstadoQuiz.EN_CURSO &&
      quiz.estado !==
        EstadoQuiz.PAUSADO
    ) {
      throw new BadRequestException(
        'El Quiz debe estar en curso o pausado para avanzar',
      );
    }

    const actual =
      quiz.preguntaActualOrden;

    const siguiente =
      quiz.preguntas.find(
        (
          pregunta,
        ) =>
          actual ===
            null ||
          pregunta.orden >
            actual,
      );

    if (
      !siguiente
    ) {
      return this.finalizar(
        usuario,
        cursoId,
        quizId,
      );
    }

    const ahora =
      new Date();

    const tiempo =
      this.obtenerTiempoPregunta(
        quiz,
        siguiente,
      );

    return this.prisma.quizCurso.update({
      where: {
        id:
          quizId,
      },

      data: {
        estado:
          EstadoQuiz.EN_CURSO,

        preguntaActualOrden:
          siguiente.orden,

        preguntaIniciadaEn:
          ahora,

        preguntaCierraEn:
          new Date(
            ahora.getTime() +
              tiempo *
                1000,
          ),

        tiempoRestantePreguntaSegundos:
          null,
      },

      include:
        this.includeDetalle,
    });
  }

  async responder(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,

    datos:
      ResponderPreguntaQuizDto,
  ) {
    await this.validarEstudianteCurso(
      usuario,
      cursoId,
    );

    const quiz =
      await this.prisma.quizCurso.findFirst({
        where: {
          id:
            quizId,

          cursoId,

          estado:
            EstadoQuiz.EN_CURSO,
        },

        include: {
          preguntas: {
            where: {
              id:
                datos.preguntaId,

              estaActiva:
                true,
            },

            include: {
              opciones:
                true,
            },
          },
        },
      });

    if (
      !quiz
    ) {
      throw new BadRequestException(
        'El Quiz no está en curso',
      );
    }

    const pregunta =
      quiz.preguntas[
        0
      ];

    if (
      !pregunta ||
      pregunta.orden !==
        quiz.preguntaActualOrden
    ) {
      throw new BadRequestException(
        'Esta pregunta no está activa en este momento',
      );
    }

    if (
      quiz.preguntaCierraEn &&
      new Date() >
        quiz.preguntaCierraEn
    ) {
      throw new BadRequestException(
        'El tiempo para responder esta pregunta terminó',
      );
    }

    const intento =
      await this.prisma.intentoQuiz.findUnique({
        where: {
          quizId_estudianteId: {
            quizId,

            estudianteId:
              usuario.id,
          },
        },
      });

    if (
      !intento ||
      intento.estado !==
      EstadoIntentoQuiz.EN_CURSO
    ) {
      throw new BadRequestException(
        'No tienes un intento activo',
      );
    }

    const existente =
      await this.prisma.respuestaIntentoQuiz.findUnique({
        where: {
          intentoId_preguntaId: {
            intentoId:
              intento.id,

            preguntaId:
              pregunta.id,
          },
        },

        select: {
          id:
            true,
        },
      });

    if (
      existente
    ) {
      throw new ConflictException(
        'La respuesta de esta pregunta ya fue registrada',
      );
    }

    const opcionesValidas =
      pregunta.opciones.filter(
        (
          opcion,
        ) =>
          datos.opcionIds.includes(
            opcion.id,
          ),
      );

    if (
      opcionesValidas.length !==
      datos.opcionIds.length
    ) {
      throw new BadRequestException(
        'Una o más opciones no pertenecen a la pregunta',
      );
    }

    const idsCorrectos =
      pregunta.opciones
        .filter(
          (
            opcion,
          ) =>
            opcion.esCorrecta,
        )
        .map(
          (
            opcion,
          ) =>
            opcion.id,
        )
        .sort(
          (
            a,
            b,
          ) =>
            a -
            b,
        );

    const idsSeleccionados =
      [
        ...datos.opcionIds,
      ].sort(
        (
          a,
          b,
        ) =>
          a -
          b,
      );

    const esCorrecta =
      idsCorrectos.length ===
        idsSeleccionados.length &&
      idsCorrectos.every(
        (
          id,
          indice,
        ) =>
          id ===
          idsSeleccionados[
            indice
          ],
      );

    const ahora =
      new Date();

    const tiempoRespuestaMs =
      quiz.preguntaIniciadaEn
        ? Math.max(0, ahora.getTime() - quiz.preguntaIniciadaEn.getTime())
        : 0;

    const puntajeBase =
      esCorrecta
        ? Number(
            pregunta.puntaje,
          )
        : 0;

    let posicionRespuestaCorrecta:
      number |
      null =
        null;

    let descuentoVelocidad =
      0;

    let puntajeObtenido =
      puntajeBase;

    if (
      esCorrecta &&
      quiz.usarPuntuacionVelocidad
    ) {
      const correctasAnteriores =
        await this.prisma.respuestaIntentoQuiz.count({
          where: {
            preguntaId:
              pregunta.id,

            esCorrecta:
              true,

            intento: {
              quizId,
            },
          },
        });

      posicionRespuestaCorrecta =
        correctasAnteriores +
        1;

      descuentoVelocidad =
        Math.max(
          0,
          (
            posicionRespuestaCorrecta -
            1
          ) *
            Number(
              quiz.descuentoVelocidadPorPosicion,
            ),
        );

      const minimoProtegido =
        Math.min(
          puntajeBase,
          Math.max(
            0,
            Number(
              quiz.puntajeMinimoVelocidad,
            ),
          ),
        );

      puntajeObtenido =
        Math.max(
          minimoProtegido,
          puntajeBase -
            descuentoVelocidad,
        );

      descuentoVelocidad =
        Math.max(
          0,
          puntajeBase -
            puntajeObtenido,
        );
    }

    const respuesta =
      await this.prisma.respuestaIntentoQuiz.create({
        data: {
          intentoId:
            intento.id,

          preguntaId:
            pregunta.id,

          respondidaEn:
            ahora,

          tiempoRespuestaMs,

          esCorrecta,

          puntajeObtenido,

          posicionRespuestaCorrecta,

          descuentoVelocidad,

          opcionesSeleccionadas: {
            create:
              datos.opcionIds.map(
                (
                  opcionId,
                ) => ({
                  opcionId,
                }),
              ),
          },
        },

        include: {
          opcionesSeleccionadas:
            true,
        },
      });

    await this.sincronizarRitmoAutomatico(quizId);
    return respuesta;
  }

  async finalizar(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
        EstadoQuiz.EN_CURSO &&
      quiz.estado !==
        EstadoQuiz.PAUSADO
    ) {
      throw new BadRequestException(
        'El Quiz debe estar en curso o pausado para finalizar',
      );
    }

    const ahora =
      new Date();

    const preguntas =
      quiz.preguntas.filter(
        (
          pregunta,
        ) =>
          pregunta.estaActiva,
      );

    const puntajeTotalPreguntas =
      preguntas.reduce(
        (
          suma,
          pregunta,
        ) =>
          suma +
          Number(
            pregunta.puntaje,
          ),
        0,
      );

    if (
      puntajeTotalPreguntas <=
      0
    ) {
      throw new BadRequestException(
        'El Quiz no tiene una distribución válida de puntajes',
      );
    }

    const intentos =
      await this.prisma.intentoQuiz.findMany({
        where: {
          quizId,

          estado:
            EstadoIntentoQuiz.EN_CURSO,
        },

        include: {
          respuestas:
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
            },
          },
        },
      });

    const calculados =
      intentos.map(
        (
          intento,
        ) => {
          const puntajeBruto =
            intento.respuestas.reduce(
              (
                suma,
                respuesta,
              ) =>
                suma +
                Number(
                  respuesta.puntajeObtenido,
                ),
              0,
            );

          const respuestasCorrectas =
            intento.respuestas.filter(
              (
                respuesta,
              ) =>
                respuesta.esCorrecta ===
                true,
            ).length;

          const respuestasIncorrectas =
            intento.respuestas.filter(
              (
                respuesta,
              ) =>
                respuesta.esCorrecta ===
                false,
            ).length;

          const respuestasOmitidas =
            Math.max(
              0,
              preguntas.length -
                intento.respuestas.length,
            );

          const ultimaRespuesta =
            intento.respuestas.reduce<
              Date |
              null
            >(
              (
                ultima,
                respuesta,
              ) => {
                if (
                  !ultima ||
                  respuesta.respondidaEn >
                    ultima
                ) {
                  return respuesta.respondidaEn;
                }

                return ultima;
              },
              null,
            );

          const finalizadoEn =
            ultimaRespuesta ??
            ahora;

          const tiempoTotalMs =
            intento.iniciadoEn
              ? Math.max(
                  0,
                  finalizadoEn.getTime() -
                    intento.iniciadoEn.getTime(),
                )
              : 0;

          const notaBase =
            Math.min(
              100,
              Math.max(
                0,
                (
                  puntajeBruto /
                  puntajeTotalPreguntas
                ) *
                  100,
              ),
            );

          return {
            intento,

            puntajeBruto,

            respuestasCorrectas,

            respuestasIncorrectas,

            respuestasOmitidas,

            finalizadoEn,

            tiempoTotalMs,

            notaBase,
          };
        },
      );

    const ranking =
      [
        ...calculados,
      ].sort(
        (
          a,
          b,
        ) => {
          if (
            b.notaBase !==
            a.notaBase
          ) {
            return (
              b.notaBase -
              a.notaBase
            );
          }

          return (
            a.tiempoTotalMs -
            b.tiempoTotalMs
          );
        },
      );

    const posicionPorIntento =
      new Map<
        number,
        number
      >();

    ranking.forEach(
      (
        item,
        indice,
      ) => {
        posicionPorIntento.set(
          item.intento.id,
          indice +
            1,
        );
      },
    );

    await this.prisma.$transaction(
      async (
        tx,
      ) => {
        for (
          const item
          of calculados
        ) {
          const posicion =
            posicionPorIntento.get(
              item.intento.id,
            ) ??
            null;

          // El ranking final NO regala una nota mínima ni descuenta puntos.
          // Un estudiante con 0 respuestas correctas conserva nota 0.
          const descuentoPosicion =
            0;

          const notaFinal =
            Math.min(
              100,
              Math.max(
                0,
                item.notaBase,
              ),
            );

          await tx.intentoQuiz.update({
            where: {
              id:
                item.intento.id,
            },

            data: {
              estado:
                EstadoIntentoQuiz.FINALIZADO,

              finalizadoEn:
                item.finalizadoEn,

              tiempoTotalMs:
                item.tiempoTotalMs,

              posicionFinal:
                posicion,

              respuestasCorrectas:
                item.respuestasCorrectas,

              respuestasIncorrectas:
                item.respuestasIncorrectas,

              respuestasOmitidas:
                item.respuestasOmitidas,

              puntajeBruto:
                item.puntajeBruto,

              notaBase:
                item.notaBase,

              descuentoPosicion,

              notaFinal,
            },
          });

          await tx.participanteQuiz.update({
            where: {
              id:
                item.intento.participanteId,
            },

            data: {
              estado:
                EstadoParticipanteQuiz.FINALIZADO,

              finalizadoEn:
                item.finalizadoEn,

              ultimaConexionEn:
                ahora,
            },
          });

          if (
            quiz.esCalificable &&
            quiz.actividadCalificable
          ) {
            const calificacion =
              await tx.calificacionEstudiante.upsert({
                where: {
                  actividadId_estudianteId: {
                    actividadId:
                      quiz.actividadCalificable.id,

                    estudianteId:
                      item.intento.estudianteId,
                  },
                },

                create: {
                  actividadId:
                    quiz.actividadCalificable.id,

                  estudianteId:
                    item.intento.estudianteId,

                  calificadorId:
                    usuario.id,

                  intentoQuizId:
                    item.intento.id,

                  notaBase:
                    item.notaBase,

                  descuentoRetraso:
                    0,

                  descuentoComentarios:
                    0,

                  ajusteIndividual:
                    -descuentoPosicion,

                  notaFinal,

                  retroalimentacion:
                    posicion
                      ? `Quiz finalizado. Posición: ${posicion}.`
                      : 'Quiz finalizado.',

                  estado:
                    EstadoCalificacion.CALIFICADA,

                  calificadaEn:
                    ahora,
                },

                update: {
                  calificadorId:
                    usuario.id,

                  intentoQuizId:
                    item.intento.id,

                  notaBase:
                    item.notaBase,

                  descuentoRetraso:
                    0,

                  descuentoComentarios:
                    0,

                  ajusteIndividual:
                    -descuentoPosicion,

                  notaFinal,

                  retroalimentacion:
                    posicion
                      ? `Quiz finalizado. Posición: ${posicion}.`
                      : 'Quiz finalizado.',

                  estado:
                    EstadoCalificacion.CALIFICADA,

                  calificadaEn:
                    ahora,

                  publicadaEn:
                    null,
                },
              });

            await tx.historialCalificacion.create({
              data: {
                actividadId:
                  quiz.actividadCalificable.id,

                calificacionId:
                  calificacion.id,

                actorId:
                  usuario.id,

                accion:
                  AccionHistorialCalificacion.CALIFICACION_ACTUALIZADA,

                detalle: {
                  origen:
                    'QUIZ',

                  quizId:
                    quiz.id,

                  intentoQuizId:
                    item.intento.id,

                  notaBase:
                    Number(
                      item.notaBase.toFixed(
                        2,
                      ),
                    ),

                  posicion,

                  descuentoPosicion:
                    Number(
                      descuentoPosicion.toFixed(
                        2,
                      ),
                    ),

                  notaFinal:
                    Number(
                      notaFinal.toFixed(
                        2,
                      ),
                    ),
                },
              },
            });
          }
        }

        if (
          quiz.esCalificable &&
          quiz.actividadCalificable
        ) {
          const estudiantesConIntento =
            new Set(
              calculados.map(
                (
                  item,
                ) =>
                  item.intento.estudianteId,
              ),
            );

          const inscripcionesActivas =
            await tx.inscripcionCurso.findMany({
              where: {
                cursoId,

                estado:
                  EstadoInscripcion.ACTIVA,
              },

              select: {
                estudianteId:
                  true,
              },
            });

          const ausentes =
            inscripcionesActivas.filter(
              (
                inscripcion,
              ) =>
                !estudiantesConIntento.has(
                  inscripcion.estudianteId,
                ),
            );

          for (
            const ausente
            of ausentes
          ) {
            const calificacion =
              await tx.calificacionEstudiante.upsert({
                where: {
                  actividadId_estudianteId: {
                    actividadId:
                      quiz.actividadCalificable.id,

                    estudianteId:
                      ausente.estudianteId,
                  },
                },

                create: {
                  actividadId:
                    quiz.actividadCalificable.id,

                  estudianteId:
                    ausente.estudianteId,

                  calificadorId:
                    usuario.id,

                  notaBase:
                    0,

                  descuentoRetraso:
                    0,

                  descuentoComentarios:
                    0,

                  ajusteIndividual:
                    0,

                  notaFinal:
                    0,

                  retroalimentacion:
                    'No participó en el Quiz.',

                  estado:
                    EstadoCalificacion.CALIFICADA,

                  calificadaEn:
                    ahora,
                },

                update: {
                  calificadorId:
                    usuario.id,

                  notaBase:
                    0,

                  descuentoRetraso:
                    0,

                  descuentoComentarios:
                    0,

                  ajusteIndividual:
                    0,

                  notaFinal:
                    0,

                  retroalimentacion:
                    'No participó en el Quiz.',

                  estado:
                    EstadoCalificacion.CALIFICADA,

                  calificadaEn:
                    ahora,

                  publicadaEn:
                    null,
                },
              });

            await tx.historialCalificacion.create({
              data: {
                actividadId:
                  quiz.actividadCalificable.id,

                calificacionId:
                  calificacion.id,

                actorId:
                  usuario.id,

                accion:
                  AccionHistorialCalificacion.CALIFICACION_ACTUALIZADA,

                detalle: {
                  origen:
                    'QUIZ',

                  quizId:
                    quiz.id,

                  noParticipo:
                    true,

                  notaBase:
                    0,

                  notaFinal:
                    0,
                },
              },
            });
          }
        }

        await tx.quizCurso.update({
          where: {
            id:
              quizId,
          },

          data: {
            estado:
              EstadoQuiz.FINALIZADO,

            finalizadoEn:
              ahora,

            preguntaCierraEn:
              null,

            tiempoRestantePreguntaSegundos:
              null,
          },
        });

        if (
          quiz.esCalificable &&
          quiz.actividadCalificable
        ) {
          await tx.actividadCalificable.update({
            where: {
              id:
                quiz.actividadCalificable.id,
            },

            data: {
              estado:
                EstadoActividadCalificable.CALIFICADA,

              cerradaEn:
                ahora,
            },
          });
        }
      },
    );

    return this.resultadosDocente(
      usuario,
      cursoId,
      quizId,
    );
  }

  async resultadosDocente(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    const [
      inscripciones,
      intentos,
    ] =
      await Promise.all([
        this.prisma.inscripcionCurso.findMany({
          where: {
            cursoId,

            estado:
              EstadoInscripcion.ACTIVA,

            estudiante: {
              estaActivo:
                true,

              rol:
                Rol.ESTUDIANTE,
            },
          },

          orderBy: [
            {
              estudiante: {
                apellidoPaterno:
                  'asc',
              },
            },
            {
              estudiante: {
                nombres:
                  'asc',
              },
            },
          ],

          select: {
            estudianteId:
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
        }),

        this.prisma.intentoQuiz.findMany({
          where: {
            quizId,
          },

          include: {
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
        }),
      ]);

    const intentoPorEstudiante =
      new Map(
        intentos.map(
          (
            intento,
          ) => [
            intento.estudianteId,
            intento,
          ],
        ),
      );

    const totalPreguntas =
      quiz.preguntas.filter(
        (
          pregunta,
        ) =>
          pregunta.estaActiva,
      ).length;

    const resultados =
      inscripciones
        .map(
          (
            inscripcion,
          ) => {
            const intento =
              intentoPorEstudiante.get(
                inscripcion.estudianteId,
              );

            if (
              intento
            ) {
              return {
                id:
                  intento.id,

                estudianteId:
                  intento.estudianteId,

                participo:
                  true,

                posicionFinal:
                  intento.posicionFinal,

                respuestasCorrectas:
                  intento.respuestasCorrectas,

                respuestasIncorrectas:
                  intento.respuestasIncorrectas,

                respuestasOmitidas:
                  intento.respuestasOmitidas,

                puntajeBruto:
                  intento.puntajeBruto,

                notaBase:
                  intento.notaBase,

                descuentoPosicion:
                  intento.descuentoPosicion,

                notaFinal:
                  intento.notaFinal,

                tiempoTotalMs:
                  intento.tiempoTotalMs,

                finalizadoEn:
                  intento.finalizadoEn,

                estudiante:
                  intento.estudiante,
              };
            }

            return {
              id:
                null,

              estudianteId:
                inscripcion.estudianteId,

              participo:
                false,

              posicionFinal:
                null,

              respuestasCorrectas:
                0,

              respuestasIncorrectas:
                0,

              respuestasOmitidas:
                totalPreguntas,

              puntajeBruto:
                0,

              notaBase:
                0,

              descuentoPosicion:
                0,

              notaFinal:
                0,

              tiempoTotalMs:
                null,

              finalizadoEn:
                null,

              estudiante:
                inscripcion.estudiante,
            };
          },
        )
        .sort(
          (
            a,
            b,
          ) => {
            if (
              a.participo !==
              b.participo
            ) {
              return a.participo
                ? -1
                : 1;
            }

            if (
              a.participo &&
              b.participo
            ) {
              const posicionA =
                a.posicionFinal ??
                Number.MAX_SAFE_INTEGER;

              const posicionB =
                b.posicionFinal ??
                Number.MAX_SAFE_INTEGER;

              if (
                posicionA !==
                posicionB
              ) {
                return (
                  posicionA -
                  posicionB
                );
              }

              const notaA =
                Number(
                  a.notaFinal,
                );

              const notaB =
                Number(
                  b.notaFinal,
                );

              if (
                notaA !==
                notaB
              ) {
                return (
                  notaB -
                  notaA
                );
              }
            }

            const apellido =
              a.estudiante.apellidoPaterno.localeCompare(
                b.estudiante.apellidoPaterno,
                'es',
              );

            if (
              apellido !==
              0
            ) {
              return apellido;
            }

            return a.estudiante.nombres.localeCompare(
              b.estudiante.nombres,
              'es',
            );
          },
        );

    return {
      quiz: {
        id:
          quiz.id,

        titulo:
          quiz.titulo,

        estado:
          quiz.estado,

        esCalificable:
          quiz.esCalificable,

        componente:
          quiz.componente,

        usarRanking:
          quiz.usarRanking,

        descuentoPorPuesto:
          quiz.descuentoPorPuesto,

        puntajeMinimoRanking:
          quiz.puntajeMinimoRanking,

        usarPuntuacionVelocidad:
          quiz.usarPuntuacionVelocidad,

        descuentoVelocidadPorPosicion:
          Number(
            quiz.descuentoVelocidadPorPosicion,
          ),

        puntajeMinimoVelocidad:
          Number(
            quiz.puntajeMinimoVelocidad,
          ),

        resultadosPublicados:
          quiz.resultadosPublicados,
      },

      totalInscritos:
        inscripciones.length,

      totalParticiparon:
        resultados.filter(
          (
            item,
          ) =>
            item.participo,
        ).length,

      intentos:
        resultados,
    };
  }

  async detalleResultadoEstudiante(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,

    estudianteId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.FINALIZADO
    ) {
      throw new BadRequestException(
        'El detalle de resultados está disponible cuando el Quiz finaliza',
      );
    }

    const intento =
      await this.prisma.intentoQuiz.findFirst({
        where: {
          quizId,

          estudianteId,
        },

        include: {
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

          respuestas: {
            orderBy: {
              pregunta: {
                orden:
                  'asc',
              },
            },

            include: {
              pregunta: {
                include: {
                  opciones: {
                    orderBy: {
                      orden:
                        'asc',
                    },
                  },
                },
              },

              opcionesSeleccionadas: {
                include: {
                  opcion:
                    true,
                },
              },
            },
          },
        },
      });

    if (
      !intento
    ) {
      throw new NotFoundException(
        'No existe un intento para este estudiante',
      );
    }

    const respuestaPorPregunta =
      new Map(
        intento.respuestas.map(
          (
            respuesta,
          ) => [
            respuesta.preguntaId,
            respuesta,
          ],
        ),
      );

    const preguntas =
      quiz.preguntas.map(
        (
          pregunta,
        ) => {
          const respuesta =
            respuestaPorPregunta.get(
              pregunta.id,
            );

          const seleccionadas =
            respuesta?.opcionesSeleccionadas.map(
              (
                item,
              ) => ({
                id:
                  item.opcion.id,

                texto:
                  item.opcion.texto,
              }),
            ) ??
            [];

          const correctas =
            pregunta.opciones
              .filter(
                (
                  opcion,
                ) =>
                  opcion.esCorrecta,
              )
              .map(
                (
                  opcion,
                ) => ({
                  id:
                    opcion.id,

                  texto:
                    opcion.texto,
                }),
              );

          return {
            preguntaId:
              pregunta.id,

            orden:
              pregunta.orden,

            enunciado:
              pregunta.enunciado,

            dificultad:
              pregunta.dificultad,

            esCorrecta:
              respuesta?.esCorrecta ??
              null,

            omitida:
              !respuesta,

            tiempoRespuestaMs:
              respuesta?.tiempoRespuestaMs ??
              null,

            puntajeObtenido:
              respuesta
                ? Number(
                    respuesta.puntajeObtenido,
                  )
                : 0,

            posicionRespuestaCorrecta:
              respuesta?.posicionRespuestaCorrecta ??
              null,

            descuentoVelocidad:
              respuesta
                ? Number(
                    respuesta.descuentoVelocidad,
                  )
                : 0,

            puntajePregunta:
              Number(
                pregunta.puntaje,
              ),

            opcionesSeleccionadas:
              seleccionadas,

            opcionesCorrectas:
              correctas,

            explicacion:
              pregunta.explicacion,
          };
        },
      );

    return {
      quiz: {
        id:
          quiz.id,

        titulo:
          quiz.titulo,

        esCalificable:
          quiz.esCalificable,

        componente:
          quiz.componente,

        resultadosPublicados:
          quiz.resultadosPublicados,
      },

      estudiante:
        intento.estudiante,

      intento: {
        id:
          intento.id,

        posicionFinal:
          intento.posicionFinal,

        respuestasCorrectas:
          intento.respuestasCorrectas,

        respuestasIncorrectas:
          intento.respuestasIncorrectas,

        respuestasOmitidas:
          intento.respuestasOmitidas,

        puntajeBruto:
          Number(
            intento.puntajeBruto,
          ),

        notaBase:
          Number(
            intento.notaBase,
          ),

        descuentoPosicion:
          Number(
            intento.descuentoPosicion,
          ),

        notaFinal:
          Number(
            intento.notaFinal,
          ),

        tiempoTotalMs:
          intento.tiempoTotalMs,

        finalizadoEn:
          intento.finalizadoEn,
      },

      preguntas,
    };
  }

  async publicarResultados(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    const quiz =
      await this.buscarQuizDocente(
        usuario,
        cursoId,
        quizId,
      );

    if (
      quiz.estado !==
      EstadoQuiz.FINALIZADO
    ) {
      throw new BadRequestException(
        'Solo puedes publicar resultados cuando el Quiz esté finalizado',
      );
    }

    const ahora =
      new Date();

    await this.prisma.$transaction(
      async (
        tx,
      ) => {
        await tx.quizCurso.update({
          where: {
            id:
              quizId,
          },

          data: {
            resultadosPublicados:
              true,

            resultadosPublicadosEn:
              ahora,
          },
        });

        if (
          quiz.esCalificable &&
          quiz.actividadCalificable
        ) {
          await tx.calificacionEstudiante.updateMany({
            where: {
              actividadId:
                quiz.actividadCalificable.id,

              estado:
                EstadoCalificacion.CALIFICADA,
            },

            data: {
              estado:
                EstadoCalificacion.PUBLICADA,

              publicadaEn:
                ahora,
            },
          });

          await tx.actividadCalificable.update({
            where: {
              id:
                quiz.actividadCalificable.id,
            },

            data: {
              estado:
                EstadoActividadCalificable.PUBLICADA,

              visibleParaEstudiantes:
                true,

              publicadaEn:
                quiz.actividadCalificable.publicadaEn ??
                ahora,
            },
          });

          await tx.historialCalificacion.create({
            data: {
              actividadId:
                quiz.actividadCalificable.id,

              actorId:
                usuario.id,

              accion:
                AccionHistorialCalificacion.CALIFICACIONES_PUBLICADAS,

              detalle: {
                origen:
                  'QUIZ',

                quizId:
                  quiz.id,

                publicadoEn:
                  ahora.toISOString(),
              },
            },
          });
        }
      },
    );

    return {
      ok:
        true,

      publicadoEn:
        ahora,
    };
  }

  async rankingFinalEstudiante(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    await this.validarEstudianteCurso(
      usuario,
      cursoId,
    );

    const quiz =
      await this.prisma.quizCurso.findFirst({
        where: {
          id:
            quizId,

          cursoId,

          estado:
            EstadoQuiz.FINALIZADO,
        },

        select: {
          id:
            true,

          titulo:
            true,

          resultadosPublicados:
            true,

          esCalificable:
            true,

          componente:
            true,
        },
      });

    if (
      !quiz
    ) {
      throw new BadRequestException(
        'El ranking final estará disponible cuando el Quiz haya finalizado',
      );
    }

    const participantes =
      await this.prisma.participanteQuiz.findMany({
        where: {
          quizId,
        },

        include: {
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

          intento: {
            select: {
              posicionFinal:
                true,

              respuestasCorrectas:
                true,

              respuestasIncorrectas:
                true,

              respuestasOmitidas:
                true,

              puntajeBruto:
                true,

              notaBase:
                true,

              notaFinal:
                true,

              tiempoTotalMs:
                true,
            },
          },
        },
      });

    const ranking =
      participantes
        .map(
          (
            participante,
          ) => ({
            estudianteId:
              participante.estudianteId,

            nombres:
              participante.estudiante.nombres,

            apellidoPaterno:
              participante.estudiante.apellidoPaterno,

            apellidoMaterno:
              participante.estudiante.apellidoMaterno,

            fotoPerfilUrl:
              participante.estudiante.fotoPerfilUrl,

            avatarCodigo:
              participante.avatarCodigo,

            posicion:
              participante.intento?.posicionFinal ??
              null,

            puntaje:
              participante.intento
                ? Number(
                    participante.intento.puntajeBruto,
                  )
                : 0,

            notaFinal:
              participante.intento
                ? Number(
                    participante.intento.notaFinal,
                  )
                : 0,

            respuestasCorrectas:
              participante.intento?.respuestasCorrectas ??
              0,

            respuestasIncorrectas:
              participante.intento?.respuestasIncorrectas ??
              0,

            respuestasOmitidas:
              participante.intento?.respuestasOmitidas ??
              0,

            tiempoTotalMs:
              participante.intento?.tiempoTotalMs ??
              null,
          }),
        )
        .sort(
          (
            a,
            b,
          ) => {
            const posicionA =
              a.posicion ??
              Number.MAX_SAFE_INTEGER;

            const posicionB =
              b.posicion ??
              Number.MAX_SAFE_INTEGER;

            if (
              posicionA !==
              posicionB
            ) {
              return (
                posicionA -
                posicionB
              );
            }

            if (
              b.puntaje !==
              a.puntaje
            ) {
              return (
                b.puntaje -
                a.puntaje
              );
            }

            const tiempoA =
              a.tiempoTotalMs ??
              Number.MAX_SAFE_INTEGER;

            const tiempoB =
              b.tiempoTotalMs ??
              Number.MAX_SAFE_INTEGER;

            return (
              tiempoA -
              tiempoB
            );
          },
        )
        .map(
          (
            item,
            indice,
          ) => ({
            ...item,

            posicion:
              item.posicion ??
              indice +
              1,

            esYo:
              item.estudianteId ===
              usuario.id,
          }),
        );

    return {
      quiz: {
        id:
          quiz.id,

        titulo:
          quiz.titulo,

        resultadosPublicados:
          quiz.resultadosPublicados,

        esCalificable:
          quiz.esCalificable,

        componente:
          quiz.componente,
      },

      miPosicion:
        ranking.find(
          (
            item,
          ) =>
            item.estudianteId ===
            usuario.id,
        )?.posicion ??
        null,

      ranking,
    };
  }

  async miResultado(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    quizId:
      number,
  ) {
    await this.validarEstudianteCurso(
      usuario,
      cursoId,
    );

    const quiz =
      await this.prisma.quizCurso.findFirst({
        where: {
          id:
            quizId,

          cursoId,

          estado:
            EstadoQuiz.FINALIZADO,
        },

        select: {
          id:
            true,

          titulo:
            true,

          esCalificable:
            true,

          componente:
            true,

          resultadosPublicados:
            true,
        },
      });

    if (
      !quiz
    ) {
      throw new NotFoundException(
        'El Quiz no está finalizado',
      );
    }

    if (
      !quiz.resultadosPublicados
    ) {
      throw new ForbiddenException(
        'Los resultados todavía no fueron publicados por el docente',
      );
    }

    const intento =
      await this.prisma.intentoQuiz.findUnique({
        where: {
          quizId_estudianteId: {
            quizId,

            estudianteId:
              usuario.id,
          },
        },

        include: {
          respuestas: {
            include: {
              opcionesSeleccionadas: {
                include: {
                  opcion: {
                    select: {
                      id:
                        true,

                      texto:
                        true,

                      orden:
                        true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (
      !intento
    ) {
      throw new NotFoundException(
        'No existe un intento registrado para este Quiz',
      );
    }

    const respuestasPorPregunta =
      new Map(
        intento.respuestas.map(
          (
            respuesta,
          ) => [
            respuesta.preguntaId,
            respuesta,
          ],
        ),
      );

    const preguntas =
      await this.prisma.preguntaQuiz.findMany({
        where: {
          quizId,

          estaActiva:
            true,
        },

        orderBy: {
          orden:
            'asc',
        },

        include: {
          opciones: {
            orderBy: {
              orden:
                'asc',
            },
          },
        },
      });

    return {
      quiz,

      intento: {
        id:
          intento.id,

        posicionFinal:
          intento.posicionFinal,

        respuestasCorrectas:
          intento.respuestasCorrectas,

        respuestasIncorrectas:
          intento.respuestasIncorrectas,

        respuestasOmitidas:
          intento.respuestasOmitidas,

        puntajeBruto:
          Number(
            intento.puntajeBruto,
          ),

        notaBase:
          Number(
            intento.notaBase,
          ),

        descuentoPosicion:
          Number(
            intento.descuentoPosicion,
          ),

        notaFinal:
          Number(
            intento.notaFinal,
          ),

        tiempoTotalMs:
          intento.tiempoTotalMs,

        finalizadoEn:
          intento.finalizadoEn,
      },

      preguntas:
        preguntas.map(
          (
            pregunta,
          ) => {
            const respuesta =
              respuestasPorPregunta.get(
                pregunta.id,
              );

            return {
              preguntaId:
                pregunta.id,

              orden:
                pregunta.orden,

              enunciado:
                pregunta.enunciado,

              dificultad:
                pregunta.dificultad,

              explicacion:
                pregunta.explicacion,

              puntajePregunta:
                Number(
                  pregunta.puntaje,
                ),

              esCorrecta:
                respuesta?.esCorrecta ??
                null,

              omitida:
                !respuesta,

              tiempoRespuestaMs:
                respuesta?.tiempoRespuestaMs ??
                null,

              puntajeObtenido:
                respuesta
                  ? Number(
                      respuesta.puntajeObtenido,
                    )
                  : 0,

              posicionRespuestaCorrecta:
                respuesta?.posicionRespuestaCorrecta ??
                null,

              descuentoVelocidad:
                respuesta
                  ? Number(
                      respuesta.descuentoVelocidad,
                    )
                  : 0,

              opcionesSeleccionadas:
                respuesta?.opcionesSeleccionadas.map(
                  (
                    item,
                  ) => ({
                    id:
                      item.opcion.id,

                    texto:
                      item.opcion.texto,

                    orden:
                      item.opcion.orden,
                  }),
                ) ??
                [],

              opcionesCorrectas:
                pregunta.opciones
                  .filter(
                    (
                      opcion,
                    ) =>
                      opcion.esCorrecta,
                  )
                  .map(
                    (
                      opcion,
                    ) => ({
                      id:
                        opcion.id,

                      texto:
                        opcion.texto,

                      orden:
                        opcion.orden,
                    }),
                  ),
            };
          },
        ),
    };
  }
}
