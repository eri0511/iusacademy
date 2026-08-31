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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { memoryStorage } from 'multer';

import { Rol } from '../../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { UsuarioAutenticado } from '../archivos/interfaces/usuario-autenticado.interface';
import { ActualizarContenidoDto } from './dto/actualizar-contenido.dto';
import { ActualizarRecursoDto } from './dto/actualizar-recurso.dto';
import { CambiarVisibilidadRecursoDto } from './dto/cambiar-visibilidad-recurso.dto';
import { CrearContenidoArchivoDto } from './dto/crear-contenido-archivo.dto';
import { CrearContenidoEnlaceDto } from './dto/crear-contenido-enlace.dto';
import { CrearRecursoDto } from './dto/crear-recurso.dto';
import { ReemplazarContenidoDto } from './dto/reemplazar-contenido.dto';
import { RecursosService } from './recursos.service';

type RequestAutenticada = Request & { user: UsuarioAutenticado };
type ArchivoMulter = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Controller('recursos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecursosController {
  constructor(private readonly recursosService: RecursosService) {}

  @Get('cursos/:cursoId')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  listar(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
  ) {
    return this.recursosService.listar(req.user, cursoId);
  }

  @Get('cursos/:cursoId/disponibles-para-quiz')
  @Roles(Rol.DOCENTE)
  disponiblesParaQuiz(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
  ) {
    return this.recursosService.listarDisponiblesParaQuiz(req.user, cursoId);
  }

  @Post('cursos/:cursoId/datasets/:versionId/reintentar')
  @Roles(Rol.DOCENTE)
  reintentarDataset(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('versionId', ParseIntPipe) versionId: number,
  ) {
    return this.recursosService.reintentarDataset(req.user, cursoId, versionId);
  }

  @Get('cursos/:cursoId/:recursoId')
  @Roles(Rol.DOCENTE, Rol.ESTUDIANTE)
  obtener(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('recursoId', ParseIntPipe) recursoId: number,
  ) {
    return this.recursosService.obtener(req.user, cursoId, recursoId);
  }

  @Post('cursos/:cursoId')
  @Roles(Rol.DOCENTE)
  crear(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Body() datos: CrearRecursoDto,
  ) {
    return this.recursosService.crear(req.user, cursoId, datos);
  }

  @Patch('cursos/:cursoId/:recursoId')
  @Roles(Rol.DOCENTE)
  actualizar(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('recursoId', ParseIntPipe) recursoId: number,
    @Body() datos: ActualizarRecursoDto,
  ) {
    return this.recursosService.actualizar(req.user, cursoId, recursoId, datos);
  }

  @Patch('cursos/:cursoId/:recursoId/visibilidad')
  @Roles(Rol.DOCENTE)
  cambiarVisibilidad(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('recursoId', ParseIntPipe) recursoId: number,
    @Body() datos: CambiarVisibilidadRecursoDto,
  ) {
    return this.recursosService.cambiarVisibilidad(
      req.user,
      cursoId,
      recursoId,
      datos.visibleParaEstudiantes,
    );
  }

  @Delete('cursos/:cursoId/:recursoId')
  @Roles(Rol.DOCENTE)
  archivar(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('recursoId', ParseIntPipe) recursoId: number,
  ) {
    return this.recursosService.archivar(req.user, cursoId, recursoId);
  }

  @Post('cursos/:cursoId/:recursoId/contenidos/enlace')
  @Roles(Rol.DOCENTE)
  agregarEnlace(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('recursoId', ParseIntPipe) recursoId: number,
    @Body() datos: CrearContenidoEnlaceDto,
  ) {
    return this.recursosService.agregarEnlace(
      req.user,
      cursoId,
      recursoId,
      datos,
    );
  }

  @Post('cursos/:cursoId/:recursoId/contenidos/archivo')
  @Roles(Rol.DOCENTE)
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  agregarArchivo(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('recursoId', ParseIntPipe) recursoId: number,
    @Body() datos: CrearContenidoArchivoDto,
    @UploadedFile() archivo: ArchivoMulter | undefined,
  ) {
    return this.recursosService.agregarArchivo(
      req.user,
      cursoId,
      recursoId,
      datos,
      archivo,
    );
  }

  @Patch('cursos/:cursoId/:recursoId/contenidos/:contenidoId')
  @Roles(Rol.DOCENTE)
  actualizarContenido(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('recursoId', ParseIntPipe) recursoId: number,
    @Param('contenidoId', ParseIntPipe) contenidoId: number,
    @Body() datos: ActualizarContenidoDto,
  ) {
    return this.recursosService.actualizarContenido(
      req.user,
      cursoId,
      recursoId,
      contenidoId,
      datos,
    );
  }

  @Delete('cursos/:cursoId/:recursoId/contenidos/:contenidoId')
  @Roles(Rol.DOCENTE)
  eliminarContenido(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('recursoId', ParseIntPipe) recursoId: number,
    @Param('contenidoId', ParseIntPipe) contenidoId: number,
  ) {
    return this.recursosService.eliminarContenido(
      req.user,
      cursoId,
      recursoId,
      contenidoId,
    );
  }

  @Post('cursos/:cursoId/:recursoId/contenidos/:contenidoId/reemplazar')
  @Roles(Rol.DOCENTE)
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  reemplazarContenido(
    @Req() req: RequestAutenticada,
    @Param('cursoId', ParseIntPipe) cursoId: number,
    @Param('recursoId', ParseIntPipe) recursoId: number,
    @Param('contenidoId', ParseIntPipe) contenidoId: number,
    @Body() datos: ReemplazarContenidoDto,
    @UploadedFile() archivo: ArchivoMulter | undefined,
  ) {
    return this.recursosService.reemplazarContenido(
      req.user,
      cursoId,
      recursoId,
      contenidoId,
      datos,
      archivo,
    );
  }
}
