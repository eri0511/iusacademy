-- CreateEnum
CREATE TYPE "OrigenRubrica" AS ENUM ('MANUAL', 'EXCEL');

-- CreateTable
CREATE TABLE "RubricaTarea" (
    "id" SERIAL NOT NULL,
    "tareaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "origen" "OrigenRubrica" NOT NULL DEFAULT 'MANUAL',
    "ponderacionMax" DECIMAL(6,2) NOT NULL DEFAULT 100,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RubricaTarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricaCriterio" (
    "id" SERIAL NOT NULL,
    "rubricaId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "peso" DECIMAL(6,2) NOT NULL DEFAULT 0,

    CONSTRAINT "RubricaCriterio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricaNivel" (
    "id" SERIAL NOT NULL,
    "criterioId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "puntos" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "descripcion" TEXT,

    CONSTRAINT "RubricaNivel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalificacionRubrica" (
    "id" SERIAL NOT NULL,
    "entregaId" INTEGER NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalificacionRubrica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterioCalificacionEntrega" (
    "id" SERIAL NOT NULL,
    "calificacionId" INTEGER NOT NULL,
    "criterioId" INTEGER NOT NULL,
    "nivelId" INTEGER,
    "puntosAsignados" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "retroalimentacion" TEXT,

    CONSTRAINT "CriterioCalificacionEntrega_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RubricaTarea_tareaId_key" ON "RubricaTarea"("tareaId");

-- CreateIndex
CREATE INDEX "RubricaTarea_tareaId_idx" ON "RubricaTarea"("tareaId");

-- CreateIndex
CREATE INDEX "RubricaCriterio_rubricaId_idx" ON "RubricaCriterio"("rubricaId");

-- CreateIndex
CREATE UNIQUE INDEX "RubricaCriterio_rubricaId_orden_key" ON "RubricaCriterio"("rubricaId", "orden");

-- CreateIndex
CREATE INDEX "RubricaNivel_criterioId_idx" ON "RubricaNivel"("criterioId");

-- CreateIndex
CREATE UNIQUE INDEX "RubricaNivel_criterioId_orden_key" ON "RubricaNivel"("criterioId", "orden");

-- CreateIndex
CREATE INDEX "CalificacionRubrica_entregaId_idx" ON "CalificacionRubrica"("entregaId");

-- CreateIndex
CREATE UNIQUE INDEX "CalificacionRubrica_entregaId_key" ON "CalificacionRubrica"("entregaId");

-- CreateIndex
CREATE INDEX "CriterioCalificacionEntrega_criterioId_idx" ON "CriterioCalificacionEntrega"("criterioId");

-- CreateIndex
CREATE UNIQUE INDEX "CriterioCalificacionEntrega_calificacionId_criterioId_key" ON "CriterioCalificacionEntrega"("calificacionId", "criterioId");

-- AddForeignKey
ALTER TABLE "RubricaTarea" ADD CONSTRAINT "RubricaTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "TareaCurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricaCriterio" ADD CONSTRAINT "RubricaCriterio_rubricaId_fkey" FOREIGN KEY ("rubricaId") REFERENCES "RubricaTarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricaNivel" ADD CONSTRAINT "RubricaNivel_criterioId_fkey" FOREIGN KEY ("criterioId") REFERENCES "RubricaCriterio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalificacionRubrica" ADD CONSTRAINT "CalificacionRubrica_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "EntregaTarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioCalificacionEntrega" ADD CONSTRAINT "CriterioCalificacionEntrega_calificacionId_fkey" FOREIGN KEY ("calificacionId") REFERENCES "CalificacionRubrica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioCalificacionEntrega" ADD CONSTRAINT "CriterioCalificacionEntrega_criterioId_fkey" FOREIGN KEY ("criterioId") REFERENCES "RubricaCriterio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterioCalificacionEntrega" ADD CONSTRAINT "CriterioCalificacionEntrega_nivelId_fkey" FOREIGN KEY ("nivelId") REFERENCES "RubricaNivel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
