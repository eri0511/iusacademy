-- AlterTable
ALTER TABLE "ArchivoAdjunto" ADD COLUMN     "cantidadDescargas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "esAnalizadoIA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "esTemporal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaExpiracion" TIMESTAMP(3),
ADD COLUMN     "miniaturaUrl" TEXT,
ADD COLUMN     "numeroVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "textoExtraido" TEXT;

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_esTemporal_fechaExpiracion_idx" ON "ArchivoAdjunto"("esTemporal", "fechaExpiracion");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_esAnalizadoIA_idx" ON "ArchivoAdjunto"("esAnalizadoIA");
