/*
  Warnings:

  - Added the required column `tipoEvaluacion` to the `ConjuntoGrupoCurso` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoEvaluacionGrupo" AS ENUM ('CONTINUA', 'PROCESUAL');

-- AlterTable
ALTER TABLE "ConjuntoGrupoCurso" ADD COLUMN     "tipoEvaluacion" "TipoEvaluacionGrupo" NOT NULL;

-- CreateIndex
CREATE INDEX "ConjuntoGrupoCurso_tipoEvaluacion_idx" ON "ConjuntoGrupoCurso"("tipoEvaluacion");

-- CreateIndex
CREATE INDEX "ConjuntoGrupoCurso_cursoId_tipoEvaluacion_estaActivo_idx" ON "ConjuntoGrupoCurso"("cursoId", "tipoEvaluacion", "estaActivo");
