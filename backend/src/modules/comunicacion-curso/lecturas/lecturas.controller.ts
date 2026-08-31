import {
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

import { LecturasService } from './lecturas.service';

type UsuarioAutenticado = {
  id: number;
  correo: string;
  rol: Rol;
};

type RequestConUsuario = Request & {
  user: UsuarioAutenticado;
};

@Controller('estudiante/cursos/:cursoId/tablon/:publicacionId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ESTUDIANTE)
export class EstudianteLecturasController {
  constructor(private readonly lecturasService: LecturasService) {}

  @Post('leer')
  registrarLectura(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('publicacionId', ParseIntPipe)
    publicacionId: number,
  ) {
    return this.lecturasService.registrarLectura(
      request.user.id,
      cursoId,
      publicacionId,
    );
  }
}

@Controller('docente/cursos/:cursoId/tablon/:publicacionId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.DOCENTE)
export class DocenteLecturasController {
  constructor(private readonly lecturasService: LecturasService) {}

  @Get('lecturas')
  obtenerLecturas(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('publicacionId', ParseIntPipe)
    publicacionId: number,
  ) {
    return this.lecturasService.obtenerLecturas(
      request.user.id,
      cursoId,
      publicacionId,
    );
  }
}
