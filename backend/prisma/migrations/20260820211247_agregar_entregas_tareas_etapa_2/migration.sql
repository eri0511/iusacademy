-- CreateEnum
CREATE TYPE "EstadoEntregaTarea" AS ENUM ('BORRADOR', 'ENTREGADA', 'TARDIA', 'BLOQUEADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoEquipoAfinidadTarea" AS ENUM ('ACTIVO', 'BLOQUEADO', 'INACTIVO');

-- AlterEnum
ALTER TYPE "CategoriaArchivoAdjunto" ADD VALUE 'TAREA_ENTREGA';

-- AlterTable
ALTER TABLE "ArchivoAdjunto" ADD COLUMN     "entregaTareaId" INTEGER;

-- AlterTable
ALTER TABLE "CalificacionEstudiante" ADD COLUMN     "entregaTareaId" INTEGER;

-- CreateTable
CREATE TABLE "EntregaTarea" (
    "id" SERIAL NOT NULL,
    "tareaId" INTEGER NOT NULL,
    "autorEntregaId" INTEGER NOT NULL,
    "estudianteId" INTEGER,
    "grupoCursoId" INTEGER,
    "equipoAfinidadTareaId" INTEGER,
    "contenido" TEXT,
    "estado" "EstadoEntregaTarea" NOT NULL DEFAULT 'BORRADOR',
    "esGrupal" BOOLEAN NOT NULL DEFAULT false,
    "entregadaTarde" BOOLEAN NOT NULL DEFAULT false,
    "minutosRetraso" INTEGER NOT NULL DEFAULT 0,
    "descuentoCalculado" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "enviadaEn" TIMESTAMP(3),
    "editadaEn" TIMESTAMP(3),
    "bloqueadaEn" TIMESTAMP(3),
    "anuladaEn" TIMESTAMP(3),
    "estaActiva" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "hitoAcademicoId" INTEGER,

    CONSTRAINT "EntregaTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipoAfinidadTarea" (
    "id" SERIAL NOT NULL,
    "tareaId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "creadorId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "EstadoEquipoAfinidadTarea" NOT NULL DEFAULT 'ACTIVO',
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "bloqueadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "hitoAcademicoId" INTEGER,

    CONSTRAINT "EquipoAfinidadTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegranteEquipoTarea" (
    "id" SERIAL NOT NULL,
    "equipoId" INTEGER NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "esRepresentante" BOOLEAN NOT NULL DEFAULT false,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "agregadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiradoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegranteEquipoTarea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntregaTarea_tareaId_idx" ON "EntregaTarea"("tareaId");

-- CreateIndex
CREATE INDEX "EntregaTarea_autorEntregaId_idx" ON "EntregaTarea"("autorEntregaId");

-- CreateIndex
CREATE INDEX "EntregaTarea_estudianteId_idx" ON "EntregaTarea"("estudianteId");

-- CreateIndex
CREATE INDEX "EntregaTarea_grupoCursoId_idx" ON "EntregaTarea"("grupoCursoId");

-- CreateIndex
CREATE INDEX "EntregaTarea_equipoAfinidadTareaId_idx" ON "EntregaTarea"("equipoAfinidadTareaId");

-- CreateIndex
CREATE INDEX "EntregaTarea_estado_idx" ON "EntregaTarea"("estado");

-- CreateIndex
CREATE INDEX "EntregaTarea_entregadaTarde_idx" ON "EntregaTarea"("entregadaTarde");

-- CreateIndex
CREATE INDEX "EntregaTarea_estaActiva_idx" ON "EntregaTarea"("estaActiva");

-- CreateIndex
CREATE INDEX "EntregaTarea_enviadaEn_idx" ON "EntregaTarea"("enviadaEn");

-- CreateIndex
CREATE INDEX "EntregaTarea_tareaId_estado_estaActiva_idx" ON "EntregaTarea"("tareaId", "estado", "estaActiva");

-- CreateIndex
CREATE UNIQUE INDEX "EntregaTarea_tareaId_estudianteId_key" ON "EntregaTarea"("tareaId", "estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "EntregaTarea_tareaId_grupoCursoId_key" ON "EntregaTarea"("tareaId", "grupoCursoId");

-- CreateIndex
CREATE UNIQUE INDEX "EntregaTarea_tareaId_equipoAfinidadTareaId_key" ON "EntregaTarea"("tareaId", "equipoAfinidadTareaId");

-- CreateIndex
CREATE INDEX "EquipoAfinidadTarea_tareaId_idx" ON "EquipoAfinidadTarea"("tareaId");

-- CreateIndex
CREATE INDEX "EquipoAfinidadTarea_cursoId_idx" ON "EquipoAfinidadTarea"("cursoId");

-- CreateIndex
CREATE INDEX "EquipoAfinidadTarea_creadorId_idx" ON "EquipoAfinidadTarea"("creadorId");

-- CreateIndex
CREATE INDEX "EquipoAfinidadTarea_estado_idx" ON "EquipoAfinidadTarea"("estado");

-- CreateIndex
CREATE INDEX "EquipoAfinidadTarea_estaActivo_idx" ON "EquipoAfinidadTarea"("estaActivo");

-- CreateIndex
CREATE INDEX "EquipoAfinidadTarea_tareaId_estado_estaActivo_idx" ON "EquipoAfinidadTarea"("tareaId", "estado", "estaActivo");

-- CreateIndex
CREATE UNIQUE INDEX "EquipoAfinidadTarea_tareaId_nombre_key" ON "EquipoAfinidadTarea"("tareaId", "nombre");

-- CreateIndex
CREATE INDEX "IntegranteEquipoTarea_equipoId_idx" ON "IntegranteEquipoTarea"("equipoId");

-- CreateIndex
CREATE INDEX "IntegranteEquipoTarea_estudianteId_idx" ON "IntegranteEquipoTarea"("estudianteId");

-- CreateIndex
CREATE INDEX "IntegranteEquipoTarea_esRepresentante_idx" ON "IntegranteEquipoTarea"("esRepresentante");

-- CreateIndex
CREATE INDEX "IntegranteEquipoTarea_estaActivo_idx" ON "IntegranteEquipoTarea"("estaActivo");

-- CreateIndex
CREATE INDEX "IntegranteEquipoTarea_equipoId_estaActivo_idx" ON "IntegranteEquipoTarea"("equipoId", "estaActivo");

-- CreateIndex
CREATE UNIQUE INDEX "IntegranteEquipoTarea_equipoId_estudianteId_key" ON "IntegranteEquipoTarea"("equipoId", "estudianteId");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_entregaTareaId_idx" ON "ArchivoAdjunto"("entregaTareaId");

-- AddForeignKey
ALTER TABLE "CalificacionEstudiante" ADD CONSTRAINT "CalificacionEstudiante_entregaTareaId_fkey" FOREIGN KEY ("entregaTareaId") REFERENCES "EntregaTarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaTarea" ADD CONSTRAINT "EntregaTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "TareaCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaTarea" ADD CONSTRAINT "EntregaTarea_autorEntregaId_fkey" FOREIGN KEY ("autorEntregaId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaTarea" ADD CONSTRAINT "EntregaTarea_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaTarea" ADD CONSTRAINT "EntregaTarea_grupoCursoId_fkey" FOREIGN KEY ("grupoCursoId") REFERENCES "GrupoCurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaTarea" ADD CONSTRAINT "EntregaTarea_equipoAfinidadTareaId_fkey" FOREIGN KEY ("equipoAfinidadTareaId") REFERENCES "EquipoAfinidadTarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaTarea" ADD CONSTRAINT "EntregaTarea_hitoAcademicoId_fkey" FOREIGN KEY ("hitoAcademicoId") REFERENCES "HitoAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoAfinidadTarea" ADD CONSTRAINT "EquipoAfinidadTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "TareaCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoAfinidadTarea" ADD CONSTRAINT "EquipoAfinidadTarea_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoAfinidadTarea" ADD CONSTRAINT "EquipoAfinidadTarea_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoAfinidadTarea" ADD CONSTRAINT "EquipoAfinidadTarea_hitoAcademicoId_fkey" FOREIGN KEY ("hitoAcademicoId") REFERENCES "HitoAcademico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegranteEquipoTarea" ADD CONSTRAINT "IntegranteEquipoTarea_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "EquipoAfinidadTarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegranteEquipoTarea" ADD CONSTRAINT "IntegranteEquipoTarea_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoAdjunto" ADD CONSTRAINT "ArchivoAdjunto_entregaTareaId_fkey" FOREIGN KEY ("entregaTareaId") REFERENCES "EntregaTarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
