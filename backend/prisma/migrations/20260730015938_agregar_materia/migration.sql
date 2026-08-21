-- CreateEnum
CREATE TYPE "EstadoMateria" AS ENUM ('ACTIVA', 'INACTIVA');

-- CreateTable
CREATE TABLE "Materia" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoMateria" NOT NULL DEFAULT 'ACTIVA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Materia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Materia_codigo_key" ON "Materia"("codigo");
