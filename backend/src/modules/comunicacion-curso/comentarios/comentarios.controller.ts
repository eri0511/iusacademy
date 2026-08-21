import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import type {
  Request,
} from 'express';

import {
  Rol,
} from '../../../generated/prisma/client';

import {
  Roles,
} from '../../auth/decorators/roles.decorator';

import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../../auth/guards/roles.guard';

import {
  ActualizarComentarioDto,
} from '../dto/actualizar-comentario.dto';

import {
  CrearComentarioDto,
} from '../dto/crear-comentario.dto';

import {
  ComentariosService,
} from './comentarios.service';

type UsuarioAutenticado = {
  id: number;
  correo: string;
  rol: Rol;
};

type RequestConUsuario =
  Request & {
    user:
      UsuarioAutenticado;
  };

@Controller(
  'cursos/:cursoId/tablon/:publicacionId/comentarios',
)
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@Roles(
  Rol.DOCENTE,
  Rol.ESTUDIANTE,
)
export class ComentariosController {
  constructor(
    private readonly comentariosService:
      ComentariosService,
  ) {}

  @Get()
  obtenerComentarios(
    @Req()
    request:
      RequestConUsuario,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'publicacionId',
      ParseIntPipe,
    )
    publicacionId:
      number,
  ) {
    return this.comentariosService
      .obtenerComentarios(
        request.user,
        cursoId,
        publicacionId,
      );
  }

  @Post()
  crearComentario(
    @Req()
    request:
      RequestConUsuario,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'publicacionId',
      ParseIntPipe,
    )
    publicacionId:
      number,

    @Body()
    datos:
      CrearComentarioDto,
  ) {
    return this.comentariosService
      .crearComentario(
        request.user,
        cursoId,
        publicacionId,
        datos,
      );
  }

  @Put(':comentarioId')
  actualizarComentario(
    @Req()
    request:
      RequestConUsuario,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'publicacionId',
      ParseIntPipe,
    )
    publicacionId:
      number,

    @Param(
      'comentarioId',
      ParseIntPipe,
    )
    comentarioId:
      number,

    @Body()
    datos:
      ActualizarComentarioDto,
  ) {
    return this.comentariosService
      .actualizarComentario(
        request.user,
        cursoId,
        publicacionId,
        comentarioId,
        datos,
      );
  }

  @Delete(':comentarioId')
  eliminarComentario(
    @Req()
    request:
      RequestConUsuario,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'publicacionId',
      ParseIntPipe,
    )
    publicacionId:
      number,

    @Param(
      'comentarioId',
      ParseIntPipe,
    )
    comentarioId:
      number,
  ) {
    return this.comentariosService
      .eliminarComentario(
        request.user,
        cursoId,
        publicacionId,
        comentarioId,
      );
  }
}