import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { Rol } from '../../../generated/prisma/client';

import { Roles } from '../../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../../auth/guards/roles.guard';

import { EstudianteInscripcionesService } from './estudiante-inscripciones.service';

import { InscribirseCursoDto } from './dto/inscribirse-curso.dto';

type UsuarioAutenticado = {
  id: number;
  correo: string;
  rol: Rol;
};

type RequestConUsuario = Request & {
  user: UsuarioAutenticado;
};

@Controller('estudiante/cursos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ESTUDIANTE)
export class EstudianteInscripcionesController {
  constructor(
    private readonly estudianteInscripcionesService: EstudianteInscripcionesService,
  ) {}

  /**
   * Devuelve todos los cursos en los que
   * el estudiante tiene una inscripción activa.
   */
  @Get()
  obtenerMisCursos(
    @Req()
    request: RequestConUsuario,
  ) {
    return this.estudianteInscripcionesService.obtenerMisCursos(
      request.user.id,
    );
  }

  /**
   * Inscribe al estudiante utilizando
   * el código generado por el docente.
   *
   * Esta ruta debe declararse antes de @Get(':id')
   * para evitar que "inscribirse" sea interpretado
   * como un identificador de curso.
   */
  @Post('inscribirse')
  inscribirseCurso(
    @Req()
    request: RequestConUsuario,

    @Body()
    datos: InscribirseCursoDto,
  ) {
    return this.estudianteInscripcionesService.inscribirseCurso(
      request.user.id,
      datos,
    );
  }

  /**
   * Devuelve el detalle de un curso únicamente
   * cuando el estudiante tiene una inscripción activa.
   *
   * Esta ruta dinámica debe declararse al final.
   */
  @Get(':id')
  obtenerMiCursoPorId(
    @Req()
    request: RequestConUsuario,

    @Param('id', ParseIntPipe)
    cursoId: number,
  ) {
    return this.estudianteInscripcionesService.obtenerMiCursoPorId(
      request.user.id,
      cursoId,
    );
  }
}
