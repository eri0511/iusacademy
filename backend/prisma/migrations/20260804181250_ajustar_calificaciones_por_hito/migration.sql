/*
  Warnings:

  - Added the required column `componente` to the `ActividadCalificable` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ComponenteEvaluacion" AS ENUM ('CONTINUA', 'PROCESUAL');

-- AlterTable
ALTER TABLE "ActividadCalificable" ADD COLUMN     "componente" "ComponenteEvaluacion" NOT NULL,
ADD COLUMN     "orden" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "participaEnPromedio" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "ActividadCalificable_componente_idx" ON "ActividadCalificable"("componente");

-- CreateIndex
CREATE INDEX "ActividadCalificable_participaEnPromedio_idx" ON "ActividadCalificable"("participaEnPromedio");

-- CreateIndex
CREATE INDEX "ActividadCalificable_orden_idx" ON "ActividadCalificable"("orden");

-- CreateIndex
CREATE INDEX "ActividadCalificable_cursoId_hitoId_componente_idx" ON "ActividadCalificable"("cursoId", "hitoId", "componente");

-- CreateIndex
CREATE INDEX "ActividadCalificable_cursoId_hitoId_componente_participaEnP_idx" ON "ActividadCalificable"("cursoId", "hitoId", "componente", "participaEnPromedio");
