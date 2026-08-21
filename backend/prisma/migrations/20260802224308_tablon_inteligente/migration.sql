-- CreateEnum
CREATE TYPE "TipoPublicacionCurso" AS ENUM ('AVISO_GENERAL', 'LECTURA_OBLIGATORIA', 'EXAMEN', 'PRESENTACION_PROYECTO', 'ENTREGA_PROYECTO', 'MATERIAL_COMPLEMENTARIO', 'JURISPRUDENCIA', 'CLASE_VIRTUAL', 'CAMBIO_HORARIO', 'RECORDATORIO', 'FELICITACION', 'OTRO');

-- CreateEnum
CREATE TYPE "PrioridadPublicacion" AS ENUM ('INFORMATIVA', 'MEDIA', 'ALTA', 'URGENTE');

-- AlterTable
ALTER TABLE "PublicacionCurso" ADD COLUMN     "agregarAlCalendario" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enlace" TEXT,
ADD COLUMN     "fechaEventoFin" TIMESTAMP(3),
ADD COLUMN     "fechaEventoInicio" TIMESTAMP(3),
ADD COLUMN     "lugar" TEXT,
ADD COLUMN     "notificarAlPublicar" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prioridad" "PrioridadPublicacion" NOT NULL DEFAULT 'INFORMATIVA',
ADD COLUMN     "recordarUnDiaAntes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recordarUnaHoraAntes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referencia" TEXT,
ADD COLUMN     "tipo" "TipoPublicacionCurso" NOT NULL DEFAULT 'AVISO_GENERAL';

-- CreateIndex
CREATE INDEX "PublicacionCurso_tipo_idx" ON "PublicacionCurso"("tipo");

-- CreateIndex
CREATE INDEX "PublicacionCurso_prioridad_idx" ON "PublicacionCurso"("prioridad");

-- CreateIndex
CREATE INDEX "PublicacionCurso_fechaEventoInicio_idx" ON "PublicacionCurso"("fechaEventoInicio");

-- CreateIndex
CREATE INDEX "PublicacionCurso_fechaEventoFin_idx" ON "PublicacionCurso"("fechaEventoFin");

-- CreateIndex
CREATE INDEX "PublicacionCurso_cursoId_hitoId_fechaEventoInicio_idx" ON "PublicacionCurso"("cursoId", "hitoId", "fechaEventoInicio");

-- CreateIndex
CREATE INDEX "PublicacionCurso_cursoId_hitoId_prioridad_estaActiva_idx" ON "PublicacionCurso"("cursoId", "hitoId", "prioridad", "estaActiva");

-- CreateIndex
CREATE INDEX "PublicacionCurso_cursoId_hitoId_tipo_estaActiva_idx" ON "PublicacionCurso"("cursoId", "hitoId", "tipo", "estaActiva");
