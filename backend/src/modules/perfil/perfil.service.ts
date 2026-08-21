import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import * as argon2 from 'argon2';

import {
  randomUUID,
} from 'node:crypto';

import {
  mkdir,
  unlink,
  writeFile,
} from 'node:fs/promises';

import {
  basename,
  join,
} from 'node:path';

import {
  PrismaService,
} from '../../prisma/prisma.service';

import {
  ActualizarPerfilDto,
} from './dto/actualizar-perfil.dto';

import {
  CambiarPasswordPerfilDto,
} from './dto/cambiar-password-perfil.dto';

import type {
  ArchivoPerfil,
} from './types/archivo-perfil.type';

@Injectable()
export class PerfilService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  private readonly seleccionPerfil = {
    id: true,
    nombres: true,
    apellidoPaterno: true,
    apellidoMaterno: true,
    correo: true,
    fotoPerfilUrl: true,
    rol: true,
    estaActivo: true,
    cuentaActivada: true,
    accesoEnviadoEn: true,
    passwordCambiadaEn: true,
    creadoEn: true,
    actualizadoEn: true,
  };

  private obtenerDirectorioPerfiles():
    string {
    return join(
      process.cwd(),
      'uploads',
      'perfiles',
    );
  }

  private obtenerExtension(
    tipoMime: string,
  ): string {
    const extensiones:
      Record<string, string> = {
        'image/jpeg':
          'jpg',

        'image/png':
          'png',

        'image/webp':
          'webp',
      };

    const extension =
      extensiones[
        tipoMime
      ];

    if (!extension) {
      throw new BadRequestException(
        'La fotografía debe ser JPG, JPEG, PNG o WEBP',
      );
    }

    return extension;
  }

  private async eliminarArchivoAnterior(
    fotoPerfilUrl:
      string | null,
  ): Promise<void> {
    if (!fotoPerfilUrl) {
      return;
    }

    /*
     * basename evita que una ruta guardada
     * pueda salir del directorio de perfiles.
     */
    const nombreArchivo =
      basename(
        fotoPerfilUrl,
      );

    const rutaArchivo =
      join(
        this.obtenerDirectorioPerfiles(),
        nombreArchivo,
      );

    try {
      await unlink(
        rutaArchivo,
      );
    } catch (
      error
    ) {
      const errorArchivo =
        error as NodeJS.ErrnoException;

      /*
       * Si el archivo ya no existe,
       * no interrumpimos la operación.
       */
      if (
        errorArchivo.code !==
        'ENOENT'
      ) {
        console.error(
          'No fue posible eliminar la fotografía anterior:',
          error,
        );
      }
    }
  }

  private async verificarUsuario(
    usuarioId: number,
  ) {
    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id:
            usuarioId,
        },

        select: {
          id: true,
          estaActivo: true,
          passwordHash: true,
          fotoPerfilUrl: true,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'El usuario no existe',
      );
    }

    if (!usuario.estaActivo) {
      throw new UnauthorizedException(
        'La cuenta se encuentra desactivada',
      );
    }

    return usuario;
  }

  async obtenerPerfil(
    usuarioId: number,
  ) {
    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id:
            usuarioId,
        },

        select:
          this.seleccionPerfil,
      });

    if (!usuario) {
      throw new NotFoundException(
        'El usuario no existe',
      );
    }

    if (!usuario.estaActivo) {
      throw new UnauthorizedException(
        'La cuenta se encuentra desactivada',
      );
    }

    return usuario;
  }

  async actualizarPerfil(
    usuarioId: number,
    datos:
      ActualizarPerfilDto,
  ) {
    await this.verificarUsuario(
      usuarioId,
    );

    const nombres =
      datos.nombres
        ?.trim();

    const apellidoPaterno =
      datos.apellidoPaterno
        ?.trim();

    const apellidoMaterno =
      datos.apellidoMaterno
        ?.trim();

    if (
      nombres !==
        undefined &&
      nombres.length <
        2
    ) {
      throw new BadRequestException(
        'Los nombres deben tener al menos 2 caracteres',
      );
    }

    if (
      apellidoPaterno !==
        undefined &&
      apellidoPaterno.length <
        2
    ) {
      throw new BadRequestException(
        'El apellido paterno debe tener al menos 2 caracteres',
      );
    }

    const perfil =
      await this.prisma.usuario.update({
        where: {
          id:
            usuarioId,
        },

        data: {
          ...(nombres !==
          undefined
            ? {
                nombres,
              }
            : {}),

          ...(apellidoPaterno !==
          undefined
            ? {
                apellidoPaterno,
              }
            : {}),

          ...(datos.apellidoMaterno !==
          undefined
            ? {
                apellidoMaterno:
                  apellidoMaterno ||
                  null,
              }
            : {}),
        },

        select:
          this.seleccionPerfil,
      });

    return {
      mensaje:
        'Perfil actualizado correctamente',

      perfil,
    };
  }

  async cambiarPassword(
    usuarioId: number,
    datos:
      CambiarPasswordPerfilDto,
  ) {
    const usuario =
      await this.verificarUsuario(
        usuarioId,
      );

    if (!usuario.passwordHash) {
      throw new BadRequestException(
        'La cuenta todavía no tiene una contraseña configurada',
      );
    }

    if (
      datos.nuevaPassword !==
      datos.confirmarPassword
    ) {
      throw new BadRequestException(
        'La nueva contraseña y su confirmación no coinciden',
      );
    }

    const passwordActualCorrecta =
      await argon2.verify(
        usuario.passwordHash,
        datos.passwordActual,
      );

    if (
      !passwordActualCorrecta
    ) {
      throw new UnauthorizedException(
        'La contraseña actual es incorrecta',
      );
    }

    const nuevaIgualActual =
      await argon2.verify(
        usuario.passwordHash,
        datos.nuevaPassword,
      );

    if (
      nuevaIgualActual
    ) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente de la contraseña actual',
      );
    }

    const nuevoPasswordHash =
      await argon2.hash(
        datos.nuevaPassword,
      );

    await this.prisma.usuario.update({
      where: {
        id:
          usuarioId,
      },

      data: {
        passwordHash:
          nuevoPasswordHash,

        passwordCambiadaEn:
          new Date(),
      },
    });

    return {
      mensaje:
        'Contraseña actualizada correctamente',
    };
  }

  async actualizarFoto(
    usuarioId: number,
    archivo:
      ArchivoPerfil,
  ) {
    const usuario =
      await this.verificarUsuario(
        usuarioId,
      );

    if (
      !archivo ||
      !archivo.buffer
    ) {
      throw new BadRequestException(
        'Debes seleccionar una fotografía',
      );
    }

    const limiteBytes =
      3 *
      1024 *
      1024;

    if (
      archivo.size >
      limiteBytes
    ) {
      throw new BadRequestException(
        'La fotografía no puede superar los 3 MB',
      );
    }

    const extension =
      this.obtenerExtension(
        archivo.mimetype,
      );

    const directorio =
      this.obtenerDirectorioPerfiles();

    await mkdir(
      directorio,
      {
        recursive:
          true,
      },
    );

    const nombreArchivo =
      [
        `usuario-${usuarioId}`,
        Date.now(),
        randomUUID(),
      ].join(
        '-',
      ) +
      `.${extension}`;

    const rutaArchivo =
      join(
        directorio,
        nombreArchivo,
      );

    const fotoPerfilUrl =
      `/uploads/perfiles/${nombreArchivo}`;

    try {
      /*
       * Primero guardamos el nuevo archivo.
       */
      await writeFile(
        rutaArchivo,
        archivo.buffer,
      );

      /*
       * Después actualizamos PostgreSQL.
       */
      const perfil =
        await this.prisma.usuario.update({
          where: {
            id:
              usuarioId,
          },

          data: {
            fotoPerfilUrl,
          },

          select:
            this.seleccionPerfil,
        });

      /*
       * Cuando la BD ya fue actualizada,
       * eliminamos la fotografía anterior.
       */
      await this.eliminarArchivoAnterior(
        usuario.fotoPerfilUrl,
      );

      return {
        mensaje:
          'Fotografía actualizada correctamente',

        perfil,
      };
    } catch (
      error
    ) {
      /*
       * Si ocurrió un error después de guardar
       * el archivo, eliminamos el archivo nuevo
       * para no dejar archivos huérfanos.
       */
      try {
        await unlink(
          rutaArchivo,
        );
      } catch {
        /*
         * No hacemos nada si el archivo
         * ya fue eliminado o no existe.
         */
      }

      console.error(
        'Error al actualizar la fotografía:',
        error,
      );

      throw new InternalServerErrorException(
        'No fue posible guardar la fotografía',
      );
    }
  }

  async eliminarFoto(
    usuarioId: number,
  ) {
    const usuario =
      await this.verificarUsuario(
        usuarioId,
      );

    if (
      !usuario.fotoPerfilUrl
    ) {
      return {
        mensaje:
          'El perfil no tiene una fotografía registrada',

        perfil:
          await this.obtenerPerfil(
            usuarioId,
          ),
      };
    }

    const fotoAnterior =
      usuario.fotoPerfilUrl;

    const perfil =
      await this.prisma.usuario.update({
        where: {
          id:
            usuarioId,
        },

        data: {
          fotoPerfilUrl:
            null,
        },

        select:
          this.seleccionPerfil,
      });

    await this.eliminarArchivoAnterior(
      fotoAnterior,
    );

    return {
      mensaje:
        'Fotografía eliminada correctamente',

      perfil,
    };
  }
}