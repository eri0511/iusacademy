-- AlterTable
ALTER TABLE "ArchivoAdjunto" ADD COLUMN     "cantidadDescargas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "esAnalizadoIA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "esTemporal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaExpiracion" TIMESTAMP(3),
ADD COLUMN     "miniaturaUrl" TEXT,
ADD COLUMN     "numeroVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "textoExtraido" TEXT;

-- AlterTable
ALTER TABLE "TemaForoCurso" ADD COLUMN     "esCalificable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "objetivo" TEXT,
ADD COLUMN     "permitirEditarComentarios" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permitirEditarRespuestas" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permitirEliminarComentarios" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "permitirEliminarRespuestas" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_esTemporal_fechaExpiracion_idx" ON "ArchivoAdjunto"("esTemporal", "fechaExpiracion");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_esAnalizadoIA_idx" ON "ArchivoAdjunto"("esAnalizadoIA");
