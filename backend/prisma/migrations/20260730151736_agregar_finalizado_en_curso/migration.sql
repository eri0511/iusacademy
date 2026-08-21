-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "finalizadoEn" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Curso_finalizadoEn_idx" ON "Curso"("finalizadoEn");
