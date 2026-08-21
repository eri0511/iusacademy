/*
  Warnings:

  - You are about to drop the column `cantidadDescargas` on the `ArchivoAdjunto` table. All the data in the column will be lost.
  - You are about to drop the column `esAnalizadoIA` on the `ArchivoAdjunto` table. All the data in the column will be lost.
  - You are about to drop the column `esTemporal` on the `ArchivoAdjunto` table. All the data in the column will be lost.
  - You are about to drop the column `fechaExpiracion` on the `ArchivoAdjunto` table. All the data in the column will be lost.
  - You are about to drop the column `miniaturaUrl` on the `ArchivoAdjunto` table. All the data in the column will be lost.
  - You are about to drop the column `numeroVersion` on the `ArchivoAdjunto` table. All the data in the column will be lost.
  - You are about to drop the column `textoExtraido` on the `ArchivoAdjunto` table. All the data in the column will be lost.
  - You are about to drop the column `esCalificable` on the `TemaForoCurso` table. All the data in the column will be lost.
  - You are about to drop the column `objetivo` on the `TemaForoCurso` table. All the data in the column will be lost.
  - You are about to drop the column `permitirEditarComentarios` on the `TemaForoCurso` table. All the data in the column will be lost.
  - You are about to drop the column `permitirEditarRespuestas` on the `TemaForoCurso` table. All the data in the column will be lost.
  - You are about to drop the column `permitirEliminarComentarios` on the `TemaForoCurso` table. All the data in the column will be lost.
  - You are about to drop the column `permitirEliminarRespuestas` on the `TemaForoCurso` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ArchivoAdjunto_esAnalizadoIA_idx";

-- DropIndex
DROP INDEX "ArchivoAdjunto_esTemporal_fechaExpiracion_idx";

-- AlterTable
ALTER TABLE "ArchivoAdjunto" DROP COLUMN "cantidadDescargas",
DROP COLUMN "esAnalizadoIA",
DROP COLUMN "esTemporal",
DROP COLUMN "fechaExpiracion",
DROP COLUMN "miniaturaUrl",
DROP COLUMN "numeroVersion",
DROP COLUMN "textoExtraido";

-- AlterTable
ALTER TABLE "TemaForoCurso" DROP COLUMN "esCalificable",
DROP COLUMN "objetivo",
DROP COLUMN "permitirEditarComentarios",
DROP COLUMN "permitirEditarRespuestas",
DROP COLUMN "permitirEliminarComentarios",
DROP COLUMN "permitirEliminarRespuestas";

-- CreateTable
CREATE TABLE "LecturaTemaForo" (
    "id" SERIAL NOT NULL,
    "temaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "primeraLecturaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaLecturaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cantidadVisitas" INTEGER NOT NULL DEFAULT 1,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LecturaTemaForo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LecturaTemaForo_temaId_idx" ON "LecturaTemaForo"("temaId");

-- CreateIndex
CREATE INDEX "LecturaTemaForo_usuarioId_idx" ON "LecturaTemaForo"("usuarioId");

-- CreateIndex
CREATE INDEX "LecturaTemaForo_ultimaLecturaEn_idx" ON "LecturaTemaForo"("ultimaLecturaEn");

-- CreateIndex
CREATE INDEX "LecturaTemaForo_temaId_ultimaLecturaEn_idx" ON "LecturaTemaForo"("temaId", "ultimaLecturaEn");

-- CreateIndex
CREATE UNIQUE INDEX "LecturaTemaForo_temaId_usuarioId_key" ON "LecturaTemaForo"("temaId", "usuarioId");

-- AddForeignKey
ALTER TABLE "LecturaTemaForo" ADD CONSTRAINT "LecturaTemaForo_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "TemaForoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaTemaForo" ADD CONSTRAINT "LecturaTemaForo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
