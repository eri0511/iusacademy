import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { ReportesModule } from '../reportes/reportes.module';

import { NotificacionesModule } from '../notificaciones/notificaciones.module';

import { TareasController } from './tareas.controller';

import { TareasEntregasController } from './tareas-entregas.controller';

import { TareasEvaluacionController } from './tareas-evaluacion.controller';

import { TareasRubricasController } from './tareas-rubricas.controller';

import { TareasService } from './tareas.service';

import { TareasEntregasService } from './tareas-entregas.service';

import { TareasEvaluacionService } from './tareas-evaluacion.service';

import { TareasReportesService } from './tareas-reportes.service';

import { TareasRubricasService } from './tareas-rubricas.service';

import { TareasCierreAutomaticoService } from './tareas-cierre-automatico.service';

@Module({
  imports: [AuthModule, ReportesModule, NotificacionesModule],

  controllers: [
    TareasController,
    TareasEntregasController,
    TareasEvaluacionController,
    TareasRubricasController,
  ],

  providers: [
    TareasService,
    TareasEntregasService,
    TareasEvaluacionService,
    TareasReportesService,
    TareasRubricasService,
    TareasCierreAutomaticoService,
  ],

  exports: [
    TareasService,
    TareasEntregasService,
    TareasEvaluacionService,
    TareasReportesService,
    TareasRubricasService,
  ],
})
export class TareasModule {}
