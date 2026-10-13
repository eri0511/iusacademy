import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Rol } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { AnalisisIaV2Service } from './analisis-ia-v2.service';

import { AnalizarDocumentoV2Dto } from './dto/analizar-documento-v2.dto';

import type { ResultadoAnalisisFinalV11Dto } from './dto/analizar-documento-v2.dto';

@Controller('analisis-ia-v2')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalisisIaV2Controller {
  constructor(private readonly analisisIaV2Service: AnalisisIaV2Service) {}

  @Post('documento')
  @HttpCode(HttpStatus.OK)
  @Roles(Rol.DOCENTE)
  async analizarDocumento(
    @Body() request: AnalizarDocumentoV2Dto,
  ): Promise<ResultadoAnalisisFinalV11Dto> {
    return this.analisisIaV2Service.analizarDocumento(request);
  }
}
