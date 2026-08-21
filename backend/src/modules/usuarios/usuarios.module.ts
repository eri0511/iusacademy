import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  ReportesModule,
} from '../reportes/reportes.module';

import {
  UsuariosController,
} from './usuarios.controller';

import {
  UsuariosReportesService,
} from './reportes/usuarios-reportes.service';

import {
  UsuariosService,
} from './usuarios.service';

@Module({
  imports: [
    AuthModule,
    ReportesModule,
  ],
  controllers: [
    UsuariosController,
  ],
  providers: [
    UsuariosService,
    UsuariosReportesService,
  ],
  exports: [
    UsuariosService,
    UsuariosReportesService,
  ],
})
export class UsuariosModule {}
