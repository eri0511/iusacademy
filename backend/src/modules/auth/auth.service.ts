import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as argon2 from 'argon2';

import { PrismaService } from '../../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly jwtService: JwtService,
  ) {}

  async login(datos: LoginDto) {
    const correoNormalizado = datos.correo.trim().toLowerCase();

    const usuario = await this.prisma.usuario.findUnique({
      where: {
        correo: correoNormalizado,
      },
    });

    /*
     * Se utiliza el mismo mensaje para correo inexistente
     * y contraseña incorrecta, evitando revelar qué
     * usuarios están registrados.
     */
    if (!usuario || !usuario.passwordHash) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    if (!usuario.estaActivo) {
      throw new UnauthorizedException('La cuenta se encuentra desactivada');
    }

    if (!usuario.cuentaActivada) {
      throw new UnauthorizedException(
        'Debes activar tu cuenta antes de iniciar sesión',
      );
    }

    const passwordValida = await argon2.verify(
      usuario.passwordHash,
      datos.password,
    );

    if (!passwordValida) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    /*
     * Guardamos la fecha y hora del último acceso
     * únicamente después de validar correctamente
     * las credenciales del usuario.
     */
    const fechaAcceso = new Date();

    const usuarioActualizado = await this.prisma.usuario.update({
      where: {
        id: usuario.id,
      },

      data: {
        ultimoAccesoEn: fechaAcceso,
      },

      select: {
        id: true,

        nombres: true,

        apellidoPaterno: true,

        apellidoMaterno: true,

        correo: true,

        rol: true,

        ultimoAccesoEn: true,
      },
    });

    const payload = {
      sub: usuarioActualizado.id,

      correo: usuarioActualizado.correo,

      rol: usuarioActualizado.rol,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      mensaje: 'Inicio de sesión correcto',

      accessToken,

      usuario: {
        id: usuarioActualizado.id,

        nombres: usuarioActualizado.nombres,

        apellidoPaterno: usuarioActualizado.apellidoPaterno,

        apellidoMaterno: usuarioActualizado.apellidoMaterno,

        correo: usuarioActualizado.correo,

        rol: usuarioActualizado.rol,

        ultimoAccesoEn: usuarioActualizado.ultimoAccesoEn,
      },
    };
  }
}
