-- CreateEnum
CREATE TYPE "CategoriaBiblioteca" AS ENUM ('MEMORIAL', 'CONTRATO', 'DEMANDA', 'JURISPRUDENCIA', 'CODIGO', 'LEY', 'SENTENCIA', 'DOCTRINA', 'GUIA', 'CASO_PRACTICO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoRecursoBiblioteca" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "VigenciaBiblioteca" AS ENUM ('NO_APLICA', 'POR_VERIFICAR', 'VIGENTE', 'MODIFICADA', 'DEROGADA');

-- CreateEnum
CREATE TYPE "TipoContenidoBiblioteca" AS ENUM ('ARCHIVO', 'ENLACE');

-- CreateEnum
CREATE TYPE "EstadoReporteBiblioteca" AS ENUM ('PENDIENTE', 'EN_REVISION', 'RESUELTO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "RecursoBiblioteca" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "finalidad" TEXT,
    "categoria" "CategoriaBiblioteca" NOT NULL,
    "tema" TEXT NOT NULL,
    "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "autorInstitucion" TEXT,
    "fuente" TEXT,
    "fechaDocumento" TIMESTAMP(3),
    "numeroNorma" TEXT,
    "tribunal" TEXT,
    "numeroResolucion" TEXT,
    "vigencia" "VigenciaBiblioteca" NOT NULL DEFAULT 'NO_APLICA',
    "vigenciaVerificadaEn" TIMESTAMP(3),
    "observacionVigencia" TEXT,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoRecursoBiblioteca" NOT NULL DEFAULT 'BORRADOR',
    "publicadoEn" TIMESTAMP(3),
    "archivadoEn" TIMESTAMP(3),
    "creadoPorId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecursoBiblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContenidoBiblioteca" (
    "id" SERIAL NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoContenidoBiblioteca" NOT NULL,
    "urlExterna" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContenidoBiblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionContenidoBiblioteca" (
    "esVigente" BOOLEAN NOT NULL DEFAULT true,
    "id" SERIAL NOT NULL,
    "contenidoId" INTEGER NOT NULL,
    "numeroVersion" INTEGER NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "nombreAlmacenado" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "tamanioBytes" INTEGER NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "motivoActualizacion" TEXT,
    "subidoPorId" INTEGER NOT NULL,
    "cantidadDescargas" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionContenidoBiblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermisoGestionBiblioteca" (
    "id" SERIAL NOT NULL,
    "docenteId" INTEGER NOT NULL,
    "otorgadoPorId" INTEGER NOT NULL,
    "revocadoPorId" INTEGER,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "otorgadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocadoEn" TIMESTAMP(3),

    CONSTRAINT "PermisoGestionBiblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoritoBiblioteca" (
    "usuarioId" INTEGER NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoritoBiblioteca_pkey" PRIMARY KEY ("usuarioId","recursoId")
);

-- CreateTable
CREATE TABLE "ColeccionBiblioteca" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColeccionBiblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColeccionRecursoBiblioteca" (
    "coleccionId" INTEGER NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "agregadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ColeccionRecursoBiblioteca_pkey" PRIMARY KEY ("coleccionId","recursoId")
);

-- CreateTable
CREATE TABLE "RelacionRecursoBiblioteca" (
    "origenId" INTEGER NOT NULL,
    "destinoId" INTEGER NOT NULL,

    CONSTRAINT "RelacionRecursoBiblioteca_pkey" PRIMARY KEY ("origenId","destinoId")
);

-- CreateTable
CREATE TABLE "ReporteRecursoBiblioteca" (
    "id" SERIAL NOT NULL,
    "recursoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoReporteBiblioteca" NOT NULL DEFAULT 'PENDIENTE',
    "respuesta" TEXT,
    "atendidoPorId" INTEGER,
    "atendidoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReporteRecursoBiblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialBiblioteca" (
    "id" SERIAL NOT NULL,
    "recursoId" INTEGER,
    "actorId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "datos" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialBiblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecursoBiblioteca_estado_categoria_idx" ON "RecursoBiblioteca"("estado", "categoria");

-- CreateIndex
CREATE INDEX "RecursoBiblioteca_estado_tema_idx" ON "RecursoBiblioteca"("estado", "tema");

-- CreateIndex
CREATE INDEX "RecursoBiblioteca_estado_destacado_actualizadoEn_idx" ON "RecursoBiblioteca"("estado", "destacado", "actualizadoEn");

-- CreateIndex
CREATE INDEX "RecursoBiblioteca_creadoPorId_idx" ON "RecursoBiblioteca"("creadoPorId");

-- CreateIndex
CREATE INDEX "ContenidoBiblioteca_recursoId_estaActivo_orden_idx" ON "ContenidoBiblioteca"("recursoId", "estaActivo", "orden");

-- CreateIndex
CREATE INDEX "VersionContenidoBiblioteca_hashSha256_idx" ON "VersionContenidoBiblioteca"("hashSha256");

-- CreateIndex
CREATE INDEX "VersionContenidoBiblioteca_subidoPorId_idx" ON "VersionContenidoBiblioteca"("subidoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "VersionContenidoBiblioteca_contenidoId_numeroVersion_key" ON "VersionContenidoBiblioteca"("contenidoId", "numeroVersion");

-- CreateIndex
CREATE UNIQUE INDEX "PermisoGestionBiblioteca_docenteId_key" ON "PermisoGestionBiblioteca"("docenteId");

-- CreateIndex
CREATE INDEX "PermisoGestionBiblioteca_estaActivo_idx" ON "PermisoGestionBiblioteca"("estaActivo");

-- CreateIndex
CREATE INDEX "FavoritoBiblioteca_recursoId_idx" ON "FavoritoBiblioteca"("recursoId");

-- CreateIndex
CREATE UNIQUE INDEX "ColeccionBiblioteca_usuarioId_nombre_key" ON "ColeccionBiblioteca"("usuarioId", "nombre");

-- CreateIndex
CREATE INDEX "ColeccionRecursoBiblioteca_recursoId_idx" ON "ColeccionRecursoBiblioteca"("recursoId");

-- CreateIndex
CREATE INDEX "RelacionRecursoBiblioteca_destinoId_idx" ON "RelacionRecursoBiblioteca"("destinoId");

-- CreateIndex
CREATE INDEX "ReporteRecursoBiblioteca_estado_creadoEn_idx" ON "ReporteRecursoBiblioteca"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "ReporteRecursoBiblioteca_recursoId_idx" ON "ReporteRecursoBiblioteca"("recursoId");

-- CreateIndex
CREATE INDEX "HistorialBiblioteca_recursoId_creadoEn_idx" ON "HistorialBiblioteca"("recursoId", "creadoEn");

-- CreateIndex
CREATE INDEX "HistorialBiblioteca_actorId_idx" ON "HistorialBiblioteca"("actorId");

-- AddForeignKey
ALTER TABLE "RecursoBiblioteca" ADD CONSTRAINT "RecursoBiblioteca_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContenidoBiblioteca" ADD CONSTRAINT "ContenidoBiblioteca_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoBiblioteca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionContenidoBiblioteca" ADD CONSTRAINT "VersionContenidoBiblioteca_contenidoId_fkey" FOREIGN KEY ("contenidoId") REFERENCES "ContenidoBiblioteca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionContenidoBiblioteca" ADD CONSTRAINT "VersionContenidoBiblioteca_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoGestionBiblioteca" ADD CONSTRAINT "PermisoGestionBiblioteca_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoGestionBiblioteca" ADD CONSTRAINT "PermisoGestionBiblioteca_otorgadoPorId_fkey" FOREIGN KEY ("otorgadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoGestionBiblioteca" ADD CONSTRAINT "PermisoGestionBiblioteca_revocadoPorId_fkey" FOREIGN KEY ("revocadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoritoBiblioteca" ADD CONSTRAINT "FavoritoBiblioteca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoritoBiblioteca" ADD CONSTRAINT "FavoritoBiblioteca_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoBiblioteca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColeccionBiblioteca" ADD CONSTRAINT "ColeccionBiblioteca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColeccionRecursoBiblioteca" ADD CONSTRAINT "ColeccionRecursoBiblioteca_coleccionId_fkey" FOREIGN KEY ("coleccionId") REFERENCES "ColeccionBiblioteca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColeccionRecursoBiblioteca" ADD CONSTRAINT "ColeccionRecursoBiblioteca_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoBiblioteca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelacionRecursoBiblioteca" ADD CONSTRAINT "RelacionRecursoBiblioteca_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "RecursoBiblioteca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelacionRecursoBiblioteca" ADD CONSTRAINT "RelacionRecursoBiblioteca_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "RecursoBiblioteca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteRecursoBiblioteca" ADD CONSTRAINT "ReporteRecursoBiblioteca_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoBiblioteca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteRecursoBiblioteca" ADD CONSTRAINT "ReporteRecursoBiblioteca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteRecursoBiblioteca" ADD CONSTRAINT "ReporteRecursoBiblioteca_atendidoPorId_fkey" FOREIGN KEY ("atendidoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialBiblioteca" ADD CONSTRAINT "HistorialBiblioteca_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "RecursoBiblioteca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialBiblioteca" ADD CONSTRAINT "HistorialBiblioteca_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
