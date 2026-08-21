-- AlterTable
ALTER TABLE "TemaForoCurso" ADD COLUMN     "esCalificable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "objetivo" TEXT,
ADD COLUMN     "permitirEditarComentarios" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permitirEditarRespuestas" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "permitirEliminarComentarios" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "permitirEliminarRespuestas" BOOLEAN NOT NULL DEFAULT false;
