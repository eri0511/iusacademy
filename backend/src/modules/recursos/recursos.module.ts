import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { ArchivosModule } from '../archivos/archivos.module';

import { DatasetProcesamientoService } from './dataset-procesamiento.service';

import { RecursosController } from './recursos.controller';

import { RecursosService } from './recursos.service';

@Module({
  imports: [AuthModule, ArchivosModule],

  controllers: [RecursosController],

  providers: [RecursosService, DatasetProcesamientoService],

  exports: [RecursosService, DatasetProcesamientoService],
})
export class RecursosModule {}
