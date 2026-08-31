import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import type { Request } from 'express';

import { Rol } from '../../../generated/prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';

type UsuarioAutenticado = {
  id: number;
  correo: string;
  rol: Rol;
};

type RequestConUsuario = Request & {
  user?: UsuarioAutenticado;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    /*
     * Si la ruta no tiene @Roles(),
     * el guard no aplica restricciones de rol.
     */
    if (!rolesPermitidos || rolesPermitidos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestConUsuario>();

    const usuario = request.user;

    if (!usuario) {
      throw new ForbiddenException(
        'No fue posible identificar el rol del usuario',
      );
    }

    const tienePermiso = rolesPermitidos.includes(usuario.rol);

    if (!tienePermiso) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }

    return true;
  }
}
