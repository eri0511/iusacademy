-- AlterTable
ALTER TABLE "PublicacionCurso" ADD COLUMN     "visibleParaEstudiantes" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "PublicacionCurso_visibleParaEstudiantes_idx" ON "PublicacionCurso"("visibleParaEstudiantes");

-- CreateIndex
CREATE INDEX "PublicacionCurso_cursoId_hitoId_visibleParaEstudiantes_esta_idx" ON "PublicacionCurso"("cursoId", "hitoId", "visibleParaEstudiantes", "estaActiva");
