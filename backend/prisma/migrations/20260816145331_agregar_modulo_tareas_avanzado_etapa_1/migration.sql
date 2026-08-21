/*
  Warnings:

  - A unique constraint covering the columns `[tareaId]` on the table `ActividadCalificable` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('BORRADOR', 'PROGRAMADA', 'DISPONIBLE', 'CERRADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "TipoTarea" AS ENUM ('ENTREGA_ARCHIVOS', 'RESPUESTA_ESCRITA', 'DOCUMENTO_COLABORATIVO', 'REDACCION_JURIDICA', 'EXPOSICION', 'CASO_PRACTICO', 'MIXTA', 'PRESENCIAL');

-- CreateEnum
CREATE TYPE "CapacidadTarea" AS ENUM ('ARCHIVOS', 'EDITOR_TEXTO', 'EDICION_COLABORATIVA', 'SEGUIMIENTO_AUTORIA', 'HISTORIAL_VERSIONES', 'EXPORTACION_PDF', 'EXPOSICION', 'CASO_ESTRUCTURADO', 'REDACCION_JURIDICA', 'EVIDENCIA_DOCENTE');

-- CreateEnum
CREATE TYPE "ModoEdicionTarea" AS ENUM ('SIN_EDITOR', 'INDIVIDUAL', 'COLABORATIVO');

-- CreateEnum
CREATE TYPE "TipoComponenteTarea" AS ENUM ('ARCHIVOS', 'TEXTO', 'DOCUMENTO_COLABORATIVO', 'REDACCION_JURIDICA', 'EXPOSICION', 'CASO_PRACTICO', 'PRESENCIAL');

-- CreateEnum
CREATE TYPE "ModalidadTarea" AS ENUM ('INDIVIDUAL', 'GRUPAL');

-- CreateEnum
CREATE TYPE "OrigenGrupoTarea" AS ENUM ('NINGUNO', 'PLATAFORMA', 'AFINIDAD');

-- CreateEnum
CREATE TYPE "ModalidadNotaTarea" AS ENUM ('INDIVIDUAL', 'GRUPAL', 'GRUPAL_E_INDIVIDUAL');

-- AlterTable
ALTER TABLE "ActividadCalificable" ADD COLUMN     "tareaId" INTEGER;

-- AlterTable
ALTER TABLE "ArchivoAdjunto" ADD COLUMN     "tareaId" INTEGER;

-- CreateTable
CREATE TABLE "TareaCurso" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "hitoId" INTEGER NOT NULL,
    "conjuntoGrupoId" INTEGER,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "instrucciones" TEXT,
    "tipo" "TipoTarea" NOT NULL DEFAULT 'ENTREGA_ARCHIVOS',
    "capacidades" "CapacidadTarea"[] DEFAULT ARRAY['ARCHIVOS']::"CapacidadTarea"[],
    "modoEdicion" "ModoEdicionTarea" NOT NULL DEFAULT 'SIN_EDITOR',
    "configuracionTipo" JSONB,
    "esCalificable" BOOLEAN NOT NULL DEFAULT true,
    "componente" "ComponenteEvaluacion",
    "puntajeMaximo" DECIMAL(6,2) NOT NULL DEFAULT 100,
    "modalidad" "ModalidadTarea" NOT NULL DEFAULT 'INDIVIDUAL',
    "origenGrupo" "OrigenGrupoTarea" NOT NULL DEFAULT 'NINGUNO',
    "modalidadNota" "ModalidadNotaTarea" NOT NULL DEFAULT 'INDIVIDUAL',
    "porcentajeNotaGrupal" DECIMAL(5,2),
    "porcentajeNotaIndividual" DECIMAL(5,2),
    "requiereRepresentante" BOOLEAN NOT NULL DEFAULT false,
    "fechaApertura" TIMESTAMP(3) NOT NULL,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "fechaCierre" TIMESTAMP(3) NOT NULL,
    "visibleAntesDeApertura" BOOLEAN NOT NULL DEFAULT true,
    "permitirRetrasos" BOOLEAN NOT NULL DEFAULT false,
    "fechaMaximaRetraso" TIMESTAMP(3),
    "tipoDescuentoRetraso" "TipoDescuentoRetraso" NOT NULL DEFAULT 'NINGUNO',
    "valorDescuentoRetraso" DECIMAL(6,2),
    "exigirContenidoEditor" BOOLEAN NOT NULL DEFAULT false,
    "exigirArchivo" BOOLEAN NOT NULL DEFAULT false,
    "maximoArchivos" INTEGER NOT NULL DEFAULT 3,
    "tamanioMaximoArchivoMb" INTEGER NOT NULL DEFAULT 10,
    "extensionesPermitidas" TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp']::TEXT[],
    "permitirEditarEntrega" BOOLEAN NOT NULL DEFAULT true,
    "estado" "EstadoTarea" NOT NULL DEFAULT 'BORRADOR',
    "estaCerrada" BOOLEAN NOT NULL DEFAULT false,
    "estaActiva" BOOLEAN NOT NULL DEFAULT true,
    "publicadoEn" TIMESTAMP(3),
    "cerradoEn" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TareaCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponenteTarea" (
    "id" SERIAL NOT NULL,
    "tareaId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" "TipoComponenteTarea" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "configuracion" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponenteTarea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TareaCurso_cursoId_idx" ON "TareaCurso"("cursoId");

-- CreateIndex
CREATE INDEX "TareaCurso_autorId_idx" ON "TareaCurso"("autorId");

-- CreateIndex
CREATE INDEX "TareaCurso_hitoId_idx" ON "TareaCurso"("hitoId");

-- CreateIndex
CREATE INDEX "TareaCurso_conjuntoGrupoId_idx" ON "TareaCurso"("conjuntoGrupoId");

-- CreateIndex
CREATE INDEX "TareaCurso_estado_idx" ON "TareaCurso"("estado");

-- CreateIndex
CREATE INDEX "TareaCurso_tipo_idx" ON "TareaCurso"("tipo");

-- CreateIndex
CREATE INDEX "TareaCurso_modoEdicion_idx" ON "TareaCurso"("modoEdicion");

-- CreateIndex
CREATE INDEX "TareaCurso_modalidad_idx" ON "TareaCurso"("modalidad");

-- CreateIndex
CREATE INDEX "TareaCurso_origenGrupo_idx" ON "TareaCurso"("origenGrupo");

-- CreateIndex
CREATE INDEX "TareaCurso_esCalificable_idx" ON "TareaCurso"("esCalificable");

-- CreateIndex
CREATE INDEX "TareaCurso_fechaApertura_idx" ON "TareaCurso"("fechaApertura");

-- CreateIndex
CREATE INDEX "TareaCurso_fechaLimite_idx" ON "TareaCurso"("fechaLimite");

-- CreateIndex
CREATE INDEX "TareaCurso_fechaCierre_idx" ON "TareaCurso"("fechaCierre");

-- CreateIndex
CREATE INDEX "TareaCurso_estaActiva_idx" ON "TareaCurso"("estaActiva");

-- CreateIndex
CREATE INDEX "TareaCurso_cursoId_hitoId_estado_estaActiva_idx" ON "TareaCurso"("cursoId", "hitoId", "estado", "estaActiva");

-- CreateIndex
CREATE INDEX "ComponenteTarea_tareaId_idx" ON "ComponenteTarea"("tareaId");

-- CreateIndex
CREATE INDEX "ComponenteTarea_tipo_idx" ON "ComponenteTarea"("tipo");

-- CreateIndex
CREATE INDEX "ComponenteTarea_obligatorio_idx" ON "ComponenteTarea"("obligatorio");

-- CreateIndex
CREATE UNIQUE INDEX "ComponenteTarea_tareaId_orden_key" ON "ComponenteTarea"("tareaId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "ActividadCalificable_tareaId_key" ON "ActividadCalificable"("tareaId");

-- CreateIndex
CREATE INDEX "ActividadCalificable_tareaId_idx" ON "ActividadCalificable"("tareaId");

-- CreateIndex
CREATE INDEX "ArchivoAdjunto_tareaId_idx" ON "ArchivoAdjunto"("tareaId");

-- AddForeignKey
ALTER TABLE "ActividadCalificable" ADD CONSTRAINT "ActividadCalificable_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "TareaCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaCurso" ADD CONSTRAINT "TareaCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaCurso" ADD CONSTRAINT "TareaCurso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaCurso" ADD CONSTRAINT "TareaCurso_hitoId_fkey" FOREIGN KEY ("hitoId") REFERENCES "HitoAcademico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaCurso" ADD CONSTRAINT "TareaCurso_conjuntoGrupoId_fkey" FOREIGN KEY ("conjuntoGrupoId") REFERENCES "ConjuntoGrupoCurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteTarea" ADD CONSTRAINT "ComponenteTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "TareaCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoAdjunto" ADD CONSTRAINT "ArchivoAdjunto_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "TareaCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
