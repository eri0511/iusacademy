import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';

import {
  ActualizarPublicacionDto,
  CambiarComentariosPublicacionDto,
  CambiarFijadoPublicacionDto,
} from '../dto/actualizar-publicacion.dto';

import {
  CambiarVisibilidadPublicacionDto,
} from '../dto/cambiar-visibilidad-publicacion.dto';

import {
  CrearPublicacionDto,
} from '../dto/crear-publicacion.dto';

import {
  PublicacionesService,
} from './publicaciones.service';

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
  'aula/cursos/:cursoId/hitos/:hitoId/tablon',
)
@UseGuards(
  JwtAuthGuard,
)
export class PublicacionesController {
  constructor(
    private readonly publicacionesService:
      PublicacionesService,
  ) {}

  @Get()
  obtenerTablon(
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
      'hitoId',
      ParseIntPipe,
    )
    hitoId:
      number,
  ) {
    return this.publicacionesService
      .obtenerTablon(
        request.user,
        cursoId,
        hitoId,
      );
  }

  @Post()
  crearPublicacion(
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
      'hitoId',
      ParseIntPipe,
    )
    hitoId:
      number,

    @Body()
    datos:
      CrearPublicacionDto,
  ) {
    return this.publicacionesService
      .crearPublicacion(
        request.user,
        cursoId,
        hitoId,
        datos,
      );
  }

  @Put(
    ':publicacionId',
  )
  actualizarPublicacion(
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
      'hitoId',
      ParseIntPipe,
    )
    hitoId:
      number,

    @Param(
      'publicacionId',
      ParseIntPipe,
    )
    publicacionId:
      number,

    @Body()
    datos:
      ActualizarPublicacionDto,
  ) {
    return this.publicacionesService
      .actualizarPublicacion(
        request.user,
        cursoId,
        hitoId,
        publicacionId,
        datos,
      );
  }

  @Patch(
    ':publicacionId/fijar',
  )
  cambiarFijado(
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
      'hitoId',
      ParseIntPipe,
    )
    hitoId:
      number,

    @Param(
      'publicacionId',
      ParseIntPipe,
    )
    publicacionId:
      number,

    @Body()
    datos:
      CambiarFijadoPublicacionDto,
  ) {
    return this.publicacionesService
      .cambiarFijado(
        request.user,
        cursoId,
        hitoId,
        publicacionId,
        datos.estaFijada,
      );
  }

  @Patch(
    ':publicacionId/comentarios',
  )
  cambiarComentarios(
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
      'hitoId',
      ParseIntPipe,
    )
    hitoId:
      number,

    @Param(
      'publicacionId',
      ParseIntPipe,
    )
    publicacionId:
      number,

    @Body()
    datos:
      CambiarComentariosPublicacionDto,
  ) {
    return this.publicacionesService
      .cambiarComentarios(
        request.user,
        cursoId,
        hitoId,
        publicacionId,
        datos.comentariosHabilitados,
      );
  }

  @Patch(
    ':publicacionId/visibilidad',
  )
  cambiarVisibilidad(
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
      'hitoId',
      ParseIntPipe,
    )
    hitoId:
      number,

    @Param(
      'publicacionId',
      ParseIntPipe,
    )
    publicacionId:
      number,

    @Body()
    datos:
      CambiarVisibilidadPublicacionDto,
  ) {
    return this.publicacionesService
      .cambiarVisibilidad(
        request.user,
        cursoId,
        hitoId,
        publicacionId,
        datos.visibleParaEstudiantes,
      );
  }

  @Delete(
    ':publicacionId',
  )
  eliminarPublicacion(
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
      'hitoId',
      ParseIntPipe,
    )
    hitoId:
      number,

    @Param(
      'publicacionId',
      ParseIntPipe,
    )
    publicacionId:
      number,
  ) {
    return this.publicacionesService
      .eliminarPublicacion(
        request.user,
        cursoId,
        hitoId,
        publicacionId,
      );
  }
}