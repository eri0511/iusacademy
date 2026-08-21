import 'dotenv/config';

import * as argon2 from 'argon2';

import {
  PrismaPg,
} from '@prisma/adapter-pg';

import {
  PrismaClient,
  Rol,
} from '../src/generated/prisma/client';

const databaseUrl =
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'La variable DATABASE_URL no está configurada en backend/.env',
  );
}

const adapter =
  new PrismaPg({
    connectionString:
      databaseUrl,
  });

const prisma =
  new PrismaClient({
    adapter,
  });

type UsuarioSemilla = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  correo: string;
  rol: Rol;
  password: string;
};

const ADMIN_PASSWORD =
  'AdminPrueba123!';

const DOCENTE_PASSWORD =
  'Docente123!';

const ESTUDIANTE_PASSWORD =
  'Estudiante123!';

const administrador:
  UsuarioSemilla = {
    nombres:
      'Administración',

    apellidoPaterno:
      'Pruebas',

    apellidoMaterno:
      'IusAcademy',

    correo:
      'cbbe.admin.pruebas@unifranz.edu.bo',

    rol:
      Rol.ADMINISTRADOR,

    password:
      ADMIN_PASSWORD,
  };

const docentes:
  UsuarioSemilla[] = [
    {
      nombres:
        'Juan Pablo',

      apellidoPaterno:
        'Saravia',

      apellidoMaterno:
        'Manuel',

      correo:
        'cbbe.juanpablo.saravia.ma@unifranz.edu.bo',

      rol:
        Rol.DOCENTE,

      password:
        DOCENTE_PASSWORD,
    },
    {
      nombres:
        'María Fernanda',

      apellidoPaterno:
        'López',

      apellidoMaterno:
        'Rojas',

      correo:
        'cbbe.mariafernanda.lopez.ro@unifranz.edu.bo',

      rol:
        Rol.DOCENTE,

      password:
        DOCENTE_PASSWORD,
    },
    {
      nombres:
        'Carlos Andrés',

      apellidoPaterno:
        'Mendoza',

      apellidoMaterno:
        'Vargas',

      correo:
        'cbbe.carlosandres.mendoza.va@unifranz.edu.bo',

      rol:
        Rol.DOCENTE,

      password:
        DOCENTE_PASSWORD,
    },
    {
      nombres:
        'Ana Lucía',

      apellidoPaterno:
        'Rojas',

      apellidoMaterno:
        'Flores',

      correo:
        'cbbe.analucia.rojas.fl@unifranz.edu.bo',

      rol:
        Rol.DOCENTE,

      password:
        DOCENTE_PASSWORD,
    },
    {
      nombres:
        'Jorge Luis',

      apellidoPaterno:
        'Vargas',

      apellidoMaterno:
        'Paredes',

      correo:
        'cbbe.jorgeluis.vargas.pa@unifranz.edu.bo',

      rol:
        Rol.DOCENTE,

      password:
        DOCENTE_PASSWORD,
    },
  ];

