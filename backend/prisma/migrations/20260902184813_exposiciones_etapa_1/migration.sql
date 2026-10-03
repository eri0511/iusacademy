-- CreateEnum
CREATE TYPE "MetodoOrdenExposicion" AS ENUM ('ORDEN_ENTREGA', 'ALEATORIO', 'ALFABETICO', 'MANUAL');

-- CreateEnum
CREATE TYPE "EstadoJornadaExposicion" AS ENUM ('CONFIGURANDO', 'LISTA', 'EN_CURSO', 'PAUSADA', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoTurnoExposicion" AS ENUM ('PENDIENTE', 'EN_ESPERA', 'EN_CURSO', 'PAUSADO', 'FINALIZADO', 'AUSENTE');

-- CreateEnum
CREATE TYPE "EstadoPreguntaExposicion" AS ENUM ('PENDIENTE', 'SELECCIONADA', 'RESPONDIDA', 'DESCARTADA');

-- AlterTable
ALTER TABLE "TareaCurso" ALTER COLUMN "tamanioMaximoArchivoMb" SET DEFAULT 30;

-- CreateTable
CREATE TABLE "JornadaExposicion" (
    "id" SERIAL NOT NULL,
    "tareaId" INTEGER NOT NULL,
    "creadorId" INTEGER NOT NULL,
    "metodoOrden" "MetodoOrdenExposicion" NOT NULL,
    "estado" "EstadoJornadaExposicion" NOT NULL DEFAULT 'CONFIGURANDO',
    "duracionSegundos" INTEGER NOT NULL,
    "avisoSegundos" INTEGER NOT NULL DEFAULT 120,
    "permitirTiempoExtra" BOOLEAN NOT NULL DEFAULT true,
    "mostrarSiguiente" BOOLEAN NOT NULL DEFAULT true,
    "generadaEn" TIMESTAMP(3),
    "iniciadaEn" TIMESTAMP(3),
    "finalizadaEn" TIMESTAMP(3),
    "canceladaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JornadaExposicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurnoExposicion" (
    "id" SERIAL NOT NULL,
    "jornadaId" INTEGER NOT NULL,
    "entregaId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "estado" "EstadoTurnoExposicion" NOT NULL DEFAULT 'PENDIENTE',
    "iniciadoEn" TIMESTAMP(3),
    "pausadoEn" TIMESTAMP(3),
    "reanudadoEn" TIMESTAMP(3),
    "finalizadoEn" TIMESTAMP(3),
    "segundosPausaAcumulados" INTEGER NOT NULL DEFAULT 0,
    "segundosUtilizados" INTEGER NOT NULL DEFAULT 0,
    "diapositivaActual" INTEGER NOT NULL DEFAULT 1,
    "observacionDocente" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurnoExposicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreguntaExposicion" (
    "id" SERIAL NOT NULL,
    "turnoId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "estado" "EstadoPreguntaExposicion" NOT NULL DEFAULT 'PENDIENTE',
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "respondidaEn" TIMESTAMP(3),
    "descartadaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreguntaExposicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VotoPreguntaExposicion" (
    "id" SERIAL NOT NULL,
    "preguntaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VotoPreguntaExposicion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JornadaExposicion_tareaId_idx" ON "JornadaExposicion"("tareaId");

-- CreateIndex
CREATE INDEX "JornadaExposicion_creadorId_idx" ON "JornadaExposicion"("creadorId");

-- CreateIndex
CREATE INDEX "JornadaExposicion_estado_idx" ON "JornadaExposicion"("estado");

-- CreateIndex
CREATE INDEX "JornadaExposicion_tareaId_estado_idx" ON "JornadaExposicion"("tareaId", "estado");

-- CreateIndex
CREATE INDEX "TurnoExposicion_jornadaId_idx" ON "TurnoExposicion"("jornadaId");

-- CreateIndex
CREATE INDEX "TurnoExposicion_entregaId_idx" ON "TurnoExposicion"("entregaId");

-- CreateIndex
CREATE INDEX "TurnoExposicion_estado_idx" ON "TurnoExposicion"("estado");

-- CreateIndex
CREATE INDEX "TurnoExposicion_jornadaId_estado_idx" ON "TurnoExposicion"("jornadaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "TurnoExposicion_jornadaId_entregaId_key" ON "TurnoExposicion"("jornadaId", "entregaId");

-- CreateIndex
CREATE UNIQUE INDEX "TurnoExposicion_jornadaId_orden_key" ON "TurnoExposicion"("jornadaId", "orden");

-- CreateIndex
CREATE INDEX "PreguntaExposicion_turnoId_idx" ON "PreguntaExposicion"("turnoId");

-- CreateIndex
CREATE INDEX "PreguntaExposicion_autorId_idx" ON "PreguntaExposicion"("autorId");

-- CreateIndex
CREATE INDEX "PreguntaExposicion_estado_idx" ON "PreguntaExposicion"("estado");

-- CreateIndex
CREATE INDEX "PreguntaExposicion_turnoId_estado_creadoEn_idx" ON "PreguntaExposicion"("turnoId", "estado", "creadoEn");

-- CreateIndex
CREATE INDEX "VotoPreguntaExposicion_preguntaId_idx" ON "VotoPreguntaExposicion"("preguntaId");

-- CreateIndex
CREATE INDEX "VotoPreguntaExposicion_usuarioId_idx" ON "VotoPreguntaExposicion"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "VotoPreguntaExposicion_preguntaId_usuarioId_key" ON "VotoPreguntaExposicion"("preguntaId", "usuarioId");

-- AddForeignKey
ALTER TABLE "JornadaExposicion" ADD CONSTRAINT "JornadaExposicion_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "TareaCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JornadaExposicion" ADD CONSTRAINT "JornadaExposicion_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoExposicion" ADD CONSTRAINT "TurnoExposicion_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "JornadaExposicion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoExposicion" ADD CONSTRAINT "TurnoExposicion_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "EntregaTarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreguntaExposicion" ADD CONSTRAINT "PreguntaExposicion_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "TurnoExposicion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreguntaExposicion" ADD CONSTRAINT "PreguntaExposicion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotoPreguntaExposicion" ADD CONSTRAINT "VotoPreguntaExposicion_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "PreguntaExposicion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotoPreguntaExposicion" ADD CONSTRAINT "VotoPreguntaExposicion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
