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
  TareasController,
} from './tareas.controller';

import {
  TareasEntregasController,
} from './tareas-entregas.controller';

import {
  TareasEvaluacionController,
} from './tareas-evaluacion.controller';

import {
  TareasService,
} from './tareas.service';

import {
  TareasEntregasService,
} from './tareas-entregas.service';

import {
  TareasEvaluacionService,
} from './tareas-evaluacion.service';

import {
  TareasReportesService,
} from './tareas-reportes.service';

@Module({
  imports: [
    AuthModule,
    ReportesModule,
  ],

  controllers: [
    TareasController,
    TareasEntregasController,
    TareasEvaluacionController,
  ],

  providers: [
    TareasService,
    TareasEntregasService,
    TareasEvaluacionService,
    TareasReportesService,
  ],

  exports: [
    TareasService,
    TareasEntregasService,
    TareasEvaluacionService,
    TareasReportesService,
  ],
})
export class TareasModule {}