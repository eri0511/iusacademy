-- CreateEnum
CREATE TYPE "TipoPenalizacionComentarios" AS ENUM ('NINGUNA', 'PUNTOS_FIJOS', 'PORCENTAJE');

-- AlterTable
ALTER TABLE "CalificacionEstudiante" ADD COLUMN     "descuentoComentarios" DECIMAL(6,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TemaForoCurso" ADD COLUMN     "penalizarIncumplimientoComentarios" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipoPenalizacionComentarios" "TipoPenalizacionComentarios" NOT NULL DEFAULT 'NINGUNA',
ADD COLUMN     "valorPenalizacionComentarios" DECIMAL(6,2);
