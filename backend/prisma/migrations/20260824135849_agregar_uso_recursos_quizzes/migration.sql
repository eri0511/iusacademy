-- CreateEnum
CREATE TYPE "UsoRecursoCurso" AS ENUM ('AULA', 'AULA_Y_QUIZZES', 'SOLO_QUIZZES');

-- AlterTable
ALTER TABLE "RecursoCurso" ADD COLUMN     "uso" "UsoRecursoCurso" NOT NULL DEFAULT 'AULA';

-- CreateIndex
CREATE INDEX "RecursoCurso_uso_idx" ON "RecursoCurso"("uso");

-- CreateIndex
CREATE INDEX "RecursoCurso_cursoId_uso_estado_estaActivo_idx" ON "RecursoCurso"("cursoId", "uso", "estado", "estaActivo");
