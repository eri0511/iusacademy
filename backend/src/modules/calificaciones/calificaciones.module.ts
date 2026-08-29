import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  ReportesModule,
} from '../reportes/reportes.module';

import {
  CalificacionesController,
} from './calificaciones.controller';

import {
  CalificacionesReportesService,
} from './calificaciones-reportes.service';

import {
  CalificacionesService,
} from './calificaciones.service';

@Module({
  imports: [
    AuthModule,
    ReportesModule,
  ],

  controllers: [
    CalificacionesController,
  ],

  providers: [
    CalificacionesService,
    CalificacionesReportesService,
  ],

  exports: [
    CalificacionesService,
  ],
})
export class CalificacionesModule {}
