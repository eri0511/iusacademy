-- CreateEnum
CREATE TYPE "AlcanceConjuntoGrupo" AS ENUM ('CURSO', 'HITO', 'ACTIVIDAD');

-- CreateEnum
CREATE TYPE "MetodoCreacionGrupo" AS ENUM ('MANUAL', 'ALEATORIO', 'IMPORTADO');

-- CreateEnum
CREATE TYPE "CriterioDistribucionGrupo" AS ENUM ('CANTIDAD_GRUPOS', 'INTEGRANTES_POR_GRUPO');

-- CreateEnum
CREATE TYPE "AccionHistorialGrupo" AS ENUM ('CONJUNTO_CREADO', 'CONJUNTO_ACTUALIZADO', 'CONJUNTO_BLOQUEADO', 'CONJUNTO_DESBLOQUEADO', 'GRUPO_CREADO', 'GRUPO_ACTUALIZADO', 'GRUPO_ELIMINADO', 'ESTUDIANTE_AGREGADO', 'ESTUDIANTE_MOVIDO', 'ESTUDIANTE_RETIRADO', 'REPRESENTANTE_ASIGNADO', 'REPRESENTANTE_REMOVIDO', 'DISTRIBUCION_GENERADA', 'DISTRIBUCION_REGENERADA', 'CONJUNTO_IMPORTADO');

