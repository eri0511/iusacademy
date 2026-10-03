import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type {
  Request,
} from 'express';

import {
  Rol,
} from '../../generated/prisma/client';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

import {
  TareasAnalisisService,
} from './tareas-analisis.service';

type RequestAutenticada =
  Request & {
    user:
      UsuarioAutenticado;
  };

@Controller(
  'tareas',
)
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class TareasAnalisisController {
  constructor(
    private readonly tareasAnalisisService:
      TareasAnalisisService,
  ) {}

  @Post(
    'docente/cursos/:cursoId/:tareaId/entregas/:entregaId/analisis-ia',
  )
  @Roles(
    Rol.DOCENTE,
  )
  analizarEntrega(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'tareaId',
      ParseIntPipe,
    )
    tareaId:
      number,

    @Param(
      'entregaId',
      ParseIntPipe,
    )
    entregaId:
      number,
  ) {
    return this.tareasAnalisisService.analizarEntregaDocente(
      request.user,
      cursoId,
      tareaId,
      entregaId,
    );
  }
}