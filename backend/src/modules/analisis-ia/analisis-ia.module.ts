import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { HttpModule } from '@nestjs/axios';

import { AnalisisIaController } from './analisis-ia.controller';

import { AnalisisIaService } from './analisis-ia.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
  ],

  controllers: [
    AnalisisIaController,
  ],

  providers: [
    AnalisisIaService,
  ],

  exports: [
    AnalisisIaService,
  ],
})
export class AnalisisIaModule {}