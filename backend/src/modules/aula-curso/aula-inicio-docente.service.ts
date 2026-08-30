import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import {
  ComponenteEvaluacion,
  EstadoActividadCalificable,
  EstadoCalificacion,
  EstadoForo,
  EstadoInscripcion,
  EstadoQuiz,
  EstadoTarea,
  Rol,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  AulaCursoService,
} from './aula-curso.service';

type UsuarioAutenticado = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  rol: Rol;
};

type ResumenComponente = {
  promedioSobre100: number;
  aporteExacto: number;
  notaFinal: number;
  maximo: number;
};

@Injectable()
export class AulaInicioDocenteService {
  constructor(
    private readonly prisma:
      PrismaService,
    private readonly aulaCursoService:
      AulaCursoService,
  ) {}

  private redondear(
    valor: number,
    decimales = 2,
  ) {
    return Number(
      valor.toFixed(
        decimales,
      ),
    );
  }

  private promedio(
    valores: number[],
  ) {
    if (
      valores.length ===
      0
    ) {
      return 0;
    }

    return valores.reduce(
      (
        acumulado,
        valor,
      ) =>
        acumulado +
        valor,
      0,
    ) /
      valores.length;
  }

  private construirResumenComponente(
    promediosEstudiantes: number[],
    maximo: number,
  ): ResumenComponente {
    const promedioSobre100 =
      this.promedio(
        promediosEstudiantes,
      );

    const aporteExacto =
      (
        promedioSobre100 *
        maximo
      ) /
      100;

    return {
      promedioSobre100:
        this.redondear(
          promedioSobre100,
        ),
      aporteExacto:
        this.redondear(
          aporteExacto,
        ),
      notaFinal:
        Math.round(
          aporteExacto,
        ),
      maximo,
    };
  }

