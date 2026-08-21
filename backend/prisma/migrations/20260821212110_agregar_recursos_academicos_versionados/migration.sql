-- CreateEnum
CREATE TYPE "AlcanceRecursoCurso" AS ENUM ('CURSO', 'HITO');

-- CreateEnum
CREATE TYPE "EstadoRecursoCurso" AS ENUM ('ACTIVO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "EstadoVersionRecurso" AS ENUM ('VIGENTE', 'REEMPLAZADA');

-- CreateTable
CREATE TABLE "RecursoCurso" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "hitoId" INTEGER,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "alcance" "AlcanceRecursoCurso" NOT NULL DEFAULT 'HITO',
    "visibleParaEstudiantes" BOOLEAN NOT NULL DEFAULT true,
    "disponibleParaQuiz" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoRecursoCurso" NOT NULL DEFAULT 'ACTIVO',
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "publicadoEn" TIMESTAMP(3),
    "archivadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecursoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecursoCursoVersion" (
    "id" SERIAL NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "archivoId" INTEGER NOT NULL,
    "numeroVersion" INTEGER NOT NULL,
    "estado" "EstadoVersionRecurso" NOT NULL DEFAULT 'VIGENTE',
    "motivoActualizacion" TEXT,
    "fechaDocumento" TIMESTAMP(3),
    "esVigente" BOOLEAN NOT NULL DEFAULT true,
    "reemplazadaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecursoCursoVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecursoCurso_cursoId_idx" ON "RecursoCurso"("cursoId");

-- CreateIndex
CREATE INDEX "RecursoCurso_autorId_idx" ON "RecursoCurso"("autorId");

-- CreateIndex
CREATE INDEX "RecursoCurso_hitoId_idx" ON "RecursoCurso"("hitoId");

-- CreateIndex
CREATE INDEX "RecursoCurso_alcance_idx" ON "RecursoCurso"("alcance");

-- CreateIndex
CREATE INDEX "RecursoCurso_estado_idx" ON "RecursoCurso"("estado");

-- CreateIndex
CREATE INDEX "RecursoCurso_estaActivo_idx" ON "RecursoCurso"("estaActivo");

-- CreateIndex
CREATE INDEX "RecursoCurso_visibleParaEstudiantes_idx" ON "RecursoCurso"("visibleParaEstudiantes");

-- CreateIndex
CREATE INDEX "RecursoCurso_disponibleParaQuiz_idx" ON "RecursoCurso"("disponibleParaQuiz");

-- CreateIndex
CREATE INDEX "RecursoCurso_cursoId_alcance_estado_estaActivo_idx" ON "RecursoCurso"("cursoId", "alcance", "estado", "estaActivo");

-- CreateIndex
CREATE INDEX "RecursoCurso_cursoId_hitoId_estado_estaActivo_idx" ON "RecursoCurso"("cursoId", "hitoId", "estado", "estaActivo");

-- CreateIndex
CREATE INDEX "RecursoCurso_cursoId_disponibleParaQuiz_estado_estaActivo_idx" ON "RecursoCurso"("cursoId", "disponibleParaQuiz", "estado", "estaActivo");

-- CreateIndex
CREATE UNIQUE INDEX "RecursoCursoVersion_archivoId_key" ON "RecursoCursoVersion"("archivoId");

-- CreateIndex
CREATE INDEX "RecursoCursoVersion_recursoId_idx" ON "RecursoCursoVersion"("recursoId");

-- CreateIndex
CREATE INDEX "RecursoCursoVersion_archivoId_idx" ON "RecursoCursoVersion"("archivoId");

-- CreateIndex
CREATE INDEX "RecursoCursoVersion_estado_idx" ON "RecursoCursoVersion"("estado");

-- CreateIndex
CREATE INDEX "RecursoCursoVersion_esVigente_idx" ON "RecursoCursoVersion"("esVigente");

-- CreateIndex
CREATE INDEX "RecursoCursoVersion_creadoEn_idx" ON "RecursoCursoVersion"("creadoEn");

-- CreateIndex
CREATE INDEX "RecursoCursoVersion_recursoId_estado_esVigente_idx" ON "RecursoCursoVersion"("recursoId", "estado", "esVigente");

-- CreateIndex
CREATE UNIQUE INDEX "RecursoCursoVersion_recursoId_numeroVersion_key" ON "RecursoCursoVersion"("recursoId", "numeroVersion");

-- AddForeignKey
ALTER TABLE "RecursoCurso" ADD CONSTRAINT "RecursoCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoCurso" ADD CONSTRAINT "RecursoCurso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoCurso" ADD CONSTRAINT "RecursoCurso_hitoId_fkey" FOREIGN KEY ("hitoId") REFERENCES "HitoAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoCursoVersion" ADD CONSTRAINT "RecursoCursoVersion_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoCursoVersion" ADD CONSTRAINT "RecursoCursoVersion_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "ArchivoAdjunto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
