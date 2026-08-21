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

/*
 * Infraestructura global
 */
import {
  PrismaModule,
} from './prisma/prisma.module';

/*
 * Servicios compartidos
 */
import {
  AuthModule,
} from './modules/auth/auth.module';

import {
  CorreoModule,
} from './modules/correo/correo.module';

import {
  PerfilModule,
} from './modules/perfil/perfil.module';

/*
 * Administración académica
 */
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

/*
 * Módulos por rol
 */
import {
  DocenteModule,
} from './modules/docente/docente.module';

import {
  EstudianteModule,
} from './modules/estudiante/estudiante.module';

/*
 * Aula compartida
 */
import {
  AulaCursoModule,
} from './modules/aula-curso/aula-curso.module';

/*
 * Comunicación académica compartida
 */
import {
  ComunicacionCursoModule,
} from './modules/comunicacion-curso/comunicacion-curso.module';

/*
 * Organización de grupos
 */
import {
  GruposModule,
} from './modules/grupos/grupos.module';

/*
 * Libro de calificaciones
 */
import {
  CalificacionesModule,
} from './modules/calificaciones/calificaciones.module';

/*
 * Foro académico
 */
import {
  ForoModule,
} from './modules/foro/foro.module';

/*
 * Gestor central de archivos
 */
import {
  ArchivosModule,
} from './modules/archivos/archivos.module';


/*
 * Recursos académicos
 */
import {
  RecursosModule,
} from './modules/recursos/recursos.module';

/*
 * Tareas académicas
 */
import {
  TareasModule,
} from './modules/tareas/tareas.module';

@Module({
  imports: [
    /*
     * Configuración global
     */
    ConfigModule.forRoot({
      isGlobal:
        true,
    }),

    /*
     * Infraestructura
     */
    PrismaModule,

    /*
     * Servicios compartidos
     */
    AuthModule,
    CorreoModule,
    PerfilModule,

    /*
     * Administración académica
     */
    UsuariosModule,
    MateriasModule,
    CursosModule,
    DashboardModule,
    HitosAcademicosModule,

    /*
     * Módulos por rol
     */
    DocenteModule,
    EstudianteModule,

    /*
     * Aula compartida entre docente y estudiante
     */
    AulaCursoModule,

    /*
     * Tablón y comunicación académica
     */
    ComunicacionCursoModule,

    /*
     * Grupos del curso y por hito
     */
    GruposModule,

    /*
     * Libro de calificaciones
     */
    CalificacionesModule,

    /*
     * Foro académico
     */
    ForoModule,

    /*
     * Gestor central y reutilizable de archivos
     */
    ArchivosModule,

    /*
     * Recursos académicos
     */
    RecursosModule,

    /*
     * Tareas académicas
     */
    TareasModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}