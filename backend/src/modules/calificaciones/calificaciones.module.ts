import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  CalificacionesController,
} from './calificaciones.controller';

import {
  CalificacionesService,
} from './calificaciones.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    CalificacionesController,
  ],

  providers: [
    CalificacionesService,
  ],

  exports: [
    CalificacionesService,
  ],
})
export class CalificacionesModule {}
