/*
  Warnings:

  - A unique constraint covering the columns `[codigoInscripcion]` on the table `Curso` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('ACTIVA', 'RETIRADA');

-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "codigoGeneradoEn" TIMESTAMP(3),
ADD COLUMN     "codigoInscripcion" TEXT,
ADD COLUMN     "codigoInscripcionActivo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "InscripcionCurso" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'ACTIVA',
    "inscritoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiradoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InscripcionCurso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InscripcionCurso_cursoId_idx" ON "InscripcionCurso"("cursoId");

-- CreateIndex
CREATE INDEX "InscripcionCurso_estudianteId_idx" ON "InscripcionCurso"("estudianteId");

-- CreateIndex
CREATE INDEX "InscripcionCurso_estado_idx" ON "InscripcionCurso"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "InscripcionCurso_cursoId_estudianteId_key" ON "InscripcionCurso"("cursoId", "estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_codigoInscripcion_key" ON "Curso"("codigoInscripcion");

-- AddForeignKey
ALTER TABLE "InscripcionCurso" ADD CONSTRAINT "InscripcionCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionCurso" ADD CONSTRAINT "InscripcionCurso_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
