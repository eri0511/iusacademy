-- CreateTable
CREATE TABLE "PublicacionCurso" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "estaFijada" BOOLEAN NOT NULL DEFAULT false,
    "estaActiva" BOOLEAN NOT NULL DEFAULT true,
    "comentariosHabilitados" BOOLEAN NOT NULL DEFAULT false,
    "publicadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEn" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicacionCurso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicacionCurso_cursoId_idx" ON "PublicacionCurso"("cursoId");

-- CreateIndex
CREATE INDEX "PublicacionCurso_autorId_idx" ON "PublicacionCurso"("autorId");

-- CreateIndex
CREATE INDEX "PublicacionCurso_estaFijada_idx" ON "PublicacionCurso"("estaFijada");

-- CreateIndex
CREATE INDEX "PublicacionCurso_estaActiva_idx" ON "PublicacionCurso"("estaActiva");

-- CreateIndex
CREATE INDEX "PublicacionCurso_publicadoEn_idx" ON "PublicacionCurso"("publicadoEn");

-- CreateIndex
CREATE INDEX "PublicacionCurso_cursoId_estaActiva_estaFijada_idx" ON "PublicacionCurso"("cursoId", "estaActiva", "estaFijada");

-- AddForeignKey
ALTER TABLE "PublicacionCurso" ADD CONSTRAINT "PublicacionCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicacionCurso" ADD CONSTRAINT "PublicacionCurso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
