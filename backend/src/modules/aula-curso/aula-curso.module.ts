import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { AulaCursoController } from './aula-curso.controller';

import { AulaInicioDocenteService } from './aula-inicio-docente.service';

import { AulaInicioEstudianteService } from './aula-inicio-estudiante.service';

import { AulaCursoService } from './aula-curso.service';

@Module({
  imports: [AuthModule],

  controllers: [AulaCursoController],

  providers: [
    AulaCursoService,
    AulaInicioDocenteService,
    AulaInicioEstudianteService,
  ],

  exports: [AulaCursoService],
})
export class AulaCursoModule {}
