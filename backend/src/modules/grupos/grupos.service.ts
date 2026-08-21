import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccionHistorialGrupo,
  AlcanceConjuntoGrupo,
  CriterioDistribucionGrupo,
  EstadoCurso,
  EstadoInscripcion,
  MetodoCreacionGrupo,
  Prisma,
  Rol,
  TipoEvaluacionGrupo,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ActualizarConjuntoGrupoDto,
  CambiarBloqueoConjuntoDto,
} from './dto/actualizar-conjunto-grupo.dto';

import {
  CrearConjuntoGrupoDto,
} from './dto/crear-conjunto-grupo.dto';

import {
  ActualizarGrupoCursoDto,
  AsignarEstudiantesGrupoDto,
  CambiarRepresentanteGrupoDto,
  CrearGrupoCursoDto,
  MoverEstudianteGrupoDto,
} from './dto/grupos-integrantes.dto';

import {
  ImportarConjuntoGrupoDto,
} from './dto/importar-conjunto-grupo.dto';

import {
  PrevisualizarDistribucionGruposDto,
} from './dto/previsualizar-distribucion-grupos.dto';

import {
  obtenerColorGrupo,
} from './utils/colores-grupos';

import {
  calcularTamanosPorCantidadGrupos,
  calcularTamanosPorIntegrantes,
  construirResultadoDistribucion,
  generarSugerenciasDistribucion,
  mezclarElementos,
  repartirElementos,
} from './utils/distribucion-grupos';

type UsuarioAutenticado = {
  id: number;
  correo: string;
  rol: Rol;
};

