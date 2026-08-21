-- CreateTable
CREATE TABLE "ComentarioPublicacion" (
    "id" SERIAL NOT NULL,
    "publicacionId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "publicadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEn" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComentarioPublicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LecturaPublicacion" (
    "id" SERIAL NOT NULL,
    "publicacionId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "leidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LecturaPublicacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComentarioPublicacion_publicacionId_idx" ON "ComentarioPublicacion"("publicacionId");

-- CreateIndex
CREATE INDEX "ComentarioPublicacion_autorId_idx" ON "ComentarioPublicacion"("autorId");

-- CreateIndex
CREATE INDEX "ComentarioPublicacion_estaActivo_idx" ON "ComentarioPublicacion"("estaActivo");

-- CreateIndex
CREATE INDEX "ComentarioPublicacion_publicadoEn_idx" ON "ComentarioPublicacion"("publicadoEn");

-- CreateIndex
CREATE INDEX "ComentarioPublicacion_publicacionId_estaActivo_publicadoEn_idx" ON "ComentarioPublicacion"("publicacionId", "estaActivo", "publicadoEn");

-- CreateIndex
CREATE INDEX "LecturaPublicacion_publicacionId_idx" ON "LecturaPublicacion"("publicacionId");

-- CreateIndex
CREATE INDEX "LecturaPublicacion_usuarioId_idx" ON "LecturaPublicacion"("usuarioId");

-- CreateIndex
CREATE INDEX "LecturaPublicacion_leidoEn_idx" ON "LecturaPublicacion"("leidoEn");

-- CreateIndex
CREATE UNIQUE INDEX "LecturaPublicacion_publicacionId_usuarioId_key" ON "LecturaPublicacion"("publicacionId", "usuarioId");

-- AddForeignKey
ALTER TABLE "ComentarioPublicacion" ADD CONSTRAINT "ComentarioPublicacion_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "PublicacionCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioPublicacion" ADD CONSTRAINT "ComentarioPublicacion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaPublicacion" ADD CONSTRAINT "LecturaPublicacion_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "PublicacionCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaPublicacion" ADD CONSTRAINT "LecturaPublicacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
