import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  CursosController,
} from './cursos.controller';

import {
  CursosService,
} from './cursos.service';

import {
  CursosReportesService,
} from './reportes/cursos-reportes.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    CursosController,
  ],

  providers: [
    CursosService,
    CursosReportesService,
  ],

  exports: [
    CursosService,
    CursosReportesService,
  ],
})
export class CursosModule {}