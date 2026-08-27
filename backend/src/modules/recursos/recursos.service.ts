import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AlcanceRecursoCurso,
  EstadoInscripcion,
  EstadoRecursoCurso,
  EstadoProcesamientoDataset,
  EstadoVersionRecurso,
  Rol,
  TipoContenidoRecurso,
  UsoRecursoCurso,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ArchivosService } from '../archivos/archivos.service';
import { DatasetProcesamientoService } from './dataset-procesamiento.service';
import type { UsuarioAutenticado } from '../archivos/interfaces/usuario-autenticado.interface';
import { ActualizarContenidoDto } from './dto/actualizar-contenido.dto';
import { ActualizarRecursoDto } from './dto/actualizar-recurso.dto';
import { CrearContenidoArchivoDto } from './dto/crear-contenido-archivo.dto';
import { CrearContenidoEnlaceDto } from './dto/crear-contenido-enlace.dto';
import { CrearRecursoDto } from './dto/crear-recurso.dto';
import { ReemplazarContenidoDto } from './dto/reemplazar-contenido.dto';

type ArchivoSubido = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class RecursosService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly archivosService:
      ArchivosService,

    private readonly datasetProcesamiento:
      DatasetProcesamientoService,
  ) {}

  private includeDetalle = {
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
      },
    },
    contenidos: {
      where: {
        estaActivo: true,
      },
      orderBy: [
        { orden: 'asc' as const },
        { creadoEn: 'asc' as const },
      ],
      include: {
        versiones: {
          orderBy: {
            numeroVersion: 'desc' as const,
          },
          include: {
            archivo: {
              select: {
                id: true,
                nombreOriginal: true,
                mimeType: true,
                extension: true,
                tamanioBytes: true,
                hashSha256: true,
                esAnalizadoIA: true,
                textoExtraido: true,
                cantidadDescargas: true,
                permiteDescarga: true,
                creadoEn: true,
              },
            },
          },
        },
      },
    },
  };

  private async validarCurso(usuario: UsuarioAutenticado, cursoId: number) {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: {
        id: true,
        docenteId: true,
        planificacionId: true,
      },
    });

    if (!curso) {
      throw new NotFoundException('El curso no existe');
    }

    if (usuario.rol === Rol.DOCENTE) {
      if (curso.docenteId !== usuario.id) {
        throw new ForbiddenException('No tienes acceso a este curso');
      }

      return curso;
    }

    if (usuario.rol === Rol.ESTUDIANTE) {
      const inscripcion = await this.prisma.inscripcionCurso.findFirst({
        where: {
          cursoId,
          estudianteId: usuario.id,
          estado: EstadoInscripcion.ACTIVA,
        },
        select: { id: true },
      });

      if (!inscripcion) {
        throw new ForbiddenException(
          'No tienes una inscripción activa en este curso',
        );
      }

      return curso;
    }

    throw new ForbiddenException(
      'Tu rol no tiene acceso a los recursos del curso',
    );
  }

  private exigirDocente(usuario: UsuarioAutenticado) {
    if (usuario.rol !== Rol.DOCENTE) {
      throw new ForbiddenException('Solo el docente puede administrar recursos');
    }
  }

  private async validarAlcance(
    curso: { planificacionId: number | null },
    alcance: AlcanceRecursoCurso,
    hitoId?: number | null,
  ) {
    if (alcance === AlcanceRecursoCurso.CURSO) {
      return null;
    }

    if (!hitoId) {
      throw new BadRequestException(
        'Debes seleccionar un hito para un recurso con alcance HITO',
      );
    }

    if (!curso.planificacionId) {
      throw new BadRequestException(
        'El curso no tiene una planificación académica asociada',
      );
    }

    const hito = await this.prisma.hitoAcademico.findFirst({
      where: {
        id: hitoId,
        planificacionId: curso.planificacionId,
      },
      select: { id: true },
    });

    if (!hito) {
      throw new BadRequestException(
        'El hito seleccionado no pertenece a la planificación de este curso',
      );
    }

    return hito.id;
  }

  private normalizarUrlExterna(valor?: string | null) {
    const url = valor?.trim();

    if (!url) {
      throw new BadRequestException('Debes ingresar el enlace del recurso');
    }

    let parsed: URL;

    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('El enlace ingresado no es una URL válida');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('El enlace debe utilizar http o https');
    }

    return parsed.toString();
  }

  private async buscarRecursoDocente(
    usuario: UsuarioAutenticado,
    cursoId: number,
    recursoId: number,
  ) {
    this.exigirDocente(usuario);
    await this.validarCurso(usuario, cursoId);

    const recurso = await this.prisma.recursoCurso.findFirst({
      where: {
        id: recursoId,
        cursoId,
        estaActivo: true,
        estado: EstadoRecursoCurso.ACTIVO,
      },
      include: this.includeDetalle,
    });

    if (!recurso) {
      throw new NotFoundException('El recurso no existe');
    }

    return recurso;
  }

  private async buscarContenidoDocente(
    usuario: UsuarioAutenticado,
    cursoId: number,
    recursoId: number,
    contenidoId: number,
  ) {
    await this.buscarRecursoDocente(usuario, cursoId, recursoId);

    const contenido = await this.prisma.recursoContenido.findFirst({
      where: {
        id: contenidoId,
        recursoId,
        estaActivo: true,
      },
      include: {
        versiones: {
          orderBy: { numeroVersion: 'desc' },
          include: { archivo: true },
        },
      },
    });

    if (!contenido) {
      throw new NotFoundException('El contenido del recurso no existe');
    }

    return contenido;
  }

  async listar(usuario: UsuarioAutenticado, cursoId: number) {
    await this.validarCurso(usuario, cursoId);

    const recursos = await this.prisma.recursoCurso.findMany({
      where: {
        cursoId,
        estaActivo: true,
        estado: EstadoRecursoCurso.ACTIVO,
        ...(usuario.rol === Rol.ESTUDIANTE
          ? {
              visibleParaEstudiantes: true,
              uso: {
                not: UsoRecursoCurso.SOLO_QUIZZES,
              },
            }
          : {}),
      },
      orderBy: [
        { alcance: 'asc' },
        { creadoEn: 'desc' },
      ],
      include: this.includeDetalle,
    });

    return { recursos };
  }

  async obtener(
    usuario: UsuarioAutenticado,
    cursoId: number,
    recursoId: number,
  ) {
    await this.validarCurso(usuario, cursoId);

    const recurso = await this.prisma.recursoCurso.findFirst({
      where: {
        id: recursoId,
        cursoId,
        estaActivo: true,
        estado: EstadoRecursoCurso.ACTIVO,
        ...(usuario.rol === Rol.ESTUDIANTE
          ? {
              visibleParaEstudiantes: true,
              uso: {
                not: UsoRecursoCurso.SOLO_QUIZZES,
              },
            }
          : {}),
      },
      include: this.includeDetalle,
    });

    if (!recurso) {
      throw new NotFoundException('El recurso no existe o no está disponible');
    }

    return { recurso };
  }

  async crear(
    usuario: UsuarioAutenticado,
    cursoId: number,
    datos: CrearRecursoDto,
  ) {
    this.exigirDocente(usuario);
    const curso = await this.validarCurso(usuario, cursoId);

    const hitoId = await this.validarAlcance(
      curso,
      datos.alcance,
      datos.hitoId,
    );

    const recurso = await this.prisma.recursoCurso.create({
      data: {
        cursoId,
        autorId: usuario.id,
        hitoId,
        titulo: datos.titulo.trim(),
        descripcion: datos.descripcion?.trim() || null,
        categoria: datos.categoria,
        alcance: datos.alcance,
        uso: datos.uso,
        visibleParaEstudiantes:
          datos.uso === UsoRecursoCurso.SOLO_QUIZZES
            ? false
            : datos.visibleParaEstudiantes,
        publicadoEn: new Date(),
      },
      include: this.includeDetalle,
    });

    return {
      mensaje: 'Recurso creado correctamente',
      recurso,
    };
  }

  async actualizar(
    usuario: UsuarioAutenticado,
    cursoId: number,
    recursoId: number,
    datos: ActualizarRecursoDto,
  ) {
    const recursoActual =
      await this.buscarRecursoDocente(
        usuario,
        cursoId,
        recursoId,
      );

    const curso =
      await this.validarCurso(
        usuario,
        cursoId,
      );

    const alcance =
      datos.alcance ??
      recursoActual.alcance;

    const hitoId =
      await this.validarAlcance(
        curso,
        alcance,
        alcance ===
        AlcanceRecursoCurso.HITO
          ? datos.hitoId ??
            recursoActual.hitoId
          : null,
      );

    const uso =
      datos.uso ??
      recursoActual.uso;

    const visibleParaEstudiantes =
      uso ===
      UsoRecursoCurso.SOLO_QUIZZES
        ? false
        : datos.visibleParaEstudiantes ??
          recursoActual.visibleParaEstudiantes;

    const recurso =
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          const contenidosArchivo =
            await tx.recursoContenido.findMany({
              where: {
                recursoId,

                estaActivo:
                  true,

                tipo:
                  TipoContenidoRecurso.ARCHIVO,
              },

              select: {
                id:
                  true,

                versiones: {
                  where: {
                    esVigente:
                      true,

                    estado:
                      EstadoVersionRecurso.VIGENTE,
                  },

                  select: {
                    id:
                      true,

                    estadoDataset:
                      true,

                    archivo: {
                      select: {
                        extension:
                          true,
                      },
                    },
                  },

                  take:
                    1,
                },
              },
            });

          const participaEnQuizzes =
            uso ===
              UsoRecursoCurso.AULA_Y_QUIZZES ||
            uso ===
              UsoRecursoCurso.SOLO_QUIZZES;

          for (
            const contenido
            of contenidosArchivo
          ) {
            const extension =
              contenido.versiones[
                0
              ]?.archivo.extension
                ?.trim()
                .toLowerCase() ??
              '';

            const disponibleParaQuiz =
              participaEnQuizzes &&
              extension ===
                'pdf';

            await tx.recursoContenido.update({
              where: {
                id:
                  contenido.id,
              },

              data: {
                disponibleParaQuiz,
              },
            });

            const versionVigente =
              contenido.versiones[
                0
              ];

            if (
              versionVigente
            ) {
              const yaListo =
                versionVigente.estadoDataset ===
                EstadoProcesamientoDataset.LISTO;

              await tx.recursoContenidoVersion.update({
                where: {
                  id:
                    versionVigente.id,
                },

                data: disponibleParaQuiz
                  ? {
                      estadoDataset:
                        yaListo
                          ? EstadoProcesamientoDataset.LISTO
                          : EstadoProcesamientoDataset.PENDIENTE,

                      progresoDataset:
                        yaListo
                          ? 100
                          : 0,

                      errorDataset:
                        yaListo
                          ? undefined
                          : null,

                      procesadoDatasetEn:
                        yaListo
                          ? undefined
                          : null,
                    }
                  : {
                      estadoDataset:
                        EstadoProcesamientoDataset.NO_APLICA,

                      progresoDataset:
                        0,

                      errorDataset:
                        null,

                      procesadoDatasetEn:
                        null,
                    },
              });
            }
          }

          return tx.recursoCurso.update({
            where: {
              id:
                recursoId,
            },

            data: {
              ...(datos.titulo !==
              undefined
                ? {
                    titulo:
                      datos.titulo.trim(),
                  }
                : {}),

              ...(datos.descripcion !==
              undefined
                ? {
                    descripcion:
                      datos.descripcion.trim() ||
                      null,
                  }
                : {}),

              ...(datos.categoria !==
              undefined
                ? {
                    categoria:
                      datos.categoria,
                  }
                : {}),

              alcance,
              hitoId,
              uso,
              visibleParaEstudiantes,
            },

            include:
              this.includeDetalle,
          });
        },
      );

    if (
      uso ===
        UsoRecursoCurso.AULA_Y_QUIZZES ||
      uso ===
        UsoRecursoCurso.SOLO_QUIZZES
    ) {
      this.datasetProcesamiento.despertar();
    }

    return {
      mensaje:
        'Recurso actualizado correctamente',

      recurso,
    };
  }

  async cambiarVisibilidad(
    usuario: UsuarioAutenticado,
    cursoId: number,
    recursoId: number,
    visibleParaEstudiantes: boolean,
  ) {
    const recursoActual =
      await this.buscarRecursoDocente(
        usuario,
        cursoId,
        recursoId,
      );

    if (
      recursoActual.uso ===
        UsoRecursoCurso.SOLO_QUIZZES &&
      visibleParaEstudiantes
    ) {
      throw new BadRequestException(
        'Un recurso de uso exclusivo para Quizzes no puede mostrarse a los estudiantes',
      );
    }

    const recurso = await this.prisma.recursoCurso.update({
      where: { id: recursoId },
      data: { visibleParaEstudiantes },
      include: this.includeDetalle,
    });

    return {
      mensaje: visibleParaEstudiantes
        ? 'El recurso ahora es visible para los estudiantes'
        : 'El recurso quedó oculto para los estudiantes',
      recurso,
    };
  }

  async archivar(
    usuario: UsuarioAutenticado,
    cursoId: number,
    recursoId: number,
  ) {
    await this.buscarRecursoDocente(usuario, cursoId, recursoId);

    await this.prisma.recursoCurso.update({
      where: { id: recursoId },
      data: {
        estado: EstadoRecursoCurso.ARCHIVADO,
        estaActivo: false,
        archivadoEn: new Date(),
      },
    });

    return { mensaje: 'Recurso archivado correctamente' };
  }

  async agregarEnlace(
    usuario: UsuarioAutenticado,
    cursoId: number,
    recursoId: number,
    datos: CrearContenidoEnlaceDto,
  ) {
    await this.buscarRecursoDocente(usuario, cursoId, recursoId);

    const contenido = await this.prisma.recursoContenido.create({
      data: {
        recursoId,
        tipo: TipoContenidoRecurso.ENLACE,
        titulo: datos.titulo.trim(),
        descripcion: datos.descripcion?.trim() || null,
        urlExterna: this.normalizarUrlExterna(datos.urlExterna),
        orden: datos.orden ?? 0,
        disponibleParaQuiz: false,
      },
    });

    return {
      mensaje: 'Enlace agregado correctamente',
      contenido,
    };
  }

  async agregarArchivo(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    recursoId:
      number,

    datos:
      CrearContenidoArchivoDto,

    archivo:
      ArchivoSubido |
      undefined,
  ) {
    const recurso =
      await this.buscarRecursoDocente(
        usuario,
        cursoId,
        recursoId,
      );

    if (
      !archivo
    ) {
      throw new BadRequestException(
        'Debes seleccionar un archivo',
      );
    }

    const extension =
      archivo.originalname
        .split(
          '.',
        )
        .pop()
        ?.trim()
        .toLowerCase() ??
      '';

    const participaEnQuizzes =
      recurso.uso ===
        UsoRecursoCurso.AULA_Y_QUIZZES ||
      recurso.uso ===
        UsoRecursoCurso.SOLO_QUIZZES;

    const disponibleParaQuiz =
      participaEnQuizzes &&
      extension ===
        'pdf';

    const contenido =
      await this.prisma.recursoContenido.create({
        data: {
          recursoId,

          tipo:
            TipoContenidoRecurso.ARCHIVO,

          titulo:
            datos.titulo?.trim() ||
            archivo.originalname,

          descripcion:
            datos.descripcion?.trim() ||
            null,

          orden:
            datos.orden ??
            0,

          disponibleParaQuiz,
        },
      });

    let archivoGuardado:
      Awaited<
        ReturnType<
          ArchivosService['subirArchivoContenidoRecurso']
        >
      > |
      null =
      null;

    try {
      archivoGuardado =
        await this.archivosService.subirArchivoContenidoRecurso(
          usuario,
          cursoId,
          contenido.id,
          1,
          archivo,
        );

      await this.prisma.recursoContenidoVersion.create({
        data: {
          contenidoId:
            contenido.id,

          archivoId:
            archivoGuardado.id,

          numeroVersion:
            1,

          estado:
            EstadoVersionRecurso.VIGENTE,

          esVigente:
            true,

          estadoDataset:
            disponibleParaQuiz
              ? EstadoProcesamientoDataset.PENDIENTE
              : EstadoProcesamientoDataset.NO_APLICA,

          progresoDataset:
            0,
        },
      });

      if (
        disponibleParaQuiz
      ) {
        this.datasetProcesamiento.despertar();
      }
    } catch (
      error
    ) {
      if (
        archivoGuardado
      ) {
        await this.archivosService.eliminarArchivoFisicoSeguro(
          archivoGuardado.id,
        );
      }

      await this.prisma.recursoContenido.delete({
        where: {
          id:
            contenido.id,
        },
      });

      throw error;
    }

    return this.obtener(
      usuario,
      cursoId,
      recursoId,
    );
  }

  async actualizarContenido(
    usuario: UsuarioAutenticado,
    cursoId: number,
    recursoId: number,
    contenidoId: number,
    datos: ActualizarContenidoDto,
  ) {
    const recurso =
      await this.buscarRecursoDocente(
        usuario,
        cursoId,
        recursoId,
      );

    const contenidoActual =
      await this.buscarContenidoDocente(
        usuario,
        cursoId,
        recursoId,
        contenidoId,
      );

    let urlExterna =
      contenidoActual.urlExterna;

    let disponibleParaQuiz =
      false;

    if (
      contenidoActual.tipo ===
      TipoContenidoRecurso.ENLACE
    ) {
      if (
        datos.urlExterna !==
        undefined
      ) {
        urlExterna =
          this.normalizarUrlExterna(
            datos.urlExterna,
          );
      }
    } else {
      const vigente =
        contenidoActual.versiones.find(
          (
            version,
          ) =>
            version.esVigente,
        );

      const esPdf =
        vigente?.archivo.extension
          .trim()
          .toLowerCase() ===
        'pdf';

      const participaEnQuizzes =
        recurso.uso ===
          UsoRecursoCurso.AULA_Y_QUIZZES ||
        recurso.uso ===
          UsoRecursoCurso.SOLO_QUIZZES;

      disponibleParaQuiz =
        Boolean(
          esPdf &&
          participaEnQuizzes,
        );
    }

    const contenido =
      await this.prisma.recursoContenido.update({
        where: {
          id:
            contenidoId,
        },

        data: {
          ...(datos.titulo !==
          undefined
            ? {
                titulo:
                  datos.titulo.trim(),
              }
            : {}),

          ...(datos.descripcion !==
          undefined
            ? {
                descripcion:
                  datos.descripcion.trim() ||
                  null,
              }
            : {}),

          ...(datos.orden !==
          undefined
            ? {
                orden:
                  datos.orden,
              }
            : {}),

          urlExterna,
          disponibleParaQuiz,
        },
      });

    return {
      mensaje:
        'Contenido actualizado correctamente',

      contenido,
    };
  }

  async eliminarContenido(
    usuario: UsuarioAutenticado,
    cursoId: number,
    recursoId: number,
    contenidoId: number,
  ) {
    await this.buscarContenidoDocente(usuario, cursoId, recursoId, contenidoId);

    await this.prisma.recursoContenido.update({
      where: { id: contenidoId },
      data: {
        estaActivo: false,
        eliminadoEn: new Date(),
        disponibleParaQuiz: false,
      },
    });

    return { mensaje: 'Contenido retirado del recurso' };
  }

  async reemplazarContenido(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    recursoId:
      number,

    contenidoId:
      number,

    datos:
      ReemplazarContenidoDto,

    archivo:
      ArchivoSubido |
      undefined,
  ) {
    const recurso =
      await this.buscarRecursoDocente(
        usuario,
        cursoId,
        recursoId,
      );

    const contenido =
      await this.buscarContenidoDocente(
        usuario,
        cursoId,
        recursoId,
        contenidoId,
      );

    if (
      contenido.tipo !==
      TipoContenidoRecurso.ARCHIVO
    ) {
      throw new BadRequestException(
        'Solo los contenidos de archivo tienen versiones',
      );
    }

    if (
      !archivo
    ) {
      throw new BadRequestException(
        'Debes seleccionar el nuevo archivo',
      );
    }

    const extension =
      archivo.originalname
        .split(
          '.',
        )
        .pop()
        ?.trim()
        .toLowerCase() ??
      '';

    const participaEnQuizzes =
      recurso.uso ===
        UsoRecursoCurso.AULA_Y_QUIZZES ||
      recurso.uso ===
        UsoRecursoCurso.SOLO_QUIZZES;

    const disponibleParaQuiz =
      participaEnQuizzes &&
      extension ===
        'pdf';

    const ultimaVersion =
      contenido.versiones.reduce(
        (
          maximo,
          version,
        ) =>
          Math.max(
            maximo,
            version.numeroVersion,
          ),
        0,
      );

    const numeroVersion =
      ultimaVersion +
      1;

    const archivoGuardado =
      await this.archivosService.subirArchivoContenidoRecurso(
        usuario,
        cursoId,
        contenidoId,
        numeroVersion,
        archivo,
      );

    try {
      await this.prisma.$transaction(
        async (
          tx,
        ) => {
          await tx.recursoContenidoVersion.updateMany({
            where: {
              contenidoId,

              esVigente:
                true,
            },

            data: {
              esVigente:
                false,

              estado:
                EstadoVersionRecurso.REEMPLAZADA,

              reemplazadaEn:
                new Date(),
            },
          });

          await tx.recursoContenidoVersion.create({
            data: {
              contenidoId,

              archivoId:
                archivoGuardado.id,

              numeroVersion,

              estado:
                EstadoVersionRecurso.VIGENTE,

              esVigente:
                true,

              motivoActualizacion:
                datos.motivoActualizacion?.trim() ||
                null,

              fechaDocumento:
                datos.fechaDocumento
                  ? new Date(
                      datos.fechaDocumento,
                    )
                  : null,

              estadoDataset:
                disponibleParaQuiz
                  ? EstadoProcesamientoDataset.PENDIENTE
                  : EstadoProcesamientoDataset.NO_APLICA,

              progresoDataset:
                0,
            },
          });

          await tx.recursoContenido.update({
            where: {
              id:
                contenidoId,
            },

            data: {
              disponibleParaQuiz,
            },
          });
        },
      );

      if (
        disponibleParaQuiz
      ) {
        this.datasetProcesamiento.despertar();
      }
    } catch (
      error
    ) {
      await this.archivosService.eliminarArchivoFisicoSeguro(
        archivoGuardado.id,
      );

      throw error;
    }

    return this.obtener(
      usuario,
      cursoId,
      recursoId,
    );
  }

  async reintentarDataset(
    usuario:
      UsuarioAutenticado,

    cursoId:
      number,

    versionId:
      number,
  ) {
    this.exigirDocente(
      usuario,
    );

    await this.validarCurso(
      usuario,
      cursoId,
    );

    const version =
      await this.prisma.recursoContenidoVersion.findFirst({
        where: {
          id:
            versionId,

          contenido: {
            recurso: {
              cursoId,

              autorId:
                usuario.id,

              estaActivo:
                true,
            },
          },
        },

        select: {
          id:
            true,
        },
      });

    if (
      !version
    ) {
      throw new NotFoundException(
        'No se encontró la versión del dataset en este curso',
      );
    }

    return this.datasetProcesamiento.reintentar(
      versionId,
    );
  }

  async listarDisponiblesParaQuiz(
    usuario: UsuarioAutenticado,
    cursoId: number,
  ) {
    this.exigirDocente(usuario);
    await this.validarCurso(usuario, cursoId);

    const recursos = await this.prisma.recursoCurso.findMany({
      where: {
        cursoId,
        estaActivo: true,
        estado: EstadoRecursoCurso.ACTIVO,
        uso: {
          in: [
            UsoRecursoCurso.AULA_Y_QUIZZES,
            UsoRecursoCurso.SOLO_QUIZZES,
          ],
        },
        contenidos: {
          some: {
            estaActivo: true,
            tipo: TipoContenidoRecurso.ARCHIVO,
            disponibleParaQuiz: true,
          },
        },
      },
      orderBy: { titulo: 'asc' },
      include: {
        hito: {
          select: {
            id: true,
            numero: true,
            codigo: true,
            nombre: true,
          },
        },
        contenidos: {
          where: {
            estaActivo: true,
            tipo: TipoContenidoRecurso.ARCHIVO,
            disponibleParaQuiz: true,
          },
          orderBy: { orden: 'asc' },
          include: {
            versiones: {
              where: {
                esVigente:
                  true,

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
                archivo:
                  true,
              },
            },
          },
        },
      },
    });

    return { recursos };
  }
}