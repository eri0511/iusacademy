/*
  Warnings:

  - You are about to drop the column `disponibleParaQuiz` on the `RecursoCurso` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `RecursoCurso` table. All the data in the column will be lost.
  - You are about to drop the column `urlExterna` on the `RecursoCurso` table. All the data in the column will be lost.
  - You are about to drop the `RecursoCursoVersion` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoContenidoRecurso" AS ENUM ('ARCHIVO', 'ENLACE');

-- CreateEnum
CREATE TYPE "CategoriaRecursoCurso" AS ENUM ('NORMATIVA', 'JURISPRUDENCIA', 'DOCTRINA', 'GUIA_ACADEMICA', 'CASO_PRACTICO', 'MODELO_JURIDICO', 'MATERIAL_AUDIOVISUAL', 'MATERIAL_COMPLEMENTARIO', 'OTRO');

-- DropForeignKey
ALTER TABLE "RecursoCursoVersion" DROP CONSTRAINT "RecursoCursoVersion_archivoId_fkey";

-- DropForeignKey
ALTER TABLE "RecursoCursoVersion" DROP CONSTRAINT "RecursoCursoVersion_recursoId_fkey";

-- DropIndex
DROP INDEX "RecursoCurso_cursoId_disponibleParaQuiz_estado_estaActivo_idx";

-- DropIndex
DROP INDEX "RecursoCurso_disponibleParaQuiz_idx";

-- DropIndex
DROP INDEX "RecursoCurso_tipo_idx";

-- AlterTable
ALTER TABLE "RecursoCurso" DROP COLUMN "disponibleParaQuiz",
DROP COLUMN "tipo",
DROP COLUMN "urlExterna",
ADD COLUMN     "categoria" "CategoriaRecursoCurso" NOT NULL DEFAULT 'MATERIAL_COMPLEMENTARIO';

-- DropTable
DROP TABLE "RecursoCursoVersion";

-- DropEnum
DROP TYPE "TipoRecursoCurso";

-- CreateTable
CREATE TABLE "RecursoContenido" (
    "id" SERIAL NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "tipo" "TipoContenidoRecurso" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "urlExterna" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "disponibleParaQuiz" BOOLEAN NOT NULL DEFAULT false,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecursoContenido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecursoContenidoVersion" (
    "id" SERIAL NOT NULL,
    "contenidoId" INTEGER NOT NULL,
    "archivoId" INTEGER NOT NULL,
    "numeroVersion" INTEGER NOT NULL,
    "estado" "EstadoVersionRecurso" NOT NULL DEFAULT 'VIGENTE',
    "motivoActualizacion" TEXT,
    "fechaDocumento" TIMESTAMP(3),
    "esVigente" BOOLEAN NOT NULL DEFAULT true,
    "reemplazadaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecursoContenidoVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecursoContenido_recursoId_idx" ON "RecursoContenido"("recursoId");

-- CreateIndex
CREATE INDEX "RecursoContenido_tipo_idx" ON "RecursoContenido"("tipo");

-- CreateIndex
CREATE INDEX "RecursoContenido_orden_idx" ON "RecursoContenido"("orden");

-- CreateIndex
CREATE INDEX "RecursoContenido_disponibleParaQuiz_idx" ON "RecursoContenido"("disponibleParaQuiz");

-- CreateIndex
CREATE INDEX "RecursoContenido_estaActivo_idx" ON "RecursoContenido"("estaActivo");

-- CreateIndex
CREATE INDEX "RecursoContenido_recursoId_estaActivo_orden_idx" ON "RecursoContenido"("recursoId", "estaActivo", "orden");

-- CreateIndex
CREATE INDEX "RecursoContenido_recursoId_disponibleParaQuiz_estaActivo_idx" ON "RecursoContenido"("recursoId", "disponibleParaQuiz", "estaActivo");

-- CreateIndex
CREATE UNIQUE INDEX "RecursoContenidoVersion_archivoId_key" ON "RecursoContenidoVersion"("archivoId");

-- CreateIndex
CREATE INDEX "RecursoContenidoVersion_contenidoId_idx" ON "RecursoContenidoVersion"("contenidoId");

-- CreateIndex
CREATE INDEX "RecursoContenidoVersion_archivoId_idx" ON "RecursoContenidoVersion"("archivoId");

-- CreateIndex
CREATE INDEX "RecursoContenidoVersion_estado_idx" ON "RecursoContenidoVersion"("estado");

-- CreateIndex
CREATE INDEX "RecursoContenidoVersion_esVigente_idx" ON "RecursoContenidoVersion"("esVigente");

-- CreateIndex
CREATE INDEX "RecursoContenidoVersion_creadoEn_idx" ON "RecursoContenidoVersion"("creadoEn");

-- CreateIndex
CREATE INDEX "RecursoContenidoVersion_contenidoId_estado_esVigente_idx" ON "RecursoContenidoVersion"("contenidoId", "estado", "esVigente");

-- CreateIndex
CREATE UNIQUE INDEX "RecursoContenidoVersion_contenidoId_numeroVersion_key" ON "RecursoContenidoVersion"("contenidoId", "numeroVersion");

-- CreateIndex
CREATE INDEX "RecursoCurso_categoria_idx" ON "RecursoCurso"("categoria");

-- CreateIndex
CREATE INDEX "RecursoCurso_cursoId_categoria_estado_estaActivo_idx" ON "RecursoCurso"("cursoId", "categoria", "estado", "estaActivo");

-- AddForeignKey
ALTER TABLE "RecursoContenido" ADD CONSTRAINT "RecursoContenido_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoContenidoVersion" ADD CONSTRAINT "RecursoContenidoVersion_contenidoId_fkey" FOREIGN KEY ("contenidoId") REFERENCES "RecursoContenido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoContenidoVersion" ADD CONSTRAINT "RecursoContenidoVersion_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "ArchivoAdjunto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
