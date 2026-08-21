-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidoPaterno" TEXT NOT NULL,
    "apellidoMaterno" TEXT,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT true,
    "passwordTemporalExpira" TIMESTAMP(3),
    "passwordCambiadaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
