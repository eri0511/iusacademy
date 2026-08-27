import {
  Module,
} from '@nestjs/common';

import {
  ConfigModule,
} from '@nestjs/config';

import {
  AppController,
} from './app.controller';

import {
  AppService,
} from './app.service';

import {
  PrismaModule,
} from './prisma/prisma.module';

import {
  AuthModule,
} from './modules/auth/auth.module';

import {
  CorreoModule,
} from './modules/correo/correo.module';

import {
  PerfilModule,
} from './modules/perfil/perfil.module';

import {
  UsuariosModule,
} from './modules/usuarios/usuarios.module';

import {
  MateriasModule,
} from './modules/materias/materias.module';

import {
  CursosModule,
} from './modules/cursos/cursos.module';

import {
  DashboardModule,
} from './modules/dashboard/dashboard.module';

import {
  HitosAcademicosModule,
} from './modules/hitos-academicos/hitos-academicos.module';

import {
  DocenteModule,
} from './modules/docente/docente.module';

import {
  EstudianteModule,
} from './modules/estudiante/estudiante.module';

import {
  AulaCursoModule,
} from './modules/aula-curso/aula-curso.module';

import {
  ComunicacionCursoModule,
} from './modules/comunicacion-curso/comunicacion-curso.module';

import {
  GruposModule,
} from './modules/grupos/grupos.module';

import {
  CalificacionesModule,
} from './modules/calificaciones/calificaciones.module';

import {
  ForoModule,
} from './modules/foro/foro.module';

import {
  ArchivosModule,
} from './modules/archivos/archivos.module';

import {
  RecursosModule,
} from './modules/recursos/recursos.module';

import {
  TareasModule,
} from './modules/tareas/tareas.module';

import {
  QuizzesModule,
} from './modules/quizzes/quizzes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:
        true,
    }),

    PrismaModule,

    AuthModule,

    CorreoModule,

    PerfilModule,

    UsuariosModule,

    MateriasModule,

    CursosModule,

    DashboardModule,

    HitosAcademicosModule,

    DocenteModule,

    EstudianteModule,

    AulaCursoModule,

    ComunicacionCursoModule,

    GruposModule,

    CalificacionesModule,

    ForoModule,

    ArchivosModule,

    RecursosModule,

    TareasModule,

    QuizzesModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}