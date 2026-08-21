import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  ForoModule,
} from '../foro/foro.module';

import {
  EquiposAfinidadController,
} from './equipos-afinidad.controller';

import {
  EquiposAfinidadService,
} from './equipos-afinidad.service';

import {
  EquiposAfinidadTareaService,
} from './equipos-afinidad-tarea.service';

import {
  GruposController,
} from './grupos.controller';

import {
  GruposService,
} from './grupos.service';

@Module({
  imports: [
    AuthModule,
    ForoModule,
  ],

  controllers: [
    GruposController,
    EquiposAfinidadController,
  ],

  providers: [
    GruposService,
    EquiposAfinidadService,
    EquiposAfinidadTareaService,
  ],

  exports: [
    GruposService,
    EquiposAfinidadService,
    EquiposAfinidadTareaService,
  ],
})
export class GruposModule {}