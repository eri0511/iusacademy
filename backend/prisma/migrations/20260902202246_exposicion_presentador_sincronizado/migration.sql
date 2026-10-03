-- AlterTable
ALTER TABLE "TurnoExposicion" ADD COLUMN     "presentadorId" INTEGER;

-- CreateIndex
CREATE INDEX "TurnoExposicion_presentadorId_idx" ON "TurnoExposicion"("presentadorId");

-- AddForeignKey
ALTER TABLE "TurnoExposicion" ADD CONSTRAINT "TurnoExposicion_presentadorId_fkey" FOREIGN KEY ("presentadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