-- CreateTable
CREATE TABLE "ConjuntoGrupoCurso" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "hitoId" INTEGER,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "alcance" "AlcanceConjuntoGrupo" NOT NULL,
    "metodoCreacion" "MetodoCreacionGrupo" NOT NULL,
    "criterioDistribucion" "CriterioDistribucionGrupo",
    "cantidadGruposObjetivo" INTEGER,
    "integrantesPorGrupoObjetivo" INTEGER,
    "requiereRepresentante" BOOLEAN NOT NULL DEFAULT false,
    "estaBloqueado" BOOLEAN NOT NULL DEFAULT false,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConjuntoGrupoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoCurso" (
    "id" SERIAL NOT NULL,
    "conjuntoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrupoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegranteGrupoCurso" (
    "id" SERIAL NOT NULL,
    "conjuntoId" INTEGER NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "esRepresentante" BOOLEAN NOT NULL DEFAULT false,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "agregadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiradoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegranteGrupoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialGrupoCurso" (
    "id" SERIAL NOT NULL,
    "conjuntoId" INTEGER NOT NULL,
    "grupoId" INTEGER,
    "actorId" INTEGER NOT NULL,
    "estudianteId" INTEGER,
    "accion" "AccionHistorialGrupo" NOT NULL,
    "detalle" JSONB,
    "registradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialGrupoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConjuntoGrupoCurso_cursoId_idx" ON "ConjuntoGrupoCurso"("cursoId");

-- CreateIndex
CREATE INDEX "ConjuntoGrupoCurso_hitoId_idx" ON "ConjuntoGrupoCurso"("hitoId");

-- CreateIndex
CREATE INDEX "ConjuntoGrupoCurso_alcance_idx" ON "ConjuntoGrupoCurso"("alcance");

-- CreateIndex
CREATE INDEX "ConjuntoGrupoCurso_metodoCreacion_idx" ON "ConjuntoGrupoCurso"("metodoCreacion");

-- CreateIndex
CREATE INDEX "ConjuntoGrupoCurso_estaBloqueado_idx" ON "ConjuntoGrupoCurso"("estaBloqueado");

-- CreateIndex
CREATE INDEX "ConjuntoGrupoCurso_estaActivo_idx" ON "ConjuntoGrupoCurso"("estaActivo");

-- CreateIndex
CREATE INDEX "ConjuntoGrupoCurso_cursoId_alcance_estaActivo_idx" ON "ConjuntoGrupoCurso"("cursoId", "alcance", "estaActivo");

-- CreateIndex
CREATE INDEX "ConjuntoGrupoCurso_cursoId_hitoId_estaActivo_idx" ON "ConjuntoGrupoCurso"("cursoId", "hitoId", "estaActivo");

-- CreateIndex
CREATE INDEX "GrupoCurso_conjuntoId_idx" ON "GrupoCurso"("conjuntoId");

-- CreateIndex
CREATE INDEX "GrupoCurso_orden_idx" ON "GrupoCurso"("orden");

-- CreateIndex
CREATE INDEX "GrupoCurso_estaActivo_idx" ON "GrupoCurso"("estaActivo");

-- CreateIndex
CREATE INDEX "GrupoCurso_conjuntoId_estaActivo_orden_idx" ON "GrupoCurso"("conjuntoId", "estaActivo", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoCurso_conjuntoId_nombre_key" ON "GrupoCurso"("conjuntoId", "nombre");

-- CreateIndex
CREATE INDEX "IntegranteGrupoCurso_conjuntoId_idx" ON "IntegranteGrupoCurso"("conjuntoId");

-- CreateIndex
CREATE INDEX "IntegranteGrupoCurso_grupoId_idx" ON "IntegranteGrupoCurso"("grupoId");

-- CreateIndex
CREATE INDEX "IntegranteGrupoCurso_estudianteId_idx" ON "IntegranteGrupoCurso"("estudianteId");

-- CreateIndex
CREATE INDEX "IntegranteGrupoCurso_esRepresentante_idx" ON "IntegranteGrupoCurso"("esRepresentante");

-- CreateIndex
CREATE INDEX "IntegranteGrupoCurso_estaActivo_idx" ON "IntegranteGrupoCurso"("estaActivo");

-- CreateIndex
CREATE INDEX "IntegranteGrupoCurso_grupoId_estaActivo_idx" ON "IntegranteGrupoCurso"("grupoId", "estaActivo");

-- CreateIndex
CREATE UNIQUE INDEX "IntegranteGrupoCurso_conjuntoId_estudianteId_key" ON "IntegranteGrupoCurso"("conjuntoId", "estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegranteGrupoCurso_grupoId_estudianteId_key" ON "IntegranteGrupoCurso"("grupoId", "estudianteId");

-- CreateIndex
CREATE INDEX "HistorialGrupoCurso_conjuntoId_idx" ON "HistorialGrupoCurso"("conjuntoId");

-- CreateIndex
CREATE INDEX "HistorialGrupoCurso_grupoId_idx" ON "HistorialGrupoCurso"("grupoId");

-- CreateIndex
CREATE INDEX "HistorialGrupoCurso_actorId_idx" ON "HistorialGrupoCurso"("actorId");

-- CreateIndex
CREATE INDEX "HistorialGrupoCurso_estudianteId_idx" ON "HistorialGrupoCurso"("estudianteId");

-- CreateIndex
CREATE INDEX "HistorialGrupoCurso_accion_idx" ON "HistorialGrupoCurso"("accion");

-- CreateIndex
CREATE INDEX "HistorialGrupoCurso_registradoEn_idx" ON "HistorialGrupoCurso"("registradoEn");

-- CreateIndex
CREATE INDEX "HistorialGrupoCurso_conjuntoId_registradoEn_idx" ON "HistorialGrupoCurso"("conjuntoId", "registradoEn");

-- AddForeignKey
ALTER TABLE "ConjuntoGrupoCurso" ADD CONSTRAINT "ConjuntoGrupoCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConjuntoGrupoCurso" ADD CONSTRAINT "ConjuntoGrupoCurso_hitoId_fkey" FOREIGN KEY ("hitoId") REFERENCES "HitoAcademico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrupoCurso" ADD CONSTRAINT "GrupoCurso_conjuntoId_fkey" FOREIGN KEY ("conjuntoId") REFERENCES "ConjuntoGrupoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegranteGrupoCurso" ADD CONSTRAINT "IntegranteGrupoCurso_conjuntoId_fkey" FOREIGN KEY ("conjuntoId") REFERENCES "ConjuntoGrupoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegranteGrupoCurso" ADD CONSTRAINT "IntegranteGrupoCurso_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegranteGrupoCurso" ADD CONSTRAINT "IntegranteGrupoCurso_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialGrupoCurso" ADD CONSTRAINT "HistorialGrupoCurso_conjuntoId_fkey" FOREIGN KEY ("conjuntoId") REFERENCES "ConjuntoGrupoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialGrupoCurso" ADD CONSTRAINT "HistorialGrupoCurso_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoCurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialGrupoCurso" ADD CONSTRAINT "HistorialGrupoCurso_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialGrupoCurso" ADD CONSTRAINT "HistorialGrupoCurso_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
