-- CreateTable
CREATE TABLE "SesionEdicionTarea" (
    "id" SERIAL NOT NULL,
    "entregaTareaId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "iniciadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoLatidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "segundosActivos" INTEGER NOT NULL DEFAULT 0,
    "cantidadPegados" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SesionEdicionTarea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SesionEdicionTarea_entregaTareaId_idx" ON "SesionEdicionTarea"("entregaTareaId");

-- CreateIndex
CREATE INDEX "SesionEdicionTarea_autorId_idx" ON "SesionEdicionTarea"("autorId");

-- CreateIndex
CREATE INDEX "SesionEdicionTarea_iniciadaEn_idx" ON "SesionEdicionTarea"("iniciadaEn");

-- AddForeignKey
ALTER TABLE "SesionEdicionTarea" ADD CONSTRAINT "SesionEdicionTarea_entregaTareaId_fkey" FOREIGN KEY ("entregaTareaId") REFERENCES "EntregaTarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionEdicionTarea" ADD CONSTRAINT "SesionEdicionTarea_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
