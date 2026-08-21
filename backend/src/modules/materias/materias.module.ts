import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  MateriasController,
} from './materias.controller';

import {
  MateriasService,
} from './materias.service';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    MateriasController,
  ],

  providers: [
    MateriasService,
  ],

  exports: [
    MateriasService,
  ],
})
export class MateriasModule {}