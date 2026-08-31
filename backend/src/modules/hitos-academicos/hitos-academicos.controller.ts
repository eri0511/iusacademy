import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { Rol } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { ActualizarPlanificacionDto } from './dto/actualizar-planificacion.dto';

import { CambiarEstadoPlanificacionDto } from './dto/cambiar-estado-planificacion.dto';

import { CrearPlanificacionDto } from './dto/crear-planificacion.dto';

import { HitosAcademicosService } from './hitos-academicos.service';

@Controller('admin/hitos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR)
export class HitosAcademicosController {
  constructor(
    private readonly hitosAcademicosService: HitosAcademicosService,
  ) {}

  @Get()
  obtenerTodas() {
    return this.hitosAcademicosService.obtenerTodas();
  }

  /*
   * Esta ruta debe estar antes de las rutas dinámicas
   * que solamente reciben un identificador.
   */
  @Get('gestion/:gestion')
  obtenerPorGestion(
    @Param('gestion')
    gestion: string,
  ) {
    return this.hitosAcademicosService.obtenerPorGestion(gestion);
  }

  @Post()
  crear(
    @Body()
    datos: CrearPlanificacionDto,
  ) {
    return this.hitosAcademicosService.crear(datos);
  }

  @Put(':planificacionId')
  actualizar(
    @Param('planificacionId', ParseIntPipe)
    planificacionId: number,

    @Body()
    datos: ActualizarPlanificacionDto,
  ) {
    return this.hitosAcademicosService.actualizar(planificacionId, datos);
  }

  @Patch(':planificacionId/estado')
  cambiarEstado(
    @Param('planificacionId', ParseIntPipe)
    planificacionId: number,

    @Body()
    datos: CambiarEstadoPlanificacionDto,
  ) {
    return this.hitosAcademicosService.cambiarEstado(planificacionId, datos);
  }
}
