import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { createHash, randomBytes } from 'node:crypto';

import * as argon2 from 'argon2';

import { CorreoService } from '../correo/correo.service';
import { PrismaService } from '../../prisma/prisma.service';

import { ActivarCuentaDto } from './dto/activar-cuenta.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly correoService: CorreoService,
  ) {}

  /**
   * Obtiene todos los usuarios.
   * El frontend decide si muestra activos,
   * desactivados o todos.
   */
  async obtenerTodos() {
    return this.prisma.usuario.findMany({
      orderBy: {
        creadoEn: 'desc',
      },

      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        fotoPerfilUrl: true,
        rol: true,
        estaActivo: true,
        cuentaActivada: true,
        tokenActivacionExpira: true,
        accesoEnviadoEn: true,
        passwordCambiadaEn: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });
  }

  /**
   * Crea un usuario pendiente de activación.
   * Todavía no se genera ninguna contraseña.
   */
  async crearUsuario(datos: CrearUsuarioDto) {
    const correoNormalizado = datos.correo.trim().toLowerCase();

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: {
        correo: correoNormalizado,
      },
    });

    if (usuarioExistente) {
      throw new ConflictException(
        'Ya existe un usuario registrado con este correo',
      );
    }

    const usuario = await this.prisma.usuario.create({
      data: {
        nombres: datos.nombres.trim(),

        apellidoPaterno: datos.apellidoPaterno.trim(),

        apellidoMaterno: datos.apellidoMaterno?.trim() || null,

        correo: correoNormalizado,

        rol: datos.rol,

        estaActivo: true,

        cuentaActivada: false,

        passwordHash: null,

        tokenActivacionHash: null,

        tokenActivacionExpira: null,

        accesoEnviadoEn: null,

        passwordCambiadaEn: null,
      },

      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        fotoPerfilUrl: true,
        rol: true,
        estaActivo: true,
        cuentaActivada: true,
        tokenActivacionExpira: true,
        accesoEnviadoEn: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });

    return {
      mensaje: 'Usuario creado correctamente',

      usuario,
    };
  }

  /**
   * Actualiza los datos de un usuario.
   *
   * Si se cambia el correo:
   * - se invalida la activación anterior;
   * - se elimina la contraseña asociada al correo viejo;
   * - se eliminan los tokens anteriores;
   * - el administrador deberá enviar una nueva activación.
   */
  async actualizarUsuario(usuarioId: number, datos: ActualizarUsuarioDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },
    });

    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }

    const correoNormalizado =
      datos.correo !== undefined
        ? datos.correo.trim().toLowerCase()
        : undefined;

    const cambioCorreo =
      correoNormalizado !== undefined && correoNormalizado !== usuario.correo;

    if (cambioCorreo) {
      const usuarioConCorreo = await this.prisma.usuario.findUnique({
        where: {
          correo: correoNormalizado,
        },
      });

      if (usuarioConCorreo) {
        throw new ConflictException(
          'Ya existe otro usuario registrado con este correo',
        );
      }
    }

    const usuarioActualizado = await this.prisma.usuario.update({
      where: {
        id: usuarioId,
      },

      data: {
        nombres: datos.nombres !== undefined ? datos.nombres.trim() : undefined,

        apellidoPaterno:
          datos.apellidoPaterno !== undefined
            ? datos.apellidoPaterno.trim()
            : undefined,

        apellidoMaterno:
          datos.apellidoMaterno !== undefined
            ? datos.apellidoMaterno?.trim() || null
            : undefined,

        correo: correoNormalizado,

        rol: datos.rol,

        /*
         * Si cambia el correo, el usuario debe
         * volver a activar su cuenta.
         */
        ...(cambioCorreo
          ? {
              cuentaActivada: false,

              passwordHash: null,

              tokenActivacionHash: null,

              tokenActivacionExpira: null,

              accesoEnviadoEn: null,

              passwordCambiadaEn: null,
            }
          : {}),
      },

      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        fotoPerfilUrl: true,
        rol: true,
        estaActivo: true,
        cuentaActivada: true,
        tokenActivacionExpira: true,
        accesoEnviadoEn: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });

    return {
      mensaje: cambioCorreo
        ? 'Usuario actualizado. Debes enviar una nueva activación al correo actualizado.'
        : 'Usuario actualizado correctamente',

      requiereNuevaActivacion: cambioCorreo,

      usuario: usuarioActualizado,
    };
  }

  /**
   * Desactiva o reactiva un usuario.
   *
   * Desactivar:
   * - bloquea el acceso;
   * - invalida un enlace de activación pendiente;
   * - conserva la contraseña si la cuenta ya estaba activada.
   *
   * Reactivar:
   * - habilita nuevamente la cuenta;
   * - no envía correo automáticamente.
   */
  async cambiarEstado(usuarioId: number, estaActivo: boolean) {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },
    });

    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }

    if (usuario.estaActivo === estaActivo) {
      return {
        mensaje: estaActivo
          ? 'El usuario ya se encuentra activo'
          : 'El usuario ya se encuentra desactivado',

        usuario: {
          id: usuario.id,

          nombres: usuario.nombres,

          apellidoPaterno: usuario.apellidoPaterno,

          correo: usuario.correo,

          fotoPerfilUrl: usuario.fotoPerfilUrl,

          rol: usuario.rol,

          estaActivo: usuario.estaActivo,

          cuentaActivada: usuario.cuentaActivada,
        },
      };
    }

    const usuarioActualizado = await this.prisma.usuario.update({
      where: {
        id: usuarioId,
      },

      data: {
        estaActivo,

        /*
         * Al desactivar, cualquier enlace pendiente
         * queda invalidado.
         *
         * No eliminamos passwordHash ni cuentaActivada,
         * porque si la cuenta ya estaba activada podrá
         * volver a ingresar con su contraseña al reactivarse.
         */
        ...(!estaActivo
          ? {
              tokenActivacionHash: null,

              tokenActivacionExpira: null,
            }
          : {}),
      },

      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        fotoPerfilUrl: true,
        rol: true,
        estaActivo: true,
        cuentaActivada: true,
        tokenActivacionExpira: true,
        accesoEnviadoEn: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });

    return {
      mensaje: estaActivo
        ? 'Usuario reactivado correctamente'
        : 'Usuario desactivado correctamente',

      requiereEnviarActivacion:
        estaActivo && !usuarioActualizado.cuentaActivada,

      usuario: usuarioActualizado,
    };
  }

  /**
   * Genera y envía un enlace de activación.
   *
   * El token plano se envía exclusivamente por correo.
   * En PostgreSQL solo se guarda su hash.
   */
  async enviarActivacion(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },
    });

    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }

    if (!usuario.estaActivo) {
      throw new BadRequestException(
        'No se puede enviar la activación a un usuario inactivo',
      );
    }

    if (usuario.cuentaActivada) {
      throw new BadRequestException(
        'La cuenta del usuario ya se encuentra activada',
      );
    }

    const ahora = new Date();

    const enlaceVigente =
      usuario.tokenActivacionExpira !== null &&
      usuario.tokenActivacionExpira > ahora;

    if (enlaceVigente) {
      throw new BadRequestException(
        'El enlace de activación todavía se encuentra vigente',
      );
    }

    const tokenPlano = randomBytes(32).toString('hex');

    const tokenHash = this.crearHashToken(tokenPlano);

    const fechaExpiracion = new Date(ahora);

    fechaExpiracion.setDate(fechaExpiracion.getDate() + 3);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    const enlaceActivacion = `${frontendUrl}/activar-cuenta?token=${encodeURIComponent(
      tokenPlano,
    )}`;

    /*
     * Guardamos el estado anterior para restaurarlo
     * si Gmail no puede enviar el mensaje.
     */
    const estadoAnterior = {
      tokenActivacionHash: usuario.tokenActivacionHash,

      tokenActivacionExpira: usuario.tokenActivacionExpira,

      accesoEnviadoEn: usuario.accesoEnviadoEn,
    };

    await this.prisma.usuario.update({
      where: {
        id: usuario.id,
      },

      data: {
        tokenActivacionHash: tokenHash,

        tokenActivacionExpira: fechaExpiracion,

        accesoEnviadoEn: ahora,
      },
    });

    try {
      await this.correoService.enviarEnlaceActivacion({
        destinatario: usuario.correo,

        nombre: usuario.nombres,

        enlaceActivacion,

        fechaExpiracion,
      });
    } catch (error) {
      await this.prisma.usuario.update({
        where: {
          id: usuario.id,
        },

        data: estadoAnterior,
      });

      console.error('Error al enviar el enlace de activación:', error);

      throw new InternalServerErrorException(
        'No fue posible enviar el enlace de activación',
      );
    }

    return {
      mensaje: 'Enlace de activación enviado correctamente',

      usuario: {
        id: usuario.id,

        nombres: usuario.nombres,

        apellidoPaterno: usuario.apellidoPaterno,

        correo: usuario.correo,

        fotoPerfilUrl: usuario.fotoPerfilUrl,

        cuentaActivada: false,

        accesoEnviadoEn: ahora,

        tokenActivacionExpira: fechaExpiracion,
      },
    };
  }

  /**
   * Valida el token de activación y permite
   * crear la contraseña definitiva del usuario.
   */
  async activarCuenta(datos: ActivarCuentaDto) {
    const tokenPlano = datos.token.trim();

    if (!tokenPlano) {
      throw new BadRequestException('El token de activación es obligatorio');
    }

    if (datos.password !== datos.confirmarPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const tokenHash = this.crearHashToken(tokenPlano);

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        tokenActivacionHash: tokenHash,
      },
    });

    if (!usuario) {
      throw new BadRequestException(
        'El enlace de activación no es válido o ya fue utilizado',
      );
    }

    if (usuario.cuentaActivada) {
      throw new BadRequestException('Esta cuenta ya fue activada');
    }

    if (!usuario.estaActivo) {
      throw new BadRequestException('La cuenta se encuentra desactivada');
    }

    const ahora = new Date();

    if (
      !usuario.tokenActivacionExpira ||
      usuario.tokenActivacionExpira <= ahora
    ) {
      throw new BadRequestException('El enlace de activación ha expirado');
    }

    const passwordHash = await argon2.hash(datos.password, {
      type: argon2.argon2id,
    });

    await this.prisma.usuario.update({
      where: {
        id: usuario.id,
      },

      data: {
        passwordHash,

        cuentaActivada: true,

        passwordCambiadaEn: ahora,

        tokenActivacionHash: null,

        tokenActivacionExpira: null,
      },
    });

    return {
      mensaje: 'Cuenta activada correctamente',
    };
  }

  /**
   * Genera el hash SHA-256 del token.
   */
  private crearHashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
