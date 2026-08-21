import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  ComentariosController,
} from './comentarios/comentarios.controller';

import {
  ComentariosService,
} from './comentarios/comentarios.service';

import {
  DocenteLecturasController,
  EstudianteLecturasController,
} from './lecturas/lecturas.controller';

import {
  LecturasService,
} from './lecturas/lecturas.service';

import {
  PublicacionesController,
} from './publicaciones/publicaciones.controller';

import {
  PublicacionesService,
} from './publicaciones/publicaciones.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    /*
     * Tablón compartido por hito
     */
    PublicacionesController,

    /*
     * Comentarios del tablón
     */
    ComentariosController,

    /*
     * Lecturas académicas
     */
    EstudianteLecturasController,
    DocenteLecturasController,
  ],

  providers: [
    PublicacionesService,
    ComentariosService,
    LecturasService,
  ],

  exports: [
    PublicacionesService,
    ComentariosService,
    LecturasService,
  ],
})
export class ComunicacionCursoModule {}