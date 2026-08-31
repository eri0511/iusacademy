import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { Rol } from '../../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AnularReporteDto } from './dto/anular-reporte.dto';
import { ReportesVerificacionService } from './reportes-verificacion.service';

type SolicitudAdministrador = Request & {
  user: { id: number; rol: Rol };
};

@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly verificacionService: ReportesVerificacionService,
  ) {}

  @Get('verificar/:codigo')
  verificar(@Param('codigo') codigo: string) {
    return this.verificacionService.verificar(codigo);
  }

  @Patch(':codigo/anular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  anular(
    @Param('codigo') codigo: string,
    @Body() datos: AnularReporteDto,
    @Req() solicitud: SolicitudAdministrador,
  ) {
    return this.verificacionService.anular(
      codigo,
      datos.motivo,
      solicitud.user.id,
    );
  }
}
