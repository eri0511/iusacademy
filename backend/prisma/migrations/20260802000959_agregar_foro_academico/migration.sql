-- CreateTable
CREATE TABLE "TemaForoCurso" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "estaFijado" BOOLEAN NOT NULL DEFAULT false,
    "estaCerrado" BOOLEAN NOT NULL DEFAULT false,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "publicadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEn" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemaForoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaForoCurso" (
    "id" SERIAL NOT NULL,
    "temaId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "estaActiva" BOOLEAN NOT NULL DEFAULT true,
    "publicadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEn" TIMESTAMP(3),
    "eliminadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RespuestaForoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemaForoCurso_cursoId_idx" ON "TemaForoCurso"("cursoId");

-- CreateIndex
CREATE INDEX "TemaForoCurso_autorId_idx" ON "TemaForoCurso"("autorId");

-- CreateIndex
CREATE INDEX "TemaForoCurso_estaFijado_idx" ON "TemaForoCurso"("estaFijado");

-- CreateIndex
CREATE INDEX "TemaForoCurso_estaCerrado_idx" ON "TemaForoCurso"("estaCerrado");

-- CreateIndex
CREATE INDEX "TemaForoCurso_estaActivo_idx" ON "TemaForoCurso"("estaActivo");

-- CreateIndex
CREATE INDEX "TemaForoCurso_publicadoEn_idx" ON "TemaForoCurso"("publicadoEn");

-- CreateIndex
CREATE INDEX "TemaForoCurso_cursoId_estaActivo_estaFijado_idx" ON "TemaForoCurso"("cursoId", "estaActivo", "estaFijado");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_temaId_idx" ON "RespuestaForoCurso"("temaId");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_autorId_idx" ON "RespuestaForoCurso"("autorId");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_estaActiva_idx" ON "RespuestaForoCurso"("estaActiva");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_publicadoEn_idx" ON "RespuestaForoCurso"("publicadoEn");

-- CreateIndex
CREATE INDEX "RespuestaForoCurso_temaId_estaActiva_publicadoEn_idx" ON "RespuestaForoCurso"("temaId", "estaActiva", "publicadoEn");

-- AddForeignKey
ALTER TABLE "TemaForoCurso" ADD CONSTRAINT "TemaForoCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemaForoCurso" ADD CONSTRAINT "TemaForoCurso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaForoCurso" ADD CONSTRAINT "RespuestaForoCurso_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "TemaForoCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaForoCurso" ADD CONSTRAINT "RespuestaForoCurso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
