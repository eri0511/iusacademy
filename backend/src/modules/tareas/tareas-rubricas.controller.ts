import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';

import type { Request } from 'express';

import { Rol } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { CalificarRutricaDto } from './dto/calificar-rubrica.dto';

import { CrearRubricaDto } from './dto/crear-rubrica.dto';

import { TareasEvaluacionService } from './tareas-evaluacion.service';

import { TareasRubricasService } from './tareas-rubricas.service';

import type { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

type RequestAutenticada = Request & {
  user: UsuarioAutenticado;
};

@Controller('tareas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TareasRubricasController {
  constructor(
    private readonly rubricasService: TareasRubricasService,

    private readonly evaluacionService: TareasEvaluacionService,
  ) {}

  @Get('rubricas/docente/cursos/:cursoId/:tareaId')
  @Roles(Rol.DOCENTE)
  obtenerRubrica(
    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.rubricasService.obtenerRubrica(tareaId);
  }

  @Post('rubricas/docente/cursos/:cursoId/:tareaId')
  @Roles(Rol.DOCENTE)
  crearRubrica(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,

    @Body()
    datos: CrearRubricaDto,
  ) {
    return this.rubricasService.crearRubrica(
      request.user,
      cursoId,
      tareaId,
      datos,
    );
  }

  @Delete('rubricas/docente/cursos/:cursoId/:tareaId')
  @Roles(Rol.DOCENTE)
  eliminarRubrica(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,
  ) {
    return this.rubricasService.eliminarRubrica(request.user, cursoId, tareaId);
  }

  @Post('rubricas/docente/cursos/:cursoId/:tareaId/importar-excel')
  @Roles(Rol.DOCENTE)
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 4 * 1024 * 1024,
      },
    }),
  )
  importarRubricaDesdeExcel(
    @UploadedFile()
    archivo: Express.Multer.File,
  ) {
    return this.rubricasService.importarRubricaDesdeExcel(archivo);
  }

  @Get('rubricas/docente/cursos/:cursoId/:tareaId/evaluaciones/:entregaId')
  @Roles(Rol.DOCENTE)
  obtenerEvaluacionEntrega(
    @Param('entregaId', ParseIntPipe)
    entregaId: number,
  ) {
    return this.rubricasService.obtenerEvaluacionEntrega(entregaId);
  }

  @Post('rubricas/docente/cursos/:cursoId/:tareaId/evaluar/:entregaId')
  @Roles(Rol.DOCENTE)
  async calificarEntrega(
    @Req()
    request: RequestAutenticada,

    @Param('cursoId', ParseIntPipe)
    cursoId: number,

    @Param('tareaId', ParseIntPipe)
    tareaId: number,

    @Param('entregaId', ParseIntPipe)
    entregaId: number,

    @Body()
    datos: CalificarRutricaDto,
  ) {
    const notaBase = await this.rubricasService.calificarEntregaConRubrica(
      request.user,
      cursoId,
      tareaId,
      entregaId,
      datos,
    );

    return this.evaluacionService.calificarEntrega(
      request.user,
      cursoId,
      tareaId,
      entregaId,
      {
        notaBase,
        retroalimentacion: datos.retroalimentacion,
      },
    );
  }
}