@Injectable()
export class GruposService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private readonly seleccionEstudiante = {
    id:
      true,
    nombres:
      true,
    apellidoPaterno:
      true,
    apellidoMaterno:
      true,
    correo:
      true,
    fotoPerfilUrl:
      true,
  } as const;

  private validarDocente(
    usuario:
      UsuarioAutenticado,
  ) {
    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Solo el docente puede administrar los grupos del curso',
      );
    }
  }

  private async obtenerCursoDocente(
    docenteId:
      number,
    cursoId:
      number,
  ) {
    const curso =
      await this.prisma.curso.findFirst({
        where: {
          id:
            cursoId,
          docenteId,
        },

        select: {
          id:
            true,
          docenteId:
            true,
          planificacionId:
            true,
          estado:
            true,
          materia: {
            select: {
              id:
                true,
              nombre:
                true,
              codigo:
                true,
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

  private validarCursoEditable(
    estado:
      EstadoCurso,
  ) {
    if (
      estado ===
      EstadoCurso.FINALIZADO
    ) {
      throw new BadRequestException(
        'No puedes modificar grupos de un curso finalizado',
      );
    }
  }

  private async validarHito(
    planificacionId:
      number | null,
    hitoId:
      number | undefined,
    alcance:
      AlcanceConjuntoGrupo,
  ) {
    if (
      alcance !==
      AlcanceConjuntoGrupo.HITO
    ) {
      return null;
    }

    if (
      !planificacionId ||
      !hitoId
    ) {
      throw new BadRequestException(
        'Debes seleccionar un hito válido',
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
          codigo:
            true,
          nombre:
            true,
        },
      });

    if (!hito) {
      throw new BadRequestException(
        'El hito no pertenece a la planificación del curso',
      );
    }

    return hito;
  }

  private async obtenerEstudiantesActivos(
    cursoId:
      number,
  ) {
    return this.prisma.inscripcionCurso.findMany({
      where: {
        cursoId,
        estado:
          EstadoInscripcion.ACTIVA,
        estudiante: {
          estaActivo:
            true,
          cuentaActivada:
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
          select:
            this.seleccionEstudiante,
        },
      },
    });
  }

  private calcularTamanos(
    totalEstudiantes:
      number,
    criterio:
      CriterioDistribucionGrupo,
    cantidadGrupos?:
      number,
    integrantesPorGrupo?:
      number,
  ) {
    try {
      if (
        criterio ===
        CriterioDistribucionGrupo.CANTIDAD_GRUPOS
      ) {
        if (!cantidadGrupos) {
          throw new Error(
            'Debes indicar cuántos grupos deseas',
          );
        }

        return calcularTamanosPorCantidadGrupos(
          totalEstudiantes,
          cantidadGrupos,
        );
      }

      if (!integrantesPorGrupo) {
        throw new Error(
          'Debes indicar cuántos integrantes deseas por grupo',
        );
      }

      return calcularTamanosPorIntegrantes(
        totalEstudiantes,
        integrantesPorGrupo,
      );
    } catch (
      problema
    ) {
      throw new BadRequestException(
        problema instanceof Error
          ? problema.message
          : 'La distribución solicitada no es válida',
      );
    }
  }

  private validarTamanosMinimos(
    tamanos:
      number[],
  ) {
    if (
      tamanos.some(
        (
          cantidad,
        ) =>
          cantidad <
          2,
      )
    ) {
      throw new BadRequestException(
        'La distribución produce grupos con menos de dos estudiantes',
      );
    }
  }

  private async obtenerConjuntoEditable(
    docenteId:
      number,
    cursoId:
      number,
    conjuntoId:
      number,
  ) {
    const conjunto =
      await this.prisma.conjuntoGrupoCurso.findFirst({
        where: {
          id:
            conjuntoId,
          cursoId,
          estaActivo:
            true,
          curso: {
            docenteId,
          },
        },

        include: {
          grupos: {
            where: {
              estaActivo:
                true,
            },
          },
        },
      });

    if (!conjunto) {
      throw new NotFoundException(
        'El conjunto de grupos no existe',
      );
    }

    return conjunto;
  }

  private validarNoBloqueado(
    estaBloqueado:
      boolean,
  ) {
    if (
      estaBloqueado
    ) {
      throw new ConflictException(
        'El conjunto está bloqueado y no admite modificaciones',
      );
    }
  }

  private async registrarHistorial(
    datos: {
      conjuntoId: number;

      grupoId?: number | null;

      actorId: number;

      estudianteId?: number | null;

      accion: AccionHistorialGrupo;

      detalle?: Prisma.InputJsonValue;
    },
  ) {
    await this.prisma.historialGrupoCurso.create({
      data: {
        conjuntoId:
          datos.conjuntoId,

        grupoId:
          datos.grupoId ??
          null,

        actorId:
          datos.actorId,

        estudianteId:
          datos.estudianteId ??
          null,

        accion:
          datos.accion,

        ...(datos.detalle !==
        undefined
          ? {
              detalle:
                datos.detalle,
            }
          : {}),
      },
    });
  }

  private async obtenerEstadoCreacion(
    cursoId:
      number,
    planificacionId:
      number | null,
  ) {
    const [
      conjuntos,
      estudiantes,
      hitos,
    ] =
      await Promise.all([
        this.prisma.conjuntoGrupoCurso.findMany({
          where: {
            cursoId,
            estaActivo:
              true,
          },

          select: {
            id:
              true,
            nombre:
              true,
            tipoEvaluacion:
              true,
            alcance:
              true,
            hitoId:
              true,
          },
        }),

        this.obtenerEstudiantesActivos(
          cursoId,
        ),

        planificacionId
          ? this.prisma.hitoAcademico.findMany({
              where: {
                planificacionId,
              },

              orderBy: {
                numero:
                  'asc',
              },

              select: {
                id:
                  true,
                codigo:
                  true,
                nombre:
                  true,
                numero:
                  true,
              },
            })
          : Promise.resolve(
              [],
            ),
      ]);

    const procesual =
      conjuntos.find(
        (
          conjunto,
        ) =>
          conjunto.tipoEvaluacion ===
          TipoEvaluacionGrupo.PROCESUAL,
      ) ??
      null;

    const continuaSemestral =
      conjuntos.find(
        (
          conjunto,
        ) =>
          conjunto.tipoEvaluacion ===
            TipoEvaluacionGrupo.CONTINUA &&
          conjunto.alcance ===
            AlcanceConjuntoGrupo.CURSO,
      ) ??
      null;

    const continuasPorHito =
      conjuntos.filter(
        (
          conjunto,
        ) =>
          conjunto.tipoEvaluacion ===
            TipoEvaluacionGrupo.CONTINUA &&
          conjunto.alcance ===
            AlcanceConjuntoGrupo.HITO &&
          conjunto.hitoId !==
            null,
      );

    const mapaContinuaPorHito =
      new Map(
        continuasPorHito.map(
          (
            conjunto,
          ) => [
            conjunto.hitoId as number,
            conjunto,
          ],
        ),
      );

    const modalidadContinua =
      continuaSemestral
        ? 'SEMESTRAL'
        : continuasPorHito.length >
            0
          ? 'POR_HITOS'
          : 'NINGUNA';

    return {
      totalEstudiantes:
        estudiantes.length,

      procesual: {
        existe:
          Boolean(
            procesual,
          ),

        disponible:
          !procesual,

        conjunto:
          procesual
            ? {
                id:
                  procesual.id,
                nombre:
                  procesual.nombre,
              }
            : null,
      },

      continua: {
        modalidad:
          modalidadContinua,

        semestralExiste:
          Boolean(
            continuaSemestral,
          ),

        puedeCrearSemestral:
          !continuaSemestral &&
          continuasPorHito.length ===
            0,

        puedeCrearPorHito:
          !continuaSemestral,

        conjuntoSemestral:
          continuaSemestral
            ? {
                id:
                  continuaSemestral.id,
                nombre:
                  continuaSemestral.nombre,
              }
            : null,

        hitos:
          hitos.map(
            (
              hito,
            ) => {
              const conjunto =
                mapaContinuaPorHito.get(
                  hito.id,
                ) ??
                null;

              return {
                id:
                  hito.id,
                codigo:
                  hito.codigo,
                nombre:
                  hito.nombre,
                numero:
                  hito.numero,
                ocupado:
                  Boolean(
                    conjunto,
                  ),
                conjunto:
                  conjunto
                    ? {
                        id:
                          conjunto.id,
                        nombre:
                          conjunto.nombre,
                      }
                    : null,
              };
            },
          ),
      },
    };
  }

  private async validarReglasCreacion(
    cursoId:
      number,
    planificacionId:
      number | null,
    datos:
      CrearConjuntoGrupoDto,
  ) {
    const estado =
      await this.obtenerEstadoCreacion(
        cursoId,
        planificacionId,
      );

    if (
      datos.tipoEvaluacion ===
      TipoEvaluacionGrupo.PROCESUAL
    ) {
      if (
        datos.alcance !==
        AlcanceConjuntoGrupo.CURSO
      ) {
        throw new BadRequestException(
          'El conjunto procesual debe abarcar todo el semestre',
        );
      }

      if (
        estado.procesual.existe
      ) {
        throw new ConflictException(
          'El curso ya tiene un conjunto procesual activo',
        );
      }

      return;
    }

    if (
      datos.tipoEvaluacion !==
      TipoEvaluacionGrupo.CONTINUA
    ) {
      return;
    }

    if (
      datos.alcance ===
      AlcanceConjuntoGrupo.CURSO
    ) {
      if (
        estado.continua.semestralExiste
      ) {
        throw new ConflictException(
          'El curso ya tiene un conjunto continuo semestral',
        );
      }

      if (
        estado.continua.modalidad ===
        'POR_HITOS'
      ) {
        throw new ConflictException(
          'No puedes crear un conjunto continuo semestral porque ya existen conjuntos continuos por hito',
        );
      }

      return;
    }

    if (
      datos.alcance ===
      AlcanceConjuntoGrupo.HITO
    ) {
      if (
        estado.continua.semestralExiste
      ) {
        throw new ConflictException(
          'No puedes crear conjuntos continuos por hito porque ya existe un conjunto continuo semestral',
        );
      }

      const hitoOcupado =
        estado.continua.hitos.find(
          (
            hito,
          ) =>
            hito.id ===
            datos.hitoId &&
            hito.ocupado,
        );

      if (
        hitoOcupado
      ) {
        throw new ConflictException(
          `El ${hitoOcupado.codigo} ya tiene un conjunto continuo`,
        );
      }

      return;
    }

    throw new BadRequestException(
      'Los conjuntos continuos deben ser semestrales o pertenecer a un hito',
    );
  }

  async obtenerValidacionesCreacion(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    const curso =
      await this.obtenerCursoDocente(
        usuario.id,
        cursoId,
      );

    this.validarCursoEditable(
      curso.estado,
    );

    return this.obtenerEstadoCreacion(
      cursoId,
      curso.planificacionId,
    );
  }

  async previsualizarDistribucion(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    datos:
      PrevisualizarDistribucionGruposDto,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerCursoDocente(
      usuario.id,
      cursoId,
    );

    const estudiantes =
      await this.obtenerEstudiantesActivos(
        cursoId,
      );

    if (
      estudiantes.length <
      2
    ) {
      throw new BadRequestException(
        'Se necesitan al menos dos estudiantes activos para crear grupos',
      );
    }

    const tamanos =
      this.calcularTamanos(
        estudiantes.length,
        datos.criterio,
        datos.cantidadGrupos,
        datos.integrantesPorGrupo,
      );

    this.validarTamanosMinimos(
      tamanos,
    );

    return {
      distribucion:
        construirResultadoDistribucion(
          estudiantes.length,
          tamanos,
          datos.integrantesPorGrupo ??
          null,
        ),

      sugerencias:
        generarSugerenciasDistribucion(
          estudiantes.length,
        ),

      estudiantes:
        estudiantes.map(
          (
            registro,
          ) =>
            registro.estudiante,
        ),
    };
  }

  async obtenerConjuntos(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    hitoId?:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerCursoDocente(
      usuario.id,
      cursoId,
    );

    const conjuntos =
      await this.prisma.conjuntoGrupoCurso.findMany({
        where: {
          cursoId,
          estaActivo:
            true,
          ...(hitoId
            ? {
                OR: [
                  {
                    alcance:
                      AlcanceConjuntoGrupo.CURSO,
                  },
                  {
                    alcance:
                      AlcanceConjuntoGrupo.HITO,
                    hitoId,
                  },
                ],
              }
            : {}),
        },

        orderBy: [
          {
            alcance:
              'asc',
          },
          {
            creadoEn:
              'desc',
          },
        ],

        include: {
          hito: {
            select: {
              id:
                true,
              codigo:
                true,
              nombre:
                true,
            },
          },
          grupos: {
            where: {
              estaActivo:
                true,
            },
            orderBy: {
              orden:
                'asc',
            },
            include: {
              _count: {
                select: {
                  integrantes: {
                    where: {
                      estaActivo:
                        true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              integrantes: {
                where: {
                  estaActivo:
                    true,
                },
              },
            },
          },
        },
      });

    return conjuntos.map(
      (
        conjunto,
      ) => ({
        id:
          conjunto.id,
        cursoId:
          conjunto.cursoId,
        hitoId:
          conjunto.hitoId,
        hito:
          conjunto.hito,
        nombre:
          conjunto.nombre,
        descripcion:
          conjunto.descripcion,
        alcance:
          conjunto.alcance,
        tipoEvaluacion:
          conjunto.tipoEvaluacion,
        metodoCreacion:
          conjunto.metodoCreacion,
        criterioDistribucion:
          conjunto.criterioDistribucion,
        cantidadGruposObjetivo:
          conjunto.cantidadGruposObjetivo,
        integrantesPorGrupoObjetivo:
          conjunto.integrantesPorGrupoObjetivo,
        requiereRepresentante:
          conjunto.requiereRepresentante,
        estaBloqueado:
          conjunto.estaBloqueado,
        creadoEn:
          conjunto.creadoEn,
        actualizadoEn:
          conjunto.actualizadoEn,
        totalGrupos:
          conjunto.grupos.length,
        totalIntegrantes:
          conjunto._count.integrantes,
        grupos:
          conjunto.grupos.map(
            (
              grupo,
            ) => ({
              id:
                grupo.id,
              nombre:
                grupo.nombre,
              color:
                grupo.color,
              orden:
                grupo.orden,
              totalIntegrantes:
                grupo._count.integrantes,
            }),
          ),
      }),
    );
  }

  async obtenerDetalleConjunto(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerCursoDocente(
      usuario.id,
      cursoId,
    );

    const conjunto =
      await this.prisma.conjuntoGrupoCurso.findFirst({
        where: {
          id:
            conjuntoId,
          cursoId,
          estaActivo:
            true,
          curso: {
            docenteId:
              usuario.id,
          },
        },

        include: {
          hito: {
            select: {
              id:
                true,
              codigo:
                true,
              nombre:
                true,
            },
          },
          grupos: {
            where: {
              estaActivo:
                true,
            },
            orderBy: {
              orden:
                'asc',
            },
            include: {
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
                include: {
                  estudiante: {
                    select:
                      this.seleccionEstudiante,
                  },
                },
              },
            },
          },
        },
      });

    if (!conjunto) {
      throw new NotFoundException(
        'El conjunto de grupos no existe',
      );
    }

    const estudiantesActivos =
      await this.obtenerEstudiantesActivos(
        cursoId,
      );

    const asignados =
      new Set(
        conjunto.grupos.flatMap(
          (
            grupo,
          ) =>
            grupo.integrantes.map(
              (
                integrante,
              ) =>
                integrante.estudianteId,
            ),
        ),
      );

    return {
      conjunto: {
        ...conjunto,
        totalGrupos:
          conjunto.grupos.length,
        totalIntegrantes:
          asignados.size,
      },

      estudiantesSinGrupo:
        estudiantesActivos
          .filter(
            (
              registro,
            ) =>
              !asignados.has(
                registro.estudianteId,
              ),
          )
          .map(
            (
              registro,
            ) =>
              registro.estudiante,
          ),
    };
  }

  async crearConjunto(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    datos:
      CrearConjuntoGrupoDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const curso =
      await this.obtenerCursoDocente(
        usuario.id,
        cursoId,
      );

    this.validarCursoEditable(
      curso.estado,
    );

    const hito =
      await this.validarHito(
        curso.planificacionId,
        datos.hitoId,
        datos.alcance,
      );

    await this.validarReglasCreacion(
      cursoId,
      curso.planificacionId,
      datos,
    );

    const estudiantes =
      await this.obtenerEstudiantesActivos(
        cursoId,
      );

    if (
      estudiantes.length <
      2
    ) {
      throw new BadRequestException(
        'Se necesitan al menos dos estudiantes activos',
      );
    }

    const nombre =
      datos.nombre.trim();

    const duplicado =
      await this.prisma.conjuntoGrupoCurso.findFirst({
        where: {
          cursoId,
          nombre: {
            equals:
              nombre,
            mode:
              'insensitive',
          },
          estaActivo:
            true,
        },

        select: {
          id:
            true,
        },
      });

    if (duplicado) {
      throw new ConflictException(
        'Ya existe un conjunto activo con ese nombre',
      );
    }

    if (
      datos.alcance ===
        AlcanceConjuntoGrupo.ACTIVIDAD
    ) {
      throw new BadRequestException(
        'Los conjuntos de actividad se crearán desde Foro o Tareas',
      );
    }

    if (
      datos.tipoEvaluacion ===
        TipoEvaluacionGrupo.PROCESUAL &&
      datos.alcance !==
        AlcanceConjuntoGrupo.CURSO
    ) {
      throw new BadRequestException(
        'Los grupos de evaluación procesual deben ser permanentes para todo el semestre',
      );
    }

    if (
      datos.metodoCreacion ===
        MetodoCreacionGrupo.IMPORTADO
    ) {
      throw new BadRequestException(
        'Utiliza la opción de importar conjunto',
      );
    }

    return this.prisma.$transaction(
      async (
        transaccion,
      ) => {
        const conjunto =
          await transaccion.conjuntoGrupoCurso.create({
            data: {
              cursoId,
              hitoId:
                hito?.id ??
                null,
              nombre,
              descripcion:
                datos.descripcion?.trim() ||
                null,
              alcance:
                datos.alcance,
              tipoEvaluacion:
                datos.tipoEvaluacion,
              metodoCreacion:
                datos.metodoCreacion,
              criterioDistribucion:
                datos.criterioDistribucion ??
                null,
              cantidadGruposObjetivo:
                datos.cantidadGruposObjetivo ??
                null,
              integrantesPorGrupoObjetivo:
                datos.integrantesPorGrupoObjetivo ??
                null,
              requiereRepresentante:
                datos.requiereRepresentante ??
                false,
            },
          });

        if (
          datos.metodoCreacion ===
          MetodoCreacionGrupo.ALEATORIO
        ) {
          if (
            !datos.criterioDistribucion
          ) {
            throw new BadRequestException(
              'Debes seleccionar un criterio de distribución',
            );
          }

          const tamanos =
            this.calcularTamanos(
              estudiantes.length,
              datos.criterioDistribucion,
              datos.cantidadGruposObjetivo,
              datos.integrantesPorGrupoObjetivo,
            );

          this.validarTamanosMinimos(
            tamanos,
          );

          const mezclados =
            mezclarElementos(
              estudiantes,
            );

          const distribuidos =
            repartirElementos(
              mezclados,
              tamanos,
            );

          for (
            let indice =
              0;
            indice <
            distribuidos.length;
            indice +=
            1
          ) {
            const grupo =
              await transaccion.grupoCurso.create({
                data: {
                  conjuntoId:
                    conjunto.id,
                  nombre:
                    `Grupo ${indice + 1}`,
                  color:
                    obtenerColorGrupo(
                      indice,
                    ),
                  orden:
                    indice,
                },
              });

            const integrantes =
              distribuidos[
                indice
              ];

            if (
              integrantes.length >
              0
            ) {
              await transaccion.integranteGrupoCurso.createMany({
                data:
                  integrantes.map(
                    (
                      registro,
                      posicion,
                    ) => ({
                      conjuntoId:
                        conjunto.id,
                      grupoId:
                        grupo.id,
                      estudianteId:
                        registro.estudianteId,
                      esRepresentante:
                        (
                          datos.requiereRepresentante ??
                          false
                        ) &&
                        posicion ===
                          0,
                    }),
                  ),
              });
            }
          }
        } else {
          const grupos =
            datos.grupos ??
            [];

          const estudiantesUsados =
            new Set<number>();

          for (
            let indice =
              0;
            indice <
            grupos.length;
            indice +=
            1
          ) {
            const datosGrupo =
              grupos[
                indice
              ];

            const ids =
              datosGrupo.estudianteIds ??
              [];

            for (
              const estudianteId of
              ids
            ) {
              if (
                estudiantesUsados.has(
                  estudianteId,
                )
              ) {
                throw new ConflictException(
                  'Un estudiante no puede pertenecer a dos grupos del mismo conjunto',
                );
              }

              estudiantesUsados.add(
                estudianteId,
              );
            }

            const inscritos =
              estudiantes.filter(
                (
                  registro,
                ) =>
                  ids.includes(
                    registro.estudianteId,
                  ),
              );

            if (
              inscritos.length !==
              ids.length
            ) {
              throw new BadRequestException(
                'Uno o más estudiantes no pertenecen al curso',
              );
            }

            const grupo =
              await transaccion.grupoCurso.create({
                data: {
                  conjuntoId:
                    conjunto.id,
                  nombre:
                    datosGrupo.nombre.trim(),
                  descripcion:
                    datosGrupo.descripcion?.trim() ||
                    null,
                  color:
                    datosGrupo.color ??
                    obtenerColorGrupo(
                      indice,
                    ),
                  orden:
                    indice,
                },
              });

            if (
              ids.length >
              0
            ) {
              await transaccion.integranteGrupoCurso.createMany({
                data:
                  ids.map(
                    (
                      estudianteId,
                      posicion,
                    ) => ({
                      conjuntoId:
                        conjunto.id,
                      grupoId:
                        grupo.id,
                      estudianteId,
                      esRepresentante:
                        (
                          datos.requiereRepresentante ??
                          false
                        ) &&
                        posicion ===
                          0,
                    }),
                  ),
              });
            }
          }
        }

        await transaccion.historialGrupoCurso.create({
          data: {
            conjuntoId:
              conjunto.id,
            actorId:
              usuario.id,
            accion:
              AccionHistorialGrupo.CONJUNTO_CREADO,
            detalle: {
              nombre:
                conjunto.nombre,
              alcance:
                conjunto.alcance,
              tipoEvaluacion:
                conjunto.tipoEvaluacion,
              metodoCreacion:
                conjunto.metodoCreacion,
            },
          },
        });

        return {
          mensaje:
            'Conjunto de grupos creado correctamente',
          conjuntoId:
            conjunto.id,
        };
      },
    );
  }

  async actualizarConjunto(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
    datos:
      ActualizarConjuntoGrupoDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const conjunto =
      await this.obtenerConjuntoEditable(
        usuario.id,
        cursoId,
        conjuntoId,
      );

    this.validarNoBloqueado(
      conjunto.estaBloqueado,
    );

    const actualizado =
      await this.prisma.conjuntoGrupoCurso.update({
        where: {
          id:
            conjuntoId,
        },

        data: {
          ...(datos.nombre !==
          undefined
            ? {
                nombre:
                  datos.nombre.trim(),
              }
            : {}),
          ...(datos.descripcion !==
          undefined
            ? {
                descripcion:
                  datos.descripcion?.trim() ||
                  null,
              }
            : {}),
          ...(datos.requiereRepresentante !==
          undefined
            ? {
                requiereRepresentante:
                  datos.requiereRepresentante,
              }
            : {}),
        },
      });

    await this.registrarHistorial({
      conjuntoId,
      actorId:
        usuario.id,
      accion:
        AccionHistorialGrupo.CONJUNTO_ACTUALIZADO,
      detalle: {
        campos:
          Object.keys(
            datos,
          ),
      },
    });

    return {
      mensaje:
        'Conjunto actualizado correctamente',
      conjunto:
        actualizado,
    };
  }

  async cambiarBloqueo(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
    datos:
      CambiarBloqueoConjuntoDto,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerConjuntoEditable(
      usuario.id,
      cursoId,
      conjuntoId,
    );

    const conjunto =
      await this.prisma.conjuntoGrupoCurso.update({
        where: {
          id:
            conjuntoId,
        },

        data: {
          estaBloqueado:
            datos.estaBloqueado,
        },
      });

    await this.registrarHistorial({
      conjuntoId,
      actorId:
        usuario.id,
      accion:
        datos.estaBloqueado
          ? AccionHistorialGrupo.CONJUNTO_BLOQUEADO
          : AccionHistorialGrupo.CONJUNTO_DESBLOQUEADO,
    });

    return {
      mensaje:
        datos.estaBloqueado
          ? 'Conjunto bloqueado correctamente'
          : 'Conjunto desbloqueado correctamente',
      conjunto,
    };
  }

  async crearGrupo(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
    datos:
      CrearGrupoCursoDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const conjunto =
      await this.obtenerConjuntoEditable(
        usuario.id,
        cursoId,
        conjuntoId,
      );

    this.validarNoBloqueado(
      conjunto.estaBloqueado,
    );

    const orden =
      conjunto.grupos.length;

    const grupo =
      await this.prisma.grupoCurso.create({
        data: {
          conjuntoId,
          nombre:
            datos.nombre.trim(),
          descripcion:
            datos.descripcion?.trim() ||
            null,
          color:
            datos.color ??
            obtenerColorGrupo(
              orden,
            ),
          orden,
        },
      });

    await this.registrarHistorial({
      conjuntoId,
      grupoId:
        grupo.id,
      actorId:
        usuario.id,
      accion:
        AccionHistorialGrupo.GRUPO_CREADO,
      detalle: {
        nombre:
          grupo.nombre,
      },
    });

    return {
      mensaje:
        'Grupo creado correctamente',
      grupo,
    };
  }

  async actualizarGrupo(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
    grupoId:
      number,
    datos:
      ActualizarGrupoCursoDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const conjunto =
      await this.obtenerConjuntoEditable(
        usuario.id,
        cursoId,
        conjuntoId,
      );

    this.validarNoBloqueado(
      conjunto.estaBloqueado,
    );

    const grupo =
      await this.prisma.grupoCurso.findFirst({
        where: {
          id:
            grupoId,
          conjuntoId,
          estaActivo:
            true,
        },
      });

    if (!grupo) {
      throw new NotFoundException(
        'El grupo no existe',
      );
    }

    const actualizado =
      await this.prisma.grupoCurso.update({
        where: {
          id:
            grupoId,
        },

        data: {
          ...(datos.nombre !==
          undefined
            ? {
                nombre:
                  datos.nombre.trim(),
              }
            : {}),
          ...(datos.descripcion !==
          undefined
            ? {
                descripcion:
                  datos.descripcion?.trim() ||
                  null,
              }
            : {}),
          ...(datos.color !==
          undefined
            ? {
                color:
                  datos.color,
              }
            : {}),
        },
      });

    await this.registrarHistorial({
      conjuntoId,
      grupoId,
      actorId:
        usuario.id,
      accion:
        AccionHistorialGrupo.GRUPO_ACTUALIZADO,
      detalle: {
        campos:
          Object.keys(
            datos,
          ),
      },
    });

    return {
      mensaje:
        'Grupo actualizado correctamente',
      grupo:
        actualizado,
    };
  }

  async asignarEstudiantes(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
    grupoId:
      number,
    datos:
      AsignarEstudiantesGrupoDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const conjunto =
      await this.obtenerConjuntoEditable(
        usuario.id,
        cursoId,
        conjuntoId,
      );

    this.validarNoBloqueado(
      conjunto.estaBloqueado,
    );

    const grupo =
      conjunto.grupos.find(
        (
          item,
        ) =>
          item.id ===
          grupoId,
      );

    if (!grupo) {
      throw new NotFoundException(
        'El grupo no pertenece al conjunto',
      );
    }

    const idsUnicos =
      [
        ...new Set(
          datos.estudianteIds,
        ),
      ];

    const estudiantes =
      await this.obtenerEstudiantesActivos(
        cursoId,
      );

    const idsValidos =
      new Set(
        estudiantes.map(
          (
            registro,
          ) =>
            registro.estudianteId,
        ),
      );

    if (
      idsUnicos.some(
        (
          id,
        ) =>
          !idsValidos.has(
            id,
          ),
      )
    ) {
      throw new BadRequestException(
        'Uno o más estudiantes no pertenecen al curso',
      );
    }

    const yaAsignados =
      await this.prisma.integranteGrupoCurso.findMany({
        where: {
          conjuntoId,
          estudianteId: {
            in:
              idsUnicos,
          },
          estaActivo:
            true,
        },

        select: {
          estudianteId:
            true,
        },
      });

    if (
      yaAsignados.length >
      0
    ) {
      throw new ConflictException(
        'Uno o más estudiantes ya pertenecen a un grupo de este conjunto',
      );
    }

    await this.prisma.$transaction(
      async (
        transaccion,
      ) => {
        await transaccion.integranteGrupoCurso.createMany({
          data:
            idsUnicos.map(
              (
                estudianteId,
              ) => ({
                conjuntoId,
                grupoId,
                estudianteId,
              }),
            ),
        });

        await transaccion.historialGrupoCurso.createMany({
          data:
            idsUnicos.map(
              (
                estudianteId,
              ) => ({
                conjuntoId,
                grupoId,
                actorId:
                  usuario.id,
                estudianteId,
                accion:
                  AccionHistorialGrupo.ESTUDIANTE_AGREGADO,
              }),
            ),
        });
      },
    );

    return {
      mensaje:
        'Estudiantes asignados correctamente',
      totalAsignados:
        idsUnicos.length,
    };
  }

  async moverEstudiante(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
    grupoOrigenId:
      number,
    datos:
      MoverEstudianteGrupoDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const conjunto =
      await this.obtenerConjuntoEditable(
        usuario.id,
        cursoId,
        conjuntoId,
      );

    this.validarNoBloqueado(
      conjunto.estaBloqueado,
    );

    if (
      grupoOrigenId ===
      datos.grupoDestinoId
    ) {
      throw new BadRequestException(
        'El grupo de origen y destino no pueden ser iguales',
      );
    }

    const origen =
      conjunto.grupos.find(
        (
          grupo,
        ) =>
          grupo.id ===
          grupoOrigenId,
      );

    const destino =
      conjunto.grupos.find(
        (
          grupo,
        ) =>
          grupo.id ===
          datos.grupoDestinoId,
      );

    if (
      !origen ||
      !destino
    ) {
      throw new NotFoundException(
        'El grupo de origen o destino no pertenece al conjunto',
      );
    }

    const integrante =
      await this.prisma.integranteGrupoCurso.findFirst({
        where: {
          conjuntoId,
          grupoId:
            grupoOrigenId,
          estudianteId:
            datos.estudianteId,
          estaActivo:
            true,
        },
      });

    if (!integrante) {
      throw new NotFoundException(
        'El estudiante no pertenece al grupo de origen',
      );
    }

    await this.prisma.integranteGrupoCurso.update({
      where: {
        id:
          integrante.id,
      },

      data: {
        grupoId:
          datos.grupoDestinoId,
        esRepresentante:
          false,
      },
    });

    await this.registrarHistorial({
      conjuntoId,
      grupoId:
        datos.grupoDestinoId,
      actorId:
        usuario.id,
      estudianteId:
        datos.estudianteId,
      accion:
        AccionHistorialGrupo.ESTUDIANTE_MOVIDO,
      detalle: {
        grupoOrigenId,
        grupoDestinoId:
          datos.grupoDestinoId,
      },
    });

    return {
      mensaje:
        'Estudiante movido correctamente',
    };
  }

  async cambiarRepresentante(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
    grupoId:
      number,
    datos:
      CambiarRepresentanteGrupoDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const conjunto =
      await this.obtenerConjuntoEditable(
        usuario.id,
        cursoId,
        conjuntoId,
      );

    this.validarNoBloqueado(
      conjunto.estaBloqueado,
    );

    if (
      !conjunto.requiereRepresentante
    ) {
      throw new BadRequestException(
        'Este conjunto no utiliza representantes',
      );
    }

    const integrante =
      await this.prisma.integranteGrupoCurso.findFirst({
        where: {
          conjuntoId,
          grupoId,
          estudianteId:
            datos.estudianteId,
          estaActivo:
            true,
        },
      });

    if (!integrante) {
      throw new NotFoundException(
        'El estudiante no pertenece al grupo',
      );
    }

    await this.prisma.$transaction(
      async (
        transaccion,
      ) => {
        if (
          datos.esRepresentante
        ) {
          await transaccion.integranteGrupoCurso.updateMany({
            where: {
              conjuntoId,
              grupoId,
              estaActivo:
                true,
              esRepresentante:
                true,
            },

            data: {
              esRepresentante:
                false,
            },
          });
        }

        await transaccion.integranteGrupoCurso.update({
          where: {
            id:
              integrante.id,
          },

          data: {
            esRepresentante:
              datos.esRepresentante,
          },
        });

        await transaccion.historialGrupoCurso.create({
          data: {
            conjuntoId,
            grupoId,
            actorId:
              usuario.id,
            estudianteId:
              datos.estudianteId,
            accion:
              datos.esRepresentante
                ? AccionHistorialGrupo.REPRESENTANTE_ASIGNADO
                : AccionHistorialGrupo.REPRESENTANTE_REMOVIDO,
          },
        });
      },
    );

    return {
      mensaje:
        datos.esRepresentante
          ? 'Representante asignado correctamente'
          : 'Representante retirado correctamente',
    };
  }

  async retirarEstudiante(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
    grupoId:
      number,
    estudianteId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    const conjunto =
      await this.obtenerConjuntoEditable(
        usuario.id,
        cursoId,
        conjuntoId,
      );

    this.validarNoBloqueado(
      conjunto.estaBloqueado,
    );

    const integrante =
      await this.prisma.integranteGrupoCurso.findFirst({
        where: {
          conjuntoId,
          grupoId,
          estudianteId,
          estaActivo:
            true,
        },
      });

    if (!integrante) {
      throw new NotFoundException(
        'El estudiante no pertenece al grupo',
      );
    }

    await this.prisma.integranteGrupoCurso.update({
      where: {
        id:
          integrante.id,
      },

      data: {
        estaActivo:
          false,
        retiradoEn:
          new Date(),
        esRepresentante:
          false,
      },
    });

    await this.registrarHistorial({
      conjuntoId,
      grupoId,
      actorId:
        usuario.id,
      estudianteId,
      accion:
        AccionHistorialGrupo.ESTUDIANTE_RETIRADO,
    });

    return {
      mensaje:
        'Estudiante retirado del grupo correctamente',
    };
  }

  async eliminarGrupo(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
    grupoId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    const conjunto =
      await this.obtenerConjuntoEditable(
        usuario.id,
        cursoId,
        conjuntoId,
      );

    this.validarNoBloqueado(
      conjunto.estaBloqueado,
    );

    const grupo =
      await this.prisma.grupoCurso.findFirst({
        where: {
          id:
            grupoId,
          conjuntoId,
          estaActivo:
            true,
        },

        include: {
          integrantes: {
            where: {
              estaActivo:
                true,
            },
            select: {
              id:
                true,
            },
          },
        },
      });

    if (!grupo) {
      throw new NotFoundException(
        'El grupo no existe',
      );
    }

    if (
      grupo.integrantes.length >
      0
    ) {
      throw new ConflictException(
        'Retira o mueve a los integrantes antes de eliminar el grupo',
      );
    }

    await this.prisma.grupoCurso.update({
      where: {
        id:
          grupoId,
      },

      data: {
        estaActivo:
          false,
      },
    });

    await this.registrarHistorial({
      conjuntoId,
      grupoId,
      actorId:
        usuario.id,
      accion:
        AccionHistorialGrupo.GRUPO_ELIMINADO,
      detalle: {
        nombre:
          grupo.nombre,
      },
    });

    return {
      mensaje:
        'Grupo eliminado correctamente',
    };
  }

  async importarConjunto(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    datos:
      ImportarConjuntoGrupoDto,
  ) {
    this.validarDocente(
      usuario,
    );

    const curso =
      await this.obtenerCursoDocente(
        usuario.id,
        cursoId,
      );

    this.validarCursoEditable(
      curso.estado,
    );

    const origen =
      await this.prisma.conjuntoGrupoCurso.findFirst({
        where: {
          id:
            datos.conjuntoOrigenId,
          cursoId,
          estaActivo:
            true,
        },

        include: {
          grupos: {
            where: {
              estaActivo:
                true,
            },
            orderBy: {
              orden:
                'asc',
            },
            include: {
              integrantes: {
                where: {
                  estaActivo:
                    true,
                },
              },
            },
          },
        },
      });

    if (!origen) {
      throw new NotFoundException(
        'El conjunto de origen no existe',
      );
    }

    const hito =
      datos.hitoId
        ? await this.validarHito(
            curso.planificacionId,
            datos.hitoId,
            AlcanceConjuntoGrupo.HITO,
          )
        : null;

    return this.prisma.$transaction(
      async (
        transaccion,
      ) => {
        const conjunto =
          await transaccion.conjuntoGrupoCurso.create({
            data: {
              cursoId,
              hitoId:
                hito?.id ??
                null,
              nombre:
                datos.nombre.trim(),
              descripcion:
                origen.descripcion,
              alcance:
                hito
                  ? AlcanceConjuntoGrupo.HITO
                  : AlcanceConjuntoGrupo.CURSO,
              tipoEvaluacion:
                origen.tipoEvaluacion,
              metodoCreacion:
                MetodoCreacionGrupo.IMPORTADO,
              requiereRepresentante:
                origen.requiereRepresentante,
            },
          });

        for (
          const grupoOrigen of
          origen.grupos
        ) {
          const grupo =
            await transaccion.grupoCurso.create({
              data: {
                conjuntoId:
                  conjunto.id,
                nombre:
                  grupoOrigen.nombre,
                descripcion:
                  grupoOrigen.descripcion,
                color:
                  grupoOrigen.color,
                orden:
                  grupoOrigen.orden,
              },
            });

          if (
            datos.copiarIntegrantes !==
              false &&
            grupoOrigen.integrantes.length >
              0
          ) {
            await transaccion.integranteGrupoCurso.createMany({
              data:
                grupoOrigen.integrantes.map(
                  (
                    integrante,
                  ) => ({
                    conjuntoId:
                      conjunto.id,
                    grupoId:
                      grupo.id,
                    estudianteId:
                      integrante.estudianteId,
                    esRepresentante:
                      integrante.esRepresentante,
                  }),
                ),
            });
          }
        }

        await transaccion.historialGrupoCurso.create({
          data: {
            conjuntoId:
              conjunto.id,
            actorId:
              usuario.id,
            accion:
              AccionHistorialGrupo.CONJUNTO_IMPORTADO,
            detalle: {
              conjuntoOrigenId:
                origen.id,
              copiarIntegrantes:
                datos.copiarIntegrantes !==
                false,
            },
          },
        });

        return {
          mensaje:
            'Conjunto importado correctamente',
          conjuntoId:
            conjunto.id,
        };
      },
    );
  }

  async obtenerHistorial(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    await this.obtenerConjuntoEditable(
      usuario.id,
      cursoId,
      conjuntoId,
    );

    return this.prisma.historialGrupoCurso.findMany({
      where: {
        conjuntoId,
      },

      orderBy: {
        registradoEn:
          'desc',
      },

      take:
        250,

      include: {
        actor: {
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
        grupo: {
          select: {
            id:
              true,
            nombre:
              true,
          },
        },
      },
    });
  }

  async eliminarConjunto(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    conjuntoId:
      number,
  ) {
    this.validarDocente(
      usuario,
    );

    const conjunto =
      await this.obtenerConjuntoEditable(
        usuario.id,
        cursoId,
        conjuntoId,
      );

    this.validarNoBloqueado(
      conjunto.estaBloqueado,
    );

    await this.prisma.conjuntoGrupoCurso.update({
      where: {
        id:
          conjuntoId,
      },

      data: {
        estaActivo:
          false,
      },
    });

    return {
      mensaje:
        'Conjunto eliminado correctamente',
    };
  }
}