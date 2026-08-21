-- CreateEnum
CREATE TYPE "EstadoReporteEmitido" AS ENUM ('GENERANDO', 'VALIDO', 'ANULADO', 'ERROR');

-- CreateTable
CREATE TABLE "ReporteEmitido" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "nombreArchivo" TEXT,
    "mimeType" TEXT,
    "cantidadRegistros" INTEGER NOT NULL DEFAULT 0,
    "filtros" JSONB,
    "hashSha256" TEXT,
    "estado" "EstadoReporteEmitido" NOT NULL DEFAULT 'GENERANDO',
    "generadoPorId" INTEGER NOT NULL,
    "generadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEn" TIMESTAMP(3),
    "expiraEn" TIMESTAMP(3),
    "anuladoEn" TIMESTAMP(3),
    "anuladoPorId" INTEGER,
    "motivoAnulacion" TEXT,
    "errorGeneracion" TEXT,

    CONSTRAINT "ReporteEmitido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReporteEmitido_codigo_key" ON "ReporteEmitido"("codigo");

-- CreateIndex
CREATE INDEX "ReporteEmitido_codigo_idx" ON "ReporteEmitido"("codigo");

-- CreateIndex
CREATE INDEX "ReporteEmitido_estado_idx" ON "ReporteEmitido"("estado");

-- CreateIndex
CREATE INDEX "ReporteEmitido_generadoPorId_idx" ON "ReporteEmitido"("generadoPorId");

-- CreateIndex
CREATE INDEX "ReporteEmitido_generadoEn_idx" ON "ReporteEmitido"("generadoEn");

-- CreateIndex
CREATE INDEX "ReporteEmitido_tipo_formato_idx" ON "ReporteEmitido"("tipo", "formato");

-- AddForeignKey
ALTER TABLE "ReporteEmitido" ADD CONSTRAINT "ReporteEmitido_generadoPorId_fkey" FOREIGN KEY ("generadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteEmitido" ADD CONSTRAINT "ReporteEmitido_anuladoPorId_fkey" FOREIGN KEY ("anuladoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