const estudiantes:
  UsuarioSemilla[] = [
    {
      nombres: 'Andrea',
      apellidoPaterno: 'Alarcón',
      apellidoMaterno: 'Mamani',
      correo:
        'cbbe.andrea.alarcon.ma@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Bruno',
      apellidoPaterno: 'Arce',
      apellidoMaterno: 'Rojas',
      correo:
        'cbbe.bruno.arce.ro@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Camila',
      apellidoPaterno: 'Céspedes',
      apellidoMaterno: 'Vargas',
      correo:
        'cbbe.camila.cespedes.va@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Diego',
      apellidoPaterno: 'Flores',
      apellidoMaterno: 'Quispe',
      correo:
        'cbbe.diego.flores.qu@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Elena',
      apellidoPaterno: 'García',
      apellidoMaterno: 'López',
      correo:
        'cbbe.elena.garcia.lo@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Fernando',
      apellidoPaterno: 'Guzmán',
      apellidoMaterno: 'Pérez',
      correo:
        'cbbe.fernando.guzman.pe@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Gabriela',
      apellidoPaterno: 'Herrera',
      apellidoMaterno: 'Soto',
      correo:
        'cbbe.gabriela.herrera.so@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Hugo',
      apellidoPaterno: 'López',
      apellidoMaterno: 'Molina',
      correo:
        'cbbe.hugo.lopez.mo@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Isabel',
      apellidoPaterno: 'Mamani',
      apellidoMaterno: 'Torrez',
      correo:
        'cbbe.isabel.mamani.to@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'José',
      apellidoPaterno: 'Mendoza',
      apellidoMaterno: 'Arce',
      correo:
        'cbbe.jose.mendoza.ar@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Karen',
      apellidoPaterno: 'Paredes',
      apellidoMaterno: 'Flores',
      correo:
        'cbbe.karen.paredes.fl@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Luis',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'Gutiérrez',
      correo:
        'cbbe.luis.perez.gu@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Mariana',
      apellidoPaterno: 'Quispe',
      apellidoMaterno: 'Rojas',
      correo:
        'cbbe.mariana.quispe.ro@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Nicolás',
      apellidoPaterno: 'Ramírez',
      apellidoMaterno: 'Vargas',
      correo:
        'cbbe.nicolas.ramirez.va@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Olivia',
      apellidoPaterno: 'Rojas',
      apellidoMaterno: 'Mamani',
      correo:
        'cbbe.olivia.rojas.ma@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Pablo',
      apellidoPaterno: 'Salazar',
      apellidoMaterno: 'López',
      correo:
        'cbbe.pablo.salazar.lo@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Rocío',
      apellidoPaterno: 'Sánchez',
      apellidoMaterno: 'Torrez',
      correo:
        'cbbe.rocio.sanchez.to@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Santiago',
      apellidoPaterno: 'Soto',
      apellidoMaterno: 'Arce',
      correo:
        'cbbe.santiago.soto.ar@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Valeria',
      apellidoPaterno: 'Torrez',
      apellidoMaterno: 'Guzmán',
      correo:
        'cbbe.valeria.torrez.gu@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
    {
      nombres: 'Ximena',
      apellidoPaterno: 'Vargas',
      apellidoMaterno: 'Céspedes',
      correo:
        'cbbe.ximena.vargas.ce@unifranz.edu.bo',
      rol: Rol.ESTUDIANTE,
      password: ESTUDIANTE_PASSWORD,
    },
  ];

async function crearOActualizarUsuario(
  usuario:
    UsuarioSemilla,
): Promise<void> {
  const correo =
    usuario.correo
      .trim()
      .toLowerCase();

  const passwordHash =
    await argon2.hash(
      usuario.password,
      {
        type:
          argon2.argon2id,
      },
    );

  await prisma.usuario.upsert({
    where: {
      correo,
    },

    update: {
      nombres:
        usuario.nombres.trim(),

      apellidoPaterno:
        usuario.apellidoPaterno.trim(),

      apellidoMaterno:
        usuario.apellidoMaterno
          ?.trim() ||
        null,

      rol:
        usuario.rol,

      estaActivo:
        true,

      cuentaActivada:
        true,

      passwordHash,

      tokenActivacionHash:
        null,

      tokenActivacionExpira:
        null,

      accesoEnviadoEn:
        null,

      passwordCambiadaEn:
        new Date(),
    },

    create: {
      nombres:
        usuario.nombres.trim(),

      apellidoPaterno:
        usuario.apellidoPaterno.trim(),

      apellidoMaterno:
        usuario.apellidoMaterno
          ?.trim() ||
        null,

      correo,

      rol:
        usuario.rol,

      estaActivo:
        true,

      cuentaActivada:
        true,

      passwordHash,

      tokenActivacionHash:
        null,

      tokenActivacionExpira:
        null,

      accesoEnviadoEn:
        null,

      passwordCambiadaEn:
        new Date(),
    },
  });

  console.log(
    `✅ ${usuario.rol}: ${correo}`,
  );
}

async function main():
  Promise<void> {
  console.log(
    '🌱 Iniciando seed de IusAcademy...',
  );

  const usuarios:
    UsuarioSemilla[] = [
      administrador,
      ...docentes,
      ...estudiantes,
    ];

  for (
    const usuario of usuarios
  ) {
    await crearOActualizarUsuario(
      usuario,
    );
  }

  console.log('');
  console.log(
    `✅ Seed terminado: ${usuarios.length} usuarios preparados.`,
  );

  console.log('');
  console.log(
    '🔐 Cuentas de prueba:',
  );

  console.log(
    `Administrador: ${administrador.correo} / ${ADMIN_PASSWORD}`,
  );

  console.log(
    `Docentes: contraseña común ${DOCENTE_PASSWORD}`,
  );

  console.log(
    `Estudiantes: contraseña común ${ESTUDIANTE_PASSWORD}`,
  );
}

main()
  .catch(
    (
      error: unknown,
    ) => {
      console.error(
        '❌ Error ejecutando el seed:',
        error,
      );

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );