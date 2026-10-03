import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { AnalisisIaService } from './analisis-ia.service';

import type {
  AnalisisCompletoIaRequestDto,
  ResultadoAnalisisIaDto,
} from './dto/analizar-documento.dto';

@Controller('analisis-ia')
export class AnalisisIaController {
  constructor(
    private readonly analisisIaService: AnalisisIaService,
  ) {}

  @Post('probar')
  async probarAnalisis(
    @Body() request: AnalisisCompletoIaRequestDto,
  ): Promise<ResultadoAnalisisIaDto> {
    return this.analisisIaService.analizarDocumento(
      request,
    );
  }
}