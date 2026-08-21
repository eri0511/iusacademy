import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  EstudianteInscripcionesController,
} from './inscripciones/estudiante-inscripciones.controller';

import {
  EstudianteInscripcionesService,
} from './inscripciones/estudiante-inscripciones.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    EstudianteInscripcionesController,
  ],

  providers: [
    EstudianteInscripcionesService,
  ],

  exports: [
    EstudianteInscripcionesService,
  ],
})
export class EstudianteModule {}