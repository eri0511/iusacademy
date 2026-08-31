import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { ReportesModule } from '../reportes/reportes.module';

import { DocenteCursosController } from './cursos/docente-cursos.controller';

import { DocenteCursosService } from './cursos/docente-cursos.service';

import { DocenteEstudiantesReportesService } from './cursos/docente-estudiantes-reportes.service';

@Module({
  imports: [AuthModule, ReportesModule],

  controllers: [DocenteCursosController],

  providers: [DocenteCursosService, DocenteEstudiantesReportesService],

  exports: [DocenteCursosService],
})
export class DocenteModule {}
