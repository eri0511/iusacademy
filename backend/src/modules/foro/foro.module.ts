import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  CalificacionesModule,
} from '../calificaciones/calificaciones.module';

import {
  ReportesModule,
} from '../reportes/reportes.module';

import {
  ForoAdministracionService,
} from './foro-administracion.service';

import {
  ForoCalificacionMasivaService,
} from './foro-calificacion-masiva.service';

import {
  ForoCalificacionService,
} from './foro-calificacion.service';

import {
  ForoCicloVidaService,
} from './foro-ciclo-vida.service';
import { ForoCierreAutomaticoService } from './foro-cierre-automatico.service';

import {
  ForoComentariosService,
} from './foro-comentarios.service';

import {
  ForoController,
} from './foro.controller';

import {
  ForoEstadisticasService,
} from './foro-estadisticas.service';

import {
  ForoReglasService,
} from './foro-reglas.service';

import {
  ForoLibroCalificacionesService,
} from './foro-libro-calificaciones.service';

import {
  ForoLecturasService,
} from './foro-lecturas.service';

import {
  ForoModeracionService,
} from './foro-moderacion.service';

import {
  ForoPublicacionNotasService,
} from './foro-publicacion-notas.service';

import {
  ForoRespuestasService,
} from './foro-respuestas.service';

import {
  ForoReportesService,
} from './foro-reportes.service';

import {
  ForoService,
} from './foro.service';

@Module({
  imports: [
    AuthModule,
    CalificacionesModule,
    ReportesModule,
  ],

  controllers: [
    ForoController,
  ],

  providers: [
    ForoService,
    ForoAdministracionService,
    ForoCalificacionService,
    ForoCalificacionMasivaService,
    ForoCicloVidaService,
    ForoCierreAutomaticoService,
    ForoModeracionService,
    ForoLibroCalificacionesService,
    ForoPublicacionNotasService,
    ForoReglasService,
    ForoRespuestasService,
    ForoComentariosService,
    ForoLecturasService,
    ForoEstadisticasService,
    ForoReportesService,
  ],

  exports: [
    ForoService,
    ForoAdministracionService,
    ForoCalificacionService,
    ForoCalificacionMasivaService,
    ForoCicloVidaService,
    ForoCierreAutomaticoService,
    ForoModeracionService,
    ForoLibroCalificacionesService,
    ForoPublicacionNotasService,
    ForoReglasService,
    ForoRespuestasService,
    ForoComentariosService,
    ForoLecturasService,
    ForoEstadisticasService,
  ],
})
export class ForoModule {}
