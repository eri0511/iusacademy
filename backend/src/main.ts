import { ValidationPipe } from '@nestjs/common';

import { NestFactory } from '@nestjs/core';

import { NestExpressApplication } from '@nestjs/platform-express';

import { join } from 'node:path';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',

    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,

      forbidNonWhitelisted: true,

      transform: true,
    }),
  );

  /*
   * ============================================================
   * ARCHIVOS ESTÁTICOS
   * ============================================================
   *
   * Fotografías de perfil:
   *
   *   backend/uploads/perfiles/...
   *
   * se exponen como:
   *
   *   http://localhost:3000/uploads/perfiles/...
   */
  app.useStaticAssets(join(process.cwd(), 'uploads', 'perfiles'), {
    prefix: '/uploads/perfiles/',
  });

  /*
   * ============================================================
   * ARCHIVOS DE RESPUESTAS DEL FORO
   * ============================================================
   *
   * El módulo Archivos guarda las evidencias de las respuestas en:
   *
   *   backend/uploads/foro/respuestas/...
   *
   * mientras que PostgreSQL conserva rutas como:
   *
   *   /uploads/foro/respuestas/6/archivo.jpeg
   *
   * Por eso debemos asociar específicamente esa URL con
   * su directorio físico.
   *
   * IMPORTANTE:
   * No publicamos toda la carpeta /uploads.
   */
  app.useStaticAssets(join(process.cwd(), 'uploads', 'foro', 'respuestas'), {
    prefix: '/uploads/foro/respuestas/',
  });

  /*
   * ============================================================
   * ARCHIVOS DE TAREAS
   * ============================================================
   *
   * Por ahora NO exponemos /uploads/tareas como carpeta pública.
   *
   * Las tareas podrán contener:
   *
   * - documentos del docente;
   * - memoriales;
   * - informes;
   * - documentos colaborativos;
   * - entregas individuales;
   * - entregas grupales.
   *
   * Cuando implementemos la etapa de entregas y archivos,
   * estos recursos deberán servirse mediante el módulo Archivos
   * con validación de permisos, evitando que un estudiante pueda
   * acceder a una entrega ajena simplemente conociendo su URL.
   */

  const puerto = process.env.PORT ?? 3000;

  await app.listen(puerto);

  console.log(`🚀 Servidor ejecutándose en http://localhost:${puerto}`);

  console.log(
    `🖼️ Fotografías disponibles en http://localhost:${puerto}/uploads/perfiles`,
  );

  console.log(
    `📎 Archivos de respuestas disponibles en http://localhost:${puerto}/uploads/foro/respuestas`,
  );

  console.log(
    '🔐 Los archivos privados de Tareas se servirán mediante endpoints protegidos.',
  );
}

void bootstrap();
