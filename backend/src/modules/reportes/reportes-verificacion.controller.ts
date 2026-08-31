import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import type { Request } from 'express';

import { Rol } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { ReportesVerificacionService } from './reportes-verificacion.service';

class AnularReporteDto {
  @IsString({
    message: 'El motivo debe ser un texto.',
  })
  @IsNotEmpty({
    message: 'El motivo de anulación es obligatorio.',
  })
  @MinLength(5, {
    message: 'El motivo debe tener al menos 5 caracteres.',
  })
  @MaxLength(500, {
    message: 'El motivo no puede superar los 500 caracteres.',
  })
  motivo!: string;
}

interface UsuarioAutenticado {
  id: number;
  correo: string;
  rol: Rol;
}

type RequestAutenticado = Request & {
  user: UsuarioAutenticado;
};

@Controller('reportes')
export class ReportesVerificacionController {
  constructor(
    private readonly reportesVerificacionService: ReportesVerificacionService,
  ) {}

  /**
   * Historial protegido para el administrador.
   *
   * GET /reportes/historial
   */
  @Get('historial')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  listar() {
    return this.reportesVerificacionService.listar();
  }

  /**
   * Verificación pública utilizada por el QR.
   *
   * GET /reportes/verificar/:codigo
   */
  @Get('verificar/:codigo')
  verificar(@Param('codigo') codigo: string) {
    return this.reportesVerificacionService.verificar(codigo);
  }

  /**
   * Anulación protegida para el administrador.
   *
   * PATCH /reportes/:codigo/anular
   */
  @Patch(':codigo/anular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  anular(
    @Param('codigo') codigo: string,
    @Body() datos: AnularReporteDto,
    @Req() request: RequestAutenticado,
  ) {
    return this.reportesVerificacionService.anular(
      codigo,
      datos.motivo,
      request.user.id,
    );
  }
}
