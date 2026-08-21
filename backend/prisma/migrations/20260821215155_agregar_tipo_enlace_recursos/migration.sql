-- CreateEnum
CREATE TYPE "TipoRecursoCurso" AS ENUM ('ARCHIVO', 'ENLACE');

-- AlterTable
ALTER TABLE "RecursoCurso" ADD COLUMN     "tipo" "TipoRecursoCurso" NOT NULL DEFAULT 'ARCHIVO',
ADD COLUMN     "urlExterna" TEXT;

-- CreateIndex
CREATE INDEX "RecursoCurso_tipo_idx" ON "RecursoCurso"("tipo");
