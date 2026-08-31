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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { Rol } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { ActualizarTareaDto } from './dto/actualizar-tarea.dto';

import { CrearTareaDto } from './dto/crear-tarea.dto';

import { CrearExtensionPlazoDto } from './dto/crear-extension-plazo.dto';

import { ListarTareasDto } from './dto/listar-tareas.dto';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

import { TareasService } from './tareas.service';

type RequestAutenticada = Request & {
  user: UsuarioAutenticado;
};

@Controller('tareas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TareasController {
  constructor(private readonly tareasService: TareasService) {}

  @Post('cursos/:cursoId')
  @Roles(Rol.DOCENTE)
  crear(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Body()
    datos: CrearTareaDto,
  ) {
    return this.tareasService.crear(request.user, cursoId, datos);
  }

  @Get('docente/cursos/:cursoId')
  @Roles(Rol.DOCENTE)
  listarDocente(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Query()
    filtros: ListarTareasDto,
  ) {
    return this.tareasService.listarDocente(request.user, cursoId, filtros);
  }

  @Get('docente/cursos/:cursoId/:tareaId')
  @Roles(Rol.DOCENTE)
  obtenerDetalleDocente(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.tareasService.obtenerDetalleDocente(
      request.user,
      cursoId,
      tareaId,
    );
  }

  @Put('cursos/:cursoId/:tareaId')
  @Roles(Rol.DOCENTE)
  actualizar(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,

    @Body()
    datos: ActualizarTareaDto,
  ) {
    return this.tareasService.actualizar(request.user, cursoId, tareaId, datos);
  }

  @Patch('cursos/:cursoId/:tareaId/publicar')
  @Roles(Rol.DOCENTE)
  publicar(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.tareasService.publicar(request.user, cursoId, tareaId);
  }

  @Patch('cursos/:cursoId/:tareaId/cerrar')
  @Roles(Rol.DOCENTE)
  cerrar(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.tareasService.cerrar(request.user, cursoId, tareaId);
  }

  @Patch('cursos/:cursoId/:tareaId/reabrir')
  @Roles(Rol.DOCENTE)
  reabrir(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.tareasService.reabrir(request.user, cursoId, tareaId);
  }

  @Delete('cursos/:cursoId/:tareaId')
  @Roles(Rol.DOCENTE)
  anular(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.tareasService.anular(request.user, cursoId, tareaId);
  }

  @Get('estudiante/cursos/:cursoId')
  @Roles(Rol.ESTUDIANTE)
  listarEstudiante(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Query()
    filtros: ListarTareasDto,
  ) {
    return this.tareasService.listarEstudiante(request.user, cursoId, filtros);
  }

  @Get('estudiante/cursos/:cursoId/:tareaId')
  @Roles(Rol.ESTUDIANTE)
  obtenerDetalleEstudiante(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.tareasService.obtenerDetalleEstudiante(
      request.user,
      cursoId,
      tareaId,
    );
  }

  /*
   * ============================================================
   * EXTENSIÓN DE PLAZO INDIVIDUAL / GRUPAL
   * ============================================================
   */

  @Post('docente/cursos/:cursoId/:tareaId/extensiones')
  @Roles(Rol.DOCENTE)
  extenderPlazo(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,

    @Body()
    datos: CrearExtensionPlazoDto,
  ) {
    return this.tareasService.extenderPlazoTarea(
      request.user,
      cursoId,
      tareaId,
      datos,
    );
  }

  @Get('docente/cursos/:cursoId/:tareaId/extensiones')
  @Roles(Rol.DOCENTE)
  listarExtensiones(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.tareasService.obtenerExtensionesTarea(
      request.user,
      cursoId,
      tareaId,
    );
  }

  @Delete('docente/cursos/:cursoId/:tareaId/extensiones/:extensionId')
  @Roles(Rol.DOCENTE)
  revocarExtension(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,

    @Param('extensionId', ParseIntPipe)
    extensionId: number,
  ) {
    return this.tareasService.revocarExtension(
      request.user,
      cursoId,
      tareaId,
      extensionId,
    );
  }
}
