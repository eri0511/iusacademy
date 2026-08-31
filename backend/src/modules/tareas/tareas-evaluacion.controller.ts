import {
  Body,
  Controller,
  Get,
  Res,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { Rol } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { enviarArchivoReporte } from '../reportes/helpers/respuesta-reporte.helper';

import { CalificarEntregaTareaDto } from './dto/calificar-entrega-tarea.dto';

import { RegistrarPresencialTareaDto } from './dto/registrar-presencial-tarea.dto';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

import { TareasEvaluacionService } from './tareas-evaluacion.service';

import { TareasReportesService } from './tareas-reportes.service';

type RequestAutenticada = Request & {
  user: UsuarioAutenticado;
};

@Controller('tareas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TareasEvaluacionController {
  constructor(
    private readonly evaluacionService: TareasEvaluacionService,

    private readonly reportesService: TareasReportesService,
  ) {}

  @Get('docente/cursos/:cursoId/:tareaId/evaluacion')
  @Roles(Rol.DOCENTE)
  obtenerPanel(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.evaluacionService.obtenerPanel(request.user, cursoId, tareaId);
  }

  @Get('docente/cursos/:cursoId/:tareaId/entregas/:entregaId/revision')
  @Roles(Rol.DOCENTE)
  obtenerRevisionEntrega(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,

    @Param('entregaId', ParseIntPipe)
    entregaId: number,
  ) {
    return this.evaluacionService.obtenerRevisionEntrega(
      request.user,
      cursoId,
      tareaId,
      entregaId,
    );
  }

  @Patch('docente/cursos/:cursoId/:tareaId/entregas/:entregaId/calificacion')
  @Roles(Rol.DOCENTE)
  calificarEntrega(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,

    @Param('entregaId', ParseIntPipe)
    entregaId: number,

    @Body()
    datos: CalificarEntregaTareaDto,
  ) {
    return this.evaluacionService.calificarEntrega(
      request.user,
      cursoId,
      tareaId,
      entregaId,
      datos,
    );
  }

  @Post('docente/cursos/:cursoId/:tareaId/calificaciones/publicar')
  @Roles(Rol.DOCENTE)
  publicarNotas(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.evaluacionService.publicarNotas(request.user, cursoId, tareaId);
  }

  @Get('docente/cursos/:cursoId/:tareaId/calificaciones/exportar/:formato')
  @Roles(Rol.DOCENTE)
  async exportarCalificaciones(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,

    @Param('formato')
    formato: string,

    @Res()
    response: Response,
  ) {
    const archivo = await this.reportesService.generarCalificaciones(
      request.user,
      cursoId,
      tareaId,
      formato,
    );

    enviarArchivoReporte(response, archivo);
  }

  @Get('docente/cursos/:cursoId/:tareaId/historial')
  @Roles(Rol.DOCENTE)
  obtenerHistorial(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.evaluacionService.obtenerHistorial(
      request.user,
      cursoId,
      tareaId,
    );
  }

  @Get('docente/cursos/:cursoId/:tareaId/presencial/roster')
  @Roles(Rol.DOCENTE)
  obtenerRosterPresencial(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.evaluacionService.obtenerRosterPresencial(
      request.user,
      cursoId,
      tareaId,
    );
  }

  @Post('docente/cursos/:cursoId/:tareaId/presencial/registrar')
  @Roles(Rol.DOCENTE)
  registrarPresencial(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,

    @Body()
    datos: RegistrarPresencialTareaDto,
  ) {
    return this.evaluacionService.registrarPresencial(
      request.user,
      cursoId,
      tareaId,
      datos,
    );
  }
}
