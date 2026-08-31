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

import {
  ActualizarConjuntoGrupoDto,
  CambiarBloqueoConjuntoDto,
} from './dto/actualizar-conjunto-grupo.dto';

import { CrearConjuntoGrupoDto } from './dto/crear-conjunto-grupo.dto';

import {
  ActualizarGrupoCursoDto,
  AsignarEstudiantesGrupoDto,
  CambiarRepresentanteGrupoDto,
  CrearGrupoCursoDto,
  MoverEstudianteGrupoDto,
} from './dto/grupos-integrantes.dto';

import { ImportarConjuntoGrupoDto } from './dto/importar-conjunto-grupo.dto';

import { PrevisualizarDistribucionGruposDto } from './dto/previsualizar-distribucion-grupos.dto';

import { GruposService } from './grupos.service';

type UsuarioAutenticado = {
  id: number;
  correo: string;
  rol: Rol;
};

type RequestConUsuario = Request & {
  user: UsuarioAutenticado;
};

@Controller('docente/cursos/:cursoId/grupos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.DOCENTE)
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Post('previsualizar')
  previsualizar(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Body()
    datos: PrevisualizarDistribucionGruposDto,
  ) {
    return this.gruposService.previsualizarDistribucion(
      request.user,
      cursoId,
      datos,
    );
  }

  @Get()
  obtenerConjuntos(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Query('hitoId')
    hitoIdTexto?: string,
  ) {
    const hitoId = hitoIdTexto ? Number(hitoIdTexto) : undefined;

    if (hitoIdTexto && (!Number.isInteger(hitoId) || (hitoId ?? 0) < 1)) {
      return this.gruposService.obtenerConjuntos(request.user, cursoId);
    }

    return this.gruposService.obtenerConjuntos(request.user, cursoId, hitoId);
  }

  @Get('validaciones')
  obtenerValidacionesCreacion(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,
  ) {
    return this.gruposService.obtenerValidacionesCreacion(
      request.user,
      cursoId,
    );
  }

  @Get(':conjuntoId')
  obtenerDetalle(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,
  ) {
    return this.gruposService.obtenerDetalleConjunto(
      request.user,
      cursoId,
      conjuntoId,
    );
  }

  @Post()
  crearConjunto(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Body()
    datos: CrearConjuntoGrupoDto,
  ) {
    return this.gruposService.crearConjunto(request.user, cursoId, datos);
  }

  @Put(':conjuntoId')
  actualizarConjunto(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,

    @Body()
    datos: ActualizarConjuntoGrupoDto,
  ) {
    return this.gruposService.actualizarConjunto(
      request.user,
      cursoId,
      conjuntoId,
      datos,
    );
  }

  @Patch(':conjuntoId/bloqueo')
  cambiarBloqueo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,

    @Body()
    datos: CambiarBloqueoConjuntoDto,
  ) {
    return this.gruposService.cambiarBloqueo(
      request.user,
      cursoId,
      conjuntoId,
      datos,
    );
  }

  @Post('importar')
  importarConjunto(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Body()
    datos: ImportarConjuntoGrupoDto,
  ) {
    return this.gruposService.importarConjunto(request.user, cursoId, datos);
  }

  @Get(':conjuntoId/historial')
  obtenerHistorial(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,
  ) {
    return this.gruposService.obtenerHistorial(
      request.user,
      cursoId,
      conjuntoId,
    );
  }

  @Delete(':conjuntoId')
  eliminarConjunto(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,
  ) {
    return this.gruposService.eliminarConjunto(
      request.user,
      cursoId,
      conjuntoId,
    );
  }

  @Post(':conjuntoId/grupos')
  crearGrupo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,

    @Body()
    datos: CrearGrupoCursoDto,
  ) {
    return this.gruposService.crearGrupo(
      request.user,
      cursoId,
      conjuntoId,
      datos,
    );
  }

  @Put(':conjuntoId/grupos/:grupoId')
  actualizarGrupo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,

    @Param('grupoId', ParseIntPipe)
    grupoId: number,

    @Body()
    datos: ActualizarGrupoCursoDto,
  ) {
    return this.gruposService.actualizarGrupo(
      request.user,
      cursoId,
      conjuntoId,
      grupoId,
      datos,
    );
  }

  @Post(':conjuntoId/grupos/:grupoId/estudiantes')
  asignarEstudiantes(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,

    @Param('grupoId', ParseIntPipe)
    grupoId: number,

    @Body()
    datos: AsignarEstudiantesGrupoDto,
  ) {
    return this.gruposService.asignarEstudiantes(
      request.user,
      cursoId,
      conjuntoId,
      grupoId,
      datos,
    );
  }

  @Patch(':conjuntoId/grupos/:grupoId/mover')
  moverEstudiante(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,

    @Param('grupoId', ParseIntPipe)
    grupoId: number,

    @Body()
    datos: MoverEstudianteGrupoDto,
  ) {
    return this.gruposService.moverEstudiante(
      request.user,
      cursoId,
      conjuntoId,
      grupoId,
      datos,
    );
  }

  @Patch(':conjuntoId/grupos/:grupoId/representante')
  cambiarRepresentante(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,

    @Param('grupoId', ParseIntPipe)
    grupoId: number,

    @Body()
    datos: CambiarRepresentanteGrupoDto,
  ) {
    return this.gruposService.cambiarRepresentante(
      request.user,
      cursoId,
      conjuntoId,
      grupoId,
      datos,
    );
  }

  @Delete(':conjuntoId/grupos/:grupoId/estudiantes/:estudianteId')
  retirarEstudiante(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,

    @Param('grupoId', ParseIntPipe)
    grupoId: number,

    @Param('estudianteId', ParseIntPipe)
    estudianteId: number,
  ) {
    return this.gruposService.retirarEstudiante(
      request.user,
      cursoId,
      conjuntoId,
      grupoId,
      estudianteId,
    );
  }

  @Delete(':conjuntoId/grupos/:grupoId')
  eliminarGrupo(
    @Req()
    request: RequestConUsuario,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('conjuntoId', ParseIntPipe)
    conjuntoId: number,

    @Param('grupoId', ParseIntPipe)
    grupoId: number,
  ) {
    return this.gruposService.eliminarGrupo(
      request.user,
      cursoId,
      conjuntoId,
      grupoId,
    );
  }
}
