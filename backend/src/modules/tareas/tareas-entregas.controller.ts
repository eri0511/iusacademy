import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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

import {
  GuardarEntregaTareaDto,
} from './dto/guardar-entrega-tarea.dto';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

import {
  TareasEntregasService,
} from './tareas-entregas.service';

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
export class TareasEntregasController {
  constructor(
    private readonly entregasService:
      TareasEntregasService,
  ) {}

  @Get(
    'estudiante/cursos/:cursoId/:tareaId/entrega',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  obtenerMiEntrega(
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
  ) {
    return this.entregasService.obtenerMiEntrega(
      request.user,
      cursoId,
      tareaId,
    );
  }

  @Post(
    'estudiante/cursos/:cursoId/:tareaId/entrega',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  preparar(
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

    @Body()
    datos:
      GuardarEntregaTareaDto,
  ) {
    return this.entregasService.preparar(
      request.user,
      cursoId,
      tareaId,
      datos,
    );
  }

  @Patch(
    'estudiante/cursos/:cursoId/:tareaId/entregas/:entregaId/enviar',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  enviar(
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
    return this.entregasService.enviar(
      request.user,
      cursoId,
      tareaId,
      entregaId,
    );
  }

  @Get(
    'docente/cursos/:cursoId/:tareaId/entregas',
  )
  @Roles(
    Rol.DOCENTE,
  )
  listarDocente(
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
  ) {
    return this.entregasService.listarDocente(
      request.user,
      cursoId,
      tareaId,
    );
  }
}