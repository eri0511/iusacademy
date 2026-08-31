import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { Rol } from '../../generated/prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AulaInicioDocenteService } from './aula-inicio-docente.service';

import { AulaInicioEstudianteService } from './aula-inicio-estudiante.service';

import { AulaCursoService } from './aula-curso.service';

type UsuarioAutenticado = {
  id: number;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  rol: Rol;
};

type RequestConUsuario = Request & {
  user: UsuarioAutenticado;
};

@Controller('aula/cursos')
@UseGuards(JwtAuthGuard)
export class AulaCursoController {
  constructor(
    private readonly aulaCursoService: AulaCursoService,
    private readonly aulaInicioDocenteService: AulaInicioDocenteService,
    private readonly aulaInicioEstudianteService: AulaInicioEstudianteService,
  ) {}

  @Get(':cursoId')
  obtenerAulaCurso(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,
  ) {
    return this.aulaCursoService.obtenerAulaCurso(request.user, cursoId);
  }

  @Get(':cursoId/hitos')
  obtenerHitosCurso(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,
  ) {
    return this.aulaCursoService.obtenerHitosCurso(request.user, cursoId);
  }

  @Get(':cursoId/hitos/:hitoId')
  obtenerHitoCurso(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('hitoId', ParseIntPipe)
    hitoId: number,
  ) {
    return this.aulaCursoService.obtenerHitoCurso(
      request.user,
      cursoId,
      hitoId,
    );
  }
  @Get(':cursoId/hitos/:hitoId/inicio-docente')
  obtenerInicioDocente(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('hitoId', ParseIntPipe)
    hitoId: number,
  ) {
    return this.aulaInicioDocenteService.obtenerInicioDocente(
      request.user,
      cursoId,
      hitoId,
    );
  }

  @Get(':cursoId/hitos/:hitoId/inicio-estudiante')
  obtenerInicioEstudiante(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('hitoId', ParseIntPipe)
    hitoId: number,
  ) {
    return this.aulaInicioEstudianteService.obtenerInicioEstudiante(
      request.user,
      cursoId,
      hitoId,
    );
  }
}