  async obtenerInicioDocente(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    hitoId:
      number,
  ) {
    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Solo el docente puede consultar el resumen académico del hito',
      );
    }

    const hitoCurso =
      await this.aulaCursoService
        .obtenerHitoCurso(
          usuario,
          cursoId,
          hitoId,
        );

    const [
      inscripciones,
      publicaciones,
      foros,
      tareas,
      quizzes,
      actividades,
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
          select: {
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
                correo:
                  true,
              },
            },
          },
        }),
        this.prisma.publicacionCurso.count({
          where: {
            cursoId,
            hitoId,
            estaActiva:
              true,
            eliminadoEn:
              null,
          },
        }),
        this.prisma.temaForoCurso.findMany({
          where: {
            cursoId,
            hitoId,
            estaActivo:
              true,
            eliminadoEn:
              null,
            estado: {
              not:
                EstadoForo.ANULADO,
            },
          },
          select: {
            id:
              true,
            titulo:
              true,
            fechaLimite:
              true,
            fechaCierre:
              true,
            estado:
              true,
          },
        }),
        this.prisma.tareaCurso.findMany({
          where: {
            cursoId,
            hitoId,
            estaActiva:
              true,
            eliminadoEn:
              null,
            estado: {
              not:
                EstadoTarea.ANULADA,
            },
          },
          select: {
            id:
              true,
            titulo:
              true,
            fechaLimite:
              true,
            fechaCierre:
              true,
            estado:
              true,
          },
        }),
        this.prisma.quizCurso.findMany({
          where: {
            cursoId,
            hitoId,
            estado: {
              not:
                EstadoQuiz.CANCELADO,
            },
          },
          select: {
            id:
              true,
            titulo:
              true,
            cierreProgramado:
              true,
            estado:
              true,
          },
        }),
        this.prisma.actividadCalificable.findMany({
          where: {
            cursoId,
            hitoId,
            estado: {
              not:
                EstadoActividadCalificable.ANULADA,
            },
          },
          orderBy: [
            {
              componente:
                'asc',
            },
            {
              orden:
                'asc',
            },
          ],
          select: {
            id:
              true,
            titulo:
              true,
            origen:
              true,
            componente:
              true,
            estado:
              true,
            participaEnPromedio:
              true,
            foroId:
              true,
            tareaId:
              true,
            quizId:
              true,
            calificaciones: {
              select: {
                estudianteId:
                  true,
                notaFinal:
                  true,
                estado:
                  true,
              },
            },
          },
        }),
      ]);

    const estudiantes =
      inscripciones.map(
        (
          inscripcion,
        ) =>
          inscripcion.estudiante,
      );

    const estadosCalificados =
      new Set<EstadoCalificacion>([
        EstadoCalificacion.CALIFICADA,
        EstadoCalificacion.PUBLICADA,
      ]);

    const actividadesPromedio =
      actividades.filter(
        (
          actividad,
        ) =>
          actividad.participaEnPromedio,
      );

    const resumenEstudiantes =
      estudiantes.map(
        (
          estudiante,
        ) => {
          const calcularComponente =
            (
              componente:
                ComponenteEvaluacion,
            ) => {
              const actividadesComponente =
                actividadesPromedio.filter(
                  (
                    actividad,
                  ) =>
                    actividad.componente ===
                    componente,
                );

              const notas =
                actividadesComponente.flatMap(
                  (
                    actividad,
                  ) => {
                    const calificacion =
                      actividad.calificaciones.find(
                        (
                          item,
                        ) =>
                          item.estudianteId ===
                            estudiante.id &&
                          estadosCalificados.has(
                            item.estado,
                          ),
                      );

                    return calificacion
                      ? [
                          Number(
                            calificacion.notaFinal,
                          ),
                        ]
                      : [];
                  },
                );

              return {
                promedio:
                  notas.length >
                  0
                    ? this.promedio(
                        notas,
                      )
                    : null,
                calificadas:
                  notas.length,
                pendientes:
                  Math.max(
                    actividadesComponente.length -
                      notas.length,
                    0,
                  ),
              };
            };

          const continua =
            calcularComponente(
              ComponenteEvaluacion.CONTINUA,
            );

          const procesual =
            calcularComponente(
              ComponenteEvaluacion.PROCESUAL,
            );

          const promedios =
            [
              continua.promedio,
              procesual.promedio,
            ].filter(
              (
                valor,
              ): valor is number =>
                valor !==
                null,
            );

          return {
            ...estudiante,
            continua,
            procesual,
            promedioGeneral:
              promedios.length >
              0
                ? this.promedio(
                    promedios,
                  )
                : null,
            actividadesCalificadas:
              continua.calificadas +
              procesual.calificadas,
            actividadesPendientes:
              continua.pendientes +
              procesual.pendientes,
          };
        },
      );

    const promediosContinua =
      resumenEstudiantes.flatMap(
        (
          estudiante,
        ) =>
          estudiante.continua.promedio !==
          null
            ? [
                estudiante.continua.promedio,
              ]
            : [],
      );

    const promediosProcesual =
      resumenEstudiantes.flatMap(
        (
          estudiante,
        ) =>
          estudiante.procesual.promedio !==
          null
            ? [
                estudiante.procesual.promedio,
              ]
            : [],
      );

    const continua =
      this.construirResumenComponente(
        promediosContinua,
        hitoCurso.hito.puntajeContinua,
      );

    const procesual =
      this.construirResumenComponente(
        promediosProcesual,
        hitoCurso.hito.puntajeProcesual,
      );

    const totalExacto =
      continua.aporteExacto +
      procesual.aporteExacto;

    const distribucion = [
      {
        id:
          'BAJO',
        etiqueta:
          '0 - 50',
        cantidad:
          resumenEstudiantes.filter(
            (
              estudiante,
            ) =>
              estudiante.promedioGeneral !==
                null &&
              estudiante.promedioGeneral <=
                50,
          ).length,
      },
      {
        id:
          'REGULAR',
        etiqueta:
          '51 - 70',
        cantidad:
          resumenEstudiantes.filter(
            (
              estudiante,
            ) =>
              estudiante.promedioGeneral !==
                null &&
              estudiante.promedioGeneral >
                50 &&
              estudiante.promedioGeneral <=
                70,
          ).length,
      },
      {
        id:
          'BUENO',
        etiqueta:
          '71 - 85',
        cantidad:
          resumenEstudiantes.filter(
            (
              estudiante,
            ) =>
              estudiante.promedioGeneral !==
                null &&
              estudiante.promedioGeneral >
                70 &&
              estudiante.promedioGeneral <=
                85,
          ).length,
      },
      {
        id:
          'DESTACADO',
        etiqueta:
          '86 - 100',
        cantidad:
          resumenEstudiantes.filter(
            (
              estudiante,
            ) =>
              estudiante.promedioGeneral !==
                null &&
              estudiante.promedioGeneral >
                85,
          ).length,
      },
      {
        id:
          'SIN_NOTA',
        etiqueta:
          'Sin calificación',
        cantidad:
          resumenEstudiantes.filter(
            (
              estudiante,
            ) =>
              estudiante.promedioGeneral ===
              null,
          ).length,
      },
    ];

    const rendimientoActividades =
      actividades
        .filter(
          (
            actividad,
          ) =>
            actividad.participaEnPromedio,
        )
        .map(
          (
            actividad,
          ) => {
            const calificaciones =
              actividad.calificaciones.filter(
                (
                  calificacion,
                ) =>
                  estadosCalificados.has(
                    calificacion.estado,
                  ),
              );

            const notas =
              calificaciones.map(
                (
                  calificacion,
                ) =>
                  Number(
                    calificacion.notaFinal,
                  ),
              );

            return {
              id:
                actividad.id,
              titulo:
                actividad.titulo,
              origen:
                actividad.origen,
              componente:
                actividad.componente,
              estado:
                actividad.estado,
              foroId:
                actividad.foroId,
              tareaId:
                actividad.tareaId,
              quizId:
                actividad.quizId,
              promedio:
                this.redondear(
                  this.promedio(
                    notas,
                  ),
                ),
              calificadas:
                calificaciones.length,
              pendientes:
                Math.max(
                  estudiantes.length -
                    calificaciones.length,
                  0,
                ),
              totalEstudiantes:
                estudiantes.length,
            };
          },
        )
        .sort(
          (
            a,
            b,
          ) => {
            if (
              a.calificadas ===
                0 &&
              b.calificadas >
                0
            ) {
              return 1;
            }

            if (
              b.calificadas ===
                0 &&
              a.calificadas >
                0
            ) {
              return -1;
            }

            return (
              a.promedio -
              b.promedio
            );
          },
        );

    const estudiantesSeguimiento =
      resumenEstudiantes
        .filter(
          (
            estudiante,
          ) =>
            (
              estudiante.promedioGeneral !==
                null &&
              estudiante.promedioGeneral <
                51
            ) ||
            estudiante.actividadesPendientes >=
              2,
        )
        .sort(
          (
            a,
            b,
          ) => {
            if (
              a.promedioGeneral ===
              null
            ) {
              return -1;
            }

            if (
              b.promedioGeneral ===
              null
            ) {
              return 1;
            }

            return (
              a.promedioGeneral -
              b.promedioGeneral
            );
          },
        )
        .slice(
          0,
          6,
        )
        .map(
          (
            estudiante,
          ) => ({
            id:
              estudiante.id,
            nombres:
              estudiante.nombres,
            apellidoPaterno:
              estudiante.apellidoPaterno,
            apellidoMaterno:
              estudiante.apellidoMaterno,
            correo:
              estudiante.correo,
            promedioSobre100:
              estudiante.promedioGeneral ===
              null
                ? null
                : this.redondear(
                    estudiante.promedioGeneral,
                  ),
            actividadesCalificadas:
              estudiante.actividadesCalificadas,
            actividadesPendientes:
              estudiante.actividadesPendientes,
          }),
        );

    const estadosRequierenRevision =
      new Set<EstadoActividadCalificable>([
        EstadoActividadCalificable.CALIFICANDO,
        EstadoActividadCalificable.CERRADA,
        EstadoActividadCalificable.PUBLICADA,
      ]);

    const pendientesCalificar =
      actividades
        .filter(
          (
            actividad,
          ) =>
            estadosRequierenRevision.has(
              actividad.estado,
            ),
        )
        .reduce(
          (
            acumulado,
            actividad,
          ) => {
            const calificadas =
              actividad.calificaciones.filter(
                (
                  calificacion,
                ) =>
                  estadosCalificados.has(
                    calificacion.estado,
                  ),
              ).length;

            return acumulado +
              Math.max(
                estudiantes.length -
                  calificadas,
                0,
              );
          },
          0,
        );

    const fechas = [
      ...foros.flatMap(
        (
          foro,
        ) => {
          const fecha =
            foro.fechaLimite ??
            foro.fechaCierre;

          return fecha
            ? [
                {
                  tipo:
                    'FORO' as const,
                  id:
                    foro.id,
                  titulo:
                    foro.titulo,
                  fecha,
                },
              ]
            : [];
        },
      ),
      ...tareas.flatMap(
        (
          tarea,
        ) => {
          const fecha =
            tarea.fechaLimite ??
            tarea.fechaCierre;

          return fecha
            ? [
                {
                  tipo:
                    'TAREA' as const,
                  id:
                    tarea.id,
                  titulo:
                    tarea.titulo,
                  fecha,
                },
              ]
            : [];
        },
      ),
      ...quizzes.flatMap(
        (
          quiz,
        ) =>
          quiz.cierreProgramado
            ? [
                {
                  tipo:
                    'QUIZ' as const,
                  id:
                    quiz.id,
                  titulo:
                    quiz.titulo,
                  fecha:
                    quiz.cierreProgramado,
                },
              ]
            : [],
      ),
    ]
      .filter(
        (
          item,
        ) =>
          item.fecha >=
          new Date(),
      )
      .sort(
        (
          a,
          b,
        ) =>
          a.fecha.getTime() -
          b.fecha.getTime(),
      );

    const totalCalificaciones =
      actividades.reduce(
        (
          acumulado,
          actividad,
        ) =>
          acumulado +
          actividad.calificaciones.filter(
            (
              calificacion,
            ) =>
              estadosCalificados.has(
                calificacion.estado,
              ),
          ).length,
        0,
      );

    const totalPublicadas =
      actividades.reduce(
        (
          acumulado,
          actividad,
        ) =>
          acumulado +
          actividad.calificaciones.filter(
            (
              calificacion,
            ) =>
              calificacion.estado ===
              EstadoCalificacion.PUBLICADA,
          ).length,
        0,
      );

    return {
      curso:
        hitoCurso.curso,
      hito:
        hitoCurso.hito,
      resumen: {
        estudiantesActivos:
          estudiantes.length,
        publicaciones,
        foros:
          foros.length,
        tareas:
          tareas.length,
        quizzes:
          quizzes.length,
        actividadesCalificables:
          actividades.length,
        pendientesCalificar,
        calificacionesRegistradas:
          totalCalificaciones,
        calificacionesPublicadas:
          totalPublicadas,
      },
      rendimiento: {
        continua,
        procesual,
        total: {
          aporteExacto:
            this.redondear(
              totalExacto,
            ),
          notaFinal:
            Math.round(
              totalExacto,
            ),
          maximo:
            hitoCurso.hito.puntajeContinua +
            hitoCurso.hito.puntajeProcesual,
        },
      },
      distribucion,
      actividadesRendimiento:
        rendimientoActividades,
      estudiantesSeguimiento,
      proximoVencimiento:
        fechas[0]
          ? {
              ...fechas[0],
              fecha:
                fechas[0].fecha.toISOString(),
            }
          : null,
    };
  }
}
