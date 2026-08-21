import {
  Body,
  Controller,
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
  ActualizarActividadCalificableDto,
} from './dto/actualizar-actividad-calificable.dto';

import {
  CrearActividadCalificableDto,
} from './dto/crear-actividad-calificable.dto';

import {
  GuardarCalificacionDto,
} from './dto/guardar-calificacion.dto';

import {
  PublicarCalificacionesDto,
} from './dto/publicar-calificaciones.dto';

import {
  CalificacionesService,
} from './calificaciones.service';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

type RequestAutenticada =
  Request & {
    user:
      UsuarioAutenticado;
  };

@Controller(
  'calificaciones',
)
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class CalificacionesController {
  constructor(
    private readonly calificacionesService:
      CalificacionesService,
  ) {}

  @Post(
    'cursos/:cursoId/actividades',
  )
  @Roles(
    Rol.DOCENTE,
  )
  crearActividad(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Body()
    datos:
      CrearActividadCalificableDto,
  ) {
    return this.calificacionesService.crearActividad(
      request.user,
      cursoId,
      datos,
    );
  }

  @Put(
    'cursos/:cursoId/actividades/:actividadId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  actualizarActividad(
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
      'actividadId',
      ParseIntPipe,
    )
    actividadId:
      number,

    @Body()
    datos:
      ActualizarActividadCalificableDto,
  ) {
    return this.calificacionesService.actualizarActividad(
      request.user,
      cursoId,
      actividadId,
      datos,
    );
  }

  @Get(
    'cursos/:cursoId/libro',
  )
  @Roles(
    Rol.DOCENTE,
  )
  obtenerLibroDocente(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,
  ) {
    return this.calificacionesService.obtenerLibroDocente(
      request.user,
      cursoId,
    );
  }

  @Put(
    'cursos/:cursoId/actividades/:actividadId/estudiantes/:estudianteId',
  )
  @Roles(
    Rol.DOCENTE,
  )
  guardarCalificacion(
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
      'actividadId',
      ParseIntPipe,
    )
    actividadId:
      number,

    @Param(
      'estudianteId',
      ParseIntPipe,
    )
    estudianteId:
      number,

    @Body()
    datos:
      GuardarCalificacionDto,
  ) {
    return this.calificacionesService.guardarCalificacion(
      request.user,
      cursoId,
      actividadId,
      estudianteId,
      datos,
    );
  }

  @Patch(
    'cursos/:cursoId/actividades/:actividadId/publicar',
  )
  @Roles(
    Rol.DOCENTE,
  )
  publicarCalificaciones(
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
      'actividadId',
      ParseIntPipe,
    )
    actividadId:
      number,

    @Body()
    datos:
      PublicarCalificacionesDto,
  ) {
    return this.calificacionesService.publicarCalificaciones(
      request.user,
      cursoId,
      actividadId,
      datos,
    );
  }

  @Get(
    'cursos/:cursoId/estudiantes/:estudianteId/resumen',
  )
  @Roles(
    Rol.DOCENTE,
  )
  obtenerResumenEstudianteDocente(
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
      'estudianteId',
      ParseIntPipe,
    )
    estudianteId:
      number,
  ) {
    return this.calificacionesService.obtenerResumenEstudianteDocente(
      request.user,
      cursoId,
      estudianteId,
    );
  }

  @Get(
    'estudiante/cursos/:cursoId',
  )
  @Roles(
    Rol.ESTUDIANTE,
  )
  obtenerMisCalificaciones(
    @Req()
    request:
      RequestAutenticada,

    @Param(
      'cursoId',
      ParseIntPipe,
    )
    cursoId:
      number,
  ) {
    return this.calificacionesService.obtenerMisCalificaciones(
      request.user,
      cursoId,
    );
  }
}
