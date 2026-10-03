-- CreateEnum
CREATE TYPE "EstadoAnalisisExposicion" AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR');

-- CreateTable
CREATE TABLE "AnalisisExposicion" (
    "id" SERIAL NOT NULL,
    "turnoId" INTEGER NOT NULL,
    "generadoPorId" INTEGER NOT NULL,
    "estado" "EstadoAnalisisExposicion" NOT NULL DEFAULT 'PENDIENTE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "motor" TEXT NOT NULL DEFAULT 'IUSACADEMY_ANALISIS_V1',
    "puntuacionEstructura" DECIMAL(5,2),
    "puntuacionContenidoJuridico" DECIMAL(5,2),
    "puntuacionPresentacion" DECIMAL(5,2),
    "puntuacionGlobal" DECIMAL(5,2),
    "resumen" TEXT,
    "fortalezas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "advertencias" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "omisiones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "retroalimentacionSugerida" TEXT,
    "evidencias" JSONB,
    "hashEntrada" TEXT,
    "error" TEXT,
    "iniciadoEn" TIMESTAMP(3),
    "finalizadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalisisExposicion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalisisExposicion_turnoId_key" ON "AnalisisExposicion"("turnoId");

-- CreateIndex
CREATE INDEX "AnalisisExposicion_generadoPorId_idx" ON "AnalisisExposicion"("generadoPorId");

-- CreateIndex
CREATE INDEX "AnalisisExposicion_estado_idx" ON "AnalisisExposicion"("estado");

-- CreateIndex
CREATE INDEX "AnalisisExposicion_finalizadoEn_idx" ON "AnalisisExposicion"("finalizadoEn");

-- AddForeignKey
ALTER TABLE "AnalisisExposicion" ADD CONSTRAINT "AnalisisExposicion_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "TurnoExposicion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisExposicion" ADD CONSTRAINT "AnalisisExposicion_generadoPorId_fkey" FOREIGN KEY ("generadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
