import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  AlmacenamientoArchivos,
} from './almacenamiento/almacenamiento.interface';

import {
  AlmacenamientoLocalService,
} from './almacenamiento/almacenamiento-local.service';

import {
  ArchivosController,
} from './archivos.controller';

import {
  ArchivosService,
} from './archivos.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    ArchivosController,
  ],

  providers: [
    ArchivosService,
    AlmacenamientoLocalService,
    {
      provide:
        AlmacenamientoArchivos,

      useExisting:
        AlmacenamientoLocalService,
    },
  ],

  exports: [
    ArchivosService,
    AlmacenamientoArchivos,
  ],
})
export class ArchivosModule {}
