import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import type {
  Request,
  Response,
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
  DocenteCursosService,
} from './docente-cursos.service';

import {
  DocenteEstudiantesReportesService,
} from './docente-estudiantes-reportes.service';

import {
  enviarArchivoReporte,
} from '../../reportes/helpers/respuesta-reporte.helper';

import {
  GenerarCodigoInscripcionDto,
} from './dto/generar-codigo-inscripcion.dto';

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
  'docente/cursos',
)
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@Roles(
  Rol.DOCENTE,
)
export class DocenteCursosController {
  constructor(
    private readonly docenteCursosService:
      DocenteCursosService,

    private readonly docenteEstudiantesReportesService:
      DocenteEstudiantesReportesService,
  ) {}

  @Get()
  obtenerMisCursos(
    @Req()
    request:
      RequestConUsuario,
  ) {
    return this.docenteCursosService
      .obtenerMisCursos(
        request.user.id,
      );
  }

  @Get(':id/estudiantes')
  obtenerEstudiantesCurso(
    @Req()
    request:
      RequestConUsuario,

    @Param(
      'id',
      ParseIntPipe,
    )
    cursoId:
      number,
  ) {
    return this.docenteCursosService
      .obtenerEstudiantesCurso(
        request.user.id,
        cursoId,
      );
  }

  @Get(
    ':id/estudiantes/exportar/:formato',
  )
  async exportarEstudiantesCurso(
    @Req()
    request:
      RequestConUsuario,

    @Param(
      'id',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Param(
      'formato',
    )
    formato:
      string,

    @Res()
    response:
      Response,
  ) {
    const archivo =
      await this.docenteEstudiantesReportesService.generarReporte(
        request.user,
        cursoId,
        formato,
      );

    enviarArchivoReporte(
      response,
      archivo,
    );
  }

  @Post(
    ':id/codigo-inscripcion',
  )
  generarCodigoInscripcion(
    @Req()
    request:
      RequestConUsuario,

    @Param(
      'id',
      ParseIntPipe,
    )
    cursoId:
      number,

    @Body()
    datos:
      GenerarCodigoInscripcionDto,
  ) {
    return this.docenteCursosService
      .generarCodigoInscripcion(
        request.user.id,
        cursoId,
        datos,
      );
  }

  @Patch(
    ':id/codigo-inscripcion/desactivar',
  )
  desactivarCodigoInscripcion(
    @Req()
    request:
      RequestConUsuario,

    @Param(
      'id',
      ParseIntPipe,
    )
    cursoId:
      number,
  ) {
    return this.docenteCursosService
      .desactivarCodigoInscripcion(
        request.user.id,
        cursoId,
      );
  }

  /*
   * Esta ruta se declara al final porque
   * es la ruta dinámica más general.
   */
  @Get(':id')
  obtenerMiCursoPorId(
    @Req()
    request:
      RequestConUsuario,

    @Param(
      'id',
      ParseIntPipe,
    )
    cursoId:
      number,
  ) {
    return this.docenteCursosService
      .obtenerMiCursoPorId(
        request.user.id,
        cursoId,
      );
  }
}