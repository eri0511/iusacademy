import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { ReportesModule } from '../reportes/reportes.module';

import { NotificacionesModule } from '../notificaciones/notificaciones.module';

import { AnalisisIaModule } from '../analisis-ia/analisis-ia.module';

import { ArchivosModule } from '../archivos/archivos.module';

import { TareasController } from './tareas.controller';

import { TareasEntregasController } from './tareas-entregas.controller';

import { TareasEvaluacionController } from './tareas-evaluacion.controller';

import { TareasRubricasController } from './tareas-rubricas.controller';

import { TareasExposicionesController } from './tareas-exposiciones.controller';

import { TareasAnalisisController } from './tareas-analisis.controller';

import { TareasService } from './tareas.service';

import { TareasEntregasService } from './tareas-entregas.service';

import { TareasEvaluacionService } from './tareas-evaluacion.service';

import { TareasReportesService } from './tareas-reportes.service';

import { TareasRubricasService } from './tareas-rubricas.service';

import { TareasExposicionesAnalisisService } from './tareas-exposiciones-analisis.service';

import { TareasExposicionesService } from './tareas-exposiciones.service';

import { TareasCierreAutomaticoService } from './tareas-cierre-automatico.service';

import { TareasAnalisisService } from './tareas-analisis.service';

import { AdaptadorContenidoEntregaService } from './analisis/adaptador-contenido-entrega.service';

@Module({
  imports: [
    AuthModule,
    ReportesModule,
    NotificacionesModule,
    AnalisisIaModule,
    ArchivosModule,
  ],

  controllers: [
    TareasController,
    TareasEntregasController,
    TareasEvaluacionController,
    TareasRubricasController,
    TareasExposicionesController,
    TareasAnalisisController,
  ],

  providers: [
    TareasService,
    TareasEntregasService,
    TareasEvaluacionService,
    TareasReportesService,
    TareasRubricasService,
    TareasExposicionesAnalisisService,
    TareasExposicionesService,
    TareasCierreAutomaticoService,
    TareasAnalisisService,
    AdaptadorContenidoEntregaService,
  ],

  exports: [
    TareasService,
    TareasEntregasService,
    TareasEvaluacionService,
    TareasReportesService,
    TareasRubricasService,
    TareasExposicionesAnalisisService,
    TareasExposicionesService,
    TareasAnalisisService,
  ],
})
export class TareasModule {}