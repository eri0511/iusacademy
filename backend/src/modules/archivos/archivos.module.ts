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

import {
  ProcesadorPdfService,
} from './procesamiento/procesador-pdf.service';

import {
  OcrPdfService,
} from './procesamiento/ocr-pdf.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    ArchivosController,
  ],

  providers: [
    ArchivosService,
    ProcesadorPdfService,
    OcrPdfService,
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
