-- CreateEnum
CREATE TYPE "EstadoCurso" AS ENUM ('ACTIVO', 'INACTIVO', 'FINALIZADO');

-- CreateTable
CREATE TABLE "Curso" (
    "id" SERIAL NOT NULL,
    "materiaId" INTEGER NOT NULL,
    "docenteId" INTEGER NOT NULL,
    "gestion" TEXT NOT NULL,
    "paralelo" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "cupoMaximo" INTEGER,
    "estado" "EstadoCurso" NOT NULL DEFAULT 'ACTIVO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Curso_materiaId_idx" ON "Curso"("materiaId");

-- CreateIndex
CREATE INDEX "Curso_docenteId_idx" ON "Curso"("docenteId");

-- CreateIndex
CREATE INDEX "Curso_gestion_idx" ON "Curso"("gestion");

-- CreateIndex
CREATE INDEX "Curso_semestre_idx" ON "Curso"("semestre");

-- CreateIndex
CREATE INDEX "Curso_estado_idx" ON "Curso"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_materiaId_gestion_paralelo_key" ON "Curso"("materiaId", "gestion", "paralelo");

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
