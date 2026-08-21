import {
  Controller,
  Get,
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
  DashboardService,
} from './dashboard.service';

@Controller('admin/dashboard')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@Roles(
  Rol.ADMINISTRADOR,
)
export class DashboardController {
  constructor(
    private readonly dashboardService:
      DashboardService,
  ) {}

  @Get()
  obtenerResumen() {
    return this.dashboardService
      .obtenerResumen();
  }
}