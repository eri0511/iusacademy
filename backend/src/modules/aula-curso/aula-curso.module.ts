import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  AulaCursoController,
} from './aula-curso.controller';

import {
  AulaCursoService,
} from './aula-curso.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    AulaCursoController,
  ],

  providers: [
    AulaCursoService,
  ],

  exports: [
    AulaCursoService,
  ],
})
export class AulaCursoModule {}