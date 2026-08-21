import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
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
  enviarArchivoReporte,
} from '../reportes';

import {
  ActivarCuentaDto,
} from './dto/activar-cuenta.dto';

import {
  ActualizarUsuarioDto,
} from './dto/actualizar-usuario.dto';

import {
  CambiarEstadoUsuarioDto,
} from './dto/cambiar-estado-usuario.dto';

import {
  CrearUsuarioDto,
} from './dto/crear-usuario.dto';

import {
  ExportarUsuariosDto,
  FormatoUsuariosReporteDto,
} from './dto/exportar-usuarios.dto';

import type {
  UsuarioAutenticado,
} from './interfaces/usuario-autenticado.interface';

import {
  UsuariosReportesService,
} from './reportes/usuarios-reportes.service';

import {
  UsuariosService,
} from './usuarios.service';

type SolicitudAutenticada = Request & {
  user: UsuarioAutenticado;
};

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly usuariosReportesService: UsuariosReportesService,
  ) {}

  @Get('exportar/:formato')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  async exportarReporteGeneral(
    @Param() ruta: FormatoUsuariosReporteDto,
    @Query() filtros: ExportarUsuariosDto,
    @Req() solicitud: SolicitudAutenticada,
    @Res() respuesta: Response,
  ): Promise<void> {
    const archivo = await this.usuariosReportesService.generarReporteGeneral(
      ruta.formato,
      filtros,
      solicitud.user,
    );

    enviarArchivoReporte(respuesta, archivo);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  obtenerTodos() {
    return this.usuariosService.obtenerTodos();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  crearUsuario(@Body() datos: CrearUsuarioDto) {
    return this.usuariosService.crearUsuario(datos);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  actualizarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarUsuarioDto,
  ) {
    return this.usuariosService.actualizarUsuario(id, datos);
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: CambiarEstadoUsuarioDto,
  ) {
    return this.usuariosService.cambiarEstado(id, datos.estaActivo);
  }

  @Post(':id/enviar-activacion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  enviarActivacion(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.enviarActivacion(id);
  }

  @Post('activar-cuenta')
  activarCuenta(@Body() datos: ActivarCuentaDto) {
    return this.usuariosService.activarCuenta(datos);
  }
}
