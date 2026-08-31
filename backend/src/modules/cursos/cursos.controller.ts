import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import { Rol } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { ActualizarCursoDto } from './dto/actualizar-curso.dto';

import { CambiarEstadoCursoDto } from './dto/cambiar-estado-curso.dto';

import { CrearCursoDto } from './dto/crear-curso.dto';

import { CursosReportesService } from './reportes/cursos-reportes.service';

import { CursosService } from './cursos.service';

@Controller('cursos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR)
export class CursosController {
  constructor(
    private readonly cursosService: CursosService,

    private readonly cursosReportesService: CursosReportesService,
  ) {}

  /*
   * Reporte general de todos los cursos
   * en formato PDF.
   *
   * Debe declararse antes de @Get(':id')
   * para evitar que "exportar" sea interpretado
   * como un identificador.
   */
  @Get('exportar/pdf')
  async exportarPdfGeneral(): Promise<StreamableFile> {
    const archivo = await this.cursosReportesService.generarPdfGeneral();

    return new StreamableFile(archivo, {
      type: 'application/pdf',

      disposition:
        'attachment; filename="reporte-general-cursos-iusacademy.pdf"',

      length: archivo.length,
    });
  }

  /*
   * Reporte general de todos los cursos
   * en formato Excel.
   */
  @Get('exportar/excel')
  async exportarExcelGeneral(): Promise<StreamableFile> {
    const archivo = await this.cursosReportesService.generarExcelGeneral();

    return new StreamableFile(archivo, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

      disposition:
        'attachment; filename="reporte-general-cursos-iusacademy.xlsx"',

      length: archivo.length,
    });
  }

  /*
   * Ficha PDF individual.
   *
   * El servicio valida que el curso
   * se encuentre FINALIZADO.
   */
  @Get(':id/exportar/pdf')
  async exportarPdfCurso(
    @Param('id', ParseIntPipe)
    id: number,
  ): Promise<StreamableFile> {
    const archivo = await this.cursosReportesService.generarPdfCurso(id);

    return new StreamableFile(archivo, {
      type: 'application/pdf',

      disposition: `attachment; filename="ficha-historica-curso-${id}-iusacademy.pdf"`,

      length: archivo.length,
    });
  }

  @Get()
  obtenerTodos() {
    return this.cursosService.obtenerTodos();
  }

  @Get(':id')
  obtenerPorId(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.cursosService.obtenerPorId(id);
  }

  @Post()
  crear(
    @Body()
    datos: CrearCursoDto,
  ) {
    return this.cursosService.crear(datos);
  }

  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    datos: ActualizarCursoDto,
  ) {
    return this.cursosService.actualizar(id, datos);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    datos: CambiarEstadoCursoDto,
  ) {
    return this.cursosService.cambiarEstado(id, datos.estado);
  }
}
