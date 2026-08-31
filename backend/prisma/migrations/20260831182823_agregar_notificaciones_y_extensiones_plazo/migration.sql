-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('NUEVA_TAREA', 'TAREA_POR_VENCER', 'TAREA_VENCIDA', 'NUEVO_TABLON', 'NOTA_PUBLICADA', 'EXTENSION_PLAZO', 'FORO_POR_VENCER', 'FORO_NUEVO_TEMA');

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "destinatarioId" INTEGER NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT,
    "enlace" TEXT,
    "esLeida" BOOLEAN NOT NULL DEFAULT false,
    "leidaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionPlazoTarea" (
    "id" SERIAL NOT NULL,
    "tareaId" INTEGER NOT NULL,
    "autorizadoPorId" INTEGER NOT NULL,
    "fechaAperturaExtendida" TIMESTAMP(3),
    "fechaLimiteExtendida" TIMESTAMP(3),
    "fechaMaximaRetrasoExtendida" TIMESTAMP(3),
    "motivo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtensionPlazoTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionPlazoBeneficiario" (
    "id" SERIAL NOT NULL,
    "extensionId" INTEGER NOT NULL,
    "estudianteId" INTEGER NOT NULL,

    CONSTRAINT "ExtensionPlazoBeneficiario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacion_destinatarioId_esLeida_creadoEn_idx" ON "Notificacion"("destinatarioId", "esLeida", "creadoEn");

-- CreateIndex
CREATE INDEX "Notificacion_destinatarioId_tipo_idx" ON "Notificacion"("destinatarioId", "tipo");

-- CreateIndex
CREATE INDEX "Notificacion_creadoEn_idx" ON "Notificacion"("creadoEn");

-- CreateIndex
CREATE INDEX "ExtensionPlazoTarea_tareaId_idx" ON "ExtensionPlazoTarea"("tareaId");

-- CreateIndex
CREATE INDEX "ExtensionPlazoTarea_autorizadoPorId_idx" ON "ExtensionPlazoTarea"("autorizadoPorId");

-- CreateIndex
CREATE INDEX "ExtensionPlazoTarea_activo_idx" ON "ExtensionPlazoTarea"("activo");

-- CreateIndex
CREATE INDEX "ExtensionPlazoBeneficiario_estudianteId_idx" ON "ExtensionPlazoBeneficiario"("estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionPlazoBeneficiario_extensionId_estudianteId_key" ON "ExtensionPlazoBeneficiario"("extensionId", "estudianteId");

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionPlazoTarea" ADD CONSTRAINT "ExtensionPlazoTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "TareaCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionPlazoTarea" ADD CONSTRAINT "ExtensionPlazoTarea_autorizadoPorId_fkey" FOREIGN KEY ("autorizadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionPlazoBeneficiario" ADD CONSTRAINT "ExtensionPlazoBeneficiario_extensionId_fkey" FOREIGN KEY ("extensionId") REFERENCES "ExtensionPlazoTarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionPlazoBeneficiario" ADD CONSTRAINT "ExtensionPlazoBeneficiario_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
