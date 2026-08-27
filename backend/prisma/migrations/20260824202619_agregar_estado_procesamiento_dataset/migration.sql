-- CreateEnum
CREATE TYPE "EstadoProcesamientoDataset" AS ENUM ('NO_APLICA', 'PENDIENTE', 'PROCESANDO', 'LISTO', 'ERROR');

-- AlterTable
ALTER TABLE "RecursoContenidoVersion" ADD COLUMN     "errorDataset" TEXT,
ADD COLUMN     "estadoDataset" "EstadoProcesamientoDataset" NOT NULL DEFAULT 'NO_APLICA',
ADD COLUMN     "intentosDataset" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "procesadoDatasetEn" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "RecursoContenidoVersion_estadoDataset_idx" ON "RecursoContenidoVersion"("estadoDataset");

-- CreateIndex
CREATE INDEX "RecursoContenidoVersion_estadoDataset_esVigente_idx" ON "RecursoContenidoVersion"("estadoDataset", "esVigente");
