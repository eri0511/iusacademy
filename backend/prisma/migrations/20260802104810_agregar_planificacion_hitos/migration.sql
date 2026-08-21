-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "planificacionId" INTEGER;

-- AlterTable
ALTER TABLE "PublicacionCurso" ADD COLUMN     "hitoId" INTEGER;

-- AlterTable
ALTER TABLE "TemaForoCurso" ADD COLUMN     "fechaVencimiento" TIMESTAMP(3),
ADD COLUMN     "hitoId" INTEGER;

-- CreateTable
CREATE TABLE "PlanificacionAcademica" (
    "id" SERIAL NOT NULL,
    "gestion" TEXT NOT NULL,
    "descripcion" TEXT,
    "estaActiva" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanificacionAcademica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HitoAcademico" (
    "id" SERIAL NOT NULL,
    "planificacionId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "puntajeTotal" INTEGER NOT NULL DEFAULT 0,
    "puntajeContinua" INTEGER NOT NULL DEFAULT 0,
    "puntajeProcesual" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HitoAcademico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanificacionAcademica_gestion_key" ON "PlanificacionAcademica"("gestion");

-- CreateIndex
CREATE INDEX "PlanificacionAcademica_gestion_idx" ON "PlanificacionAcademica"("gestion");

-- CreateIndex
CREATE INDEX "PlanificacionAcademica_estaActiva_idx" ON "PlanificacionAcademica"("estaActiva");

-- CreateIndex
CREATE INDEX "HitoAcademico_planificacionId_idx" ON "HitoAcademico"("planificacionId");

-- CreateIndex
CREATE INDEX "HitoAcademico_numero_idx" ON "HitoAcademico"("numero");

-- CreateIndex
CREATE INDEX "HitoAcademico_codigo_idx" ON "HitoAcademico"("codigo");

-- CreateIndex
CREATE INDEX "HitoAcademico_fechaInicio_idx" ON "HitoAcademico"("fechaInicio");

-- CreateIndex
CREATE INDEX "HitoAcademico_fechaFin_idx" ON "HitoAcademico"("fechaFin");

-- CreateIndex
CREATE INDEX "HitoAcademico_planificacionId_numero_idx" ON "HitoAcademico"("planificacionId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "HitoAcademico_planificacionId_numero_key" ON "HitoAcademico"("planificacionId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "HitoAcademico_planificacionId_codigo_key" ON "HitoAcademico"("planificacionId", "codigo");

-- CreateIndex
CREATE INDEX "Curso_planificacionId_idx" ON "Curso"("planificacionId");

-- CreateIndex
CREATE INDEX "Materia_estado_idx" ON "Materia"("estado");

-- CreateIndex
CREATE INDEX "Materia_semestre_idx" ON "Materia"("semestre");

-- CreateIndex
CREATE INDEX "PublicacionCurso_hitoId_idx" ON "PublicacionCurso"("hitoId");

-- CreateIndex
CREATE INDEX "PublicacionCurso_cursoId_hitoId_estaActiva_idx" ON "PublicacionCurso"("cursoId", "hitoId", "estaActiva");

-- CreateIndex
CREATE INDEX "TemaForoCurso_hitoId_idx" ON "TemaForoCurso"("hitoId");

-- CreateIndex
CREATE INDEX "TemaForoCurso_fechaVencimiento_idx" ON "TemaForoCurso"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "TemaForoCurso_cursoId_hitoId_estaActivo_idx" ON "TemaForoCurso"("cursoId", "hitoId", "estaActivo");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE INDEX "Usuario_estaActivo_idx" ON "Usuario"("estaActivo");

-- CreateIndex
CREATE INDEX "Usuario_cuentaActivada_idx" ON "Usuario"("cuentaActivada");

-- CreateIndex
CREATE INDEX "Usuario_ultimoAccesoEn_idx" ON "Usuario"("ultimoAccesoEn");

-- AddForeignKey
ALTER TABLE "HitoAcademico" ADD CONSTRAINT "HitoAcademico_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "PlanificacionAcademica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "PlanificacionAcademica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicacionCurso" ADD CONSTRAINT "PublicacionCurso_hitoId_fkey" FOREIGN KEY ("hitoId") REFERENCES "HitoAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemaForoCurso" ADD CONSTRAINT "TemaForoCurso_hitoId_fkey" FOREIGN KEY ("hitoId") REFERENCES "HitoAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
