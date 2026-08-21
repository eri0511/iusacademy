import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  createHash,
} from 'node:crypto';

import {
  extname,
} from 'node:path';

import {
  CapacidadTarea,
  CategoriaArchivoAdjunto,
  EstadoEntregaTarea,
  EstadoInscripcion,
  ModalidadTarea,
  OrigenGrupoTarea,
  Rol,
  TipoContenidoRecurso,
} from '../../generated/prisma/client';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ActualizarArchivoDto,
} from './dto/actualizar-archivo.dto';

import {
  AlmacenamientoArchivos,
} from './almacenamiento/almacenamiento.interface';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

type ArchivoSubido = {
  originalname:
    string;

  mimetype:
    string;

  size:
    number;

  buffer:
    Buffer;
};

@Injectable()
export class ArchivosService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly almacenamiento:
      AlmacenamientoArchivos,
  ) {}

  private obtenerExtension(
    nombre:
      string,
  ) {
    return extname(
      nombre,
    )
      .replace(
        '.',
        '',
      )
      .trim()
      .toLowerCase();
  }

  private calcularHash(
    buffer:
      Buffer,
  ) {
    return createHash(
      'sha256',
    )
      .update(
        buffer,
      )
      .digest(
        'hex',
      );
  }

  private validarArchivoGeneral(
    archivo:
      ArchivoSubido | undefined,
  ) {
    if (!archivo) {
      throw new BadRequestException(
        'Debes seleccionar un archivo',
      );
    }

    if (
      !archivo.buffer ||
      archivo.size <=
        0
    ) {
      throw new BadRequestException(
        'El archivo está vacío',
      );
    }

    const extension =
      this.obtenerExtension(
        archivo.originalname,
      );

    const permitidas =
      [
        'pdf',
        'doc',
        'docx',
        'ppt',
        'pptx',
        'xls',
        'xlsx',
        'txt',
        'jpg',
        'jpeg',
        'png',
        'webp',
      ];

    if (
      !permitidas.includes(
        extension,
      )
    ) {
      throw new BadRequestException(
        'Formato no permitido. Usa un documento, presentación, hoja de cálculo, texto o imagen compatible',
      );
    }

    return extension;
  }

  private async validarAccesoCurso(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
  ) {
    const curso =
      await this.prisma.curso.findUnique({
        where: {
          id:
            cursoId,
        },

        select: {
          id:
            true,
          docenteId:
            true,
        },
      });

    if (!curso) {
      throw new NotFoundException(
        'El curso no existe',
      );
    }

    if (
      usuario.rol ===
      Rol.DOCENTE
    ) {
      if (
        curso.docenteId !==
        usuario.id
      ) {
        throw new ForbiddenException(
          'No tienes acceso a este curso',
        );
      }

      return;
    }

    if (
      usuario.rol ===
      Rol.ESTUDIANTE
    ) {
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

      if (!inscripcion) {
        throw new ForbiddenException(
          'No tienes una inscripción activa en este curso',
        );
      }

      return;
    }

    throw new ForbiddenException(
      'Tu rol no tiene acceso a los archivos del curso',
    );
  }

  private validarConfiguracionArchivo(
    archivo:
      ArchivoSubido,
    extension:
      string,
    configuracion: {
      extensionesPermitidas:
        string[];

      tamanioMaximoArchivoMb:
        number;

      maximoPermitido:
        number;

      totalActual:
        number;

      habilitado:
        boolean;
    },
  ) {
    if (
      !configuracion.habilitado
    ) {
      throw new BadRequestException(
        'La carga de archivos está deshabilitada para esta sección',
      );
    }

    const extensiones =
      configuracion.extensionesPermitidas.map(
        (
          item,
        ) =>
          item
            .trim()
            .toLowerCase()
            .replace(
              /^\./,
              '',
            ),
      );

    /*
     * JPG y JPEG representan el mismo formato de imagen.
     * El formulario del foro puede guardar "jpg" mientras el navegador
     * entrega un archivo cuyo nombre termina en ".jpeg" (o viceversa).
     * Ambos deben considerarse equivalentes para no rechazar una imagen
     * válida con 400 Bad Request.
     */
    const extensionPermitida =
      extensiones.includes(
        extension,
      ) ||
      (extension ===
        'jpeg' &&
        extensiones.includes(
          'jpg',
        )) ||
      (extension ===
        'jpg' &&
        extensiones.includes(
          'jpeg',
        ));

    if (
      !extensionPermitida
    ) {
      throw new BadRequestException(
        `El formato .${extension} no está permitido en esta actividad`,
      );
    }

    const limiteBytes =
      configuracion.tamanioMaximoArchivoMb *
      1024 *
      1024;

    if (
      archivo.size >
      limiteBytes
    ) {
      throw new BadRequestException(
        `El archivo supera el límite de ${configuracion.tamanioMaximoArchivoMb} MB`,
      );
    }

    if (
      configuracion.totalActual >=
      configuracion.maximoPermitido
    ) {
      throw new BadRequestException(
        `Se alcanzó el máximo de ${configuracion.maximoPermitido} archivos`,
      );
    }
  }

  private async evitarDuplicado(
    hash:
      string,
    filtros: {
      temaForoId?:
        number;

      respuestaForoId?:
        number;

      comentarioForoId?:
        number;

      entregaTareaId?:
        number;
    },
  ) {
    const duplicado =
      await this.prisma.archivoAdjunto.findFirst({
        where: {
          hashSha256:
            hash,
          estaActivo:
            true,
          ...filtros,
        },

        select: {
          id:
            true,
        },
      });

    if (duplicado) {
      throw new BadRequestException(
        'Este archivo ya fue adjuntado anteriormente',
      );
    }
  }

  async subirArchivoTema(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    foroId:
      number,
    archivo:
      ArchivoSubido | undefined,
  ) {
    await this.validarAccesoCurso(
      usuario,
      cursoId,
    );

    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Solo el docente puede adjuntar archivos al tema principal',
      );
    }

    const extension =
      this.validarArchivoGeneral(
        archivo,
      );

    const foro =
      await this.prisma.temaForoCurso.findFirst({
        where: {
          id:
            foroId,
          cursoId,
          estaActivo:
            true,
        },

        include: {
          _count: {
            select: {
              archivos:
                true,
            },
          },
        },
      });

    if (!foro) {
      throw new NotFoundException(
        'El foro no existe',
      );
    }

    this.validarConfiguracionArchivo(
      archivo!,
      extension,
      {
        extensionesPermitidas:
          foro.extensionesPermitidas,
        tamanioMaximoArchivoMb:
          foro.tamanioMaximoArchivoMb,
        maximoPermitido:
          foro.maximoArchivosTema,
        totalActual:
          foro._count.archivos,
        habilitado:
          foro.permitirAdjuntosTema,
      },
    );

    const hash =
      this.calcularHash(
        archivo!.buffer,
      );

    await this.evitarDuplicado(
      hash,
      {
        temaForoId:
          foro.id,
      },
    );

    const guardado =
      await this.almacenamiento.guardar({
        buffer:
          archivo!.buffer,
        nombreOriginal:
          archivo!.originalname,
        extension,
        carpeta:
          `foro/temas/${foro.id}`,
      });

    try {
      const registro =
        await this.prisma.archivoAdjunto.create({
          data: {
            cursoId,
            subidoPorId:
              usuario.id,
            temaForoId:
              foro.id,
            categoria:
              CategoriaArchivoAdjunto.FORO_TEMA,
            nombreOriginal:
              archivo!.originalname,
            nombreAlmacenado:
              guardado.nombreAlmacenado,
            ruta:
              guardado.rutaRelativa,
            urlPublica:
              guardado.urlPublica,
            mimeType:
              archivo!.mimetype,
            extension,
            tamanioBytes:
              archivo!.size,
            hashSha256:
              hash,
            permiteDescarga:
              foro.permitirDescargaAdjuntos,
          },
        });

      return {
        mensaje:
          'Archivo del tema subido correctamente',
        archivo:
          registro,
      };
    } catch (
      error
    ) {
      await this.almacenamiento.eliminar(
        guardado.rutaRelativa,
      );

      throw error;
    }
  }

  async subirArchivoRespuesta(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    respuestaId:
      number,
    archivo:
      ArchivoSubido | undefined,
  ) {
    await this.validarAccesoCurso(
      usuario,
      cursoId,
    );

    const extension =
      this.validarArchivoGeneral(
        archivo,
      );

    const respuesta =
      await this.prisma.respuestaForoCurso.findFirst({
        where: {
          id:
            respuestaId,
          estaActiva:
            true,
          tema: {
            cursoId,
            estaActivo:
              true,
          },
        },

        include: {
          tema:
            true,
          grupoCurso: {
            include: {
              integrantes: {
                where: {
                  estudianteId:
                    usuario.id,
                  estaActivo:
                    true,
                },
              },
            },
          },
          equipoAfinidad: {
            include: {
              integrantes: {
                where: {
                  estudianteId:
                    usuario.id,
                  estaActivo:
                    true,
                },
              },
            },
          },
          _count: {
            select: {
              archivos:
                true,
            },
          },
        },
      });

    if (!respuesta) {
      throw new NotFoundException(
        'La respuesta no existe',
      );
    }

    const puedeAdjuntar =
      usuario.rol ===
        Rol.DOCENTE ||
      respuesta.autorId ===
        usuario.id ||
      Boolean(
        respuesta.grupoCurso?.integrantes.length,
      ) ||
      Boolean(
        respuesta.equipoAfinidad?.integrantes.length,
      );

    if (!puedeAdjuntar) {
      throw new ForbiddenException(
        'No puedes adjuntar archivos a esta respuesta',
      );
    }

    if (
      respuesta.tema.estaCerrado
    ) {
      throw new BadRequestException(
        'El foro está cerrado',
      );
    }

    this.validarConfiguracionArchivo(
      archivo!,
      extension,
      {
        extensionesPermitidas:
          respuesta.tema.extensionesPermitidas,
        tamanioMaximoArchivoMb:
          respuesta.tema.tamanioMaximoArchivoMb,
        maximoPermitido:
          respuesta.tema.maximoArchivosRespuesta,
        totalActual:
          respuesta._count.archivos,
        habilitado:
          respuesta.tema.permitirAdjuntosRespuesta,
      },
    );

    const hash =
      this.calcularHash(
        archivo!.buffer,
      );

    await this.evitarDuplicado(
      hash,
      {
        respuestaForoId:
          respuesta.id,
      },
    );

    const guardado =
      await this.almacenamiento.guardar({
        buffer:
          archivo!.buffer,
        nombreOriginal:
          archivo!.originalname,
        extension,
        carpeta:
          `foro/respuestas/${respuesta.id}`,
      });

    try {
      const registro =
        await this.prisma.archivoAdjunto.create({
          data: {
            cursoId,
            subidoPorId:
              usuario.id,
            respuestaForoId:
              respuesta.id,
            categoria:
              CategoriaArchivoAdjunto.FORO_RESPUESTA,
            nombreOriginal:
              archivo!.originalname,
            nombreAlmacenado:
              guardado.nombreAlmacenado,
            ruta:
              guardado.rutaRelativa,
            urlPublica:
              guardado.urlPublica,
            mimeType:
              archivo!.mimetype,
            extension,
            tamanioBytes:
              archivo!.size,
            hashSha256:
              hash,
            permiteDescarga:
              respuesta.tema.permitirDescargaAdjuntos,
          },
        });

      return {
        mensaje:
          'Archivo de la respuesta subido correctamente',
        archivo:
          registro,
      };
    } catch (
      error
    ) {
      await this.almacenamiento.eliminar(
        guardado.rutaRelativa,
      );

      throw error;
    }
  }

  private obtenerResponsableEntregaTarea(
    configuracion:
      unknown,
  ) {
    if (
      configuracion &&
      typeof configuracion ===
        'object' &&
      !Array.isArray(
        configuracion,
      ) &&
      (
        configuracion as Record<
          string,
          unknown
        >
      ).responsableEntregaGrupo ===
        'CUALQUIER_INTEGRANTE'
    ) {
      return 'CUALQUIER_INTEGRANTE';
    }

    return 'SOLO_REPRESENTANTE';
  }

  private async validarPuedeConsultarEntregaTarea(
    usuario:
      UsuarioAutenticado,
    entregaId:
      number,
    cursoId:
      number,
  ) {
    const entrega =
      await this.prisma.entregaTarea.findFirst({
        where: {
          id:
            entregaId,
          estaActiva:
            true,
          tarea: {
            cursoId,
            estaActiva:
              true,
          },
        },

        include: {
          tarea: {
            select: {
              curso: {
                select: {
                  docenteId:
                    true,
                },
              },
            },
          },

          grupoCurso: {
            include: {
              integrantes: {
                where: {
                  estudianteId:
                    usuario.id,
                  estaActivo:
                    true,
                },
              },
            },
          },

          equipoAfinidadTarea: {
            include: {
              integrantes: {
                where: {
                  estudianteId:
                    usuario.id,
                  estaActivo:
                    true,
                },
              },
            },
          },
        },
      });

    if (!entrega) {
      throw new NotFoundException(
        'La entrega no existe',
      );
    }

    if (
      usuario.rol ===
        Rol.DOCENTE &&
      entrega.tarea.curso.docenteId ===
        usuario.id
    ) {
      return;
    }

    if (
      usuario.rol !==
      Rol.ESTUDIANTE
    ) {
      throw new ForbiddenException(
        'No puedes consultar este archivo de entrega',
      );
    }

    const pertenece =
      entrega.estudianteId ===
        usuario.id ||
      Boolean(
        entrega.grupoCurso?.integrantes.length,
      ) ||
      Boolean(
        entrega.equipoAfinidadTarea?.integrantes.length,
      );

    if (!pertenece) {
      throw new ForbiddenException(
        'No puedes consultar archivos de otra entrega',
      );
    }
  }

  private async validarPuedeModificarEntregaTarea(
    usuario:
      UsuarioAutenticado,
    entregaId:
      number,
    cursoId:
      number,
  ) {
    const entrega =
      await this.prisma.entregaTarea.findFirst({
        where: {
          id:
            entregaId,
          estaActiva:
            true,
          tarea: {
            cursoId,
            estaActiva:
              true,
          },
        },

        include: {
          tarea:
            true,

          grupoCurso: {
            include: {
              integrantes: {
                where: {
                  estudianteId:
                    usuario.id,
                  estaActivo:
                    true,
                },
              },
            },
          },

          equipoAfinidadTarea: {
            include: {
              integrantes: {
                where: {
                  estudianteId:
                    usuario.id,
                  estaActivo:
                    true,
                },
              },
            },
          },

          _count: {
            select: {
              archivos:
                true,
            },
          },
        },
      });

    if (!entrega) {
      throw new NotFoundException(
        'La entrega no existe',
      );
    }

    if (
      usuario.rol !==
      Rol.ESTUDIANTE
    ) {
      throw new ForbiddenException(
        'Solo el estudiante puede adjuntar archivos a una entrega',
      );
    }

    const tarea =
      entrega.tarea;

    const responsable =
      this.obtenerResponsableEntregaTarea(
        tarea.configuracionTipo,
      );

    let puedeModificar =
      false;

    if (
      tarea.modalidad ===
      ModalidadTarea.INDIVIDUAL
    ) {
      puedeModificar =
        entrega.estudianteId ===
        usuario.id;
    } else if (
      tarea.origenGrupo ===
      OrigenGrupoTarea.PLATAFORMA
    ) {
      const integrante =
        entrega.grupoCurso?.integrantes[0];

      puedeModificar =
        Boolean(
          integrante,
        ) &&
        (
          responsable ===
            'CUALQUIER_INTEGRANTE' ||
          Boolean(
            integrante?.esRepresentante,
          )
        );
    } else if (
      tarea.origenGrupo ===
      OrigenGrupoTarea.AFINIDAD
    ) {
      const integrante =
        entrega.equipoAfinidadTarea?.integrantes[0];

      puedeModificar =
        Boolean(
          integrante,
        ) &&
        (
          responsable ===
            'CUALQUIER_INTEGRANTE' ||
          Boolean(
            integrante?.esRepresentante,
          )
        );
    }

    if (!puedeModificar) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta entrega',
      );
    }

    if (
      entrega.estado ===
        EstadoEntregaTarea.BLOQUEADA ||
      entrega.estado ===
        EstadoEntregaTarea.ANULADA
    ) {
      throw new BadRequestException(
        'La entrega ya no puede modificarse',
      );
    }

    if (
      entrega.enviadaEn &&
      !tarea.permitirEditarEntrega
    ) {
      throw new BadRequestException(
        'La tarea no permite reemplazar una entrega ya enviada',
      );
    }

    const ahora =
      new Date();

    if (
      ahora <
      tarea.fechaApertura
    ) {
      throw new BadRequestException(
        'La tarea todavía no está abierta',
      );
    }

    const cierreEfectivo =
      tarea.permitirRetrasos
        ? tarea.fechaMaximaRetraso ??
          tarea.fechaCierre
        : tarea.fechaLimite;

    if (
      ahora >
      cierreEfectivo
    ) {
      throw new BadRequestException(
        'El período de entrega terminó',
      );
    }

    if (
      !tarea.capacidades.includes(
        CapacidadTarea.ARCHIVOS,
      )
    ) {
      throw new BadRequestException(
        'Esta tarea no admite archivos',
      );
    }

    return entrega;
  }

  async subirArchivoEntregaTarea(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    entregaId:
      number,
    archivo:
      ArchivoSubido | undefined,
  ) {
    await this.validarAccesoCurso(
      usuario,
      cursoId,
    );

    const extension =
      this.validarArchivoGeneral(
        archivo,
      );

    const entrega =
      await this.validarPuedeModificarEntregaTarea(
        usuario,
        entregaId,
        cursoId,
      );

    this.validarConfiguracionArchivo(
      archivo!,
      extension,
      {
        extensionesPermitidas:
          entrega.tarea.extensionesPermitidas,
        tamanioMaximoArchivoMb:
          entrega.tarea.tamanioMaximoArchivoMb,
        maximoPermitido:
          entrega.tarea.maximoArchivos,
        totalActual:
          entrega._count.archivos,
        habilitado:
          entrega.tarea.capacidades.includes(
            CapacidadTarea.ARCHIVOS,
          ),
      },
    );

    const hash =
      this.calcularHash(
        archivo!.buffer,
      );

    await this.evitarDuplicado(
      hash,
      {
        entregaTareaId:
          entrega.id,
      },
    );

    const guardado =
      await this.almacenamiento.guardar({
        buffer:
          archivo!.buffer,
        nombreOriginal:
          archivo!.originalname,
        extension,
        carpeta:
          `tareas/entregas/${entrega.id}`,
      });

    try {
      const registro =
        await this.prisma.archivoAdjunto.create({
          data: {
            cursoId,
            subidoPorId:
              usuario.id,
            entregaTareaId:
              entrega.id,
            categoria:
              CategoriaArchivoAdjunto.TAREA_ENTREGA,
            nombreOriginal:
              archivo!.originalname,
            nombreAlmacenado:
              guardado.nombreAlmacenado,
            ruta:
              guardado.rutaRelativa,
            urlPublica:
              guardado.urlPublica,
            mimeType:
              archivo!.mimetype,
            extension,
            tamanioBytes:
              archivo!.size,
            hashSha256:
              hash,
            permiteDescarga:
              true,
          },
        });

      return {
        mensaje:
          'Archivo de la entrega subido correctamente',
        archivo:
          registro,
      };
    } catch (
      error
    ) {
      await this.almacenamiento.eliminar(
        guardado.rutaRelativa,
      );

      throw error;
    }
  }

  async subirArchivoComentario(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    comentarioId:
      number,
    archivo:
      ArchivoSubido | undefined,
  ) {
    await this.validarAccesoCurso(
      usuario,
      cursoId,
    );

    const extension =
      this.validarArchivoGeneral(
        archivo,
      );

    const comentario =
      await this.prisma.comentarioRespuestaForo.findFirst({
        where: {
          id:
            comentarioId,
          estaActivo:
            true,
          respuesta: {
            tema: {
              cursoId,
              estaActivo:
                true,
            },
          },
        },

        include: {
          respuesta: {
            include: {
              tema:
                true,
            },
          },
          _count: {
            select: {
              archivos:
                true,
            },
          },
        },
      });

    if (!comentario) {
      throw new NotFoundException(
        'El comentario no existe',
      );
    }

    if (
      comentario.autorId !==
        usuario.id &&
      usuario.rol !==
        Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'No puedes adjuntar archivos a este comentario',
      );
    }

    if (
      comentario.respuesta.tema.estaCerrado
    ) {
      throw new BadRequestException(
        'El foro está cerrado',
      );
    }

    this.validarConfiguracionArchivo(
      archivo!,
      extension,
      {
        extensionesPermitidas:
          comentario.respuesta.tema.extensionesPermitidas,
        tamanioMaximoArchivoMb:
          comentario.respuesta.tema.tamanioMaximoArchivoMb,
        maximoPermitido:
          comentario.respuesta.tema.maximoArchivosComentario,
        totalActual:
          comentario._count.archivos,
        habilitado:
          comentario.respuesta.tema.permitirAdjuntosComentario,
      },
    );

    const hash =
      this.calcularHash(
        archivo!.buffer,
      );

    await this.evitarDuplicado(
      hash,
      {
        comentarioForoId:
          comentario.id,
      },
    );

    const guardado =
      await this.almacenamiento.guardar({
        buffer:
          archivo!.buffer,
        nombreOriginal:
          archivo!.originalname,
        extension,
        carpeta:
          `foro/comentarios/${comentario.id}`,
      });

    try {
      const registro =
        await this.prisma.archivoAdjunto.create({
          data: {
            cursoId,
            subidoPorId:
              usuario.id,
            comentarioForoId:
              comentario.id,
            categoria:
              CategoriaArchivoAdjunto.FORO_COMENTARIO,
            nombreOriginal:
              archivo!.originalname,
            nombreAlmacenado:
              guardado.nombreAlmacenado,
            ruta:
              guardado.rutaRelativa,
            urlPublica:
              guardado.urlPublica,
            mimeType:
              archivo!.mimetype,
            extension,
            tamanioBytes:
              archivo!.size,
            hashSha256:
              hash,
            permiteDescarga:
              comentario.respuesta.tema.permitirDescargaAdjuntos,
          },
        });

      return {
        mensaje:
          'Archivo del comentario subido correctamente',
        archivo:
          registro,
      };
    } catch (
      error
    ) {
      await this.almacenamiento.eliminar(
        guardado.rutaRelativa,
      );

      throw error;
    }
  }

  async subirArchivoContenidoRecurso(
    usuario:
      UsuarioAutenticado,
    cursoId:
      number,
    contenidoId:
      number,
    numeroVersion:
      number,
    archivo:
      ArchivoSubido | undefined,
  ) {
    await this.validarAccesoCurso(
      usuario,
      cursoId,
    );

    if (
      usuario.rol !==
      Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'Solo el docente puede subir archivos de recursos',
      );
    }

    const extension =
      this.validarArchivoGeneral(
        archivo,
      );

    const contenido =
      await this.prisma.recursoContenido.findFirst({
        where: {
          id:
            contenidoId,
          estaActivo:
            true,
          recurso: {
            cursoId,
            estaActivo:
              true,
          },
        },
        select: {
          id:
            true,
          tipo:
            true,
          disponibleParaQuiz:
            true,
          recursoId:
            true,
        },
      });

    if (!contenido) {
      throw new NotFoundException(
        'El contenido del recurso no existe',
      );
    }

    if (
      contenido.tipo !==
      TipoContenidoRecurso.ARCHIVO
    ) {
      throw new BadRequestException(
        'Los contenidos de tipo ENLACE no admiten archivos versionados',
      );
    }

    if (
      contenido.disponibleParaQuiz &&
      extension !== 'pdf'
    ) {
      throw new BadRequestException(
        'Los archivos disponibles para Quizzes deben ser PDF',
      );
    }

    const hash =
      this.calcularHash(
        archivo!.buffer,
      );

    const versionDuplicada =
      await this.prisma.recursoContenidoVersion.findFirst({
        where: {
          contenidoId:
            contenido.id,
          archivo: {
            hashSha256:
              hash,
            estaActivo:
              true,
          },
        },
        select: {
          id:
            true,
        },
      });

    if (versionDuplicada) {
      throw new BadRequestException(
        'Este archivo ya fue utilizado en una versión anterior de este contenido',
      );
    }

    const guardado =
      await this.almacenamiento.guardar({
        buffer:
          archivo!.buffer,
        nombreOriginal:
          archivo!.originalname,
        extension,
        carpeta:
          `recursos/${contenido.recursoId}/contenido-${contenido.id}/version-${numeroVersion}`,
      });

    try {
      return await this.prisma.archivoAdjunto.create({
        data: {
          cursoId,
          subidoPorId:
            usuario.id,
          categoria:
            CategoriaArchivoAdjunto.RECURSO,
          nombreOriginal:
            archivo!.originalname,
          nombreAlmacenado:
            guardado.nombreAlmacenado,
          ruta:
            guardado.rutaRelativa,
          urlPublica:
            guardado.urlPublica,
          mimeType:
            archivo!.mimetype,
          extension,
          tamanioBytes:
            archivo!.size,
          hashSha256:
            hash,
          numeroVersion,
          permiteDescarga:
            true,
        },
      });
    } catch (
      error
    ) {
      await this.almacenamiento.eliminar(
        guardado.rutaRelativa,
      );

      throw error;
    }
  }

  /**
   * Se utiliza únicamente para revertir una carga de recurso cuando
   * falla la creación de su registro de versión.
   */
  async eliminarArchivoFisicoSeguro(
    archivoId:
      number,
  ) {
    const archivo =
      await this.prisma.archivoAdjunto.findUnique({
        where: {
          id:
            archivoId,
        },
        select: {
          id:
            true,
          ruta:
            true,
          versionContenidoRecurso: {
            select: {
              id:
                true,
            },
          },
        },
      });

    if (
      !archivo ||
      archivo.versionContenidoRecurso
    ) {
      return;
    }

    await this.almacenamiento.eliminar(
      archivo.ruta,
    );

    await this.prisma.archivoAdjunto.delete({
      where: {
        id:
          archivo.id,
      },
    });
  }

  async actualizar(
    usuario:
      UsuarioAutenticado,
    archivoId:
      number,
    datos:
      ActualizarArchivoDto,
  ) {
    const archivo =
      await this.prisma.archivoAdjunto.findFirst({
        where: {
          id:
            archivoId,
          estaActivo:
            true,
        },
      });

    if (!archivo) {
      throw new NotFoundException(
        'El archivo no existe',
      );
    }

    if (archivo.cursoId) {
      await this.validarAccesoCurso(
        usuario,
        archivo.cursoId,
      );
    }

    if (
      archivo.entregaTareaId
    ) {
      if (
        !archivo.cursoId
      ) {
        throw new BadRequestException(
          'El archivo de la entrega no tiene curso asociado',
        );
      }

      await this.validarPuedeModificarEntregaTarea(
        usuario,
        archivo.entregaTareaId,
        archivo.cursoId,
      );
    } else if (
      archivo.subidoPorId !==
        usuario.id &&
      usuario.rol !==
        Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'No puedes modificar este archivo',
      );
    }

    const actualizado =
      await this.prisma.archivoAdjunto.update({
        where: {
          id:
            archivo.id,
        },

        data: {
          ...(datos.descripcion !==
          undefined
            ? {
                descripcion:
                  datos.descripcion.trim() ||
                  null,
              }
            : {}),
          ...(datos.permiteDescarga !==
          undefined
            ? {
                permiteDescarga:
                  datos.permiteDescarga,
              }
            : {}),
        },
      });

    return {
      mensaje:
        'Archivo actualizado correctamente',
      archivo:
        actualizado,
    };
  }

  async eliminar(
    usuario:
      UsuarioAutenticado,
    archivoId:
      number,
  ) {
    const archivo =
      await this.prisma.archivoAdjunto.findFirst({
        where: {
          id:
            archivoId,
          estaActivo:
            true,
        },
      });

    if (!archivo) {
      throw new NotFoundException(
        'El archivo no existe',
      );
    }

    if (archivo.cursoId) {
      await this.validarAccesoCurso(
        usuario,
        archivo.cursoId,
      );
    }

    if (
      archivo.entregaTareaId
    ) {
      if (
        !archivo.cursoId
      ) {
        throw new BadRequestException(
          'El archivo de la entrega no tiene curso asociado',
        );
      }

      await this.validarPuedeModificarEntregaTarea(
        usuario,
        archivo.entregaTareaId,
        archivo.cursoId,
      );
    } else if (
      archivo.subidoPorId !==
        usuario.id &&
      usuario.rol !==
        Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'No puedes eliminar este archivo',
      );
    }

    await this.prisma.archivoAdjunto.update({
      where: {
        id:
          archivo.id,
      },

      data: {
        estaActivo:
          false,
        eliminadoEn:
          new Date(),
      },
    });

    await this.almacenamiento.eliminar(
      archivo.ruta,
    );

    return {
      mensaje:
        'Archivo eliminado correctamente',
    };
  }

  async obtenerPorId(
    usuario:
      UsuarioAutenticado,
    archivoId:
      number,
  ) {
    const archivo =
      await this.prisma.archivoAdjunto.findFirst({
        where: {
          id:
            archivoId,
          estaActivo:
            true,
        },
      });

    if (!archivo) {
      throw new NotFoundException(
        'El archivo no existe',
      );
    }

    if (
      archivo.cursoId
    ) {
      await this.validarAccesoCurso(
        usuario,
        archivo.cursoId,
      );
    }

    if (
      archivo.entregaTareaId
    ) {
      if (
        !archivo.cursoId
      ) {
        throw new BadRequestException(
          'El archivo de la entrega no tiene curso asociado',
        );
      }

      await this.validarPuedeConsultarEntregaTarea(
        usuario,
        archivo.entregaTareaId,
        archivo.cursoId,
      );
    }

    if (
      !archivo.permiteDescarga &&
      archivo.subidoPorId !==
        usuario.id &&
      usuario.rol !==
        Rol.DOCENTE
    ) {
      throw new ForbiddenException(
        'La descarga de este archivo está deshabilitada',
      );
    }

    return archivo;
  }

  async descargar(
    usuario:
      UsuarioAutenticado,
    archivoId:
      number,
  ) {
    const archivo =
      await this.obtenerPorId(
        usuario,
        archivoId,
      );

    const buffer =
      await this.almacenamiento.leer(
        archivo.ruta,
      );

    await this.prisma.archivoAdjunto.update({
      where: {
        id:
          archivo.id,
      },
      data: {
        cantidadDescargas: {
          increment:
            1,
        },
      },
    });

    return {
      buffer,
      nombreOriginal:
        archivo.nombreOriginal,
      mimeType:
        archivo.mimeType,
    };
  }
}
