import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { Rol } from '../../../generated/prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

type JwtPayload = {
  sub: number;
  correo: string;
  rol: Rol;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,

    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: payload.sub,
      },

      select: {
        id: true,
        nombres: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        rol: true,
        estaActivo: true,
        cuentaActivada: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('El usuario asociado al token no existe');
    }

    if (!usuario.estaActivo) {
      throw new UnauthorizedException(
        'Tu cuenta está temporalmente desactivada. Comunícate con el administrador.',
      );
    }

    if (!usuario.cuentaActivada) {
      throw new UnauthorizedException('La cuenta todavía no fue activada');
    }

    return {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidoPaterno: usuario.apellidoPaterno,
      apellidoMaterno: usuario.apellidoMaterno,
      correo: usuario.correo,
      rol: usuario.rol,
    };
  }
}
