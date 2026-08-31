import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ListarNotificacionesQueryDto } from './dto/listar-notificaciones-query.dto';

import type { RequestAutenticada } from './interfaces/usuario-autenticado.interface';

import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  listar(
    @Req()
    request: RequestAutenticada,

    @Query()
    filtros: ListarNotificacionesQueryDto,
  ) {
    return this.notificacionesService.listar(request.user.id, filtros);
  }

  @Get('no-leidas/conteo')
  contarNoLeidas(
    @Req()
    request: RequestAutenticada,
  ) {
    return this.notificacionesService.contarNoLeidas(request.user.id);
  }

  @Patch(':id/leida')
  marcarLeida(
    @Req()
    request: RequestAutenticada,

    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.notificacionesService.marcarLeida(request.user.id, id);
  }

  @Patch('leer-todas')
  marcarTodasLeidas(
    @Req()
    request: RequestAutenticada,
  ) {
    return this.notificacionesService.marcarTodasLeidas(request.user.id);
  }

  @Delete(':id')
  eliminar(
    @Req()
    request: RequestAutenticada,

    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.notificacionesService.eliminar(request.user.id, id);
  }
}
