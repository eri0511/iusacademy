import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { BibliotecaService } from './biblioteca.service';
import type { UsuarioBiblioteca } from './biblioteca.service';
@Injectable()
export class BibliotecaGestionGuard implements CanActivate {
  constructor(private readonly biblioteca: BibliotecaService) {}
  async canActivate(context: ExecutionContext) {
    const { user } = context
      .switchToHttp()
      .getRequest<{ user: UsuarioBiblioteca }>();
    if (!user || !(await this.biblioteca.puedeGestionar(user)))
      throw new ForbiddenException(
        'No tienes permiso para gestionar la biblioteca',
      );
    return true;
  }
}
