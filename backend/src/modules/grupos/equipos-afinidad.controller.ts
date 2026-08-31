import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { Rol } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { AgregarIntegranteEquipoDto } from './dto/agregar-integrante-equipo.dto';

import { CambiarEstadoEquipoDto } from './dto/cambiar-estado-equipo.dto';

import { CambiarEstadoEquipoTareaDto } from './dto/cambiar-estado-equipo-tarea.dto';

import { CambiarRepresentanteEquipoDto } from './dto/cambiar-representante-equipo.dto';

import { CrearEquipoAfinidadDto } from './dto/crear-equipo-afinidad.dto';

import { CrearEquipoAfinidadTareaDto } from './dto/crear-equipo-afinidad-tarea.dto';

import { EquiposAfinidadService } from './equipos-afinidad.service';

import { EquiposAfinidadTareaService } from './equipos-afinidad-tarea.service';

type UsuarioAutenticado = {
  id: number;

  correo: string;

  rol: Rol;
};

type RequestConUsuario = Request & {
  user: UsuarioAutenticado;
};

/*
 * ============================================================
 * CONTROLLER ÚNICO DE EQUIPOS POR AFINIDAD
 * ============================================================
 *
 * IMPORTANTE:
 * - Las rutas existentes de FORO se conservan exactamente.
 * - EquiposAfinidadService sigue atendiendo solamente FORO.
 * - EquiposAfinidadTareaService atiende solamente TAREAS.
 *
 * Usamos @Controller() para poder mantener los dos prefijos
 * dentro del mismo controller sin cambiar las URLs públicas.
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquiposAfinidadController {
  constructor(
    private readonly equiposAfinidadService: EquiposAfinidadService,

    private readonly equiposAfinidadTareaService: EquiposAfinidadTareaService,
  ) {}

  /*
   * ============================================================
   * FORO
   * ============================================================
   *
   * NO modificar estas rutas:
   * son equivalentes a las que antes estaban debajo de
   * @Controller('foro').
   */

  @Get('foro/cursos/:cursoId/:foroId/equipos/estudiantes-disponibles')
  @Roles(Rol.ESTUDIANTE)
  listarEstudiantesDisponiblesForo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('foroId', ParseIntPipe)
    foroId: number,
  ) {
    return this.equiposAfinidadService.listarEstudiantesDisponibles(
      request.user,
      cursoId,
      foroId,
    );
  }

  @Post('foro/cursos/:cursoId/:foroId/equipos')
  @Roles(Rol.ESTUDIANTE)
  crearEquipoForo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('foroId', ParseIntPipe)
    foroId: number,

    @Body()
    datos: CrearEquipoAfinidadDto,
  ) {
    return this.equiposAfinidadService.crearEquipo(
      request.user,
      cursoId,
      foroId,
      datos,
    );
  }

  @Get('foro/cursos/:cursoId/:foroId/equipos')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  listarEquiposForo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('foroId', ParseIntPipe)
    foroId: number,
  ) {
    return this.equiposAfinidadService.listarEquipos(
      request.user,
      cursoId,
      foroId,
    );
  }

  @Post('foro/cursos/:cursoId/equipos/:equipoId/integrantes')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  agregarIntegranteForo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('equipoId', ParseIntPipe)
    equipoId: number,

    @Body()
    datos: AgregarIntegranteEquipoDto,
  ) {
    return this.equiposAfinidadService.agregarIntegrante(
      request.user,
      cursoId,
      equipoId,
      datos,
    );
  }

  @Delete('foro/cursos/:cursoId/equipos/:equipoId/integrantes/:estudianteId')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  retirarIntegranteForo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('equipoId', ParseIntPipe)
    equipoId: number,

    @Param('estudianteId', ParseIntPipe)
    estudianteId: number,
  ) {
    return this.equiposAfinidadService.retirarIntegrante(
      request.user,
      cursoId,
      equipoId,
      estudianteId,
    );
  }

  @Patch('foro/cursos/:cursoId/equipos/:equipoId/representante')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  cambiarRepresentanteForo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('equipoId', ParseIntPipe)
    equipoId: number,

    @Body()
    datos: CambiarRepresentanteEquipoDto,
  ) {
    return this.equiposAfinidadService.cambiarRepresentante(
      request.user,
      cursoId,
      equipoId,
      datos,
    );
  }

  @Patch('foro/cursos/:cursoId/equipos/:equipoId/estado')
  @Roles(Rol.DOCENTE)
  cambiarEstadoForo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('equipoId', ParseIntPipe)
    equipoId: number,

    @Body()
    datos: CambiarEstadoEquipoDto,
  ) {
    return this.equiposAfinidadService.cambiarEstado(
      request.user,
      cursoId,
      equipoId,
      datos,
    );
  }

  /*
   * ============================================================
   * TAREAS
   * ============================================================
   */

  @Get(
    'tareas/cursos/:cursoId/:tareaId/equipos-afinidad/estudiantes-disponibles',
  )
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  listarEstudiantesDisponiblesTarea(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.equiposAfinidadTareaService.listarEstudiantesDisponibles(
      request.user,
      cursoId,
      tareaId,
    );
  }

  @Post('tareas/cursos/:cursoId/:tareaId/equipos-afinidad')
  @Roles(Rol.ESTUDIANTE)
  crearEquipoTarea(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,

    @Body()
    datos: CrearEquipoAfinidadTareaDto,
  ) {
    return this.equiposAfinidadTareaService.crearEquipo(
      request.user,
      cursoId,
      tareaId,
      datos,
    );
  }

  @Get('tareas/cursos/:cursoId/:tareaId/equipos-afinidad')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  listarEquiposTarea(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.equiposAfinidadTareaService.listarEquipos(
      request.user,
      cursoId,
      tareaId,
    );
  }

  @Get('tareas/cursos/:cursoId/:tareaId/equipos-afinidad/mi-equipo')
  @Roles(Rol.ESTUDIANTE)
  obtenerMiEquipoTarea(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.equiposAfinidadTareaService.obtenerMiEquipo(
      request.user,
      cursoId,
      tareaId,
    );
  }

  @Post('tareas/cursos/:cursoId/equipos-afinidad/:equipoId/integrantes')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  agregarIntegranteTarea(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('equipoId', ParseIntPipe)
    equipoId: number,

    @Body()
    datos: AgregarIntegranteEquipoDto,
  ) {
    return this.equiposAfinidadTareaService.agregarIntegrante(
      request.user,
      cursoId,
      equipoId,
      datos,
    );
  }

  @Delete(
    'tareas/cursos/:cursoId/equipos-afinidad/:equipoId/integrantes/:estudianteId',
  )
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  retirarIntegranteTarea(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('equipoId', ParseIntPipe)
    equipoId: number,

    @Param('estudianteId', ParseIntPipe)
    estudianteId: number,
  ) {
    return this.equiposAfinidadTareaService.retirarIntegrante(
      request.user,
      cursoId,
      equipoId,
      estudianteId,
    );
  }

  @Patch('tareas/cursos/:cursoId/equipos-afinidad/:equipoId/representante')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  cambiarRepresentanteTarea(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('equipoId', ParseIntPipe)
    equipoId: number,

    @Body()
    datos: CambiarRepresentanteEquipoDto,
  ) {
    return this.equiposAfinidadTareaService.cambiarRepresentante(
      request.user,
      cursoId,
      equipoId,
      datos,
    );
  }

  @Patch('tareas/cursos/:cursoId/equipos-afinidad/:equipoId/estado')
  @Roles(Rol.DOCENTE)
  cambiarEstadoTarea(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('equipoId', ParseIntPipe)
    equipoId: number,

    @Body()
    datos: CambiarEstadoEquipoTareaDto,
  ) {
    return this.equiposAfinidadTareaService.cambiarEstado(
      request.user,
      cursoId,
      equipoId,
      datos,
    );
  }
}
