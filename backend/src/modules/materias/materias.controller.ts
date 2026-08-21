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

import {
  Rol,
} from '../../generated/prisma/client';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import {
  ActualizarMateriaDto,
} from './dto/actualizar-materia.dto';

import {
  CambiarEstadoMateriaDto,
} from './dto/cambiar-estado-materia.dto';

import {
  CrearMateriaDto,
} from './dto/crear-materia.dto';

import {
  MateriasService,
} from './materias.service';

@Controller('materias')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class MateriasController {
  constructor(
    private readonly materiasService:
      MateriasService,
  ) {}

  @Get()
  obtenerTodas() {
    return this.materiasService.obtenerTodas();
  }

  @Get(':id')
  obtenerPorId(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.materiasService.obtenerPorId(
      id,
    );
  }

  @Post()
  @Roles(
    Rol.ADMINISTRADOR,
  )
  crear(
    @Body()
    datos: CrearMateriaDto,
  ) {
    return this.materiasService.crear(
      datos,
    );
  }

  @Put(':id')
  @Roles(
    Rol.ADMINISTRADOR,
  )
  actualizar(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    datos: ActualizarMateriaDto,
  ) {
    return this.materiasService.actualizar(
      id,
      datos,
    );
  }

  @Patch(':id/estado')
  @Roles(
    Rol.ADMINISTRADOR,
  )
  cambiarEstado(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    datos: CambiarEstadoMateriaDto,
  ) {
    return this.materiasService.cambiarEstado(
      id,
      datos.estado,
    );
  }
}