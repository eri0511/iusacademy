-- AlterTable
ALTER TABLE "TemaForoCurso" ADD COLUMN     "visibleAntesDeApertura" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "TemaForoCurso_visibleAntesDeApertura_idx" ON "TemaForoCurso"("visibleAntesDeApertura");
